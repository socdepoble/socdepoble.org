/* Fase 0 de les apps El Bar i Salut (Pedra Seca §9) · els espècimens de
   Rajola, TeclatNumeric, LiniaDelTemps i Histograma pinten el component de
   veres, sense h1 ni style=, i sense cap avís de React a la consola.
   Ordre del Mestre, 261006 (prompt 261006_1215) · i el del TPV universal,
   amb el Mode Bar (també sense connexió) i el Mode Rebost de la mateixa peça.
   Ordre del Mestre, 261006 («vital per a la Carta Digital i el TPV») · i el de
   les icones d'al·lèrgens, que el TPV pinta a la cantonada de la rajola. */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from '../../../../app/contexts/RouterContext.jsx';
import { CATALOG_ITEMS } from '../manifest.js';
import { CATALOG_DETAIL_LOADERS } from '../detailRegistry.jsx';
import { REGISTRE } from '../registre.js';
import EspecimenRajola from './EspecimenRajola.jsx';
import EspecimenTeclatNumeric from './EspecimenTeclatNumeric.jsx';
import EspecimenLiniaDelTemps from './EspecimenLiniaDelTemps.jsx';
import EspecimenHistograma from './EspecimenHistograma.jsx';
import EspecimenUniversalTPV from './EspecimenUniversalTPV.jsx';
import EspecimenIconesAlergens from './EspecimenIconesAlergens.jsx';

const pla = (text) => text.replace(/[^\S\n\r\t ]/g, ' ');
const pinta = (Especimen) => render(<MemoryRouter><Especimen /></MemoryRouter>).container;

