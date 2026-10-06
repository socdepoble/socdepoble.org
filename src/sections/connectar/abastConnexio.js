/**
 * abastConnexio.js — Qui pot vore una connexió i com s'aplica
 * (T43, ordre del Mestre, 260928).
 *
 * PRINCIPI: una connexió és sempre una nota privada del MAS de la persona.
 * La visibilitat és una TRIA desada a la nota (origen.abast) més uns PASSOS
 * de difusió que el sistema ja sap fer: enviar l'enllaç per xat a persones o
 * a grups de xat, o compartir-la al Mur des del lector del MAS («Compartir al
 * Mur», notes/ConnexioDetall.jsx, T54). Mai no es promet cap permís que el
 * servidor no aplique:
 *   · Privada: exacta (RLS de propietari en remot, IndexedDB en local).
 *   · Persones i Grups: són MISSATGES de xat; no es desfan canviant la nota.
 *   · Tot el poble: el Mur el llig la gent registrada del poble (RLS
 *     is_town_member), no Internet. Sense servidor no hi ha Mur.
 * No s'escriu mai la tria dins de section_submissions.payload per a filtrar-la
 * al client: qualsevol membre del poble la podria llegir per REST. Quan una
 * connexió es compartix al Mur, el seu origen hi viatja sense `abast`:
 * mapSectionSubmissionToItem (data/mapejadorSeccions.js) hi aplica
 * origenPublic (data/origenNota.js) abans d'escriure la fila.
 *
 * Funcions pures, sense React ni xarxa. L'execució viu a useAplicaAbast.js.
 */
import { MODES_ABAST } from '../../data/origenNota.js';
import { CODI_ESQUEMA_ABSENT } from '../../data/errorsBackend.js';

export { MODES_ABAST };

/* Els enviaments són irreversibles i el xat té límit de freqüència: pocs i en sèrie. */
export const LIMIT_PERSONES = 20;
export const LIMIT_GRUPS = 10;
/* El xat accepta 4096 caràcters per missatge (xat.js). */
export const MAXIM_MISSATGE = 4096;
const MAXIM_TITOL = 300;

/* T67 · Només els grups reben l'enllaç: una comunitat és un contenidor sense
   missatges (els seus fills són Avisos i els grups) i als Avisos (el canal)
   només hi escriuen els administradors. */
const TIPUS_GRUP_XAT = new Set(['grup']);

/** Com es diu cada objecte connectable a la interfície. */
export const ETIQUETA_OBJECTE = Object.freeze({
  publicacio: 'Publicació del Mur',
  producte: 'Producte del Mercat',
  esdeveniment: 'Esdeveniment de l’agenda',
  multimedia: 'Multimèdia',
  poble: 'Poble',
  persona: 'Persona',
  entitat: 'Entitat',
  grup: 'Grup',
  ia: 'Intel·ligència artificial',
  pagina: 'Pàgina',
  nota: 'Nota',
  carpeta: 'Carpeta',
  categoria: 'Categoria',
  etiqueta: 'Etiqueta'
});

/** «des del Mur», «des de l'agenda»… Una secció desconeguda: «des de Sóc de Poble». */
const DES_DE = Object.freeze({
  mur: 'des del Mur',
  mercat: 'des del Mercat',
  events: 'des de l’agenda',
  pobles: 'des dels Pobles',
  multimedia: 'des de Multimèdia',
  notes: 'des del Bloc',
  perfil: 'des del directori'
});
export const desDe = (seccio) => DES_DE[seccio] || 'des de Sóc de Poble';

/** Els grups de xat on la persona ja és: fils de tipus 'grup', no arxivats. */
export function grupsDeXat(fils) {
  if (!Array.isArray(fils)) return [];
  return fils
    .filter((fil) => fil && fil.id != null && TIPUS_GRUP_XAT.has(fil.tipus) && !fil.arxivat)
    .map((fil) => ({ id: String(fil.id), nom: String(fil.name || fil.title || 'Grup sense nom') }));
}

/**
 * En quin punt està la llista de converses (XatContext): 'carregant' mentre
 * arriba, 'error' si no ha arribat (hi ha avís i cap fil) i, si no, 'llest'.
 * Sense `status` (un context sense xat), es dona per llesta.
 */
export function estatDelXat({ status, avis, fils } = {}) {
  if (status === 'loading') return 'carregant';
  const senseFils = !Array.isArray(fils) || fils.length === 0;
  return avis && senseFils ? 'error' : 'llest';
}

/**
 * Les quatre opcions de «Qui ho pot vore?», amb el text que diu la veritat
 * i, si no es pot triar, el motiu (`detall`). Forma de GrupOpcions.
 * `xat` (estatDelXat): una llista buida només vol dir «cap grup» quan el xat
 * ha carregat bé; mentre carrega o si ha fallat, es diu això.
 */
