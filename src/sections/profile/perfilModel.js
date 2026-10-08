import { Bot, Building2, Eye, Lock, Network, ShieldCheck, UserRound, Users } from 'lucide-react';
import { ESTATS_APLICACIO } from './aplicacions.js';
import { potEditarFitxa } from './fitxaDePerfil.js';

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

/** Opció i element de «GRUPS I EMPRESES» quan la persona no en té cap. */
export const SENSE_ORGANITZACIONS = 'sense-organitzacions';

/** Id de categoria d'una aplicació: prefixat, perquè no xoque amb cap organització. */
export const idAplicacio = (id) => `app-${id}`;

/* T43 (ordre del Mestre, 260928) · «Edita la fitxa de {Org}» obri el Perfil
   a la fitxa d'eixa organització SENSE canviar d'identitat: canviar-la és
   sempre una tria a part («Actua com a {Org}» o l'avatar de la barra). */
export const PARAM_FITXA_ORGANITZACIO = 'organitzacio';
export const rutaFitxaOrganitzacio = (id) => `/el-meu-perfil?${PARAM_FITXA_ORGANITZACIO}=${encodeURIComponent(String(id))}`;

/**
 * La primera categoria del Perfil: l'organització demanada per la ruta o,
 * si no, la que és l'actor actiu, sempre que siga una de les seues; si no,
 * la persona ('jo').
 */
export function seleccioInicialDePerfil(identitats, preferides = []) {
  const organitzacions = identitats.filter(esOrganitzacio);
  const triada = preferides.find((id) => id != null && id !== ''
    && organitzacions.some((identitat) => String(identitat.id) === String(id)));
  return { categoryId: triada != null ? String(triada) : 'jo' };
}

const esPersona = (identitat) => identitat.mena === 'persona';
/* Lògica d'Usuari (T4): els agents IA que la persona administra són un grup
   propi de la primera columna, no una organització. */
const esAgent = (identitat) => identitat.mena === 'agent';
const esOrganitzacio = (identitat) => !esPersona(identitat) && !esAgent(identitat);
const teOrganitzacions = (identitats) => identitats.some(esOrganitzacio);

const iconaDe = (identitat) => {
  if (esPersona(identitat)) return UserRound;
  if (esAgent(identitat)) return Bot;
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
  const organitzacions = identitats.filter(esOrganitzacio);
  const agents = identitats.filter(esAgent);
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
  /* Sense cap agent no es pinta cap capçalera buida. */
  if (agents.length) grups.push({ id: 'agents', label: 'AGENTS IA', options: agents.map(opcioDe) });
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
 * Segona columna, identitats. Persona: «La fitxa», «Les vistes», «El
 * compte», si el backend declara algun dels drets «Privacitat i dades» i,
 * l'últim, «Els nodes» (T9, 261001: on està connectada). Organització: «La
 * fitxa», «Les vistes» i «El compte». Agent IA: «La fitxa» i «Les vistes».
 * «Les vistes», només per a qui pot editar la fitxa (potEditarFitxa).
 */
export function itemsDePerfil(identitats, { ambPrivacitat = false } = {}) {
  const items = identitats.flatMap((identitat) => {
    const persona = esPersona(identitat);
    const categoryIds = [String(identitat.id)];
    const nom = identitat.nom || '';
    const fitxa = {
      id: `${identitat.id}-fitxa`,
      categoryIds,
      title: 'La fitxa',
      subtitle: esAgent(identitat) ? 'Intel·ligència artificial' : nom,
      image: identitat.avatar || undefined,
      icon: iconaDe(identitat),
      searchText: `fitxa ${nom}`,
      data: { vista: 'fitxa', identitatId: identitat.id },
    };
    /* Ordre del Mestre (261008) · «Vista A4 / PDF», «Crear portada» i «Vista
       targeta» ixen de l'espai d'edició central i fan un apartat més, com «El
       compte», just després de «La fitxa». Els veu qui avui veu eixos botons
       a l'editor: qui la pot editar. Qui només en és membre no en té. */
    const vistes = potEditarFitxa(identitat) ? [{
      id: `${identitat.id}-vistes`,
      categoryIds,
      title: 'Les vistes',
      subtitle: 'Vista A4 / PDF, portada i targeta',
      icon: Eye,
      searchText: `vistes vista a4 pdf imprimir portada targeta ${nom}`,
      data: { vista: 'vistes', identitatId: identitat.id },
    }] : [];
    /* Un agent IA només té fitxa (i les seues vistes): ni compte ni privacitat que administrar. */
    if (esAgent(identitat)) return [fitxa, ...vistes];
    const fills = [
      fitxa,
      ...vistes,
      {
        id: `${identitat.id}-compte`,
        categoryIds,
        title: 'El compte',
        subtitle: persona ? 'Correu, contrasenya, sessió i estat del perfil' : 'Correu, identificador, membres i eixida',
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
    if (persona) {
      fills.push({
        id: `${identitat.id}-nodes`,
        categoryIds,
        title: 'Els nodes',
        subtitle: 'On estàs connectat',
        icon: Network,
        searchText: `nodes connexio fedivers ${nom}`,
        data: { vista: 'nodes', identitatId: identitat.id },
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


