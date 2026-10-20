/**
 * ModeracioContext.jsx — Fase D (261020, tasca 2; pla 261020_1300 · App
 * Store 1.2 i Google Play UGC) · El proveïdor ÚNIC de la moderació: el
 * conjunt de bloquejos de qui mira, les regles de què es denuncia i què
 * s'amaga (config/moderacio.js), l'amfitrió dels diàlegs (denúncia, bloqueig
 * i normes) i la porta de les normes de convivència abans de publicar. El
 * context i la seua lectura viuen a Pedra Seca
 * (components/PedraSeca/hooks/moderacioDePoble.js); el valor hi és descrit.
 * Es munta una vegada a App.jsx, per damunt del Mur i del Xat.
 *
 * BLOQUEJOS
 * ─────────
 *   · Es carreguen amb useScopedResource per àmbit (backend + qui mira):
 *     eixir, entrar amb una altra persona o canviar de backend els buida en el
 *     MATEIX pintat (Decisió 2), i una renovació del JWT els torna a demanar
 *     en segon pla sense canviar res.
 *   · Damunt, la capa optimista de la sessió ({ ambit, afegits, llevats }):
 *     bloquejar amaga a l'instant, davall del diàleg; si el servidor ho
 *     rebutja, la clau torna exactament a com era (revertix). Sense la
 *     migració ('no-disponible'), el bloqueig dura la sessió i ho diu un avís.
 *   · esPersonaBloquejada i esElementBloquejat canvien d'identitat NOMÉS quan
 *     canvia el conjunt de claus (firmaDeClaus): una renovació que torna la
 *     mateixa llista no torna a pintar cap targeta (crítica 261020, 12).
 *
 * DIÀLEGS
 * ───────
 * L'estat dels diàlegs no va al valor del context (obrir-ne un no torna a
 * pintar cap targeta). Els pinta el component `Dialegs` (la prop), després
 * dels fills i en este ordre: denúncia, bloqueig, normes. Rep tres objectes:
 *   denuncia: { obert, objectiu, potBloquejarTambe, onTanca(),
 *               onEnvia({ motiu, detall }) → Promise<{ rebuda, repetida }>,
 *               onBloqueja() }   (passa al diàleg de bloqueig, amb el mateix obridor)
 *   bloqueig: { obert, objectiu, onTanca(), onConfirma() → Promise<void> }
 *               (resol quan ja ha tancat; rebutja amb el `code` i continua obert)
 *   normes:   { obert, onTanca(motiu?), onAccepta() → Promise<void> }
 *               (onTanca declina: «Ara no», Escape, el fons i l'enllaç /legal)
 * Els errors porten `code` de CODI_MODERACIO. Cap avís (toast) dins d'un
 * modal: els de bloquejar i desbloquejar ixen amb el diàleg ja tancat. Quan
 * es tanca i l'obridor ja no és al document (la targeta o la bombolla
 * bloquejada se n'ha anat), el focus va a la llista de missatges o a `main`.
 *
 * NORMES DE CONVIVÈNCIA
 * ─────────────────────
 * Només en remot, amb sessió, amb alguna de les dues capacitats i amb un
 * amfitrió de diàlegs (sense ell ningú no podria respondre i la porta
 * penjaria l'enviament). En llavor i en local és una demostració sense
 * comunitat: la porta no s'aplica. L'acceptació es recorda per persona a
 * storage.js ('normes-convivencia:<id>'), es contrasta amb el servidor
 * (estatNormes) i s'hi desa (acceptaNormes). asseguraNormes només llig refs:
 * és estable, dues crides alhora comparteixen la MATEIXA promesa, una
 * resposta tardana d'una altra persona no accepta per a la nova, i després
 * d'acceptar la crida següent resol a l'instant, encara abans del pintat.
 * Canviar d'àmbit o desmuntar resol la pendent amb false.
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  acceptaNormes, bloquejaAutor, denunciaContingut, desbloquejaAutor, estatNormes, llistaBloquejos, teCapacitat
} from '../../data/backendPort.js';
import { CODI_MODERACIO, VERSIO_NORMES_CONVIVENCIA, errorDeModeracio } from '../../data/contracte.js';
/* De la font, identitat.js, com XatContext: appSeed.js només el reexporta. */
import { getDefaultUserId } from '../../data/identitat.js';
import { backendScope, normalizeBackendConfig } from '../../config/backendConfig.js';
import { getVal, setVal } from '../../config/storage.js';
import {
  afigAlCanvi, canviBuit, clauDeBloqueig, elementBloquejat, firmaDeClaus, fotoDelCanvi, fusionaBloquejos, llevaDelCanvi,
  objectiuDeContrapart, objectiuDeMissatge, objectiuDeTargeta, omple, revertix
} from '../../config/moderacio.js';
import { useSession } from './SessionContext.jsx';
import { useScopedResource } from './useScopedResource.js';
import { useToast } from '../../components/universal/NotificationContext.jsx';
import { ModeracioContext } from '../../components/PedraSeca/hooks/moderacioDePoble.js';
import { useXatSocDePoble } from '../../components/PedraSeca/hooks/xatSocDePoble.js';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';

