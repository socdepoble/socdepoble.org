/**
 * XatContext.jsx — L'estat del xat (F0: Fonament).
 *
 * QUÈ FA I QUÈ NO
 * ───────────────
 *   · La identitat del xat és `getCurrentUser().id` (via SessionContext), no
 *     l'`actorId` d'IdentitatContext: a les rutes /e/:slug/* eixe valor és un
 *     SLUG i marcaria tots els missatges com a 'other'.
 *   · No formata cap hora: `ultimAl` i `creatAl` ixen en ISO i la interfície
 *     els formata amb el `locale` de `useUIState()` (XAT-P11).
 *   · No coneix el mode seed: si no hi ha Supabase, l'adaptador de dades ja
 *     delega a un magatzem local. Ací no queda cap identificador fictici.
 *
 * PER QUÈ AÇÒ MAI TORNA status:'error'
 * ────────────────────────────────────
 * Un mòdul no pot tombar la casa: l'error del xat es queda dins del xat, a
 * `avis`. Amb l'esquema del xat sense aplicar, `loadFils` llança i el Mur, el
 * Mercat i les Notes han de continuar en peu.
 *
 * ENVIAMENT FIABLE (ARQ-A02, ARQ-H02, ARQ-H03)
 * ────────────────────────────────────────────
 * Cada missatge naix amb un UUID generat ací i es pinta `pendent` ABANS de la
 * xarxa (llei L4 de tractor-persistencia). El servidor l'accepta una sola
 * vegada per `id`: un reintent no duplica res. Si l'error és retriable es
 * reintenta sol tres vegades (1 s, 2 s, 4 s més component aleatori); si no, o
 * si s'esgoten, la bombolla passa a `error` i es queda fins que la persona la
 * reintenta o la descarta (XAT-B25). `sendChatMessage` no llança mai.
 *
 * TEMPS REAL I SONDEIG (ARQ-A06, ARQ-F03)
 * ───────────────────────────────────────
 * El canal només avisa («hi ha nous a partir del seq X»); els missatges es
 * demanen sempre a l'adaptador amb `despresDeSeq`. El sondeig és la xarxa de
 * seguretat: la llista cada MS_LLISTA; el fil obert cada MS_FIL sense canal i
 * cada MS_FIL_AMB_CANAL amb canal viu. S'atura amb la pestanya amagada i es
 * desperta en tornar (`visibilitychange`) o en tornar la xarxa (`online`).
 *
 * XARXA RURAL INTERMITENT (auditoria 261008, B04 i B09)
 * ─────────────────────────────────────────────────────
 *   · Un sondeig fallit no buida una llista que ja s'havia carregat bé:
 *     `llistaFresca` passa a false i `avisLlista` porta l'avís no bloquejant.
 *     Només la primera càrrega fallida, o l'esquema sense aplicar, la buiden i
 *     posen `avis`. El tic següent arriba als 2, 5, 10 o 30 s (60 s de sostre),
 *     també després d'una càrrega inicial fallida o d'una altra crida que
 *     falla (revisió 261008), i també si obrir una conversa torna a armar el
 *     sondeig enmig de l'espera.
 *   · L'historial cap arrere compta les fallades seguides per fil i les
 *     exposa amb `esperaAntics(filId)`: Conversa no el torna a demanar sol
 *     dins de l'espera, ni després de la tercera fallada o d'un error no
 *     reintentable (només el botó o la xarxa que torna, `online`).
 *
 * LECTURA (XAT-C08)
 * ─────────────────
 * Obrir una conversa NO la marca llegida. La interfície crida `marcaVist(filId,
 * seq)` quan una bombolla entra en pantalla amb la pestanya visible; ací
 * s'agrupa (una escriptura cada MS_MARQUES per conversa, mai cap arrere) i els
 * no llegits baixen en local abans que el servidor confirme. `marcaLlegides`
 * fa el mateix per a diverses converses alhora («Seleccionar xats»).
 *
 * XAT DE PÀGINA I COMUNITATS (T63.2 i T67, contracte del Xat §3)
 * ──────────────────────────────────────────────────────────────
 * `obriFilDePagina(objecte)` torna l'id del fil comú d'una Pàgina Universal
 * (el grup, o el General de la comunitat), null si el subjecte no en té, o
 * rebutja amb `codi: 'sense-capacitat'` si el backend no té 'xatDePagina'. En
 * remot el servidor no et fa participant fins que hi escrius: eixos fils es
 * queden com a VISITANTS (`participant: false`) dins de `chatThreads`, es
 * lligen amb `visitant` i el primer enviament hi entra; mai no s'hi envia cap
 * marca de lectura. `comunitats` i `contactesFrequents` són derivats purs
 * (missatges.js).
 *
 * QUI SOC (onada 3)
 * ─────────────────
 * `joId` (qui és «jo» al xat: la cerca no el troba, «Nova conversa» el pinta
 * amb «(Tu)»), `joNom` (el nom de la PERSONA, no el de l'entitat amb què
 * actua) i `senseSessio` (remot sense sessió, ja comprovada: mai mentre la
 * sessió es comprova). Cap valor d'un altre scope: van amb `visible`.
 *   Pla 261014_1450 (front C) · `joId`, `joNom` i `joAvatar` CONTINUEN sent
 *   la persona, també quan la barra negra actua com una entitat: el servidor
 *   desa usuari_id = auth.uid() (xat_envia, migració 2610081543) i
 *   missatges.js decidix el costat de cada bombolla amb `joId`. Posar-hi
 *   l'entitat passaria tots els missatges propis a 'other'. `entitatActiva`
 *   ({ id, nom, avatar } o null) és l'entitat amb què actua a la barra negra,
 *   el MATEIX `actor` d'IdentitatContext que pinta BotoIdentitatActiva, i
 *   només es presenta: el peu del rail en pinta el logo i el compositor diu
 *   qui signa. No canvia `joId` ni qui signa: ho decidix el servidor per fil
 *   (xat_participants.com_org_id → fil.comEntitat).
 *
 * DOS ÀMBITS (revisió adversarial 260930, troballes de l'entrada del poble i
 * dels esborranys)
 * ─────────────────────────────────────────────────────────────────────────
 * `scopeKey` porta `generacio`, que puja a CADA renovació del JWT (cada hora,
 * aprox.). El que la persona ha fet o ha escrit no caduca amb el testimoni:
 *   · `ambitEstable` (backend + persona + actor, sense generació) és la clau
 *     dels esborranys: canviar de persona o d'actor la canvia; renovar, no;
 *   · l'entrada automàtica (`consumixEntrada`) penja de backend + persona;
 * i, quan canvia la persona (eixir o entrar), s'obliden tots dos.
 *
 * LA CONVERSA SOBREVIU A LA RENOVACIÓ (Decisió 1 del Mestre, 261007)
 * ──────────────────────────────────────────────────────────────────
 * «Bombolles del xat: S'HAN DE CONSERVAR. La desaparició de l'historial del
 * xat cada hora en renovar-se la sessió destrossa l'experiència. L'estat local
 * ha de mantenir la continuïtat de la conversa malgrat la renovació del token
 * (JWT).» Abans, `scopeKey` era també la clau de les DADES i cada renovació ho
 * purgava tot: la bombolla en error amb el text que ja no era enlloc, l'historial
 * carregat, el fil obert i, amb XatWorkspace tornat a muntar, la cita a mitges i
 * la posició de lectura. Ara hi ha dos claus separades:
 *   · la de les DADES i l'aïllament (ARQ-H01) és `ambitEstable`: fils,
 *     missatges carregats, cursors, paginació, bombolles pròpies, visitants,
 *     marques i `filActiu`. Quan canvia (persona, actor o backend) es purga tot,
 *     com sempre, i res de l'àmbit anterior no es veu ni un sol render;
 *   · la de l'OPERACIÓ és `token` (scopeKey, amb `generacio`, i la config): cada
 *     petició captura el testimoni vigent. Una renovació avorta les operacions
 *     en vol i en llança de noves amb el testimoni nou (la llista, el fil obert
 *     per seq, l'historial cap arrere i el canal de temps real) sense buidar res.
 *     Els enviaments en vol passen a `error` (interromEnviaments) i es reintenten
 *     amb el MATEIX id; les obertures d'un sol tret (creaFil, obriFilDePagina) i
 *     les marques de lectura es tornen a fer soles amb l'operació nova, perquè
 *     qui les espera (XatSection ja no es torna a muntar) no reba un null fals.
 *   · Una config nova del MATEIX backend (backendScope igual) és, per a les
 *     dades, el mateix que una renovació: el mateix origen, la mateixa persona.
 *   · Relleu 261007 · sendChatMessage, creaFil i obriFilDePagina guardades
 *     d'abans d'una renovació i cridades després (un bucle en sèrie) passen
 *     per la versió vigent (accioVigent); d'un altre àmbit continuen tornant
 *     el [] o el null.
 *   · Relleu 261007 (revisió de seguretat de la Decisió 1, problema 2) · Una
 *     sessió anterior de la MATEIXA persona (eixir i tornar a entrar), o
 *     l'anada i tornada d'actor, només talla el llinatge si React ha arribat a
 *     PINTAR l'estat intermedi (sense sessió, o amb l'altre actor): la
 *     renovació es decidix comparant l'àmbit amb el de l'operació anterior, i
 *     la protecció és sobre el que React ha confirmat, no estructural. Hui es
 *     complix perquè sessionService notifica primer `usuari: null` (en eixir
 *     a la mateixa pestanya, esborraSessio → sincronitza; entre pestanyes,
 *     reconciliaAmbRegistre → sincronitza o recuperaSessio) i la sessió nova
 *     arriba després d'una volta de xarxa. Si mai arribaren A i A amb
 *     `generacio`+1 en una sola notificació, es tractaria com una renovació
 *     (la mateixa persona: cap fuita entre identitats).
 *   · Relleu 261007 (revisió de la correcció de seguretat, problema 1) · L'època
 *     de sessió ja existix: entradaSessio() i capturaSessio() (identitat.js),
 *     que una renovació no mou i eixir o tornar a entrar sí; la usen
 *     PerfilContext i NotesDataContext. No s'usa ací perquè, en mode
 *     incrustat, identitat.js compta cada reinjecció de l'amfitrió com una
 *     entrada nova, també la del mateix `sub` (vegeu el pendent de
 *     NotesDataContext): el xat purgaria la conversa a cada reinjecció, contra
 *     la Decisió 1. Per a la garantia estructural cal, primer, arreglar eixa
 *     reinjecció a identitat.js; després n'hi ha prou que `renovacio` exigisca
 *     també la mateixa entrada. Fora de l'abast d'este fitxer: pendent.
 */
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  loadFils,
  loadMissatges,
  enviaMissatge,
  marcaLlegit,
  creaFilDirecte,
  carregaMembres,
  subscribeToXat,
  unsubscribeFromXat,
  obriFilDePagina as obriFilDePaginaAlBackend,
  teCapacitat
} from '../../data/backendPort.js';
import { subjecteDeXat } from '../../data/contracte.js';
import { ambXatsPerDefecte, esXatDeLaIAIA, gestionaLEntitatPilot, senseLaIAIA, senseXatPerDefecte } from '../../data/xatsPerDefecte.js';
import useNivellIaia from '../realitat/useNivellIaia.js';
import { useSession } from '../../app/contexts/SessionContext';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { filsAmbLaGentDelPoble } from '../pobles/xatDelPoble.js';
import { normalizeBackendConfig, backendScope } from '../../config/backendConfig.js';
import { getDefaultUserId } from '../../data/appSeed.js';
import { useLocation } from '../../app/contexts/RouterContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { useToast } from '../../components/universal/NotificationContext.jsx';
import {
  LIMIT_PAGINA,
  MAX_REINTENTS,
  actualitzaFilAmbMissatge,
  actualitzaPendent,
  afigPendent,
  agrupaComunitats,
  aplicaMarcaLocal,
  combinaMissatges,
  contactesFrequents as calculaContactesFrequents,
  creaAgrupadorMarques,
  esperaReintent,
  filsEquivalents,
  fusionaPerSeq,
  generaId,
  interromEnviaments,
  mapejaFil,
  mapejaMissatge,
  retiraConfirmats,
  retiraPendent,
  seqMaxim,
  seqMinim,
  sumaNoLlegits,
  trobaPendent
} from './missatges.js';
import { buidaEsborranys } from './esborranys.js';
import { recordaRutaForaDelXat } from './informeDError.js';
import { clauDia } from './temps.js';

