import { Link } from '../../../../app/contexts/RouterContext.jsx';
import { REGISTRE, PAGINES } from '../registre.js';
import { rutaEspecimen } from '../manifest.js';
import { Insignia } from '../../../../components/PedraSeca/index.js';

const TO = { viu: 'exit', maqueta: 'avis', extern: 'info', obsolet: 'error' };
const TEXT = { viu: 'Espècimen viu', maqueta: 'Només maqueta', extern: 'Extern', obsolet: 'Obsolet' };

/* T52 (ordre del Mestre, 260928) · La columna «Porta» fa visible el que abans
   amagava la marca fora: la porta del catàleg només vigila PedraSeca/. */
export default function EspecimenInventariGlobal() {
  const compte = REGISTRE.reduce((a, r) => ({ ...a, [r.estat]: (a[r.estat] || 0) + 1 }), {});
  const fora = REGISTRE.filter((r) => r.fora).length;
  const titolPagina = Object.fromEntries(PAGINES.map((p) => [p.id, p.titol]));

  return (
    <div className="sdp-article sdp-inventari-global">
      <h2>Inventari de Components</h2>
      <p>Tots els components de l’app i on estan tipificats. La porta <code>tooling/gates/tractor-cataleg.mjs</code> falla si un export de <code>src/components/PedraSeca/</code> no apareix ací, si una entrada «viu» de PedraSeca no la pinta cap espècimen o si una entrada apunta a un export que ja no existix.</p>
      <p>
        {Object.entries(compte).map(([estat, n]) => (
          <span key={estat}><Insignia to={TO[estat]}>{TEXT[estat]}: {n}</Insignia>{' '}</span>
        ))}
        <span><Insignia to="info">Fora de la porta: {fora}</Insignia></span>
      </p>
      <p>Qui és el pare universal de cada peça ho diu l’<Link to={rutaEspecimen('estructura-arbre')}>Arbre universal</Link>.</p>
      {/* Gauntlet 261025_0545 (P1-16) · El registre fa uns 1.100px i la columna
          del detall, uns 385px en una finestra de 1280px: la taula nua en vessava
          més de 700px, retallats per l'overflow:hidden del detall. Es desplaça
          dins de la seua caixa a qualsevol amplada (la de les taules de contingut,
          com a EspecimenGestor.jsx), i la caixa és una regió amb el nom de la
          llegenda i tabIndex=0. No és la caixa del contracte: aquella no parteix
          el nom de la primera columna, i ací noms com «showToast (AvisadorEfimer)»
          eixamplarien la columna i canviarien la taula també en mòbil. */}
      <div className="sdp-taula-prosa" role="region" aria-labelledby="inventari-registre" tabIndex={0}>
      <table>
        <caption id="inventari-registre">Registre del catàleg ({REGISTRE.length} entrades)</caption>
        <thead><tr><th scope="col">Component</th><th scope="col">Fitxer</th><th scope="col">Pàgina (antiga)</th><th scope="col">Estat</th><th scope="col">Porta</th></tr></thead>
        <tbody>
          {REGISTRE.map((r) => (
            <tr key={r.nom}>
              <td><code>{r.nom}</code>{r.substitut ? <> → usa <code>{r.substitut}</code></> : null}</td>
              <td><code>{r.fitxer}</code></td>
              <td>{titolPagina[r.pagina] || r.pagina}</td>
              <td><Insignia to={TO[r.estat]}>{TEXT[r.estat]}</Insignia></td>
              <td>{r.fora ? 'Fora (no la vigila)' : 'Vigilat'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <h3>Deute de migració</h3>
      <ul>
        <li>11 fitxers de secció pinten <code>&lt;input&gt;/&lt;select&gt;/&lt;textarea&gt;</code> a mà: han de passar a <code>&lt;Camp&gt;</code>.</li>
        <li>La Gestoria ja escrivia <code>sdp-boto</code>, <code>sdp-insignia</code>, <code>sdp-camp</code> i <code>sdp-control</code> sense cap regla CSS: ara estan definides; queda substituir el JSX pels components.</li>
        <li>Les maquetes de Fonaments (<code>.badge-*</code>, <code>.avatar-*</code>, <code>.tabs</code>, <code>.modal-box</code>, <code>.progress-fill</code>) no corresponen a cap component de l’app.</li>
        <li>Les peces de <code>universal/</code>, <code>layout/</code> i <code>app/</code> porten fora: la porta no comprova que tinguen espècimen. Cal vigilar-les a mà fins que la porta les cobrisca.</li>
      </ul>
    </div>
  );
}
