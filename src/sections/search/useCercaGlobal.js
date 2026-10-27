/**
 * useCercaGlobal.js — El hook del slice de /cerca (T45).
 *
 * Llig els contextos que ja carreguen dades i en fa un índex únic. L'índex es
 * memoritza per font, mai a cada tecla: cada adaptador només torna a córrer
 * quan canvia el seu array. La cerca sí que es refà per consulta i filtre.
 *
 * El padró del poble és la causa arrel de «no trobe la gent registrada»:
 * /cerca no consultava mai `carregaMembres`. Ara, amb consulta i un filtre
 * que inclou persones o entitats, es demana una vegada per àmbit de dades del
 * xat (`xat.ambitEstable`) i es filtra en local plegant accents. Si torna el
 * límit de la RPC (100 files), també es pregunta al servidor per la consulta.
 * Decisió 1 del Mestre (261007) · Abans la clau era `xat.scopeKey`, que porta
 * `generacio`: cada renovació del JWT (cada hora) tornava a demanar el padró
 * i el grup «Persones» passava per 'loading'. `ambitEstable` (backend, persona
 * i actor, XatContext.jsx) només canvia amb un canvi de persona, actor o
 * backend, i llavors sí que el torna a demanar.
 * La RPC deixa fora qui busca i les entitats que gestiona: les afegim des
 * d'IdentitatContext. Cap correu entra a l'índex.
 *
 * Es crida el padró només quan el xat està llest (el port ja és segellat:
 * abans, `asseguraMetode` llançaria), el contingut base ja no carrega i la
 * sessió ja no es comprova.
 *
 * Pla 261022_1955 (Cercador Universal Desacoblat i Resilient, T3) ·
 *  · El directori públic de les organitzacions (capacitat 'directoriEntitats',
 *    listPublicOrganizations) és una font més, que no depén del xat ni de la
 *    sessió: tota empresa, entitat o grup públic es troba també sense entrar.
 *    Es demana una vegada per àmbit de dades (backend, tenant i mode), es
 *    recorda MS_MEMORIA_DIRECTORI entre visites a /cerca i, si torna el sostre
 *    del contracte (LIMIT_DIRECTORI_ENTITATS), també es pregunta al servidor
 *    per la consulta, com el padró.
 *  · El padró és privat del poble: qui no hi consta (SDP-XAT-003, 42501 → 403)
 *    o el port que no el deixa llegir (SDP-XAT-001, SENSE_PERMIS) el veu
 *    tancat, i això no és cap fallada de la cerca: la font queda llesta i
 *    buida, sense cap avís. Es reconeix pel `code` de l'error (o l'estat 403),
 *    mai pel text.
 *  · Cap font no deixa la pàgina esperant per sempre: una que porta
 *    MS_TERMINI_FONT carregant passa a error amb «Torna-ho a provar», i la
 *    resta de resultats ja s'hi pinten. Si després respon, se n'ix sola.
 */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useSession } from '../../app/contexts/SessionContext';
import { useUIActions, useUIState } from '../../app/contexts/UIContext';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { esAppNativa } from '../../config/origenPublic.js';
import { esPaginaVisible } from '../../config/systemPages.js';
import { esEntitatDelProjecte, subscriuEntitatDelProjecte } from '../../config/navigation.js';
import { listPublicOrganizations } from '../../data/backendPort.js';
import { LIMIT_DIRECTORI_ENTITATS } from '../../data/contracte.js';
import { PERSONA_PILOT, aliesDeLActor, esComptePersonaPilot } from '../../data/identitatsSeed.js';
import { useMur } from '../mur/MurContext';
import { useMultimedia } from '../multimedia/MultimediaContext';
import { useNotes } from '../notes/NotesContext';
import { useXat } from '../xat/XatContext';
import {
  ambLaIdentitatPropia, cercaEntrades, deActe, deAgent, deConversa, deIdentitat, deMedia, deMembre, deNota,
  deOrganitzacio, dePagina, dePoble, deProducte, dePublicacio, tipusValid
} from './indexCerca.js';

