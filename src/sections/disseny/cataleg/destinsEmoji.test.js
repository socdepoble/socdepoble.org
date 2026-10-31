/* Ordre del Mestre (261007) · Els destins de l'«Assignar» d'Emojis XL, en
   funcions pures (destinsEmoji.js): les quatre fonts amb les seues carpetes i
   documents, el glif actual de cada destí, qui es pot escriure de veres
   (només les notes), per què no la resta, i la cerca. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { BrainCircuit, FileText, Folder, Inbox, Network, Newspaper, NotebookPen, Route, ShieldCheck } from 'lucide-react';
import { describe, expect, test, vi } from 'vitest';
import { GLIF_CARPETA, GLIF_DOCUMENT } from '../../../components/universal/workspace/NavGlyph.jsx';
import { SECTIONS } from '../../../config/sections.js';
import { COVER_PAGE_KEYS, SYSTEM_PAGES } from '../../../config/systemPages.js';
import { EMOTICONA_PER_DEFECTE, emojiSol } from '../../../utils/emoji.js';
import { NOM_CARPETA_CONNECTATS } from '../../notes/carpetes.js';
import { PAGE_COPY } from '../../text/pageContent.js';
import { ICONA_PORTADA, ICONES_ITEMS_WIKI, glifDeCarpetaWiki, iconaDeDocument } from '../../wiki-de-poble/iconesWiki.js';
import { GRUPS_EMOJIS } from './dades/emojisUnicode18.js';
import {
  CARPETA_MAQUINARIA, GRUPS_DESTI, destinsDeCarpetesDelBloc, destinsDeLaWiki, destinsDeNotes, destinsDelDisseny,
  destinsDelSistema, filtraDestins, motiuInert, textAssignat, textCarpetaBloc, textCarpetaWiki, textDelCodi,
  textJaHiEra, textNoAssignable, textNoReconegut, textNoValid
} from './destinsEmoji.js';

/* Només per a llegir les eines locals de veres (modulsLocalsActius) sense
   arrossegar la Consola ni la Wiki compilada. */
vi.mock('../../consola/ConsolaSection.jsx', () => ({ ConsolaIncrustada: () => null }));
vi.mock('../../../data/wikiManifest.js', () => ({ wikiManifest: { categories: [], items: [] } }));

const llig = (ruta) => readFileSync(path.join(process.cwd(), ruta), 'utf8');

describe('els grups', () => {
  test('quatre, en l’ordre de la pantalla; tots avisen del codi menys les notes', () => {
    expect(GRUPS_DESTI.map((grup) => [grup.id, grup.titol])).toEqual([
      ['notes', 'Notes personals'], ['wiki', 'Wiki de Poble'], ['disseny', 'Disseny'], ['sistema', 'Pàgines de Sóc de Poble']
    ]);
    expect(GRUPS_DESTI[0].avis).toBeNull();
    expect(GRUPS_DESTI.slice(1).every((grup) => /viatgen dins del codi de l’app/.test(grup.avis))).toBe(true);
  });
});

describe('destinsDeCarpetesDelBloc', () => {
  test('les carpetes de la columna del Bloc, inertes, amb la seua icona de Lucide i on pengen', () => {
    const destins = destinsDeCarpetesDelBloc([
      { id: 'f-tot', name: 'Tot' }, { id: 'f-mur', name: 'Mur' }, { id: 7, name: 'Hort', parentId: 'f-mur' }
    ]);
    /* Sense «Tot», i la Safata d’Entrada afegida (opcionsDeCarpetes). */
    expect(destins.map((desti) => [desti.id, desti.titol, desti.previa])).toEqual([
      ['nota:carpeta:f-mur', 'Mur', 'Carpeta del Bloc'],
      ['nota:carpeta:7', 'Hort', 'Carpeta de Mur'],
      ['nota:carpeta:f-connectats', NOM_CARPETA_CONNECTATS, 'Carpeta del Bloc']
    ]);
    expect(destins.map((desti) => desti.glif)).toEqual([Newspaper, Folder, Inbox]);
    expect(destins.every((desti) => desti.escriu === 'carpeta-bloc' && desti.grup === 'notes' && !desti.nota)).toBe(true);
  });

  test('sense carpetes del servidor, les de sèrie (com la columna del Bloc)', () => {
    const destins = destinsDeCarpetesDelBloc([]);
    expect(destins.length).toBeGreaterThan(3);
    expect(destins.map((desti) => desti.titol)).toContain(NOM_CARPETA_CONNECTATS);
    expect(destins.map((desti) => desti.titol)).not.toContain('Tot');
  });
});

