import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, Check, SquarePen } from 'lucide-react';
import { useNavigate } from '../../app/contexts/RouterContext';
import { Alerta } from '../PedraSeca';
import { signaturaEnLiniaDeNota, textosEnLiniaDeNota } from '../../sections/notes/visibilitatNota.js';

function useNavegaOpcional() {
  try {
    return useNavigate();
  } catch {
    return null;
  }
}

const CAP = Object.freeze([]);
const TEXTOS_DEFECTE = textosEnLiniaDeNota();

/**
 * Onada R20 (Bucle 1 · Cas Real Damià Llorens Jordà) · Panell Pedra Seca en
 * línia per a controlar la visibilitat i la publicació d'una nota a /notes
 * sense cap finestra modal flotant (<dialog>).
 *
 * F03-UI (Onada R21) · Retirar del Mur. Només si els textos porten
 * `retirada` (la capacitat 'revocacioPublicacions' i una nota pròpia: ho
 * decidix NotesEditor) i la nota és publicada: triar «privada» no fa res
 * encara, només mostra en línia la confirmació (què passa, en tres frases) i
 * el botó «Retirar del Mur». Confirmar crida onTria(false). Èxit: la nota
 * passa a privada (esPublica false, de la mateixa llista del Bloc) i el
 * focus va al ràdio «privada». Un ErrorRetirada de tipus 'pendent' és un
 * avís (la retirada s'ha encuat, la publicació continua visible fins a
 * l'ACK); qualsevol altre, un error en línia. Cap modal nou.
 * Verificació R21 (P1) · `retiradaPendent` (el text de l'avís, o null) ve de
 * qui munta el panell (NotesContext, per nota): l'estat pendent sobreviu a
 * canviar de nota, i quan el Bloc el dona per acabat (retirada feta o
 * rebutjada) l'avís se'n va. Sense la prop (undefined: el catàleg de
 * disseny), el panell recorda el que ha rebut ell. Mentre hi és, la tria i
 * «Actualitzar al Mur» estan bloquejades i «privada» queda marcada: la
 * retirada es reprén sola.
 */
