// @vitest-environment node
/* La Nevera de Casa · la temporada, la part de dades (perTemporada.js): la
   llista creuada amb el calendari agrícola en un mes fix. Articles de base,
   propis sintètics i productes de botiga presos d'ARTICLES_PRODUCTES (cap nom
   escrit a mà). Els estats esperats es deriven del calendari (estatTemporada)
   o es fixen només en mesos que el calendari diu sense dubte; el bloc del
   final són els invariants del catàleg de base i el calendari, que vivien a
   src/utils/temporada/cobertura.test.js. */
import { describe, expect, test } from 'vitest';
import {
  ARTICLES_BASE, ARTICLES_PRODUCTES, ID_PROPIS, afig, afigPerNom, articlePerId, commuta, creaArticlePropi, estatInicial
} from '../nucli/index.js';
import { TEMPORADES, deTemporadaEn, esDeTemporada, estatTemporada, temporadaDe } from '../../../utils/temporada/index.js';
import {
  GRUPS_TEMPORADA, esParametreMes, grupDeTemporada, grupsDeTemporada, liniesPerTemporada, mesVei, nomDelMes,
  seccionsDeTemporada, suggerimentsDeTemporada, temporadaDArticle, titolDeTemporada
} from './perTemporada.js';

const AGOST = 8;
const GENER = 1;
const base = (id) => ARTICLES_BASE.find((article) => article.id === id);
/* La llista «casa» amb estos articles, en este ordre d'arribada. */
const ambLinies = (ids, estat = estatInicial()) => ids.reduce((acumulat, id) => afig(acumulat, 'casa', id), estat);
const FRESCOS = ARTICLES_PRODUCTES.filter((producte) => producte.categoriaId === 'fruita-verdura');
const DE_TEMPORADA = new Set(GRUPS_TEMPORADA.filter((grup) => grup.deTemporada).map((grup) => grup.id));

describe('el mes a la URL i dit amb paraules', () => {
  test('?mes= només admet 1–12 en la forma canònica', () => {
    for (const valor of ['1', '9', '10', '12']) expect(esParametreMes(valor), valor).toBe(true);
    for (const valor of ['0', '13', '01', '1e1', ' 10', '10.0', '+3', '', 'octubre', null, 10]) expect(esParametreMes(valor), String(valor)).toBe(false);
  });

  test('el mes veí fa la volta de l’any', () => {
    expect(mesVei(12, 1)).toBe(1);
    expect(mesVei(1, -1)).toBe(12);
    expect(mesVei(8, 1)).toBe(9);
    expect(mesVei(8, -1)).toBe(7);
    expect(mesVei(3, 24)).toBe(3);
  });

  test('el nom del mes i el títol del detall, amb «al» i «a l’»', () => {
    expect(nomDelMes(1)).toBe('Gener');
    expect(nomDelMes(10)).toBe('Octubre');
    expect(nomDelMes(13)).toBe('');
    expect(titolDeTemporada(1)).toBe('De temporada al gener');
    expect(titolDeTemporada(3)).toBe('De temporada al març');
    expect(titolDeTemporada(4)).toBe('De temporada a l’abril');
    expect(titolDeTemporada(8)).toBe('De temporada a l’agost');
    expect(titolDeTemporada(10)).toBe('De temporada a l’octubre');
    expect(titolDeTemporada(0)).toBe('De temporada');
  });
});

