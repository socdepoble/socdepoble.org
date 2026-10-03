/**
 * PanellSentinelles.jsx — els set sentinelles d'autonomia, a la vista del Mestre.
 *
 * Dues parts. A dalt, la mateixa porta d'aprovació dels tractors
 * (PanellTractors amb el catàleg dels sentinelles): el Mestre hi llig la
 * fitxa i aprova la versió exacta de cada sentinella (lliçó 261002:
 * aprovació explícita al frontend). A baix, per a cada sentinella aprovat,
 * el selector de fitxers i l'eixida: banderes i informe. executaSentinella
 * torna a exigir l'aprovació abans d'observar, encara que el panell diga
 * «aprovat».
 *
 * Les dues parts comparteixen magatzem: magatzemAmbAvis l'embolcalla perquè
 * una aprovació o una revocació feta a dalt refresque l'estat de baix. Les
 * proves injecten magatzem, subtle, catàleg, entorn i rellotge.
 *
 * La Clàusula dels Slugs: el sentinella triat viu a la URL (?sentinella=
 * consol-vendes, l'id sense el prefix), al costat de l'?item= de la Wiki.
 * Un enllaç copiat obri el mateix sentinella, i arrere i avant el recorren.
 * Cal muntar-lo dins del router propi (RouterContext), com fa la Wiki.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { useSearchParams } from '../../app/contexts/RouterContext';
import { Insignia } from '../../components/PedraSeca/atoms/Insignia.jsx';
import { Carregant } from '../../components/PedraSeca/atoms/estats.jsx';
import { Alerta } from '../../components/PedraSeca/molecules/Alerta.jsx';
import { Camp, CampText } from '../../components/PedraSeca/organismes/formulari.jsx';
import { textError } from './DialegAprovacio.jsx';
import PanellTractors from './PanellTractors.jsx';
import { SENTINELLES, TRACTORS_SENTINELLES } from './registreSentinelles.js';
import { executaSentinella } from './sentinelles/executa.js';
import { contextAprovacio, magatzemTractors, useTractors } from './useTractors.js';

const APROVACIO = Object.freeze({
  aprovat: { to: 'exit', text: 'Aprovat' },
  incomplet: { to: 'neutre', text: 'Incomplet' },
  error: { to: 'error', text: 'Sense empremta' },
  pendent: { to: 'avis', text: 'Sense aprovar' }
});
const BANDERA = Object.freeze({
  roja: { to: 'error', text: 'Bandera roja' },
  groga: { to: 'avis', text: 'Bandera groga' },
  cap: { to: 'exit', text: 'Sense banderes' }
});
const SEVERITAT = Object.freeze({
  roja: { to: 'error', text: 'Roja' },
  groga: { to: 'avis', text: 'Groga' },
  info: { to: 'info', text: 'Info' }
});
const DISPARADORS = Object.freeze({
  'arrencada-sessio': 'En arrencar la sessió',
  'pre-commit': 'Al pre-commit',
  'obrir-tauler': 'En obrir el Tauler',
  carpeta: 'En triar una carpeta',
  'tancament-torn': 'En tancar el torn',
  manual: 'A mà'
});
const SUPERFICIES = Object.freeze({
  'tauler-inici': 'Tauler d’Inici',
  departament: 'Departament de l’App Grid Shell',
  consola: 'Consola'
});
const NIVELLS = Object.freeze({
  L0: 'L0 · diagnostica i proposa; mai aplica, esborra, envia ni paga',
  L1: 'L1 · prepara un esborrany',
  L2: 'L2 · aplica després de la porta humana'
});
const TEXTOS_ERROR = Object.freeze({
  CONTRACTE_INVALID: 'Este sentinella no complix el contracte: no s’executa.',
  NIVELL_NO_EXECUTABLE: 'Este carril només executa sentinelles que observen (L0).',
  PARAMETRES_INVALIDS: 'Falten dades per a observar: no s’ha observat res.',
  ENTRADA_INVALIDA: 'Els fitxers triats no es poden llegir: no s’ha observat res.',
  ERROR_INTERN: 'El sentinella s’ha aturat sense acabar: no s’ha escrit ni enviat res.',
  EIXIDA_INVALIDA: 'L’eixida del sentinella no complix el contracte: no es mostra.'
});

/* { titol, detall }: els errors dels sentinelles amb paraules; la resta, com la porta. */
export function textErrorSentinella(error) {
  const titol = error?.name === 'ErrorSentinella' ? TEXTOS_ERROR[error.codi] : undefined;
  if (!titol) return textError(error);
  const detall = typeof error.message === 'string' ? error.message.trim() : '';
  return { titol, detall: detall && detall !== titol ? detall : '' };
}

