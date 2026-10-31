/**
 * useGestorArxiusLocals.js — L'estat compartit del Gestor d'arxius locals
 * (IDEA-54/55 + P1-71 · Onada 261029_1605, Bloc E): volums, font oberta,
 * anàlisi, duplicats exactes, missatges, filtres i canvis sense desar. UNA
 * sola lectura del disc per a les tres columnes de /multimedia i per al
 * Gestor autònom (GestorMultimediaLocal), que el fa servir igual.
 *
 * Trasllat literal dels fluxos de GestorMultimediaLocal.jsx (volums, permís
 * com a PRIMERA espera del clic, testimonis de generació, oblit de la font en
 * tancar), amb estos canvis:
 *   · La selecció (carpeta i arxiu) és de qui el munta: `seleccioRef` la diu
 *     ({ carpeta, ruta } o null si no n'hi ha cap de local) i `onSeleccio` la
 *     canvia ({ carpeta?, ruta?, sal } · undefined = sense canvi; o
 *     { portada: true }). A `refresca`, onSeleccio va en el mateix bloc
 *     síncron que setEntrades: el model i la URL arriben junts.
 *   · La pàgina és per carpeta ({ carpeta, n }): torna a 1 en canviar de
 *     carpeta, sense cap efecte.
 *   · Sal ALEATÒRIA per volum (ids opacs, arbreMultimedia.js): la de la
 *     biblioteca (UUID) per als recordats i crypto.randomUUID() per als
 *     d'esta sessió.
 *   · QA-A01b · En eixir de veres de la sessió, el gestor muntat s'invalida
 *     tot sol: generació nova, font tancada (els registres de blob: revoquen
 *     les URL en desmuntar-se les seues peces), SHA-256 avortat, canvis
 *     descartats, volums buidats i, si es mirava una carpeta local, la
 *     portada. /multimedia és pública i el proveïdor no es desmunta: la
 *     persona següent d'un ordinador compartit no veu res de l'anterior.
 *     Gauntlet 261029 (cicle 1) · El senyal és l'avís de l'oblit
 *     (escoltaOblitCarpetesLocals), que arriba quan DESPRES_DE_TANCAR ja ha
 *     buidat la biblioteca, també des d'una altra pestanya; no es torna a
 *     llegir. currentUser a null no basta: arriba abans de l'oblit (la
 *     biblioteca encara és plena) i també amb una renovació fallida (abast
 *     'pestanya'), que no és eixir: el text sense desar i la carpeta oberta es
 *     queden. Una persona DIFERENT de l'última que hi havia (X → Y, també
 *     X → null → Y sense eixida) sí que invalida, i la biblioteca (que és del
 *     perfil) es torna a llegir amb un testimoni d'època. Un volum recordat
 *     que ja no és a la biblioteca no s'obri des de la Barra.
 *   · QA-A04 · Amb text sense desar, `beforeunload` (només llavors) avisa
 *     abans de tancar la pestanya o recarregar.
 *   · QA-R2-03 (Codex, Ronda 2) · tria, reconnecta, vincula i oblida capturen
 *     l'època de la biblioteca abans de la primera espera i la comproven
 *     després de cada una (`vigent`), abans de publicar estat, desar o obrir;
 *     obriVolum rep eixa època i no obri res d'una de vella. Un desat que
 *     aterra després de l'oblit es desfà. La biblioteca, per la seua banda,
 *     no deixa escriure un desat començat abans d'un oblit.
 *   · QA-R2-04 · Si l'oblit de l'eixida no ha pogut buidar la base, la
 *     biblioteca el deixa pendent: el muntatge no hi troba res (ni la Barra ni
 *     l'autoobertura) fins que un reintent el confirma.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSessioOpcional } from '../../app/contexts/SessionContext';
import {
  analitzaCarpetaMultimediaLocal, cercaDuplicatsExactesLocals, creaBibliotecaCarpetesLocals, demanaCarpeta,
  fontDesDeFitxers, fontDesDeHandle, indexaDuplicatsExactes, oblidaFont, potTriarCarpeta, verificaPermisCarpetaLocal
} from './motorMultimediaLocal.js';
import { escoltaOblitCarpetesLocals } from './bibliotecaCarpetesLocals.js';
import { canviaElDisc } from './suportGestorLocal.js';
import { TEXTOS_LOCAL as T, traduccioDeReserva } from './textosGestorLocal.js';

const OCUPATS = new Set(['comprovant', 'llegint']);

/** Una sal aleatòria per a un volum d'esta sessió (mai un comptador). */
export function salDeSessio(cripto = globalThis.crypto) {
  try {
    const id = cripto?.randomUUID?.();
    if (typeof id === 'string' && id) return id;
  } catch {
    /* sense randomUUID: la reserva de davall */
  }
  try {
    const bytes = new Uint8Array(16);
    cripto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }
}