const MAI = () => false;
const CAP = Object.freeze([]);

/* Els avisos que ixen d'ací, amb el diàleg ja tancat. Les claus són les de
   section.moderacio.* (i18n.js) i la reserva, el valencià: la mateixa que
   la taula de textos de la interfície. */
const AVISOS_MODERACIO = Object.freeze({
  bloqueigFet: Object.freeze(['section.moderacio.bloqueig.fet', 'Has bloquejat {nom}.']),
  bloqueigNomesSessio: Object.freeze(['section.moderacio.bloqueig.nomesSessio',
    'Has bloquejat {nom} en esta sessió: el servidor encara no guarda els bloquejos.']),
  desbloqueigFet: Object.freeze(['section.moderacio.desbloqueig.fet', 'Has desbloquejat {nom}.']),
  senseNom: Object.freeze(['section.moderacio.bloquejos.senseNom', 'Sense nom'])
});

/* Com MurContext (potPaginar): un port sense adaptador encara instal·lat és
   «sense capacitat», mai una excepció en pintar. */
function capacitat(nom) {
  try { return teCapacitat(nom) === true; } catch { return false; }
}

/* Constant de mòdul: useScopedResource la té a la clau d'aïllament. */
const carregaBloquejos = async (_actor, config) => (capacitat('moderacio') ? llistaBloquejos(config) : []);

const clauDeNormes = (usuariId) => `normes-convivencia:${usuariId}`;
const ESTAT_DEL_RECURS = Object.freeze({ loading: 'carregant', ready: 'llest', error: 'error' });

/* L'element amb el focus, també dins d'un shadow root (la incrustació); mai
   el cos del document. */
function focusProfund() {
  if (typeof document === 'undefined') return null;
  let actiu = document.activeElement;
  while (actiu?.shadowRoot?.activeElement) actiu = actiu.shadowRoot.activeElement;
  return actiu && actiu.tagName !== 'BODY' ? actiu : null;
}

/* On va el focus si l'obridor desapareix: la llista de missatges o el main
   (tots dos amb tabIndex -1). */
const alternatiuDe = (obridor) => obridor?.closest?.('ol.sdp-xat-missatges, main') ?? null;

/**
 * El proveïdor de la moderació. `config` és la de l'app; `Dialegs`, el
 * component que pinta els tres diàlegs (vegeu la capçalera), o null.
 */
