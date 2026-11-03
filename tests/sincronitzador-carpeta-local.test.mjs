import assert from 'node:assert/strict';
import test from 'node:test';

import {
  NOM_FITXER_INDEX_VAULT,
  calculaPlaSincronitzacioVault,
  exportaPaquetVaultFallback,
  importaPaquetVaultFallback,
  nomFitxerSegurVault,
  normalitzaNotaVault,
  parsejaMarkdownVaultANota,
  serialitzaNotaAMarkdownVault,
  sincronitzaAmbDirectoryHandle,
  suportaFileSystemAccessApi,
} from '../src/data/local/sincronitzadorCarpetaLocal.js';

function creaDirectoryHandleEnMemoria(fitxersInicials = {}) {
  const magatzem = new Map(Object.entries(fitxersInicials));
  return {
    magatzem,
    async *entries() {
      for (const [nom, text] of magatzem.entries()) {
        yield [
          nom,
          {
            kind: 'file',
            name: nom,
            async getFile() {
              return {
                async text() {
                  return text;
                },
              };
            },
          },
        ];
      }
    },
    async getFileHandle(nom, { create = false } = {}) {
      if (!magatzem.has(nom) && !create) {
        throw new Error(`Fitxer no trobat: ${nom}`);
      }
      return {
        kind: 'file',
        name: nom,
        async createWritable() {
          let buffer = '';
          return {
            async write(chunk) {
              buffer += String(chunk);
            },
            async close() {
              magatzem.set(nom, buffer);
            },
          };
        },
      };
    },
  };
}

test('nomFitxerSegurVault normalitza slugs i bloqueja qualsevol intent de Path Traversal', () => {
  assert.equal(nomFitxerSegurVault('Calendari Agrícola 2026'), 'calendari-agr-cola-2026.md');
  assert.equal(nomFitxerSegurVault('nota-olivera.md'), 'nota-olivera.md');

  for (const malicios of ['../secret', 'carpeta/fitxer', 'carpeta\\fitxer', 'nul\0byte', '..']) {
    assert.throws(() => nomFitxerSegurVault(malicios));
  }
});

test('serialitzaNotaAMarkdownVault i parsejaMarkdownVaultANota conserven intactes les dades i el sha256Cos', () => {
  const original = normalitzaNotaVault({
    id: 'nota:olivera-2026',
    slug: 'olivera-2026',
    title: 'Poda i collita de l’olivera a la Muntanya d’Alacant',
    folderId: 'agricultura',
    updatedAt: '2026-11-03T06:00:00Z',
    tags: ['olivera', 'pedra-seca', 'memòria-oral'],
    content: '### Calendari d’hivern\n\nLa poda es fa després de les gelades de gener.',
  });

  const md = serialitzaNotaAMarkdownVault(original);
  assert.ok(md.startsWith('---\n'));
  assert.ok(md.includes('title: "Poda i collita de l’olivera a la Muntanya d’Alacant"'));

  const reconstruida = parsejaMarkdownVaultANota(md, { nomFitxer: 'olivera-2026.md' });
  assert.deepEqual(reconstruida, original);
});

