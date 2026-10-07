/* Ordre del Mestre (261007) · «Cards de veritat»: la UniversalCard d'una
   pàgina és la miniatura de la seua UniversalPage, amb la MATEIXA regla
   d'autoria de la barra taronja (PageFrame). */
import { describe, expect, test } from 'vitest';
import { DEFAULT_AUTHOR } from './UniversalUtils.js';
import { propsDeTargetaDeLaPagina } from './targetaDeLaPagina.js';

const PAGINA = Object.freeze({
  title: 'La festa',
  subtitle: 'Música a la plaça',
  lead: 'Tota la nit',
  heroImage: '/assets/festa.png',
  heroAlt: 'La plaça plena',
  labels: [{ text: 'Sistema', className: 'sdp-badge-system' }],
  copyright: '© Pepet',
  time: '22:00',
  date: '15/08/26',
  dateTime: '2026-08-15T22:00:00+02:00'
});

describe('propsDeTargetaDeLaPagina', () => {
  test('les dades de la pàgina passen a la targeta, sense cap acció', () => {
    expect(propsDeTargetaDeLaPagina(PAGINA)).toEqual({
      title: 'La festa',
      subtitle: 'Música a la plaça',
      body: 'Tota la nit',
      imageUrl: '/assets/festa.png',
      imageAlt: 'La plaça plena',
      imatgePrivada: false,
      labels: PAGINA.labels,
      copyright: '© Pepet',
      time: '22:00',
      date: '15/08/26',
      dateTime: '2026-08-15T22:00:00+02:00',
      author: DEFAULT_AUTHOR.name,
      authorHref: DEFAULT_AUTHOR.href,
      avatarUrl: DEFAULT_AUTHOR.avatarUrl,
      location: DEFAULT_AUTHOR.location
    });
    const claus = Object.keys(propsDeTargetaDeLaPagina(PAGINA));
    expect(claus.filter((clau) => /^on[A-Z]|mainHref|objecte|accio/.test(clau))).toEqual([]);
  });

  test('un autor propi: el seu nom, la seua ruta, el seu poble i el seu avatar', () => {
    expect(propsDeTargetaDeLaPagina({ ...PAGINA, authorName: 'Pep', authorHref: '/perfil/persona/pep', authorLocation: 'Ador', authorAvatar: '/assets/pep.png' }))
      .toMatchObject({ author: 'Pep', authorHref: '/perfil/persona/pep', location: 'Ador', avatarUrl: '/assets/pep.png' });
  });

  test('la regla de PageFrame: sense nom signa Sóc de Poble; un nom propi sense ruta no porta enllaç', () => {
    expect(propsDeTargetaDeLaPagina({ ...PAGINA, authorName: 'Pep' })).toMatchObject({ author: 'Pep', authorHref: undefined });
    expect(propsDeTargetaDeLaPagina({ ...PAGINA, authorName: 'Pep', authorHref: null }).authorHref).toBeUndefined();
    expect(propsDeTargetaDeLaPagina({ ...PAGINA, authorHref: null }).authorHref).toBe(DEFAULT_AUTHOR.href);
    // Un nom declarat buit (null) no s'endevina, com a la barra.
    expect(propsDeTargetaDeLaPagina({ ...PAGINA, authorName: null }).author).toBeUndefined();
  });

  test('el poble i l’avatar per defecte només quan no arriben (undefined), no amb un null', () => {
    expect(propsDeTargetaDeLaPagina({ ...PAGINA, authorName: 'Pep' })).toMatchObject({ location: DEFAULT_AUTHOR.location, avatarUrl: DEFAULT_AUTHOR.avatarUrl });
    expect(propsDeTargetaDeLaPagina({ ...PAGINA, authorName: 'Pep', authorLocation: null, authorAvatar: null }))
      .toMatchObject({ location: undefined, avatarUrl: undefined });
  });

  test('els buits no es pinten i sense títol no hi ha targeta', () => {
    expect(propsDeTargetaDeLaPagina({ title: 'Sola', subtitle: '', lead: null, heroImage: '' })).toMatchObject({ subtitle: undefined, body: undefined, imageUrl: undefined, imageAlt: '' });
    expect(propsDeTargetaDeLaPagina({ subtitle: 'Sense títol' })).toBeNull();
    expect(propsDeTargetaDeLaPagina(null)).toBeNull();
  });
});
