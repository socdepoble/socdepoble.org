import { Bot, Building2, UserRound, Users } from 'lucide-react';
import { ESTATS_APLICACIO } from './aplicacions.js';
import { avatarDeLaFitxa, pobleDeFitxa, potEditarFitxa } from './fitxaDePerfil.js';
import { documentDeFitxa } from './perfilCamps.js';

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

/* Pla 261015_1900 (Onada 1.3: «emoticones grans i riques als apartats») ·
   Els apartats de la segona columna porten un emoji, com la Wiki
   (iconesWiki.js) i Disseny (ICONES_ESPECIMENS): ItemMedia el pinta XL al
   quadrat de la fitxa (sdp-fitxa-emoji-xl) i el rail plegat, menut
   (NavGlyph). «La fitxa» es queda amb l'avatar de qui és (sdp-pedra-seca
   §11). 👁️ i 🛡️ porten el selector U+FE0F: sense, emojiSol els rebutja i es
   pintarien com a text menut. Tots quatre són d'Unicode 6-7 (Safari 16).
   Pla 261018_1605 (Tasca 4) · 🖼️ «Multimèdia» (Unicode 7), també amb U+FE0F. */
export const ICONES_APARTATS = Object.freeze({
  vistes: '\u{1F441}\u{FE0F}', // 👁️
  compte: '\u{1F510}', // 🔐
  privacitat: '\u{1F6E1}\u{FE0F}', // 🛡️
  nodes: '\u{1F310}', // 🌐
  multimedia: '\u{1F5BC}\u{FE0F}', // 🖼️
  /* Ordre del Mestre (261021, prompt 261021_0015, tasca 7) · «La pàgina» d'un agent IA. */
  pagina: '\u{1F4C4}', // 📄
  /* P1-11 (pla 261024_2230, T5B-03) · «Membres i connexions» d'una organització (Unicode 6). */
  membres: '\u{1F465}', // 👥
});

/* Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 3) · El subtítol
   de «Multimèdia» per a cada actor: la persona, en segona persona; una
   organització, amb el seu logotip (el nom de la casa, PerfilEditor ·
   ETIQUETA_LOGOTIP); un agent IA, amb el seu avatar. */
const SUBTITOLS_MULTIMEDIA = Object.freeze({
  persona: 'Les teues fotos, avatar i capçalera',
  organitzacio: 'Les seues fotos, logotip i capçalera',
  agent: 'Les seues fotos, avatar i capçalera',
});

/* T43 (ordre del Mestre, 260928) · «Edita la fitxa de {Org}» obri el Perfil
   a la fitxa d'eixa organització SENSE canviar d'identitat: canviar-la és
   sempre una tria a part («Actua com a {Org}» o l'avatar de la barra).
   Encàrrec 261018_1220 (Tasca 1) · La ruta viu ara a config/navigation.js, la
   font única que també llig la barra; ací es reexporta per als consumidors. */
export { PARAM_FITXA_ORGANITZACIO, rutaFitxaOrganitzacio } from '../../config/navigation.js';

/**
 * La primera categoria del Perfil: l'organització demanada per la ruta o,
 * si no, la que és l'actor actiu, sempre que siga una de les seues; si no,
 * la persona ('jo').
 * Ordre del Mestre (261021, prompt 261021_0015, tasca 7) · També un agent IA
 * que administra («Edita la fitxa» de /iaia): obri la seua fitxa, no la de la
 * persona.
 */
export function seleccioInicialDePerfil(identitats, preferides = []) {
  const seleccionables = identitats.filter((identitat) => !esPersona(identitat));
  const triada = preferides.find((id) => id != null && id !== ''
    && seleccionables.some((identitat) => String(identitat.id) === String(id)));
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
 * compte», si el backend declara algun dels drets «Privacitat i dades»,
 * «Els nodes» (T9, 261001: on està connectada) i «Multimèdia» (Pla
 * 261018_1605, Tasca 4: les seues fotos). Organització: «La fitxa», «Les
 * vistes», «El compte» i «Multimèdia». Agent IA: «La fitxa», «Les vistes» i
 * «Multimèdia». Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 3) ·
 * «Multimèdia» per a cada actor que la persona pot editar (persona, empresa o
 * grup i agent IA), l'últim apartat de cadascun.
 * «Les vistes» i «Multimèdia», només per a qui pot editar la fitxa
 * (potEditarFitxa): ni amb una baixa en curs ni amb la fila de reserva, ni
 * un membre d'una organització que no la pot editar.
 * Pla 261018_1605 (Tasca 2, D4) · El subtítol de «La fitxa» és «Nom · Poble»
 * (pobleDeFitxa, amb la reserva fundacional); sense poble, el nom. L'agent
 * IA continua amb «Intel·ligència artificial».
 */
