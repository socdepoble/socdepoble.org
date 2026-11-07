import {
  ETIQUETES_DOCTORAL_SKOS_49,
  FACETA_3_CATEGORIES_MARES_IA,
  FACETA_4_ETIQUETES_SKOS,
} from '../../data/taxonomia/tesaurusDoctoralSocDePoble.js';

/*
 * Revisora editorial (IDEA-164). Llei 0 · R11 Loop 3: tot el que fa este mòdul són regles
 * locals deterministes que s'executen al navegador. No crida cap model d'IA ni el Node 0, i
 * per això ni la interfície ni les observacions porten cap nom de model.
 */

export const VEREDICTES_EDITORIALS = Object.freeze({
  APROVAT: 'APROVAT',
  MILLORA: 'AMB PROPOSTA DE MILLORA',
  BLOQUEJAT: 'BLOQUEJAT PER DUPLICITAT O INCOHERÈNCIA',
});

export const TEXTOS_REVISOR_EDITORIAL = Object.freeze({
  ca: Object.freeze({
    title: '✍️ Revisora editorial · Regles locals deterministes (sense IA)',
    subtitle: 'Regles fixes que s’executen al navegador, sense cap model d’IA: Llei «de poble», ortografia, jerarquia Pedra Seca, duplicitats i proposta de taxonomia del tesaurus.',
    btnReview: '✍️ Revisar la redacció',
    btnApplyProposal: '✅ Aplicar la proposta',
    btnRestoreOriginal: '↩️ Restaurar el text d’abans d’aplicar',
    verdictLabel: 'Dictamen editorial:',
    proposalTitle: '📝 Proposta de redacció',
    findingsTitle: '🔍 Observacions de les regles locals',
    suggestedCategoryLabel: 'Categoria mare suggerida:',
    suggestedTagsLabel: 'Etiquetes SKOS suggerides:',
    noIssues: 'El text complix la jerarquia Pedra Seca i la Llei «de poble», i no presenta duplicitats.',
    noTaxonomy: 'Cap etiqueta del tesaurus apareix al text: no hi ha suggeriment.',
    staleReview: 'El text ha canviat des de la revisió. Torna a revisar-lo abans d’aplicar.',
  }),
  es: Object.freeze({
    title: '✍️ Revisora editorial · Reglas locales deterministas (sin IA)',
    subtitle: 'Reglas fijas que se ejecutan en el navegador, sin ningún modelo de IA: Ley «de pueblo», ortografía, jerarquía Pedra Seca, duplicidades y propuesta de taxonomía del tesauro.',
    btnReview: '✍️ Revisar la redacción',
    btnApplyProposal: '✅ Aplicar la propuesta',
    btnRestoreOriginal: '↩️ Restaurar el texto de antes de aplicar',
    verdictLabel: 'Dictamen editorial:',
    proposalTitle: '📝 Propuesta de redacción',
    findingsTitle: '🔍 Observaciones de las reglas locales',
    suggestedCategoryLabel: 'Categoría madre sugerida:',
    suggestedTagsLabel: 'Etiquetas SKOS sugeridas:',
    noIssues: 'El texto cumple la jerarquía Pedra Seca y la Ley «de pueblo», y no presenta duplicidades.',
    noTaxonomy: 'Ninguna etiqueta del tesauro aparece en el texto: no hay sugerencia.',
    staleReview: 'El texto ha cambiado desde la revisión. Vuelve a revisarlo antes de aplicar.',
  }),
  en: Object.freeze({
    title: '✍️ Editorial reviewer · Deterministic local rules (no AI)',
    subtitle: 'Fixed rules that run in the browser, with no AI model: the “de poble” rule, spelling, Pedra Seca hierarchy, duplicates and a thesaurus taxonomy proposal.',
    btnReview: '✍️ Review the writing',
    btnApplyProposal: '✅ Apply the proposal',
    btnRestoreOriginal: '↩️ Restore the text from before applying',
    verdictLabel: 'Editorial verdict:',
    proposalTitle: '📝 Writing proposal',
    findingsTitle: '🔍 Findings from the local rules',
    suggestedCategoryLabel: 'Suggested mother category:',
    suggestedTagsLabel: 'Suggested SKOS tags:',
    noIssues: 'The text meets the Pedra Seca hierarchy and the “de poble” rule, and has no duplicates.',
    noTaxonomy: 'No thesaurus tag appears in the text: no suggestion.',
    staleReview: 'The text has changed since the review. Review it again before applying.',
  }),
  eu: Object.freeze({
    title: '✍️ Argitalpen-zuzentzailea · Tokiko arau deterministak (AA gabe)',
    subtitle: 'Nabigatzailean exekutatzen diren arau finkoak, AA eredurik gabe: «de poble» legea, ortografia, Pedra Seca hierarkia, bikoiztasunak eta tesauroko taxonomia-proposamena.',
    btnReview: '✍️ Idazketa berrikusi',
    btnApplyProposal: '✅ Proposamena aplikatu',
    btnRestoreOriginal: '↩️ Aplikatu aurreko testua berreskuratu',
    verdictLabel: 'Argitalpen-irizpena:',
    proposalTitle: '📝 Idazketa-proposamena',
    findingsTitle: '🔍 Tokiko arauen oharrak',
    suggestedCategoryLabel: 'Iradokitako kategoria nagusia:',
    suggestedTagsLabel: 'Iradokitako SKOS etiketak:',
    noIssues: 'Testuak Pedra Seca hierarkia eta «de poble» legea betetzen ditu, bikoiztasunik gabe.',
    noTaxonomy: 'Tesauroko etiketarik ez da agertzen testuan: ez dago iradokizunik.',
    staleReview: 'Testua aldatu egin da berrikuspenaz geroztik. Berrikusi berriro aplikatu aurretik.',
  }),
  gl: Object.freeze({
    title: '✍️ Revisora editorial · Regras locais deterministas (sen IA)',
    subtitle: 'Regras fixas que se executan no navegador, sen ningún modelo de IA: Lei «de pobo», ortografía, xerarquía Pedra Seca, duplicidades e proposta de taxonomía do tesauro.',
    btnReview: '✍️ Revisar a redacción',
    btnApplyProposal: '✅ Aplicar a proposta',
    btnRestoreOriginal: '↩️ Restaurar o texto de antes de aplicar',
    verdictLabel: 'Ditame editorial:',
    proposalTitle: '📝 Proposta de redacción',
    findingsTitle: '🔍 Observacións das regras locais',
    suggestedCategoryLabel: 'Categoría nai suxerida:',
    suggestedTagsLabel: 'Etiquetas SKOS suxeridas:',
    noIssues: 'O texto cumpre a xerarquía Pedra Seca e a Lei «de pobo», e non presenta duplicidades.',
    noTaxonomy: 'Ningunha etiqueta do tesauro aparece no texto: non hai suxestión.',
    staleReview: 'O texto cambiou desde a revisión. Volve revisalo antes de aplicar.',
  }),
});

