/**
 * AgendaMur.jsx — el calendari de la pestanya Agenda del Mur.
 *
 * T6 (ordre del Mestre, 260930) · Damunt de les targetes d'agenda, el mes
 * amb els actes del poble (CalendariEsdeveniments). S'obri al mes del dia
 * triat (?date=) o, sense, al de la primera ocurrència a partir de hui
 * (agendaMur.js), i seguix el ?date= quan canvia amb l'Agenda oberta. Clicar
 * un dia el porta a ?date= (les targetes de davall ja es filtren per ell) i
 * tornar-lo a clicar el lleva. Un mes sense actes ho diu, i també els actes
 * que es repetixen d'una manera que el calendari encara no sap pintar.
 */
import { useMemo, useState } from 'react';
import { CalendariEsdeveniments } from '../../components/PedraSeca/index.js';
import { cursorDe } from '../../utils/calendari.js';
import { indexaMes, recurrenciaSuportada } from '../../utils/esdeveniment.js';
import { acteAEsdeveniment, cursorDeClau, mesDeLActeMesProper } from './agendaMur.js';

const recompteActes = (n) => (n === 1 ? '1 acte' : `${n} actes`);

export function AgendaMur({ actes, diaTriat = null, onTriaDia, locale = 'ca-ES', avui = new Date() }) {
  const esdeveniments = useMemo(() => (actes ?? []).map(acteAEsdeveniment).filter(Boolean), [actes]);
  /* calendari-4 · Per a triar el mes d'obertura i per a prometre actes en
     altres mesos només compten els que el calendari sap pintar. */
  const pintables = useMemo(() => esdeveniments.filter(recurrenciaSuportada), [esdeveniments]);
  const [cursor, setCursor] = useState(() => cursorDeClau(diaTriat) ?? mesDeLActeMesProper(pintables, avui) ?? cursorDe(avui));
  /* calendari-1 · El mes seguix el ?date= que canvia amb l'Agenda muntada (la
     pastilla d'una targeta, o tornar arrere). Es deriva durant el render, sense
     cap efecte: el mes vell no arriba a pintar-se. Un ?date= buit o invàlid no
     el mou. */
  const [diaPrevi, setDiaPrevi] = useState(diaTriat);
  if (diaTriat !== diaPrevi) {
    setDiaPrevi(diaTriat);
    const nou = cursorDeClau(diaTriat);
    if (nou && (nou.any !== cursor.any || nou.mes !== cursor.mes)) setCursor(nou);
  }
  const buit = useMemo(() => indexaMes(esdeveniments, cursor.any, cursor.mes).size === 0, [esdeveniments, cursor]);
  const sensePintar = esdeveniments.length - pintables.length;
  const nomMes = new Date(cursor.any, cursor.mes, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  /* Amb actes pintables, n'hi ha en altres mesos; si només n'hi ha que no es
     poden pintar, ja ho diu el paràgraf de davall; sense cap, l'agenda és buida. */
  const fraseDeMesBuit = pintables.length
    ? 'N’hi ha en altres mesos: passa de mes amb les fletxes.'
    : (esdeveniments.length ? null : 'L’agenda encara no en té cap.');

  return (
    <CalendariEsdeveniments esdeveniments={esdeveniments} cursor={cursor} onCanviaCursor={setCursor}
      diaTriat={diaTriat} onTriaDia={(clau) => onTriaDia?.(clau === diaTriat ? null : clau)}
      locale={locale} avui={avui} recompte={recompteActes} navegacioClassName="sdp-calendari__barra">
      {buit ? (
        <p>
          Cap acte a l’agenda de {nomMes}.
          {fraseDeMesBuit ? <>{' '}{fraseDeMesBuit}</> : null}
        </p>
      ) : null}
      {sensePintar ? (
        <p>
          {sensePintar === 1
            ? 'Un acte es repetix d’una manera que el calendari encara no sap pintar: el trobaràs a les targetes de davall.'
            : `${sensePintar} actes es repetixen d’una manera que el calendari encara no sap pintar: els trobaràs a les targetes de davall.`}
        </p>
      ) : null}
    </CalendariEsdeveniments>
  );
}
