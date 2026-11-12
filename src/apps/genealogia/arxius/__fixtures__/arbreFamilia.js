/**
 * SUPORT DE PROVES del grup «arxius» (no l'importa cap fitxer de producció).
 * Un arbre inventat, sense cap nom ni poble real. Els noms de les persones
 * vives porten trossos rars i únics (TOKENS_VIUS) perquè una fuita es veja.
 *
 *   uid(6) Batiste (1880–1950)          G1
 *        │ progenitor
 *   uid(4) Vicent (~1908–1975) ═ uid(5) Teresa (1912?, difunta)   G2
 *        │ progenitor                 │ progenitor
 *   uid(2) Pepet (1950, viu per edat) ═ uid(3) Rosa (sense dades: viva)   G3
 *        │ progenitor                 │
 *   uid(1) Aurèlia (1980, viva)        G4  ← arrel (Sosa 1)
 *
 *   uid(7) Tomàs (1870, difunt) és padrí de Vicent; uid(8) Llum (viva) n'és testimoni.
 */
import { ANY, ARA, complet, persona, rel, uid } from '../../nucli/__fixtures__/arbreSintetic.js';

export { ANY, ARA, uid };

export const TOKENS_VIUS = Object.freeze(['Aurelixq', 'Vivxaq', 'Secretzq', 'Pepetqz', 'Vivqur', 'Ocultkq', 'Rosaqz', 'Senseqz', 'Datesqz', 'Llumqz', 'Testviq', 'Vivazkq']);

export const PERSONES = Object.freeze({
  jo: () => persona(1, { nom: 'Aurelixq', cognom1: 'Vivxaq', cognom2: 'Secretzq', sexe: 'F', viva: 'si', naixement: '1980', generacio: 'G4', lloc: 'Carrer Vivxaq', notes: 'Telèfon Vivxaq' }),
  pare: () => persona(2, { nom: 'Pepetqz', cognom1: 'Vivqur', cognom2: 'Ocultkq', sexe: 'M', naixement: '1950', generacio: 'G3', ofici: 'Ocultkq' }),
  mare: () => persona(3, { nom: 'Rosaqz', cognom1: 'Senseqz', cognom2: 'Datesqz', sexe: 'F', generacio: 'G3' }),
  iaio: () => persona(4, {
    nom: 'Vicent', cognom1: 'Ferrer', cognom2: 'Climent', sexe: 'M', naixement: '~1908', defuncio: '1975', generacio: 'G2',
    lloc: 'Poblet de Prova', ofici: 'llaurador', casa: 'Ca Prova', estat: 'aproximat',
    notes: 'La néta Aurelixq ho recorda',
    fonts: [{ id: uid(901), tipus: 'parroquial', titol: 'Llibre de baptismes de prova', url: 'https://www.familysearch.org/ark:/00000/prova', citacio: 'Foli 12', transcripcio: 'En lo any 1908 fon batejat…' }]
  }),
  iaia: () => persona(5, { nom: 'Teresa', cognom1: 'Llopis', cognom2: 'Mas', sexe: 'F', naixement: '1912?', viva: 'no', generacio: 'G2' }),
  besavi: () => persona(6, { nom: 'Batiste', cognom1: 'Ferrer', cognom2: 'Sanchis', sexe: 'M', naixement: '1880', defuncio: '1950', generacio: 'G1', lloc: 'Poblet de Prova' }),
  padri: () => persona(7, { nom: 'Tomàs', cognom1: 'Padrí', cognom2: 'Antic', sexe: 'M', naixement: '1870', viva: 'no' }),
  testimoni: () => persona(8, { nom: 'Llumqz', cognom1: 'Testviq', cognom2: 'Vivazkq', sexe: 'F', viva: 'si' })
});

export function arbreFamilia({ persones = {}, relacions = [], arbre = {} } = {}) {
  const base = Object.fromEntries(Object.entries(PERSONES).map(([clau, fabrica]) => [clau, fabrica()]));
  const totes = Object.values({ ...base, ...persones });
  return complet(totes, [
    rel(101, 'progenitor', 2, 1),
    rel(102, 'progenitor', 3, 1),
    rel(103, 'progenitor', 4, 2),
    rel(104, 'progenitor', 5, 2),
    rel(105, 'progenitor', 6, 4, { fontEscrita: true, vincleExplicit: true }),
    rel(106, 'padri', 7, 4),
    rel(107, 'testimoni', 8, 4),
    rel(108, 'parella', 4, 5),
    rel(109, 'parella', 2, 3),
    ...relacions
  ], { arrelId: uid(1), poble: 'Poblet de Prova', malnomCasa: 'Ca Prova', mas: 'Partida de Prova', ...arbre });
}
