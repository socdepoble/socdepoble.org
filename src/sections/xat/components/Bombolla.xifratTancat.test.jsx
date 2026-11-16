/* Onada R30 · R29-E2EE-02 (decisió tancada, pla R30 §4) · La bombolla d'un
   missatge xifrat que este dispositiu no ha pogut obrir ja no es pinta buida:
   diu el text serè en la llengua de la interfície, amb les classes de la
   làpida (cap CSS nou), sense role="alert", sense cap codi tècnic i sense
   «Copia el text». Un xifrat que s'obri, i un missatge sense seguretat, es
   pinten com sempre. La forma del missatge és la de mapejaMissatge per a la
   fila tancada del pipeline (missatges.test.js, R29-E2EE-02). */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import '../../../../tests/helpers/diccionaris.js';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import Bombolla from './Bombolla.jsx';
import { createTranslator } from '../../../config/i18n.js';
import { mapejaMissatge } from '../missatges.js';
import { CODIS_INTEGRITAT_E2EE, causaMissatgeXifratTancat, esXifratTancat, imatgesDeLaGaleria, textDeCita, textMissatgeXifratTancat } from '../conversa.js';
import { construeixRetall } from '../retall.js';

afterEach(cleanup);

const TEXTOS = Object.freeze({
  ca: 'Missatge xifrat d’extrem a extrem en un altre dispositiu',
  es: 'Mensaje cifrado de extremo a extremo en otro dispositivo',
  en: 'End-to-end encrypted message on another device',
  eu: 'Beste gailu batean muturretik muturrera zifratutako mezua',
  gl: 'Mensaxe cifrada de extremo a extremo noutro dispositivo'
});
/* Onada R30 · R29-E2EE-02 · Integritat, clau nova sense confirmar o codi desconegut: el text neutre. */
const NO_OBERT = Object.freeze({
  ca: 'No s’ha pogut obrir este missatge xifrat',
  es: 'No se ha podido abrir este mensaje cifrado',
  en: 'This encrypted message could not be opened',
  eu: 'Ezin izan da zifratutako mezu hau ireki',
  gl: 'Non se puido abrir esta mensaxe cifrada'
});

const CODIS = ['xifrat-manipulat', 'epoca-desconeguda', 'claus-bloquejades', 'clau-nova-sense-confirmar', 'sense-context'];

/* La fila tancada del pipeline (filaTancada: text null i la seguretat), passada per mapejaMissatge. */
const tancat = (codi = 'epoca-desconeguda', extra = {}) => mapejaMissatge({
  id: 'm-tancat', filId: 'f-1', usuariId: 'pepa', autorNom: 'Pepa', seq: 7, text: null,
  creatAl: '2026-11-15T10:00:00.000Z', xifrat: { ct: 'sobre opac' },
  seguretat: { xifrat: true, verificat: false, codi }, ...extra
}, 'jo');

/* El nom de l'autor d'un grup és un enllaç al seu perfil: cal el router. */
const pinta = (missatge, llengua = 'ca', props = {}) => render(
  <MemoryRouter>
    <ul>
      <Bombolla missatge={missatge} locale="ca-ES" t={createTranslator(llengua)} onCopia={() => {}} onRespon={() => {}} {...props} />
    </ul>
  </MemoryRouter>
);

