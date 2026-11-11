/* Onada R17 · AH-R17-11 / P0-88 (Sofía Bornay, Android) · La contrasenya
 * nova d'«El compte» (/el-meu-perfil) porta l'ull de Pedra Seca
 * (ControlContrasenya), el mateix del registre i de la recuperació:
 * type="password" ↔ type="text", nom fix traduït a les cinc llengües (la
 * clau de l'ull del registre, sense duplicar-la), estat a aria-pressed, i en
 * enviar torna a amagar-se. Un ajust de text no en porta.
 * Ronda de correcció (àrbitre R17, P1) · Sense placeholder: amb la reserva
 * de l'ull, «Introdueix nova contrasenya...» quedava tallat a 320 px.
 * Segona ronda (àrbitre R17, P2) · La guarda d'esta regressió és la del DOM
 * (placeholder absent). Les del final del fitxer només vigilen el contracte
 * de Pedra Seca que fa servir el camp: no mesuren /el-meu-perfil. */
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({
  useSession: () => ({ logout: vi.fn(), preparaEixida: vi.fn(async () => []) }),
  useSessioOpcional: () => null,
}));
vi.mock('../admin/SegonFactor.jsx', () => ({ SegonFactor: () => null }));
import DetallAjust, { TEXT_ULL_CONTRASENYA } from './DetallAjust.jsx';
import { UIProvider } from '../../app/contexts/UIContext.jsx';
import { LANGUAGE_STORAGE_KEY } from '../../config/i18n.js';
import { delVal } from '../../config/storage.js';
import CA from '../../config/idiomes/ca.js';
import ES from '../../config/idiomes/es.js';
import EN from '../../config/idiomes/en.js';
import EU from '../../config/idiomes/eu.js';
import GL from '../../config/idiomes/gl.js';
/* Les proves en una llengua que no és el valencià pinten des del primer fotograma amb els cinc diccionaris. */
import '../../../tests/helpers/diccionaris.js';

/* L'ajust del catàleg (PerfilContext.jsx · ajustosPersona). */
const CONTRASENYA = Object.freeze({ id: 'contrasenya', lloc: 'compte', titol: 'Contrasenya', tipus: 'password', valor: '******', obert: true });
const jo = Object.freeze({ id: 'jo', mena: 'persona', nom: 'Pep', dades: {} });
const ETIQUETA = 'Nou valor per a contrasenya:';
const ULL = 'Mostra la contrasenya';

let guardarAjust;
function pinta({ ajust = CONTRASENYA, llengua = null } = {}) {
  guardarAjust = vi.fn(async () => undefined);
  const vista = <DetallAjust ajust={ajust} identitat={jo} guardarAjust={guardarAjust} />;
  return render(llengua ? <UIProvider externalConfig={{ language: llengua }}>{vista}</UIProvider> : vista);
}

/* El patró de GestioMembres.idioma.test.jsx: UIProvider demana matchMedia (jsdom no en porta). */
beforeEach(() => {
  m.navigate.mockReset();
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn()
  })));
  delVal(LANGUAGE_STORAGE_KEY);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); delVal(LANGUAGE_STORAGE_KEY); });

