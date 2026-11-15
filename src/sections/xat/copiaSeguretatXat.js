/**
 * copiaSeguretatXat.js — la peça pura entre el xat i el motor `.sdpbackup`
 * (src/data/xat/copiaSeguretatPortatil.js) per a la pàgina «Còpia de
 * seguretat» dels Ajustos del Xat (Onada R28, pla 261115_0135, Lot C3).
 *
 * Sense React ni xarxa. Este mòdul no canvia el motor: ací només es decidix
 * QUÈ li arriba i COM es diu a la persona el que torna.
 *
 * ── Què entra a la còpia (Llei 0: el que este dispositiu té, i res més) ──
 * El xat no guarda cap DTO cru: XatContext només té els fils i les bombolles
 * de la vista (mapejaFil i mapejaMissatge de missatges.js). Ací es tornen a la
 * forma del DTO que el motor admet (la seua llista blanca), camp a camp i
 * només amb el que la vista conserva. No s'hi inventa cap nom ni cap títol: el
 * que la vista ha perdut (les dates d'arxivat, fixat o silenci, l'org amb què
 * s'escriu, la data d'edició, el nom de l'entitat d'un missatge propi) no hi va.
 * Límits coneguts (Llei 0): alguns valors els calcula la vista i no es poden
 * separar del servidor, i hi van tal com són: ultimAl (si falta, l'actualització
 * del fil; nul en un directe bloquejat), noLlegits (comptat amb les seq; 0 al xat
 * personal i als bloquejats), el tipus «directe» per defecte i subjecte.titol, que
 * filsAmbLaGentDelPoble reescriu amb el nom de la gent del poble.
 * Onada R28 · copia-xat-05 · El xat de la IAIA la vista el vestix (vestixLaIAIA,
 * cridada a supabase/xat.js): el títol «IAIA MarIA» i la seua cara en lloc dels
 * del servidor. Eixe títol i eixa imatge no hi van (titolDelServidor, dtoDeFil).
 *   · Fils: tots els de chatThreads, que no són les files que pinta la llista
 *     (la llista amaga els arxivats, els de dins de les comunitats, el xat
 *     públic de la pàgina de la IAIA i els directes sense missatges, i la
 *     còpia sí que els porta; el text desaAbast ho diu), menys les files d'ajuda que
 *     sintetitza el backend (`perDefecte`), el xat de mostra de només lectura
 *     amb Javi (`fake-javi`, filDeMostraDeJavi: no és cap fil del servidor),
 *     les comunitats (contenidors sense missatges), els fils de visitant
 *     (`participant: false`: encara no hi ets) i els que tenen un id que el
 *     motor no admetria. Amb la IAIA apagada, els seus xats ja no són a la
 *     llista (senseLaIAIA) i tampoc no hi van.
 *   · Missatges: els que la vista té carregats de cada fil en esta sessió
 *     (getThreadMessages: pàgines de 50, LIMIT_PAGINA, i els nous que arriben
 *     o que l'entrega en segon pla descarrega), només els confirmats pel
 *     servidor (amb `seq`) i que han eixit de mapejaMissatge (porten el
 *     `threadId` del seu fil: una bombolla de mostra sintètica, com
 *     missatgesDeMostraDeJavi, no en porta): ni els pendents ni els fallits,
 *     ni els esborrats (la vista no en guarda la data), ni els d'una persona
 *     bloquejada (la vista no en té el text). Una seq repetida dins d'un fil
 *     es queda amb la primera.
 *   · Cap reserva de la vista com si fora una dada: el títol només quan la
 *     vista no l'ha pogut inventar (vegeu titolDelServidor), i el nom de
 *     l'autor mai és la reserva «Veí» de mapejaMissatge.
 *   · Cap adjunt: les fotos, els àudios i els vídeos no són a la vista, i el
 *     motor no admet cap URL. La pàgina ho diu.
 *
 * ── L'àmbit de la còpia ──
 * El motor exigix `usuariId` i `tenantId`, i en importar els compara amb la
 * sessió activa. `usuariId` és `joId` (la persona, també quan actua com una
 * entitat). `tenantId` ix de l'àmbit de dades del xat (`ambitEstable`, la
 * clau backendScope de config/backendConfig.js): el tenant del poble si la
 * configuració en porta; si no, el backend, el mode i l'amfitrió. Sense
 * persona o amb un àmbit que no es pot llegir: null, i la pàgina no oferix
 * res.
 */
