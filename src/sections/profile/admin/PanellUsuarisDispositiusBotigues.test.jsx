/* R13-C7 (ordre del Mestre, 08-11-2026) · El 7é apartat d'«🛡️ Administració del sistema»:
   «👥 Usuaris, Dispositius i Botigues (Google i Apple)». Estats de la consulta (sense port, sense
   migració, sense permís, error, dades), els dos botons oficials centrats, la guia dels verificadors,
   la còpia del missatge de WhatsApp (amb i sense porta-retalls) i la regla 2.3.10 dins de l'app d'iOS. */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import PanellUsuarisDispositiusBotigues from './PanellUsuarisDispositiusBotigues.jsx';
import {
  CAMINS_PANELL, MISSATGE_WHATSAPP_VERIFICADORS, NOTA_VERIFICADORS, TEXT_BOTO_CONSULTA, TEXT_ESTAT_INICIAL, TEXTOS_ERROR_RESUM,
  copiaAlPortaretalls, filesDelResum
} from './usuarisDispositiusBotigues.js';
import { TEXTOS_APP_IOS, ambTextosPerAppIos, esAppNativaIos } from './appNativaIos.js';
import { ADRECA_VERIFICADORS_GOOGLE_PLAY, PASSOS_VERIFICADOR_GOOGLE_PLAY, URL_FITXA_APP_STORE } from './assistentBotigues.js';
import { CODI_RESUM_SESSIONS, MIGRACIO_RESUM_SESSIONS, validaResumSessions } from '../../../data/resumSessionsDispositius.js';
import { nomenaPlataformaAliena } from '../../text/perAppNativa.js';
import { itemsDAdministracioSistema } from '../perfilModel.js';

afterEach(() => { cleanup(); delete window.Capacitor; vi.unstubAllGlobals(); });

const RESUM = validaResumSessions({
  consultat_a: '2026-11-08T21:40:00.000Z',
  camins: [
    { cami: 'app_ios', persones_24h: 4, persones_7d: 9, persones_14d: 11 },
    { cami: 'web_ios', persones_24h: 2, persones_7d: 3, persones_14d: 5 },
    { cami: 'app_android', persones_24h: 6, persones_7d: 8, persones_14d: 10 },
    { cami: 'web_android', persones_24h: 1, persones_7d: 2, persones_14d: 3 },
    { cami: 'escriptori', persones_24h: 7, persones_7d: 12, persones_14d: 15 },
    { cami: 'altres', persones_24h: 0, persones_7d: 0, persones_14d: 1 }
  ],
  total: { persones_24h: 17, persones_7d: 28, persones_14d: 37 }
});
const rebuig = (code) => () => Promise.reject(Object.assign(new Error('fallada'), { code }));

/* El que es llig i el que se sent (com ConsolaSection.publica.test.jsx): cada node de text a part i els
   atributs que el lector llig. */
function textQueEsLlig() {
  const trossos = [];
  const camina = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = camina.nextNode(); node; node = camina.nextNode()) trossos.push(node.nodeValue);
  const atributs = [...document.body.querySelectorAll('[aria-label], [title], [alt], [aria-description], [href]')]
    .flatMap((el) => ['aria-label', 'title', 'alt', 'aria-description', 'href'].map((a) => el.getAttribute(a) ?? ''));
  return [...trossos, ...atributs].join(' ');
}
const consultaAra = () => fireEvent.click(screen.getByRole('button', { name: TEXT_BOTO_CONSULTA }));

test('la card és la 7a, just davall d’Empaquetats, amb els camps del Mestre i «verificadors sobre 12» en lloc de «X/12»', () => {
  const apartats = itemsDAdministracioSistema();
  expect(apartats).toHaveLength(7);
  expect(apartats.map((a) => a.id).slice(-2)).toEqual(['admin-empaquetats', 'administracio-usuaris-i-dispositius']);
  expect(apartats[6]).toMatchObject({
    id: 'administracio-usuaris-i-dispositius',
    categoryIds: ['administracio-sistema'],
    title: '👥 Usuaris, Dispositius i Botigues (Google i Apple)',
    subtitle: 'Directori d’usuaris registrats i distribució en viu per canal (Google Play, App Store i Web)',
    icon: '👥',
    data: { vista: 'admin-usuaris-i-dispositius' }
  });
  expect(apartats[6].subtitle).not.toMatch(/X\/12|\d+\/12/);
});

