/**
 * t15-relleu.mjs — Relleu del torn torn_d8024ad3 (260930): bloc ESTAT_ACTUAL,
 * entrada signada del LEDGER i bateries noves a test:node.
 *
 * Contracte del generador (lease.mjs): cada `aplica(actual, nous)` és pura,
 * rep el contingut vigent (disc o encadenat) i torna el nou; llança si
 * l'ancoratge no hi és exactament una vegada o si el relleu ja hi és.
 * Només importa node:crypto: el generador la carrega des del laboratori.
 */
import { createHash } from 'node:crypto';

const TORN = 'torn_d8024ad3-9c76-48e7-b402-348fbb2dedb5';
const sha = (text) => createHash('sha256').update(text).digest('hex');

function una(actual, ancora, on) {
  const n = actual.split(ancora).length - 1;
  if (n !== 1) throw new Error(`${on}: l'ancoratge «${ancora.trim()}» apareix ${n} vegades (cal exactament 1)`);
}
function encaraNo(actual, marca, on) {
  if (actual.includes(marca)) throw new Error(`${on}: el relleu ja hi és; no es duplica`);
}

/* ── ESTAT: el bloc nou va el primer, com mana despertar.mjs ──────────────── */

export const BLOC_ESTAT = `## ESTAT_ACTUAL · 2026-09-30 03:10 · Claude (Opus 5.5) · Tanda T1-T16: Consola, Explorador, Agenda, governança i lease

- **Torn:** \`${TORN}\` (code). Pla [[260930_0040_pla_implementacio_consola]]; informe [[260930_0040_auditoria_claude]]; relleu per al compte nou a l'Acta Marmota [[260930_0310_acta_marmota]].
- **Fet a src (sense lease, 1.255 proves de vitest verdes):** T2 mètriques de les targetes en h5 i Índex fins a h6 només a la Consola; T3-T4 Explorador amb el graf al final i panell de detall Pedra Seca (Obrir a la Wiki, Obrir a l'editor en dev, Copiar la ruta); T6-T8 Agenda del Mur amb el calendari compartit, model d'esdeveniment compatible amb iCalendar i Google Calendar i exportadors purs (\`aIcs\`, \`aGoogleCalendar\`), Consola migrada al mateix organisme amb prova d'equivalència de 24 mesos; T7 píndoles uniformes i línies fines; T9 fora el scroll vertical intern de les taules; T10 Codex al compilador pur; T11 un sol camí d'entrada per pàgina; T12 mètriques de segell, frontmatter, torns, Escriptori i LEDGER, i alerta de vigilància al tauler; T15 barra lateral amb rectangles purs.
- **Fet a governança (este bloc entra amb el mateix pla de l'executor, sota la lease del Mestre):** T1 core-neteja-brossa vàlida i indexada, \`contracte.llig\` a quatre skills amb esquema, pany i deute resegellats, test:node amb les bateries noves; T5 porta Olivera v3 (viu per declaració a «Activitat en curs», \`--arxiva --nom\`, \`--sec\`, «0. Preflight», mode hook explícit); T10-T12 closca del Mapa amb Codex i fonts de vigilància; T13-T14 AGENTS §0.1 (Escriptori net i orquestradora resolutiva), skills d'higiene i reflex, i hook d'Antigravity en el format documentat de l'IDE amb interruptor d'apagada.
- **Mestre, després de l'executor:** enllaços \`.claude/skills/core-neteja-brossa\` i \`core-telemetria-huma\`; \`node tooling/gates/tancament.mjs --close --turn-id ${TORN}\`; commit revisat.
- **Pendent:** revisió adversarial de les llesques Explorador i Calendari i del paquet de governança (els correctors i revisors van caure pel límit setmanal); prova real del hook dins d'Antigravity (una línia a \`.agents/runtime/antigravity-hook.log\`); investigar el giny de Google Translate amb disseny Pedra Seca (endoll únic a \`useAccions\`) i alternatives sobiranes; desglossament d'estats a la coberta de cada targeta del tauler; Porta Frontmatter roja abans del paquet (F3, F4, F5); 101 torns caducats sense tancar; Wiki: doctrina de \`04_contracte_de_dades.md\` per actualitzar.
- **Responsables:** Mestre (lease, symlinks, tancament, commit); Claude (codi i proves); MarIA (Escriptori net amb la porta v3 i acreditació del hook).

`;