describe('destinsDeNotes', () => {
  const notes = [
    { id: 'n1', title: '<p>La nota</p>', subtitle: 'Del <strong>hort</strong>', icon: '🍅', formattedDate: '07/10/26' },
    { id: 'n2', title: '🌿 Herbes', plainText: 'Romer i timó' },
    { id: 'n3', title: '', lead: 'Sense títol encara' },
    { id: 'n4', title: 'Connexió', origen: { tipus: 'connexio', id: 'x' } },
    { title: 'Sense id' }
  ];

  test('cada nota és un destí que s’escriu de veres, amb títol pla, previa i data', () => {
    const [primera] = destinsDeNotes(notes);
    expect(primera).toMatchObject({
      id: 'nota:n1', grup: 'notes', titol: 'La nota', previa: 'Del hort', glif: '🍅', data: '07/10/26', escriu: 'nota'
    });
    expect(primera.nota).toBe(notes[0]);
  });

  test('el glif és el de la llista del Bloc: l’emoticona, l’emoji del títol o la ploma de sèrie', () => {
    const [, segona, tercera] = destinsDeNotes(notes);
    expect(segona.glif).toBe('🌿');
    expect(segona.previa).toBe('Romer i timó');
    expect(tercera.titol).toBe('Sense títol');
    expect(tercera.glif).toBe(EMOTICONA_PER_DEFECTE);
  });

  test('una connexió no porta la ploma, sinó la carpeta; una nota sense id no és cap destí', () => {
    const destins = destinsDeNotes(notes);
    expect(destins).toHaveLength(4);
    expect(destins[3].glif).toBe(GLIF_CARPETA);
  });

  test('una emoticona que no és un sol emoji no compta com a glif', () => {
    expect(destinsDeNotes([{ id: 'b', title: 'Brossa', icon: '🍅 Tomaques' }])[0].glif).toBe(EMOTICONA_PER_DEFECTE);
  });

  test('sense notes (Bloc absent), cap destí', () => {
    expect(destinsDeNotes(undefined)).toEqual([]);
    expect(destinsDeNotes(null)).toEqual([]);
  });
});

