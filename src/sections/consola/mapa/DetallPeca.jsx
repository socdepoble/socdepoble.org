import { useContext, useEffect, useMemo, useRef } from 'react';
import { BookOpen, Copy, FileCode, RotateCcw } from 'lucide-react';
import { Alerta, Boto, Camp, Insignia, Selector } from '../../../components/PedraSeca';
import { useNavigate } from '../../../app/contexts/RouterContext';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { wikiManifest } from '../../../data/wikiManifest';
import { Mono, PrivacitatConsola } from '../peces.jsx';
import {
  NOMS_TIPUS, TEXTOS_AVIS, TO_CONFIANCA, TO_SEVERITAT,
  dadesDelNode, documentWiki, etiquetaNode, fitxerAbsent, fitxerDelNode,
  notaEixides, opcionsPeces, queEs, relacionsPerVerb, rutaEditable
} from './grafMapa.js';

/* T4 (ordre del Mestre, 260930) · el detall d'una peça de l'Explorador.
   Substituïx l'inspector superposat de BrainGraph, que la Wiki conserva
   tal qual: viu a la dreta del graf en pantalla ampla i davall en estreta,
   i es construïx amb peces del catàleg Pedra Seca. Diu què és la peça, on
   viu, amb qui es relaciona i com obrir-la, sense prometre el que no pot
   complir: «Obrir a l’editor» demana a l'editor que l'obriga, no ho
   confirma (l'obridor de Vite respon sempre buit). La lògica és pura, a
   grafMapa.js; ací només es pinta. */

/* A partir d'ací, les relacions es pleguen: la resta ix amb «Mostra'n N més». */
const MAX_FILES = 8;

function FilaRelacio({ fila, onVore }) {
  const nom = etiquetaNode({ id: fila.id });
  return (
    <li className="sdp-explorador__relacio">
      <p className="sdp-explorador__relacio-text">
        <span className="sdp-explorador__suau">{fila.verb}</span>{' '}
        <strong>{nom}</strong>{' '}
        <span className="sdp-explorador__suau">· {NOMS_TIPUS[fila.tipusPeca] ?? fila.tipusPeca}</span>
      </p>
      <p className="sdp-explorador__relacio-meta">
        <Insignia to={TO_CONFIANCA[fila.confianca] ?? 'neutre'}>{fila.confianca}</Insignia>
        {fila.evidencia && <Mono>{fila.evidencia}</Mono>}
      </p>
      <Boto varietat="fantasma" onClick={() => onVore(fila.id)}>
        {'Vore la peça '}<span className="sdp-nomes-lector">{nom}</span>
      </Boto>
    </li>
  );
}

function Relacions({ files, buit, onVore }) {
  if (!files.length) return buit ? <p className="sdp-explorador__suau">{buit}</p> : null;
  const fila = (f) => <FilaRelacio key={`${f.tipus}|${f.id}|${f.confianca}`} fila={f} onVore={onVore} />;
  return (
    <>
      <ul className="sdp-explorador__relacions">{files.slice(0, MAX_FILES).map(fila)}</ul>
      {files.length > MAX_FILES && (
        <details className="sdp-explorador__mes">
          <summary>Mostra’n {files.length - MAX_FILES} més</summary>
          <ul className="sdp-explorador__relacions">{files.slice(MAX_FILES).map(fila)}</ul>
        </details>
      )}
    </>
  );
}

function Dades({ node }) {
  const dades = dadesDelNode(node);
  if (!dades.length) return <p className="sdp-explorador__suau">El Mapa no en guarda cap dada més.</p>;
  return (
    <dl className="sdp-explorador__dades">
      {dades.map((d) => (
        <div key={d.clau}>
          <dt>{d.etiqueta}</dt>
          <dd>{d.boolea ? <Insignia to={d.to}>{d.text}</Insignia> : d.mono ? <Mono>{d.text}</Mono> : d.text}</dd>
        </div>
      ))}
    </dl>
  );
}