import {
  CODI_ARXIU_NO_DESAT,
  CODI_BASE_ABSENT,
  CODI_CADENA_DIVERGENT,
  CODI_CLAU_FEBLE,
  CODI_CLAU_INCORRECTA,
  CODI_COPIA_CORRUPTA,
  CODI_DEGRADACIO,
  CODI_IDENTITAT_DIVERGENT,
  CODI_LIMIT_SUPERAT,
  CODI_MATERIAL_SENSIBLE,
  CODI_NONCE_REPETIT,
  MIN_CARACTERS_CONTRASENYA,
  teCriptoPerALaCopia,
} from '../../data/xat/copiaSeguretatPortatil.js';
import { AJUDA_PER_CLAU, ID_FIL_DE_MOSTRA_DE_JAVI, esXatDeLaIAIA } from '../../data/xatsPerDefecte.js';

const CAP = Object.freeze([]);
const RESERVA = (_clau, reserva) => reserva;

/** Els textos de la còpia: parells [clau i18n, text en valencià]. */
export const TEXTOS_COPIA = Object.freeze({
  senseCompte: ['section.xat.copia.senseCompte', 'Entra al xat amb el teu compte per a fer o comprovar una còpia.'],
  contrasenya: ['section.xat.copia.contrasenya', 'Contrasenya de la còpia'],
  contrasenyaAjuda: ['section.xat.copia.contrasenya.ajuda', 'Almenys {n} caràcters. Apunta-la en un lloc segur: sense ella la còpia no es pot obrir.'],
  repetix: ['section.xat.copia.contrasenya.repetix', 'Repetix la contrasenya'],
  ull: ['section.login.registre.ullContrasenya', 'Mostra la contrasenya'],
  ullRepetida: ['section.xat.copia.contrasenya.ullRepetida', 'Mostra la contrasenya repetida'],
  usuari: ['section.xat.copia.usuari', 'Còpia del xat de Sóc de Poble'],
  recompte: ['section.xat.copia.recompte', 'Converses: {fils} · Missatges: {missatges}'],
  /* Onada R28 · copia-xat-05 · El que fa filEntraALaCopia, no el que pinta la
     llista: les converses on participes (també les que la llista amaga), i no
     les de visitant. Frases curtes (copia-xat-03). */
  desaAbast: ['section.xat.copia.desa.abast', 'Hi van totes les converses on participes: també les arxivades, les de dins de les comunitats i les que encara no tenen cap missatge. Per això el recompte pot no coincidir amb les files de la llista. De cada conversa hi van només els missatges que este dispositiu ha carregat en esta sessió. En obrir una conversa se’n carreguen els 50 últims, i 50 més cada vegada que en carregues de més antics. L’app també pot descarregar sola els nous d’algunes converses. Una conversa de la qual no s’ha carregat cap missatge (normalment, una que no has obert en esta sessió) hi va sense missatges: només amb els noms i l’últim missatge de la llista. No hi van les fotos, els àudios, els vídeos, els missatges que encara no s’han enviat, els esborrats ni els de persones que has bloquejat. Tampoc no hi van els xats de pàgines que només has llegit, ni els xats de la IAIA si la tens apagada.'],
  desaBuit: ['section.xat.copia.desa.buit', 'Este dispositiu encara no té cap conversa carregada: no hi ha res per a copiar.'],
  /* Onada R28 · copia-xat-03 · Converses sí, però cap missatge carregat. */
  desaSenseMissatges: ['section.xat.copia.desa.senseMissatges', 'Encara no s’ha carregat cap missatge. La còpia només portaria la llista de converses, amb els noms i l’últim missatge de cada una. Obri les converses que vols guardar i torna ací.'],
  desaAmbMissatges: ['section.xat.copia.desa.ambMissatges', 'Converses amb missatges carregats: {amb} de {fils}'],
  desaPrepara: ['section.xat.copia.desa.prepara', 'Prepara la còpia'],
  desaPreparant: ['section.xat.copia.desa.preparant', 'Xifrant la còpia… Pot tardar uns segons.'],
  desaFetTitol: ['section.xat.copia.desa.fet.titol', 'Còpia xifrada preparada'],
  desaPreparada: ['section.xat.copia.desa.preparada', 'Ara prem «{boto}» per a guardar l’arxiu de la còpia.'],
  desaArxiu: ['section.xat.copia.desa.arxiu', 'Desa l’arxiu'],
  desaComparteix: ['section.xat.copia.desa.comparteix', 'Comparteix l’arxiu'],
  desaFetDescarrega: ['section.xat.copia.desa.fet.descarrega', 'Ha començat la descàrrega de l’arxiu {nom}. Busca’l a la carpeta de descàrregues d’este dispositiu.'],
  desaFetSelector: ['section.xat.copia.desa.fet.selector', 'S’ha desat l’arxiu de la còpia on has triat.'],
  desaFetComprova: ['section.xat.copia.desa.fet.comprova', 'Per a assegurar-te que s’obri, prova-la a «Comprova una còpia» amb la mateixa contrasenya.'],
  desaFetCompartir: ['section.xat.copia.desa.fet.compartir', 'S’ha obert el full per a compartir l’arxiu {nom}. Si l’has guardat, ja tens la còpia.'],
  desaCancellat: ['section.xat.copia.desa.cancellat', 'Has cancel·lat: no s’ha desat cap arxiu.'],
  desaNatiu: ['section.xat.copia.desa.natiu', 'En l’app d’este mòbil no es pot desar l’arxiu de la còpia. Obri el xat al navegador per a fer-la.'],
  comprovaAbast: ['section.xat.copia.comprova.abast', 'Tria un arxiu .sdpbackup i escriu la seua contrasenya. Es comprova en este dispositiu: no es restaura res ni es canvia cap conversa.'],
  comprovaArxiu: ['section.xat.copia.comprova.arxiu', 'Arxiu de la còpia'],
  comprovaTria: ['section.xat.copia.comprova.tria', 'Tria l’arxiu'],
  comprovaCapArxiu: ['section.xat.copia.comprova.capArxiu', 'Cap arxiu triat'],
  comprovaArxiuTriat: ['section.xat.copia.comprova.arxiuTriat', 'Arxiu triat: {nom}'],
  comprovaBoto: ['section.xat.copia.comprova.boto', 'Comprova la còpia'],
  comprovaComprovant: ['section.xat.copia.comprova.comprovant', 'Comprovant la còpia… Pot tardar uns segons.'],
  comprovaFetTitol: ['section.xat.copia.comprova.fet.titol', 'La còpia s’obri i està intacta'],
  comprovaFetPeriode: ['section.xat.copia.comprova.fet.periode', 'Missatges del {des} al {fins}'],
  comprovaFetCreada: ['section.xat.copia.comprova.fet.creada', 'Còpia feta el {data}'],
  senseRestaurar: ['section.xat.copia.senseRestaurar', 'Restaurar una còpia dins de l’app encara no és possible: ara la pots desar i comprovar.'],
  errorCurta: ['section.xat.copia.error.curta', 'La contrasenya ha de tindre almenys {n} caràcters.'],
  errorDiferents: ['section.xat.copia.error.diferents', 'Les dues contrasenyes no són iguals.'],
  errorBuida: ['section.xat.copia.error.buida', 'Escriu la contrasenya de la còpia.'],
  errorSenseArxiu: ['section.xat.copia.error.senseArxiu', 'Tria primer l’arxiu de la còpia.'],
  errorIncorrecta: ['section.xat.copia.error.incorrecta', 'Esta contrasenya no obri la còpia, o l’arxiu s’ha modificat. Comprova les majúscules i els accents.'],
  errorCorrupta: ['section.xat.copia.error.corrupta', 'Este arxiu no és una còpia del xat de Sóc de Poble o està fet malbé.'],
  errorFormat: ['section.xat.copia.error.format', 'Esta còpia és d’un format que no s’admet: antic o sense xifrar.'],
  errorAltreCompte: ['section.xat.copia.error.altreCompte', 'Esta còpia és d’un altre compte o d’un altre poble.'],
  errorPart: ['section.xat.copia.error.part', 'Esta còpia només porta els canvis des d’una altra i no es pot comprovar tota sola.'],
  errorArxiuMassaGran: ['section.xat.copia.error.arxiuMassaGran', 'L’arxiu està buit o és massa gran per a ser una còpia del xat.'],
  errorCopiaMassaGran: ['section.xat.copia.error.copiaMassaGran', 'La còpia seria massa gran per a un sol arxiu. No s’ha desat res.'],
  errorMaterial: ['section.xat.copia.error.material', 'No s’ha fet la còpia: hi ha dades que no poden eixir d’este dispositiu. No s’ha desat res.'],
  errorAtzar: ['section.xat.copia.error.atzar', 'Este dispositiu no ha donat prou atzar per a xifrar: no s’ha fet cap còpia. Torna-ho a provar.'],
  errorNoDesat: ['section.xat.copia.error.noDesat', 'No s’ha pogut desar l’arxiu en este dispositiu. No s’ha guardat res.'],
  /* Onada R28 · copia-xat-04 · Dos errors que reintentar no arregla. */
  errorSenseCripto: ['section.xat.copia.error.senseCripto', 'Este navegador no deixa xifrar en esta pàgina. Sense xifrar no es pot fer ni comprovar cap còpia. Sol passar quan l’adreça no comença per https: obri Sóc de Poble en una adreça segura.'],
  errorDades: ['section.xat.copia.error.dades', 'No s’ha pogut fer la còpia: algunes dades d’este dispositiu tenen una forma que la còpia no admet. No s’ha desat res.'],
  errorGeneric: ['section.xat.copia.error.generic', 'No s’ha pogut fer. Torna-ho a provar.'],
});