describe('destinsDeLaWiki', () => {
  const manifest = {
    categories: [
      { id: 'folder:01_ser', parentId: null, label: 'SER' },
      { id: 'folder:02_saber', parentId: null, label: 'SABER' },
      { id: 'folder:02_saber/buida', parentId: 'folder:02_saber', label: 'BUIDA' }
    ],
    items: [
      { id: '00_index', title: 'Índex', subtitle: 'Índex mestre', categoryId: null },
      { id: 'genoma', title: 'Genoma', subtitle: 'El <em>genoma</em>', categoryId: 'folder:01_ser' },
      { id: '02_genotip', title: 'Genotip', categoryId: 'folder:01_ser' },
      { id: 'llei', title: 'Llei', categoryId: 'folder:02_saber', attributes: { type: 'norma' } }
    ]
  };
  const consola = { title: 'Consola Termodinàmica', subtitle: 'Manteniment' };
  const locals = [{ id: 'tractors_aprovacio', title: 'Aprovació de tractors', subtitle: 'Signatura', icon: '🚜', categoryId: 'maquinaria_cat' }];
  const ids = (destins, prefix) => destins.filter((desti) => desti.id.startsWith(prefix));

  test('com la Wiki: la portada, les carpetes (Maquinària de la IAIA i les del manifest) i els documents (la Consola, les eines locals i el manifest)', () => {
    const destins = destinsDeLaWiki(manifest, { title: 'Wiki de Poble', subtitle: 'La base' }, { consola, locals });
    expect(destins.map((desti) => desti.id)).toEqual([
      'wiki:portada',
      'wiki:carpeta:maquinaria_cat', 'wiki:carpeta:folder:01_ser', 'wiki:carpeta:folder:02_saber', 'wiki:carpeta:folder:02_saber/buida',
      'wiki:consola_termodinamica', 'wiki:tractors_aprovacio',
      'wiki:00_index', 'wiki:genoma', 'wiki:02_genotip', 'wiki:llei'
    ]);
    expect(destins.every((desti) => desti.grup === 'wiki')).toBe(true);
    /* La portada: el seu emoji, el mateix que pinta la Wiki (ordre del Mestre, pla 261007_0012, §0.7). */
    expect(destins[0]).toMatchObject({ titol: 'Wiki de Poble', previa: 'La base', glif: ICONA_PORTADA, escriu: 'codi' });
    expect(ICONES_ITEMS_WIKI.__intro).toBe(ICONA_PORTADA);
    expect(destins.find((desti) => desti.id === 'wiki:genoma').previa).toBe('El genoma');
  });

  /* Ordre del Mestre (pla 261007_0012, §0.7) · Cada carpeta de la Wiki porta el
     seu emoji, el que pinta l'arbre (glifDeCarpetaWiki, la mateixa font). És
     fix: viu al codi, i la fila continua inerta («Icona fixa»). */
  test('cada carpeta porta el seu emoji (el de l’arbre de la Wiki), diu on penja i quants documents té, i no s’escriu', () => {
    const carpetes = ids(destinsDeLaWiki(manifest, null, { consola, locals }), 'wiki:carpeta:');
    expect(carpetes.map((desti) => [desti.titol, desti.previa])).toEqual([
      ['Maquinària de la IAIA', 'Carpeta · 2 documents'],
      ['SER', 'Carpeta · 2 documents'],
      ['SABER', 'Carpeta · 1 document'],
      ['BUIDA', 'Carpeta de SABER · cap document']
    ]);
    /* «BUIDA» no té emoji a iconesWiki.js: la carpeta de Lucide, com a l'arbre. */
    expect(carpetes.map((desti) => desti.glif)).toEqual(['🎛️', '🌱', '🦉', GLIF_CARPETA]);
    expect(carpetes.map((desti) => desti.glif)).toEqual(carpetes.map((desti) => glifDeCarpetaWiki(desti.id.slice('wiki:carpeta:'.length))));
    expect(carpetes.every((desti) => desti.escriu === 'carpeta-wiki')).toBe(true);
    expect(carpetes.map((desti) => motiuInert(desti).etiqueta)).toEqual(['Icona fixa', 'Icona fixa', 'Icona fixa', 'Icona fixa']);
  });

  test('el glif de cada document és el que pinta la Wiki, de la mateixa font (iconesWiki.js)', () => {
    const destins = destinsDeLaWiki(manifest, null, { consola, locals });
    const documents = destins.filter((desti) => !desti.id.startsWith('wiki:carpeta:'));
    expect(documents.slice(2).map((desti) => desti.glif)).toEqual(manifest.items.map(iconaDeDocument));
    expect(documents.map((desti) => desti.glif)).toEqual([ICONES_ITEMS_WIKI.consola_termodinamica, '🚜', '📇', '📄', '🧬', '⚖️']);
    expect(documents.every((desti) => desti.escriu === 'codi')).toBe(true);
    expect(documents[0]).toMatchObject({ titol: 'Consola Termodinàmica', previa: 'Manteniment' });
  });

  test('sense el copy de la Consola, els títols de reserva de la Wiki; sense eines locals, la Consola sola a Maquinària', () => {
    const destins = destinsDeLaWiki({ categories: [], items: [] }, null);
    expect(destins.map((desti) => [desti.id, desti.titol, desti.previa])).toEqual([
      ['wiki:carpeta:maquinaria_cat', 'Maquinària de la IAIA', 'Carpeta · 1 document'],
      ['wiki:consola_termodinamica', 'Consola Termodinàmica', 'Manteniment de la IAIA']
    ]);
  });

  /* Gauntlet 261016 (Bloc 3.4) · Sense la Maquinària a la vista (fora de DEV i
     sense superadmin): ni la carpeta, ni la Consola, ni cap eina local; la
     resta de la Wiki, igual. Per defecte, la de sempre. */
  test('Bloc 3.4 · amb `maquinaria: false`, ni la carpeta ni la Consola ni les eines locals; la resta, igual', () => {
    const amb = destinsDeLaWiki(manifest, null, { consola, locals });
    const sense = destinsDeLaWiki(manifest, null, { consola, locals, maquinaria: false });
    const delaMaquinaria = new Set(['wiki:carpeta:maquinaria_cat', 'wiki:consola_termodinamica', ...locals.map((eina) => `wiki:${eina.id}`)]);
    expect(sense.map((desti) => desti.id)).toEqual(amb.map((desti) => desti.id).filter((id) => !delaMaquinaria.has(id)));
    expect(sense.some((desti) => delaMaquinaria.has(desti.id))).toBe(false);
    expect(destinsDeLaWiki(manifest, null, { consola, locals, maquinaria: true })).toEqual(amb);
  });

  test('mentre la Wiki compilada no ha arribat, només la portada', () => {
    expect(destinsDeLaWiki(null, { title: 'Wiki' }, { consola, locals }).map((desti) => desti.id)).toEqual(['wiki:portada']);
    expect(destinsDeLaWiki(null, null)).toEqual([]);
  });

  test('les eines locals de veres (modulsLocalsActius de la Wiki): en desenvolupament, amb el seu emoji i dins de Maquinària; en producció, cap', async () => {
    const { modulsLocalsActius } = await import('../../wiki-de-poble/WikiDePobleSection.jsx');
    const dev = destinsDeLaWiki({ categories: [], items: [] }, null, { locals: modulsLocalsActius({ DEV: true }).items });
    expect(dev.map((desti) => [desti.id, desti.glif])).toEqual([
      ['wiki:carpeta:maquinaria_cat', '🎛️'],
      ['wiki:consola_termodinamica', '⚙️'],
      ['wiki:tractors_aprovacio', '🚜'], ['wiki:sentinelles_panell', '💂'], ['wiki:agents_panell', '🤖']
    ]);
    expect(dev[0].previa).toBe('Carpeta · 4 documents');
    expect(modulsLocalsActius({ DEV: false }).items).toEqual([]);
  }, 30000);

  test('la carpeta i els títols de reserva són els que declara la Wiki (WikiDePobleSection no els exporta), i el glif de les carpetes, de la mateixa funció', () => {
    const wiki = llig('src/sections/wiki-de-poble/WikiDePobleSection.jsx');
    expect(wiki).toContain(`{ id: '${CARPETA_MAQUINARIA.id}', label: '${CARPETA_MAQUINARIA.label}', icon: glifDeCarpetaWiki('${CARPETA_MAQUINARIA.id}') }`);
    expect(wiki).toContain('icon: glifDeCarpetaWiki(c.id)');
    expect(wiki).toContain("title: consola?.title || 'Consola Termodinàmica'");
    expect(wiki).toContain("subtitle: consola?.subtitle || 'Manteniment de la IAIA'");
    expect(wiki).toContain("categoryId: 'maquinaria_cat'");
  });
});

