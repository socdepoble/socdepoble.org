/**
 * sincronitzadorCarpetaLocal.js — Sincronitzador Bidireccional de Carpeta Local
 * estil Obsidian (Vault Markdown + JSON-LD) per a Sóc de Poble (Onada 8 i 9).
 *
 * Permet que qualsevol veí, cooperativa o ajuntament munte una carpeta del seu
 * ordinador com a Vault propi de notes i pàgines de la Wiki de Poble amb la
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
 * immutables. No s'esborra cap operació (tampoc un tombstone) ni se
 * sobreescriu un text que un altre dispositiu/editor podria haver canviat.
 * El Markdown porta la frontiera original per a convertir edicions manuals
 * en operacions causals. Les projeccions antigues sense canvis no
 * ressusciten notes eliminades.
 * Onada R30 · PF-03 · Compactació (decisió de la IAIA MarIA, pla R30 §4):
 * vegeu `compacta` dins de sincronitzaCrdtAmbDirectoryHandle. */
export const ESQUEMA_BATCH_CRDT_VAULT = 'sdp.vault.crdt-batch.v1';
const PREFIX_BATCH_CRDT = '.sdp-crdt-';
const MAX_BYTES_CRDT_VAULT = 4 * 1024 * 1024;
const errorCrdtVault = (code, message) => Object.assign(new Error(message), { code });
const dotCrdt = op => `${op.replica}:${op.comptador}`;
/* Onada R30 · PF-03 · Una entrada de la carpeta (batch o projecció Markdown) només es
   compacta amb ACK confirmat i una antiguitat de MÉS de 90 dies des d'eixe ACK. */
export const DIES_COMPACTACIO_CRDT_VAULT = 90;
const MS_COMPACTACIO_CRDT_VAULT = DIES_COMPACTACIO_CRDT_VAULT * 24 * 60 * 60 * 1000;
/* Onada R30 · PF-03 · Fites de la compactació. Tot passa dins del pany OPFS, que té termini (10 s per
   defecte, persistenciaLocalRural.js): la compactació no comença si la passada ja ha gastat el seu
   pressupost de temps i, si l'esgota, para entre dos passos segurs. De les 256 retirades per passada,
   128 són per a projeccions i 128 per a lots. */
const MAX_RETIRADES_CRDT_VAULT = 256;
const MAX_LOTS_RETIRATS_CRDT_VAULT = 128;
/* El mateix límit de fitxers que aplica la llista: una instantània no pot fer passar la carpeta del fitxer 1.000. */
const MAX_FITXERS_CRDT_VAULT = 1000;
export const PRESSUPOST_COMPACTACIO_CRDT_VAULT_MS = 4000;
/* Cap ACK d'este sincronitzador és anterior a 2026: una marca així ve d'un rellotge mal posat. */
const EPOCA_ACK_CRDT_VAULT = Date.UTC(2026, 0, 1);
const NOM_BATCH_CRDT = /^\.sdp-crdt-[a-f0-9]{64}\.json$/;
const NOM_PROJECCIO_CRDT = /^nota-[a-f0-9]{64}\.md$/;
const MARCA_ACK_CRDT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
/** Noms que pot tindre una entrada amb ACK: només els fitxers que escriu este sincronitzador. */
export const esEntradaAckCrdtVault = nom => typeof nom === 'string' && (NOM_BATCH_CRDT.test(nom) || NOM_PROJECCIO_CRDT.test(nom));
/** Marca d'ACK: instant ISO canònic (toISOString), sense ambigüitat de zona. */
export const esMarcaAckCrdtVault = marca => typeof marca === 'string' && MARCA_ACK_CRDT.test(marca)
  && Number.isFinite(Date.parse(marca)) && new Date(Date.parse(marca)).toISOString() === marca;
/** ACK utilitzable: ben format, no anterior a l'època del sincronitzador i no posterior a `araMs`. */
export const esAckPlausibleCrdtVault = (marca, araMs) => esMarcaAckCrdtVault(marca)
  && Date.parse(marca) >= EPOCA_ACK_CRDT_VAULT && Date.parse(marca) <= araMs;
