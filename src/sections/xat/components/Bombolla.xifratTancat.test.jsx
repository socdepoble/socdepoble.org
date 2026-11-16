/* Onada R30 · R29-E2EE-02 (decisió tancada, pla R30 §4) · La bombolla d'un
   missatge xifrat que este dispositiu no ha pogut obrir ja no es pinta buida:
   diu el text serè en la llengua de la interfície, amb les classes de la
   làpida (cap CSS nou), sense role="alert", sense cap codi tècnic i sense
   «Copia el text». Un xifrat que s'obri, i un missatge sense seguretat, es
   pinten com sempre. La forma del missatge és la de mapejaMissatge per a la
   fila tancada del pipeline (missatges.test.js, R29-E2EE-02). */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import '../../../../tests/helpers/diccionaris.js';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import Bombolla from './Bombolla.jsx';
import { createTranslator } from '../../../config/i18n.js';
import { mapejaMissatge } from '../missatges.js';

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