export const XatContext = createContext(null);
let hostPromise;
function hostReady(signal) {
  // Compartir la importació en el doble muntatge de StrictMode i el sondeig.
  hostPromise ||= import('../../host.js').catch(error => { hostPromise = null; throw error; });
  return hostPromise.then(host => host.quanLlest({ signal }));
}

/* Sondeig. La llista, lenta; el fil obert, ràpid sense canal i espaiat amb canal. */
const MS_LLISTA = 25000;
const MS_FIL = 5000;
const MS_FIL_AMB_CANAL = 30000;
/* Auditoria 261008 (B04) · Després d'una fallada REINTENTABLE de la llista
   (xarxa, temps d'espera, 5xx), el sondeig torna a provar aviat i cada vegada
   més espaiat: 2, 5, 10 i 30 s, i després cada 60 s fins al primer èxit. Una
   fallada que no es pot reintentar continua espaiant el tic a MS_LLISTA × 10. */
const ESPERES_LLISTA = Object.freeze([2000, 5000, 10000, 30000]);
const MS_LLISTA_SOSTRE = 60000;
/* Auditoria 261008 (B09) · L'historial cap arrere: després de cada fallada
   seguida d'un fil, l'observador de Conversa espera ESPERES_ANTICS abans de
   tornar a demanar-lo sol; a la fallada MAX_FALLADES_ANTICS, o amb un error
   que no es pot reintentar, ja no ho fa: només el botó «Carrega'n més» o la
   xarxa que torna ('online'). El primer èxit reinicia el comptador. */
const ESPERES_ANTICS = Object.freeze([2000, 5000]);
const MAX_FALLADES_ANTICS = ESPERES_ANTICS.length + 1;
/* Agrupació de les marques de lectura per conversa. */
const MS_MARQUES = 2000;
/* La ruta del xat, també dins d'un espai /e/:slug/xat. */
const RUTA_XAT = /(^|\/)xat(\/|$)/;
/* Una sola llista buida: els derivats buits no canvien de referència. */
const CAP = Object.freeze([]);

/* Sense la capacitat 'xatDePagina', «Comentar» ho ha de dir amb un avís honest. */
const errorSenseCapacitat = () => Object.assign(
  new Error('Este node no té xat de pàgina.'),
  { codi: 'sense-capacitat', code: 'SENSE_CAPACITAT', retriable: false }
);

/* Un fil de pàgina que encara llegixes sense ser-ne participant (remot). */
const esVisitant = (mapa, filId) => mapa[filId]?.participant === false;

/* B04 · L'espera fins al tic següent de la llista després de `fallades`
   fallades seguides. Pura. XatSection la reutilitza per a tornar a obrir un
   fil de pàgina quan falla la xarxa (B05): una sola escala d'esperes. */
export function esperaDeLaLlista(fallades, reintentable) {
  if (!reintentable) return MS_LLISTA * 10;
  return ESPERES_LLISTA[Math.max(0, fallades - 1)] ?? MS_LLISTA_SOSTRE;
}

/* B09 · L'espera de l'historial cap arrere després de la fallada número
   `fallades` d'un fil: { fallades, manual, fins }. `manual` vol dir que
   l'observador ja no torna a provar sol; `fins`, l'instant (ms) abans del
   qual no ho fa. Pura, llevat de `ara`. */
function esperaDeLHistorial(fallades, reintentable, ara = Date.now()) {
  const manual = !reintentable || fallades >= MAX_FALLADES_ANTICS;
  return Object.freeze({ fallades, manual, fins: manual ? null : ara + ESPERES_ANTICS[fallades - 1] });
}

/* Decisió 1 del Mestre (261007) · Una operació per testimoni. `relleu` es
   resol una sola vegada, quan l'operació plega: amb la que la substituïx si és
   del MATEIX àmbit de dades (una renovació del JWT, o una config nova del mateix
   backend), o amb null si l'àmbit canvia o el proveïdor es desmunta.
   Relleu 261007 · `llinatge` és el mateix objecte per a totes les operacions
   que s'han rellevat per renovacions seguides, i un de nou a cada canvi
   d'àmbit: eixir i tornar a entrar com la mateixa persona dona la mateixa
   clau d'àmbit, però no el mateix llinatge (vegeu accioVigent), sempre que
   React haja pintat l'estat sense sessió entre mig (vegeu la capçalera). */
function novaOperacio(token, llinatge) {
  let passa = null;
  const relleu = new Promise((resol) => { passa = resol; });
  return { token, llinatge, controller: new AbortController(), relleu, passa };
}

/* Decisió 1 · L'operació VIVA que ha rellevat `op` per renovacions seguides
   del mateix àmbit, o null si en algun punt de la cadena l'àmbit ha canviat o
   el proveïdor s'ha desmuntat. No n'hi ha prou amb el primer relleu: una
   renovació i, abans que la petició tallada acabe, un canvi de persona deixen
   el primer relleu viu en la promesa però mort en l'arbre, i l'acció vigent ja
   seria de la persona nova. */
async function relleuViu(op) {
  let seguent = await op.relleu;
  while (seguent?.controller.signal.aborted) seguent = await seguent.relleu;
  return seguent;
}

/* Relleu 261007 (revisió de seguretat de la Decisió 1, problema 1) · L'acció
   `nom` de la versió VIGENT per a l'operació viva `viu`, o null. Qui la crida
   ho ha de fer en el MATEIX tic síncron, sense cap await entre mig. relleuViu
   comprova la cadena abans de tornar, però la continuació de qui l'espera
   arriba microtasques després: si React confirma entre mig un altre àmbit
   (un flushSync, una sessió nova), l'operació ja està avortada i accionsRef
   ja és d'una altra persona. Una operació no avortada és sempre la vigent:
   cada una s'avorta just quan se substituïx o quan el proveïdor es desmunta.
   I `accions` ha de ser la del render del seu testimoni. */
function accioDelRelleu(viu, accions, nom) {
  if (!viu || viu.controller.signal.aborted || accions?.token !== viu.token) return null;
  return accions[nom] || null;
}

/* Decisió 1 del Mestre (261007) · Una acció d'un sol tret que una renovació ha
   tallat (obrir o crear un fil) es torna a fer amb l'operació nova del mateix
   àmbit: es crida la versió VIGENT de l'acció `nom`, la del render del
   testimoni nou (accionsRef), amb `args`. Les dos són idempotents al servidor:
   creaFilDirecte «obri (o troba)» la conversa i obri_fil_de_pagina «troba o
   crea» el xat comú. Amb un altre àmbit, o desmuntat, el null de sempre: cap
   resposta vella no entra a l'àmbit nou. Relleu 261007 (revisió de seguretat)
   · La comprovació i la crida van en el mateix tic (accioDelRelleu).
   Relleu 261007 (revisió de la correcció de seguretat, problema 2) · Si
   l'operació que relleuViu ha trobat viva ja està avortada quan arriba la
   continuació (React ha confirmat entre mig una altra renovació), es torna a
   esperar el seu relleu en lloc de tornar null: el relleu es resol amb null
   si l'àmbit canvia o el proveïdor es desmunta, i per tant entre identitats
   no hi passa res. L'última comprovació del bucle i la crida continuen en el
   mateix tic. `senseRelleu` diu què es fa sense acció vigent: null, o el
   llançament de l'error original (enviaMarca). */
async function despresDelRelleu(op, accionsRef, nom, args, senseRelleu = () => null) {
  let viu = await relleuViu(op);
  while (viu?.controller.signal.aborted) viu = await relleuViu(viu);
  const accio = accioDelRelleu(viu, accionsRef.current, nom);
  return accio ? accio(...args) : senseRelleu();
}

const BUIT = {
  status: 'loading',
  error: null,
  avis: null,
  scopeKey: '',
  ambitEstable: '',
  joId: null,
  joNom: null,
  joAvatar: null,
  entitatActiva: null,
  senseSessio: false,
  chatThreads: [],
  chatMessages: [],
  totalNoLlegits: 0,
  filActiu: null,
  getThreadMessages: () => [],
  hiHaMesAntics: () => false,
  carregantAntics: () => false,
  esperaAntics: () => null,
  carregaMesAntics: async () => false,
  llistaFresca: true,
  avisLlista: null,
  sendChatMessage: async () => [],
  reintenta: async () => [],
  descartaFallit: () => {},
  marcaVist: () => {},
  obriFil: () => {},
  creaFil: async () => { throw new Error('El xat encara no ha carregat.'); },
  cercaMembres: async () => [],
  recarrega: async () => false,
  obriFilDePagina: async () => null,
  comunitats: CAP,
  contactesFrequents: CAP,
  marcaLlegides: () => 0,
  modeDades: 'remote',
  consumixEntrada: () => false,
  iaiaApagada: false,
  esFilAmagat: () => false
};

