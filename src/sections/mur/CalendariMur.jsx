/**
 * CalendariMur.jsx — el calendari de la pestanya Calendari del Mur i de la
 * pàgina /calendari.
 *
 * T6 (ordre del Mestre, 260930) · Damunt de les targetes del Calendari, el mes
 * amb els actes del poble (CalendariEsdeveniments). S'obri al mes del dia
 * triat (?date=) o, sense, al de la primera ocurrència a partir de hui
 * (agendaMur.js), i seguix el ?date= quan canvia amb el Calendari obert.
 * Clicar un dia el porta a ?date= (les targetes de davall ja es filtren per
 * ell) i tornar-lo a clicar el lleva. Un mes sense actes ho diu, i també els
 * actes que es repetixen d'una manera que el calendari encara no sap pintar.
 *
 * Ordre del Mestre, 261001 · Abans es deia AgendaMur: la pestanya i la pàgina
 * es diuen «Calendari», i el component també (AgendaMur.jsx queda sense cap
 * importador). La pàgina /calendari (CalendariSection) munta este MATEIX
 * component amb totes les targetes del poble, i per això accepta, a més dels
 * actes del Mur:
 *   · `esdeveniments` · el model ja fet (calendariGlobal.js); si hi és, mana
 *     sobre `actes`;
 *   · `cursor` / `onCanviaCursor` · el mes controlat per qui el munta (la
 *     pàgina el llig de la URL: calendariGlobal.js · mesDeLaUrl), perquè les
 *     targetes de davall sàpien quin mes es veu; sense, el porta el component
 *     sol, com sempre;
 *   · `textos` · el que diu el recompte de cada dia i el mes buit: actes al
 *     Mur (TEXTOS_ACTES), targetes a la pàgina (calendariGlobal.js);
 *   · `accions` · un node al final de la barra «‹ Hui ›» (ordre del Mestre,
 *     261001: el botó de pantalla completa de la pàgina). El Mur no el passa:
 *     el seu DOM i els seus píxels no canvien.
 */
import { useMemo, useState } from 'react';
import { CalendariEsdeveniments } from '../../components/PedraSeca/index.js';
import { cursorDe } from '../../utils/calendari.js';
import { indexaMes, recurrenciaSuportada } from '../../utils/esdeveniment.js';
import { acteAEsdeveniment, cursorDeClau, mesDeLActeMesProper } from './agendaMur.js';

/* Ordre del Mestre, 261001 · «Calendari», no «agenda»: el mateix nom a la
   pestanya, a la pàgina i als avisos. `mesBuit` rep el mes amb la seua
   preposició («de febrer de 2023», «d’octubre de 2026»). */
export const TEXTOS_ACTES = Object.freeze({
  recompte: (n) => (n === 1 ? '1 acte' : `${n} actes`),
  mesBuit: (deMes) => `Cap acte al calendari ${deMes}.`,
  sensePintar: (n) => (n === 1
    ? 'Un acte es repetix d’una manera que el calendari encara no sap pintar: el trobaràs a les targetes de davall.'
    : `${n} actes es repetixen d’una manera que el calendari encara no sap pintar: els trobaràs a les targetes de davall.`)
});

const ALTRES_MESOS = 'N’hi ha en altres mesos: passa de mes amb les fletxes.';
const CAP_ENCARA = 'El calendari encara no en té cap.';
/* «de febrer», però «d’abril», «d’agost» i «d’octubre»: davant de vocal, la
   preposició s'apostrofa. */
export const deMes = (nomMes) => (/^[aeiouàèéíòóú]/i.test(nomMes) ? `d’${nomMes}` : `de ${nomMes}`);

