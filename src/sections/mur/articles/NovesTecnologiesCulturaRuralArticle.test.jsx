/* IDEA-116 + IDEA-119 (Onada R9, carril C2) · La primera publicació del Mur,
   «Noves tecnologies aplicades a la cultura rural: desmuntant en 3D el Pou de
   Neu del Rentonar».
   Es prova: (1) que és la primera del Mur (la primera de la llavor,
   APP_SEED.feedPosts, sense passar per MOCK_FEED ni per l'entrada (R9V-C2-01);
   la primera de les importants i, amb les dates de prova, la més nova), signada per
   l'entitat, amb la data real d'escriptura i sense portada; (2) l'honestedat
   del cos: cap imatge, només el documental d'Eugenio Monesma, les fonts amb
   URL de veres i cap dels noms o fets rebutjats a G10-05; (3) l'article: la
   veu de la IAIA, el visor únic del pou (IDEA-161: PouDeLaNeuAnatomiaCard, en
   diferit; cap reproductor) i el cos, editat o canònic; (4) la fitxa del
   Mur la carrega en diferit; (5) /notes l'obri a l'editor com el Manifest
   (revisió editorial, P0-25); (6) IDEA-165 (Onada R11, kit R91 de Gemini
   adaptat): les mides de Segura (1987) lligades a SEGURA_1987, el mur d'1,50 m,
   cap xifra de l'esbós 76150, la història amb la font de cada fet i el que
   només diu la fitxa de treball del Node 0 marcat com a no confirmat. */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { FONTS_PER_IDIOMA } from '../../../../tests/helpers/diccionaris.js';
import { createTranslator } from '../../../config/i18n.js';
import NovesTecnologiesCulturaRuralArticle, { textPlaDelCos } from './NovesTecnologiesCulturaRuralArticle.jsx';
import { nomDeLaVeu } from './nomDeLaVeu.js';
import {
  NOVES_TECNOLOGIES_CULTURA_RURAL_HTML, NOVES_TECNOLOGIES_CULTURA_RURAL_ID, NOVES_TECNOLOGIES_CULTURA_RURAL_POST,
  NOVES_TECNOLOGIES_FONTS, NOVES_TECNOLOGIES_VIDEO
} from './novesTecnologiesCulturaRuralContent.js';
import { MOCK_FEED } from '../feedSeed.js';
import { FEED_POSTS as PUBLICACIONS_DE_MOCK_FEED } from '../feedContent.js';
import { IMPORTANTS_DEL_MUR, llavorAmbDatesDeProva } from '../datesDeProvaMur.js';
import { APP_SEED } from '../../../data/appSeed.js';
import { momentDElement } from '../../../components/universal/editorial.js';
import { buildMurDetailSectionMeta } from '../../detail/detailSectionMeta.jsx';
import { cosDeLaPublicacio, esFilaActualitzable, esPublicacioEditable, esRevisioEditorial, notaDeLaPublicacio } from '../../notes/publicacioEditable.js';
import { ESTRUCTURES } from '../../../data/patrimoni/anatomiaRural.js';
import { SEGURA_1987 } from '../../../components/patrimoni/iso/pouNeuRentonar.js';
import { POU_NEU_INTERIOR_TEXT } from '../../../components/patrimoni/iso/pouNeuTextosInterior.js';

afterEach(() => { cleanup(); vi.useRealTimers(); });
const POST = NOVES_TECNOLOGIES_CULTURA_RURAL_POST;
/* La llavor del Mur que servixen els dos adaptadors en mode seed. */
const FEED_POSTS = APP_SEED.feedPosts;
const doc = (html) => new DOMParser().parseFromString(html, 'text/html');

