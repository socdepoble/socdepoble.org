/**
 * atles2dComu.jsx — Les peces comunes de les cinc pàgines de l'Atles 2D (/disseny?categoria=atles-2d).
 *
 * Atles 2D (ordre del Mestre del 21-11-2026 a les 23:28; pla 261121_2335, Carril 1, Tram 1, punt b),
 * integrat el 22-11-2026. La referència de disseny i de comportament és la maqueta
 * ATLES_2D_SOC_DE_POBLE_MERCAT_I_ENTITATS.html; les dades, dades/atles2dDades.js.
 *
 * No és un espècimen (el nom no comença per «Especimen»): allLoaders.test.jsx no el compta com a carregador.
 * Congelació d'Orkut: tot és lectura. Cap peça escriu a cap backend ni fa cap petició de xarxa.
 * Totes les xifres ixen de recomptar ATLES en pintar: quan un lot canvia un estat a les dades, les
 * pàgines es posen al dia soles (Llei 0: cap xifra escrita a mà).
 */
import { useRef } from 'react';
import { Link } from '../../../../app/contexts/RouterContext.jsx';
import { Insignia } from '../../../../components/PedraSeca/index.js';
import { normalizeSearchText } from '../../../../config/contentHelpers.js';
import { useFullDiferit } from '../../../../config/fullDiferit.js';
import { usePropietatsCss } from '../../../../hooks/usePropietatsCss.js';
import cssAtles from '../../../../css/diferit-atles-2d.css?inline';
import { CATALOG_ITEMS, rutaEspecimen } from '../manifest.js';
import { ATLES, ORIGEN_ATLES } from '../dades/atles2dDades.js';

/* ── Estats: el nom, el to de la Insignia i el glif (l'estat mai només pel color) ── */
export const NOMS_ESTAT = Object.freeze({
  fet: 'Fet', a_mitges: 'A mitges', falta: 'Falta', no_aplica: 'No aplica',
  resolt: 'Resolt', en_kit: 'En kit', obert: 'Obert', decisio_mestre: 'Decisió del Mestre'
});
export const TO_ESTAT = Object.freeze({
  fet: 'exit', resolt: 'exit', a_mitges: 'avis', en_kit: 'avis',
  falta: 'error', obert: 'error', no_aplica: 'neutre', decisio_mestre: 'info'
});
export const GLIF_ESTAT = Object.freeze({
  fet: '●', resolt: '●', a_mitges: '◐', en_kit: '◆', falta: '○', obert: '○', no_aplica: '–', decisio_mestre: '?'
});
/* Literals sencers: els noms de classe es busquen al CSS tal qual (diferit-atles-2d.css). */
const CLASSE_SEGMENT = Object.freeze({
  exit: 'sdp-atles__segment sdp-atles__segment--exit',
  avis: 'sdp-atles__segment sdp-atles__segment--avis',
  error: 'sdp-atles__segment sdp-atles__segment--error',
  info: 'sdp-atles__segment sdp-atles__segment--info',
  neutre: 'sdp-atles__segment sdp-atles__segment--neutre'
});

export const ORDRE_DOLORS = Object.freeze(['resolt', 'en_kit', 'decisio_mestre', 'obert']);
export const ORDRE_MAPA = Object.freeze(['fet', 'a_mitges', 'falta', 'no_aplica']);
export const GRAVETATS = Object.freeze(['P0', 'P1', 'P2', 'P3']);

/** Quants n'hi ha de cada valor de `clau`: { valor: n }. */
export function compta(llista, clau) {
  const recompte = {};
  for (const element of llista || []) {
    const valor = element?.[clau];
    recompte[valor] = (recompte[valor] || 0) + 1;
  }
  return recompte;
}

/** Una nota sobre 10 amb una xifra decimal i coma: 9.4 → «9,4». */
export const nota = (valor) => (Number.isFinite(valor) ? valor.toFixed(1).replace('.', ',') : '–');

/** La data de generació de les dades, «2026-11-21 19:34». */
export const dataDeLesDades = (meta = ATLES.meta) => String(meta?.generat || '').replace('T', ' ').slice(0, 16);

/** La versió del codi contra la qual es van comprovar les dades, sense el que va darrere de « ·». */
export const versioCurta = (meta = ATLES.meta) => String(meta?.versio_codi || '').split(' ·')[0];

