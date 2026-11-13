const fs = require('fs');
const path = require('path');
const { lint, problemCount } = require('/home/hatch/workspace/.local/node_modules/@forge/cli/node_modules/@forge/lint');
const manifestPkg = require('/home/hatch/workspace/.local/node_modules/@forge/cli/node_modules/@forge/manifest');
const yaml = require('/home/hatch/workspace/.local/node_modules/@forge/cli/node_modules/yaml');

const appDir = '/home/hatch/workspace/codegeist/triage-lens';
const raw = yaml.parse(fs.readFileSync(path.join(appDir, 'manifest.yml'), 'utf8'));
// validate() shape? try manifestPkg.validate(raw)
(async () => {
  let manifest = raw;
  try {
    const v = manifestPkg.validate(raw);
    console.log('validate() returned:', typeof v, v && v.valid !== undefined ? 'valid=' + v.valid : JSON.stringify(v).slice(0, 300));
    if (v && v.manifest) manifest = v.manifest;
  } catch (e) { console.log('validate() threw:', e.message.slice(0, 200)); }
  const logger = { debug: () => {}, info: (m) => console.log('[info]', m), warn: (m) => console.log('[warn]', m), error: (m) => console.log('[error]', m) };
  const statsig = { getConfigValue: async () => false, checkGate: async () => false, getDeprecatedRuntimes: async () => [] };
  const files = ['src/index.jsx', 'src/heuristics.js', 'src/adf.js', 'src/llm.js'].map(f => path.join(appDir, f));
  try {
    const results = await lint(files, manifest, 'development', logger, statsig, { linter: { mode: 'client-side' } });
    console.log('LINT RESULTS:', JSON.stringify(results, null, 2).slice(0, 4000));
    console.log('COUNTS:', JSON.stringify(problemCount(results)));
  } catch (e) { console.log('LINT THREW:', (e && e.stack || e).slice(0, 1500)); }
})();