/* El mateix magatzem, i un avís després de cada escriptura (aprovar, revocar, oblidar). */
export function magatzemAmbAvis(magatzem, avisa) {
  const notifica = () => {
    try {
      avisa();
    } catch {
      /* un avís que falla no desfà l'escriptura: el panell es refresca la pròxima vegada */
    }
  };
  const escriu = (nom) => async (...args) => {
    const resultat = await magatzem[nom](...args);
    notifica();
    return resultat;
  };
  return {
    get tipus() {
      return magatzem.tipus;
    },
    get persistent() {
      return magatzem.persistent;
    },
    registres: (...args) => magatzem.registres(...args),
    claus: (...args) => magatzem.claus(...args),
    exporta: (...args) => magatzem.exporta(...args),
    afegixRegistre: escriu('afegixRegistre'),
    afegixClau: escriu('afegixClau'),
    esborraTot: escriu('esborraTot'),
    tanca: () => magatzem.tanca?.()
  };
}

/* La clau de la URL i el slug d'un sentinella: l'id sense «sentinella.». */
export const CLAU_SENTINELLA = 'sentinella';
export const slugDeSentinella = (id) => String(id ?? '').replace(/^sentinella\./, '');

const superficieDe = (s) =>(s.tipus === 'departament' ? `${SUPERFICIES[s.tipus]}: ${s.departaments.join(', ')}` : SUPERFICIES[s.tipus] ?? s.tipus);
const eixidaDe = (eixida) => eixida.map((e) => (e === 'bandera' ? 'bandera groga o roja' : 'informe en text')).join(' i ');

function Eixida({ eixida }) {
  const id = useId();
  const bandera = BANDERA[eixida.bandera] ?? BANDERA.cap;
  return (
    <section aria-labelledby={id}>
      <div className="sdp-tractors-panell__cap">
        <h4 id={id} className="sdp-tractors-panell__subtitol">Eixida</h4>
        <Insignia to={bandera.to}>{bandera.text}</Insignia>
      </div>
      <p className="sdp-tractors-panell__motiu">
        {`${eixida.resum.roja} roges, ${eixida.resum.groga} grogues i ${eixida.resum.info} informatives.`}
      </p>
      {eixida.avisos.length ? (
        <ul className="sdp-tractors-panell__historial" aria-label="Avisos">
          {eixida.avisos.map((a, i) => (
            <li key={`${a.codi}-${i}`}>
              <Insignia to={SEVERITAT[a.severitat].to}>{SEVERITAT[a.severitat].text}</Insignia>
              {` ${a.missatge} `}
              <code>{a.font}</code>
            </li>
          ))}
        </ul>
      ) : <p>Cap avís.</p>}
      {eixida.informe ? <pre className="sdp-tractors-panell__codi">{eixida.informe}</pre> : null}
    </section>
  );
}

