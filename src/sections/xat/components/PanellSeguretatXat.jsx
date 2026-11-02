/**
 * PanellSeguretatXat.jsx — El diàleg «Xifratge i número de seguretat» d'una
 * conversa (P1-12 pas 17; pla 261101_1246, T7 · S5; disseny E2EE §4.4).
 *
 * Contenidor: el Dialeg de Pedra Seca (mida s, la pell dels diàlegs del xat),
 * el número del servei mentre és obert (useNumeroSeguretat) i el cos
 * presentacional (CosSeguretatXat). Conversa.jsx el carrega amb lazy plegat per
 * la bandera E2EE: apagada, no entra al paquet. El focus torna a l'element que
 * l'ha obert (el «⋯» de la capçalera) en tancar-lo.
 *
 * M02 (marató 261101_2143; disseny §4.4) · `canvis` i `onAccepta` són els de la
 * instància única de useCanvisDeClau de Conversa: el cos ofereix «He parlat amb
 * {nom}: continua» per al canvi pendent del número que es mostra. Quan els
 * canvis pendents canvien (s'ha acceptat, o n'ha arribat un de nou), el número
 * es torna a calcular: el bloc del número es torna a muntar amb una clau que
 * en diu els pendents. Una marca sobre un número pendent (accepta i verifica)
 * torna a llegir els canvis, perquè l'alerta del fil i el compositor ho sàpien.
 */
import { useRef } from 'react';
import { Dialeg } from '../../../components/PedraSeca/index.js';
import { TEXTOS_XIFRATGE } from '../estatXifratgeFil.js';
import { useNumeroSeguretat } from '../useSeguretatDelFil.js';
import { useXat } from '../XatContext.jsx';
import CosSeguretatXat from './CosSeguretatXat.jsx';

const T_RESERVA = (_clau, reserva) => reserva;

/** La signatura dels canvis pendents (persona i kid nou), estable i ordenada. Pura. */
export function signaturaDelsPendents(canvis) {
  const pendents = Array.isArray(canvis?.pendents) ? canvis.pendents : [];
  return pendents.map((p) => `${p?.usuari ?? ''}:${p?.kidNou ?? ''}`).sort().join('|');
}

/* El número d'un abast de pendents: muntar-lo és calcular-lo. */
function NumeroDelPanell({ obert, fil, estat, nom, config, ambit, canvis, onAccepta, rescataFocus, t }) {
  const numero = useNumeroSeguretat({ fil, config, obert, potVerificar: estat?.potVerificar === true, ambit });
  const marca = async (verificat) => {
    const eraPendent = numero.pendent === true;
    await numero.marca(verificat);
    if (eraPendent && typeof canvis?.refresca === 'function') canvis.refresca();
  };
  return obert ? (
    <CosSeguretatXat estat={estat} nom={nom} numero={numero} onMarca={marca} canvis={canvis} onAccepta={onAccepta}
      rescataFocus={rescataFocus} t={t} />
  ) : null;
}

export default function PanellSeguretatXat({ obert = false, onTanca, fil, estat, nom = '', config = null, canvis = null, onAccepta = null, t = T_RESERVA }) {
  /* PC155-02 · L'àmbit de dades del xat (persona i actor) entra a la clau del
     número. Fora del proveïdor, useXat() torna ambitEstable buit i mai llança. */
  const { ambitEstable } = useXat();
  const [clau, reserva] = TEXTOS_XIFRATGE.menu;
  const signatura = signaturaDelsPendents(canvis);
  /* Els pendents que hi havia en obrir: un cos que naix després, d'un canvi, rescata el focus. */
  const enObrir = useRef(null);
  if (!obert) enObrir.current = null;
  else if (enObrir.current === null) enObrir.current = signatura;
  return (
    <Dialeg obert={obert} onTanca={onTanca} titol={t(clau, reserva)} mida="s" className="sdp-xat-dialeg">
      <NumeroDelPanell key={signatura} obert={obert} fil={fil} estat={estat} nom={nom} config={config}
        ambit={ambitEstable || null} canvis={canvis} onAccepta={onAccepta}
        rescataFocus={obert && signatura !== enObrir.current} t={t} />
    </Dialeg>
  );
}