describe('R29-E2EE-02 · la bombolla d’un missatge xifrat que no s’obri', () => {
  test.each(Object.keys(TEXTOS))('%s · diu el text serè de la seua llengua, amb les classes de la làpida', (llengua) => {
    const { container } = pinta(tancat(), llengua, { esGrup: true });
    const paragraf = screen.getByText(TEXTOS[llengua]);
    expect(paragraf.tagName).toBe('P');
    expect([...paragraf.classList]).toEqual(['sdp-xat-bombolla__text', 'sdp-xat-bombolla__text--esborrat']);
    /* És text de la interfície: sense dir="auto" (el de la gent sí que el porta). */
    expect(paragraf.hasAttribute('dir')).toBe(false);
    /* L'autor (en un grup) i l'hora continuen; la bombolla és xifrada (data-sdp-e2ee). */
    expect(container.querySelector('.sdp-xat-bombolla__autor')?.textContent).toBe('Pepa');
    expect(container.querySelector('time')?.getAttribute('dateTime')).toBe('2026-11-15T10:00:00.000Z');
    expect(container.querySelector('.sdp-xat-bombolla-wrap')?.getAttribute('data-sdp-e2ee')).toBe('true');
  });

  test.each(CODIS)('amb el codi «%s»: ni alerta, ni el codi, ni cap altre text', (codi) => {
    const { container } = pinta(tancat(codi), 'en');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
    const bombolla = container.querySelector('.sdp-xat-bombolla');
    expect(bombolla.textContent).not.toContain(codi);
    expect(bombolla.textContent).not.toMatch(/SDP-|xifrat-|epoca|clau-|sense-/);
    expect(container.querySelectorAll('.sdp-xat-bombolla__text')).toHaveLength(1);
    expect(container.querySelector('.sdp-xat-bombolla--error')).toBeNull();
  });

  test('el text serè no és seu: el menú no ofereix «Copia el text», però sí «Respon»', () => {
    pinta(tancat(), 'ca');
    fireEvent.click(screen.getByRole('button', { name: 'Opcions del missatge' }));
    const menu = screen.getByRole('menu');
    expect(within(menu).queryByRole('menuitem', { name: 'Copia el text' })).toBeNull();
    expect(within(menu).getByRole('menuitem', { name: 'Respon' })).not.toBeNull();
  });

  test('un text que no ha verificat el pipeline no es pinta mai, ni es copia', () => {
    const forcat = { ...tancat(), text: 'text sense verificar' };
    const { container } = pinta(forcat, 'ca');
    expect(container.textContent).not.toContain('text sense verificar');
    expect(screen.getByText(TEXTOS.ca)).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Opcions del missatge' }));
    expect(screen.queryByRole('menuitem', { name: 'Copia el text' })).toBeNull();
  });

  test('un missatge propi d’un altre dispositiu que este no obri: el text de la clau absent, amb les marques', () => {
    const { container } = pinta(tancat('epoca-desconeguda', { usuariId: 'jo' }), 'es');
    expect(screen.getByText(TEXTOS.es)).not.toBeNull();
    expect(container.querySelector('.sdp-xat-item--meu')).not.toBeNull();
  });

  test.each(Object.keys(NO_OBERT))('%s · un missatge manipulat o amb firma invàlida no diu «en un altre dispositiu»: diu el text neutre', (llengua) => {
    for (const codi of ['xifrat-manipulat', 'firma-invalida', 'kid-no-fixat']) {
      const { container, unmount } = pinta(tancat(codi), llengua);
      const paragraf = screen.getByText(NO_OBERT[llengua]);
      expect([...paragraf.classList]).toEqual(['sdp-xat-bombolla__text', 'sdp-xat-bombolla__text--esborrat']);
      expect(screen.queryByText(TEXTOS[llengua])).toBeNull();
      expect(screen.queryByRole('alert')).toBeNull();
      expect(container.querySelector('.sdp-xat-bombolla').textContent).not.toContain(codi);
      unmount();
    }
  });

  test('en el mode de selecció, el text serè dins de la casella', () => {
    pinta(tancat(), 'gl', { seleccio: { actiu: true, triat: false, onAlterna: () => {} } });
    const casella = screen.getByRole('checkbox');
    expect(within(casella).getByText(TEXTOS.gl)).not.toBeNull();
  });

  test('esborrat mana: la làpida de sempre, no el text serè', () => {
    pinta(tancat('epoca-desconeguda', { esborratAl: '2026-11-15T11:00:00.000Z' }), 'ca');
    expect(screen.getByText("S'ha esborrat este missatge")).not.toBeNull();
    expect(screen.queryByText(TEXTOS.ca)).toBeNull();
  });
});

