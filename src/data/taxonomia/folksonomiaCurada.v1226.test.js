/* C26-1 #4 (Gauntlet c13, lent c26-1) · La safata d'etiquetes emergents (IDEA-371 §2) alimentada amb la forma
   REAL del port, sense entrades fetes a mida per a la safata: les etiquetes les fa etiquetesDeNota (la de
   publishNote), el payload l'escriu el camí de content.js · appendSectionSubmissionNetworkOnly
   (categoriesSistemaPerPublicar + mapSectionSubmissionToItem) i la lectura és la de membres
   (murPublic.js · elementDeMurMembre → elementDeFilaPublicada) o la projecció anònima (elementDeMurPublic). */
import { describe, expect, test } from 'vitest';
import { elementDeFilaPublicada, mapSectionSubmissionToItem } from '../mapejadorSeccions.js';
import { elementDeMurMembre, elementDeMurPublic } from '../murPublic.js';
import { categoriesSistemaPerPublicar } from '../../utils/publicacioSistema.js';
import { ESTATS } from '../../utils/publicacioUniversal.js';
import { etiquetesDeNota } from '../../sections/notes/NotesContext.jsx';
import { ESTATS_DE_FITXA, agregaEtiquetesEmergents, entradaDeSafata } from './folksonomiaCurada.js';

const PERSONES = Object.freeze({
  alicia: '0a1b2c3d-0000-4000-8000-000000000001', bernat: '0a1b2c3d-0000-4000-8000-000000000002',
  carla: '0a1b2c3d-0000-4000-8000-000000000003', dani: '0a1b2c3d-0000-4000-8000-000000000004'
});
const ARA = '2026-11-26T05:00:00.000Z';

/* La fila de section_submissions que desa el camí d'escriptura de content.js. */
function filaPublicada({ id, persona, sectionId, poble, nota, extra = {} }) {
  const labels = etiquetesDeNota(nota, []).map(({ text, className }) => ({ text, className }));
  const basePayload = categoriesSistemaPerPublicar({ title: `Publicació ${id}`, labels, ...(poble ? { poble_id: poble } : {}), ...extra }, sectionId);
  const payload = mapSectionSubmissionToItem({ id, ownerUserId: persona, sectionId, createdAt: ARA,
    payload: { ...basePayload, id, ownerUserId: persona, sectionId, created_at: ARA } });
  return { id, tenant_id: 'tenant-de-prova', owner_user_id: persona, section_id: sectionId, title: payload.title,
    description: '', payload, created_at: ARA, updated_at: ARA, author_org_id: null };
}

const FILES = [
  filaPublicada({ id: 'p1', persona: PERSONES.alicia, sectionId: 'mur', poble: 'la-torre-de-les-macanes',
    nota: { categories: ['Món rural'], tags: ['Festivals', 'Música', 'El Carreró Centre Cultural i Tecnològic', 'Opinió'] } }),
  // Fora del Mostrar tot del Mur, però viva al seu lloc (IDEA-365): continua sent pública.
  filaPublicada({ id: 'p2', persona: PERSONES.bernat, sectionId: 'mur', poble: 'penaguila', extra: { mostrarAlMur: false },
    nota: { categories: [], tags: ['Festivals', 'Solar', '#Concerts'] } }),
  filaPublicada({ id: 'p3', persona: PERSONES.carla, sectionId: 'mercat', poble: 'alcoi',
    nota: { categories: ['Alimentació'], tags: ['Concerts', 'Festivals'] } }),
  // Una fitxa d'àmbit: el seu estat és de disponibilitat, no de publicació.
  filaPublicada({ id: 'p4', persona: PERSONES.carla, sectionId: 'mur', poble: 'alcoi', extra: { ambit: 'vehicle', estat: 'reservat', dades: {} },
    nota: { categories: [], tags: ['Compartim cotxe'] } }),
  filaPublicada({ id: 'p5', persona: PERSONES.alicia, sectionId: 'notes', poble: 'la-torre-de-les-macanes',
    nota: { categories: [], tags: ['Secret de la casa'] } }),
  // Retirada cautelar (R32.5): la frontera de mur_public_eligible.
  filaPublicada({ id: 'p6', persona: PERSONES.dani, sectionId: 'mur', poble: 'alcoi', extra: { moderation_state: 'retirada_cautelar' },
    nota: { categories: [], tags: ['Retirada'] } })
];

