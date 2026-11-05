import React from 'react';
import '../../../tests/helpers/diccionaris.js';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children, ...rest }) => <a href={to} {...rest}>{children}</a>
}));
vi.mock('../pobles/PublicacionsDelPoble.jsx', () => ({ default: ({ poble, pestanya }) => <p data-vista={pestanya}>{poble.id}:{pestanya}</p> }));
vi.mock('../pobles/EntitatsDelPoble.jsx', () => ({ default: () => <p>Entitats obertes</p> }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import { esDelPoble, parlaDelPoble, poblesEsmentatsDeLaPublicacio, corresponAPestanyaDelPoble, itemsDelPoble } from './clauDelPoble.js';
import { MOCK_TOWNS, POBLES_APLEC_2023 } from './townsSeed.js';
import { arbreTerritorial, filtraTerritori } from './territoriDelPoble.js';
import { ArbreTerritorial, CamiTerritorial } from './TerritoriDelPoble.jsx';
import { buildPoblesDetailSectionMeta } from '../detail/detailSectionMeta.jsx';
import { createTranslator } from '../../config/i18n.js';

const t = (_, fallback) => fallback;
const origen = { id: 'la-torre-de-les-macanes', title: 'La Torre de les Maçanes' };
const benillup = MOCK_TOWNS.find((town) => town.id === 'benillup');
const item = { id: 'aplec-exemple', poble_id: origen.id, author_location: origen.title, pobles_esmentats: ['benillup', 'planes'], created_at: '2022-11-17T20:03:41Z' };
afterEach(cleanup);

describe('AH-17 · autoria i pobles esmentats són independents', () => {
  test('Tot és la unió, Gent és autoria i Xarxa exclou sempre l’autoria local', () => {
    expect(esDelPoble(item, origen)).toBe(true);
    expect(esDelPoble(item, benillup)).toBe(false);
    expect(parlaDelPoble(item, benillup)).toBe(true);
    for (const [town, esperat] of [[origen, [true, true, false]], [benillup, [true, false, true]]]) {
      expect(['tot', 'gent', 'xarxa'].map((pestanya) => corresponAPestanyaDelPoble(item, town, pestanya))).toEqual(esperat);
    }
    const localEtiquetat = { ...item, pobles_esmentats: [origen.id] };
    expect(corresponAPestanyaDelPoble(localEtiquetat, origen, 'xarxa')).toBe(false);
    expect(itemsDelPoble({ events: [item, item] }, benillup, 'tot')).toHaveLength(1);
    expect(itemsDelPoble({ events: [item] }, benillup, 'gent')).toEqual([]);
  });
  test('etiquetes per nom complet o slug, sense coincidències parcials ni atribuir el lloc de l’acte a l’autor', () => {
    expect(parlaDelPoble({ tags: ['Benillup'], location: 'Benillup', poble_id: origen.id }, benillup)).toBe(true);
    expect(esDelPoble({ location: 'Benillup', poble_id: origen.id }, benillup)).toBe(false);
    expect(parlaDelPoble({ tags: ['Benillup i Planes', 'benillup-extra'] }, benillup)).toBe(false);
    expect(poblesEsmentatsDeLaPublicacio({ labels: [{ text: 'Benillup' }, { slug: 'benillup' }], tags: [null, {}, 0] })).toContain('benillup');
    expect(parlaDelPoble(null, benillup)).toBe(false);
  });
});

describe('AH-17 / AH-19 · arbre territorial i fitxes', () => {
  test('21 categories participants úniques, pobles nous accessibles i pedanies amb municipi pare', () => {
    expect(POBLES_APLEC_2023).toHaveLength(21);
    expect(new Set(POBLES_APLEC_2023.map((poble) => poble.id)).size).toBe(21);
    expect(POBLES_APLEC_2023.every((poble) => MOCK_TOWNS.some((town) => town.id === poble.id))).toBe(true);
    expect(MOCK_TOWNS.find((poble) => poble.id === 'benialfaqui').parent_poble_id).toBe('planes');
    expect(MOCK_TOWNS.find((poble) => poble.id === 'beniaia').parent_poble_id).toBe('la-vall-d-alcala');
    const arbre = arbreTerritorial(MOCK_TOWNS);
    expect(arbre.map((provincia) => provincia.id)).toEqual(['alacant', 'valencia', 'castello']);
    expect(arbre[0].comarques.find((comarca) => comarca.id === 'el-comtat').pobles).toContain(benillup);
    expect(filtraTerritori(MOCK_TOWNS, 'alacant', 'el-comtat').every((poble) => poble.comarca === 'El Comtat')).toBe(true);
    expect(filtraTerritori(MOCK_TOWNS, 'valencia', null)).toEqual([]);
  });
  test('la xarxa porta a demarcació, comarca, poble i pedania amb rutes funcionals', () => {
    render(<ArbreTerritorial pobles={MOCK_TOWNS} t={t} />);
    expect(screen.getByRole('navigation', { name: 'Territori' })).toBeTruthy();
    const benialfaqui = screen.getByRole('link', { name: 'Benialfaquí', hidden: true });
    expect(benialfaqui.getAttribute('href')).toBe('/pobles/benialfaqui');
    expect(benialfaqui.closest('ul').parentElement.firstChild.textContent).toBe('Planes');
    expect(screen.getByRole('link', { name: 'El Comtat', hidden: true }).getAttribute('href')).toBe('/pobles?provincia=alacant&comarca=el-comtat');
  });
  test('la fitxa conserva tot el camí territorial', () => {
    render(<CamiTerritorial poble={MOCK_TOWNS.find((poble) => poble.id === 'benialfaqui')} t={t} />);
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Xarxa de Pobles', "Comarques d'Alacant", 'El Comtat', 'Planes', 'Benialfaquí']);
  });
  test('la pàgina obri Tot, permet Gent i Xarxa i conserva Empreses i entitats', async () => {
    const meta = buildPoblesDetailSectionMeta({ t });
    const { container } = render(meta.renderBody(benillup, { detall: true, senseXat: true }));
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Tot', 'Gent de Benillup', 'Xarxa', 'Empreses i entitats']);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    await screen.findByText('benillup:tot');
    fireEvent.click(tabs[1]);
    await screen.findByText('benillup:gent');
    expect(container.querySelector('[data-vista="tot"]')).toBeNull();
    fireEvent.click(tabs[2]);
    await screen.findByText('benillup:xarxa');
    fireEvent.click(tabs[3]);
    expect(await screen.findByText('Entitats obertes')).toBeTruthy();
  });
  test.each([['ca','Tot','Xarxa'],['es','Todo','Red'],['en','All','Network'],['eu','Dena','Sarea'],['gl','Todo','Rede']])('pestanyes en %s', (lang, tot, xarxa) => {
    const tradueix = createTranslator(lang);
    expect(tradueix('section.detail.pobles.tot')).toBe(tot);
    expect(tradueix('section.detail.pobles.xarxa')).toBe(xarxa);
  });
});
