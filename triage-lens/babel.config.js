// Babel config for Forge deploy bundling.
//
// The Forge CLI's bundler does not enable JSX by default for this
// hand-built (non-scaffolded) app, so `forge deploy` fails with:
// "Support for the experimental syntax 'jsx' isn't currently enabled".
// Fix: enable the classic JSX transform using the @babel/plugin-transform-react-jsx
// already bundled inside @forge/cli (absolute path, no extra install needed).
// src/index.jsx imports React explicitly, so the classic runtime is correct.
const path = require('path');

const cliBabel = '/home/hatch/workspace/.local/node_modules/@forge/cli/node_modules/@babel';

module.exports = {
  presets: [],
  plugins: [
    [path.join(cliBabel, 'plugin-transform-react-jsx'), { runtime: 'classic' }],
  ],
};