test('estat inicial: el botó centrat i cap xifra fins que es demana', () => {
  render(<PanellUsuarisDispositiusBotigues consulta={vi.fn()} nativaIos={false} />);
  const boto = screen.getByRole('button', { name: TEXT_BOTO_CONSULTA });
  expect(boto.closest('.sdp-admin-actions-inline')).toBeTruthy();
  expect(screen.getByText(TEXT_ESTAT_INICIAL)).toBeTruthy();
  expect(screen.queryByRole('table')).toBeNull();
  expect(screen.getByTestId('estat-usuaris-dispositius').textContent).not.toMatch(/\d/);
});

test('sense el mètode al port (el contracte encara no el declara), el panell ho diu i no mostra cap xifra', async () => {
  render(<PanellUsuarisDispositiusBotigues nativaIos={false} consulta={rebuig(CODI_RESUM_SESSIONS.SENSE_PORT)} />);
  consultaAra();
  const estat = await screen.findByText(TEXTOS_ERROR_RESUM[CODI_RESUM_SESSIONS.SENSE_PORT]);
  expect(estat.textContent).toContain(MIGRACIO_RESUM_SESSIONS);
  expect(estat.textContent).toContain('decisió del Mestre');
  expect(screen.queryByRole('table')).toBeNull();
});

test('el panell de veres, amb el port de l’app: la consulta arriba al port i torna «sense port», sense cap xifra', async () => {
  render(<PanellUsuarisDispositiusBotigues nativaIos={false} />);
  consultaAra();
  expect(await screen.findByText(TEXTOS_ERROR_RESUM[CODI_RESUM_SESSIONS.SENSE_PORT])).toBeTruthy();
  expect(screen.queryByRole('table')).toBeNull();
});

test('sense la RPC a la base (PGRST202 / 404): «falta la migració …, pendent d’ordre del Mestre» i cap número', async () => {
  const consulta = vi.fn(rebuig(CODI_RESUM_SESSIONS.SENSE_MIGRACIO));
  render(<PanellUsuarisDispositiusBotigues nativaIos={false} consulta={consulta} />);
  consultaAra();
  const alerta = await screen.findByText(`La consulta del servidor encara no està aplicada: falta la migració ${MIGRACIO_RESUM_SESSIONS}, pendent d’ordre del Mestre.`);
  expect(alerta).toBeTruthy();
  expect(consulta).toHaveBeenCalledWith(expect.objectContaining({ signal: expect.any(AbortSignal) }));
  expect(screen.queryByRole('table')).toBeNull();
  expect(screen.getByTestId('estat-usuaris-dispositius').textContent.replace(MIGRACIO_RESUM_SESSIONS, '')).not.toMatch(/\d/);
});

test('el servidor la refusa (aal2) o falla la xarxa: la causa, cap xifra, i el mateix botó torna a provar', async () => {
  const consulta = vi.fn()
    .mockImplementationOnce(rebuig(CODI_RESUM_SESSIONS.SENSE_PERMIS))
    .mockImplementationOnce(rebuig(CODI_RESUM_SESSIONS.ERROR))
    .mockResolvedValueOnce(RESUM);
  render(<PanellUsuarisDispositiusBotigues nativaIos={false} consulta={consulta} />);
  consultaAra();
  expect(await screen.findByText(TEXTOS_ERROR_RESUM[CODI_RESUM_SESSIONS.SENSE_PERMIS])).toBeTruthy();
  expect(screen.queryByRole('table')).toBeNull();
  consultaAra();
  expect(await screen.findByText(TEXTOS_ERROR_RESUM[CODI_RESUM_SESSIONS.ERROR])).toBeTruthy();
  expect(screen.queryByRole('table')).toBeNull();
  consultaAra();
  expect(await screen.findByRole('table')).toBeTruthy();
  expect(consulta).toHaveBeenCalledTimes(3);
});

test('un codi desconegut cau a l’error genèric, mai a una xifra', async () => {
  render(<PanellUsuarisDispositiusBotigues nativaIos={false} consulta={rebuig('inventat')} />);
  consultaAra();
  expect(await screen.findByText(TEXTOS_ERROR_RESUM[CODI_RESUM_SESSIONS.ERROR])).toBeTruthy();
});

test('amb dades: una fila per camí amb 24 h, 7 dies i 14 dies, el total, l’hora de la consulta i cap nom ni correu', async () => {
  render(<PanellUsuarisDispositiusBotigues nativaIos={false} consulta={vi.fn().mockResolvedValue(RESUM)} />);
  consultaAra();
  const taula = await screen.findByRole('table');
  const files = within(taula).getAllByRole('row').slice(1);
  expect(files.map((f) => within(f).getByRole('rowheader').textContent)).toEqual([...CAMINS_PANELL.map((c) => c.titol), 'Persones distintes (tots els camins)']);
  const xifres = (cami) => [...screen.getByTestId(`fila-cami-${cami}`).querySelectorAll('td')].map((td) => td.textContent);
  expect(xifres('app_ios')).toEqual(['4', '9', '11']);
  expect(xifres('app_android')).toEqual(['6', '8', '10']);
  expect(xifres('altres')).toEqual(['0', '0', '1']);
  expect(xifres('total')).toEqual(['17', '28', '37']);
  expect(screen.getByText(/App iPhone\/iPad \(App Store v1\.0 · id6826441844\)/)).toBeTruthy();
  expect(taula.querySelector('time').getAttribute('dateTime')).toBe('2026-11-08T21:40:00.000Z');
  expect(screen.getByTestId('nota-verificadors').textContent).toBe(NOTA_VERIFICADORS);
  expect(document.body.textContent).not.toMatch(/@|[0-9a-f]{8}-[0-9a-f]{4}-/i);
});

