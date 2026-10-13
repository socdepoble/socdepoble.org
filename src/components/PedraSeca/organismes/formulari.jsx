/**
 * formulari.jsx — Controls de formulari canònics de Pedra Seca (260911).
 *
 * CONTRACTE
 *   <Camp> és l'ÚNIC lloc on viuen etiqueta, ajuda i error. Els controls de
 *   dins (CampText, AreaText, Selector) prenen l'id i l'aria-describedby del
 *   context: no hi ha manera d'oblidar el htmlFor ni de desconnectar l'error
 *   del lector de pantalla. Un control fora de <Camp> llança: fail-closed.
 *
 * LLEIS
 *   · Etiqueta sempre visible. El placeholder no és una etiqueta (desapareix
 *     en escriure i la gent major perd el fil).
 *   · L'error diu què passa i com arreglar-ho, i no depén només del color:
 *     porta icona i text.
 *   · 44px de zona tàctil per a tot control (Llei de Vida); 48px des del sòl
    únic de Q2 (261004), també el botó de CampFitxer.
 *   · Interruptor = acció immediata. Casella = decisió que es confirma després.
 */
import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { Check, CircleAlert, FileUp } from 'lucide-react';
import { Boto } from '../atoms/Boto.jsx';
import { Insignia } from '../atoms/Insignia.jsx';

const CampCtx = createContext(null);

const uneix = (...c) => c.filter(Boolean).join(' ');

export function Camp({ etiqueta, ajuda, error, obligatori = false, className, children }) {
  const id = useId();
  const idAjuda = ajuda ? `${id}-ajuda` : null;
  const idError = error ? `${id}-error` : null;
  const descritPer = uneix(idAjuda, idError) || undefined;

  /* etiqueta viatja pel context (no pel DOM): CampFitxer la copia al nom del
     seu botó. Els altres controls no la lligen i el seu DOM no canvia. */
  return (
    <CampCtx.Provider value={{ id, descritPer, invalid: Boolean(error), obligatori, etiqueta }}>
      <div className={uneix('sdp-camp', error && 'sdp-camp--error', className)}>
        <label className="sdp-camp__etiqueta" htmlFor={id}>
          {etiqueta}
          {obligatori ? <span className="sdp-camp__obligatori"> (obligatori)</span> : null}
        </label>
        {ajuda ? <p id={idAjuda} className="sdp-camp__ajuda">{ajuda}</p> : null}
        {children}
        {error ? (
          <p id={idError} className="sdp-camp__error">
            <CircleAlert size={18} aria-hidden="true" focusable="false" />
            <span>{error}</span>
          </p>
        ) : null}
      </div>
    </CampCtx.Provider>
  );
}

function useControl(nom, props) {
  const ctx = useContext(CampCtx);
  if (!ctx) throw new Error(`<${nom}> ha d'anar dins de <Camp>: sense etiqueta no hi ha control.`);
  return {
    id: ctx.id,
    'aria-describedby': ctx.descritPer,
    'aria-invalid': ctx.invalid ? 'true' : undefined,
    required: ctx.obligatori || undefined,
    ...props,
  };
}

/* D-D (ordre del Mestre, 261004) · Amb tipus="file", CampText delega en
   CampFitxer: els sis selectors de fitxers de l'app (Sentinella, Gestoria,
   Nevera i Salut) passen al de Pedra Seca sense tocar cap pantalla, i el
   panell dels sentinelles conserva la seua empremta. Els altres tipus pinten
   l'<input> de sempre, byte a byte. */
export function CampText({ tipus = 'text', className, ...rest }) {
  const control = useControl('CampText', rest);
  if (tipus === 'file') return <CampFitxer className={className} {...rest} />;
  return <input type={tipus} className={uneix('sdp-control', className)} {...control} />;
}

/* Fins a tres noms a la línia d'estat; la resta es compta. */
const MAX_NOMS_ESTAT = 3;

/* El primer control invàlid d'un <form>, en l'ordre del document (form.elements
   també compta els de fora associats amb form=). Un fieldset no es valida. */
const primerInvalid = (form) => Array.from(form.elements).find((control) => control.willValidate && !control.validity.valid) || null;

/* Un intent d'enviar `form`: un clic a un dels seus botons d'enviar (un <button>
   sense tipus també, i el clic que fa el navegador en prémer Retorn) o Retorn
   en un dels seus camps (l'enviament implícit). */
