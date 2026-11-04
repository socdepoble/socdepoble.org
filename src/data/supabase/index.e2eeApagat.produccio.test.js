// @vitest-environment node
/* B2e · P1-12 (marató 261101_2143, spec B2-E2EE §2.6) · Prova de deriva del
   paquet amb la bandera E2EE apagada. Vite compila en mode producció amb tots
   els mòduls propis dins (només els paquets de npm fora) i es mira mòdul a
   mòdul qui hi deixa codi (renderedLength). Dues entrades:
   1. El tros de l'adaptador Supabase (src/data/supabase/index.js). L'adaptador
      és transport opac (capacitats clausXat i xatMultimediaXifrat): no desxifra
      res i no porta ni el motor ni el protocol. Abans, supabase/xatXifrat.js
      prenia MAXIM_BLOB_ADJUNT i MIME_XIFRAT de xatMultimediaXifrat.js, que
      importa el protocol i els formats: Rollup no pot descartar les taules de
      xifratXatFormats.js (efectes de mòdul) i el tros en portava uns 33 kB i
      les 16 màgies SDP*. Ara les dues constants viuen a xatMultimedia.js.
   2. El graf de producció sencer: src/main.jsx (l'entrada d'index.html), amb
      host.js, on es cableja el decorador (backendAmbXifrat), la UI i els
      trossos mandrosos. Si el decorador o el pressupost dels blobs s'avaluen
      fora de la bandera, si una pantalla importa el protocol o si cau
      `sideEffects` de package.json, el motor, el protocol i els formats tornen
      al paquet, i ací es veu. Fora queden els connectors del vite.config
      (React, federació, App Links i els de dev): no afigen mòduls del
      xifratge (ho confirma un build real amb el vite.config, 261102).
   De les primitives (xifratXatCripto.js) només hi poden quedar les
   exportacions de PRIMITIVES_PERMESES; queda també, sabut, el
   codifica('HPKE-v1') del mòdul (se'n va amb la petició @__PURE__ de B2e).
   Cap etiqueta 'sdp-xat-v1/', ni dins de les primitives.
   Controls positius: una sonda que torna a prendre les dues constants de
   xatMultimediaXifrat.js (la regressió exacta) arrossega els formats; amb la
   bandera encesa, el graf de host.js (UI fora per a anar de pressa; és dins
   del de main.jsx) porta el motor. Un `import '…'` nu no valdria:
   package.json declara `sideEffects` i Rollup descarta un mòdul del qual no
   s'usa cap lligam. En fallar, cap asserció bolca el codi compilat (milions de
   caràcters): només el que s'hi ha trobat o el que hi falta. */
import path from 'node:path';
import { build } from 'vite';
import { describe, expect, test } from 'vitest';
import { E2EE_ACTIU_PER_DEFECTE } from '../../config/xifratXat.js';
import * as neutral from '../xatMultimedia.js';
import * as xifrat from '../xatMultimediaXifrat.js';

const ARREL = process.cwd();
const ADAPTADOR = 'src/data/supabase/index.js';
const APP = 'src/main.jsx';
const HOST = 'src/host.js';
const TRANSPORT = /[\\/]data[\\/]supabase[\\/]xatXifrat\.js$/;
const ES_HOST = /[\\/]src[\\/]host\.js$/;
const LABORATORI_UI = /[\\/]profile[\\/]ProvaXifratXat\.jsx$/;
const BANDERA = /[\\/]config[\\/]xifratXat\.js$/;
const APAGADA = 'export const E2EE_ACTIU_PER_DEFECTE = false;';
/* La UI, fora només al control positiu del graf de host.js. */
const UI = /\.(?:jsx|css)(?:\?[^/]*)?$/;
/* Protocol, formats, motor, decorador, magatzem, recuperació i adjunts xifrats. */
const XIFRATGE = /[\\/]data[\\/](xifratXat[A-Za-z]*|xatMultimediaXifrat)\.js$/;
/* Les primitives: l'única peça del xifratge que el transport usa. */
const PRIMITIVES = /[\\/]data[\\/]xifratXatCripto\.js$/;
/* El que en pot quedar: el base64url canònic dels kid i dels bytea i el seu error amb codi.
   La taula HPKE ja no: les tres @__PURE__ i les claus literals de NK_AEAD són aplicades
   (P1-12, trinquet tancat el 261102, torn torn_d19293b9). */
const PRIMITIVES_PERMESES = ['aBase64url', 'deBase64url', 'errorAmbCodi'];
/* Al graf de producció, a més de les primitives: el canal lateral dels serveis (un WeakMap) i
   l'oblit en eixir de la sessió (guardat per la bandera, no importa el motor). */
