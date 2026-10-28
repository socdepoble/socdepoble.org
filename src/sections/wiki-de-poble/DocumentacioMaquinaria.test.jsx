/* Pla 261027_0845 (Guarda Nocturna), §3 · Transparència radical: el cos de
   les pàgines de documentació de la Maquinària de la IAIA fora de
   desenvolupament (DocumentacioMaquinaria.jsx i documentacioMaquinaria.js).
   Els mòduls de la Wiki no poden llegir els carrils dels Tractors ni de la
   Gestoria (gestoria/privacitat.test.js); les proves, sí, i ací vigilen que
   el text no es desvie del que pinten els panells de desenvolupament: els set
   sentinelles pel nom i en l'ordre del registre, i el BIOS, idèntic al del
   panell dels Agents.
   Revisió adversarial del bloc B (Guarda Nocturna 261027) · Proves
   actualitzades a propòsit: els tractors del catàleg, pel nom i en l'ordre
   de TRACTORS_GESTORIA; i el BIOS ja no rebaixa els títols dues voltes (un
   «## » d'AGENTS.md ix com a h3, no com a h4 davall de l'H2 de la pàgina).
   El panell dels Agents, del carril dels Tractors, encara ho fa: les dues
   pàgines es comparen amb eixe esglaó de diferència als títols, i res més.
   Derogat: «idèntic» (byte a byte) i «els títols un esglaó avall». */
import React from 'react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import DocumentacioMaquinaria from './DocumentacioMaquinaria.jsx';
import { AVIS_NOMES_EN_LOCAL, ID_BIOS, documentacioDe, markdownDelBios } from './documentacioMaquinaria.js';
import PanellAgents from '../tractors/PanellAgents.jsx';
import { SENTINELLES } from '../tractors/registreSentinelles.js';
import { TRACTORS_GESTORIA } from '../gestoria/tractors.js';

afterEach(cleanup);

const llig = (ruta) => readFileSync(path.join(process.cwd(), ruta), 'utf8');

