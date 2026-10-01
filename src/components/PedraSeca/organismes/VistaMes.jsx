/**
 * VistaMes.jsx — el mes de calendari a l'estil Google Calendar.
 *
 * T10 (ordre del Mestre, 261001) · Un acte de diversos dies és UNA barra per
 * setmana, no una píndola cada dia; cada barra va al seu carril i, si un dia no
 * hi cap, l'últim carril diu «+N més» (utils/disposicioCalendari.js). El «+N»
 * no és cap finestra: és el botó del dia, que ja tria el dia (?date= a
 * /calendari) i filtra la llista de davall.
 *
 * Fase visual (prompt 261001_0445) · La pintura de les captures del Mestre
 * (vistes Mes i 2 setmanes): només les setmanes que toquen el mes (de 4 a 6
 * files, graellaDelMes amb setmanes: 'justes') o N setmanes des d'un dilluns
 * (graellaDeSetmanes), totes de la mateixa alçada; l'abreviatura del dia,
 * només a dalt; el número centrat dalt de cada cel·la, hui en un cercle invers
 * i el primer dia d'un mes veí amb el nom curt del mes («1 de nov.»). Dins de
 * la cel·la, primer les barres de tot el dia o de diversos dies (plenes, amb el
 * color de la font: classeDeFont) i després les línies «● HH:MM Títol» dels
 * actes amb hora.
 *
 * MODE COMPACTE. Decidix l'amplada del contenidor (useAmpladaContenidor), mai
 * la del viewport: per davall de 41,5em les barres es fan tires de color sense
 * text, els actes amb hora es queden en el punt i el «+N més» es diu «+N». La
 * cel·la sencera continua sent el botó del dia (≥ --sdp-touch); el nom del
 * botó ho diu tot.
 *
 * No toca GraellaMes ni CalendariEsdeveniments: el Mur, la Consola i el
 * selector de l'editor continuen amb el mes d'ara (Llei del Píxel).
 *
 * Posicionament sense `style` en JSX: cada barra escriu les línies de graella
 * (--sdp-cal-col-inici, --sdp-cal-col-fi, --sdp-cal-carril, 1-based) des d'una
 * ref (usePropietatsCss), i l'arrel, --sdp-cal-carrils (l'alçada de la fila).
 *
 * CONTRACTE
 *   esdeveniments · llista del model (creaEsdeveniment); les nul·les no compten.
 *   cursor · { any, mes } (de 0 a 11). Amb dilluns, opcional (el mes del dilluns).
 *   setmanes · 'justes' (per defecte: les que toquen el mes) o un nombre de
 *     setmanes (6, la graella fixa de sempre).
 *   dilluns · Date | null. Amb dilluns, `setmanes` setmanes (2 per defecte)
 *     des del dilluns de la seua setmana, sense cap dia atenuat (la vista 2
 *     setmanes); cada dia 1 hi porta el nom curt del mes.
 *   diaTriat / onTriaDia · 'AAAA-MM-DD' | null / (clau) => void. Amb
 *     onTriaDia, cada dia és un botó amb aria-pressed i un nom amb la data
 *     llarga, el recompte, els títols i, si n'hi ha, el «+N més» (WCAG 2.5.3:
 *     el nom conté el text visible, en el mateix ordre; en compacte es veu
 *     «+N», que el nom també conté); sense, és quiet i el recompte i els títols
 *     van en text per al lector.
 *   maxCarrils · quants carrils caben en un dia (3 per defecte; 6 amb
 *     dilluns, perquè les files de la vista 2 setmanes són altes).
 *   densitat · 'responsiva' (per defecte: compacte en contenidor estret,
 *     alçades normals), 'normal' (mai compacte) o 'compacta' (compacte en
 *     contenidor estret i, amb ratolí, cel·les més baixes; @media (pointer:
 *     fine) al full, per a no baixar cap control tàctil de --sdp-touch).
 *   recompte · (n) => text del nom del dia («1 esdeveniment»).
 *   avui · Date (marca hui); titol · nom de la regió; locale; className.
 *
 * Les barres són aria-hidden: cada dia ja diu els seus actes, al nom del botó
 * o, en el mode quiet, al text per al lector (sdp-sr-only).
 *
 * Importa per camí directe (mai per index.js): la porta de dependències
 * circulars de Pedra Seca ho exigix.
 */