export function useGestorArxiusLocals({
  cens = null,
  mitjansWeb = [],
  t = traduccioDeReserva,
  magatzemCarpetes = null,
  entorn = globalThis,
  cripto = globalThis.crypto,
  seleccioRef,
  onSeleccio
} = {}) {
  const bib = useMemo(() => magatzemCarpetes ?? creaBibliotecaCarpetesLocals(), [magatzemCarpetes]);

  const [recordats, setRecordats] = useState([]);
  const [deSessio, setDeSessio] = useState([]);
  const [volumActiu, setVolumActiu] = useState(null);
  const [estatVolum, setEstatVolum] = useState('cap');
  const [gestCaducat, setGestCaducat] = useState(false);
  const [font, setFont] = useState(null);
  const [sal, setSal] = useState(null);
  const [entrades, setEntrades] = useState([]);
  const [carpetesFont, setCarpetesFont] = useState([]);
  const [limitacions, setLimitacions] = useState([]);
  const [filtreEstat, setFiltreEstat] = useState('tots');
  const [filtreTipus, setFiltreTipus] = useState('tots');
  const [cerca, setCerca] = useState('');
  const [vista, setVista] = useState('graella');
  const [pagina, setPagina] = useState({ carpeta: '', n: 1 });
  const [versioDetall, setVersioDetall] = useState(0);
  const [canvisPendents, setCanvisPendents] = useState(false);
  const [rutaBruta, setRutaBruta] = useState(null);
  const [pendent, setPendent] = useState(null);
  const [missatge, setMissatge] = useState(null);
  const [duplicats, setDuplicats] = useState(null);
  const [progresHash, setProgresHash] = useState(null);
  const [bibliotecaLlesta, setBibliotecaLlesta] = useState(false);
  const [arrencadaLlesta, setArrencadaLlesta] = useState(false);

  const fontRef = useRef(null);
  const generacio = useRef(0);
  /* QA-A01b · L'època de la biblioteca: cada invalidació en fa una de nova, i
     una lectura feta abans (la del muntatge, una relectura) ja no hi escriu. */
  const epocaBib = useRef(0);
  const interaccio = useRef(false);
  const hashRef = useRef(null);
  const barraRef = useRef(null);
  const inputRef = useRef(null);
  const retornDialeg = useRef(null);
  const canvisRef = useRef(false);
  const viuRef = useRef(true);
  const onSeleccioRef = useRef(onSeleccio);
  useEffect(() => {
    onSeleccioRef.current = onSeleccio;
  }, [onSeleccio]);

  const volums = useMemo(() => [...recordats, ...deSessio], [recordats, deSessio]);
  const potEscriure = typeof font?.escriu === 'function';

  /* La selecció de qui munta el gestor: undefined = sense canvi. */
  const avisaSeleccio = useCallback((canvi) => {
    onSeleccioRef.current?.(canvi);
  }, []);

  const descartaCanvis = useCallback(() => {
    canvisRef.current = false;
    setCanvisPendents(false);
    setRutaBruta(null);
  }, []);

  /** L'editor diu si té text sense desar (i de quina ruta, si ho sap). */
  const marcaCanvis = useCallback((valor, ruta) => {
    const brut = Boolean(valor);
    canvisRef.current = brut;
    setCanvisPendents(brut);
    setRutaBruta(brut ? (typeof ruta === 'string' ? ruta : seleccioRef?.current?.ruta ?? null) : null);
  }, [seleccioRef]);

  /* Tanca la font oberta (sense oblidar el volum) i invalida les respostes pendents. */
  const buidaFont = useCallback(({ seleccio = true } = {}) => {
    const teniaFont = fontRef.current !== null;
    generacio.current += 1;
    hashRef.current?.abort();
    hashRef.current = null;
    if (fontRef.current) oblidaFont(fontRef.current);
    fontRef.current = null;
    setFont(null);
    setSal(null);
    setEntrades([]);
    setCarpetesFont([]);
    setLimitacions([]);
    setDuplicats(null);
    setProgresHash(null);
    descartaCanvis();
    /* La selecció local de la font tancada ja no val: torna a l'arrel. Sense
       font oberta (una reconnexió), la URL es queda: en obrir-se, apunta a
       l'arxiu que demanava. */
    if (seleccio && teniaFont && seleccioRef?.current != null) avisaSeleccio({ carpeta: '', ruta: null, sal: null });
  }, [avisaSeleccio, descartaCanvis, seleccioRef]);

  /* QA-R2-03 · Amb `epoca` (la que ha capturat qui l'obri abans de la seua
     primera espera), una continuació d'una època vella (l'eixida, o una altra
     persona, ha passat pel mig) no obri res: ni font ni generació nova. Un
     gestor desmuntat tampoc. */
  const obriVolum = useCallback(async (volum, { epoca = null } = {}) => {
    if (!viuRef.current || (epoca !== null && epoca !== epocaBib.current)) return;
    buidaFont();
    const gen = generacio.current;
    setVolumActiu(volum.id);
    setEstatVolum('llegint');
    setGestCaducat(false);
    setMissatge(null);
    let nova;
    try {
      nova = volum.fitxers ? fontDesDeFitxers(volum.fitxers, { nom: volum.nom }) : fontDesDeHandle(volum.handle);
    } catch (error) {
      setEstatVolum('error');
      setMissatge({ to: 'error', error });
      return;
    }
    try {
      const llista = await nova.llista();
      if (gen !== generacio.current) {
        oblidaFont(nova);
        return;
      }
      fontRef.current = nova;
      setFont(nova);
      setSal(volum.sal || volum.id);
      setEntrades(llista);
      setCarpetesFont([...nova.carpetes]);
      setLimitacions([...nova.limitacions]);
      setFiltreEstat('tots');
      setFiltreTipus('tots');
      setCerca('');
      setPagina({ carpeta: '', n: 1 });
      setEstatVolum('obert');
      if (!volum.efimer) Promise.resolve(bib.marcaAcces?.(volum.id)).catch(() => {});
    } catch (error) {
      oblidaFont(nova);
      if (gen !== generacio.current) return;
      const nom = error?.cause?.name;
      if (nom === 'NotFoundError') setEstatVolum('desaparegut');
      else if (nom === 'NotAllowedError' || nom === 'SecurityError') setEstatVolum('cal-permis');
      else {
        setEstatVolum('error');
        setMissatge({ to: 'error', error });
      }
    }
  }, [bib, buidaFont]);

  /* Muntatge: la carpeta usada més recentment s'obri sola amb el permís 'granted'. */
  useEffect(() => {
    let viu = true;
    const epoca = epocaBib.current;
    (async () => {
      let llista = [];
      try {
        llista = await bib.llista();
      } catch {
        llista = [];
      }
      if (!viu || epoca !== epocaBib.current) return;
      setBibliotecaLlesta(true);
      const valids = Array.isArray(llista) ? llista : [];
      setRecordats(valids);
      const primer = valids[0];
      if (!primer || interaccio.current) {
        setArrencadaLlesta(true);
        return;
      }
      setVolumActiu(primer.id);
      setEstatVolum('comprovant');
      const permis = await verificaPermisCarpetaLocal(primer.handle, { mode: 'read' });
      if (!viu || epoca !== epocaBib.current) return;
      if (interaccio.current) {
        setArrencadaLlesta(true);
        return;
      }
      if (permis === 'granted') await obriVolum(primer, { epoca });
      else setEstatVolum(permis === 'prompt' ? 'cal-permis' : 'denegat');
      if (viu) setArrencadaLlesta(true);
    })();
    return () => {
      viu = false;
    };
  }, [bib, obriVolum]);

  /* Desmuntatge: es tanca la font (els blob: els tanquen els seus registres). */
  useEffect(() => {
    viuRef.current = true;
    return () => {
      viuRef.current = false;
      generacio.current += 1;
      hashRef.current?.abort();
      if (fontRef.current) oblidaFont(fontRef.current);
      fontRef.current = null;
    };
  }, []);

  /* QA-A01b · Eixida de la sessió: el gestor no sobreviu a qui l'ha obert.
     `rellegeix`: la biblioteca del perfil es torna a llegir (una persona
     diferent sense eixida); després de l'oblit, no (ja és buida). */
  const invalida = useCallback(({ rellegeix = false } = {}) => {
    interaccio.current = true;
    epocaBib.current += 1;
    const epoca = epocaBib.current;
    const local = seleccioRef?.current != null;
    buidaFont({ seleccio: false });
    setPendent(null);
    setRecordats([]);
    setDeSessio([]);
    setVolumActiu(null);
    setEstatVolum('cap');
    setGestCaducat(false);
    setMissatge(null);
    setBibliotecaLlesta(true);
    setArrencadaLlesta(true);
    if (local) avisaSeleccio({ portada: true });
    if (!rellegeix) return;
    Promise.resolve()
      .then(() => bib.llista())
      .then((llista) => {
        if (viuRef.current && epoca === epocaBib.current) setRecordats(Array.isArray(llista) ? llista : []);
      })
      .catch(() => {});
  }, [bib, buidaFont, avisaSeleccio, seleccioRef]);

  const sessio = useSessioOpcional();
  const idUsuari = typeof sessio?.currentUser?.id === 'string' || typeof sessio?.currentUser?.id === 'number'
    ? String(sessio.currentUser.id) : null;
  /* L'última persona amb sessió: un null (renovació fallida o eixida encara
     en curs) no la canvia; l'oblit de l'eixida de veres la buida. */
  const darrerUsuari = useRef(idUsuari);
  useEffect(() => {
    if (idUsuari === null) return;
    const abans = darrerUsuari.current;
    darrerUsuari.current = idUsuari;
    if (abans !== null && abans !== idUsuari) invalida({ rellegeix: true });
  }, [idUsuari, invalida]);

  /* L'oblit de l'eixida de veres (esta pestanya o una altra): la biblioteca ja és buida. */
  const invalidaRef = useRef(invalida);
  useEffect(() => {
    invalidaRef.current = invalida;
  }, [invalida]);
  useEffect(() => escoltaOblitCarpetesLocals(() => {
    if (!viuRef.current) return;
    darrerUsuari.current = null;
    invalidaRef.current();
  }), []);

  /* QA-A04 · Tancar la pestanya o recarregar amb text sense desar: el
     navegador ho pregunta. Només mentre hi ha text brut. */
  useEffect(() => {
    if (!canvisPendents || typeof entorn?.addEventListener !== 'function') return undefined;
    const avisa = (event) => {
      event.preventDefault();
      event.returnValue = '';
      return '';
    };
    entorn.addEventListener('beforeunload', avisa);
    return () => entorn.removeEventListener?.('beforeunload', avisa);
  }, [canvisPendents, entorn]);

  const salRef = useRef(sal);
  useEffect(() => {
    salRef.current = sal;
  }, [sal]);

  /* Operació tardana (Gauntlet 261029, cicle 1) · Moure un vídeo gran dura
     minuts, i tornar a llegir un volum gran, segons: si la persona ja mira
     una altra cosa, el model es refresca però la URL no salta (ni se
     substituïx l'entrada de l'historial d'on és ara). Es seguix la ruta nova
     només si la selecció encara és la de l'operació (`origen`: { ruta } del
     fitxer) i no ha canviat mentre es tornava a llegir. */
  const clauSeleccio = useCallback(() => {
    const ara = seleccioRef?.current ?? null;
    return ara === null ? null : `${ara.carpeta ?? ''}\u0000${ara.ruta ?? ''}`;
  }, [seleccioRef]);
  const encaraEs = useCallback((origen) => {
    if (!origen || typeof origen !== 'object' || typeof origen.ruta !== 'string') return true;
    return (seleccioRef?.current?.ruta ?? null) === origen.ruta;
  }, [seleccioRef]);

  const refresca = useCallback(async ({ seleccio, carpeta, origen } = {}) => {
    const actual = fontRef.current;
    if (!actual) return;
    hashRef.current?.abort();
    hashRef.current = null;
    const gen = generacio.current;
    const abans = clauSeleccio();
    try {
      const llista = await actual.llista();
      if (gen !== generacio.current || fontRef.current !== actual) return;
      const segueix = encaraEs(origen) && clauSeleccio() === abans;
      setEntrades(llista);
      setCarpetesFont([...actual.carpetes]);
      setLimitacions([...actual.limitacions]);
      setDuplicats(null);
      setProgresHash(null);
      if (carpeta !== undefined && segueix) setPagina({ carpeta, n: 1 });
      /* En el mateix bloc síncron que setEntrades: el model i la selecció
         nous arriben junts al mateix commit. */
      if (segueix && (seleccio !== undefined || carpeta !== undefined)) avisaSeleccio({ carpeta, ruta: seleccio, sal: salRef.current });
    } catch (error) {
      if (gen === generacio.current) setMissatge({ to: 'error', error });
    }
  }, [avisaSeleccio, encaraEs, clauSeleccio]);

  /* Desat de text de l'editor (⌘S) · Gauntlet 261029 (cicle 1): el fitxer ja
     existia i no canvia cap carpeta, així que només s'actualitza la seua
     entrada (mida i data, amb font.info), sense recórrer tot el volum. La
     verificació SHA-256 en curs continua, i el resultat d'una d'acabada només
     es descarta si el fitxer desat en formava part. La selecció no es toca. */
  const enDesatText = useCallback(async (ruta) => {
    const actual = fontRef.current;
    if (!actual || typeof ruta !== 'string') return;
    const gen = generacio.current;
    let info;
    try {
      info = await actual.info(ruta);
    } catch {
      refresca();
      return;
    }
    if (gen !== generacio.current || fontRef.current !== actual) return;
    setEntrades((abans) => {
      const i = abans.findIndex((entrada) => entrada.ruta === info.ruta);
      if (i < 0) return [...abans, { ruta: info.ruta, mida: info.mida, modificat: info.modificat }];
      const noves = [...abans];
      noves[i] = { ...abans[i], mida: info.mida, modificat: info.modificat };
      return noves;
    });
    setDuplicats((abans) => (abans?.grups?.some((grup) => grup?.rutes?.includes?.(info.ruta)) ? null : abans));
  }, [refresca]);

  /* Amb canvis sense desar, l'acció espera la confirmació de descartar-los. */
  const demanaCanvi = useCallback((accio) => {
    if (!canvisRef.current) {
      accio();
      return;
    }
    /* En cancel·lar, el focus torna on era (també dins de l'ombra de l'encastat). */
    retornDialeg.current = barraRef.current?.getRootNode?.()?.activeElement ?? null;
    setPendent(() => accio);
  }, []);

  const confirmaPendent = () => {
    retornDialeg.current = null;
    const accio = pendent;
    setPendent(null);
    descartaCanvis();
    accio?.();
  };

  const cancelaPendent = () => {
    setPendent(null);
    const retorn = retornDialeg.current;
    retornDialeg.current = null;
    if (retorn?.isConnected) retorn.focus();
  };

  const enfocaVincula = () => barraRef.current?.querySelector('[data-accio="vincula"]')?.focus();

  /* QA-R2-03 (Codex, Ronda 2) · Cert si l'època capturada abans de la
     primera espera encara és la vigent: l'eixida (en esta pestanya o en una
     germana) o una persona diferent la fan caducar. Cada continuació ho mira
     després de cada espera, abans de publicar estat, desar o obrir. */
  const vigent = (epoca) => epoca === epocaBib.current;

  const vincula = async () => {
    interaccio.current = true;
    if (!potTriarCarpeta(entorn)) {
      inputRef.current?.click();
      return;
    }
    const epoca = epocaBib.current;
    let handle;
    try {
      handle = await demanaCarpeta({ mode: 'read', entorn });
    } catch (error) {
      if (vigent(epoca) && error?.codi !== 'SELECCIO_CANCELLADA') setMissatge({ to: 'error', error });
      return;
    }
    /* El selector ha tornat després de l'eixida: no es desa ni s'obri res. */
    if (!vigent(epoca)) return;
    let desat = null;
    try {
      desat = await bib.desa(handle);
    } catch {
      desat = { ok: false, codi: 'TRANSACCIO_FALLIDA' };
    }
    if (!vigent(epoca)) {
      /* El desat ha aterrat després de l'oblit (p. ex. el d'una pestanya
         germana, que ha buidat la base abans d'esta escriptura): es desfà. */
      if (desat?.ok && desat.carpeta?.id) await Promise.resolve(bib.oblida(desat.carpeta.id)).catch(() => {});
      return;
    }
    if (desat?.ok) {
      const registre = (await bib.recupera(desat.carpeta.id)) || { ...desat.carpeta, handle };
      if (!vigent(epoca)) return;
      const llista = await bib.llista();
      if (!vigent(epoca)) return;
      setRecordats(llista);
      await obriVolum(registre, { epoca });
      if (!vigent(epoca)) return;
      if (desat.desplacades?.length) {
        setMissatge({ to: 'info', parell: T.desplacades, valors: { noms: desat.desplacades.map((d) => d.nom).join(', ') } });
      }
      return;
    }
    const efimer = { id: `sessio:${salDeSessio(cripto)}`, nom: handle?.name || '…', handle, efimer: true };
    setDeSessio((abans) => [...abans, efimer]);
    await obriVolum(efimer, { epoca });
    if (!vigent(epoca)) return;
    setMissatge({ to: 'avis', parell: T.noRecordada, motiu: desat?.codi || 'TRANSACCIO_FALLIDA' });
  };

  /* El fallback de Safari i Firefox: només lectura, només esta sessió, mai a la biblioteca. */
  const enTriarFitxers = (event) => {
    const fitxers = Array.from(event.target?.files ?? []);
    if (fitxers.length === 0) return;
    interaccio.current = true;
    const primera = String(fitxers.find((f) => String(f?.webkitRelativePath || '').includes('/'))?.webkitRelativePath || '');
    const nom = primera.includes('/') ? primera.split('/')[0] : (fitxers[0]?.name || '…');
    const volum = { id: `sessio:fitxers:${salDeSessio(cripto)}`, nom, fitxers, efimer: true };
    setDeSessio((abans) => [...abans.filter((v) => !v.fitxers), volum]);
    obriVolum(volum);
  };

  /* QA-A01b · Si un volum recordat encara és a la biblioteca. Es crida ABANS
     del permís i s'espera DESPRÉS: el permís continua sent la primera espera
     del clic. Els volums d'esta sessió no hi són mai: valen. */
  const encaraRecordat = (volum) => {
    if (volum?.efimer || volum?.fitxers || typeof bib.recupera !== 'function') return Promise.resolve(true);
    return Promise.resolve()
      .then(() => bib.recupera(volum.id))
      .then((registre) => Boolean(registre), () => false);
  };
  /* Un volum que l'eixida (o una altra pestanya) ja ha oblidat: es lleva de la Barra i no s'obri. */
  const jaOblidat = (volum) => {
    setRecordats((abans) => abans.filter((v) => v.id !== volum.id));
    if (volum.id === volumActiu) {
      buidaFont();
      setVolumActiu(null);
      setEstatVolum('cap');
    }
  };

  const tria = async (volum) => {
    interaccio.current = true;
    if (volum.id === volumActiu && estatVolum === 'obert') return;
    if (volum.fitxers) {
      obriVolum(volum);
      return;
    }
    /* QA-R2-03 · `recordat` es demana abans del permís (que continua sent la
       primera espera del clic) i pot dir «encara hi és» d'abans de l'eixida:
       l'època, capturada ací, mana després de les dues esperes. */
    const epoca = epocaBib.current;
    const recordat = encaraRecordat(volum);
    const permis = await verificaPermisCarpetaLocal(volum.handle, { mode: 'read', demana: true });
    const esRecordat = await recordat;
    if (!vigent(epoca)) return;
    if (!esRecordat) {
      jaOblidat(volum);
      return;
    }
    if (permis === 'granted') {
      obriVolum(volum, { epoca });
      return;
    }
    buidaFont();
    setVolumActiu(volum.id);
    setEstatVolum(permis === 'prompt' ? 'cal-permis' : 'denegat');
    setGestCaducat(permis === 'prompt');
  };

  const reconnecta = async (volum) => {
    interaccio.current = true;
    const epoca = epocaBib.current;
    const recordat = encaraRecordat(volum);
    const permis = await verificaPermisCarpetaLocal(volum.handle, { mode: 'read', demana: true });
    const esRecordat = await recordat;
    if (!vigent(epoca)) return;
    if (!esRecordat) {
      jaOblidat(volum);
      return;
    }
    if (permis === 'granted') obriVolum(volum, { epoca });
    else if (permis === 'prompt') setGestCaducat(true);
    else setEstatVolum('denegat');
  };

  const oblida = async (volum) => {
    interaccio.current = true;
    if (volum.id === volumActiu) {
      buidaFont();
      setVolumActiu(null);
      setEstatVolum('cap');
      enfocaVincula();
    }
    if (volum.efimer) {
      setDeSessio((abans) => abans.filter((v) => v.id !== volum.id));
      return;
    }
    const epoca = epocaBib.current;
    await bib.oblida(volum.id);
    const llista = await bib.llista();
    /* QA-R2-03 · Una lectura d'abans de l'eixida no torna a posar res a la Barra. */
    if (vigent(epoca)) setRecordats(llista);
  };

  const desconnecta = () => {
    buidaFont();
    setVolumActiu(null);
    setEstatVolum('cap');
    enfocaVincula();
  };

  const relleig = () => {
    setVersioDetall((v) => v + 1);
    refresca();
  };

  /* ── Anàlisi i recomptes ── */
  const analisi = useMemo(() => analitzaCarpetaMultimediaLocal(entrades, { cens, mitjansWeb }), [entrades, cens, mitjansWeb]);
  const exactes = useMemo(() => (duplicats ? indexaDuplicatsExactes(duplicats.grups) : null), [duplicats]);
  const carpetes = useMemo(
    () => [...new Set([...carpetesFont, ...analisi.carpetes])].sort((a, b) => a.localeCompare(b)),
    [carpetesFont, analisi.carpetes]
  );
  const comptes = useMemo(() => {
    const mapa = new Map();
    for (const el of analisi.elements) {
      const segs = el.ruta.split('/');
      for (let i = 1; i < segs.length; i += 1) {
        const carpeta = segs.slice(0, i).join('/');
        mapa.set(carpeta, (mapa.get(carpeta) || 0) + 1);
      }
    }
    return mapa;
  }, [analisi.elements]);
  const perRuta = useMemo(() => new Map(analisi.elements.map((el) => [el.ruta, el])), [analisi.elements]);
  const elementDe = useCallback((ruta) => (typeof ruta === 'string' ? perRuta.get(ruta) || null : null), [perRuta]);

  /* Una ruta bruta que ja no existix (moguda o esborrada des de fora) es deixa. */
  useEffect(() => {
    if (rutaBruta !== null && font && !perRuta.has(rutaBruta)) descartaCanvis();
  }, [rutaBruta, font, perRuta, descartaCanvis]);

  const paginaDe = useCallback((carpeta) => (pagina.carpeta === carpeta ? pagina.n : 1), [pagina]);
  const triaPagina = useCallback((carpeta, n) => setPagina({ carpeta, n }), []);

  /* El resultat d'una operació del detall o de les accions de carpeta. */
  const enFet = ({ missatge: nou = null, error = null, seleccio, carpeta, origen, refresca: cal = false } = {}) => {
    if (error) setMissatge({ to: 'error', error });
    else if (nou) setMissatge(nou);
    if (seleccio === null && encaraEs(origen)) descartaCanvis();
    if (error && !cal && !canviaElDisc(error)) return;
    refresca({ seleccio, carpeta, origen });
  };

  const enNouFitxer = async (ruta) => {
    setMissatge({ to: 'exit', parell: T['text.creat'], valors: { ruta } });
    const abans = clauSeleccio();
    await refresca();
    /* Si mentre es tornava a llegir la persona ha anat a una altra vista, el fitxer nou no la hi trau. */
    if (!viuRef.current || clauSeleccio() !== abans) return;
    demanaCanvi(() => avisaSeleccio({ ruta, sal: salRef.current }));
  };

  /* ── Duplicats exactes (SHA-256) ── */
  const verificaDuplicats = async () => {
    const actual = fontRef.current;
    if (!actual || hashRef.current) return;
    const control = new AbortController();
    hashRef.current = control;
    const gen = generacio.current;
    setDuplicats(null);
    setProgresHash({ fets: 0, total: 0 });
    try {
      const resultat = await cercaDuplicatsExactesLocals(actual, entrades, {
        cripto,
        senyal: control.signal,
        enProgres: ({ fets, total }) => {
          if (gen === generacio.current && hashRef.current === control) setProgresHash({ fets, total });
        }
      });
      if (gen === generacio.current && hashRef.current === control) setDuplicats(resultat);
    } catch (error) {
      if (gen === generacio.current && hashRef.current === control) setMissatge({ to: 'error', error });
    } finally {
      if (hashRef.current === control) {
        hashRef.current = null;
        setProgresHash(null);
      }
    }
  };

  const aturaHash = () => hashRef.current?.abort();

  const nomVolum = font?.nom || '';
  const ocupat = OCUPATS.has(estatVolum);
  const potTriar = potTriarCarpeta(entorn);

  const propsBarra = {
    t,
    contenidorRef: barraRef,
    volums,
    volumActiu,
    estatVolum,
    potTriar,
    potEscriure,
    ocupat,
    gestCaducat,
    onVincula: () => demanaCanvi(vincula),
    onTria: (volum) => demanaCanvi(() => tria(volum)),
    onReconnecta: reconnecta,
    onOblida: (volum) => demanaCanvi(() => oblida(volum)),
    onDesconnecta: () => demanaCanvi(desconnecta),
    onRelleig: () => demanaCanvi(relleig)
  };

  return {
    t, volums, volumActiu, nomVolum, estatVolum, gestCaducat, ocupat, potTriar, potEscriure, font, limitacions,
    bibliotecaLlesta, arrencadaLlesta,
    volumObert: estatVolum === 'obert' && Boolean(font),
    idVolum: volumActiu,
    sal,
    entrades, analisi, carpetes, comptes, exactes, duplicats, progresHash, verificaDuplicats, aturaHash,
    filtreEstat, setFiltreEstat, filtreTipus, setFiltreTipus, cerca, setCerca, vista, setVista, paginaDe, triaPagina,
    missatge, setMissatge, canvisPendents, rutaBruta, marcaCanvis, descartaCanvis, demanaCanvi, pendent,
    confirmaPendent, cancelaPendent,
    versioDetall, enFet, enNouFitxer, enDesatText, refresca, propsBarra, barraRef, inputRef, enTriarFitxers, elementDe
  };
}
