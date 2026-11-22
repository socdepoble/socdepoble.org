/**
 * creditsDeViquipediaModel.js — Constants i utilitats pures d'atribució i
 * traducció del panell de la Viquipèdia (separades de CreditsDeViquipedia.jsx
 * per garantir puresa Fast Refresh / HMR).
 */

/* [clau, reserva en valencià] · la clau és la de src/config/idiomes/*.js. */
export const TEXTOS_VIQUIPEDIA = Object.freeze({
  titol: ['section.detail.pobles.viquipedia.titol', 'Completa esta fitxa amb la Viquipèdia'],
  explica: ['section.detail.pobles.viquipedia.explica', 'A la fitxa d’este poble li falten dades. El teu navegador les pot portar de la Viquipèdia, Wikidata i Wikimedia Commons, que són públiques i lliures. Fins que no prems el botó no es connecta amb ningú. Quan el prems, Wikimedia rep el nom d’este poble i la teua adreça IP, sense galetes ni l’adreça d’esta pàgina. El que porte es guarda només en este navegador, i res no s’escriu al servidor de Sóc de Poble.'],
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
  portat: ['section.detail.pobles.viquipedia.portat', 'Fet: les dades de la Viquipèdia ja són en esta fitxa.'],
  deixat: ['section.detail.pobles.viquipedia.deixat', 'Fet: este navegador ja no guarda res de la Viquipèdia per a este poble.'],
  noValida: ['section.detail.pobles.viquipedia.noValida', 'La Viquipèdia ha respost, però amb unes dades que no podem fer servir. No s’ha guardat res.'],
  oblitPendent: ['section.detail.pobles.viquipedia.oblitPendent', 'Oblit pendent: este navegador encara guarda el que va portar de la Viquipèdia per a este poble. Ja no es mostra, però tornaria en recarregar la pàgina.'],
  tornaAOblidar: ['section.detail.pobles.viquipedia.tornaAOblidar', 'Torna a provar d’esborrar-ho']
});

export const LLICENCIA_DEL_TEXT = Object.freeze({ nom: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/deed.ca' });
export const REL_DE_FORA = 'noopener noreferrer nofollow';

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

export const altDeFotoCommons = (fitxer) => String(fitxer).replace(/\.[a-z0-9]+$/i, '').replace(/_/g, ' ');
export const midaDeFotoCommons = (foto) => {
  if (!foto || !(Number.isFinite(foto.amplada) && foto.amplada > 0) || !(Number.isFinite(foto.alcada) && foto.alcada > 0)) {
    return {};
  }
  const amplada = Math.min(960, foto.amplada);
  return { width: amplada, height: Math.max(1, Math.round((foto.alcada * amplada) / foto.amplada)) };
};

export const LOCALE_PER_DEFECTE = 'ca-ES';

export function dataLlegible(ms, locale = LOCALE_PER_DEFECTE) {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return '';
  const data = new Date(ms);
  if (Number.isNaN(data.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(locale || LOCALE_PER_DEFECTE, { dateStyle: 'long' }).format(data);
  } catch {
    try {
      return new Intl.DateTimeFormat(LOCALE_PER_DEFECTE, { dateStyle: 'long' }).format(data);
    } catch {
      return data.toISOString().slice(0, 10);
    }
  }
}
