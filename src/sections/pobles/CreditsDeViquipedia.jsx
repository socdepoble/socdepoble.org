/**
 * CreditsDeViquipedia.jsx · Fase 3a de l'eina de pobles nous (disseny
 * nit/viquipedia_disseny.md §4.7) · «D'on ve esta fitxa»: l'atribució
 * visible del que la Viquipèdia ha omplit en este navegador.
 *   · el text: extracte de l'article (enllaç) i la llicència CC BY-SA 4.0
 *     (enllaç), que demana dir d'on ve i que s'ha retallat (§3(a)(1));
 *   · les dades: l'element de Wikidata (CC0, per cortesia);
 *   · cada foto de Commons que es pinta, amb el seu autor, la seua llicència
 *     i l'enllaç a la pàgina del fitxer;
 *   · el dia que es va consultar.
 * Les fotos només es pinten amb el sí de la persona (`ambFotos`), sense
 * galetes (crossOrigin="anonymous": el navegador ni n'envia ni n'accepta) i
 * sense referent (referrerPolicy="no-referrer"), a 960 px (miniaturaDeCommons).
 * Text pla: React escapa, cap HTML. Enllaços de prosa sense classe (base.css).
 */
import { miniaturaDeCommons } from './fitxaDelPoble.js';

/* [clau, reserva en valencià] · la clau és la de src/config/idiomes/*.js. */
export const TEXTOS_VIQUIPEDIA = Object.freeze({
  titol: ['section.detail.pobles.viquipedia.titol', 'Completa esta fitxa amb la Viquipèdia'],
  explica: ['section.detail.pobles.viquipedia.explica', 'A la fitxa d’este poble li falten dades. El teu navegador les pot portar de la Viquipèdia, Wikidata i Wikimedia Commons, que són públiques i lliures. Fins que no prems el botó no es connecta amb ningú. Quan el prems, Wikimedia rep el nom del poble i la teua adreça IP, sense galetes ni l’adreça d’esta pàgina. El que porte es guarda només en este navegador, i res no s’escriu al servidor de Sóc de Poble.'],
  recorda: ['section.detail.pobles.viquipedia.recorda', 'Recorda-ho en este navegador'],
  porta: ['section.detail.pobles.viquipedia.porta', 'Porta-ho de la Viquipèdia'],
  senseXarxa: ['section.detail.pobles.viquipedia.senseXarxa', 'Sense connexió: ara no es pot portar res de la Viquipèdia.'],
  noDisponible: ['section.detail.pobles.viquipedia.noDisponible', 'Ara no hem pogut parlar amb la Viquipèdia. No s’ha guardat res.'],
  senseArticle: ['section.detail.pobles.viquipedia.senseArticle', 'No hem trobat cap municipi amb este nom que casara segur, i no s’hi ha afegit res.'],
  creditsTitol: ['section.detail.pobles.viquipedia.creditsTitol', 'D’on ve esta fitxa'],
  intro: ['section.detail.pobles.viquipedia.intro', 'Les dades que li faltaven a esta fitxa venen de fonts públiques i lliures, i es guarden només en este navegador.'],
  text: ['section.detail.pobles.viquipedia.text', 'Text:'],
  extracte: ['section.detail.pobles.viquipedia.extracte', 'extracte del començament de l’article'],
  deLaViquipedia: ['section.detail.pobles.viquipedia.deLaViquipedia', 'de la Viquipèdia en català'],
  dades: ['section.detail.pobles.viquipedia.dades', 'Dades:'],
  foto: ['section.detail.pobles.viquipedia.foto', 'Foto:'],
  autorAlFitxer: ['section.detail.pobles.viquipedia.autorAlFitxer', 'l’autoria és a la pàgina del fitxer'],
  consultat: ['section.detail.pobles.viquipedia.consultat', 'Consultat el {data}.'],
  fotosAmbGest: ['section.detail.pobles.viquipedia.fotosAmbGest', 'Les fotos de Wikimedia Commons només es mostren quan ho demanes, perquè es baixen dels seus servidors.'],
  tornaAPortar: ['section.detail.pobles.viquipedia.tornaAPortar', 'Torna-ho a portar'],
  deixa: ['section.detail.pobles.viquipedia.deixa', 'Deixa de portar-ho de la Viquipèdia'],
  error: ['section.detail.pobles.viquipedia.error', 'No s’ha pogut carregar l’apartat de la Viquipèdia'],
  /* Gauntlet 261030, cicle 3 · l'anunci de l'èxit (només per al lector de
     pantalla, vq-panell-focus-perdut-i-exit-mut) i una resposta de Wikimedia
     que la cau no pot guardar, que no és un tall de la xarxa
     (vq-autor-commons-llarg-rebutja-tota-la-proposta). */
  portat: ['section.detail.pobles.viquipedia.portat', 'Fet: les dades de la Viquipèdia ja són en esta fitxa.'],
  deixat: ['section.detail.pobles.viquipedia.deixat', 'Fet: este navegador ja no guarda res de la Viquipèdia per a este poble.'],
  noValida: ['section.detail.pobles.viquipedia.noValida', 'La Viquipèdia ha respost, però amb unes dades que no podem fer servir. No s’ha guardat res.'],
  /* Cicle 4 · auditoria matinal de Codex (MITJÀ-C3) · el disc no ha confirmat l'oblit. */
  oblitPendent: ['section.detail.pobles.viquipedia.oblitPendent', 'Oblit pendent: este navegador encara guarda el que va portar de la Viquipèdia per a este poble. Ja no es mostra, però tornaria en recarregar la pàgina.'],
  tornaAOblidar: ['section.detail.pobles.viquipedia.tornaAOblidar', 'Torna a provar d’esborrar-ho']
});

