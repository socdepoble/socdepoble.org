// @vitest-environment node
/* IDEA-61 (T0, prompt 261102_1532) · La porta pura de les tres seccions
   verticals: per a cada àmbit amb secció (vehicle, treball, habitatge) hi ha
   l'entrada a SECTIONS amb la seua ruta, la clau nav.<ambit> als cinc
   diccionaris, el <Route> a App.jsx abans del comodí, la meta al registre
   del detall, la font de la secció, el tipus d'objecte, la visibilitat
   traduïble, la imatge social i el <loc> del sitemap. I el que NO ha de
   canviar: cap section_id nou ni a l'adaptador (content.js) ni a la RLS
   (una fitxa vertical és una fila de 'mur' amb l'àmbit al payload). */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { SECTIONS, SECTION_ORDER } from '../../config/sections.js';
import { tipusDeSeccio } from '../../config/objecteConnectable.js';
import { TIPUS_DE_PAGINA } from '../../config/imatgeSocial.js';
import { SECCIONS_AMB_CONTINGUT_PUBLIC } from '../../components/universal/traduccio/visibilitatTraduible.js';
import { AMBITS, SECTION_ID_PER_AMBIT } from '../../utils/publicacioUniversal.js';
import { DESTINS_CONTROL } from '../control/destinsControl.js';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';

const ARREL = process.cwd();
const llig = (rel) => readFileSync(path.join(ARREL, rel), 'utf8');
const DICCIONARIS = { ca: CA, es: ES, en: EN, eu: EU, gl: GL };
/* Els àmbits del contracte que viuen a 'mur' sense ser el Mur: els que tenen secció pròpia. */
const VERTICALS = AMBITS.filter((ambit) => ambit !== 'mur' && SECTION_ID_PER_AMBIT[ambit] === 'mur');
const CLAUS_DE_SECCIO = ['kicker', 'title', 'subtitle', 'buit', 'error', 'carregant', 'publicar'];
const SECCIONS_DE_L_ADAPTADOR = "const SECCIONS = new Set(['mur', 'mercat', 'events', 'multimedia', 'notes']);";
const SECCIONS_DE_LA_RLS = "section_id in ('mur', 'mercat', 'events', 'multimedia', 'notes')";

