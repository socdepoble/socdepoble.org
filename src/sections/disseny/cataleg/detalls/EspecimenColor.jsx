import { Especimen } from '../Especimen.jsx';
import { Alerta, Taula } from '../../../../components/PedraSeca/index.js';

const MARCA = [
  ['sw-primary-500', 'Taronja · fons', '#ff7300', '--sdp-primary-500'],
  ['sw-primary-700', 'Taronja fort', '#ad4c03', '--sdp-primary-700 · text accent sobre clar'],
  ['sw-secondary-500', 'Blau · fons', '#016ebf', '--sdp-secondary-500'],
  ['sw-secondary-600', 'Blau fort', '#00599d', '--sdp-secondary-600'],
  ['sw-blanc-pur', 'Blanc', '#ffffff', 'Fons principal'],
  ['sw-negre-pur', 'Negre', '#0e0d0c', '--sdp-pedra-900 · text principal']
];
const ESTAT = [
  ['sw-error-500', 'Alerta', '#c2181d', '--sdp-error-500'],
  ['sw-avis-500', 'Avís', '#9c6902', '--sdp-avis-500'],
  ['sw-exit-500', 'Èxit', '#027e38', '--sdp-exit-500']
];
const PEDRA = [
  ['50', 'Blanc trencat', '#ffffff'], ['100', 'Núvol', '#ffffff'], ['200', 'Arena', '#efece7'],
  ['300', 'Calç', '#dcd7cd'], ['400', 'Cendra', '#b7b1a5'], ['500', 'Pedra', '#8b857b'],
  ['600', 'Pedra fosca', '#5b564e'], ['700', 'Grafit', '#3d3b35'], ['750', 'Pissarra', '#302e29'],
  ['800', 'Carbó', '#22211e'], ['850', 'Sutja', '#181715'], ['900', 'Negre', '#0e0d0c']
];

function Paleta({ mostres }) {
  return (
    <div className="palette">
      {mostres.map(([classe, nom, hex, token]) => (
        <div className="swatch" key={classe + nom}>
          <div className={`swatch-color ${classe}`}>{nom}</div>
          <div className="swatch-info">{hex}<br />{token}</div>
        </div>
      ))}
    </div>
  );
}

export default function EspecimenColor() {
  return (
    <Especimen id="color" nom="Identitat cromàtica" fitxer="src/css/tokens.css"
      descripcio="La paleta es genera en OKLCH: el to i el croma de marca es mantenen constants i només varia la lluminositat. Per això l'escala és perceptivament regular i cada graó té un contrast previsible. Els components mai toquen primitius (--sdp-primary-500): pinten amb semàntics (--sdp-accent) que s'invertixen sols en fosc."
      fes={['Text i fons amb semàntics: --sdp-text-cos, --sdp-fons-targeta, --sdp-accent-text.', 'La closca (TopBar, SideBar, columnes crom) només amb --sdp-crom-*.']}
      noFacis={['Redefinir --sdp-crom-* al bloc fosc (ho vigila tractor-crom).', 'Text taronja 500 sobre blanc: 2,73:1, no arriba ni a AA.']}>

      <Alerta to="info" titol="Contracte d’accessibilitat">
        Este sistema complix <strong>WCAG 2.2 nivell AAA (≥7:1) en tot el text, els fons i els grisos estructurals</strong>, i <strong>nivell AA (≥4,5:1) en els colors d’interacció</strong>: enllaços, pestanyes actives i botons primaris. Les vores de control complixen la norma 1.4.11 (≥3:1). AAA estricte en tot obligaria a abandonar el taronja de marca; preferim dir-ho que amagar-ho.
      </Alerta>

      <h4>Colors de marca</h4>
      <Paleta mostres={MARCA} />
      <Taula titol="Parelles de contrast de marca" densa>
        <thead><tr><th scope="col">Parella</th><th scope="col">Contrast</th><th scope="col">Nivell</th><th scope="col">Ús</th></tr></thead>
        <tbody>
          <tr><td>Text fosc sobre taronja 500</td><td>7,13:1</td><td>AAA</td><td>Botons d’accent, capçalera de targeta</td></tr>
          <tr><td>Taronja 700 sobre blanc</td><td>5,51:1</td><td>AA</td><td>Enllaços, pestanya activa</td></tr>
          <tr><td>Taronja 800 sobre blanc</td><td>7,97:1</td><td>AAA</td><td>Títols h2 i h4</td></tr>
          <tr><td>Blanc sobre blau 500</td><td>5,23:1</td><td>AA</td><td>Barra blava, peu de targeta</td></tr>
          <tr><td>Blau 600 sobre blanc</td><td>7,20:1</td><td>AAA</td><td>Títols h1, h3 i h5</td></tr>
        </tbody>
      </Taula>

      <h4>Colors d’estat</h4>
      <Paleta mostres={ESTAT} />

      <h4>Escala Pedra</h4>
      <p>Neutre càlid, mai gris fred. El graó <strong>600</strong> és el sòl per a text secundari: és el primer que arriba a 7:1 sobre blanc.</p>
      <Paleta mostres={PEDRA.map(([n, nom, hex]) => [`sw-pedra-${n}`, `${nom} · ${n}`, hex, `--sdp-pedra-${n}`])} />
    </Especimen>
  );
}
