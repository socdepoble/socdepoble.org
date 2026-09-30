import { useMemo, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Boto, Camp, CampText, Interruptor, PillToggle } from '../../../components/PedraSeca';
import BrainGraph from '../../../components/universal/graph/BrainGraph';
import { TIPUS_NODE, CONFIANCES } from './contracteMapa.js';
import { DetallPeca } from './DetallPeca.jsx';
import {
  ESTIL_MAPA, FORCES, NOMS_CONFIANCA, NOMS_TIPUS, TEXTOS_EXPLORADOR,
  filtresInicials, grafDelMapa
} from './grafMapa.js';

/* L'Explorador del cervell: el graf d'Obsidian aplicat als agents del Mas.
   T3 (ordre del Mestre, 260930) · el graf va al final de la pàgina: damunt
   del canvas la rodeta fa zoom, i al començament era una trampa que no
   deixava baixar. Primer la llegenda, la cerca i els filtres (tres
   plegables tancats, com al panell de filtres d'Obsidian); al final, el graf
   i el detall de la peça triada (DetallPeca.jsx, T4). Tot es construïx amb
   peces del catàleg Pedra Seca. */

const OPCIONS_FORCES = Object.freeze([
  { valor: 'compacte', text: 'Compacte' },
  { valor: 'normal', text: 'Normal' },
  { valor: 'espaiat', text: 'Espaiat' }
]);
const DENSITAT_INICIAL = 'normal';

const plural = (n, un, molts) => `${n} ${n === 1 ? un : molts}`;
const encesos = (grup) => Object.values(grup).filter(Boolean).length;

/** Quants filtres dels plegables s'aparten de l'inici (la cerca ja es veu a la barra). */
function comptaCanvis(filtres, densitat) {
  const inici = filtresInicials();
  const diferents = (grup) => Object.keys(inici[grup]).filter((clau) => filtres[grup][clau] !== inici[grup][clau]).length;
  return diferents('tipus') + diferents('confiances')
    + Number(filtres.orfes !== inici.orfes) + Number(filtres.fletxes !== inici.fletxes)
    + Number(densitat !== DENSITAT_INICIAL);
}

/** Capçalera d'un plegable: el nom del grup i, a la dreta, el seu estat sense obrir-lo. */
function Resum({ titol, estat }) {
  return (
    <summary>
      <span>{titol}</span>
      <span className="sdp-explorador__resum">{estat}</span>
    </summary>
  );
}