export const LLICENCIA_DEL_TEXT = Object.freeze({ nom: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/deed.ca' });
const REL_DE_FORA = 'noopener noreferrer nofollow';

/** Un traductor `t(clau, reserva)` com a funció d'un sol argument sobre TEXTOS_VIQUIPEDIA. */
export const traductorDeViquipedia = (t) => (nom) => {
  const [clau, reserva] = TEXTOS_VIQUIPEDIA[nom];
  return typeof t === 'function' ? t(clau, reserva) : reserva;
};

export const urlDeLArticle = (titol) => `https://ca.wikipedia.org/wiki/${encodeURIComponent(String(titol).replace(/ /g, '_'))}`;
export const urlDeWikidata = (qid) => `https://www.wikidata.org/wiki/${encodeURIComponent(qid)}`;

/** Les fotos que es pinten, sense repetir fitxer: la panoràmica, l'avatar i la de reserva. */
export function fotosDe(imatges) {
  const vistes = new Set();
  return [imatges?.hero, imatges?.avatar, imatges?.reserva]
    .filter((foto) => foto?.src && foto.fitxer && !vistes.has(foto.fitxer) && vistes.add(foto.fitxer));
}

const altDe = (fitxer) => String(fitxer).replace(/\.[a-z0-9]+$/i, '').replace(/_/g, ' ');
const midaDe = (foto) => {
  const amplada = Math.min(960, foto.amplada);
  return { width: amplada, height: Math.round((foto.alcada * amplada) / foto.amplada) };
};

/* Gauntlet 261030, cicle 3 (vq-data-credits-llengua-del-document) · La data,
   en la llengua de la interfície (`locale`, el de UIContext que passa el
   panell), i mai en la de l'<html> de l'amfitrió: dins de WordPress, l'app
   viu en un Shadow DOM i l'<html> és el de la web (LLEI_06). */
export const LOCALE_PER_DEFECTE = 'ca-ES';

export function dataLlegible(ms, locale = LOCALE_PER_DEFECTE) {
  try {
    return new Intl.DateTimeFormat(locale || LOCALE_PER_DEFECTE, { dateStyle: 'long' }).format(new Date(ms));
  } catch {
    return new Date(ms).toISOString().slice(0, 10);
  }
}

function EnllacDeFora({ href, children }) {
  return <a href={href} target="_blank" rel={REL_DE_FORA}>{children}</a>;
}

export function CreditsDeViquipedia({ entrada, ambFotos = false, t, locale = LOCALE_PER_DEFECTE }) {
  const tx = traductorDeViquipedia(t);
  const { dto, llegitEl } = entrada;
  const fotos = ambFotos ? fotosDe(dto.imatges) : [];
  return (
    <>
      <p>{tx('intro')}</p>
      <ul>
        {dto.content && dto.wikipedia_title ? (
          <li>
            <strong>{tx('text')}</strong> {tx('extracte')} <EnllacDeFora href={urlDeLArticle(dto.wikipedia_title)}>«{dto.wikipedia_title}»</EnllacDeFora> {tx('deLaViquipedia')} · <EnllacDeFora href={LLICENCIA_DEL_TEXT.url}>{LLICENCIA_DEL_TEXT.nom}</EnllacDeFora>
          </li>
        ) : null}
        {dto.wikidata_id ? (
          <li>
            <strong>{tx('dades')}</strong> <EnllacDeFora href={urlDeWikidata(dto.wikidata_id)}>Wikidata {dto.wikidata_id}</EnllacDeFora> · CC0
          </li>
        ) : null}
      </ul>
      {fotos.map((foto) => (
        <figure key={foto.fitxer}>
          <img src={miniaturaDeCommons(foto.src)} alt={altDe(foto.fitxer)} {...midaDe(foto)}
            loading="lazy" decoding="async" crossOrigin="anonymous" referrerPolicy="no-referrer" />
          <figcaption>
            <strong>{tx('foto')}</strong> {foto.autor || tx('autorAlFitxer')}
            {foto.llicencia ? <> · {foto.llicenciaUrl ? <EnllacDeFora href={foto.llicenciaUrl}>{foto.llicencia}</EnllacDeFora> : foto.llicencia}</> : null}
            {foto.fontUrl ? <> · <EnllacDeFora href={foto.fontUrl}>{foto.fitxer}</EnllacDeFora></> : null}
          </figcaption>
        </figure>
      ))}
      {Number.isFinite(llegitEl) ? <p>{tx('consultat').replace('{data}', () => dataLlegible(llegitEl, locale))}</p> : null}
    </>
  );
}
