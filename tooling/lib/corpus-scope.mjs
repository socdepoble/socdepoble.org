/** Execution evidence is verified by its own contracts, not adopted as authored corpus.
 * Prefixes are repository-relative and exact: a Wiki chapter named runtime stays in scope.
 */
export const EXECUTION_EVIDENCE_ROOTS = Object.freeze(['.agents/runtime', '.sdp-reflex']);
export function isExecutionEvidence(relative) {
  if(typeof relative!=='string')return false;
  const normalized=relative.replaceAll('\\','/').replace(/^\.\//,'');
  return EXECUTION_EVIDENCE_ROOTS.some(root=>normalized===root||normalized.startsWith(`${root}/`));
}

/** Synthetic test references and this generated scan cache are not production path promises.
 * This narrower predicate is only for source-citation checks, never document inclusion.
 */
export function isCitationFixtureOrCache(relative) {
  if(typeof relative!=='string')return false;
  const normalized=relative.replaceAll('\\','/').replace(/^\.\//,'');
  return normalized==='tooling/wiki/.cache-tractor.json'
    || /(?:^|\/)(?:tests|__tests__|__fixtures__)(?:\/|$)/.test(normalized)
    || /\.(?:test|spec)\.(?:mjs|cjs|js|jsx|ts|tsx)$/.test(normalized);
}
