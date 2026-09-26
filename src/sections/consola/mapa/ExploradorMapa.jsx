import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Boto, Camp, CampText, Insignia, Interruptor, PillToggle } from '../../../components/PedraSeca';
import BrainGraph from '../../../components/universal/graph/BrainGraph';
import { Mono } from '../peces.jsx';
import { TIPUS_NODE, CONFIANCES } from './contracteMapa.js';
import {
  ESTIL_MAPA, FORCES, NOMS_CONFIANCA, NOMS_TIPUS, TEXTOS_EXPLORADOR,
  etiquetaNode, filtresInicials, grafDelMapa, mostraGraf, relacionsDe
} from './grafMapa.js';

/* L'Explorador del cervell: el graf d'Obsidian aplicat als agents del Mas.
   El graf és el primer que es veu: ocupa la primera pantalla, amb la cerca
   en una barra damunt. Tipus, òrfens, confiança, fletxes i forces es trien
   davall, en tres plegables tancats, com al panell de filtres d'Obsidian;
   tot es construïx amb peces del catàleg Pedra Seca. */

const OPCIONS_FORCES = Object.freeze([
  { valor: 'compacte', text: 'Compacte' },
  { valor: 'normal', text: 'Normal' },
  { valor: 'espaiat', text: 'Espaiat' }
]);
const DENSITAT_INICIAL = 'normal';
const TO_SEVERITAT = Object.freeze({ alta: 'error', mitjana: 'avis', baixa: 'info' });

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
  const idFiltres = useId();
  const marc = useRef(null);
  const barraCerca = useRef(null);
  const panellFiltres = useRef(null);
  /* useEffect i no useLayoutEffect: ha d'anar darrere del tornaAlCim de
     ConsolaSection, que torna el scroll a dalt en canviar de pàgina. */
  useEffect(() => { mostraGraf(marc.current); }, []);
  const [filtres, setFiltres] = useState(filtresInicials);
  const [densitat, setDensitat] = useState(DENSITAT_INICIAL);
  const graf = useMemo(() => grafDelMapa(mapa, filtres), [mapa, filtres]);
  const commuta = (grup, clau) => setFiltres((f) => ({ ...f, [grup]: { ...f[grup], [clau]: !f[grup][clau] } }));
  const posa = (clau, valor) => setFiltres((f) => ({ ...f, [clau]: valor }));
  /* Els dos «Restablir filtres» desapareixen quan tot torna a l'inici: el
     focus no es pot quedar en un botó que ja no hi és (aniria al body). Passa
     a la cerca (des de l'avís del graf) o al primer plegable (des del panell). */
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

  /* Els filtres viuen davall del graf: el botó de la barra hi baixa, obri el
     primer plegable i hi deixa el focus. */
  const obreFiltres = () => {
    const panell = panellFiltres.current;
    const primer = panell?.querySelector('details');
    if (!primer) return;
    primer.open = true;
    panell.scrollIntoView?.({ block: 'start' });
    primer.querySelector('summary')?.focus({ preventScroll: true });
  };

  return (
    <section className="sdp-explorador">
      <div className="sdp-explorador__marc" ref={marc}>
        <div className="sdp-explorador__barra" role="search" ref={barraCerca}>
          <Camp etiqueta="Filtra per nom" ajuda="Mostra les peces que hi casen i els seus veïns directes."
            className="sdp-explorador__cerca">
            <CampText tipus="search" value={filtres.cerca} onChange={(e) => posa('cerca', e.target.value)} />
          </Camp>
          <p className="sdp-explorador__recompte" role="status">
            {plural(graf.nodes.length, 'peça', 'peces')} · {plural(graf.links.length, 'relació', 'relacions')}
          </p>
          <Boto varietat="secundari" icona={SlidersHorizontal} onClick={obreFiltres} aria-controls={idFiltres}>
            {canvis ? `Filtres (${canvis})` : 'Filtres'}
          </Boto>
        </div>
        <div className="sdp-wiki-graf sdp-explorador__graf">
          <BrainGraph graf={graf} estil={ESTIL_MAPA} forces={FORCES[densitat]} fletxes={filtres.fletxes} enquadra
            textos={TEXTOS_EXPLORADOR} renderDetall={(node) => <Detall mapa={mapa} node={node} />} />
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
      </div>
      <p className="sdp-explorador__llegenda">
        Cada punt és una peça del Mas i cada línia, una relació del contracte
        (crida, llig, escriu, dispara, encamina, carrega o governa). Una línia
        discontínua ix de la prosa i no val igual que una declarada. Fes clic
        en un punt per vore què llig, què escriu, qui el crida i a qui crida.
        La rodeta i la pinça apropen i allunyen; arrossega per a moure el graf.
      </p>
      <div className="sdp-explorador__filtres" id={idFiltres} ref={panellFiltres} role="group" aria-label="Filtres del graf">
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
    </section>
  );
}
