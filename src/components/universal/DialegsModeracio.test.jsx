/* Fase D (261020, tasca 2; pla 261020_1300) · Els tres diàlegs de la
   moderació i el seu amfitrió, amb el contracte de props de
   ProveidorModeracio (ModeracioContext.jsx) i sense proveïdor: cada prova en
   simula les funcions. El resultat de la denúncia es diu dins del diàleg,
   com a descripció de «Tanca» enfocat, i no amb cap avís; els errors, en
   línia (role=alert), un per cada `code`.
   Fase D (261020, revisió) · jsdom no té showModal i deixa enfocar un
   control d'un <dialog> tancat: les proves fan com el navegador (focus() no
   fa res dins d'un <dialog> tancat; showModal() obri i enfoca l'atribut
   autofocus, que React no escriu, o el primer control, la X). Així el focus
   inicial del bloqueig passa pel camí de producció i no per l'autoFocus del
   commit, que en jsdom sí que enfocava. */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter, useLocation } from '../../app/contexts/RouterContext';
import { CODI_MODERACIO, errorDeModeracio } from '../../data/contracte.js';
import { TEXTOS_ERROR_MODERACIO, textDErrorDeModeracio } from '../PedraSeca/organismes/textosModeracio.js';
import { DialegBloqueig, DialegDenuncia, DialegNormes, DialegsModeracio } from './DialegsModeracio.jsx';

const focusNatiu = HTMLElement.prototype.focus;
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (...args) {
    const finestra = this.closest('dialog');
    if (finestra && !finestra.open) return undefined;
    return focusNatiu.apply(this, args);
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value() {
    this.setAttribute('open', '');
    (this.querySelector('[autofocus]') || this.querySelector('button:not(:disabled)'))?.focus();
  } });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete HTMLDialogElement.prototype.showModal;
});

const PEPA = Object.freeze({ tipus: 'persona', id: 'pepa', nom: 'Pepa' });
const PUBLICACIO = Object.freeze({ tipus: 'publicacio', id: 'p1', titol: 'Fira de tardor', autor: PEPA, filId: null, bloquejable: true });
const AJUNTAMENT = Object.freeze({ tipus: 'entitat', id: 'ajuntament', nom: 'Ajuntament' });
const DE_L_AJUNTAMENT = Object.freeze({ ...PUBLICACIO, autor: AJUNTAMENT });

function Ubicacio() {
  const { pathname } = useLocation();
  return <output data-testid="ubicacio">{pathname}</output>;
}
const pinta = (ui) => render(<MemoryRouter rutaInicial="/mur">{ui}<Ubicacio /></MemoryRouter>);
const diferit = () => { let resol; let rebutja; const promesa = new Promise((a, b) => { resol = a; rebutja = b; }); return { promesa, resol, rebutja }; };
const dialeg = () => screen.getByRole('dialog');
/* El text que el lector diu darrere del nom d'un control (aria-describedby). */
const descripcioDe = (control) => document.getElementById(control.getAttribute('aria-describedby') || '')?.textContent ?? null;