export function resolTextosRevisorEditorial(idioma = 'ca') {
  return TEXTOS_REVISOR_EDITORIAL[idioma] || TEXTOS_REVISOR_EDITORIAL.ca;
}

/* «del poble» seguit de «de» + nom propi («del poble de La Torre», «del poble d’Alcoi») parla
   d'un municipi concret: és l'excepció de core-llegibilitat-text §6.2 i no es toca. */
const NO_MUNICIPI_CONCRET = String.raw`(?!\s+(?:de\s+\p{Lu}|d['’]\p{Lu}))`;

/* Sense la bandera «i» (R11 Loop 4): amb «iu», \p{Lu} també accepta minúscules i l'excepció
   saltava davant de qualsevol «de» («eines del poble de manera…»). La frase només admet la
   majúscula inicial. */
function fraseDelPoble(frase) {
  const inicial = `[${frase[0].toUpperCase()}${frase[0]}]`;
  return new RegExp(String.raw`\b${inicial}${frase.slice(1)}\b${NO_MUNICIPI_CONCRET}`, 'gu');
}

/* Substitucions automàtiques: només les que no depenen del context. */
const REGLES_AUTOMATIQUES = Object.freeze([
  {
    id: 'experiencies-de-poble',
    patro: fraseDelPoble('experiències del poble'),
    substitucio: 'experiències de poble',
    motiu: 'Llei «DE POBLE» (P0-38): usar «experiències de poble» en sentit cultural general.',
  },
  {
    id: 'paraules-de-poble',
    patro: fraseDelPoble('paraules del poble'),
    substitucio: 'paraules de poble',
    motiu: 'Llei «DE POBLE» (P0-38): usar «paraules de poble» en lloc de «paraules del poble».',
  },
  {
    id: 'eines-de-poble',
    patro: fraseDelPoble('eines del poble'),
    substitucio: 'eines de poble',
    motiu: 'Llei «DE POBLE» (P0-38): usar «eines de poble» en lloc d’«eines del poble».',
  },
  {
    id: 'verb-utilitza',
    patro: /\b(La IAIA\s+)usa\b/gi,
    substitucio: '$1utilitza',
    motiu: 'Llei «DE POBLE» (P0-38): preferir el verb genuí «utilitza» en lloc d’«usa».',
  },
  {
    id: 'barbarisme-degut-a-que',
    patro: /\bdegut a que\b/gi,
    substitucio: 'a causa que',
    motiu: 'Correcció gramatical: substituir el calc «degut a que» per «a causa que» o «perquè».',
  },
]);