const CAP = Object.freeze([]);
/* p_limit per defecte de membres_del_poble (migració 2609272200). */
export const LIMIT_PADRO = 100;
const MS_PADRO = 250;
const TIPUS_PADRO = new Set(['tot', 'persones', 'entitats']);
/* Pla 261022_1955 (T3) · El directori només porta entitats. */
const TIPUS_DIRECTORI = new Set(['tot', 'entitats']);
/* Pla 261022_1955 (T3) · El temps màxim que una font es mostra «carregant»
   abans de dir que no ha respost (vegeu la capçalera). */
export const MS_TERMINI_FONT = 10000;
/* Pla 261022_1955 (T3; pla, Riscos: «La càrrega d'entitats públiques es
   memoritza en caché per àmbit de poble») · Quant de temps es recorda el
   directori d'un àmbit entre una visita a /cerca i la següent. Mai es recorda
   un error. Una entitat que la persona administra ja hi és per IdentitatContext. */
const MS_MEMORIA_DIRECTORI = 5 * 60 * 1000;
const memoriaDirectori = new Map();

/** Per a les proves: oblida el directori recordat (la memòria és del mòdul). */
export function oblidaElDirectori() {
  memoriaDirectori.clear();
}

/* Pla 261022_1955 (T3) · El padró tancat: no constes al poble, el servidor no
   et deixa executar la RPC o no hi ha sessió. Els codis són els d'errorDeXat
   (data/supabase/xat.js), i la causa porta l'estat HTTP i el SQLSTATE. */
const CODIS_PADRO_TANCAT = new Set(['SDP-XAT-001', 'SDP-XAT-003', 'SENSE_PERMIS']);
function esPadroTancat(error) {
  if (CODIS_PADRO_TANCAT.has(error?.code)) return true;
  const causa = error?.cause;
  return Number(error?.status ?? causa?.status) === 403 || causa?.code === '42501';
}

const llistaDe = (valor) => (Array.isArray(valor) ? valor : CAP);
/* Un port sense la capacitat, o una prova que simula la sessió sense ella, no fa caure la cerca. */
function teLaCapacitat(teCapacitat, nom) {
  try { return typeof teCapacitat === 'function' && teCapacitat(nom) === true; } catch { return false; }
}
const missatgeDe = (error, perDefecte) => (typeof error === 'string' ? error : error?.message) || perDefecte;

function mapa(llista, adaptador, opcions) {
  const eixida = [];
  for (const element of llistaDe(llista)) {
    const entrada = adaptador(element, opcions);
    if (entrada) eixida.push(entrada);
  }
  return eixida;
}

/* Pla 261022_1955 (T3) · Cert quan la font `clau` porta MS_TERMINI_FONT
   carregant sense resposta. Una clau nova (un reintent, un altre àmbit)
   torna a comptar des de zero, i també una càrrega nova de la mateixa clau:
   en deixar de carregar (ha respost, o la font ja no fa falta) s'oblida el
   termini vençut (Gauntlet: si no, tornar a la vista Tot després d'un
   termini pintava «No ha respost a temps» d'una petició acabada d'eixir). */
function useTerminiVencut(carregant, clau) {
  const [vencut, setVencut] = useState(null);
  useEffect(() => {
    if (!carregant) { setVencut(null); return undefined; }
    const temporitzador = setTimeout(() => setVencut(clau), MS_TERMINI_FONT);
    return () => clearTimeout(temporitzador);
  }, [carregant, clau]);
  return carregant && vencut === clau;
}

