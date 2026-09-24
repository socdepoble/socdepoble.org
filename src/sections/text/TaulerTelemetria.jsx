import { useEffect, useId, useState } from 'react';
import { Alerta, EstatBuit, Interruptor } from '../../components/PedraSeca';
import {
  CLAU_APAGADA, ESDEVENIMENT_DOM, configTelemetria, darrersEnviaments,
  estableixTelemetriaApagada, telemetriaApagada
} from '../../data/telemetria.js';

/*
 * Tauler de Telemetria de /legal (Transparència Radical, pla 260924_1850 §4).
 * TextSection el pinta davall del text legal, que no toca: eixe text té la
 * seua pròpia aprovació.
 *
 * Quatre peces, i cap xifra calculada ací:
 *   1. Què es compta i què no. Cada frase descriu el que fa HUI
 *      data/telemetria.js (el `payload` d'`envia`); si canvia el contracte,
 *      canvia esta llista.
 *   2. L'interruptor d'este navegador. La tria local i el senyal del navegador
 *      (DNT/GPC) es distingixen: el segon no es pot desfer des d'ací.
 *   3. El tauler públic d'Umami, en un iframe aïllat, només si el node té
 *      VITE_UMAMI_SHARE_URL. Sense enllaç, un estat buit honest.
 *   4. El que ha eixit d'este navegador: darrersEnviaments(), refrescat amb
 *      l'esdeveniment sdp:telemetria. Així es comprova «Connectar» sense backend.
 *
 * `config` s'injecta en les proves; en l'app és la configuració de compilació.
 */

const CONFIG_COMPILADA = configTelemetria();

/* Motius de telemetria.js en paraules de plaça. */
const MOTIUS = {
  umami: 'Enviat al comptador.',
  amfitrio: 'Passat al comptador de la pàgina amfitriona.',
  apagada: "No s'ha enviat: la telemetria està apagada en este navegador.",
  'sense-configurar': "No s'ha enviat: el comptador no està configurat.",
  'amfitrio-compta-visites': "No s'ha enviat: la pàgina amfitriona ja compta les visites.",
  'error-amfitrio': "No s'ha enviat: el comptador de la pàgina amfitriona ha fallat.",
  encastada: "No s'ha enviat: Sóc de Poble està dins de la pàgina d'un altre, i allí mana la seua política.",
  'sense-fetch': "No s'ha enviat: este navegador no pot fer la petició.",
  'error-xarxa': "No s'ha enviat: la connexió ha fallat.",
  'sense-navegador': "No s'ha enviat: no hi havia navegador."
};

function estatEnParaules({ enviat, motiu }) {
  return MOTIUS[motiu] || (enviat ? 'Enviat.' : `No s'ha enviat (${motiu || 'motiu desconegut'}).`);
}

/* La mateixa lectura que telemetriaApagada() (data/telemetria.js:63-64). El
   contracte no l'exporta a banda, i ací cal separar-la de la tria local per a
   dir la veritat: el senyal del navegador no el pot desfer este interruptor. */
function senyalDelNavegador() {
  try {
    const nav = window.navigator || {};
    if (nav.globalPrivacyControl === true) return 'Global Privacy Control';
    if (nav.doNotTrack === '1' || window.doNotTrack === '1') return 'Do Not Track';
  } catch { /* navegador sense eixes propietats */ }
  return null;
}

function triaLocal() {
  try { return Boolean(window.localStorage.getItem(CLAU_APAGADA)); } catch { return false; }
}

function llegixPreferencia() {
  return { apagada: telemetriaApagada(), senyal: senyalDelNavegador(), local: triaLocal() };
}

