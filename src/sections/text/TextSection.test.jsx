/**
 * T71 · Prova d'igualtat de TextSection (Llei del Píxel). Servix set rutes
 * (/projecte, /constitucio, /ia, /roadmap, /versions, /legal i /page/:slug)
 * i fins ara no tenia cap prova: esta fixa, prop per prop, el que rep la
 * UniversalPage i el cos sanejat, perquè extraure'n les props a
 * paginaDeText.js (i compartir-les amb el lector de connexions) no puga
 * canviar cap píxel sense que ho sàpiga ningú.
 */
import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ props: null, seo: vi.fn(), t: (_, alternativa) => alternativa }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: (...args) => mocks.seo(...args) }));
/* La pàgina, reduïda al que rep: les props sense els fills, i els fills pintats. */
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children, ...props }) => {
    mocks.props = props;
    return React.createElement('div', { 'data-pagina': '' }, children);
  }
}));
import TextSection from './TextSection.jsx';
import { PAGE_COPY } from './pageContent.js';
import { COPYRIGHT_SDP, dataHoraDeBarra } from '../../components/universal/editorial.js';

afterEach(cleanup);
beforeEach(() => {
  mocks.props = null;
  mocks.seo.mockClear();
  mocks.t = (_, alternativa) => alternativa;
});

test('L’Ànima de la IAIA (/ia): les props exactes de la UniversalPage i el cos sanejat', () => {
  const pagina = PAGE_COPY.anima;
  const { container } = render(<TextSection page={pagina} pageKey="anima" />);
  expect(mocks.props).toEqual({
    title: "L'Ànima de la IAIA",
    subtitle: pagina.subtitle,
    lead: pagina.lead,
    heroImage: '/assets/uploads/brain/nano_anima_mas_ibanez_v3_1781060081431.webp',
    heroWidth: 1024,
    heroHeight: 1024,
    heroFetchPriority: 'high',
    heroAlt: 'Il·lustració de la IAIA',
    showLogos: true,
    labels: pagina.labels,
    copyright: COPYRIGHT_SDP,
    ...dataHoraDeBarra({ creat: '2026-08-11T00:00:00.000Z' }),
    chrome: 'full',
    topBarData: { showPin: false }
  });
  // T4 del prompt 1140 (ordre del Mestre, 261001) · La data del copy és un
  // instant: la pastilla porta l'hora i el dia locals. L'Ànima encara no té
  // hora de publicació coneguda (anterior al registre de git; capçalera de
  // pageContent.js) i conserva la mitjanit UTC: «02:00» fins que el Mestre la diga.
  expect(mocks.props.date).toBe('11/08/26');
  expect(mocks.props.time).toBe('02:00');
  const cos = container.querySelector('[data-pagina] > article.cms-preview');
  expect(cos.querySelector('h3').textContent).toBe('El Despertar de la Nina de Silici');
  /* Pla 261027_1154 (P1-61), Fase 1 · La pàgina porta imatge pròpia: el
     <head> la porta absoluta i https, no la targeta genèrica d'abans. La
     portada que es pinta (heroImage, dalt) no canvia. */
  /* Pla 261028_1526 (P1-61, Fase 2; decisió per defecte D6) · La descripció
     és l'entradeta (lead-first), la mateixa que escriu el prerender
     (metadadesSocials.js · metadadesDePagina). */
  expect(mocks.seo).toHaveBeenCalledWith({
    title: "L'Ànima de la IAIA", description: pagina.lead,
    /* Revisió adversarial (261027) · Amb el seu alt: el de page.image (imageAlt).
       Pla 261029_0216 (R-01) · Al <head>, la variant social de la il·lustració
       (JPEG real de 1200x630 i ≤300 KB, imatgeSocial.js · VARIANTS_SOCIALS);
       la portada (heroImage, dalt) continua sent el WebP original. */
    image: { url: 'https://socdepoble.org/assets/uploads/brain/nano_anima_mas_ibanez_v3_1781060081431-social-1200x630.jpg', alt: pagina.imageAlt }
  });
});

