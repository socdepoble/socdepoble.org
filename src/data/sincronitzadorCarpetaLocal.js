/**
 * sincronitzadorCarpetaLocal.js — Sincronitzador Bidireccional de Carpeta Local
 * estil Obsidian (Vault Markdown + JSON-LD) per a Sóc de Poble (Onada 8 i 9).
 *
 * Permet que qualsevol veí, cooperativa o ajuntament munte una carpeta del seu
 * ordinador com a Vault sobirà de notes i pàgines de la Wiki de Poble usant la
 * File System Access API (`FileSystemDirectoryHandle`), amb fallback universal
 * d'exportació/importació per als navegadors sense `showDirectoryPicker`.
 *
 * Característiques de seguretat i resiliència:
 *  - Zero ReDoS: analitzador de frontmatter YAML lineal per índexs de línia.
 *  - Protecció estricta contra Path Traversal (`..`, `/`, `\`, NUL).
 *  - Reconciliació bidireccional per hash SHA-256 amb conservació garantida
 *    en cas d'edició simultània (zero pèrdua de text: es genera còpia de conflicte).
 */

import { copiaJsonRural } from './persistenciaLocalRural.js';
import { ESQUEMA_CRDT_RURAL, estatCrdtRuralBuit, normalitzaCrdtRural, fusionaCrdtRural, projectaCrdtRural, canviaCrdtRural, frontieraNotaCrdtRural, baseCausalNotaCrdtRural } from './crdtRural.js';
import { canonitzaJsonJcs, sha256Hex } from './federacio/portabilitatFediversity.js';

export const ESQUEMA_VAULT_FALLBACK = 'sdp.vault.markdown-jsonld.v1';
export const NOM_FITXER_INDEX_VAULT = '.sdp-vault-index.json';

function congelaProfund(valor) {
  if (valor === null || typeof valor !== 'object') return valor;
  if (Array.isArray(valor)) {
    for (let i = 0; i < valor.length; i += 1) congelaProfund(valor[i]);
    return Object.freeze(valor);
  }
  for (const clau of Object.keys(valor)) {
    congelaProfund(valor[clau]);
  }
  return Object.freeze(valor);
}

/**
 * Comprova si l'entorn actual suporta la File System Access API nativa.
 */
export function suportaFileSystemAccessApi(entorn = globalThis) {
  return typeof entorn?.showDirectoryPicker === 'function';
}

/**
 * Converteix un identificador o slug en un nom de fitxer `.md` segur dins del Vault,
 * bloquejant qualsevol intent de Path Traversal.
 */
export function nomFitxerSegurVault(identificador) {
  if (typeof identificador !== 'string' || !identificador.trim()) {
    throw new TypeError('[sincronitzadorCarpetaLocal] Identificador de fitxer buit.');
  }
  if (
    identificador.includes('..') ||
    identificador.includes('/') ||
    identificador.includes('\\') ||
    identificador.includes('\0')
  ) {
    throw new Error(`[sincronitzadorCarpetaLocal] Nom de fitxer rebutjat per seguretat: ${identificador}`);
  }
  const base = identificador.trim().replace(/\.md$/i, '');
  const net = base
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!net || net === '.' || net === '..') {
    throw new Error(`[sincronitzadorCarpetaLocal] Nom de fitxer invàlid després de sanejament: ${identificador}`);
  }
  return `${net}.md`;
}

/**
 * Normalitza una nota de Sóc de Poble i en calcula el `sha256Cos`.
 */