describe('Onada R17 · AH-R17-11 · l’ull de la contrasenya nova a /el-meu-perfil', () => {
  test('el camp naix amagat, amb el seu contracte de sempre, i l’ull l’alterna sense canviar de nom', () => {
    pinta();
    const camp = screen.getByLabelText(ETIQUETA);
    expect(camp.getAttribute('type')).toBe('password');
    expect(camp.id).toBe('ajust-contrasenya');
    expect(camp.getAttribute('autocomplete')).toBe('new-password');
    expect(camp.getAttribute('minlength')).toBe('10');
    expect(camp.classList.contains('sdp-control')).toBe(true);
    // Visible, el mòbil no la «corregix».
    expect(camp.getAttribute('autocapitalize')).toBe('none');
    expect(camp.getAttribute('spellcheck')).toBe('false');

    const ull = screen.getByRole('button', { name: ULL });
    expect(ull.getAttribute('type')).toBe('button');
    expect(ull.getAttribute('aria-pressed')).toBe('false');
    expect(ull.getAttribute('aria-controls')).toBe('ajust-contrasenya');
    expect(ull.parentElement.classList.contains('sdp-contrasenya')).toBe(true);

    fireEvent.change(camp, { target: { value: 'una-bona-contrasenya' } });
    fireEvent.click(ull);
    expect(camp.getAttribute('type')).toBe('text');
    expect(ull.getAttribute('aria-pressed')).toBe('true');
    expect(camp.value).toBe('una-bona-contrasenya');
    // El nom és fix: l'estat el diu aria-pressed.
    expect(screen.getByRole('button', { name: ULL })).toBe(ull);

    fireEvent.click(ull);
    expect(camp.getAttribute('type')).toBe('password');
    expect(ull.getAttribute('aria-pressed')).toBe('false');
  });

  test('en «Guardar» torna a amagar-se abans del desat i desa el valor escrit', async () => {
    pinta();
    const camp = screen.getByLabelText(ETIQUETA);
    fireEvent.change(camp, { target: { value: 'una-bona-contrasenya' } });
    fireEvent.click(screen.getByRole('button', { name: ULL }));
    expect(camp.getAttribute('type')).toBe('text');
    await act(async () => { fireEvent.submit(camp.closest('form')); });
    expect(camp.getAttribute('type')).toBe('password');
    expect(screen.getByRole('button', { name: ULL }).getAttribute('aria-pressed')).toBe('false');
    expect(guardarAjust).toHaveBeenCalledWith('jo', 'contrasenya', 'una-bona-contrasenya');
  });

  test('el mínim de 10 caràcters continua: una de curta no s’envia, encara que es veja', async () => {
    pinta();
    const camp = screen.getByLabelText(ETIQUETA);
    fireEvent.change(camp, { target: { value: 'curta' } });
    fireEvent.click(screen.getByRole('button', { name: ULL }));
    await act(async () => { fireEvent.submit(camp.closest('form')); });
    expect(guardarAjust).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toBe('La contrasenya ha de tindre almenys 10 caràcters.');
  });

  /* Ronda de correcció (àrbitre R17, P1) · La guarda de la regressió del
     text tallat: cap placeholder dins del camp, com el registre i la
     recuperació. Si DetallAjust el tornara a posar, esta prova cauria. */
  test('sense placeholder: cap text fix dins del camp que la reserva de l’ull puga tallar', () => {
    pinta();
    expect(screen.getByLabelText(ETIQUETA).hasAttribute('placeholder')).toBe(false);
  });

  test('un ajust de text no porta ull: el seu camp és el de sempre', () => {
    pinta({ ajust: { id: 'alias', lloc: 'compte', titol: 'Àlies', tipus: 'text', valor: 'Pep', obert: true } });
    const camp = screen.getByLabelText('Nou valor per a àlies:');
    expect(camp.getAttribute('type')).toBe('text');
    expect(camp.parentElement.classList.contains('sdp-contrasenya')).toBe(false);
    expect(camp.hasAttribute('autocomplete')).toBe(false);
    expect(screen.queryByRole('button', { name: /contrasenya/i })).toBeNull();
  });

  test.each([
    ['es', 'Mostrar la contraseña'],
    ['en', 'Show password'],
    ['eu', 'Erakutsi pasahitza'],
    ['gl', 'Amosar o contrasinal'],
  ])('dins de l’App en %s, l’ull porta el nom traduït', (llengua, nom) => {
    pinta({ llengua });
    const ull = screen.getByRole('button', { name: nom });
    expect(ull.getAttribute('aria-controls')).toBe('ajust-contrasenya');
    fireEvent.click(ull);
    expect(document.getElementById('ajust-contrasenya').getAttribute('type')).toBe('text');
  });

  test('la clau és la de l’ull del registre, als cinc diccionaris amb valor propi, i cap còpia', () => {
    const [clau, reserva] = TEXT_ULL_CONTRASENYA;
    // Ronda de correcció (àrbitre R17, P2) · Reutilitza la clau d'OnboardingSteps i RecuperacioSteps.
    expect(clau).toBe('section.login.registre.ullContrasenya');
    expect(CA[clau]).toBe(reserva);
    const valors = [CA, ES, EN, EU, GL].map((dic) => dic[clau]);
    for (const valor of valors) expect(typeof valor === 'string' && valor.trim().length > 0).toBe(true);
    expect(new Set(valors).size).toBe(5);
    for (const dic of [CA, ES, EN, EU, GL]) expect(dic['section.perfil.ajust.ullContrasenya']).toBeUndefined();
  });
});

