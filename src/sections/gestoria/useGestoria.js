/**
 * useGestoria.js — l'estat i les accions del panell de la Gestoria.
 *
 * Tot viu en memòria, en un magatzem propi de cada panell (res a cap base de
 * dades ni a l'emmagatzematge del navegador): la carpeta triada, la proposta, el
 * creuament amb el correu i els fitxers generats. «Desenxufa» oblida la
 * carpeta i ho torna tot a l'estat inicial; desmuntar el panell, també.
 *
 * Tres aprovacions humanes:
 *   1. El tractor. Cada acció que el fa servir demana l'aprovació vigent
 *      just abans (obteAprovacio), sense memoritzar-la: si el Mestre la
 *      revoca, l'acció següent ja no passa. Analitzar i creuar el correu
 *      passen per la porta del tractor; generar i desar també la comproven.
 *   2. La proposta concreta. aprovaProposta en calcula l'empremta
 *      (empremtaProposta) i genera() només fa els fitxers si la proposta
 *      d'ara té eixa mateixa empremta. Qualsevol canvi posterior (una cel·la,
 *      el titular, una factura afegida o exclosa, el correu) l'anul·la.
 *   3. L'enviament el fa sempre la persona (EnviamentGestoria).
 *
 * Les incidències es recalculen amb auditaTrimestre cada vegada que canvia
 * la proposta: les de les factures, els proveïdors mensuals i el correu. Les
 * que només ixen dels documents de la carpeta (rebuts, còpies, PDF sense
 * llegir) es conserven tal com les va donar l'anàlisi.
 *
 * Dependències injectables: { obteAprovacio: async (id) => contextAprovacio,
 * subtle, inflate (per defecte inflateDisponible(entorn)), entorn = globalThis,
 * avui = () => new Date() }.
 */
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ErrorAprovacio, exigeixAprovacio } from '../tractors/nucli/aprovacio.js';
import { jsonCanonic } from '../tractors/nucli/canonic.js';
import { manifestNet } from '../tractors/nucli/empremta.js';
import { textError } from '../tractors/DialegAprovacio.jsx';
import { demanaCarpeta, fontDesDeFitxers, fontDesDeHandle, oblidaFont, potTriarCarpeta } from './font/fontNavegador.js';
import { SEVERITATS, auditaTrimestre } from './nucli/auditoria.js';
import { empremtaProposta, generaEntregables } from './nucli/entregables.js';
import { inflateDisponible } from './nucli/inflate.js';
import { CODIS_INCIDENCIA, MONEDA_DEL_FULL, crearFactura } from './nucli/model.js';
import { ErrorTractor, LIMITS_TRACTOR, executaCreuamentCorreus, executaTractorFactures } from './nucli/tractor.js';
import { TRACTOR_CORREUS, TRACTOR_FACTURES } from './tractors.js';

/* Els camps que la persona pot corregir d'una factura de la proposta. La
   moneda només es pot marcar com a euros: és la persona qui diu que els
   imports ja hi estan (els ha convertit o ja ho eren). */
export const CAMPS_EDITABLES = Object.freeze([
  'data', 'num', 'contrapart', 'nif', 'descripcio', 'subtotal', 'iva', 'total', 'retencio', 'tipus', 'moneda'
]);
/* Camps que no es lligen del document: canviar-los no toca la confiança de cap lectura. */
const SENSE_CONFIANCA = new Set(['tipus', 'moneda']);
export const FORMATS_ENTREGABLE = Object.freeze(['xlsx', 'csv']);

export const ESTAT_INICIAL = Object.freeze({
  font: null,
  nomCarpeta: '',
  potEscriure: false,
  ocupat: null,
  progres: null,
  error: null,
  avis: '',
  analisi: null,
  proposta: null,
  excloses: Object.freeze([]),
  versio: 0,
  correu: null,
  aprovacioProposta: null,
  entregables: null,
  desats: Object.freeze({}),
  sobreescriure: null
});

/* El que depén de l'anàlisi: es buida en canviar de carpeta o en tornar a analitzar. */
const SENSE_ANALISI = Object.freeze({
  analisi: null, proposta: null, excloses: ESTAT_INICIAL.excloses, correu: null,
  aprovacioProposta: null, entregables: null, desats: ESTAT_INICIAL.desats, sobreescriure: null
});
/* El que anul·la qualsevol canvi de la proposta o de les incidències. */
const SENSE_APROVACIO = Object.freeze({
  aprovacioProposta: null, entregables: null, desats: ESTAT_INICIAL.desats, sobreescriure: null
});

