/* Plataforma d'Apps Enxufables · T5 (P1-07, 261024) · el servei de notícies que la plataforma
   dona a una app: la font (fontServeis.js, que només importa RutaApps.jsx), el context
   (ContextApp.jsx · ServeisAppContext) i el ganxo pur de l'API pública (serveiNoticies.js ·
   useServeiNoticies, nucli 1.3.0). Cap xarxa: el client es crea amb un fetch que no es crida,
   i el Lector de veres llig un servei fals que servix els feeds de la llavor. */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { creaCanalFals, creaIdbFals, creaLocksFals } from '../../utils/__fixtures__/navegadorFals.js';
import AppLector from '../lector/AppLector.jsx';
import { CATEGORIES_LLAVOR, FONTS_LLAVOR } from '../lector/llavor/cataleg.js';
import { creaMagatzemLector } from '../lector/magatzem.js';
import manifestLector from '../lector/manifest.js';
import { ENTORN_OBERT, muntaPlataforma } from './__fixtures__/munta.jsx';
import { manifestDeProva } from './__fixtures__/manifests.js';
import { ProveidorApp } from './ContextApp.jsx';
import { PORTES_DEL_NUCLI, VERSIO_NUCLI } from './contracteNucli.js';
import { APPS_AMB_NOTICIES, origenDelBackend, serveisDe } from './fontServeis.js';
import { useServeiNoticies } from './index.js';
import { validaManifestApp } from './manifestApp.js';
import { creaRegistre } from './registreApps.js';

const ARREL = process.cwd();
const llig = (ruta) => readFileSync(path.join(ARREL, ruta), 'utf8');
const ORIGEN = 'https://abcdefghijklmnop.supabase.co';
const CAPA = Object.freeze({ supabaseUrl: `${ORIGEN}/`, dataMode: 'remote' });
const LECTOR = validaManifestApp(manifestLector).manifest;
const SERVEI_FALS = Object.freeze({ fonts: async () => ({ categories: [], fonts: [] }), feed: async () => null });

function Sonda() {
  const servei = useServeiNoticies();
  return <output data-testid="servei">{servei ? 'amb servei' : 'sense servei'}</output>;
}

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

describe('useServeiNoticies (l’API pública)', () => {
  test('fora de ProveidorApp, null i sense llançar', () => {
    render(<Sonda />);
    expect(screen.getByTestId('servei').textContent).toBe('sense servei');
  });

  test('amb ProveidorApp: el servei que porta, o null si no en porta o no en té la forma', () => {
    const { rerender } = render(<ProveidorApp manifest={LECTOR}><Sonda /></ProveidorApp>);
    expect(screen.getByTestId('servei').textContent).toBe('sense servei');
    rerender(<ProveidorApp manifest={LECTOR} serveis={{ noticies: SERVEI_FALS }}><Sonda /></ProveidorApp>);
    expect(screen.getByTestId('servei').textContent).toBe('amb servei');
    for (const dolent of [{ noticies: { fonts: () => {} } }, { noticies: 'servei' }, 'serveis', []]) {
      rerender(<ProveidorApp manifest={LECTOR} serveis={dolent}><Sonda /></ProveidorApp>);
      expect(screen.getByTestId('servei').textContent).toBe('sense servei');
    }
  });

  test('és una porta del nucli 1.3.0', () => {
    expect(VERSIO_NUCLI).toBe('1.3.0');
    expect(PORTES_DEL_NUCLI.find((porta) => porta.clau === 'plataforma').noms).toContain('useServeiNoticies');
  });
});

