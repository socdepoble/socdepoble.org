import { useMemo } from 'react';
import { CalendariEsdeveniments, EstatBuit, Insignia, Taula } from '../../../components/PedraSeca';
import { Mono } from '../peces.jsx';
import { GraellaXifres } from '../XifresMas.jsx';
import { xifresDeVista } from '../xifresMas.js';
import { textLlancador } from './mapaContent.js';
import { AL_MES, GRUPS_CADENCIA, classificaTasca, quanDe, resumCalendari, tascaAEsdeveniment } from './calendariMapa.js';

/* Calendari de processos (02_calendari.md): què corre sol, quan, qui ho
   llança i si continua viu. És el calendari d'Emowe en valencià: les caixes
   per cadència damunt del mes, el detall de cada tasca en una taula i,
   davall, el mes.
   Ordre del Mestre, 261004 (xat: cap xifra solta) · Cada caixa de cadència
   és una targeta sencera amb la boina de Sóc de Poble i pàgina pròpia
   (/consola/xifres/cadencia-<grup>). Derogat per l'ordre del Mestre del
   261004 (xat: cap xifra solta): les caixes com a targetes compactes del
   Panell de Control (TargetaResum).
   Correcció 261004 (verificador de la segona passada) · Davant de les
   caixes, «Coses que corren soles», la xifra del tauler que es tracta ací;
   també quan el Mapa no porta cap tasca (la vista «calendari»). */

const TO_ESTAT = Object.freeze({
  viu: 'exit', mort: 'error', 'declarat-sense-llancador': 'neutre',
  'llancador-sense-declaracio': 'avis', desconegut: 'neutre'
});
const TEXT_ESTAT = Object.freeze({
  viu: 'viu', mort: 'mort', 'declarat-sense-llancador': 'sense llançador',
  'llancador-sense-declaracio': 'sense declaració', desconegut: 'desconegut'
});

/* T7 (ordre del Mestre, 260930) · la píndola de la variant gran: amplària
   uniforme i vora fina. L'estat continua dit amb text. */
function Xip({ tasca }) {
  return <Insignia to={TO_ESTAT[tasca.estat]} className="sdp-calendari__pindola">{tasca.id} · {TEXT_ESTAT[tasca.estat]}</Insignia>;
}

export function CalendariMapa({ mapa, locale }) {
  const avui = new Date();
  const grups = useMemo(() => resumCalendari(mapa.tasques), [mapa]);
  const caixes = useMemo(() => xifresDeVista('calendari', mapa), [mapa]);
  const alMes = useMemo(() => mapa.tasques.filter((t) => AL_MES.has(classificaTasca(t))), [mapa]);
  /* T8 (ordre del Mestre, 260930) · Cada tasca que es pot situar en dies, com
     a esdeveniment (tascaAEsdeveniment, equivalent a tocaElDia dia a dia); el
     Xip recupera la tasca del seu esdeveniment. */
  const tascaDe = useMemo(() => new Map(alMes.map((t) => [tascaAEsdeveniment(t), t]).filter(([esd]) => esd)), [alMes]);
  const esdeveniments = useMemo(() => [...tascaDe.keys()], [tascaDe]);

  if (!mapa.tasques.length) {
    return (
      <>
        <GraellaXifres xifres={caixes} generat={mapa.generat ?? null} />
        <EstatBuit titol="Cap tasca al Mapa">
          El Mapa no porta cap tasca: ni el registre <Mono>.agents/cron/registre_tasques.json</Mono> ni
          cap llançador de launchd n'han declarat. Tot el que fan els agents comença quan algú ho demana.
        </EstatBuit>
      </>
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
      <GraellaXifres xifres={caixes} generat={mapa.generat ?? null} />
      {/* T7 (ordre del Mestre, 260930) · les vores fines del calendari també a
          la taula de la pàgina: la capçalera i el contorn de les insígnies. */}
      <Taula titol="Tasques per cadència" densa className="sdp-calendari__taula">
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
          Pedra Seca. T6-T8 (260930) · Ara és CalendariEsdeveniments, el
          mateix organisme de l'Agenda del Mur: el DOM de T40 amb la variant
          gran de T7 (CalendariMapa.test.jsx ho fixa). Les tasques no ixen
          mai de la Consola. */}
      <CalendariEsdeveniments esdeveniments={esdeveniments} avui={avui} locale={locale}
        navegacioClassName="sdp-consola__capcal"
        renderEsdeveniment={(esd) => <div><Xip tasca={tascaDe.get(esd)} /></div>}>
        {alMes.length === 0 && (
          <p>Cap tasca té una cadència que es puga situar en dies: el mes queda buit a posta, no per error.</p>
        )}
      </CalendariEsdeveniments>
    </>
  );
}
