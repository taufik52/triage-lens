/**
 * route.test.js — regression test for the JQL double-encoding bug.
 *
 * `getTriage` (src/index.jsx) builds the duplicate-search URL with the
 * `route` tag from @forge/api. That tag already encodeURIComponent()s
 * every interpolated value in query mode (see
 * node_modules/@forge/api/out/safeUrl.js, escapeParameter 'query').
 * An earlier version of index.jsx ALSO wrapped the JQL in
 * encodeURIComponent(), so Jira received `project%2520%253D...`,
 * rejected the JQL, and the duplicate list came back empty every time
 * (fail-open — the panel still loaded, so nothing visibly broke).
 *
 * These tests pin the correct behaviour using the REAL `route`
 * implementation: raw JQL in, single-encoded JQL out, never `%25`.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { route } = require('../node_modules/@forge/api/out/safeUrl');

function buildSearchRoute(jql) {
  return route`/rest/api/3/search/jql?jql=${jql}&maxResults=50&fields=summary,description`;
}

test('route: raw JQL is single-encoded (spaces become %20, not %2520)', () => {
  const jql = 'project = DEMO AND key != DEMO-1 ORDER BY created DESC';
  const url = buildSearchRoute(jql).value;
  assert.ok(url.includes('jql=project%20%3D%20DEMO%20AND%20key%20!%3D%20DEMO-1'), url);
  assert.ok(!url.includes('%25'), `double-encoded (%25) found in: ${url}`);
  assert.ok(url.includes('maxResults=50'), url);
  assert.ok(url.includes('fields=summary,description'), url);
});

test('route: pre-encoding the JQL WOULD double-encode (documents the old bug)', () => {
  const jql = 'project = DEMO AND key != DEMO-1 ORDER BY created DESC';
  const buggy = buildSearchRoute(encodeURIComponent(jql)).value;
  assert.ok(buggy.includes('%25'), `expected %25 in buggy URL: ${buggy}`);
});

test('index.jsx does not pre-encode the JQL passed to route', () => {
  const fs = require('node:fs');
  const src = fs.readFileSync(`${__dirname}/../src/index.jsx`, 'utf8');
  assert.ok(!src.includes('encodeURIComponent(jql)'), 'index.jsx still pre-encodes jql');
  assert.ok(src.includes('jql=${jql}'), 'index.jsx no longer passes raw jql to route');
});
