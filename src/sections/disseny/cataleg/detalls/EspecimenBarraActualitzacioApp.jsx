/* Pla 261113_0521 (Onada R22 · T2) · Espècimen viu de BarraActualitzacioRecomanada. */
import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import BarraActualitzacioRecomanada from '../../../../components/universal/barres/BarraActualitzacioRecomanada.jsx';
import {
  ENLLAC_ANDROID_MARKET,
  ENLLAC_ANDROID_PLAY,
  ENLLAC_IOS_APP_STORE
} from '../../../../config/actualitzacioRecomanada.js';
import { createTranslator } from '../../../../config/i18n';

const T_CA = createTranslator('ca');

const MOSTRA_ANDROID = Object.freeze({
  plataforma: 'android',
  versioRecomanada: 6,
  enllac: ENLLAC_ANDROID_PLAY,
  marketUrl: ENLLAC_ANDROID_MARKET
});

const MOSTRA_IOS = Object.freeze({
  plataforma: 'ios',
  versioRecomanada: 6,
  enllac: ENLLAC_IOS_APP_STORE,
  marketUrl: null
});

export default function EspecimenBarraActualitzacioApp() {
  const [ajornada, setAjornada] = useState(false);
  const [ultimaAccio, setUltimaAccio] = useState('');

  return (
    <Especimen
      id="barra-actualitzacio-app"
      nom="Barra d’actualització d’app"
      fitxer="src/components/universal/barres/BarraActualitzacioRecomanada.jsx (estatDeVersio · actualitzacioRecomanada)"
      descripcio="Quan l’aplicació nativa instal·lada a Android (org.socdepoble.app) o iOS (id6826441844) encara és compatible amb el servidor (VERSIO_CLIENT_NATIU >= versioMinima), però ja hi ha una versioRecomanada superior publicada a la botiga, la closca mostra una franja superior suau i no bloquejant. La persona pot obrir directament Google Play o l’App Store amb un botó centrat de 48 px, o ajornar l’avís per a eixa versió concreta i continuar usant l’aplicació sense interrupcions."
      contracte={[
        ['BarraActualitzacioRecomanada.mostra', '{ plataforma, versioRecomanada, enllac, marketUrl } | null', 'undefined', 'Sense la prop, llig l’estat real de useActualitzacioRecomanada(); amb null o en web, no pinta cap node al DOM.'],
        ['estatDeVersio({ plataforma, config, versio, port })', "'bloquejada' | 'recomanada' | null", '—', 'Una sola consulta al port neutral: bloqueja amb CalActualitzar només quan versio < versioMinima, i activa l’avís suau quan versio >= versioMinima i versioRecomanada > versio.'],
        ['descartaActualitzacioRecomanada(versio)', 'boolean', '—', 'Recorda la versió ajornada amb storage.js: la barra no torna a eixir fins que es publique una versioRecomanada més alta.']
      ]}
      a11y={[
        'Regió identificada (role="region") amb nom accessible traduït a les cinc llengües del sistema.',
        'Contrast WCAG AAA (≥ 7:1) tant en mode clar com en mode fosc, sense ombres decoratives.',
        'Els dos botons («Actualitza…» i «Més tard») tenen àrea tàctil mínima de 48 × 48 px i text centrat.'
      ]}
      fes={[
        'Reservar CalActualitzar (bloqueig total) només per a trencaments incompatibles de contracte (versioMinima).',
        'Usar versioRecomanada per a avisar amb trellat de noves versions sense tallar el pas a qui té pressa o mala cobertura.'
      ]}
      noFacis={[
        'Obrir una finestra modal bloquejant en carregar la pàgina quan la versió instal·lada encara funciona.',
        'Puntar esta barra a la web o a la PWA, que ja s’actualitzen soles en carregar el nou paquet.'
      ]}
    >
      <h4>Android · canal Google Play (interactiva)</h4>
      {ajornada ? (
        <div className="sdp-accions">
          <button
            type="button"
            className="sdp-boto sdp-boto--secundari"
            onClick={() => { setAjornada(false); setUltimaAccio(''); }}
          >
            Torna a mostrar la barra d’exemple
          </button>
        </div>
      ) : (
        <BarraActualitzacioRecomanada
          mostra={MOSTRA_ANDROID}
          t={T_CA}
          onActualitza={(avis) => setUltimaAccio(`Obriria: ${avis.marketUrl} (reserva HTTPS: ${avis.enllac})`)}
          onDescarta={() => { setAjornada(true); setUltimaAccio('Avís ajornat per a la versió 6.'); }}
        />
      )}
      {ultimaAccio ? <p role="status">{ultimaAccio}</p> : null}

      <h4>iPhone i iPad · canal App Store</h4>
      <BarraActualitzacioRecomanada
        mostra={MOSTRA_IOS}
        t={T_CA}
        onActualitza={(avis) => setUltimaAccio(`Obriria: ${avis.enllac}`)}
        onDescarta={() => setUltimaAccio('Avís d’iOS ajornat en la mostra.')}
      />
    </Especimen>
  );
}
