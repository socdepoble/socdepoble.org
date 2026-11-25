/**
 * PaginaCopiaSeguretatXat.jsx — les dos pàgines «Còpia de seguretat» del full
 * Ajustos del Xat (Ajustos › Xats › Còpia de seguretat), com la còpia del xat
 * de les apps de missatgeria: Onada R28, pla 261115_0135, Lot C3.
 *
 *   · «Desa una còpia xifrada» (accio 'desa'), en dos passos:
 *       1. «Prepara la còpia»: la contrasenya dos vegades (12 caràcters com a
 *          mínim, amb l'ull de ControlContrasenya) i el motor xifra (PBKDF2
 *          de 600.000 iteracions i AES-256-GCM) el que este dispositiu té
 *          carregat (copiaSeguretatXat.js diu què hi entra i la pàgina ho diu
 *          a la persona, amb el recompte). Les contrasenyes s'esborren de la
 *          pàgina; el text xifrat es queda en memòria fins que la pàgina es
 *          desmunta.
 *       2. «Desa l'arxiu» (web) o «Comparteix l'arxiu» (app nativa), un botó a
 *          banda: el seu clic crida desaArxiuCopiaSeguretatXat ABANS de cap
 *          await, perquè el full de compartir (navigator.share) i el selector
 *          (showSaveFilePicker) demanen una activació d'usuari vigent, i
 *          després d'una xifra de segons la del primer clic ja pot haver
 *          caducat. A la web, el selector
 *          de fitxers o la descàrrega; dins de l'app nativa, només el full de
 *          compartir, perquè la descàrrega per enllaç del WebView no avisa si
 *          no ha desat res. Es pot tornar a prémer (després de cancel·lar, per
 *          exemple) sense tornar a xifrar. Sense full de compartir, o amb un
 *          full que no admet un arxiu .sdpbackup (Onada R28 · copia-xat-06:
 *          canShare es pregunta en muntar, amb un arxiu buit), la pàgina ho
 *          diu abans de demanar res.
 *       Onada R28 · copia-xat-03 · Amb converses però cap missatge carregat,
 *       un avís ho diu abans del formulari; i si només n'hi ha en algunes, el
 *       recompte diu en quantes (filsAmbMissatges).
 *   · «Comprova una còpia» (accio 'comprova'): tria l'arxiu, en llig la
 *     capçalera (descriuCopiaSeguretatXat: cap desxifrat, només la forma i
 *     l'àmbit) i, amb la contrasenya, importaCopiaSeguretatXat la desxifra i
 *     la valida sencera en memòria SENSE magatzem ni aplicaImportacio: cap
 *     escriptura, ni local ni al servidor, i cap funció de XatContext que
 *     escriga. Mostra quantes converses i missatges porta i de quines dates.
 *     Restaurar dins de l'app encara no hi és, i la pàgina ho diu.
 *
 * La contrasenya de la còpia no és la del compte: cada formulari porta un
 * camp d'usuari propi, amagat i de només lectura (autocomplete="username",
 * «Còpia del xat de Sóc de Poble»), i els camps de contrasenya diuen
 * new-password (desa) o current-password (comprova). Així, si el gestor de
 * contrasenyes del navegador o del sistema la vol guardar o omplir, la té
 * com una credencial a banda, i no la desa damunt de la del compte. Què fa
 * cada gestor no ho decidix esta pàgina.
 *
 * Els errors del motor (CODI_*) arriben en paraules de la gent
 * (errorDeLaCopia): al camp que toca (la contrasenya o l'arxiu, lligats per
 * aria-describedby, amb icona i text, mai només color) o a l'avís de la
 * pàgina. Regions vives: cada pàgina té l'avís de la pàgina (aria-live="polite",
 * sempre muntat i fora del flux quan és buit, com PaginaNotificacions), on les
 * Alerta entren amb viva={false} perquè cap rol no hi quede niat; «Comprova»
 * en té una segona, l'estat de l'arxiu triat (com CampFitxer de Pedra Seca).
 * El missatge «Treballant…» del Suspense que la carrega és de FullAjustos.
 * Mentre el motor treballa el botó queda ocupat i, si el focus havia caigut a
 * <body>, en acabar hi torna; un error de camp porta el focus al camp, i la
 * còpia preparada el porta al botó que la desa.
 *
 * Dos peces:
 *   · CosCopiaSeguretatXat: tot per props (àmbit, contingut, llengua, si és
 *     l'app nativa, el WebCrypto i el motor), per a les proves.
 *   · PaginaCopiaSeguretatXat (per defecte): llig useXat() i useUIState() i
 *     munta el cos. FullAjustos la carrega en diferit (lazyRouteRenovable, amb
 *     una barrera pròpia si el tros no arriba): el motor no entra al tros de
 *     /xat fins que la persona obri la pàgina.
 *
 * Onada R28 · copia-xat-04 · Sense WebCrypto (fora d'un context segur, com un
 * WordPress servit per http) el motor no pot xifrar ni obrir cap còpia: les
 * dos pàgines ho diuen en lloc dels formularis, abans de demanar res.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CircleAlert, FileUp } from 'lucide-react';
import { Alerta, Boto, ControlContrasenya } from '../../../components/PedraSeca/index.js';
import { useUIState } from '../../../app/contexts/UIContext';
import { useFullDiferit } from '../../../config/fullDiferit.js';
import { esAppNativa } from '../../../config/origenPublic.js';
import cssV1225 from '../../../css/diferit-xat-v1225.css?inline';
import { normalitzaLlenguaXat, textXatV1225 } from '../i18nVistesXatV1225.js';
import {
  CODI_DEGRADACIO,
  CODI_IDENTITAT_DIVERGENT,
  EXTENSIO_SDP_BACKUP,
  MIME_SDP_BACKUP,
  descriuCopiaSeguretatXat,
  desaArxiuCopiaSeguretatXat,
  exportaCopiaSeguretatXatAmbRebut,
  importaCopiaSeguretatXat,
  llegixArxiuCopiaSeguretatXat,
} from '../../../data/xat/copiaSeguretatPortatil.js';
import { useXat } from '../XatContext';
import { normalitzaNfcSeguraUi, superaPressupostMarques } from '../../../utils/normalitzaEntradaUi.js';
import {
  MIN_CARACTERS_CONTRASENYA, TEXTOS_COPIA, abastDeLaCopia, contingutDeLaCopia, criptoDisponible, errorDeLaCopia,
  formataData, formataNombre, resumDeLaCopia, textAmb,
} from '../copiaSeguretatXat.js';

const CAP = Object.freeze([]);
const RESERVA = (_clau, reserva) => reserva;

function instantMsDe(registre) {
  const candidat = registre?.esborratAl ?? registre?.editatAl ?? registre?.modificatAl ?? registre?.actualitzatAl ?? registre?.creatAl ?? null;
  if (typeof candidat === 'number' && Number.isFinite(candidat)) return candidat;
  if (typeof candidat === 'string' && candidat) {
    const ms = Date.parse(candidat);
    if (Number.isFinite(ms)) return ms;
  }
  return 0;
}

function esLapida(m) {
  return Boolean(m?.esborrat === true || m?.esborratAl);
}

/**
 * Normalitza qualsevol làpida (primera importació o fusió sobre un previ):
 * retira cos (`text`/`content`) i totes les referències d'adjunts per a
 * preservar privacitat sense resurrecció (C1+C6 ↔ G9 · Codex P1).
 */
