import { getPreferenciaLlegat } from '../../config/storage.js';
import { useEffect, useId, useRef, useState } from 'react';
import { Alerta, Carregant, EstatBuit, Interruptor, QuadreDeComandament } from '../../components/PedraSeca';
import {
  CLAU_APAGADA, ESDEVENIMENT_DOM, configTelemetria, darrersEnviaments,
  estableixTelemetriaApagada, telemetriaApagada
} from '../../data/telemetria.js';
import {
  TEMPS_LIMIT_TAULER_MS,
  ZONA_HORARIA,
  basesDelTauler,
  carregaTauler,
  estatEnParaules,
  motiuDelTaulerEnParaules,
  nomDeLIntent,
  nomDeSeccio
} from './taulerTelemetriaModel.js';

/*
 * Tauler de Telemetria de /legal (Transparència Radical, pla 260924_1850 §4).
 * TextSection el pinta davall del text legal, que no toca: eixe text té la
 * seua pròpia aprovació.
 * Lògica pura i consulta d'Umami extretes a taulerTelemetriaModel.js (Onada R32.19)
 * perquè este mòdul JSX exporte exclusivament el component React (Fast Refresh pur).
 */

const CONFIG_COMPILADA = configTelemetria();

/* ─── Les xifres en paraules (format local; temps en minuts i segons) ─── */
const NOMBRE = new Intl.NumberFormat('ca-ES');
const PERCENTATGE = new Intl.NumberFormat('ca-ES', { style: 'percent', maximumFractionDigits: 0 });
const xifra = (valor) => NOMBRE.format(valor);
const ambUnitat = (valor, [una, moltes]) => `${xifra(valor)} ${valor === 1 ? una : moltes}`;
const ESPAI_DUR = String.fromCharCode(0xa0); // sense el caràcter en cru al codi

function tempsEnParaules(segons) {
  const total = Math.max(0, Math.round(segons));
  const minuts = Math.floor(total / 60);
  const resta = total % 60;
  /* Espais durs dins de cada parella: en una targeta estreta es parteix
     entre «20 min» i «25 s», mai davant de la unitat. */
  if (!minuts) return { curt: `${resta}${ESPAI_DUR}s`, llarg: ambUnitat(resta, ['segon', 'segons']) };
  return {
    curt: `${xifra(minuts)}${ESPAI_DUR}min ${resta}${ESPAI_DUR}s`,
    llarg: `${ambUnitat(minuts, ['minut', 'minuts'])} i ${ambUnitat(resta, ['segon', 'segons'])}`
  };
}

function horaDelTauler(instant) {
  try {
    return new Date(instant).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit', timeZone: ZONA_HORARIA });
  } catch { return ''; }
}

const SENSE_VISITES = 'sense cap visita encara';

function targetesDe(dades) {
  const temps = dades.tempsMitja === null ? null : tempsEnParaules(dades.tempsMitja);
  return [
    {
      clau: 'visitants', nom: 'Visitants', valor: xifra(dades.visitants),
      pista: "navegadors diferents que han entrat (el mòbil i l'ordinador d'una mateixa persona en són dos)."
    },
    {
      clau: 'visites', nom: 'Visites', valor: xifra(dades.visites),
      pista: 'voltes que algú ha entrat. En una visita es poden obrir moltes pàgines.'
    },
    {
      clau: 'vistes', nom: 'Vistes', valor: xifra(dades.vistes),
      pista: 'pàgines obertes en total, sumant totes les visites.'
    },
    {
      clau: 'rebot', nom: 'Percentatge de rebot',
      valor: dades.rebot === null ? '—' : PERCENTATGE.format(dades.rebot),
      lector: dades.rebot === null ? SENSE_VISITES : null,
      pista: "visites que només han obert una pàgina i se n'han anat."
    },
    {
      clau: 'temps', nom: 'Temps mitjà de visita',
      valor: temps ? temps.curt : '—',
      lector: temps ? temps.llarg : SENSE_VISITES,
      pista: 'el que dura, de mitjana, cada visita.'
    }
  ];
}