export function normalitzaNotaVault(notaInput) {
  if (notaInput === null || typeof notaInput !== 'object' || Array.isArray(notaInput)) {
    throw new TypeError('[sincronitzadorCarpetaLocal] La nota ha de ser un objecte pla.');
  }
  const id = typeof notaInput.id === 'string' && notaInput.id.trim()
    ? notaInput.id.trim()
    : '';
  if (!id) {
    throw new TypeError('[sincronitzadorCarpetaLocal] La nota necessita un `id` no buit.');
  }
  const slug = typeof notaInput.slug === 'string' && notaInput.slug.trim()
    ? notaInput.slug.trim()
    : id;
  const title = typeof notaInput.title === 'string' && notaInput.title.trim()
    ? notaInput.title.trim()
    : slug;
  const folderId = typeof notaInput.folderId === 'string' && notaInput.folderId.trim()
    ? notaInput.folderId.trim()
    : 'general';
  const updatedAt = typeof notaInput.updatedAt === 'string' && notaInput.updatedAt.trim()
    ? notaInput.updatedAt.trim()
    : '2026-11-03T00:00:00Z';
  const content = typeof notaInput.content === 'string'
    ? notaInput.content.replace(/\r\n/g, '\n')
    : '';
  const tags = Array.isArray(notaInput.tags)
    ? notaInput.tags.map((t) => String(t).trim()).filter(Boolean)
    : [];

  const sha256Cos = sha256Hex(canonitzaJsonJcs({ title, folderId, tags, content }));
  const nomFitxer = nomFitxerSegurVault(slug);

  return congelaProfund({
    id,
    slug,
    title,
    folderId,
    updatedAt,
    tags,
    content,
    sha256Cos,
    nomFitxer,
  });
}

/**
 * Serialitza una nota en un document Markdown amb frontmatter YAML determinista
 * compatible amb Obsidian i qualsevol editor de text local.
 */
export function serialitzaNotaAMarkdownVault(notaInput) {
  const nota = normalitzaNotaVault(notaInput);
  const liniesFrontmatter = [
    '---',
    `id: ${JSON.stringify(nota.id)}`,
    `slug: ${JSON.stringify(nota.slug)}`,
    `title: ${JSON.stringify(nota.title)}`,
    `folderId: ${JSON.stringify(nota.folderId)}`,
    `updatedAt: ${JSON.stringify(nota.updatedAt)}`,
    `tags: ${JSON.stringify(nota.tags)}`,
    `sha256Cos: ${JSON.stringify(nota.sha256Cos)}`,
    '---',
    '',
  ];
  const cos = nota.content.endsWith('\n') ? nota.content : `${nota.content}\n`;
  return liniesFrontmatter.join('\n') + cos;
}

function lligValorYamlSimple(textValor) {
  const net = textValor.trim();
  if (!net) return '';
  if (net.startsWith('"') || net.startsWith('[') || net.startsWith('{')) {
    try {
      return JSON.parse(net);
    } catch {
      // Si algú ha editat el frontmatter a mà sense cometes JSON estrictes, cau al tractament pla.
    }
  }
  if ((net.startsWith("'") && net.endsWith("'")) || (net.startsWith('"') && net.endsWith('"'))) {
    return net.slice(1, -1);
  }
  return net;
}

/**
 * Analitza un fitxer Markdown del Vault (sense cap expressió regular amb risc de ReDoS)
 * i el converteix en una nota normalitzada de Sóc de Poble.
 */
