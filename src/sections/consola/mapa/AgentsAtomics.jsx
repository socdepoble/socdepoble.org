import { useMemo } from 'react';
import { Bot, ClipboardList, Siren, Timer, Workflow } from 'lucide-react';
import { EstatBuit } from '../../../components/PedraSeca';
import { Privat, TargetaResum, etiquetaBona, etiquetaPendent } from '../peces.jsx';
import { etiquetaNode } from './grafMapa.js';
import { valorMetrica } from './mapaContent.js';
import { TITOLS_PECES_AGENTS, agentsAtomics, pecesAgents, xifresDelMas } from './actorsMapa.js';
import { paginaConsola } from '../consolaPagines.js';

/* Agents atòmics (la pestanya «Agentes atómicos» d'Emowe). Un agent atòmic és
   un perfil amb contracte: què llig, què deixa i a qui servix, i per això pot
   treballar sol i un altre el pot revisar. Emowe hi pinta un flux de mostra;
   ací només hi ha el que el Mapa troba, i les quatre peces que ho farien
   possible, mesurades amb les dades d'avui. */

/* Pàgina de la Consola on viu el detall de cada peça, en l'ordre de les targetes. */
const PAGINES_PECES = Object.freeze(['fluxos', 'entrades', 'calendari', 'salut']);
function paginesDeLesPeces() {
  const titols = PAGINES_PECES.map((id) => `«${paginaConsola(id).title}»`);
  return `${titols.slice(0, -1).join(', ')} i ${titols.at(-1)}`;
}

/* L'estat de cada peça (pecesAgents, actorsMapa.js) amb les classes del
   Panell de Control: el que funciona, bo; la resta, pendent. */
const etiquetaDe = (estat) => (estat === 'EN MARXA' ? etiquetaBona(estat) : etiquetaPendent(estat));

export function AgentsAtomics({ mapa }) {
  const agents = useMemo(() => agentsAtomics(mapa), [mapa]);
  const xifres = useMemo(() => xifresDelMas(mapa), [mapa]);
  const { fluxos, tauler, sols, vigilants } = useMemo(() => pecesAgents(mapa), [mapa]);
  const alts = mapa.avisos.filter((a) => a.severitat === 'alta').length;
  // El tauler és on més peces deixen la faena: l'Escriptori, si el Mapa ho diu.
  const { desti } = tauler;

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
          <div className="sdp-card-grid">
            {agents.map((a) => (
              <TargetaResum key={a.node.id} icona={Bot} titol={a.node.atributs?.arnes ?? etiquetaNode(a.node)}
                descripcio={`llig ${a.llig.length} · deixa ${a.escriu.length}`} />
            ))}
          </div>
        </section>
      ) : (
        <EstatBuit icona={Bot} titol="Agents atòmics al Mas: cap">
          {xifres.agents
            ? `Els ${xifres.agents} agents que troba el Mapa són arnesos que conversen amb el Mestre (pàgina Actors): cap no declara què llig ni què deixa, així que tot el que fan passa per la conversa.`
            : 'El Mapa no troba cap agent.'}
          {' '}El compilador tampoc no llig encara cap perfil d’agent amb contracte.
        </EstatBuit>
      )}

      <section>
        <h3>Les quatre peces que ho fan possible</h3>
        {/* T11 (ordre del Mestre, 260930): les peces són dades, no portes. A cada
            pàgina s'entra per la seua targeta del tauler i se'n torna per la molla;
            el text nomena les pàgines, en l'ordre de les targetes, amb el títol del catàleg. */}
        <p>
          Tindre skills no és tindre un sistema. El que fa que treballen juntes sense el
          Mestre són estes quatre peces; cada targeta diu com està hui, i el detall és, per
          este ordre, a les pàgines {paginesDeLesPeces()} de la Consola.
        </p>
        <div className="sdp-card-grid">
          <TargetaResum icona={Workflow} titol={TITOLS_PECES_AGENTS.fluxos}
            descripcio={`${fluxos.cadenes} cadenes declarades · ${fluxos.suggeriments} suggeriments de la prosa`}
            etiquetes={etiquetaDe(fluxos.estat)} />
          <TargetaResum icona={ClipboardList} titol={TITOLS_PECES_AGENTS.tauler}
            descripcio={desti
              ? <><Privat>{etiquetaNode(desti.node)}</Privat> rep la faena de {desti.escriuen.length} peces · {desti.lligen.length ? `la lligen ${desti.lligen.length}` : 'ningú no declara que la llig'}</>
              : 'Cap peça declara on deixa la faena'}
            etiquetes={etiquetaDe(tauler.estat)} />
          <TargetaResum icona={Timer} titol={TITOLS_PECES_AGENTS.sols}
            descripcio={sols.programades
              ? `${sols.vives} de ${sols.programades} tasques que llança launchd són vives`
              : 'Cap tasca programada: res no arranca sol'}
            etiquetes={etiquetaDe(sols.estat)} />
          <TargetaResum icona={Siren} titol={TITOLS_PECES_AGENTS.vigilants}
            descripcio={`vigilants vius: ${vigilants.metrica ? valorMetrica(vigilants.metrica) : 'N/A'} · ${alts} avisos alts al Mapa`}
            etiquetes={etiquetaDe(vigilants.estat)} />
        </div>
      </section>
    </>
  );
}