const rellotgeMonotonic = () => globalThis.performance?.now?.() ?? Date.now();
const bytesText = text => new TextEncoder().encode(text).length;
const nomProjeccioCrdt = (id, heads) => `nota-${sha256Hex(canonitzaJsonJcs({ id, heads }))}.md`;
function verificaBatchCrdt(text, nom) {
  let batch;
  try { batch = copiaJsonRural(JSON.parse(text), MAX_BYTES_CRDT_VAULT); } catch { throw errorCrdtVault('RURAL_CRDT_VAULT_FORMAT', 'Batch CRDT invàlid.'); }
  if (Object.keys(batch).sort().join('|') !== ['crdt', 'schema', 'sha256'].join('|') || batch.schema !== ESQUEMA_BATCH_CRDT_VAULT
    || batch.sha256 !== nom.slice(PREFIX_BATCH_CRDT.length, -5) || batch.sha256 !== sha256Hex(canonitzaJsonJcs(batch.crdt))) throw errorCrdtVault('RURAL_CRDT_VAULT_HASH', 'La integritat del batch CRDT no coincidix.');
  return normalitzaCrdtRural(batch.crdt);
}
/* Onada R32 · PF-03 · D-R30-1 · Un lot de carpeta no acredita cap ACK remot (FEDI-02) ni cap retirada. Un
   certificat de retirada només el fa el mateix dispositiu (compactaCrdtRural amb el seu ACK remot de més de
   90 dies). Un certificat escrit per un altre a la carpeta no es pot verificar: aplicar-lo purgaria en silenci
   el payload d'una nota, fins i tot d'una viva (correcció de l'àrbitre R32). Per això, de cada lot només se'n
   lligen les operacions. El lot que porta metadades de sincronització es marca perquè la compactació no el
   retire mai: no esborrem el que no podem verificar. */
function lligLotCarpeta(text, nom) {
  const crdt = verificaBatchCrdt(text, nom);
  return { crdt: { schema: crdt.schema, ops: crdt.ops }, ambMetadades: crdt.sincronitzacio !== undefined };
}
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

/* Onada R30 · PF-03 · Compactació segura de la carpeta CRDT.
 * ACK d'una entrada = el sincronitzador l'ha llegida o escrita i verificada en
 * esta carpeta i les seues operacions han quedat confirmades al magatzem durable
 * del dispositiu (sessioRural.js l'anota DESPRÉS del commit local, amb la seua
 * hora). És un ACK LOCAL: no és cap ACK de xarxa ni s'etiqueta com a remot
 * (FEDI-02, D-R30-1); l'únic ACK remot és el del transport explícit de
 * sessioRural.sincronitzaRemot (crdtRural.js), sense cap endpoint públic encara.
 * Invariants: (1) sense ACK no es compacta; (2) amb ACK de 90 dies o menys
 * tampoc; (3) cap operació ni tombstone s'esborra: els batches madurs s'unixen
 * en una instantània (un batch més, amb la unió exacta de les seues operacions)
 * i una projecció Markdown només es retira si està superada, sense editar i es
 * pot refer byte a byte des dels batches; (4) idempotent; (5) primer s'escriu i
 * es verifica la instantània i només després es retiren els lots que substituïx;
 * (6) determinista: ordre de noms, JSON canònic i cap dependència de l'ordre de
 * la carpeta; (7) capacitat: una instantània només s'escriu si la passada
 * següent pot llegir la carpeta encara que un tall impedisca retirar cap lot,
 * i amb almenys la meitat del marge d'abans per als canvis nous;
 * (8) una projecció superada només ix quan l'edició o l'eliminació que l'ha
 * superada també té un ACK de més de 90 dies (no compta el primer ACK de la
 * projecció). Sense `acks` no es compacta res (camí anterior intacte).
 * (9) Onada R32 · certificats causals (kit Codex R30.2, D-R30-1, correcció de
 * l'àrbitre): el certificat de retirada és del dispositiu que l'ha fet amb el
 * seu ACK remot i no viatja mai per la carpeta. Per la carpeta hi viatja la
 * supressió, com una operació ordinària. Un lot aliè amb metadades no s'aplica
 * i no ix mai. Cap lot amb payload que el dispositiu ja ha retirat entra en una
 * instantània, tampoc en la mateixa passada en què la retirada arriba a la
 * carpeta: retirar payload és exclusiu de compactaCrdtRural amb ACK remot.
 * (10) Un Markdown d'una nota retirada no torna mai a les operacions ni a la
 * quota. Es conserva intacte a la carpeta i es declara a `reconciliacionsCarpeta`. */
