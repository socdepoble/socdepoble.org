/* IDEA-357 (v1.2.26) · El netejador de text pla de les targetes i de les pàgines (UniversalCard,
   TargetaDelMur, elementDeSeccio, Targeta Viva, la Maquetadora). Viu en una fulla pròpia perquè
   només el fan servir trossos diferits: dins de contentHelpers.js, el tros d'entrada l'havia
   d'exportar per a ells i el pagava l'arrencada estàtica (integrador C1-3, tercera ronda:
   −244 B mesurats). No s'ha de reexportar des de contentHelpers.js, o tornaria a l'arrencada. */
import { llevaEtiquetes, llevaMd, stripMarkdownImages } from './contentHelpers.js';
import { llevaScriptsIEstils } from './llevaScriptsIEstils.js';

/* Només es lleva l'HTML d'un text que porta una etiqueta HTML de debò: < o </, el nom d'un
   element d'esta llista tancada (també els heretats de WordPress i Blogger: center, big, strike,
   tt…) i un espai, un > o una /. Un text que només porta «< 5 graus i > 30», «Feta al <poble>»,
   «Si x<y i y>z» o «<info@socdepoble.org>» és text pla i es queda sencer (D2 de l'integrador:
   «sense mutilar el contingut legítim»). Si al mateix text hi ha també una etiqueta de debò,
   llevaEtiquetes les lleva totes: és el límit conegut, pendent del Mestre. */
const ETIQUETA_HTML = /<\/?(?:a|abbr|address|article|aside|audio|b|big|blockquote|br|button|caption|center|cite|code|col|colgroup|dd|del|details|dfn|div|dl|dt|em|figcaption|figure|font|footer|h[1-6]|header|hr|i|iframe|img|input|ins|kbd|label|li|main|mark|nav|nobr|noscript|ol|p|picture|pre|q|s|samp|script|section|small|source|span|strike|strong|style|sub|summary|sup|svg|table|tbody|td|tfoot|th|thead|time|tr|tt|u|ul|var|video|wbr)[\s>/]/i;

/* Una negreta enganxada a una paraula per UN sol costat («**Tractor**s», «més**negreta**.») se'n
   va sencera abans que llevaMd en veja només la meitat (IDEA-357.2: mai **). La que té els dos
   costats lliures la continua llevant llevaMd, després de les regles d'inici de línia («- **11.00 h**»
   i «**+ info**» es pinten com sempre), i les adjacents («**a****b**») no deixen cap ** a la vista.
   Sense cap costat lliure (a**b**c, 5**2, 10**3) es queda. Lineal: el contingut no travessa cap *
   ni cap salt (verificador de la tercera ronda, lent 1). */
const NEGRETA_ENGANXADA = /(^|[^\w*])\*\*([^\s*](?:[^*\n]*[^\s*])?)\*\*(?=\w)|(\w)\*\*([^\s*](?:[^*\n]*[^\s*])?)\*\*(?![\w*])/g;

export const textPlaSenseMarkdown = (v, { maxLen = Infinity, llevaHtml = true } = {}) => {
  const b = String(v ?? '').replace(NEGRETA_ENGANXADA, (_m, abans, dins, davant, sol) => (dins === undefined ? davant + sol : abans + dins));
  if (!b) return '';
  const n = llevaMd(llevaHtml && ETIQUETA_HTML.test(b) ? llevaEtiquetes(stripMarkdownImages(llevaScriptsIEstils(b)), ' ') : stripMarkdownImages(b)).replace(/\s+/g, ' ').trim();
  return n.length > maxLen && maxLen >= 0 ? n.slice(0, maxLen).trimEnd() : n;
};
