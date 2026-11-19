// DIAGNOSTIC BUILD — minimal static panel (no invoke, no @forge/api).
// Purpose: prove whether the Forge platform renders ANY content in this
// issuePanel at all. The real panel is backed up at
// ~/workspace/codegeist/index.jsx.real.bak — REVERT after the test.
import ForgeReconciler, { Text } from '@forge/react';
import React from 'react';
import Resolver from '@forge/resolver';

const resolver = new Resolver();
resolver.define('ping', async () => ({ ok: true }));

export const run = resolver.getDefinitions();

const App = () => {
  return <Text>Triage Lens OK — panel renders.</Text>;
};

ForgeReconciler.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