test('pàgina sense imatge, etiquetes, data ni chrome: les reserves de sempre', () => {
  mocks.t = (clau, alternativa) => (clau === 'section.text.page' ? 'Page' : alternativa);
  const pagina = { title: 'Sense res', lead: 'Només entradilla', html: '<p>Hola</p><script>alert(1)</script>' };
  const { container } = render(<TextSection page={pagina} pageKey="provant" />);
  expect(mocks.props).toEqual({
    title: 'Sense res',
    subtitle: undefined,
    lead: 'Només entradilla',
    heroImage: '/assets/uploads/brain/hero_panoramic_rural_view_1774720664221.png',
    heroAlt: "Panoràmica d'un poble fictici",
    showLogos: true,
    labels: [
      { text: 'PROVANT', className: 'sdp-badge-system' },
      { text: 'Page', className: 'sdp-badge-category' }
    ],
    copyright: COPYRIGHT_SDP,
    time: '', date: '', dateTime: '',
    chrome: 'full',
    topBarData: { showPin: false }
  });
  // L'HTML passa pel sanejador: el script no arriba al DOM.
  const cos = container.querySelector('article.cms-preview');
  expect(cos.querySelector('script')).toBeNull();
  expect([...cos.children].map((fill) => fill.outerHTML)).toEqual(['<p>Hola</p>']);
  expect(mocks.seo).toHaveBeenCalledWith(expect.objectContaining({ description: 'Només entradilla' }));
});

/* T8 (ordre del Mestre, 261004, prompt 261004_0515 §6) · `accioPrincipal`
   arriba a la UniversalPage (la ranura de PageFrame davall de l'H1) NOMÉS
   quan n'hi ha: amb null, cap clau nova, i les props són les exactes de
   sempre (Llei del Píxel, les proves d'igualtat de dalt). */
test('T8 · accioPrincipal passa a la UniversalPage només quan n’hi ha', () => {
  const pagina = PAGE_COPY.anima;
  render(<TextSection page={pagina} pageKey="anima" />);
  const senseAccio = { ...mocks.props };
  expect(Object.hasOwn(senseAccio, 'accioPrincipal')).toBe(false);
  cleanup();
  render(<TextSection page={pagina} pageKey="anima" accioPrincipal={null} />);
  expect(mocks.props).toEqual(senseAccio);
  expect(Object.hasOwn(mocks.props, 'accioPrincipal')).toBe(false);
  cleanup();
  const accio = <a href="/notes" className="sdp-boto">Publicar</a>;
  render(<TextSection page={pagina} pageKey="anima" accioPrincipal={accio} />);
  expect(mocks.props.accioPrincipal).toBe(accio);
  const resta = { ...mocks.props };
  delete resta.accioPrincipal;
  expect(resta).toEqual(senseAccio);
});

/* Ordre del Mestre (261007) · «Comentaris = xat» · Una pàgina de text no passa
   cap Comentar propi: el de la seua barra és el menú de dues vies de totes
   les pàgines (PageFrame i useAccions: «En privat», el xat amb Sóc de Poble;
   «En públic», el xat comú de la ruta). Derogat el gestor propi del mateix
   dia, que només oferia el missatge directe i saltava la via pública. */
test('261007 · una pàgina de text no passa cap Comentar propi: la barra oferix les dues vies', () => {
  for (const clau of ['projecte', 'xat']) {
    render(<TextSection page={PAGE_COPY[clau]} pageKey={clau} />);
    expect([clau, Object.hasOwn(mocks.props, 'onComment')]).toEqual([clau, false]);
    cleanup();
  }
});

/* Ordre del Mestre (261007), proposta P4 · `onConnect` arriba a la
   UniversalPage NOMÉS quan n'hi ha: sense, la UniversalPage connecta la ruta
   on està la persona, com sempre. */
test('261007 · onConnect passa a la UniversalPage només quan n’hi ha', () => {
  render(<TextSection page={PAGE_COPY.xat} pageKey="xat" />);
  expect(Object.hasOwn(mocks.props, 'onConnect')).toBe(false);
  cleanup();
  const connecta = vi.fn();
  render(<TextSection page={PAGE_COPY.xat} pageKey="xat" onConnect={connecta} />);
  expect(mocks.props.onConnect).toBe(connecta);
});