function normalitzaLapidaRestauracio(base, entrant) {
  const combinat = base ? { ...base, ...entrant } : { ...entrant };
  delete combinat.adjunt;
  delete combinat.adjunts;
  delete combinat.attachment;
  delete combinat.attachments;
  delete combinat.media;
  delete combinat.arxiu;
  delete combinat.fitxer;
  if (combinat.metadades && typeof combinat.metadades === 'object') {
    const neta = { ...combinat.metadades };
    delete neta.adjunt;
    delete neta.adjunts;
    combinat.metadades = neta;
  }
  return {
    ...combinat,
    text: '',
    content: '',
    esborrat: true,
    esborratAl: entrant?.esborratAl || base?.esborratAl || new Date().toISOString()
  };
}

/**
 * Fusiona un registre nou sobre un previ preservant làpides (tombstones)
 * i aplicant edicions més recents sense resurrecció (C1+C6 ↔ G9).
 */
function fusionaMissatgeRestauracio(previ, entrant) {
  if (esLapida(entrant)) {
    if (previ && esLapida(previ) && instantMsDe(previ) >= instantMsDe(entrant)) {
      return { valor: normalitzaLapidaRestauracio(null, previ), canvi: false };
    }
    return {
      valor: normalitzaLapidaRestauracio(previ, entrant),
      canvi: true
    };
  }
  if (!previ) return { valor: entrant, canvi: true };
  if (esLapida(previ)) return { valor: normalitzaLapidaRestauracio(null, previ), canvi: false };
  const msPrevi = instantMsDe(previ);
  const msEntrant = instantMsDe(entrant);
  const textCanviat = (entrant.text ?? entrant.content ?? '') !== (previ.text ?? previ.content ?? '');
  if (msEntrant > msPrevi || (msEntrant === msPrevi && textCanviat && Boolean(entrant.editatAl || entrant.modificatAl))) {
    return { valor: { ...previ, ...entrant }, canvi: true };
  }
  return { valor: previ, canvi: false };
}

function creaErrorRestauracio(codi, missatge, cause = null) {
  const err = new Error(missatge);
  err.codi = codi;
  err.code = codi;
  if (cause) err.cause = cause;
  return err;
}

/**
 * Persistència local transaccional en IndexedDB (v1.2.25 · Lot G6 · P1 tancat).
 *  · MAI resol èxit en memòria si IndexedDB no existix, rebutja quota o falla la transacció.
 *  · Aplica làpides (tombstones) i edicions sense resurrecció.
 *  · Substituïble 1:1 per `creaMotorCopiaSeguretatXatV1225` (Codex C6).
 */
export async function restauraCopiaLocal(resultat, { abast, indexedDB = globalThis.indexedDB } = {}) {
  if (typeof indexedDB?.open !== 'function') {
    throw creaErrorRestauracio('RESTAURACIO_SENSE_IDB', 'IndexedDB no està disponible per a una restauració duradora.');
  }
  const clau = `${abast?.tenantId ?? 'local'}::${abast?.usuariId ?? 'anon'}`;

  return new Promise((resol, rebutja) => {
    let req;
    try {
      req = indexedDB.open('sdp-xat-copia-restaurada-v1', 1);
    } catch (cause) {
      const esQuota = cause?.name === 'QuotaExceededError';
      rebutja(creaErrorRestauracio(esQuota ? 'RESTAURACIO_QUOTA' : 'RESTAURACIO_ERROR_IDB', 'No s’ha pogut obrir IndexedDB.', cause));
      return;
    }

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('lots')) db.createObjectStore('lots', { keyPath: 'clau' });
    };

    req.onerror = () => {
      const cause = req.error || null;
      const esQuota = cause?.name === 'QuotaExceededError';
      rebutja(creaErrorRestauracio(esQuota ? 'RESTAURACIO_QUOTA' : 'RESTAURACIO_ERROR_IDB', 'Error en obrir IndexedDB.', cause));
    };

    req.onsuccess = () => {
      const db = req.result;
      let tx;
      try {
        tx = db.transaction('lots', 'readwrite');
      } catch (cause) {
        try { db.close(); } catch { /* ok */ }
        const esQuota = cause?.name === 'QuotaExceededError';
        rebutja(creaErrorRestauracio(esQuota ? 'RESTAURACIO_QUOTA' : 'RESTAURACIO_ERROR_IDB', 'Error en iniciar la transacció.', cause));
        return;
      }

      const store = tx.objectStore('lots');
      let resum = null;
      const fallaTx = (cause) => {
        try { db.close(); } catch { /* ok */ }
        const esQuota = cause?.name === 'QuotaExceededError';
        rebutja(creaErrorRestauracio(esQuota ? 'RESTAURACIO_QUOTA' : 'RESTAURACIO_ERROR_IDB', 'La transacció de restauració no s’ha confirmat.', cause));
      };

      tx.oncomplete = () => {
        try { db.close(); } catch { /* ok */ }
        resol(resum);
      };
      tx.onerror = () => fallaTx(tx.error || null);
      tx.onabort = () => fallaTx(tx.error || null);

      const getReq = store.get(clau);
      getReq.onerror = () => fallaTx(getReq.error || null);
      getReq.onsuccess = () => {
        try {
          const existent = getReq.result || {};
          const filsMap = new Map((Array.isArray(existent.fils) ? existent.fils : CAP).filter((f) => f?.id != null).map((f) => [String(f.id), f]));
          const missMap = new Map((Array.isArray(existent.missatges) ? existent.missatges : CAP).filter((m) => m?.id != null).map((m) => [String(m.id), m]));

          let filsNous = 0;
          let missatgesNous = 0;
          let missatgesActualitzats = 0;
          let duplicatsOmesos = 0;

          for (const fil of Array.isArray(resultat?.fils) ? resultat.fils : CAP) {
            if (!fil?.id) continue;
            const id = String(fil.id);
            if (!filsMap.has(id)) {
              filsMap.set(id, fil);
              filsNous += 1;
            } else {
              const previ = filsMap.get(id);
              if (instantMsDe(fil) > instantMsDe(previ)) filsMap.set(id, { ...previ, ...fil });
              duplicatsOmesos += 1;
            }
          }

          for (const m of Array.isArray(resultat?.missatges) ? resultat.missatges : CAP) {
            if (!m?.id) continue;
            const id = String(m.id);
            const tenia = missMap.has(id);
            const { valor, canvi } = fusionaMissatgeRestauracio(missMap.get(id), m);
            missMap.set(id, valor);
            if (!tenia) missatgesNous += 1;
            else if (canvi) missatgesActualitzats += 1;
            else duplicatsOmesos += 1;
          }

          resum = {
            filsNous,
            missatgesNous,
            missatgesActualitzats,
            duplicatsOmesos,
            totalFils: filsMap.size,
            totalMissatges: missMap.size,
            durable: true,
          };

          store.put({
            clau,
            desatAl: new Date().toISOString(),
            fils: [...filsMap.values()],
            missatges: [...missMap.values()]
          });
        } catch (cause) {
          try { tx.abort(); } catch { /* ok */ }
          fallaTx(cause);
        }
      };
    };
  });
}