test('mentre carrega, el botó està ocupat; en eixir del panell, la consulta en vol s’avorta i la resposta tardana no pinta res', async () => {
  let resol;
  const consulta = vi.fn(() => new Promise((r) => { resol = r; }));
  render(<PanellUsuarisDispositiusBotigues nativaIos={false} consulta={consulta} />);
  consultaAra();
  await waitFor(() => expect(consulta).toHaveBeenCalledTimes(1));
  expect(screen.getByTestId('boto-consulta-usuaris-dispositius').disabled).toBe(true);
  expect(screen.getByTestId('estat-usuaris-dispositius').dataset.fase).toBe('carregant');
  const { signal } = consulta.mock.calls[0][0];
  expect(signal.aborted).toBe(false);
  cleanup();
  expect(signal.aborted).toBe(true);
  await act(async () => { resol(RESUM); });
  expect(document.body.textContent).toBe('');
});

test('els dos botons oficials, centrats: l’App Store amb la marca d’Apple i Google Play Beta cap al pas 1 dels verificadors', () => {
  render(<PanellUsuarisDispositiusBotigues consulta={vi.fn()} nativaIos={false} />);
  const appStore = screen.getByRole('link', { name: '🍎 Descarrega a l’App Store' });
  const googlePlay = screen.getByRole('link', { name: '▶️ Descarrega a Google Play Beta' });
  expect(appStore.getAttribute('href')).toBe(URL_FITXA_APP_STORE);
  expect(googlePlay.getAttribute('href')).toBe(ADRECA_VERIFICADORS_GOOGLE_PLAY);
  expect(appStore.className).toBe('sdp-boto sdp-boto--marca sdp-boto--apple sdp-boto--gran');
  expect(googlePlay.className).toBe('sdp-boto sdp-boto--marca sdp-boto--google sdp-boto--gran');
  for (const a of [appStore, googlePlay]) {
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
  }
  expect(appStore.parentElement).toBe(googlePlay.parentElement);
  expect(appStore.parentElement.className).toBe('sdp-admin-actions-inline');
  expect(screen.getByTestId('nota-pas-1-google-play').textContent).toMatch(/^És el pas 1 dels verificadors/);
});

test('la guia dels tres passos és la d’assistentBotigues.js, sense duplicar-la', () => {
  render(<PanellUsuarisDispositiusBotigues consulta={vi.fn()} nativaIos={false} />);
  const guia = screen.getByTestId('guia-verificadors-android');
  expect(within(guia).getAllByRole('listitem').map((li) => li.textContent)).toEqual([...PASSOS_VERIFICADOR_GOOGLE_PLAY]);
  expect(MISSATGE_WHATSAPP_VERIFICADORS).toContain(PASSOS_VERIFICADOR_GOOGLE_PLAY.join('\n'));
  expect(MISSATGE_WHATSAPP_VERIFICADORS).toContain(`Enllaç del pas 1: ${ADRECA_VERIFICADORS_GOOGLE_PLAY}`);
  expect(MISSATGE_WHATSAPP_VERIFICADORS).toContain(URL_FITXA_APP_STORE);
});

