import { HardDrive, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useUIActions } from '../../app/contexts/UIContext';
import { useFullDiferit } from '../../config/fullDiferit.js';
import fullSalutDispositiu from '../../css/diferit-salut-dispositiu.css?inline';
import {
  formataBytesHumans,
  interpolaSalut,
  resolTextosSalutDispositiu,
} from './textosSalutDispositiuJarvis.js';

/* R32.3 · El servei de Codex ja viu a l'arbre: import() directe, sense l'adaptador de reserva duplicat
   ni import.meta.glob (codi mort). Si el tros no arriba, la promesa es rebutja i el giny passa a error. */
const resolServeiSalut = async (serveiExtern) => {
  if (serveiExtern) return serveiExtern;
  const modul = await import('../../data/salutEmmagatzematgeDispositiu.js');
  return {
    lligSalutEmmagatzematgeDispositiu: modul.lligSalutEmmagatzematgeDispositiu,
    purgaMemoriaCauRegenerable: modul.purgaMemoriaCauRegenerable,
    historialNetegesLocals: modul.historialNetegesLocals,
  };
};

const CATEGORIES_BASE = Object.freeze([
  Object.freeze({ id: 'claus-e2ee', tipus: 'sagrada', bytes: null, purgable: false }),
  Object.freeze({ id: 'esborranys-pendents', tipus: 'sagrada', bytes: null, purgable: false }),
  Object.freeze({ id: 'copies-sdpbackup', tipus: 'sagrada', bytes: null, purgable: false }),
  Object.freeze({ id: 'notes-locals', tipus: 'sagrada', bytes: null, purgable: false }),
  Object.freeze({ id: 'miniatures-sincronitzades', tipus: 'regenerable', bytes: null, purgable: false }),
]);

/* Avisos d'una part no verificada: la UI no els amaga darrere d'un èxit (R32.3, de Claude R32.2). */
const AVISOS_NO_VERIFICATS = Object.freeze(['CACHE_AMB_DADES_NO_VERIFICADES', 'CACHE_MASSA_GRAN', 'RECURS_CANVIAT']);

const esByteValid = (n) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;

function nomCategoriaHumana(categoria, tx) {
  switch (categoria?.id) {
    case 'claus-e2ee': return tx.categoriaClausE2ee;
    case 'notes-locals': return tx.categoriaNotesLocals;
    case 'esborranys-pendents': return tx.categoriaEsborranys;
    case 'copies-sdpbackup': return tx.categoriaCopies;
    case 'miniatures-sincronitzades': return tx.categoriaMiniatures;
    default: return interpolaSalut(tx.categoriaCacheRetirada, { nom: categoria?.id || 'cache' });
  }
}

function etiquetaEstatCategoria(categoria, tx, idioma) {
  if (categoria?.tipus === 'sagrada') return tx.etiquetaMaiEsborrat;
  if (categoria?.purgable && esByteValid(categoria.bytes) && categoria.bytes > 0) {
    return interpolaSalut(tx.etiquetaPurgable, { bytes: formataBytesHumans(categoria.bytes, idioma) });
  }
  return tx.etiquetaConservat;
}

