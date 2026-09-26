import { Building2, Lock, ShieldCheck, UserRound, Users } from 'lucide-react';
import { ESTATS_APLICACIO } from './aplicacions.js';

/* ═══════════════════════════════════════════════════════════════════
   MODEL DE L'ESPAI DE TREBALL DEL PERFIL · funcions pures

   El mateix patró que el Bloc de Notes (NotesSection): tres grups a la
   primera columna i, a la segona, els fills de l'element triat.
     1. La persona: grup sense etiqueta, com les carpetes de Notes. El
        títol de la columna li fa de capçalera i el plega.
     2. GRUPS I EMPRESES: les organitzacions de la persona. Sense cap,
        una opció que explica com crear-ne una (el Workspace no admet un
        missatge dins d'un grup buit).
     3. APLICACIONS: les utilitats d'aplicacions.js.
   ═══════════════════════════════════════════════════════════════════ */

const ROLS_QUE_MANEN = new Set(['owner', 'admin']);

/** Opció i element de «GRUPS I EMPRESES» quan la persona no en té cap. */
export const SENSE_ORGANITZACIONS = 'sense-organitzacions';

/** Id de categoria d'una aplicació: prefixat, perquè no xoque amb cap organització. */
export const idAplicacio = (id) => `app-${id}`;

const esPersona = (identitat) => identitat.mena === 'persona';
const teOrganitzacions = (identitats) => identitats.some((identitat) => !esPersona(identitat));

const iconaDe = (identitat) => {
  if (esPersona(identitat)) return UserRound;
  return identitat.mena === 'grup' ? Users : Building2;
};

const opcioDe = (identitat, order) => ({
  id: String(identitat.id),
  label: identitat.nom,
  icon: iconaDe(identitat),
  order,
});

/** Primera columna: persona, GRUPS I EMPRESES i APLICACIONS, en este ordre. */
export function navegacioDePerfil(identitats, aplicacions = []) {
  const organitzacions = identitats.filter((identitat) => !esPersona(identitat));
  const grups = [
    { id: 'persona', label: null, options: identitats.filter(esPersona).map(opcioDe) },
    {
      id: 'organitzacions',
      label: 'GRUPS I EMPRESES',
      options: organitzacions.length
        ? organitzacions.map(opcioDe)
        : [{ id: SENSE_ORGANITZACIONS, label: 'Encara no en tens cap', icon: Building2, order: 0 }],
    },
  ];
  /* Una instància sense utilitats no pinta una capçalera buida. */
  if (aplicacions.length) {
    grups.push({
      id: 'aplicacions',
      label: 'APLICACIONS',
      options: aplicacions.map((aplicacio, order) => ({
        id: idAplicacio(aplicacio.id),
        label: aplicacio.nom,
        icon: aplicacio.icona || undefined,
        order,
      })),
    });
  }
  return grups;
}

/**
 * Segona columna, identitats. Persona: «La fitxa», «El compte» i, si el
 * backend declara algun dels drets, «Privacitat i dades». Organització:
 * «La fitxa» i «El compte».
 */
export function itemsDePerfil(identitats, { ambPrivacitat = false } = {}) {
  const items = identitats.flatMap((identitat) => {
    const persona = esPersona(identitat);
    const categoryIds = [String(identitat.id)];
    const nom = identitat.nom || '';
    const fills = [
      {
        id: `${identitat.id}-fitxa`,
        categoryIds,
        title: 'La fitxa',
        subtitle: nom,
        image: identitat.avatar || undefined,
        icon: iconaDe(identitat),
        searchText: `fitxa ${nom}`,
        data: { vista: 'fitxa', identitatId: identitat.id },
      },
      {
        id: `${identitat.id}-compte`,
        categoryIds,
        title: 'El compte',
        subtitle: persona ? 'Correu, contrasenya, sessió i estat del perfil' : 'Identificador, membres i eixida',
        icon: Lock,
        searchText: `compte ${nom}`,
        data: { vista: 'compte', identitatId: identitat.id },
      },
    ];
    if (persona && ambPrivacitat) {
      fills.push({
        id: `${identitat.id}-privacitat`,
        categoryIds,
        title: 'Privacitat i dades',
        subtitle: 'Les teues dades, el consentiment i la baixa',
        icon: ShieldCheck,
        searchText: `privacitat dades consentiment baixa ${nom}`,
        data: { vista: 'privacitat', identitatId: identitat.id },
      });
    }
    return fills;
  });

  if (!teOrganitzacions(identitats)) {
    items.push({
      id: `${SENSE_ORGANITZACIONS}-crear`,
      categoryIds: [SENSE_ORGANITZACIONS],
      title: 'Crear un grup o una empresa',
      subtitle: 'Amb el botó NOVA ORG',
      icon: Building2,
      searchText: 'crear grup empresa organitzacio',
      data: { vista: 'sense-organitzacions' },
    });
  }
  return items;
}

/** Segona columna, aplicacions: un sol element, «Sobre esta utilitat». */
export function itemsDAplicacions(aplicacions = []) {
  return aplicacions.map((aplicacio) => ({
    id: `${idAplicacio(aplicacio.id)}-sobre`,
    categoryIds: [idAplicacio(aplicacio.id)],
    title: 'Sobre esta utilitat',
    subtitle: ESTATS_APLICACIO[aplicacio.estat] || ESTATS_APLICACIO.pendent,
    icon: aplicacio.icona || undefined,
    searchText: `${aplicacio.nom} ${aplicacio.descripcio || ''}`,
    data: { vista: 'aplicacio', aplicacioId: aplicacio.id },
  }));
}

/** Empreses que la persona mana: les úniques que poden ser mare d'un grup. */
export const empresesMare = (identitats) => identitats
  .filter((identitat) => identitat.mena === 'empresa' && ROLS_QUE_MANEN.has(identitat.dades?.role))
  .map((identitat) => ({ valor: String(identitat.id), etiqueta: identitat.nom }));
