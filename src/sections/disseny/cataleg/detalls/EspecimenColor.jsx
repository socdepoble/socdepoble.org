import { Especimen } from '../Especimen.jsx';
import { Alerta, Taula } from '../../../../components/PedraSeca/index.js';

const MARCA = [
  ['sw-primary-500', 'Taronja · fons', /* ALLOW_RAW_COLOR */ '#ff7300', '--sdp-primary-500'],
  ['sw-primary-700', 'Taronja fort', /* ALLOW_RAW_COLOR */ '#ad4c03', '--sdp-primary-700 · text accent sobre clar'],
  ['sw-secondary-500', 'Blau · fons', /* ALLOW_RAW_COLOR */ '#016ebf', '--sdp-secondary-500'],
  ['sw-secondary-600', 'Blau fort', /* ALLOW_RAW_COLOR */ '#00599d', '--sdp-secondary-600'],
  ['sw-blanc-pur', 'Blanc', '#ffffff', 'Fons principal'],
  ['sw-negre-pur', 'Negre', /* ALLOW_RAW_COLOR */ '#0e0d0c', '--sdp-pedra-900 · text principal']
];
const ESTAT = [
  ['sw-error-500', 'Alerta', /* ALLOW_RAW_COLOR */ '#c2181d', '--sdp-error-500'],
  ['sw-avis-500', 'Avís', /* ALLOW_RAW_COLOR */ '#9c6902', '--sdp-avis-500'],
  ['sw-exit-500', 'Èxit', /* ALLOW_RAW_COLOR */ '#027e38', '--sdp-exit-500']
];
/* Selecció de la navegació secundària sobre crom (T62b): la fila activa de la
   1a columna i dels rails plegats. Cada hex és el valor resolt del seu token
   (ALLOW_RAW_COLOR: el mostrari documenta, no pinta). */
const CROM_SELECCIO = [
  ['sw-crom-seleccio-fons', 'Selecció · fons', /* ALLOW_RAW_COLOR */ '#00599d', '--sdp-crom-seleccio-fons · Blau 600'],
  ['sw-crom-seleccio-text', 'Selecció · text i icona', '#ffffff', '--sdp-crom-seleccio-text · Blanc pur'],
  ['sw-crom-seleccio-vora', 'Vora de l’arrel', /* ALLOW_RAW_COLOR */ '#49a3fa', '--sdp-crom-seleccio-vora · Blau 400']
];
const PEDRA = [
  ['50', 'Blanc trencat', '#ffffff'], ['100', 'Núvol', '#ffffff'], ['200', 'Arena', /* ALLOW_RAW_COLOR */ '#efece7'],
  ['300', 'Calç', /* ALLOW_RAW_COLOR */ '#dcd7cd'], ['400', 'Cendra', /* ALLOW_RAW_COLOR */ '#b7b1a5'], ['500', 'Pedra', /* ALLOW_RAW_COLOR */ '#8b857b'],
  ['600', 'Pedra fosca', /* ALLOW_RAW_COLOR */ '#5b564e'], ['700', 'Grafit', /* ALLOW_RAW_COLOR */ '#3d3b35'], ['750', 'Pissarra', /* ALLOW_RAW_COLOR */ '#302e29'],
  ['800', 'Carbó', /* ALLOW_RAW_COLOR */ '#22211e'], ['850', 'Sutja', /* ALLOW_RAW_COLOR */ '#181715'], ['900', 'Negre', /* ALLOW_RAW_COLOR */ '#0e0d0c']
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

      <h4>Crom · selecció de la navegació</h4>
      <p>La fila activa de la primera columna (arbre de carpetes i categories, rail del Xat) i dels rails plegats: fons blau fort, text i icona <strong>obligatòriament blancs</strong> i un <strong>marcador blanc de 3px</strong> a l’inici de línia, perquè l’estat no depenga només del color (WCAG 1.4.1). El marcador és un pseudo-element: no mou cap text ni cap icona. La barra principal, CONTROL i les capçaleres conserven el taronja (--sdp-crom-actiu-*).</p>
      <Paleta mostres={CROM_SELECCIO} />
      <Taula titol="Parelles de contrast de la selecció de crom" densa>
        <thead><tr><th scope="col">Parella</th><th scope="col">Contrast</th><th scope="col">Nivell</th><th scope="col">Ús</th></tr></thead>
        <tbody>
          <tr><td>Blanc sobre blau 600</td><td>7,20:1</td><td>AAA</td><td>Text i icona de la fila activa</td></tr>
          <tr><td>Blau 600 contra la columna (grafit 700)</td><td>1,55:1</td><td>Per davall de 3:1</td><td>Cel·la activa: la distingix el to, no la lluminositat</td></tr>
          <tr><td>Blau 600 contra el rail plegat (carbó 800)</td><td>2,24:1</td><td>Per davall de 3:1</td><td>Cel·la activa del rail plegat</td></tr>
          <tr><td>Blau 400 contra el rail plegat (carbó 800)</td><td>6,06:1</td><td>1.4.11</td><td>Vora de l’arrel que conté la selecció</td></tr>
          <tr><td>Focus taronja 400 sobre blau 600</td><td>3,33:1</td><td>1.4.11</td><td>Anell de focus dins de la fila activa</td></tr>
          <tr><td>Focus taronja 400 contra la columna (grafit 700)</td><td>5,17:1</td><td>1.4.11</td><td>Anell de focus en una fila inactiva</td></tr>
          <tr><td>Marcador blanc sobre blau 600</td><td>7,20:1</td><td>1.4.11</td><td>Marcador de 3px a l’inici de la fila activa</td></tr>
          <tr><td>Marcador blanc contra la columna (grafit 700)</td><td>11,20:1</td><td>1.4.1 i 1.4.11</td><td>El marcador distingix la fila activa sense dependre del color</td></tr>
          <tr><td>Marcador blanc contra el rail plegat (carbó 800)</td><td>16,10:1</td><td>1.4.1 i 1.4.11</td><td>Marcador de la cel·la activa del rail plegat</td></tr>
        </tbody>
      </Taula>

      <h4>Escala Pedra</h4>
      <p>Neutre càlid, mai gris fred. El graó <strong>600</strong> és el sòl per a text secundari: és el primer que arriba a 7:1 sobre blanc.</p>
      <Paleta mostres={PEDRA.map(([n, nom, hex]) => [`sw-pedra-${n}`, `${nom} · ${n}`, hex, `--sdp-pedra-${n}`])} />
    </Especimen>
  );
}
