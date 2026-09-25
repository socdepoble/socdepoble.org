import { useMemo, useState } from 'react';
import {
  CalendarDays, CalendarRange, CircleHelp, Infinity as IconaSempre, Power, Shuffle, Sun, Zap
} from 'lucide-react';
import { Boto, EstatBuit, Insignia, Taula } from '../../../components/PedraSeca';
import { Mono, TargetaResum } from '../peces.jsx';
import { textLlancador } from './mapaContent.js';
import {
  DIES_CURTS, DIES_LLARGS, GRUPS_CADENCIA, classificaTasca, graellaMes, mouMes, quanDe, resumCalendari, tocaElDia
} from './calendariMapa.js';

/* Calendari de processos (02_calendari.md): què corre sol, quan, qui ho
   llança i si continua viu. És el calendari d'Emowe en valencià: les caixes
   per cadència damunt del mes (targetes del Panell de Control), el detall de
   cada tasca en una taula i, davall, el mes. */

const ICONES_GRUP = Object.freeze({
  dia: Sun, setmana: CalendarDays, mes: CalendarRange, altra: Shuffle,
  permanent: IconaSempre, arrencada: Power, esdeveniment: Zap, sense: CircleHelp
});

const TO_ESTAT = Object.freeze({
  viu: 'exit', mort: 'error', 'declarat-sense-llancador': 'neutre',
  'llancador-sense-declaracio': 'avis', desconegut: 'neutre'
});
const TEXT_ESTAT = Object.freeze({
  viu: 'viu', mort: 'mort', 'declarat-sense-llancador': 'sense llançador',
  'llancador-sense-declaracio': 'sense declaració', desconegut: 'desconegut'
});
const AL_MES = new Set(['dia', 'setmana', 'mes']);

function Xip({ tasca }) {
  return <Insignia to={TO_ESTAT[tasca.estat]}>{tasca.id} · {TEXT_ESTAT[tasca.estat]}</Insignia>;
}

export function CalendariMapa({ mapa, locale }) {
  const avui = new Date();
  const [cursor, setCursor] = useState({ any: avui.getFullYear(), mes: avui.getMonth() });
  const grups = useMemo(() => resumCalendari(mapa.tasques), [mapa]);
  const alMes = mapa.tasques.filter((t) => AL_MES.has(classificaTasca(t)));
  const setmanes = graellaMes(cursor.any, cursor.mes);
  const titolMes = new Date(cursor.any, cursor.mes, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const esAvui = (dia) => dia === avui.getDate() && cursor.mes === avui.getMonth() && cursor.any === avui.getFullYear();

  if (!mapa.tasques.length) {
    return (
      <EstatBuit titol="Cap tasca al Mapa">
        El Mapa no porta cap tasca: ni el registre <Mono>.agents/cron/registre_tasques.json</Mono> ni
        cap llançador de launchd n'han declarat. Tot el que fan els agents comença quan algú ho demana.
      </EstatBuit>
    );
  }

  return (
    <>
      <p>
        Ací només ixen les tasques que tenen alguna programació. Cada tasca porta
        el seu estat: <strong>viu</strong> si el llançador existix i ha treballat dins
        de dos cicles, <strong>mort</strong> si l'script no existix o l'última línia
        del registre és un error, <strong>sense llançador</strong> si el registre la
        declara i ningú la llança, i <strong>sense declaració</strong> si un llançador
        la llança i el registre no la coneix. Una cadència en segons de setmanes o
        mesos no té dia fix i només apareix a la seua caixa.
      </p>
      <div className="sdp-card-grid">
        {GRUPS_CADENCIA.filter(([k]) => grups[k].length).map(([k, etiqueta]) => (
          <TargetaResum key={k} icona={ICONES_GRUP[k]} titol={`${etiqueta} (${grups[k].length})`}
            descripcio={grups[k].map((t) => t.id).join(' · ')} />
        ))}
      </div>
      <Taula titol="Tasques per cadència" densa>
        <thead>
          <tr>
            <th scope="col">Cadència</th><th scope="col">Tasca</th><th scope="col">Estat</th>
            <th scope="col">Quan</th><th scope="col">Llançador</th><th scope="col">Script</th>
          </tr>
        </thead>
        <tbody>
          {GRUPS_CADENCIA.flatMap(([k, etiqueta]) => grups[k].map((t) => (
            <tr key={t.id}>
              <td>{etiqueta}</td>
              <th scope="row">{t.id}</th>
              <td><Insignia to={TO_ESTAT[t.estat]}>{TEXT_ESTAT[t.estat]}</Insignia></td>
              <td>{quanDe(t)}</td>
              <td>{textLlancador(t.llancador)}</td>
              <td>{t.script ? <Mono>{t.script}</Mono> : '—'}</td>
            </tr>
          )))}
        </tbody>
      </Taula>
      <div className="sdp-consola__capcal">
        <Boto varietat="secundari" onClick={() => setCursor((c) => mouMes(c, -1))} aria-label="Mes anterior">‹</Boto>
        <Boto varietat="secundari" onClick={() => setCursor({ any: avui.getFullYear(), mes: avui.getMonth() })}>Hui</Boto>
        <Boto varietat="secundari" onClick={() => setCursor((c) => mouMes(c, 1))} aria-label="Mes següent">›</Boto>
      </div>
      {alMes.length === 0 && (
        <p>Cap tasca té una cadència que es puga situar en dies: el mes queda buit a posta, no per error.</p>
      )}
      <Taula titol={`Calendari de ${titolMes}`}>
        <caption>{titolMes}</caption>
        <thead>
          <tr>{DIES_CURTS.map((d, i) => <th key={d} scope="col"><abbr title={DIES_LLARGS[i]}>{d}</abbr></th>)}</tr>
        </thead>
        <tbody>
          {setmanes.map((setmana) => (
            <tr key={setmana.find(Boolean)}>
              {setmana.map((dia, i) => (
                <td key={dia ?? `buit-${i}`}>
                  {dia ? <>
                    {esAvui(dia) ? <><strong>{dia}</strong><span className="sdp-nomes-lector"> (hui)</span></> : dia}
                    {alMes.filter((t) => tocaElDia(t, cursor.any, cursor.mes, dia)).map((t) => (
                      <div key={t.id}><Xip tasca={t} /></div>
                    ))}
                  </> : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Taula>
    </>
  );
}
