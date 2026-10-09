/**
 * CalendariDelPoble.jsx — el calendari únic de Sóc de Poble: el de la pàgina
 * /calendari i el de la pestanya Calendari del Mur.
 *
 * Onada 6 (prompt 261009_0230, punt 1: «El Mur i el Calendari gastaven
 * components diferents; s'han d'unificar absolutament sota l'estètica i
 * funcionalitat de Google Calendar») · Abans, el Mur muntava CalendariMur (la
 * taula de CalendariEsdeveniments, una píndola per dia) i /calendari, les
 * vistes de Google Calendar (P6, 261003). Ara les dos munten este component
 * presentacional, extret de CalendariSection sense canviar el DOM de
 * /calendari (més enllà del títol, que puja a la fila de la navegació):
 *   · «Hui ‹ ›», el títol del període a la mateixa fila (l'h3 de sempre, com a
 *     Google) i el selector de les cinc vistes (NavegacioPeriode);
 *   · la vista: Setmana, Dues setmanes, Mes, Any o Agenda;
 *   · davall, les targetes del dia triat (?date=) o, sense dia, les del
 *     període que es veu, amb la MATEIXA targeta del Mur (TargetaDelMur).
 * Clicar un esdeveniment porta a la pàgina de la seua publicació, la mateixa
 * on porta la seua targeta (calendariGlobal.js · rutaDeLEntrada), amb el Link
 * del router; clicar el dia, fora de l'enllaç (al Mes el quadre, a la Setmana
 * la columna), el tria i en mostra les targetes davall, amb una sola regla per
 * a la graella i per a la llista (calendariGlobal.js · entradesDelDia, la
 * d'acteOcorreElDia del Mur). En pantalla tàctil, les peces del Mes i de la
 * Setmana fan 24px (Pedra Seca §6 vol --sdp-touch): el toc tria el seu dia i
 * la targeta de davall obri la publicació. A l'Agenda, que no tria cap dia,
 * la fila creix fins a --sdp-touch i el toc obri la publicació.
 *
 * No fa cap petició ni llig la URL: l'estat el porta qui el munta
 * (useEstatCalendari) i les entrades també (CalendariSection hi barreja
 * l'agenda de Sollutia i les fonts de Google; el Mur, només els seus actes).
 *
 * CONTRACTE
 *   estat · { vista, diaTriat, cursor, dilluns } (estatCalendari.js).
 *   navega / canviaVista / triaDia / obriDia · les accions de useEstatCalendari.
 *   entrades · les entrades del calendari (calendariGlobal.js), ja barrejades.
 *   avui · el Date del dia de hui (estable durant el dia: qui el passa el memoritza).
 *   senseData · quantes targetes no es poden situar: en diu una línia.
 *   avisos · node davant de la navegació (l'error del Mur).
 *   avisAgenda · node davant de l'avís de senseData (l'agenda de Sollutia que no respon).
 *   accions · node a la barra, entre el títol i el selector (la pantalla completa).
 *   LinkComponent · el Link del router (per defecte, el de RouterContext).
 */
import { useMemo } from 'react';
import { Link } from '../../app/contexts/RouterContext';
import {
  NavegacioPeriode, UniversalCard, VistaAgenda, VistaAny, VistaMes, VistaSetmana
} from '../../components/PedraSeca/index.js';
import { fontsDeLActe } from '../../components/universal/EventCard.jsx';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
import { recurrenciaSuportada } from '../../utils/esdeveniment.js';
import { clauDeData, sumaDies } from '../../utils/periodes.js';
import { TargetaDelMur } from '../mur/TargetaDelMur.jsx';
import {
  TEXTOS_TARGETES, entradesDelDia, entradesDelMes, entradesDelRang, recompteTargetes, rutaDeLEntrada
} from './calendariGlobal.js';
import { SETMANES_DEL_MES, rangDeLaVista } from './estatCalendari.js';

const LOCALE = 'ca-ES';

const nomDelMes = ({ any, mes }) => new Date(any, mes, 1).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });

/* Un acte de l'agenda de Sollutia (o d'una font de fora): la targeta
   universal amb el títol, el lloc i la pastilla del seu inici (la regla de la
   barra taronja: sempre plena). No porta cap enllaç: l'acte no té pàgina a
   Sóc de Poble. */
function TargetaDeLAgenda({ entrada }) {
  const esdeveniment = entrada.acte;
  const data = dataHoraDeBarra(fontsDeLActe(esdeveniment));
  return (
    <UniversalCard title={esdeveniment.titol} body={esdeveniment.lloc || undefined}
      date={data.date} time={data.time} dateTime={data.dateTime} />
  );
}

