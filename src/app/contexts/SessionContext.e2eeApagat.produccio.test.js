// @vitest-environment node
/* Gauntlet Loop c1 (261029, troballa «e2ee-apagat-al-tros-entrada») · Amb la
   bandera E2EE apagada (config/xifratXat.js), l'oblit del xat xifrat no ha de
   viatjar al tros d'entrada. Un `try { return E2EE_ACTIU_PER_DEFECTE === true }`
   al voltant de la lectura impedia que Rollup plegara la constant: l'eixida
   arrossegava oblidaXatEnEixir i, darrere, el magatzem de claus (≈ 5,7 kB
   minificats d'un codi que no s'executa mai). Vite compila SessionContext.jsx
   sol en mode producció, amb tota importació externa menys la bandera, que es
   resol de veres perquè Rollup en veja el valor. Control positiu: la mateixa
   compilació amb la bandera encesa (una sonda que reescriu la línia, i que
   llança si no la troba) sí que porta l'oblit del xat. L'oblit de les carpetes
   locals és estàtic i hi ha de ser sempre (privadesa sense xarxa). */
import path from 'node:path';
import { build } from 'vite';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const SESSIO = 'src/app/contexts/SessionContext.jsx';
const BANDERA = /[\\/]config[\\/]xifratXat\.js$/;
const APAGADA = 'export const E2EE_ACTIU_PER_DEFECTE = false;';

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
        lib: { entry: path.join(ARREL, SESSIO), formats: ['es'], fileName: 'sonda' },
        rollupOptions: { external: (id, importador) => Boolean(importador) && !BANDERA.test(id) }
      }
    });
    return (Array.isArray(resultat) ? resultat : [resultat]).flatMap((r) => r.output).map((o) => o.code ?? '').join('\n');
  } finally {
    if (abans === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = abans;
  }
}

describe('amb la bandera E2EE apagada, l’oblit del xat xifrat no entra al paquet de l’eixida', () => {
  test('apagada: cap rastre de l’oblit del xat; encesa: hi és; l’oblit de les carpetes locals, sempre', async () => {
    const apagada = await compila({ encesa: false });
    expect(apagada).toContain('SessionProvider');
    expect(apagada).toContain('oblidaTotesLesCarpetesLocals');
    expect(apagada).not.toContain('oblidaXatEnEixir');
    const encesa = await compila({ encesa: true });
    expect(encesa).toContain('oblidaTotesLesCarpetesLocals');
    expect(encesa).toContain('oblidaXatEnEixir');
  }, 60000);
});