export function opcionsDAbast({ dataMode = 'remote', teSessio = false, grups = [], xat = 'llest' } = {}) {
  const remot = dataMode === 'remote';
  const senseComptes = 'Entra amb el teu compte per a enviar-ho per xat.';
  const nomesAci = 'Sense servidor, el missatge es queda en este dispositiu: ningú més el rep.';
  const senseGrups = Array.isArray(grups) ? grups.length === 0 : true;
  const motiuSenseGrups = xat === 'carregant' ? 'Carregant els teus grups de xat…'
    : xat === 'error' ? 'El xat no està disponible ara mateix.'
      : 'Encara no eres en cap grup de xat.';
  return [
    {
      valor: 'privada',
      etiqueta: 'Privada',
      /* D1 (ordre del Mestre, 260930) · el verb és connectar, no guardar. */
      ajuda: 'Queda al teu MAS. Ningú més la veu.',
      detall: remot ? undefined : 'Sense servidor, queda només en este dispositiu.'
    },
    {
      valor: 'persones',
      etiqueta: 'Persones concretes',
      ajuda: 'Tria gent del padró i li enviarem l’enllaç per xat. És un missatge, no un permís: no es pot desfer.',
      desactivada: !teSessio,
      detall: !teSessio ? senseComptes : (remot ? `Fins a ${LIMIT_PERSONES} persones.` : nomesAci)
    },
    {
      valor: 'grups',
      etiqueta: 'Grups',
      ajuda: 'Enviarem l’enllaç als grups de xat on ja eres. És un missatge, no un permís: no es pot desfer.',
      desactivada: !teSessio || senseGrups,
      detall: !teSessio ? senseComptes
        : senseGrups ? motiuSenseGrups
          : (remot ? `Fins a ${LIMIT_GRUPS} grups.` : nomesAci)
    },
    {
      valor: 'poble',
      etiqueta: 'Tot el poble',
      ajuda: 'No ix sola: obri la connexió al teu MAS i prem «Compartir al Mur». La veurà la gent registrada del poble, no Internet.',
      desactivada: !remot || !teSessio,
      detall: !remot ? 'Sense servidor no es pot compartir al Mur.'
        : (!teSessio ? 'Entra amb el teu compte per a compartir-la al Mur.' : undefined)
    }
  ];
}

/** El mode que es pot aplicar: si el triat està desactivat (o no existix), 'privada'. */
export function modeAplicable(mode, opcions) {
  const opcio = (opcions || []).find((o) => o.valor === mode);
  return opcio && !opcio.desactivada ? mode : 'privada';
}

function unics(llista, limit) {
  if (!Array.isArray(llista)) return [];
  const vistos = new Set();
  const fora = [];
  for (const desti of llista) {
    const id = desti?.id == null ? '' : String(desti.id);
    if (!id || vistos.has(id)) continue;
    vistos.add(id);
    fora.push({ ...desti, id, nom: String(desti.nom || id) });
    if (fora.length >= limit) break;
  }
  return fora;
}

/**
 * Els passos que cal fer després de connectar (crear la nota), en ordre. Els límits
 * s'apliquen ací: mai més de 20 persones ni de 10 grups.
 *   'xat-persona' → obrir (o reprendre) la conversa i enviar l'enllaç.
 *   'xat-grup'    → enviar l'enllaç al grup.
 *   'mur'         → no s'executa sol: la persona l'ha de compartir des del
 *                   lector del MAS («Compartir al Mur», T54).
 */
export function passosDAplicacio(abast) {
  if (!abast || typeof abast !== 'object') return [];
  if (abast.mode === 'persones') {
    return unics(abast.persones, LIMIT_PERSONES).map((desti) => ({ tipus: 'xat-persona', desti }));
  }
  if (abast.mode === 'grups') {
    return unics(abast.grups, LIMIT_GRUPS).map((desti) => ({ tipus: 'xat-grup', desti }));
  }
  if (abast.mode === 'poble') return [{ tipus: 'mur', desti: { id: 'mur', nom: 'El teu mur' } }];
  return [];
}

/** El missatge de xat: què s'ha connectat, de qui és i on es veu. Mai més de 4096 caràcters. */
export function missatgeDeConnexio({ titol = '', autorNom = '' } = {}, url = '') {
  const nom = String(titol || 'un element').trim().slice(0, MAXIM_TITOL);
  const de = autorNom ? ` (de ${String(autorNom).trim().slice(0, MAXIM_TITOL)})` : '';
  const on = url ? ` Ho pots vore ací: ${url}` : '';
  return `T’envie «${nom}»${de}, que he connectat al meu MAS.${on}`.slice(0, MAXIM_MISSATGE);
}

/**
 * D10 · Sense la migració 2609272100 el servidor no té la columna notes.origen
 * i rebutja la connexió amb un error de PostgREST. Es diu clar, sense el
 * missatge cru. La resta d'errors passen tal qual.
 * ENX-16 (261006) · Primer el codi neutral (error.codi 'esquema-absent'),
 * que pot portar qualsevol adaptador; la regex de PostgREST queda de reserva.
 */
export function missatgeDeLError(error) {
  const text = String(error?.message || '');
  const columnaOrigen = error?.codi === CODI_ESQUEMA_ABSENT
    || (/origen/i.test(text) && /PGRST204|42703|column|columna/i.test(text));
  if (columnaOrigen) {
    return 'El servidor d’este poble encara no admet connexions: falta aplicar-hi la migració de l’origen de les notes. La connexió no s’ha fet.';
  }
  return text || 'No s’ha pogut connectar. Torna-ho a provar.';
}

/** El registre del que s'ha fet de veres, per a origen.abast.aplicat. */
export function aplicatDe(resultats, ara = new Date()) {
  const fets = (resultats || []).filter((r) => r.estat === 'fet');
  return {
    persones: fets.filter((r) => r.tipus === 'xat-persona').map((r) => r.id),
    grups: fets.filter((r) => r.tipus === 'xat-grup').map((r) => r.id),
    mur: fets.some((r) => r.tipus === 'mur'),
    al: ara.toISOString()
  };
}