export default function GinySalutDispositiuJarvis({ idioma: idiomaProp, servei = null }) {
  const accionsUi = useUIActions?.() || {};
  const idiomaActiu = idiomaProp || accionsUi.language || 'ca';
  const tx = useMemo(() => resolTextosSalutDispositiu(idiomaActiu), [idiomaActiu]);

  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'salut-dispositiu', fullSalutDispositiu);

  const idSeccio = useId();
  const idCapacitat = useId();
  const idRevisio = useId();

  const [fase, setFase] = useState('carregant');
  const [lectura, setLectura] = useState(null);
  const [historial, setHistorial] = useState(() => ({ registres: [], persistent: false, disponible: null }));
  const [resultatPurga, setResultatPurga] = useState(null);
  const [netejant, setNetejant] = useState(false);
  const [revisioOberta, setRevisioOberta] = useState(false);
  const [errorActiu, setErrorActiu] = useState(false);

  // Tot treball pertany al muntatge i al servei que l'ha iniciat. La guarda
  // també descarta productors que ignoren AbortSignal i resolen més tard.
  const cicleRef = useRef(null);
  const diagnosticRef = useRef(0);
  const purgaRef = useRef(false);
  const carregaDiagnostic = useCallback(async (signal = cicleRef.current?.signal) => {
    if (!signal || signal.aborted) return;
    const ordre = ++diagnosticRef.current;
    const vigent = () => !signal.aborted && cicleRef.current?.signal === signal && diagnosticRef.current === ordre;
    setFase('carregant');
    setErrorActiu(false);
    try {
      const srv = await resolServeiSalut(servei);
      if (!vigent()) return;
      const [dadesSalut, dadesHistorial] = await Promise.all([
        srv.lligSalutEmmagatzematgeDispositiu({ signal }),
        typeof srv.historialNetegesLocals === 'function'
          ? Promise.resolve().then(() => srv.historialNetegesLocals())
            .catch(() => ({ registres: [], persistent: false, disponible: false }))
          : Promise.resolve({ registres: [], persistent: false, disponible: false }),
      ]);
      if (!vigent()) return;
      setLectura(dadesSalut || null);
      setHistorial({
        registres: Array.isArray(dadesHistorial?.registres) ? dadesHistorial.registres : [],
        persistent: Boolean(dadesHistorial?.persistent),
        disponible: dadesHistorial?.disponible !== false && Array.isArray(dadesHistorial?.registres),
      });
      setErrorActiu(Boolean(dadesSalut?.error));
      setFase(dadesSalut?.error ? 'error' : 'llest');
    } catch (err) {
      if (!vigent() || err?.codi === 'AVORTAT' || err?.name === 'AbortError') return;
      setErrorActiu(true);
      setFase('error');
    }
  }, [servei]);

  useEffect(() => {
    const ctrl = new AbortController();
    cicleRef.current = ctrl;
    purgaRef.current = false;
    setNetejant(false);
    setResultatPurga(null);
    void carregaDiagnostic(ctrl.signal);
    return () => { ctrl.abort(); };
  }, [carregaDiagnostic]);

  const executaNeteja = useCallback(async () => {
    const signal = cicleRef.current?.signal;
    if (purgaRef.current || !signal || signal.aborted) return;
    const vigent = () => !signal.aborted && cicleRef.current?.signal === signal;
    purgaRef.current = true;
    setNetejant(true);
    setErrorActiu(false);
    /* R32.3 · Llei 0 (Peix R32.2, P2): el rebut de la purga anterior no parla d'esta. Es descarta abans
       de començar perquè ni la purga en vol ni una fallada seguida de «Tornar a provar» reanuncien un èxit vell. */
    setResultatPurga(null);
    try {
      const srv = await resolServeiSalut(servei);
      if (!vigent()) return;
      const rebut = await srv.purgaMemoriaCauRegenerable({ signal });
      if (!vigent()) return;
      setResultatPurga(rebut || { estat: 'fallit', error: { codi: 'REBUT_NO_DISPONIBLE' } });
      await carregaDiagnostic(signal);
    } catch (err) {
      if (!vigent() || err?.codi === 'AVORTAT' || err?.name === 'AbortError') return;
      if (err?.codi === 'BLOQUEIG_NO_DISPONIBLE') {
        setResultatPurga({ estat: 'permis', bytesEliminats: 0, bytesAlliberats: null, entradesEliminades: 0, avisos: ['BLOQUEIG_NO_DISPONIBLE'] });
      } else {
        setErrorActiu(true);
        setFase('error');
      }
    } finally {
      if (vigent()) {
        purgaRef.current = false;
        setNetejant(false);
      }
    }
  }, [servei, carregaDiagnostic]);

  const categories = lectura?.categories?.length ? lectura.categories : CATEGORIES_BASE;
  const avisos = Array.isArray(lectura?.avisos) ? lectura.avisos : [];

  const resumPurgable = useMemo(() => {
    let bytes = 0;
    let entrades = 0;
    for (const cat of categories) {
      if (cat?.tipus === 'regenerable' && cat?.purgable === true && esByteValid(cat.bytes)) {
        bytes += cat.bytes;
        entrades += esByteValid(cat.entrades) ? cat.entrades : 1;
      }
    }
    return { bytes, entrades };
  }, [categories]);

  const totalHistoric = useMemo(() => {
    const registres = Array.isArray(historial?.registres) ? historial.registres : [];
    let bytes = 0;
    for (const reg of registres) {
      if (esByteValid(reg?.bytesEliminats)) bytes += reg.bytesEliminats;
    }
    return { bytes, vegades: registres.length };
  }, [historial]);

  const usat = esByteValid(lectura?.usage) ? lectura.usage : null;
  const quota = esByteValid(lectura?.quota) && lectura.quota > 0 ? lectura.quota : null;
  const percentatge = usat !== null && quota !== null
    ? Math.min(100, Math.max(0, Math.round((usat / quota) * 100)))
    : null;

  const nivellEspai = percentatge === null
    ? 'neutre'
    : percentatge >= 90
      ? 'critic'
      : percentatge >= 75
        ? 'avis'
        : 'sa';

  const etiquetaInsigniaEspai = nivellEspai === 'critic'
    ? tx.estatCritic
    : nivellEspai === 'avis'
      ? tx.estatAvis
      : nivellEspai === 'sa'
        ? tx.estatSa
        : tx.estatSenseMesura;

  /* R32.3 · Sense Cache API (CACHE_NO_DISPONIBLE) no es pot comprovar res: és un límit de permís, no un «0 B». */
  const permisLimitat = resultatPurga?.estat === 'permis' || avisos.includes('CACHE_NO_DISPONIBLE');
  const avisosTots = [...avisos, ...(Array.isArray(resultatPurga?.avisos) ? resultatPurga.avisos : [])];
  const codiErrorPurga = typeof resultatPurga?.error === 'string' ? resultatPurga.error : resultatPurga?.error?.codi;
  const senseNetejaSegura = [...avisosTots, codiErrorPurga].includes('NETEJA_ATOMICA_NO_DISPONIBLE');
  const estatBloquejat = resultatPurga?.estat === 'bloquejat' || senseNetejaSegura
    || avisosTots.includes('CAP_PRODUCTOR_REGENERABLE_CONFIRMAT');
  const teErrorPurga = resultatPurga?.error && resultatPurga?.estat !== 'parcial' && !estatBloquejat;
  const ambDadesNoVerificades = resultatPurga?.estat === 'parcial'
    || avisosTots.some((avis) => AVISOS_NO_VERIFICATS.includes(avis));
  /* Llei 0: un 'complet' sense cap supressió no és cap èxit (0 B mai s'anuncien com a espai alliberat). */
  const exitConfirmat = resultatPurga?.estat === 'complet' && esByteValid(resultatPurga.entradesEliminades)
    && resultatPurga.entradesEliminades > 0;

  /* Els 6 estats canònics de la rúbrica ECC (loading, error, permission, partial, success, empty) i «ready»:
     hi ha memòria temporal confirmada i encara no s'ha netejat. Un 'bloquejat' mai s'anuncia com a èxit. */
  const estatUi = fase === 'carregant'
    ? 'loading'
    : (fase === 'error' || errorActiu || teErrorPurga)
      ? 'error'
      : permisLimitat
        ? 'permission'
        : (estatBloquejat || ambDadesNoVerificades)
          ? 'partial'
          : exitConfirmat
            ? 'success'
            : resumPurgable.bytes > 0
              ? 'ready'
              : 'empty';

  const textLecturaCapacitat = usat !== null && quota !== null
    ? interpolaSalut(tx.lecturaUsQuota, {
      usat: formataBytesHumans(usat, idiomaActiu),
      quota: formataBytesHumans(quota, idiomaActiu),
      percentatge,
    })
    : usat !== null
      ? interpolaSalut(tx.lecturaNomesUs, { usat: formataBytesHumans(usat, idiomaActiu) })
      : tx.lecturaSenseDades;

  const textCompartimentTemporal = resumPurgable.bytes > 0
    ? interpolaSalut(tx.compartimentTemporalAmbBytes, {
      bytes: formataBytesHumans(resumPurgable.bytes, idiomaActiu),
      entrades: resumPurgable.entrades,
    })
    /* Només es parla de memòries sense verificar quan el servei n'ha detectat; sense productor i sense
       memòries retirades, el text honest és «0 B confirmats», no una detecció que no ha passat. */
    : ambDadesNoVerificades
      ? tx.compartimentTemporalParcial
      : tx.compartimentTemporalNet;

  const missatgeEstat = estatUi === 'loading'
    ? tx.estatCarregant
    : estatUi === 'permission'
      ? tx.estatPermis
      : estatUi === 'partial'
        ? (senseNetejaSegura ? tx.estatNetejaNoDisponible : estatBloquejat ? tx.estatBloquejat : tx.estatParcial)
        : estatUi === 'success'
          ? interpolaSalut(tx.estatExit, {
            bytes: formataBytesHumans(esByteValid(resultatPurga.bytesEliminats) ? resultatPurga.bytesEliminats : 0, idiomaActiu),
            entrades: resultatPurga.entradesEliminades,
          })
          : estatUi === 'empty'
            ? tx.estatBuit
            : '';

  const toAvisEstat = estatUi === 'success'
    ? 'exit'
    : (estatUi === 'partial' || estatUi === 'permission')
      ? 'avis'
      : 'neutre';

  return (
    <section
      ref={arrelRef}
      className="sdp-salut-dispositiu"
      aria-labelledby={idSeccio}
      data-testid="giny-salut-dispositiu-jarvis"
      data-estat-ui={estatUi}
    >
      <h2 id={idSeccio}>{tx.titolSeccio}</h2>
      <p className="lead">{tx.entradetaSeccio}</p>

      {/* Contenidors vius pre-existents al DOM per anunciar canvis i errors amb accessibilitat AAA */}
      <output className="sdp-salut-dispositiu__anunci sdp-sr-only" aria-live="polite" aria-atomic="true">
        {estatUi !== 'error' ? missatgeEstat : ''}
      </output>
      <div
        className={estatUi === 'error' ? 'sdp-salut-dispositiu__avis' : 'sdp-salut-dispositiu__anunci'}
        data-to={estatUi === 'error' ? 'error' : undefined}
        role="alert"
        aria-atomic="true"
      >
        {estatUi === 'error' ? tx.estatError : ''}
      </div>

      <div className="sdp-salut-dispositiu__graella">
        {/* Targeta Bento 1: Salut i Capacitat d'Emmagatzematge */}
        <article className="sdp-salut-dispositiu__targeta" aria-labelledby={idCapacitat}>
          <div className="sdp-salut-dispositiu__bloc-superior">
            <header className="sdp-salut-dispositiu__capcalera-targeta">
              <h3 id={idCapacitat} className="sdp-salut-dispositiu__titol-targeta">
                <HardDrive size={20} aria-hidden="true" focusable="false" />
                <span>{tx.titolCapacitat}</span>
              </h3>
              <span className="sdp-salut-dispositiu__insignia" data-to={nivellEspai === 'neutre' ? undefined : nivellEspai}>
                {etiquetaInsigniaEspai}
              </span>
            </header>

            <p className="sdp-salut-dispositiu__lectura-gran">
              {fase === 'carregant' ? tx.estatCarregant : textLecturaCapacitat}
            </p>

            {percentatge !== null ? (
              <progress
                className="sdp-salut-dispositiu__progres"
                max={100}
                value={percentatge}
                data-nivell={nivellEspai}
                aria-labelledby={idCapacitat}
              />
            ) : null}

            {lectura?.persistent === true ? (
              <p className="sdp-salut-dispositiu__text">{tx.persistenciaActiva}</p>
            ) : lectura?.persistent === false ? (
              <p className="sdp-salut-dispositiu__text">{tx.persistenciaTemporal}</p>
            ) : null}

            {percentatge !== null && percentatge >= 85 ? (
              <section className="sdp-salut-dispositiu__guia">
                <p className="sdp-salut-dispositiu__text"><strong>{tx.guiaTitol}</strong></p>
                <ol className="sdp-salut-dispositiu__guia-llista">
                  <li>{tx.guiaPas1}</li>
                  <li>{tx.guiaPas2}</li>
                  <li>{tx.guiaPas3}</li>
                </ol>
              </section>
            ) : null}
          </div>

          <p className="sdp-salut-dispositiu__meta">{tx.notaHonestaNavegador}</p>
        </article>

        {/* Targeta Bento 2: Separació Sagrada vs Regenerable, Revisió in-situ i Botó Centrat */}
        <article className="sdp-salut-dispositiu__targeta">
          <div className="sdp-salut-dispositiu__bloc-superior">
            <header className="sdp-salut-dispositiu__capcalera-targeta">
              <h3 className="sdp-salut-dispositiu__titol-targeta">
                <ShieldCheck size={20} aria-hidden="true" focusable="false" />
                <span>{tx.titolNeteja}</span>
              </h3>
              <span className="sdp-salut-dispositiu__insignia" data-to="protegit">
                <Lock size={14} aria-hidden="true" focusable="false" />
                <span>{tx.insigniaProtegida}</span>
              </span>
            </header>

            <dl className="sdp-salut-dispositiu__compartiments">
              <div className="sdp-salut-dispositiu__compartiment">
                <dt>{tx.compartimentSagratTitol}</dt>
                <dd>{tx.compartimentSagratDesc}</dd>
              </div>
              <div className="sdp-salut-dispositiu__compartiment">
                <dt>{tx.compartimentTemporalTitol}</dt>
                <dd>{textCompartimentTemporal}</dd>
              </div>
            </dl>

            <div className="sdp-salut-dispositiu__fila-revisio">
              {/* R32.3 · Llei 0: mai «cap neteja» abans d'haver llegit l'historial (disponible === null). */}
              {historial.disponible === null ? null : (
                <p className="sdp-salut-dispositiu__meta">
                  {historial.disponible === false
                    ? tx.historialNoDisponible
                    : totalHistoric.vegades > 0
                    ? interpolaSalut(tx.historialResum, {
                      bytes: formataBytesHumans(totalHistoric.bytes, idiomaActiu),
                      vegades: totalHistoric.vegades,
                    })
                    : tx.historialCap}
                </p>
              )}
              <button
                type="button"
                className="sdp-salut-dispositiu__boto-revisar"
                aria-expanded={revisioOberta ? 'true' : 'false'}
                aria-controls={idRevisio}
                onClick={() => setRevisioOberta((oberta) => !oberta)}
              >
                {revisioOberta ? tx.botoTancarRevisio : tx.botoRevisar}
              </button>
            </div>

            <ul id={idRevisio} className="sdp-salut-dispositiu__detall" hidden={!revisioOberta}>
              {categories.map((cat) => (
                <li key={cat.id} className="sdp-salut-dispositiu__item-detall">
                  <span>{nomCategoriaHumana(cat, tx)}</span>
                  <strong>{etiquetaEstatCategoria(cat, tx, idiomaActiu)}</strong>
                </li>
              ))}
            </ul>

            {estatUi !== 'error' && missatgeEstat ? (
              <p className="sdp-salut-dispositiu__avis" data-to={toAvisEstat === 'neutre' ? undefined : toAvisEstat}>
                {missatgeEstat}
              </p>
            ) : null}
          </div>

          <footer className="sdp-salut-dispositiu__accio-principal">
            {estatUi === 'error' ? (
              <button
                type="button"
                className="sdp-salut-dispositiu__boto-principal"
                onClick={() => { setResultatPurga(null); void carregaDiagnostic(); }}
              >
                <span>{tx.botoReintentar}</span>
              </button>
            ) : (
              /* R32.3 · Llei 0: el botó d'alliberar només s'oferix amb memòria temporal confirmada pel
                 productor; sense productor (CAP_PRODUCTOR_REGENERABLE_CONFIRMAT) no es promet cap neteja. */
              <button
                type="button"
                className="sdp-salut-dispositiu__boto-principal"
                disabled={fase === 'carregant' || netejant || permisLimitat || resumPurgable.bytes === 0}
                aria-busy={netejant ? 'true' : 'false'}
                onClick={() => { void executaNeteja(); }}
              >
                <Sparkles size={18} aria-hidden="true" focusable="false" />
                <span>{netejant ? tx.botoNetejant : tx.botoAlliberar}</span>
              </button>
            )}
          </footer>
        </article>
      </div>
    </section>
  );
}
