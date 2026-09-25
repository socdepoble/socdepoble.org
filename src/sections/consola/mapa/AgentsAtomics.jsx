import { useMemo } from 'react';
import { Bot, ClipboardList, Siren, Timer, Workflow } from 'lucide-react';
import { EstatBuit } from '../../../components/PedraSeca';
import { Privat, TargetaResum, etiquetaBona, etiquetaPendent } from '../peces.jsx';
import { RUTA_CONSOLA } from '../consolaPagines.js';
import { etiquetaNode } from './grafMapa.js';
import { valorMetrica } from './mapaContent.js';
import { fluxosDelMapa } from './fluxosMapa.js';
import { agentsAtomics, xifresDelMas } from './actorsMapa.js';

/* Agents atòmics (la pestanya «Agentes atómicos» d'Emowe). Un agent atòmic és
   un perfil amb contracte: què llig, què deixa i a qui servix, i per això pot
   treballar sol i un altre el pot revisar. Emowe hi pinta un flux de mostra;
   ací només hi ha el que el Mapa troba, i les quatre peces que ho farien
   possible, mesurades amb les dades d'avui. */

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
          <h2>Agents atòmics al Mas</h2>
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
        <h2>Les quatre peces que ho fan possible</h2>
        <p>
          Tindre skills no és tindre un sistema. El que fa que treballen juntes sense el
          Mestre són estes quatre peces; cada targeta diu com està hui i porta a la pàgina on es veu.
        </p>
        <div className="sdp-card-grid">
          <TargetaResum icona={Workflow} titol="Fluxos de treball" a={`${RUTA_CONSOLA}/fluxos`}
            descripcio={`${cadenes.length} cadenes declarades · ${suggeriments.length} suggeriments de la prosa`}
            etiquetes={cadenes.length ? etiquetaBona('EN MARXA') : etiquetaPendent('FALTA')} />
          <TargetaResum icona={ClipboardList} titol="Tauler" a={`${RUTA_CONSOLA}/entrades`}
            descripcio={desti
              ? <><Privat>{etiquetaNode(desti.node)}</Privat> rep la faena de {desti.escriuen.length} peces · {desti.lligen.length ? `la lligen ${desti.lligen.length}` : 'ningú no declara que la llig'}</>
              : 'Cap peça declara on deixa la faena'}
            etiquetes={!desti ? etiquetaPendent('FALTA') : desti.lligen.length ? etiquetaBona('EN MARXA') : etiquetaPendent('SENSE LECTOR')} />
          <TargetaResum icona={Timer} titol="Agents que treballen sols" a={`${RUTA_CONSOLA}/calendari`}
            descripcio={xifres.programades
              ? `${xifres.vives} de ${xifres.programades} tasques que llança launchd són vives`
              : 'Cap tasca programada: res no arranca sol'}
            etiquetes={xifres.programades ? estat(xifres.vives, xifres.programades) : etiquetaPendent('FALTA')} />
          <TargetaResum icona={Siren} titol="Qui avisa quan algo es trenca" a={`${RUTA_CONSOLA}/salut`}
            descripcio={`vigilants vius: ${vigilants ? valorMetrica(vigilants) : 'N/A'} · ${alts} avisos alts al Mapa`}
            etiquetes={vigilants && vigilants.valor !== 'N/A' ? estat(vigilants.numerador, vigilants.denominador) : etiquetaPendent('SENSE MESURA')} />
        </div>
      </section>
    </>
  );
}