export function PanellVisibilitatEnLinia({
  notaId = '',
  esPublica = false,
  estatPublicacio = null,
  onTria,
  textos = TEXTOS_DEFECTE,
  bloqueig = null,
  comNom = null,
  poblesDisponibles = CAP,
  poblePublicat = null,
  rutaPublicada = null,
  retiradaPendent = undefined,
  peticioEnfocament = null,
  onPeticioAtesa = null,
  t = null,
}) {
  const idBase = useId();
  const navega = useNavegaOpcional();
  const panellRef = useRef(null);
  const botoAccioRef = useRef(null);
  const radioPublicaRef = useRef(null);
  const radioPrivadaRef = useRef(null);
  const botoRetiraRef = useRef(null);
  const peticioAtesaRef = useRef(null);
  const cursaRef = useRef(0);
  /* F03-UI · On ha d'anar el focus després de retirar ('privada', 'retira' o
     'panell'): en una ref, perquè l'efecte el porte quan el DOM ja és el nou
     (el fieldset ja no està desactivat i el botó, si cal, torna a existir). */
  const focusPendentRef = useRef(null);

  const poblePublicatNet = typeof poblePublicat === 'string' && poblePublicat.trim() ? poblePublicat.trim() : null;
  const pobles = useMemo(() => {
    const base = Array.isArray(poblesDisponibles)
      ? poblesDisponibles.map((p) => (typeof p === 'string' ? p.trim() : '')).filter(Boolean)
      : CAP;
    if (esPublica && poblePublicatNet && base.length > 0 && !base.includes(poblePublicatNet)) {
      return [poblePublicatNet, ...base];
    }
    return base;
  }, [poblesDisponibles, esPublica, poblePublicatNet]);
  const poblePublicatValid = poblePublicatNet && (pobles.length === 0 || pobles.includes(poblePublicatNet))
    ? poblePublicatNet
    : null;
  const pobleIndeterminat = Boolean(esPublica && pobles.length > 1 && !poblePublicatValid);
  const pobleInicial = pobleIndeterminat ? '' : (poblePublicatValid || pobles[0] || '');

  const [estat, setEstat] = useState(() => ({
    notaId,
    esPublica,
    publicaTriada: Boolean(esPublica),
    poble: pobleInicial,
    editatPoble: false,
    pobleConfirmat: null,
    ocupat: false,
    error: null,
    confirmatAra: false,
    retiradaPendent: null,
    retiradaFeta: false,
  }));

  if (estat.notaId !== notaId) {
    setEstat({
      notaId,
      esPublica,
      publicaTriada: Boolean(esPublica),
      poble: pobleInicial,
      editatPoble: false,
      pobleConfirmat: null,
      ocupat: false,
      error: null,
      confirmatAra: false,
      retiradaPendent: null,
      retiradaFeta: false,
    });
  } else if (estat.esPublica !== esPublica) {
    setEstat((previ) => ({
      ...previ,
      esPublica,
      publicaTriada: Boolean(esPublica),
      poble: poblePublicatValid || (esPublica && pobles.length > 1 ? previ.pobleConfirmat || '' : previ.poble || pobleInicial),
      editatPoble: false,
      error: null,
      /* F03-UI · La nota ja no és publicada (retirada confirmada, ací o en
         drenar la cua): l'avís de pendent ja no és cert. */
      retiradaPendent: null,
      retiradaFeta: esPublica ? false : previ.retiradaFeta,
    }));
  }

  const pobleEfectiuPublicat = poblePublicatValid || estat.pobleConfirmat || null;
  const pobleSeleccionat = estat.editatPoble
    ? (estat.poble && pobles.includes(estat.poble) ? estat.poble : '')
    : (pobleEfectiuPublicat || pobleInicial);
  const pobleCanviat = Boolean(
    esPublica && pobles.length > 1 && pobleSeleccionat && (!pobleEfectiuPublicat || pobleSeleccionat !== pobleEfectiuPublicat),
  );
  const publicaBloquejada = bloqueig?.opcio === 'publica';
  const privadaBloquejada = bloqueig?.opcio === 'privada';
  /* F03-UI · Una nota publicada només deixa triar «privada» si la vista la
     sap retirar (textos.retirada) i no està bloquejada; si no, com sempre, la
     tria és «pública». */
  const textosRetirada = textos?.retirada || null;
  const potTriarPrivadaPublicada = Boolean(textosRetirada && !privadaBloquejada);
  /* Verificació R21 (P1) · La retirada pendent: la de qui munta el panell
     (per nota, mana) o, si no en passa cap, la que acaba de rebre este panell. */
  const pendentControlat = retiradaPendent !== undefined;
  const avisRetiradaPendent = esPublica
    ? (pendentControlat ? ((typeof retiradaPendent === 'string' && retiradaPendent) || null) : estat.retiradaPendent)
    : null;
  const ambRetiradaPendent = Boolean(avisRetiradaPendent);
  const publicaSeleccionada = publicaBloquejada || ambRetiradaPendent
    ? false
    : (esPublica && !potTriarPrivadaPublicada ? true : estat.publicaTriada);
  const mostrarOpcioTriaPoble = Boolean(pobleIndeterminat && !estat.pobleConfirmat);
  const faltaTriarPoble = Boolean(publicaSeleccionada && pobles.length > 1 && !pobleSeleccionat);
  /* F03-UI · La confirmació de la retirada: nota publicada, «privada» triada,
     la vista la sap retirar (textos.retirada) i cap retirada ja encuada. */
  const demanaRetirada = Boolean(
    esPublica && potTriarPrivadaPublicada && !publicaSeleccionada
      && !ambRetiradaPendent && typeof onTria === 'function',
  );

  useEffect(() => {
    const desti = focusPendentRef.current;
    if (!desti) return;
    focusPendentRef.current = null;
    const element = desti === 'privada' ? radioPrivadaRef.current : (desti === 'retira' ? botoRetiraRef.current : panellRef.current);
    element?.focus?.({ preventScroll: true });
  });

  /* Si el document s'edita després d'haver publicat ('pendent'), deixa d'estar confirmat ara. */
  const alDiaAlMur = Boolean(
    esPublica
      && !faltaTriarPoble
      && !pobleCanviat
      && (estatPublicacio === 'publicat' || (estat.confirmatAra && estatPublicacio !== 'pendent')),
  );

  useEffect(() => {
    if (!peticioEnfocament || peticioAtesaRef.current === peticioEnfocament) return;
    peticioAtesaRef.current = peticioEnfocament;
    if (!publicaBloquejada) {
      setEstat((previ) => (previ.publicaTriada ? previ : { ...previ, publicaTriada: true, error: null }));
    }
    const panell = panellRef.current;
    if (typeof panell?.scrollIntoView === 'function') {
      panell.scrollIntoView({ block: 'nearest' });
    }
    const desti = (!publicaBloquejada && esPublica && botoAccioRef.current && !botoAccioRef.current.disabled)
      ? botoAccioRef.current
      : (radioPublicaRef.current && !radioPublicaRef.current.disabled ? radioPublicaRef.current : panell);
    desti?.focus?.({ preventScroll: true });
    onPeticioAtesa?.(peticioEnfocament);
  }, [peticioEnfocament, publicaBloquejada, esPublica, onPeticioAtesa]);

  const canviaVisibilitat = (novaPublica) => {
    if (estat.ocupat || ambRetiradaPendent) return;
    if (novaPublica && publicaBloquejada) return;
    if (!novaPublica && privadaBloquejada) return;
    setEstat((previ) => ({ ...previ, publicaTriada: novaPublica, error: null, retiradaFeta: false }));
  };

  /* F03-UI · «Retirar del Mur»: onTria(false) només des d'ací, després de la
     confirmació en línia. Res es dona per retirat fins que torna true. */
  const confirmaRetirada = async () => {
    if (estat.ocupat || !demanaRetirada) return;
    const cursa = cursaRef.current + 1;
    cursaRef.current = cursa;
    setEstat((previ) => ({ ...previ, ocupat: true, error: null, retiradaFeta: false }));
    try {
      const fet = await onTria(false);
      if (cursaRef.current !== cursa) return;
      if (fet === false) {
        focusPendentRef.current = 'retira';
        setEstat((previ) => ({ ...previ, ocupat: false }));
        return;
      }
      focusPendentRef.current = 'privada';
      setEstat((previ) => ({ ...previ, ocupat: false, error: null, confirmatAra: false, retiradaFeta: true }));
    } catch (err) {
      if (cursaRef.current !== cursa) return;
      if (err?.name === 'AbortError') {
        setEstat((previ) => ({ ...previ, ocupat: false, error: null }));
        return;
      }
      const missatge = err instanceof Error && err.message ? err.message : (textosRetirada?.accio || '');
      if (err?.tipus === 'pendent') {
        focusPendentRef.current = 'panell';
        setEstat((previ) => ({ ...previ, ocupat: false, retiradaPendent: missatge }));
        return;
      }
      focusPendentRef.current = 'retira';
      setEstat((previ) => ({ ...previ, ocupat: false, error: missatge }));
    }
  };

  const canviaPoble = (event) => {
    if (estat.ocupat || ambRetiradaPendent) return;
    const nouPoble = event.target.value;
    setEstat((previ) => ({
      ...previ,
      poble: nouPoble,
      editatPoble: true,
      publicaTriada: publicaBloquejada ? previ.publicaTriada : true,
      confirmatAra: false,
      error: null,
    }));
  };

  const confirmaPublicacio = async () => {
    if (estat.ocupat || publicaBloquejada || !publicaSeleccionada || faltaTriarPoble || typeof onTria !== 'function') return;
    if (ambRetiradaPendent) return;
    const cursa = cursaRef.current + 1;
    cursaRef.current = cursa;
    setEstat((previ) => ({ ...previ, publicaTriada: true, ocupat: true, error: null, retiradaFeta: false }));
    try {
      const calEnviarPoble = pobles.length > 1 && pobleSeleccionat && (!esPublica || !poblePublicatValid || pobleCanviat);
      const opcions = calEnviarPoble ? { poble: pobleSeleccionat } : undefined;
      const fet = opcions ? await onTria(true, opcions) : await onTria(true);
      if (cursaRef.current !== cursa) return;
      if (fet === false) {
        setEstat((previ) => ({ ...previ, ocupat: false }));
        return;
      }
      setEstat((previ) => ({
        ...previ,
        ocupat: false,
        editatPoble: false,
        error: null,
        confirmatAra: true,
        pobleConfirmat: pobles.length > 1 ? pobleSeleccionat || null : null,
      }));
    } catch (err) {
      if (cursaRef.current !== cursa) return;
      if (err?.name === 'AbortError') {
        setEstat((previ) => ({ ...previ, ocupat: false, error: null }));
        return;
      }
      const missatge = err instanceof Error && err.message ? err.message : 'No s’ha pogut desar el canvi.';
      setEstat((previ) => ({ ...previ, ocupat: false, error: missatge, confirmatAra: false }));
    }
  };

  const clicaEnllacPublicacio = (event) => {
    if (!rutaPublicada || typeof navega !== 'function') return;
    if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      navega(rutaPublicada);
    }
  };

  const liniaSignatura = comNom ? signaturaEnLiniaDeNota(comNom, t) : '';
  const etiquetaBotoBlau = estat.ocupat
    ? textos.treballant
    : (esPublica ? textos.publica.accioIgual : textos.publica.accio);
  const nomGrup = `${idBase}-visibilitat`;
  const idSelectPoble = `${idBase}-poble`;
  const idAjudaPoble = `${idBase}-poble-ajuda`;
  const idDescPrivada = `${idBase}-privada-desc`;
  const idDescPublica = `${idBase}-publica-desc`;

  return (
    <section
      ref={panellRef}
      className="sdp-visibilitat-linia"
      aria-label={textos.llegenda}
      tabIndex={-1}
      data-sdp-visibilitat-nota={esPublica ? 'publica' : 'privada'}
    >
      <div className="sdp-visibilitat-linia__cap">
        <span className="sdp-visibilitat-linia__ploma" aria-hidden="true">
          <SquarePen size={18} focusable="false" />
        </span>
        <div className="sdp-visibilitat-linia__titular">
          <span className="sdp-visibilitat-linia__titol">{textos.llegenda}</span>
          {liniaSignatura ? <p className="sdp-visibilitat-linia__signatura">{liniaSignatura}</p> : null}
        </div>
      </div>

      {bloqueig?.motiu ? (
        <p className="sdp-visibilitat-linia__motiu" role="status">{bloqueig.motiu}</p>
      ) : null}

      <fieldset className="sdp-visibilitat-linia__grup" disabled={estat.ocupat || ambRetiradaPendent}>
        <legend className="sdp-nomes-lector">{textos.llegenda}</legend>

        <label
          className={[
            'sdp-visibilitat-linia__opcio',
            !publicaSeleccionada ? 'sdp-visibilitat-linia__opcio--activa' : '',
            privadaBloquejada ? 'sdp-visibilitat-linia__opcio--bloquejada' : '',
          ].filter(Boolean).join(' ')}
        >
          <input
            ref={radioPrivadaRef}
            type="radio"
            name={nomGrup}
            checked={!publicaSeleccionada}
            disabled={privadaBloquejada}
            aria-describedby={idDescPrivada}
            onChange={() => canviaVisibilitat(false)}
          />
          <span className="sdp-visibilitat-linia__opcio-cos">
            <span className="sdp-visibilitat-linia__opcio-titol">{textos.privada.etiqueta}</span>
            <span id={idDescPrivada} className="sdp-visibilitat-linia__opcio-ajuda">{textos.privada.explicacio}</span>
          </span>
        </label>

        <label
          className={[
            'sdp-visibilitat-linia__opcio',
            publicaSeleccionada ? 'sdp-visibilitat-linia__opcio--activa' : '',
            publicaBloquejada ? 'sdp-visibilitat-linia__opcio--bloquejada' : '',
          ].filter(Boolean).join(' ')}
        >
          <input
            ref={radioPublicaRef}
            type="radio"
            name={nomGrup}
            checked={publicaSeleccionada}
            disabled={publicaBloquejada}
            aria-describedby={idDescPublica}
            onChange={() => canviaVisibilitat(true)}
          />
          <span className="sdp-visibilitat-linia__opcio-cos">
            <span className="sdp-visibilitat-linia__opcio-titol">{textos.publica.etiqueta}</span>
            <span id={idDescPublica} className="sdp-visibilitat-linia__opcio-ajuda">{textos.publica.explicacio}</span>
          </span>
        </label>
      </fieldset>

      {pobles.length > 1 && !publicaBloquejada ? (
        <div className="sdp-visibilitat-linia__poble">
          <label htmlFor={idSelectPoble} className="sdp-camp__etiqueta">{textos.poble.etiqueta}</label>
          <select
            id={idSelectPoble}
            className="sdp-visibilitat-linia__select"
            value={pobleSeleccionat}
            disabled={estat.ocupat || ambRetiradaPendent}
            aria-describedby={idAjudaPoble}
            onChange={canviaPoble}
          >
            {mostrarOpcioTriaPoble ? (
              <option value="">{textos.poble.tria}</option>
            ) : null}
            {pobles.map((poble) => (
              <option key={poble} value={poble}>{poble}</option>
            ))}
          </select>
          <p id={idAjudaPoble} className="sdp-camp__ajuda">{textos.poble.ajuda}</p>
        </div>
      ) : null}

      {faltaTriarPoble && textos.poble?.indeterminat ? (
        <p className="sdp-visibilitat-linia__avis" role="status">{textos.poble.indeterminat}</p>
      ) : null}

      {/* F03-UI · Abans de publicar: amb la retirada disponible, que es podrà
          retirar (`reversible`); sense, que encara no (`irreversible`). */}
      {!esPublica && publicaSeleccionada && (textos.reversible || textos.irreversible) ? (
        <p className="sdp-visibilitat-linia__avis">{textos.reversible || textos.irreversible}</p>
      ) : null}

      {demanaRetirada ? (
        <Alerta
          to="avis"
          accions={(
            <button
              ref={botoRetiraRef}
              type="button"
              className="sdp-boto sdp-boto--perill sdp-visibilitat-linia__boto"
              disabled={estat.ocupat}
              aria-busy={estat.ocupat || undefined}
              onClick={confirmaRetirada}
            >
              <span>{estat.ocupat ? textosRetirada.treballant : textosRetirada.accio}</span>
            </button>
          )}
        >
          {textosRetirada.avis}
        </Alerta>
      ) : null}

      {ambRetiradaPendent ? <Alerta to="avis">{avisRetiradaPendent}</Alerta> : null}
      {!esPublica && estat.retiradaFeta && textosRetirada?.feta ? <Alerta to="exit">{textosRetirada.feta}</Alerta> : null}

      {estat.error ? <Alerta to="error">{estat.error}</Alerta> : null}

      <div className="sdp-visibilitat-linia__accions">
        {alDiaAlMur ? (
          <span
            className="sdp-boto sdp-visibilitat-linia__boto sdp-visibilitat-linia__boto--publicat"
            role="status"
            aria-live="polite"
          >
            <Check size={18} aria-hidden="true" focusable="false" />
            <span>{textos.estatPublicat}</span>
          </span>
        ) : (
          <button
            ref={botoAccioRef}
            type="button"
            className="sdp-boto sdp-visibilitat-linia__boto sdp-visibilitat-linia__boto--publicar"
            /* F03-UI · Amb una retirada encuada, cap actualització al Mur
               fins que el servidor la confirme. */
            disabled={!publicaSeleccionada || publicaBloquejada || faltaTriarPoble || estat.ocupat || ambRetiradaPendent}
            aria-busy={estat.ocupat || undefined}
            onClick={confirmaPublicacio}
          >
            <span>{etiquetaBotoBlau}</span>
          </button>
        )}

        {esPublica && rutaPublicada ? (
          <a
            href={rutaPublicada}
            className="sdp-boto sdp-boto--secundari sdp-visibilitat-linia__enllac"
            onClick={clicaEnllacPublicacio}
          >
            <span>{textos.veurePublicacio}</span>
            <ArrowUpRight size={18} aria-hidden="true" focusable="false" />
          </a>
        ) : null}
      </div>
    </section>
  );
}
