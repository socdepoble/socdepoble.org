import { useMemo } from 'react';
import { Bot } from 'lucide-react';
import { EstatBuit } from '../../../components/PedraSeca';
import { Link } from '../../../app/contexts/RouterContext';
import { concorda } from '../concordanca.js';
import { GraellaXifres } from '../XifresMas.jsx';
import { rutaXifra, xifresDeFamilia, xifresDeGrup } from '../xifresMas.js';
import { xifresDelMas } from './actorsMapa.js';
import { paginaConsola } from '../consolaPagines.js';

/* Agents atòmics (la pestanya «Agentes atómicos» d'Emowe). Un agent atòmic és
   un perfil amb contracte: què llig, què deixa i a qui servix, i per això pot
   treballar sol i un altre el pot revisar. Emowe hi pinta un flux de mostra;
   ací només hi ha el que el Mapa troba, i les quatre peces que ho farien
   possible, mesurades amb les dades d'avui.
   Ordre del Mestre, 261004 (xat: cap xifra solta) · Cada agent atòmic i
   cada peça és una targeta sencera amb la boina de Sóc de Poble i pàgina
   pròpia (XifresMas.jsx, /consola/xifres/<slug>). Derogat per l'ordre del
   Mestre del 261004 (xat: cap xifra solta): les peces com a targetes del
   Panell de Control que no portaven enlloc (T11 del 260930, «les peces són
   dades, no portes»).
   Correcció 261004 (verificador de la segona passada, punts 2 i 3) · La
   frase que compta els agents del Mapa enllaça amb la seua targeta
   («agents», a Actors) i concorda: amb un sol agent no diu «Els 1 agents». */

/* Quants agents troba el Mapa, dit amb la seua concordança: el recompte és la
   xifra «agents» i enllaça amb la seua targeta. */
function AgentsQueConversen({ n }) {
  return (
    <>
      <Link to={rutaXifra('agents')}>{n === 1 ? 'L’únic agent' : `Els ${n} agents`}</Link>
      {` que troba el Mapa ${concorda(n, 'és un arnés que conversa', 'són arnesos que conversen')} amb el Mestre (pàgina Actors): `}
      {`${concorda(n, 'no declara', 'cap no declara')} què llig ni què deixa, així que tot el que ${concorda(n, 'fa', 'fan')} passa per la conversa.`}
    </>
  );
}

/* Pàgina de la Consola on viu el detall de fons de cada peça, en l'ordre de les targetes. */
const PAGINES_PECES = Object.freeze(['fluxos', 'entrades', 'calendari', 'salut']);
function paginesDeLesPeces() {
  const titols = PAGINES_PECES.map((id) => `«${paginaConsola(id).title}»`);
  return `${titols.slice(0, -1).join(', ')} i ${titols.at(-1)}`;
}

/* Correcció 261004 (verificador de la tercera passada, punt 5) · La coberta
   d'esta pàgina destacava «N agents atòmics» sense targeta: el recompte és
   ara la targeta «agents-atomics», davant dels agents (o de l'estat buit). */
export function AgentsAtomics({ mapa }) {
  const recompte = useMemo(() => xifresDeGrup('agents-atomics', mapa), [mapa]);
  const agents = useMemo(() => xifresDeFamilia('agent-atomic', mapa), [mapa]);
  const peces = useMemo(() => xifresDeGrup('agents', mapa), [mapa]);
  const xifres = useMemo(() => xifresDelMas(mapa), [mapa]);

  return (
    <>
      <p>
        Un agent atòmic és un perfil amb contracte: diu què llig, què deixa i a qui servix.
        Així pot arrancar sense el Mestre davant, fer una cosa i acabar, i un altre pot
        revisar el que ha deixat. Ací no hi ha cap flux de mostra: només el que el Mapa troba.
      </p>
      {agents.length ? (
        <section>
          <h3>Agents atòmics al Mas</h3>
          <GraellaXifres xifres={[...recompte, ...agents]} generat={mapa.generat} />
        </section>
      ) : <>
        <GraellaXifres xifres={recompte} generat={mapa.generat} />
        <EstatBuit icona={Bot} titol="Agents atòmics al Mas: cap">
          {xifres.agents ? <AgentsQueConversen n={xifres.agents} /> : 'El Mapa no troba cap agent.'}
          {' '}El compilador tampoc no llig encara cap perfil d’agent amb contracte.
        </EstatBuit>
      </>}

      <section>
        <h3>Les quatre peces que ho fan possible</h3>
        <p>
          Tindre skills no és tindre un sistema. El que fa que treballen juntes sense el
          Mestre són estes quatre peces; cada targeta diu com està hui i porta a la seua
          pàgina, i el detall de fons és, per este ordre, a les pàgines {paginesDeLesPeces()} de la Consola.
        </p>
        <GraellaXifres xifres={peces} generat={mapa.generat} />
      </section>
    </>
  );
}
