import { useMemo, useState } from 'react';
import { Camp, CampText, Insignia, Interruptor, PillToggle } from '../../../components/PedraSeca';
import BrainGraph from '../../../components/universal/graph/BrainGraph';
import { Mono } from '../peces.jsx';
import { TIPUS_NODE, CONFIANCES } from './contracteMapa.js';
import {
  ESTIL_MAPA, FORCES, NOMS_CONFIANCA, NOMS_TIPUS, TEXTOS_EXPLORADOR,
  etiquetaNode, filtresInicials, grafDelMapa, relacionsDe
} from './grafMapa.js';

/* L'Explorador del cervell: el graf d'Obsidian aplicat als agents del Mas.
   Tipus, òrfens, confiança, fletxes i forces es trien com al panell de
   filtres d'Obsidian; tot es construïx amb peces del catàleg Pedra Seca. */

const OPCIONS_FORCES = Object.freeze([
  { valor: 'compacte', text: 'Compacte' },
  { valor: 'normal', text: 'Normal' },
  { valor: 'espaiat', text: 'Espaiat' }
]);
const TO_SEVERITAT = Object.freeze({ alta: 'error', mitjana: 'avis', baixa: 'info' });

function Relacions({ arestes, cap }) {
  if (!arestes.length) return '—';
  return arestes.map((a) => `${etiquetaNode({ id: a[cap] })} (${a.tipus}, ${a.confianca})`).join(' · ');
}

function Detall({ mapa, node }) {
  const r = relacionsDe(mapa, node.id);
  return (
    <dl>
      <dt>Tipus</dt><dd>{NOMS_TIPUS[node.type] ?? node.type}</dd>
      <dt>Font</dt><dd>{node.font ? <Mono>{node.font}</Mono> : '—'}</dd>
      <dt>Llig</dt><dd><Relacions arestes={r.llig} cap="a" /></dd>
      <dt>Escriu</dt><dd><Relacions arestes={r.escriu} cap="a" /></dd>
      <dt>Crida o governa</dt><dd><Relacions arestes={r.crida} cap="a" /></dd>
      <dt>El criden</dt><dd><Relacions arestes={r.elCriden} cap="de" /></dd>
      {node.type === 'skill' && r.opaca && <><dt>Entrades i eixides</dt><dd>caixa opaca: no declara què llig ni què produïx</dd></>}
      <dt>Avisos</dt>
      <dd>{r.avisos.length ? r.avisos.map((a) => (
        <Insignia key={a.codi} to={TO_SEVERITAT[a.severitat]}>{a.codi}</Insignia>
      )) : 'cap'}</dd>
    </dl>
  );
}

export function ExploradorMapa({ mapa }) {
  const [filtres, setFiltres] = useState(filtresInicials);
  const [densitat, setDensitat] = useState('normal');
  const graf = useMemo(() => grafDelMapa(mapa, filtres), [mapa, filtres]);
  const commuta = (grup, clau) => setFiltres((f) => ({ ...f, [grup]: { ...f[grup], [clau]: !f[grup][clau] } }));
  const posa = (clau, valor) => setFiltres((f) => ({ ...f, [clau]: valor }));
  const perTipus = useMemo(() => {
    const m = new Map();
    for (const n of mapa.nodes) m.set(n.tipus, (m.get(n.tipus) || 0) + 1);
    return m;
  }, [mapa]);

  return (
    <>
      <p>
        Cada punt és una peça del Mas i cada línia, una relació del contracte
        (crida, llig, escriu, dispara, encamina, carrega o governa). Una línia
        discontínua ix de la prosa i no val igual que una declarada. Fes clic
        en un punt per vore què llig, què escriu, qui el crida i a qui crida.
      </p>
      <Camp etiqueta="Filtra per nom" ajuda="Mostra les peces que hi casen i els seus veïns directes.">
        <CampText tipus="search" value={filtres.cerca} onChange={(e) => posa('cerca', e.target.value)} />
      </Camp>
      <details open>
        <summary>Filtres: tipus de peça</summary>
        <div className="sdp-consola__llista">
          {TIPUS_NODE.map((t) => (
            <Interruptor key={t} etiqueta={`${NOMS_TIPUS[t]} (${perTipus.get(t) || 0})`}
              actiu={filtres.tipus[t]} onCanvi={() => commuta('tipus', t)} />
          ))}
          <Interruptor etiqueta="Òrfens: peces sense cap relació" actiu={filtres.orfes}
            onCanvi={(v) => posa('orfes', v)} />
        </div>
      </details>
      <details>
        <summary>Filtres: confiança de les relacions</summary>
        <div className="sdp-consola__llista">
          {CONFIANCES.map((c) => (
            <Interruptor key={c} etiqueta={NOMS_CONFIANCA[c]} actiu={filtres.confiances[c]}
              onCanvi={() => commuta('confiances', c)} />
          ))}
        </div>
      </details>
      <details>
        <summary>Visualització i forces</summary>
        <div className="sdp-consola__llista">
          <Interruptor etiqueta="Fletxes: sentit de cada relació" actiu={filtres.fletxes}
            onCanvi={(v) => posa('fletxes', v)} />
          <PillToggle etiqueta="Densitat del graf" opcions={OPCIONS_FORCES} valor={densitat} onCanvi={setDensitat} />
        </div>
      </details>
      <div className="sdp-wiki-graf">
        <BrainGraph graf={graf} estil={ESTIL_MAPA} forces={FORCES[densitat]} fletxes={filtres.fletxes}
          textos={TEXTOS_EXPLORADOR} renderDetall={(node) => <Detall mapa={mapa} node={node} />} />
      </div>
    </>
  );
}