export function itemsDePerfil(identitats, { ambPrivacitat = false } = {}) {
  const items = identitats.flatMap((identitat) => {
    const persona = esPersona(identitat);
    const categoryIds = [String(identitat.id)];
    const nom = identitat.nom || '';
    /* Gauntlet 261016 (encàrrec D) · La imatge de «La fitxa» és la de la
       fitxa (avatarDeLaFitxa, fitxaDePerfil.js), la mateixa que l'editor,
       «Les vistes» i «El compte»; abans, identitat.avatar. Este model és pur
       i no veu la cua: l'esborrany el posa qui pinta la fila (FitxaDePerfil,
       PerfilShell.jsx). */
    const doc = documentDeFitxa(identitat);
    const fitxa = {
      id: `${identitat.id}-fitxa`,
      categoryIds,
      title: 'La fitxa',
      subtitle: esAgent(identitat)
        ? 'Intel·ligència artificial'
        : [nom, pobleDeFitxa(identitat, identitats)].filter(Boolean).join(' · '),
      image: doc.heroImage || avatarDeLaFitxa(doc, null, identitat) || undefined,
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
      icon: ICONES_APARTATS.vistes,
      searchText: `vistes vista a4 pdf imprimir portada targeta ${nom}`,
      data: { vista: 'vistes', identitatId: identitat.id },
    }] : [];
    /* Pla 261018_1605 (Tasca 4, D8) · Com «Les vistes»: qui no pot editar la
       fitxa no hi pot canviar ni eliminar cap foto.
       Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 3) · Ara per a
       cada actor: la persona, l'organització i l'agent IA (DetallMultimedia
       hi mostra les fotos amb titularitat explícita de cadascun). */
    const actor = persona ? 'persona' : esAgent(identitat) ? 'agent' : 'organitzacio';
    const multimedia = potEditarFitxa(identitat) ? [{
      id: `${identitat.id}-multimedia`,
      categoryIds,
      title: 'Multimèdia',
      subtitle: SUBTITOLS_MULTIMEDIA[actor],
      icon: ICONES_APARTATS.multimedia,
      searchText: `multimedia fotos imatges galeria avatar ${actor === 'organitzacio' ? 'logotip ' : ''}capcalera ${nom}`,
      data: { vista: 'multimedia', identitatId: identitat.id },
    }] : [];
    /* Un agent IA només té fitxa (i les seues vistes i fotos): ni compte ni privacitat que administrar.
       Ordre del Mestre (261021, prompt 261021_0015, tasca 7) · I la seua
       pàgina, la mateixa de /iaia (FitxaPublica, PerfilPublicSection.jsx;
       per a la IAIA, amb el Selector de Realitat al peu), just després de
       «La fitxa»: com la veu el poble, sense cap vista paral·lela. */
    if (esAgent(identitat)) {
      const pagina = {
        id: `${identitat.id}-pagina`,
        categoryIds,
        title: 'La pàgina',
        subtitle: 'Com la veu el poble',
        icon: ICONES_APARTATS.pagina,
        searchText: `pagina publica realitat ${nom}`,
        data: { vista: 'pagina', identitatId: identitat.id },
      };
      return [fitxa, pagina, ...vistes, ...multimedia];
    }
    const fills = [
      fitxa,
      ...vistes,
      {
        id: `${identitat.id}-compte`,
        categoryIds,
        title: 'El compte',
        /* Pla 261016 (Bloc 3.1) · La persona tria ací els drets de sèrie de les seues notes. */
        subtitle: persona ? 'Correu, contrasenya, sessió, estat del perfil i drets de sèrie de les notes' : 'Correu, identificador i eixida',
        icon: ICONES_APARTATS.compte,
        searchText: `compte ${nom}`,
        data: { vista: 'compte', identitatId: identitat.id },
      },
    ];
    /* P1-11 (pla 261024_2230, T5B-03; G2230-04 de Gemini) · Una organització
       porta, just després d'«El compte», la seua vista «Membres i
       connexions» (DetallCompte amb lloc 'membres'): qui en forma part i el
       veïnat connectat, en una sola llista (GestioMembres ja inclou
       QuiSegueixOrganitzacio). Abans, un bloc més d'«El compte». */
    if (!persona) {
      fills.push({
        id: `${identitat.id}-membres`,
        categoryIds,
        title: 'Membres i connexions',
        subtitle: 'Qui en forma part i el veïnat connectat',
        icon: ICONES_APARTATS.membres,
        searchText: `membres connexions veinat ${nom}`,
        data: { vista: 'membres', identitatId: identitat.id },
      });
    }
    if (persona && ambPrivacitat) {
      fills.push({
        id: `${identitat.id}-privacitat`,
        categoryIds,
        title: 'Privacitat i dades',
        subtitle: 'Les teues dades, el consentiment i la baixa',
        icon: ICONES_APARTATS.privacitat,
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
        icon: ICONES_APARTATS.nodes,
        searchText: `nodes connexio fedivers ${nom}`,
        data: { vista: 'nodes', identitatId: identitat.id },
      });
    }
    /* «Multimèdia», l'últim: per a la persona, darrere d'«Els nodes»; per a
       l'organització, d'«El compte». */
    fills.push(...multimedia);
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