test('calculaPlaSincronitzacioVault detecta novetats, edicions unidireccionals i conserva conflictes sense pèrdua', () => {
  const notaSenseCanvis = normalitzaNotaVault({
    id: 'nota-1',
    slug: 'nota-1',
    title: 'Nota estable',
    updatedAt: '2026-11-03T01:00:00Z',
    content: 'Contingut igual als dos llocs.',
  });

  const notaEditadaACarpetaVella = normalitzaNotaVault({
    id: 'nota-2',
    slug: 'nota-2',
    title: 'Recepta de pericana',
    updatedAt: '2026-11-03T02:00:00Z',
    content: 'Pebrera seca i bacallà.',
  });
  const notaEditadaACarpetaNova = normalitzaNotaVault({
    id: 'nota-2',
    slug: 'nota-2',
    title: 'Recepta de pericana',
    updatedAt: '2026-11-03T03:00:00Z',
    content: 'Pebrera seca, bacallà, all i oli d’oliva verge.',
  });

  const notaConflicteBase = normalitzaNotaVault({
    id: 'nota-3',
    slug: 'nota-3',
    title: 'Acta de regants',
    updatedAt: '2026-11-03T01:00:00Z',
    content: 'Torn inicial.',
  });
  const notaConflicteApp = normalitzaNotaVault({
    id: 'nota-3',
    slug: 'nota-3',
    title: 'Acta de regants',
    updatedAt: '2026-11-03T04:00:00Z',
    content: 'Torn editat des del mòbil sense cobertura.',
  });
  const notaConflicteCarpeta = normalitzaNotaVault({
    id: 'nota-3',
    slug: 'nota-3',
    title: 'Acta de regants',
    updatedAt: '2026-11-03T05:00:00Z',
    content: 'Torn editat des d’Obsidian a l’ordinador de la cooperativa.',
  });

  const pla = calculaPlaSincronitzacioVault({
    notesApp: [notaSenseCanvis, notaEditadaACarpetaVella, notaConflicteApp],
    notesCarpeta: [notaSenseCanvis, notaEditadaACarpetaNova, notaConflicteCarpeta],
    ultimIndexHashes: {
      'nota-1': notaSenseCanvis.sha256Cos,
      'nota-2': notaEditadaACarpetaVella.sha256Cos,
      'nota-3': notaConflicteBase.sha256Cos,
    },
  });

  const accio1 = pla.accions.find((a) => a.id === 'nota-1');
  const accio2 = pla.accions.find((a) => a.id === 'nota-2');
  const accio3 = pla.accions.find((a) => a.id === 'nota-3');

  assert.equal(accio1.tipus, 'sense_canvis');
  assert.equal(accio2.tipus, 'importar_de_carpeta');
  assert.equal(accio3.tipus, 'conflicte_conservat');
  assert.ok(accio3.idConflicte.startsWith('nota-3-conflicte-'));

  // Totes dues versions del conflicte sobreviuen a notesResultants:
  const principal3 = pla.notesResultants.find((n) => n.id === 'nota-3');
  const copia3 = pla.notesResultants.find((n) => n.id === accio3.idConflicte);
  assert.equal(principal3.content, 'Torn editat des d’Obsidian a l’ordinador de la cooperativa.');
  assert.equal(copia3.content, 'Torn editat des del mòbil sense cobertura.');
});

test('sincronitzaAmbDirectoryHandle i el fallback universal operen de punta a punta amb índex SHA-256', async () => {
  assert.equal(suportaFileSystemAccessApi({}), false);
  assert.equal(suportaFileSystemAccessApi({ showDirectoryPicker() {} }), true);

  const notaObsidianExterna = serialitzaNotaAMarkdownVault({
    id: 'nota-obsidian',
    slug: 'nota-obsidian',
    title: 'Creada a Obsidian',
    updatedAt: '2026-11-03T06:10:00Z',
    content: ' Nota escrita directament a la carpeta local.',
  });

  const dirHandle = creaDirectoryHandleEnMemoria({
    'nota-obsidian.md': notaObsidianExterna,
  });

  const notaApp = normalitzaNotaVault({
    id: 'nota-app',
    slug: 'nota-app',
    title: 'Creada a Sóc de Poble',
    updatedAt: '2026-11-03T06:20:00Z',
    content: 'Nota escrita dins de l’Editor Universal.',
  });

  const resultat = await sincronitzaAmbDirectoryHandle(dirHandle, {
    notesApp: [notaApp],
  });

  assert.equal(resultat.notesResultants.length, 2);
  assert.equal(dirHandle.magatzem.has('nota-app.md'), true);
  assert.equal(dirHandle.magatzem.has(NOM_FITXER_INDEX_VAULT), true);

  // Provem el fallback universal d'exportació i importació:
  const paquetFallback = exportaPaquetVaultFallback({
    notesApp: resultat.notesResultants,
  });
  const reimportat = importaPaquetVaultFallback(paquetFallback, {
    notesApp: [notaApp],
    ultimIndexHashes: { 'nota-app': notaApp.sha256Cos },
  });
  assert.equal(reimportat.notesResultants.length, 2);
});
