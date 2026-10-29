import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  getCurrentUser, listMyOrganizations, updateOrganization, updateProfile,
  updateUserPassword, getProfile, teCapacitat, uploadToStorage,
  listMyAgents, updateAgent,
  llegeixContacteOrganitzacio, desaContacteOrganitzacio,
  llistaMembresOrganitzacio, desaMembreOrganitzacio, llevaMembreOrganitzacio, carregaMembres,
} from '../../data/backendPort.js';
import { creaOrganitzacio as creaOrganitzacioAlServei } from '../../data/organizations.js';
import { ERROR_POBLE_MASSA_LLARG, MAXIM_NOM_POBLE, pobleDOrganitzacio } from '../../data/pobleOrganitzacio.js';
import { hidrataPerfilPersonaPilot } from '../../data/identitatsSeed.js';
import { candidatsDeMembre } from './membresModel.js';
import { formataPoble } from './fitxaDePerfil.js';

import { useSession } from '../../app/contexts/SessionContext.jsx';
import { triaAvatar } from '../../app/contexts/personaDeSessio.js';
import { backendScope, normalizeBackendConfig } from '../../config/backendConfig.js';
import { imatgeLocalComDataUrl } from '../../utils/imageUtils.js';
import { garantixWebp } from '../../utils/pujadaImatge.js';
import { capturaSessio, entradaSessio } from '../../data/identitat.js';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { ambitDe } from '../../data/autodesament/ambit.js';
import { normalitzaContacte } from '../../data/correuOrganitzacio.js';
import { desaLlicenciaPerDefecte } from '../../components/universal/drets/herencia.js';
import { ENTITATS_FITXA } from './perfilEscriptor.js';
import { esRolQueMana, etiquetaDeRol } from '../../components/universal/identitat/rols.js';
import { ERROR_CORREU_INVALID, SENSE_CAPACITAT_CORREU, textAjudaCorreu, validaCorreu } from './contacteOrganitzacio.js';

const PerfilContext = createContext(null);

/* La capacitat 'agents' és nova al port: un backend (o un mock de proves) que
   no la declare no ha de fer caure el perfil ni en llegir-ne el nom. */
function agentsDelPort() {
  try { return typeof listMyAgents === 'function' ? listMyAgents : null; } catch { return null; }
}

/* T43 (ordre del Mestre, 260928) · El correu de l'organització és una
   capacitat opcional ('contacteOrganitzacio'): sense ella, cap crida, i
   «El compte» ho diu. Mateix blindatge que els agents. */
function contacteDelPort() {
  try {
    if (!teCapacitat('contacteOrganitzacio')) return null;
    return typeof llegeixContacteOrganitzacio === 'function' && typeof desaContacteOrganitzacio === 'function'
      ? { llegeix: llegeixContacteOrganitzacio, desa: desaContacteOrganitzacio }
      : null;
  } catch { return null; }
}

/* Ordre del Mestre (261008, grup C) · Els membres d'una organització són una
   capacitat opcional ('membresOrganitzacio'). Sense ella, o amb un mock
   parcial del port a les proves, cap crida: «Membres» i «Eixir» es pinten
   pendents. Mateix blindatge que el correu. Els candidats a persona membre
   ixen de carregaMembres, del nucli (el padró del poble). */
function membresDelPort() {
  try {
    if (!teCapacitat('membresOrganitzacio')) return null;
    return typeof llistaMembresOrganitzacio === 'function' && typeof desaMembreOrganitzacio === 'function'
      && typeof llevaMembreOrganitzacio === 'function' && typeof carregaMembres === 'function'
      ? { llista: llistaMembresOrganitzacio, desa: desaMembreOrganitzacio, lleva: llevaMembreOrganitzacio, cerca: carregaMembres }
      : null;
  } catch { return null; }
}

/* Com l'adaptador quan el servidor no té l'esquema: el mateix `code`. */
const errorSenseMembres = () => Object.assign(
  new Error('El servidor d’este poble encara no gestiona els membres de les organitzacions.'),
  { code: 'NO-DISPONIBLE' },
);

/* La configuració del port amb el senyal de cancel·lació, si n'hi ha. */
const ambSenyal = (config, signal) => (signal ? { ...config, signal } : config);

/* Ordre del Mestre (261008, grup C) · El poble d'una organització
   (organizations.town_name, 2610081401): el NOM del poble, amb el mateix
   límit que el CHECK del servidor.
   Gauntlet 261016 (Bloc 3.5.2; ordre del Mestre: «El poble és innegociable»)
   · DEROGAT «l'opció buida és sense poble (null)»: l'edició ja no pot buidar
   el poble d'una organització. La regla és la de l'alta, una sola font
   (data/pobleOrganitzacio.js), i el text buit és un error amb un missatge
   clar, abans de cap crida. */
const valorDePoble = pobleDOrganitzacio;

/* Pla 261018_1605 (Tasca 2, D5; ordre del Mestre, 18-10-2026) · El poble (o
   els pobles) d'una persona: la cadena canònica 'A · B' (formataPoble), mai
   buida i amb el límit de sempre (MAXIM_NOM_POBLE caràcters de veres, la
   columna sencera). Llança abans de cap crida. */
export const ERROR_SENSE_POBLE_PERSONA = 'Cal indicar almenys un poble: tria’n un.';
export function valorDePoblePersona(valor) {
  const nom = formataPoble(valor);
  if (!nom) throw new Error(ERROR_SENSE_POBLE_PERSONA);
  if ([...nom].length > MAXIM_NOM_POBLE) throw new Error(ERROR_POBLE_MASSA_LLARG);
  return nom;
}

/* L'estat del correu d'una organització quan la lectura falla. Un esquema
   absent (NO-DISPONIBLE) es diu amb el motiu de l'adaptador, mai l'error cru. */
function contacteFallat(error) {
  if (error?.code === 'NO-DISPONIBLE') return { estat: 'no-disponible', motiu: error.message };
  if (error?.code === 'SDP-ORGMAIL-001') return { estat: 'no-disponible', motiu: 'Només qui administra aquesta organització pot vore el seu correu.' };
  return { estat: 'error', motiu: 'No s’ha pogut llegir el correu de l’organització. Torna-ho a provar més tard.' };
}

export function usePerfil() {
  const ctx = useContext(PerfilContext);
  if (!ctx) throw new Error('usePerfil fora de PerfilProvider');
  return ctx;
}