/** Espera `ms` o fins que el senyal s'aborte. Torna `false` si s'ha abortat. */
function espera(ms, signal) {
  return new Promise((resolve) => {
    if (signal?.aborted) { resolve(false); return; }
    let temporitzador = null;
    const alAbortar = () => { clearTimeout(temporitzador); resolve(false); };
    temporitzador = setTimeout(() => {
      signal?.removeEventListener('abort', alAbortar);
      resolve(true);
    }, ms);
    signal?.addEventListener('abort', alAbortar, { once: true });
  });
}

/**
 * Avís dins de l'app (XAT-J01). Viu en un component propi perquè els seus
 * ganxos necessiten el router, el proveïdor de notificacions i el d'interfície,
 * que a App.jsx estan per damunt de XatProvider. Només diu qui ha escrit, mai
 * el text, i només quan la persona no és al xat.
 */
function AvisadorXat({ registra }) {
  const { pathname } = useLocation();
  const { showToast } = useToast();
  const { t } = useUIActions();
  /* Onada 6 · On era la persona abans d'entrar al Xat: la ruta (sense dades)
     de l'informe de «Informa d'un error» (informeDError.js). */
  useEffect(() => { recordaRutaForaDelXat(pathname); }, [pathname]);
  useEffect(() => {
    registra((nom) => {
      if (RUTA_XAT.test(String(pathname || ''))) return;
      const plantilla = t('section.xat.avisNouMissatge', 'Missatge nou de {nom}');
      showToast(String(plantilla).replace('{nom}', nom || ''));
    });
    return () => registra(null);
  }, [registra, pathname, showToast, t]);
  return null;
}

/* ─────────────────────────────── Provider ─────────────────────────────── */

