import { Especimen } from '../Especimen.jsx';
import { Alerta, Taula } from '../../../../components/PedraSeca/index.js';

/* Fase D (Q5 del Mestre, 261004) · l'escala real de la prosa (base.css).
   Mínim a 320px i màxim a 1024px. Derogació (acta 261004_1027 i F06 de
   Codex, 261004): el mínim ja no és l'escala P6 fixa, sinó una mida més
   menuda perquè el títol càpia sencer en un mòbil estret (ràtio màxim 1.8).
   La prova del costat compara cada xifra amb tokens.css. */
/** [token, on s'aplica, mínim px, màxim px] */
export const ESCALA_FLUIDA = [
  ['--sdp-fluid-h1', 'h1', 32, 56],
  ['--sdp-fluid-h2', 'h2', 28, 46],
  ['--sdp-fluid-h3', 'h3', 24, 36],
  ['--sdp-fluid-h4', 'h4', 20, 30],
  ['--sdp-fluid-h5', 'h5', 18, 26],
  ['--sdp-fluid-h6', 'h6', 16, 22],
  ['--sdp-fluid-lead', '.lead i cites', 18, 22],
  ['--sdp-fluid-cos', 'p, ul i ol', 16, 20]
];

const mida = (token) => {
  const [, , min, max] = ESCALA_FLUIDA.find(([nom]) => nom === token);
  return `${min} a ${max}px`;
};

const NIVELLS = [
  ['H1', '--sdp-fluid-h1', '--sdp-pes-extra (800)', 'var(--sdp-accio-text) (blau fort)', 'Centrat', 'Cap'],
  ['H2', '--sdp-fluid-h2', '--sdp-pes-extra (800)', 'var(--sdp-accent-titol) (taronja fort)', 'Centrat', 'Cap'],
  ['H3', '--sdp-fluid-h3', '--sdp-pes-negreta (700)', 'var(--sdp-accio-text) (blau fort)', 'Esquerra', 'Inferior (1px solid var(--sdp-vora))'],
  ['H4', '--sdp-fluid-h4', '--sdp-pes-negreta (700)', 'var(--sdp-accent-titol) (taronja fort)', 'Esquerra', 'Cap'],
  ['H5', '--sdp-fluid-h5', '--sdp-pes-negreta (700)', 'var(--sdp-accio-text) (blau fort)', 'Esquerra', 'Cap'],
  ['H6', '--sdp-fluid-h6', '--sdp-pes-negreta (700)', 'var(--sdp-text-suau) (pedra)', 'Esquerra', 'Cap (majúscules)']
];

/** [element, token del marge superior, valor, token del marge inferior, valor] */
export const RITME = [
  ['h1', '--sdp-mt-h1', '0', '--sdp-mb-h1', '16px'],
  ['h2', '--sdp-mt-h2', '48px', '--sdp-mb-h2', '12px'],
  ['h3', '--sdp-mt-h3', '40px', '--sdp-mb-h3', '12px'],
  ['h4', '--sdp-mt-h4', '32px', '--sdp-mb-h4', '16px'],
  ['h5', '--sdp-mt-h5', '24px', '--sdp-mb-h5', '8px'],
  ['h6', '--sdp-mt-h6', '20px', '--sdp-mb-h6', '8px'],
  ['p', null, '0', '--sdp-mb-p', '20px'],
  ['ul · ol', null, '0', '--sdp-mb-ul', '20px']
];

/** [token, valor, classe del mostrari, nom de l'amplada] */
export const AMPLADES = [
  [null, '100%', 'sdp-tipo-amplada--normal', 'Normal'],
  ['--sdp-font-amplada-semi', '87.5%', 'sdp-tipo-amplada--semi', 'Semicondensada'],
  ['--sdp-font-amplada-estreta', '75%', 'sdp-tipo-amplada--estreta', 'Condensada']
];