describe('destinsDelDisseny', () => {
  const categories = [{ id: 'fonaments', label: 'Fonaments', icon: '🧱' }, { id: 'emoticones', label: 'Emojis XL', icon: '🌻' }, { id: 'buida', label: 'Buida' }];
  const items = [
    { id: 'fonaments-color', title: 'Identitat cromàtica', subtitle: 'Paleta OKLCH', categoryIds: ['fonaments'] },
    { id: 'fonaments-tipus', title: 'Tipografia', categoryIds: ['fonaments'], icon: '🔤' },
    { id: 'emoticones-xl', title: 'Emojis XL', subtitle: 'Famílies', categoryIds: ['emoticones'], icon: '🌻' },
    { id: 'sense-familia', title: 'Sense família', categoryIds: ['cap'] }
  ];

  test('la portada, les famílies (les carpetes del catàleg, amb el seu emoji) i els espècimens, tots del codi', () => {
    const destins = destinsDelDisseny(categories, items, { title: 'Disseny', subtitle: 'Pedra Seca' });
    expect(destins.map((desti) => [desti.id, desti.glif])).toEqual([
      ['disseny:portada', GLIF_DOCUMENT],
      ['disseny:carpeta:fonaments', '🧱'], ['disseny:carpeta:emoticones', '🌻'], ['disseny:carpeta:buida', GLIF_CARPETA],
      ['disseny:fonaments-color', '🧱'], ['disseny:fonaments-tipus', '🔤'], ['disseny:emoticones-xl', '🌻'],
      ['disseny:sense-familia', GLIF_DOCUMENT]
    ]);
    expect(destins.every((desti) => desti.escriu === 'codi' && desti.grup === 'disseny')).toBe(true);
    expect(destins.filter((desti) => desti.id.startsWith('disseny:carpeta:')).map((desti) => [desti.titol, desti.previa])).toEqual([
      ['Fonaments', 'Carpeta · 2 espècimens'], ['Emojis XL', 'Carpeta · 1 espècimen'], ['Buida', 'Carpeta · cap espècimen']
    ]);
    expect(destins.find((desti) => desti.id === 'disseny:fonaments-color').previa).toBe('Paleta OKLCH');
  });
});

