/**
 * adf.js — Atlassian Document Format (ADF) -> plain text.
 *
 * Jira issue descriptions come back from the REST API as ADF JSON, not
 * plain text. This module walks the document tree and extracts readable
 * text so the heuristics in heuristics.js can work on it.
 * Pure functions, no Forge dependencies — unit tested.
 */

function adfToText(node) {
  if (!node || typeof node !== 'object') return '';
  if (typeof node.text === 'string' && node.type === 'text') return node.text;
  if (node.type === 'hardBreak') return '\n';
  if (node.type === 'mention' && node.attrs && node.attrs.text) return node.attrs.text;

  const children = Array.isArray(node.content)
    ? node.content.map(adfToText).join('')
    : '';

  switch (node.type) {
    case 'paragraph':
    case 'heading':
    case 'blockquote':
      return children + '\n';
    case 'bulletList':
    case 'orderedList':
      return children;
    case 'listItem':
      return '- ' + children.trim() + '\n';
    case 'tableCell':
    case 'tableHeader':
      return children + ' ';
    case 'tableRow':
      return children + '\n';
    case 'codeBlock':
      return children + '\n';
    default:
      return children;
  }
}

module.exports = { adfToText };