/* Segona ronda de correcció (àrbitre R17, P2) · PROVES DE REGRESSIÓ DEL
   CONTRACTE DE PEDRA SECA, no de la geometria de /el-meu-perfil. jsdom no
   pinta: només es llig el text de components.css i dels tokens, com a
   PerfilShell.fitxaPublica.capes.test.js. Ja passaven abans d'este carril i
   cap no toca DetallAjust: vigilen que l'etiqueta del Camp es partisca i que
   l'ull de ControlContrasenya càpia en la seua reserva, res més. La guarda del
   text tallat és la del DOM (placeholder absent, més amunt).
   L'aritmètica de la ronda anterior (control de 288 px i caixa de text de
   220 px a 320 px) era falsa per al Perfil: el detall del mòbil porta el rail
   de 56 px. Mesura al navegador (Chrome, 11-11-2026, servidor de
   desenvolupament, DOM del Workspace de /wikidepoble amb les classes del
   Perfil, sense sessió; no és la ruta autenticada): a 320×480 el control fa
   232 px i la caixa de text 164; a 375×812, 287 i 219; l'ull (48 px) sempre
   dins del control, i l'etiqueta es partix sense tallar-se amb la lletra al
   200 %. L'antic placeholder (257 px) no hi cabia en cap de les dues. */
const llig = (ruta) => readFileSync(resolve(process.cwd(), ruta), 'utf8');
const components = llig('src/css/components.css');
const tokensDisseny = llig('src/css/design-tokens.css');
const tokens = llig('src/css/tokens.css');

const net = (text) => text.replace(/\s+/g, ' ').trim();

/** Les declaracions de la primera regla fulla (fora de cap @media) amb eixe selector exacte. */
function declaracionsDe(css, selector) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const pila = [];
  let inici = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === '{') {
      if (pila.length) pila[pila.length - 1].fills = true;
      pila.push({ prelud: net(text.slice(inici, i).split(';').pop()), obert: i + 1, fills: false });
      inici = i + 1;
    } else if (text[i] === '}') {
      const bloc = pila.pop();
      const dinsDeMedia = pila.some((b) => /^@(media|container|supports)/.test(b.prelud));
      if (bloc && !bloc.fills && !dinsDeMedia && bloc.prelud.split(',').map(net).includes(selector)) {
        const mapa = {};
        for (const declaracio of net(text.slice(bloc.obert, i)).split(';').map(net).filter(Boolean)) {
          const dos = declaracio.indexOf(':');
          mapa[net(declaracio.slice(0, dos))] = net(declaracio.slice(dos + 1));
        }
        return mapa;
      }
      inici = i + 1;
    }
  }
  return {};
}

const px = (css, token) => Number(css.match(new RegExp(`${token}:\\s*(\\d+)px`))?.[1]);

describe('Regressió del contracte de Pedra Seca que fa servir el camp (no mesura /el-meu-perfil)', () => {
  test('l’etiqueta del Camp (.sdp-camp__etiqueta) es partix, no es retalla', () => {
    const etiqueta = declaracionsDe(components, '.sdp-camp__etiqueta');
    expect(etiqueta['font-weight']).toBe('700');
    expect(etiqueta['white-space']).toBeUndefined();
    expect(etiqueta['text-overflow']).toBeUndefined();
    expect(etiqueta.overflow).toBeUndefined();
  });

  test('l’ull de ControlContrasenya cap en la reserva de la dreta del control', () => {
    const reserva = declaracionsDe(components, '.sdp-contrasenya > .sdp-control')['padding-inline-end'];
    expect(reserva).toBe('calc(var(--sdp-touch-min) + var(--sdp-space-1))');
    const ull = declaracionsDe(components, '.sdp-contrasenya__ull');
    expect(ull.width).toBe('var(--sdp-touch-min)');
    expect(ull['inset-inline-end']).toBe('0');
    // L'ull (--sdp-touch-min, 48 px) dins de la reserva (52 px): el text no hi passa per davall.
    expect([px(tokensDisseny, '--sdp-touch-min'), px(tokens, '--sdp-space-1')]).toEqual([48, 4]);
  });
});