describe('grupDeTemporada', () => {
  test('els articles de base de fruita i verdura tenen l’estat del calendari', () => {
    expect(grupDeTemporada(base('tomaques'), AGOST)).toBe('plena');
    expect(grupDeTemporada(base('pomes'), AGOST)).toBe('inici');
    expect(grupDeTemporada(base('creilles'), AGOST)).toBe('final');
    expect(grupDeTemporada(base('maduixes'), AGOST)).toBe('fora');
    for (const article of ARTICLES_BASE.filter((a) => a.categoriaId === 'fruita-verdura')) {
      for (let mes = 1; mes <= 12; mes += 1) {
        expect(grupDeTemporada(article, mes), `${article.id} ${mes}`).toBe(estatTemporada(article.nom, mes) ?? 'sense-dada');
      }
    }
  });

  test('el que el calendari no coneix (plàtans) és «sense dada»', () => {
    expect(grupDeTemporada(base('platans'), AGOST)).toBe('sense-dada');
  });

  test('un producte de tot l’any mai no és «fora»: plena, inici o final, com diu el calendari', () => {
    for (let mes = 1; mes <= 12; mes += 1) expect(['plena', 'inici', 'final'], String(mes)).toContain(grupDeTemporada(base('alls'), mes));
  });

  test('només s’etiqueten «Fruita i verdura» i els propis: el nom no diu la categoria', () => {
    const tomaques = { id: 'x', nom: 'Tomaques' };
    expect(grupDeTemporada({ ...tomaques, categoriaId: 'fruita-verdura' }, AGOST)).toBe('plena');
    expect(grupDeTemporada({ ...tomaques, categoriaId: ID_PROPIS }, AGOST)).toBe('plena');
    expect(grupDeTemporada({ ...tomaques, categoriaId: 'congelats' }, AGOST)).toBe('sense-dada');
    expect(grupDeTemporada({ ...tomaques, categoriaId: 'ingredients-especies' }, AGOST)).toBe('sense-dada');
    expect(grupDeTemporada(null, AGOST)).toBe('sense-dada');
  });

  test('un mes que no és mes no etiqueta res', () => {
    expect(grupDeTemporada(base('tomaques'), 0)).toBe('sense-dada');
    expect(grupDeTemporada(base('tomaques'), 13)).toBe('sense-dada');
  });

  test('els productes de botiga de «Fruita i verdura» s’etiqueten pel nom; els d’una altra secció, mai', () => {
    const ambTemporada = FRESCOS.filter((producte) => temporadaDe(producte.nom));
    /* La porta mira de veres: n'hi ha que el calendari coneix i n'hi ha que no. */
    expect(ambTemporada.length).toBeGreaterThan(0);
    expect(ambTemporada.length).toBeLessThan(FRESCOS.length);
    for (const producte of ARTICLES_PRODUCTES) {
      expect(temporadaDArticle(producte), producte.id).toBe(producte.categoriaId === 'fruita-verdura' ? temporadaDe(producte.nom) : null);
      for (let mes = 1; mes <= 12; mes += 1) {
        const esperat = producte.categoriaId === 'fruita-verdura' ? estatTemporada(producte.nom, mes) ?? 'sense-dada' : 'sense-dada';
        expect(grupDeTemporada(producte, mes), `${producte.id} ${mes}`).toBe(esperat);
      }
    }
  });
});

describe('liniesPerTemporada i les seccions', () => {
  test('les línies, en l’ordre de La compra, amb el grup i l’especificació', () => {
    let estat = ambLinies(['llet', 'maduixes', 'tomaques']);
    estat = afig(estat, 'casa', 'tomaques', { especificacio: 'de penjar' });
    expect(liniesPerTemporada(estat, 'casa', AGOST)).toEqual([
      { id: 'maduixes', nom: 'Maduixes', categoriaId: 'fora', secundari: undefined, estat: 'en-colleccio' },
      { id: 'tomaques', nom: 'Tomaques', categoriaId: 'plena', secundari: 'de penjar', estat: 'en-colleccio' },
      { id: 'llet', nom: 'Llet', categoriaId: 'sense-dada', secundari: undefined, estat: 'en-colleccio' }
    ]);
    expect(liniesPerTemporada(estat, 'no-hi-es', AGOST)).toEqual([]);
  });

  test('un propi s’etiqueta pel seu nom', () => {
    const estat = afigPerNom(estatInicial(), 'casa', 'Carxofes');
    const [linia] = liniesPerTemporada(estat, 'casa', 3);
    expect(linia).toMatchObject({ id: 'p-1', nom: 'Carxofes', categoriaId: estatTemporada('Carxofes', 3) });
    expect(linia.categoriaId).toBe('plena');
  });

  test('les cinc seccions en ordre; el filtre «De temporada» amaga Fora i Sense dada', () => {
    expect(grupsDeTemporada().map((g) => [g.id, g.nom, g.ordre, g.visible])).toEqual([
      ['plena', 'Plena temporada', 0, true],
      ['inici', 'Comença la temporada', 1, true],
      ['final', 'S’acaba la temporada', 2, true],
      ['fora', 'Fora de temporada', 3, true],
      ['sense-dada', 'Sense dada de temporada', 4, true]
    ]);
    expect(grupsDeTemporada(true).filter((g) => g.visible).map((g) => g.id)).toEqual(['plena', 'inici', 'final']);
    expect(GRUPS_TEMPORADA.map((g) => g.id).slice(0, 4)).toEqual(['plena', 'inici', 'final', 'fora']);
  });

  test('el detall té les tres seccions de temporada del mig, amb el mateix nom i el mateix ordre', () => {
    expect(seccionsDeTemporada()).toEqual(grupsDeTemporada().slice(0, 3));
    expect(seccionsDeTemporada().map((s) => s.id)).toEqual(['plena', 'inici', 'final']);
  });

  test('cada grup del calendari té secció (cap article va a «Altres»), al mig i al detall', () => {
    const ids = new Set(grupsDeTemporada().map((g) => g.id));
    const estats = new Set(TEMPORADES.flatMap((t) => t.estats));
    for (const estat of estats) expect(ids.has(estat), estat).toBe(true);
    const delDetall = new Set(seccionsDeTemporada().map((s) => s.id));
    for (let mes = 1; mes <= 12; mes += 1) {
      for (const t of deTemporadaEn(mes)) expect(delDetall.has(t.estat), `${t.clau} ${mes}`).toBe(true);
    }
  });
});