function Avisos({ avisos }) {
  if (!avisos.length) return <p className="sdp-explorador__suau">Cap avís.</p>;
  return (
    <ul className="sdp-explorador__avisos">
      {avisos.map((a) => {
        const text = TEXTOS_AVIS[a.codi];
        return (
          <li key={a.codi} className="sdp-explorador__avis">
            <Insignia to={TO_SEVERITAT[a.severitat] ?? 'neutre'}>{a.severitat}</Insignia>
            <p>{text ?? a.codi}</p>
            {(text || a.evidencia) && (
              <p className="sdp-explorador__relacio-meta">
                {text && <span className="sdp-explorador__suau">{a.codi}</span>}
                {a.evidencia && <Mono>{a.evidencia}</Mono>}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * mapa        el Mapa sencer (sdp.mapa.v1): la peça es busca ací, no al graf
 * graf        el graf filtrat de l'Explorador: diu si la peça es veu
 * seleccio    id de la peça triada ('' si cap); el comparteix BrainGraph
 * onSeleccio  (id) => tria una altra peça
 * onRestablir (seguent) => torna els filtres a l'inici i enfoca `seguent`
 */
export function DetallPeca({ mapa, graf, seleccio, onSeleccio, onRestablir }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const privat = useContext(PrivacitatConsola);
  const panell = useRef(null);
  const titol = useRef(null);
  const enfocaTitol = useRef(false);
  const node = useMemo(() => mapa.nodes.find((n) => n.id === seleccio) ?? null, [mapa, seleccio]);
  const visible = Boolean(node) && graf.nodes.some((n) => n.id === node.id);
  const opcions = useMemo(() => opcionsPeces(graf.nodes, node && !visible ? node : null), [graf, node, visible]);

  /* «Vore la peça» fa desaparéixer la fila on era el focus: passa al nom de
     la peça nova, que a més queda a la vista. */
  useEffect(() => {
    if (!enfocaTitol.current) return;
    enfocaTitol.current = false;
    titol.current?.focus();
  }, [node]);
  const vore = (id) => {
    if (id === seleccio) { titol.current?.focus(); return; }
    enfocaTitol.current = true;
    onSeleccio(id);
  };

  const tria = (
    <Camp etiqueta="Tria una peça" ajuda="També pots fer clic en un punt del graf.">
      <Selector opcions={opcions} value={node ? node.id : ''} onChange={(e) => onSeleccio(e.target.value)} />
    </Camp>
  );

  if (!node) {
    return (
      <aside className="sdp-explorador__detall" aria-label="Detall de la peça" ref={panell}>
        {tria}
        <p>
          Fes clic en un punt del graf o tria una peça de la llista. Ací veuràs
          què és, on viu, amb qui es relaciona i com obrir-la.
        </p>
      </aside>
    );
  }

  const dev = import.meta.env.DEV;
  const { ruta, rol } = fitxerDelNode(node);
  const avisos = mapa.avisos.filter((a) => a.node === node.id);
  const { ixen, entren } = relacionsPerVerb(mapa, node.id);
  const doc = rol === 'fitxer' ? documentWiki(ruta, wikiManifest) : null;
  const editable = rutaEditable(ruta, dev, avisos);
  const nota = notaEixides(node, ixen);

  const obriEditor = async () => {
    // El mode privacitat també val per al toast: la ruta no ix a la pantalla.
    const quin = privat ? 'el fitxer' : ruta;
    try {
      const resposta = await fetch(`/__open-in-editor?file=${encodeURIComponent(ruta)}`);
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      showToast(`S’ha demanat a l’editor que obriga ${quin}.`, 'info');
    } catch {
      showToast('No s’ha pogut fer la petició a l’editor: el servidor de desenvolupament no ha respost.', 'error');
    }
  };
  const copia = async () => {
    try {
      await navigator.clipboard.writeText(ruta);
      showToast('Ruta copiada al porta-retalls.', 'success');
    } catch {
      showToast('No s’ha pogut copiar la ruta: el navegador no ha donat accés al porta-retalls.', 'error');
    }
  };

  return (
    <aside className="sdp-explorador__detall" aria-label="Detall de la peça" ref={panell}>
      {tria}

      <div className="sdp-explorador__detall-cap">
        <p className="sdp-explorador__suau">
          <span className="sdp-explorador__punt" data-tipus={node.tipus} aria-hidden="true" />
          {NOMS_TIPUS[node.tipus] ?? node.tipus}
        </p>
        <h3 ref={titol} tabIndex={-1}>{etiquetaNode(node)}</h3>
        <p>{queEs(node)}</p>
      </div>

      {!visible && (
        <Alerta to="info" titol="No es veu al graf amb estos filtres"
          accions={(
            <Boto varietat="secundari" icona={RotateCcw}
              onClick={() => onRestablir(panell.current?.querySelector('select'))}>Restablir filtres</Boto>
          )}>
          La peça és al Mapa, però els filtres o la cerca l’amaguen del graf.
        </Alerta>
      )}

      <section className="sdp-explorador__bloc">
        <h4>{rol === 'declarat' ? 'On es declara' : 'On viu'}</h4>
        {ruta ? (
          <>
            <p className="sdp-explorador__ruta"><Mono>{ruta}</Mono></p>
            {rol === 'declarat' && (
              <p className="sdp-explorador__suau">Esta peça no és un fitxer propi: viu dins d’este fitxer.</p>
            )}
            <div className="sdp-explorador__accions">
              {doc && (
                <Boto varietat="primari" icona={BookOpen} onClick={() => navigate(doc.href)}>Obrir a la Wiki</Boto>
              )}
              {editable && (
                <Boto varietat={doc ? 'secundari' : 'primari'} icona={FileCode} onClick={obriEditor}>Obrir a l’editor</Boto>
              )}
              <Boto varietat="fantasma" icona={Copy} onClick={copia}>Copiar la ruta</Boto>
            </div>
            {dev && fitxerAbsent(avisos) && rutaEditable(ruta, dev) && (
              <p className="sdp-explorador__suau">El fitxer no és al disc: no es pot obrir a l’editor.</p>
            )}
          </>
        ) : (
          <p className="sdp-explorador__suau">El Mapa no sap de quin fitxer ix esta peça.</p>
        )}
      </section>

      <section className="sdp-explorador__bloc">
        <h4>Dades</h4>
        <Dades node={node} />
      </section>

      <section className="sdp-explorador__bloc">
        <h4>Què fa</h4>
        {nota && <p className="sdp-explorador__suau">{nota}</p>}
        <Relacions files={ixen} onVore={vore} />
      </section>

      <section className="sdp-explorador__bloc">
        <h4>Qui hi arriba</h4>
        <Relacions files={entren} onVore={vore}
          buit="Cap peça hi arriba: ningú la crida, la llig ni la carrega." />
      </section>

      <section className="sdp-explorador__bloc">
        <h4>Avisos</h4>
        <Avisos avisos={avisos} />
      </section>
    </aside>
  );
}