describe('documentacioDe', () => {
  /* parseMarkdown baixa un esglaó cada títol: «## » ix com a h3, davall de l'H2 de la pàgina. */
  test('la porta d’aprovació i els Sentinelles en tenen, en H3; el BIOS és AGENTS.md, no cap text d’ací', () => {
    for (const id of ['tractors_aprovacio', 'sentinelles_panell']) {
      expect(documentacioDe(id), id).toMatch(/^## /);
      expect(documentacioDe(id), id).not.toMatch(/^#(?:#{2,})? /m);
    }
    expect(ID_BIOS).toBe('agents_panell');
    expect(documentacioDe(ID_BIOS)).toBeNull();
  });

  test('només les claus pròpies: res per a un id desconegut, una propietat d’objecte o un valor que no és text', () => {
    for (const id of ['constructor', 'toString', '__proto__', 'consola_termodinamica', '', undefined, null, 7, {}]) {
      expect(documentacioDe(id)).toBeNull();
    }
  });

  test('els set sentinelles, pel seu nom i en l’ordre del registre', () => {
    const text = documentacioDe('sentinelles_panell');
    const noms = SENTINELLES.map((s) => s.manifest.nom);
    expect(noms).toHaveLength(7);
    const posicions = noms.map((nom) => text.indexOf(`**${nom}**`));
    expect(posicions.filter((p) => p < 0), 'noms que falten').toEqual([]);
    expect([...posicions].sort((a, b) => a - b)).toEqual(posicions);
  });

  /* El subtítol de la pàgina promet «Què fa cada tractor»: cada un del
     catàleg, pel seu nom i en el seu ordre, i cap més. */
  test('la porta d’aprovació diu què fa cada tractor del catàleg, pel seu nom i en el seu ordre', () => {
    const text = documentacioDe('tractors_aprovacio');
    const seccio = text.split(/^## /m).find((tros) => tros.startsWith('Què fa cada tractor'));
    expect(seccio, 'falta la secció').toBeTruthy();
    const noms = TRACTORS_GESTORIA.map((m) => m.nom);
    expect(noms.length).toBeGreaterThan(0);
    const entrades = [...seccio.matchAll(/^- \*\*(.+?)\*\*: \S/gm)].map((m) => m[1]);
    expect(entrades).toEqual(noms);
  });

  test('la porta d’aprovació diu els set estats amb les paraules de la pantalla', () => {
    const text = documentacioDe('tractors_aprovacio');
    for (const estat of ['Pendent', 'Aprovat', 'Caducat', 'Revocat', 'Versió canviada', 'Incomplet', 'Sense empremta']) {
      expect(text, estat).toContain(`**${estat}**`);
    }
  });

  /* La plataforma és «el Mas»: el patró es compon a trossos perquè la paraula vetada no hi siga escrita. */
  test('cap terme vetat al text públic', () => {
    for (const id of ['tractors_aprovacio', 'sentinelles_panell']) {
      expect(documentacioDe(id)).not.toMatch(new RegExp(['ma', 'sia'].join(''), 'i'));
      expect(documentacioDe(id)).not.toMatch(new RegExp(['Local-', 'First|Offline-', 'First'].join('')));
    }
    expect(AVIS_NOMES_EN_LOCAL.text).not.toMatch(new RegExp(['ma', 'sia'].join(''), 'i'));
  });
});

describe('DocumentacioMaquinaria', () => {
  test.each(['tractors_aprovacio', 'sentinelles_panell'])('%s: l’avís (sense regió viva) i la documentació, sense cap control', (id) => {
    const { container } = render(<DocumentacioMaquinaria id={id} />);
    const panell = container.firstElementChild;
    expect(panell.className).toBe('sdp-tractors-panell');
    const [avis, prosa] = panell.children;
    expect(avis.className).toBe('sdp-alerta sdp-alerta--info');
    expect(avis.getAttribute('role')).toBeNull();
    expect(avis.querySelector('.sdp-alerta__titol').textContent).toBe(AVIS_NOMES_EN_LOCAL.titol);
    expect(avis.querySelector('.sdp-alerta__text').textContent).toBe(AVIS_NOMES_EN_LOCAL.text);
    expect(prosa.className).toBe('sdp-prose sdp-prose--encoixinada');
    expect(prosa.querySelectorAll('h3').length).toBeGreaterThan(2);
    expect(container.querySelectorAll('h1, h2, button, input, select, textarea, dialog, form')).toHaveLength(0);
    // La documentació no porta entradilla pròpia: l'entradilla és de la pàgina.
    expect(prosa.querySelector('p.lead')).toBeNull();
  });

  /* El BIOS de producció ha de dir exactament el mateix que el panell dels
     Agents de desenvolupament: la recepta és la mateixa, i ací es compara.
     L'única diferència, els títols: el panell en rebaixa cada un dues voltes
     (h4 davall de l'H2 de la pàgina) i la documentació, una (h3). Es puja un
     esglaó cada títol del panell (l'etiqueta i la classe visual) i la resta ha
     de ser idèntica. Quan el panell es corregisca, unEsglaoAmunt sobrarà i la
     prova fallarà: llavors es compara tal qual. */
  const unEsglaoAmunt = (html) => html
    .replace(/<h([3-6]) class="h([2-6])">/g, (_m, s, v) => `<h${s - 1} class="h${v - 1}">`)
    .replace(/<\/h([3-6])>/g, (_m, s) => `</h${s - 1}>`);

  test('agents_panell: el BIOS, el mateix text que el panell dels Agents (amb els títols un esglaó amunt), sense avís ni cap control', () => {
    const produccio = render(<DocumentacioMaquinaria id={ID_BIOS} />).container;
    const html = produccio.innerHTML;
    expect(produccio.querySelector('.sdp-alerta')).toBeNull();
    expect(produccio.querySelectorAll('button, input, dialog, form')).toHaveLength(0);
    cleanup();
    const desenvolupament = render(<PanellAgents />).container.innerHTML;
    expect(html).not.toBe(desenvolupament);
    expect(html).toBe(unEsglaoAmunt(desenvolupament));
    expect(html).toContain('UN SOL CERVELL');
    // Un «## » d'AGENTS.md, un h3 (classe visual h2), com a la resta de la Wiki.
    expect(html).toMatch(/<h3 class="h2">0\. REGLA 0/);
  });

  test('markdownDelBios: el frontmatter en cita, els enllaços d’Obsidian com a ítems, sense l’H1 i amb els títols tal qual', () => {
    const md = markdownDelBios('---\ntype: document\nstatus: canonic\n---\n# Títol\n\nEntradeta.\n\n## Secció\n\n### Subsecció\n\nVegeu [[00_index]].\n');
    expect(md).toContain('> **Metadades del document (Frontmatter):**\n> type: document  \n> status: canonic');
    expect(md).toMatch(/^## Secció$/m);
    expect(md).toMatch(/^### Subsecció$/m);
    expect(md).not.toContain('### Secció');
    expect(md).toContain('[00_index](?item=00_index)');
    expect(md).not.toMatch(/^# Títol/m);
    expect(markdownDelBios(undefined).trim()).toBe('');
  });

  test('un id que no té documentació no pinta res', () => {
    const { container } = render(<DocumentacioMaquinaria id="constructor" />);
    expect(container.innerHTML).toBe('');
  });

  /* Els dos mòduls no importen res dels carrils dels Tractors ni de la
     Gestoria: el que demana gestoria/privacitat.test.js per a tot src, dit
     ací també per als fitxers d'esta peça. */
  test('cap importació dels carrils dels Tractors ni de la Gestoria', () => {
    for (const ruta of ['src/sections/wiki-de-poble/DocumentacioMaquinaria.jsx', 'src/sections/wiki-de-poble/documentacioMaquinaria.js']) {
      const especificadors = [...llig(ruta).matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)].map((m) => m[1]);
      expect(especificadors.length, ruta).toBeGreaterThan(0);
      expect(especificadors.filter((e) => /(?:^|\/)(?:tractors|gestoria)\//.test(e)), ruta).toEqual([]);
    }
  });
});