describe('suggerimentsDeTemporada', () => {
  test('tot el que és de temporada (plena, inici i final), en l’ordre del calendari, per estat i sense línia de davall', () => {
    const suggeriments = suggerimentsDeTemporada(estatInicial(), 'casa', AGOST);
    const esperades = deTemporadaEn(AGOST);
    expect(new Set(esperades.map((t) => t.estat))).toEqual(new Set(['plena', 'inici', 'final']));
    expect(suggeriments.map((s) => s.categoriaId)).toEqual(esperades.map((t) => t.estat));
    expect(suggeriments.every((s) => s.secundari === undefined)).toBe(true);
    expect(new Set(suggeriments.map((s) => s.id)).size).toBe(suggeriments.length);
    /* El mateix «de temporada» que el calendari i que el filtre del mig. */
    for (let mes = 1; mes <= 12; mes += 1) {
      const noms = suggerimentsDeTemporada(estatInicial(), 'casa', mes).map((s) => s.nom);
      expect(noms.every((nom) => esDeTemporada(nom, mes)), String(mes)).toBe(true);
      expect(noms).toHaveLength(TEMPORADES.filter((t) => DE_TEMPORADA.has(t.estats[mes - 1])).length);
    }
  });

  test('una clau compartida és l’article de base; la resta, un id sintètic sense article', () => {
    const suggeriments = suggerimentsDeTemporada(estatInicial(), 'casa', AGOST);
    expect(suggeriments.find((s) => s.id === 'tomaques')).toMatchObject({ articleId: 'tomaques', nom: 'Tomaques', categoriaId: 'plena', estat: 'normal' });
    expect(suggeriments.find((s) => s.id === 'temporada-alberginies')).toMatchObject({ articleId: null, nom: 'Albergínies', categoriaId: 'plena' });
    /* Les creïlles s'acaben a l'agost i hi són; les maduixes (fora), no. */
    expect(suggeriments.find((s) => s.id === 'creilles')).toMatchObject({ articleId: 'creilles', categoriaId: 'final', estat: 'normal' });
    expect(suggeriments.some((s) => s.id === 'maduixes')).toBe(false);
  });

  test('un propi que el mig reconeix per sinònim també és «a la llista» al detall, i el toc el lleva (cap propi repetit)', () => {
    const estat = afigPerNom(estatInicial(), 'casa', 'Bròcoli');
    expect(estat.propis).toEqual([{ id: 'p-1', nom: 'Bròcoli' }]);
    expect(liniesPerTemporada(estat, 'casa', GENER)[0]).toMatchObject({ id: 'p-1', categoriaId: 'plena' });
    const broquil = suggerimentsDeTemporada(estat, 'casa', GENER).find((s) => s.id === 'temporada-broquil');
    expect(broquil).toMatchObject({ articleId: 'p-1', nom: 'Bròquil', estat: 'en-colleccio' });
    /* El toc del detall fa commuta sobre articleId: la línia ix i no es crea cap article. */
    const despres = commuta(estat, 'casa', broquil.articleId);
    expect(despres.llistes[0].linies).toEqual([]);
    expect(despres.propis).toEqual(estat.propis);
    expect(suggerimentsDeTemporada(despres, 'casa', GENER).find((s) => s.id === 'temporada-broquil')).toMatchObject({ articleId: null, estat: 'normal' });
  });

  test('un producte de botiga fresc a la llista fa «a la llista» la rajola del seu producte del calendari', () => {
    const producte = FRESCOS.find((p) => estatTemporada(p.nom, AGOST) === 'plena');
    expect(producte, 'cap producte de botiga en plena temporada a l’agost').toBeTruthy();
    const clau = temporadaDe(producte.nom).clau;
    const rajola = suggerimentsDeTemporada(ambLinies([producte.id]), 'casa', AGOST)
      .find((s, i) => deTemporadaEn(AGOST)[i].clau === clau);
    expect(rajola).toMatchObject({ articleId: producte.id, estat: 'en-colleccio' });
    expect(rajola.id).not.toBe(producte.id);
  });

  test('les dues columnes diuen el mateix: el que el mig etiqueta de temporada, el detall ho marca a la llista, i a l’inrevés', () => {
    /* Tota la fruita i verdura de base i de botiga, i dos propis que només casen per sinònim. */
    const ids = [...ARTICLES_BASE.filter((a) => a.categoriaId === 'fruita-verdura').map((a) => a.id), ...FRESCOS.map((p) => p.id)];
    const estat = ['Bròcoli', 'Carxofa'].reduce((acumulat, nom) => afigPerNom(acumulat, 'casa', nom), ambLinies(ids));
    expect(estat.llistes[0].linies).toHaveLength(ids.length + 2);
    for (let mes = 1; mes <= 12; mes += 1) {
      const delMig = new Set(liniesPerTemporada(estat, 'casa', mes)
        .filter((linia) => DE_TEMPORADA.has(linia.categoriaId))
        .map((linia) => temporadaDArticle(articlePerId(estat, linia.id)).clau));
      const delDetall = new Set(suggerimentsDeTemporada(estat, 'casa', mes)
        .map((suggeriment, i) => [suggeriment.estat, deTemporadaEn(mes)[i].clau])
        .filter(([estatRajola]) => estatRajola === 'en-colleccio').map(([, clau]) => clau));
      expect(delMig.size, String(mes)).toBeGreaterThan(0);
      expect([...delDetall].sort(), String(mes)).toEqual([...delMig].sort());
    }
  });

  test('els que són a la llista porten «en-colleccio»; un propi amb el nom del calendari és l’article', () => {
    let estat = ambLinies(['tomaques']);
    estat = creaArticlePropi(estat, 'Albergínies');
    const abans = suggerimentsDeTemporada(estat, 'casa', AGOST);
    expect(abans.find((s) => s.id === 'tomaques').estat).toBe('en-colleccio');
    expect(abans.find((s) => s.id === 'p-1')).toMatchObject({ articleId: 'p-1', nom: 'Albergínies', estat: 'normal' });
    expect(abans.some((s) => s.id === 'temporada-alberginies')).toBe(false);
    const despres = suggerimentsDeTemporada(afig(estat, 'casa', 'p-1'), 'casa', AGOST);
    expect(despres.find((s) => s.id === 'p-1').estat).toBe('en-colleccio');
  });

  test('un mes que no és mes no proposa res', () => {
    expect(suggerimentsDeTemporada(estatInicial(), 'casa', 13)).toEqual([]);
  });
});