/* Grup C (261008) · El context, o null fora de PerfilProvider: «El compte» també
   es pinta sense el Perfil (proves de la barra taronja), i llavors la gestió
   de membres es queda pendent. */
export function usePerfilOpcional() {
  return useContext(PerfilContext);
}

/* ═══════════════════════════════════════════════════════════════════
   CATÀLEG D'AJUSTOS

   Cada fila declara si està oberta i, si no ho està, per què. La
   interfície no pot prometre res que el contracte del servidor no
   complisca: un botó que fa `permission denied` en silenci és pitjor
   que una fila desactivada amb el motiu escrit.

   `tipus` diu QUIN giny pinta DetallAjust ('text' | 'area' |
   'password' | 'imatge' | 'boolean' | 'visibilitat' | 'correu' |
   'selector' | 'llicencia' | 'accio'). 'visibilitat' (encàrrec
   d'harmonització, 261018) és un booleà amb les dues eixides explicades:
   true, perfil públic; false, privat. La UI mai més endevina per l'id: afegir un
   ajust nou d'un tipus que ja hi és no requereix tocar DetallAjust. Un
   'selector' porta les seues `opcions`; una 'llicencia' (pla 261016),
   el copyright desat, i DetallAjust hi obri CopyrightPage.

   `pendent` (només accions) = el backend encara no la té: es pinta
   desactivada i honesta, mai prometuda.

   `lloc` diu on viu l'ajust: 'fitxa' (el pinta l'Editor Universal de
   PerfilEditor) o 'compte' (formularis de DetallCompte).
   ═══════════════════════════════════════════════════════════════════ */

/**
 * Onada 11 (261010; prompt 261010_1730, tasca 2) · `superadmin`: només per a
 * qui ho és, dos ajustos més al compte: el segon factor (TOTP) i l'entrada al
 * Tauler. Van DINS d'«El compte» (PerfilShell.test.jsx fixa els apartats del
 * Perfil: cap de nou). Sense superadmin, el catàleg és el d'abans, fila a fila.
 *
 * Pla 261018_1605 (Tasques 1 i 2, D3 i D5; ordre del Mestre, 18-10-2026) ·
 * La persona tria els seus pobles a l'ajust `poble` (`multiple`): un o més,
 * NOMÉS del catàleg (`towns` del contingut core: «El poble és innegociable»),
 * desats a la columna de sempre com la cadena canònica 'A · B' (formataPoble;
 * el primer és el principal). Les `opcions` són el catàleg sense el valor
 * desat: els pobles triats es pinten a part (DetallAjust) i un poble de fora
 * del catàleg no s'hi pot tornar a afegir. I naix amb el perfil públic
 * (`is_public == null ? true : Boolean(is_public)`, D1).
 */
export function ajustosPersona(perfil = {}, { superadmin = false, pobles = [] } = {}) {
  const pobleActual = formataPoble(perfil.town_name);
  return [
    { id: 'nom', lloc: 'fitxa', titol: 'Nom', camp: 'full_name', tipus: 'text', valor: perfil.full_name || '', obert: true },
    { id: 'avatar', lloc: 'fitxa', titol: 'Foto de perfil', camp: 'avatar_url', tipus: 'imatge', valor: perfil.avatar_url || '', obert: true },
    { id: 'poble', lloc: 'compte', titol: 'Poble', camp: 'town_name', tipus: 'selector', multiple: true,
      valor: pobleActual,
      opcions: opcionsDePoble(pobles),
      ajuda: 'Només els pobles del Mas. El primer de la llista és el teu poble principal.',
      obert: !perfil.baixa_demanada_at && perfil.reserva !== true,
      motiu: perfil.baixa_demanada_at
        ? 'Tens una baixa en curs: el perfil està congelat. Es desfà cancel·lant-la a «Privacitat i dades».'
        : perfil.reserva === true
          ? 'No s’ha pogut llegir el compte del servidor: el poble es pot canviar quan es torne a llegir.'
          : undefined },
    { id: 'correu', lloc: 'compte', titol: 'Correu electrònic', tipus: 'text', valor: perfil.email || '', obert: false,
      motiu: 'El correu identifica el compte. Es canvia des d’Accedir.' },
    /* Amb una baixa en curs el servidor té el perfil congelat (política
       «profiles sense baixa»), com la fitxa: cap desat arribaria.
       Pla 261018_1605 (Tasca 1, D3) · Sense `is_public`, pública (D1). Amb la
       fila de reserva (getProfile: el servidor no s'ha pogut llegir), tancat
       com els drets de sèrie: una tria a cegues trepitjaria la de veres.
       L'avís de la fitxa pública el pinta DetallAjust (AVIS_FITXA_PUBLICA). */
    { id: 'privacitat', lloc: 'compte', titol: 'Estat del perfil', camp: 'is_public', tipus: 'visibilitat',
      casella: 'Perfil públic',
      valor: perfil.is_public == null ? true : Boolean(perfil.is_public),
      obert: !perfil.baixa_demanada_at && perfil.reserva !== true,
      motiu: perfil.baixa_demanada_at
        ? 'Tens una baixa en curs: el perfil està congelat. Es desfà cancel·lant-la a «Privacitat i dades».'
        : perfil.reserva === true
          ? 'No s’ha pogut llegir el compte del servidor: l’estat es podrà canviar quan es torne a llegir.'
          : undefined },
    /* Pla 261016 (Bloc 3.1; ordre del Mestre) · Els drets de sèrie de les notes
       de la persona: la fitxa ja no en tria (Directiva de Dignitat Humana, pla
       261015_1900), i es trien ací. La columna de sempre (profiles.copyright,
       T39): guardarAjust la desa i, si ix bé, també la preferència d'este
       dispositiu (herencia.js). Tancat amb una baixa en curs (perfil congelat,
       com l'estat) i amb la fila de reserva (getProfile: no porta la columna,
       i una tria a cegues trepitjaria la de veres). */
    { id: 'drets-notes', lloc: 'compte', titol: 'Drets de sèrie de les meues notes', camp: 'copyright', tipus: 'llicencia',
      valor: typeof perfil.copyright === 'string' ? perfil.copyright : '',
      obert: !perfil.baixa_demanada_at && perfil.reserva !== true,
      motiu: perfil.baixa_demanada_at
        ? 'Tens una baixa en curs: el perfil està congelat. Es desfà cancel·lant-la a «Privacitat i dades».'
        : perfil.reserva === true
          ? 'No s’ha pogut llegir el compte del servidor: els drets de sèrie de les notes es poden triar quan es torne a llegir.'
          : undefined },
    { id: 'contrasenya', lloc: 'compte', titol: 'Contrasenya', tipus: 'password', valor: '******', obert: true },
    /* Onada 11 (261010) · El segon factor i el Tauler, abans de «Tancar sessió». */
    ...(superadmin ? [
      { id: 'segon-factor', lloc: 'compte', titol: 'Segon factor', tipus: 'accio', accio: 'segon-factor', obert: true },
      { id: 'panell-superadmin', lloc: 'compte', titol: 'Panell de superadministració', tipus: 'accio', accio: 'obrir-admin', obert: true },
    ] : []),
    { id: 'sessio', lloc: 'compte', titol: 'Tancar sessió', tipus: 'accio', accio: 'logout', obert: true },
  ];
}