let errors;
beforeEach(() => { errors = vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => {
  const crides = errors.mock.calls.map((c) => String(c[0]).slice(0, 200));
  errors.mockRestore();
  cleanup();
  expect(crides).toEqual([]);
});

describe('el catàleg les coneix', () => {
  it('registre «viu», ítem del manifest i carregador per a cada peça', () => {
    const esperades = [
      ['Rajola', 'formularis-rajola', 'formularis/rajola'],
      ['TeclatNumeric', 'formularis-teclat-numeric', 'formularis/teclat-numeric'],
      ['LiniaDelTemps', 'fonaments-linia-del-temps', 'fonaments/linia-del-temps'],
      ['Histograma', 'fonaments-histograma', 'fonaments/histograma'],
      ['UniversalTPV', 'estructura-universal-tpv', 'estructura/universal-tpv'],
      ['IconesAlergens', 'fonaments-icones-alergens', 'fonaments/icones-alergens']
    ];
    for (const [nom, item, clau] of esperades) {
      expect(REGISTRE.find((e) => e.nom === nom), nom).toMatchObject({ estat: 'viu' });
      expect(REGISTRE.find((e) => e.nom === nom).fora, nom).toBeUndefined();
      expect(CATALOG_ITEMS.find((i) => i.id === item), item).toMatchObject({ detailKey: clau, status: 'viu' });
      expect(CATALOG_DETAIL_LOADERS[clau], clau).toBeTruthy();
    }
  });
});

describe('els espècimens', () => {
  it.each([
    ['Rajola', EspecimenRajola, '.sdp-rajola'],
    ['TeclatNumeric', EspecimenTeclatNumeric, '.sdp-teclat'],
    ['LiniaDelTemps', EspecimenLiniaDelTemps, '.sdp-linia-temps'],
    ['Histograma', EspecimenHistograma, '.sdp-histograma'],
    ['UniversalTPV', EspecimenUniversalTPV, '.sdp-tpv-marc > section.sdp-tpv'],
    ['IconesAlergens', EspecimenIconesAlergens, '.sdp-alergens']
  ])('%s: el component real, la fitxa sencera, sense h1 ni style=', (nom, Especimen, classe) => {
    const arrel = pinta(Especimen);
    expect(arrel.querySelector(classe), nom).not.toBeNull();
    expect(arrel.querySelector('h1')).toBeNull();
    expect(arrel.querySelector('[style]')).toBeNull();
    expect(arrel.querySelector('.sdp-especimen__nom').textContent).toBe(nom);
    expect(arrel.querySelector('table caption').textContent).toBe('Contracte');
  });

  it('Rajola: cada toc afig a la comanda de mostra; la categoria triada porta aria-pressed', () => {
    pinta(EspecimenRajola);
    const productes = screen.getByRole('list', { name: 'Productes de mostra' });
    fireEvent.click(within(productes).getByRole('button', { name: /^Cafè 1,20/ }));
    fireEvent.click(within(productes).getByRole('button', { name: /^Cafè 1,20/ }));
    expect(pla(screen.getByRole('status').textContent)).toBe('Comanda de mostra: 2 × Cafè · 2,40 €');
    expect(within(productes).getByRole('button', { name: 'Croissant Esgotat' }).disabled).toBe(true);
    const categories = screen.getByRole('list', { name: 'Categories de mostra' });
    fireEvent.click(within(categories).getByRole('button', { name: 'Begudes' }));
    expect(within(categories).getByRole('button', { name: 'Begudes' }).getAttribute('aria-pressed')).toBe('true');
    expect(within(categories).getByRole('button', { name: 'Cafès' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('TeclatNumeric: torna enters i Cobra diu l’enter acceptat', () => {
    const arrel = pinta(EspecimenTeclatNumeric);
    /* Els visors (<output>) també són role="status": l'avís de l'espècimen és el <p>. */
    const avis = () => pla(arrel.querySelector('p[role="status"]').textContent);
    const efectiu = screen.getByRole('group', { name: 'Efectiu lliurat' });
    for (const xifra of ['2', '0', '0', '0']) fireEvent.click(within(efectiu).getByRole('button', { name: xifra }));
    expect(avis()).toBe('Torna 2000 cèntims (20,00 €) i 250 ml.');
    fireEvent.click(within(efectiu).getByRole('button', { name: 'Cobra' }));
    expect(avis()).toBe('Has cobrat 20,00 €: el teclat ha tornat l’enter 2000.');
  });

  it('LiniaDelTemps: triar un apunt el marca i ho diu; el buit pinta l’EstatBuit', () => {
    const arrel = pinta(EspecimenLiniaDelTemps);
    fireEvent.click(screen.getByRole('button', { name: /^08:15: Tiquet cobrat/ }));
    expect(screen.getByRole('button', { name: /^08:15: Tiquet cobrat/ }).getAttribute('aria-current')).toBe('true');
    expect(screen.getByRole('status').textContent).toBe('Apunt obert: Tiquet cobrat.');
    expect(screen.getByText('Encara no hi ha cap apunt en este torn.')).toBeTruthy();
    expect(arrel.querySelectorAll('ol.sdp-linia-temps')).toHaveLength(2);
  });

  it('Histograma: dues figures amb nom, 24 i 7 barres, una destacada a cadascuna', () => {
    pinta(EspecimenHistograma);
    const hores = screen.getByRole('figure', { name: 'Per hora del dia (mostra)' });
    const setmana = screen.getByRole('figure', { name: 'Per dia de la setmana (mostra)' });
    expect(within(hores).getAllByRole('listitem')).toHaveLength(24);
    expect(within(setmana).getAllByRole('listitem')).toHaveLength(7);
    expect(hores.querySelectorAll('.sdp-histograma__columna--destacada')).toHaveLength(1);
    expect(setmana.querySelector('.sdp-histograma__columna--destacada .sdp-nomes-lector').textContent).toBe('dissabte: 22 apunts');
  });

  /* Ordre del Mestre, 261006 (prompt 261006_1215) · el TPV universal: la mateixa
     peça cobra al Bar i omple la llista del Rebost. */
  it('UniversalTPV · Mode Bar: el toc afig, la variant és un toc i tanca, els tiquets oberts canvien el tiquet i Cobra el buida', () => {
    pinta(EspecimenUniversalTPV);
    const bar = screen.getByRole('group', { name: 'Mode Bar' });
    /* L'avís de l'espècimen, no el missatge d'estat de la peça (que és dins del TPV). */
    const avis = () => pla(bar.querySelector(':scope > p[role="status"]').textContent);
    const tpv = within(bar).getByRole('region', { name: 'TPV de mostra · Mode Bar' });
    /* El títol diu quin tiquet és, i el comptador, les unitats (2 tallats i 1 torrada). */
    expect(within(tpv).getByRole('region', { name: 'Tiquet Barra 3' })).toBeTruthy();
    expect(within(tpv).getByRole('status').textContent).toBe('Tiquet Barra: 3 unitats');
    const tallat = within(tpv).getByRole('button', { name: /^Tallat, 1,30.€, A la comanda, conté llet$/ });
    /* aria-describedby: la insígnia i, amb onDetall, la pista. */
    const [idInsignia] = tallat.getAttribute('aria-describedby').split(' ');
    expect(document.getElementById(idInsignia).querySelector('.sdp-nomes-lector').textContent).toBe('2 unitats al tiquet');
    expect(within(tpv).getByRole('button', { name: /^Croissant, Esgotat/ }).disabled).toBe(true);

    fireEvent.click(within(tpv).getByRole('button', { name: /^Cafè sol, / }));
    expect(avis()).toBe('Una unitat més: Cafè sol.');
    expect(within(tpv).getByRole('region', { name: 'Tiquet Barra 4' })).toBeTruthy();
    expect(within(tpv).getByRole('status').textContent).toBe('Tiquet Barra: 4 unitats');

    /* Dues variants: el toc obri la tria; un toc a la variant l'afig i tanca. */
    fireEvent.click(within(tpv).getByRole('button', { name: /^Cafè amb llet, 2 variants, conté llet$/ }));
    const tria = within(tpv).getByRole('dialog', { name: 'Cafè amb llet' });
    fireEvent.click(within(tria).getByRole('button', { name: /^Got 1,60.€$/ }));
    expect(within(tpv).queryByRole('dialog', { name: 'Cafè amb llet' })).toBeNull();
    expect(avis()).toBe('Una unitat més: Cafè amb llet (Got).');
    expect(within(tpv).getByRole('button', { name: /^Cafè amb llet, 2 variants, A la comanda, conté llet$/ })).toBeTruthy();

    /* Els tiquets oberts: l'actiu porta aria-current; triar-ne un el posa al tiquet. */
    fireEvent.click(within(tpv).getByRole('button', { name: 'Tiquets oberts 2' }));
    const oberts = within(tpv).getByRole('dialog', { name: 'Tiquets oberts' });
    expect(within(oberts).getByRole('button', { name: /^Barra / }).getAttribute('aria-current')).toBe('true');
    fireEvent.click(within(oberts).getByRole('button', { name: /^Taula 3 / }));
    expect(within(tpv).queryByRole('dialog', { name: 'Tiquets oberts' })).toBeNull();
    expect(avis()).toBe('Tiquet actiu: Taula 3.');
    expect(within(tpv).getByRole('region', { name: 'Tiquet Taula 3 2' })).toBeTruthy();

    fireEvent.click(within(tpv).getByRole('button', { name: /^Cobra 3,20.€$/ }));
    expect(avis()).toMatch(/^Cobrament de mostra: 3,20.€\. No s’ha cobrat res\.$/);
    expect(within(tpv).getByText('El tiquet és buit')).toBeTruthy();
    expect(within(tpv).getByRole('button', { name: /^Cobra / }).disabled).toBe(true);
  });

  it('UniversalTPV · Mode Bar sense sessió: la franja «Entra per a vendre» i res no escriu (rajoles, línies, tiquets oberts ni Cobra)', () => {
    pinta(EspecimenUniversalTPV);
    const bar = screen.getByRole('group', { name: 'Mode Bar' });
    fireEvent.click(within(within(bar).getByRole('group', { name: 'Sessió de mostra' })).getByRole('button', { name: 'Sense sessió' }));
    const tpv = within(bar).getByRole('region', { name: 'TPV de mostra · Mode Bar' });
    const tiquet = within(tpv).getByRole('region', { name: 'Tiquet Barra 3' });
    expect(within(tiquet).getByText('Entra per a vendre.')).toBeTruthy();
    const graella = within(tpv).getByRole('list', { name: 'Productes' });
    expect(within(graella).getAllByRole('button').every((boto) => boto.disabled)).toBe(true);
    /* Com al TPV del Bar: les línies no són botons i la graella i les línies reben el focus per al scroll. */
    const linies = within(tiquet).getByRole('list', { name: 'Línies' });
    expect(within(linies).queryAllByRole('button')).toEqual([]);
    expect([graella.tabIndex, linies.tabIndex]).toEqual([0, 0]);
    expect(within(tpv).getByRole('button', { name: /^Tiquets oberts/ }).disabled).toBe(true);
    expect(within(tpv).getByRole('button', { name: /^Cobra / }).disabled).toBe(true);
  });

  /* Ordre del Mestre, 261006 (capacitat offline prioritària) · sense xarxa el
     Bar ven igual: l'avís ho diu i la foto que no carrega torna a la marca. */
  it('UniversalTPV · Mode Bar sense connexió: l’avís, la foto que falla torna a la marca i la venda continua', () => {
    pinta(EspecimenUniversalTPV);
    const bar = screen.getByRole('group', { name: 'Mode Bar' });
    const avis = () => pla(bar.querySelector(':scope > p[role="status"]').textContent);
    const tpv = within(bar).getByRole('region', { name: 'TPV de mostra · Mode Bar' });
    const orxata = () => tpv.querySelector('[data-article="orxata"]');
    const sessio = within(bar).getByRole('group', { name: 'Sessió de mostra' });
    const connexio = within(bar).getByRole('group', { name: 'Connexió de mostra' });
    /* Amb connexió, la pantalla de sempre: cap avís i l'Orxata sense foto. */
    expect(tpv.querySelector('.sdp-tpv__avis')).toBeNull();
    expect(orxata().className).toBe('sdp-tpv__rajola');

    fireEvent.click(within(connexio).getByRole('button', { name: 'Sense connexió' }));
    const tiquet = within(tpv).getByRole('region', { name: 'Tiquet Barra 3' });
    expect(within(tiquet).getByText('Sense connexió: cada venda es desa en este dispositiu.')).toBeTruthy();
    /* La foto apunta dins de /assets, cap adreça externa, i falla: torna a la marca. */
    const foto = orxata().querySelector('.sdp-tpv__media > img');
    expect(foto.getAttribute('src')).toBe('/assets/mostra/sense-connexio/orxata.jpg');
    expect(orxata().className).toBe('sdp-tpv__rajola sdp-tpv__rajola--imatge');
    fireEvent.error(foto);
    expect(orxata().className).toBe('sdp-tpv__rajola');
    expect(orxata().querySelector('img')).toBeNull();
    expect(orxata().querySelector('.sdp-tpv__media .sdp-marca-article__inicials').textContent).toBe('O');
    expect(orxata().querySelector('.sdp-tpv__media svg')).not.toBeNull();

    /* La venda continua: el toc afig i Cobra es pot tocar. */
    fireEvent.click(within(tpv).getByRole('button', { name: /^Cafè sol, / }));
    expect(avis()).toBe('Una unitat més: Cafè sol.');
    expect(within(tpv).getByRole('region', { name: 'Tiquet Barra 4' })).toBeTruthy();
    expect(within(tpv).getByRole('button', { name: /^Cobra / }).disabled).toBe(false);

    /* Sense sessió i sense connexió: els dos avisos, per ordre d'importància. */
    fireEvent.click(within(sessio).getByRole('button', { name: 'Sense sessió' }));
    expect([...tpv.querySelectorAll('.sdp-tpv__tiquet > .sdp-tpv__avis > span')].map((s) => s.textContent))
      .toEqual(['Entra per a vendre.', 'Sense connexió: cada venda es desa en este dispositiu.']);

    /* Torna la connexió: l'avís se'n va i l'Orxata torna a no tindre foto. */
    fireEvent.click(within(sessio).getByRole('button', { name: 'Amb sessió' }));
    fireEvent.click(within(connexio).getByRole('button', { name: 'Amb connexió' }));
    expect(tpv.querySelector('.sdp-tpv__avis')).toBeNull();
    expect(orxata().className).toBe('sdp-tpv__rajola');
    expect(orxata().querySelector('img')).toBeNull();
  });

  it('UniversalTPV · Mode Rebost: la cerca sense accents, la llista triada i «Afig a la llista», sense preus', () => {
    pinta(EspecimenUniversalTPV);
    const rebost = screen.getByRole('group', { name: 'Mode Rebost' });
    const avis = () => pla(rebost.querySelector(':scope > p[role="status"]').textContent);
    const tpv = within(rebost).getByRole('region', { name: 'TPV de mostra · Mode Rebost' });
    expect(within(tpv).getByRole('region', { name: 'Llista Casa 1' })).toBeTruthy();
    /* Les dues fites de cerca de la pàgina tenen nom i es distingixen. */
    expect(within(tpv).getByRole('search', { name: 'Busca un article' })).toBeTruthy();
    expect(tpv.querySelector('.sdp-tpv__fila-resum--total')).toBeNull();
    fireEvent.change(within(tpv).getByRole('searchbox', { name: 'Busca un article' }), { target: { value: 'creilles' } });
    const articles = within(within(tpv).getByRole('list', { name: 'Articles' })).getAllByRole('button');
    expect(articles.map((boto) => boto.getAttribute('aria-label'))).toEqual(['Creïlles, 2 kg']);
    fireEvent.click(articles[0]);
    expect(avis()).toBe('A la llista: Creïlles.');
    expect(within(tpv).getByRole('region', { name: 'Llista Casa 2' })).toBeTruthy();

    fireEvent.click(within(tpv).getByRole('button', { name: 'Llistes 3' }));
    fireEvent.click(within(within(tpv).getByRole('dialog', { name: 'Llistes' })).getByRole('button', { name: 'Mercat del dijous' }));
    expect(avis()).toBe('Llista activa: Mercat del dijous.');
    expect(within(tpv).getByRole('region', { name: 'Llista Mercat del dijous 2' })).toBeTruthy();

    fireEvent.click(within(tpv).getByRole('button', { name: 'Afig a la llista' }));
    expect(avis()).toBe('Afegits 2 línies a la llista «Mercat del dijous» (mostra): no s’ha desat res.');
    expect(within(tpv).getByText('La llista és buida')).toBeTruthy();
    expect(within(tpv).getByRole('button', { name: 'Afig a la llista' }).disabled).toBe(true);
  });

  /* Ordre del Mestre, 261006 («vital per a la Carta Digital i el TPV») · els
     al·lèrgens a la rajola: la cantonada, el «+N», la marca de la comanda i el nom. */
  it('UniversalTPV · al·lèrgens: la cantonada de la rajola i el nom; sense al·lèrgens, la rajola de sempre', () => {
    pinta(EspecimenUniversalTPV);
    const bar = within(screen.getByRole('group', { name: 'Mode Bar' })).getByRole('region', { name: 'TPV de mostra · Mode Bar' });
    const cantonada = (tpv, id) => tpv.querySelector(`[data-article="${id}"]`).closest('li').querySelector('.sdp-tpv__alergens');
    /* La Coca: cinc al·lèrgens (3 icones i «+2») i la insígnia «Nou», abans al DOM. */
    const coca = within(bar).getByRole('button', { name: /^Coca de llanda, 2,00.€, conté gluten, ous, llet, fruits de closca, sèsam$/ });
    expect([...coca.closest('li').children].map((fill) => fill.className)).toEqual(['sdp-tpv__rajola', 'sdp-tpv__insignia', 'sdp-tpv__alergens']);
    expect(cantonada(bar, 'coca').querySelectorAll('img')).toHaveLength(3);
    expect(cantonada(bar, 'coca').querySelector('.sdp-alergens__resta').textContent).toBe('+2');
    expect(cantonada(bar, 'coca').getAttribute('aria-hidden')).toBe('true');
    /* El Tallat, a la comanda: la marca i la insígnia de sempre, i la cantonada darrere. */
    expect([...cantonada(bar, 'tallat').closest('li').children].map((fill) => fill.className))
      .toEqual(['sdp-tpv__rajola', 'sdp-tpv__marca-colleccio', 'sdp-tpv__insignia', 'sdp-tpv__alergens']);
    /* Sense al·lèrgens, cap cantonada. */
    expect(cantonada(bar, 'cafe-sol')).toBeNull();
    expect(cantonada(bar, 'orxata')).toBeNull();
    /* El Rebost: la Llet, a la llista i sense insígnia. */
    const rebost = within(screen.getByRole('group', { name: 'Mode Rebost' })).getByRole('region', { name: 'TPV de mostra · Mode Rebost' });
    expect(within(rebost).getByRole('button', { name: 'Llet, 6 u, A la llista, conté llet' })).toBeTruthy();
    expect([...cantonada(rebost, 'llet').closest('li').children].map((fill) => fill.className))
      .toEqual(['sdp-tpv__rajola', 'sdp-tpv__marca-colleccio', 'sdp-tpv__alergens']);
    expect(cantonada(rebost, 'tomaques')).toBeNull();
  });

  it('IconesAlergens: els 14 en les dues mides, el «+N», la llegenda i la targeta de la Carta Digital', () => {
    const arrel = pinta(EspecimenIconesAlergens);
    const tots = screen.getAllByRole('img', { name: /^Al·lèrgens: gluten, crustacis, ous, peix, cacauets, soja, llet, fruits de closca, api, mostassa, sèsam, diòxid de sofre i sulfits, tramussos, mol·luscs$/ });
    expect(tots.map((peca) => peca.className)).toEqual(['sdp-alergens', 'sdp-alergens sdp-alergens--mitjana']);
    for (const peca of tots) expect(peca.querySelectorAll('img')).toHaveLength(14);
    const ambResta = screen.getByRole('img', { name: 'Al·lèrgens: gluten, ous, llet, fruits de closca, sèsam, diòxid de sofre i sulfits' });
    expect(ambResta.querySelectorAll('img')).toHaveLength(3);
    expect(ambResta.querySelector('.sdp-alergens__resta').textContent).toBe('+3');
    /* La llegenda: cada dibuix amb el seu nom, i el lector llig el nom una sola vegada. */
    const llegenda = screen.getByRole('list', { name: 'Llegenda dels 14 al·lèrgens' });
    const files = within(llegenda).getAllByRole('listitem');
    expect(files).toHaveLength(14);
    expect(files.map((fila) => [fila.dataset.alergen, fila.querySelector('img').dataset.alergen])).toEqual(files.map((fila) => [fila.dataset.alergen, fila.dataset.alergen]));
    expect(pla(files[7].textContent).trim()).toBe('Fruits de closca');
    expect(within(llegenda).queryAllByRole('img')).toEqual([]);
    /* La targeta de la Carta Digital: UniversalCard de sempre, les icones dins del cos. */
    const targeta = arrel.querySelector('article.sp-card');
    expect(within(targeta).getByRole('img', { name: 'Al·lèrgens: gluten, ous, llet' }).closest('.sp-card-text')).not.toBeNull();
  });
});