/**
 * El mes que es veu ({ any, mes }) i el seu canvi, quan el porta el calendari
 * sol (la pestanya Calendari del Mur). S'obri al mes del dia triat (?date=);
 * si no, a `mesInicial` si en rep un (un mes o una funció que el calcula una
 * sola vegada; amb un `cursor` controlat, el de qui el munta); si no, al de
 * la primera ocurrència a partir de hui (mesDeLActeMesProper) i, sense cap,
 * al de hui.
 *
 * calendari-1 · El mes seguix el ?date= que canvia amb el calendari muntat
 * (tornar arrere). Es deriva durant el render, sense cap efecte: el mes vell
 * no arriba a pintar-se. Un ?date= buit o invàlid no el mou.
 *
 * Ordre del Mestre, 261001 (carril A) · Ja no s'exporta: la pàgina /calendari
 * no el fa servir (el seu mes el governa la URL, calendariGlobal.js ·
 * mesDeLaUrl) i fora d'este fitxer no l'importa ningú.
 */
function useMesDelCalendari({ pintables = [], diaTriat = null, avui = new Date(), mesInicial = null } = {}) {
  const [cursor, setCursor] = useState(() => cursorDeClau(diaTriat)
    ?? (typeof mesInicial === 'function' ? mesInicial() : mesInicial)
    ?? mesDeLActeMesProper(pintables, avui) ?? cursorDe(avui));
  const [diaPrevi, setDiaPrevi] = useState(diaTriat);
  if (diaTriat !== diaPrevi) {
    setDiaPrevi(diaTriat);
    const nou = cursorDeClau(diaTriat);
    if (nou && (nou.any !== cursor.any || nou.mes !== cursor.mes)) setCursor(nou);
  }
  return [cursor, setCursor];
}

export function CalendariMur({
  actes, esdeveniments: donats, cursor: cursorControlat, onCanviaCursor,
  diaTriat = null, onTriaDia, textos = TEXTOS_ACTES, locale = 'ca-ES', avui = new Date(), accions
}) {
  const esdeveniments = useMemo(
    () => (donats ?? (actes ?? []).map(acteAEsdeveniment)).filter(Boolean),
    [donats, actes]
  );
  /* calendari-4 · Per a triar el mes d'obertura i per a prometre actes en
     altres mesos només compten els que el calendari sap pintar. */
  const pintables = useMemo(() => esdeveniments.filter(recurrenciaSuportada), [esdeveniments]);
  /* El mes propi es calcula sempre (un hook no es crida a mitges); amb un
     `cursor` controlat, mana el de qui munta el calendari, i el propi naix
     d'ell sense buscar cap ocurrència. */
  const [cursorPropi, setCursorPropi] = useMesDelCalendari({ pintables, diaTriat, avui, mesInicial: cursorControlat ?? null });
  const cursor = cursorControlat ?? cursorPropi;
  const canviaCursor = cursorControlat ? onCanviaCursor : setCursorPropi;
  const buit = useMemo(() => indexaMes(esdeveniments, cursor.any, cursor.mes).size === 0, [esdeveniments, cursor]);
  const sensePintar = esdeveniments.length - pintables.length;
  const nomMes = new Date(cursor.any, cursor.mes, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  /* Amb esdeveniments pintables, n'hi ha en altres mesos; si només n'hi ha
     que no es poden pintar, ja ho diu el paràgraf de davall; sense cap, el
     calendari és buit. */
  const fraseDeMesBuit = pintables.length ? ALTRES_MESOS : (esdeveniments.length ? null : CAP_ENCARA);

  return (
    <CalendariEsdeveniments esdeveniments={esdeveniments} cursor={cursor} onCanviaCursor={canviaCursor}
      diaTriat={diaTriat} onTriaDia={(clau) => onTriaDia?.(clau === diaTriat ? null : clau)}
      locale={locale} avui={avui} recompte={textos.recompte} navegacioClassName="sdp-calendari__barra" accions={accions}>
      {buit ? (
        <p>
          {textos.mesBuit(deMes(nomMes))}
          {fraseDeMesBuit ? <>{' '}{fraseDeMesBuit}</> : null}
        </p>
      ) : null}
      {sensePintar ? <p>{textos.sensePintar(sensePintar)}</p> : null}
    </CalendariEsdeveniments>
  );
}