describe('la primera publicació del Mur', () => {
  test('és la primera de la llavor i de les importants, amb ruta /mur/<slug> i la signatura de l’entitat', () => {
    expect(POST.id).toBe('noves-tecnologies-aplicades-a-la-cultura-rural');
    expect(POST.slug).toBe(POST.id);
    expect(NOVES_TECNOLOGIES_CULTURA_RURAL_ID).toBe(POST.id);
    expect(POST.title).toBe('Noves tecnologies aplicades a la cultura rural: desmuntant en 3D el Pou de Neu del Rentonar');
    // R9V-C2-01 · La primera de la llavor, amb la forma de les altres (elementDelMurDeLaLlavor), però no a MOCK_FEED,
    // que va a l'entrada: la resta de la llavor del Mur és la de sempre.
    expect(FEED_POSTS[0]).toMatchObject({ ...POST, sectionId: 'mur', important: true, summary: POST.entradilla });
    expect(FEED_POSTS[0].searchText).toContain('pou de neu del rentonar');
    expect(FEED_POSTS.slice(1)).toEqual(PUBLICACIONS_DE_MOCK_FEED);
    expect(MOCK_FEED.some((item) => item.id === POST.id)).toBe(false);
    expect(IMPORTANTS_DEL_MUR[0]).toEqual(['feedPosts', POST.id]);
    expect(POST).toMatchObject({ author_entity_id: 'socdepoble', author_name: 'Sóc de Poble', poble_id: 'la-torre-de-les-macanes', important: true });
    // La data real d'escriptura: el naixement del fitxer de la instantània (14:29:18, R9V-C2-06), no una data de prova
    // ni una data inventada; sense publish_date, que manaria sobre la de prova.
    expect(POST.created_at).toBe('2026-11-06T14:29:00+01:00');
    expect(POST.publish_date).toBeUndefined();
    // Portada Ibáñez pròpia generada per al Pou de la Neu, l'almàssera i el forn de calç (cap foto de tercers).
    expect(POST.image_url).toBe('/assets/uploads/patrimoni/anatomia-rural-pou-neu-ibanez.webp');
    expect(FEED_POSTS.find((item) => item.id === POST.id).imageSrc).toBe('/assets/uploads/patrimoni/anatomia-rural-pou-neu-ibanez.webp');
  });

  test('amb les dates de prova del Mur és la més nova de totes les targetes de la llavor', () => {
    const ara = new Date(2026, 10, 6, 18, 0);
    const llavor = llavorAmbDatesDeProva(APP_SEED, ara);
    const nostra = momentDElement(llavor.feedPosts.find((item) => item.id === POST.id));
    const altres = [
      ...llavor.feedPosts.filter((item) => item.id !== POST.id),
      ...llavor.marketItems,
      ...llavor.pages.map((pagina) => ({ ...pagina, created_at: pagina.date, date: undefined }))
    ].map(momentDElement).filter(Number.isFinite);
    expect(altres.length).toBeGreaterThan(5);
    expect(altres.every((moment) => moment < nostra)).toBe(true);
    expect(nostra).toBeLessThan(ara.getTime());
  });
});