/* Ordre del Mestre (261007) · «El Xat»: la portada del Mestre (1024×1024,
   prioritat alta), el títol, el subtítol, les etiquetes del document i la
   data que ha fixat el Mestre (01:30 hora local del 07-10-2026). */
test('261007 · El Xat: les props de la seua UniversalPage', () => {
  const pagina = PAGE_COPY.xat;
  const { container } = render(<TextSection page={pagina} pageKey="xat" />);
  expect(mocks.props).toEqual({
    title: 'El Xat',
    subtitle: pagina.subtitle,
    lead: pagina.lead,
    heroImage: '/assets/uploads/brain/xat_portada.webp',
    heroWidth: 1024,
    heroHeight: 1024,
    heroFetchPriority: 'high',
    heroAlt: pagina.imageAlt,
    showLogos: true,
    labels: [
      { text: 'Comunicació', className: 'sdp-badge-system' },
      { text: 'Eina', className: 'sdp-badge-category' }
    ],
    copyright: COPYRIGHT_SDP,
    ...dataHoraDeBarra({ creat: '2026-10-07T01:30:00+02:00' }),
    chrome: 'full',
    topBarData: { showPin: false }
  });
  expect([mocks.props.time, mocks.props.date]).toEqual(['01:30', '07/10/26']);
  const cos = container.querySelector('[data-pagina] > article.cms-preview');
  expect(cos.querySelector('h3').textContent).toBe('Com a casa, sense res nou que aprendre');
  expect(cos.querySelector('h1, h2')).toBeNull();
});

/* Gauntlet 261017 (Bloc 3.1; troballa C12 de l'auditoria de Codex) · La
   pàgina del Xat explica la familiaritat com un objectiu de disseny (el patró
   de missatgeria que la gent ja coneix): cap marca aliena, cap afirmació de
   còpia i cap garantia absoluta. La privacitat diu el que l'avís legal sosté
   i hi porta. El full de ruta (el pont d'interoperabilitat amb una app
   externa, ús nominatiu) i l'avís legal no són d'esta pàgina. */
test('Gauntlet 261017 · El Xat: sense marca aliena, sense còpia i sense garanties absolutes', () => {
  const { container } = render(<TextSection page={PAGE_COPY.xat} pageKey="xat" />);
  const cos = container.querySelector('[data-pagina] > article.cms-preview');
  const text = `${PAGE_COPY.xat.title} ${PAGE_COPY.xat.subtitle} ${PAGE_COPY.xat.lead} ${cos.textContent}`;
  expect(text).not.toMatch(/whats\s*app|\bmeta\b|clon|calca|clavat|absolut|indestructible|garantia/i);
  expect(PAGE_COPY.xat.lead).toBe('Hem integrat una missatgeria que funciona com les que ja coneixes. Sense descarregar aplicacions noves, sense configuracions estranyes i sense vendre ni cedir les teues converses a ningú.');
  expect([...cos.querySelectorAll('a')].map((a) => [a.getAttribute('href'), a.textContent])).toEqual([['/legal', 'Legal i privacitat']]);
});

test('el chrome del copy mana i els fills van davall del text', () => {
  const { container } = render(
    <TextSection page={{ title: 'Legal', html: '<p>Text</p>', chrome: 'context', date: '2026-09-01T10:30:00.000Z' }} pageKey="legal">
      <p className="viu">Tauler</p>
    </TextSection>
  );
  expect(mocks.props.chrome).toBe('context');
  expect(mocks.props).toMatchObject(dataHoraDeBarra({ creat: '2026-09-01T10:30:00.000Z' }));
  const fills = container.querySelector('[data-pagina]').children;
  expect(fills[0].tagName).toBe('ARTICLE');
  expect(fills[1].className).toBe('viu');
  // Sense entradeta ni subtítol, la descripció genèrica (CAP_SOCIAL_BASE), com el prerender.
  expect(mocks.seo).toHaveBeenCalledWith(expect.objectContaining({ description: 'Portal de pobles connectats' }));
});