/** Un text amb els seus marcadors {nom} omplits. El valor entra amb una funció:
 *  una cadena com a segon argument de replace interpretaria $&, $' i $$. */
export function textAmb(parell, t = RESERVA, valors = {}) {
  let text = t(parell[0], parell[1]);
  for (const [nom, valor] of Object.entries(valors)) text = text.split(`{${nom}}`).join(String(valor));
  return text;
}

/* ── L'àmbit ─────────────────────────────────────────────────────────── */

const PREFIX_BACKEND = 'backend:';
const MAX_TENANT = 200;

function hostDe(endpoint) {
  if (typeof endpoint !== 'string' || !endpoint) return '';
  try {
    return new URL(endpoint).host;
  } catch {
    return '';
  }
}

/**
 * L'àmbit de la còpia, { usuariId, tenantId }, o null. `ambitEstable` és la
 * clau de dades de XatContext: JSON de [backendScope(config), joId, actorKey].
 */
export function abastDeLaCopia({ joId = null, ambitEstable = '' } = {}) {
  const usuariId = typeof joId === 'string' ? joId.trim() : '';
  if (!usuariId || typeof ambitEstable !== 'string' || !ambitEstable) return null;
  let tenantId = '';
  try {
    const [abastBackend] = JSON.parse(ambitEstable);
    if (typeof abastBackend !== 'string' || !abastBackend.startsWith(PREFIX_BACKEND)) return null;
    const [backendId, endpoint, tenant, mode] = JSON.parse(abastBackend.slice(PREFIX_BACKEND.length));
    tenantId = typeof tenant === 'string' && tenant.trim()
      ? tenant.trim()
      : [backendId, mode, hostDe(endpoint)].filter((tros) => typeof tros === 'string' && tros).join(':');
  } catch {
    return null;
  }
  if (!tenantId) return null;
  return Object.freeze({ usuariId, tenantId: tenantId.slice(0, MAX_TENANT) });
}

