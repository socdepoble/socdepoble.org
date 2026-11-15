/* Onada R29 · Lectura en veu alta del menú Traduir amb el hook REAL i el servei de veu REAL.
   Només la síntesi del navegador és simulada: cancel() rebutja els enunciats de la cua en
   diferit amb 'interrupted', com fan Chrome i Safari.
   · R29-CV-01 · Canviar de veu mentre llig no deixa la lectura sense control.
   · R29-CV-06 · Un clic a l'Índex (?seccio=) no atura la lectura; canviar de pàgina, sí. */
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { RouterContext } from '../../../app/contexts/objectesDeContext.js';
import * as servei from '../../../services/veuIaiaService.js';
import { useTraduccioPagina } from './useTraduccioPagina.js';

let synth;
function instalaSintesi() {
  const estat = { cua: [], parlats: [], cancels: 0 };
  window.SpeechSynthesisUtterance = function Enunciat(text) { this.text = text; };
  window.speechSynthesis = {
    getVoices: () => [{ lang: 'ca-ES', name: 'Prova' }],
    addEventListener() {},
    removeEventListener() {},
    speak(enunciat) { estat.cua.push(enunciat); estat.parlats.push(enunciat.text); },
    cancel() {
      estat.cancels += 1;
      for (const enunciat of estat.cua.splice(0)) setTimeout(() => enunciat.onerror?.({ error: 'interrupted' }), 0);
    },
  };
  return estat;
}

const espera = (ms = 25) => new Promise((resol) => { setTimeout(resol, ms); });

function creaCos() {
  const cos = document.createElement('article');
  for (const text of ['Primer paràgraf de la pàgina per a llegir en veu alta.', 'Segon paràgraf.']) {
    const p = document.createElement('p');
    p.textContent = text;
    cos.appendChild(p);
  }
  return cos;
}

function munta({ ruta = null } = {}) {
  const cosRef = { current: creaCos() };
  const wrapper = ruta
    ? ({ children }) => (
      <RouterContext.Provider value={{ currentPath: ruta.cami, searchParams: new URLSearchParams(ruta.consulta) }}>
        {children}
      </RouterContext.Provider>
    )
    : undefined;
  const r = renderHook(() => useTraduccioPagina({ titol: 'Títol de prova', cosRef }), { wrapper });
  return { ...r, lv: () => r.result.current.menu.lecturaVeu };
}

beforeEach(() => {
  synth = instalaSintesi();
  servei.reiniciaVeuPerProves();
  servei.fixaPuntNode0(null);
});

afterEach(() => {
  cleanup();
  servei.reiniciaVeuPerProves();
  delete window.speechSynthesis;
  delete window.SpeechSynthesisUtterance;
});

describe('R29-CV-01 · canviar de veu mentre es llig la pàgina', () => {
  test('el menú continua dient «Aturar» i tornar a prémer atura de veres', async () => {
    const { lv } = munta();
    await act(async () => { lv().onEscoltar(); await espera(); });
    expect(lv().parlant).toBe(true);
    expect(servei.estaParlant()).toBe(true);

    await act(async () => { lv().onTriaVeu('arnau_valencia'); await espera(); });
    expect(lv().veuActual).toBe('arnau_valencia');
    expect(servei.estaParlant()).toBe(true);
    expect(lv().parlant).toBe(true);

    const enunciatsAbans = synth.parlats.length;
    await act(async () => { lv().onEscoltar(); await espera(); });
    expect(lv().parlant).toBe(false);
    expect(servei.estaParlant()).toBe(false);
    expect(synth.parlats.length).toBe(enunciatsAbans);
  });

  test('després d’un canvi de veu, desmuntar la pàgina calla la veu', async () => {
    const { lv, unmount } = munta();
    await act(async () => { lv().onEscoltar(); await espera(); });
    await act(async () => { lv().onTriaVeu('arnau_valencia'); await espera(); });
    const cancelsAbans = synth.cancels;
    unmount();
    await espera();
    expect(synth.cancels).toBeGreaterThan(cancelsAbans);
    expect(servei.estaParlant()).toBe(false);
  });

  test('una lectura que acaba sola torna el menú a «Escoltar»', async () => {
    const { lv } = munta();
    await act(async () => { lv().onEscoltar(); await espera(); });
    expect(lv().parlant).toBe(true);
    await act(async () => {
      for (const enunciat of synth.cua.splice(0)) enunciat.onend?.();
      await espera();
    });
    expect(lv().parlant).toBe(false);
    expect(servei.estaParlant()).toBe(false);
  });
});

describe('R29-CV-06 · l’Índex escriu ?seccio= dins de la mateixa pàgina', () => {
  test('triar un apartat no atura la lectura; canviar de pàgina sí', async () => {
    const ruta = { cami: '/page/node-zero', consulta: '' };
    const { lv, rerender } = munta({ ruta });
    await act(async () => { lv().onEscoltar(); await espera(); });
    expect(lv().parlant).toBe(true);

    const cancelsAbans = synth.cancels;
    ruta.consulta = 'seccio=segon-apartat';
    await act(async () => { rerender(); await espera(); });
    expect(lv().parlant).toBe(true);
    expect(servei.estaParlant()).toBe(true);
    expect(synth.cancels).toBe(cancelsAbans);

    ruta.cami = '/page/altra-pagina';
    await act(async () => { rerender(); await espera(); });
    expect(lv().parlant).toBe(false);
    expect(servei.estaParlant()).toBe(false);
  });

  test('una altra consulta (no ?seccio=) continua comptant com a pàgina nova', async () => {
    const ruta = { cami: '/mur', consulta: 'item=a' };
    const { lv, rerender } = munta({ ruta });
    await act(async () => { lv().onEscoltar(); await espera(); });
    expect(lv().parlant).toBe(true);

    ruta.consulta = 'item=b';
    await act(async () => { rerender(); await espera(); });
    expect(lv().parlant).toBe(false);
    expect(servei.estaParlant()).toBe(false);
  });
});