function esIntentDEnviar(event, form) {
  const desti = event.target;
  if (typeof desti?.closest !== 'function') return false;
  if (event.type === 'keydown') return event.key === 'Enter' && desti.tagName === 'INPUT' && desti.form === form;
  const boto = desti.closest('button, input');
  return Boolean(boto) && boto.form === form && (boto.type === 'submit' || boto.type === 'image');
}

/* Marca els intents d'enviar el <form> de l'input. La validació de l'enviament
   és síncrona dins de la mateixa tasca: la marca es desfà en la tasca següent
   (setTimeout 0), i un checkValidity() fora d'un enviament la troba apagada.
   S'escolta a l'arrel de l'input (el document o l'ombra de l'encastat), i
   només si és obligatori: sense, el control sempre és vàlid. */
function useIntentDEnviar(input, actiu) {
  const enviant = useRef(false);
  useEffect(() => {
    const form = input.current?.form;
    const arrel = input.current?.getRootNode?.();
    if (!actiu || !form || typeof arrel?.addEventListener !== 'function') return undefined;
    let rellotge = null;
    const escolta = (event) => {
      if (!esIntentDEnviar(event, form)) return;
      enviant.current = true;
      clearTimeout(rellotge);
      rellotge = setTimeout(() => { enviant.current = false; }, 0);
    };
    arrel.addEventListener('click', escolta, true);
    arrel.addEventListener('keydown', escolta, true);
    return () => {
      clearTimeout(rellotge);
      arrel.removeEventListener('click', escolta, true);
      arrel.removeEventListener('keydown', escolta, true);
    };
  }, [input, actiu]);
  return enviant;
}

/**
 * «Cap fitxer triat», «1 fitxer: a.json», «2 fitxers: a.json, b.json» o «12 fitxers: a, b, c i 9 més».
 * Amb `ambNoms` en fals (ordre del Mestre, 13-10-2026, pla 261013_1405, front D), només el recompte: «1 fitxer» o
 * «12 fitxers» (i «Cap carpeta triada» o «Cap fitxer triat», com sempre).
 */
function estatFitxers(noms, { carpeta = false, ambNoms = true } = {}) {
  if (!noms.length) return carpeta ? 'Cap carpeta triada' : 'Cap fitxer triat';
  const quants = noms.length === 1 ? '1 fitxer' : `${noms.length} fitxers`;
  if (!ambNoms) return quants;
  const vistos = noms.slice(0, MAX_NOMS_ESTAT).join(', ');
  const resta = noms.length - MAX_NOMS_ESTAT;
  return `${quants}: ${vistos}${resta > 0 ? ` i ${resta} més` : ''}`;
}

