/**
 * PanellDeViquipedia.jsx · Fase 3a de l'eina de pobles nous (ordre nocturna
 * 261030_0252, Fase 3; disseny nit/viquipedia_disseny.md §4.4, §4.6 i §4.8) ·
 * A la pàgina d'un poble amb la fitxa incompleta, «Porta-ho de la
 * Viquipèdia». És l'ÚNIC lloc de l'app que crida pobleDeViquipedia(), i va en
 * un tros diferit (detailSectionMeta.jsx · renderBody, només si
 * pobleHidratable): el client de Wikimedia i l'algoritme no carreguen el tros
 * principal.
 *
 *   · Cap petició abans del clic (el patró de «Vore mapa», Legal §21).
 *   · Sense connexió, cap petició: el botó es desactiva i ho diu.
 *   · Un termini global de 20 s i un AbortController: desmuntar o canviar de
 *     poble ho avorta i no es desa res.
 *   · Només es desa una proposta 'complet' o 'parcial' del MATEIX poble
 *     (esDelMateixPoble) o un 'sense-article'; 'no-disponible' mai.
 *   · Les fotos de Commons només amb el sí de la persona
 *     (consentimentViquipedia.js), i només ací, amb els seus crèdits.
 *   · «Deixa de portar-ho de la Viquipèdia» hi és sempre que este navegador
 *     guarde alguna cosa d'este poble o hi haja un sí, també sense el sí
 *     d'esta visita, i esborra sense cap petició ni cap foto (Legal §20 i
 *     §21; Gauntlet 261030, cicle 3, viquipedia-oblit-inabastable-…).
 *   · Amb el teclat, el focus no es perd quan el botó premut desapareix, i
 *     l'èxit s'anuncia al lector de pantalla (vq-panell-focus-perdut-…).
 *   · «Deixa» espera que el disc confirme l'esborrat: l'èxit només s'anuncia
 *     confirmat i, si el disc no respon, «oblit pendent» amb un reintent; la
 *     fitxa continua sense les dades (auditoria matinal de Codex, MITJÀ-C3).
 * Res no s'escriu al servidor: la persistència és la Fase 3c (README de
 * l'adaptador).
 */
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react';
import { Alerta } from '../../components/PedraSeca/molecules/Alerta.jsx';
import { Boto } from '../../components/PedraSeca/atoms/Boto.jsx';
import { Casella } from '../../components/PedraSeca/organismes/formulari.jsx';
import { useUIStateOpcional } from '../../app/contexts/UIContext';
import { esAppNativa } from '../../config/origenPublic.js';
import { pobleDeViquipedia } from './pobleDeViquipedia.js';
import { cauDeViquipedia, esCaducada } from './cauDeViquipedia.js';
import { clauDeViquipedia, entradaAmbDades, esDelMateixPoble, fitxaOriginal } from './fitxaDelPoble.js';
import {
  consentimentActiu, consentimentRecordat, donaConsentiment, retiraConsentiment, subscriuConsentiment
} from './consentimentViquipedia.js';
import { CreditsDeViquipedia, LOCALE_PER_DEFECTE, traductorDeViquipedia } from './CreditsDeViquipedia.jsx';

/** El temps màxim de tota una consulta (el client fa 8 s per intent i fins a 3 reintents). */
export const TERMINI_MS = 20000;

const DESA = Object.freeze(['complet', 'parcial']);

/* Gauntlet 261030, cicle 3 (vq-data-credits-llengua-del-document) · La
   llengua de la interfície per a la data dels crèdits, amb el patró de TE-01
   (DetallPrivacitat.jsx · useLocaleDeLesDates): fora de l'App, o amb un doble
   de UIContext que no porta el ganxo, la de per defecte. */
function useLocaleDeLaInterficie() {
  try {
    return useUIStateOpcional()?.locale || LOCALE_PER_DEFECTE;
  } catch {
    return LOCALE_PER_DEFECTE;
  }
}

/* Cert si el focus s'ha perdut: a <body>, enlloc o en un node que ja no hi
   és. Dins d'un Shadow DOM, l'arrel no té actiu si el focus és fora; aleshores
   mana el del document. Si la persona l'ha portat a un altre lloc, no es toca. */
function focusPerdut(node) {
  const arrel = node?.getRootNode?.();
  if (!arrel) return false;
  const actiu = arrel.activeElement ?? node.ownerDocument?.activeElement ?? null;
  return !actiu || !actiu.isConnected || actiu.tagName === 'BODY';
}