/** El motor de veres; les proves (o el motor C1 de Codex) en poden passar un altre. */
export const MOTOR_COPIA = Object.freeze({
  exporta: exportaCopiaSeguretatXatAmbRebut,
  desa: desaArxiuCopiaSeguretatXat,
  llegix: llegixArxiuCopiaSeguretatXat,
  descriu: descriuCopiaSeguretatXat,
  importa: importaCopiaSeguretatXat,
  restaura: restauraCopiaLocal,
});

/* El focus s'ha perdut si és a <body>, enlloc o en un node que ja no hi és. */
function focusPerdut(node) {
  const arrel = node?.getRootNode?.();
  const actiu = arrel?.activeElement ?? null;
  const doc = node?.ownerDocument;
  return !actiu || actiu === doc?.body || actiu.isConnected === false;
}

const enfocaControl = (contenidor) => contenidor?.querySelector('input')?.focus();
const enfocaBoto = (contenidor, selector) => contenidor?.querySelector(selector)?.focus();

/* El text de l'error d'un camp, amb la icona: mai només el color. Sempre
   muntat (fora del flux i buit sense error) perquè aria-describedby l'apunte. */
function ErrorDeCamp({ id, text = null }) {
  return (
    <p id={id} className={text ? 'sdp-camp__error' : 'sdp-sr-only'}>
      {text ? <CircleAlert size={18} aria-hidden="true" focusable="false" /> : null}
      {text ? <span>{text}</span> : null}
    </p>
  );
}

/** Un camp de contrasenya: etiqueta pròpia, ajuda, ull i error lligats per id. */
function CampContrasenya({ etiqueta, ajuda = null, error = null, valor, onCanvi, contenidorRef, etiquetaUll, autoComplete = 'off', desactivat = false }) {
  const id = useId();
  const idAjuda = `${id}-ajuda`;
  const idError = `${id}-error`;
  const descrit = [ajuda ? idAjuda : null, error ? idError : null].filter(Boolean).join(' ') || undefined;
  return (
    <div className="sdp-camp" ref={contenidorRef}>
      <label className="sdp-camp__etiqueta" htmlFor={id}>{etiqueta}</label>
      {ajuda ? <p id={idAjuda} className="sdp-camp__ajuda">{ajuda}</p> : null}
      <ControlContrasenya
        id={id}
        value={valor}
        onChange={(event) => onCanvi(event.target.value)}
        autoComplete={autoComplete}
        etiquetaUll={etiquetaUll}
        aria-describedby={descrit}
        aria-invalid={error ? 'true' : undefined}
        disabled={desactivat}
      />
      <ErrorDeCamp id={idError} text={error} />
    </div>
  );
}

/* L'usuari propi de la credencial de la còpia (vegeu la capçalera), dins del
   mateix formulari que les contrasenyes: amagat a la vista amb
   sdp-nomes-lector (es pinta, no és display:none), fora de l'ordre de
   tabulació i dels lectors de pantalla, i de només lectura. */
function UsuariDeLaCopia({ t }) {
  return (
    <input
      type="text"
      name="username"
      className="sdp-nomes-lector"
      autoComplete="username"
      value={textAmb(TEXTOS_COPIA.usuari, t)}
      readOnly
      tabIndex={-1}
      aria-hidden="true"
    />
  );
}

/* L'avís de la pàgina: la regió viva de la pàgina, sempre muntada. */
function AvisDeLaPagina({ children = null }) {
  return (
    <div className={children ? 'sdp-xat-ajustos__grup' : 'sdp-sr-only'} aria-live="polite">
      {children}
    </div>
  );
}

/* ───────────────────────────── Desa ───────────────────────────── */

