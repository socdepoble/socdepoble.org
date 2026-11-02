// @vitest-environment node
/* P1-12 pas 17 (pla 261101_1246, T7 · S5) · Prova de deriva (disseny E2EE §13,
   IP-D1): amb la bandera E2EE apagada (config/xifratXat.js), el paquet de
   producció de la conversa no porta res del xifratge: ni el diàleg del número
   de seguretat, ni el hook de l'estat, ni cap text de section.xat.xifratge.*
   (cap promesa de xifratge a la vista ni al codi). Vite compila Conversa.jsx en
   mode producció com SessionContext.e2eeApagat.produccio.test.js: tota
   importació externa menys la bandera, que es resol de veres perquè Rollup en
   veja el valor, i les peces noves del xifratge, que entren a la compilació per
   a vore si el plegat se les emporta. Control positiu: la mateixa compilació
   amb la bandera encesa (una sonda que reescriu la línia, i que llança si no la
   troba) sí que les porta, el diàleg en un tros a part.
   M02 (marató 261101_2143; disseny §4.4) · El mateix per a l'alerta de canvi de clau
   al fil (AvisClauCanviada, en un altre tros), el hook dels canvis (useCanvisDeClau)
   i el compositor bloquejat: apagada, cap rastre; encesa, tot hi és.
   Corrector M02 (P2-1) · L'espècimen de /disseny (EspecimenXatSeguretat.jsx, tros
   lazy del catàleg) munta AvisClauCanviada sense plegar, com CosSeguretatXat des de
   T7: amb la bandera apagada la MAQUETA presentacional i els seus textos sí que van
   al tros de l'espècimen (decisió pendent del Mestre: plegar-lo o acceptar-lo). La
   segona prova fixa la frontera: eixe tros no importa cap mòdul de dades (port,
   motor ni cripto) ni porta el hook ni el servei dels canvis de clau. */
import path from 'node:path';
import { build } from 'vite';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const CONVERSA = 'src/sections/xat/components/Conversa.jsx';
const BANDERA = /[\\/]config[\\/]xifratXat\.js$/;
const PECES_XIFRATGE = /[\\/]sections[\\/]xat[\\/](useSeguretatDelFil\.js|useCanvisDeClau\.js|estatXifratgeFil\.js|components[\\/](PanellSeguretatXat|CosSeguretatXat|AvisClauCanviada)\.jsx)$/;
const APAGADA = 'export const E2EE_ACTIU_PER_DEFECTE = false;';

/* Resol una importació relativa al seu camí absolut, per a decidir si és externa. */
const absolut = (id, importador) => (id.startsWith('.') && importador ? path.resolve(path.dirname(importador), id) : id);

async function compila({ encesa, entrada = CONVERSA, interns = PECES_XIFRATGE }) {
  const abans = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const resultat = await build({
      configFile: false,
      logLevel: 'silent',
      root: ARREL,
      mode: 'production',
      esbuild: { jsx: 'automatic', jsxDev: false },
      plugins: [{
        name: 'sonda-bandera-e2ee',
        transform(codi, id) {
          if (!encesa || !BANDERA.test(id)) return null;
          if (!codi.includes(APAGADA)) throw new Error('La sonda no troba la bandera apagada a config/xifratXat.js.');
          return codi.replace(APAGADA, 'export const E2EE_ACTIU_PER_DEFECTE = true;');
        }
      }],
      build: {
        write: false,
        minify: false,
        lib: { entry: path.join(ARREL, entrada), formats: ['es'], fileName: 'sonda' },
        rollupOptions: {
          external: (id, importador) => {
            if (!importador) return false;
            const camí = absolut(id, importador);
            return !BANDERA.test(camí) && !interns.test(camí);
          }
        }
      }
    });
    const eixides = (Array.isArray(resultat) ? resultat : [resultat]).flatMap((r) => r.output);
    return { codi: eixides.map((o) => o.code ?? '').join('\n'), trossos: eixides.filter((o) => o.type === 'chunk').length };
  } finally {
    if (abans === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = abans;
  }
}

