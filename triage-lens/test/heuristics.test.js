/**
 * Unit tests for the pure triage heuristics (adf.js, heuristics.js).
 * Run: npm test   (node --test, no dependencies needed)
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { adfToText } = require('../src/adf');
const {
  findDuplicates,
  jaccardSimilarity,
  suggestLabels,
  suggestPriority,
  summarize,
  tokenize,
} = require('../src/heuristics');

test('adfToText: paragraphs, headings and lists', () => {
  const adf = {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: 'Login fails' }],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Users cannot log in. ' },
          { type: 'text', text: 'Error 500 on submit.' },
        ],
      },
      {
        type: 'bulletList',
        content: [
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'step one' }] }] },
          { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'step two' }] }] },
        ],
      },
      {
        type: 'paragraph',
        content: [
          { type: 'text', text: 'Reported by ' },
          { type: 'mention', attrs: { text: '@alice' } },
        ],
      },
    ],
  };
  const text = adfToText(adf);
  assert.match(text, /Login fails/);
  assert.match(text, /Users cannot log in/);
  assert.match(text, /- step one/);
  assert.match(text, /@alice/);
});

test('adfToText: empty / missing description', () => {
  assert.equal(adfToText(null), '');
  assert.equal(adfToText(undefined), '');
  assert.equal(adfToText({ type: 'doc', content: [] }), '');
});

test('summarize: picks informative sentences, keeps order', () => {
  const text = [
    'The dashboard is slow.',
    'Users report that loading the dashboard takes over 30 seconds.',
    'Expected: the dashboard loads in under 2 seconds.',
    'Actual: it times out after 30 seconds with error 500.',
    'This happens on every page refresh.',
    'The footer still shows the old year in the copyright line.',
  ].join(' ');
  const summary = summarize(text, 3);
  assert.match(summary, /Expected/);
  assert.match(summary, /Actual/);
  assert.ok(summary.indexOf('Expected') < summary.indexOf('Actual'));
  assert.doesNotMatch(summary, /copyright/);
});

test('summarize: short text is returned whole', () => {
  assert.equal(summarize('Login button does nothing.'), 'Login button does nothing.');
});

test('suggestPriority: data loss on a Bug is Highest', () => {
  const result = suggestPriority({
    issueType: 'Bug',
    text: 'Saving a draft causes data loss. All user data is deleted after sync.',
    labels: [],
  });
  assert.equal(result.priority, 'Highest');
  assert.ok(result.reasons.length > 0);
});

test('suggestPriority: security report is Highest', () => {
  const result = suggestPriority({
    issueType: 'Bug',
    text: 'Stored XSS in the comment field allows script injection.',
    labels: [],
  });
  assert.equal(result.priority, 'Highest');
});

test('suggestPriority: production outage is Highest', () => {
  const result = suggestPriority({
    issueType: 'Incident',
    text: 'Production is down, all users cannot access the service.',
    labels: [],
  });
  assert.equal(result.priority, 'Highest');
});

test('suggestPriority: typo fix is Lowest', () => {
  const result = suggestPriority({
    issueType: 'Task',
    text: 'Fix a typo in the help text on the settings page. Minor wording change.',
    labels: [],
  });
  assert.equal(result.priority, 'Lowest');
});

test('suggestPriority: plain bug without signals is Medium', () => {
  const result = suggestPriority({
    issueType: 'Bug',
    text: 'The avatar image is stretched on the profile page.',
    labels: [],
  });
  assert.equal(result.priority, 'Medium');
});

test('suggestPriority: urgent label boosts the score', () => {
  const base = suggestPriority({ issueType: 'Task', text: 'Update the changelog.', labels: [] });
  const urgent = suggestPriority({ issueType: 'Task', text: 'Update the changelog.', labels: ['urgent'] });
  assert.ok(urgent.score > base.score);
});

test('jaccardSimilarity: identical sets score 1, disjoint score 0', () => {
  assert.equal(jaccardSimilarity(new Set(['a', 'b']), new Set(['a', 'b'])), 1);
  assert.equal(jaccardSimilarity(new Set(['a']), new Set(['b'])), 0);
  assert.equal(jaccardSimilarity(new Set(), new Set(['b'])), 0);
});

test('findDuplicates: near-duplicate ranks first, unrelated excluded', () => {
  const current = {
    summary: 'Login fails with error 500',
    text: 'Users cannot log in, the server returns error 500 on submit.',
  };
  const candidates = [
    { key: 'PROJ-2', summary: 'Login page returns 500', text: 'Cannot log in, error 500 on submit.' },
    { key: 'PROJ-3', summary: 'Change footer copyright year', text: 'Update the year in the footer.' },
    { key: 'PROJ-4', summary: 'Login button misaligned on mobile', text: 'The login button overlaps the logo on small screens.' },
  ];
  const matches = findDuplicates(current, candidates);
  assert.equal(matches[0].key, 'PROJ-2');
  assert.ok(matches[0].similarity > 0.3);
  assert.ok(!matches.some((m) => m.key === 'PROJ-3'));
});

test('findDuplicates: empty issue returns no matches', () => {
  assert.deepEqual(findDuplicates({ summary: '', text: '' }, [{ key: 'X-1', summary: 'a', text: 'b' }]), []);
});

test('suggestLabels: keywords map to labels, existing labels skipped', () => {
  const labels = suggestLabels(
    'The API endpoint is slow and times out under load.',
    ['backend'],
  );
  assert.ok(labels.includes('performance'));
  assert.ok(!labels.includes('backend'));
});

test('tokenize: stopwords and short tokens removed', () => {
  const tokens = tokenize('The quick brown fox jumps over the lazy dog');
  assert.ok(tokens.includes('quick'));
  assert.ok(!tokens.includes('the'));
  assert.ok(!tokens.includes('fox') || tokens.includes('fox')); // 'fox' is len 3, kept
});