function graficaDe(hores) {
  if (!hores) {
    return { titol: 'Vistes de cada hora, les últimes 24 hores (hora peninsular)', punts: null, falta: 'El comptador no ha tornat les vistes per hores.' };
  }
  const ambVisitants = hores.every((hora) => hora.visitants !== null);
  const series = ambVisitants
    ? [{ clau: 'visitants', nom: 'Visitants' }, { clau: 'vistes', nom: 'Vistes' }]
    : [{ clau: 'vistes', nom: 'Vistes' }];
  return {
    titol: `${ambVisitants ? 'Visitants i vistes' : 'Vistes'} de cada hora, les últimes 24 hores (hora peninsular)`,
    series,
    punts: hores.map(({ id, etiqueta, marca, vistes, visitants }) => ({ id, etiqueta, marca, valors: { vistes, visitants } })),
    destacat: hores[hores.length - 1]?.id ?? null,
    detall: ({ etiqueta, valors }) => [
      `${etiqueta}: ${ambUnitat(valors.vistes, ['vista', 'vistes'])}`,
      ...(ambVisitants ? [ambUnitat(valors.visitants, ['visitant', 'visitants'])] : [])
    ].join(' · '),
    buit: 'Cap vista en les últimes 24 hores.'
  };
}

function ranquingDe({ seccions, rutesAmagades = 0 }) {
  const maxim = Math.max(0, ...(seccions || []).map((seccio) => seccio.visitants));
  const files = seccions === null ? null : [
    ...seccions.map(({ ruta, visitants }, i) => ({
      clau: `${ruta}-${i}`,
      nom: nomDeSeccio(ruta),
      codi: ruta,
      valor: ambUnitat(visitants, ['visitant', 'visitants']),
      proporcio: maxim > 0 ? visitants / maxim : 0
    })),
    ...(rutesAmagades
      ? [{ clau: 'altres', nom: 'Altres adreces, que no mostrem', valor: ambUnitat(rutesAmagades, ['adreça', 'adreces']) }]
      : [])
  ];
  return {
    titol: 'Les seccions més visitades',
    intro: "Quants visitants diferents han passat per cada part de Sóc de Poble. Només s'hi mostren adreces de Sóc de Poble i tapades: mai diuen quina fitxa, nota o fil.",
    files,
    falta: 'El comptador no ha tornat la llista de seccions.',
    buit: 'Cap secció visitada en les últimes 24 hores.',
    nota: rutesAmagades && files ? (
      <p>
        Les «altres adreces»: el comptador és públic i qualsevol li pot enviar adreces. Estes no són rutes de
        Sóc de Poble que sapiem nomenar, o dirien de qui és una fitxa: per això no les copiem ací.
      </p>
    ) : null
  };
}

function TaulerNadiu({ dades, shareUrl }) {
  const targetes = targetesDe(dades);
  return (
    <QuadreDeComandament
      nivell={5}
      estat={{
        viu: dades.enLinia !== null && dades.enLinia > 0,
        text: dades.enLinia === null
          ? 'En línia ara mateix: el comptador no ho ha dit'
          : <>En línia ara mateix: <strong>{ambUnitat(dades.enLinia, ['persona', 'persones'])}</strong></>
      }}
      periode={`Les xifres de les últimes 24 hores, fins a les ${horaDelTauler(dades.fins)} (hora peninsular).`}
      xifres={targetes.map(({ clau, nom, valor, lector }) => ({ clau, nom, valor, lector }))}
      explicacio={(
        <ul className="sdp-telemetria__punts">
          {targetes.map(({ clau, nom, pista }) => <li key={clau}><strong>{nom}</strong>: {pista}</li>)}
        </ul>
      )}
      grafica={graficaDe(dades.hores)}
      ranquing={ranquingDe(dades)}
      peu={(
        <p className="sdp-telemetria__nota">
          Les xifres les servix el comptador públic ({servidorDe(shareUrl)}). Esta pàgina només les
          ordena, calcula el rebot i el temps mitjà amb les fórmules del tauler original, i no en guarda
          cap. Per a demanar-les, el teu navegador s'hi ha connectat sense galetes ni cap dada teua, i eixe
          servidor veu la teua adreça IP, com en qualsevol connexió.{' '}
          <a href={shareUrl} target="_blank" rel="noopener noreferrer">Obri el tauler original en una pestanya nova</a>
        </p>
      )}
    />
  );
}

