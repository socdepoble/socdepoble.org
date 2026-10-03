/**
 * TeclatNumeric.jsx — teclat tàctil per a imports i quantitats. Torna enters.
 *
 *   mode 'import'     el valor són CÈNTIMS: teclejar 1, 2, 5 dona 125 (1,25 €),
 *                     com una caixa registradora; el visor el pinta amb
 *                     formatEuros (utils/diners.js)
 *   mode 'quantitat'  el valor és un enter (unitats, ml…), amb `unitat` al visor
 *
 * Controlat: rep `valor` (enter ≥ 0) i avisa amb `onCanvi(enter)`. Mai torna
 * coma flotant. Una xifra que passaria de `maxim` no s'afig. C posa a zero i
 * ⌫ esborra l'última xifra. Amb `onAccepta`, un botó primari al peu el crida
 * amb el valor.
 *
 * Accessibilitat: role="group" amb el nom del teclat; el visor és un <output>
 * aria-live que diu el valor nou; cada tecla és un <button> natiu ≥ --sdp-touch.
 * El nom de cada tecla comença pel text que es veu («C, posa a zero»), perquè
 * qui la crida per veu la trobe (WCAG 2.5.3).
 * Amb el focus dins del teclat, el teclat físic també val: 0-9, Retrocés
 * (esborra l'última) i Supr (posa a zero). Escape i Retorn no es toquen.
 */
import { Delete } from 'lucide-react';
import { Boto } from '../atoms/Boto.jsx';
import { formatEuros } from '../../../utils/diners.js';

const MAXIMS = Object.freeze({ import: 9999999, quantitat: 9999 });
const XIFRES = Object.freeze(['7', '8', '9', '4', '5', '6', '1', '2', '3']);

const enterValid = (valor) => (Number.isSafeInteger(valor) && valor > 0 ? valor : 0);

/**
 * El valor després de prémer una tecla: una xifra '0'-'9', 'esborra' o 'neteja'.
 * @param {number} valor
 * @param {string} tecla
 * @param {number} maxim
 * @returns {number}
 */
export function seguentValor(valor, tecla, maxim) {
  const actual = enterValid(valor);
  if (tecla === 'esborra') return Math.trunc(actual / 10);
  if (tecla === 'neteja') return 0;
  if (typeof tecla === 'string' && /^\d$/.test(tecla)) {
    const nou = actual * 10 + Number(tecla);
    return nou > maxim ? actual : nou;
  }
  return actual;
}

export function TeclatNumeric({
  valor = 0, onCanvi, mode = 'import', maxim, etiqueta, unitat = '',
  onAccepta, textAccepta = 'D’acord', desactivat = false, className, id
}) {
  const esImport = mode === 'import';
  const limit = Number.isSafeInteger(maxim) && maxim > 0 ? maxim : MAXIMS[esImport ? 'import' : 'quantitat'];
  const actual = enterValid(valor);
  const nom = etiqueta || (esImport ? 'Import' : 'Quantitat');
  const visor = esImport ? formatEuros(actual) : `${actual}${unitat ? ` ${unitat}` : ''}`;

  const prem = (tecla) => {
    if (desactivat) return;
    const nou = seguentValor(actual, tecla, limit);
    if (nou !== actual) onCanvi?.(nou);
  };

  const teclaFisica = (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    let tecla = null;
    if (/^\d$/.test(event.key)) tecla = event.key;
    else if (event.key === 'Backspace') tecla = 'esborra';
    else if (event.key === 'Delete') tecla = 'neteja';
    if (tecla === null) return;
    event.preventDefault();
    prem(tecla);
  };

  return (
    <div id={id} className={['sdp-teclat', className].filter(Boolean).join(' ')} role="group" aria-label={nom} onKeyDown={teclaFisica}>
      <output className="sdp-teclat__visor" aria-live="polite" aria-atomic="true">
        <span className="sdp-teclat__etiqueta">{nom}</span>
        <span className="sdp-teclat__xifra">{visor}</span>
      </output>
      <div className="sdp-teclat__tecles">
        {XIFRES.map((xifra) => (
          <button key={xifra} type="button" className="sdp-teclat__tecla" disabled={desactivat} onClick={() => prem(xifra)}>{xifra}</button>
        ))}
        <button type="button" className="sdp-teclat__tecla sdp-teclat__tecla--control" disabled={desactivat} aria-label="C, posa a zero" onClick={() => prem('neteja')}>C</button>
        <button type="button" className="sdp-teclat__tecla" disabled={desactivat} onClick={() => prem('0')}>0</button>
        <button type="button" className="sdp-teclat__tecla sdp-teclat__tecla--control" disabled={desactivat} aria-label="Esborra l’última xifra" onClick={() => prem('esborra')}>
          <Delete size={24} aria-hidden="true" focusable="false" />
        </button>
      </div>
      {onAccepta ? (
        <Boto varietat="primari" ple disabled={desactivat} onClick={() => onAccepta(actual)}>{textAccepta}</Boto>
      ) : null}
    </div>
  );
}
