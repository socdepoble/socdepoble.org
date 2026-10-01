/**
 * CalendariEsdeveniments.jsx — el mes de calendari amb els seus esdeveniments.
 *
 * T6-T8 (ordre del Mestre, 260930) · L'organisme que pinta un mes
 * d'esdeveniments (utils/esdeveniment.js) sense saber d'on venen: l'Agenda
 * del Mur hi posa els actes del poble i el Calendari de la Consola, les
 * tasques del Mapa. És NavegacioMes, una ranura i GraellaMes amb la variant
 * gran de T7 (set columnes iguals, línies fines i píndoles d'amplària
 * uniforme; en pantalla estreta, les píndoles es fan punts).
 *
 * CONTRACTE
 *   esdeveniments · llista del model (creaEsdeveniment); les nul·les no compten.
 *   cursor / onCanviaCursor · { any, mes } controlat; o cursorInicial (per
 *     defecte, el mes d'avui) i l'organisme porta el mes sol.
 *   diaTriat / onTriaDia · 'AAAA-MM-DD' | null / (clau) => void. Amb onTriaDia,
 *     cada dia és un botó que ocupa la cel·la (≥ --sdp-touch), amb aria-pressed
 *     i un nom amb la data llarga, el recompte i els títols; sense, la cel·la
 *     és quieta i porta el marcatge de T40 (la Consola no canvia de DOM).
 *   renderEsdeveniment · (esd) => node; per defecte, la píndola amb el títol.
 *   recompte · (n) => text del nom del dia («1 esdeveniment»).
 *   navegacioClassName · la barra «‹ Hui ›» (sdp-consola__capcal a la Consola).
 *   accions · node opcional al final de la barra (NavegacioMes; ordre del
 *     Mestre, 261001: la pantalla completa de /calendari). La Consola no el
 *     passa: el seu DOM no canvia.
 *   titol · nom de la regió de la graella; locale; avui (Date); className.
 *   children · la ranura entre la navegació i la graella (l'avís de mes buit).
 *
 * Les píndoles no són interactives: els enllaços viuen a les targetes, i una
 * cel·la no s'omple d'objectius tàctils.
 *
 * Importa per camí directe (mai per index.js): la porta de dependències
 * circulars de Pedra Seca ho exigix.
 */
import { Fragment, useMemo, useState } from 'react';
import { GraellaMes, NavegacioMes } from './CalendariMes.jsx';
import { cursorDe } from '../../../utils/calendari.js';
import { clauDia, indexaMes } from '../../../utils/esdeveniment.js';

const pindolaPerDefecte = (esd) => <span className="sdp-calendari__pindola">{esd.titol}</span>;
const recompteEsdeveniments = (n) => (n === 1 ? '1 esdeveniment' : `${n} esdeveniments`);
const dataLlarga = (data, locale) => data.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export function CalendariEsdeveniments({
  esdeveniments, cursor, onCanviaCursor, cursorInicial, diaTriat = null, onTriaDia,
  renderEsdeveniment = pindolaPerDefecte, recompte = recompteEsdeveniments,
  navegacioClassName, titol, locale, avui = new Date(), className, children, accions
}) {
  const [cursorPropi, setCursorPropi] = useState(() => cursorInicial ?? cursorDe(avui));
  const vigent = cursor ?? cursorPropi;
  const canvia = (nou) => {
    if (!cursor) setCursorPropi(nou);
    onCanviaCursor?.(nou);
  };
  const perDia = useMemo(() => indexaMes(esdeveniments, vigent.any, vigent.mes), [esdeveniments, vigent.any, vigent.mes]);
  const classe = ['sdp-calendari--gran', onTriaDia && 'sdp-calendari--triable', className].filter(Boolean).join(' ');

  const renderDia = (dia, { esAvui, numero }) => {
    const delDia = perDia.get(dia) ?? [];
    const pindoles = delDia.map((esd, i) => <Fragment key={`${esd.uid}·${i}`}>{renderEsdeveniment(esd)}</Fragment>);
    if (!onTriaDia) return <>{numero}{pindoles}</>;
    const clau = clauDia(vigent.any, vigent.mes, dia);
    const titols = delDia.length ? `: ${delDia.map((esd) => esd.titol).join(', ')}` : '';
    return (
      <button type="button" className="sdp-calendari__cella" aria-pressed={diaTriat === clau}
        aria-current={esAvui ? 'date' : undefined}
        aria-label={`${dataLlarga(new Date(vigent.any, vigent.mes, dia), locale)} · ${recompte(delDia.length)}${titols}`}
        onClick={() => onTriaDia(clau)}>
        <span className="sdp-calendari__numero">{numero}</span>
        {pindoles}
      </button>
    );
  };

  return (
    <>
      <NavegacioMes className={navegacioClassName} cursor={vigent} onCanvia={canvia} avui={avui} accions={accions} />
      {children}
      <GraellaMes any={vigent.any} mes={vigent.mes} locale={locale} titol={titol} avui={avui}
        className={classe} renderDia={renderDia} />
    </>
  );
}
