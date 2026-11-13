import ForgeReconciler, {
  Box,
  Button,
  Heading,
  Link,
  Lozenge,
  SectionMessage,
  Spinner,
  Stack,
  Text,
} from '@forge/react';
import { invoke } from '@forge/bridge';
import React, { useEffect, useState } from 'react';
import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import { adfToText } from './adf';
import { findDuplicates, suggestLabels, suggestPriority, summarize } from './heuristics';
import { enhanceSummaryWithLLM } from './llm';

// ---------------------------------------------------------------------------
// Backend: resolvers run inside the Forge function (server side of the app).
// ---------------------------------------------------------------------------

const resolver = new Resolver();

resolver.define('getTriage', async ({ context }) => {
  const issueKey = context.extension.issue.key;

  const issueRes = await api.asUser().requestJira(
    route`/rest/api/3/issue/${issueKey}?fields=summary,description,issuetype,priority,labels,project`,
  );
  if (!issueRes.ok) {
    throw new Error(`Could not read issue ${issueKey} (HTTP ${issueRes.status}).`);
  }
  const issue = await issueRes.json();
  const fields = issue.fields || {};
  const summary = fields.summary || '';
  const descriptionText = adfToText(fields.description);
  const fullText = `${summary}\n${descriptionText}`.trim();
  const labels = fields.labels || [];
  const issueType = fields.issuetype ? fields.issuetype.name : 'Task';

  // Duplicate candidates: most recent issues in the same project, excluding
  // this one. Local Jaccard similarity is computed below — no data leaves
  // the Atlassian site for this step.
  let candidates = [];
  try {
    const jql = `project = ${fields.project.key} AND key != ${issueKey} ORDER BY created DESC`;
    const searchRes = await api.asUser().requestJira(
      // NOTE: do NOT encodeURIComponent() the JQL here — the `route` tag
      // already encodeURIComponent()s every interpolated value in query
      // mode (see @forge/api safeUrl.js). Pre-encoding double-encodes
      // it (e.g. %2520) and Jira rejects the JQL, silently emptying the
      // duplicate list (this search is fail-open).
      route`/rest/api/3/search/jql?jql=${jql}&maxResults=50&fields=summary,description`,
    );
    if (searchRes.ok) {
      const search = await searchRes.json();
      candidates = (search.issues || []).map((candidate) => ({
        key: candidate.key,
        summary: candidate.fields.summary || '',
        text: adfToText(candidate.fields.description),
      }));
    }
  } catch {
    // Search failing must not break the whole panel.
    candidates = [];
  }

  const triage = {
    key: issueKey,
    summary,
    type: issueType,
    currentPriority: fields.priority ? fields.priority.name : 'Unset',
    labels,
    shortSummary: summarize(fullText),
    priority: suggestPriority({ issueType, text: fullText, labels }),
    duplicates: findDuplicates({ summary, text: fullText }, candidates),
    suggestedLabels: suggestLabels(fullText, labels),
    llmEnabled: Boolean(process.env.LLM_API_KEY),
    llmSummary: null,
  };

  // Optional LLM pass — runs only when LLM_API_KEY is configured, and the
  // panel works fully without it.
  triage.llmSummary = await enhanceSummaryWithLLM({ text: fullText });
  return triage;
});

resolver.define('applyPriority', async ({ payload, context }) => {
  const issueKey = context.extension.issue.key;
  const res = await api.asUser().requestJira(route`/rest/api/3/issue/${issueKey}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { priority: { name: payload.priority } } }),
  });
  return { ok: res.status === 204, status: res.status };
});

export const run = resolver.getDefinitions();

// ---------------------------------------------------------------------------
// Frontend: UI Kit 2 panel rendered inside the Jira issue view.
// ---------------------------------------------------------------------------

const PRIORITY_TONE = {
  Highest: 'red',
  High: 'orange',
  Medium: 'yellow',
  Low: 'blue',
  Lowest: 'gray',
};

const App = () => {
  const [triage, setTriage] = useState(null);
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    invoke('getTriage')
      .then(setTriage)
      .catch((err) => setError(err.message || 'Failed to load triage.'));
  }, []);

  const onApplyPriority = async () => {
    setApplying(true);
    try {
      const result = await invoke('applyPriority', { priority: triage.priority.priority });
      if (result.ok) setApplied(true);
      else setError(`Could not apply priority (HTTP ${result.status}).`);
    } catch (err) {
      setError(err.message || 'Could not apply priority.');
    } finally {
      setApplying(false);
    }
  };

  if (error) {
    return (
      <SectionMessage title="Triage Lens could not load" appearance="error">
        <Text>{error}</Text>
      </SectionMessage>
    );
  }

  if (!triage) {
    return (
      <Box padding="space.200">
        <Spinner size="medium" label="Analysing issue…" />
      </Box>
    );
  }

  return (
    <Stack space="space.200">
      <Heading size="small">Summary</Heading>
      <Text>{triage.llmSummary || triage.shortSummary || 'No description to summarise.'}</Text>
      {triage.llmSummary && (
        <Text size="small" tone="subtle">
          Enhanced by LLM.
        </Text>
      )}

      <Heading size="small">Suggested priority</Heading>
      <Box>
        <Lozenge appearance={PRIORITY_TONE[triage.priority.priority] || 'default'}>
          {triage.priority.priority}
        </Lozenge>
        <Text> Current: {triage.currentPriority}</Text>
      </Box>
      {triage.priority.reasons.map((reason) => (
        <Text key={reason}>• {reason}</Text>
      ))}
      {!applied && triage.priority.priority !== triage.currentPriority && (
        <Button appearance="primary" onClick={onApplyPriority} isDisabled={applying}>
          {applying ? 'Applying…' : `Apply ${triage.priority.priority} priority`}
        </Button>
      )}
      {applied && (
        <SectionMessage title="Priority updated" appearance="success">
          <Text>Priority set to {triage.priority.priority}.</Text>
        </SectionMessage>
      )}

      <Heading size="small">Possible duplicates</Heading>
      {triage.duplicates.length === 0 ? (
        <Text>No similar issues found in this project.</Text>
      ) : (
        triage.duplicates.map((dup) => (
          <Text key={dup.key}>
            <Link href={`/browse/${dup.key}`}>{dup.key}</Link> — {dup.summary} (
            {Math.round(dup.similarity * 100)}% similar)
          </Text>
        ))
      )}

      {triage.suggestedLabels.length > 0 && (
        <>
          <Heading size="small">Suggested labels</Heading>
          <Text>{triage.suggestedLabels.join(', ')}</Text>
        </>
      )}

      <Text size="small" tone="subtle">
        Heuristic analysis — issue text never leaves your Atlassian site
        {triage.llmEnabled ? ' except for the optional LLM summary.' : '.'}
      </Text>
    </Stack>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