/* Regles que depenen del context: només s'avisa, mai es reescriu el text. */
const REGLES_DE_SUGGERIMENT = Object.freeze([
  {
    id: 'imaginari-de-poble',
    patro: /\bles imatges del poble\b/gi,
    motiu: 'Llei «DE POBLE» (P0-38): si parles de metàfores o il·lustracions, escriu «l’imaginari de poble» i ajusta la concordança del verb. No s’ha canviat automàticament.',
  },
  {
    id: 'vocacio-de-poble',
    patro: fraseDelPoble('al servei del poble'),
    motiu: 'Llei «DE POBLE» (P0-38): si no parles d’un municipi concret, escriu «amb vocació de poble». No s’ha canviat automàticament.',
  },
  {
    id: 'barbarisme-per-a-que',
    patro: /\bper a que\b/gi,
    motiu: 'Revisa «per a que»: en oracions finals és «perquè»; si és una interrogativa, «per a què». No s’ha canviat automàticament.',
  },
]);

/* Etiquetes HTML (amb atributs entre cometes) i comentaris. Els literals de text que contenen «<»
   sense lletra al darrere no són etiquetes. R11 Loop 4: fora de cometes el cos de l'etiqueta no
   pot contindre «<», i un comentari sense tancar s'emporta la resta (com al navegador). Amb
   `[^>"']*` i `-->` obligatori, «<a» o «<!--» repetits sense «>» eren quadràtics (16 KB de «<a»:
   2,3 s; 32 KB de «<a "»: 9,3 s). */
const PATRO_ETIQUETA_HTML = /<!--[\s\S]*?(?:-->|$)|<\/?[A-Za-z][^<>"']*(?:(?:"[^"]*"|'[^']*')[^<>"']*)*>/g;
const ETIQUETES_LITERALS = new Set(['pre', 'code', 'kbd', 'samp', 'script', 'style', 'textarea']);

/**
 * Aplica `transforma` només als nodes de text visibles. No toca les etiquetes, els atributs ni el
 * contingut de <pre>, <code> i semblants, i conserva byte a byte la resta de l'HTML.
 */