import { useMemo, useRef } from 'react';
import { DIES_CURTS, DIES_LLARGS, cursorDe, horaDe } from '../../../utils/calendari.js';
import { classeDeFont, disposaMes, ocurrenciesDeLaLlista } from '../../../utils/disposicioCalendari.js';
import { clauDeData, dillunsDe, graellaDeSetmanes, graellaDelMes, sumaDies } from '../../../utils/periodes.js';
import { usePropietatsCss } from '../../../hooks/usePropietatsCss.js';
import { esEstret, useAmpladaContenidor } from '../../../hooks/useAmpladaContenidor.js';

/* Per davall d'esta amplada del contenidor, en em seus (≈ 664 px amb 16 px),
   set columnes de text no es lligen: mode compacte. */
const LLINDAR_COMPACTE_EM = 41.5;
const DENSITATS = Object.freeze(['responsiva', 'normal', 'compacta']);
/* La vista 2 setmanes té poques files i altes: hi caben més carrils. */
const SETMANES_DES_DEL_DILLUNS = 2;
const CARRILS_DEL_MES = 3;
const CARRILS_DES_DEL_DILLUNS = 6;

const recompteEsdeveniments = (n) => (n === 1 ? '1 esdeveniment' : `${n} esdeveniments`);
const dataLlarga = (data, locale) => data.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const dataDelPeriode = (data, locale) => data.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
/* «de setembre de 2026», «d’octubre de 2026»: la preposició s'apostrofa
   davant de vocal (la mateixa regla que ambDe de CalendariSection). */
const ambDe = (text) => (/^[aeiouàèéíòóú]/i.test(text) ? `d’${text}` : `de ${text}`);
/* El recompte i els títols d'un dia: el nom del botó o el text per al lector. */
const actesDelDia = (delDia, recompte) => `${recompte(delDia.length)}${delDia.length ? `: ${delDia.map((esd) => esd.titol).join(', ')}` : ''}`;

/* La graella que es pinta: N setmanes des del dilluns, les justes del mes o N
   setmanes des de l'1 del mes. */
function graellaDeLaVista(cursor, setmanes, tempsDilluns) {
  if (tempsDilluns !== null) return graellaDeSetmanes(new Date(tempsDilluns), setmanes ?? SETMANES_DES_DEL_DILLUNS);
  if (setmanes === null) return graellaDelMes(cursor, { setmanes: 'justes' });
  return graellaDeSetmanes(new Date(cursor.any, cursor.mes, 1), setmanes, { mes: cursor });
}

/* Una barra (o un punt amb l'hora, si és d'un sol dia) d'una fila de setmana.
   En compacte, la tira o el punt sols: el nom del dia ja diu el títol. */
function PecaDelMes({ peca, compacte }) {
  const ref = useRef(null);
  usePropietatsCss(ref, { '--sdp-cal-col-inici': peca.colInici + 1, '--sdp-cal-col-fi': peca.colFi + 1, '--sdp-cal-carril': peca.carril + 1 });
  const { ocurrencia, tipus } = peca.segment;
  const classe = [
    'sdp-cal-barra', classeDeFont(ocurrencia.esd), tipus === 'punt' && 'sdp-cal-barra--punt',
    peca.continuaAbans && 'sdp-cal-barra--abans', peca.continuaDespres && 'sdp-cal-barra--despres'
  ].filter(Boolean).join(' ');
  if (tipus !== 'punt') return <li ref={ref} className={classe}>{compacte ? null : ocurrencia.esd.titol}</li>;
  return (
    <li ref={ref} className={classe}>
      <span className="sdp-cal-mes__punt" />
      {compacte ? null : (
        <>
          <span className="sdp-cal-mes__hora">{horaDe(new Date(ocurrencia.inici))}</span>
          {` ${ocurrencia.esd.titol}`}
        </>
      )}
    </li>
  );
}

