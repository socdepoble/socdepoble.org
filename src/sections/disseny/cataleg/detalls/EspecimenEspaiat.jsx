import { Especimen } from '../Especimen.jsx';
import { Taula } from '../../../../components/PedraSeca/index.js';

const ESCALA = [[1, 4], [2, 8], [3, 12], [4, 16], [6, 24], [8, 32], [10, 40], [12, 48], [16, 64], [20, 80]];
const CLASSE_ESCALA = {1: 'sdp-escala__barra--1', 2: 'sdp-escala__barra--2', 3: 'sdp-escala__barra--3', 4: 'sdp-escala__barra--4', 6: 'sdp-escala__barra--6', 8: 'sdp-escala__barra--8', 10: 'sdp-escala__barra--10', 12: 'sdp-escala__barra--12', 16: 'sdp-escala__barra--16', 20: 'sdp-escala__barra--20'};
const METRIQUES = [
  ['--sdp-touch', '44px', 'Llei de vida: cap control per davall.'],
  ['--sdp-touch-comode', '48px', 'Controls de barra i del Bloc de notes.'],
  ['--sdp-alt-accio', '58px', 'Alçada de les barres blava, taronja i de columna.'],
  ['--sdp-alt-negra', '64px', 'Alçada de la Top Bar.'],
  ['--sdp-fitxa-mida', '96px', 'Llei de la fitxa: costat del mitjà = alçada mínima.'],
  ['--sdp-col-sidebar', '260px', 'Amplada de la barra lateral.'],
  ['--sdp-measure', '68ch', 'Mesura de columna editorial.'],
  ['--sdp-radi-s · m · g · xl', '8 · 12 · 16 · 28px', 'Radis de base. --sdp-radi-boto (àlies de la pastilla, 999px) per a tot botó d’acció; rectangle pur (0) només a la barra principal i a la primera columna o rail.']
];

export default function EspecimenEspaiat() {
  return (
    <Especimen id="espaiat" nom="Espaiat i graella" fitxer="src/css/tokens.css"
      descripcio="Escala modular base 4/8. Tot marge, coixí i separació s'escriu amb --sdp-space-N; les mètriques del layout (alçades de barra, amplades de columna, radis) són tokens amb nom i no números solts."
      fes={['--sdp-space-2 (8px) entre icona i text; --sdp-space-4 (16px) de coixí de targeta.', 'Graella fluida: 1 columna en mòbil, 2 en tauleta, 3 en escriptori.']}
      noFacis={['margin: 13px. Si no és a l’escala, no existix.', 'Radis a ull: només s, m, g, xl i pastilla.']}>

      <h4>Sistema d’espaiat</h4>
      <div className="sdp-escala">
        {ESCALA.map(([n, px]) => (
          <div className="sdp-escala__fila" key={n}>
            <span className="sdp-escala__token">--sdp-space-{n}</span>
            <span className={`sdp-escala__barra ${CLASSE_ESCALA[n]}`}></span>
            <span>{px} px</span>
          </div>
        ))}
      </div>

      <h4>Graella responsive</h4>
      <div className="grid-preview">
        <div className="grid-col">1 columna (mòbil)</div>
        <div className="grid-col">2 columnes (tauleta)</div>
        <div className="grid-col">3 columnes (escriptori)</div>
      </div>

      <h4>Mètriques del layout</h4>
      <Taula titol="Tokens de mètrica" densa>
        <thead><tr><th scope="col">Token</th><th scope="col">Valor</th><th scope="col">Per a què</th></tr></thead>
        <tbody>
          {METRIQUES.map(([t, v, q]) => <tr key={t}><td><code>{t}</code></td><td>{v}</td><td>{q}</td></tr>)}
        </tbody>
      </Taula>
    </Especimen>
  );
}