function subscriuConnexio(avisa) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('online', avisa);
  window.addEventListener('offline', avisa);
  return () => {
    window.removeEventListener('online', avisa);
    window.removeEventListener('offline', avisa);
  };
}
const enLinia = () => typeof navigator === 'undefined' || navigator.onLine !== false;

/**
 * El panell. `poble` és la fitxa que pinta la pàgina (potser ja hidratada:
 * se'n llig l'original). `llig` és el lector de Wikimedia (les proves en
 * passen un de fals); per defecte, el de client.js. `cau`, el mateix per a la
 * memòria cau (per defecte, la de l'app).
 */
export default function PanellDeViquipedia({ poble, t, llig, cau: cauDonada }) {
  const tx = traductorDeViquipedia(t);
  const idTitol = useId();
  const crua = fitxaOriginal(poble);
  const clau = clauDeViquipedia(crua);
  const cau = cauDonada ?? cauDeViquipedia();
  const entrada = useSyncExternalStore(cau.subscriu, () => (clau ? cau.entradaEnMemoria(clau) : null) ?? null);
  const oblitFallit = useSyncExternalStore(cau.subscriu, () => Boolean(clau) && cau.oblitFallit(clau), () => false);
  const ambSi = useSyncExternalStore(subscriuConsentiment, consentimentActiu, () => false);
  const recordat = useSyncExternalStore(subscriuConsentiment, consentimentRecordat, () => false);
  const connectat = useSyncExternalStore(subscriuConnexio, enLinia, () => true);
  const [fase, setFase] = useState('repos');
  const [recorda, setRecorda] = useState(false);
  const [anunci, setAnunci] = useState(null);
  const locale = useLocaleDeLaInterficie();
  const enCurs = useRef(null);
  const seccio = useRef(null);
  /* El botó on ha d'anar el focus quan acaba una acció ('deixa' o 'porta'). */
  const focusPendent = useRef(null);
  /* L'oblit en camí: si la persona fa una altra cosa abans que el disc
     responga, la seua resposta ja no s'anuncia. */
  const oblitEnCurs = useRef(null);

  /* Qui el munta li posa key={id del poble}: un altre poble és un panell nou. */
  useEffect(() => {
    if (clau) cau.llig(clau).catch(() => {});
    return () => {
      enCurs.current?.abort();
      enCurs.current = null;
    };
  }, [cau, clau]);

  /* Gauntlet 261030, cicle 3 (vq-panell-focus-perdut-i-exit-mut) · El botó
     premut pot desaparéixer («Porta-ho» dona pas a «Deixa», i a l'inrevés).
     Acabada l'acció, si el focus ha caigut a <body>, va al botó que la
     continua, sense moure la pàgina; si la persona l'ha posat en un altre
     lloc, no es toca. No s'enfoca cap títol: cap anell nou. */
  useEffect(() => {
    const desti = focusPendent.current;
    if (!desti || fase === 'portant') return;
    focusPendent.current = null;
    const node = seccio.current;
    if (!node || !focusPerdut(node)) return;
    const boto = node.querySelector(`[data-viquipedia="${desti}"]`) ?? node.querySelector('.sdp-accions button:not(:disabled)');
    boto?.focus({ preventScroll: true });
  });

  if (!clau || esAppNativa()) return null;

  async function consulta() {
    enCurs.current?.abort();
    oblitEnCurs.current = null;
    const controlador = new AbortController();
    enCurs.current = controlador;
    const rellotge = setTimeout(() => controlador.abort(), TERMINI_MS);
    setFase('portant');
    setAnunci(null);
    try {
      const dto = await pobleDeViquipedia(crua.title || crua.name, {
        provincia: crua.provincia || null,
        signal: controlador.signal,
        ...(llig ? { llig } : null)
      });
      if (enCurs.current !== controlador) return;
      const delPoble = DESA.includes(dto.estat) && esDelMateixPoble(crua, dto);
      if (!delPoble && dto.estat !== 'sense-article') {
        focusPendent.current = 'porta';
        setFase(DESA.includes(dto.estat) ? 'senseArticle' : 'noDisponible');
        return;
      }
      /* Gauntlet 261030, cicle 3 (vq-autor-commons-llarg-…) · Wikimedia ha
         respost: si la llista blanca de la cau rebutja la proposta, no és la
         xarxa, i el panell no ho pot dir com si ho fóra. */
      const desada = await cau.desa(clau, dto).then(() => true, () => false);
      if (enCurs.current !== controlador) return;
      focusPendent.current = desada && delPoble ? 'deixa' : 'porta';
      setFase(desada ? 'repos' : 'noValida');
      if (desada && delPoble) setAnunci('portat');
    } finally {
      clearTimeout(rellotge);
      if (enCurs.current === controlador) enCurs.current = null;
    }
  }

  function porta() {
    if (!enLinia()) {
      setFase('senseXarxa');
      return;
    }
    donaConsentiment({ recorda });
    setAnunci(null);
    oblitEnCurs.current = null;
    /* Amb una proposta fresca a la cau, el sí només hi afig les fotos: cap petició. */
    if (entradaAmbDades(entrada) && !esCaducada(entrada)) {
      focusPendent.current = 'deixa';
      setFase('repos');
      setAnunci('portat');
      return;
    }
    consulta().catch(() => setFase('noDisponible'));
  }

  /* Ni foto ni petició: oblida la proposta d'este poble i el sí. La fitxa
     les deixa de mostrar de seguida; el «Fet» espera el disc i, si falla, la
     cau ho diu (oblitFallit) i el panell ofereix el reintent. */
  function deixa() {
    enCurs.current?.abort();
    enCurs.current = null;
    focusPendent.current = 'porta';
    retiraConsentiment();
    setFase('repos');
    setAnunci(null);
    const oblit = cau.oblida(clau);
    oblitEnCurs.current = oblit;
    oblit.then((confirmat) => {
      if (oblitEnCurs.current === oblit && confirmat) setAnunci('deixat');
    }, () => {}).finally(() => {
      if (oblitEnCurs.current === oblit) oblitEnCurs.current = null;
    });
  }

  const ambDades = entradaAmbDades(entrada);
  const ambFotos = ambDades && ambSi;
  /* Qualsevol entrada a la cau ('complet', 'parcial' o 'sense-article',
     encara que el sí haja mort en recarregar) o un sí actiu: es pot oblidar. */
  const potOblidar = Boolean(entrada) || ambSi;
  const portant = fase === 'portant';
  const senseArticle = fase === 'senseArticle' || entrada?.dto?.estat === 'sense-article';
  const avis = oblitFallit ? <Alerta to="avis">{tx('oblitPendent')}</Alerta>
    : !connectat || fase === 'senseXarxa' ? <Alerta to="avis">{tx('senseXarxa')}</Alerta>
    : fase === 'noDisponible' ? <Alerta to="avis">{tx('noDisponible')}</Alerta>
      : fase === 'noValida' ? <Alerta to="avis">{tx('noValida')}</Alerta>
        : senseArticle && !portant ? <Alerta to="info">{tx('senseArticle')}</Alerta> : null;

  return (
    <section ref={seccio} className="sdp-prose" aria-labelledby={idTitol} aria-busy={portant || undefined}>
      <h3 id={idTitol}>{tx(ambDades ? 'creditsTitol' : 'titol')}</h3>
      {ambDades ? <CreditsDeViquipedia entrada={entrada} ambFotos={ambSi} t={t} locale={locale} /> : <p>{tx('explica')}</p>}
      {avis}
      {ambFotos ? null : (
        <>
          {ambDades ? <p>{tx('fotosAmbGest')}</p> : null}
          {recordat ? null : (
            <Casella etiqueta={tx('recorda')} checked={recorda} onChange={(event) => setRecorda(event.target.checked)} />
          )}
        </>
      )}
      <div className="sdp-accions">
        {!ambFotos ? (
          <Boto key="porta" data-viquipedia="porta" varietat="primari" carregant={portant} disabled={!connectat}
            onClick={porta}>{tx('porta')}</Boto>
        ) : esCaducada(entrada) ? (
          <Boto key="torna" data-viquipedia="torna" varietat="secundari" carregant={portant} disabled={!connectat}
            onClick={() => consulta().catch(() => setFase('noDisponible'))}>{tx('tornaAPortar')}</Boto>
        ) : null}
        {potOblidar ? <Boto data-viquipedia="deixa" varietat="fantasma" onClick={deixa}>{tx('deixa')}</Boto> : null}
        {oblitFallit && !potOblidar ? (
          <Boto data-viquipedia="oblida" varietat="secundari" onClick={deixa}>{tx('tornaAOblidar')}</Boto>
        ) : null}
        {/* Fora del flux (sdp-sr-only): l'èxit, només per al lector de pantalla. */}
        <span className="sdp-sr-only" aria-live="polite" aria-atomic="true">{anunci ? tx(anunci) : ''}</span>
      </div>
    </section>
  );
}
