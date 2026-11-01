/**
 * taula-rutes-seo.mjs — L8 del Consell: la taula de rutes SEO del connector (B1 · 261101).
 *
 * `wordpress-plugin/dist/seo-routes.json` és un artefacte de build (`npm run build:seo`,
 * dins de `npm run build`) i `dist/` és a .gitignore. Des de WP-06 la taula tampoc
 * viatja als paquets. Per això:
 *   · present                       → res a dir (la vigilen el build i la Porta Build);
 *   · absent dins del pre-commit    → s'executa el productor en sec, que no escriu res
 *     (SDP_PRE_COMMIT=1, l'arbre      i ja falla tancat: menys de 10 rutes, cap indexable,
 *      preparat de git-staged.mjs)    una llavor il·legible. Verd i JSON amb rutes = avís;
 *                                      qualsevol altra cosa = infracció;
 *   · absent fora del pre-commit    → infracció (CI construïx abans de les portes).
 *
 * Pura respecte de l'entorn i del procés: `env` i `executa` s'injecten (proves).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export const TAULA_RUTES = 'wordpress-plugin/dist/seo-routes.json';
export const PRODUCTOR_RUTES = 'tooling/gates/build-seo-manifest.mjs';

const darreraLinia = (text) => String(text || '').split('\n').map((l) => l.trim()).filter(Boolean).slice(-1)[0] || '';

/**
 * @param {{ arrel: string, env?: NodeJS.ProcessEnv, executa?: typeof spawnSync, tempsMs?: number }} opcions
 * @returns {{ estat: 'present' | 'avis' | 'falla', missatge: string }}
 */
export function comprovaTaulaRutes({ arrel, env = process.env, executa = spawnSync, tempsMs = 60_000 } = {}) {
  if (!arrel) throw new TypeError('comprovaTaulaRutes: cal l’arrel');
  if (fs.existsSync(path.join(arrel, TAULA_RUTES))) return { estat: 'present', missatge: '' };
  if (env.SDP_PRE_COMMIT !== '1') {
    return { estat: 'falla', missatge: 'Taula de rutes absent: executa npm run build:seo (o npm run build).' };
  }
  // El productor llig el mateix arbre que el Consell (SDP_ARREL), en sec: sense --escriu.
  const sec = executa(process.execPath, [path.join(arrel, PRODUCTOR_RUTES)], {
    cwd: arrel,
    env: { ...env, SDP_ARREL: arrel },
    encoding: 'utf8',
    timeout: tempsMs,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (sec?.error || sec?.status !== 0) {
    const motiu = darreraLinia(sec?.stderr) || sec?.error?.message || `exit ${sec?.status ?? sec?.signal ?? '?'}`;
    return { estat: 'falla', missatge: `El productor de la taula de rutes falla en sec: ${motiu}` };
  }
  let rutes = 0;
  let indexables = 0;
  try {
    const taula = JSON.parse(sec.stdout);
    const valors = taula && typeof taula.routes === 'object' && !Array.isArray(taula.routes) ? Object.values(taula.routes) : [];
    rutes = valors.length;
    indexables = valors.filter((r) => Boolean(r?.index)).length;
  } catch { rutes = 0; }
  if (!rutes) {
    return { estat: 'falla', missatge: 'El productor de la taula de rutes ix amb 0 però no torna cap taula amb rutes.' };
  }
  return {
    estat: 'avis',
    missatge: `Absent a l'arbre preparat (artefacte de build). El productor la genera en sec: ${rutes} rutes (${indexables} indexables).`,
  };
}
