/**
 * EmoweTelladoR22.invariants.test.js — Invariants de futur i WPO perceptual de
 * Fernando Tellado + Emowe verificats sobre el codi real (Onada R22 · T3).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { elementDeMurPublic } from '../../data/murPublic.js';
import { origenPublic } from '../../data/origenNota.js';
import { ImatgeDePortada } from './PageFrame.jsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ARREL_SRC = path.resolve(__dirname, '../..');

/* Auditoria del kit de Gemini R22 (kit_gemini_auditor) · Els invariants 2 i 3
   miraven el TEXT dels dos fitxers (els seus imports directes) i no el que
   carreguen: DocumentEditor.jsx → PanellVisibilitatEnLinia.jsx →
   sections/notes/visibilitatNota.js passava la prova amb l'acoblament viu.
   Ara recorren el graf d'imports estàtics sencer (el que el paquet arrossega
   sempre); els import() mandrosos no hi entren: són la unió tardana del port
   (backendPort.js → host.js) i de les rutes, no un acoblament de l'editor. */
const EXTENSIONS = ['', '.js', '.jsx', '.mjs', '/index.js', '/index.jsx'];
const IMPORT_ESTATIC = /(?:^|[;\n])\s*(?:import|export)\s(?:[^'"`;]*?\sfrom\s*)?['"]([^'"]+)['"]/g;
const senseComentaris = (codi) => codi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

function resolDe(fitxer, especificador) {
  const base = path.resolve(path.dirname(fitxer), especificador.replace(/\?.*$/, ''));
  for (const ext of EXTENSIONS) {
    const candidat = base + ext;
    if (fs.existsSync(candidat) && fs.statSync(candidat).isFile()) return candidat;
  }
  return null;
}

/** El tancament transitiu dels imports estàtics: Map(fitxer → qui l'importa) i els paquets de fora. */
function grafEstatic(inicis) {
  const pare = new Map();
  const paquets = new Map();
  const cua = inicis.map((rel) => [path.join(ARREL_SRC, rel), null]);
  while (cua.length) {
    const [fitxer, de] = cua.shift();
    if (pare.has(fitxer)) continue;
    pare.set(fitxer, de);
    if (!/\.(?:m?jsx?)$/.test(fitxer)) continue;
    for (const [, especificador] of senseComentaris(fs.readFileSync(fitxer, 'utf8')).matchAll(IMPORT_ESTATIC)) {
      if (!especificador.startsWith('.')) { if (!paquets.has(especificador)) paquets.set(especificador, fitxer); continue; }
      const resolt = resolDe(fitxer, especificador);
      if (resolt && !pare.has(resolt)) cua.push([resolt, fitxer]);
    }
  }
  return { pare, paquets };
}

const relatiu = (fitxer) => path.relative(ARREL_SRC, fitxer).split(path.sep).join('/');
function cami(pare, fitxer) {
  const tros = [];
  for (let x = fitxer; x; x = pare.get(x)) tros.unshift(relatiu(x));
  return tros.join(' → ');
}

afterEach(cleanup);

describe('Emowe + Tellado R22 · 3 invariants future-proof + WPO d’imatge de portada', () => {
  test('Invariant 1: el DTO públic (anon) mai exposa originRef, origin_ref ni abast privat de compartició', () => {
    const filaAmbMetadadesInternes = {
      id: 'pub-r22-1',
      title: 'Crònica de la collita',
      description: 'Oli novell de la cooperativa',
      public_content: '<p>Text públic net</p>',
      created_at: '2026-11-13T10:00:00Z',
      updated_at: '2026-11-13T10:05:00Z',
      originRef: 'wp:post:9981',
      origin_ref: 'wp:post:9981',
      owner_user_id: 'usr-privat-123',
      origen: {
        tipus: 'extern',
        url: 'https://ajuntament.exemple.org/bando-intern',
        abast: { mode: 'persones', persones: [{ id: 'vei-1', nom: 'Pepa' }] }
      },
      payload: {
        originRef: 'wp:post:9981',
        author_name: 'Secret intern'
      }
    };

    const publicDto = elementDeMurPublic(filaAmbMetadadesInternes, 'mur');
    expect(publicDto.originRef).toBeUndefined();
    expect(publicDto.origin_ref).toBeUndefined();
    expect(publicDto.origen).toBeUndefined();
    expect(publicDto.owner_user_id).toBeUndefined();
    expect(JSON.stringify(publicDto)).not.toContain('wp:post:9981');
    expect(JSON.stringify(publicDto)).not.toContain('usr-privat-123');

    const origenCompartible = origenPublic({
      tipus: 'connexio',
      itemId: 'item-1',
      titol: 'Bando',
      abast: { mode: 'grups', grups: [{ id: 'g-1', nom: 'Grup privat' }] }
    });
    expect(origenCompartible).toEqual({ tipus: 'connexio', itemId: 'item-1', titol: 'Bando' });
    expect(origenCompartible.abast).toBeUndefined();
  });

  test('Invariant 2: DocumentEditor.jsx i UniversalEditorShell.jsx reutilitzen l’arquitectura sense importar src/sections/notes/ ni crear cap UniversalEditor.jsx', () => {
    const universalEditorFantasma = path.join(ARREL_SRC, 'components/universal/UniversalEditor.jsx');
    expect(fs.existsSync(universalEditorFantasma)).toBe(false);

    const { pare } = grafEstatic([
      'components/universal/DocumentEditor.jsx',
      'components/universal/UniversalEditorShell.jsx'
    ]);
    const deNotes = [...pare.keys()].filter((f) => relatiu(f).startsWith('sections/notes/'));
    expect(deNotes.map((f) => cami(pare, f))).toEqual([]);
  });

  test('Invariant 3: cap editor en línia de pàgines fora de /notes (PageDetailSection i TextSection són lectors purs)', () => {
    const { pare, paquets } = grafEstatic([
      'sections/detail/PageDetailSection.jsx',
      'sections/text/TextSection.jsx'
    ]);
    const editors = [...pare.keys()].filter((f) => /(?:^|\/)(?:DocumentEditor|UniversalEditorShell)\.jsx$/.test(relatiu(f)));
    expect(editors.map((f) => cami(pare, f))).toEqual([]);
    const tiptap = [...paquets.keys()].filter((p) => p.startsWith('@tiptap/'));
    expect(tiptap.map((p) => `${cami(pare, paquets.get(p))} → ${p}`)).toEqual([]);
  });

  test('Tellado WPO: ImatgeDePortada mai combina fetchpriority="high" amb loading="lazy" i omet fetchpriority="auto"', () => {
    const { container, rerender } = render(
      createElement(ImatgeDePortada, {
        src: '/assets/brand/logo_socdepoble_negre.svg',
        alt: 'Portada principal',
        width: 1200,
        height: 675,
        fetchpriority: 'high',
        loading: 'lazy'
      })
    );
    const imgAlta = container.querySelector('img');
    expect(imgAlta).toBeTruthy();
    expect(imgAlta.getAttribute('fetchpriority')).toBe('high');
    expect(imgAlta.hasAttribute('loading')).toBe(false);
    expect(imgAlta.getAttribute('width')).toBe('1200');
    expect(imgAlta.getAttribute('height')).toBe('675');

    rerender(
      createElement(ImatgeDePortada, {
        src: '/assets/brand/logo_socdepoble_negre.svg',
        alt: 'Portada estàndard',
        fetchpriority: 'auto',
        loading: 'lazy'
      })
    );
    const imgAuto = container.querySelector('img');
    expect(imgAuto.hasAttribute('fetchpriority')).toBe(false);
    expect(imgAuto.getAttribute('loading')).toBe('lazy');
  });
});