describe('amb la bandera E2EE apagada, la conversa no porta res del xifratge', () => {
  test('apagada: cap diàleg, cap hook, cap text del xifratge, un sol tros; encesa: tot hi és, el diàleg en un tros a part', async () => {
    const apagada = await compila({ encesa: false });
    expect(apagada.codi).toContain('CapcaleraConversa');
    expect(apagada.codi).toContain('sdp-xat-conversa');
    for (const rastre of ['PanellSeguretatXat', 'CosSeguretatXat', 'useEstatXifratgeDelFil', 'estatXifratgeDelFil', 'numeroSeguretat', 'section.xat.xifratge', 'Xifratge i número de seguretat', 'es xifren',
      /* M02 · L'alerta de canvi de clau, el hook, el servei, els textos i el compositor bloquejat. */
      'AvisClauCanviada', 'useCanvisDeClau', 'canvisDeClau', 'acceptaCanviClau', 'clauCanviadaContinua', 'He parlat amb', 'Clau nova sense confirmar',
      'avisDelBloqueig', 'nomDelMembre', 'avisNomesLectura', 'potEscriure']) {
      expect(apagada.codi, rastre).not.toContain(rastre);
    }
    expect(apagada.trossos).toBe(1);

    const encesa = await compila({ encesa: true });
    expect(encesa.codi).toContain('section.xat.xifratge.');
    expect(encesa.codi).toContain('Xifratge i número de seguretat');
    expect(encesa.codi).toContain('es xifren al teu aparell');
    expect(encesa.codi).toContain('numeroSeguretat');
    expect(encesa.codi).toContain('sdp-xat-numero');
    /* M02 · Control positiu: encesa, l'alerta (en un tros a part), el hook i el compositor bloquejat hi són. */
    for (const rastre of ['AvisClauCanviada', 'canvisDeClau', 'acceptaCanviClau', 'clauCanviadaContinua', 'He parlat amb {nom}: continua', 'avisNomesLectura']) {
      expect(encesa.codi, rastre).toContain(rastre);
    }
    expect(encesa.trossos).toBeGreaterThan(2);
    expect(encesa.trossos).toBeGreaterThan(1);
  }, 60000);
});

/* Corrector M02 (P2-1) · Tot src/sections/xat i src/sections/profile entren a la
   compilació de l'espècimen: si una peça de la maqueta comencés a importar el hook o el
   servei, el seu codi (o la seua importació de src/data) es veuria ací. */
const ESPECIMEN = 'src/sections/disseny/cataleg/detalls/EspecimenXatSeguretat.jsx';
const INTERNS_ESPECIMEN = /[\\/](sections[\\/](xat|profile)[\\/].+\.jsx?|cataleg[\\/]detalls[\\/]EspecimenXatSeguretat\.jsx)$/;

describe('l’espècimen de /disseny amb la bandera apagada: només la maqueta presentacional', () => {
  test('porta AvisClauCanviada amb dades inventades, però cap importació de src/data ni el hook ni el servei dels canvis', async () => {
    const especimen = await compila({ encesa: false, entrada: ESPECIMEN, interns: INTERNS_ESPECIMEN });
    /* La maqueta (Pedra Seca §9): la peça i el seu text hi són, i això és el que decidirà el Mestre. */
    expect(especimen.codi).toContain('function AvisClauCanviada');
    expect(especimen.codi).toContain('He parlat amb {nom}: continua');
    /* La frontera: cap mòdul de dades (port, motor, cripto) i res del hook ni del servei
       (com a codi: la taula del contracte de l'espècimen sí que nomena el hook en prosa). */
    expect(especimen.codi).not.toMatch(/from\s*["'][^"']*[\\/]data[\\/][^"']*["']/);
    for (const rastre of ['function useCanvisDeClau', 'canvisDeClau(', 'acceptaCanviClau(', 'serveiXifratXat', 'getBackendImplementation', 'function useEstatXifratgeDelFil', 'function useNumeroSeguretat', 'E2EE_ACTIU_PER_DEFECTE']) {
      expect(especimen.codi, rastre).not.toContain(rastre);
    }
  }, 60000);
});