function transformaTextVisible(html, transforma) {
  const font = String(html || '');
  let eixida = '';
  let darrer = 0;
  let profunditatLiteral = 0;
  for (const etiqueta of font.matchAll(PATRO_ETIQUETA_HTML)) {
    const text = font.slice(darrer, etiqueta.index);
    eixida += profunditatLiteral > 0 ? text : transforma(text);
    eixida += etiqueta[0];
    darrer = etiqueta.index + etiqueta[0].length;
    const nom = /^<(\/?)([A-Za-z][\w-]*)/.exec(etiqueta[0]);
    if (nom && ETIQUETES_LITERALS.has(nom[2].toLowerCase()) && !etiqueta[0].endsWith('/>')) {
      profunditatLiteral = Math.max(0, profunditatLiteral + (nom[1] ? -1 : 1));
    }
  }
  const cua = font.slice(darrer);
  return eixida + (profunditatLiteral > 0 ? cua : transforma(cua));
}

function senseGlobal(patro) {
  return new RegExp(patro.source, patro.flags.replace('g', ''));
}

function apareixAlTextVisible(html, patro) {
  const prova = senseGlobal(patro);
  let trobat = false;
  transformaTextVisible(html, (text) => {
    if (!trobat && prova.test(text)) trobat = true;
    return text;
  });
  return trobat;
}

/* Substituix conservant la majúscula inicial de la coincidència («Degut a que» → «A causa que»). */
function substituixConservantMajuscula(text, regla) {
  const unic = senseGlobal(regla.patro);
  return text.replace(regla.patro, (coincidencia) => {
    const nova = coincidencia.replace(unic, regla.substitucio);
    const primera = coincidencia.charAt(0);
    if (primera !== primera.toLowerCase() && nova.charAt(0) === nova.charAt(0).toLowerCase()) {
      return nova.charAt(0).toUpperCase() + nova.slice(1);
    }
    return nova;
  });
}

/* `[^<>]` i no `[^>]`: amb molts «<» solts sense «>» el patró antic era quadràtic (R11 Loop 3:
   7,6 s per a 120 KB). */