function fetchDelNavegador() {
  return typeof window !== 'undefined' && typeof window.fetch === 'function'
    ? (...parametres) => window.fetch(...parametres)
    : null;
}

function sabMirarSiEsVeu() {
  return typeof window !== 'undefined' && typeof window.IntersectionObserver === 'function';
}

function senyalDelNavegador() {
  try {
    const nav = window.navigator || {};
    if (nav.globalPrivacyControl === true) return 'Global Privacy Control';
    if (nav.doNotTrack === '1' || window.doNotTrack === '1') return 'Do Not Track';
  } catch { /* navegador sense eixes propietats */ }
  return null;
}

function triaLocal() {
  return Boolean(getPreferenciaLlegat(CLAU_APAGADA));
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

export default function TaulerTelemetria({
  config = CONFIG_COMPILADA, fetchTauler, tempsLimitTaulerMs = TEMPS_LIMIT_TAULER_MS, ara
}) {
  const id = useId();
  const seccioRef = useRef(null);
  const [preferencia, setPreferencia] = useState(llegixPreferencia);
  const [triaFallida, setTriaFallida] = useState(false);
  const [enviaments, setEnviaments] = useState(darrersEnviaments);
  const shareUrl = config.shareUrl;
  const adrecaTauler = shareUrl && basesDelTauler(shareUrl) ? shareUrl : '';
  /* La consulta al comptador espera que esta peça es veja: obrir /legal no
     connecta amb el comptador si no s'hi arriba. */
  const [aprop, setAprop] = useState(() => !sabMirarSiEsVeu());
  const [tauler, setTauler] = useState({ per: null, resultat: null });

  useEffect(() => {
    const refresca = () => setEnviaments(darrersEnviaments());
    window.addEventListener(ESDEVENIMENT_DOM, refresca);
    refresca();
    return () => window.removeEventListener(ESDEVENIMENT_DOM, refresca);
  }, []);

  useEffect(() => {
    if (aprop || !adrecaTauler || !seccioRef.current) return undefined;
    const observador = new window.IntersectionObserver((entrades) => {
      if (entrades.some((entrada) => entrada.isIntersecting)) {
        observador.disconnect();
        setAprop(true);
      }
    });
    observador.observe(seccioRef.current);
    return () => observador.disconnect();
  }, [aprop, adrecaTauler]);

  useEffect(() => {
    if (!aprop || !adrecaTauler) return undefined;
    let viu = true;
    const desmunta = typeof AbortController === 'function' ? new AbortController() : null;
    carregaTauler(shareUrl, {
      fetch: fetchTauler || fetchDelNavegador(),
      tempsLimitMs: tempsLimitTaulerMs,
      signal: desmunta?.signal,
      ara
    }).then((resultat) => { if (viu) setTauler({ per: shareUrl, resultat }); });
    return () => { viu = false; desmunta?.abort(); };
  }, [aprop, adrecaTauler, shareUrl, fetchTauler, tempsLimitTaulerMs, ara]);

  let estatTauler = 'carregant';
  if (!shareUrl) estatTauler = 'sense-enllac';
  else if (!adrecaTauler) estatTauler = 'fallada';
  else if (tauler.per === shareUrl) estatTauler = tauler.resultat?.estat === 'dades' ? 'dades' : 'fallada';
  const motiuTauler = adrecaTauler ? (tauler.resultat || {}) : { motiu: 'enllac-no-compartit' };

  const canviaTria = (encesa) => {
    setTriaFallida(!estableixTelemetriaApagada(!encesa));
    setPreferencia(llegixPreferencia());
  };

  return (
    <section ref={seccioRef} className="sdp-telemetria" aria-labelledby={`${id}-titol`}>
      <h3 id={`${id}-titol`}>Telemetria: què comptem i com ho pots comprovar</h3>
      <p>
        A <strong>Sóc de Poble</strong> comptem les visites i l'acte de «Connectar» amb un comptador <strong>Umami</strong>. Per a comptar <strong>no carreguem cap programa extern</strong> de rastreig comercial: el codi de la mateixa aplicació inicia la petició, i més avall pots vore en directe els intents de comptar d'este navegador.
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
          <strong>Cap galeta (zero cookies)</strong> i cap identificador guardat al teu navegador. Com en qualsevol
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
      <p className="sdp-telemetria__nota">
        <strong>Transparència radical:</strong> si les mètriques d'ús són col·lectives i respecten la privacitat, han de ser visibles per a tothom. Ací baix tens les xifres del comptador públic, sense entrar enlloc i sense cap compte.
      </p>
      {estatTauler === 'dades' ? <TaulerNadiu dades={tauler.resultat.dades} shareUrl={shareUrl} /> : null}
      {estatTauler === 'carregant' ? (
        <Carregant etiqueta="Demanant les xifres al comptador públic…" />
      ) : null}
      {estatTauler === 'fallada' ? (
        <EstatBuit titol="El tauler públic no està obert ara mateix">
          {motiuDelTaulerEnParaules(motiuTauler)} Per això no el mostrem: per a vore estes xifres mai et
          demanarem cap compte, cap contrasenya ni cap inici de sessió. Quan el comptador torne a tindre un
          enllaç públic, les xifres es veuran ací, servides per ell mateix; fins aleshores no en posem
          d'inventades.
          {adrecaTauler ? ` Ho ha comprovat el teu navegador preguntant a ${servidorDe(shareUrl)}, que veu la teua adreça IP com en qualsevol connexió.` : null}
        </EstatBuit>
      ) : null}
      {estatTauler === 'sense-enllac' ? (
        <EstatBuit titol="El tauler públic encara no està endollat">
          Quan este node tinga un comptador amb enllaç públic, les xifres es veuran ací, servides pel mateix
          comptador. Fins aleshores no n'hi ha cap: no en posem d'inventades.
        </EstatBuit>
      ) : null}

      <h4>Què s'ha apuntat de la teua visita d'hui (en directe)</h4>
      <p className="sdp-telemetria__nota">
        Ací baix pots comprovar, en directe, tot el que aquesta pestanya ha anotat mentre camines per Sóc de
        Poble (fins als últims 20 passos). Fixa't que només s'apunta a quina secció general has entrat (com
        ara «Disseny», «El Mur» o «Bloc de notes»), sense guardar mai qui eres, ni el teu correu, ni què has
        llegit o escrit dins. Si apagues l'interruptor de dalt, ací mateix veuràs que ja no s'envia res.
      </p>
      <p className="sdp-telemetria__nota">
        Una precisió honesta: esta llista diu el que este navegador ha intentat enviar, però no pot comprovar
        si el comptador ho ha registrat. I viu només en la memòria d'esta pestanya: quan la tanques, s'esborra.
      </p>
      {enviaments.length ? (
        <ol className="sdp-telemetria__llista">
          {enviaments.map((intent, i) => (
            <li
              key={`${intent.moment}-${intent.tipus}-${intent.nom}-${intent.url}-${i}`}
              className="sdp-telemetria__intent"
              data-verificacio={intent.verificacio || 'no_comprovat'}
            >
              <p className="sdp-telemetria__cap">
                <span className="sdp-telemetria__nom">{nomDeLIntent(intent)}</span>
                <time className="sdp-telemetria__moment" dateTime={intent.moment}>{hora(intent.moment)}</time>
              </p>
              <p className="sdp-telemetria__estat">{estatEnParaules(intent)}</p>
              <p className="sdp-telemetria__dades">
                Adreça tècnica: <code className="sdp-telemetria__ruta">{intent.url}</code>
              </p>
              {intent.dades ? (
                <p className="sdp-telemetria__dades">
                  Detall tècnic que l'acompanya: <span>{dadesEnText(intent.dades)}</span>
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="sdp-telemetria__nota">Encara no s'ha intentat comptar res en esta pestanya.</p>
      )}
    </section>
  );
}
