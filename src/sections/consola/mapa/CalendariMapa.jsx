import { useMemo, useState } from 'react';
import {
  CalendarDays, CalendarRange, CircleHelp, Infinity as IconaSempre, Power, Shuffle, Sun, Zap
} from 'lucide-react';
import { EstatBuit, GraellaMes, Insignia, NavegacioMes, Taula } from '../../../components/PedraSeca';
import { Mono, TargetaResum } from '../peces.jsx';
import { textLlancador } from './mapaContent.js';
import { GRUPS_CADENCIA, classificaTasca, quanDe, resumCalendari, tocaElDia } from './calendariMapa.js';
import { cursorDe } from '../../../utils/calendari.js';

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
  const [cursor, setCursor] = useState(() => cursorDe(avui));
  const grups = useMemo(() => resumCalendari(mapa.tasques), [mapa]);
  const alMes = mapa.tasques.filter((t) => AL_MES.has(classificaTasca(t)));

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
      {/* T40 (ordre del Mestre, 260928) · El mes és la peça compartida de
          Pedra Seca (CalendariMes): el mateix DOM d'abans, i el mateix que
          pinta en xicotet el selector de data de publicació de l'editor. */}
      <NavegacioMes className="sdp-consola__capcal" cursor={cursor} onCanvia={setCursor} avui={avui} />
      {alMes.length === 0 && (
        <p>Cap tasca té una cadència que es puga situar en dies: el mes queda buit a posta, no per error.</p>
      )}
      <GraellaMes any={cursor.any} mes={cursor.mes} locale={locale} avui={avui}
        renderDia={(dia, { numero }) => (
          <>
            {numero}
            {alMes.filter((t) => tocaElDia(t, cursor.any, cursor.mes, dia)).map((t) => (
              <div key={t.id}><Xip tasca={t} /></div>
            ))}
          </>
        )} />
    </>
  );
}