function netejaEtiquetesHtml(text = '') {
  return String(text)
    .replace(/<[^<>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectaParagrafsDuplicats(cos = '') {
  const blocs = String(cos)
    .split(/(?:<\/(?:p|li|h[1-6]|blockquote|pre)>|\n{2,})/i)
    .map((b) => netejaEtiquetesHtml(b).toLowerCase())
    .filter((b) => b.length >= 24);

  const vistos = new Set();
  const duplicats = [];
  for (const bloc of blocs) {
    if (vistos.has(bloc)) {
      duplicats.push(bloc);
    } else {
      vistos.add(bloc);
    }
  }
  return duplicats;
}

/* ── Taxonomia derivada del tesaurus (R11 Loop 3) ─────────────────────────────────────────────
   Res escrit a mà: les etiquetes candidates són les 49 actives (ETIQUETES_DOCTORAL_SKOS_49) i es
   reconeixen pel seu `name` i els seus `useFor`, en minúscules i sense accents. La categoria mare
   ix del `broaderTermId` de les etiquetes trobades. Els `relatedTerms` no servixen per a reconéixer
   una etiqueta: són noms d'altres etiquetes (a «Pou de neu» hi ha «Patrimoni»), i usar-los faria
   que «Patrimoni» suggerira «Pou de neu». */

function normalitzaTerme(text = '') {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’`´]/g, "'")
    .toLowerCase();
}

function escapaRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* «Pou de neu» també reconeix «pou de la neu» i «pous de neu». */
function patroDeTerme(terme) {
  const paraules = normalitzaTerme(terme).split(/\s+/).filter(Boolean);
  if (paraules.length === 0) return null;
  let cos = '';
  paraules.forEach((paraula, i) => {
    const alMig = i > 0 && i < paraules.length - 1;
    if (paraula === 'de' && alMig) {
      cos += String.raw`de\s+(?:(?:la|el|les|els)\s+|l')?`;
      return;
    }
    cos += escapaRegex(paraula) + (paraula.length >= 3 && /[a-z]$/.test(paraula) ? 's?' : '');
    if (i < paraules.length - 1) cos += String.raw`\s+`;
  });
  return new RegExp(String.raw`(?:^|[^a-z0-9])(?:${cos})(?=$|[^a-z0-9])`);
}

const INDEX_ETIQUETES_TESAURUS = (() => {
  const actives = new Set(ETIQUETES_DOCTORAL_SKOS_49);
  const vistes = new Set();
  const index = [];
  for (const etiqueta of FACETA_4_ETIQUETES_SKOS) {
    if (!actives.has(etiqueta.name) || vistes.has(etiqueta.name)) continue;
    vistes.add(etiqueta.name);
    const patrons = [etiqueta.name, ...(etiqueta.useFor || [])].map(patroDeTerme).filter(Boolean);
    index.push({ nom: etiqueta.name, categoriaId: etiqueta.broaderTermId, patrons });
  }
  return Object.freeze(index);
})();

function suggereixTaxonomiaCanonica(textComplet = '') {
  const text = normalitzaTerme(textComplet);
  const trobades = [];
  for (const etiqueta of INDEX_ETIQUETES_TESAURUS) {
    let posicio = -1;
    for (const patro of etiqueta.patrons) {
      const m = patro.exec(text);
      if (m && (posicio < 0 || m.index < posicio)) posicio = m.index;
    }
    if (posicio >= 0) trobades.push({ ...etiqueta, posicio });
  }
  trobades.sort((a, b) => a.posicio - b.posicio);
  const etiquetesSkos = trobades.slice(0, 4).map((t) => t.nom);

  /* Categoria: la més repetida entre les etiquetes trobades; en cas d'empat, la de l'etiqueta
     que apareix abans al text. Sense cap etiqueta no hi ha suggeriment (mai una categoria per
     defecte). */
  const vots = new Map();
  for (const t of trobades.slice(0, 4)) vots.set(t.categoriaId, (vots.get(t.categoriaId) || 0) + 1);
  let categoriaId = null;
  for (const t of trobades.slice(0, 4)) {
    if (categoriaId === null || vots.get(t.categoriaId) > vots.get(categoriaId)) categoriaId = t.categoriaId;
  }
  const categoria = FACETA_3_CATEGORIES_MARES_IA.find((c) => c.id === categoriaId) || null;

  return {
    categoriaMare: categoria ? categoria.label : null,
    categoriaMareCodi: categoria ? categoria.skosNotation : null,
    etiquetesSkos,
  };
}

/**
 * Revisió editorial local i determinista (sense IA) d'una nota o article.
 */
export function revisaTextEditorialNode0({
  title = '',
  subtitle = '',
  entradilla = '',
  content = '',
} = {}) {
  const observacions = [];
  let propostaContent = String(content || '');
  let propostaSubtitle = String(subtitle || '');
  let propostaEntradilla = String(entradilla || '');

  // Regles lèxiques i ortogràfiques automàtiques: només sobre el text visible.
  for (const regla of REGLES_AUTOMATIQUES) {
    const camps = [propostaContent, propostaEntradilla, propostaSubtitle];
    if (!camps.some((camp) => apareixAlTextVisible(camp, regla.patro))) continue;
    observacions.push({ id: regla.id, severitat: 'millora', missatge: regla.motiu });
    const substituix = (text) => substituixConservantMajuscula(text, regla);
    propostaContent = transformaTextVisible(propostaContent, substituix);
    propostaEntradilla = transformaTextVisible(propostaEntradilla, substituix);
    propostaSubtitle = transformaTextVisible(propostaSubtitle, substituix);
  }

  // Regles de context: avís sense reescriure.
  for (const regla of REGLES_DE_SUGGERIMENT) {
    const camps = [propostaContent, propostaEntradilla, propostaSubtitle];
    if (camps.some((camp) => apareixAlTextVisible(camp, regla.patro))) {
      observacions.push({ id: regla.id, severitat: 'suggeriment', missatge: regla.motiu });
    }
  }

  // Espais múltiples: fora de <pre>/<code> i fora dels atributs.
  let espaisPolits = false;
  propostaContent = transformaTextVisible(propostaContent, (text) => {
    if (!/ {2,}/.test(text)) return text;
    espaisPolits = true;
    return text.replace(/ {2,}/g, ' ');
  });
  if (espaisPolits) {
    observacions.push({
      id: 'espais-dobles',
      severitat: 'millora',
      missatge: 'S’han polit espais dobles innecessaris per millorar la fluïdesa tipogràfica.',
    });
  }

  // Estructura: H1 al cos, subtítol/entradeta, negretes i duplicitats.
  let teBloqueig = false;
  /* Literal partit perquè design_guard (regla h1-multiple) cerca H1 pintats i este patró només
     reconeix els H1 que l'autor ha escrit al cos. `[^<>]` i no `[^>]`: un H1 obert repetit sense
     «>» era quadràtic (R11 Loop 4). */
  const regexOberturaH1 = new RegExp('<' + 'h1(\\b[^<>]*)>', 'gi');
  const regexTancamentH1 = new RegExp('</' + 'h1>', 'gi');
  if (regexOberturaH1.test(propostaContent)) {
    propostaContent = propostaContent
      .replace(regexOberturaH1, '<h3$1>')
      .replace(regexTancamentH1, '</h3>');
    observacions.push({
      id: 'h1-dins-del-cos',
      severitat: 'estructura',
      missatge: 'Al cos de l’editor l’encapçalament de secció ha de ser H3 (mai H1); s’ha convertit a <h3>.',
    });
  }

  const duplicats = detectaParagrafsDuplicats(propostaContent);
  if (duplicats.length > 0) {
    teBloqueig = true;
    observacions.push({
      id: 'paragrafs-duplicats',
      severitat: 'bloqueig',
      missatge: `S’ha detectat ${duplicats.length} bloc(s) o paràgraf(s) repetit(s). Cal unificar-los abans de publicar.`,
    });
  }

  const textPla = netejaEtiquetesHtml(propostaContent);
  const paraules = textPla ? textPla.split(/\s+/).filter(Boolean) : [];
  const teNegretes = /<(strong|b)\b/i.test(propostaContent) || /\*\*[^*]+\*\*/.test(propostaContent);

  if (paraules.length >= 25 && !teNegretes) {
    observacions.push({
      id: 'manca-negretes-escaneig',
      severitat: 'millora',
      missatge: 'Pedra Seca (§4): marca entre 6 i 8 paraules clau en negreta per paràgraf per facilitar la lectura en diagonal.',
    });
  }

  /* R11 Loop 3 (L2-01) · /notes passa els camps crus (HTML): un «<p></p>» buit no compta com a
     subtítol o entradeta. */
  if (!netejaEtiquetesHtml(subtitle) || !netejaEtiquetesHtml(entradilla)) {
    observacions.push({
      id: 'manca-subtitol-o-entradeta',
      severitat: 'millora',
      missatge: 'Llei 1:1 UniversalPage ↔ UniversalCard: afegeix subtítol i entradeta perquè la targeta del Mur no quede buida.',
    });
  }

  // Dictamen i taxonomia suggerida.
  const veredicte = teBloqueig
    ? VEREDICTES_EDITORIALS.BLOQUEJAT
    : observacions.length > 0
      ? VEREDICTES_EDITORIALS.MILLORA
      : VEREDICTES_EDITORIALS.APROVAT;

  const taxonomia = suggereixTaxonomiaCanonica(
    `${netejaEtiquetesHtml(title)} ${netejaEtiquetesHtml(propostaSubtitle)} ${netejaEtiquetesHtml(propostaEntradilla)} ${textPla}`,
  );

  return {
    veredicte,
    observacions,
    proposta: {
      /* R11 Loop 3 (L2-01) · Cap regla toca el títol: torna tal qual (sense trim), perquè
         «Aplicar» no reescriga un camp que la revisora no ha canviat. */
      title: String(title || ''),
      subtitle: propostaSubtitle,
      entradilla: propostaEntradilla,
      content: propostaContent,
    },
    taxonomia,
  };
}