const PERMESOS_APP = /[\\/]data[\\/](xifratXatCripto|xifratXatServei|xifratXatEixida)\.js$/;
const MAGIES = /["'`]SDP[A-Z]["'`]/g;
/* La importació de les dues constants del mòdul neutral, que la sonda reescriu. */
const IMPORT_NEUTRAL = /import \{([^}]*)\} from '\.\.\/xatMultimedia\.js';/;
const CONSTANTS = ['MAXIM_BLOB_ADJUNT', 'MIME_XIFRAT'];
/* Rastres que mai poden entrar: motor, recuperació social, qualsevol etiqueta del protocol
   ('sdp-xat-v1/…', també dins de les primitives) i RPC de F7. */
const RASTRES = [
  'creaMotorXifrat', 'ambXifratXat', 'sas-recuperacio', 'sdp-xat-v1/', 'xifraAdjunt', 'obriAdjunt',
  'xat_publica_cercle', 'xat_demana_recuperacio', 'xat_compromis_recuperacio', 'xat_respon_recuperacio', 'xat_revela_recuperacio',
  'xat_allibera_recuperacio', 'xat_rebutja_recuperacio', 'xat_no_soc_jo', 'xat_completa_recuperacio'
];
/* El transport opac, que sí que ha de ser al tros de l'adaptador (control de no buidor). */
const DEL_TRANSPORT = ['xat_publica_identitat', 'xat_publica_adjunt_xifrat', 'application/octet-stream'];
/* esbuild reescriu 20_000_000 com a 2e7 en el tros final. */
const SOSTRE_BLOB = /MAXIM_BLOB_ADJUNT(?:\$\d+)? = (?:2e7|20_?000_?000);/;

/* Bolca o no: un import absolut o relatiu és nostre (dins); un paquet de npm, fora. */
const esPaquet = (id, importador) => Boolean(importador) && !id.startsWith('.') && !path.isAbsolute(id) && !id.startsWith('\0');