export function parsejaMarkdownVaultANota(contingutMd, { nomFitxer = 'nota.md' } = {}) {
  if (typeof contingutMd !== 'string') {
    throw new TypeError('[sincronitzadorCarpetaLocal] El contingut Markdown ha de ser una cadena.');
  }
  const normalitzat = contingutMd.replace(/\r\n/g, '\n');
  const slugDefecte = nomFitxerSegurVault(nomFitxer).replace(/\.md$/i, '');

  let metadades = {};
  let cos = normalitzat;

  if (normalitzat.startsWith('---\n')) {
    const tancament = normalitzat.indexOf('\n---\n', 4);
    if (tancament !== -1) {
      const blocYaml = normalitzat.slice(4, tancament);
      cos = normalitzat.slice(tancament + 5);
      if (cos.startsWith('\n')) cos = cos.slice(1);

      const linies = blocYaml.split('\n');
      for (const linia of linies) {
        const sep = linia.indexOf(':');
        if (sep > 0) {
          const clau = linia.slice(0, sep).trim();
          const valorBrut = linia.slice(sep + 1);
          if (clau && clau !== '__proto__' && clau !== 'constructor' && clau !== 'prototype') {
            metadades[clau] = lligValorYamlSimple(valorBrut);
          }
        }
      }
    }
  }

  if (cos.endsWith('\n')) {
    cos = cos.slice(0, -1);
  }

  return normalitzaNotaVault({
    id: typeof metadades.id === 'string' && metadades.id.trim() ? metadades.id : slugDefecte,
    slug: typeof metadades.slug === 'string' && metadades.slug.trim() ? metadades.slug : slugDefecte,
    title: typeof metadades.title === 'string' && metadades.title.trim() ? metadades.title : slugDefecte,
    folderId: typeof metadades.folderId === 'string' && metadades.folderId.trim() ? metadades.folderId : 'general',
    updatedAt: typeof metadades.updatedAt === 'string' && metadades.updatedAt.trim()
      ? metadades.updatedAt
      : '2026-11-03T00:00:00Z',
    tags: Array.isArray(metadades.tags) ? metadades.tags : [],
    content: cos,
  });
}

/**
 * Calcula el pla de sincronització bidireccional entre les notes de l'aplicació
 * i les notes de la carpeta local usant l'índex d'empremtes `SHA-256` de l'última
 * sincronització. Quan una mateixa nota s'ha modificat alhora a l'app i a la
 * carpeta amb continguts diferents, es conserven totes dues versions creant una
 * nota de conflicte explícita (zero pèrdua de dades).
 */