function FormulariDesa({ t, abast, contingut, locale, natiu, navegador, motor }) {
  const [contrasenya, setContrasenya] = useState('');
  const [repeticio, setRepeticio] = useState('');
  const [errors, setErrors] = useState({});
  /* El pas 1: null, { tipus: 'ocupat' } (xifrant) o { tipus: 'error', text }. */
  const [estat, setEstat] = useState(null);
  /* La còpia xifrada del pas 1 ({ text, fils, missatges }) i el lliurament
     del pas 2: null, { tipus: 'desant' }, { tipus: 'fet', metode, nom },
     { tipus: 'cancellat' } o { tipus: 'error', text }. */
  const [preparada, setPreparada] = useState(null);
  const [lliurament, setLliurament] = useState(null);
  const campContrasenya = useRef(null);
  const campRepeticio = useRef(null);
  const formulari = useRef(null);
  const grupArxiu = useRef(null);
  const focusDespres = useRef(null);
  const viu = useRef(true);
  useEffect(() => () => { viu.current = false; }, []);

  const ocupat = estat?.tipus === 'ocupat';
  const desant = lliurament?.tipus === 'desant';
  const fils = contingut?.fils ?? CAP;
  const missatges = contingut?.missatges ?? CAP;
  const buit = fils.length === 0;
  /* Onada R28 · copia-xat-03 · Converses sí, missatges cap: l'avís abans del
     formulari. Si només n'hi ha en algunes converses, el recompte diu en quantes. */
  const senseMissatges = !buit && missatges.length === 0;
  const filsAmbMissatges = Number.isSafeInteger(contingut?.filsAmbMissatges) ? contingut.filsAmbMissatges : null;
  const ambMissatgesEnAlgunes = filsAmbMissatges !== null && missatges.length > 0 && filsAmbMissatges < fils.length;
  /* Dins de l'app nativa només hi ha el full de compartir (vegeu la capçalera).
     Onada R28 · copia-xat-06 · No n'hi ha prou que existisca: es pregunta a
     canShare, abans de demanar la contrasenya i de xifrar, si admet un arxiu
     .sdpbackup (el mateix tipus que desaArxiuCopiaSeguretatXat li donarà).
     canShare no demana cap activació d'usuari, i l'arxiu de la pregunta és buit
     i no es comparteix mai. */
  const potCompartirArxiu = useMemo(() => {
    const ConstructorFitxer = globalThis.File;
    if (!natiu || typeof navegador?.share !== 'function' || typeof navegador?.canShare !== 'function'
      || typeof ConstructorFitxer !== 'function') return false;
    try {
      return navegador.canShare({ files: [new ConstructorFitxer([''], `copia${EXTENSIO_SDP_BACKUP}`, { type: MIME_SDP_BACKUP })] }) === true;
    } catch {
      return false;
    }
  }, [natiu, navegador]);
  const potDesar = !natiu || potCompartirArxiu;
  const etiquetaArxiu = textAmb(natiu ? TEXTOS_COPIA.desaComparteix : TEXTOS_COPIA.desaArxiu, t);

  /* El focus que demana l'última operació, quan el botó ja torna a estar actiu. */
  useEffect(() => {
    const desti = focusDespres.current;
    if (!desti || ocupat || desant) return;
    focusDespres.current = null;
    if (desti === 'contrasenya') enfocaControl(campContrasenya.current);
    else if (desti === 'repeticio') enfocaControl(campRepeticio.current);
    else if (desti === 'arxiu') {
      if (focusPerdut(grupArxiu.current)) enfocaBoto(grupArxiu.current, 'button');
    } else if (focusPerdut(formulari.current)) enfocaBoto(formulari.current, 'button[type="submit"]');
  });

  /* Pas 1 · Xifrar. Res no ix encara del dispositiu. */
  const prepara = async (event) => {
    event.preventDefault();
    if (ocupat) return;
    const clauNfc = normalitzaNfcSeguraUi(contrasenya, { maxLongitud: 1024 });
    if (clauNfc === null) {
      const parell = superaPressupostMarques(contrasenya) || contrasenya.length > 1024
        ? TEXTOS_COPIA.errorFormat
        : TEXTOS_COPIA.errorCurta;
      setErrors({ contrasenya: textAmb(parell, t, { n: MIN_CARACTERS_CONTRASENYA }) });
      setEstat(null);
      enfocaControl(campContrasenya.current);
      return;
    }
    if (clauNfc.trim().length < MIN_CARACTERS_CONTRASENYA) {
      setErrors({ contrasenya: textAmb(TEXTOS_COPIA.errorCurta, t, { n: MIN_CARACTERS_CONTRASENYA }) });
      setEstat(null);
      enfocaControl(campContrasenya.current);
      return;
    }
    const repeticioNfc = normalitzaNfcSeguraUi(repeticio, { maxLongitud: 1024 });
    if (repeticioNfc === null || clauNfc !== repeticioNfc) {
      setErrors({ repeticio: textAmb(TEXTOS_COPIA.errorDiferents, t) });
      setEstat(null);
      enfocaControl(campRepeticio.current);
      return;
    }
    setErrors({});
    setEstat({ tipus: 'ocupat' });
    try {
      /* Onada R29 · R29-E2EE-03 · Amb la vista que no té cada fil sencer des de la seq 1, els punts de
         partida de contingutDeLaCopia: el motor la declara «parcial» i no promet cap seq que no porta. */
      const desDeSeqPerFil = contingut?.desDeSeqPerFil && typeof contingut.desDeSeqPerFil === 'object' ? contingut.desDeSeqPerFil : null;
      const { text } = await motor.exporta({
        /* v1.2.10 (arbitratge Codex R32.11 ↔ Gemini R32.12) · La comparació va en NFC fitat (normalitzaEntradaUi.js), però el
           secret viatja tal com s'ha admés: el motor (copiaSeguretatPortatil.js · bytesContrasenya) és l'únic que el passa a
           NFC per a derivar la clau, i la interfície no transforma secrets. */
        usuariId: abast.usuariId, tenantId: abast.tenantId, fils, missatges, contrasenya, ...(desDeSeqPerFil ? { desDeSeqPerFil } : {})
      });
      if (!viu.current) return;
      setContrasenya('');
      setRepeticio('');
      setPreparada({ text, fils: fils.length, missatges: missatges.length });
      setLliurament(null);
      setEstat(null);
      focusDespres.current = 'arxiu';
    } catch (error) {
      if (!viu.current) return;
      const { camp, text } = errorDeLaCopia(error, t, 'desa', { natiu });
      if (camp === 'contrasenya') {
        setErrors({ contrasenya: text });
        setEstat(null);
        focusDespres.current = 'contrasenya';
      } else {
        setEstat({ tipus: 'error', text });
        focusDespres.current = 'boto';
      }
    }
  };

  /* Pas 2 · Desar o compartir l'arxiu ja xifrat. La crida al motor va la
     primera, dins del clic i abans de cap await: el full de compartir i el
     selector de fitxers s'obrin amb l'activació d'este clic. */
  const desaArxiu = () => {
    if (!preparada || desant) return;
    let promesa;
    try {
      promesa = Promise.resolve(motor.desa(preparada.text, natiu ? { prefereixCompartir: true, documentDom: null } : {}));
    } catch (error) {
      promesa = Promise.reject(error);
    }
    setLliurament({ tipus: 'desant' });
    promesa.then((resultat) => {
      if (!viu.current) return;
      focusDespres.current = 'arxiu';
      setLliurament(resultat?.lliurat === true
        ? { tipus: 'fet', metode: resultat.metode, nom: resultat.nomArxiu }
        : { tipus: 'cancellat' });
    }, (error) => {
      if (!viu.current) return;
      focusDespres.current = 'arxiu';
      setLliurament({ tipus: 'error', text: errorDeLaCopia(error, t, 'desa', { natiu }).text });
    });
  };

  let avis = null;
  if (ocupat) avis = <p className="sdp-xat-ajustos__nota">{textAmb(TEXTOS_COPIA.desaPreparant, t)}</p>;
  else if (estat?.tipus === 'error') avis = <Alerta to="error" viva={false}><p>{estat.text}</p></Alerta>;
  else if (lliurament?.tipus === 'fet') {
    const parell = lliurament.metode === 'selector-fitxers' ? TEXTOS_COPIA.desaFetSelector
      : lliurament.metode === 'web-share' ? TEXTOS_COPIA.desaFetCompartir : TEXTOS_COPIA.desaFetDescarrega;
    avis = (
      <Alerta to="exit" viva={false} titol={textAmb(TEXTOS_COPIA.desaFetTitol, t)}>
        <p>{textAmb(parell, t, { nom: lliurament.nom || '' })}</p>
        <p>{textAmb(TEXTOS_COPIA.desaFetComprova, t)}</p>
      </Alerta>
    );
  } else if (lliurament?.tipus === 'cancellat') avis = <Alerta to="info" viva={false}><p>{textAmb(TEXTOS_COPIA.desaCancellat, t)}</p></Alerta>;
  else if (lliurament?.tipus === 'error') avis = <Alerta to="error" viva={false}><p>{lliurament.text}</p></Alerta>;
  else if (preparada) {
    /* La còpia xifrada, abans de desar-la: el recompte és el d'eixe moment. */
    avis = (
      <Alerta to="exit" viva={false} titol={textAmb(TEXTOS_COPIA.desaFetTitol, t)}>
        <p>{textAmb(TEXTOS_COPIA.recompte, t, { fils: formataNombre(preparada.fils, locale), missatges: formataNombre(preparada.missatges, locale) })}</p>
        <p>{textAmb(TEXTOS_COPIA.desaPreparada, t, { boto: etiquetaArxiu })}</p>
      </Alerta>
    );
  }

  return (
    <>
      <div className="sdp-xat-ajustos__grup">
        <p className="sdp-xat-ajustos__nota">{textAmb(TEXTOS_COPIA.desaAbast, t)}</p>
        <p className="sdp-xat-ajustos__nota">
          {textAmb(TEXTOS_COPIA.recompte, t, { fils: formataNombre(fils.length, locale), missatges: formataNombre(missatges.length, locale) })}
        </p>
        {ambMissatgesEnAlgunes ? (
          <p className="sdp-xat-ajustos__nota">
            {textAmb(TEXTOS_COPIA.desaAmbMissatges, t, { amb: formataNombre(filsAmbMissatges, locale), fils: formataNombre(fils.length, locale) })}
          </p>
        ) : null}
      </div>
      {buit && !preparada ? (
        <div className="sdp-xat-ajustos__grup">
          <p className="sdp-xat-ajustos__nota">{textAmb(TEXTOS_COPIA.desaBuit, t)}</p>
        </div>
      ) : null}
      {!buit && !potDesar ? (
        <Alerta to="info" viva={false}><p>{textAmb(TEXTOS_COPIA.desaNatiu, t)}</p></Alerta>
      ) : null}
      {senseMissatges && potDesar && !preparada ? (
        <Alerta to="info" viva={false}><p>{textAmb(TEXTOS_COPIA.desaSenseMissatges, t)}</p></Alerta>
      ) : null}
      {!buit && potDesar && !preparada ? (
        <form ref={formulari} className="sdp-xat-ajustos__grup" noValidate onSubmit={prepara}>
          {/* Una credencial a banda de la del compte (vegeu la capçalera):
              l'usuari propi i new-password en els dos camps. */}
          <UsuariDeLaCopia t={t} />
          <CampContrasenya
            etiqueta={textAmb(TEXTOS_COPIA.contrasenya, t)}
            ajuda={textAmb(TEXTOS_COPIA.contrasenyaAjuda, t, { n: MIN_CARACTERS_CONTRASENYA })}
            error={errors.contrasenya || null}
            valor={contrasenya}
            onCanvi={(valor) => { setContrasenya(valor); if (errors.contrasenya) setErrors({}); }}
            contenidorRef={campContrasenya}
            etiquetaUll={textAmb(TEXTOS_COPIA.ull, t)}
            autoComplete="new-password"
            desactivat={ocupat}
          />
          <CampContrasenya
            etiqueta={textAmb(TEXTOS_COPIA.repetix, t)}
            error={errors.repeticio || null}
            valor={repeticio}
            onCanvi={(valor) => { setRepeticio(valor); if (errors.repeticio) setErrors({}); }}
            contenidorRef={campRepeticio}
            etiquetaUll={textAmb(TEXTOS_COPIA.ullRepetida, t)}
            autoComplete="new-password"
            desactivat={ocupat}
          />
          <Boto tipus="submit" varietat="primari" ple carregant={ocupat}>{textAmb(TEXTOS_COPIA.desaPrepara, t)}</Boto>
        </form>
      ) : null}
      <AvisDeLaPagina>{avis}</AvisDeLaPagina>
      {preparada && potDesar ? (
        <div ref={grupArxiu} className="sdp-xat-ajustos__grup">
          <Boto varietat="primari" ple carregant={desant} onClick={desaArxiu}>{etiquetaArxiu}</Boto>
        </div>
      ) : null}
    </>
  );
}

