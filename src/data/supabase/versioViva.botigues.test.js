/* Onada R22 · eixa42 (botigues-actualitzacio) · Què veu hui qui té l'app de
   les botigues quan es desplega el kit de l'avís suau (BarraActualitzacioRecomanada).

   Fets mesurats fora d'esta prova (binaris de _builds_de_poble, només lectura):
   · el build de botiga més alt és el 3 (1.1.12+3, AAB/APK i xcarchive del 12-11-2026);
   · el seu JavaScript empaquetat diu VERSIO_CLIENT_NATIU = 2 (la constant minificada
     que segueix LIMIT_DADES_OBERTES val 2 a l'APK i a l'xcarchive), no 3, i no porta
     cap rastre de la barra (cap «sdp-barra-actualitzacio» al paquet);
   · capacitor.config.json servix dist-natiu de dins del binari (cap server.url): un
     desplegament web no canvia mai el codi d'una app instal·lada;
   · producció (supabase_viu/q16a, versio_minima_client) torna només
     { versio_minima: 2, enllac } i cap versio_recomanada.

   Per això l'escala de `versioRecomanada` i de `versioMinima` és la de
   VERSIO_CLIENT_NATIU (el que l'app diu al node), no el número de botiga. Cap
   valor publicat pot superar la versió que ja es pot baixar: una recomanació
   més alta promet una versió que no hi és, i un mínim més alt bloqueja per
   sempre qui té el build 3 (CalActualitzar l'envia a una botiga que li torna
   a donar el mateix build 3). */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { coaccionaVersioViva } from './versioClient.js';
import { estatDeVersio } from '../../natiu/versioMinima.js';

/* La versió de client més alta que es pot baixar hui de les botigues: la que porta
   el JavaScript del build 3. Puja-la NOMÉS quan el Mestre confirme que el build
   nou (VERSIO_CLIENT_NATIU de src/data/contracte.js) és publicat a Google Play i a
   l'App Store, i torna-la a mesurar al binari publicat. */
const VERSIO_CLIENT_PUBLICADA_A_LES_BOTIGUES = 2;

const ARREL = path.resolve(import.meta.dirname, '..', '..', '..');
const FILA_DE_PRODUCCIO = Object.freeze({
  versio_minima: 2,
  enllac: 'https://play.google.com/store/apps/details?id=org.socdepoble.app'
});
const portAmb = (fila) => ({ teCapacitat: () => true, versioMinimaClient: async () => coaccionaVersioViva(fila) });
const versioViva = () => JSON.parse(readFileSync(path.join(ARREL, 'public', 'versio-viva.json'), 'utf8'));

describe('el build 3 de les botigues davant del kit desplegat', () => {
  test('amb la resposta viva de producció, la porta no bloqueja ni recomana res', async () => {
    for (const plataforma of ['android', 'ios']) {
      await expect(estatDeVersio({ plataforma, versio: VERSIO_CLIENT_PUBLICADA_A_LES_BOTIGUES, port: portAmb(FILA_DE_PRODUCCIO) }))
        .resolves.toBeNull();
    }
  });

  test('l’entrada nativa no llig public/versio-viva.json: sense fontViva, el fitxer no arriba a cap app', async () => {
    const font = readFileSync(path.join(ARREL, 'src', 'natiu', 'entrada.jsx'), 'utf8');
    expect(font).not.toMatch(/fontViva|versio-viva/);
    await expect(estatDeVersio({ plataforma: 'android', versio: VERSIO_CLIENT_PUBLICADA_A_LES_BOTIGUES, port: portAmb(FILA_DE_PRODUCCIO) }))
      .resolves.toBeNull();
  });

  test('un mínim per damunt de la versió publicada bloquejaria per sempre el build 3', async () => {
    const estat = await estatDeVersio({
      plataforma: 'android',
      versio: VERSIO_CLIENT_PUBLICADA_A_LES_BOTIGUES,
      port: portAmb({ ...FILA_DE_PRODUCCIO, versio_minima: VERSIO_CLIENT_PUBLICADA_A_LES_BOTIGUES + 1 })
    });
    expect(estat?.estat).toBe('bloquejada');
  });
});

describe('public/versio-viva.json no promet cap versió que no es puga baixar', () => {
  test('versioRecomanada i versioMinima no superen la versió de client publicada', () => {
    const { versioRecomanada, versioMinima } = versioViva();
    expect(Number.isSafeInteger(versioMinima) && versioMinima >= 1).toBe(true);
    expect(Number.isSafeInteger(versioRecomanada) && versioRecomanada >= versioMinima).toBe(true);
    expect(versioMinima).toBeLessThanOrEqual(VERSIO_CLIENT_PUBLICADA_A_LES_BOTIGUES);
    expect(versioRecomanada).toBeLessThanOrEqual(VERSIO_CLIENT_PUBLICADA_A_LES_BOTIGUES);
  });

  /* R24 botigues · Sentinella: el mínim es queda a 2 fins que el build 5 siga a les dues botigues.
     versioMinimaClient.migracio.test.js deixa pujar l'última definició fins a VERSIO_CLIENT_NATIU (5);
     ací, cap migració (de qualsevol nom i ordre) no demana més del que es pot baixar hui. Puja
     VERSIO_CLIENT_PUBLICADA_A_LES_BOTIGUES quan el Mestre ho confirme, i només llavors el mínim. */
  test('cap migració que (re)crea versio_minima_client demana més que la versió de client publicada', () => {
    const carpeta = path.join(ARREL, 'supabase', 'migrations');
    const definicions = readdirSync(carpeta).filter((nom) => nom.endsWith('.sql')).flatMap((nom) => {
      const codi = readFileSync(path.join(carpeta, nom), 'utf8').split('\n').map((linia) => linia.replace(/--.*$/, '')).join('\n');
      return [...codi.matchAll(/create\s+(?:or\s+replace\s+)?function\s+public\.versio_minima_client\s*\([\s\S]*?\$(\w*)\$([\s\S]*?)\$\1\$/gi)]
        .map(([, , cos]) => ({ nom, minims: [...cos.matchAll(/\(\s*'(?:ios|android)'\s*,\s*(\d+)\s*,/g)].map((m) => Number(m[1])) }));
    });
    expect(definicions.map((d) => d.nom)).toContain('2611011510_versio_minima_client.sql');
    for (const { nom, minims } of definicions) {
      expect(minims.length, nom).toBeGreaterThan(0);
      for (const minim of minims) expect(minim, nom).toBeLessThanOrEqual(VERSIO_CLIENT_PUBLICADA_A_LES_BOTIGUES);
    }
  });

  test('el mínim del fitxer és el mateix que el de la migració vigent del servidor', () => {
    const sql = readFileSync(path.join(ARREL, 'supabase', 'migrations', '2611011510_versio_minima_client.sql'), 'utf8');
    const minims = [...sql.matchAll(/\('(ios|android)',\s*(\d+),/g)].map((m) => Number(m[2]));
    expect(minims.length).toBe(2);
    for (const minim of minims) {
      expect(minim).toBe(versioViva().versioMinima);
      expect(minim).toBeLessThanOrEqual(VERSIO_CLIENT_PUBLICADA_A_LES_BOTIGUES);
    }
  });
});