export function calculaPlaSincronitzacioVault({
  notesApp = [],
  notesCarpeta = [],
  ultimIndexHashes = {},
} = {}) {
  const mapaApp = new Map();
  for (const n of notesApp) {
    const norm = normalitzaNotaVault(n);
    mapaApp.set(norm.id, norm);
  }

  const mapaCarpeta = new Map();
  for (const n of notesCarpeta) {
    const norm = normalitzaNotaVault(n);
    mapaCarpeta.set(norm.id, norm);
  }

  const totsIds = [...new Set([...mapaApp.keys(), ...mapaCarpeta.keys()])].sort();
  const accions = [];
  const notesResultants = [];
  const fitxersPerEscriure = [];
  const nouIndexHashes = {};

  for (const id of totsIds) {
    const app = mapaApp.get(id) ?? null;
    const carpeta = mapaCarpeta.get(id) ?? null;
    const hashBase = typeof ultimIndexHashes?.[id] === 'string' ? ultimIndexHashes[id] : null;

    if (app && !carpeta) {
      accions.push({ id, tipus: 'escriure_a_carpeta', motiu: 'nova_a_app' });
      notesResultants.push(app);
      fitxersPerEscriure.push({
        nomFitxer: app.nomFitxer,
        contingut: serialitzaNotaAMarkdownVault(app),
        nota: app,
      });
      nouIndexHashes[id] = app.sha256Cos;
    } else if (!app && carpeta) {
      accions.push({ id, tipus: 'importar_de_carpeta', motiu: 'nova_a_carpeta' });
      notesResultants.push(carpeta);
      nouIndexHashes[id] = carpeta.sha256Cos;
    } else if (app.sha256Cos === carpeta.sha256Cos) {
      const mesRecent = app.updatedAt >= carpeta.updatedAt ? app : carpeta;
      accions.push({ id, tipus: 'sense_canvis', motiu: 'sha256_identic' });
      notesResultants.push(mesRecent);
      nouIndexHashes[id] = mesRecent.sha256Cos;
    } else if (hashBase && app.sha256Cos !== hashBase && carpeta.sha256Cos === hashBase) {
      accions.push({ id, tipus: 'escriure_a_carpeta', motiu: 'modificada_a_app' });
      notesResultants.push(app);
      fitxersPerEscriure.push({
        nomFitxer: app.nomFitxer,
        contingut: serialitzaNotaAMarkdownVault(app),
        nota: app,
      });
      nouIndexHashes[id] = app.sha256Cos;
    } else if (hashBase && carpeta.sha256Cos !== hashBase && app.sha256Cos === hashBase) {
      accions.push({ id, tipus: 'importar_de_carpeta', motiu: 'modificada_a_carpeta' });
      notesResultants.push(carpeta);
      nouIndexHashes[id] = carpeta.sha256Cos;
    } else {
      // Edició concurrent als dos costats amb contingut diferent:
      // Guanya la més recent com a principal, i l'altra es conserva com a còpia de conflicte.
      const guanyaCarpeta =
        carpeta.updatedAt > app.updatedAt ||
        (carpeta.updatedAt === app.updatedAt && carpeta.sha256Cos > app.sha256Cos);
      const principal = guanyaCarpeta ? carpeta : app;
      const divergent = guanyaCarpeta ? app : carpeta;
      const sufixHash = divergent.sha256Cos.slice(0, 8);
      const idConflicte = `${id}-conflicte-${sufixHash}`;
      const notaConflicte = normalitzaNotaVault({
        ...divergent,
        id: idConflicte,
        slug: `${divergent.slug}-conflicte-${sufixHash}`,
        title: `${divergent.title} (Còpia de conflicte local)`,
      });

      accions.push({
        id,
        tipus: 'conflicte_conservat',
        motiu: 'edicio_simultania',
        idConflicte: notaConflicte.id,
      });

      notesResultants.push(principal, notaConflicte);
      nouIndexHashes[id] = principal.sha256Cos;
      nouIndexHashes[notaConflicte.id] = notaConflicte.sha256Cos;

      if (!guanyaCarpeta) {
        fitxersPerEscriure.push({
          nomFitxer: principal.nomFitxer,
          contingut: serialitzaNotaAMarkdownVault(principal),
          nota: principal,
        });
      }
      fitxersPerEscriure.push({
        nomFitxer: notaConflicte.nomFitxer,
        contingut: serialitzaNotaAMarkdownVault(notaConflicte),
        nota: notaConflicte,
      });
    }
  }

  return congelaProfund({
    accions,
    notesResultants,
    fitxersPerEscriure,
    nouIndexHashes,
    sha256Vault: sha256Hex(canonitzaJsonJcs(nouIndexHashes)),
  });
}

/**
 * Executa la sincronització bidireccional sobre un `FileSystemDirectoryHandle`
 * (File System Access API o adaptador compatible en memòria).
 */