/* Els articles de base són sintètics: invariants, cap xifra. Una altra mà pot
   editar el catàleg sense que esta prova haja de canviar. */
describe('el catàleg de base i el calendari', () => {
  const claus = new Set(TEMPORADES.map((t) => t.clau));

  test('un id de la Nevera que també és clau del calendari nomena el mateix producte', () => {
    const compartits = ARTICLES_BASE.filter((a) => claus.has(a.id));
    expect(compartits.length).toBeGreaterThan(0);
    expect(compartits.filter((a) => temporadaDe(a.nom)?.clau !== a.id).map((a) => a.id)).toEqual([]);
  });

  test('cap article de base de fora de fruita i verdura té temporada (tomaca fregida, creïlles de bossa, pésols congelats…)', () => {
    const altres = ARTICLES_BASE.filter((a) => a.categoriaId !== 'fruita-verdura');
    expect(altres.length).toBeGreaterThan(0);
    expect(altres.filter((a) => temporadaDe(a.nom)).map((a) => a.id)).toEqual([]);
  });

  test('cada article de base de fruita i verdura amb temporada ix als suggeriments com a ell mateix, mai com a sintètic', () => {
    const ambTemporada = ARTICLES_BASE.filter((a) => a.categoriaId === 'fruita-verdura' && temporadaDe(a.nom));
    expect(ambTemporada.length).toBeGreaterThan(0);
    for (let mes = 1; mes <= 12; mes += 1) {
      const suggeriments = suggerimentsDeTemporada(estatInicial(), 'casa', mes);
      for (const article of ambTemporada) {
        expect(suggeriments.some((s) => s.id === `temporada-${temporadaDe(article.nom).clau}`), `${article.id} ${mes}`).toBe(false);
      }
    }
  });
});