describe('R29-E2EE-02 · el que s’obri es pinta com sempre', () => {
  test('un xifrat verificat diu el seu text, amb dir="auto" i sense el text serè', () => {
    const obert = mapejaMissatge({
      id: 'm-obert', filId: 'f-1', usuariId: 'pepa', autorNom: 'Pepa', seq: 8, text: 'Bon dia!',
      creatAl: '2026-11-15T10:01:00.000Z', seguretat: { xifrat: true, verificat: true, firmada: true, clauAntiga: false }
    }, 'jo');
    pinta(obert, 'ca');
    const paragraf = screen.getByText('Bon dia!').closest('p');
    expect([...paragraf.classList]).toEqual(['sdp-xat-bombolla__text']);
    expect(paragraf.getAttribute('dir')).toBe('auto');
    expect(screen.queryByText(TEXTOS.ca)).toBeNull();
  });

  test('sense seguretat, el text buit de sempre (cap text serè)', () => {
    const { container } = pinta(mapejaMissatge({ id: 'm-pla', filId: 'f-1', usuariId: 'pepa', seq: 9, text: '' }, 'jo'), 'ca');
    expect(screen.queryByText(TEXTOS.ca)).toBeNull();
    expect(container.querySelector('.sdp-xat-bombolla__text--esborrat')).toBeNull();
  });
});

/* Onada R32 · Fusió semàntica del kit Gemini R30.2 (R30-C3-E2EE-CAUSA-01) i de la conciliació de Codex
   R31 sobre R29-E2EE-02. La separació causal entra com a classificació interna; el text visible continua
   sent el de la decisió del Mestre: «en un altre dispositiu» només amb els codis reals de clau absent
   al dispositiu, i el text neutre per a la integritat i la resta (cap tercer text sense ordre). */
const SENSE_CLAU = ['epoca-desconeguda', 'sense-epoca', 'epoca-saltada', 'sense-context', 'claus-bloquejades'];
/* `clau-absent` (el codi del kit, que no emet cap productor) i `clau-absent-del-contacte` (la clau del
   contacte, CODI_MOTOR.clauAbsent) no són la clau d'este aparell; els tres últims, els estructurals de
   la conciliació de Codex R31. */
const NO_DISPONIBLE = ['clau-absent', 'clau-absent-del-contacte', 'clau-nova-sense-confirmar', 'sobre-absent',
  'firma-invalida', 'kid-no-quadra', 'repeticio', 'etiqueta-invalida', 'longitud-invalida', 'sobre-invalid', ''];
const RESTA_DE_DISPOSITIU = /altre dispositiu|otro dispositivo|another device|beste gailu|noutro dispositivo/i;