export function XatProvider({ children, config }) {
  const { currentUser: usuari, generacio, estat: estatSessio } = useSession();
  const { actorKey, identitats, actor } = useIdentitat();
  /* Onada 3 · El nom de la persona (no el de l'entitat amb què actua): el xat
     és sempre de `joId`, i «Nova conversa» el pinta amb «(Tu)». */
  const persona = Array.isArray(identitats) ? identitats.find((i) => i?.tipus === 'persona' && i.id === usuari?.id) : null;
  const joNom = persona?.nom || null;
  const joAvatar = persona?.avatar || null;
  /* Pla 261014_1450 (front C) · L'entitat amb què actua a la barra negra: el
     MATEIX `actor` d'IdentitatContext que pinta BotoIdentitatActiva
     (useIdentitatDeLaBarra.js:94-98). Només es presenta (rail, compositor);
     `joId` continua sent la persona (vegeu la capçalera, «Qui soc»). El memo
     penja dels camps i no de l'objecte: el valor no canvia si l'actor es
     torna a construir igual. */
  const actuaComEntitat = actor?.tipus === 'entitat';
  const entitatId = actuaComEntitat ? actor.id ?? null : null;
  const entitatNom = actuaComEntitat ? actor.nom || null : null;
  const entitatAvatar = actuaComEntitat ? actor.avatar || null : null;
  const entitatActiva = useMemo(
    () => (actuaComEntitat ? { id: entitatId, nom: entitatNom, avatar: entitatAvatar } : null),
    [actuaComEntitat, entitatId, entitatNom, entitatAvatar]
  );
  /* Onada 6 (tasca 12) · Amb el nivell d'IA a 0 (Apagada) la IAIA no apareix
     al xat: ni a la llista (i, per tant, a les cerques i a les comunitats),
     ni als no llegits, ni als contactes freqüents, ni als avisos. Les dades
     no es toquen: només el que es veu. En tornar a 1 o més, reapareix. */
  const iaiaApagada = useNivellIaia() === 0;
  const iaiaApagadaRef = useRef(iaiaApagada);
  iaiaApagadaRef.current = iaiaApagada;
  /* Sense sessió, el xat només existix en mode seed/local (l'adaptador ja escriu
     com a convidat amb el mateix identificador); en remot cal la sessió. Es llig
     de la configuració i no del port, que encara no està segellat al primer render. */
  const modeDades = normalizeBackendConfig(config || {}).dataMode;
  const joId = usuari?.id || (modeDades !== 'remote' ? getDefaultUserId() : null);
  const scopeKey = JSON.stringify([backendScope(config), joId, actorKey, generacio]);
  /* Revisió adversarial 260930 · Les claus que NO porten `generacio`: una
     renovació del JWT no és una sessió nova (vegeu la capçalera, «Dos àmbits»). */
  const clauPersona = JSON.stringify([backendScope(config), joId]);
  const ambitEstable = JSON.stringify([backendScope(config), joId, actorKey]);
  /* Decisió 1 del Mestre (261007) · `token` és la clau de l'OPERACIÓ (porta
     `generacio` i la config: cada petició nova captura el testimoni nou) i
     `ambit` hi viatja perquè l'efecte de més avall sàpia si el testimoni nou és
     del mateix àmbit de DADES (una renovació) o d'un altre (cal purgar). */
  const token = useMemo(() => ({ scopeKey, ambit: ambitEstable, config }), [scopeKey, ambitEstable, config]);
  const tokenActual = useRef(token);
  tokenActual.current = token;
  /* Decisió 1 · L'àmbit de dades del render vigent i si el proveïdor és
     desmuntat: els getters guardats d'un altre àmbit (o d'un proveïdor ja
     desmuntat) tornen buit, encara que el testimoni d'operació siga un altre. */
  const ambitActual = useRef(ambitEstable);
  ambitActual.current = ambitEstable;
  const desmuntat = useRef(false);
  const operacio = useRef(null);
  const [tokenEstat, setTokenEstat] = useState(null);
  const captura = useCallback(() => {
    const op = operacio.current;
    return op?.token === token && !op.controller.signal.aborted ? op : null;
  }, [token]);
  const vigent = useCallback(op => Boolean(op && tokenActual.current === op.token
    && !op.controller.signal.aborted), []);
  /* Decisió 1 · La versió vigent de les accions, la del render del testimoni
     nou, amb el testimoni que captura (despresDelRelleu, el relleu
     d'enviaMarca i accioVigent; els dos primers, per accioDelRelleu). */
  const accionsRef = useRef(null);
  /* Relleu 261007 · L'operació que s'ha obert per a cada testimoni: diu de
     quin llinatge és el testimoni que porta una acció guardada. */
  const opDelToken = useRef(new WeakMap());
  /* Relleu 261007 (revisió adversarial de la Decisió 1) · Qui guarda una
     acció d'abans d'una renovació i la crida després no ha de rebre un null
     o un [] mut. Cas real: el bucle en sèrie de «Connectar»
     (useAplicaAbast.js) usa el creaFil i el sendChatMessage del render en
     què va començar; a mig bucle, la renovació deixava els destinataris
     següents sense bombolla i el seu avís («El trobaràs al xat per a
     tornar-ho a provar») era fals. Si l'operació viva és del MATEIX
     llinatge que el testimoni de qui crida (només renovacions entre mig) i
     ja té el seu render (accionsRef porta el seu testimoni), es torna la
     versió vigent de l'acció. Amb un altre àmbit (persona, actor o
     backend), amb eixir i tornar a entrar, amb el proveïdor desmuntat o
     abans que l'operació nova existisca, null: el [] o el null de sempre
     (ARQ-H01). La versió vigent passa captura() per construcció: no hi ha
     cap bucle. Relleu 261007 (revisió de seguretat, problema 2) · «Eixir i
     tornar a entrar» vol dir que React n'ha pintat l'estat sense sessió:
     la protecció és sobre el que React ha confirmat, no estructural (vegeu
     la capçalera: l'entrada de sessió d'identitat.js, encara sense usar ací). */
  const accioVigent = useCallback((nom) => {
    const op = operacio.current;
    const meua = opDelToken.current.get(token);
    const accions = accionsRef.current;
    if (desmuntat.current || !op || !meua || op.controller.signal.aborted) return null;
    if (meua.llinatge !== op.llinatge || accions?.token !== op.token) return null;
    return accions[nom] || null;
  }, [token]);

  const [fils, setFils] = useState([]);
  const filsRef = useRef([]);
  /* Auditoria 261007 (B) · El dia local («2026-10-07», clauDia) de l'última
     llista que el sondeig ha aplicat. Vegeu carregaFils: un canvi de dia
     aplica la llista encara que siga equivalent. */
  const diaFilsRef = useRef(null);
  const [estat, setEstat] = useState('loading');
  const [avis, setAvis] = useState(null);
  /* Auditoria 261008 (B04) · Un sondeig fallit ja no buida una llista que
     s'havia carregat bé: `llistaFresca` diu si l'última càrrega ha anat bé
     (XatSection no decidix cap 404 amb una llista rància) i `avisLlista`
     porta l'avís NO bloquejant d'eixa fallada (la llista es queda a la
     vista). `avis` continua sent l'error que tapa la llista: la primera
     càrrega fallida o l'esquema sense aplicar. `llistaCarregadaRef` diu si
     la llista de l'àmbit s'ha carregat bé alguna vegada; `falladesLlistaRef`
     i `reintentableLlistaRef`, l'espera del tic següent (esperaDeLaLlista). */
  const [llistaFresca, setLlistaFresca] = useState(true);
  const [avisLlista, setAvisLlista] = useState(null);
  const llistaCarregadaRef = useRef(false);
  const falladesLlistaRef = useRef(0);
  const reintentableLlistaRef = useRef(true);
  /* Revisió 261008 (B04) · El sondeig viu hi deixa com tornar a armar el
     seu tic: una fallada que no ve del tic (la càrrega inicial,
     «Connectar», la cerca global) també passa a l'espera curta. */
  const reprogramaLlistaRef = useRef(null);
  const [filActiu, setFilActiu] = useState(null);
  /* Missatges confirmats pel servidor, per fil, ordenats per seq. */
  const [missatgesPerFil, setMissatgesPerFil] = useState({});
  const missatgesRef = useRef({});
  /* Auditoria 261007 (B) · El cursor de SERVIDOR de cada fil: el seq més alt
     que ha tornat una lectura acceptada de `loadMissatges` (completa o
     incremental). És el `despresDeSeq` de la lectura següent. Abans era el
     seq màxim del magatzem, on també entra el missatge propi confirmat: si
     Pepa escrivia el 11 i jo enviava el 12 abans del sondeig, el cursor
     saltava al 12 i el 11 no arribava mai. Ni l'enviament ni l'historial cap
     arrere el mouen; una lectura superada tampoc. Sense entrada = càrrega
     completa; 0 = fil carregat i buit. */
  const cursorRef = useRef({});
  /* Bombolles pròpies encara sense seq: pendents i fallides. */
  const [pendentsPerFil, setPendentsPerFil] = useState({});
  const pendentsRef = useRef({});
  /* T63.2 · Fils de pàgina que llegixes sense ser-ne participant (remot), per id. */
  const [visitants, setVisitants] = useState({});
  const visitantsRef = useRef({});
  /* Paginació cap arrere per fil: { hiHaMes, carregant } i, després d'una
     fallada, `espera` (B09, esperaDeLHistorial). */
  const [paginacio, setPaginacio] = useState({});
  /* Auditoria 261008 (B09) · Les fallades SEGUIDES de l'historial cap arrere
     per fil. Només un èxit (o un altre àmbit) les torna a zero. */
  const falladesAnticsRef = useRef({});
  /* Decisió 1 · Les càrregues d'historial cap arrere en vol, per fil, amb
     l'operació que les porta: una renovació les avorta, i l'efecte del relleu
     les torna a demanar amb l'operació nova sense eixir de «carregant». */
  const carregantAnticsRef = useRef(new Map());
  /* Últim seq del qual ja s'ha avisat (o vist) per fil, per a no repetir avisos. */
  const ultimSeqAvisat = useRef({});
  const avisadorRef = useRef(null);
  const enviaMarcaRef = useRef(null);
  const agrupador = useRef(null);
  if (!agrupador.current) {
    agrupador.current = creaAgrupadorMarques((filId, seq) => enviaMarcaRef.current?.(filId, seq), MS_MARQUES);
  }

  const genFils = useRef(0);
  const genMissatges = useRef(0);

  /* Els refs són la font de veritat per als camins asíncrons; l'estat, per al render.
     Auditoria 261007 (B) · Els fils també: `filsRef` s'escriu alhora que
     l'estat, i no en un efecte posterior. El sondeig de la llista compara la
     resposta amb `filsRef` per a no cridar setFils si res no ha canviat; amb
     una còpia que arribava un render tard, una marca local o un enviament
     recent podien semblar «iguals» al servidor i quedar-se sense corregir. */
  const mutaFils = useCallback((fn) => {
    const nou = fn(filsRef.current);
    if (nou === filsRef.current) return;
    filsRef.current = nou;
    setFils(nou);
  }, []);
  const mutaMissatges = useCallback((fn) => {
    const nou = fn(missatgesRef.current);
    missatgesRef.current = nou;
    setMissatgesPerFil(nou);
  }, []);
  const mutaPendents = useCallback((fn) => {
    const nou = fn(pendentsRef.current);
    pendentsRef.current = nou;
    setPendentsPerFil(nou);
  }, []);
  const mutaVisitants = useCallback((fn) => {
    const nou = fn(visitantsRef.current);
    if (nou === visitantsRef.current) return;
    visitantsRef.current = nou;
    setVisitants(nou);
  }, []);
  useEffect(() => () => agrupador.current?.cancela(), []);

  const registraAvisador = useCallback((fn) => { avisadorRef.current = fn; }, []);

  /* Avisa una sola vegada per seq nou d'una altra persona (XAT-J01). El primer
     valor d'un fil és la línia base: en arrencar no s'avisa de res.
     Onada 6 (tasca 12) · Amb la IAIA apagada, el seu xat no avisa: la línia
     base avança igual, i en tornar-la a encendre no arriba cap avís vell. */
  const avisaSiCal = useCallback((filId, seq, autorId, nom) => {
    const s = Number(seq) || 0;
    const previ = ultimSeqAvisat.current[filId];
    if (previ === undefined) { ultimSeqAvisat.current[filId] = s; return; }
    if (s <= previ) return;
    ultimSeqAvisat.current[filId] = s;
    if (!autorId || autorId === joId) return;
    if (iaiaApagadaRef.current) {
      const fil = filsRef.current.find((f) => f.id === filId) || visitantsRef.current[filId];
      if (esXatDeLaIAIA(fil)) return;
    }
    avisadorRef.current?.(nom);
  }, [joId]);

  /* Decisió 1 · Desmuntar tanca l'àmbit: els getters guardats tornen buit i
     les accions que esperaven el relleu reben null. Declarat abans de l'efecte
     de l'operació: en el doble muntatge de StrictMode es torna a obrir primer. */
  useLayoutEffect(() => {
    desmuntat.current = false;
    return () => {
      desmuntat.current = true;
      operacio.current?.passa(null);
    };
  }, []);

  // Purga física després del render. El value oculta l'estat anterior des del
  // primer render, abans que React execute este efecte o les seues neteges.
  // Decisió 1 del Mestre (261007) · Només quan canvia l'àmbit de DADES
  // (backend, persona o actor). Una renovació del JWT (o una config nova del
  // mateix backend) només canvia l'operació: avorta les peticions en vol (la
  // neteja de l'efecte anterior), n'obri una de nova i els efectes que en
  // pengen tornen a demanar la llista, el fil obert per seq, l'historial en
  // vol i el canal de temps real. Fils, missatges, cursors, paginació,
  // bombolles, visitants, avisos ja fets, marques i `filActiu` es queden.
  useLayoutEffect(() => {
    const previa = operacio.current;
    const renovacio = previa?.token.ambit === token.ambit;
    const op = novaOperacio(token, renovacio ? previa.llinatge : {});
    operacio.current = op;
    opDelToken.current.set(token, op);
    if (renovacio) {
      /* Els enviaments en vol eren de l'operació que s'acaba d'avortar: la
         bombolla es queda, en error, i «Torna-ho a provar» la reenvia amb el
         mateix id. Si el servidor ja l'havia rebuda, la lectura següent la
         retira (retiraConfirmats). */
      mutaPendents(interromEnviaments);
    } else {
      setFils([]);
      filsRef.current = [];
      diaFilsRef.current = null;
      setMissatgesPerFil({});
      missatgesRef.current = {};
      cursorRef.current = {};
      setPendentsPerFil({});
      pendentsRef.current = {};
      setVisitants({});
      visitantsRef.current = {};
      setPaginacio({});
      carregantAnticsRef.current.clear();
      falladesAnticsRef.current = {};
      ultimSeqAvisat.current = {};
      agrupador.current?.cancela();
      setFilActiu(null);
      setAvis(null);
      /* B04 · L'àmbit nou encara no ha carregat cap llista. */
      llistaCarregadaRef.current = false;
      falladesLlistaRef.current = 0;
      reintentableLlistaRef.current = true;
      setLlistaFresca(true);
      setAvisLlista(null);
      setEstat(joId ? 'loading' : 'ready');
    }
    setTokenEstat(token);
    /* Qui esperava el relleu (despresDelRelleu, enviaMarca) continua amb
       l'operació nova si és el mateix àmbit; si no, rep null. */
    previa?.passa(renovacio ? op : null);
    return () => { op.controller.abort(); };
  }, [token, joId, mutaPendents]);

  /* ── Llista de fils ──
     Torna true si s'ha aplicat, false si ha fallat (o l'àmbit ja no és el
     mateix) i null si una càrrega posterior l'ha superada.
     Auditoria 261007 (B) · Una càrrega superada no és una fallada: el sondeig
     només espaia el tic següent amb `false`. Abans, una recàrrega de la
     llista mentre el tic era en vol el portava de 25 s a 250 s. Obrir una
     conversa o un «Comentar» no hi arribava: naveguen a /xat/<filId>, el fil
     obert canvia i el sondeig es torna a armar a 25 s. Els camins comprovats
     que recarreguen sense navegar són tres: «Connectar» amb diversos
     destinataris (useAplicaAbast.js, creaFil en sèrie), el primer missatge
     com a visitant d'un fil de pàgina (executaEnviament) i el «Reintentar»
     de la cerca global (useCercaGlobal.js), que no llig el valor de tornada. */
  const carregaFils = useCallback(async () => {
    const op = captura();
    if (!vigent(op)) return false;
    const meua = ++genFils.current;
    if (!joId) {
      mutaFils((previs) => (previs.length ? [] : previs));
      setEstat('ready');
      return false;
    }

    try {
      await hostReady(op.controller.signal);
      if (!vigent(op)) return false;
      const bruts = await loadFils({ ...config, signal: op.controller.signal });
      if (!vigent(op)) return false;
      if (meua !== genFils.current) return null;
      /* Auditoria 261007 (B) · La marca de lectura que la interfície ja ha
         fet (pendent, en vol o confirmada a l'agrupador) es torna a aplicar
         sobre la resposta del servidor: un sondeig que ha eixit abans de la
         marca no torna a encendre la pastilla. Sense marca, el mateix fil. */
      const nous = (Array.isArray(bruts) ? bruts : [])
        .map((f) => aplicaMarcaLocal(mapejaFil(f), agrupador.current.marcatFins(f.id)));
      /* Auditoria 261007 (B) · Si la llista és la mateixa, ni setFils ni cap
         derivat nou: el sondeig de cada 25 s no repinta el xat per a res. Els
         avisos i la neteja de visitants es fan igualment. El «no llegit»
         manual apagat a l'instant (marcaLlegides) no passa per l'agrupador:
         la llista es dona per diferent i mana el servidor, com fins ara.
         Llevat d'un canvi de dia: les etiquetes de temps es calculen amb
         l'hora del render («14:32», «Ahir» o el dia de la setmana a
         FilaConversa; «Hui» i «Ahir» a SeparadorDia) i el xat no té cap
         rellotge propi; qui les refrescava era el sondeig, que repintava
         sempre. El primer sondeig del dia nou (passada la mitjanit, o en
         tornar a la pestanya l'endemà) aplica la llista encara que siga
         equivalent; amb els fils es tornen a calcular missatgesDerivats i
         es repinten la llista i la conversa oberta. */
      const dia = clauDia(new Date());
      if (dia !== diaFilsRef.current || !filsEquivalents(filsRef.current, nous)) {
        diaFilsRef.current = dia;
        mutaFils(() => nous);
      }
      /* Un visitant que ja torna a la llista ja hi participa. */
      const ids = new Set(nous.map((f) => f.id));
      mutaVisitants((previs) => (Object.keys(previs).some((id) => ids.has(id))
        ? Object.fromEntries(Object.entries(previs).filter(([id]) => !ids.has(id)))
        : previs));
      setAvis(null);
      llistaCarregadaRef.current = true;
      falladesLlistaRef.current = 0;
      reintentableLlistaRef.current = true;
      setLlistaFresca(true);
      setAvisLlista(null);
      for (const f of nous) avisaSiCal(f.id, f.ultimSeq, f.ultimAutorId, f.name);
      return true;
    } catch (error) {
      if (!vigent(op)) return false;
      if (meua !== genFils.current) return null;
      /* No es propaga a `status`. Vegeu la capçalera del fitxer. */
      const text = error?.message || 'No s\'han pogut carregar les converses.';
      falladesLlistaRef.current += 1;
      reintentableLlistaRef.current = error?.retriable === true;
      setLlistaFresca(false);
      reprogramaLlistaRef.current?.();
      /* Auditoria 261008 (B04) · Amb cobertura rural intermitent, un sol
         sondeig fallit buidava la llista i convertia la conversa oberta en un
         404. Si la llista ja s'havia carregat bé, es conserva (fils i
         filsRef) i l'avís no la tapa. Només es buida si encara no s'ha
         carregat mai, o amb l'esquema del xat sense aplicar ('ESQUEMA'). */
      if (llistaCarregadaRef.current && error?.code !== 'ESQUEMA') {
        setAvisLlista(text);
        return false;
      }
      setAvisLlista(null);
      setAvis(text);
      filsRef.current = [];
      setFils([]);
      return false;
    } finally {
      if (vigent(op) && meua === genFils.current) setEstat('ready');
    }
  }, [joId, config, captura, vigent, avisaSiCal, mutaFils, mutaVisitants]);

  /* ── Missatges d'un fil: complet la primera vegada, incremental (despresDeSeq) després ──
     Torna true, false o null com carregaFils (null: una càrrega posterior l'ha superada). */
  const carregaMissatges = useCallback(async (filId) => {
    const op = captura();
    if (!filId || !joId || !vigent(op)) return false;
    const meua = ++genMissatges.current;
    /* Auditoria 261007 (B) · El cursor de servidor (cursorRef), mai el seq
       màxim del magatzem: el missatge propi confirmat no el mou. */
    const desDe = cursorRef.current[filId] ?? null;
    const incremental = desDe != null;

    try {
      await hostReady(op.controller.signal);
      if (!vigent(op)) return false;
      const opcions = { ...config, signal: op.controller.signal };
      if (incremental) opcions.despresDeSeq = desDe;
      if (esVisitant(visitantsRef.current, filId)) opcions.visitant = true;
      const bruts = await loadMissatges(filId, opcions);
      if (!vigent(op)) return false;
      /* Superada: el cursor no avança i la càrrega vigent torna a demanar el forat. */
      if (meua !== genMissatges.current) return null;
      const nous = (Array.isArray(bruts) ? bruts : []).map((m) => mapejaMissatge(m, joId));
      /* Auditoria 261007 (B) · Només una lectura acceptada avança el cursor, i
         mai cap arrere. Una càrrega completa sense cap missatge el deixa a 0
         (cursor vàlid per a xat_nous): un fil buit no torna a fer una càrrega
         completa a cada sondeig. */
      const maxim = seqMaxim(nous);
      cursorRef.current[filId] = incremental ? Math.max(desDe, maxim ?? desDe) : (maxim ?? 0);
      /* Auditoria 261007 (B) · Un sondeig incremental sense res nou no muta
         res: ni el magatzem ni els derivats, ni la conversa oberta es repinta
         cada 5 o 30 s per a res. El separador «Hui»/«Ahir» del dia nou el
         porta el sondeig de la llista (vegeu carregaFils). */
      if (incremental && !nous.length) return true;
      mutaMissatges((previs) => ({
        ...previs,
        [filId]: fusionaPerSeq(incremental ? previs[filId] || [] : [], nous)
      }));
      /* Un pendent que el servidor ja torna amb el seu id és un missatge confirmat. */
      mutaPendents((previs) => retiraConfirmats(previs, filId, nous));
      if (incremental) {
        for (const m of nous) avisaSiCal(filId, m.seq, m.usuariId, m.author);
      } else {
        setPaginacio((previs) => ({ ...previs, [filId]: { hiHaMes: nous.length >= LIMIT_PAGINA, carregant: false } }));
        if (maxim != null) ultimSeqAvisat.current[filId] = Math.max(ultimSeqAvisat.current[filId] || 0, maxim);
      }
      return true;
    } catch (error) {
      if (!vigent(op)) return false;
      if (meua !== genMissatges.current) return null;
      setAvis(error?.message || 'No s\'han pogut carregar els missatges.');
      return false;
    }
  }, [joId, config, captura, vigent, avisaSiCal, mutaMissatges, mutaPendents]);

  /* ── Historial cap arrere (XAT-A23): abansDeSeq = el seq mínim carregat ── */
  const carregaMesAntics = useCallback(async (filId) => {
    const op = captura();
    if (!filId || !joId || !vigent(op)) return false;
    /* Decisió 1 · Només bloqueja una càrrega de l'operació vigent: la que una
       renovació ha avortat ja no compta, i el relleu la torna a demanar. */
    const enCurs = carregantAnticsRef.current.get(filId);
    if (enCurs && vigent(enCurs)) return false;
    const minim = seqMinim(missatgesRef.current[filId] || []);
    if (minim == null) return carregaMissatges(filId);

    carregantAnticsRef.current.set(filId, op);
    setPaginacio((previs) => ({ ...previs, [filId]: { hiHaMes: previs[filId]?.hiHaMes ?? true, carregant: true } }));
    try {
      await hostReady(op.controller.signal);
      if (!vigent(op)) return false;
      const opcions = { ...config, signal: op.controller.signal, abansDeSeq: minim, limit: LIMIT_PAGINA };
      if (esVisitant(visitantsRef.current, filId)) opcions.visitant = true;
      const bruts = await loadMissatges(filId, opcions);
      if (!vigent(op)) return false;
      const antics = (Array.isArray(bruts) ? bruts : []).map((m) => mapejaMissatge(m, joId));
      mutaMissatges((previs) => ({ ...previs, [filId]: fusionaPerSeq(previs[filId] || [], antics) }));
      /* B09 · El primer èxit reinicia el comptador i lleva l'espera. */
      delete falladesAnticsRef.current[filId];
      setPaginacio((previs) => ({ ...previs, [filId]: { hiHaMes: antics.length >= LIMIT_PAGINA, carregant: false } }));
      return true;
    } catch (error) {
      if (!vigent(op)) return false;
      setAvis(error?.message || 'No s\'ha pogut carregar l\'historial.');
      /* Auditoria 261008 (B09) · Sense xarxa, la crida falla en mil·lisegons
         i l'observador de Conversa, que es tornava a crear amb `carregant`,
         la tornava a demanar a l'instant: un bucle de peticions. Cada fallada
         seguida porta ara una espera (esperaDeLHistorial) que l'observador
         respecta; a la tercera, o amb un error no reintentable, només el
         botó o la xarxa que torna. */
      const fallades = (falladesAnticsRef.current[filId] || 0) + 1;
      falladesAnticsRef.current[filId] = fallades;
      const espera = esperaDeLHistorial(fallades, error?.retriable === true);
      setPaginacio((previs) => ({ ...previs, [filId]: { hiHaMes: previs[filId]?.hiHaMes ?? true, carregant: false, espera } }));
      return false;
    } finally {
      /* La d'una operació avortada no esborra la que el relleu ja ha llançat. */
      if (carregantAnticsRef.current.get(filId) === op) carregantAnticsRef.current.delete(filId);
    }
  }, [joId, config, captura, vigent, carregaMissatges, mutaMissatges]);

  /* ── Càrrega inicial. `joId` a la clau: canviar de sessió recarrega. ──
     Decisió 1 · Una renovació també hi torna (carregaFils penja de l'operació),
     però sense passar per 'loading': la llista que ja es veu es queda fins que
     arriba la nova. L'estat de càrrega el posa la purga, només quan canvia
     l'àmbit (i el muntatge arrenca ja en 'loading'). */
  useEffect(() => {
    carregaFils();
  }, [joId, carregaFils]);

  /* Decisió 1 · L'historial cap arrere que la renovació ha tallat es torna a
     demanar amb l'operació nova. La paginació no ha eixit de «carregant»: ni
     el botó «Carrega'n més» ni l'espera d'obrir de Conversa no veuen cap salt. */
  useEffect(() => {
    if (tokenEstat !== token) return;
    for (const [filId, op] of [...carregantAnticsRef.current]) {
      if (!vigent(op)) carregaMesAntics(filId);
    }
  }, [tokenEstat, token, vigent, carregaMesAntics]);

  /* Auditoria 261008 (B09) · Quan torna la xarxa, l'historial cap arrere
     torna a provar: es lleva l'espera de tots els fils i l'observador de
     Conversa, si el sentinella encara és a la vista, el demana una vegada.
     El comptador de fallades es queda: si torna a fallar, només el botó. */
  const despertaAntics = useCallback(() => {
    setPaginacio((previs) => {
      const ids = Object.keys(previs).filter((id) => previs[id]?.espera);
      if (!ids.length) return previs;
      const nou = { ...previs };
      for (const id of ids) nou[id] = { hiHaMes: previs[id].hiHaMes, carregant: previs[id].carregant };
      return nou;
    });
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.addEventListener('online', despertaAntics);
    return () => window.removeEventListener('online', despertaAntics);
  }, [despertaAntics]);

  /* ── Obrir un fil: carregar-lo. La lectura la marca la interfície amb marcaVist. ── */
  const obriFil = useCallback((filId) => {
    if (vigent(captura())) setFilActiu(joId ? filId || null : null);
  }, [joId, captura, vigent]);

  useEffect(() => {
    const op = captura();
    if (!filActiu || tokenEstat !== token || !joId || !vigent(op)) return;
    carregaMissatges(filActiu);
  }, [filActiu, carregaMissatges, tokenEstat, token, joId, captura, vigent]);

  /* ── Sondeig de fils i del fil obert, amb el canal de temps real com a avís ── */
  useEffect(() => {
    const op = captura();
    if (!joId || tokenEstat !== token || !vigent(op)) return undefined;
    let viu = true;
    let temporitzador = null;
    let temporitzadorFil = null;
    let debounceVisibilitat = null;
    let subscripcio = null;
    let canalViu = false;
    let versioSub = 0;

    const amagat = () => typeof document !== 'undefined' && document.hidden;

    /* Una baixa fallida no tomba el xat: el sondeig continua i queda a la consola. */
    const donaDeBaixa = (sub) => {
      const avisa = (error) => console.warn('[Xat] No s’ha pogut tancar el canal de temps real.', error);
      try { Promise.resolve(unsubscribeFromXat(sub)).catch(avisa); } catch (error) { avisa(error); }
    };

    const desconnecta = () => {
      versioSub += 1;
      canalViu = false;
      if (subscripcio) {
        const antiga = subscripcio;
        subscripcio = null;
        donaDeBaixa(antiga);
      }
    };

    const connectaRealtime = () => {
      desconnecta();
      if (!viu || !vigent(op) || !filActiu || amagat()) return;
      const versio = versioSub;
      const alRebre = (error, dades) => {
        if (!viu || !vigent(op) || versio !== versioSub) return;
        if (error) { canalViu = false; return; }
        /* El canal només avisa: els missatges es demanen sempre per seq. */
        if (dades?.tipus === 'nous' && dades.filId === filActiu) carregaMissatges(filActiu);
      };
      let promesa;
      try {
        promesa = Promise.resolve(subscribeToXat(filActiu, alRebre, { ...config, signal: op.controller.signal }));
      } catch (error) {
        promesa = Promise.reject(error);
      }
      promesa.then((res) => {
        const sub = res?.subscription || null;
        if (!sub) return;
        if (viu && vigent(op) && versio === versioSub) {
          subscripcio = sub;
          canalViu = !res.error;
        } else {
          donaDeBaixa(sub);
        }
      }).catch(() => { canalViu = false; });
    };

    connectaRealtime();

    /* Auditoria 261007 (B) · Només una fallada espaia el tic; una càrrega
       superada (null) manté la cadència, com ja fa ticFil.
       Auditoria 261008 (B04) · Una fallada reintentable torna a provar aviat
       (2, 5, 10, 30 s i sostre de 60 s), no als 250 s.
       Revisió 261008 · L'espera es llig dels refs de l'última càrrega
       APLICADA, no del resultat del tic: així mana també quan la fallada ha
       vingut d'una altra crida o quan el tic ha quedat superat per una que
       ha fallat. Amb la pestanya amagada no es demana res: 25 s. */
    const esperaSeguent = () => (falladesLlistaRef.current > 0
      ? esperaDeLaLlista(falladesLlistaRef.current, reintentableLlistaRef.current)
      : MS_LLISTA);
    let tic = null;
    const arma = (ms) => {
      if (temporitzador) clearTimeout(temporitzador);
      temporitzador = setTimeout(tic, ms);
    };
    tic = async () => {
      if (!viu || !vigent(op)) return;
      if (temporitzador) clearTimeout(temporitzador);
      temporitzador = null;
      const visible = !amagat();
      if (visible) await carregaFils();
      if (viu && vigent(op)) arma(visible ? esperaSeguent() : MS_LLISTA);
    };

    /* Revisió 261008 (B04) · La càrrega inicial ja pot haver fallat quan
       s'arma el sondeig, i obrir una conversa el torna a armar enmig de
       l'espera curta: el primer tic no torna als 25 s. */
    arma(esperaSeguent());
    const reprograma = () => { if (viu && vigent(op)) arma(esperaSeguent()); };
    reprogramaLlistaRef.current = reprograma;

    const ticFil = async () => {
      if (!viu || !vigent(op) || !filActiu) return;
      if (temporitzadorFil) clearTimeout(temporitzadorFil);
      let ok = true;
      if (!amagat()) ok = await carregaMissatges(filActiu);
      if (viu && vigent(op)) {
        const base = canalViu ? MS_FIL_AMB_CANAL : MS_FIL;
        temporitzadorFil = setTimeout(ticFil, ok === false ? base * 6 : base);
      }
    };

    if (filActiu) temporitzadorFil = setTimeout(ticFil, MS_FIL);

    const desperta = () => {
      if (!viu || !vigent(op)) return;
      if (temporitzador) clearTimeout(temporitzador);
      tic();
      if (filActiu) {
        ticFil();
        connectaRealtime();
      }
    };

    const alCanviarVisibilitat = () => {
      if (debounceVisibilitat) clearTimeout(debounceVisibilitat);
      debounceVisibilitat = setTimeout(() => {
        if (!viu || !vigent(op)) return;
        if (amagat()) desconnecta();
        else desperta();
      }, 300);
    };
    const alTornarXarxa = () => { if (!amagat()) desperta(); };

    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', alCanviarVisibilitat);
    if (typeof window !== 'undefined') window.addEventListener('online', alTornarXarxa);

    return () => {
      viu = false;
      if (reprogramaLlistaRef.current === reprograma) reprogramaLlistaRef.current = null;
      if (temporitzador) clearTimeout(temporitzador);
      if (temporitzadorFil) clearTimeout(temporitzadorFil);
      if (debounceVisibilitat) clearTimeout(debounceVisibilitat);
      desconnecta();
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', alCanviarVisibilitat);
      if (typeof window !== 'undefined') window.removeEventListener('online', alTornarXarxa);
    };
  }, [joId, filActiu, carregaFils, carregaMissatges, tokenEstat, token, config, captura, vigent]);

  /* ── Enviament amb reintents: sempre el mateix id (XAT-A25) ── */
  const executaEnviament = useCallback(async (filId, id, cos, respostaA = null) => {
    const op = captura();
    if (!vigent(op)) return [];
    /* Una resposta porta l'id del missatge citat; el port ja l'accepta
       (enviaMissatge(filId, { id, text, respostaA })). Sense resposta, el cos
       és el de sempre. */
    const entrada = respostaA ? { id, text: cos, respostaA } : { id, text: cos };
    for (let intent = 0; ; intent += 1) {
      try {
        /* T63.2 · En un fil de pàgina que llegixes com a visitant, el primer missatge hi entra. */
        const visitant = esVisitant(visitantsRef.current, filId);
        const opcions = { ...config, signal: op.controller.signal };
        if (visitant) opcions.visitant = true;
        const desat = await enviaMissatge(filId, entrada, opcions);
        if (!vigent(op)) return [];
        if (visitant) {
          mutaVisitants((previs) => (previs[filId] ? { ...previs, [filId]: { ...previs[filId], participant: true } } : previs));
          carregaFils();
        }
        const definitiu = { ...mapejaMissatge(desat, joId), author: 'Jo' };
        mutaPendents((previs) => retiraPendent(previs, id));
        /* Auditoria 261007 (B) · Es pinta al magatzem, però el cursor de
           servidor (cursorRef) no es toca: el missatge d'un altre amb un seq
           anterior encara ha d'arribar per la lectura incremental. */
        mutaMissatges((previs) => ({ ...previs, [filId]: fusionaPerSeq(previs[filId] || [], [definitiu]) }));
        if (definitiu.seq != null) {
          ultimSeqAvisat.current[filId] = Math.max(ultimSeqAvisat.current[filId] || 0, definitiu.seq);
        }
        mutaFils((previs) => previs.map((f) => (f.id === filId ? actualitzaFilAmbMissatge(f, definitiu) : f)));
        return [definitiu];
      } catch (error) {
        if (!vigent(op)) return [];
        if (error?.retriable && intent < MAX_REINTENTS) {
          const seguir = await espera(esperaReintent(intent), op.controller.signal);
          if (!seguir || !vigent(op)) return [];
          continue;
        }
        /* Onada 6 · `codiError` deixa que la bombolla diga en la llengua de
           la interfície els codis SDP que té traduïts (errorsXat.js). */
        mutaPendents((previs) => actualitzaPendent(previs, id, {
          estatEnviament: 'error',
          error: error?.message || 'No s\'ha enviat.',
          codiError: error?.code || null
        }));
        return [];
      }
    }
  }, [joId, config, captura, vigent, mutaFils, mutaMissatges, mutaPendents, mutaVisitants, carregaFils]);

  /* ── Enviar: la bombolla es pinta abans de la xarxa (L4). No llança. ──
     D7 · Defensa en profunditat: a un fil on no es pot escriure (els Avisos
     per a qui no n'és administrador) no s'envia res ni es pinta cap bombolla.
     El Compositor ja no hi mostra el formulari i el servidor ho rebutja
     (SDP-XAT-011).
     `opcions.respostaA`: l'id del missatge al qual es respon (la cita de
     WhatsApp). */
  const sendChatMessage = useCallback(async (fil, text, opcions = {}) => {
    const op = captura();
    /* Relleu 261007 · Guardada d'abans d'una renovació: la versió vigent. */
    const delegada = op ? null : accioVigent('sendChatMessage');
    if (delegada) return delegada(fil, text, opcions);
    if (!joId || !vigent(op)) return [];
    if (fil?.potEscriure === false) return [];
    const filId = fil?.id;
    const cos = String(text ?? '').trim();
    if (!filId || !cos) return [];
    const respostaA = opcions?.respostaA ? String(opcions.respostaA) : null;

    const id = generaId();
    const pendent = {
      id,
      threadId: filId,
      seq: null,
      usuariId: joId,
      text: cos,
      tipus: 'text',
      sender: 'me',
      author: 'Jo',
      is_ai: false,
      creatAl: new Date().toISOString(),
      respostaA,
      esborrat: false,
      metadades: {},
      estatEnviament: 'pendent',
      error: null
    };
    mutaPendents((previs) => afigPendent(previs, filId, pendent));
    return executaEnviament(filId, id, cos, respostaA);
  }, [joId, captura, vigent, accioVigent, mutaPendents, executaEnviament]);

  /* ── Reintent manual d'una bombolla en error, amb el mateix id ── */
  const reintenta = useCallback(async (missatgeId) => {
    if (!joId || !vigent(captura())) return [];
    const trobat = trobaPendent(pendentsRef.current, missatgeId);
    if (!trobat || trobat.missatge.estatEnviament !== 'error') return [];
    mutaPendents((previs) => actualitzaPendent(previs, missatgeId, { estatEnviament: 'pendent', error: null, codiError: null }));
    return executaEnviament(trobat.filId, missatgeId, trobat.missatge.text, trobat.missatge.respostaA || null);
  }, [joId, captura, vigent, mutaPendents, executaEnviament]);

  const descartaFallit = useCallback((missatgeId) => {
    if (!vigent(captura())) return;
    const trobat = trobaPendent(pendentsRef.current, missatgeId);
    if (!trobat || trobat.missatge.estatEnviament !== 'error') return;
    mutaPendents((previs) => retiraPendent(previs, missatgeId));
  }, [captura, vigent, mutaPendents]);

  /* ── Marques de lectura (XAT-C08): local a l'instant, servidor agrupat ──
     Auditoria 261007 (B) · Una marca fallida torna a llançar després de
     l'avís: l'agrupador (missatges.js) l'ha de saber per a no donar-la per
     enviada i acceptar-la de nou en la lectura següent. Qui la crida fora de
     l'agrupador (marcaLlegides) s'ho empassa: l'avís ja s'ha pintat.
     Pendent del Mestre: amb una fallada PERSISTENT (RLS, servidor caigut) i
     la conversa a la vista, cada sondeig de la llista torna els no llegits
     del servidor, la lectura torna a marcar, falla i l'avís torna a tapar la
     llista. L'avís és el de sempre; el que canvia és que ara reapareix a
     cada sondeig en lloc de quedar-se una sola vegada amb la pastilla
     encallada. */
  const enviaMarca = useCallback(async (filId, seq) => {
    const op = captura();
    if (!vigent(op)) return;
    try {
      const res = await marcaLlegit(filId, { ...config, signal: op.controller.signal, llegitFinsSeq: seq });
      if (!vigent(op)) return;
      const confirmat = Number(res?.llegitFinsSeq);
      if (Number.isFinite(confirmat) && confirmat > 0) {
        mutaFils((previs) => previs.map((f) => (f.id === filId ? aplicaMarcaLocal(f, confirmat) : f)));
      }
    } catch (error) {
      if (vigent(op)) {
        setAvis(error?.message || 'No s\'ha pogut marcar com a llegit.');
        throw error;
      }
      /* Decisió 1 · Una marca en vol que la renovació ha tallat es torna a
         enviar amb l'operació nova: la conversa no es torna a muntar i la
         interfície no la tornaria a demanar fins que entrara una bombolla nova.
         Amb un altre àmbit, la fallada de sempre (l'agrupador ja s'ha cancel·lat).
         Relleu 261007 (revisió de seguretat de la Decisió 1, problema 1) · La
         versió vigent ix d'accionsRef amb la guarda de testimoni, comprovada
         en el mateix tic que la crida (accioDelRelleu), i no d'enviaMarcaRef,
         que després de l'await ja podria ser la d'una altra persona.
         Relleu 261007 (revisió de la correcció de seguretat, problema 2) · Pel
         mateix camí que creaFil (despresDelRelleu): una segona renovació entre
         mig torna a esperar el relleu. Sense acció vigent, l'error original. */
      return despresDelRelleu(op, accionsRef, 'enviaMarca', [filId, seq], () => { throw error; });
    }
  }, [config, captura, vigent, mutaFils]);
  /* L'agrupador crida sempre l'última enviaMarca, que passa captura(). */
  enviaMarcaRef.current = enviaMarca;

  const marcaVist = useCallback((filId, seq) => {
    if (!filId || !joId || !vigent(captura())) return;
    /* Un visitant no té marques al servidor: llegir no deixa rastre. */
    if (esVisitant(visitantsRef.current, filId)) return;
    const s = Number(seq) || 0;
    if (s <= 0) return;
    const fil = filsRef.current.find((f) => f.id === filId);
    if (fil && s <= (Number(fil.llegitFinsSeq) || 0)) return;
    if (!agrupador.current.marca(filId, s)) return;
    mutaFils((previs) => previs.map((f) => (f.id === filId ? aplicaMarcaLocal(f, s) : f)));
  }, [joId, captura, vigent, mutaFils]);

  /* ── «Seleccionar xats» → marcar com a llegides: la mateixa marca, per a
     diverses converses alhora. El «no llegit» manual s'apaga en local a
     l'instant i al servidor amb la marca fins a l'últim. Torna quantes. ── */
  const marcaLlegides = useCallback((filIds) => {
    if (!joId || !vigent(captura())) return 0;
    const ids = new Set((Array.isArray(filIds) ? filIds : [filIds]).filter((id) => id != null && id !== '').map(String));
    if (!ids.size) return 0;
    const tractades = [];
    for (const fil of filsRef.current) {
      if (!ids.has(String(fil.id)) || esVisitant(visitantsRef.current, fil.id)) continue;
      const ultim = Number(fil.ultimSeq) || 0;
      if (ultim > (Number(fil.llegitFinsSeq) || 0)) marcaVist(fil.id, ultim);
      /* La fallada ja s'ha avisat dins d'enviaMarca: ací no queda cap promesa rebutjada sense atendre. */
      else if (fil.noLlegitManual) enviaMarca(fil.id, ultim).catch(() => {});
      else continue;
      tractades.push(fil.id);
    }
    if (tractades.length) {
      mutaFils((previs) => previs.map((f) => (tractades.includes(f.id) && f.noLlegitManual ? { ...f, noLlegitManual: false } : f)));
    }
    return tractades.length;
  }, [joId, captura, vigent, marcaVist, enviaMarca, mutaFils]);

  /* ── El padró del poble ──
     NO es guarda a l'estat del context a propòsit: la llista només fa falta
     mentre el selector està obert. L'error puja perquè la interfície el pinte. */
  const cercaMembres = useCallback(
    async (text = null) => {
      const op = captura();
      if (!joId || !vigent(op)) return [];
      try {
        const reals = await carregaMembres(text, { ...config, signal: op.controller.signal });
        return vigent(op) ? reals || [] : [];
      } catch (error) {
        if (!vigent(op)) return [];
        throw error;
      }
    },
    [joId, config, captura, vigent]
  );

  /* ── Obrir conversa amb algú. Idempotent al servidor. ──
     Decisió 1 · Si una renovació la talla (abans o després de la llista), es
     torna a fer amb l'operació nova: el ?amb= i «Nova conversa» de XatSection
     ja no es tornen a muntar i, amb un null, la persona es quedaria sense
     conversa i sense avís. Guardada d'abans d'una renovació i cridada
     després, passa per la versió vigent (accioVigent, Relleu 261007). */
  const creaFil = useCallback(async (altreUsuariId, titol = null) => {
    const op = captura();
    const delegada = op ? null : accioVigent('creaFil');
    if (delegada) return delegada(altreUsuariId, titol);
    if (!joId || !vigent(op)) return null;
    try {
      const filId = await creaFilDirecte(altreUsuariId, titol, { ...config, signal: op.controller.signal });
      if (vigent(op)) {
        await carregaFils();
        if (vigent(op)) return filId;
      }
    } catch (error) {
      if (vigent(op)) throw error;
    }
    return despresDelRelleu(op, accionsRef, 'creaFil', [altreUsuariId, titol]);
  }, [joId, config, captura, vigent, accioVigent, carregaFils]);

  /* ── T63.2 i T67 · El xat comú d'una Pàgina Universal ──
     Null si el subjecte no en té; 'sense-capacitat' si el backend no el sap
     obrir. Els fils que encara no has escrit queden com a visitants.
     Decisió 1 · Una renovació que la talla la torna a fer amb l'operació nova:
     el ?sobre= de XatSection ja no es torna a muntar, i un null deia «Ací no
     hi ha cap xat comú on comentar» i tornava a la llista. Guardada d'abans
     d'una renovació, passa per la versió vigent (accioVigent, Relleu 261007). */
  const obriFilDePagina = useCallback(async (objecte) => {
    const op = captura();
    const delegada = op ? null : accioVigent('obriFilDePagina');
    if (delegada) return delegada(objecte);
    if (!joId || !vigent(op) || !subjecteDeXat(objecte)) return null;
    if (!teCapacitat('xatDePagina')) throw errorSenseCapacitat();
    try {
      const obert = await obriFilDePaginaAlBackend(objecte, { ...config, signal: op.controller.signal });
      if (vigent(op)) {
        if (!obert?.filId) return null;
        /* Un visitant no té marques: res no hi compta com a no llegit. */
        const visitats = (Array.isArray(obert.fils) ? obert.fils : []).map((f) => mapejaFil(f))
          .filter((f) => !f.participant).map((f) => ({ ...f, noLlegits: 0 }));
        if (visitats.length) mutaVisitants((previs) => ({ ...previs, ...Object.fromEntries(visitats.map((f) => [f.id, f])) }));
        await carregaFils();
        if (vigent(op)) return String(obert.filId);
      }
    } catch (error) {
      if (vigent(op)) throw error;
    }
    return despresDelRelleu(op, accionsRef, 'obriFilDePagina', [objecte]);
  }, [joId, config, captura, vigent, accioVigent, carregaFils, mutaVisitants]);
  /* Relleu 261007 (revisió de seguretat) · enviaMarca també: el seu relleu
     passa per la mateixa guarda de testimoni (accioDelRelleu). */
  accionsRef.current = { token, creaFil, obriFilDePagina, sendChatMessage, enviaMarca };

  /* ── Lectures derivades ── */
  /* Les converses i, al final, els fils de pàgina que llegixes com a visitant.
     Ordre del Mestre (261007) · Les files d'ajuda per defecte (perDefecte,
     xatsPerDefecte.js) que el port ha posat a la cua:
       · se'n va la que ja té el seu xat real entre els visitants (qui llig el
         xat públic de /iaia ja no veu la fila sintètica de la IAIA), sense
         afegir-ne cap: les afig, si cal, el port;
       · qui gestiona l'entitat pilot no veu la de Sóc de Poble: no pot obrir
         un xat amb ella mateixa (SDP-XAT-002). Ací i no a la llista, perquè
         la cerca global i la del xat lligen esta mateixa llista.
     En llavor no n'hi ha cap: la mateixa referència i la mateixa pantalla. */
  const gestionaSocDePoble = gestionaLEntitatPilot(identitats);
  /* Onada 6 (tasca 12) · Amb la IAIA apagada, cap xat seu (senseLaIAIA): la
     llista, les dues cerques i les comunitats lligen d'ací. */
  const filsDeLaLlista = useMemo(() => {
    const ids = new Set(fils.map((f) => f.id));
    const extra = Object.values(visitants).filter((f) => !ids.has(f.id));
    const ambAjuda = ambXatsPerDefecte(extra.length ? [...fils, ...extra] : fils, { afig: false });
    const llista = gestionaSocDePoble ? senseXatPerDefecte(ambAjuda, 'socdepoble') : ambAjuda;
    return iaiaApagada ? senseLaIAIA(llista) : llista;
  }, [fils, visitants, gestionaSocDePoble, iaiaApagada]);
  /* Integració Xat i Pobles (Onada 6, pla 261009_0245, ítem 4: «El fil de
     xat específic també es dirà 'Gent de la Torre'») · El xat d'un poble que
     és a les fitxes (useCoreContent) es diu com la seua gent a la llista, a
     les comunitats, a les cerques i a la capçalera de la conversa («Sobre:
     …»), també els fils que el servidor ja ha creat amb el nom del poble
     (pobles/xatDelPoble.js, filsAmbLaGentDelPoble). Presentació: les dades i
     el que va al servidor no es toquen. Sense fitxes, la mateixa llista. */
  const { towns } = useCoreContent();
  const filsVisibles = useMemo(() => filsAmbLaGentDelPoble(filsDeLaLlista, towns), [filsDeLaLlista, towns]);
  /* Els fils de la persona sense els de la IAIA, si està apagada: els no
     llegits i els contactes freqüents. La mateixa referència si no n'hi ha. */
  const filsComptats = useMemo(() => (iaiaApagada ? senseLaIAIA(fils) : fils), [fils, iaiaApagada]);
  /* Onada 6 (tasca 12) · Cert si `filId` és un xat de la IAIA que s'amaga
     perquè està apagada: XatSection en trau qui hi era dins, en lloc d'un 404. */
  const esFilAmagat = useCallback((filId) => {
    if (!iaiaApagada || filId == null || filId === '') return false;
    const id = String(filId);
    const fil = fils.find((f) => String(f.id) === id) || visitants[id];
    return esXatDeLaIAIA(fil);
  }, [iaiaApagada, fils, visitants]);

  const missatgesDerivats = useMemo(() => {
    const ids = new Set([...Object.keys(missatgesPerFil), ...Object.keys(pendentsPerFil)]);
    const resultat = {};
    for (const id of ids) {
      const fil = filsVisibles.find((f) => f.id === id);
      resultat[id] = combinaMissatges(missatgesPerFil[id] || [], pendentsPerFil[id] || [], fil?.llegitPelsAltresFinsSeq ?? 0);
    }
    return resultat;
  }, [missatgesPerFil, pendentsPerFil, filsVisibles]);

  /* Decisió 1 del Mestre (261007) · El que es VEU penja de l'àmbit de dades,
     no del testimoni d'operació. Amb un àmbit nou, res no es veu fins que la
     purga s'ha fet (`tokenEstat` encara és de l'àmbit anterior). Amb una
     renovació, ni el render del testimoni nou (abans de l'efecte) ni els
     següents buiden la llista, la conversa o el fil obert: res no es desmunta
     i Conversa no torna al fons. Els getters guardats d'un altre àmbit, o
     d'un proveïdor desmuntat, tornen buit (ARQ-H01). */
  const visible = tokenEstat?.ambit === ambitEstable && Boolean(joId);
  const dins = useCallback(
    () => visible && !desmuntat.current && ambitActual.current === ambitEstable,
    [visible, ambitEstable]
  );

  /* Torn 260930 (T1, «Gent de la Torre») · Una entrada automàtica (obrir el
     poble en arribar a /xat; des del 14-10, XAT-01, la fitxa de la seua
     comunitat i mai el General) es fa UNA sola vegada per sessió (pla
     2135, :116). El component que la dispara es torna a muntar cada vegada
     que es torna a /xat; este proveïdor viu per damunt de les rutes i
     sobreviu. Torna true només la primera vegada per a cada clau.
     Revisió adversarial 260930 (P1) · La clau era `scopeKey`: cada renovació
     del JWT (generacio+1) i cada canvi d'actor la feien nova, i el General es
     tornava a obrir sense que ningú l'haguera demanat. Ara penja de
     backend + persona. L'actor en queda fora a propòsit: l'entrada és
     l'ARRIBADA de la persona a l'amfitrió, no de cada màscara amb què actua
     dins de la sessió; passar de persona a entitat és un gest deliberat a
     mitja faena i segrestar-li /xat després és justament el defecte. La
     guarda només diu «ja s'ha fet», no guarda cap dada: compartir-la entre
     actors no revela res. */
  const entradesFetes = useRef(new Set());
  const consumixEntrada = useCallback((clau) => {
    const k = `${clauPersona}\n${String(clau)}`;
    if (entradesFetes.current.has(k)) return false;
    entradesFetes.current.add(k);
    return true;
  }, [clauPersona]);

  /* Eixir o entrar (canvia la persona, o el backend) és una sessió nova:
     l'entrada del poble es torna a fer i els esborranys de qui se n'ha anat
     s'obliden (esborranys.js promet buidar-los «en tancar la sessió», i fins
     ara no ho cridava ningú). Una renovació no hi arriba: `clauPersona` no
     porta `generacio`. La ref arrenca amb el valor del muntatge perquè el
     doble efecte de StrictMode no buide res. */
  const personaPrevia = useRef(clauPersona);
  useLayoutEffect(() => {
    if (personaPrevia.current === clauPersona) return;
    personaPrevia.current = clauPersona;
    entradesFetes.current = new Set();
    buidaEsborranys();
  }, [clauPersona]);

  const getThreadMessages = useCallback(
    (filId) => (dins() ? missatgesDerivats[filId] || [] : []),
    [missatgesDerivats, dins]
  );
  const hiHaMesAntics = useCallback(
    (filId) => (dins() ? Boolean(paginacio[filId]?.hiHaMes) : false),
    [paginacio, dins]
  );
  const carregantAntics = useCallback(
    (filId) => (dins() ? Boolean(paginacio[filId]?.carregant) : false),
    [paginacio, dins]
  );
  /* B09 · L'espera de l'historial cap arrere del fil (esperaDeLHistorial), o
     null si l'observador hi pot tornar a provar. */
  const esperaAntics = useCallback(
    (filId) => (dins() ? paginacio[filId]?.espera || null : null),
    [paginacio, dins]
  );
  const totalNoLlegits = useMemo(() => (visible ? sumaNoLlegits(filsComptats) : 0), [visible, filsComptats]);
  const comunitats = useMemo(() => (visible ? agrupaComunitats(filsVisibles) : CAP), [visible, filsVisibles]);
  const contactesFrequents = useMemo(() => (visible ? calculaContactesFrequents(filsComptats, null, joId) : CAP), [visible, filsComptats, joId]);
  const filAmagat = useCallback((filId) => (dins() ? esFilAmagat(filId) : false), [dins, esFilAmagat]);

  const value = useMemo(() => ({
    status: visible ? estat : joId ? 'loading' : 'ready',
    error: null,
    avis: visible ? avis : null,
    /* Auditoria 261008 (B04) · Si l'última càrrega de la llista ha anat bé, i
       l'avís no bloquejant d'una que ha fallat amb la llista conservada. */
    llistaFresca: visible ? llistaFresca : true,
    avisLlista: visible ? avisLlista : null,
    scopeKey,
    /* Revisió adversarial 260930 (P2) · La clau dels esborranys: backend +
       persona + actor, sense `generacio`. L'actor hi és: un text a mig
       escriure amb la veu d'una entitat no ha d'aparéixer, llest per a
       enviar, quan la mateixa persona torna a parlar com a ella mateixa. */
    ambitEstable,
    /* Qui és «jo» al xat (la cerca no el troba a ell mateix; el diàleg «Nova
       conversa» el pinta amb «(Tu)»). Null sense sessió en remot. */
    joId: visible ? joId : null,
    joNom: visible ? joNom : null,
    joAvatar: visible ? joAvatar : null,
    /* Pla 261014_1450 (front C) · L'entitat de la barra negra, només per a
       pintar-la (rail i compositor); null si actua com a persona. */
    entitatActiva: visible ? entitatActiva : null,
    /* Remot sense sessió, ja comprovat (mai mentre la sessió es comprova):
       ?sobre= porta a /registre en lloc de fer com si. */
    senseSessio: !joId && estatSessio !== 'comprovant',
    chatThreads: visible ? filsVisibles : [],
    chatMessages: visible && filActiu ? missatgesDerivats[filActiu] || [] : [],
    totalNoLlegits,
    filActiu: visible ? filActiu : null,
    getThreadMessages,
    hiHaMesAntics,
    carregantAntics,
    esperaAntics,
    carregaMesAntics,
    sendChatMessage,
    reintenta,
    descartaFallit,
    marcaVist,
    obriFil,
    creaFil,
    cercaMembres,
    recarrega: carregaFils,
    obriFilDePagina,
    comunitats,
    contactesFrequents,
    marcaLlegides,
    /* 'seed' | 'local' | 'remote': qui decidix si crear el grup del poble
       en entrar (en remot, només quan la persona hi prem). */
    modeDades,
    consumixEntrada,
    /* Onada 6 (tasca 12) · El nivell d'IA és 0 i la IAIA no apareix; i si un
       fil és un xat seu amagat per això. */
    iaiaApagada,
    esFilAmagat: filAmagat
  }), [visible, joId, joNom, joAvatar, entitatActiva, estatSessio, estat, avis, llistaFresca, avisLlista, scopeKey, ambitEstable, filsVisibles, missatgesDerivats,
    totalNoLlegits, filActiu, getThreadMessages, hiHaMesAntics, carregantAntics, esperaAntics, carregaMesAntics, sendChatMessage, reintenta, descartaFallit, marcaVist,
    obriFil, creaFil, cercaMembres, carregaFils, obriFilDePagina, comunitats, contactesFrequents, marcaLlegides,
    modeDades, consumixEntrada, iaiaApagada, filAmagat]);

  return (
    <XatContext.Provider value={value}>
      <AvisadorXat registra={registraAvisador} />
      {children}
    </XatContext.Provider>
  );
}

export function useXat() {
  return useContext(XatContext) || BUIT;
}