function hora(moment) {
  const data = new Date(moment);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function dadesEnText(dades) {
  return Object.entries(dades).map(([clau, valor]) => `${clau}: ${valor}`).join(' · ');
}

function servidorDe(url) {
  try { return new URL(url).host; } catch { return ''; }
}

export default function TaulerTelemetria({ config = CONFIG_COMPILADA }) {
  const id = useId();
  const [preferencia, setPreferencia] = useState(llegixPreferencia);
  const [triaFallida, setTriaFallida] = useState(false);
  const [enviaments, setEnviaments] = useState(darrersEnviaments);

  useEffect(() => {
    const refresca = () => setEnviaments(darrersEnviaments());
    window.addEventListener(ESDEVENIMENT_DOM, refresca);
    refresca(); // el que haja arribat entre el primer pintat i l'escolta
    return () => window.removeEventListener(ESDEVENIMENT_DOM, refresca);
  }, []);

  const canviaTria = (encesa) => {
    setTriaFallida(!estableixTelemetriaApagada(!encesa));
    setPreferencia(llegixPreferencia());
  };

  return (
    <section className="sdp-telemetria" aria-labelledby={`${id}-titol`}>
      <h3 id={`${id}-titol`}>Telemetria: què comptem i com ho pots comprovar</h3>
      <p>
        Sóc de Poble compta les visites i l'acte de «Connectar» amb un comptador Umami. Per a comptar no
        carreguem cap programa de fora: el missatge l'envia el codi de la mateixa aplicació, i més avall
        pots vore cada intent que ha eixit, o no, del teu navegador.
      </p>

      <h4>Què es compta i què no</h4>
      <ul className="sdp-telemetria__punts">
        <li>
          <strong>Les visites</strong>, per ruta: sense res del que va darrere de «?» o de «#», i amb un
          asterisc en lloc de la part que identifica una fitxa, un perfil o un fil (<code>/perfil/*</code>).
        </li>
        <li>
          <strong>Quan prems «Connectar»</strong>: l'acte, la secció on eres, si ho has fet des d'una
          targeta o des d'una pàgina (i si era una previsualització), i la ruta tapada igual que les
          visites. Quan després confirmes on el guardes, es compta el destí triat (notes, xat…) i si és
          privat o públic.
        </li>
        <li>
          <strong>Amb cada compte viatja també</strong> el domini de la web, l'idioma del navegador, la mida
          de la pantalla i, només en la primera visita, el domini de la web d'on vens (mai la pàgina
          concreta). El títol de la pestanya no viatja: en una fitxa porta el títol del que mires.
        </li>
        <li>
          <strong>Cap galeta</strong> i cap identificador guardat al teu navegador. Com en qualsevol
          connexió a internet, el servidor del comptador veu la teua adreça IP i el tipus de navegador.
        </li>
        <li>
          <strong>Es respecten Do Not Track i Global Privacy Control</strong>: si el teu navegador en porta
          algun d'encés, no s'envia res.
        </li>
      </ul>

      <h4>Apagar-la en este navegador</h4>
      <Interruptor
        etiqueta="Comptar les meues visites des d'este navegador"
        actiu={!preferencia.apagada}
        desactivat={Boolean(preferencia.senyal)}
        onCanvi={canviaTria}
      />
      {preferencia.senyal ? (
        <Alerta to="info">
          El teu navegador envia el senyal {preferencia.senyal} i el respectem: no s'envia res. Este
          interruptor no el pot desfer; es canvia als ajustos del navegador.
        </Alerta>
      ) : (
        <p className="sdp-telemetria__nota">
          {preferencia.local ? 'Apagada per tu. La tria es guarda' : "Encesa. Si l'apagues, la tria es guardarà"}
          {' '}només en este navegador, en l'emmagatzematge local amb la clau{' '}
          <code>{CLAU_APAGADA}</code>, la mateixa que respecta Umami.
        </p>
      )}
      {triaFallida ? (
        <Alerta to="error">
          No s'ha pogut guardar la tria: este navegador no deixa escriure en l'emmagatzematge local.
        </Alerta>
      ) : null}
      {config.actiu ? null : (
        <p className="sdp-telemetria__nota">
          Este node encara no té cap comptador propi configurat: ara com ara no s'envia res a cap
          comptador de Sóc de Poble.
        </p>
      )}

      <h4>Tauler públic</h4>
      {config.shareUrl ? (
        <>
          <iframe
            className="sdp-telemetria__tauler"
            src={config.shareUrl}
            title="Tauler públic de visites de Sóc de Poble, servit per Umami"
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin"
          />
          <p className="sdp-telemetria__nota">
            Les xifres les servix directament el comptador ({servidorDe(config.shareUrl)}): esta pàgina no
            en calcula ni en guarda cap. Quan el tauler es mostra, el teu navegador es connecta a eixe
            servidor, que veu la teua adreça IP.{' '}
            <a href={config.shareUrl} target="_blank" rel="noopener noreferrer">Obri el tauler en una pestanya nova</a>.
          </p>
        </>
      ) : (
        <EstatBuit titol="El tauler públic encara no està endollat">
          Quan este node tinga un comptador amb enllaç públic, les xifres es veuran ací, servides pel mateix
          comptador. Fins aleshores no n'hi ha cap: no en posem d'inventades.
        </EstatBuit>
      )}

      <h4>El que ha enviat este navegador</h4>
      <p className="sdp-telemetria__nota">
        Cada intent de comptar des que has obert esta pestanya, enviat o no, del més recent al més antic
        (fins a 20). «Enviat» vol dir que ha eixit del navegador: el comptador no en torna confirmació. La
        llista viu només en la memòria d'esta pestanya.
      </p>
      {enviaments.length ? (
        <ol className="sdp-telemetria__llista">
          {enviaments.map((intent, i) => (
            <li key={`${intent.moment}-${intent.tipus}-${intent.nom}-${intent.url}-${i}`} className="sdp-telemetria__intent">
              <p className="sdp-telemetria__cap">
                <span className="sdp-telemetria__nom">{intent.nom || 'visita'}</span>
                <time className="sdp-telemetria__moment" dateTime={intent.moment}>{hora(intent.moment)}</time>
              </p>
              <code className="sdp-telemetria__ruta">{intent.url}</code>
              {intent.dades ? <p className="sdp-telemetria__dades">{dadesEnText(intent.dades)}</p> : null}
              <p className="sdp-telemetria__estat">{estatEnParaules(intent)}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="sdp-telemetria__nota">Encara no s'ha intentat comptar res en esta pestanya.</p>
      )}
    </section>
  );
}
