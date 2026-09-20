import { Especimen } from '../Especimen.jsx';
import { Alerta, Taula } from '../../../../components/PedraSeca/index.js';

const NIVELLS = [
  ['H1', '2.5rem (40px)', '800', 'var(--sdp-accio-text) (blau fort)', 'Centrat', 'Cap'],
  ['H2', '2rem (32px)', '800', 'var(--sdp-accent-titol) (taronja fort)', 'Centrat', 'Cap'],
  ['H3', '1.75rem (28px)', '700', 'var(--sdp-accio-text) (blau fort)', 'Esquerra', 'Inferior (1px solid var(--sdp-vora))'],
  ['H4', '1.5rem (24px)', '700', 'var(--sdp-accent-titol) (taronja fort)', 'Esquerra', 'Cap'],
  ['H5', '1.25rem (20px)', '700', 'var(--sdp-accio-text) (blau fort)', 'Esquerra', 'Cap'],
  ['H6', '1.125rem (18px)', '700', 'var(--sdp-text-suau) (pedra)', 'Esquerra', 'Cap (majúscules)']
];
const RITME = [
  ['h1', '0', '16px (--sdp-space-4)'],
  ['h2', '48px (--sdp-space-12)', '12px (--sdp-space-3)'],
  ['h3', '40px (--sdp-space-10)', '12px (--sdp-space-3)'],
  ['h4', '32px (--sdp-space-8)', '8px (--sdp-space-2)'],
  ['p · ul · ol', '0', '16px (--sdp-space-4)']
];

export default function EspecimenTipografia() {
  return (
    <Especimen id="tipografia" nom="Estudi tipogràfic (contracte canònic)" fitxer="src/css/tokens.css · src/css/base.css"
      descripcio="Arquitectura tipogràfica universal de l'ecosistema, dissenyada per a lectura AAA sota llum solar intensa i per a gent gran. Una sola família: Noto Sans. Els títols alternen blau d'acció i taronja d'accent, i eixa és l'única veritat acceptable."
      fes={['Arrel mestra de 18px (1.125rem): touch-targets i lectura sense zoom.', 'Mesura de columna de 68ch: el límit abans de la fatiga ocular.', 'L’entradeta (lead) sempre i només davall del subtítol h2.']}
      noFacis={['Introduir serif «perquè sona a còdex»: prohibit al·lucinar tipografies.', 'Punt final als subtítols h2: són titulars, no paràgrafs.', 'Cap lletra per davall de 14px (--sdp-text-meta).']}>

      <Alerta to="avis" titol="Contracte tipogràfic (prohibit al·lucinar)">
        Cap IA pot alterar ni inventar tipografies. Tot el sistema usa estrictament <strong>Noto Sans</strong>; els pesos, mides i colors d’esta taula són el contracte.
      </Alerta>

      <Taula titol="Nivells de títol" densa>
        <thead><tr><th scope="col">Nivell</th><th scope="col">Mida</th><th scope="col">Pes</th><th scope="col">Color</th><th scope="col">Alineació</th><th scope="col">Vora</th></tr></thead>
        <tbody>
          {NIVELLS.map(([n, mida, pes, color, ali, vora]) => (
            <tr key={n}><td><strong>{n}</strong></td><td>{mida}</td><td>{pes}</td><td><code>{color}</code></td><td>{ali}</td><td>{vora}</td></tr>
          ))}
        </tbody>
      </Taula>

      <h4>Espècimen viu</h4>
      <div className="component-doc-preview">
        <h1>Títol de pàgina (h1)</h1>
        <h2>Subtítol que acompanya la lectura (h2)</h2>
        <p className="lead">Entradeta o resum que convida a entrar en matèria. Sempre davall del subtítol.</p>
        <h3>Apartat (h3)</h3>
        <p>Paràgraf de cos amb interlineat 1,65 perquè la lectura tinga oxigen. La mesura de columna és de 68 caràcters, ni un més.</p>
        <h4>Subapartat (h4)</h4>
        <h5>Nivell cinc (h5)</h5>
        <h6>Nivell sis (h6)</h6>
      </div>

      <h4>Ritme vertical editorial</h4>
      <p>L’interlineat base és <code>1.65</code> per a paràgrafs i <code>1.21</code> (snug) per a encapçalaments.</p>
      <Taula titol="Marges dels elements editorials" densa>
        <thead><tr><th scope="col">Element</th><th scope="col">Marge superior</th><th scope="col">Marge inferior</th></tr></thead>
        <tbody>
          {RITME.map(([el, sup, inf]) => (
            <tr key={el}><td><strong>{el}</strong></td><td><code>{sup}</code></td><td><code>{inf}</code></td></tr>
          ))}
        </tbody>
      </Taula>
    </Especimen>
  );
}
