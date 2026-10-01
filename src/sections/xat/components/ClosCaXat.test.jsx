/* Onada 3B (captura 19.11.50) · El rail del Xat a soles: RailXat dins d'un
   AppGridContext de mentida, amb la navegació substituïda per `onVes`.
   Plegat i desplegat, les seccions «Més» i «Comunitats», el peu amb l'avatar
   propi, els destins de cada entrada, l'entrada activa i, en estret, el
   panell que es tanca en triar. */
import { useEffect, useRef } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import AppGridShell, { AppGridContext, useAppGrid } from '../../../components/layout/AppGridShell.jsx';
import { getVal, setVal, delVal } from '../../../config/storage.js';
import { agrupaComunitats, mapejaFil } from '../missatges.js';
import { BotoObriRail, CLAU_RAIL, ENTRADES_RAIL, RailXat, RUTA_PERFIL, VISTES_XAT, clauSeccio, entradaDeVista, rutaDeVista } from './ClosCaXat.jsx';

const lloc = vi.hoisted(() => ({ pathname: '/xat', navigate: vi.fn() }));
vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => lloc.navigate,
  useLocation: () => ({ pathname: lloc.pathname }),
  useSearchParams: () => [new URLSearchParams()],
  useParams: () => ({}),
  useRouter: () => ({ navigate: lloc.navigate, currentPath: lloc.pathname }),
  Link: ({ children }) => children
}));

const t = (_, alternativa) => alternativa;
const CLAUS = [CLAU_RAIL, clauSeccio('mes'), clauSeccio('comunitats')];
let abans = [];

beforeEach(() => {
  abans = CLAUS.map((clau) => [clau, getVal(clau)]);
  CLAUS.forEach((clau) => delVal(clau));
  lloc.pathname = '/xat';
  lloc.navigate.mockClear();
});
afterEach(() => {
  cleanup();
  for (const [clau, valor] of abans) {
    if (valor == null) delVal(clau);
    else setVal(clau, valor);
  }
});