describe('el cos: honest i sense fotos de tercers', () => {
  const cos = doc(NOVES_TECNOLOGIES_CULTURA_RURAL_HTML);

  test('cap imatge; un sol vídeo, el documental d’Eugenio Monesma, amb el títol del visor', () => {
    expect(cos.querySelectorAll('img, picture, figure, iframe')).toHaveLength(0);
    const videos = [...cos.querySelectorAll('[data-sdp-youtube]')];
    expect(videos.map((node) => node.getAttribute('data-sdp-youtube'))).toEqual(['3RQv3xjVr-M']);
    const pou = ESTRUCTURES.find((estructura) => estructura.id === 'pou-de-neu');
    expect(NOVES_TECNOLOGIES_VIDEO).toEqual({ id: pou.documental.videoId, titol: pou.documental.titol });
    expect(videos[0].getAttribute('data-titol')).toBe(pou.documental.titol);
    expect(cos.body.textContent.match(/Eugenio Monesma/g)).toHaveLength(1);
    expect(cos.body.textContent).toContain('només este vídeo és seu');
  });

  test('les fonts: les set entrades de socdepoble.net i d’El Rentonar, amb data, les obres de Segura i l’esbós sense xifres', () => {
    const enllacos = [...cos.querySelectorAll('a[href^="http"]')];
    for (const a of enllacos) expect([a.getAttribute('href'), a.getAttribute('target'), a.getAttribute('rel')]).toEqual([a.getAttribute('href'), '_blank', 'noopener noreferrer']);
    const hrefs = new Set(enllacos.map((a) => a.getAttribute('href')));
    for (const [data, , url] of NOVES_TECNOLOGIES_FONTS) {
      expect(hrefs.has(url)).toBe(true);
      expect(data).toMatch(/^\d{2}-\d{2}-20(2[0-5])$/);
      expect(url).toMatch(/^https:\/\/(socdepoble\.net\/20\d\d\/\d\d\/\d\d\/[a-z0-9-]+\/|rentonar\.blogspot\.com\/20\d\d\/\d\d\/[a-z0-9-]+\.html)$/);
    }
    expect(NOVES_TECNOLOGIES_FONTS).toHaveLength(7);
    // En ordre de data.
    const dies = NOVES_TECNOLOGIES_FONTS.map(([data]) => data.split('-').reverse().join('-'));
    expect(dies).toEqual([...dies].sort());
    expect(cos.querySelector('a[href="/page/anatomia-rural"]')).not.toBeNull();
    // IDEA-165 · L'esbós 76150 (sense autor ni escala) hi queda com a idea pedagògica, sense cap de les seues xifres.
    const lis = [...cos.querySelectorAll('li')].map((li) => li.textContent);
    const esbos = lis.find((li) => li.startsWith('Esbós divulgatiu'));
    expect(esbos).toContain('Gràfics de Poble');
    for (const xifra of ['18 m', '15 + 3', '9,75', '24 + 5', '43 cm']) expect([xifra, esbos.includes(xifra)]).toEqual([xifra, false]);
    expect(lis.some((li) => li.startsWith('Plànol'))).toBe(false);
    // Les dues obres de Segura que són al disc (Eines 1987, Narria 1985) i la de 1996, marcada com a no consultada.
    expect(lis.filter((li) => /^Josep Mª Segura Martí \(19(87|85)\)/.test(li))).toHaveLength(2);
    // Loop 5 del visor: una sola entrada de cada obra, amb el títol complet (la regla de dalt no distingix 1987+1985 de 1987+1987).
    expect(lis.filter((li) => li.startsWith('Josep Mª Segura Martí (1987) · «Els pous i l’antic comerç de la neu a Xixona», Eines, núm. 7 i 8'))).toHaveLength(1);
    expect(lis.filter((li) => li.startsWith('Josep Mª Segura Martí (1985) · «La industria de la nieve en las montañas alicantinas», Narria'))).toHaveLength(1);
    expect(lis.find((li) => li.startsWith('Bibliografia no consultada'))).toMatch(/Cruz Orozco.*\(1996\).*no n’hem tret cap xifra/);
    // Loop 5 (L4-ARQ-03) · La idea pedagògica de l'esbós i cap de les seues xifres en tot el text publicat.
    expect(esbos).toContain('en prenem la idea pedagògica, no les xifres, perquè no té autor ni escala');
    const publicat = `${cos.body.textContent} ${POST.entradilla} ${POST.post_subtitle}`;
    expect(publicat).not.toMatch(/18 m|15 \+ 3|9,75|24 \+ 5|43 cm/);
    expect(publicat).not.toMatch(/plànol[^.]*Gràfics de Poble|Gràfics de Poble[^.]*plànol/i);
  });

  /* G1-N01 (Gauntlet de l'arbre R9) · L'entradeta promet que cada xifra porta la seua font: cada any que el text
     dona a les jornades de neteja té una entrada de neteja d'eixe any a la llista publicada. */
  test('cada any de les jornades de neteja té la seua font a la llista', () => {
    const text = cos.body.textContent;
    const [, anys] = /jornades de neteja del camí i de l’entorn \(([^)]+)\)/.exec(text) || [];
    expect(anys).toBe('2021 i 2023');
    for (const any of anys.split(' i ')) {
      const fonts = NOVES_TECNOLOGIES_FONTS.filter(([data, titol]) => data.endsWith(`-${any}`) && /neteja/i.test(titol));
      expect([any, fonts.length]).toEqual([any, 1]);
    }
    expect(NOVES_TECNOLOGIES_FONTS.find(([data]) => data === '21-06-2021')).toEqual(['21-06-2021', 'Jornada de neteja del camí de pujada al Pou de neu', 'https://rentonar.blogspot.com/2021/06/jornada-de-neteja-del-cami-de-pujada-al.html']);
  });

  test('cap dels noms ni dels fets inventats que es van rebutjar a G10-05; propietat privada, cap particular', () => {
    const text = `${NOVES_TECNOLOGIES_CULTURA_RURAL_HTML} ${POST.entradilla} ${POST.post_subtitle}`;
    for (const rebutjat of ['Picó', 'Galiana', 'Soler Pascual', 'Diputació', 'compravenda', 'Polígon', 'rècules', 'terapèutic', '1998', '1976', 'masia']) {
      expect([rebutjat, text.includes(rebutjat)]).toEqual([rebutjat, false]);
    }
    expect(text).toContain('no és de titularitat pública');
    expect(text).toContain('lliure accés');
  });

  test('cap paràgraf pla: tot paràgraf porta negreta, i cap encapçalament no en porta', () => {
    expect([...cos.querySelectorAll('p')].filter((p) => !p.querySelector('strong')).map((p) => p.textContent)).toEqual(['«autèntics magatzems de neu amb què abastir els pobles durant l’estiu»']);
    expect(cos.querySelectorAll('h1, h2, h4, h5, h6')).toHaveLength(0);
    expect([...cos.querySelectorAll('h3')].filter((h) => h.querySelector('strong'))).toHaveLength(0);
  });

  /* IDEA-165 (Onada R11 · kit R91 de Gemini, adaptat al Loop 3) · Les mides de l'article són les de Josep Mª Segura
     Martí (Eines 7-8, 1987; corpus del Rentonar, l. 982-1031), les mateixes de l'única font del visor (SEGURA_1987).
     R91-L2-01: el mur fa 1,50 m («El gruix del mur en aquest punt és de 1,50 m»); 1,55 m és l'amplària de la
     finestra. Cap xifra de l'esbós 76150 i cap font que no done mesures (R91-L2-02). */
  const xifraDe = ({ valor, decimals, unitat }) => `${valor.toFixed(decimals).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ${unitat}`;

  test('IDEA-165 · totes les mides de Segura (SEGURA_1987) i el mur d’1,50 m; cap mur d’1,55 ni cap xifra de l’esbós', () => {
    const text = cos.body.textContent;
    const mides = Object.entries(SEGURA_1987);
    expect(mides.length).toBeGreaterThanOrEqual(15);
    for (const [clau, mesura] of mides) expect([clau, xifraDe(mesura), text.includes(xifraDe(mesura))]).toEqual([clau, xifraDe(mesura), true]);
    expect(xifraDe(SEGURA_1987.gruixMur)).toBe('1,50 m');
    for (const frase of [
      '9,80 m de diàmetre interior', '13,75 m de fondària', 'capacitat en 1.030 m³', '1,55 m d’amplària', '1,70 m d’altura màxima',
      'El gruix del mur, en eixe punt, és d’1,50 m', '2,35 m d’ample a l’entrada', 'va estretint-se', '10,00 m damunt del fons',
      '29 m en línia recta', 'quatre estreps', 'dos arcs creuats', 'trespol de teula', 'falsa volta', 'hemisfèrica', '1.330 m'
    ]) expect([frase, text.includes(frase)]).toEqual([frase, true]);
    for (const rebutjat of [
      'mur d’1,55', "mur d'1,55", 'mur 1,55', '1,55 m de gruix', '9,75', '15 + 3', '24 + 5', '43 cm', '1.100 m³', '18 m',
      'arcs diafragma', 'teula àrab', 'abovedat', 'equivalent', 'Alçat', 'BRL', 'estratigràfic'
    ]) expect([rebutjat, text.includes(rebutjat)]).toEqual([rebutjat, false]);
    // Les fonts que no donen cap mesura (Garcia Barrachina, Cruz Orozco, l'expedient) no en signen cap.
    for (const frase of text.split(/(?<=\.)\s/)) {
      if (/Garcia Barrachina|Cruz Orozco|rellevància local/.test(frase)) expect([frase, /\d,\d\d m|1\.030/.test(frase)]).toEqual([frase, false]);
    }
  });

  test('IDEA-165 · la història: cada fet amb la seua font; la fitxa de treball del Node 0, marcada; cap destinació inventada', () => {
    const text = cos.body.textContent;
    for (const fet of [
      'Alcoi s’abastia de neu per mitjà de Joseph Giner, de Cocentaina', '1728.', 'Giner s’obligà a abastir Xixona',
      'arribaven per edicte a La Torre de les Maçanes, Ibi i Tibi', 'Manuel Rico García', '23 pous de neu', '9 de gel',
      'li calcula 20.000 arroves de capacitat', 's’explotaria durant les dues primeres dècades del segle XX',
      'entre els segles XVII i XVIII', '«Principios del s.XVIII»', '12 de juliol de 2021', 'per determinació legal',
      '26 d’abril de 2025', 'Anna Garcia Barrachina hi va fer una xerrada'
    ]) expect([fet, text.includes(fet)]).toEqual([fet, true]);
    // R91-L4-02 · Fidelitat a la lletra de les fonts: el condicional de Segura per a la primera coberta, el tragí
    // dels arriers com a record general (no com a dada del Rentonar) i els 1.200 m sense document que els done.
    expect(text).toContain('segons Segura, subjectaria un trespol de teula');
    expect(text).toContain('Segura només hi esmenta el tragí dels arriers que encara recorden els avis');
    expect(text).toMatch(/1\.200 m sense dir de quin document els trau/);
    // R91-L2-03 · Els 1.030 m³ de Segura i les 20.000 arroves de Rico són dues estimacions, no una equivalència.
    expect(text).toContain('independent dels 1.030 m³ de Segura, i no n’és cap equivalència');
    expect(text).not.toMatch(/1\.030 m³ \(20\.000|20\.000 arroves de gel/);
    // 1.160 m (Segura) enfront dels 1.200 m de la fitxa de treball: es diu, i mana Segura.
    expect(text).toMatch(/1\.200 m[^.]*no dona cap altitud/);
    expect(text).toContain('manen els 1.160 m de Segura');
    // El que només diu la fitxa de treball de la biblioteca del Node 0 es marca com a no confirmat.
    const noConfirmat = /El que no podem confirmar: ([^]*?)no ho donem per bo\./.exec(text)?.[1] || '';
    for (const fet of ['saga de nevaters', 'Alacant', 'gener de 1919']) expect([fet, noConfirmat.includes(fet)]).toEqual([fet, true]);
    expect(text.match(/1919/g)).toHaveLength(1);
    expect(text).toMatch(/«incoació» que diu la fitxa de treball[^.]*no consta/);
    // R91-L2-04 · Cap destinació sense font: només Alcoi (1724) i Xixona (1728, i els edictes del s. XIX).
    for (const inventada of ['Sant Joan', 'Mutxamel', 'Campello', 'Agost']) expect([inventada, text.includes(inventada)]).toEqual([inventada, false]);
    // L'ofici dels nevaters és el de Narria (1985) per a les muntanyes alacantines, no una dada del Rentonar.
    expect(text).toMatch(/muntanyes alacantines en general \(Narria, 1985\)/);
  });

  test('IDEA-165 · un sol visor amb els tres modes, amb els mateixos rètols que el visor', () => {
    const primer = cos.querySelector('p').textContent;
    expect(primer).toContain('un sol visor');
    for (const mode of ['interior', 'tall', 'desmuntatge']) {
      const retol = POU_NEU_INTERIOR_TEXT.ca.modes[mode];
      expect([mode, primer.includes(`«${retol}»`)]).toEqual([mode, true]);
    }
    expect(['Dins del pou', 'Tall seccional', 'Desmuntar en 3D']).toEqual(Object.values(POU_NEU_INTERIOR_TEXT.ca.modes));
    expect(cos.body.textContent).not.toMatch(/reproductor/i);
  });
});