describe('DialegDenuncia', () => {
  const props = (mes = {}) => ({ obert: true, objectiu: PUBLICACIO, potBloquejarTambe: false, onTanca: vi.fn(), onEnvia: vi.fn(), onBloqueja: vi.fn(), ...mes });

  test('el títol, els quatre motius en ordre i el detall de 1.000 caràcters com a molt', () => {
    pinta(<DialegDenuncia {...props()} />);
    expect(screen.getByRole('dialog', { name: 'Denuncia este contingut' })).toBeTruthy();
    const radios = within(dialeg()).getAllByRole('radio');
    expect(radios).toHaveLength(4);
    /* El nom accessible del ràdio porta també la línia d'ajuda. */
    expect(screen.getByRole('radio', { name: /^Contingut ofensiu/ })).toBe(radios[0]);
    expect(screen.getByRole('radio', { name: /^Spam o frau/ })).toBe(radios[1]);
    expect(screen.getByRole('radio', { name: /^Desinformació/ })).toBe(radios[2]);
    expect(screen.getByRole('radio', { name: /^Un altre motiu/ })).toBe(radios[3]);
    expect(screen.getByRole('textbox', { name: 'Detalls (opcional)' }).getAttribute('maxlength')).toBe('1000');
  });

  test('un missatge i una persona tenen el seu títol', () => {
    pinta(<DialegDenuncia {...props({ objectiu: { ...PUBLICACIO, tipus: 'missatge' } })} />);
    expect(screen.getByRole('dialog', { name: 'Denuncia este missatge' })).toBeTruthy();
    cleanup();
    pinta(<DialegDenuncia {...props({ objectiu: { ...PUBLICACIO, tipus: 'persona', id: 'pepa' } })} />);
    expect(screen.getByRole('dialog', { name: 'Denuncia esta persona o entitat' })).toBeTruthy();
  });

  test('«Envia la denúncia» espera un motiu i envia el motiu i el detall net', async () => {
    const onEnvia = vi.fn().mockResolvedValue({ rebuda: true, repetida: false });
    pinta(<DialegDenuncia {...props({ onEnvia })} />);
    const envia = screen.getByRole('button', { name: 'Envia la denúncia' });
    expect(envia.disabled).toBe(true);
    act(() => { fireEvent.click(screen.getByRole('radio', { name: /^Spam o frau/ })); });
    fireEvent.change(screen.getByRole('textbox', { name: 'Detalls (opcional)' }), { target: { value: '  Ven el mateix tres vegades  ' } });
    expect(envia.disabled).toBe(false);
    await act(async () => { fireEvent.click(envia); });
    expect(onEnvia).toHaveBeenCalledWith({ motiu: 'spam_frau', detall: 'Ven el mateix tres vegades' });
  });

  test('l’èxit es diu en línia, com a descripció de «Tanca» enfocat, i sense «Bloqueja també» si no es pot', async () => {
    const onTanca = vi.fn();
    pinta(<DialegDenuncia {...props({ onTanca, onEnvia: vi.fn().mockResolvedValue({ rebuda: true, repetida: false }) })} />);
    act(() => { fireEvent.click(screen.getByRole('radio', { name: /^Contingut ofensiu/ })); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Envia la denúncia' })); });
    const tanca = screen.getByRole('button', { name: 'Tanca' });
    expect(document.activeElement).toBe(tanca);
    /* Fase D (261020, revisió) · VoiceOver no anuncia una regió viva que naix
       amb el text: el resultat el diu el focus («Tanca», i la descripció), i
       no hi ha cap role=status que el lector puga llegir dues vegades. */
    expect(descripcioDe(tanca)).toBe('Gràcies. Hem rebut la denúncia i la revisarem en menys de 24 hores.');
    expect(within(dialeg()).getByText('Gràcies. Hem rebut la denúncia i la revisarem en menys de 24 hores.')).toBeTruthy();
    expect(within(dialeg()).queryByRole('status')).toBeNull();
    expect(screen.queryByRole('button', { name: /Bloqueja també/ })).toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
    act(() => { fireEvent.click(tanca); });
    expect(onTanca).toHaveBeenCalledTimes(1);
  });

  test('una denúncia repetida ho diu, i «Bloqueja també Pepa» passa al bloqueig', async () => {
    const onBloqueja = vi.fn();
    pinta(<DialegDenuncia {...props({ potBloquejarTambe: true, onBloqueja, onEnvia: vi.fn().mockResolvedValue({ rebuda: true, repetida: true }) })} />);
    act(() => { fireEvent.click(screen.getByRole('radio', { name: /^Un altre motiu/ })); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Envia la denúncia' })); });
    expect(descripcioDe(screen.getByRole('button', { name: 'Tanca' }))).toBe('Ja ens havies avisat d’este contingut. El revisarem igualment.');
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Bloqueja també Pepa' })); });
    expect(onBloqueja).toHaveBeenCalledTimes(1);
  });

  test('un error es diu en línia (role=alert) i el diàleg continua obert, a punt de tornar-ho a provar', async () => {
    const onTanca = vi.fn();
    pinta(<DialegDenuncia {...props({ onTanca, onEnvia: vi.fn().mockRejectedValue(errorDeModeracio(CODI_MODERACIO.LIMIT)) })} />);
    act(() => { fireEvent.click(screen.getByRole('radio', { name: /^Desinformació/ })); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Envia la denúncia' })); });
    expect(within(dialeg()).getByRole('alert').textContent)
      .toBe('Has fet massa denúncies o bloquejos en poc de temps. Torna-ho a provar d’ací a una estona.');
    expect(screen.getByRole('button', { name: 'Envia la denúncia' }).disabled).toBe(false);
    expect(onTanca).not.toHaveBeenCalled();
  });

  test('mentre s’envia, ni Escape ni «Cancel·la» el tanquen', async () => {
    const servidor = diferit();
    const onTanca = vi.fn();
    pinta(<DialegDenuncia {...props({ onTanca, onEnvia: () => servidor.promesa })} />);
    act(() => { fireEvent.click(screen.getByRole('radio', { name: /^Contingut ofensiu/ })); });
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Envia la denúncia' })); });
    expect(screen.getByRole('button', { name: 'Cancel·la' }).disabled).toBe(true);
    act(() => { dialeg().dispatchEvent(new Event('cancel', { cancelable: true })); });
    expect(onTanca).not.toHaveBeenCalled();
    await act(async () => { servidor.resol({ rebuda: true, repetida: false }); await servidor.promesa; });
    expect(descripcioDe(screen.getByRole('button', { name: 'Tanca' }))).toBe('Gràcies. Hem rebut la denúncia i la revisarem en menys de 24 hores.');
  });

  test('cada obertura comença de nou', async () => {
    const vista = pinta(<DialegDenuncia {...props({ onEnvia: vi.fn().mockResolvedValue({ rebuda: true }) })} />);
    act(() => { fireEvent.click(screen.getByRole('radio', { name: /^Contingut ofensiu/ })); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Envia la denúncia' })); });
    vista.rerender(<MemoryRouter rutaInicial="/mur"><DialegDenuncia {...props({ obert: false })} /></MemoryRouter>);
    vista.rerender(<MemoryRouter rutaInicial="/mur"><DialegDenuncia {...props()} /></MemoryRouter>);
    expect(screen.getAllByRole('radio').every((radio) => !radio.checked)).toBe(true);
    expect(screen.getByRole('button', { name: 'Envia la denúncia' }).disabled).toBe(true);
  });
});

describe('els textos d’error', () => {
  test('cada code de CODI_MODERACIO té el seu text (claus sense guionets); un code desconegut, «desconegut»', () => {
    for (const code of Object.values(CODI_MODERACIO)) {
      const [clau, reserva] = textDErrorDeModeracio({ code });
      expect(clau).toMatch(/^section\.moderacio\.error\.[A-Za-z]+$/);
      expect(reserva).toMatch(/^[A-ZÀ-Ú].*\.$/);
      expect(TEXTOS_ERROR_MODERACIO[code]).toEqual([clau, reserva]);
    }
    expect(textDErrorDeModeracio({ code: 'inventat' })).toBe(TEXTOS_ERROR_MODERACIO.desconegut);
    expect(textDErrorDeModeracio(null)).toBe(TEXTOS_ERROR_MODERACIO.desconegut);
  });
});

describe('DialegBloqueig', () => {
  const props = (mes = {}) => ({ obert: true, objectiu: PUBLICACIO, onTanca: vi.fn(), onConfirma: vi.fn().mockResolvedValue(undefined), ...mes });

  test('una persona: el títol amb el nom, el text del xat, com desfer-ho i el focus a «Cancel·la»', () => {
    pinta(<DialegBloqueig {...props()} />);
    const finestra = screen.getByRole('dialog', { name: 'Vols bloquejar Pepa?' });
    expect(finestra.textContent).toContain('No veuràs les seues publicacions al Mur, al Mercat ni a l’Agenda, ni els seus missatges al xat. Pepa no rebrà cap avís.');
    expect(finestra.textContent).toContain('Ho pots desfer quan vulgues al teu perfil, a Privacitat i dades, o al Control del xat, a Privacitat i seguretat.');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel·la' }));
    expect(screen.getByRole('button', { name: 'Bloqueja' })).toBeTruthy();
  });

  test('una entitat no promet amagar-ne els missatges del xat (crítica 261020, 16)', () => {
    pinta(<DialegBloqueig {...props({ objectiu: DE_L_AJUNTAMENT })} />);
    const finestra = screen.getByRole('dialog', { name: 'Vols bloquejar Ajuntament?' });
    expect(finestra.textContent).toContain('No veuràs les publicacions de Ajuntament al Mur, al Mercat ni a l’Agenda. Ajuntament no rebrà cap avís.');
    expect(finestra.textContent).not.toContain('missatges al xat');
  });

  test('confirmar crida onConfirma; un rebuig es diu en línia i el diàleg continua obert', async () => {
    const onConfirma = vi.fn().mockRejectedValue(errorDeModeracio(CODI_MODERACIO.AUTOBLOQUEIG));
    const onTanca = vi.fn();
    pinta(<DialegBloqueig {...props({ onConfirma, onTanca })} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Bloqueja' })); });
    expect(onConfirma).toHaveBeenCalledTimes(1);
    expect(within(dialeg()).getByRole('alert').textContent).toBe('No et pots bloquejar a tu mateix.');
    expect(onTanca).not.toHaveBeenCalled();
  });

  test('mentre bloqueja, Escape no el tanca', () => {
    const onTanca = vi.fn();
    pinta(<DialegBloqueig {...props({ onTanca, onConfirma: () => new Promise(() => {}) })} />);
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Bloqueja' })); });
    act(() => { dialeg().dispatchEvent(new Event('cancel', { cancelable: true })); });
    expect(onTanca).not.toHaveBeenCalled();
  });
});

describe('DialegNormes', () => {
  const props = (mes = {}) => ({ obert: true, onTanca: vi.fn(), onAccepta: vi.fn().mockResolvedValue(undefined), ...mes });

  test('les cinc normes (l’última, la tolerància zero amb el termini), les eines i l’avís legal', () => {
    pinta(<DialegNormes {...props()} />);
    const finestra = screen.getByRole('dialog', { name: 'Normes de convivència del poble' });
    const normes = within(finestra).getAllByRole('listitem');
    expect(normes).toHaveLength(5);
    expect(normes[4].className).toBe('sdp-normes__zero');
    expect(normes[4].textContent).toContain('Revisem cada denúncia en menys de 24 hores.');
    expect(within(finestra).getByRole('link', { name: 'Avís legal i privacitat' }).getAttribute('href')).toBe('/legal');
  });

  test('«Accepte i continue» espera la casella i crida onAccepta', async () => {
    const onAccepta = vi.fn().mockResolvedValue(undefined);
    pinta(<DialegNormes {...props({ onAccepta })} />);
    const accepta = screen.getByRole('button', { name: 'Accepte i continue' });
    expect(accepta.disabled).toBe(true);
    act(() => { fireEvent.click(screen.getByRole('checkbox', { name: 'He llegit les normes de convivència i les accepte.' })); });
    expect(accepta.disabled).toBe(false);
    await act(async () => { fireEvent.click(accepta); });
    expect(onAccepta).toHaveBeenCalledTimes(1);
  });

  test('un error de versió diu què passa; qualsevol altre, que no s’ha pogut desar', async () => {
    const onAccepta = vi.fn()
      .mockRejectedValueOnce(errorDeModeracio(CODI_MODERACIO.VERSIO_INVALIDA))
      .mockRejectedValueOnce(new Error('xarxa'));
    pinta(<DialegNormes {...props({ onAccepta })} />);
    act(() => { fireEvent.click(screen.getByRole('checkbox')); });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Accepte i continue' })); });
    expect(within(dialeg()).getByRole('alert').textContent).toBe('La versió de les normes no és la vigent. Recarrega l’aplicació.');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Accepte i continue' })); });
    expect(within(dialeg()).getByRole('alert').textContent).toBe('No s’ha pogut desar l’acceptació. Torna-ho a provar.');
  });

  test('«Ara no» declina; l’enllaç a l’avís legal declina abans de navegar (crítica 261020, 21)', () => {
    const onTanca = vi.fn();
    pinta(<DialegNormes {...props({ onTanca })} />);
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Ara no' })); });
    expect(onTanca).toHaveBeenLastCalledWith('boto');
    act(() => { fireEvent.click(screen.getByRole('link', { name: 'Avís legal i privacitat' })); });
    expect(onTanca).toHaveBeenLastCalledWith('legal');
    expect(screen.getByTestId('ubicacio').textContent).toBe('/legal');
  });
});

describe('DialegsModeracio (l’amfitrió)', () => {
  const tancat = { obert: false, onTanca: vi.fn() };

  test('cap <dialog> fins que se n’obri un (Llei del Píxel); després es queda muntat', () => {
    const vista = pinta(<DialegsModeracio denuncia={tancat} bloqueig={tancat} normes={tancat} />);
    expect(vista.container.querySelector('dialog')).toBeNull();
    const ambDenuncia = { ...tancat, obert: true, objectiu: PUBLICACIO, onEnvia: vi.fn() };
    vista.rerender(<MemoryRouter rutaInicial="/mur"><DialegsModeracio denuncia={ambDenuncia} bloqueig={tancat} normes={tancat} /></MemoryRouter>);
    expect(screen.getByRole('dialog', { name: 'Denuncia este contingut' })).toBeTruthy();
    expect(vista.container.querySelectorAll('dialog')).toHaveLength(1);
    vista.rerender(<MemoryRouter rutaInicial="/mur"><DialegsModeracio denuncia={{ ...tancat, objectiu: null }} bloqueig={tancat} normes={tancat} /></MemoryRouter>);
    expect(vista.container.querySelectorAll('dialog')).toHaveLength(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('de la denúncia al bloqueig en el mateix pintat: l’ordre és denúncia, bloqueig, normes', () => {
    const vista = pinta(<DialegsModeracio denuncia={{ ...tancat, obert: true, objectiu: PUBLICACIO }} bloqueig={tancat} normes={tancat} />);
    vista.rerender(<MemoryRouter rutaInicial="/mur"><DialegsModeracio denuncia={tancat} bloqueig={{ ...tancat, obert: true, objectiu: PUBLICACIO }} normes={{ ...tancat, obert: true }} /></MemoryRouter>);
    const dialegs = [...vista.container.querySelectorAll('dialog')];
    expect(dialegs).toHaveLength(3);
    expect(dialegs[0].hasAttribute('open')).toBe(false);
    expect(within(dialegs[1]).getByRole('heading').textContent).toBe('Vols bloquejar Pepa?');
    expect(within(dialegs[2]).getByRole('heading').textContent).toBe('Normes de convivència del poble');
  });
});