/* Les targetes de davall, amb la MATEIXA targeta del Mur; `buit` és el que
   diu sense cap targeta.
   Ordre del Mestre (261007) · Comentar, el menú de dues vies de totes les
   targetes (el mateix del Mur): cap gestor de llista. */
function TargetesDeDavall({ visibles, buit }) {
  return (
    <>
      <h4 role="status">
        {visibles.length ? recompteTargetes(visibles.length) : buit}
      </h4>
      <div className="sdp-card-grid">
        {visibles.map((entrada) => (entrada.agenda
          ? <TargetaDeLAgenda key={entrada.clau} entrada={entrada} />
          : <TargetaDelMur key={entrada.clau} item={entrada.item} esdeveniment={entrada.acte} />))}
      </div>
    </>
  );
}

const MES_PER_PAS = Object.freeze({ anterior: 'Mes anterior', hui: 'Hui', seguent: 'Mes següent' });
const ETIQUETES_PERIODE = Object.freeze({
  setmana: Object.freeze({ anterior: 'Setmana anterior', hui: 'Hui', seguent: 'Setmana següent' }),
  'dues-setmanes': Object.freeze({ anterior: 'Dues setmanes anteriors', hui: 'Hui', seguent: 'Dues setmanes següents' }),
  mes: MES_PER_PAS,
  any: Object.freeze({ anterior: 'Any anterior', hui: 'Hui', seguent: 'Any següent' }),
  agenda: MES_PER_PAS
});
/* Fase visual · La densitat de Setmana, Dues setmanes i Mes: la responsiva
   (decisió per defecte; la compacta només amb ratolí). */
const DENSITAT = 'responsiva';
const dataSenseDiaDeLaSetmana = (data) => data.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
/* Un rang semiobert [desde, fins) en text: «28 de setembre – 4 d’octubre de 2026». */
const nomDelRang = ({ desde, fins }) => `${dataSenseDiaDeLaSetmana(desde)} – ${dataSenseDiaDeLaSetmana(sumaDies(fins, -1))}`;
/* «de setembre de 2026», «d’octubre de 2026»: la preposició s'apostrofa davant de vocal. */
const ambDe = (text) => (/^[aeiouàèéíòóú]/i.test(text) ? `d’${text}` : `de ${text}`);

/* Els textos de cada vista: el títol de la navegació, el nom de la regió i
   el buit de la llista de davall (sense dia triat). */
function textosDeLaVista(vista, cursor, rang) {
  if (vista === 'setmana') {
    const periode = nomDelRang(rang);
    return { periode, regio: `Calendari de la setmana del ${periode}`, buit: 'Cap publicació esta setmana.' };
  }
  if (vista === 'dues-setmanes') {
    const periode = nomDelRang(rang);
    return { periode, regio: `Calendari de les dues setmanes del ${periode}`, buit: 'Cap publicació estes dues setmanes.' };
  }
  if (vista === 'any') {
    const periode = String(cursor.any);
    return { periode, regio: `Calendari de l’any ${periode}`, buit: 'Cap publicació este any.' };
  }
  const periode = nomDelMes(cursor);
  if (vista === 'agenda') return { periode, regio: `Agenda ${ambDe(periode)}`, buit: 'Cap publicació en este període.' };
  return { periode, regio: `Calendari ${ambDe(periode)}`, buit: 'Cap publicació este mes.' };
}

/* Onada 6 · On porta cada esdeveniment de les vistes: la ruta de la seua
   entrada (rutaDeLEntrada), per l'objecte esdeveniment (les ocurrències de
   les vistes el porten tal qual). Sense targeta, cap enllaç. */
function useRutesDeLesEntrades(entrades) {
  return useMemo(() => {
    const rutes = new Map();
    for (const entrada of entrades) {
      const ruta = rutaDeLEntrada(entrada);
      if (ruta) rutes.set(entrada.esdeveniment, ruta);
    }
    return (esdeveniment) => rutes.get(esdeveniment) ?? null;
  }, [entrades]);
}