/* ── El contingut ────────────────────────────────────────────────────── */

/* La mateixa forma d'id que admet el motor (FORMA_ID, sense «..»): un fil o un
   missatge amb un altre id faria fallar la còpia sencera. */
const FORMA_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const esIdAdmes = (id) => typeof id === 'string' && FORMA_ID.test(id) && !id.includes('..');
const esEnter = (valor) => Number.isSafeInteger(valor);
const textONull = (valor) => (typeof valor === 'string' ? valor : null);

/* Només els camps que tenen un valor: el motor fa una còpia JSON, i un camp
   absent és més honest que un null que la vista no ha dit. */
function nomesDefinits(objecte) {
  return Object.fromEntries(Object.entries(objecte).filter(([, valor]) => valor !== undefined));
}

/** Cert si el fil de la vista entra a la còpia. */
export function filEntraALaCopia(fil) {
  return Boolean(fil) && esIdAdmes(fil.id) && fil.id !== ID_FIL_DE_MOSTRA_DE_JAVI && !fil.perDefecte
    && fil.tipus !== 'comunitat' && fil.participant !== false;
}

/* Les reserves amb què la vista omple el títol d'un fil que no en porta:
   mapejaFil hi posa els noms dels altres units per comes o, sense cap,
   'Conversa'; XatContext (filsDeLaLlista) dona al fil propi el primer dels
   altresNoms o el nom de la persona, i la seua foto. */