export async function sincronitzaAmbDirectoryHandle(
  dirHandle,
  { notesApp = [], ultimIndexHashes = null, signal, isScopeActive = () => true } = {},
) {
  const vigent = () => {
    if (signal?.aborted || isScopeActive() !== true) throw Object.assign(new Error('La sincronització de carpeta s’ha cancel·lat.'), { name: 'AbortError' });
  };
  vigent();
  if (!dirHandle || typeof dirHandle.entries !== 'function' || typeof dirHandle.getFileHandle !== 'function') {
    throw new TypeError('[sincronitzadorCarpetaLocal] `dirHandle` ha d’implementar FileSystemDirectoryHandle.');
  }

  const notesCarpeta = [];
  let indexLlegit = ultimIndexHashes;
  let totalBytes = 0;
  let totalFitxers = 0;
  async function lligFitxer(handle) {
    vigent();
    totalFitxers += 1;
    if (totalFitxers > 1000) throw new Error('La carpeta supera els 1.000 fitxers de notes.');
    const file = await handle.getFile();
    vigent();
    if (file.size > 4 * 1024 * 1024 - totalBytes) throw new Error('La carpeta supera els 4 MB.');
    const text = await file.text();
    vigent();
    totalBytes += new TextEncoder().encode(text).length;
    if (totalBytes > 4 * 1024 * 1024) throw new Error('La carpeta supera els 4 MB.');
    return text;
  }

  for await (const [nom, handle] of dirHandle.entries()) {
    vigent();
    if (!handle || handle.kind !== 'file') continue;
    if (nom === NOM_FITXER_INDEX_VAULT && indexLlegit === null) {
      const text = await lligFitxer(handle);
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed.indexHashes === 'object') {
          indexLlegit = parsed.indexHashes;
        }
      } catch {
        indexLlegit = {};
      }
    } else if (nom.endsWith('.md') && !nom.startsWith('.')) {
      const text = await lligFitxer(handle);
      notesCarpeta.push(parsejaMarkdownVaultANota(text, { nomFitxer: nom }));
    }
  }

  const pla = calculaPlaSincronitzacioVault({
    notesApp,
    notesCarpeta,
    ultimIndexHashes: indexLlegit ?? {},
  });

  async function escriu(nom, contingut) {
    vigent();
    const fileHandle = await dirHandle.getFileHandle(nom, { create: true });
    vigent();
    const writable = await fileHandle.createWritable();
    try {
      vigent();
      await writable.write(contingut);
      vigent();
      await writable.close();
      vigent();
    } catch (error) {
      try { await writable.abort?.(); } catch { /* Conserva l’error original de cancel·lació o escriptura. */ }
      throw error;
    }
  }
  for (const fitxer of pla.fitxersPerEscriure) await escriu(fitxer.nomFitxer, fitxer.contingut);
  await escriu(NOM_FITXER_INDEX_VAULT,
    JSON.stringify(
      {
        schema: ESQUEMA_VAULT_FALLBACK,
        sha256Vault: pla.sha256Vault,
        indexHashes: pla.nouIndexHashes,
      },
      null,
      2,
    ),
  );

  return pla;
}

/**
 * Fallback universal per a navegadors sense `showDirectoryPicker`: exporta
 * totes les notes com a paquet JSON-LD + fitxers Markdown amb empremtes SHA-256.
 */
export function exportaPaquetVaultFallback({
  notesApp = [],
  exportatEl = '2026-11-03T00:00:00Z',
} = {}) {
  const fitxers = {};
  const indexHashes = {};
  for (const n of notesApp) {
    const norm = normalitzaNotaVault(n);
    fitxers[norm.nomFitxer] = serialitzaNotaAMarkdownVault(norm);
    indexHashes[norm.id] = norm.sha256Cos;
  }
  const sha256Vault = sha256Hex(canonitzaJsonJcs(indexHashes));
  return congelaProfund({
    schema: ESQUEMA_VAULT_FALLBACK,
    exportatEl: String(exportatEl),
    sha256Vault,
    indexHashes,
    fitxers,
  });
}

/**
 * Importa i reconcilia un paquet Vault exportat amb el fallback universal.
 */
export function importaPaquetVaultFallback(
  paquet,
  { notesApp = [], ultimIndexHashes = {} } = {},
) {
  if (!paquet || typeof paquet !== 'object' || paquet.schema !== ESQUEMA_VAULT_FALLBACK) {
    throw new TypeError('[sincronitzadorCarpetaLocal] Paquet de Vault fallback invàlid.');
  }
  const notesCarpeta = [];
  for (const [nomFitxer, contingutMd] of Object.entries(paquet.fitxers ?? {})) {
    notesCarpeta.push(parsejaMarkdownVaultANota(contingutMd, { nomFitxer }));
  }
  return calculaPlaSincronitzacioVault({
    notesApp,
    notesCarpeta,
    ultimIndexHashes,
  });
}