async function compila({ entrada = ADAPTADOR, sonda = false, encesa = false, uiFora = false } = {}) {
  const abans = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  let sondejat = false;
  try {
    const resultat = await build({
      configFile: false,
      logLevel: 'silent',
      root: ARREL,
      mode: 'production',
      esbuild: { jsx: 'automatic', jsxDev: false },
      plugins: [{
        name: 'sonda-adaptador-e2ee',
        enforce: 'pre',
        transform(codi, id) {
          if (encesa && BANDERA.test(id)) {
            if (!codi.includes(APAGADA)) throw new Error('La sonda no troba la bandera apagada a config/xifratXat.js.');
            sondejat = true;
            return codi.replace(APAGADA, 'export const E2EE_ACTIU_PER_DEFECTE = true;');
          }
          if (!sonda || !TRANSPORT.test(id)) return null;
          const noms = (codi.match(IMPORT_NEUTRAL)?.[1] ?? '').split(',').map((nom) => nom.trim()).filter(Boolean);
          if (!CONSTANTS.every((nom) => noms.includes(nom))) {
            throw new Error('La sonda no troba MAXIM_BLOB_ADJUNT i MIME_XIFRAT importades de ../xatMultimedia.js a supabase/xatXifrat.js.');
          }
          sondejat = true;
          const resta = noms.filter((nom) => !CONSTANTS.includes(nom));
          return codi.replace(IMPORT_NEUTRAL, `import { ${resta.join(', ')} } from '../xatMultimedia.js';\nimport { ${CONSTANTS.join(', ')} } from '../xatMultimediaXifrat.js';`);
        }
      }],
      build: {
        write: false,
        minify: false,
        lib: { entry: path.join(ARREL, entrada), formats: ['es'], fileName: 'sonda' },
        rollupOptions: { external: (id, importador) => esPaquet(id, importador) || (uiFora && Boolean(importador) && UI.test(id)) }
      }
    });
    if ((sonda || encesa) && !sondejat) throw new Error(`La sonda no ha trobat el seu fitxer al graf de ${entrada}.`);
    const trossos = (Array.isArray(resultat) ? resultat : [resultat]).flatMap((r) => r.output).filter((o) => o.type === 'chunk');
    /* Mòdul → bytes de codi que deixa al paquet (0 si Rollup l'ha descartat sencer). */
    const moduls = new Map();
    /* Exportacions de les primitives que el codi inclòs fa servir. */
    const exportsPrimitives = new Set();
    for (const tros of trossos) {
      for (const [id, m] of Object.entries(tros.modules)) {
        moduls.set(id, (moduls.get(id) ?? 0) + m.renderedLength);
        if (PRIMITIVES.test(id)) for (const nom of m.renderedExports) exportsPrimitives.add(nom);
      }
    }
    return { codi: trossos.map((o) => o.code).join('\n'), moduls, exportsPrimitives: [...exportsPrimitives].sort() };
  } finally {
    if (abans === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = abans;
  }
}

const ambCodi = (moduls, patro) => [...moduls].filter(([id, n]) => patro.test(id) && n > 0).map(([id]) => path.relative(ARREL, id));
const fora = (llista, permesos) => llista.filter((nom) => !permesos.includes(nom));
const trobats = (codi, textos) => textos.filter((text) => codi.includes(text));
const magies = (codi) => [...new Set(codi.match(MAGIES) ?? [])];

describe('el paquet de producció, amb la bandera apagada, no porta el motor ni el protocol del xifratge', () => {
  test('la premissa: la bandera E2EE és apagada per defecte', () => {
    expect(E2EE_ACTIU_PER_DEFECTE).toBe(false);
  });

  test('les dues constants del transport són les mateixes al mòdul neutral i al d’adjunts xifrats', () => {
    expect(neutral.MAXIM_BLOB_ADJUNT).toBe(20_000_000);
    expect(neutral.MIME_XIFRAT).toBe('application/octet-stream');
    expect(xifrat.MAXIM_BLOB_ADJUNT).toBe(neutral.MAXIM_BLOB_ADJUNT);
    expect(xifrat.MIME_XIFRAT).toBe(neutral.MIME_XIFRAT);
    /* El blob farcit més gran (Padmé del sostre en clar del vídeo) cap al bucket. */
    expect(xifrat.midaBlobAdjunt(xifrat.MAXIM_CLAR_ADJUNT[xifrat.CLASSE_ADJUNT.video])).toBeLessThanOrEqual(neutral.MAXIM_BLOB_ADJUNT);
  });

  test('tros de l’adaptador: cap mòdul del xifratge (llevat de les primitives) hi deixa codi; cap màgia ni rastre; el transport opac sí que hi és', async () => {
    const { codi, moduls, exportsPrimitives } = await compila();
    expect(ambCodi(moduls, XIFRATGE).filter((id) => !PRIMITIVES.test(id))).toEqual([]);
    expect(fora(exportsPrimitives, PRIMITIVES_PERMESES)).toEqual([]);
    expect(magies(codi)).toEqual([]);
    expect(trobats(codi, RASTRES)).toEqual([]);
    /* Control de no buidor: el transport és al tros, amb el sostre i el MIME opac. */
    expect(ambCodi(moduls, TRANSPORT)).toEqual(['src/data/supabase/xatXifrat.js']);
    expect(trobats(codi, DEL_TRANSPORT)).toEqual(DEL_TRANSPORT);
    expect(SOSTRE_BLOB.test(codi), 'MAXIM_BLOB_ADJUNT = 2e7 al tros').toBe(true);
  }, 60000);

  test('control positiu: si l’adaptador torna a importar xatMultimediaXifrat.js, els formats i les màgies hi entren', async () => {
    const { codi, moduls } = await compila({ sonda: true });
    const dins = ambCodi(moduls, XIFRATGE);
    expect(dins).toContain('src/data/xifratXatFormats.js');
    expect(dins).toContain('src/data/xatMultimediaXifrat.js');
    expect(magies(codi).length).toBeGreaterThan(0);
  }, 60000);

  test('graf de producció (main.jsx): només les peces neutrals del xifratge hi deixen codi; cap màgia ni rastre', async () => {
    const { codi, moduls, exportsPrimitives } = await compila({ entrada: APP });
    /* La prova local de FEDI-07 és DEV: ni tan sols la seua UI entra al paquet. */
    expect(ambCodi(moduls, LABORATORI_UI)).toEqual([]);
    expect(ambCodi(moduls, XIFRATGE).filter((id) => !PERMESOS_APP.test(id))).toEqual([]);
    expect(fora(exportsPrimitives, PRIMITIVES_PERMESES)).toEqual([]);
    expect(magies(codi)).toEqual([]);
    expect(trobats(codi, RASTRES)).toEqual([]);
    /* Control de no buidor: l'amfitrió i el transport de l'adaptador (import dinàmic) hi són. */
    expect(ambCodi(moduls, ES_HOST)).toEqual([HOST]);
    expect(ambCodi(moduls, TRANSPORT)).toEqual(['src/data/supabase/xatXifrat.js']);
  }, 60000);

  test('control positiu: amb la bandera encesa, el graf de host.js porta el decorador, el motor, el protocol i els formats', async () => {
    const { codi, moduls } = await compila({ entrada: HOST, uiFora: true, encesa: true });
    const dins = ambCodi(moduls, XIFRATGE);
    for (const modul of ['xifratXat', 'xifratXatProtocol', 'xifratXatFormats', 'xatMultimediaXifrat']) expect(dins).toContain(`src/data/${modul}.js`);
    expect(magies(codi).length).toBeGreaterThan(0);
  }, 60000);
});
