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

import { canonitzaJsonJcs, sha256Hex } from '../federacio/portabilitatFediversity.js';

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
  { notesApp = [], ultimIndexHashes = null } = {},
) {
  if (!dirHandle || typeof dirHandle.entries !== 'function' || typeof dirHandle.getFileHandle !== 'function') {
    throw new TypeError('[sincronitzadorCarpetaLocal] `dirHandle` ha d’implementar FileSystemDirectoryHandle.');
  }

  const notesCarpeta = [];
  let indexLlegit = ultimIndexHashes;

  for await (const [nom, handle] of dirHandle.entries()) {
    if (!handle || handle.kind !== 'file') continue;
    if (nom === NOM_FITXER_INDEX_VAULT && indexLlegit === null) {
      const file = await handle.getFile();
      const text = await file.text();
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed.indexHashes === 'object') {
          indexLlegit = parsed.indexHashes;
        }
      } catch {
        indexLlegit = {};
      }
    } else if (nom.endsWith('.md') && !nom.startsWith('.')) {
      const file = await handle.getFile();
      const text = await file.text();
      notesCarpeta.push(parsejaMarkdownVaultANota(text, { nomFitxer: nom }));
    }
  }

  const pla = calculaPlaSincronitzacioVault({
    notesApp,
    notesCarpeta,
    ultimIndexHashes: indexLlegit ?? {},
  });

  for (const fitxer of pla.fitxersPerEscriure) {
    const fileHandle = await dirHandle.getFileHandle(fitxer.nomFitxer, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(fitxer.contingut);
    await writable.close();
  }

  const indexHandle = await dirHandle.getFileHandle(NOM_FITXER_INDEX_VAULT, { create: true });
  const indexWritable = await indexHandle.createWritable();
  await indexWritable.write(
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
  await indexWritable.close();

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