const SAFATA_ESPERADA = [
  { slug: 'festivals', nom: 'Festivals', estat: 'emergent', local: false, promocionable: true, nombreAutors: 3, nombrePobles: 3, nombrePublicacions: 3 },
  { slug: 'concerts', nom: 'Concerts', estat: 'emergent', local: false, promocionable: true, nombreAutors: 2, nombrePobles: 2, nombrePublicacions: 2 },
  { slug: 'compartim-cotxe', nom: 'Compartim cotxe', estat: 'emergent', local: false, promocionable: true, nombreAutors: 1, nombrePobles: 1, nombrePublicacions: 1 },
  { slug: 'el-carrero', nom: 'El Carreró', estat: 'local', local: true, promocionable: false, nombreAutors: 1, nombrePobles: 1, nombrePublicacions: 1 },
  { slug: 'opinio', nom: 'Opinió', estat: 'pendent', local: false, promocionable: false, nombreAutors: 1, nombrePobles: 1, nombrePublicacions: 1 }
];

describe('C26-1 #4 · safata d’etiquetes emergents amb la forma real del port', () => {
  test('la fila desada porta la forma que la safata ha de llegir: labels, poble_id, ownerUserId i secció', () => {
    const { payload } = FILES[0];
    expect(payload).toMatchObject({ ownerUserId: PERSONES.alicia, sectionId: 'mur', poble_id: 'la-torre-de-les-macanes', categoriesSistema: ['Mur'] });
    expect(payload.labels).toEqual([
      { text: 'Món rural', className: 'sdp-badge-category' },
      ...['Festivals', 'Música', 'El Carreró Centre Cultural i Tecnològic', 'Opinió'].map(text => ({ text, className: 'sdp-badge-tag' }))
    ]);
    for (const clau of ['author_id', 'town_id', 'etiquetes', 'status', 'visibility']) expect(Object.hasOwn(payload, clau), clau).toBe(false);
    expect(FILES[3].payload).toMatchObject({ ambit: 'vehicle', estat: 'reservat' });
  });

  test('lectura de membres (elementDeMurMembre → elementDeFilaPublicada): compta persones i pobles, no categories ni privats', () => {
    const elements = FILES.filter(f => f.section_id !== 'notes').map(f => elementDeMurMembre(f, f.section_id));
    const nota = elementDeFilaPublicada({ id: FILES[4].id, payload: FILES[4].payload, titol: FILES[4].title, createdAt: ARA, updatedAt: ARA, ownerUserId: PERSONES.alicia, sectionId: 'notes' });
    expect(elements.every(e => e.ownerUserId && !Object.hasOwn(e, 'author_id'))).toBe(true);
    expect(agregaEtiquetesEmergents([...elements, nota])).toEqual(SAFATA_ESPERADA);
  });

  test('el payload d’escriptura (mapSectionSubmissionToItem) dona la mateixa safata', () => {
    expect(agregaEtiquetesEmergents(FILES.map(f => f.payload))).toEqual(SAFATA_ESPERADA);
  });

  test('la projecció anònima del Mur no porta autoria: no compta i no tapa la fila de membres del mateix id', () => {
    const publiques = FILES.filter(f => ['mur', 'mercat'].includes(f.section_id)).map(f => elementDeMurPublic({ ...f, public_content: '', mostrar_al_mur: f.payload.mostrarAlMur ?? true }, f.section_id));
    expect(publiques.map(entradaDeSafata)).toEqual(publiques.map(() => null));
    expect(agregaEtiquetesEmergents(publiques)).toEqual([]);
    const membres = FILES.filter(f => f.section_id !== 'notes').map(f => elementDeMurMembre(f, f.section_id));
    expect(agregaEtiquetesEmergents([...publiques, ...membres])).toEqual(SAFATA_ESPERADA);
  });

  test('una marca privada guanya a la secció, i l’estat d’una fitxa és el de publicacioUniversal.js', () => {
    expect(ESTATS_DE_FITXA).toEqual(ESTATS);
    const base = elementDeMurMembre(FILES[0], 'mur');
    expect(entradaDeSafata(base)).toMatchObject({ id: 'p1', autor: PERSONES.alicia, poble: 'la-torre-de-les-macanes' });
    for (const marca of [{ visibility: 'private' }, { status: 'draft' }, { esborrany: true }, { estat: 'esborrany' }, { deleted: true }, { deletedAt: ARA }, { attributes: { moderation_state: 'ocult' } }]) {
      expect(entradaDeSafata({ ...base, ...marca }), JSON.stringify(marca)).toBeNull();
    }
    const fitxa = elementDeMurMembre(FILES[3], 'mur');
    expect(entradaDeSafata(fitxa)).toMatchObject({ id: 'p4', etiquetes: ['Compartim cotxe'] });
    expect(entradaDeSafata({ ...fitxa, estat: 'esborrany' })).toBeNull();
  });
});
