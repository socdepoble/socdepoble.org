// @vitest-environment node
/* IDEA-48 (estat previ a F7; pla 261101_1246, T7 · S6) · Prova de deriva
   (disseny E2EE §13, IP-D1): amb la bandera E2EE apagada (config/xifratXat.js),
   el paquet de producció de Privacitat i dades no porta el bloc «Persones de
   confiança» ni cap dels seus textos. Vite compila DetallPrivacitat.jsx en mode
   producció com SessionContext.e2eeApagat.produccio.test.js: tota importació
   externa menys la bandera (que es resol de veres perquè Rollup en veja el
   valor) i les peces noves del bloc, que entren a la compilació per a vore si el
   plegat se les emporta. Control positiu: amb la bandera encesa (una sonda que
   reescriu la línia, i que llança si no la troba) hi són, en un tros a part. */
import path from 'node:path';
import { build } from 'vite';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const PRIVACITAT = 'src/sections/profile/DetallPrivacitat.jsx';
const BANDERA = /[\\/]config[\\/]xifratXat\.js$/;
const PECES_BLOC = /[\\/]sections[\\/]profile[\\/](BlocPersonesConfianca\.jsx|CosPersonesConfianca\.jsx|personesConfianca\.js)$/;
const APAGADA = 'export const E2EE_ACTIU_PER_DEFECTE = false;';

const absolut = (id, importador) => (id.startsWith('.') && importador ? path.resolve(path.dirname(importador), id) : id);

async function compila({ encesa }) {
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
        lib: { entry: path.join(ARREL, PRIVACITAT), formats: ['es'], fileName: 'sonda' },
        rollupOptions: {
          external: (id, importador) => {
            if (!importador) return false;
            const cami = absolut(id, importador);
            return !BANDERA.test(cami) && !PECES_BLOC.test(cami);
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

describe('amb la bandera E2EE apagada, Privacitat i dades no porta «Persones de confiança»', () => {
  test('apagada: ni el bloc ni els textos, un sol tros; encesa: hi són, en un tros a part', async () => {
    const apagada = await compila({ encesa: false });
    expect(apagada.codi).toContain('DetallPrivacitat');
    for (const rastre of ['BlocPersonesConfianca', 'CosPersonesConfianca', 'contactesVerificats', 'section.perfil.privacitat.confianca', 'Persones de confiança']) {
      expect(apagada.codi, rastre).not.toContain(rastre);
    }
    expect(apagada.trossos).toBe(1);

    const encesa = await compila({ encesa: true });
    expect(encesa.codi).toContain('contactesVerificats');
    expect(encesa.codi).toContain('section.perfil.privacitat.confianca.');
    expect(encesa.codi).toContain('Persones de confiança');
    expect(encesa.trossos).toBeGreaterThan(1);
  }, 60000);
});