/* Perfil CRDT de carpeta: batches d'operacions i projeccions Markdown
 * immutables. No s'esborra història ni se sobreescriu un text que un altre
 * dispositiu/editor podria haver canviat. El Markdown porta la frontiera
 * original per a convertir edicions manuals en operacions causals.
 * Les projeccions antigues sense canvis no ressusciten notes eliminades. */
export const ESQUEMA_BATCH_CRDT_VAULT = 'sdp.vault.crdt-batch.v1';
const PREFIX_BATCH_CRDT = '.sdp-crdt-';
const MAX_BYTES_CRDT_VAULT = 4 * 1024 * 1024;
const errorCrdtVault = (code, message) => Object.assign(new Error(message), { code });
const dotCrdt = op => `${op.replica}:${op.comptador}`;
function markdownCrdt(nota, crdt) {
  const heads = frontieraNotaCrdtRural(crdt, nota.id);
  const camps = { id: nota.id, title: nota.title, slug: nota.slug, folderId: nota.folderId, tags: nota.tags,
    prioritat: nota.prioritat, updatedAt: nota.updatedAt, crdtPerfil: ESQUEMA_CRDT_RURAL, crdtParents: heads, crdtVariants: nota.variants };
  return ['---', ...Object.entries(camps).map(([k, v]) => `${k}: ${JSON.stringify(v)}`), '---', '', nota.content, ''].join('\n');
}
function parsejaMarkdownCrdt(text, nom) {
  let offset = 0, body = text;
  const camps = new Map();
  const linia = () => {
    const fi = text.indexOf('\n', offset), end = fi < 0 ? text.length : fi;
    const value = text.slice(offset, end).replace(/\r$/, ''); offset = fi < 0 ? text.length : fi + 1;
    return value;
  };
  if (text.startsWith('---\n') || text.startsWith('---\r\n')) {
    linia(); let tancat = false;
    while (offset < text.length) {
      const l = linia();
      if (l === '---') { tancat = true; break; }
      const i = l.indexOf(':');
      if (i > 0) {
        const k = l.slice(0, i).trim();
        if (['id', 'title', 'slug', 'folderId', 'tags', 'prioritat', 'updatedAt', 'crdtPerfil', 'crdtParents'].includes(k)) camps.set(k, lligValorYamlSimple(l.slice(i + 1)));
      }
    }
    if (!tancat) throw errorCrdtVault('RURAL_CRDT_VAULT_FORMAT', 'El frontmatter Markdown no està tancat.');
    body = text.slice(offset);
    if (body.startsWith('\r\n')) body = body.slice(2); else if (body.startsWith('\n')) body = body.slice(1);
  }
  // La projecció afegix sempre UN terminador; els anteriors són contingut.
  if (body.endsWith('\r\n')) body = body.slice(0, -2); else if (body.endsWith('\n')) body = body.slice(0, -1);
  const slug = nomFitxerSegurVault(nom).slice(0, -3);
  const nota = { id: camps.get('id') ?? slug, title: camps.get('title') ?? slug, slug: camps.get('slug') ?? slug,
    folderId: camps.get('folderId') ?? 'camp', tags: camps.get('tags') ?? [], prioritat: camps.get('prioritat') ?? 'normal', updatedAt: camps.get('updatedAt') ?? '', content: body };
  for (const k of ['id', 'title', 'slug', 'folderId', 'prioritat', 'updatedAt', 'content']) if (typeof nota[k] !== 'string') throw errorCrdtVault('RURAL_CRDT_VAULT_FORMAT', 'El Markdown necessita camps textuals.');
  if (!Array.isArray(nota.tags) || nota.tags.some(t => typeof t !== 'string')) throw errorCrdtVault('RURAL_CRDT_VAULT_FORMAT', 'Les etiquetes Markdown han de ser textos.');
  const perfil = camps.get('crdtPerfil'), heads = camps.get('crdtParents');
  if ((perfil !== undefined || heads !== undefined) && (perfil !== ESQUEMA_CRDT_RURAL || !Array.isArray(heads))) throw errorCrdtVault('RURAL_CRDT_VAULT_FORMAT', 'La base causal Markdown no és vàlida.');
  return { nota, heads: heads ?? null };
}
const contingutNotaCrdt = nota => ({ title: nota.title, content: nota.content, slug: nota.slug, folderId: nota.folderId,
  tags: nota.tags, prioritat: nota.prioritat, updatedAt: nota.updatedAt });