export default function EspecimenTipografia() {
  return (
    <Especimen id="tipografia" nom="Estudi tipogràfic (contracte canònic)" fitxer="src/css/tokens.css · src/css/base.css"
      descripcio="Arquitectura tipogràfica universal de l'ecosistema, dissenyada per a lectura AAA sota llum solar intensa i per a gent gran. Una sola família: Noto Sans, allotjada a casa. La prosa creix amb la pantalla i amb el zoom; al mòbil es fa més menuda perquè el títol càpia sencer, mai per davall de 16px al cos. Tota la tipografia passa per custom properties: un tauler d'administració la podrà reescriure en calent."
      fes={['Prosa amb els tokens fluids (--sdp-fluid-*): rem més vw, creix amb el zoom (WCAG 1.4.4).', 'Flux lliure: la prosa de l’article ocupa tota l’amplària del contenidor; només el coixí de .content-wrapper la separa de la vora (ordre del Mestre, 261004).', 'Interlineat 1.2 als títols (--sdp-leading-titol) i 1.6 al cos (--sdp-leading-cos).', 'L’entradeta (lead) sempre i només davall del subtítol h2.']}
      noFacis={['Introduir serif «perquè sona a còdex»: prohibit al·lucinar tipografies.', 'Punt final als subtítols h2: són titulars, no paràgrafs.', 'Cap lletra per davall de 14px (--sdp-text-meta).', 'Mides fluides als components: vw és el viewport de l’amfitrió, no la columna. Els components usen --sdp-text-* fixos.']}>

      <Alerta to="avis" titol="Contracte tipogràfic (prohibit al·lucinar)">
        Cap IA pot alterar ni inventar tipografies. Tot el sistema usa estrictament <strong>Noto Sans</strong>; els pesos, mides i colors d’estes taules són el contracte.
      </Alerta>

      <Taula titol="Nivells de títol" densa>
        <thead><tr><th scope="col">Nivell</th><th scope="col">Mida</th><th scope="col">Pes</th><th scope="col">Color</th><th scope="col">Alineació</th><th scope="col">Vora</th></tr></thead>
        <tbody>
          {NIVELLS.map(([n, token, pes, color, ali, vora]) => (
            <tr key={n}><td><strong>{n}</strong></td><td><code>{token}</code> · {mida(token)}</td><td><code>{pes}</code></td><td><code>{color}</code></td><td>{ali}</td><td>{vora}</td></tr>
          ))}
        </tbody>
      </Taula>

      <h4>Escala fluida</h4>
      <p>De 320 a 1024px la mida creix en línia recta; fora d’eixe tram es queda al mínim o al màxim. Els valors són <code>clamp()</code> amb un terme en rem i un altre en vw; on el navegador entén <code>cqi</code>, el terme d’amplada és el del contenidor.</p>
      <Taula titol="Tokens fluids de la prosa" densa>
        <thead><tr><th scope="col">Token</th><th scope="col">S’aplica a</th><th scope="col">A 320px</th><th scope="col">A 1024px</th></tr></thead>
        <tbody>
          {ESCALA_FLUIDA.map(([token, on, min, max]) => (
            <tr key={token}><td><code>{token}</code></td><td>{on}</td><td>{min}px</td><td>{max}px</td></tr>
          ))}
        </tbody>
      </Taula>

      <h4>Espècimen viu</h4>
      <div className="component-doc-preview">
        <h1>Títol de pàgina (h1)</h1>
        <h2>Subtítol que acompanya la lectura (h2)</h2>
        <p className="lead">Entradeta o resum que convida a entrar en matèria. Sempre davall del subtítol.</p>
        <h3>Apartat (h3)</h3>
        <p>Paràgraf de cos amb interlineat 1,6 perquè la lectura tinga oxigen. La prosa flueix a tota l’amplària de la columna.</p>
        <h4>Subapartat (h4)</h4>
        <h5>Nivell cinc (h5)</h5>
        <h6>Nivell sis (h6)</h6>
      </div>

      <h4>Amplades de Noto Sans</h4>
      <p>Per a rètols llargs en espais estrets. Si la cara estreta no és al paquet local, el navegador pinta l’amplada normal: no la sintetitza.</p>
      {AMPLADES.map(([token, valor, classe, nom]) => (
        <p key={classe} className={classe}><strong>{nom} ({valor})</strong> · Intergeneracional, la Parròquia i el Bar{token ? <> · <code>{token}</code></> : null}</p>
      ))}

      <h4>Ritme vertical editorial</h4>
      <p>L’interlineat és <code>1.6</code> per a paràgrafs i llistes i <code>1.2</code> per a encapçalaments.</p>
      <Taula titol="Marges dels elements editorials" densa>
        <thead><tr><th scope="col">Element</th><th scope="col">Marge superior</th><th scope="col">Marge inferior</th></tr></thead>
        <tbody>
          {RITME.map(([el, tokenSup, sup, tokenInf, inf]) => (
            <tr key={el}><td><strong>{el}</strong></td><td><code>{tokenSup ? `${sup} (${tokenSup})` : sup}</code></td><td><code>{`${inf} (${tokenInf})`}</code></td></tr>
          ))}
        </tbody>
      </Taula>
    </Especimen>
  );
}