/* Incidències que es tornen a calcular amb la proposta d'ara (les altres són de la carpeta). */
const RECALCULADES = new Set([
  ...CODIS_INCIDENCIA, 'NIF_PROPI', 'DUPLICAT', 'FALTA_MENSUAL', 'FALTA_HABITUAL',
  'CORREU_NO_REVISAT', 'CORREU_PARCIAL', 'CORREU_SENSE_DOCUMENT'
]);

const TITOLS_TRACTOR = Object.freeze({
  PARAMETRES_INVALIDS: 'Les dades de l’operació no són vàlides.',
  CRIPTO_ABSENT: 'Este navegador no pot calcular empremtes.',
  FONT_INVALIDA: 'Encara no hi ha cap carpeta triada.',
  FONT_ILLEGIBLE: 'No s’ha pogut llegir la carpeta.',
  FONT_OBLIDADA: 'La carpeta s’ha desenxufat.',
  CARPETA_BUIDA: 'La carpeta no té cap fitxer.',
  MASSA_FITXERS: 'La carpeta té massa fitxers.',
  TRIMESTRE_NO_TROBAT: 'No s’ha trobat el trimestre a la carpeta.',
  RUTA_INVALIDA: 'Un fitxer té una ruta que no es pot llegir.',
  FITXER_ILLEGIBLE: 'No s’ha pogut llegir un fitxer.',
  FITXER_MASSA_GRAN: 'Un fitxer és massa gran.',
  SELECTOR_NO_DISPONIBLE: 'Este navegador no obri el selector de carpetes.',
  SELECCIO_CANCELLADA: 'No s’ha triat cap carpeta.',
  CAL_GEST: 'Torna a prémer el botó.',
  SELECTOR_FALLIT: 'El selector de carpetes ha fallat.',
  ESCRIPTURA_NO_PERMESA: 'Este fitxer no es pot escriure a la carpeta.',
  ESCRIPTURA_DENEGADA: 'No hi ha permís per a escriure a la carpeta.',
  CARPETA_NO_TROBADA: 'La carpeta del trimestre ja no hi és.',
  FITXER_JA_EXISTEIX: 'Ja hi ha un fitxer amb este nom.',
  ESCRIPTURA_FALLIDA: 'No s’ha pogut desar el fitxer.',
  ERROR_INTERN: 'L’operació s’ha aturat per un error inesperat.'
});

/* Un error de la UI, ja en paraules: { titol, detall, codi, to, accio }. `accio` diu en quin pas
   s'ha produït ('carpeta', 'correu', 'proposta' o 'fitxers'), perquè el panell el mostre allí. */
const falla = (accio, titol, detall = '') => ({ titol, detall, codi: 'GESTORIA', to: 'error', accio });
const errorDe = (accio, error, perDefecte) => ({ ...missatgeError(error, perDefecte), accio });

/**
 * Qualsevol error (ErrorAprovacio, ErrorTractor o un altre) com a missatge en
 * valencià per a la UI. Els d'aprovació, amb el text de DialegAprovacio.
 * @param {unknown} error
 * @param {string} [perDefecte]
 * @returns {{ titol: string, detall: string, codi: string, to: 'error'|'info', aprovacio?: boolean }}
 */
export function missatgeError(error, perDefecte = 'No s’ha pogut completar l’operació.') {
  if (error instanceof ErrorAprovacio) return { ...textError(error), codi: error.codi, to: 'error', aprovacio: true };
  const detallDe = (titol) => (typeof error?.message === 'string' && error.message.trim() !== titol ? error.message.trim() : '');
  if (error instanceof ErrorTractor) {
    const titol = TITOLS_TRACTOR[error.codi] ?? perDefecte;
    return { titol, detall: detallDe(titol), codi: error.codi, to: error.codi === 'SELECCIO_CANCELLADA' ? 'info' : 'error' };
  }
  return { titol: perDefecte, detall: detallDe(perDefecte), codi: 'ERROR_INTERN', to: 'error' };
}

