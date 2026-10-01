/**
 * VistaAny.jsx — l'any de calendari a l'estil Google Calendar: dotze mesos
 * xicotets.
 *
 * Fase visual (prompt 261001_0445) · La captura de la vista Any del Mestre:
 * cada mes amb el seu nom, les abreviatures dels dies i sis setmanes fixes
 * (graellaDelMes) amb els dies dels mesos veïns atenuats; hui, en un cercle
 * invers. Un punt davall del número diu que el dia té actes (les mateixes
 * ocurrències que la resta de vistes: ocurrenciesDeLaLlista de tot l'any).
 *
 * COLUMNES. Les decidix l'amplada del contenidor amb la graella CSS
 * repeat(auto-fill, minmax(…, 1fr)): 4, 3, 2 o 1 mesos per fila sense cap
 * media query. El mínim d'un mes és set dies de --sdp-touch: cap dia baixa
 * dels 44px en pantalla tàctil (en un mòbil, un mes per fila). Amb ratolí
 * (@media (pointer: fine), la densitat compacta de la fase visual) el dia fa
 * 2rem, i hi caben quatre mesos com a la captura. Per davall de 7 × 44px de
 * contingut el mes s'estreny amb el contenidor: amb el marge de pàgina de
 * 16px per banda i el farciment de la targeta, passa per davall d'uns 358px
 * de pantalla (un mòbil de 320px; el de 360px encara hi cap). És l'única
 * excepció, i val més que un scroll horitzontal.
 *
 * TECLAT. Cada dia és un botó (amb onTriaDia), però tot l'any és UN sol punt
 * de tabulació: el dia actiu (l'últim enfocat, el triat, hui o l'1 de gener)
 * té tabIndex 0 i la resta -1, i les fletxes es mouen pels dies (← → un dia,
 * ↑ ↓ una setmana) sense eixir de l'any. Sense això, arribar a les targetes de
 * davall costaria 365 tabulacions.
 *
 * CONTRACTE
 *   esdeveniments · llista del model (creaEsdeveniment); les nul·les no compten.
 *   any · número (2026).
 *   onTriaDia · (clau) => void: a /calendari obri la setmana d'eixe dia
 *     (?vista=setmana&date=…). Sense, els dies són quiets i el recompte va en
 *     text per al lector.
 *   diaTriat · 'AAAA-MM-DD' | null: el dia triat es marca (no és cap
 *     interruptor: clicar-lo també l'obri).
 *   recompte · (n) => text del nom del dia («1 esdeveniment»).
 *   avui · Date (marca hui); titol · nom de la regió; locale; className.
 *
 * Els dies dels mesos veïns són aria-hidden i no són botons: cada dia de
 * l'any té un sol botó, el del seu mes.
 *
 * Importa per camí directe (mai per index.js): la porta de dependències
 * circulars de Pedra Seca ho exigix.
 */
import { useId, useMemo, useRef, useState } from 'react';
import { DIES_CURTS, DIES_LLARGS } from '../../../utils/calendari.js';
import { ocurrenciesDeLaLlista } from '../../../utils/disposicioCalendari.js';
import { clauDeData, graellaDelMes, sumaDies } from '../../../utils/periodes.js';

const MESOS = Object.freeze(Array.from({ length: 12 }, (_, i) => i));
const PASSOS_TECLAT = Object.freeze({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 });
const recompteEsdeveniments = (n) => (n === 1 ? '1 esdeveniment' : `${n} esdeveniments`);
const dataLlarga = (data, locale) => data.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
/* El Date local d'una clau 'AAAA-MM-DD' que ja ve de periodes.js (sempre vàlida). */
const dataDeLaClau = (clau) => new Date(Number(clau.slice(0, 4)), Number(clau.slice(5, 7)) - 1, Number(clau.slice(8, 10)));

/* Quants esdeveniments diferents toca cada dia del rang [desde, fins): Map clau → n. */
function actesPerDia(ocurrencies, desde, fins) {
  const perDia = new Map();
  for (const oc of ocurrencies) {
    const primer = dataDeLaClau(oc.diaInici);
    for (let dia = primer < desde ? desde : primer; dia < fins && clauDeData(dia) < oc.diaFi; dia = sumaDies(dia, 1)) {
      const clau = clauDeData(dia);
      if (!perDia.has(clau)) perDia.set(clau, new Set());
      perDia.get(clau).add(oc.esd);
    }
  }
  return new Map([...perDia].map(([clau, esds]) => [clau, esds.size]));
}

