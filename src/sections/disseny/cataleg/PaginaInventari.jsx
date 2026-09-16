import { REGISTRE, PAGINES } from './registre.js';
import { Insignia } from '../../../components/PedraSeca/Insignia.jsx';
import { Link, useLocation } from '../../../app/contexts/RouterContext';

const TO = { viu: 'exit', maqueta: 'avis', extern: 'info', obsolet: 'error' };
const TEXT = { viu: 'Espècimen viu', maqueta: 'Només maqueta', extern: 'Extern (Codex)', obsolet: 'Obsolet' };

export default function PaginaInventari() {
  const { pathname } = useLocation();
  const compte = REGISTRE.reduce((a, r) => ({ ...a, [r.estat]: (a[r.estat] || 0) + 1 }), {});
  const titolPagina = Object.fromEntries(PAGINES.map((p) => [p.id, p.titol]));
  return (
    <>
      <h2>Inventari</h2>
      <p>Tots els components de l’app i on estan tipificats. La porta <code>tooling/gates/tractor-cataleg.mjs</code> falla si un export de <code>src/components/PedraSeca/</code> no apareix ací.</p>
      <p>
        {Object.entries(compte).map(([estat, n]) => (
          <span key={estat}><Insignia to={TO[estat]}>{TEXT[estat]}: {n}</Insignia>{' '}</span>
        ))}
      </p>
      <table>
        <caption>Registre del catàleg ({REGISTRE.length} entrades)</caption>
        <thead><tr><th scope="col">Component</th><th scope="col">Fitxer</th><th scope="col">Pàgina</th><th scope="col">Estat</th></tr></thead>
        <tbody>
          {REGISTRE.map((r) => (
            <tr key={r.nom}>
              <td><code>{r.nom}</code>{r.substitut ? <> → usa <code>{r.substitut}</code></> : null}</td>
              <td><code>{r.fitxer}</code></td>
              <td><Link to={r.pagina === 'fonaments' ? pathname : `${pathname}?pagina=${r.pagina}`}>{titolPagina[r.pagina]}</Link></td>
              <td><Insignia to={TO[r.estat]}>{TEXT[r.estat]}</Insignia></td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Deute de migració</h3>
      <ul>
        <li>11 fitxers de secció pinten <code>&lt;input&gt;/&lt;select&gt;/&lt;textarea&gt;</code> a mà: han de passar a <code>&lt;Camp&gt;</code>.</li>
        <li>La Gestoria ja escrivia <code>sdp-boto</code>, <code>sdp-insignia</code>, <code>sdp-camp</code> i <code>sdp-control</code> sense cap regla CSS: ara estan definides; queda substituir el JSX pels components.</li>
        <li>Les maquetes de Fonaments (<code>.badge-*</code>, <code>.avatar-*</code>, <code>.tabs</code>, <code>.modal-box</code>, <code>.progress-fill</code>) no corresponen a cap component de l’app.</li>
      </ul>
    </>
  );
}
