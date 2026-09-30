import { useMemo } from 'react';
import { Bot, ClipboardList, Siren, Timer, Workflow } from 'lucide-react';
import { EstatBuit } from '../../../components/PedraSeca';
import { Privat, TargetaResum, etiquetaBona, etiquetaPendent } from '../peces.jsx';
import { etiquetaNode } from './grafMapa.js';
import { valorMetrica } from './mapaContent.js';
import { fluxosDelMapa } from './fluxosMapa.js';
import { agentsAtomics, xifresDelMas } from './actorsMapa.js';
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

/** EN MARXA si tot compta, PARCIAL si una part, FALTA si res; sense denominador, SENSE MESURA. */
function estat(fets, total) {
  if (!Number.isInteger(total) || total <= 0) return etiquetaPendent('SENSE MESURA');
  if (fets >= total) return etiquetaBona('EN MARXA');
  return fets > 0 ? etiquetaPendent('PARCIAL') : etiquetaPendent('FALTA');
}

export function AgentsAtomics({ mapa }) {
  const agents = useMemo(() => agentsAtomics(mapa), [mapa]);
  const { cadenes, suggeriments, punts } = useMemo(() => fluxosDelMapa(mapa), [mapa]);
  const xifres = useMemo(() => xifresDelMas(mapa), [mapa]);
  const vigilants = mapa.salut.find((m) => m.metrica === 'vigilants-vius');
  const alts = mapa.avisos.filter((a) => a.severitat === 'alta').length;
  // El tauler és on més peces deixen la faena: l'Escriptori, si el Mapa ho diu.
  const desti = punts.filter((p) => p.escriuen.length)
    .sort((x, y) => y.escriuen.length - x.escriuen.length || x.node.id.localeCompare(y.node.id))[0];

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
          <TargetaResum icona={Workflow} titol="Fluxos de treball"
            descripcio={`${cadenes.length} cadenes declarades · ${suggeriments.length} suggeriments de la prosa`}
            etiquetes={cadenes.length ? etiquetaBona('EN MARXA') : etiquetaPendent('FALTA')} />
          <TargetaResum icona={ClipboardList} titol="Tauler"
            descripcio={desti
              ? <><Privat>{etiquetaNode(desti.node)}</Privat> rep la faena de {desti.escriuen.length} peces · {desti.lligen.length ? `la lligen ${desti.lligen.length}` : 'ningú no declara que la llig'}</>
              : 'Cap peça declara on deixa la faena'}
            etiquetes={!desti ? etiquetaPendent('FALTA') : desti.lligen.length ? etiquetaBona('EN MARXA') : etiquetaPendent('SENSE LECTOR')} />
          <TargetaResum icona={Timer} titol="Agents que treballen sols"
            descripcio={xifres.programades
              ? `${xifres.vives} de ${xifres.programades} tasques que llança launchd són vives`
              : 'Cap tasca programada: res no arranca sol'}
            etiquetes={xifres.programades ? estat(xifres.vives, xifres.programades) : etiquetaPendent('FALTA')} />
          <TargetaResum icona={Siren} titol="Qui avisa quan algo es trenca"
            descripcio={`vigilants vius: ${vigilants ? valorMetrica(vigilants) : 'N/A'} · ${alts} avisos alts al Mapa`}
            etiquetes={vigilants && vigilants.valor !== 'N/A' ? estat(vigilants.numerador, vigilants.denominador) : etiquetaPendent('SENSE MESURA')} />
        </div>
      </section>
    </>
  );
}