/**
 * CampFitxer (D-D, ordre del Mestre, 261004): el selector de fitxers de Pedra
 * Seca. L'<input type="file"> natiu pintava el botó i el text del navegador,
 * en la llengua del sistema («Ningún archivo seleccionado»).
 *  · El control natiu continua sent l'únic que porta l'etiqueta del <Camp>
 *    (label[for]): el clic a l'etiqueta l'obri i getByLabelText el troba. Va
 *    visualment amagat (sdp-nomes-lector, mai aria-hidden) i fora de l'ordre
 *    de tabulació, perquè no hi haja una parada de focus invisible.
 *  · Es veu un Boto secundari amb icona, l'única parada de focus, que l'obri
 *    (input.click()), i una línia d'estat en valencià que el descriu.
 *  · accept, multiple i webkitdirectory van al control natiu; disabled, als dos.
 *  · Després de passar l'event a onChange es buida `value` (els consumidors
 *    lligen la llista abans): triar el mateix fitxer una altra vegada torna a
 *    disparar el canvi, i l'estat diu el que es va triar. Per això el fitxer
 *    no viatja en un enviament natiu de <form> (FormData): qui l'usa el pren
 *    d'onChange.
 *  · Nom del botó (auditoria 261004): és l'única parada de focus, així que
 *    diu de quin camp és. Amb una etiqueta de text, aria-label = «etiqueta
 *    (obligatori): verb», que conté el text visible. No es fa amb
 *    aria-labelledby cap a la <label>: el botó també casaria amb
 *    getByLabelText i la <label> hauria de dur un id a tots els Camps. Si
 *    l'etiqueta no és text, el nom es queda amb el verb.
 *  · Obligatori (auditoria 261004): com que `value` es buida, un required
 *    natiu faria fallar sempre la validació del <form>. L'input no el porta:
 *    du aria-required i una validesa pròpia (setCustomValidity) que depén del
 *    nombre de fitxers triats. Cada esdeveniment `invalid` es cancel·la (cap
 *    bombolla del navegador sobre el control d'1px): ix el missatge del Camp
 *    (sdp-camp__error) i l'input passa a aria-invalid. Un onInvalid de qui
 *    l'usa també es crida.
 *  · Focus (verificació 261004): només va al botó en un intent d'enviar el
 *    <form> (un clic a un dels seus botons d'enviar, també el que fa el
 *    navegador en prémer Retorn, o Retorn en un dels seus camps) i només si
 *    este és el primer control invàlid del formulari, com fa el navegador.
 *    Un checkValidity() també dispara `invalid` i mostra el missatge, però no
 *    mou el focus. Un reportValidity() o requestSubmit() cridat des de codi
 *    no es pot distingir d'un checkValidity(): mostra el missatge i tampoc
 *    mou el focus. Sense <form>, el focus no es mou mai.
 * textBoto: el verb del botó; per defecte, «Triar fitxer», «Triar fitxers» o
 * «Triar carpeta» segons multiple i webkitdirectory.
 * nomsVisibles (ordre del Mestre, 13-10-2026, pla 261013_1405, front D): per
 * defecte, cert, i la línia d'estat diu fins a tres noms. En fals, només el
 * recompte («Cap carpeta triada», «1 fitxer», «N fitxers»): per a una carpeta
 * arrel que porta papers d'identitat (l'Escàner i la Finestreta de la
 * Gestoria), on un nom de fitxer pot dur dades personals. És opt-in: qui no
 * el passa pinta el mateix text de sempre.
 */
export function CampFitxer({ textBoto, nomsVisibles = true, className, disabled = false, onChange, onInvalid, ...rest }) {
  const { required: obligatori, ...control } = useControl('CampFitxer', rest);
  const { etiqueta, obligatori: campObligatori } = useContext(CampCtx);
  const arrel = useRef(null);
  const input = useRef(null);
  const enviant = useIntentDEnviar(input, Boolean(obligatori));
  const [noms, setNoms] = useState([]);
  const [avisa, setAvisa] = useState(false);
  const idEstat = `${control.id}-estat`;
  const idAvis = `${control.id}-avis`;
  const carpeta = rest.webkitdirectory !== undefined && rest.webkitdirectory !== false;
  const verb = textBoto || (carpeta ? 'Triar carpeta' : rest.multiple ? 'Triar fitxers' : 'Triar fitxer');
  const falta = Boolean(obligatori) && noms.length === 0;
  const mostraAvis = avisa && falta;
  const missatge = `Este camp és obligatori: prem «${verb}» i tria ${carpeta ? 'una carpeta' : rest.multiple ? 'almenys un fitxer' : 'un fitxer'}.`;
  const descritPer = uneix(control['aria-describedby'], mostraAvis && idAvis, idEstat);
  const textual = (typeof etiqueta === 'string' || typeof etiqueta === 'number') && String(etiqueta).trim() !== '';
  const nom = textual ? `${etiqueta}${campObligatori ? ' (obligatori)' : ''}: ${verb}` : undefined;

  // La validesa del control natiu segueix els fitxers triats, no `value`.
  useEffect(() => {
    input.current?.setCustomValidity(falta ? missatge : '');
  }, [falta, missatge]);

  const canvia = (event) => {
    setNoms(Array.from(event.target.files ?? [], (f) => f.name));
    setAvisa(false);
    onChange?.(event);
    event.target.value = '';
  };

  // Sense fitxers: sense bombolla i missatge visible; el focus, només en enviar i si és el primer invàlid.
  const invalid = (event) => {
    event.preventDefault();
    setAvisa(true);
    const form = event.target.form;
    if (enviant.current && form && primerInvalid(form) === event.target) {
      arrel.current?.querySelector('.sdp-camp-fitxer__boto')?.focus();
    }
    onInvalid?.(event);
  };

  return (
    <>
      <div ref={arrel} className={uneix('sdp-camp-fitxer', className)}>
        <input {...control} ref={input} type="file" className="sdp-nomes-lector" tabIndex={-1}
          disabled={disabled} aria-required={obligatori ? 'true' : undefined}
          aria-invalid={control['aria-invalid'] ?? (mostraAvis ? 'true' : undefined)}
          aria-describedby={descritPer} onChange={canvia} onInvalid={invalid} />
        <Boto varietat="secundari" icona={FileUp} className="sdp-camp-fitxer__boto" disabled={disabled}
          aria-label={nom} aria-describedby={descritPer} onClick={() => input.current?.click()}>
          {verb}
        </Boto>
        <p id={idEstat} className="sdp-camp-fitxer__estat" aria-live="polite">{estatFitxers(noms, { carpeta, ambNoms: nomsVisibles !== false })}</p>
      </div>
      {mostraAvis ? (
        <p id={idAvis} className="sdp-camp__error">
          <CircleAlert size={18} aria-hidden="true" focusable="false" />
          <span>{missatge}</span>
        </p>
      ) : null}
    </>
  );
}