/* ─────────────────────────── Comprova ─────────────────────────── */

function FormulariComprova({ t, abast, locale, motor }) {
  const [arxiu, setArxiu] = useState(null);
  const [errorArxiu, setErrorArxiu] = useState(null);
  const [contrasenya, setContrasenya] = useState('');
  const [errorContrasenya, setErrorContrasenya] = useState(null);
  const [estat, setEstat] = useState(null);
  const idArxiu = useId();
  const idEstat = `${idArxiu}-estat`;
  const idError = `${idArxiu}-error`;
  const input = useRef(null);
  const campArxiu = useRef(null);
  const campContrasenya = useRef(null);
  const formulari = useRef(null);
  const focusDespres = useRef(null);
  const viu = useRef(true);
  useEffect(() => () => { viu.current = false; }, []);

  const ocupat = estat?.tipus === 'ocupat' || estat?.tipus === 'llegint';

  useEffect(() => {
    const desti = focusDespres.current;
    if (!desti || ocupat) return;
    focusDespres.current = null;
    if (desti === 'contrasenya') enfocaControl(campContrasenya.current);
    else if (desti === 'arxiu') enfocaBoto(campArxiu.current, 'button');
    else if (focusPerdut(formulari.current)) enfocaBoto(formulari.current, 'button[type="submit"]');
  });

  const ambError = (error) => {
    const { camp, text } = errorDeLaCopia(error, t, 'comprova');
    if (camp === 'contrasenya') {
      setErrorContrasenya(text);
      setEstat(null);
      focusDespres.current = 'contrasenya';
    } else if (camp === 'arxiu') {
      setErrorArxiu(text);
      setEstat(null);
      focusDespres.current = 'arxiu';
    } else {
      setEstat({ tipus: 'error', text });
      focusDespres.current = 'boto';
    }
  };

  /* Triar l'arxiu: es llig i se'n mira la capçalera (sense desxifrar res).
     L'àmbit de la capçalera no està autenticat: només estalvia la clau a qui
     ha triat la còpia d'un altre compte; la comprovació de veres és importa. */
  const tria = async (event) => {
    const fitxer = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!fitxer || ocupat) return;
    setArxiu(null);
    setErrorArxiu(null);
    setErrorContrasenya(null);
    setEstat({ tipus: 'llegint' });
    try {
      const bytes = await motor.llegix(fitxer);
      const capcalera = await motor.descriu(bytes);
      if (!viu.current) return;
      if (capcalera.xifrada !== true) throw Object.assign(new Error('Còpia sense xifrar.'), { codi: CODI_DEGRADACIO });
      if (capcalera.usuariId !== abast.usuariId || capcalera.tenantId !== abast.tenantId) {
        throw Object.assign(new Error('Còpia d’un altre àmbit.'), { codi: CODI_IDENTITAT_DIVERGENT });
      }
      setArxiu({ nom: typeof fitxer.name === 'string' ? fitxer.name : '', bytes });
      setEstat(null);
      focusDespres.current = 'contrasenya';
    } catch (error) {
      if (!viu.current) return;
      ambError(error);
    }
  };

  const envia = async (event) => {
    event.preventDefault();
    if (ocupat) return;
    if (!arxiu) {
      setErrorArxiu(textAmb(TEXTOS_COPIA.errorSenseArxiu, t));
      enfocaBoto(campArxiu.current, 'button');
      return;
    }
    if (!contrasenya) {
      setErrorContrasenya(textAmb(TEXTOS_COPIA.errorBuida, t));
      enfocaControl(campContrasenya.current);
      return;
    }
    const clauNfc = normalitzaNfcSeguraUi(contrasenya, { maxLongitud: 1024 });
    if (clauNfc === null) {
      setErrorContrasenya(textAmb(TEXTOS_COPIA.errorIncorrecta, t));
      setEstat(null);
      enfocaControl(campContrasenya.current);
      return;
    }
    setErrorContrasenya(null);
    setEstat({ tipus: 'ocupat' });
    try {
      /* Sense magatzem ni aplicaImportacio: el motor valida i torna, no escriu. */
      const resultat = await motor.importa(arxiu.bytes, {
        usuariIdEsperat: abast.usuariId,
        tenantIdEsperat: abast.tenantId,
        /* El secret tal com s'ha admés: el motor el normalitza (vegeu exporta). */
        contrasenya,
      });
      if (!viu.current) return;
      setContrasenya('');
      setEstat({ tipus: 'fet', resum: resumDeLaCopia(resultat) });
      focusDespres.current = 'boto';
    } catch (error) {
      if (!viu.current) return;
      ambError(error);
    }
  };

  let avis = null;
  if (estat?.tipus === 'ocupat') avis = <p className="sdp-xat-ajustos__nota">{textAmb(TEXTOS_COPIA.comprovaComprovant, t)}</p>;
  else if (estat?.tipus === 'fet') {
    const { resum } = estat;
    const des = formataData(resum.desDeMs, locale);
    const fins = formataData(resum.finsAMs, locale);
    const creada = formataData(resum.creatAtMs, locale, true);
    avis = (
      <Alerta to="exit" viva={false} titol={textAmb(TEXTOS_COPIA.comprovaFetTitol, t)}>
        <p>{textAmb(TEXTOS_COPIA.recompte, t, { fils: formataNombre(resum.fils, locale), missatges: formataNombre(resum.missatges, locale) })}</p>
        {des && fins ? <p>{textAmb(TEXTOS_COPIA.comprovaFetPeriode, t, { des, fins })}</p> : null}
        {creada ? <p>{textAmb(TEXTOS_COPIA.comprovaFetCreada, t, { data: creada })}</p> : null}
        <p>{textAmb(TEXTOS_COPIA.senseRestaurar, t)}</p>
      </Alerta>
    );
  } else if (estat?.tipus === 'error') avis = <Alerta to="error" viva={false}><p>{estat.text}</p></Alerta>;

  const etiquetaArxiu = textAmb(TEXTOS_COPIA.comprovaArxiu, t);
  const verb = textAmb(TEXTOS_COPIA.comprovaTria, t);
  const estatArxiu = arxiu ? textAmb(TEXTOS_COPIA.comprovaArxiuTriat, t, { nom: arxiu.nom }) : textAmb(TEXTOS_COPIA.comprovaCapArxiu, t);
  const descritArxiu = [idEstat, errorArxiu ? idError : null].filter(Boolean).join(' ');

  return (
    <>
      <div className="sdp-xat-ajustos__grup">
        <p className="sdp-xat-ajustos__nota">{textAmb(TEXTOS_COPIA.comprovaAbast, t)}</p>
      </div>
      <form ref={formulari} className="sdp-xat-ajustos__grup" noValidate onSubmit={envia}>
        {/* Com CampFitxer de Pedra Seca (les mateixes classes), amb els textos
            traduïts: el control natiu porta l'etiqueta i va fora de l'ordre de
            tabulació; el Boto és l'única parada de focus. Sense `accept`: el
            selector de Fitxers d'iOS deixa en gris les extensions que no
            coneix, i qui valida és el motor. */}
        <div className="sdp-camp" ref={campArxiu}>
          <label className="sdp-camp__etiqueta" htmlFor={idArxiu}>{etiquetaArxiu}</label>
          <div className="sdp-camp-fitxer">
            <input
              ref={input}
              id={idArxiu}
              type="file"
              className="sdp-nomes-lector"
              tabIndex={-1}
              aria-describedby={descritArxiu}
              aria-invalid={errorArxiu ? 'true' : undefined}
              disabled={ocupat}
              onChange={tria}
            />
            <Boto
              varietat="secundari"
              icona={FileUp}
              className="sdp-camp-fitxer__boto"
              aria-label={`${etiquetaArxiu}: ${verb}`}
              aria-describedby={descritArxiu}
              disabled={ocupat}
              onClick={() => input.current?.click()}
            >
              {verb}
            </Boto>
            <p id={idEstat} className="sdp-camp-fitxer__estat" aria-live="polite">{estatArxiu}</p>
          </div>
          <ErrorDeCamp id={idError} text={errorArxiu} />
        </div>
        {/* La mateixa credencial a banda que a «Desa» (vegeu la capçalera). */}
        <UsuariDeLaCopia t={t} />
        <CampContrasenya
          etiqueta={textAmb(TEXTOS_COPIA.contrasenya, t)}
          error={errorContrasenya}
          valor={contrasenya}
          onCanvi={(valor) => { setContrasenya(valor); if (errorContrasenya) setErrorContrasenya(null); }}
          contenidorRef={campContrasenya}
          etiquetaUll={textAmb(TEXTOS_COPIA.ull, t)}
          autoComplete="current-password"
          desactivat={ocupat}
        />
        <Boto tipus="submit" varietat="primari" ple carregant={estat?.tipus === 'ocupat'} disabled={estat?.tipus === 'llegint'}>
          {textAmb(TEXTOS_COPIA.comprovaBoto, t)}
        </Boto>
      </form>
      <AvisDeLaPagina>{avis}</AvisDeLaPagina>
    </>
  );
}