describe('destinsDelSistema', () => {
  const copyDe = (clau) => PAGE_COPY[clau] || null;

  test('les pàgines del sistema i, darrere, les de text de la navegació; sense les que ja són a un altre grup', () => {
    /* Onada 8 (261009) · La Consola i el Cervell, pàgines del sistema
       darrere de Disseny (SYSTEM_PAGES). La Consola, com les portades, es
       passa com a ja llistada (AssignacioEmoji.jsx): la Wiki ja la porta i
       no es repetix. El Cervell és nou i hi és.
       Ordre del Mestre (261026_2126; prompt 261026_2130, tasca 1) ·
       «Descàrregues i Aplicacions», l'última de SYSTEM_PAGES, darrere de
       Drets d'autor.
       Ordre del Mestre (30-10-2026; candidatura NLnet NGI Fediversity) ·
       «Candidatura Europea NLnet · NGI Fediversity», ara l'última de
       SYSTEM_PAGES, darrere de Descàrregues. */
    const destins = destinsDelSistema(SYSTEM_PAGES, SECTIONS, copyDe, [COVER_PAGE_KEYS.wiki, COVER_PAGE_KEYS.disseny, COVER_PAGE_KEYS.consola]);
    const claus = ['projecte', 'constitucio', 'roadmap', 'notes', 'cervell', 'versions', 'legal', 'xat', 'drets-autor', 'descarregues', 'fediversity', 'anima', 'fedivers'];
    expect(destins.map((desti) => desti.id)).toEqual(claus.map((clau) => `sistema:${clau}`));
    expect(destins.map((desti) => desti.titol)).toEqual(claus.map((clau) => PAGE_COPY[clau].title));
    expect(destins.every((desti) => desti.grup === 'sistema' && desti.escriu === 'codi')).toBe(true);
    expect(destins[1].previa).toBe(PAGE_COPY.constitucio.subtitle);
  });

  test('el glif és el de la barra lateral, per ruta; sense entrada a la barra, el document', () => {
    const glifs = Object.fromEntries(destinsDelSistema(SYSTEM_PAGES, SECTIONS, copyDe).map((desti) => [desti.id, desti.glif]));
    expect(glifs).toMatchObject({
      'sistema:projecte': FileText, 'sistema:constitucio': ShieldCheck, 'sistema:roadmap': Route, 'sistema:notes': NotebookPen,
      'sistema:xat': GLIF_DOCUMENT, 'sistema:drets-autor': GLIF_DOCUMENT, 'sistema:anima': BrainCircuit, 'sistema:fedivers': Network,
      /* Onada 8 (261009) · /page/cervell no té entrada a la barra: el document. */
      'sistema:cervell': GLIF_DOCUMENT,
      /* 261026_2126 · /page/descarregues tampoc no en té: el document. */
      'sistema:descarregues': GLIF_DOCUMENT,
      /* 30-10-2026 · /page/fediversity tampoc no en té: el document. */
      'sistema:fediversity': GLIF_DOCUMENT
    });
    /* Sense exclusions, les portades de la Wiki i de Disseny també hi són. */
    expect(Object.keys(glifs)).toEqual(expect.arrayContaining(['sistema:wikidepoble', 'sistema:disseny']));
  });

  test('el copy carregat mana; una clau sense copy no es pinta (com al Mur), i cap clau es repetix', () => {
    const destins = destinsDelSistema(
      [{ key: 'projecte', href: '/projecte' }, { key: 'absent', href: '/absent' }, { key: 'projecte', href: '/projecte' }],
      [{ path: '/projecte', pageKey: 'projecte', icon: ShieldCheck }],
      (clau) => (clau === 'projecte' ? { title: 'Projecte carregat', subtitle: 'Del core' } : null)
    );
    expect(destins).toEqual([{
      id: 'sistema:projecte', grup: 'sistema', titol: 'Projecte carregat', previa: 'Del core', glif: ShieldCheck, data: '', escriu: 'codi'
    }]);
  });
});

