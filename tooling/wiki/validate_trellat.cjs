#!/usr/bin/env node
/** Façana CJS de sol lectura sobre l'auditor canònic v2. */
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const moduleUrl = pathToFileURL(path.join(__dirname, 'autoneteja_wiki.mjs')).href;
  const { auditWiki } = await import(moduleUrl);
  const { CAMINS } = await import('../lib/arrel.mjs');
  const WIKI_DIR = process.env.SDP_WIKI_DIR || path.resolve(__dirname, '../..', CAMINS.wiki);
  const wiki = WIKI_DIR;
  const audit = await auditWiki(wiki);
  if (!audit.operational.ok) {
    console.error(`❌ Trellat fallat: ${audit.operational.health}; pla ${audit.plan.planDigest}`);
    process.exitCode = 1;
    return;
  }
  console.log(`✅ Trellat verificat: ${audit.operational.documents} notes, 0 fantasmes, 0 buits i schema v2 coherent.`);
})().catch((error) => {
  console.error(`❌ validate_trellat: ${error.message}`);
  process.exitCode = 1;
});