/**
 * T43 (ordre del Mestre, 260928) · Els dos ajustos del correu opcional de
 * l'organització. El VALOR només arriba a qui l'administra i només quan el
 * servidor l'ha llegit: DetallAjust pinta el valor d'un ajust tancat, i un
 * membre no l'ha de vore mai (RGPD, minimització).
 */
function ajustosCorreu(mana, contacte) {
  const tancat = 'Només qui administra aquesta organització ho pot canviar.';
  const llest = mana && contacte?.estat === 'llest';
  const motiu = !mana ? tancat
    : contacte?.estat === 'carregant' || !contacte ? 'Carregant el correu de l’organització…'
      : contacte.motiu || SENSE_CAPACITAT_CORREU;
  const correu = llest ? contacte.correu || '' : '';
  return [
    { id: 'correu', lloc: 'compte', titol: 'Correu de l’organització', tipus: 'correu', valor: correu,
      obert: llest, motiu, ajuda: llest ? textAjudaCorreu(contacte.perDefecte) : undefined },
    { id: 'correu-public', lloc: 'compte', titol: 'Correu a la fitxa pública', tipus: 'boolean',
      casella: 'Mostrar el correu a la fitxa pública',
      valor: llest ? Boolean(contacte.public) : false,
      obert: llest && Boolean(correu),
      motiu: llest ? 'Primer desa un correu de l’organització.' : motiu,
      ajuda: llest
        ? 'Si el mostres, qualsevol que obri la fitxa el podrà llegir. Per a parlar amb l’organització sempre queda el xat.'
        : undefined },
  ];
}

/**
 * Ordre del Mestre (261008, grup C) · Les opcions del selector del poble
 * d'una organització: l'opció buida (sense poble), els pobles del node
 * (`towns` del contingut core, pel `title`) per ordre alfabètic, i el valor
 * desat (`actual`) encara que ja no siga a la llista, perquè desar un altre
 * ajust no el perda. El valor de cada opció és el NOM del poble, el que es
 * desa a organizations.town_name. Pura.
 */
export function opcionsDePoble(towns = [], actual = '') {
  const noms = new Set();
  for (const town of Array.isArray(towns) ? towns : []) {
    const nom = typeof town?.title === 'string' ? town.title.trim() : '';
    if (nom) noms.add(nom);
  }
  const desat = typeof actual === 'string' ? actual.trim() : '';
  if (desat) noms.add(desat);
  return [
    { valor: '', etiqueta: 'Tria un poble…' },
    ...[...noms].sort((a, b) => a.localeCompare(b, 'ca')).map((nom) => ({ valor: nom, etiqueta: nom })),
  ];
}

/**
 * Grup C (261008) · `pobles`: els pobles del node per al selector del poble.
 * `ambMembres`: si el port gestiona els membres ('membresOrganitzacio');
 * sense, «Membres» i «Eixir» es pinten pendents, com abans.
 */
export function ajustosOrganitzacio(org = {}, contacte = org.contacte, { pobles = [], ambMembres = false } = {}) {
  const mana = esRolQueMana(org.role);
  const tancat = 'Només qui administra aquesta organització ho pot canviar.';
  return [
    { id: 'nom', lloc: 'fitxa', titol: 'Nom', camp: 'name', tipus: 'text', valor: org.name || '', obert: mana, motiu: tancat },
    { id: 'avatar', lloc: 'fitxa', titol: 'Foto / Logotip', camp: 'logo_url', tipus: 'imatge', valor: org.logo_url || '', obert: mana, motiu: tancat },
    { id: 'lema', lloc: 'fitxa', titol: 'Lema', camp: 'lema', tipus: 'text', valor: org.lema || '', obert: mana, motiu: tancat },
    { id: 'descripcio', lloc: 'fitxa', titol: 'Descripció', camp: 'description', tipus: 'area', valor: org.description || '', obert: mana, motiu: tancat },
    /* Ordre del Mestre (261008) · el poble de l'organització, el que porta la
       barra taronja. Obert segons el rol, no segons la llista de pobles. */
    { id: 'poble', lloc: 'compte', titol: 'Poble', camp: 'town_name', tipus: 'selector', valor: org.town_name || '',
      opcions: opcionsDePoble(pobles, org.town_name), obert: mana, motiu: tancat },
    ...ajustosCorreu(mana, contacte),
    /* P1-11 (pla 261024_2230, T5B-03; G2230-04 de Gemini) · Els membres
       viuen a la seua vista, «Membres i connexions» (lloc 'membres'), fora
       d'«El compte». GestioMembres ja hi porta el veïnat connectat
       (QuiSegueixOrganitzacio): una sola llista. */
    { id: 'membres', lloc: 'membres', titol: 'Membres', tipus: 'accio', accio: 'membres', pendent: !ambMembres, obert: mana, motiu: tancat },
    { id: 'identificador', lloc: 'compte', titol: 'Identificador', tipus: 'text', valor: org.slug || '', obert: false,
      motiu: 'L’identificador és permanent: hi ha enllaços publicats que hi apunten.' },
    /* Pendent fins a I7: hui la ruta pública no troba cap organització real. */
    { id: 'fitxa', lloc: 'compte', titol: 'Fitxa pública', tipus: 'accio', accio: 'obrir-fitxa', pendent: true,
      valor: `/${org.kind === 'group' ? 'grup' : 'empresa'}/${org.slug}`, obert: true },
    { id: 'eixir', lloc: 'compte', titol: 'Eixir de l’organització', tipus: 'accio', accio: 'eixir', pendent: !ambMembres,
      obert: org.role !== 'owner',
      motiu: 'Qui és propietari no pot eixir-se’n: primer ha de traspassar la propietat.' },
  ];
}