export function AreaText({ files = 4, className, ...rest }) {
  return <textarea rows={files} className={uneix('sdp-control', 'sdp-control--area', className)} {...useControl('AreaText', rest)} />;
}

/** opcions: [{ valor, etiqueta, desactivat? }] */
export function Selector({ opcions = [], className, ...rest }) {
  return (
    <select className={uneix('sdp-control', 'sdp-control--selector', className)} {...useControl('Selector', rest)}>
      {opcions.map((o) => (
        <option key={o.valor} value={o.valor} disabled={o.desactivat}>{o.etiqueta}</option>
      ))}
    </select>
  );
}

/** Casella: porta la seua etiqueta; tota la fila és clicable. */
export function Casella({ etiqueta, ajuda, className, ...rest }) {
  const id = useId();
  return (
    <div className={uneix('sdp-casella', className)}>
      <input type="checkbox" id={id} className="sdp-casella__control"
        aria-describedby={ajuda ? `${id}-ajuda` : undefined} {...rest} />
      <label htmlFor={id} className="sdp-casella__etiqueta">
        {etiqueta}
        {ajuda ? <span id={`${id}-ajuda`} className="sdp-casella__ajuda">{ajuda}</span> : null}
      </label>
    </div>
  );
}

/**
 * OpcioTargeta (interna): una opció de GrupOpcions en aspecte «targetes».
 * El control és el mateix ràdio natiu; la targeta sencera és el seu label.
 * Nom = antetítol + títol (aria-labelledby); descripció = ajuda + detall
 * (aria-describedby): la insígnia i la icona no s'escolen al nom. Dins del
 * label només hi ha contingut de frase (spans), cap encapçalament.
 */
function OpcioTargeta({ opcio: o, idOpcio, nom, controlat, triada, onCanvi, textTriada }) {
  const idAnte = o.antetitol ? `${idOpcio}-ante` : null;
  const idTitol = `${idOpcio}-titol`;
  const idAjuda = o.ajuda ? `${idOpcio}-ajuda` : null;
  const idDetall = o.detall ? `${idOpcio}-detall` : null;
  return (
    <div className={uneix("sdp-targeta-opcio", o.className)}>
      <input type="radio" id={idOpcio} name={nom} value={o.valor}
        className="sdp-targeta-opcio__control"
        checked={controlat ? triada : undefined}
        disabled={o.desactivada}
        onChange={() => onCanvi?.(o.valor)}
        aria-labelledby={uneix(idAnte, idTitol)}
        aria-describedby={uneix(idAjuda, idDetall) || undefined} />
      <label htmlFor={idOpcio} className="sdp-targeta-opcio__cos">
        {o.icona ? <span className="sdp-targeta-opcio__icona" aria-hidden="true">{o.icona}</span> : null}
        <span className="sdp-targeta-opcio__text">
          {o.antetitol ? <span id={idAnte} className="sdp-targeta-opcio__antetitol">{o.antetitol}</span> : null}
          <span id={idTitol} className="sdp-targeta-opcio__titol">{o.etiqueta}</span>
          {o.ajuda ? <span id={idAjuda} className="sdp-targeta-opcio__ajuda">{o.ajuda}</span> : null}
          {o.detall ? <span id={idDetall} className="sdp-targeta-opcio__detall">{o.detall}</span> : null}
          {triada ? (
            <Insignia to="exit" className="sdp-targeta-opcio__insignia">
              <Check size={16} aria-hidden="true" focusable="false" />{textTriada}
            </Insignia>
          ) : null}
        </span>
      </label>
    </div>
  );
}