/* v1.2.19 · Gauntlet R2 (L4R2-04) · Llei 0: les dades són una fotografia datada, no l'estat d'ara. Les pàgines
   que en parlen ho diuen a la vista amb la data (meta.generat) i la versió del codi (meta.versio_codi), en
   passat; la dada no es toca. Si un lot posterior tanca un dolor o mou una línia citada, la pàgina no ho
   sap fins que algú pose al dia atles2dDades.js (vegeu-ne la capçalera). */

/** «2026-11-21T19:34+01:00» → «21-11-2026 a les 19:34»; un text que no és ISO es queda com és. */
export function dataLlegible(iso) {
  const parts = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}:\d{2}))?/);
  if (!parts) return String(iso || '');
  const [, any, mes, dia, hora] = parts;
  return hora ? `${dia}-${mes}-${any} a les ${hora}` : `${dia}-${mes}-${any}`;
}

/** La data de les dades per a dir-la en una frase: «el 21-11-2026 a les 19:34». */
export const dataDeLaFotografia = (meta = ATLES.meta) => dataLlegible(meta?.generat);

const MESOS_EN = Object.freeze({ Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' });

/** La marca de `date` de la verificació («Sat Nov 21 19:31:33 CET 2026») en valencià: «21-11-2026 a les 19:31:33 (CET)».
    Si la marca no té eixa forma, es mostra tal com ve. */
export function dataDeVerificacio(text) {
  const font = String(text || '');
  const parts = font.match(/^[A-Z][a-z]{2} ([A-Z][a-z]{2}) +(\d{1,2}) (\d{2}:\d{2}:\d{2}) ([A-Z]{2,5}) (\d{4})$/);
  if (!parts || !MESOS_EN[parts[1]]) return font;
  const [, mes, dia, hora, zona, any] = parts;
  return `${dia.padStart(2, '0')}-${MESOS_EN[mes]}-${any} a les ${hora} (${zona})`;
}

/** L'avís de datació: de quin dia i de quina versió del codi són les dades, a dalt de la pàgina. */
export function NotaDatacio({ meta = ATLES.meta }) {
  return (
    <p className="sdp-atles__datacio">
      <span aria-hidden="true">◷</span>
      <span>
        <strong>Fotografia del {dataLlegible(meta?.generat)}</strong>, contra el codi {meta?.versio_codi}. Els estats, les
        xifres i les evidències <code>fitxer:línia</code> són els d’eixe dia: el que haja canviat després no es veu ací
        fins que algú pose al dia les dades.
      </span>
    </p>
  );
}

/** Les cel·les del mapa, totes (12 dimensions × 5 entitats). */
export const celles = (entitats = ATLES.entitats) => (entitats.files || [])
  .flatMap((fila) => (entitats.entitats || []).map((entitat) => fila.cel_les?.[entitat.id]).filter(Boolean));

export const esCorregida = (cella) => Boolean(cella?.estat_gemini) && cella.estat_gemini !== cella.estat;

/** «1. Usuari / Veí» → «Usuari / Veí». */
export const senseNumero = (titol) => String(titol || '').replace(/^\d+\.\s*/, '');

/**
 * La columna «Entitat» de les rutes porta els ids de la matriu (usuari_vei, empresa_cooperativa…), sols o
 * combinats amb « / » i amb notes entre parèntesis. Cada id passa al nom de l'entitat sense el número, i
 * el separador entre dos ids passa a « · », perquè els noms ja porten « / » («Usuari / Veí»). La resta
 * del text (city_hall, «totes», les notes) es queda com diu la dada.
 */
export function nomsDEntitat(text, entitats = ATLES.entitats.entitats) {
  const noms = new Map(entitats.map((e) => [e.id, senseNumero(e.titol)]));
  if (!noms.size) return String(text || '');
  const ids = [...noms.keys()].sort((a, b) => b.length - a.length).join('|');
  return String(text || '')
    .replace(new RegExp(`\\b(${ids})\\s*/\\s*(?=(?:${ids})\\b)`, 'g'), '$1 · ')
    .replace(new RegExp(`\\b(${ids})\\b`, 'g'), (id) => noms.get(id));
}

/* v1.2.19 · Gauntlet R2 (L4R2-03): les dues cerques de l'Atles (Xarxes i Poble virtual) no distingixen accents ni
   majúscules, com la cerca universal: el text i la consulta passen tots dos per normalizeSearchText (NFD sense
   diacrítics, minúscules, espais plegats). Amb el teclat de l'iPad, «sessio» troba «sessió». */
export const plegaPerCercar = (text) => normalizeSearchText(text);

/* Xarxes del món · La cerca llig el text que pinta la fitxa, mai les claus de la dada: «model» no casa amb model_negoci
   ni «10» amb afinitat_sdp_sobre_10. Tampoc l'adreça de referència: es busca pel que diu la xarxa. */
const CAMPS_DE_TEXT = Object.freeze([
  'nom', 'pais_origen', 'categoria', 'eslogan_posicionament', 'mecanica_estrella', 'model_captacio', 'model_negoci',
  'identitat_i_verificacio', 'moderacio', 'stack_observable', 'fracassos_o_riscos'
]);
export const textDeCerca = (xarxa) => plegaPerCercar([
  ...CAMPS_DE_TEXT.map((camp) => xarxa[camp]),
  ...(xarxa.que_adoptar_clean_room || []),
  ...(xarxa.que_rebutjar_frontalment || [])
].filter((tros) => typeof tros === 'string').join(' '));

/* Les marques de les fonts: `codi` i **negreta**. Res d'HTML cru: cada tros és un node de React. */
const MARQUES = /(`[^`]+`|\*\*[^*]+\*\*)/g;
export function TextFont({ text }) {
  const font = String(text ?? '');
  return (
    <>
      {font.split(MARQUES).map((tros, index) => {
        if (tros.length > 2 && tros.startsWith('`') && tros.endsWith('`')) return <code key={index}>{tros.slice(1, -1)}</code>;
        if (tros.length > 4 && tros.startsWith('**') && tros.endsWith('**')) return <strong key={index}>{tros.slice(2, -2)}</strong>;
        return tros;
      })}
    </>
  );
}

/** L'estat en una Insignia de Pedra Seca: el glif (amagat al lector) i el nom. */
export function PindolaEstat({ estat }) {
  return (
    <Insignia to={TO_ESTAT[estat] || 'neutre'}>
      <span aria-hidden="true">{GLIF_ESTAT[estat] || '·'}</span>
      {NOMS_ESTAT[estat] || estat}
    </Insignia>
  );
}

/** La barra apilada: un segment per estat, ample segons el seu recompte (--atles-columnes en fr). */
export function BarraApilada({ recompte, ordre, etiqueta }) {
  const ref = useRef(null);
  const presents = ordre.filter((estat) => (recompte[estat] || 0) > 0);
  usePropietatsCss(ref, { '--atles-columnes': presents.map((estat) => `${recompte[estat]}fr`).join(' ') || '1fr' });
  const lectura = `${etiqueta}: ${ordre.map((estat) => `${recompte[estat] || 0} ${NOMS_ESTAT[estat] || estat}`).join(', ')}`;
  return (
    <div ref={ref} className="sdp-atles__apilada" role="img" aria-label={lectura}>
      {presents.map((estat) => <span key={estat} className={CLASSE_SEGMENT[TO_ESTAT[estat] || 'neutre']} />)}
    </div>
  );
}

/** La llegenda d'una barra apilada: cada estat amb el seu recompte. */
export function Llegenda({ recompte, ordre }) {
  return (
    <ul className="sdp-atles__llegenda">
      {ordre.map((estat) => (
        <li key={estat}><PindolaEstat estat={estat} /><b>{recompte[estat] || 0}</b></li>
      ))}
    </ul>
  );
}

/** Les quatre xifres globals de l'obertura, recomptades de les dades. */
export function xifresGlobals(atles = ATLES) {
  const dolors = atles.placa.dolors;
  const perEstat = compta(dolors, 'estat');
  const resum = atles.entitats.resum;
  const totalCelles = celles(atles.entitats).length;
  const orkut = atles.xarxes.find((xarxa) => String(xarxa.id).startsWith('orkut'));
  const antiModels = atles.xarxes.filter((xarxa) => xarxa.afinitat_sdp_sobre_10 < 5);
  return [
    { id: 'dolors', pagina: 'atles-2d-poble-virtual', n: String(dolors.length), t: 'dolors del poble virtual',
      d: `${perEstat.resolt || 0} resolts · ${perEstat.en_kit || 0} en kit · ${perEstat.decisio_mestre || 0} per decidir · ${perEstat.obert || 0} oberts` },
    { id: 'veus', pagina: 'atles-2d-poble-virtual', n: String(atles.placa.perfils.length), t: `veus sintètiques en ${atles.placa.rondes.length} rondes`,
      d: `de ${atles.placa.rondes[0]?.id} a ${atles.placa.rondes[atles.placa.rondes.length - 1]?.id}: les places #01–#04, la Fase 5 i l’arnés v2` },
    { id: 'xarxes', pagina: 'atles-2d-xarxes-mon', n: String(atles.xarxes.length), t: 'xarxes per a pobles estudiades',
      d: `Orkut, ${nota(orkut?.afinitat_sdp_sobre_10)} / 10; ${antiModels.map((xarxa) => `${xarxa.nom.split(' ')[0]}, ${nota(xarxa.afinitat_sdp_sobre_10)}`).join(' i ')}: l’anti-model` },
    { id: 'celles', pagina: 'atles-2d-mapa-entitats', n: `${resum.fet} / ${totalCelles}`, t: 'cel·les fetes al mapa',
      d: `${resum.a_mitges} a mitges · ${resum.falta} falten · ${resum.no_aplica} no aplica · ${resum.canvis_respecte_gemini} corregides` }
  ];
}