export async function sincronitzaCrdtAmbDirectoryHandle(dirHandle, { crdt, signal, isScopeActive = () => true, acks = null, ara = Date.now,
  cronometre = rellotgeMonotonic, pressupostMs = PRESSUPOST_COMPACTACIO_CRDT_VAULT_MS } = {}) {
  const vigent = () => { if (signal?.aborted || isScopeActive() !== true) throw Object.assign(errorCrdtVault('RURAL_CRDT_CANCEL', 'Sincronització CRDT cancel·lada.'), { name: 'AbortError' }); };
  const local = normalitzaCrdtRural(crdt); vigent();
  if (!dirHandle || typeof dirHandle.entries !== 'function' || typeof dirHandle.getFileHandle !== 'function') throw new TypeError('Cal una carpeta de fitxers per a sincronitzar CRDT.');
  if (acks !== null && (typeof acks !== 'object' || Array.isArray(acks) || typeof ara !== 'function' || typeof cronometre !== 'function' || !(pressupostMs >= 0))) {
    throw new TypeError('Els ACK de carpeta han de ser un objecte, i el rellotge, el cronòmetre i el pressupost, vàlids.');
  }
  // El pressupost de temps de la compactació es compta des de l'inici de la passada.
  const inici = acks === null ? 0 : Number(cronometre());
  // (1) i (2): ACK propi de l'entrada, plausible i estrictament anterior a ara − 90 dies.
  const araMs = acks === null ? NaN : Number(ara()), llindar = araMs - MS_COMPACTACIO_CRDT_VAULT;
  const madura = nom => Number.isFinite(llindar) && Object.hasOwn(acks, nom) && esAckPlausibleCrdtVault(acks[nom], araMs) && Date.parse(acks[nom]) < llindar;
  let folder = estatCrdtRuralBuit(), lectures = 0, incorporacionsSenseBase = 0, batchesCreats = 0;
  const markdowns = [], batchesLlegits = new Map(), lotsAmbMetadades = new Set(), reconciliacionsCarpeta = [];
  /* La compactació té un pressupost de lectura propi: no pot fer fallar la sincronització. `mides`
     guarda els bytes de cada lot i Markdown present (llegit o escrit en esta passada), per a (7). */
  const lecturaSync = { bytes: 0 }, lecturaCompactacio = { bytes: 0 }, mides = new Map();
  async function llig(handle, pressupost = lecturaSync, nom = null) {
    vigent(); if (++lectures > 4000) throw errorCrdtVault('RURAL_CRDT_VAULT_QUOTA', 'Massa lectures en una sincronització CRDT.');
    const file = await handle.getFile(); vigent();
    if (file.size > MAX_BYTES_CRDT_VAULT - pressupost.bytes) throw errorCrdtVault('RURAL_CRDT_VAULT_QUOTA', 'La carpeta CRDT supera els 4 MB de lectura.');
    const text = await file.text(); vigent(); const mida = bytesText(text); pressupost.bytes += mida;
    if (pressupost.bytes > MAX_BYTES_CRDT_VAULT) throw errorCrdtVault('RURAL_CRDT_VAULT_QUOTA', 'La carpeta CRDT supera els 4 MB de lectura.');
    if (nom !== null) mides.set(nom, mida);
    return text;
  }
  let fitxers = 0;
  for await (const [nom, handle] of dirHandle.entries()) {
    vigent(); if (handle?.kind !== 'file') continue;
    if (typeof nom !== 'string') throw errorCrdtVault('RURAL_CRDT_VAULT_FORMAT', 'Nom de fitxer no textual.');
    if (nom.startsWith(PREFIX_BATCH_CRDT)) {
      /* Onada R29 · PF-03: el fitxer 1.001 és quota, no corrupció; abans, si era un batch, eixia «Nom de batch CRDT invàlid.». */
      if (++fitxers > 1000) throw errorCrdtVault('RURAL_CRDT_VAULT_QUOTA', 'La carpeta supera els 1.000 fitxers de notes i batches.');
      if (!NOM_BATCH_CRDT.test(nom)) throw errorCrdtVault('RURAL_CRDT_VAULT_FORMAT', 'Nom de batch CRDT invàlid.');
      const { crdt: crdtBatch, ambMetadades } = lligLotCarpeta(await llig(handle, lecturaSync, nom), nom);
      batchesLlegits.set(nom, crdtBatch);
      if (ambMetadades) lotsAmbMetadades.add(nom);
      folder = fusionaCrdtRural(folder, crdtBatch);
    } else if (nom.endsWith('.md') && !nom.startsWith('.')) {
      if (++fitxers > 1000) throw errorCrdtVault('RURAL_CRDT_VAULT_QUOTA', 'La carpeta supera els 1.000 fitxers de notes i batches.');
      markdowns.push({ nom, text: await llig(handle, lecturaSync, nom) });
    }
  }
  let merged = fusionaCrdtRural(local, folder);
  /* Onada R30 · PF-03 · Per a cada projecció madura, la compactació necessita saber si es pot refer byte a
     byte des dels batches. Es calcula ací, amb la mateixa base causal (les operacions posteriors en són
     descendents, no ancestres, i no la canvien), i només se'n guarda el resultat. */
  const analisiMd = new Map();
  for (const { nom, text } of markdowns) {
    const parsed = parsejaMarkdownCrdt(text, nom), id = parsed.nota.id;
    if (merged.sincronitzacio?.retirades.some(r => r.id === id)) {
      /* Onada R32 · (10) Correcció de l'àrbitre. La nota l'ha retirada este dispositiu (només hi ha els seus
         certificats). Sense el payload no es pot saber si el Markdown és una projecció antiga sense editar o
         porta una edició externa. El fitxer es conserva intacte (la compactació no el retira mai) i es declara
         pendent. No es rematerialitza com a operació: tornaria el payload retirat a la quota i, amb més de
         20.000 caràcters, bloquejaria la carpeta per sempre (RURAL_CRDT_INVALID o RURAL_CRDT_QUOTA). A més, en
         un altre dispositiu sense el certificat seria una arrel viva nova, i la nota ressuscitaria. */
      reconciliacionsCarpeta.push(nom); continue;
    }
    const base = parsed.heads === null ? estatCrdtRuralBuit() : baseCausalNotaCrdtRural(merged, id, parsed.heads);
    const prevista = projectaCrdtRural(base).notes.find(n => n.id === id);
    if (acks !== null && parsed.heads !== null && NOM_PROJECCIO_CRDT.test(nom) && madura(nom)) {
      analisiMd.set(nom, { id, heads: parsed.heads, exacta: Boolean(prevista) && markdownCrdt(prevista, base) === text });
    }
    const actual = projectaCrdtRural(merged).notes.find(n => n.id === id);
    if ((prevista && canonitzaJsonJcs(contingutNotaCrdt(prevista)) === canonitzaJsonJcs(contingutNotaCrdt(parsed.nota)))
      || (parsed.heads === null && actual && canonitzaJsonJcs(contingutNotaCrdt(actual)) === canonitzaJsonJcs(contingutNotaCrdt(parsed.nota)))) continue;
    const replica = `vault_${sha256Hex(canonitzaJsonJcs(parsed)).slice(0, 40)}`;
    const delta = canviaCrdtRural(base, { id, replica, comptador: 1, nota: parsed.nota });
    merged = fusionaCrdtRural(merged, delta);
    if (parsed.heads === null) incorporacionsSenseBase++;
  }
  async function escriuImmut(nom, text, esBatch, pressupost = lecturaSync) {
    vigent(); let handle, writable;
    try {
      try { handle = await dirHandle.getFileHandle(nom, { create: false }); }
      catch (e) { if (e?.name !== 'NotFoundError') throw e; }
      vigent();
      if (handle) {
        const existing = await llig(handle, pressupost, nom);
        if (esBatch && existing !== text) throw errorCrdtVault('RURAL_CRDT_VAULT_HASH', 'Un batch immutable ja existent té altres bytes.');
        // Un Markdown existent pot haver sigut editat fora; mai el trepitgem.
        return false;
      }
      handle = await dirHandle.getFileHandle(nom, { create: true }); vigent();
      writable = await handle.createWritable({ keepExistingData: false }); vigent();
      await writable.write(text); vigent(); await writable.close(); vigent();
      const verify = await llig(handle, pressupost, nom);
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
  async function escriuLot(ops) {
    const lot = normalitzaCrdtRural({ schema: ESQUEMA_CRDT_RURAL, ops });
    const sha256 = sha256Hex(canonitzaJsonJcs(lot));
    const nom = `${PREFIX_BATCH_CRDT}${sha256}.json`;
    if (await escriuImmut(nom, JSON.stringify({ schema: ESQUEMA_BATCH_CRDT_VAULT, crdt: lot, sha256 }, null, 2), true)) batchesCreats++;
    return nom;
  }
  /* Onada R32 · PF-03 · D-R30-1 · La carpeta és un canal local: hi viatgen només operacions. No hi viatgen
     mai ACK, fronteres ni certificats de retirada. Així, els clients 1.2.3 o anteriors, que tenen un esquema
     estricte, continuen llegint la carpeta. */
  const delta = merged.ops.filter(op => !existents.has(dotCrdt(op)));
  const nomDelta = delta.length ? await escriuLot(delta) : null;
  /* La supressió d'una nota que este dispositiu ha retirat (sense payload, `insert.text` buit) sí que viatja,
     com una operació ordinària, quan tots els seus pares ja són a la carpeta. Així, cap altre dispositiu veu
     viva una nota que s'ha eliminat i retirat abans d'arribar a la carpeta. Va en un lot a part: el lot conté
     un DOT retirat i no es consolidarà mai (9). Si el poséssem amb el delta, les operacions vives noves
     quedarien atrapades amb ell. */
  const candidates = (merged.sincronitzacio?.retirades ?? []).flatMap(r => r.supressions), disponibles = new Set(existents), supressions = [];
  for (let canvi = true; canvi;) {
    canvi = false;
    for (const op of candidates) {
      if (disponibles.has(dotCrdt(op)) || !op.parents.every(p => disponibles.has(p))) continue;
      disponibles.add(dotCrdt(op)); supressions.push(op); canvi = true;
    }
  }
  const nomSupressions = supressions.length ? await escriuLot(supressions) : null;
  const projeccions = [], frontieres = new Map();
  for (const nota of projectaCrdtRural(merged).notes) {
    const heads = frontieraNotaCrdtRural(merged, nota.id), nom = nomProjeccioCrdt(nota.id, heads);
    frontieres.set(nota.id, heads);
    await escriuImmut(nom, markdownCrdt(nota, merged), false); projeccions.push(nom);
  }
  async function compacta() {
    const resultat = { instantania: null, contenidors: [], batchesRetirats: [], projeccionsRetirades: [], error: null };
    if (typeof dirHandle.removeEntry !== 'function') return { ...resultat, error: 'RURAL_CRDT_VAULT_SENSE_RETIRADA' };
    if (!Number.isFinite(llindar)) return { ...resultat, error: 'RURAL_CRDT_VAULT_RELLOTGE' };
    const aTemps = () => {
      if (!(Number(cronometre()) - inici < pressupostMs)) throw errorCrdtVault('RURAL_CRDT_VAULT_COMPACT_TEMPS', 'La compactació s’ajorna: la passada s’acosta al termini del pany.');
    };
    let retirades = 0, lotsRetirats = 0;
    const retira = async nom => { aTemps(); vigent(); await dirHandle.removeEntry(nom); vigent(); mides.delete(nom); retirades++; };
    try {
      aTemps();
      const lots = [...batchesLlegits.keys()].sort(), opsDe = nom => batchesLlegits.get(nom).ops;
      /* Onada R32 · (9) Un lot aliè amb metadades de sincronització és permanent: no es retira mai ni s'unix
         en cap instantània. Tampoc s'unix un lot amb un DOT que este dispositiu ja ha retirat. Retirar payload
         és decisió exclusiva de compactaCrdtRural amb ACK remot, mai d'esta compactació. Correcció de l'àrbitre:
         els DOT retirats es lligen de `merged`, és a dir, dels certificats propis, i no de la carpeta. Així el
         contracte també es complix en la passada en què la retirada arriba a la carpeta, i cap instantània nova
         no porta payload retirat. Un lot així pot fer de contenidor, perquè no ix mai. */
      const dotsRetirats = new Set((merged.sincronitzacio?.retirades ?? []).flatMap(r => r.dots.map(d => d.dot)));
      const ambCertificat = nom => lotsAmbMetadades.has(nom);
      const ambPayloadRetirat = nom => opsDe(nom).some(op => dotsRetirats.has(dotCrdt(op)));
      // Índex DOT → lots. La fusió de la llista ja ha rebutjat qualsevol DOT amb dos continguts
      // (RURAL_CRDT_DOT_EQUIVOCATION): ací, el mateix DOT és la mateixa operació.
      const lotsDe = new Map();
      for (const nom of lots) for (const op of opsDe(nom)) { const dot = dotCrdt(op), amb = lotsDe.get(dot); if (amb) amb.push(nom); else lotsDe.set(dot, [nom]); }
      // X cobrix L si conté totes les operacions de L i el precedeix: és més gran o, a igualtat, va abans per
      // nom. És un ordre estricte: dos lots amb les mateixes operacions (i JSON diferent) mai es retiren l'un per l'altre.
      const precedeix = (x, l) => x !== l && (opsDe(x).length > opsDe(l).length || (opsDe(x).length === opsDe(l).length && x < l));
      const cobridors = l => {
        const ops = opsDe(l);
        let cand = (ops.length ? lotsDe.get(dotCrdt(ops[0])) : lots).filter(x => precedeix(x, l));
        for (let i = 1; i < ops.length && cand.length; i++) { const amb = lotsDe.get(dotCrdt(ops[i])); cand = cand.filter(x => amb.includes(x)); }
        return cand;
      };
      const cobertsPer = new Map(lots.map(l => [l, cobridors(l)]));
      const maximals = new Set(lots.filter(l => !cobertsPer.get(l).length));
      // Pas 0 · (3) Projeccions: superades (no són la vigent de cap nota viva), exactes i sense editar. (8) La
      // frontera actual de la nota (l'edició o l'eliminació que les ha superades) ha d'estar en lots amb ACK
      // madur. Van abans dels lots: un tall a mitja retirada de lots no pot separar una projecció dels lots que
      // en proven la maduresa (una vegada retirats, el seu ACK ja no hi és).
      const vigents = new Set(projeccions);
      const superadaFa90Dies = id => {
        if (!frontieres.has(id)) {
          let heads = null;
          try { heads = frontieraNotaCrdtRural(merged, id); } catch { /* dependències pendents: no es pot datar */ }
          frontieres.set(id, heads);
        }
        const heads = frontieres.get(id);
        return Array.isArray(heads) && heads.length > 0 && heads.every(dot => (lotsDe.get(dot) ?? []).some(madura));
      };
      for (const { nom, text } of [...markdowns].sort((a, b) => (a.nom < b.nom ? -1 : a.nom > b.nom ? 1 : 0))) {
        if (retirades >= MAX_RETIRADES_CRDT_VAULT - MAX_LOTS_RETIRATS_CRDT_VAULT) break;
        const analisi = analisiMd.get(nom);
        if (!analisi?.exacta || vigents.has(nom) || nom !== nomProjeccioCrdt(analisi.id, analisi.heads) || !superadaFa90Dies(analisi.id)) continue;
        aTemps();
        // Relectura just abans de retirar-la: una edició feta durant la sincronització la conserva.
        if (await llig(await dirHandle.getFileHandle(nom, { create: false }), lecturaCompactacio, nom) !== text) continue;
        await retira(nom); resultat.projeccionsRetirades.push(nom);
      }
      // Pas 1 · Un lot madur que un altre ja cobrix (p. ex. la instantània d'una passada tallada) es retira
      // després de rellegir del disc el lot maximal que el conté; no s'escriu res nou.
      for (const lot of lots) {
        if (lotsRetirats >= MAX_LOTS_RETIRATS_CRDT_VAULT) break;
        if (maximals.has(lot) || !madura(lot) || ambCertificat(lot)) continue;
        const contenidor = cobertsPer.get(lot).filter(x => maximals.has(x))
          .reduce((millor, x) => (millor === null || precedeix(x, millor) ? x : millor), null);
        if (contenidor === null) continue;
        if (!resultat.contenidors.includes(contenidor)) {
          aTemps();
          const relleguda = lligLotCarpeta(await llig(await dirHandle.getFileHandle(contenidor, { create: false }), lecturaCompactacio, contenidor), contenidor).crdt;
          if (canonitzaJsonJcs(relleguda) !== canonitzaJsonJcs(batchesLlegits.get(contenidor))) throw errorCrdtVault('RURAL_CRDT_VAULT_COMPACT_VERIFY', 'El lot que en conté uns altres ha canviat a la carpeta.');
          resultat.contenidors.push(contenidor);
        }
        await retira(lot); lotsRetirats++; resultat.batchesRetirats.push(lot);
      }
      // Pas 2 · Els lots madurs que cap altre no cobrix s'unixen en una instantània nova: la unió es fa
      // d'un sol cop (filtrant `folder`, ja fusionat i validat), sense cap fusió per lot.
      const restants = lots.filter(l => maximals.has(l) && madura(l) && !ambCertificat(l) && !ambPayloadRetirat(l))
        .slice(0, MAX_LOTS_RETIRATS_CRDT_VAULT - lotsRetirats);
      if (restants.length >= 2) {
        // (7) Bytes que llegirà la passada següent sense cap canvi nou: cada lot i Markdown present, més la
        // segona lectura de cada projecció vigent (escriuImmut la rellig). La instantània hi ha de cabre sencera.
        let costSeguent = 0;
        for (const mida of mides.values()) costSeguent += mida;
        for (const nom of projeccions) costSeguent += mides.get(nom) ?? 0;
        /* Onada R30 · PF-03 · Segon àrbitre: la instantània tampoc pot gastar més de la meitat del marge que
           queda. Un tall entre l'escriptura i la primera retirada (removeEntry fallit, pressupost esgotat,
           cancel·lació) la deixa al costat dels lots, i la passada següent d'un dispositiu amb canvis nous
           escriu el seu delta ABANS de reprendre la compactació: amb tot el marge gastat, eixa passada ixia
           amb RURAL_CRDT_VAULT_QUOTA per sempre. Així, un tall conserva almenys la meitat del marge d'abans. */
        const meitatMarge = Math.floor((MAX_BYTES_CRDT_VAULT - costSeguent) / 2);
        const dotsDe = new Map(restants.map(l => [l, opsDe(l).map(dotCrdt)]));
        const totsDots = new Set(restants.flatMap(l => dotsDe.get(l)));
        // (6) JSON canònic: els mateixos lots donen els mateixos bytes i el mateix nom en qualsevol dispositiu.
        const canoniques = folder.ops.filter(op => totsDots.has(dotCrdt(op))).map(op => [dotCrdt(op), JSON.parse(canonitzaJsonJcs(op))]);
        const unioDe = k => { const dins = new Set(restants.slice(0, k).flatMap(l => dotsDe.get(l))); return { ops: canoniques.filter(([dot]) => dins.has(dot)).map(([, op]) => op), schema: ESQUEMA_CRDT_RURAL }; };
        const textDe = (unio, sha256) => JSON.stringify({ schema: ESQUEMA_BATCH_CRDT_VAULT, crdt: unio, sha256 }, null, 2);
        // La mida no depén del valor del hash (64 caràcters hexadecimals sempre).
        const cap = k => bytesText(textDe(unioDe(k), '0'.repeat(64))) <= meitatMarge;
        let k = 0;
        if (mides.size + 1 <= MAX_FITXERS_CRDT_VAULT) {
          // El prefix (per nom) més llarg que hi cap: la mida creix amb el prefix, la cerca és binària.
          if (cap(restants.length)) k = restants.length;
          else if (cap(2)) {
            let baix = 2, alt = restants.length - 1;
            while (baix < alt) { const mig = Math.ceil((baix + alt) / 2); if (cap(mig)) baix = mig; else alt = mig - 1; }
            k = baix;
          }
        }
        if (k < 2) resultat.error = 'RURAL_CRDT_VAULT_COMPACT_QUOTA';
        else {
          const consolidats = restants.slice(0, k), unio = unioDe(k), sha256 = sha256Hex(canonitzaJsonJcs(unio));
          const nom = `${PREFIX_BATCH_CRDT}${sha256}.json`, text = textDe(unio, sha256);
          // (5) Abans d'escriure, es valida en memòria (esquema, hash i unió exacta de cada lot) i, després,
          // escriuImmut rellig del disc: en tornar, la carpeta conté exactament estos bytes.
          const escrita = new Map(verificaBatchCrdt(text, nom).ops.map(op => [dotCrdt(op), canonitzaJsonJcs(op)]));
          if (!consolidats.every(l => opsDe(l).every(op => escrita.get(dotCrdt(op)) === canonitzaJsonJcs(op)))) {
            throw errorCrdtVault('RURAL_CRDT_VAULT_COMPACT_VERIFY', 'La instantània consolidada no conté tots els canvis dels lots.');
          }
          aTemps();
          await escriuImmut(nom, text, true, lecturaCompactacio);
          resultat.instantania = nom;
          for (const lot of consolidats) { await retira(lot); lotsRetirats++; resultat.batchesRetirats.push(lot); }
        }
      }
    } catch (e) {
      // Una cancel·lació o un canvi d'abast manen; qualsevol altra fallada deixa la carpeta
      // en un estat segur (instantània ⊇ lots) i es declara sense desfer la sincronització.
      vigent();
      resultat.error = typeof e?.code === 'string' ? e.code : typeof e?.name === 'string' ? e.name : 'RURAL_CRDT_VAULT_COMPACT';
    }
    return resultat;
  }
  const compactacio = acks === null ? null : await compacta();
  const retirats = new Set([...(compactacio?.batchesRetirats ?? []), ...(compactacio?.projeccionsRetirades ?? [])]);
  /* Entrades presents i verificades en esta passada: candidates a ACK quan el dispositiu confirme el commit local. */
  const confirmats = [...new Set([...batchesLlegits.keys(), ...(nomDelta ? [nomDelta] : []), ...(nomSupressions ? [nomSupressions] : []),
    ...(compactacio?.instantania ? [compactacio.instantania] : []),
    ...projeccions, ...markdowns.map(m => m.nom)])].filter(nom => esEntradaAckCrdtVault(nom) && !retirats.has(nom)).sort();
  vigent(); return { crdt: merged, batchesCreats, projeccions, incorporacionsSenseBase, reconciliacionsCarpeta: reconciliacionsCarpeta.sort(), confirmats, compactacio };
}