export function useCercaGlobal({ q = '', tipus = 'tot' } = {}) {
  const { t } = useUIActions();
  const { locale = 'ca-ES', externalConfig } = useUIState();
  const core = useCoreContent();
  const mur = useMur();
  const media = useMultimedia();
  const notes = useNotes() || {};
  const xat = useXat();
  const { identitats = CAP } = useIdentitat();
  const { currentUser, estat: estatSessio, teCapacitat } = useSession();

  /* Només 'fora' és «sense sessió». Mentre la sessió es comprova (arrencada,
     renovació, rol per saber) no s'avisa d'entrar ni es crida el padró, però
     el padró compta com a font que carrega: mai un «Cap resultat» fals. */
  const configDades = useMemo(() => normalizeBackendConfig(externalConfig || {}), [externalConfig]);
  const modeDades = configDades.dataMode;
  const senseSessio = modeDades === 'remote' && estatSessio === 'fora';
  const sessioPendent = modeDades === 'remote' && estatSessio === 'comprovant';
  const qNet = String(q || '').trim();
  const filtre = tipusValid(tipus);

  const etiquetaIA = t('section.search.ia', 'Intel·ligència artificial');
  const opcions = useMemo(() => ({ locale, etiquetes: { ia: etiquetaIA } }), [locale, etiquetaIA]);
  const nomCompte = t('section.search.elTeuCompte', 'El teu compte');
  const correu = currentUser?.email || null;
  const poble = currentUser?.user_metadata?.town_name || '';
  /* Poliment T45 · Seed i local saben obrir la fitxa d'una altra persona.
     Ordre del Mestre (261002) · En remot també, quan el port té la capacitat
     'directori' (loadPerfilPublic, que crida la RPC perfil_public): la persona
     del padró ix al cercador amb la seua fitxa. Sense la capacitat, el títol
     no hi enllaça i l'acció és «Escriu-li», com abans. L'adaptador de Supabase
     la declara sempre: la migració 2610021520 va ABANS de publicar el client.
     Revisió adversarial (261019) · La mateixa regla per a la persona pròpia
     (deIdentitat): sense fitxa que s'òbriga, cap enllaç. */
  const directori = teLaCapacitat(teCapacitat, 'directori');
  const fitxesDePersones = modeDades !== 'remote' || directori;
  const opcionsIdentitat = useMemo(() => ({ ...opcions, correu, nomCompte, poble, fitxesDePersones }),
    [opcions, correu, nomCompte, poble, fitxesDePersones]);

  const errorPadro = t('section.search.errorDesconegut', 'La font no ha dit per què.');
  const errorTermini = t('section.search.errorTermini', 'No ha respost a temps. La resta de resultats continua ací.');

  /* ── El padró: una llista per àmbit del xat, més la consulta al servidor si cal ── */
  const { cercaMembres, ambitEstable: ambitXat = '', status: estatXat } = xat;
  const volPadroBase = Boolean(qNet) && TIPUS_PADRO.has(filtre) && !senseSessio && typeof cercaMembres === 'function';
  const volPadro = volPadroBase && !sessioPendent && estatXat === 'ready' && core.status !== 'loading';

  const [intent, setIntent] = useState(0);
  const clauPadro = `${ambitXat}#${intent}`;
  const [padro, setPadro] = useState({ clau: null, status: 'idle', llista: CAP, error: null });
  const demanat = useRef(null);

  useEffect(() => {
    if (!volPadro || demanat.current === clauPadro) return undefined;
    demanat.current = clauPadro;
    let viu = true;
    let acabat = false;
    setPadro({ clau: clauPadro, status: 'loading', llista: CAP, error: null });
    Promise.resolve()
      .then(() => cercaMembres(null))
      .then((llista) => {
        acabat = true;
        if (viu) setPadro({ clau: clauPadro, status: 'ready', llista: llistaDe(llista), error: null });
      })
      .catch((error) => {
        acabat = true;
        if (!viu) return;
        /* Pla 261022_1955 (T3) · El padró tancat és una font llesta i buida. */
        if (esPadroTancat(error)) setPadro({ clau: clauPadro, status: 'ready', llista: CAP, error: null });
        else setPadro({ clau: clauPadro, status: 'error', llista: CAP, error: missatgeDe(error, errorPadro) });
      });
    /* Una petició tallada abans d'acabar es tornarà a fer quan torne a caldre. */
    return () => { viu = false; if (!acabat) demanat.current = null; };
  }, [volPadro, clauPadro, cercaMembres, errorPadro]);

  const padroActual = padro.clau === clauPadro ? padro : null;
  const llistaPadro = padroActual?.status === 'ready' ? padroActual.llista : CAP;
  const volServidor = volPadro && padroActual?.status === 'ready' && llistaPadro.length >= LIMIT_PADRO;
  const clauServidor = `${clauPadro}|${qNet}`;
  const [servidor, setServidor] = useState({ clau: null, status: 'idle', llista: CAP, error: null });

  useEffect(() => {
    if (!volServidor) return undefined;
    let viu = true;
    const temporitzador = setTimeout(() => {
      setServidor({ clau: clauServidor, status: 'loading', llista: CAP, error: null });
      Promise.resolve()
        .then(() => cercaMembres(qNet))
        .then((llista) => { if (viu) setServidor({ clau: clauServidor, status: 'ready', llista: llistaDe(llista), error: null }); })
        .catch((error) => {
          if (!viu) return;
          if (esPadroTancat(error)) setServidor({ clau: clauServidor, status: 'ready', llista: CAP, error: null });
          else setServidor({ clau: clauServidor, status: 'error', llista: CAP, error: missatgeDe(error, errorPadro) });
        });
    }, MS_PADRO);
    return () => { viu = false; clearTimeout(temporitzador); };
  }, [volServidor, clauServidor, qNet, cercaMembres, errorPadro]);

  const servidorActual = servidor.clau === clauServidor ? servidor : null;
  const llistaServidor = servidorActual?.status === 'ready' ? servidorActual.llista : CAP;

  let estatPadro = 'idle';
  let missatgePadro = null;
  if (volPadroBase) {
    if (padroActual?.status === 'error') { estatPadro = 'error'; missatgePadro = padroActual.error; }
    else if (servidorActual?.status === 'error') { estatPadro = 'error'; missatgePadro = servidorActual.error; }
    else if (padroActual?.status !== 'ready' || (volServidor && servidorActual?.status !== 'ready')) estatPadro = 'loading';
    else estatPadro = 'ready';
  }
  const padroVencut = useTerminiVencut(estatPadro === 'loading', `${clauPadro}|${qNet}`);
  if (padroVencut) { estatPadro = 'error'; missatgePadro = errorTermini; }

  const reintentaPadro = useCallback(() => { setIntent((valor) => valor + 1); }, []);

  /* ── Pla 261022_1955 (T1/T3) · El directori públic de les organitzacions ── */
  const ambDirectori = teLaCapacitat(teCapacitat, 'directoriEntitats');
  const volDirectori = Boolean(qNet) && TIPUS_DIRECTORI.has(filtre) && ambDirectori;
  const ambitDades = JSON.stringify([configDades.backendUrl || '', configDades.tenantId || '', modeDades]);
  const [intentDirectori, setIntentDirectori] = useState(0);
  const clauDirectori = `${ambitDades}#${intentDirectori}`;
  const [directoriEntitats, setDirectoriEntitats] = useState({ clau: null, status: 'idle', llista: CAP, error: null });
  const directoriDemanat = useRef(null);
  /* Gauntlet (xarxa rural) · El directori no depén de la consulta ni del
     filtre: una vegada demanat per a un àmbit, la petició continua encara que
     la persona canvie a «Persones» o buide la caixa, i no es torna a començar
     de zero en tornar. Només un altre àmbit, un reintent o eixir de /cerca la
     tallen. */
  const [directoriVolgut, setDirectoriVolgut] = useState(null);
  if (volDirectori && directoriVolgut !== clauDirectori) setDirectoriVolgut(clauDirectori);
  const demanaDirectori = volDirectori || directoriVolgut === clauDirectori;
  /* La config de la crida, sense que el seu objecte siga dependència: l'àmbit
     (backend, tenant i mode) és el que decidix si cal tornar a demanar. */
  const configDeLaCrida = useRef(externalConfig);
  configDeLaCrida.current = externalConfig || {};

  useEffect(() => {
    if (!demanaDirectori || directoriDemanat.current === clauDirectori) return undefined;
    directoriDemanat.current = clauDirectori;
    const recordat = memoriaDirectori.get(ambitDades);
    if (recordat && Date.now() - recordat.quan < MS_MEMORIA_DIRECTORI) {
      setDirectoriEntitats({ clau: clauDirectori, status: 'ready', llista: recordat.llista, error: null });
      return undefined;
    }
    const controlador = new AbortController();
    let viu = true;
    let acabat = false;
    setDirectoriEntitats({ clau: clauDirectori, status: 'loading', llista: CAP, error: null });
    Promise.resolve()
      .then(() => listPublicOrganizations({ limit: LIMIT_DIRECTORI_ENTITATS, signal: controlador.signal }, configDeLaCrida.current))
      .then((llista) => {
        acabat = true;
        const files = llistaDe(llista);
        memoriaDirectori.set(ambitDades, { quan: Date.now(), llista: files });
        if (viu) setDirectoriEntitats({ clau: clauDirectori, status: 'ready', llista: files, error: null });
      })
      .catch((error) => {
        acabat = true;
        if (viu) setDirectoriEntitats({ clau: clauDirectori, status: 'error', llista: CAP, error: missatgeDe(error, errorPadro) });
      });
    return () => {
      viu = false;
      if (!acabat) { directoriDemanat.current = null; controlador.abort(); }
    };
  }, [demanaDirectori, clauDirectori, ambitDades, errorPadro]);

  const directoriActual = directoriEntitats.clau === clauDirectori ? directoriEntitats : null;
  const llistaDirectori = directoriActual?.status === 'ready' ? directoriActual.llista : CAP;
  const volDirectoriServidor = volDirectori && directoriActual?.status === 'ready' && llistaDirectori.length >= LIMIT_DIRECTORI_ENTITATS;
  const clauDirectoriServidor = `${clauDirectori}|${qNet}`;
  const [directoriServidor, setDirectoriServidor] = useState({ clau: null, status: 'idle', llista: CAP, error: null });

  useEffect(() => {
    if (!volDirectoriServidor) return undefined;
    const controlador = new AbortController();
    let viu = true;
    const temporitzador = setTimeout(() => {
      setDirectoriServidor({ clau: clauDirectoriServidor, status: 'loading', llista: CAP, error: null });
      Promise.resolve()
        .then(() => listPublicOrganizations({ consulta: qNet, limit: LIMIT_DIRECTORI_ENTITATS, signal: controlador.signal },
          configDeLaCrida.current))
        .then((llista) => { if (viu) setDirectoriServidor({ clau: clauDirectoriServidor, status: 'ready', llista: llistaDe(llista), error: null }); })
        .catch((error) => {
          if (viu) setDirectoriServidor({ clau: clauDirectoriServidor, status: 'error', llista: CAP, error: missatgeDe(error, errorPadro) });
        });
    }, MS_PADRO);
    return () => { viu = false; clearTimeout(temporitzador); controlador.abort(); };
  }, [volDirectoriServidor, clauDirectoriServidor, qNet, errorPadro]);

  const directoriServidorActual = directoriServidor.clau === clauDirectoriServidor ? directoriServidor : null;
  const llistaDirectoriServidor = directoriServidorActual?.status === 'ready' ? directoriServidorActual.llista : CAP;

  let estatDirectori = 'idle';
  let missatgeDirectori = null;
  if (volDirectori) {
    if (directoriActual?.status === 'error') { estatDirectori = 'error'; missatgeDirectori = directoriActual.error; }
    else if (directoriServidorActual?.status === 'error') { estatDirectori = 'error'; missatgeDirectori = directoriServidorActual.error; }
    else if (directoriActual?.status !== 'ready' || (volDirectoriServidor && directoriServidorActual?.status !== 'ready')) estatDirectori = 'loading';
    else estatDirectori = 'ready';
  }
  const directoriVencut = useTerminiVencut(estatDirectori === 'loading', `${clauDirectori}|${qNet}`);
  if (directoriVencut) { estatDirectori = 'error'; missatgeDirectori = errorTermini; }

  const reintentaDirectori = useCallback(() => { setIntentDirectori((valor) => valor + 1); }, []);

  /* ── L'índex, font per font ── */
  const deIdentitats = useMemo(() => mapa(identitats, deIdentitat, opcionsIdentitat), [identitats, opcionsIdentitat]);
  /* Les fitxes de persones del padró: la regla de `fitxesDePersones` (dalt).
     Pla 261022_1955 (T2) · El padró és el del poble de la sessió: `pobleDelPadro`. */
  const opcionsPadro = useMemo(() => ({ ...opcions, fitxesDePersones, pobleDelPadro: poble }), [opcions, fitxesDePersones, poble]);
  const dePadro = useMemo(() => mapa([...llistaPadro, ...llistaServidor], deMembre, opcionsPadro), [llistaPadro, llistaServidor, opcionsPadro]);
  const deAgents = useMemo(() => mapa(core.agents, deAgent, opcions), [core.agents, opcions]);
  /* Pla 261022_1955 (T2) · El tenant actiu decidix si la fitxa s'obri pel slug
     o per l'id (indexCerca.js · deOrganitzacio). */
  const opcionsDirectori = useMemo(() => ({ ...opcions, tenantActiu: configDades.tenantId || null }), [opcions, configDades.tenantId]);
  const deOrganitzacions = useMemo(() => mapa([...llistaDirectori, ...llistaDirectoriServidor], deOrganitzacio, opcionsDirectori),
    [llistaDirectori, llistaDirectoriServidor, opcionsDirectori]);
  const dePobles = useMemo(() => mapa(core.towns, dePoble, opcions), [core.towns, opcions]);
  /* Ordre del Mestre (261027) · Dins de l'app nativa, les pàgines només web
     (esPaginaVisible: Descàrregues) no entren a la cerca. */
  const dePagines = useMemo(() => mapa(
    Array.isArray(core.pages) ? core.pages.filter((p) => esPaginaVisible(p?.key ?? p?.slug ?? p?.id, { nativa: esAppNativa() })) : core.pages,
    dePagina, opcions
  ), [core.pages, opcions]);
  const dePublicacions = useMemo(() => mapa(mur.feedPosts, dePublicacio, opcions), [mur.feedPosts, opcions]);
  const deActes = useMemo(() => mapa(mur.events, deActe, opcions), [mur.events, opcions]);
  const deProductes = useMemo(() => mapa(mur.marketItems, deProducte, opcions), [mur.marketItems, opcions]);
  const deMedies = useMemo(() => mapa(media.mediaItems, deMedia, opcions), [media.mediaItems, opcions]);
  const deNotes = useMemo(() => mapa(notes.notes, deNota, opcions), [notes.notes, opcions]);
  const deConverses = useMemo(() => mapa(xat.chatThreads, deConversa, opcions), [xat.chatThreads, opcions]);

  /* Gauntlet 261016 (Bloc 3.5.1) · Els àlies declarats de la persona de la
     sessió (aliesDeLActor, la regla del MAS): en llavor, els de la persona
     pilot; en remot, només el seu id. Amb ells, la seua fitxa del padró i del
     catàleg es fusiona amb la pròpia (ambLaIdentitatPropia), mai pel nom.
     Ordre del Mestre (261019 21:34, punt 9: «una sola fitxa canònica») · En
     remot, el compte de la persona pilot també porta els seus àlies quan la
     sessió ho acredita (esComptePersonaPilot: un id declarat o el correu
     confirmat del seu compte, pla 261018_1605, D7; mai pel nom): el Mestre ja
     no es troba dues vegades, la fitxa pròpia i el '0001' del catàleg. */
  const pilotDeLaSessio = esComptePersonaPilot(currentUser);
  const aliesPropis = useMemo(() => {
    const persona = llistaDe(identitats).find((identitat) => identitat?.tipus === 'persona');
    if (!persona) return CAP;
    const alies = aliesDeLActor(persona, { dataMode: modeDades });
    if (pilotDeLaSessio && String(persona.id) === String(currentUser?.id)) PERSONA_PILOT.alies.forEach((a) => alies.add(a));
    return [...alies];
  }, [identitats, modeDades, pilotDeLaSessio, currentUser?.id]);

  /* Ordre del Mestre (261019 21:34, punt 9) · En remot, l'entitat pilot porta
     l'id del servidor, que la llavor no sap: el reconeix la resolució de
     l'app (registraEntitatDelProjecte, pel slug declarat i dins del poble
     actiu; App.jsx · useEntitatDelProjecte) i el llig esEntitatDelProjecte.
     Ací, els ids de les entitats de l'índex que ja ho són, en un text estable
     (useSyncExternalStore el compara pel valor): quan arriba l'id, l'índex es
     refà i l'entitat pròpia, la del padró, la del catàleg i (pla 261022_1955)
     la del directori són una fitxa. */
  const idsDEntitats = useMemo(() => [...deIdentitats, ...dePadro, ...deAgents, ...deOrganitzacions]
    .filter((entrada) => entrada.tipus === 'entitats').map((entrada) => entrada.id), [deIdentitats, dePadro, deAgents, deOrganitzacions]);
  const textDelProjecte = useSyncExternalStore(subscriuEntitatDelProjecte,
    () => idsDEntitats.filter((id) => esEntitatDelProjecte({ tipus: 'entitat', id })).join('\n'));
  const delProjecte = useMemo(() => (textDelProjecte ? textDelProjecte.split('\n') : CAP), [textDelProjecte]);

  /* L'ordre decidix qui es pinta en una clau repetida (el text de totes compta,
     vegeu fusionaPerClau): la identitat pròpia primer, el padró abans del
     catàleg i el catàleg abans del directori. */
  const index = useMemo(() => ambLaIdentitatPropia([
    ...deIdentitats, ...dePadro, ...deAgents, ...deOrganitzacions, ...dePobles, ...dePublicacions, ...deActes,
    ...deProductes, ...deMedies, ...deNotes, ...deConverses, ...dePagines
  ], aliesPropis, { delProjecte }), [deIdentitats, dePadro, deAgents, deOrganitzacions, dePobles, dePublicacions, deActes,
    deProductes, deMedies, deNotes, deConverses, dePagines, aliesPropis, delProjecte]);

  /* Pla 261022_1955 (T2) · El poble de qui busca desempata (cercaEntrades). */
  const resultats = useMemo(() => cercaEntrades(index, qNet, filtre, { pobleActiu: poble }), [index, qNet, filtre, poble]);

  /* ── Les fonts, per a dir quina carrega i quina ha fallat ── */
  const fonts = useMemo(() => {
    const font = (id, etiqueta, status, error, reintenta, tipusFont) => ({
      id,
      etiqueta,
      status: status || 'ready',
      error: status === 'error' ? missatgeDe(error, errorPadro) : null,
      reintenta: typeof reintenta === 'function' ? reintenta : null,
      tipus: tipusFont
    });
    return [
      font('contingut', t('section.search.font.contingut', 'el catàleg de persones i pobles'), core.status, core.error, core.refresh,
        ['persones', 'entitats', 'pobles', 'pagines']),
      font('mur', t('section.search.font.mur', "el Mur, l'agenda i el mercat"), mur.status, mur.error, mur.refresh,
        ['publicacions', 'agenda', 'mercat']),
      font('multimedia', t('section.search.font.multimedia', 'la multimèdia'), media.status, media.error, media.refresh, ['multimedia']),
      font('notes', t('section.search.font.notes', 'les teues notes'), notes.status, notes.error, notes.refresh, ['notes']),
      font('converses', t('section.search.font.converses', 'les teues converses'), xat.status, null, xat.recarrega, ['converses']),
      font('padro', t('section.search.font.padro', 'el padró del poble'), estatPadro, missatgePadro, reintentaPadro, ['persones', 'entitats']),
      font('directori', t('section.search.font.directori', "el directori d'entitats"), estatDirectori, missatgeDirectori,
        reintentaDirectori, ['entitats'])
    ];
  }, [t, errorPadro, core.status, core.error, core.refresh, mur.status, mur.error, mur.refresh, media.status, media.error,
    media.refresh, notes.status, notes.error, notes.refresh, xat.status, xat.recarrega, estatPadro, missatgePadro, reintentaPadro,
    estatDirectori, missatgeDirectori, reintentaDirectori]);

  const rellevant = (font) => filtre === 'tot' || font.tipus.includes(filtre);
  const carregant = Boolean(qNet) && fonts.some((font) => font.status === 'loading' && rellevant(font));
  const errors = qNet ? fonts.filter((font) => font.status === 'error' && rellevant(font)) : CAP;

  return { resultats, fonts, errors, carregant, senseSessio };
}
