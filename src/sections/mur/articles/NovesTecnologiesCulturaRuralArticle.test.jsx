/* IDEA-116 + IDEA-119 (Onada R9, carril C2) · La primera publicació del Mur,
   «Noves tecnologies aplicades a la cultura rural: desmuntant en 3D el Pou de
   Neu del Rentonar».
   Es prova: (1) que és la primera del Mur (la primera de la llavor,
   APP_SEED.feedPosts, sense passar per MOCK_FEED ni per l'entrada (R9V-C2-01);
   la primera de les importants i, amb les dates de prova, la més nova), signada per
   l'entitat, amb la data real d'escriptura i sense portada; (2) l'honestedat
   del cos: cap imatge, només el documental d'Eugenio Monesma, les fonts amb
   URL de veres i cap dels noms o fets rebutjats a G10-05; (3) l'article: la
   veu de la IAIA, el reproductor i el cos, editat o canònic; (4) la fitxa del
   Mur la carrega en diferit; (5) /notes l'obri a l'editor com el Manifest
   (revisió editorial, P0-25). */
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import NovesTecnologiesCulturaRuralArticle, { textPlaDelCos } from './NovesTecnologiesCulturaRuralArticle.jsx';
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
    // Cap portada: cap foto de tercers (Decisió 3).
    expect(POST.image_url).toBeUndefined();
    expect(FEED_POSTS.find((item) => item.id === POST.id).imageSrc).toBeFalsy();
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

  test('les fonts: les set entrades de socdepoble.net i d’El Rentonar, amb data, i el plànol amb les seues cotes', () => {
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
    const pla = [...cos.querySelectorAll('li')].find((li) => li.textContent.startsWith('Plànol'));
    for (const xifra of ['18 m', '15 + 3', '9,75 m', '10 m', '29 m', '24 + 5', '43 cm']) expect([xifra, pla.textContent.includes(xifra)]).toEqual([xifra, true]);
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
});

describe('l’article', () => {
  test('veu de la IAIA, reproductor del pou i cos canònic, amb el vídeo sense galetes', () => {
    const { container } = render(<NovesTecnologiesCulturaRuralArticle item={POST} />);
    // Dues veus: la de l'article sencer (fora del reproductor) i la del pas (dins de la regió del reproductor), amb
    // noms diferents que comencen pel rètol visible (R9V-C2-10).
    expect(within(container.querySelector('.noves-tecnologies-rural__veu')).getByRole('button', { name: 'Escolta la IAIA: tota la publicació' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /^Escolta la IAIA/ })).toHaveLength(2);
    expect(within(screen.getByRole('region', { name: 'El Pou de Neu del Rentonar, pas a pas' })).getAllByRole('button', { name: 'Escolta la IAIA: este pas' })).toHaveLength(1);
    expect(container.querySelector('.noves-tecnologies-rural__veu').textContent).toBe('🔊 Escolta la IAIA');
    expect(container.querySelector('section.reproductor-pou')).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Per què un pou de neu en 3D' })).toBeTruthy();
    // Gauntlet R9 · G2-04 · Façana de clic: abans del gest, cap iframe; el botó obri el del vídeo.
    expect(container.querySelector('iframe')).toBeNull();
    fireEvent.click(within(container).getByRole('button', { name: 'Veure el vídeo (YouTube)' }));
    const iframes = container.querySelectorAll('iframe');
    expect(iframes).toHaveLength(1);
    expect(iframes[0].getAttribute('src')).toBe(`https://www.youtube-nocookie.com/embed/${NOVES_TECNOLOGIES_VIDEO.id}`);
    expect(iframes[0].title).toBe(NOVES_TECNOLOGIES_VIDEO.titol);
    // El reproductor va damunt del cos.
    const reproductor = container.querySelector('section.reproductor-pou');
    const cos = container.querySelector('article.detail-content');
    expect(reproductor.compareDocumentPosition(cos) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelector('img')).toBeNull();
  });

  test('una versió editada des de /notes es pinta; una còpia en text pla torna al canònic', () => {
    const { container, unmount } = render(<NovesTecnologiesCulturaRuralArticle item={{ ...POST, content: '<p>Cos <strong>revisat</strong>.</p>' }} />);
    expect(container.querySelector('article.detail-content').textContent).toBe('Cos revisat.');
    unmount();
    const { container: c2 } = render(<NovesTecnologiesCulturaRuralArticle item={{ ...POST, content: 'Una còpia en text pla.' }} />);
    expect(c2.querySelector('article.detail-content').textContent).toContain('Per què un pou de neu en 3D');
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
    expect(meta.getImage(item)).toBeNull();
    const { container } = render(meta.renderBody(item));
    await waitFor(() => expect(container.querySelector('section.reproductor-pou')).not.toBeNull(), { timeout: 10000 });
    expect(container.querySelector('.noves-tecnologies-rural')).not.toBeNull();
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