export function VistaAny({
  esdeveniments, any, avui = new Date(), diaTriat = null, onTriaDia,
  recompte = recompteEsdeveniments, titol, locale, className
}) {
  const idBase = useId();
  const arrel = useRef(null);
  const [enfocat, setEnfocat] = useState(null);
  const mesos = useMemo(() => MESOS.map((mes) => graellaDelMes({ any, mes })), [any]);
  const { perDia, retallat } = useMemo(() => {
    const [desde, fins] = [new Date(any, 0, 1), new Date(any + 1, 0, 1)];
    const resultat = ocurrenciesDeLaLlista(esdeveniments, desde, fins);
    return { perDia: actesPerDia(resultat.ocurrencies, desde, fins), retallat: resultat.retallat };
  }, [esdeveniments, any]);
  const hui = clauDeData(avui);
  const esDeLAny = (clau) => typeof clau === 'string' && clau.startsWith(`${any}-`);
  const actiu = [enfocat, diaTriat, hui].find(esDeLAny) ?? clauDeData(new Date(any, 0, 1));
  const idAjuda = `${idBase}-ajuda`;
  const classe = ['sdp-cal-any', className].filter(Boolean).join(' ');

  // Les fletxes mouen el focus pels dies de l'any; fora de l'any, no fan res.
  const onKeyDown = (event) => {
    const pas = PASSOS_TECLAT[event.key];
    const clau = event.target?.dataset?.clau;
    if (!pas || !clau) return;
    const nova = clauDeData(sumaDies(dataDeLaClau(clau), pas));
    if (!esDeLAny(nova)) return;
    event.preventDefault();
    setEnfocat(nova);
    arrel.current?.querySelector(`[data-clau="${nova}"]`)?.focus();
  };

  return (
    <section ref={arrel} className={classe} aria-label={titol ?? `Calendari de l’any ${any}`}
      aria-describedby={onTriaDia ? idAjuda : undefined} onKeyDown={onTriaDia ? onKeyDown : undefined}>
      {onTriaDia ? <p className="sdp-sr-only" id={idAjuda}>Les fletxes es mouen pels dies de l’any.</p> : null}
      <ol className="sdp-cal-any__mesos">
        {mesos.map((graella, mes) => {
          const idNom = `${idBase}-${mes}`;
          return (
            <li key={mes} className="sdp-cal-any__mes">
              <h3 className="sdp-cal-any__nom" id={idNom}>{new Date(any, mes, 1).toLocaleDateString(locale, { month: 'long' })}</h3>
              <table className="sdp-cal-any__graella" aria-labelledby={idNom}>
                <thead>
                  <tr>{DIES_CURTS.map((dia, i) => <th key={dia} scope="col"><abbr title={DIES_LLARGS[i]}>{dia}</abbr></th>)}</tr>
                </thead>
                <tbody>
                  {graella.map((setmana) => (
                    <tr key={setmana[0].clau}>
                      {setmana.map((dia) => {
                        const numero = dia.data.getDate();
                        if (!dia.delMes) {
                          return (
                            <td key={dia.clau}>
                              <span className="sdp-cal-any__dia sdp-cal-any__dia--fora" aria-hidden="true">
                                <span className="sdp-cal-any__numero">{numero}</span>
                              </span>
                            </td>
                          );
                        }
                        const n = perDia.get(dia.clau) ?? 0;
                        const triat = dia.clau === diaTriat;
                        const esHui = dia.clau === hui;
                        const classeDia = ['sdp-cal-any__dia', triat && 'sdp-cal-any__dia--triat'].filter(Boolean).join(' ');
                        const contingut = (
                          <>
                            <span className="sdp-cal-any__numero">{numero}</span>
                            <span className={n ? 'sdp-cal-any__punt' : 'sdp-cal-any__punt sdp-cal-any__punt--buit'} aria-hidden="true" />
                          </>
                        );
                        return (
                          <td key={dia.clau}>
                            {onTriaDia ? (
                              <button type="button" className={classeDia} data-clau={dia.clau} tabIndex={dia.clau === actiu ? 0 : -1}
                                aria-current={esHui ? 'date' : undefined}
                                aria-label={`${dataLlarga(dia.data, locale)} · ${recompte(n)}${triat ? ' · dia triat' : ''}`}
                                onFocus={() => setEnfocat(dia.clau)} onClick={() => onTriaDia(dia.clau)}>
                                {contingut}
                              </button>
                            ) : (
                              <span className={classeDia} aria-current={esHui ? 'date' : undefined}>
                                {contingut}
                                {n ? <span className="sdp-sr-only">{` · ${recompte(n)}`}</span> : null}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </li>
          );
        })}
      </ol>
      {retallat ? <p>Algun acte es repetix massa sovint per a pintar-lo sencer: el trobaràs a les targetes.</p> : null}
    </section>
  );
}