/** Una xifra de l'obertura: el número gran, què compta i el detall. */
export function Xifra({ n, t, d }) {
  return (
    <li className="sdp-atles__xifra">
      <span className="sdp-atles__xifra-n">{n}</span>
      <span className="sdp-atles__xifra-t">{t}</span>
      {d ? <span className="sdp-atles__xifra-d">{d}</span> : null}
    </li>
  );
}

/* Les cinc pàgines, en l'ordre del manifest: el títol, l'emoji i l'entradeta ixen d'allí (una sola font). */
export const IDS_PAGINES_ATLES = Object.freeze([
  'atles-2d-presentacio', 'atles-2d-poble-virtual', 'atles-2d-xarxes-mon', 'atles-2d-mapa-entitats', 'atles-2d-motor-estudis'
]);
export const paginaAtles = (id) => CATALOG_ITEMS.find((item) => item.id === id) || null;

/** La targeta que porta a una pàgina de l'Atles (un enllaç de veres: obrir en una pestanya nova funciona). */
export function TargetaPagina({ id, detall = null, compacta = false }) {
  const pagina = paginaAtles(id);
  if (!pagina) return null;
  return (
    <Link className="sdp-atles__targeta" to={rutaEspecimen(id)}>
      <span className="sdp-atles__targeta-icona" aria-hidden="true">{pagina.icon}</span>
      <h3>{pagina.title}</h3>
      <p>{compacta ? pagina.subtitle : pagina.lead}</p>
      {detall ? <p className="sdp-atles__suau">{detall}</p> : null}
    </Link>
  );
}

/**
 * El peu de cada pàgina d'estudi: d'on ixen les dades i les altres pàgines de l'Atles.
 * Adopta el full diferit pel seu compte (també es pot muntar fora d'una pàgina de l'Atles).
 */
export function PeuAtles({ actual }) {
  const arrel = useRef(null);
  useFullDiferit(arrel, 'atles-2d', cssAtles);
  const altres = IDS_PAGINES_ATLES.filter((id) => id !== actual);
  return (
    <nav ref={arrel} className="sdp-atles__bloc" aria-labelledby={`${actual}-peu`}>
      <h2 id={`${actual}-peu`}>Les altres pàgines de l’Atles</h2>
      <ul className="sdp-atles__graella">
        {altres.map((id) => <li key={id}><TargetaPagina id={id} compacta /></li>)}
      </ul>
      <p className="sdp-atles__meta">
        Dades del {dataDeLesDades()} · codi {versioCurta()} · origen <code>{ORIGEN_ATLES.fitxer}</code> (SHA-256 <code>{ORIGEN_ATLES.sha256.slice(0, 12)}…</code>)
      </p>
    </nav>
  );
}