function aplicaEstat(actual) {
  const on = '.agents/ESTAT.md';
  encaraNo(actual, `\`${TORN}\``, on);
  const ancora = '\n## ESTAT_ACTUAL';
  const primer = actual.indexOf(ancora);
  if (primer < 0) throw new Error(`${on}: no hi ha cap capçalera ESTAT_ACTUAL`);
  if (!actual.slice(0, primer).includes('\n# ESTAT DE LA SESSIÓ')) throw new Error(`${on}: capçalera del document inesperada`);
  return `${actual.slice(0, primer + 1)}${BLOC_ESTAT}${actual.slice(primer + 1)}`;
}

/* ── LEDGER: entrada abans del segell i resignatura (tooling/documental/ledger.mjs) ── */

const SEGELL = /\n\n<!-- HASH: ([a-f0-9]{64}) -->\s*$/;

export const ENTRADA_LEDGER = [
  `## 2026-09-30 · Claude (Opus 5.5) · Tanda T1-T16 · ${TORN}`,
  '',
  '260930 | torn | code | Consola en tauler, Explorador, Agenda del Mur, taules, Codex, vigilància i barra lateral',
  '260930 | torn | governança | skills sanejades, porta Olivera v3, AGENTS §0.1 i hook Antigravity via executor',
  '260929 | recaiguda | core-higiene-escriptori | prompt abans de neteja; neteja real només a la tercera ordre',
  '- Proves: 1.255 de vitest verdes a les àrees tocades; proves de laboratori del paquet verdes abans de la lease. Sense push ni desplegament.',
  `- Informe [[260930_0040_auditoria_claude]]; relleu [[260930_0310_acta_marmota]].`,
].join('\n');

function aplicaLedger(actual) {
  const on = '.agents/LEDGER.md';
  encaraNo(actual, `· ${TORN}`, on);
  const m = actual.match(SEGELL);
  if (!m) throw new Error(`${on}: no acaba amb el segell <!-- HASH -->`);
  const cos = actual.slice(0, m.index);
  if (sha(cos) !== m[1]) throw new Error(`${on}: la signatura actual no és vàlida; cal reconciliar-la abans`);
  const nou = `${cos}\n\n${ENTRADA_LEDGER}`;
  return `${nou}\n\n<!-- HASH: ${sha(nou)} -->`;
}

/* ── package.json: les bateries que entren amb el paquet, al runner ─────────── */

const BATERIES = ['tests/porta-olivera-v3.test.mjs', 'tests/antigravity-hook.test.mjs',
  'tests/fonts-vigilancia.test.mjs', 'tests/mapa-consola.test.mjs'];

function aplicaTestNode(actual) {
  const on = 'package.json';
  const re = /^(\s*"test:node": "node --test [^"\n]*)(",?)$/m;
  const linies = actual.match(new RegExp(re.source, 'gm')) || [];
  if (linies.length !== 1) throw new Error(`${on}: la línia test:node apareix ${linies.length} vegades (cal exactament 1)`);
  for (const b of BATERIES) if (linies[0].includes(b)) throw new Error(`${on}: ${b} ja és a test:node; no es duplica`);
  return actual.replace(re, (_, valor, cua) => `${valor} ${BATERIES.join(' ')}${cua}`);
}

export const operacions = [
  { ruta: '.agents/ESTAT.md', descripcio: 'T16: bloc ESTAT_ACTUAL del torn, el primer del fitxer.', aplica: aplicaEstat },
  { ruta: '.agents/LEDGER.md', descripcio: 'T16: entrada del torn abans del segell i resignatura amb sha256 del cos.', aplica: aplicaLedger },
  { ruta: 'package.json', descripcio: 'test:node amb les quatre bateries que entren amb el paquet (s’encadena després de T1).', aplica: aplicaTestNode },
];

export { una, TORN };