/**
 * `onCanviOrganitzacions` s'avisa quan es crea o es modifica una
 * organització: PerfilShell hi passa el refresh d'IdentitatContext perquè
 * el selector d'identitat no quede desfasat fins a recarregar.
 */
/* P1-68 · Columnes de la fila del perfil que no van mai a user_metadata. */
const CAMPS_FORA_DE_LES_METADADES = new Set(['username', 'username_confirmat_at']);
/* QA-H01 (auditoria 261028_1611) · El comodí de l'alta sense confirmar
   («veina», «veina-2», «veina-1a2b3c4d»): l'únic @usuari que el disparador de
   2610282100 regenera quan el nom de veres arriba després (Apple). La mateixa
   expressió que el SQL. */
const RE_USUARI_COMODI = /^veina(-[0-9a-f]+)?$/;
const teUsuariComodi = (fila) => typeof fila?.username === 'string'
  && RE_USUARI_COMODI.test(fila.username) && !fila.username_confirmat_at;
/* L'@usuari d'una fila del servidor, o null si no el porta: una base sense
   2610282100 no té la columna, i no se n'inventa cap. */
const usuariDeLaFila = (fila) => (typeof fila?.username === 'string'
  ? { username: fila.username, username_confirmat_at: fila.username_confirmat_at ?? null }
  : null);
/* Una fila de la persona de la sessió (sense id, la del port), mai la de reserva. */
const esFilaDe = (fila, usuariId) => Boolean(fila) && !fila.reserva
  && (fila.id == null || String(fila.id) === String(usuariId));
/* El que diu un desat del nom aterra damunt del comodí sense confirmar o, si
   ja ve confirmat (una altra pestanya l'ha triat), damunt de qualsevol
   @usuari sense confirmar: el servidor només lleva la confirmació en l'alta
   (INSERT). Una resposta tardana no desfà mai un @usuari triat ni el torna
   del regenerat al comodí. */
const prevalDerivat = (fila, derivat) => teUsuariComodi(fila)
  || (!fila?.username_confirmat_at && Boolean(derivat.username_confirmat_at));
const ambUsuariDerivat = (fila, derivat) => (derivat && prevalDerivat(fila, derivat) ? { ...fila, ...derivat } : fila);

export function PerfilProvider({ children, config = {}, onCanviOrganitzacions }) {
  /* L'àmbit és l'ENTRADA, no la generació del servei: la renovació horària del JWT
     mou la generació però és la mateixa sessió, i desmuntar ací perdria el que
     s'estava escrivint a la fitxa. useSession fa que es torne a calcular. */
  const { currentUser } = useSession();
  const scope = JSON.stringify([currentUser?.id, entradaSessio(), backendScope(config), config.auth?.issuer]);
  return (
    <PerfilScope key={scope} config={config} usuariId={currentUser?.id ?? null} usuariSessio={currentUser ?? null} onCanviOrganitzacions={onCanviOrganitzacions}>
      {children}
    </PerfilScope>
  );
}

/* T47 · La clau d'una fila confirmada per la cua: la persona és una sola
   (l'editor li diu 'jo'); una organització o un agent, pel seu id. */
const clauConfirmada = (entitat, id) => (entitat === ENTITATS_FITXA.persona ? entitat : `${entitat}\u0000${String(id)}`);
/* QA-H01 · L'@usuari derivat d'un desat del nom, a banda de les columnes
   escrites: damunt de la lectura, amb la mateixa regla del comodí. */
const CLAU_USUARI_DERIVAT = `${ENTITATS_FITXA.persona}\u0000@usuari`;
const ambConfirmades = (confirmades, entitat, fila) => {
  const canvis = fila ? confirmades.get(clauConfirmada(entitat, fila.id)) : null;
  const ambCanvis = canvis ? { ...fila, ...canvis } : fila;
  return entitat === ENTITATS_FITXA.persona ? ambUsuariDerivat(ambCanvis, confirmades.get(CLAU_USUARI_DERIVAT)) : ambCanvis;
};

