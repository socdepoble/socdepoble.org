/**
 * BarraResum.jsx — el resum de la col·lecció en curs (esquelet comú T4/T8):
 * «Comanda · 3 línies · 7,40 €» al TPV, «Llista · 7 articles» a La Compra.
 *
 *   forma 'capcalera'  dalt del panell de la col·lecció (tauleta i escriptori):
 *                      el nom amb el comptador, el total i l'acció principal.
 *   forma 'peu'        fixa a baix del catàleg en pantalla estreta: tota la
 *                      barra obri la col·lecció (un enllaç si porta `href`;
 *                      amb `onObri`, el clic normal el gestiona l'app i
 *                      obrir en una pestanya nova continua funcionant).
 *
 *   accio  { text, onClick, desactivada? }: «Cobra», «Fet». És el primari
 *          de la vista; en el peu, si n'hi ha, obrir la col·lecció passa a
 *          ser secundari (mai dos primaris junts).
 *   total  text ja format per l'app (null: La Compra no en té).
 *   textComptador(n)  «3 línies», «7 articles»: el número sol no diu res.
 */
import { ArrowRight } from 'lucide-react';
import { Boto } from '../atoms/Boto.jsx';

const NIVELLS = Object.freeze([3, 4, 5, 6]);

const esClicNormal = (event) => event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

export function BarraResum({
  etiqueta, comptador = 0, textComptador = (n) => String(n), total = null, textTotal = 'Total',
  accio = null, forma = 'capcalera', href, onObri, nivell = 3, className
}) {
  const n = Number.isSafeInteger(comptador) && comptador > 0 ? comptador : 0;
  const boto = accio ? (
    <Boto varietat="primari" onClick={accio.onClick} disabled={Boolean(accio.desactivada)}>{accio.text}</Boto>
  ) : null;

  if (forma === 'peu') {
    const classeObri = accio ? 'sdp-barra-resum__obri' : 'sdp-barra-resum__obri sdp-barra-resum__obri--primari';
    const contingut = (
      <>
        <span className="sdp-barra-resum__etiqueta">{etiqueta}</span>
        {' '}<span className="sdp-barra-resum__comptador">{textComptador(n)}</span>
        {total ? <>{' '}<span className="sdp-barra-resum__total">{total}</span></> : null}
        <ArrowRight className="sdp-barra-resum__fletxa" size={22} aria-hidden="true" focusable="false" />
      </>
    );
    return (
      <div className={['sdp-barra-resum', 'sdp-barra-resum--peu', className].filter(Boolean).join(' ')}>
        {href ? (
          <a className={classeObri} href={href} onClick={(event) => {
            if (!onObri || event.defaultPrevented || !esClicNormal(event)) return;
            event.preventDefault();
            onObri();
          }}>{contingut}</a>
        ) : (
          <button type="button" className={classeObri} onClick={() => onObri?.()}>{contingut}</button>
        )}
        {boto}
      </div>
    );
  }

  const Cap = `h${NIVELLS.includes(nivell) ? nivell : 3}`;
  return (
    <div className={['sdp-barra-resum', 'sdp-barra-resum--capcalera', className].filter(Boolean).join(' ')}>
      <Cap className="sdp-barra-resum__titol">
        <span className="sdp-barra-resum__etiqueta">{etiqueta}</span>
        {' '}<span className="sdp-barra-resum__comptador">{textComptador(n)}</span>
      </Cap>
      {total ? (
        <p className="sdp-barra-resum__total">
          <span className="sdp-nomes-lector">{`${textTotal}: `}</span>{total}
        </p>
      ) : null}
      {boto}
    </div>
  );
}