/** La Data { a, m, d } local d'un Date (o d'un instant); null si no és vàlid. */
export function dataDeAvui(valor) {
  const d = typeof valor?.getFullYear === 'function' ? valor : new Date(valor);
  if (Number.isNaN(d.getTime())) return null;
  return { a: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
}

/** El trimestre natural anterior al d'una Data: el 2 d'octubre de 2026 → 3T de 2026. */
export function trimestreAnterior(data) {
  const t = Math.ceil(data.m / 3);
  return t === 1 ? { any: data.a - 1, t: 4 } : { any: data.a, t: t - 1 };
}

/* Un magatzem mínim per a useSyncExternalStore: les accions asíncrones lligen sempre l'estat d'ara. */
function creaMemoria() {
  let estat = ESTAT_INICIAL;
  const oients = new Set();
  const avisa = () => oients.forEach((oient) => oient());
  return {
    llig: () => estat,
    canvia(canvi) {
      estat = { ...estat, ...(typeof canvi === 'function' ? canvi(estat) : canvi) };
      avisa();
    },
    reinicia(canvi = {}) {
      estat = { ...ESTAT_INICIAL, ...canvi };
      avisa();
    },
    subscriu(oient) {
      oients.add(oient);
      return () => oients.delete(oient);
    }
  };
}

const pes = (severitat) => {
  const i = SEVERITATS.indexOf(severitat);
  return i < 0 ? SEVERITATS.length : i;
};

/**
 * Les incidències de la proposta d'ara: les recalculades amb auditaTrimestre
 * (factures, proveïdors i correu) i les que només ixen dels documents de la
 * carpeta, ordenades per severitat.
 * @param {{ analisi: object|null, proposta: object|null, correu: object|null }} estat
 * @returns {object[]}
 */
export function incidenciesDe({ analisi, proposta, correu } = {}) {
  if (!analisi || !proposta) return [];
  const auditoria = auditaTrimestre({
    any: proposta.any,
    t: proposta.t,
    factures: [...proposta.ingressos, ...proposta.despeses],
    documents: [],
    proveidors: analisi.proveidors,
    correus: correu ? correu.correus : null,
    nifsPropis: analisi.nifsPropis,
    avui: analisi.avui,
    duplicats: []
  });
  /* La cobertura del correu la diu el creuament, que ha vist tots els missatges i no només els de factura. */
  const recalculades = auditoria.incidencies.filter((i) => !(correu && i.codi === 'CORREU_PARCIAL'));
  const delCorreu = correu ? correu.incidencies.filter((i) => i.codi === 'CORREU_PARCIAL') : [];
  const deLaCarpeta = analisi.incidencies.filter((i) => !i.facturaId && !RECALCULADES.has(i.codi));
  return [...recalculades, ...delCorreu, ...deLaCarpeta].sort((x, y) => pes(x.severitat) - pes(y.severitat));
}

/* Mateix JSON canònic; si no se'n pot fer, no són iguals. */
function mateixContingut(x, y) {
  try {
    return jsonCanonic(x) === jsonCanonic(y);
  } catch {
    return false;
  }
}

const mateixManifest = (rebut, propi) => Boolean(rebut) && mateixContingut(manifestNet(rebut), manifestNet(propi));

/* L'aprovació d'ara mateix, sense memoritzar-la. Un error de lectura també és un «no». */
async function aprovacioDe(obteAprovacio, id) {
  if (typeof obteAprovacio !== 'function') {
    throw new ErrorAprovacio('APROVACIO_REQUERIDA', 'No hi ha cap porta d’aprovació connectada: obri la Gestoria des de la Wiki.');
  }
  try {
    return await obteAprovacio(id);
  } catch (error) {
    if (error instanceof ErrorAprovacio) throw error;
    throw new ErrorAprovacio('APROVACIO_REQUERIDA', `No s’ha pogut llegir l’aprovació de ${id}: ${error?.message ?? String(error)}`, { cause: error });
  }
}

/* La porta, per a les accions que no passen per executaTractor*: vigent i del manifest d'este codi. */
async function exigeixVigent(obteAprovacio, propi, subtle) {
  const aprovacio = await aprovacioDe(obteAprovacio, propi.id);
  try {
    await exigeixAprovacio({ ...aprovacio, subtle });
  } catch (error) {
    if (error instanceof ErrorAprovacio) throw error;
    throw new ErrorAprovacio('APROVACIO_REQUERIDA', `No s’ha pogut comprovar l’aprovació de ${propi.id}.`, { cause: error });
  }
  if (aprovacio?.manifest?.id !== propi.id || !mateixManifest(aprovacio.manifest, propi)) {
    throw new ErrorAprovacio('EMPREMTA_DIVERGENT', `L’aprovació rebuda no és la d’esta versió de ${propi.id}.`);
  }
  return aprovacio;
}

const totesDe = (proposta) => [...proposta.ingressos, ...proposta.despeses];
const nomFactura = (f) => (f.num ? `«${f.num}»` : 'sense número');
const plural = (n, una, moltes, cap = null) => {
  if (n === 0 && cap) return cap;
  return n === 1 ? una : `${n} ${moltes}`;
};

/**
 * @param {object} [deps]
 * @param {(id: string) => Promise<object>} [deps.obteAprovacio] contextAprovacio(id) de la porta de tractors
 * @param {SubtleCrypto} [deps.subtle]
 * @param {null|((b: Uint8Array) => Promise<Uint8Array>)} [deps.inflate] null: els PDF queden pendents
 * @param {object} [deps.entorn] per defecte, globalThis (showDirectoryPicker)
 * @param {() => Date} [deps.avui]
 */
export function useGestoria({ obteAprovacio, subtle, inflate, entorn = globalThis, avui = () => new Date() } = {}) {
  const [memoria] = useState(creaMemoria);
  const estat = useSyncExternalStore(memoria.subscriu, memoria.llig, memoria.llig);
  const deps = useRef(null);
  deps.current = { obteAprovacio, subtle, inflate, entorn, avui };
  /* Cada desenxufada (i el desmuntatge) obri un torn nou: el que acabe d'un torn vell no s'aplica. */
  const torn = useRef(0);
  const comptador = useRef(0);

  useEffect(() => () => {
    torn.current += 1;
    const { font } = memoria.llig();
    if (font) oblidaFont(font);
    memoria.reinicia();
  }, [memoria]);

  /* Un canvi de la proposta: versió nova i cap aprovació ni fitxer de la versió anterior. */
  const canviaProposta = useCallback((proposta, extra = {}) => {
    memoria.canvia((e) => ({ ...SENSE_APROVACIO, proposta, versio: e.versio + 1, error: null, ...extra }));
  }, [memoria]);

  const usaFont = useCallback((font, { nom } = {}) => {
    const { font: previa } = memoria.llig();
    if (previa && previa !== font) oblidaFont(previa);
    torn.current += 1;
    const nomCarpeta = typeof nom === 'string' && nom !== '' ? nom : (typeof font?.nom === 'string' ? font.nom : '');
    memoria.canvia((e) => ({
      ...SENSE_ANALISI,
      font,
      nomCarpeta,
      potEscriure: typeof font?.escriu === 'function',
      ocupat: null,
      progres: null,
      error: null,
      versio: e.versio + 1,
      avis: nomCarpeta ? `Carpeta triada: «${nomCarpeta}».` : 'Carpeta triada.'
    }));
    return true;
  }, [memoria]);

  /* Dins del gest de la persona: el selector s'obri abans de cap espera. */
  const triaCarpeta = useCallback(async () => {
    if (memoria.llig().ocupat) return false;
    const promesa = demanaCarpeta({ entorn: deps.current.entorn });
    memoria.canvia({ ocupat: 'carpeta', error: null, avis: '' });
    const meu = torn.current;
    let font;
    try {
      font = fontDesDeHandle(await promesa);
    } catch (error) {
      if (meu === torn.current) memoria.canvia({ ocupat: null, error: errorDe('carpeta', error, 'No s’ha pogut obrir la carpeta.') });
      return false;
    }
    if (meu !== torn.current) {
      oblidaFont(font);
      return false;
    }
    return usaFont(font);
  }, [memoria, usaFont]);

  /* Alternativa sense selector de carpetes: els fitxers d'un <input type="file" webkitdirectory>. */
  const usaFitxers = useCallback((fitxers) => {
    if (memoria.llig().ocupat || !fitxers || fitxers.length === 0) return false;
    try {
      return usaFont(fontDesDeFitxers(fitxers));
    } catch (error) {
      memoria.canvia({ error: errorDe('carpeta', error, 'No s’han pogut fer servir els fitxers triats.') });
      return false;
    }
  }, [memoria, usaFont]);

  const analitza = useCallback(async ({ any, t } = {}) => {
    const inicial = memoria.llig();
    if (inicial.ocupat) return false;
    if (!inicial.font) {
      memoria.canvia({ error: falla('carpeta', 'Encara no hi ha cap carpeta triada.', 'Tria-la al pas 2 i torna a analitzar.') });
      return false;
    }
    const meu = torn.current;
    const { obteAprovacio: obte, subtle: s, entorn: e, avui: hui } = deps.current;
    const descompressor = deps.current.inflate === undefined ? inflateDisponible(e) : deps.current.inflate;
    const dataAvui = dataDeAvui(hui());
    memoria.canvia({ ocupat: 'analisi', progres: null, error: null, avis: '' });
    try {
      /* Just abans de tocar la carpeta, i sense guardar-la: la porta la torna a comprovar. */
      const aprovacio = await aprovacioDe(obte, TRACTOR_FACTURES.id);
      const r = await executaTractorFactures({
        font: inicial.font,
        any,
        t,
        aprovacio,
        subtle: s,
        inflate: descompressor,
        avui: dataAvui,
        onProgres: (progres) => {
          if (meu === torn.current) memoria.canvia({ progres });
        }
      });
      if (meu !== torn.current) return false;
      const analisi = {
        documents: r.documents, incidencies: r.incidencies, cobertura: r.cobertura, avisos: r.avisos,
        proveidors: r.proveidors, nifsPropis: r.nifsPropis, avui: dataAvui
      };
      const n = incidenciesDe({ analisi, proposta: r.proposta, correu: null }).length;
      memoria.canvia((actual) => ({
        ...SENSE_ANALISI,
        ocupat: null,
        progres: null,
        analisi,
        proposta: r.proposta,
        versio: actual.versio + 1,
        avis: `Anàlisi del ${r.proposta.t}T de ${r.proposta.any} acabada: ${plural(r.proposta.ingressos.length, 'un ingrés', 'ingressos', 'cap ingrés')}, `
          + `${plural(r.proposta.despeses.length, 'una despesa', 'despeses', 'cap despesa')} i `
          + `${plural(n, 'una incidència', 'incidències', 'cap incidència')} per revisar.`
      }));
      return true;
    } catch (error) {
      if (meu === torn.current) memoria.canvia({ ocupat: null, progres: null, error: errorDe('carpeta', error, 'No s’ha pogut analitzar la carpeta.') });
      return false;
    }
  }, [memoria]);

  const editaTitular = useCallback((titular) => {
    const { proposta } = memoria.llig();
    if (!proposta || String(titular ?? '') === proposta.titular) return false;
    canviaProposta({ ...proposta, titular: String(titular ?? '') });
    return true;
  }, [memoria, canviaProposta]);

  /* Recrea la factura amb el camp nou (crearFactura la revalida). El que escriu la persona té confiança alta.
     Com qualsevol canvi de la proposta, anul·la l'aprovació (també marcar que els imports són en euros). */
  const editaFactura = useCallback((id, camp, valor) => {
    const { proposta } = memoria.llig();
    if (!proposta || !CAMPS_EDITABLES.includes(camp)) return false;
    if (camp === 'moneda' && valor !== MONEDA_DEL_FULL) return false;
    const vella = totesDe(proposta).find((f) => f.id === id);
    if (!vella) return false;
    const confianca = SENSE_CONFIANCA.has(camp) ? vella.confianca : { ...vella.confianca, [camp]: 'alta' };
    const nova = crearFactura({ ...vella, [camp]: valor, id: vella.id, estat: undefined, confianca });
    if (mateixContingut(nova, vella)) return false;
    const sense = (llista) => llista.filter((f) => f.id !== id);
    const substituix = (llista) => llista.map((f) => (f.id === id ? nova : f));
    let { ingressos, despeses } = proposta;
    let avis = '';
    if (nova.tipus === vella.tipus) {
      ingressos = substituix(ingressos);
      despeses = substituix(despeses);
    } else if (nova.tipus === 'ingres') {
      despeses = sense(despeses);
      ingressos = [...ingressos, nova];
      avis = `La factura ${nomFactura(nova)} ara és un ingrés.`;
    } else {
      ingressos = sense(ingressos);
      despeses = [...despeses, nova];
      avis = `La factura ${nomFactura(nova)} ara és una despesa.`;
    }
    canviaProposta({ ...proposta, ingressos, despeses }, avis ? { avis } : {});
    return true;
  }, [memoria, canviaProposta]);

  /* Una fila buida per a completar a mà. Torna l'id de la factura nova. */
  const afegixFactura = useCallback((tipus) => {
    const { proposta } = memoria.llig();
    if (!proposta) return null;
    comptador.current += 1;
    const nova = crearFactura({ tipus: tipus === 'ingres' ? 'ingres' : 'despesa', id: `manual_${comptador.current}`, origen: { metode: 'manual' } });
    const clau = nova.tipus === 'ingres' ? 'ingressos' : 'despeses';
    canviaProposta({ ...proposta, [clau]: [...proposta[clau], nova] }, {
      avis: nova.tipus === 'ingres' ? 'S’ha afegit un ingrés buit al final de la taula.' : 'S’ha afegit una despesa buida al final de la taula.'
    });
    return nova.id;
  }, [memoria, canviaProposta]);

  const exclouFactura = useCallback((id) => {
    const { proposta, excloses } = memoria.llig();
    const factura = proposta ? totesDe(proposta).find((f) => f.id === id) : null;
    if (!factura) return false;
    canviaProposta({
      ...proposta,
      ingressos: proposta.ingressos.filter((f) => f.id !== id),
      despeses: proposta.despeses.filter((f) => f.id !== id)
    }, { excloses: [...excloses, factura], avis: `S’ha exclòs la factura ${nomFactura(factura)}: no anirà al full.` });
    return true;
  }, [memoria, canviaProposta]);

  const restauraFactura = useCallback((id) => {
    const { proposta, excloses } = memoria.llig();
    const factura = excloses.find((f) => f.id === id);
    if (!proposta || !factura) return false;
    const clau = factura.tipus === 'ingres' ? 'ingressos' : 'despeses';
    canviaProposta({ ...proposta, [clau]: [...proposta[clau], factura] }, {
      excloses: excloses.filter((f) => f.id !== id),
      avis: `La factura ${nomFactura(factura)} torna a la proposta.`
    });
    return true;
  }, [memoria, canviaProposta]);

  /* Exportacions .mbox o .eml que tria la persona: la porta del correu, i només després es llig el text. */
  const creuaCorreus = useCallback(async (fitxers) => {
    const inicial = memoria.llig();
    const llista = Array.from(fitxers ?? []);
    if (inicial.ocupat) return false;
    if (!inicial.analisi || !inicial.proposta) {
      memoria.canvia({ error: falla('correu', 'Encara no hi ha cap trimestre analitzat.', 'Analitza abans la carpeta.') });
      return false;
    }
    if (llista.length === 0) return false;
    const meu = torn.current;
    const { obteAprovacio: obte, subtle: s } = deps.current;
    memoria.canvia({ ocupat: 'correu', error: null, avis: '' });
    try {
      const aprovacio = await exigeixVigent(obte, TRACTOR_CORREUS, s);
      const avisos = [];
      const textos = [];
      for (const fitxer of llista) {
        const nom = typeof fitxer?.name === 'string' && fitxer.name !== '' ? fitxer.name : 'sense nom';
        if (Number.isFinite(fitxer?.size) && fitxer.size > LIMITS_TRACTOR.midaCorreu) {
          avisos.push({ codi: 'FITXER_MASSA_GRAN', severitat: 'mitjana', fitxer: nom,
            missatge: `«${nom}» fa més de ${Math.round(LIMITS_TRACTOR.midaCorreu / (1024 * 1024))} MB: no s’ha llegit. Exporta només el trimestre.` });
          continue;
        }
        try {
          textos.push({ nom, text: await fitxer.text() });
        } catch {
          avisos.push({ codi: 'FITXER_ILLEGIBLE', severitat: 'mitjana', fitxer: nom, missatge: `«${nom}» no s’ha pogut llegir.` });
        }
      }
      if (meu !== torn.current) return false;
      if (textos.length === 0) {
        memoria.canvia({ ocupat: null, error: falla('correu', 'No s’ha pogut llegir cap exportació de correu.', avisos.map((a) => a.missatge).join(' ')) });
        return false;
      }
      const { proposta, analisi } = memoria.llig();
      const r = await executaCreuamentCorreus({
        fitxers: textos, any: proposta.any, t: proposta.t, factures: totesDe(proposta), proveidors: analisi.proveidors, aprovacio, subtle: s
      });
      if (meu !== torn.current) return false;
      const correu = {
        incidencies: r.incidencies,
        cobertura: avisos.length > 0 ? { ...r.cobertura, correu: 'parcial' } : r.cobertura,
        correus: r.correus,
        avisos: [...avisos, ...r.avisos],
        fitxers: llista.map((f) => (typeof f?.name === 'string' ? f.name : 'sense nom'))
      };
      memoria.canvia((e) => ({
        ...SENSE_APROVACIO,
        ocupat: null,
        correu,
        versio: e.versio + 1,
        avis: `Correu creuat: ${plural(r.cobertura.correusRevisats, 'un missatge revisat', 'missatges revisats')}, `
          + `${plural(r.correus.length, 'un de factura', 'de factura')}.`
      }));
      return true;
    } catch (error) {
      if (meu === torn.current) memoria.canvia({ ocupat: null, error: errorDe('correu', error, 'No s’ha pogut creuar el correu.') });
      return false;
    }
  }, [memoria]);

  /* La segona aprovació: l'empremta de la proposta d'ara. Torna l'aprovació o null. */
  const aprovaProposta = useCallback(async ({ acceptaIncidencies = false } = {}) => {
    const inicial = memoria.llig();
    if (inicial.ocupat || !inicial.proposta) return null;
    if (inicial.proposta.titular.trim() === '') {
      memoria.canvia({ error: falla('proposta', 'Falta el titular del full.', 'Escriu-lo al pas 3: és el nom que porten el full i els fitxers.') });
      return null;
    }
    const altes = incidenciesDe(inicial).filter((i) => i.severitat === 'alta');
    if (altes.length > 0 && acceptaIncidencies !== true) {
      memoria.canvia({ error: falla('proposta', `Hi ha ${plural(altes.length, 'una incidència', 'incidències')} d’alta severitat.`,
        'Revisa-les i, si vols generar el full igualment, marca «Genera-la igualment».') });
      return null;
    }
    const meu = torn.current;
    const { versio, proposta } = inicial;
    memoria.canvia({ ocupat: 'aprovacio', error: null });
    try {
      const empremta = await empremtaProposta(proposta, deps.current.subtle);
      if (meu !== torn.current) return null;
      if (memoria.llig().versio !== versio) {
        memoria.canvia({ ocupat: null, error: falla('proposta', 'La proposta ha canviat mentre l’aprovaves.', 'Revisa-la i torna-la a aprovar.') });
        return null;
      }
      const aprovacio = Object.freeze({ empremta, versio, acceptades: Object.freeze(altes.map((i) => i.missatge)) });
      memoria.canvia({ ocupat: null, aprovacioProposta: aprovacio, avis: 'Proposta aprovada.' });
      return aprovacio;
    } catch (error) {
      if (meu === torn.current) memoria.canvia({ ocupat: null, error: errorDe('proposta', error, 'No s’ha pogut aprovar la proposta.') });
      return null;
    }
  }, [memoria]);

  /* Els fitxers, només si la proposta d'ara és la que s'ha aprovat i el tractor continua aprovat. */
  const genera = useCallback(async () => {
    const inicial = memoria.llig();
    if (inicial.ocupat) return false;
    const aprovada = inicial.aprovacioProposta;
    if (!inicial.proposta || !aprovada || aprovada.versio !== inicial.versio) {
      memoria.canvia({ error: falla('proposta', 'Encara no has aprovat esta proposta.', 'Marca «He revisat la proposta» i torna a prémer «Genera el full».') });
      return false;
    }
    const meu = torn.current;
    const { versio, proposta } = inicial;
    const { obteAprovacio: obte, subtle: s } = deps.current;
    memoria.canvia({ ocupat: 'generant', error: null, avis: '' });
    try {
      await exigeixVigent(obte, TRACTOR_FACTURES, s);
      const empremta = await empremtaProposta(proposta, s);
      if (meu !== torn.current) return false;
      const ara = memoria.llig();
      if (empremta !== aprovada.empremta || ara.versio !== versio || ara.aprovacioProposta !== aprovada) {
        memoria.canvia({ ...SENSE_APROVACIO, ocupat: null, error: falla('proposta', 'La proposta ha canviat des que l’has aprovada.', 'Revisa-la i torna-la a aprovar.') });
        return false;
      }
      const entregables = await generaEntregables({ proposta, subtle: s });
      if (meu !== torn.current) return false;
      if (memoria.llig().versio !== versio) {
        memoria.canvia({ ocupat: null });
        return false;
      }
      memoria.canvia({
        ocupat: null, entregables, desats: ESTAT_INICIAL.desats, sobreescriure: null,
        avis: `Full generat: «${entregables.xlsx.nom}» i «${entregables.csv.nom}».`
      });
      return true;
    } catch (error) {
      if (meu === torn.current) memoria.canvia({ ocupat: null, error: errorDe('proposta', error, 'No s’ha pogut generar el full.') });
      return false;
    }
  }, [memoria]);

  /* A la carpeta del trimestre, si la Font pot escriure. Mai sobreescriu sense { sobreescriu: true }. */
  const desaAlTrimestre = useCallback(async (format, { sobreescriu = false } = {}) => {
    const inicial = memoria.llig();
    if (inicial.ocupat || !FORMATS_ENTREGABLE.includes(format)) return false;
    if (!inicial.entregables) {
      memoria.canvia({ error: falla('fitxers', 'Encara no hi ha cap full generat.', 'Genera’l al pas 4.') });
      return false;
    }
    if (typeof inicial.font?.escriu !== 'function') {
      memoria.canvia({ error: falla('fitxers', 'Esta carpeta no es pot escriure des d’este navegador.', 'Descarrega els fitxers i desa’ls tu a la carpeta del trimestre.') });
      return false;
    }
    const meu = torn.current;
    const fitxer = inicial.entregables[format];
    const prefix = inicial.analisi?.cobertura?.carpetaTrimestre ?? '';
    const ruta = prefix ? `${prefix}/${fitxer.nom}` : fitxer.nom;
    memoria.canvia({ ocupat: 'desant', error: null, sobreescriure: null, avis: '' });
    try {
      await exigeixVigent(deps.current.obteAprovacio, TRACTOR_FACTURES, deps.current.subtle);
      if (meu !== torn.current || memoria.llig().entregables !== inicial.entregables) {
        if (meu === torn.current) memoria.canvia({ ocupat: null });
        return false;
      }
      const r = await inicial.font.escriu(ruta, fitxer.dades, { sobreescriu: sobreescriu === true });
      if (meu !== torn.current) return false;
      memoria.canvia((e) => ({
        ocupat: null,
        desats: { ...e.desats, [format]: r },
        avis: `${r.sobreescrit ? 'Substituït' : 'Desat'}: «${r.ruta}».`
      }));
      return true;
    } catch (error) {
      if (meu !== torn.current) return false;
      if (error?.codi === 'FITXER_JA_EXISTEIX' && sobreescriu !== true) {
        memoria.canvia({ ocupat: null, sobreescriure: { format, ruta, nom: fitxer.nom } });
        return false;
      }
      memoria.canvia({ ocupat: null, error: errorDe('fitxers', error, 'No s’ha pogut desar el fitxer.') });
      return false;
    }
  }, [memoria]);

  const cancellaSobreescriure = useCallback(() => {
    if (!memoria.llig().sobreescriure) return;
    memoria.canvia({ sobreescriure: null, avis: 'No s’ha substituït res.' });
  }, [memoria]);

  const tancaError = useCallback(() => memoria.canvia({ error: null }), [memoria]);

  /* Un avís per al lector de pantalla (una descàrrega, per exemple). */
  const anuncia = useCallback((text) => memoria.canvia({ avis: String(text ?? '') }), [memoria]);

  /* Oblida la carpeta i ho torna tot a l'estat inicial. Res no queda en memòria. La versió
     continua creixent: cap revisió marcada abans no pot valdre per a dades noves. */
  const desenxufa = useCallback(() => {
    torn.current += 1;
    const { font, versio } = memoria.llig();
    if (font) oblidaFont(font);
    memoria.reinicia({ versio: versio + 1, avis: 'Desenxufat: s’ha oblidat la carpeta i tot el que se n’havia llegit.' });
    return true;
  }, [memoria]);

  const incidencies = useMemo(
    () => incidenciesDe({ analisi: estat.analisi, proposta: estat.proposta, correu: estat.correu }),
    [estat.analisi, estat.proposta, estat.correu]
  );

  /* La cobertura de la carpeta és la de l'anàlisi; la del correu, la del creuament (si n'hi ha). */
  const analisi = useMemo(() => {
    if (!estat.analisi) return null;
    const correu = estat.correu?.cobertura;
    return {
      documents: estat.analisi.documents,
      avisos: estat.analisi.avisos,
      cobertura: correu
        ? { ...estat.analisi.cobertura, correu: correu.correu, correusRevisats: correu.correusRevisats, periodeCorreu: correu.periodeCorreu }
        : estat.analisi.cobertura
    };
  }, [estat.analisi, estat.correu]);

  return {
    potTriarCarpeta: potTriarCarpeta(entorn),
    teCarpeta: Boolean(estat.font),
    nomCarpeta: estat.nomCarpeta,
    potEscriure: estat.potEscriure,
    ocupat: estat.ocupat,
    progres: estat.progres,
    error: estat.error,
    avis: estat.avis,
    analisi,
    proposta: estat.proposta,
    excloses: estat.excloses,
    versio: estat.versio,
    incidencies,
    correu: estat.correu,
    aprovacioProposta: estat.aprovacioProposta,
    propostaAprovada: Boolean(estat.aprovacioProposta && estat.aprovacioProposta.versio === estat.versio),
    entregables: estat.entregables,
    desats: estat.desats,
    sobreescriure: estat.sobreescriure,
    triaCarpeta,
    usaFitxers,
    usaFont,
    analitza,
    editaTitular,
    editaFactura,
    afegixFactura,
    exclouFactura,
    restauraFactura,
    creuaCorreus,
    aprovaProposta,
    genera,
    desaAlTrimestre,
    cancellaSobreescriure,
    tancaError,
    anuncia,
    desenxufa
  };
}