export function ExploradorMapa({ mapa }) {
  const barraCerca = useRef(null);
  const panellFiltres = useRef(null);
  const [filtres, setFiltres] = useState(filtresInicials);
  const [densitat, setDensitat] = useState(DENSITAT_INICIAL);
  /* T4 · la peça triada és de l'Explorador: el graf la marca (mode
     controlat de BrainGraph) i el detall la pinta. '' = cap. */
  const [seleccio, setSeleccio] = useState('');
  const graf = useMemo(() => grafDelMapa(mapa, filtres), [mapa, filtres]);
  const commuta = (grup, clau) => setFiltres((f) => ({ ...f, [grup]: { ...f[grup], [clau]: !f[grup][clau] } }));
  const posa = (clau, valor) => setFiltres((f) => ({ ...f, [clau]: valor }));
  /* Els «Restablir filtres» desapareixen quan tot torna a l'inici: el focus
     no es pot quedar en un botó que ja no hi és (aniria al body). Passa a la
     cerca (des de l'avís del graf), al primer plegable (des del panell) o al
     selector del detall (des de la seua alerta). */
  const restableix = (seguent) => {
    setFiltres(filtresInicials());
    setDensitat(DENSITAT_INICIAL);
    seguent?.focus();
  };
  const perTipus = useMemo(() => {
    const m = new Map();
    for (const n of mapa.nodes) m.set(n.tipus, (m.get(n.tipus) || 0) + 1);
    return m;
  }, [mapa]);
  const canvis = comptaCanvis(filtres, densitat);
  const nomDensitat = OPCIONS_FORCES.find((o) => o.valor === densitat)?.text;

  return (
    <section className="sdp-explorador">
      <p className="sdp-explorador__llegenda">
        Cada punt és una peça del Mas i cada línia, una relació del contracte
        (crida, llig, escriu, dispara, encamina, carrega o governa). Una línia
        discontínua ix de la prosa i no val igual que una declarada. El graf és
        al final de la pàgina: fes clic en un punt i el detall et dirà què és,
        on viu, amb qui es relaciona i com obrir-la. Damunt del graf, la rodeta
        i la pinça apropen i allunyen i arrossegar el mou; fora d’ell, la pàgina
        es desplaça com sempre.
      </p>
      <div className="sdp-explorador__barra" role="search" ref={barraCerca}>
        <Camp etiqueta="Filtra per nom" ajuda="Mostra les peces que hi casen i els seus veïns directes."
          className="sdp-explorador__cerca">
          <CampText tipus="search" value={filtres.cerca} onChange={(e) => posa('cerca', e.target.value)} />
        </Camp>
        <p className="sdp-explorador__recompte" role="status">
          {plural(graf.nodes.length, 'peça', 'peces')} · {plural(graf.links.length, 'relació', 'relacions')}
        </p>
      </div>
      <div className="sdp-explorador__filtres" ref={panellFiltres} role="group" aria-label="Filtres del graf">
        <details className="sdp-explorador__grup">
          <Resum titol="Tipus de peça" estat={`${encesos(filtres.tipus)} de ${TIPUS_NODE.length}`} />
          <div className="sdp-explorador__opcions">
            {TIPUS_NODE.map((t) => (
              <Interruptor key={t}
                etiqueta={<><span className="sdp-explorador__punt" data-tipus={t} aria-hidden="true" />{`${NOMS_TIPUS[t]} (${perTipus.get(t) || 0})`}</>}
                actiu={filtres.tipus[t]} onCanvi={() => commuta('tipus', t)} />
            ))}
            <Interruptor etiqueta="Òrfens: peces sense cap relació" actiu={filtres.orfes}
              onCanvi={(v) => posa('orfes', v)} />
          </div>
        </details>
        <details className="sdp-explorador__grup">
          <Resum titol="Confiança de les relacions" estat={`${encesos(filtres.confiances)} de ${CONFIANCES.length}`} />
          <div className="sdp-explorador__opcions">
            {CONFIANCES.map((c) => (
              <Interruptor key={c} etiqueta={NOMS_CONFIANCA[c]} actiu={filtres.confiances[c]}
                onCanvi={() => commuta('confiances', c)} />
            ))}
          </div>
        </details>
        <details className="sdp-explorador__grup">
          <Resum titol="Visualització i forces" estat={`${filtres.fletxes ? 'Amb fletxes' : 'Sense fletxes'} · ${nomDensitat}`} />
          <div className="sdp-explorador__opcions">
            <Interruptor etiqueta="Fletxes: sentit de cada relació" actiu={filtres.fletxes}
              onCanvi={(v) => posa('fletxes', v)} />
            <PillToggle etiqueta="Densitat del graf" opcions={OPCIONS_FORCES} valor={densitat} onCanvi={setDensitat} />
          </div>
        </details>
        {(canvis > 0 || filtres.cerca) && (
          <Boto varietat="fantasma" icona={RotateCcw}
            onClick={() => restableix(panellFiltres.current?.querySelector('summary'))}>Restablir filtres</Boto>
        )}
      </div>
      <div className="sdp-explorador__marc">
        <div className="sdp-wiki-graf sdp-explorador__graf">
          <BrainGraph graf={graf} estil={ESTIL_MAPA} forces={FORCES[densitat]} fletxes={filtres.fletxes} enquadra
            textos={TEXTOS_EXPLORADOR} inspector={false} seleccio={seleccio} onSeleccio={setSeleccio} />
          {graf.nodes.length === 0 && (
            <div className="sdp-explorador__buit" role="status">
              <p>{filtres.cerca.trim()
                ? `Cap peça casa amb «${filtres.cerca.trim()}» amb estos filtres.`
                : 'Cap peça passa estos filtres.'}</p>
              <Boto varietat="secundari" icona={RotateCcw}
                onClick={() => restableix(barraCerca.current?.querySelector('input'))}>Restablir filtres</Boto>
            </div>
          )}
        </div>
        <DetallPeca mapa={mapa} graf={graf} seleccio={seleccio} onSeleccio={setSeleccio} onRestablir={restableix} />
      </div>
    </section>
  );
}