/**
 * GrupOpcions: ràdios dins d'un fieldset real.
 * opcions: [{ valor, etiqueta, ajuda?, desactivada?, antetitol?, icona?, detall? }]
 *   · desactivada: el ràdio d'eixa opció no es pot triar (en les dues variants).
 *   · antetitol, icona i detall només es pinten en aspecte «targetes».
 * aspecte: 'llista' (per defecte, files denses de formulari) o 'targetes'
 *   (T44 · elecció protagonista: cada opció és una targeta clicable sencera).
 * textTriada: text de la insígnia de l'opció marcada (només en mode
 *   controlat), perquè la triada es llija també sense color.
 */
export function GrupOpcions({ llegenda, nom, opcions = [], valor, onCanvi, error, className, disabled = false, aspecte = 'llista', textTriada = 'Triat' }) {
  const id = useId();
  const nomReal = nom || id;
  const targetes = aspecte === 'targetes';
  return (
    <fieldset disabled={disabled} className={uneix('sdp-grup', targetes && 'sdp-grup--targetes', error && 'sdp-grup--error', className)}
      aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="sdp-grup__llegenda">{llegenda}</legend>
      {targetes ? (
        /* Un fieldset en grid dona problemes als navegadors: la graella és un div. */
        <div className="sdp-grup__targetes">
          {opcions.map((o) => (
            <OpcioTargeta key={o.valor} opcio={o} idOpcio={`${id}-${o.valor}`} nom={nomReal}
              controlat={valor !== undefined} triada={valor !== undefined && valor === o.valor}
              onCanvi={onCanvi} textTriada={textTriada} />
          ))}
        </div>
      ) : opcions.map((o) => {
        const idOpcio = `${id}-${o.valor}`;
        return (
          <div className="sdp-casella" key={o.valor}>
            <input type="radio" id={idOpcio} name={nomReal} value={o.valor}
              className="sdp-casella__control"
              checked={valor === undefined ? undefined : valor === o.valor}
              disabled={o.desactivada}
              onChange={() => onCanvi?.(o.valor)} />
            <label htmlFor={idOpcio} className="sdp-casella__etiqueta">
              {o.etiqueta}
              {o.ajuda ? <span className="sdp-casella__ajuda">{o.ajuda}</span> : null}
            </label>
          </div>
        );
      })}
      {error ? (
        <p id={`${id}-error`} className="sdp-camp__error">
          <CircleAlert size={18} aria-hidden="true" focusable="false" /><span>{error}</span>
        </p>
      ) : null}
    </fieldset>
  );
}

/** GrupCamps: agrupa camps relacionats (adreça, dades de contacte…). */
export function GrupCamps({ llegenda, children, className }) {
  return (
    <fieldset className={uneix('sdp-grup', className)}>
      <legend className="sdp-grup__llegenda">{llegenda}</legend>
      <div className="sdp-grup__cos">{children}</div>
    </fieldset>
  );
}

/* El text de l'estat per defecte, en valencià. */
const ESTAT_INTERRUPTOR = Object.freeze({ si: 'Sí', no: 'No' });

/**
 * Interruptor: role="switch" sobre un <button> natiu. L'estat es llig en
 * text ("Sí"/"No"), no només en la posició del botonet.
 * `textosEstat` (opcional, revisió del 261007) · { si, no }, el text de
 * l'estat ja traduït per qui el munta. Sense, «Sí» i «No».
 */
export function Interruptor({ etiqueta, actiu = false, onCanvi, desactivat = false, className, textosEstat }) {
  const id = useId();
  const textEstat = actiu ? (textosEstat?.si || ESTAT_INTERRUPTOR.si) : (textosEstat?.no || ESTAT_INTERRUPTOR.no);
  return (
    <div className={uneix('sdp-interruptor', className)}>
      <span id={`${id}-et`} className="sdp-interruptor__etiqueta">{etiqueta}</span>
      <button type="button" role="switch" aria-checked={actiu} aria-labelledby={`${id}-et`}
        className="sdp-interruptor__control" disabled={desactivat}
        onClick={() => onCanvi?.(!actiu)}>
        <span className="sdp-interruptor__carril" aria-hidden="true"><span className="sdp-interruptor__botonet" /></span>
        <span className="sdp-interruptor__estat">{textEstat}</span>
      </button>
    </div>
  );
}
