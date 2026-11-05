import React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ManifestDePobleArticle, MANIFEST_PDF_URL, MANIFEST_PROPOSTES_URL, MANIFEST_ADHESIO_URL } from './ManifestDePobleArticle.jsx';
import { MANIFEST_DE_POBLE_POST, MOCK_FEED } from '../feedSeed.js';
import { FEED_POSTS } from '../feedContent.js';
import { IMPORTANTS_HISTORIQUES_DEL_MUR, llavorAmbDatesDeProva } from '../datesDeProvaMur.js';
import { POBLES_APLEC_2023 } from '../../pobles/townsSeed.js';
import { buildMurDetailSectionMeta } from '../../detail/detailSectionMeta.jsx';
import { dataDElement, momentDElement } from '../../../components/universal/editorial.js';
import { fixaBaseRecursos } from '../../../config/assetResolver.js';

afterEach(() => { cleanup(); fixaBaseRecursos(''); });

test('WP 16893 conserva la publicació històrica, autoria, territori, quatre etiquetes i llicència', () => {
  const post = MANIFEST_DE_POBLE_POST;
  expect(MOCK_FEED).toContain(post);
  expect(post).toMatchObject({ id: 'manifest-de-poble', slug: 'manifest-de-poble', created_at: '2022-11-17T23:50:00+01:00',
    publish_date: '2022-11-17T23:50:00+01:00', boinaDataPublicacio: true, author_entity_id: 'socdepoble', author_name: 'Sóc de Poble',
    author_location: 'La Torre de les Maçanes', town: 'La Torre de les Maçanes', poble_id: 'la-torre-de-les-macanes',
    source_url: 'https://socdepoble.net/2022/11/17/manifest-de-poble/', license: 'CC BY-NC-SA 4.0', wp_id: 16893 });
  expect(post.tags).toEqual(['Aplec pel Territori', 'Esdeveniments', 'Posant en Valor els Recursos Locals', 'Reivindicant']);
  expect(post.pobles_etiquetats).toEqual([...POBLES_APLEC_2023.map(poble => poble.id), 'la-vall-d-ebo']);
  expect(new Set(post.pobles_etiquetats).size).toBe(22);
  expect(dataDElement(post).date).toBe('17/11/22');
  expect(dataDElement(post).time).toBe('23:50');
  expect(momentDElement(post)).toBe(Date.parse('2022-11-17T23:50:00+01:00'));
});

test('la publicació important conserva 2022 també en la demostració temporal del Mur', () => {
  expect(IMPORTANTS_HISTORIQUES_DEL_MUR).toContainEqual(['feedPosts', 'manifest-de-poble']);
  const post = FEED_POSTS.find(item => item.id === 'manifest-de-poble');
  expect(post.important).toBe(true);
  expect(post.searchText).toContain('manifest de poble');
  const seeded = llavorAmbDatesDeProva({ feedPosts: [post] }, new Date('2026-11-05T12:00:00+01:00'));
  expect(seeded.feedPosts[0].created_at).toBe(MANIFEST_DE_POBLE_POST.created_at);
  expect(post.imageSrc).toBe('/assets/mur/manifest-de-poble/logo-manifest-de-poble-retallat.webp');
});

test('el cos preserva les figures i el text dels pilars amb PDF, propostes, Facebook i tres entitats clicables', () => {
  const { container } = render(<ManifestDePobleArticle />);
  expect(screen.getByRole('heading', { name: 'Despoblament' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Abandonament de l’agricultura' })).toBeTruthy();
  expect(container.textContent).toContain('Revitalitzant estos aspectes, la resta fluirà sol!');
  expect(container.textContent).toContain('12.000 ha');
  expect(container.textContent).toContain('Les característiques puntuals són diferents, en turisme, en envelliment, en comunicacions, en proximitat a grans nuclis, en serveis bàsics…');
  expect(container.textContent).toContain('Els sotasignats som associacions amb llarga trajectòria en la defensa del territori i del nostre patrimoni natural i humà vinculat sobre tot al món rural.');
  expect(container.textContent).toContain('Posa’t en contacte amb la Comissió Redactora si creus que pots aportar!');
  for (const href of [MANIFEST_PDF_URL, MANIFEST_PROPOSTES_URL, 'https://www.facebook.com/aplecpelterritori']) expect(container.querySelector(`a[href="${href}"]`)).not.toBeNull();
  for (const [src, href] of [['logo-coordinadora-circular-300x300.jpg', 'http://zona14.org'], ['logo-rentonar-300x300.png', '/rentonar'], ['logo-socdepoble-300x300.png', '/socdepoble']]) {
    expect(container.querySelector(`img[src$="${src}"]`).closest('a').getAttribute('href')).toBe(href);
  }
  expect(container.querySelector('img[src*="aplec-pel-territori-2023-A4"]').closest('a').getAttribute('href')).toBe('/events/aplec-2023');
  expect(container.querySelector('img[src*="ponents-aplec-2023"]')).not.toBeNull();
  expect(container.querySelector('h1,h2')).toBeNull();
  expect(container.textContent).toContain('CC BY-NC-SA 4.0 Sóc de Poble');
});

test('el formulari és una acció accessible de Pedra Seca, sense cap iframe ni altura artificial', () => {
  const { container } = render(<ManifestDePobleArticle />);
  const action = screen.getByRole('link', { name: 'Adherir-me al Manifest de Poble (s’obri en una altra pestanya)' });
  expect(action.href).toBe(MANIFEST_ADHESIO_URL);
  expect(action.classList.contains('sdp-boto--primari')).toBe(true);
  expect(action.target).toBe('_blank');
  expect(action.rel).toBe('noopener noreferrer');
  expect(container.querySelector('iframe')).toBeNull();
  expect(container.querySelector('[height="9100"],[style*="9100"]')).toBeNull();
});

test('la fitxa del Mur munta el Manifest real i mostra el logo una sola vegada', () => {
  const item = FEED_POSTS.find(post => post.id === 'manifest-de-poble');
  const meta = buildMurDetailSectionMeta({ feedPosts: FEED_POSTS, t: (_, fallback) => fallback });
  expect(meta.items).toContain(item);
  expect(meta.getImage(item)).toBeNull();
  const { container } = render(meta.renderBody(item));
  expect(container.querySelectorAll('img[src$="logo-manifest-de-poble-retallat.webp"]')).toHaveLength(1);
  expect(container.querySelector('.manifest-de-poble')).not.toBeNull();
  expect(meta.getImage({ id: 'altra', image_url: '/assets/exemple.jpg' })).toBe('/assets/exemple.jpg');
});

test('els recursos són locals i conserven la base del paquet quan s’incrusta en un amfitrió', () => {
  fixaBaseRecursos('https://amfitrio.test/plugin');
  const { container } = render(<ManifestDePobleArticle />);
  const images = [...container.querySelectorAll('img')];
  expect(images).toHaveLength(8);
  for (const image of images) {
    expect(image.src).toMatch(/^https:\/\/amfitrio\.test\/plugin\/assets\/(mur\/manifest-de-poble|events\/aplec-2023)\//);
    expect(image.alt.trim()).not.toBe('');
    expect(existsSync(path.resolve('public', '.' + image.getAttribute('src').replace('https://amfitrio.test/plugin', '')))).toBe(true);
  }
  for (const link of container.querySelectorAll('a[href="/events/aplec-2023"]')) expect(link.target).toBe('');
});
