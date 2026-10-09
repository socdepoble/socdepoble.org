import { useContext, useEffect, useMemo, useRef } from 'react';
import { BookOpen, ClipboardCopy, Copy, FileCode, Network, RotateCcw } from 'lucide-react';
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
import { codisReparats, ordreReparacio } from './inventariMapa.js';

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
 * Els botons d'una peça que és (o viu dins d')un fitxer: Veure al graf, Obrir
 * a la Wiki, Obrir a l'editor (només en desenvolupament i si el fitxer hi és),
 * Copiar la ruta i Copiar l'ordre de reparació. Els pinta el detall de
 * l'Explorador i, Onada 6 (requisit 11), cada fila de l'Inventari: els
 * mateixos botons, no uns de nous (lliçó 261007). Copiar l'ordre només la
 * copia: la Consola no executa res.
 *
 * ruta     el fitxer (fitxerDelNode); sense, cap botó de fitxer
 * avisos   els avisos del fitxer propi de la peça: diuen si falta (no s'obri a l'editor)
 * doc      el document publicat a la Wiki (documentWiki), o null
 * graf     l'adreça de l'Explorador amb la peça triada, o null
 * ordre    l'ordre de reparació (inventariMapa.js · ordreReparacio), o null
 * repara   els codis d'avís que l'ordre tracta (inventariMapa.js · codisReparats): el nom
 *          accessible i el toast ho diuen, perquè no semble que repara el que no repara
 * nom      el nom de la peça, per al lector de pantalla quan n'hi ha moltes en una taula
 * discret  tots els botons fantasma (una fila de taula no porta cap acció principal)
 */
export function AccionsFitxer({ ruta, avisos = [], doc = null, graf = null, ordre = null, repara = [], nom = null, discret = false }) {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const privat = useContext(PrivacitatConsola);
  const editable = rutaEditable(ruta, import.meta.env.DEV, avisos);
  const deQui = nom ? <span className="sdp-nomes-lector">{` de ${nom}`}</span> : null;
  /* Correcció de l'Onada 6 (revisió adversarial: «pot enganyar») · quins
     avisos tracta l'ordre. L'espai va fora del text amagat: el nom accessible
     no l'enganxa a la paraula d'abans. */
  const perA = repara.length ? ` per a ${repara.join(', ')}` : '';
  const perALector = perA ? <>{' '}<span className="sdp-nomes-lector">{perA.trim()}</span></> : null;

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
  const copia = async (text, fet, motiu) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(fet, 'success');
    } catch {
      showToast(`No s’ha pogut copiar ${motiu}: el navegador no ha donat accés al porta-retalls.`, 'error');
    }
  };

  return (
    <div className="sdp-explorador__accions">
      {graf && (
        <Boto varietat={discret ? 'fantasma' : 'secundari'} icona={Network} onClick={() => navigate(graf)}>Veure al graf{deQui}</Boto>
      )}
      {doc && (
        <Boto varietat={discret ? 'fantasma' : 'primari'} icona={BookOpen} onClick={() => navigate(doc.href)}>Obrir a la Wiki{deQui}</Boto>
      )}
      {ruta && editable && (
        <Boto varietat={discret ? 'fantasma' : doc ? 'secundari' : 'primari'} icona={FileCode} onClick={obriEditor}>Obrir a l’editor{deQui}</Boto>
      )}
      {ruta && (
        <Boto varietat="fantasma" icona={Copy}
          onClick={() => copia(ruta, 'Ruta copiada al porta-retalls.', 'la ruta')}>Copiar la ruta{deQui}</Boto>
      )}
      {ordre && (
        <Boto varietat="fantasma" icona={ClipboardCopy}
          onClick={() => copia(ordre, `Ordre de reparació${perA} copiada al porta-retalls: no s’ha executat res.`, 'l’ordre')}>
          Copiar l’ordre de reparació{deQui}{perALector}
        </Boto>
      )}
    </div>
  );
}

/**
 * mapa        el Mapa sencer (sdp.mapa.v1): la peça es busca ací, no al graf
 * graf        el graf filtrat de l'Explorador: diu si la peça es veu
 * seleccio    id de la peça triada ('' si cap); el comparteix BrainGraph
 * onSeleccio  (id) => tria una altra peça
 * onRestablir (seguent) => torna els filtres a l'inici i enfoca `seguent`
 * enfoca      Onada 6 · s'hi arriba per un enllaç (?peca=): en muntar, el focus
 *             va al nom de la peça, que queda a la vista (el detall és davall del graf)
 */
export function DetallPeca({ mapa, graf, seleccio, onSeleccio, onRestablir, enfoca = false }) {
  const privat = useContext(PrivacitatConsola);
  const panell = useRef(null);
  const titol = useRef(null);
  const enfocaTitol = useRef(enfoca);
  const node = useMemo(() => mapa.nodes.find((n) => n.id === seleccio) ?? null, [mapa, seleccio]);
  const visible = Boolean(node) && graf.nodes.some((n) => n.id === node.id);
  const opcions = useMemo(
    () => opcionsPeces(graf.nodes, node && !visible ? node : null, { privat }),
    [graf, node, visible, privat]
  );

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
  /* L'absència només val per al fitxer propi de la peça: una ordre npm no
     declarada porta 'script-absent', però el seu package.json sí que hi és. */
  const avisosDelFitxer = rol === 'fitxer' ? avisos : [];
  const absent = fitxerAbsent(avisosDelFitxer);
  const nota = notaEixides(node, ixen);
  // Onada 6 · Una skill amb un avís que té reparació mecànica la diu (només es copia).
  const ordre = node.tipus === 'skill' ? ordreReparacio({ ...node, nom: etiquetaNode(node), avisos }) : null;
  const repara = node.tipus === 'skill' ? codisReparats({ avisos }) : [];

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
            <AccionsFitxer ruta={ruta} avisos={avisosDelFitxer} doc={doc} ordre={ordre} repara={repara} />
            {dev && absent && rutaEditable(ruta, dev) && (
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