export function CalendariDelPoble({
  estat, navega, canviaVista, triaDia, obriDia, entrades, avui, senseData = 0,
  avisos = null, avisAgenda = null, accions = null, LinkComponent = Link
}) {
  const { vista, diaTriat, cursor, dilluns } = estat;
  const rang = useMemo(() => rangDeLaVista(estat, avui), [estat, avui]);
  const esdeveniments = useMemo(() => entrades.map((entrada) => entrada.esdeveniment).filter(Boolean), [entrades]);
  /* Revisió de T10 · Un acte amb una recurrència que no es pinta (FALLA) no
     té cap ocurrència a la graella, però la llista de davall el du el dia que
     comença: es diu, perquè la graella i la llista no discrepen en silenci. */
  const sensePintar = useMemo(() => esdeveniments.filter((esd) => !recurrenciaSuportada(esd)).length, [esdeveniments]);
  const rutaDeLEsdeveniment = useRutesDeLesEntrades(entrades);
  /* La llista de davall: el dia triat; el mes natural a la vista Mes (com
     sempre); i a la resta, el rang que pinta la vista. L'Agenda no marca ni
     deixa llevar el dia triat que hereta de Mes o de Setmana: la llista diu
     el seu rang, que ja el conté (rangDeLaVista). */
  const delDia = vista === 'agenda' ? null : diaTriat;
  const visibles = useMemo(() => {
    if (delDia) return entradesDelDia(entrades, delDia);
    if (vista === 'mes') return entradesDelMes(entrades, cursor);
    return entradesDelRang(entrades, { desde: clauDeData(rang.desde), fins: clauDeData(rang.fins) });
  }, [entrades, delDia, vista, cursor, rang]);

  const textos = textosDeLaVista(vista, cursor, rang);
  const buit = delDia ? 'Cap publicació este dia.' : textos.buit;
  const comunes = { esdeveniments, avui, recompte: recompteTargetes, locale: LOCALE, titol: textos.regio };
  // Onada 6 · Les vistes amb peces d'esdeveniment porten l'enllaç a la publicació.
  const enllacos = { rutaDeLEsdeveniment, LinkComponent };
  const titolSuperior = textos.periode.charAt(0).toUpperCase() + textos.periode.slice(1);

  return (
    <>
      {avisos}
      {/* Onada 6 (prompt 261009_0230) · El títol del període, a la mateixa fila
          que «Hui ‹ ›» i el selector, com a Google Calendar: és l'h3 de
          sempre (abans, damunt de la barra), dins de la navegació. */}
      <NavegacioPeriode titol={titolSuperior} nivellTitol={3} etiquetes={ETIQUETES_PERIODE[vista]}
        onAnterior={() => navega('anterior')} onHui={() => navega('hui')} onSeguent={() => navega('seguent')}
        vista={vista} onCanviaVista={canviaVista} accions={accions} />
      {vista === 'setmana' ? (
        <VistaSetmana {...comunes} {...enllacos} dilluns={dilluns} diaTriat={diaTriat} onTriaDia={triaDia} densitat={DENSITAT} />
      ) : null}
      {/* Mes i Dues setmanes: la mateixa anatomia (VistaMes); Dues setmanes, dos files des del dilluns. */}
      {vista === 'mes' || vista === 'dues-setmanes' ? (
        <VistaMes {...comunes} {...enllacos} cursor={cursor} dilluns={vista === 'dues-setmanes' ? dilluns : null}
          setmanes={vista === 'dues-setmanes' ? 2 : SETMANES_DEL_MES} diaTriat={diaTriat} onTriaDia={triaDia} densitat={DENSITAT} />
      ) : null}
      {/* Any: clicar un dia obri la seua setmana, amb el dia triat (obriDia). */}
      {vista === 'any' ? <VistaAny {...comunes} any={cursor.any} diaTriat={diaTriat} onTriaDia={obriDia} /> : null}
      {vista === 'agenda' ? <VistaAgenda {...comunes} {...enllacos} desde={rang.desde} fins={rang.fins} buit="Cap publicació en este període." /> : null}
      {sensePintar ? <p>{TEXTOS_TARGETES.sensePintar(sensePintar)}</p> : null}
      {avisAgenda}
      {/* Revisió del carril A (ordre del Mestre, 261001) · Una targeta sense
          esdeveniment no ix ni a la graella ni a la llista, i l'avís diu la
          veritat: pot ser que no porte data o que no tinga identificador. */}
      {senseData ? (
        <p>
          {senseData === 1
            ? 'Una publicació no es pot situar al calendari perquè no porta cap data o no té identificador: la trobaràs al Mur.'
            : `${senseData} publicacions no es poden situar al calendari perquè no porten cap data o no tenen identificador: les trobaràs al Mur.`}
        </p>
      ) : null}
      <TargetesDeDavall visibles={visibles} buit={buit} />
    </>
  );
}