describe('l’article', () => {
  test('veu de la IAIA, visor únic del pou i cos canònic, amb el vídeo sense galetes', async () => {
    const { container } = render(<NovesTecnologiesCulturaRuralArticle item={POST} />);
    // IDEA-161 · Una sola veu, la de la publicació sencera, amb el nom que comença pel rètol visible (R9V-C2-10).
    // Cap reproductor: ni la regió «pas a pas» ni la veu del pas.
    expect(within(container.querySelector('.noves-tecnologies-rural__veu')).getByRole('button', { name: 'Escolta la IAIA: tota la publicació' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /^Escolta la IAIA/ })).toHaveLength(1);
    expect(screen.queryByRole('region', { name: 'El Pou de Neu del Rentonar, pas a pas' })).toBeNull();
    expect(screen.queryAllByRole('button', { name: 'Escolta la IAIA: este pas' })).toHaveLength(0);
    expect(container.querySelector('.noves-tecnologies-rural__veu').textContent).toBe('🔊 Escolta la IAIA');
    expect(container.querySelector('section.reproductor-pou')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Per què un pou de neu en 3D' })).toBeTruthy();
    // Gauntlet R9 · G2-04 · Façana de clic: abans del gest, cap iframe; el botó obri el del vídeo.
    expect(container.querySelector('iframe')).toBeNull();
    fireEvent.click(within(container).getByRole('button', { name: /^Veure el vídeo \(YouTube\) / }));
    const iframes = container.querySelectorAll('iframe');
    expect(iframes).toHaveLength(1);
    expect(iframes[0].getAttribute('src')).toBe(`https://www.youtube-nocookie.com/embed/${NOVES_TECNOLOGIES_VIDEO.id}`);
    expect(iframes[0].title).toBe(NOVES_TECNOLOGIES_VIDEO.titol);
    // El visor únic (en diferit) va damunt del cos.
    await waitFor(() => expect(container.querySelectorAll('.pou-neu-card')).toHaveLength(1), { timeout: 10000 });
    const visor = container.querySelector('.pou-neu-card');
    const cos = container.querySelector('article.detail-content');
    expect(visor.compareDocumentPosition(cos) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelector('img')).toBeNull();
  });

  test('una versió editada des de /notes es pinta; una còpia en text pla torna al canònic', () => {
    const { container, unmount } = render(<NovesTecnologiesCulturaRuralArticle item={{ ...POST, content: '<p>Cos <strong>revisat</strong>.</p>' }} />);
    expect(container.querySelector('article.detail-content').textContent).toBe('Cos revisat.');
    unmount();
    const { container: c2 } = render(<NovesTecnologiesCulturaRuralArticle item={{ ...POST, content: 'Una còpia en text pla.' }} />);
    expect(c2.querySelector('article.detail-content').textContent).toContain('Per què un pou de neu en 3D');
  });

  /* IDEA-161 · nomDeLaVeu ix del reproductor retirat amb el mateix comportament i les mateixes claus. */
  test('nomDeLaVeu, a les cinc llengües: comença pel rètol visible del botó (WCAG 2.5.3) i distingix la publicació del pas', () => {
    for (const llengua of ['ca', 'es', 'en', 'eu', 'gl']) {
      const t = createTranslator(llengua);
      for (const clau of ['patrimoni.reproductorPou.veuPublicacio', 'patrimoni.reproductorPou.veuPas']) {
        expect([llengua, clau, FONTS_PER_IDIOMA[llengua].includes(`'${clau}':`)]).toEqual([llengua, clau, true]);
      }
      const visible = t('common.veuIaiaEscolta').replace(/^\p{Extended_Pictographic}️?\s*/u, '');
      expect(nomDeLaVeu(t, 'publicacio')).toBe(`${visible}: ${t('patrimoni.reproductorPou.veuPublicacio')}`);
      expect(nomDeLaVeu(t, 'pas')).toBe(`${visible}: ${t('patrimoni.reproductorPou.veuPas')}`);
      expect(nomDeLaVeu(t, 'pas')).not.toBe(nomDeLaVeu(t, 'publicacio'));
    }
    expect(nomDeLaVeu(createTranslator('ca'), 'publicacio')).toBe('Escolta la IAIA: tota la publicació');
    expect(nomDeLaVeu((_, reserva) => reserva, 'pas')).toBe('Escolta la IAIA: este pas');
  });

  test('la veu llig el títol, l’entradeta i el cos tal com es pinten, en text pla', () => {
    const text = textPlaDelCos(NOVES_TECNOLOGIES_CULTURA_RURAL_HTML);
    expect(text).not.toMatch(/<|>/);
    expect(text).toContain('Per què un pou de neu en 3D');
    expect(textPlaDelCos('')).toBe('');
    expect(textPlaDelCos(null)).toBe('');
  });

  test('la fitxa del Mur (/mur/<slug>) carrega l’article en diferit', async () => {
    const item = FEED_POSTS.find((post) => post.id === POST.id);
    const meta = buildMurDetailSectionMeta({ feedPosts: FEED_POSTS, t: (_, reserva) => reserva });
    expect(meta.items).toContain(item);
    expect(meta.getImage(item)).toBe('/assets/uploads/patrimoni/anatomia-rural-pou-neu-ibanez.webp');
    const { container } = render(meta.renderBody(item));
    await waitFor(() => expect(container.querySelector('.noves-tecnologies-rural')).not.toBeNull(), { timeout: 10000 });
    await waitFor(() => expect(container.querySelectorAll('.pou-neu-card')).toHaveLength(1), { timeout: 10000 });
    const hero = container.querySelector('.pou-neu-card');
    const cos = container.querySelector('article.detail-content');
    expect(hero.compareDocumentPosition(cos) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // La nota de les estimacions: si l'avís de WebGL2 (role="status") també porta .pou-neu-note, no compta (R91-L4-01).
    expect(hero.querySelector('.pou-neu-note:not([role="status"])').textContent).toContain('no mesures del monument');
    // IDEA-161 · Un sol visor del pou i una sola veu: cap reproductor.
    expect(container.querySelector('section.reproductor-pou')).toBeNull();
    expect(screen.getAllByRole('button', { name: /^Escolta la IAIA/ })).toHaveLength(1);
    expect(cos.textContent).toContain('Per què un pou de neu en 3D');
  });
});

describe('editable a /notes (P0-25), com el Manifest', () => {
  const peca = (publicacio) => ({ kind: 'publicacio', id: `publicacio:mur:${publicacio.id}`, data: { seccio: 'mur', item: publicacio } });

  test('s’obri a l’editor amb el document sencer; es desa com a revisió editorial (sense UUID)', () => {
    const item = peca(FEED_POSTS.find((post) => post.id === POST.id));
    expect(esPublicacioEditable(item)).toBe(true);
    expect(esRevisioEditorial(item)).toBe(true);
    expect(esFilaActualitzable(item)).toBe(false);
    const nota = notaDeLaPublicacio(item);
    expect(nota).toMatchObject({ title: POST.title, subtitle: POST.post_subtitle, lead: POST.entradilla, content: NOVES_TECNOLOGIES_CULTURA_RURAL_HTML, folderId: 'f-mur' });
    expect(nota.tags).toEqual(POST.tags);
  });

  test('una còpia sense HTML obri el canònic, mai el resum; una editada obri l’editada', () => {
    expect(cosDeLaPublicacio({ id: POST.id, content: 'text pla d’app_content' })).toBe(NOVES_TECNOLOGIES_CULTURA_RURAL_HTML);
    expect(cosDeLaPublicacio({ id: POST.id, content: '<p>Revisat</p>' })).toBe('<p>Revisat</p>');
  });
});