const TITOL_DE_RESERVA = 'Conversa';

/**
 * El títol del fil tal com l'ha donat el servidor, o undefined. La vista no
 * guarda el `titol` del DTO: només el `title` que pinta. Un `title` que és
 * una de les reserves (vegeu dalt) no es pot distingir d'un títol de veres
 * que diga el mateix, i no hi va: un camp absent és més honest que una dada
 * inventada. El fil propi mai: la vista sempre hi posa la seua reserva.
 * Onada R28 · copia-xat-05 · Ni el títol amb què vestixLaIAIA tapa el del
 * servidor al xat de la IAIA («IAIA MarIA»).
 */
export function titolDelServidor(fil) {
  if (!fil || fil.esPropi) return undefined;
  const titol = textONull(fil.title) ?? textONull(fil.name);
  if (!titol || !titol.trim() || titol === TITOL_DE_RESERVA) return undefined;
  if (titol === AJUDA_PER_CLAU.iaia.nom && esXatDeLaIAIA(fil)) return undefined;
  const altresNoms = Array.isArray(fil.altresNoms) ? fil.altresNoms : CAP;
  if (altresNoms.length && titol === altresNoms.join(', ')) return undefined;
  return titol;
}

/** El Fil de la vista (mapejaFil) en la forma del DTO que admet el motor.
 *  `joAvatar`: la foto de la persona, que la vista posa al fil propi quan el
 *  servidor no n'hi dona cap; eixa reserva no hi va. Onada R28 · copia-xat-05 ·
 *  Tampoc la cara de la IAIA que vestixLaIAIA posa al seu xat. */
export function dtoDeFil(fil, { joAvatar = null } = {}) {
  const imatge = textONull(fil.avatar_url);
  const imatgeDeReserva = imatge !== null && ((Boolean(fil.esPropi) && imatge === textONull(joAvatar))
    || (imatge === AJUDA_PER_CLAU.iaia.avatar && esXatDeLaIAIA(fil)));
  return nomesDefinits({
    id: fil.id,
    ...(fil.canalBetaTesters === true && fil.canalClau === 'beta_testers' ? { canalClau: 'beta_testers', canalBetaTesters: true } : {}),
    tipus: textONull(fil.tipus) ?? 'directe',
    esPropi: Boolean(fil.esPropi),
    titol: titolDelServidor(fil),
    altresNoms: Array.isArray(fil.altresNoms) ? fil.altresNoms.filter((n) => typeof n === 'string') : [],
    altres: Array.isArray(fil.altres) ? fil.altres : [],
    entitatId: textONull(fil.entitatId),
    entitatNom: textONull(fil.entitatNom),
    comEntitat: Boolean(fil.comEntitat),
    imatgeUrl: imatgeDeReserva ? undefined : imatge,
    ultimText: fil.ultimAmagat ? '' : textONull(fil.ultimText),
    ultimTipus: textONull(fil.ultimTipus),
    ultimAl: textONull(fil.ultimAl),
    ultimAutorId: textONull(fil.ultimAutorId),
    ultimSeq: esEnter(fil.ultimSeq) ? fil.ultimSeq : undefined,
    llegitFinsSeq: esEnter(fil.llegitFinsSeq) ? fil.llegitFinsSeq : undefined,
    rebutFinsSeq: esEnter(fil.rebutFinsSeq) ? fil.rebutFinsSeq : undefined,
    llegitPelsAltresFinsSeq: esEnter(fil.llegitPelsAltresFinsSeq) ? fil.llegitPelsAltresFinsSeq : undefined,
    rebutPelsAltresFinsSeq: esEnter(fil.rebutPelsAltresFinsSeq) ? fil.rebutPelsAltresFinsSeq : undefined,
    noLlegits: esEnter(fil.noLlegits) ? fil.noLlegits : undefined,
    noLlegitManual: Boolean(fil.noLlegitManual),
    comunitatId: textONull(fil.comunitatId),
    subjecte: fil.subjecte ?? null,
    rol: textONull(fil.rol) ?? undefined,
    participants: esEnter(fil.participants) ? fil.participants : undefined,
    participant: typeof fil.participant === 'boolean' ? fil.participant : undefined,
  });
}

