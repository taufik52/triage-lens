/**
 * heuristics.js — local, dependency-free triage heuristics.
 *
 * Everything here runs inside the Forge function on the Atlassian side:
 * no issue text ever leaves the Atlassian site. The optional LLM slot
 * (llm.js) is a separate module and is OFF unless an API key is set via
 * `forge variables` — see llm.js and DEPLOY.md.
 *
 * Pure functions, no Forge dependencies — unit tested in test/.
 */

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'of', 'to', 'in', 'on', 'for',
  'with', 'when', 'after', 'before', 'is', 'are', 'was', 'were', 'be',
  'been', 'it', 'its', 'this', 'that', 'these', 'those', 'we', 'you',
  'they', 'he', 'she', 'i', 'at', 'by', 'from', 'as', 'not', 'no',
  'if', 'then', 'than', 'so', 'do', 'does', 'did', 'have', 'has', 'had',
  'can', 'could', 'should', 'would', 'will', 'there', 'here', 'what',
  'which', 'who', 'whom', 'how', 'why', 'about', 'into', 'over', 'under',
  'again', 'once', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
  'other', 'some', 'such', 'only', 'own', 'same', 'too', 'very', 'just',
]);

/** Lowercase word tokens, stopwords and very short tokens removed. */
function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function tokenSet(text) {
  return new Set(tokenize(text));
}

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) if (setB.has(item)) intersection++;
  return intersection / (setA.size + setB.size - intersection);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

const KEY_SENTENCE_PATTERNS = [
  /expected/i, /actual/i, /steps to reproduce/i, /error/i, /fail/i,
  /crash/i, /regression/i, /impact/i, /blocked/i, /workaround/i,
];

/**
 * Extractive summary: pick the most informative sentences (up to
 * maxSentences), kept in their original order.
 */
function summarize(text, maxSentences = 3) {
  const sentences = (text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (sentences.length <= maxSentences) return sentences.join(' ');

  const scored = sentences.map((sentence, index) => {
    let score = 0;
    if (index === 0) score += 2; // opening sentence usually states the problem
    for (const pattern of KEY_SENTENCE_PATTERNS) {
      if (pattern.test(sentence)) score += 3;
    }
    if (sentence.length > 140) score -= 1; // prefer concise sentences
    return { sentence, score, index };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence)
    .join(' ');
}

// ---------------------------------------------------------------------------
// Priority suggestion
// ---------------------------------------------------------------------------

// [regex, weight, human-readable reason]
const PRIORITY_SIGNALS = [
  [/data loss|data corruption|deleted (all|user) data/i, 50, 'Mentions data loss or corruption'],
  [/security (vulnerability|breach|flaw)|xss|sql injection|csrf|auth bypass|privilege escalation/i, 50, 'Mentions a security vulnerability'],
  [/production (is )?down|outage|service unavailable|all users (affected|cannot)/i, 50, 'Mentions a production outage'],
  [/crash(es|ing)? on (startup|launch|login)|app (won\'t|will not|cannot) (start|open|load)/i, 40, 'App cannot start / crashes on launch'],
  [/payment (fail|error|declined)|checkout (broken|fail)|cannot (pay|check ?out)/i, 40, 'Payment or checkout is broken'],
  [/regression/i, 25, 'Described as a regression'],
  [/block(s|ed|ing) (the )?release|blocks? (development|qa|deploy)/i, 25, 'Blocks release or development'],
  [/crash/i, 20, 'Mentions a crash'],
  [/error 5\d\d|500 error|internal server error/i, 20, 'Mentions a server error'],
  [/workaround/i, -5, 'A workaround exists'],
  [/typo|spelling|grammar|wording|copy (change|fix)/i, -15, 'Cosmetic / copy issue'],
  [/nice to have|low priority|minor|cosmetic|enhancement/i, -10, 'Described as minor'],
];

const ISSUE_TYPE_BASE = { Bug: 15, Incident: 30, Task: 0, Story: 0, Epic: 0 };

function suggestPriority({ issueType, text, labels = [] }) {
  const haystack = text || '';
  let score = ISSUE_TYPE_BASE[issueType] || 0;
  const reasons = [];

  for (const [pattern, weight, reason] of PRIORITY_SIGNALS) {
    if (pattern.test(haystack)) {
      score += weight;
      reasons.push(reason + (weight > 0 ? ` (+${weight})` : ` (${weight})`));
    }
  }
  if ((labels || []).some((l) => /urgent|critical|p0|sev-?1/i.test(l))) {
    score += 30;
    reasons.push('Labelled urgent / critical (+30)');
  }
  if ((labels || []).some((l) => /low-priority|p3|nice-to-have/i.test(l))) {
    score -= 10;
    reasons.push('Labelled low priority (-10)');
  }

  let priority;
  if (score >= 50) priority = 'Highest';
  else if (score >= 25) priority = 'High';
  else if (score >= 10) priority = 'Medium';
  else if (score >= -5) priority = 'Low';
  else priority = 'Lowest';

  if (reasons.length === 0) reasons.push('No strong urgency signals; based on issue type.');
  return { priority, score, reasons };
}

// ---------------------------------------------------------------------------
// Duplicate detection
// ---------------------------------------------------------------------------

/**
 * Rank candidate issues by Jaccard similarity of their token sets
 * (summary + description). Returns matches above `threshold`, best first.
 */
function findDuplicates(current, candidates, { threshold = 0.2, limit = 5 } = {}) {
  const currentTokens = tokenSet(`${current.summary || ''}\n${current.text || ''}`);
  if (currentTokens.size === 0) return [];

  return (candidates || [])
    .map((candidate) => {
      const candidateTokens = tokenSet(
        `${candidate.summary || ''}\n${candidate.text || ''}`,
      );
      return {
        key: candidate.key,
        summary: candidate.summary || '',
        similarity: jaccardSimilarity(currentTokens, candidateTokens),
      };
    })
    .filter((match) => match.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Label suggestions
// ---------------------------------------------------------------------------

const LABEL_SIGNALS = [
  [/security|vulnerability|xss|csrf|injection|auth/i, 'security'],
  [/performance|slow|latency|timeout|memory leak|lag/i, 'performance'],
  [/ui|layout|css|button|modal|dropdown|responsive/i, 'frontend'],
  [/api|endpoint|webhook|rest|graphql/i, 'backend'],
  [/database|query|migration|postgres|mysql/i, 'database'],
  [/mobile|ios|android|app store/i, 'mobile'],
  [/documentation|docs|readme|guide/i, 'docs'],
  [/accessibility|a11y|screen reader|keyboard/i, 'accessibility'],
];

function suggestLabels(text, existingLabels = []) {
  const existing = new Set((existingLabels || []).map((l) => l.toLowerCase()));
  const suggested = [];
  for (const [pattern, label] of LABEL_SIGNALS) {
    if (pattern.test(text || '') && !existing.has(label)) suggested.push(label);
  }
  return suggested;
}

module.exports = {
  tokenize,
  jaccardSimilarity,
  summarize,
  suggestPriority,
  findDuplicates,
  suggestLabels,
};