describe('serveisDe (fontServeis.js): a qui i amb quin origen', () => {
  const crea = vi.fn(({ apiOrigin }) => ({ fonts: async () => ({}), feed: async () => null, apiOrigin }));

  test('al Lector (intern i públic), amb l’origen del backend de la capa del paquet', () => {
    expect(APPS_AMB_NOTICIES).toEqual(['lector']);
    const serveis = serveisDe(LECTOR, { capa: CAPA, crea });
    expect(serveis.noticies.apiOrigin).toBe(ORIGEN);
    expect(crea).toHaveBeenLastCalledWith({ apiOrigin: ORIGEN });
    expect(Object.isFrozen(serveis)).toBe(true);
  });

  test('el client de veres es crea sense fer cap petició', () => {
    const fetchImpl = vi.fn();
    vi.stubGlobal('fetch', fetchImpl);
    try {
      const { noticies } = serveisDe(LECTOR, { capa: CAPA });
      expect(typeof noticies.fonts).toBe('function');
      expect(typeof noticies.feed).toBe('function');
      expect(fetchImpl).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  /* 261024 Lector (Gemini G2-03) · L'estat del servei és d'una sessió de pàgina: el client de veres
     es crea una vegada per origen, i cada muntatge del Lector rep el mateix. */
  test('el client de veres és el mateix a cada muntatge (un per origen i sessió), amb estat, imatge i vídeo', () => {
    const una = serveisDe(LECTOR, { capa: CAPA });
    const altra = serveisDe(LECTOR, { capa: CAPA });
    expect(altra.noticies).toBe(una.noticies);
    for (const metode of ['estat', 'imatge', 'video', 'feedPersonal']) expect(typeof una.noticies[metode], metode).toBe('function');
    /* Un `crea` de prova no es guarda: cada crida, el seu. */
    expect(serveisDe(LECTOR, { capa: CAPA, crea }).noticies).not.toBe(serveisDe(LECTOR, { capa: CAPA, crea }).noticies);
    expect(crea).toHaveBeenLastCalledWith({ apiOrigin: ORIGEN });
  });

  test('a ningú més: una altra app, un mòdul, una externa o una app que no és pública', () => {
    const modul = { ...LECTOR, origen: 'modul' };
    const externa = { ...LECTOR, origen: 'externa' };
    const privada = { ...LECTOR, permisos: { veure: 'sessio' } };
    const altra = validaManifestApp(manifestDeProva()).manifest;
    for (const manifest of [modul, externa, privada, altra, null]) expect(serveisDe(manifest, { capa: CAPA, crea })).toBeNull();
  });

  test('sense backend remot o amb un origen que no és https, cap; si el client no es pot crear, cap', () => {
    expect(serveisDe(LECTOR, { capa: { ...CAPA, dataMode: 'seed' }, crea })).toBeNull();
    expect(serveisDe(LECTOR, { capa: { ...CAPA, dataMode: 'local' }, crea })).toBeNull();
    for (const supabaseUrl of ['http://localhost:54321', '', 'no és una adreça', 'https://usuari:x@abcdefghijklmnop.supabase.co']) {
      expect(serveisDe(LECTOR, { capa: { supabaseUrl }, crea }), supabaseUrl).toBeNull();
    }
    expect(serveisDe(LECTOR, { capa: CAPA, crea: () => { throw new Error('no'); } })).toBeNull();
    expect(origenDelBackend({ supabaseUrl: `${ORIGEN}/rest/v1/` })).toBe(ORIGEN);
  });

  test('amb l’entorn de proves, els serveis són els seus substituts i cap més', () => {
    expect(serveisDe(LECTOR, { substituts: { noticies: SERVEI_FALS }, capa: CAPA, crea })?.noticies).toBe(SERVEI_FALS);
    expect(serveisDe(LECTOR, { substituts: null, capa: CAPA, crea })).toBeNull();
    expect(serveisDe({ ...LECTOR, origen: 'modul' }, { substituts: { noticies: SERVEI_FALS } })).toBeNull();
  });
});

describe('de RutaApps al Lector: el servei arriba a l’app de veres', () => {
  const XML = Object.fromEntries(FONTS_LLAVOR.map((font) => [font.id, font.xml]));
  const CATALEG = Object.freeze({
    categories: CATEGORIES_LLAVOR,
    fonts: FONTS_LLAVOR.map(({ id, nom, categoriaId, descripcio }) => ({ id, nom, categoriaId, descripcio, lloc: null }))
  });

  function registreDelLector() {
    const idb = creaIdbFals();
    const magatzem = creaMagatzemLector({ idb: idb.idb, navegador: { locks: creaLocksFals() }, Canal: creaCanalFals().Canal });
    /* Sense prop `font`: el port ha d'eixir del servei de la plataforma. */
    const App = () => <AppLector magatzem={magatzem} />;
    return { magatzem, registre: creaRegistre({ internes: [{ ...manifestLector, carrega: () => Promise.resolve({ default: App }) }] }) };
  }

  test('amb el servei a l’entorn, el Lector munta les notícies de les fonts; sense, l’estat buit de sempre', async () => {
    vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
    const servei = { fonts: vi.fn(async () => CATALEG), feed: vi.fn(async (id) => ({ font: id, xml: XML[id], obtingut: null, obsoleta: false })) };
    const amb = registreDelLector();
    try {
      muntaPlataforma('/app/lector/noticies/festes', { registre: amb.registre, entorn: { ...ENTORN_OBERT, produccio: false, serveis: { noticies: servei } } });
      await waitFor(() => expect(document.querySelectorAll('#app-grid-list button.sdp-gestor-fitxa')).toHaveLength(3));
      expect(servei.feed.mock.calls.map(([id]) => id)).toEqual(FONTS_LLAVOR.map((font) => font.id));
      cleanup();
      const sense = registreDelLector();
      muntaPlataforma('/app/lector/noticies/festes', { registre: sense.registre, entorn: { ...ENTORN_OBERT, produccio: false } });
      expect(await screen.findByText('Encara no hi ha cap font connectada')).toBeTruthy();
      sense.magatzem.tanca();
    } finally {
      amb.magatzem.tanca();
      vi.unstubAllGlobals();
    }
  });
});

describe('la frontera: l’app no veu mai d’on ve el servei', () => {
  /* Els imports relatius d'un fitxer (sense els comentaris), resolts des de l'arrel al fitxer que
     existix (amb extensió o index.js). */
  function importsDe(ruta) {
    const codi = llig(ruta).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    return [...codi.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*)['"](\.[^'"]+)['"]/g)].map(([, especificador]) => {
      const base = path.posix.normalize(path.posix.join(path.posix.dirname(ruta), especificador.replace(/\?.*$/, '')));
      return [base, `${base}.js`, `${base}.jsx`, `${base}/index.js`].find((candidat) => /\.jsx?$/.test(candidat) && existsSync(path.join(ARREL, candidat)));
    }).filter(Boolean);
  }
  function clausura(inici) {
    const vistes = new Set([inici]);
    const pendents = [inici];
    while (pendents.length) {
      for (const desti of importsDe(pendents.pop())) {
        if (!vistes.has(desti) && /\.jsx?$/.test(desti)) {
          vistes.add(desti);
          pendents.push(desti);
        }
      }
    }
    return vistes;
  }

  test('l’API pública (index.js) no arriba a fontServeis.js, al client, a la capa del paquet ni a cap dada', () => {
    const delAPI = [...clausura('src/apps/plataforma/index.js')];
    expect(delAPI).toContain('src/apps/plataforma/serveiNoticies.js');
    expect(delAPI).not.toContain('src/apps/plataforma/fontServeis.js');
    /* La clausura ja porta algunes dades pures d'abans (la llavor d'identitats…): ací es mira el
       que el servei de notícies podria arrossegar, el client, la Frontissa i la capa del paquet. */
    expect(delAPI.filter((ruta) => /^src\/data\/adaptadors\/|^src\/config\/capaDelPaquet\.js$/.test(ruta))).toEqual([]);
    /* El ganxo només importa React i el context de l'app. */
    expect(llig('src/apps/plataforma/serveiNoticies.js').match(/from\s+['"][^'"]+['"]/g)).toEqual(["from 'react'", "from './ContextApp.jsx'"]);
  });

  test('fontServeis.js només l’importa RutaApps.jsx', () => {
    const fitxers = [];
    const recorre = (directori) => {
      for (const nom of readdirSync(path.join(ARREL, directori), { withFileTypes: true })) {
        const ruta = `${directori}/${nom.name}`;
        if (nom.isDirectory()) recorre(ruta);
        else if (/\.[cm]?jsx?$/.test(nom.name) && !/\.test\.[cm]?jsx?$/.test(nom.name)) fitxers.push(ruta);
      }
    };
    recorre('src');
    const importadors = fitxers.filter((ruta) => /from\s+['"][^'"]*\/fontServeis(?:\.js)?['"]/.test(llig(ruta)));
    expect(importadors).toEqual(['src/apps/plataforma/RutaApps.jsx']);
  });
});