describe('filtraDestins', () => {
  const destins = [
    { id: 'a', titol: 'Identitat cromàtica', previa: 'Paleta OKLCH' },
    { id: 'b', titol: 'Col·lecció en curs', previa: 'Tiquet' },
    { id: 'c', titol: 'Hort', previa: 'Tomaques de l’horta' }
  ];

  test('sense consulta (o amb només un emoji), tots', () => {
    expect(filtraDestins(destins, '')).toBe(destins);
    expect(filtraDestins(destins, '🧀')).toBe(destins);
  });

  test('plega accents, majúscules i el punt volat; totes les paraules, al títol o a la previa', () => {
    expect(filtraDestins(destins, 'CROMATICA').map((desti) => desti.id)).toEqual(['a']);
    expect(filtraDestins(destins, 'colleccio').map((desti) => desti.id)).toEqual(['b']);
    expect(filtraDestins(destins, 'hort tomaques').map((desti) => desti.id)).toEqual(['c']);
    expect(filtraDestins(destins, 'hort paleta')).toEqual([]);
  });
});

describe('els avisos', () => {
  test('diuen la veritat: fet, ja hi era, del codi, no vàlid i les carpetes', () => {
    expect(textAssignat('🧀', 'La nota')).toBe('Fet: 🧀 és ara l’emoji de «La nota».');
    expect(textJaHiEra('🧀', 'La nota')).toBe('«La nota» ja porta 🧀: no hi havia res a canviar.');
    expect(textDelCodi('Genoma')).toBe('No s’ha canviat res: «Genoma» viu al codi de l’app i el seu emoji es canvia amb un commit.');
    expect(textNoValid('🏻')).toBe('🏻 no pot ser l’emoticona d’una nota: ha de ser un sol emoji.');
    /* Ordre del Mestre (pla 261007_0012, §0.7) · Les carpetes de la Wiki ja porten emoji: fix, del codi. */
    expect(textCarpetaWiki('SER')).toBe('No s’ha canviat res: «SER» és una carpeta de la Wiki, i el seu emoji és fix: viu al codi de l’app i es canvia amb un commit.');
    expect(textCarpetaWiki('SER')).not.toMatch(/Lucide/);
    expect(textCarpetaBloc('Mur')).toBe('No s’ha canviat res: «Mur» és una carpeta del Bloc. Les carpetes porten icones de Lucide, i el contracte de dades amb el servidor encara no els guarda cap emoticona.');
  });
});