export async function sincronitzaCrdtAmbDirectoryHandle(dirHandle, { crdt, signal, isScopeActive = () => true } = {}) {
  const vigent = () => { if (signal?.aborted || isScopeActive() !== true) throw Object.assign(errorCrdtVault('RURAL_CRDT_CANCEL', 'Sincronització CRDT cancel·lada.'), { name: 'AbortError' }); };
  const local = normalitzaCrdtRural(crdt); vigent();
  if (!dirHandle || typeof dirHandle.entries !== 'function' || typeof dirHandle.getFileHandle !== 'function') throw new TypeError('Cal una carpeta de fitxers per a sincronitzar CRDT.');
  let folder = estatCrdtRuralBuit(), bytesLlegits = 0, lectures = 0, incorporacionsSenseBase = 0, batchesCreats = 0;
  const markdowns = [];
  async function llig(handle) {
    vigent(); if (++lectures > 4000) throw errorCrdtVault('RURAL_CRDT_VAULT_QUOTA', 'Massa lectures en una sincronització CRDT.');
    const file = await handle.getFile(); vigent();
    if (file.size > MAX_BYTES_CRDT_VAULT - bytesLlegits) throw errorCrdtVault('RURAL_CRDT_VAULT_QUOTA', 'La carpeta CRDT supera els 4 MB de lectura.');
    const text = await file.text(); vigent(); bytesLlegits += new TextEncoder().encode(text).length;
    if (bytesLlegits > MAX_BYTES_CRDT_VAULT) throw errorCrdtVault('RURAL_CRDT_VAULT_QUOTA', 'La carpeta CRDT supera els 4 MB de lectura.');
    return text;
  }
  let fitxers = 0;
  for await (const [nom, handle] of dirHandle.entries()) {
    vigent(); if (handle?.kind !== 'file') continue;
    if (typeof nom !== 'string') throw errorCrdtVault('RURAL_CRDT_VAULT_FORMAT', 'Nom de fitxer no textual.');
    if (nom.startsWith(PREFIX_BATCH_CRDT)) {
      if (++fitxers > 1000 || !/^\.sdp-crdt-[a-f0-9]{64}\.json$/.test(nom)) throw errorCrdtVault('RURAL_CRDT_VAULT_FORMAT', 'Nom de batch CRDT invàlid.');
      const text = await llig(handle); let batch;
      try { batch = copiaJsonRural(JSON.parse(text), MAX_BYTES_CRDT_VAULT); } catch { throw errorCrdtVault('RURAL_CRDT_VAULT_FORMAT', 'Batch CRDT invàlid.'); }
      if (Object.keys(batch).sort().join('|') !== ['crdt', 'schema', 'sha256'].join('|') || batch.schema !== ESQUEMA_BATCH_CRDT_VAULT
        || batch.sha256 !== nom.slice(PREFIX_BATCH_CRDT.length, -5) || batch.sha256 !== sha256Hex(canonitzaJsonJcs(batch.crdt))) throw errorCrdtVault('RURAL_CRDT_VAULT_HASH', 'La integritat del batch CRDT no coincidix.');
      folder = fusionaCrdtRural(folder, batch.crdt);
    } else if (nom.endsWith('.md') && !nom.startsWith('.')) {
      if (++fitxers > 1000) throw errorCrdtVault('RURAL_CRDT_VAULT_QUOTA', 'La carpeta supera els 1.000 fitxers de notes i batches.');
      markdowns.push({ nom, text: await llig(handle) });
    }
  }
  let merged = fusionaCrdtRural(local, folder);
  for (const { nom, text } of markdowns) {
    const parsed = parsejaMarkdownCrdt(text, nom), id = parsed.nota.id;
    const base = parsed.heads === null ? estatCrdtRuralBuit() : baseCausalNotaCrdtRural(merged, id, parsed.heads);
    const prevista = projectaCrdtRural(base).notes.find(n => n.id === id);
    const actual = projectaCrdtRural(merged).notes.find(n => n.id === id);
    if ((prevista && canonitzaJsonJcs(contingutNotaCrdt(prevista)) === canonitzaJsonJcs(contingutNotaCrdt(parsed.nota)))
      || (parsed.heads === null && actual && canonitzaJsonJcs(contingutNotaCrdt(actual)) === canonitzaJsonJcs(contingutNotaCrdt(parsed.nota)))) continue;
    const replica = `vault_${sha256Hex(canonitzaJsonJcs(parsed)).slice(0, 40)}`;
    const delta = canviaCrdtRural(base, { id, replica, comptador: 1, nota: parsed.nota });
    merged = fusionaCrdtRural(merged, delta);
    if (parsed.heads === null) incorporacionsSenseBase++;
  }
  async function escriuImmut(nom, text, esBatch) {
    vigent(); let handle, writable;
    try {
      try { handle = await dirHandle.getFileHandle(nom, { create: false }); }
      catch (e) { if (e?.name !== 'NotFoundError') throw e; }
      vigent();
      if (handle) {
        const existing = await llig(handle);
        if (esBatch && existing !== text) throw errorCrdtVault('RURAL_CRDT_VAULT_HASH', 'Un batch immutable ja existent té altres bytes.');
        // Un Markdown existent pot haver sigut editat fora; mai el trepitgem.
        return false;
      }
      handle = await dirHandle.getFileHandle(nom, { create: true }); vigent();
      writable = await handle.createWritable({ keepExistingData: false }); vigent();
      await writable.write(text); vigent(); await writable.close(); vigent();
      const verify = await llig(handle);
      if (verify !== text) throw errorCrdtVault('RURAL_CRDT_VAULT_WRITE_VERIFY', 'La còpia escrita a la carpeta no coincidix.');
      return true;
    } catch (e) {
      try { await writable?.abort(); } catch { /* stream ja acabat */ }
      // El path compartit pot haver sigut confirmat per un altre writer.
      // Només avortem el nostre stream; no hi ha propietat exclusiva per
      // llevar el fitxer. Un artefacte incomplet es detectarà en rellegir-lo.
      throw e;
    }
  }
  const existents = new Set(folder.ops.map(dotCrdt));
  const delta = normalitzaCrdtRural({ schema: ESQUEMA_CRDT_RURAL, ops: merged.ops.filter(op => !existents.has(dotCrdt(op))) });
  if (delta.ops.length) {
    const sha256 = sha256Hex(canonitzaJsonJcs(delta));
    const text = JSON.stringify({ schema: ESQUEMA_BATCH_CRDT_VAULT, crdt: delta, sha256 }, null, 2);
    if (await escriuImmut(`${PREFIX_BATCH_CRDT}${sha256}.json`, text, true)) batchesCreats++;
  }
  const projeccions = [];
  for (const nota of projectaCrdtRural(merged).notes) {
    const heads = frontieraNotaCrdtRural(merged, nota.id), hash = sha256Hex(canonitzaJsonJcs({ id: nota.id, heads }));
    const nom = `nota-${hash}.md`; await escriuImmut(nom, markdownCrdt(nota, merged), false); projeccions.push(nom);
  }
  vigent(); return { crdt: merged, batchesCreats, projeccions, incorporacionsSenseBase };
}
