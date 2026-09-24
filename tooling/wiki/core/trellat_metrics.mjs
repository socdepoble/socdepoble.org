// core/trellat_metrics.mjs — Índex de Trellat (IT): mesura de salut global del projecte.
// Prototip històric de tres proxies. No implementa l'Índex de Trellat canònic
// de quatre dimensions i, per tant, mai és una porta SDP-LOCK.
import { readFile, stat } from 'node:fs/promises';
import { run as runAudit } from './audit.mjs';
import { nodeAdapter, latestSnapshot, verifySnapshot } from './snapshot_engine.mjs';

const RULES_URL = new URL('../rules/trellat-rules.json', import.meta.url);
async function loadRules() {
  return JSON.parse(await readFile(RULES_URL, 'utf8'));
}

/** Coherència (CT): 100 menys penalització ponderada per severitat. Fitada [0,100] per construcció
 * (Math.min/max), no per convenció: un crític pesa 3x un avís; el pitjor cas raonable és un
 * crític per fitxer, i és el que fixa el denominador. */
function coherencia({ critical, warning, filesScanned }) {
  if (filesScanned === 0) return null;
  const weight = critical * 3 + warning * 1;
  const maxWeight = filesScanned * 3;
  return Math.min(100, Math.max(0, 100 * (1 - weight / maxWeight)));
}

/** Eficiència (CE): bytes/fitxer mitjans contra el pressupost ideal (`idealBytesPerFile`).
 * Fitada [0,100]: un corpus més lleuger que l'ideal puntua 100 (no es premia per damunt), un
 * corpus més pesat degrada linealment. */
function eficiencia(totalBytes, fileCount, idealBytesPerFile) {
  if (fileCount === 0) return null;
  const avgBytes = totalBytes / fileCount;
  if (avgBytes <= 0) return 100;
  return Math.min(100, Math.max(0, (idealBytesPerFile / avgBytes) * 100));
}

/** Resiliència (CR): integració real amb snapshot_engine (no un número arbitrari). Existeix un
 * snapshot verificable i alineat amb el corpus actual? 0 = sense xarxa de seguretat, 60 = hi ha
 * xarxa però desactualitzada, 100 = recuperació garantida ara mateix. */
async function resiliencia(root, fileCount) {
  const path = await latestSnapshot(`${root}/.snapshots`);
  if (!path) return { score: null, detail: 'N/A: cap snapshot verificable.' };
  const verified = await verifySnapshot(path, undefined, null);
  if (!verified.ok) return { score: null, detail: `N/A: snapshot il·legible (${verified.error || 'verificació fallida'}).` };
  if (verified.fileCount === fileCount) return { score: 100, detail: `Snapshot verificat i alineat (${verified.fileCount} fitxers).` };
  return { score: 60, detail: `Snapshot verificat però desalineat (${verified.fileCount} vs ${fileCount} actuals).` };
}

async function walkStats(root) {
  const files = await nodeAdapter.walk(root); // reutilitza el mateix recorregut que snapshot_engine
  let totalBytes = 0;
  for (const f of files) totalBytes += (await stat(f)).size;
  return { totalBytes, fileCount: files.length };
}

/** Compatibilitat per a importadors antics: mai activa una porta. */
export function checkGate(it) {
  return {
    locked: false,
    it,
    threshold: null,
    reason: 'Prototip consultiu retirat com a porta; usa les auditories canòniques.',
  };
}

export async function run(options) {
  const root = options.root || '.';
  const rules = await loadRules();
  const w = rules.trellatMetricsWeights;

  const [auditResult, stats] = await Promise.all([runAudit({ root, mode: 'trellat-metrics' }), walkStats(root)]);
  const ct = coherencia(auditResult.data.summary);
  const ce = eficiencia(stats.totalBytes, stats.fileCount, rules.thresholds.idealBytesPerFile);
  const cr = await resiliencia(root, stats.fileCount);

  const missing = [ct, ce, cr.score].some((value) => value === null);
  const it = missing ? null : w.coherencia * ct + w.eficiencia * ce + w.resiliencia * cr.score;
  const gate = checkGate(it);

  return {
    ok: !missing,
    summary: missing
      ? `IT=N/A (CT=${ct ?? 'N/A'} CE=${ce ?? 'N/A'} CR=${cr.score ?? 'N/A'}). No és una porta.`
      : `IT experimental=${it.toFixed(1)} (CT=${ct.toFixed(1)} CE=${ce.toFixed(1)} CR=${cr.score.toFixed(1)}); no és una porta.`,
    data: {
      status: missing ? 'not-applicable' : 'experimental',
      it: it === null ? null : Number(it.toFixed(1)),
      components: {
        coherencia: ct === null ? null : Number(ct.toFixed(1)),
        eficiencia: ce === null ? null : Number(ce.toFixed(1)),
        resiliencia: cr.score === null ? null : Number(cr.score.toFixed(1)),
      },
      weights: w,
      resilienciaDetail: cr.detail,
      fileCount: stats.fileCount,
      totalBytes: stats.totalBytes,
      gate,
    },
  };
}