function PerfilScope({ children, config, usuariId, usuariSessio, onCanviOrganitzacions }) {
  /* capturaSessio: eixir, tornar a entrar o canviar de compte avorten; renovar, no. */
  const [owner] = useState(capturaSessio);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const assertCurrent = useCallback(() => {
    if (!mounted.current) throw new DOMException('La sessió del perfil ha canviat.', 'AbortError');
    owner();
  }, [owner]);
  /* T47 (ordre del Mestre, 260928) · L'àmbit dels esborranys de la fitxa:
     backend + la persona de la sessió de React, la mateixa id que la clau de
     PerfilProvider (que el remunta si canvia la sessió o el backend). No es
     llig del port: amb el JWT caducat mentre es renova, getCurrentUser() diu
     null i els esborranys anirien a un àmbit que cap sessió no té. */
  const [ambit] = useState(() => ambitDe(config, usuariId));
  const [usuari, setUsuari] = useState(null);
  const [dadesPerfil, setDadesPerfil] = useState(null);
  const [organitzacions, setOrganitzacions] = useState([]);
  /* Lògica d'Usuari (T4): els agents IA que la persona administra (la IAIA). */
  const [agents, setAgents] = useState([]);
  /* T43 (ordre del Mestre, 260928) · El correu de cada organització que la
     persona administra: { [orgId]: { estat, correu, public, perDefecte, motiu } }.
     Viu a banda de les identitats: la fitxa (l'editor) no canvia quan arriba. */
  const [contactes, setContactes] = useState({});
  /* Grup C (261008) · Els membres de les organitzacions: el port, si en sap
     (una vegada per àmbit; el PerfilProvider el remunta si canvia el backend). */
  const [portMembres] = useState(membresDelPort);
  const ambMembres = Boolean(portMembres);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState(null);

  /* `config` canvia d'identitat a cada render del pare. El patró del
     "ref actual" ens deixa usar-la dins dels callbacks sense fer-los
     inestables. */
  const configRef = useRef(config);
  configRef.current = config;
  const avisaRef = useRef(onCanviOrganitzacions);
  avisaRef.current = onCanviOrganitzacions;
  /* T47 (correcció de la revisió, 260928) · Amb el JWT caducat en muntar, el
     port diu «ningú» fins que la renovació aterra: la persona de la sessió de
     React (la mateixa id, la clau del PerfilProvider) és la reserva, i «El
     compte» mostra el correu sense esperar la pròxima lectura. */
  const usuariSessioRef = useRef(usuariSessio);
  usuariSessioRef.current = usuariSessio;
  /* Grup C · Les organitzacions i la persona d'ara, per a les accions de
     membres sense fer-les inestables a cada lectura. */
  const organitzacionsRef = useRef(organitzacions);
  organitzacionsRef.current = organitzacions;
  const usuariRef = useRef(usuari);
  usuariRef.current = usuari;
  const avisaOrganitzacions = useCallback(() => {
    try { avisaRef.current?.(); } catch (e) { console.warn('[PerfilContext] Avís d’organitzacions:', e); }
  }, []);

  /* `recarrega` torna a llegir perfil i organitzacions sense tornar a la
     pantalla de càrrega (p. ex. després de cancel·lar una baixa, quan el
     servidor ha restaurat el perfil). */
  const [versioDades, setVersioDades] = useState(0);
  const recarrega = useCallback(() => setVersioDades((v) => v + 1), []);

  /* T47 (ordre del Mestre, 260928) · Les columnes que la cua confirma MENTRE
     es llig el perfil. La lectura pot ser d'abans del PATCH: aplicada tal
     qual, trepitjaria el que el servidor ja té, i l'esborrany ja s'ha oblidat
     perquè està confirmat (l'editor naixeria amb el valor vell: «l'entradilla
     s'ha esborrat»). Es fusionen damunt de la lectura. null fora de càrrega. */
  const confirmadesRef = useRef(null);

  // Cada scope té estat propi: el pare el desmunta en canviar sessió o backend.
  useEffect(() => {
    let viu = true;
    const confirmades = new Map();
    confirmadesRef.current = confirmades;
    const tancaCaptura = () => { if (confirmadesRef.current === confirmades) confirmadesRef.current = null; };
    const usuariInicial = getCurrentUser() ?? usuariSessioRef.current ?? null;
    setUsuari(usuariInicial);

    /* Els agents són una capacitat opcional: sense ella, cap crida i cap grup.
       Una fallada seua no tomba el perfil (llista buida i avís a la consola). */
    const llistaAgentsDelPort = agentsDelPort();
    const agentsPromesa = llistaAgentsDelPort && teCapacitat('agents')
      ? Promise.resolve().then(() => llistaAgentsDelPort(configRef.current)).catch((e) => {
        console.warn('[PerfilContext] Agents IA no disponibles:', e?.message);
        return [];
      })
      : Promise.resolve([]);
    /* T47 · Els esborranys d'este dispositiu es carreguen en la mateixa espera
       que el perfil: l'editor no es pinta fins que els té, i així cap
       esborrany arriba tard damunt d'un camp que ja s'està escrivint (A2). */
    Promise.all([
      listMyOrganizations(configRef.current),
      getProfile(configRef.current),
      agentsPromesa,
      cuaDesament.hidrata(),
    ])
      .then(([orgs, perfil, llistaAgents]) => {
        if (!viu) return;
        assertCurrent();
        tancaCaptura();
        /* Pla 261018_1605 (Tasca 0, D7) · La fila de la persona pilot, amb les
           dades canòniques on no en porta (hidrataPerfilPersonaPilot ja diu si
           ho és: per l'id, el slug o el correu acreditat, mai pel nom). La
           resta de files, tal qual. */
        const perfilBase = hidrataPerfilPersonaPilot(perfil, usuariInicial);
        setOrganitzacions(Array.isArray(orgs) ? orgs.map((o) => ambConfirmades(confirmades, ENTITATS_FITXA.organitzacio, o)) : []);
        setAgents(Array.isArray(llistaAgents) ? llistaAgents.map((a) => ambConfirmades(confirmades, ENTITATS_FITXA.agent, a)) : []);
        setDadesPerfil(ambConfirmades(confirmades, ENTITATS_FITXA.persona, perfilBase));
        setError(null);
        /* El que va quedar pendent (una eixida sense xarxa, una pestanya
           tancada) torna a eixir ara, amb la sessió d'esta persona. */
        if (ambit) {
          cuaDesament.recordaContext(ambit, configRef.current);
          cuaDesament.repren(ambit);
        }
      })
      .catch((e) => {
        tancaCaptura();
        if (viu) setError(e?.message || "No s'han pogut carregar les dades del perfil.");
      })
      .finally(() => {
        if (viu) setCarregant(false);
      });

    return () => { viu = false; tancaCaptura(); };
  }, [assertCurrent, versioDades, ambit]);

  /* T43 · Les organitzacions que la persona administra, com a clau estable:
     només quan canvien es torna a llegir el correu. Un membre no el llig mai. */
  const orgsQueMana = useMemo(
    () => organitzacions.filter((o) => esRolQueMana(o.role)).map((o) => String(o.id)).join('\u0000'),
    [organitzacions],
  );
  useEffect(() => {
    const ids = orgsQueMana ? orgsQueMana.split('\u0000') : [];
    /* T43b-4 · Si ja no n'administra cap, el correu d'abans no es guarda (RGPD). */
    if (!ids.length) {
      setContactes((previ) => (Object.keys(previ).length ? {} : previ));
      return undefined;
    }
    const port = contacteDelPort();
    if (!port) {
      setContactes(Object.fromEntries(ids.map((id) => [id, { estat: 'no-disponible', motiu: SENSE_CAPACITAT_CORREU }])));
      return undefined;
    }
    let viu = true;
    setContactes((previ) => Object.fromEntries(ids.map((id) => [id, previ[id] || { estat: 'carregant' }])));
    for (const id of ids) {
      Promise.resolve()
        .then(() => port.llegeix(id, configRef.current))
        .then((contacte) => {
          if (!viu) return;
          assertCurrent();
          setContactes((previ) => ({ ...previ, [id]: { estat: 'llest', ...normalitzaContacte(contacte) } }));
        })
        .catch((e) => {
          if (!viu || e?.name === 'AbortError') return;
          setContactes((previ) => ({ ...previ, [id]: contacteFallat(e) }));
        });
    }
    return () => { viu = false; };
  }, [orgsQueMana, versioDades, assertCurrent]);

  /* La fila de `profiles` no porta el correu: el pren de la sessió perquè
     «El compte» el puga mostrar. */
  const dadesPersona = useMemo(() => (
    dadesPerfil && !dadesPerfil.email && usuari?.email ? { ...dadesPerfil, email: usuari.email } : dadesPerfil
  ), [dadesPerfil, usuari]);

  const identitats = useMemo(() => ([
    {
      id: 'jo',
      mena: 'persona',
      nom: dadesPerfil?.full_name || usuari?.user_metadata?.name || usuari?.user_metadata?.full_name || 'El meu compte',
      /* Pla 261014_1450, front B · La mateixa regla que la barra i el Xat
         (triaAvatar, personaDeSessio.js): la pujada a Sóc de Poble abans que
         la de Google, i sense cap, null. Sense `picture` a propòsit:
         aplicaColumnes no la lleva de la còpia local en esborrar la foto, i
         la de Google hi tornaria. */
      avatar: triaAvatar(dadesPerfil?.avatar_url, usuari?.user_metadata?.avatar_url),
      rol: 'Persona',
      dades: dadesPersona,
    },
    ...organitzacions.map((o) => ({
      id: o.id,
      mena: o.kind === 'group' ? 'grup' : 'empresa',
      nom: o.name,
      avatar: o.logo_url,
      rol: etiquetaDeRol(o.role) || 'Membre',
      dades: o,
    })),
    ...agents.map((a) => ({
      id: a.id,
      mena: 'agent',
      nom: a.name,
      avatar: a.avatar_url,
      rol: 'Agent IA',
      dades: a,
    })),
  ]), [usuari, organitzacions, agents, dadesPerfil, dadesPersona]);

  /* ⚰️ ELIMINAT (auditoria): identitatId, ajustId, triaIdentitat,
     triaAjust, identitat, ajustos i ajust. Era el sistema de navegació
     paral·lel que la plantilla ja havia substituït però seguia viu i
     descrivint-se com a vigent — i va fer que guardarAjust escriguera
     a la identitat equivocada. La selecció viu al Manager; este context
     només dóna DADES i ACCIONS. */

  /* T47 (ordre del Mestre, 260928) · Una escriptura confirmada fusiona NOMÉS
     les columnes que ha escrit, mai la fila sencera que torna el servidor:
     la resposta tardana d'un desat (el PATCH de l'H2 espera el PUT de
     GoTrue) portava el lema d'abans i tornava enrere l'entradilla ja desada. */
  const aplicaColumnes = useCallback((entitat, id, canvis) => {
    /* Mentre es llig el perfil, la confirmació també s'anota per a fusionar-la
       damunt de la lectura (confirmadesRef). Sense fila encara, no se n'inventa
       cap de parcial: l'estat buit es queda buit. */
    const captura = confirmadesRef.current;
    if (captura) {
      const clau = clauConfirmada(entitat, id);
      captura.set(clau, { ...captura.get(clau), ...canvis });
    }
    if (entitat === ENTITATS_FITXA.persona) {
      setDadesPerfil((prev) => (prev ? { ...prev, ...canvis } : prev));
      /* P1-68 · L'@usuari i la seua confirmació són columnes de la fila, mai
         metadades del compte (user_metadata va dins del JWT): no s'hi copien. */
      const metadades = Object.fromEntries(Object.entries(canvis).filter(([camp]) => !CAMPS_FORA_DE_LES_METADADES.has(camp)));
      setUsuari((prev) => (prev ? {
        ...prev,
        user_metadata: {
          ...(prev.user_metadata || {}),
          ...metadades,
          name: Object.hasOwn(canvis, 'full_name') ? canvis.full_name : prev.user_metadata?.name,
        },
      } : prev));
    } else if (entitat === ENTITATS_FITXA.agent) {
      setAgents((prev) => prev.map((a) => (String(a.id) === String(id) ? { ...a, ...canvis } : a)));
    } else {
      setOrganitzacions((prev) => prev.map((o) => (String(o.id) === String(id) ? { ...o, ...canvis } : o)));
      avisaOrganitzacions();
    }
  }, [avisaOrganitzacions]);

  /* QA-H01 (auditoria 261028_1611) · Desar el nom pot moure també l'@usuari:
     el disparador de 2610282100 regenera el comodí sense confirmar quan arriba
     el nom de veres. Es pren de la resposta del desat si el porta; si no, i
     només amb el comodí a la fitxa, es rellig la fila. Sense la migració la
     fitxa no té username: cap lectura i cap columna. Un canvi de sessió pel
     camí (assertCurrent) o la fila d'una altra persona no aterren, i
     l'@usuari no va a user_metadata (només a la fila). De millor esforç: el
     nom ja és desat, cap fallada d'ací el desfà i ningú no l'espera. */
  const dadesPerfilRef = useRef(dadesPerfil);
  dadesPerfilRef.current = dadesPerfil;
  const reconciliaUsuari = useCallback(async (canvis, fila) => {
    if (!Object.hasOwn(canvis, 'full_name')) return;
    if (fila && !esFilaDe(fila, usuariId)) return;
    let derivat = usuariDeLaFila(fila);
    if (!derivat) {
      if (!teUsuariComodi(dadesPerfilRef.current)) return;
      try {
        assertCurrent();
        const rellegida = await getProfile(configRef.current);
        assertCurrent();
        derivat = esFilaDe(rellegida, usuariId) ? usuariDeLaFila(rellegida) : null;
      } catch (e) {
        if (e?.name !== 'AbortError') console.warn('[PerfilContext] No s’ha pogut rellegir l’@usuari:', e?.message);
        return;
      }
      if (!derivat) return;
    }
    const captura = confirmadesRef.current;
    if (captura) {
      const previ = captura.get(CLAU_USUARI_DERIVAT);
      if (!previ || prevalDerivat(previ, derivat)) captura.set(CLAU_USUARI_DERIVAT, derivat);
    }
    setDadesPerfil((prev) => (prev ? ambUsuariDerivat(prev, derivat) : prev));
  }, [assertCurrent, usuariId]);

  /* T47 · El que confirma la cua d'autodesament (encara que l'editor ja no
     hi siga) arriba ací, i la fitxa el veu en tornar a obrir-se. QA-H01 · El
     nom de la fitxa (el títol) també hi ix: s'hi reconcilia l'@usuari. */
  useEffect(() => {
    if (!ambit) return undefined;
    return cuaDesament.quanConfirma((confirmat) => {
      if (confirmat.ambit !== ambit) return;
      aplicaColumnes(confirmat.entitat, confirmat.id, confirmat.canvis);
      if (confirmat.entitat === ENTITATS_FITXA.persona) void reconciliaUsuari(confirmat.canvis, confirmat.fila);
    });
  }, [ambit, aplicaColumnes, reconciliaUsuari]);

  const guardarCampPerfil = useCallback(async (camp, valor, identitatObjectiuId) => {
    assertCurrent();
    if (identitatObjectiuId == null) {
      throw new Error('guardarCampPerfil: falta la identitat objectiu (tercer paràmetre, OBLIGATORI).');
    }
    const objectiu = identitats.find((item) => item.id === identitatObjectiuId);
    if (!objectiu) {
      throw new Error(`Identitat desconeguda: ${String(identitatObjectiuId)}`);
    }

    if (objectiu.mena === 'persona') {
      const desat = camp === 'town_name' ? valorDePoblePersona(valor) : valor;
      const fila = await updateProfile({ [camp]: desat }, configRef.current);
      assertCurrent();
      /* P1-68 · L'@usuari el normalitza i el confirma la RPC: es fusiona el que
         torna (l'identificador i username_confirmat_at), no el que s'ha teclejat.
         Sense, «Et proposem» tornava en remuntar l'editor fins a recarregar. */
      const canvis = camp === 'username' && typeof fila?.username === 'string'
        ? { username: fila.username, username_confirmat_at: fila.username_confirmat_at ?? null }
        : { [camp]: desat };
      aplicaColumnes(ENTITATS_FITXA.persona, objectiu.id, canvis);
      /* QA-H01 · El nom tardà mou el comodí: la fitxa pren l'@usuari nou
         (reconciliaUsuari només mira el nom). Sense esperar-lo: una relectura
         lenta no reté el desat, que ja és fet. */
      void reconciliaUsuari(canvis, fila);
    } else if (objectiu.mena === 'agent') {
      await updateAgent(objectiu.id, { [camp]: valor }, configRef.current);
      assertCurrent();
      aplicaColumnes(ENTITATS_FITXA.agent, objectiu.id, { [camp]: valor });
    } else {
      /* Gauntlet 261016 (Bloc 3.5.2) · Cap camí d'edició buida el poble d'una
         organització: tampoc qui desa la columna directament. */
      const desat = camp === 'town_name' ? valorDePoble(valor) : valor;
      await updateOrganization(objectiu.id, { [camp]: desat }, configRef.current);
      assertCurrent();
      aplicaColumnes(ENTITATS_FITXA.organitzacio, objectiu.id, { [camp]: desat });
    }
  }, [identitats, assertCurrent, aplicaColumnes, reconciliaUsuari]);

  /* Signatura TRENCADORA a propòsit: guardarAjust(identitat, ajust, valor). */
  const guardarAjust = useCallback(async (identitatObjectiuId, ajustId, valor) => {
    assertCurrent();
    const objectiu = identitats.find((i) => i.id === identitatObjectiuId);
    if (!objectiu) throw new Error(`Identitat desconeguda: ${String(identitatObjectiuId)}`);

    if (objectiu.mena === 'agent') throw new Error('Un agent IA només té fitxa: s’edita des de «La fitxa».');
    const contacte = objectiu.mena === 'persona' ? null : contactes[String(objectiu.id)];
    const cataleg =
      objectiu.mena === 'persona'
        ? ajustosPersona(objectiu.dades || {})
        : ajustosOrganitzacio(objectiu.dades || {}, contacte, { ambMembres });
    const ajust = cataleg.find((a) => a.id === ajustId);
    if (!ajust) throw new Error(`Ajust desconegut: ${String(ajustId)}`);
    if (!ajust.obert) throw new Error(ajust.motiu || 'Aquest ajust no es pot modificar.');
    if (ajust.tipus === 'accio') throw new Error("Les accions s'executen: no es desen.");

    if (objectiu.mena === 'persona' && ajust.id === 'contrasenya') {
      await updateUserPassword(valor, configRef.current);
      assertCurrent();
      return;
    }
    /* T43 · El correu de l'organització no és una columna de la fitxa: es
       desa amb la capacitat 'contacteOrganitzacio', correu i «públic» junts.
       Sense correu no hi ha res a publicar. */
    if (objectiu.mena !== 'persona' && (ajust.id === 'correu' || ajust.id === 'correu-public')) {
      const port = contacteDelPort();
      if (!port) throw new Error(SENSE_CAPACITAT_CORREU);
      const correu = ajust.id === 'correu' ? String(valor ?? '').trim() : contacte?.correu || '';
      if (correu && !validaCorreu(correu)) throw new Error(ERROR_CORREU_INVALID);
      const esPublic = (ajust.id === 'correu-public' ? Boolean(valor) : Boolean(contacte?.public)) && Boolean(correu);
      const desat = await port.desa(objectiu.id, { correu, public: esPublic }, configRef.current);
      assertCurrent();
      setContactes((previ) => ({ ...previ, [String(objectiu.id)]: { estat: 'llest', ...normalitzaContacte(desat) } }));
      return;
    }
    if (!ajust.camp) {
      throw new Error(`L'ajust "${ajust.id}" no té camp associat al catàleg.`);
    }
    /* Grup C (261008) · El poble d'una organització o d'una persona es desa pel nom.
       Gauntlet 261016 (Bloc 3.5.2) · L'opció buida ja no és «sense poble»:
       és un error amb missatge clar, i no es crida res. */
    const valorDesat = ajust.id === 'poble'
      ? (objectiu.mena === 'persona' ? valorDePoblePersona(valor) : valorDePoble(valor))
      : valor;
    await guardarCampPerfil(ajust.camp, valorDesat, objectiu.id);
    /* Pla 261016 (Bloc 3.1) · Els drets de sèrie de les notes, ja desats al
       servidor: també la preferència d'este dispositiu, la que llig «CREAR
       NOTA» (llicenciaDeLActor), per l'id de la fila i mai 'jo'. Si el
       servidor el rebutja, guardarCampPerfil ja ha llançat i no se'n toca res. */
    if (objectiu.mena === 'persona' && ajust.id === 'drets-notes') desaLlicenciaPerDefecte(objectiu.dades?.id, valorDesat);
  }, [identitats, contactes, guardarCampPerfil, assertCurrent, ambMembres]);

  const creaOrganitzacio = useCallback(async (dades) => {
    assertCurrent();
    const creada = await creaOrganitzacioAlServei(dades, configRef.current, organitzacions);
    assertCurrent();
    /* El servidor pot tornar l'entitat existent en un reintent. Conservem
       el seu rol i una sola fila, sense convertir qui administra en propietari. */
    const anterior = organitzacions.find((org) => org.id === creada.id);
    const nova = { ...anterior, ...creada, role: creada.role || anterior?.role || 'owner' };
    setOrganitzacions((prev) => prev.some((org) => org.id === nova.id)
      ? prev.map((org) => org.id === nova.id ? { ...org, ...nova } : org)
      : [...prev, nova]);
    avisaOrganitzacions();
    return nova;
  }, [assertCurrent, avisaOrganitzacions, organitzacions]);

  const pujaMitja = useCallback(async (fitxer, carpeta = 'avatars') => {
    assertCurrent();
    /* Encàrrec 261018 (ordre del Mestre: «desar la capçalera i l'avatar no pot
       fallar») · En mode de proves (la persona pilot i tota sessió de la
       llavor) la imatge no puja enlloc: es desa a la fitxa local com a data URL
       dels mateixos bytes, com les imatges del Bloc (NotesEditor). Abans anava
       a uploadToStorage, que exigix un usuari i un poble del servidor (UUID) i
       rebutjava la persona pilot ('0001'): «Poble o usuari invàlid». La guarda
       del servidor no s'afluixa: el pilot no hi envia mai res. */
    if (normalizeBackendConfig(configRef.current).dataMode === 'seed') {
      const dataUrl = await imatgeLocalComDataUrl(fitxer);
      assertCurrent();
      return dataUrl;
    }
    if (!teCapacitat('mitjans')) return null;
    /* Pla 261022_1645 · A Storage, cap JPEG ni PNG nou: la guarda el passa a
       WebP si el navegador en sap fer (pujadaImatge.js · garantixWebp). */
    const perPujar = await garantixWebp(fitxer);
    assertCurrent();
    const res = await uploadToStorage(perPujar, { carpeta }, configRef.current);
    assertCurrent();
    return res.url;
  }, [assertCurrent]);

  /* ═══ Grup C (ordre del Mestre, 261008) · ELS MEMBRES D'UNA ORGANITZACIÓ ═══
     Alta directa (sense invitació); la persona pot «Eixir»; una organització
     membre no hereta cap permís i només l'afig qui administra totes dues;
     només la propietària nomena, degrada o lleva administradores; la llista
     només la veuen owner i admin. Les regles les fa complir el port; ací,
     la sessió vigent (assertCurrent) abans i després de cada crida. */
  const llistaMembres = useCallback(async (orgId, { signal } = {}) => {
    assertCurrent();
    if (!portMembres) throw errorSenseMembres();
    const llista = await portMembres.llista(orgId, ambSenyal(configRef.current, signal));
    assertCurrent();
    return Array.isArray(llista) ? llista : [];
  }, [assertCurrent, portMembres]);

  const desaMembre = useCallback(async (orgId, membre) => {
    assertCurrent();
    if (!portMembres) throw errorSenseMembres();
    const desat = await portMembres.desa(orgId, membre, configRef.current);
    assertCurrent();
    return desat;
  }, [assertCurrent, portMembres]);

  const llevaMembre = useCallback(async (orgId, membre) => {
    assertCurrent();
    if (!portMembres) throw errorSenseMembres();
    const resultat = await portMembres.lleva(orgId, membre, configRef.current);
    assertCurrent();
    /* «Eixir» (el propi id): ja no n'és membre, i l'organització deixa el
       Perfil i el selector d'identitat sense esperar cap recàrrega. */
    const jo = usuariRef.current?.id;
    if (membre?.tipus === 'persona' && jo != null && String(membre.id) === String(jo)) {
      setOrganitzacions((prev) => prev.filter((o) => String(o.id) !== String(orgId)));
      avisaOrganitzacions();
    }
    return resultat;
  }, [assertCurrent, portMembres, avisaOrganitzacions]);

  /* Persones del poble (carregaMembres, el padró del nucli) i organitzacions
     que la persona també administra, sense les que ja en són membres. */
  const cercaCandidats = useCallback(async (orgId, text, { signal, membres = [] } = {}) => {
    assertCurrent();
    if (!portMembres) throw errorSenseMembres();
    const cerca = String(text ?? '').trim();
    const persones = await portMembres.cerca(cerca || null, ambSenyal(configRef.current, signal));
    assertCurrent();
    return candidatsDeMembre({
      persones, organitzacions: organitzacionsRef.current, membres, orgId, text: cerca, jo: usuariRef.current?.id ?? null,
    });
  }, [assertCurrent, portMembres]);

  /* Valor memoitzat + callbacks estables: els consumidors (i els
     useCallback que en depenguin) només es mouen quan canvien DADES,
     no quan canvia la identitat d'una funció. */
  /* T47 · On deixa l'editor els esborranys de la fitxa: l'àmbit i la
     configuració amb què la cua els enviarà (només en memòria). */
  const autodesament = useMemo(() => (ambit ? { ambit, context: config } : null), [ambit, config]);

  /* Grup C · `ambMembres`: si el port gestiona els membres (CONTRACTE-4:
     PerfilShell el passa a «El compte»). */
  const valor = useMemo(() => ({
    usuari, identitats, contactes, carregant, error, autodesament,
    guardarCampPerfil, guardarAjust, creaOrganitzacio, pujaMitja, recarrega,
    ambMembres, llistaMembres, desaMembre, llevaMembre, cercaCandidats,
  }), [usuari, identitats, contactes, carregant, error, autodesament, guardarCampPerfil, guardarAjust, creaOrganitzacio, pujaMitja, recarrega,
    ambMembres, llistaMembres, desaMembre, llevaMembre, cercaCandidats]);

  return <PerfilContext.Provider value={valor}>{children}</PerfilContext.Provider>;
}