describe('Onada R32 · separació causal (Gemini R30.2) i conciliació (Codex R31) dins de R29-E2EE-02', () => {
  const amb = (codi, extra = {}) => ({
    id: `m-${codi || 'buit'}`, seq: 1, sender: 'other', author: 'Pep', text: `RESIDU_${codi || 'BUIT'}`,
    creatAl: '2026-11-16T00:10:00Z', seguretat: codi ? { xifrat: true, verificat: false, codi } : { xifrat: true, verificat: false }, ...extra
  });

  test.each(Object.keys(TEXTOS))('%s · tres famílies, dos textos visibles, cap codi ni cap resta del text', (llengua) => {
    const t = createTranslator(llengua);
    for (const codi of SENSE_CLAU) {
      expect(causaMissatgeXifratTancat(amb(codi))).toBe('clau-absent');
      expect(textMissatgeXifratTancat(amb(codi), t)).toBe(TEXTOS[llengua]);
      expect(textDeCita(amb(codi), t)).toBe(TEXTOS[llengua]);
    }
    for (const codi of CODIS_INTEGRITAT_E2EE) {
      expect(causaMissatgeXifratTancat(amb(codi))).toBe('integritat');
      const text = textMissatgeXifratTancat(amb(codi), t);
      expect(text).toBe(NO_OBERT[llengua]);
      expect(text).not.toMatch(RESTA_DE_DISPOSITIU);
      expect(text).not.toContain(codi);
      expect(textDeCita(amb(codi), t)).toBe(NO_OBERT[llengua]);
    }
    for (const codi of NO_DISPONIBLE) {
      expect(causaMissatgeXifratTancat(amb(codi))).toBe('no-disponible');
      const text = textMissatgeXifratTancat(amb(codi), t);
      expect(text).toBe(NO_OBERT[llengua]);
      expect(text).not.toMatch(RESTA_DE_DISPOSITIU);
      if (codi) expect(text).not.toContain(codi);
      expect(text).not.toContain('RESIDU_');
    }
    /* Un xifrat obert no té família ni text serè. */
    expect(causaMissatgeXifratTancat({ seguretat: { xifrat: true, verificat: true } })).toBeNull();
    expect(textMissatgeXifratTancat({ text: 'Bon dia', seguretat: { xifrat: true, verificat: true } }, t)).toBe('');
  });

  test('una fallada d’integritat amb metadades forjades: ni text, ni foto, ni llista, ni registre, ni «Copia el text», ni codi', () => {
    const onCopia = vi.fn();
    const { container } = pinta({
      ...amb('xifrat-manipulat'), tipus: 'imatge', text: 'TEXT_FILTRAT_PROHIBIT', accioRegistre: true,
      metadades: {
        adjunt: { id: 'adj-1', cami: 'mitjans/privat.jpg', mime: 'image/jpeg' },
        llista: { id: 'll-1', titol: 'Llista secreta', elements: [{ id: 'e1', text: 'Oli', fet: false }] }
      }
    }, 'ca', { onCopia });
    expect(screen.getByText(NO_OBERT.ca)).not.toBeNull();
    for (const prohibit of ['TEXT_FILTRAT_PROHIBIT', 'xifrat-manipulat', 'Llista secreta', 'Entra o registra']) {
      expect(container.textContent).not.toContain(prohibit);
    }
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('a[href*="registre"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Opcions del missatge' }));
    expect(screen.queryByRole('menuitem', { name: 'Copia el text' })).toBeNull();
    expect(screen.getByRole('menuitem', { name: 'Respon' })).not.toBeNull();
    expect(onCopia).not.toHaveBeenCalled();
  });

  test('la galeria deixa fora el xifrat tancat; el retall el marca amb el text serè de la seua causa', () => {
    const t = createTranslator('es');
    const missatges = [
      { id: 'img-oberta', seq: 1, sender: 'other', author: 'Pep', tipus: 'imatge', text: 'Foto bona', metadades: { adjunt: { id: 'a1' } }, seguretat: { xifrat: true, verificat: true } },
      { ...amb('farciment-invalid'), id: 'img-manipulada', seq: 2, tipus: 'imatge', text: 'SECRET_MANIPULAT', metadades: { adjunt: { id: 'a2' } } },
      { ...amb('epoca-desconeguda'), id: 'txt-altre-aparell', seq: 3, sender: 'me', author: 'Jo', text: 'SECRET_CLAU_ABSENT' }
    ];
    expect(missatges.map(esXifratTancat)).toEqual([false, true, true]);
    expect(imatgesDeLaGaleria(missatges, { t }).map((x) => x.id)).toEqual(['img-oberta']);
    const { content } = construeixRetall({ fil: { name: 'Plaça' }, missatges: [missatges[1], missatges[2]], locale: 'es-ES', t });
    expect(content).toContain(`<em>${NO_OBERT.es}</em>`);
    expect(content).toContain(`<em>${TEXTOS.es}</em>`);
    for (const prohibit of ['SECRET_MANIPULAT', 'SECRET_CLAU_ABSENT', 'farciment-invalid', 'epoca-desconeguda']) {
      expect(content).not.toContain(prohibit);
    }
  });

  test('una fila tancada que diu ser l’esborrany de la IAIA no en fa cap esborrany amb text sense verificar', () => {
    const fila = { ...amb('xifrat-manipulat'), esEsborranyIAIA: true, titolEsborrany: 'Títol forjat', text: 'COS_FORJAT' };
    const { title, content } = construeixRetall({ fil: { name: 'IAIA' }, missatges: [fila], t: createTranslator('ca') });
    expect(title).not.toContain('Títol forjat');
    expect(content).toContain(`<em>${NO_OBERT.ca}</em>`);
    expect(content).not.toContain('COS_FORJAT');
  });

  test('un xifrat tancat i esborrat: la cita buida de l’esborrat al retall, mai el text sense verificar', () => {
    const fila = { ...amb('epoca-desconeguda'), esborratAl: '2026-11-16T00:20:00Z', text: 'RESTA_ESBORRADA' };
    const { content } = construeixRetall({ fil: { name: 'Plaça' }, missatges: [fila], t: createTranslator('ca') });
    expect(content).toContain('<blockquote>');
    expect(content).not.toContain('RESTA_ESBORRADA');
    expect(content).not.toContain('<em>Missatge xifrat');
  });
});