/** Cert si la bombolla de la vista entra a la còpia del fil `filId` (vegeu
 *  la capçalera): una de mapejaMissatge porta el `threadId` del seu fil. */
export function missatgeEntraALaCopia(missatge, filId) {
  return Boolean(missatge) && esIdAdmes(missatge.id) && esEnter(missatge.seq) && missatge.seq >= 1
    && typeof missatge.threadId === 'string' && missatge.threadId === filId
    && missatge.estatEnviament !== 'pendent' && missatge.estatEnviament !== 'error'
    && !missatge.esborrat && !missatge.esborratAl && !missatge.bloquejat;
}

/* La reserva de mapejaMissatge per a un autor sense nom: no és cap nom. */
const AUTOR_DE_RESERVA = 'Veí';

/** La bombolla de la vista (mapejaMissatge) en la forma del DTO. `joNom`: el
 *  nom de la persona (la vista diu «Jo» als seus). Sense nom conegut, el camp
 *  no hi va: ni «Jo» ni «Veí» són el nom de ningú. */
export function dtoDeMissatge(missatge, filId, joNom = null) {
  const meu = missatge.sender === 'me';
  /* Onada R28 (verificador) · Un missatge propi signat com a entitat (comEntitat) no és del nom de la
     persona, i la vista ja no conserva el nom de l'entitat: el camp no hi va. */
  const autor = meu ? (missatge.comEntitat ? null : textONull(joNom)) : textONull(missatge.author);
  const ambNom = Boolean(autor && autor.trim()) && (meu || autor !== AUTOR_DE_RESERVA);
  return nomesDefinits({
    id: missatge.id,
    filId,
    seq: missatge.seq,
    usuariId: textONull(missatge.usuariId),
    autorNom: ambNom ? autor : undefined,
    text: typeof missatge.text === 'string' ? missatge.text : '',
    tipus: textONull(missatge.tipus) ?? 'text',
    respostaA: textONull(missatge.respostaA),
    metadades: missatge.metadades && typeof missatge.metadades === 'object' && !Array.isArray(missatge.metadades) ? missatge.metadades : {},
    esIA: Boolean(missatge.is_ai),
    creatAl: textONull(missatge.creatAl),
  });
}

/**
 * El que aniria a la còpia ara mateix: { fils, missatges, filsAmbMissatges },
 * en la forma del DTO. `getThreadMessages(filId)` és el de XatContext; `joNom`
 * i `joAvatar`, els de la persona.
 */
export function contingutDeLaCopia({ chatThreads = CAP, getThreadMessages = null, joNom = null, joAvatar = null } = {}) {
  const fils = [];
  const missatges = [];
  const vistos = new Set();
  let filsAmbMissatges = 0;
  for (const fil of Array.isArray(chatThreads) ? chatThreads : CAP) {
    if (!filEntraALaCopia(fil) || vistos.has(fil.id)) continue;
    vistos.add(fil.id);
    fils.push(dtoDeFil(fil, { joAvatar }));
    const bombolles = typeof getThreadMessages === 'function' ? getThreadMessages(fil.id) : CAP;
    const ids = new Set();
    const seqs = new Set();
    let algun = false;
    for (const missatge of Array.isArray(bombolles) ? bombolles : CAP) {
      if (!missatgeEntraALaCopia(missatge, fil.id) || ids.has(missatge.id) || seqs.has(missatge.seq)) continue;
      ids.add(missatge.id);
      seqs.add(missatge.seq);
      missatges.push(dtoDeMissatge(missatge, fil.id, joNom));
      algun = true;
    }
    if (algun) filsAmbMissatges += 1;
  }
  return { fils, missatges, filsAmbMissatges };
}