export default function PanellSentinelles({
  magatzem, subtle, sentinelles = SENTINELLES, tractors = TRACTORS_SENTINELLES, entorn = globalThis, rellotge = Date.now
}) {
  const refresca = useRef(null);
  const [desti] = useState(() => magatzemAmbAvis(magatzem ?? magatzemTractors(), () => refresca.current?.()));
  const porta = useTractors({ magatzem: desti, subtle, tractors, entorn, rellotge });
  const [consulta, setConsulta] = useSearchParams();
  /* L'estat d'una observació porta l'id del seu sentinella: si la URL en tria un altre
     (un clic, arrere o avant), el de l'anterior no es mostra. */
  const [ocupat, setOcupat] = useState(null);
  const [error, setError] = useState(null);
  const [eixida, setEixida] = useState(null);
  const torn = useRef(0);
  const idTitol = useId();
  const idNom = useId();

  useEffect(() => {
    refresca.current = porta.recarrega;
  }, [porta.recarrega]);

  const slug = consulta.get(CLAU_SENTINELLA);
  const triat = sentinelles.find((s) => slugDeSentinella(s.id) === slug) ?? sentinelles[0] ?? null;
  const estatDe = (id) => porta.tractors.find((t) => t.id === id)?.estat ?? 'pendent';
  const insigniaDe = (id) => APROVACIO[estatDe(id)] ?? APROVACIO.pendent;
  const aprovat = triat !== null && estatDe(triat.id) === 'aprovat';
  const delTriat = (estat) => (estat !== null && triat !== null && estat.id === triat.id ? estat.valor : null);
  const errorTriat = delTriat(error);
  const eixidaTriada = delTriat(eixida);
  const ocupatTriat = ocupat !== null && triat !== null && ocupat === triat.id;

  /* Cada tria és una entrada nova de l'historial: arrere torna al sentinella anterior. */
  function tria(id) {
    torn.current += 1;
    setError(null);
    setEixida(null);
    setOcupat(null);
    if (id !== triat?.id) setConsulta({ [CLAU_SENTINELLA]: slugDeSentinella(id) }, { replace: false });
  }

  /* Llig en memòria els fitxers triats i els passa al corredor, que exigix l'aprovació abans de res. */
  async function observa(event) {
    const input = event.target;
    const llista = [...(input.files ?? [])];
    if (!llista.length || !triat) return;
    const sentinella = triat;
    const meu = ++torn.current;
    setOcupat(sentinella.id);
    setError(null);
    setEixida(null);
    try {
      const fitxers = await Promise.all(llista.map(async (f) => ({
        nom: f.name, mida: f.size, tipus: f.type, bytes: new Uint8Array(await f.arrayBuffer())
      })));
      const aprovacio = await contextAprovacio(sentinella.id, { magatzem: desti, subtle, tractors, entorn, rellotge });
      const resultat = await executaSentinella({ sentinella, fitxers, aprovacio, subtle, ara: rellotge() });
      if (meu === torn.current) setEixida({ id: sentinella.id, valor: resultat });
    } catch (e) {
      if (meu === torn.current) setError({ id: sentinella.id, valor: textErrorSentinella(e) });
    } finally {
      if (meu === torn.current) setOcupat(null);
      input.value = '';
    }
  }

  return (
    <>
      <PanellTractors magatzem={desti} subtle={subtle} tractors={tractors} entorn={entorn} rellotge={rellotge} />
      <section className="sdp-tractors-panell" aria-labelledby={idTitol}>
        <h2 id={idTitol} className="sdp-tractors-panell__titol">Sentinelles: què observen</h2>
        <p>
          Un sentinella és un tractor que només observa: llig el que tries, alça banderes i proposa. No aplica, no
          esborra, no envia i no paga res. Abans d’observar comprova que n’has aprovat la versió exacta a la porta de dalt.
        </p>
        {porta.error ? <Alerta to="error">{porta.error}</Alerta> : null}
        {porta.carregant ? <Carregant etiqueta="Comprovant les aprovacions…" /> : null}
        {!porta.carregant && !triat ? <p>No hi ha cap sentinella registrat.</p> : null}

        {!porta.carregant && triat ? (
          <div className="sdp-tractors-panell__cos">
            <ul className="sdp-tractors-panell__llista" aria-label="Sentinelles">
              {sentinelles.map((s) => (
                <li key={s.id}>
                  <button type="button" className="sdp-tractors-panell__tria"
                    aria-current={s.id === triat.id ? 'true' : undefined} onClick={() => tria(s.id)}>
                    <span className="sdp-tractors-panell__tria-nom">{s.nom}</span>
                    <Insignia to={insigniaDe(s.id).to}>{insigniaDe(s.id).text}</Insignia>
                  </button>
                </li>
              ))}
            </ul>

            <article className="sdp-tractors-panell__detall" aria-labelledby={idNom}>
              <div className="sdp-tractors-panell__cap">
                <h3 id={idNom} className="sdp-tractors-panell__nom">{triat.nom}</h3>
                <Insignia to={insigniaDe(triat.id).to}>{insigniaDe(triat.id).text}</Insignia>
              </div>
              <p>{triat.descripcio}</p>
              <dl className="sdp-tractors-panell__dades">
                <div>
                  <dt>Disparador</dt>
                  <dd>
                    <ul>
                      {triat.disparador.map((d, i) => <li key={`${d.tipus}-${i}`}>{`${DISPARADORS[d.tipus] ?? d.tipus}: ${d.detall}`}</li>)}
                    </ul>
                  </dd>
                </div>
                <div><dt>Superfície</dt><dd>{superficieDe(triat.superficie)}</dd></div>
                <div><dt>Nivell</dt><dd>{NIVELLS[triat.nivell] ?? triat.nivell}</dd></div>
                <div><dt>Eixida</dt><dd>{eixidaDe(triat.eixida)}</dd></div>
                <div><dt>Porta humana</dt><dd>{triat.portaHumana}</dd></div>
              </dl>

              {aprovat ? (
                <Camp etiqueta={triat.entrada.etiqueta} ajuda={triat.entrada.ajuda}>
                  <CampText key={triat.id} tipus="file" accept={triat.entrada.accepta} multiple={triat.entrada.multiple}
                    disabled={ocupatTriat} onChange={observa} />
                </Camp>
              ) : (
                <Alerta to="info" viva={false} titol="Cal aprovar-lo abans d’observar">
                  Aprova «{triat.nom}» a la porta d’aprovació de dalt: fins aleshores no llig res.
                </Alerta>
              )}
              {ocupatTriat ? <Carregant etiqueta="Observant…" /> : null}
              {errorTriat ? <Alerta to="error" titol={errorTriat.titol}>{errorTriat.detall || null}</Alerta> : null}
              {aprovat && eixidaTriada ? <Eixida eixida={eixidaTriada} /> : null}
            </article>
          </div>
        ) : null}
      </section>
    </>
  );
}
