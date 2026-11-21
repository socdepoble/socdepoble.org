import fs from 'node:fs/promises';
import path from 'node:path';
import { CAMINS } from '../../lib/arrel.mjs';
import { auditWiki } from '../autoneteja_wiki.mjs';
import { runSemanticAudit } from '../semantic_auditor.mjs';

async function resolveWiki(rootOption) {
  const root = path.resolve(rootOption || '.');
  if (path.basename(root) === CAMINS.wiki) return root;
  const nested = path.join(root, CAMINS.wiki);
  if (await fs.stat(nested).then((stat) => stat.isDirectory()).catch(() => false)) return nested;
  throw new Error(`No s'ha trobat ${CAMINS.wiki} dins de ${root}`);
}

export async function run(options = {}) {
  const root = await resolveWiki(options.root);
  const [audit, semantic] = await Promise.all([auditWiki(root), runSemanticAudit(root)]);
  const findings = [];
  for (const item of audit.frontmatter.yamlErrors) {
    findings.push({ severity: 'critical', rule: 'yaml-invalid', file: item.file, message: item.errors.join('; ') });
  }
  for (const file of audit.content.controlChars) {
    findings.push({ severity: 'critical', rule: 'control-char', file, message: 'Conté bytes de control.' });
  }
  for (const item of audit.operational.graph.unresolved) {
    findings.push({ severity: 'critical', rule: 'enllac-irresolt', file: item.from, message: item.target });
  }
  for (const item of [...semantic.folderAlerts, ...semantic.filenameAlerts, ...semantic.descriptionAlerts]) {
    findings.push({ severity: 'warning', rule: item.tipus, file: item.fitxer || item.carpeta, message: item.missatge });
  }
  const critical = findings.filter((item) => item.severity === 'critical').length;
  const warning = findings.length - critical;
  return {
    ok: audit.operational.ok && critical === 0,
    summary: `Auditoria canònica: ${audit.operational.documents} notes, ${critical} crítics, ${warning} avisos.`,
    data: {
      root,
      mode: options.mode || 'complet',
      timestamp: new Date().toISOString(),
      planSha256: audit.plan.planDigest,
      findings,
      summary: { critical, warning, filesScanned: audit.snapshot.files },
    },
  };
}