/* ── La contrasenya ──────────────────────────────────────────────────── */

/** La mateixa regla que el motor: NFC, sense els espais dels extrems. */
export function contrasenyaProuLlarga(contrasenya) {
  return typeof contrasenya === 'string' && contrasenya.normalize('NFC').trim().length >= MIN_CARACTERS_CONTRASENYA;
}

export { MIN_CARACTERS_CONTRASENYA };

/* ── El xifratge del navegador ───────────────────────────────────────── */

/* El codi d'exigixCripto (data/xifratXatCripto.js) quan falta WebCrypto. */
const CODI_SENSE_CRIPTO = 'SENSE_CRIPTO';

/** Onada R28 · copia-xat-04 · Cert si `cripto` té el WebCrypto que el motor
 *  demana: la mateixa regla que exigixCripto, que el motor crida en exportar,
 *  descriure i importar (teCriptoPerALaCopia, del motor). Fora d'un context
 *  segur (un WordPress servit per http) no hi és, i reintentar no ho arregla:
 *  la pàgina ho diu abans. */
export function criptoDisponible(cripto = globalThis.crypto) {
  return teCriptoPerALaCopia(cripto);
}

/* ── Els errors del motor, en paraules de la gent ─────────────────────── */

/**
 * L'error d'una operació, { camp, text }: `camp` diu on s'ha de mostrar
 * ('contrasenya', 'arxiu' o null, a l'avís general de la pàgina). `operacio`
 * és 'desa' o 'comprova'; `natiu`, si és l'app de Capacitor (sense cap
 * mecanisme per a desar, l'avís ho diu de l'app, i només allí). Cap missatge
 * intern del motor arriba a la persona. Onada R28 · copia-xat-04 · El text
 * genèric («Torna-ho a provar») només queda per al que no se sap: sense
 * WebCrypto, o amb dades que el motor no admet en desar, reintentar no ho
 * arregla, i el text no ho promet.
 */