test('copiar amb porta-retalls: copia el missatge sencer i ho diu', async () => {
  const writeText = vi.fn().mockResolvedValue(undefined);
  render(<PanellUsuarisDispositiusBotigues consulta={vi.fn()} nativaIos={false} navegador={{ clipboard: { writeText } }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Copia el missatge per al grup de WhatsApp' }));
  expect(await screen.findByText('Missatge copiat: enganxa’l al grup de WhatsApp.')).toBeTruthy();
  expect(writeText).toHaveBeenCalledWith(MISSATGE_WHATSAPP_VERIFICADORS);
  expect(screen.queryByRole('textbox')).toBeNull();
  expect(screen.getByRole('button', { name: 'Copia el missatge per al grup de WhatsApp' }).closest('.sdp-admin-actions-inline')).toBeTruthy();
});

test.each([
  ['sense navigator.clipboard', {}],
  ['amb el porta-retalls que refusa', { clipboard: { writeText: () => Promise.reject(new DOMException('No', 'NotAllowedError')) } }],
  ['amb un porta-retalls sense writeText', { clipboard: {} }]
])('copiar %s: mai diu «copiat» i deixa el text a la vista, seleccionable', async (_nom, navegador) => {
  render(<PanellUsuarisDispositiusBotigues consulta={vi.fn()} nativaIos={false} navegador={navegador} />);
  fireEvent.click(screen.getByRole('button', { name: 'Copia el missatge per al grup de WhatsApp' }));
  const area = await screen.findByRole('textbox', { name: /selecciona el missatge i copia’l a mà/ });
  expect(area.value).toBe(MISSATGE_WHATSAPP_VERIFICADORS);
  expect(area.readOnly).toBe(true);
  expect(document.body.textContent).not.toMatch(/copiat/i);
  fireEvent.focus(area);
  expect([area.selectionStart, area.selectionEnd]).toEqual([0, MISSATGE_WHATSAPP_VERIFICADORS.length]);
});

test('copiaAlPortaretalls: cert només quan el navegador copia', async () => {
  expect(await copiaAlPortaretalls('x', { clipboard: { writeText: async () => {} } })).toBe(true);
  expect(await copiaAlPortaretalls('x', { clipboard: { writeText: () => { throw new Error('sincron'); } } })).toBe(false);
  expect(await copiaAlPortaretalls('x', null)).toBe(false);
});

test('regla 2.3.10: dins de l’app d’iOS el panell no nomena Android ni Google Play, ni en buit ni amb dades', async () => {
  window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios' };
  expect(esAppNativaIos()).toBe(true);
  render(<PanellUsuarisDispositiusBotigues consulta={vi.fn().mockResolvedValue(RESUM)} />);
  expect(nomenaPlataformaAliena(textQueEsLlig())).toBe(false);
  expect(screen.getByRole('link', { name: '🍎 Descarrega a l’App Store' })).toBeTruthy();
  expect(screen.queryByTestId('boto-descarrega-google-play')).toBeNull();
  expect(screen.queryByTestId('guia-verificadors-android')).toBeNull();
  expect(screen.queryByRole('button', { name: /WhatsApp/ })).toBeNull();
  consultaAra();
  await screen.findByRole('table');
  expect(screen.getByTestId('fila-cami-app_ios')).toBeTruthy();
  expect(screen.queryByTestId('fila-cami-app_android')).toBeNull();
  expect(screen.queryByTestId('fila-cami-web_android')).toBeNull();
  expect(screen.queryByTestId('nota-verificadors')).toBeNull();
  expect(nomenaPlataformaAliena(textQueEsLlig())).toBe(false);
});

test('regla 2.3.10 (la prova sap trobar-ho): a la web i a l’app d’Android sí que en parla', () => {
  render(<PanellUsuarisDispositiusBotigues consulta={vi.fn()} />);
  expect(nomenaPlataformaAliena(textQueEsLlig())).toBe(true);
  cleanup();
  window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'android' };
  expect(esAppNativaIos()).toBe(false);
  render(<PanellUsuarisDispositiusBotigues consulta={vi.fn()} />);
  expect(screen.getByTestId('boto-descarrega-google-play')).toBeTruthy();
});

test('regla 2.3.10: una plataforma nativa que no es pot llegir compta com a iOS; la card i la capçalera canvien de text', () => {
  window.Capacitor = { isNativePlatform: () => true, getPlatform: () => { throw new Error('pont trencat'); } };
  expect(esAppNativaIos()).toBe(true);
  const card = itemsDAdministracioSistema().find((a) => a.id === 'administracio-usuaris-i-dispositius');
  const adaptada = ambTextosPerAppIos(card);
  expect(adaptada).toMatchObject({ ...TEXTOS_APP_IOS, id: card.id, data: card.data, icon: card.icon });
  expect(nomenaPlataformaAliena(`${adaptada.title} ${adaptada.subtitle} ${adaptada.searchText}`)).toBe(false);
  const altra = itemsDAdministracioSistema()[0];
  expect(ambTextosPerAppIos(altra)).toBe(altra);
});

test('filesDelResum: l’ordre dels camins i, a iOS, sense els que nomenen una altra plataforma', () => {
  expect(filesDelResum(RESUM).map((f) => f.cami)).toEqual(CAMINS_PANELL.map((c) => c.cami));
  expect(filesDelResum(RESUM, { nativaIos: true }).map((f) => f.cami)).toEqual(['app_ios', 'web_ios', 'escriptori', 'altres']);
  expect(filesDelResum(null)).toEqual([]);
});