export function ProveidorModeracio({ config, children, Dialegs = null }) {
  const { currentUser } = useSession();
  const usuariId = currentUser?.id ?? null;
  const modeDades = normalizeBackendConfig(config || {}).dataMode;
  const disponible = capacitat('moderacio');
  const ambNormes = capacitat('normesConvivencia');
  /* Qui bloqueja: la sessió o, en llavor i en local, el convidat (com joId
     a XatContext). En remot sense sessió, ningú: només es denuncia. */
  const quiSoc = usuariId || (modeDades !== 'remote' ? getDefaultUserId() : null);
  const potBloquejar = disponible && Boolean(quiSoc);
  const ambit = JSON.stringify([backendScope(config), quiSoc]);
  const recurs = useScopedResource(carregaBloquejos, null, ambit, config);
  const { showToast } = useToast();
  const t = useTraductorOpcional();
  const xatSocDePoble = useXatSocDePoble();
  const esDeQuiMira = xatSocDePoble.esDeQuiMira ?? MAI;

  /* ── La capa optimista, amb una ref síncrona (com mutaFils a XatContext) ── */
  const [canvis, setCanvis] = useState(() => canviBuit(ambit));
  const canvisRef = useRef(canvis);
  const ambitRef = useRef(ambit);
  const configRef = useRef(config);
  const desmuntat = useRef(false);
  useLayoutEffect(() => {
    ambitRef.current = ambit;
    configRef.current = config;
  }, [ambit, config]);
  const vigentsDe = useCallback((ambitAra) => (canvisRef.current.ambit === ambitAra ? canvisRef.current : canviBuit(ambitAra)), []);
  const mutaCanvis = useCallback((ambitAra, fn) => {
    const nou = fn(vigentsDe(ambitAra));
    canvisRef.current = nou;
    setCanvis(nou);
  }, [vigentsDe]);

  const vigents = canvis.ambit === ambit ? canvis : null;
  const servidor = recurs.status === 'ready' ? recurs.payload : null;
  const mapa = fusionaBloquejos(servidor, vigents ?? canviBuit(ambit));
  const firma = firmaDeClaus(mapa.keys());
  const firmaLlista = [...mapa.values()].map((b) => `${b.tipus}:${b.id}\t${b.nom ?? ''}\t${b.creatAl ?? ''}`).join('\n');
  const claus = useMemo(() => new Set(firma ? firma.split('\n') : []), [firma]);
  /* Com App.jsx (stableConfig): la llista nova només quan canvia el que es
     veu; `mapa` és nou a cada pintat. */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const bloquejats = useMemo(() => (firmaLlista ? Object.freeze([...mapa.values()]) : CAP), [firmaLlista]);
  const mapaRef = useRef(mapa);
  useLayoutEffect(() => { mapaRef.current = mapa; });

  /* Sense cap bloqueig, la mateixa funció constant: cap consumidor no torna a
     pintar per res. */
  const esPersonaBloquejada = useMemo(
    () => (claus.size ? (id) => claus.has(clauDeBloqueig('persona', String(id ?? ''))) : MAI),
    [claus]
  );
  const esElementBloquejat = useMemo(
    () => (claus.size ? (item) => elementBloquejat(item, claus, { esDeQuiMira }) : MAI),
    [claus, esDeQuiMira]
  );
  const objectiuDeTargetaDeQuiMira = useCallback((objecte) => objectiuDeTargeta(objecte, { esDeQuiMira }), [esDeQuiMira]);

  /* ── Els diàlegs ── */
  const [dialeg, setDialeg] = useState(null);   // { tipus: 'denuncia' | 'bloqueig' | 'normes', objectiu, obridor, alternatiu }
  const obre = useCallback((tipus, objectiu, obridor) => {
    const element = obridor ?? focusProfund();
    setDialeg({ tipus, objectiu, obridor: element ?? null, alternatiu: alternatiuDe(element) });
  }, []);
  const demanaDenuncia = useCallback((objectiu, obridor = null) => {
    if (objectiu?.tipus && objectiu.id) obre('denuncia', objectiu, obridor);
  }, [obre]);
  const demanaBloqueig = useCallback((objectiu, obridor = null) => {
    if (objectiu?.bloquejable === true && objectiu.autor?.id) obre('bloqueig', objectiu, obridor);
  }, [obre]);
  const tanca = useCallback(() => setDialeg(null), []);

  /* El focus, si l'obridor ja no hi és. Després del retorn de Dialeg: el
     setTimeout(0) corre quan el diàleg ja l'ha intentat tornar. */
  const darrerDialeg = useRef(null);
  useEffect(() => {
    if (dialeg) { darrerDialeg.current = dialeg; return undefined; }
    const darrer = darrerDialeg.current;
    darrerDialeg.current = null;
    if (!darrer || darrer.obridor?.isConnected) return undefined;
    const temporitzador = setTimeout(() => {
      if (darrer.obridor?.isConnected || !darrer.alternatiu?.isConnected) return;
      darrer.alternatiu.focus?.({ preventScroll: true });
    }, 0);
    return () => clearTimeout(temporitzador);
  }, [dialeg]);

  const nomDe = useCallback((autor) => {
    const nom = autor?.nom || mapaRef.current.get(clauDeBloqueig(autor?.tipus, autor?.id))?.nom;
    return nom || tradueix(t, AVISOS_MODERACIO.senseNom);
  }, [t]);

  /* Bloquejar: s'amaga a l'instant, davall del diàleg. */
  const confirmaBloqueig = useCallback(async (objectiu) => {
    const autor = objectiu?.autor;
    if (!autor?.id) return;
    const ambitAra = ambitRef.current;
    const k = clauDeBloqueig(autor.tipus, autor.id);
    const foto = fotoDelCanvi(vigentsDe(ambitAra), k);
    const nom = autor.nom || null;
    mutaCanvis(ambitAra, (c) => afigAlCanvi(c, Object.freeze({ tipus: autor.tipus, id: autor.id, nom, creatAl: null })));
    let desat;
    try {
      desat = await bloquejaAutor({ tipus: autor.tipus, id: autor.id, nom }, configRef.current);
    } catch (error) {
      if (desmuntat.current || ambitRef.current !== ambitAra) return;
      if (error?.code === CODI_MODERACIO.NO_DISPONIBLE) {
        setDialeg(null);
        showToast(omple(tradueix(t, AVISOS_MODERACIO.bloqueigNomesSessio), { nom: nomDe(autor) }), 'info');
        return;
      }
      mutaCanvis(ambitAra, (c) => revertix(c, k, foto));
      throw error;
    }
    if (desmuntat.current || ambitRef.current !== ambitAra) return;
    /* El que ha desat el servidor (el nom i l'hora) substituïx el provisional. */
    if (desat?.tipus === autor.tipus && String(desat.id) === autor.id) {
      mutaCanvis(ambitAra, (c) => (c.llevats.has(k) ? c : afigAlCanvi(c, Object.freeze({ ...desat, id: autor.id }))));
    }
    setDialeg(null);
    showToast(omple(tradueix(t, AVISOS_MODERACIO.bloqueigFet), { nom: nomDe(autor) }), 'success');
  }, [vigentsDe, mutaCanvis, showToast, t, nomDe]);

  /* Desbloquejar (la llista de bloquejos): si falla, la clau torna a com era
     i es rebutja amb el `code` perquè qui crida ho diga al seu lloc. */
  const desbloqueja = useCallback(async (autor) => {
    const tipus = String(autor?.tipus ?? '');
    const id = String(autor?.id ?? '');
    const ambitAra = ambitRef.current;
    const k = clauDeBloqueig(tipus, id);
    const foto = fotoDelCanvi(vigentsDe(ambitAra), k);
    const nom = nomDe({ tipus, id, nom: autor?.nom });
    mutaCanvis(ambitAra, (c) => llevaDelCanvi(c, k));
    try {
      await desbloquejaAutor({ tipus, id }, configRef.current);
    } catch (error) {
      if (desmuntat.current || ambitRef.current !== ambitAra) return;
      if (error?.code !== CODI_MODERACIO.NO_DISPONIBLE) {
        mutaCanvis(ambitAra, (c) => revertix(c, k, foto));
        throw error;
      }
    }
    if (desmuntat.current || ambitRef.current !== ambitAra) return;
    showToast(omple(tradueix(t, AVISOS_MODERACIO.desbloqueigFet), { nom }), 'success');
  }, [vigentsDe, mutaCanvis, nomDe, showToast, t]);

  /* Denunciar: el resultat el diu el diàleg, mai un avís. */
  const enviaDenuncia = useCallback(async (objectiu, { motiu, detall } = {}) => {
    if (!objectiu) throw errorDeModeracio(CODI_MODERACIO.OBJECTIU_INVALID);
    return denunciaContingut({
      objecte: { tipus: objectiu.tipus, id: objectiu.id },
      motiu,
      detall,
      autor: objectiu.autor ? { tipus: objectiu.autor.tipus, id: objectiu.autor.id } : null,
      filId: objectiu.filId
    }, configRef.current);
  }, []);

  /* ── Les normes de convivència (només refs: asseguraNormes és estable) ── */
  const normesActives = modeDades === 'remote' && Boolean(usuariId) && (disponible || ambNormes) && Boolean(Dialegs);
  const [acceptadesPer, setAcceptadesPer] = useState(null);
  const acceptades = useMemo(
    () => Boolean(usuariId) && (acceptadesPer === usuariId || getVal(clauDeNormes(usuariId), null) === VERSIO_NORMES_CONVIVENCIA),
    [usuariId, acceptadesPer]
  );
  const estatRef = useRef({ normesActives, acceptades, usuariId });
  useLayoutEffect(() => {
    estatRef.current = { normesActives, acceptades, usuariId };
  }, [normesActives, acceptades, usuariId]);
  const pendent = useRef(null);   // { promesa, resol }
  const resolNormes = useCallback((valor) => {
    const actual = pendent.current;
    pendent.current = null;
    actual?.resol(valor);
  }, []);

  /* El servidor pot saber que ja les havia acceptades (un altre dispositiu). */
  useEffect(() => {
    if (!normesActives || !ambNormes || acceptades) return undefined;
    const uid = usuariId;
    const controller = new AbortController();
    estatNormes({ ...configRef.current, signal: controller.signal }).then((estat) => {
      if (controller.signal.aborted || estatRef.current.usuariId !== uid || !estat?.acceptadaAl) return;
      setVal(clauDeNormes(uid), VERSIO_NORMES_CONVIVENCIA);
      estatRef.current = { ...estatRef.current, acceptades: true };
      setAcceptadesPer(uid);
    }).catch(() => {});
    return () => controller.abort();
  }, [normesActives, ambNormes, acceptades, usuariId]);

  const asseguraNormes = useCallback(() => {
    const estat = estatRef.current;
    if (!estat.normesActives || estat.acceptades) return Promise.resolve(true);
    if (pendent.current) return pendent.current.promesa;
    let resol;
    const promesa = new Promise((r) => { resol = r; });
    pendent.current = { promesa, resol };
    obre('normes', null, null);
    return promesa;
  }, [obre]);

  const acceptaLesNormes = useCallback(async () => {
    const uid = estatRef.current.usuariId;
    if (!uid) {
      setDialeg(null);
      resolNormes(false);
      return;
    }
    if (capacitat('normesConvivencia')) {
      try {
        await acceptaNormes(VERSIO_NORMES_CONVIVENCIA, configRef.current);
      } catch (error) {
        /* Sense la migració, l'acceptació es queda en este dispositiu. */
        if (error?.code !== CODI_MODERACIO.NO_DISPONIBLE) {
          if (desmuntat.current || estatRef.current.usuariId !== uid) return;
          throw error;
        }
      }
    }
    if (desmuntat.current || estatRef.current.usuariId !== uid) return;
    setVal(clauDeNormes(uid), VERSIO_NORMES_CONVIVENCIA);
    estatRef.current = { ...estatRef.current, acceptades: true };
    setAcceptadesPer(uid);
    setDialeg(null);
    resolNormes(true);
  }, [resolNormes]);
  const declinaNormes = useCallback(() => {
    setDialeg(null);
    resolNormes(false);
  }, [resolNormes]);

  /* Canviar d'àmbit (eixir, una altra persona, un altre backend) tanca el
     diàleg obert i resol la porta pendent amb false; desmuntar, també. */
  const ambitDelDialeg = useRef(ambit);
  useLayoutEffect(() => {
    if (ambitDelDialeg.current === ambit) return;
    ambitDelDialeg.current = ambit;
    setDialeg(null);
    resolNormes(false);
  }, [ambit, resolNormes]);
  useLayoutEffect(() => {
    desmuntat.current = false;
    return () => {
      desmuntat.current = true;
      resolNormes(false);
    };
  }, [resolNormes]);

  const normesPendents = normesActives && !acceptades;
  const codiErrorBloquejos = recurs.status === 'error' ? recurs.error?.code ?? null : null;
  const value = useMemo(() => ({
    disponible,
    potBloquejar,
    estatBloquejos: ESTAT_DEL_RECURS[recurs.status] ?? 'carregant',
    codiErrorBloquejos,
    bloquejats,
    esPersonaBloquejada,
    esElementBloquejat,
    objectiuDeTargeta: objectiuDeTargetaDeQuiMira,
    objectiuDeMissatge,
    objectiuDeContrapart,
    demanaDenuncia,
    demanaBloqueig,
    desbloqueja,
    normesPendents,
    asseguraNormes
  }), [disponible, potBloquejar, recurs.status, codiErrorBloquejos, bloquejats, esPersonaBloquejada, esElementBloquejat,
    objectiuDeTargetaDeQuiMira, demanaDenuncia, demanaBloqueig, desbloqueja, normesPendents, asseguraNormes]);

  const objectiu = dialeg?.objectiu ?? null;
  const autorDelDialeg = objectiu?.autor ?? null;
  const potBloquejarTambe = potBloquejar && objectiu?.bloquejable === true && Boolean(autorDelDialeg?.id)
    && !claus.has(clauDeBloqueig(autorDelDialeg.tipus, autorDelDialeg.id));

  return (
    <ModeracioContext.Provider value={value}>
      {children}
      {Dialegs ? (
        <Dialegs
          denuncia={{
            obert: dialeg?.tipus === 'denuncia',
            objectiu: dialeg?.tipus === 'denuncia' ? objectiu : null,
            potBloquejarTambe: dialeg?.tipus === 'denuncia' && potBloquejarTambe,
            onTanca: tanca,
            onEnvia: (dades) => enviaDenuncia(objectiu, dades),
            onBloqueja: () => setDialeg((d) => (d?.tipus === 'denuncia' ? { ...d, tipus: 'bloqueig' } : d))
          }}
          bloqueig={{
            obert: dialeg?.tipus === 'bloqueig',
            objectiu: dialeg?.tipus === 'bloqueig' ? objectiu : null,
            onTanca: tanca,
            onConfirma: () => confirmaBloqueig(objectiu)
          }}
          normes={{
            obert: dialeg?.tipus === 'normes',
            onTanca: declinaNormes,
            onAccepta: acceptaLesNormes
          }}
        />
      ) : null}
    </ModeracioContext.Provider>
  );
}
