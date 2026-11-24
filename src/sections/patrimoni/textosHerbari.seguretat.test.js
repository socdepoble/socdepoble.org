import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { extreuBlocsLecturaVeu } from '../../components/universal/veu/lectorPaginaVeu.js';
import { ESPECIES_HERBARI_LA_TORRE_117 as fitxes, construeixLocucioEspecieHerbari } from '../../data/patrimoni/herbariLaTorre117.js';
import FitxaHerbari from './FitxaHerbari.jsx';
import { TEXTOS_HERBARI } from './textosHerbari.js';

afterEach(cleanup);

/* IDEA-110 + IDEA-337 · L’avís de la fitxa no és una llista exhaustiva ni un aval.
 * Una frase per idioma i per cas; la lectura oral s’unifica al 100 % en «🔊 Escolta la IAIA»
 * (`extreuBlocsLecturaVeu`) garantint que cap de les 117 fitxes queda muda ni omet l’avís. */
const CASOS = {
  ca: { no_avalua: 'no acredita innocuïtat', consell: 'no mengeu cap planta sense consell expert', advertida: 'No en mengeu cap part' },
  es: { no_avalua: 'no acredita inocuidad', consell: 'no comáis ninguna planta sin consejo experto', advertida: 'No comáis ninguna parte' },
  en: { no_avalua: 'does not establish safety', consell: 'do not eat any plant without expert advice', advertida: 'Do not eat any part' },
  eu: { no_avalua: 'ez du segurtasuna egiaztatzen', consell: 'ez jan landarerik aditu baten aholkurik gabe', advertida: 'Ez jan inolako zatirik' },
  gl: { no_avalua: 'non acredita inocuidade', consell: 'non comas ningunha planta sen consello experto', advertida: 'Non comas ningunha parte' },
};

describe('IDEA-110 + IDEA-337 · l’avís de la fitxa i la lectura oral unificada porten consell de protecció als 5 idiomes', () => {
  it('cada idioma té la frase de no-aval i el consell exactes (desconeguda), la instrucció (advertida) i zero claus fantasma de segon botó de veu', () => {
    expect(Object.keys(TEXTOS_HERBARI).sort()).toEqual(Object.keys(CASOS).sort());
    for (const [lang, cas] of Object.entries(CASOS)) {
      const t = TEXTOS_HERBARI[lang];
      expect(t.toxicitatDesconeguda, lang).toContain(cas.no_avalua);
      expect(t.toxicitatDesconeguda, lang).toContain(cas.consell);
      expect(t.toxicitatAdvertida, lang).toContain(cas.advertida);
      expect(t.toxicitatAdvertida, lang).not.toBe(t.toxicitatDesconeguda);
      expect(t).not.toHaveProperty('veu');
      expect(t).not.toHaveProperty('veuAbsent');
    }
  });

  it('la locució estructural i l’extracció oral d’«Escolta la IAIA» porten el mateix avís de seguretat en les 117 fitxes: cap fitxa és muda', () => {
    for (const f of fitxes) {
      const veu = construeixLocucioEspecieHerbari(f);
      if (f.esToxica === true) {
        expect(veu, f.id).toContain('No en mengeu cap part');
      } else {
        expect(veu, f.id).toContain('no acredita innocuïtat');
        expect(veu, f.id).toContain('no mengeu cap planta sense consell expert');
      }

      const { container, unmount } = render(createElement(FitxaHerbari, { especie: f, textos: TEXTOS_HERBARI.ca }));
      const textLlegit = extreuBlocsLecturaVeu({ cos: container }).map((b) => b.text).join(' ');
      expect(textLlegit, f.id).toContain(f.nomValencia);
      expect(textLlegit, f.id).toContain(f.nomCientific);
      if (f.esToxica === true) {
        expect(textLlegit, f.id).toContain('No en mengeu cap part');
      } else {
        expect(textLlegit, f.id).toContain('no acredita innocuïtat');
        expect(textLlegit, f.id).toContain('no mengeu cap planta sense consell expert');
      }
      unmount();
    }
    expect(construeixLocucioEspecieHerbari(fitxes.find((f) => f.slug === 'ruda'))).toContain('Aliment');
  });

  it.each(Object.entries(CASOS))(
    'en %s, «Escolta la IAIA» llig l’avís de toxicitat tant en espècies amb advertència com sense avaluar',
    (lang, cas) => {
      const toxica = fitxes.find((f) => f.esToxica === true);
      const normal = fitxes.find((f) => f.esToxica !== true);

      const vToxica = render(createElement(FitxaHerbari, { especie: toxica, textos: TEXTOS_HERBARI[lang] }));
      const llegitToxica = extreuBlocsLecturaVeu({ cos: vToxica.container }).map((b) => b.text).join(' ');
      expect(llegitToxica).toContain(cas.advertida);
      vToxica.unmount();

      const vNormal = render(createElement(FitxaHerbari, { especie: normal, textos: TEXTOS_HERBARI[lang] }));
      const llegitNormal = extreuBlocsLecturaVeu({ cos: vNormal.container }).map((b) => b.text).join(' ');
      expect(llegitNormal).toContain(cas.no_avalua);
      expect(llegitNormal).toContain(cas.consell);
      vNormal.unmount();
    }
  );
});