/* ─────────────────────────── Restaura (v1.2.25 · G1) ─────────────────────────── */

function FormulariRestaura({ t, abast, locale, idioma, motor }) {
  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'xat-v1225', cssV1225);

  const [arxiu, setArxiu] = useState(null);
  const [errorArxiu, setErrorArxiu] = useState(null);
  const [contrasenya, setContrasenya] = useState('');
  const [errorContrasenya, setErrorContrasenya] = useState(null);
  const [estat, setEstat] = useState(null);
  const [pendentConfirmacio, setPendentConfirmacio] = useState(null);
  const idArxiu = useId();
  const idEstat = `${idArxiu}-estat`;
  const idError = `${idArxiu}-error`;
  const input = useRef(null);
  const campArxiu = useRef(null);
  const campContrasenya = useRef(null);
  const botoConfirmaRef = useRef(null);
  const viu = useRef(true);
  useEffect(() => () => { viu.current = false; }, []);

  const ocupat = estat?.tipus === 'llegint' || estat?.tipus === 'ocupat' || estat?.tipus === 'restaurant';

  const ambError = (error) => {
    const { camp, text } = errorDeLaCopia(error, t, 'comprova');
    if (camp === 'contrasenya') {
      setErrorContrasenya(text);
      setEstat(null);
      enfocaControl(campContrasenya.current);
    } else if (camp === 'arxiu') {
      setErrorArxiu(text);
      setEstat(null);
      enfocaBoto(campArxiu.current, 'button');
    } else {
      setEstat({ tipus: 'error', text });
    }
  };

  const tria = async (event) => {
    const fitxer = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!fitxer || ocupat) return;
    setArxiu(null);
    setPendentConfirmacio(null);
    setErrorArxiu(null);
    setErrorContrasenya(null);
    setEstat({ tipus: 'llegint' });
    try {
      const bytes = await motor.llegix(fitxer);
      const capcalera = await motor.descriu(bytes);
      if (!viu.current) return;
      if (capcalera.xifrada !== true) throw Object.assign(new Error('Còpia sense xifrar.'), { codi: CODI_DEGRADACIO });
      if (capcalera.usuariId !== abast.usuariId || capcalera.tenantId !== abast.tenantId) {
        throw Object.assign(new Error('Còpia d’un altre àmbit.'), { codi: CODI_IDENTITAT_DIVERGENT });
      }
      setArxiu({ nom: typeof fitxer.name === 'string' ? fitxer.name : '', bytes });
      setEstat(null);
      enfocaControl(campContrasenya.current);
    } catch (error) {
      if (!viu.current) return;
      ambError(error);
    }
  };

  const revisa = async (event) => {
    event.preventDefault();
    if (ocupat) return;
    if (!arxiu) {
      setErrorArxiu(textAmb(TEXTOS_COPIA.errorSenseArxiu, t));
      enfocaBoto(campArxiu.current, 'button');
      return;
    }
    if (!contrasenya) {
      setErrorContrasenya(textAmb(TEXTOS_COPIA.errorBuida, t));
      enfocaControl(campContrasenya.current);
      return;
    }
    const clauNfc = normalitzaNfcSeguraUi(contrasenya, { maxLongitud: 1024 });
    if (clauNfc === null) {
      setErrorContrasenya(textAmb(TEXTOS_COPIA.errorIncorrecta, t));
      enfocaControl(campContrasenya.current);
      return;
    }
    setErrorContrasenya(null);
    setEstat({ tipus: 'ocupat' });
    try {
      const resultat = await motor.importa(arxiu.bytes, {
        usuariIdEsperat: abast.usuariId,
        tenantIdEsperat: abast.tenantId,
        contrasenya,
      });
      if (!viu.current) return;
      setContrasenya('');
      setPendentConfirmacio({ resultat, resum: resumDeLaCopia(resultat) });
      setEstat(null);
      queueMicrotask(() => botoConfirmaRef.current?.closest('button')?.focus());
    } catch (error) {
      if (!viu.current) return;
      ambError(error);
    }
  };

  const confirmaRestauracio = async () => {
    if (!pendentConfirmacio || ocupat) return;
    setEstat({ tipus: 'restaurant' });
    try {
      const fnRestaura = typeof motor.restaura === 'function' ? motor.restaura : restauraCopiaLocal;
      const fet = await fnRestaura(pendentConfirmacio.resultat, { abast });
      if (!viu.current) return;
      setPendentConfirmacio(null);
      setEstat({
        tipus: 'fet',
        filsNous: fet?.filsNous ?? pendentConfirmacio.resum.fils,
        missatgesNous: fet?.missatgesNous ?? pendentConfirmacio.resum.missatges,
        duplicatsOmesos: fet?.duplicatsOmesos ?? 0
      });
    } catch (err) {
      if (!viu.current) return;
      if (err?.commitConfirmat === true) {
        setPendentConfirmacio(null);
        setEstat({
          tipus: 'avis',
          text: textXatV1225(idioma, 'copia.restaura.commitConfirmat'),
          rebut: err?.rebut || null,
        });
        return;
      }
      const codi = err?.codi || err?.code || '';
      const clauErr = codi === 'RESTAURACIO_SENSE_IDB'
        ? 'copia.restaura.errorSenseIdb'
        : codi === 'RESTAURACIO_QUOTA' || err?.name === 'QuotaExceededError'
          ? 'copia.restaura.errorQuota'
          : 'copia.restaura.errorGeneral';
      setEstat({ tipus: 'error', text: textXatV1225(idioma, clauErr) });
    }
  };

  let avis = null;
  if (estat?.tipus === 'ocupat') avis = <p className="sdp-xat-ajustos__nota">{textAmb(TEXTOS_COPIA.comprovaComprovant, t)}</p>;
  else if (estat?.tipus === 'restaurant') avis = <p className="sdp-xat-ajustos__nota">{textXatV1225(idioma, 'copia.restaura.restaurant')}</p>;
  else if (estat?.tipus === 'fet') {
    avis = (
      <Alerta to="exit" viva={false} titol={textXatV1225(idioma, 'copia.restaura.exitTitol')}>
        <p>
          {textXatV1225(idioma, 'copia.restaura.exitText', {
            fils: formataNombre(estat.filsNous, locale),
            missatges: formataNombre(estat.missatgesNous, locale),
            omesos: formataNombre(estat.duplicatsOmesos, locale)
          })}
        </p>
      </Alerta>
    );
  } else if (estat?.tipus === 'avis') {
    avis = <Alerta to="avis" viva={false}><p>{estat.text}</p></Alerta>;
  } else if (estat?.tipus === 'error') {
    avis = <Alerta to="error" viva={false}><p>{estat.text}</p></Alerta>;
  }

  const etiquetaArxiu = textAmb(TEXTOS_COPIA.comprovaArxiu, t);
  const verb = textAmb(TEXTOS_COPIA.comprovaTria, t);
  const estatArxiu = arxiu ? textAmb(TEXTOS_COPIA.comprovaArxiuTriat, t, { nom: arxiu.nom }) : textAmb(TEXTOS_COPIA.comprovaCapArxiu, t);
  const descritArxiu = [idEstat, errorArxiu ? idError : null].filter(Boolean).join(' ');

  return (
    <div ref={arrelRef} className="sdp-xat-copia-restaura">
      <div className="sdp-xat-ajustos__grup">
        <p className="sdp-xat-ajustos__nota">{textXatV1225(idioma, 'copia.restaura.descripcio')}</p>
      </div>
      {!pendentConfirmacio ? (
        <form className="sdp-xat-ajustos__grup" noValidate onSubmit={revisa}>
          <div className="sdp-camp" ref={campArxiu}>
            <label className="sdp-camp__etiqueta" htmlFor={idArxiu}>{etiquetaArxiu}</label>
            <div className="sdp-camp-fitxer">
              <input
                ref={input}
                id={idArxiu}
                type="file"
                className="sdp-nomes-lector"
                tabIndex={-1}
                aria-describedby={descritArxiu}
                aria-invalid={errorArxiu ? 'true' : undefined}
                disabled={ocupat}
                onChange={tria}
              />
              <Boto
                varietat="secundari"
                icona={FileUp}
                className="sdp-camp-fitxer__boto"
                aria-label={`${etiquetaArxiu}: ${verb}`}
                aria-describedby={descritArxiu}
                disabled={ocupat}
                onClick={() => input.current?.click()}
              >
                {verb}
              </Boto>
              <p id={idEstat} className="sdp-camp-fitxer__estat" aria-live="polite">{estatArxiu}</p>
            </div>
            <ErrorDeCamp id={idError} text={errorArxiu} />
          </div>
          <UsuariDeLaCopia t={t} />
          <CampContrasenya
            etiqueta={textAmb(TEXTOS_COPIA.contrasenya, t)}
            error={errorContrasenya}
            valor={contrasenya}
            onCanvi={(valor) => { setContrasenya(valor); if (errorContrasenya) setErrorContrasenya(null); }}
            contenidorRef={campContrasenya}
            etiquetaUll={textAmb(TEXTOS_COPIA.ull, t)}
            autoComplete="current-password"
            desactivat={ocupat}
          />
          <Boto tipus="submit" varietat="primari" ple carregant={estat?.tipus === 'ocupat'} disabled={estat?.tipus === 'llegint'}>
            {textXatV1225(idioma, 'copia.restaura.comprovaPrimer')}
          </Boto>
        </form>
      ) : (
        <div className="sdp-xat-ajustos__grup">
          <Alerta to="avis" viva={false} titol={textXatV1225(idioma, 'copia.restaura.confirmacioTitol')}>
            <p>
              {textXatV1225(idioma, 'copia.restaura.confirmacioText', {
                fils: formataNombre(pendentConfirmacio.resum.fils, locale),
                missatges: formataNombre(pendentConfirmacio.resum.missatges, locale)
              })}
            </p>
          </Alerta>
          <div className="sdp-xat-copia-restaura__accions">
            <Boto varietat="primari" carregant={estat?.tipus === 'restaurant'} onClick={confirmaRestauracio}>
              <span ref={botoConfirmaRef}>{textXatV1225(idioma, 'copia.restaura.botoConfirma')}</span>
            </Boto>
            <Boto varietat="secundari" disabled={ocupat} onClick={() => setPendentConfirmacio(null)}>
              {textXatV1225(idioma, 'copia.restaura.cancella')}
            </Boto>
          </div>
        </div>
      )}
      <AvisDeLaPagina>{avis}</AvisDeLaPagina>
    </div>
  );
}