export function VistaMes({
  esdeveniments, cursor, avui = new Date(), diaTriat = null, onTriaDia, maxCarrils,
  setmanes = 'justes', dilluns = null, densitat = 'responsiva',
  recompte = recompteEsdeveniments, titol, locale, className
}) {
  const arrel = useRef(null);
  // Un número primitiu per a les dependències: un Date nou a cada pintada no recalcula res.
  const tempsDilluns = dilluns ? dillunsDe(dilluns).getTime() : null;
  const ambSetmanes = tempsDilluns !== null;
  const carrils = maxCarrils ?? (ambSetmanes ? CARRILS_DES_DEL_DILLUNS : CARRILS_DEL_MES);
  usePropietatsCss(arrel, { '--sdp-cal-carrils': carrils });
  const mida = useAmpladaContenidor(arrel);
  const { any, mes } = cursor ?? cursorDe(dilluns ?? avui);
  const nSetmanes = Number.isInteger(setmanes) && setmanes > 0 ? setmanes : null;
  const graella = useMemo(() => graellaDeLaVista({ any, mes }, nSetmanes, tempsDilluns), [any, mes, nSetmanes, tempsDilluns]);
  const { ocurrencies, retallat } = useMemo(
    () => ocurrenciesDeLaLlista(esdeveniments, graella[0][0].data, sumaDies(graella[graella.length - 1][6].data, 1)),
    [esdeveniments, graella]
  );
  const files = useMemo(() => disposaMes(ocurrencies, graella, { maxCarrils: carrils }), [ocurrencies, graella, carrils]);
  const hui = clauDeData(avui);
  const mode = DENSITATS.includes(densitat) ? densitat : 'responsiva';
  const compacte = mode !== 'normal' && esEstret(mida, LLINDAR_COMPACTE_EM);
  const nomPeriode = ambSetmanes
    ? `del ${dataDelPeriode(graella[0][0].data, locale)} al ${dataDelPeriode(graella[graella.length - 1][6].data, locale)}`
    : ambDe(new Date(any, mes, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' }));
  const classe = [
    'sdp-cal-mes', compacte && 'sdp-cal-mes--compacte', mode === 'compacta' && 'sdp-cal-mes--densitat-compacta', className
  ].filter(Boolean).join(' ');

  return (
    <section ref={arrel} className={classe} aria-label={titol ?? `Calendari ${nomPeriode}`}>
      <ol className="sdp-cal-mes__setmana" aria-hidden="true">
        {DIES_CURTS.map((dia, i) => <li key={dia}><abbr title={DIES_LLARGS[i]}>{dia}</abbr></li>)}
      </ol>
      <ol className="sdp-cal-mes__files">
        {files.map((fila) => (
          <li key={fila.dies[0].clau} className="sdp-cal-mes__fila">
            <ol className="sdp-cal-mes__dies">
              {fila.dies.map((dia, i) => {
                const delDia = fila.delDia[i];
                const esHui = dia.clau === hui;
                const classeDia = ['sdp-cal-dia', 'sdp-cal-dia--mes', !dia.delMes && 'sdp-cal-dia--fora'].filter(Boolean).join(' ');
                const mesText = fila.mes[i] ? `+${fila.mes[i]} més` : null;
                // L'1 d'un mes veí (o, en N setmanes, de qualsevol mes) diu el mes; en compacte i a hui, el número sol.
                const ambMes = dia.data.getDate() === 1 && (ambSetmanes || !dia.delMes) && !compacte && !esHui;
                const contingut = (
                  <>
                    <span className="sdp-cal-dia__numero">
                      {ambMes ? dia.data.toLocaleDateString(locale, { day: 'numeric', month: 'short' }) : dia.data.getDate()}
                    </span>
                    {mesText ? <span className="sdp-cal-mes__mes">{compacte ? `+${fila.mes[i]}` : mesText}</span> : null}
                  </>
                );
                return (
                  <li key={dia.clau} className="sdp-cal-mes__cella">
                    {onTriaDia ? (
                      <button type="button" className={classeDia} aria-pressed={diaTriat === dia.clau}
                        aria-current={esHui ? 'date' : undefined}
                        aria-label={`${dataLlarga(dia.data, locale)} · ${actesDelDia(delDia, recompte)}${mesText ? ` · ${mesText}` : ''}`}
                        onClick={() => onTriaDia(dia.clau)}>
                        {contingut}
                      </button>
                    ) : (
                      <span className={classeDia} aria-current={esHui ? 'date' : undefined}>
                        {contingut}
                        {delDia.length ? <span className="sdp-sr-only">{` · ${actesDelDia(delDia, recompte)}`}</span> : null}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
            <ol className="sdp-cal-mes__barres" aria-hidden="true">
              {fila.peces.map((peca) => <PecaDelMes key={`${peca.segment.ocurrencia.clau}·${peca.colInici}`} peca={peca} compacte={compacte} />)}
            </ol>
          </li>
        ))}
      </ol>
      {retallat ? <p>Algun acte es repetix massa sovint per a pintar-lo sencer: el trobaràs a les targetes.</p> : null}
    </section>
  );
}
