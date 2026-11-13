/**
 * llm.js — OPTIONAL LLM enhancement slot.
 *
 * OFF by default. It only runs when the site admin sets the Forge
 * variables LLM_API_KEY (and optionally LLM_API_BASE / LLM_MODEL) via:
 *
 *   forge variables set LLM_API_KEY <key> --environment production
 *
 * No key is ever hard-coded or committed. If no key is configured, or
 * the call fails for any reason, this returns null and the panel falls
 * back to the local heuristics in heuristics.js (fail-open).
 *
 * The endpoint must be OpenAI-compatible (chat/completions). Only the
 * issue summary + description are sent — nothing else.
 */

const DEFAULT_BASE = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';

async function enhanceSummaryWithLLM({ text }) {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey || !text || !text.trim()) return null;

  const base = (process.env.LLM_API_BASE || DEFAULT_BASE).replace(/\/$/, '');
  const model = process.env.LLM_MODEL || DEFAULT_MODEL;

  try {
    const response = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are a Jira triage assistant. Summarise the issue below in 2-3 plain sentences for a developer picking it up. No preamble, no markdown headings.',
          },
          { role: 'user', content: text.slice(0, 6000) },
        ],
        temperature: 0.2,
        max_tokens: 200,
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === 'string' && content.trim() ? content.trim() : null;
  } catch {
    return null;
  }
}

module.exports = { enhanceSummaryWithLLM };