export function errorDeLaCopia(error, t = RESERVA, operacio = 'desa', { natiu = false } = {}) {
  const codi = error?.codi;
  const motiu = error?.motiu;
  const n = { n: MIN_CARACTERS_CONTRASENYA };
  if (codi === CODI_SENSE_CRIPTO) return { camp: null, text: textAmb(TEXTOS_COPIA.errorSenseCripto, t) };
  if (codi === CODI_CLAU_FEBLE) {
    if (motiu === 'contrasenya-curta') return { camp: 'contrasenya', text: textAmb(TEXTOS_COPIA.errorCurta, t, n) };
    return { camp: operacio === 'comprova' ? 'arxiu' : null, text: textAmb(TEXTOS_COPIA.errorFormat, t) };
  }
  if (codi === CODI_CLAU_INCORRECTA) {
    const parell = motiu === 'contrasenya-absent' ? TEXTOS_COPIA.errorBuida : TEXTOS_COPIA.errorIncorrecta;
    return { camp: 'contrasenya', text: textAmb(parell, t) };
  }
  /* Onada R28 · revisió · En desar, un valor massa niat o un JSON serialitzat
     massa gran per a inspeccionar (kit R28 de Codex, json-niat-massa-gran) és
     un camp amb una forma que el motor no admet, no una còpia massa gran. */
  if (codi === CODI_LIMIT_SUPERAT && operacio === 'desa' && (motiu === 'json-niat-massa-gran' || motiu === 'profunditat')) {
    return { camp: null, text: textAmb(TEXTOS_COPIA.errorDades, t) };
  }
  if (codi === CODI_LIMIT_SUPERAT) {
    return operacio === 'comprova'
      ? { camp: 'arxiu', text: textAmb(TEXTOS_COPIA.errorArxiuMassaGran, t) }
      : { camp: null, text: textAmb(TEXTOS_COPIA.errorCopiaMassaGran, t) };
  }
  if (codi === CODI_ARXIU_NO_DESAT) {
    return { camp: null, text: textAmb(natiu && motiu === 'sense-mecanisme' ? TEXTOS_COPIA.desaNatiu : TEXTOS_COPIA.errorNoDesat, t) };
  }
  if (codi === CODI_NONCE_REPETIT && operacio === 'desa') return { camp: null, text: textAmb(TEXTOS_COPIA.errorAtzar, t) };
  if (codi === CODI_MATERIAL_SENSIBLE && operacio === 'desa') return { camp: null, text: textAmb(TEXTOS_COPIA.errorMaterial, t) };
  /* En desar, una còpia «corrupta» o un àmbit divergent volen dir que les dades
     d'este dispositiu (un id, un valor, el compte o el poble) no tenen la forma
     que el motor admet. */
  if ((codi === CODI_COPIA_CORRUPTA || codi === CODI_IDENTITAT_DIVERGENT) && operacio === 'desa') {
    return { camp: null, text: textAmb(TEXTOS_COPIA.errorDades, t) };
  }
  if (operacio === 'comprova') {
    if (codi === CODI_IDENTITAT_DIVERGENT) return { camp: 'arxiu', text: textAmb(TEXTOS_COPIA.errorAltreCompte, t) };
    if (codi === CODI_DEGRADACIO) return { camp: 'arxiu', text: textAmb(TEXTOS_COPIA.errorFormat, t) };
    if (codi === CODI_BASE_ABSENT || codi === CODI_CADENA_DIVERGENT) return { camp: 'arxiu', text: textAmb(TEXTOS_COPIA.errorPart, t) };
    if (codi === CODI_COPIA_CORRUPTA || codi === CODI_MATERIAL_SENSIBLE || codi === CODI_NONCE_REPETIT) {
      return { camp: 'arxiu', text: textAmb(TEXTOS_COPIA.errorCorrupta, t) };
    }
  }
  return { camp: null, text: textAmb(TEXTOS_COPIA.errorGeneric, t) };
}

/* ── El resum d'una còpia comprovada ─────────────────────────────────── */

const instant = (valor) => {
  if (typeof valor !== 'string' || !valor) return NaN;
  const ms = new Date(valor).getTime();
  return Number.isFinite(ms) ? ms : NaN;
};

/**
 * El que es pot dir d'una còpia que importaCopiaSeguretatXat ha validat:
 * { fils, missatges, desDeMs, finsAMs, creatAtMs }. Els instants són null si
 * no n'hi ha cap de llegible.
 */
export function resumDeLaCopia(resultat) {
  const fils = Array.isArray(resultat?.fils) ? resultat.fils.length : 0;
  const llista = Array.isArray(resultat?.missatges) ? resultat.missatges : CAP;
  let desDeMs = null;
  let finsAMs = null;
  for (const missatge of llista) {
    const ms = instant(missatge?.creatAl ?? missatge?.createdAt);
    if (!Number.isFinite(ms)) continue;
    if (desDeMs === null || ms < desDeMs) desDeMs = ms;
    if (finsAMs === null || ms > finsAMs) finsAMs = ms;
  }
  const creatAtMs = instant(resultat?.manifest?.creatAt);
  return { fils, missatges: llista.length, desDeMs, finsAMs, creatAtMs: Number.isFinite(creatAtMs) ? creatAtMs : null };
}

/** Un nombre en la llengua de la interfície (1.234, 1,234…). */
export function formataNombre(n, locale = 'ca-ES') {
  const valor = Number.isFinite(n) ? n : 0;
  try {
    return new Intl.NumberFormat(locale).format(valor);
  } catch {
    return String(valor);
  }
}

/** Una data en la llengua de la interfície; sense Intl, la forma ISO del dia. */
export function formataData(ms, locale = 'ca-ES', ambHora = false) {
  if (!Number.isFinite(ms)) return '';
  try {
    return new Intl.DateTimeFormat(locale, ambHora ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(new Date(ms));
  } catch {
    return new Date(ms).toISOString().slice(0, ambHora ? 16 : 10).replace('T', ' ');
  }
}