function comunitats() {
  const fils = [
    { id: 'c-1', tipus: 'comunitat', titol: 'Almàssera' },
    { id: 'a-1', tipus: 'canal', titol: 'Avisos', comunitatId: 'c-1', ultimAl: '2026-09-28T10:00:00Z' },
    { id: 'c-2', tipus: 'comunitat', titol: 'Sóc de Poble', imatgeUrl: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg' },
    { id: 'g-2', tipus: 'grup', titol: 'General', comunitatId: 'c-2', ultimAl: '2026-09-28T11:00:00Z' }
  ].map((f) => mapejaFil(f));
  return agrupaComunitats(fils);
}

function arbre({ mida = 'ample', plegat = false, setPanellObert = vi.fn(), onVes = null, onAlterna = vi.fn(), ...props } = {}) {
  return (
    <AppGridContext.Provider value={{ mida, setPanellObert }}>
      <RailXat titol="Menú" t={t} plegat={plegat} onAlterna={onAlterna} onVes={onVes} joId="jo" joNom="Javi Llinares" {...props} />
    </AppGridContext.Provider>
  );
}

function pinta({ setPanellObert = vi.fn(), ...props } = {}) {
  const onAlterna = vi.fn();
  const vista = render(arbre({ setPanellObert, onAlterna, ...props }));
  return { ...vista, onAlterna, setPanellObert };
}

/* El nom que es llig: aria-label (plegat, seccions, llapis) o l'etiqueta de
   la fila (desplegat; l'avatar sense imatge també porta les inicials). */
const nomDe = (b) => b.getAttribute('aria-label') || b.querySelector('.sdp-workspace-nav-item__label')?.textContent || b.textContent;
const noms = (arrel) => within(arrel).getAllByRole('button').map(nomDe);

test('les entrades i les vistes: sis entrades en l’ordre de WhatsApp, Destacats a «Més» i quatre vistes', () => {
  expect(ENTRADES_RAIL.map((e) => e.text)).toEqual(['Xats', 'Novetats', 'Comunitats', 'Telefonades', 'Contingut multimèdia', 'Destacats']);
  expect(ENTRADES_RAIL.filter((e) => e.seccio === 'mes').map((e) => e.id)).toEqual(['destacats']);
  expect(VISTES_XAT).toEqual(['comunitats', 'telefonades', 'multimedia', 'destacats']);
  expect(rutaDeVista('multimedia')).toBe('/xat?vista=multimedia');
  expect(entradaDeVista('xats')).toBeNull();
  expect(entradaDeVista('destacats').text).toBe('Destacats');
  expect(clauSeccio('mes')).toBe(`${CLAU_RAIL}-mes`);
});

/* D16 (ordre del Mestre, 260930): «Novetats» s'amaga sense esborrar-la. Es
   conserva a ENTRADES_RAIL (reversible; activa='control' continua vàlida),
   les vistes i les seues rutes no canvien, i el rail no la pinta enlloc. */
test('D16 · «Novetats» és amagada: ENTRADES_RAIL la conserva, les vistes no canvien i no es pinta ni plegat ni desplegat', () => {
  expect(ENTRADES_RAIL.find((e) => e.id === 'novetats')).toMatchObject({ accio: 'control', amagada: true, text: 'Novetats' });
  expect(ENTRADES_RAIL.filter((e) => e.amagada).map((e) => e.id)).toEqual(['novetats']);
  expect(VISTES_XAT).toEqual(['comunitats', 'telefonades', 'multimedia', 'destacats']);
  expect(VISTES_XAT.map(rutaDeVista)).toEqual(['/xat?vista=comunitats', '/xat?vista=telefonades', '/xat?vista=multimedia', '/xat?vista=destacats']);
  expect(entradaDeVista('novetats')).toBeNull();
  for (const plegat of [true, false]) {
    for (const activa of ['converses', 'control']) {
      const { container, unmount } = pinta({ plegat, activa, comunitats: comunitats() });
      expect(within(container).queryByRole('button', { name: 'Novetats' }), `plegat=${plegat} activa=${activa}`).toBeNull();
      expect(container.textContent).not.toContain('Novetats');
      expect(container.querySelector('svg.lucide-circle-dashed')).toBeNull();
      unmount();
    }
  }
});

/* Amb Novetats amagada, al Control del xat (activa='control') cap entrada
   visible marca la pàgina ni fa de commutador: s'hi arriba des del Panell de
   Control i «Xats» torna a /xat. */
test('D16 · activa «control»: cap entrada porta aria-current ni aria-pressed, i «Xats» torna a /xat', () => {
  for (const plegat of [true, false]) {
    const onVes = vi.fn();
    const { container, unmount } = pinta({ activa: 'control', plegat, onVes, comunitats: comunitats() });
    const botons = within(container).getAllByRole('button');
    expect(botons.filter((b) => b.hasAttribute('aria-current')).map(nomDe), `plegat=${plegat}`).toEqual([]);
    expect(botons.filter((b) => b.hasAttribute('aria-pressed')).map(nomDe), `plegat=${plegat}`).toEqual([]);
    fireEvent.click(within(container).getByRole('button', { name: 'Xats' }));
    expect(onVes).toHaveBeenLastCalledWith('/xat');
    unmount();
  }
});

/* D16: «Novetats» ja no hi és; plegat queden cinc entrades i cinc icones. */
test('plegat: les mateixes entrades en el mateix ordre, les comunitats com a avatars quadrats i l’avatar propi al peu', () => {
  const { container } = pinta({ plegat: true, comunitats: comunitats() });
  const rail = container.querySelector('nav.sdp-workspace-rail');
  /* Les comunitats, per activitat (agrupaComunitats): Sóc de Poble és la més recent. */
  expect(noms(rail)).toEqual(['Xats', 'Comunitats', 'Telefonades', 'Contingut multimèdia', 'Destacats', 'Sóc de Poble', 'Almàssera']);
  /* Tres grups: les principals, «Més» i «Comunitats»; cap capçalera de secció. */
  expect([...rail.querySelectorAll('.sdp-workspace-rail__grup')].map((g) => g.getAttribute('aria-label'))).toEqual([null, 'Més', 'Comunitats']);
  expect(rail.querySelector('.sdp-xat-rail-seccio__cap')).toBeNull();
  const soc = within(rail).getByRole('button', { name: 'Sóc de Poble' });
  expect(soc.querySelector('img.sdp-avatar__imatge').getAttribute('src')).toBe('/assets/system/ui/logo-socdepoble-cuadrat-verd.svg');
  expect(soc.querySelector('.sdp-avatar--xs.sdp-xat-avatar--quadrat')).toBeTruthy();
  /* Les icones continuen fent 24 (cinc: Novetats és amagada, D16). */
  expect([...rail.querySelectorAll('svg')].map((s) => s.getAttribute('width'))).toEqual(Array(5).fill('24'));
  const peu = container.querySelector('.sdp-xat-rail-peu.sdp-xat-rail-peu--plegat');
  expect(rail.contains(peu)).toBe(false);
  expect(within(peu).getByRole('button', { name: 'Edita el perfil' }).querySelector('.sdp-avatar--xs').getAttribute('title')).toBe('Javi Llinares');
});

test('desplegat: files principals, «Més» amb Destacats, «Comunitats» amb les comunitats i el peu fix', () => {
  const { container } = pinta({ comunitats: comunitats() });
  const [principals, mes, llistaComunitats] = container.querySelectorAll('.sdp-xat-rail-llista');
  /* D16: sense «Novetats», que és amagada. */
  expect(noms(principals)).toEqual(['Xats', 'Comunitats', 'Telefonades', 'Contingut multimèdia']);
  expect(noms(mes)).toEqual(['Destacats']);
  expect(noms(llistaComunitats)).toEqual(['Sóc de Poble', 'Almàssera']);
  const seccions = [...container.querySelectorAll('.sdp-xat-rail-seccio__cap')];
  expect(seccions.map((s) => [s.getAttribute('aria-label'), s.textContent, s.getAttribute('aria-expanded')]))
    .toEqual([['Secció Més', 'Més', 'true'], ['Secció Comunitats', 'Comunitats', 'true']]);
  expect(seccions[0].getAttribute('aria-controls')).toBe(mes.parentElement.id);
  /* El xebró, de 24, va dins d'una cel·la com la del llapis (el mateix eix
     dret, modules.css); la cel·la no es llig. */
  for (const seccio of seccions) {
    const cella = seccio.querySelector('.sdp-xat-rail-seccio__xebro-cella');
    expect(cella.getAttribute('aria-hidden')).toBe('true');
    expect(cella.querySelector('svg.sdp-xat-rail-seccio__xebro').getAttribute('width')).toBe('24');
    expect(cella).toBe(seccio.lastElementChild);
  }
  const peu = container.querySelector('.sdp-xat-rail-peu');
  expect(peu.parentElement.tagName).toBe('ASIDE');
  expect(within(peu).getByText('Tu')).toBeTruthy();
  expect(within(peu).getByRole('button', { name: 'Edita el perfil' }).classList.contains('sdp-xat-icona')).toBe(true);
});

test('sense comunitats no hi ha secció «Comunitats» (ni plegat ni desplegat)', () => {
  const { container, unmount } = pinta();
  expect(within(container).queryByRole('button', { name: 'Secció Comunitats' })).toBeNull();
  expect(within(container).getByRole('button', { name: 'Secció Més' })).toBeTruthy();
  unmount();
  const plegat = pinta({ plegat: true });
  expect(plegat.container.querySelectorAll('.sdp-workspace-rail__grup')).toHaveLength(2);
});

test('plegar una secció l’amaga i es recorda amb getVal/setVal', () => {
  const { container, unmount } = pinta({ comunitats: comunitats() });
  const mes = within(container).getByRole('button', { name: 'Secció Més' });
  fireEvent.click(mes);
  expect(mes.getAttribute('aria-expanded')).toBe('false');
  expect(document.getElementById(mes.getAttribute('aria-controls')).hidden).toBe(true);
  expect(within(container).queryByRole('button', { name: 'Destacats' })).toBeNull();
  expect(getVal(clauSeccio('mes'))).toBe('plegat');
  expect(getVal(clauSeccio('comunitats'))).toBeNull();
  unmount();
  const segon = pinta({ comunitats: comunitats() });
  expect(within(segon.container).getByRole('button', { name: 'Secció Més' }).getAttribute('aria-expanded')).toBe('false');
  expect(within(segon.container).getByRole('button', { name: 'Secció Comunitats' }).getAttribute('aria-expanded')).toBe('true');
});

/* D16: el rail ja no porta a /control-xat (Novetats és amagada; s'hi arriba
   des del Panell de Control). */
test('destins: Xats, les quatre vistes, una comunitat i el perfil; cap toast', () => {
  const onVes = vi.fn();
  lloc.pathname = '/xat/a';
  const { container } = pinta({ comunitats: comunitats(), onVes });
  const prem = (nom) => fireEvent.click(within(container).getByRole('button', { name: nom }));
  prem('Xats');
  prem('Comunitats');
  prem('Telefonades');
  prem('Contingut multimèdia');
  prem('Destacats');
  prem('Sóc de Poble');
  prem('Edita el perfil');
  expect(onVes.mock.calls.map(([ruta]) => ruta)).toEqual([
    '/xat', '/xat?vista=comunitats', '/xat?vista=telefonades', '/xat?vista=multimedia', '/xat?vista=destacats',
    '/xat?comunitat=c-2', RUTA_PERFIL
  ]);
  expect(RUTA_PERFIL).toBe('/el-meu-perfil');
  /* Sense onVes, navega amb el router. */
  expect(lloc.navigate).not.toHaveBeenCalled();
});

test('sense onVes navega amb el router, i ja sent a la vista no repetix l’historial', () => {
  const { container } = pinta({ activa: 'telefonades' });
  fireEvent.click(within(container).getByRole('button', { name: 'Telefonades' }));
  expect(lloc.navigate).not.toHaveBeenCalled();
  fireEvent.click(within(container).getByRole('button', { name: 'Destacats' }));
  expect(lloc.navigate).toHaveBeenLastCalledWith('/xat?vista=destacats');
});

/* D16: la fila ['control', 'Novetats'] i la comprovació d'aria-pressed de
   Novetats passen a la prova «activa control» de dalt (Novetats és amagada). */
test.each([
  ['converses', 'Xats'],
  ['comunitats', 'Comunitats'],
  ['telefonades', 'Telefonades'],
  ['multimedia', 'Contingut multimèdia'],
  ['destacats', 'Destacats']
])('activa «%s»: només «%s» porta aria-current="page", plegat i desplegat', (activa, nom) => {
  for (const plegat of [true, false]) {
    const { container, unmount } = pinta({ activa, plegat, comunitats: comunitats() });
    const actius = within(container).getAllByRole('button').filter((b) => b.getAttribute('aria-current') === 'page');
    expect(actius.map(nomDe), `plegat=${plegat}`).toEqual([nom]);
    expect(within(container).queryByRole('button', { name: 'Novetats' })).toBeNull();
    unmount();
  }
});

test('la comunitat oberta porta aria-current i cap entrada no el porta', () => {
  const { container } = pinta({ activa: 'comunitat', comunitatActiva: 'c-1', comunitats: comunitats() });
  const actius = within(container).getAllByRole('button').filter((b) => b.getAttribute('aria-current') === 'page');
  expect(actius.map(nomDe)).toEqual(['Almàssera']);
  fireEvent.click(actius[0]);
  expect(lloc.navigate).not.toHaveBeenCalled();
});

/* D16: el commutador «Novetats» és amagat; des del Control del xat, una vista
   del rail continua portant a la columna central del Xat. */
test('amb el Control obert, una vista del rail porta al Xat', () => {
  const onVes = vi.fn();
  const { container } = pinta({ activa: 'control', onVes });
  expect(within(container).queryByRole('button', { name: 'Novetats' })).toBeNull();
  fireEvent.click(within(container).getByRole('button', { name: 'Telefonades' }));
  expect(onVes).toHaveBeenLastCalledWith('/xat?vista=telefonades');
});

test('en estret sempre va desplegat i triar una entrada tanca el panell i torna la llista', () => {
  const setPanellObert = vi.fn();
  const onVes = vi.fn();
  const { container } = pinta({ mida: 'estret', plegat: true, setPanellObert, onVes, comunitats: comunitats() });
  expect(container.querySelector('.app-grid-col-header--collapsed')).toBeNull();
  expect(within(container).getByRole('button', { name: 'Tanca el menú' })).toBeTruthy();
  fireEvent.click(within(container).getByRole('button', { name: 'Destacats' }));
  expect(setPanellObert).toHaveBeenLastCalledWith('middle');
  expect(onVes).toHaveBeenLastCalledWith('/xat?vista=destacats');
  fireEvent.click(within(container).getByRole('button', { name: 'Edita el perfil' }));
  expect(setPanellObert).toHaveBeenCalledTimes(2);
  expect(onVes).toHaveBeenLastCalledWith('/el-meu-perfil');
});

test('en mitjà, triar una entrada tanca el panell i deixa les dos columnes', () => {
  const setPanellObert = vi.fn();
  const { container } = pinta({ mida: 'mitja', setPanellObert, onVes: vi.fn() });
  fireEvent.click(within(container).getByRole('button', { name: 'Comunitats' }));
  expect(setPanellObert).toHaveBeenLastCalledWith(null);
});

/* El catàleg de disseny munta el rail de producció: plegar-hi una secció no
   ha de canviar el rail de l'app de la persona. */
test('recordaSeccions={false}: les seccions naixen obertes, es pleguen de veres i no es desa res', () => {
  setVal(clauSeccio('mes'), 'plegat');
  const { container } = pinta({ recordaSeccions: false, comunitats: comunitats() });
  const mes = within(container).getByRole('button', { name: 'Secció Més' });
  const com = within(container).getByRole('button', { name: 'Secció Comunitats' });
  expect(mes.getAttribute('aria-expanded')).toBe('true');
  fireEvent.click(mes);
  fireEvent.click(com);
  expect(mes.getAttribute('aria-expanded')).toBe('false');
  expect(within(container).queryByRole('button', { name: 'Destacats' })).toBeNull();
  expect(getVal(clauSeccio('mes'))).toBe('plegat');
  expect(getVal(clauSeccio('comunitats'))).toBeNull();
  fireEvent.click(mes);
  expect(getVal(clauSeccio('mes'))).toBe('plegat');
});

/* L'estat actual no es pot quedar dins d'una secció plegada: en arribar-hi,
   la secció s'obri (sense tocar la preferència); si la persona la torna a
   plegar, la capçalera porta el marcador i el nom ho diu. */
test('la secció que conté l’entrada activa s’obri en arribar-hi i, plegada a mà, la capçalera ho diu', () => {
  setVal(clauSeccio('mes'), 'plegat');
  setVal(clauSeccio('comunitats'), 'plegat');
  const { container, rerender } = render(arbre({ comunitats: comunitats() }));
  const cap = (nom) => within(container).getByRole('button', { name: new RegExp(`^Secció ${nom}`) });
  expect(cap('Més').getAttribute('aria-expanded')).toBe('false');
  expect(cap('Comunitats').getAttribute('aria-expanded')).toBe('false');

  /* Destacats és la vista: «Més» s'obri i Destacats porta aria-current. */
  rerender(arbre({ comunitats: comunitats(), activa: 'destacats' }));
  expect(cap('Més').getAttribute('aria-expanded')).toBe('true');
  expect(within(container).getByRole('button', { name: 'Destacats' }).getAttribute('aria-current')).toBe('page');
  expect(getVal(clauSeccio('mes'))).toBe('plegat');
  expect(cap('Comunitats').getAttribute('aria-expanded')).toBe('false');

  /* Plegada a mà: el marcador i el nom «…, amb la pàgina actual». */
  fireEvent.click(cap('Més'));
  const mes = cap('Més');
  expect(mes.getAttribute('aria-expanded')).toBe('false');
  expect(mes.getAttribute('aria-label')).toBe('Secció Més, amb la pàgina actual');
  expect(mes.classList.contains('sdp-xat-rail-seccio__cap--actual')).toBe(true);
  expect(mes.textContent).toBe('Més');
  /* «Comunitats» no conté l'activa: ni marcador ni nom nou. */
  expect(cap('Comunitats').getAttribute('aria-label')).toBe('Secció Comunitats');
  expect(cap('Comunitats').classList.contains('sdp-xat-rail-seccio__cap--actual')).toBe(false);

  /* La fitxa d'una comunitat obri «Comunitats» i hi marca la comunitat. */
  rerender(arbre({ comunitats: comunitats(), activa: 'comunitat', comunitatActiva: 'c-1' }));
  expect(cap('Comunitats').getAttribute('aria-expanded')).toBe('true');
  expect(within(container).getByRole('button', { name: 'Almàssera' }).getAttribute('aria-current')).toBe('page');
  expect(getVal(clauSeccio('comunitats'))).toBe('plegat');
  /* «Més», que ja no conté l'activa, perd el marcador (continua plegada). */
  expect(cap('Més').getAttribute('aria-label')).toBe('Secció Més');
  expect(cap('Més').classList.contains('sdp-xat-rail-seccio__cap--actual')).toBe(false);
});

test('en muntar-se amb l’entrada activa dins d’una secció plegada, la secció naix oberta', () => {
  setVal(clauSeccio('mes'), 'plegat');
  const { container } = pinta({ activa: 'destacats' });
  expect(within(container).getByRole('button', { name: 'Secció Més' }).getAttribute('aria-expanded')).toBe('true');
  expect(within(container).getByRole('button', { name: 'Destacats' }).getAttribute('aria-current')).toBe('page');
  expect(getVal(clauSeccio('mes'))).toBe('plegat');
});

/* Torn 260930 (T1, captures 20.47.21 i 20.48.41) · Amb `onAjustos` (el que
   passa ClosCaXat), el peu obri el full «Ajustos», com «Tú» a WhatsApp
   Desktop. Desplegat, l'avatar i «Tu» són un sol botó i el llapis continua
   portant al perfil; plegat, l'avatar del peu obri el full. El nom accessible
   comença pel que es veu («Tu: ajustos»). Les proves de dalt pinten el rail
   sense `onAjustos` (el catàleg del rail): el peu d'abans no canvia. */
test('T1 · desplegat, l’avatar i «Tu» obrin el full «Ajustos» i el llapis continua portant al perfil', () => {
  const onAjustos = vi.fn();
  const onVes = vi.fn();
  const { container } = pinta({ onAjustos, onVes });
  const peu = container.querySelector('.sdp-xat-rail-peu');
  expect(peu.classList.contains('sdp-xat-rail-peu--ajustos')).toBe(true);
  const tu = within(peu).getByRole('button', { name: 'Tu: ajustos' });
  expect(tu.getAttribute('aria-haspopup')).toBe('dialog');
  expect(tu.querySelector('.sdp-avatar--xs').getAttribute('title')).toBe('Javi Llinares');
  expect(within(tu).getByText('Tu')).toBeTruthy();
  fireEvent.click(tu);
  expect(onAjustos).toHaveBeenCalledWith(tu);
  fireEvent.click(within(peu).getByRole('button', { name: 'Edita el perfil' }));
  expect(onVes).toHaveBeenLastCalledWith(RUTA_PERFIL);
});

test('T1 · plegat, l’avatar del peu obri el full (ja no porta al perfil)', () => {
  const onAjustos = vi.fn();
  const onVes = vi.fn();
  const { container } = pinta({ plegat: true, onAjustos, onVes });
  const peu = container.querySelector('.sdp-xat-rail-peu--plegat');
  expect(within(peu).queryByRole('button', { name: 'Edita el perfil' })).toBeNull();
  const avatar = within(peu).getByRole('button', { name: 'Tu: ajustos' });
  expect(avatar.classList.contains('sdp-workspace-rail__boto')).toBe(true);
  fireEvent.click(avatar);
  expect(onAjustos).toHaveBeenCalledWith(avatar);
  expect(onVes).not.toHaveBeenCalled();
});

test('T1 · en estret, obrir el full tanca abans el panell del rail', () => {
  const setPanellObert = vi.fn();
  const ordre = [];
  setPanellObert.mockImplementation(() => ordre.push('tanca'));
  const onAjustos = vi.fn(() => ordre.push('obri'));
  const { container } = pinta({ mida: 'estret', setPanellObert, onAjustos });
  fireEvent.click(within(container).getByRole('button', { name: 'Tu: ajustos' }));
  expect(setPanellObert).toHaveBeenLastCalledWith('middle');
  expect(ordre).toEqual(['tanca', 'obri']);
});

test('sense nom de persona, el peu diu «Tu» i l’avatar en porta la inicial', () => {
  const { container } = pinta({ joNom: null });
  const peu = container.querySelector('.sdp-xat-rail-peu');
  expect(peu.querySelector('.sdp-avatar').getAttribute('title')).toBe('Tu');
  expect(screen.getByText('T')).toBeTruthy();
});

/* ═══ T6 · El botó que obri el rail ══════════════════════════════════════
   BotoObriRail dins d'un AppGridContext de mentida, amb un rail
   (#app-grid-sidebar) que, com a AppGridShell fora d'ample, és inert i
   aria-hidden mentre el panell no és 'left'. `fora`: un altre subarbre inert. */
function ambBoto({ mida = 'mitja', panellObert = null, setPanellObert = vi.fn(), fora = false } = {}) {
  const tancat = panellObert !== 'left';
  return (
    <AppGridContext.Provider value={{ mida, panellObert, setPanellObert }}>
      <div className="app-grid-shell">
        <section id="app-grid-sidebar" inert={tancat ? 'true' : undefined} aria-hidden={tancat ? true : undefined}>
          <ul className="sdp-xat-rail-llista"><li><button type="button">Xats</button></li></ul>
        </section>
        {fora ? <div inert="true"><button type="button">Fora</button></div> : null}
        <BotoObriRail etiqueta="Menú" />
      </div>
    </AppGridContext.Provider>
  );
}

/* El patró de Dialeg.test.jsx (muntaLocal): l'encastat munta l'app dins
   d'un Shadow DOM tancat, on document.activeElement és l'amfitrió. */
function muntaEnOmbra(element) {
  const host = document.createElement('soc-de-poble');
  document.body.append(host);
  const shadow = host.attachShadow({ mode: 'closed' });
  const root = document.createElement('div');
  root.className = 'sdp-root';
  shadow.append(root);
  const muntatge = document.createElement('div');
  root.append(muntatge);
  return { host, shadow, root, ...render(element, { container: muntatge, baseElement: root }) };
}

test('T6 · BotoObriRail és el desplegable del rail: aria-controls="app-grid-sidebar" i aria-expanded segons el panell', () => {
  const setPanellObert = vi.fn();
  const { container, rerender } = render(ambBoto({ setPanellObert }));
  const boto = within(container).getByRole('button', { name: 'Menú' });
  expect(boto.getAttribute('aria-controls')).toBe('app-grid-sidebar');
  /* L'obridor de la closca: la guarda d'AppGridShell només tria estos. */
  expect(boto.hasAttribute('data-obri-columna')).toBe(true);
  expect(boto.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(boto);
  expect(setPanellObert).toHaveBeenLastCalledWith('left');
  rerender(ambBoto({ setPanellObert, panellObert: 'left' }));
  expect(boto.getAttribute('aria-expanded')).toBe('true');
  expect(boto.getAttribute('aria-controls')).toBe('app-grid-sidebar');
  fireEvent.click(boto);
  expect(setPanellObert).toHaveBeenLastCalledWith(null);
  rerender(ambBoto({ setPanellObert, mida: 'estret', panellObert: 'left' }));
  fireEvent.click(boto);
  expect(setPanellObert).toHaveBeenLastCalledWith('middle');
  /* En ample no es pinta. */
  rerender(ambBoto({ setPanellObert, mida: 'ample' }));
  expect(within(container).queryByRole('button', { name: 'Menú' })).toBeNull();
});

test('T6 · en un Shadow DOM tancat, BotoObriRail llig el focus a la seua arrel: el que queda al rail tancat torna al botó', () => {
  const { host, shadow, root, rerender } = muntaEnOmbra(ambBoto({ panellObert: 'left' }));
  try {
    const xats = within(root).getByRole('button', { name: 'Xats' });
    const boto = within(root).getByRole('button', { name: 'Menú' });
    xats.focus();
    /* La premissa: fora de l'arrel només es veu l'amfitrió. */
    expect(document.activeElement).toBe(host);
    expect(shadow.activeElement).toBe(xats);
    rerender(ambBoto({ panellObert: null }));
    expect(root.querySelector('#app-grid-sidebar').getAttribute('inert')).toBe('true');
    expect(shadow.activeElement).toBe(boto);
  } finally {
    cleanup();
    host.remove();
  }
});

test('T6 · el focus que ha quedat dins d’un [inert] fora del rail també es dona per perdut', () => {
  const { container, rerender } = render(ambBoto({ panellObert: 'left', fora: true }));
  const fora = within(container).getByRole('button', { name: 'Fora' });
  fora.focus();
  expect(document.activeElement).toBe(fora);
  rerender(ambBoto({ panellObert: null, fora: true }));
  expect(document.activeElement).toBe(within(container).getByRole('button', { name: 'Menú' }));
});

/* Revisió del T6 · El catàleg de Disseny pinta este rail dins del detall
   (EspecimenXatRail): la seua capçalera porta aria-controls="app-grid-sidebar",
   però no és cap obridor de la closca, i la guarda no l'ha de triar. */
test('T6 · el rail, desplegat i plegat, no porta cap obridor de la closca (data-obri-columna)', () => {
  for (const plegat of [false, true]) {
    const { container, unmount } = pinta({ plegat });
    const capcalera = within(container).getByRole('button', { name: plegat ? 'Expandir Menú' : 'Replegar Menú' });
    expect(capcalera.getAttribute('aria-controls')).toBe('app-grid-sidebar');
    expect(container.querySelector('[data-obri-columna]')).toBeNull();
    unmount();
  }
});

/* Dins de la closca real, la guarda d'AppGridShell porta el focus a
   BotoObriRail en la fase de layout. La Sonda, germana d'abans, el llig en el
   primer efecte passiu, abans que l'efecte de BotoObriRail el puga
   recol·locar: si el botó perdera la marca, hi trobaria <body>. */
function TancaMenu() {
  const { setPanellObert } = useAppGrid();
  return <button type="button" onClick={() => setPanellObert(null)}>Xats</button>;
}

function Sonda({ registre }) {
  const { panellObert } = useAppGrid();
  const ref = useRef(null);
  useEffect(() => {
    registre.push(ref.current?.getRootNode().activeElement ?? null);
  }, [panellObert, registre]);
  return <span ref={ref} />;
}

test('T6 · dins de la closca, la guarda porta el focus a BotoObriRail abans de cap efecte passiu', () => {
  const amplada = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(800);
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  try {
    const registre = [];
    const { container } = render(
      <AppGridShell
        initialPane="left"
        leftColumn={<TancaMenu />}
        middleColumn={<><Sonda registre={registre} /><BotoObriRail etiqueta="Menú" /></>}
        rightColumn={<p>Detall</p>}
      />
    );
    const shell = container.querySelector('.app-grid-shell');
    expect([shell.dataset.layout, shell.dataset.panell]).toEqual(['mitja', 'left']);
    const xats = within(container.querySelector('#app-grid-sidebar')).getByRole('button', { name: 'Xats' });
    const boto = within(container.querySelector('#app-grid-list')).getByRole('button', { name: 'Menú' });
    xats.focus();
    registre.length = 0;
    fireEvent.click(xats);
    expect(shell.dataset.panell).toBe('');
    expect(registre[0]).toBe(boto);
    expect(document.activeElement).toBe(boto);
  } finally {
    amplada.mockRestore();
    vi.unstubAllGlobals();
  }
});
