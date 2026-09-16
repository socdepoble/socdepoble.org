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
 *   · 44px de zona tàctil per a tot control (Llei de Vida).
 *   · Interruptor = acció immediata. Casella = decisió que es confirma després.
 */
import { createContext, useContext, useId } from 'react';
import { CircleAlert } from 'lucide-react';

const CampCtx = createContext(null);

const uneix = (...c) => c.filter(Boolean).join(' ');

export function Camp({ etiqueta, ajuda, error, obligatori = false, className, children }) {
  const id = useId();
  const idAjuda = ajuda ? `${id}-ajuda` : null;
  const idError = error ? `${id}-error` : null;
  const descritPer = uneix(idAjuda, idError) || undefined;

  return (
    <CampCtx.Provider value={{ id, descritPer, invalid: Boolean(error), obligatori }}>
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

export function CampText({ tipus = 'text', className, ...rest }) {
  return <input type={tipus} className={uneix('sdp-control', className)} {...useControl('CampText', rest)} />;
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

/** GrupOpcions: ràdios dins d'un fieldset real. opcions: [{ valor, etiqueta, ajuda? }] */
export function GrupOpcions({ llegenda, nom, opcions = [], valor, onCanvi, error, className }) {
  const id = useId();
  const nomReal = nom || id;
  return (
    <fieldset className={uneix('sdp-grup', error && 'sdp-grup--error', className)}
      aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="sdp-grup__llegenda">{llegenda}</legend>
      {opcions.map((o) => {
        const idOpcio = `${id}-${o.valor}`;
        return (
          <div className="sdp-casella" key={o.valor}>
            <input type="radio" id={idOpcio} name={nomReal} value={o.valor}
              className="sdp-casella__control"
              checked={valor === undefined ? undefined : valor === o.valor}
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

/**
 * Interruptor: role="switch" sobre un <button> natiu. L'estat es llig en
 * text ("Sí"/"No"), no només en la posició del botonet.
 */
export function Interruptor({ etiqueta, actiu = false, onCanvi, desactivat = false, className }) {
  const id = useId();
  return (
    <div className={uneix('sdp-interruptor', className)}>
      <span id={`${id}-et`} className="sdp-interruptor__etiqueta">{etiqueta}</span>
      <button type="button" role="switch" aria-checked={actiu} aria-labelledby={`${id}-et`}
        className="sdp-interruptor__control" disabled={desactivat}
        onClick={() => onCanvi?.(!actiu)}>
        <span className="sdp-interruptor__carril" aria-hidden="true"><span className="sdp-interruptor__botonet" /></span>
        <span className="sdp-interruptor__estat">{actiu ? 'Sí' : 'No'}</span>
      </button>
    </div>
  );
}
