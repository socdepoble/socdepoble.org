/**
 * PanellSeguretatXat.jsx — El diàleg «Xifratge i número de seguretat» d'una
 * conversa (P1-12 pas 17; pla 261101_1246, T7 · S5; disseny E2EE §4.4).
 *
 * Contenidor: el Dialeg de Pedra Seca (mida s, la pell dels diàlegs del xat),
 * el número del servei mentre és obert (useNumeroSeguretat) i el cos
 * presentacional (CosSeguretatXat). Conversa.jsx el carrega amb lazy plegat per
 * la bandera E2EE: apagada, no entra al paquet. El focus torna a l'element que
 * l'ha obert (el «⋯» de la capçalera) en tancar-lo.
 */
import { Dialeg } from '../../../components/PedraSeca/index.js';
import { TEXTOS_XIFRATGE } from '../estatXifratgeFil.js';
import { useNumeroSeguretat } from '../useSeguretatDelFil.js';
import CosSeguretatXat from './CosSeguretatXat.jsx';

const T_RESERVA = (_clau, reserva) => reserva;

export default function PanellSeguretatXat({ obert = false, onTanca, fil, estat, nom = '', config = null, t = T_RESERVA }) {
  const numero = useNumeroSeguretat({ fil, config, obert, potVerificar: estat?.potVerificar === true });
  const [clau, reserva] = TEXTOS_XIFRATGE.menu;
  return (
    <Dialeg obert={obert} onTanca={onTanca} titol={t(clau, reserva)} mida="s" className="sdp-xat-dialeg">
      {obert ? <CosSeguretatXat estat={estat} nom={nom} numero={numero} onMarca={numero.marca} t={t} /> : null}
    </Dialeg>
  );
}