describe('les tres verticals, cablejades a tot arreu', () => {
  test('són vehicle, treball i habitatge', () => {
    expect(VERTICALS).toEqual(['vehicle', 'treball', 'habitatge']);
  });

  test('sections.js: una entrada per àmbit, amb path /<ambit> i kind vertical, darrere del Mercat a SECTION_ORDER', () => {
    for (const ambit of VERTICALS) {
      expect(SECTIONS.find((seccio) => seccio.id === ambit), ambit).toMatchObject({ id: ambit, path: `/${ambit}`, kind: 'vertical' });
    }
    const mercat = SECTION_ORDER.indexOf('mercat');
    expect(SECTION_ORDER.slice(mercat, mercat + 1 + VERTICALS.length)).toEqual(['mercat', ...VERTICALS]);
  });

  test.each(Object.keys(DICCIONARIS))('%s: nav.<ambit> i section.<ambit>.* amb text propi, i la clau del Publicar del Mercat', (codi) => {
    const dic = DICCIONARIS[codi];
    for (const ambit of VERTICALS) {
      expect([ambit, typeof dic[`nav.${ambit}`]]).toEqual([ambit, 'string']);
      for (const clau of CLAUS_DE_SECCIO) expect([ambit, clau, (dic[`section.${ambit}.${clau}`] || '').trim() !== '']).toEqual([ambit, clau, true]);
    }
    expect((dic['section.mercat.publicar'] || '').trim() !== '').toBe(true);
  });

  test('App.jsx: un <Route> per àmbit amb SeccioVertical i el seu àmbit, abans del comodí :sectionId/:itemId', () => {
    const app = llig('src/app/App.jsx');
    const comodi = app.indexOf('<Route path=":sectionId/:itemId"');
    expect(comodi).toBeGreaterThan(0);
    for (const ambit of VERTICALS) {
      const ruta = app.indexOf(`<Route path="${ambit}" element={<SeccioVertical ambit="${ambit}" />} />`);
      expect([ambit, ruta > 0, ruta < comodi]).toEqual([ambit, true, true]);
    }
    expect(app).toContain("lazyRoute(() => import('../sections/verticals/SeccioVertical.jsx'))");
  });

  test('el detall: la meta al registre, la font de la secció (mur), el tipus d’objecte, la moderació, la imatge social i la traducció', () => {
    const meta = llig('src/sections/detail/detailSectionMeta.jsx');
    const font = llig('src/sections/detail/elementDeSeccio.js');
    const detall = llig('src/sections/detail/ItemDetailSection.jsx');
    const moderacio = /SECCIONS_AMB_MODERACIO = new Set\(\[([^\]]*)\]\)/.exec(detall)?.[1] ?? '';
    const social = /SECCIONS_AMB_IMATGE_SOCIAL = new Set\(\[([^\]]*)\]\)/.exec(detall)?.[1] ?? '';
    for (const ambit of VERTICALS) {
      expect([ambit, meta.includes(`${ambit}: buildVerticalDetailSectionMeta('${ambit}', { feedPosts, t })`)]).toEqual([ambit, true]);
      expect([ambit, meta.includes(`['${ambit}', '/${ambit}']`)]).toEqual([ambit, true]);
      expect([ambit, font.includes(`['${ambit}', 'mur']`)]).toEqual([ambit, true]);
      expect([ambit, tipusDeSeccio(ambit)]).toEqual([ambit, 'publicacio']);
      expect([ambit, moderacio.includes(`'${ambit}'`), social.includes(`'${ambit}'`)]).toEqual([ambit, true, true]);
      expect([ambit, TIPUS_DE_PAGINA.includes(ambit), SECCIONS_AMB_CONTINGUT_PUBLIC.includes(ambit)]).toEqual([ambit, true, true]);
    }
  });

  test('public/sitemap.xml: cada vertical una sola vegada', () => {
    const locs = [...llig('public/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc);
    for (const ambit of VERTICALS) expect(locs.filter((loc) => loc === `https://socdepoble.org/${ambit}`), ambit).toHaveLength(1);
  });

  test('el Panell de Control: Publicar de cada vertical i del Mercat porta a l’editor amb l’àmbit, i la secció és la seua', () => {
    for (const ambit of [...VERTICALS, 'mercat']) {
      const desti = DESTINS_CONTROL.find((d) => d.id === ambit);
      expect([ambit, desti?.publicar, desti?.seccio]).toEqual([ambit, `/notes?ambit=${ambit}`, `/${ambit}`]);
    }
  });
});

describe('el que no canvia: cap section_id nou', () => {
  test('l’adaptador (content.js) continua amb les cinc seccions de sempre i no nomena cap vertical', () => {
    const adaptador = llig('src/data/supabase/content.js');
    expect(adaptador).toContain(SECCIONS_DE_L_ADAPTADOR);
    for (const ambit of VERTICALS) expect([ambit, adaptador.includes(`'${ambit}'`)]).toEqual([ambit, false]);
  });

  test('la RLS de section_submissions (2609080000) continua amb les cinc seccions, dues vegades, i no nomena cap vertical', () => {
    const migracio = llig('supabase/migrations/2609080000_initial_schema.sql');
    expect(migracio.split(SECCIONS_DE_LA_RLS).length - 1).toBe(2);
    for (const ambit of VERTICALS) expect([ambit, migracio.includes(`'${ambit}'`)]).toEqual([ambit, false]);
  });

  test('el contracte: cada vertical viu a la secció mur', () => {
    for (const ambit of VERTICALS) expect([ambit, SECTION_ID_PER_AMBIT[ambit]]).toEqual([ambit, 'mur']);
  });
});