/* ───────────────────────────── El cos ───────────────────────────── */

/**
 * `accio`: 'desa', 'comprova' o 'restaura'. `abast`: { usuariId, tenantId } o null (sense
 * compte: només l'avís). `contingut`: { fils, missatges, filsAmbMissatges,
 * desDeSeqPerFil } de contingutDeLaCopia (només per a 'desa'). `natiu`: dins de l'app de
 * Capacitor. `cripto`: el WebCrypto del navegador (sense, només l'avís).
 * `motor`: el de veres per defecte.
 */
export function CosCopiaSeguretatXat({
  accio = 'desa', t = RESERVA, abast = null, contingut = null, locale = 'ca-ES', idioma = null, natiu = false,
  navegador = globalThis.navigator, cripto = globalThis.crypto, motor = MOTOR_COPIA,
}) {
  if (!abast) {
    return (
      <div className="sdp-xat-ajustos__grup">
        <p className="sdp-xat-ajustos__nota">{textAmb(TEXTOS_COPIA.senseCompte, t)}</p>
      </div>
    );
  }
  /* Onada R28 · copia-xat-04 · Abans de demanar res: sense WebCrypto, cap
     formulari, perquè el motor fallaria cada vegada (SENSE_CRIPTO). */
  if (!criptoDisponible(cripto)) {
    return <Alerta to="info" viva={false}><p>{textAmb(TEXTOS_COPIA.errorSenseCripto, t)}</p></Alerta>;
  }
  const codiIdioma = normalitzaLlenguaXat(idioma || locale);
  if (accio === 'comprova') return <FormulariComprova t={t} abast={abast} locale={locale} motor={motor} />;
  if (accio === 'restaura') return <FormulariRestaura t={t} abast={abast} locale={locale} idioma={codiIdioma} motor={motor} />;
  return <FormulariDesa t={t} abast={abast} contingut={contingut} locale={locale} natiu={natiu} navegador={navegador} motor={motor} />;
}

/** La pàgina amb les dades de l'app: el xat (useXat) i la llengua (useUIState). */
export default function PaginaCopiaSeguretatXat({ accio = 'desa', idioma = null, t = RESERVA }) {
  const { joId = null, joNom = null, joAvatar = null, ambitEstable = '', chatThreads = CAP, getThreadMessages = null } = useXat();
  const { locale = 'ca-ES', language = 'ca' } = useUIState() || {};
  const abast = useMemo(() => abastDeLaCopia({ joId, ambitEstable }), [joId, ambitEstable]);
  const contingut = useMemo(
    () => (accio === 'desa' ? contingutDeLaCopia({ chatThreads, getThreadMessages, joNom, joAvatar }) : null),
    [accio, chatThreads, getThreadMessages, joNom, joAvatar]
  );
  const natiu = useMemo(() => esAppNativa(), []);
  return <CosCopiaSeguretatXat accio={accio} t={t} abast={abast} contingut={contingut} locale={locale} idioma={idioma || language} natiu={natiu} />;
}