describe('motiuInert', () => {
  test('una nota s’escriu de veres: cap motiu', () => {
    expect(motiuInert(destinsDeNotes([{ id: 'n1', title: 'La nota' }])[0])).toBeNull();
  });

  test('una pàgina o una família del codi: «Al codi» i el commit', () => {
    expect(motiuInert({ titol: 'Genoma', escriu: 'codi' })).toEqual({ etiqueta: 'Al codi', text: textDelCodi('Genoma') });
  });

  test('una carpeta de la Wiki (emoji fix del codi) o del Bloc (icona de Lucide): «Icona fixa» i el seu motiu', () => {
    expect(motiuInert({ titol: 'SER', escriu: 'carpeta-wiki' })).toEqual({ etiqueta: 'Icona fixa', text: textCarpetaWiki('SER') });
    expect(motiuInert({ titol: 'Mur', escriu: 'carpeta-bloc' })).toEqual({ etiqueta: 'Icona fixa', text: textCarpetaBloc('Mur') });
  });

  test('un tipus desconegut mai es fingix escrit: compta com a codi', () => {
    expect(motiuInert({ titol: 'X', escriu: 'constructor' })).toEqual({ etiqueta: 'Al codi', text: textDelCodi('X') });
    expect(motiuInert({ titol: 'Y' }).etiqueta).toBe('Al codi');
  });
});

describe('el catàleg', () => {
  /* El contracte del camp `icon` d'una nota és emojiSol (T23), que llig les
     propietats Unicode del motor. Les incorporacions més noves (Unicode 17 i
     18: 16 entrades amb el Node d'este torn) encara no hi consten com a emoji
     i no passen: la pantalla ho diu (textNoValid) i no les escriu. La resta
     del catàleg sí. El llindar deixa marge a un motor un poc més antic. */
  test('quasi tot el catàleg pot ser l’emoticona d’una nota; el que el motor encara no coneix, no', () => {
    const totes = GRUPS_EMOJIS.flatMap((grup) => grup.emojis);
    const valides = totes.filter(([, emoji]) => emojiSol(emoji) === emoji);
    expect(totes).toHaveLength(3972);
    expect(valides.length).toBeGreaterThanOrEqual(3900);
    expect(emojiSol('🧀')).toBe('🧀');
  });

  /* Revisió del 261007 (M2-12) · Un emoji del catàleg que el motor encara no
     coneix és un sol emoji: l'avís no diu que no ho siga, diu que el
     navegador no el reconeix. Una entrada lliure sense cap pictograma, sí. */
  test('M2-12 · el que el motor encara no coneix: «este navegador encara no el reconeix», no «ha de ser un sol emoji»', () => {
    const noReconeguts = GRUPS_EMOJIS.flatMap((grup) => grup.emojis).filter(([, emoji]) => emojiSol(emoji) !== emoji);
    for (const [, emoji] of noReconeguts) expect([emoji, textNoAssignable(emoji)]).toEqual([emoji, textNoReconegut(emoji)]);
    expect(textNoReconegut('🫨')).toBe('Este navegador encara no reconeix 🫨 com a emoji: no es pot desar a la nota.');
    expect(textNoAssignable('ab')).toBe(textNoValid('ab'));
    expect(textNoAssignable('')).toBe(textNoValid(''));
    // Un pictograma que el motor no dona per emoji sol (sense presentació d'emoji).
    expect(emojiSol('©')).toBeNull();
    expect(textNoAssignable('©')).toBe(textNoReconegut('©'));
  });
});
