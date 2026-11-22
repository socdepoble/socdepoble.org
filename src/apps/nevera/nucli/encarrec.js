/**
 * La Nevera de Casa · IDEA-258b (Onada R24) · Precomanda per a la botiga local / de poble, pura.
 *
 * Prepara un encàrrec llegible, ordenat per les seccions de la llista activa,
 * pensat per enviar d'un toc al forn, la carnisseria, la cooperativa agrícola
 * o la botiga de poble sense passar per cap passarel·la ni servidor alié.
 *
 * Garanties d'arquitectura i Llei 0 / IDEA-258:
 *   · 100% pur: cap React, cap xarxa, cap disc.
 *   · Zero mutació de `dades/productes.js`.
 *   · Cap marca blanca de gran superfície (`Mercadona`, `Hacendado`,
 *     `Bosque Verde`, `Deliplus`, `Compy`) ni cap preu d'hipermercat no ix mai
 *     al text ni a les estructures retornades.
 */
import { CATEGORIES, ID_PROPIS } from './cataleg.js';
import { LIMITS, articlePerId, clauDeNom, liniesOrdenades, llistaPerId, netejaText, textQuantitat } from './nevera.js';

const MARQUES_GRAN_SUPERFICIE = new Set(['mercadona', 'hacendado', 'bosque verde', 'deliplus', 'compy']);
const PATRO_MARCA_GRAN_SUPERFICIE = /\b(?:Mercadona|Hacendado|Bosque Verde|Deliplus|Compy)\b/gi;

const TITOLS_LLISTA_BOTIGA = Object.freeze({
  ca: 'Botiga de poble',
  es: 'Tienda de pueblo',
  en: 'Village shop',
  eu: 'Herriko denda',
  gl: 'Tenda da vila'
});

const NOMS_SECCIO_I18N = Object.freeze({
  ca: Object.freeze(Object.fromEntries(CATEGORIES.map((c) => [c.id, c.nom]))),
  es: Object.freeze({
    'fruita-verdura': 'Fruta y verdura',
    'pa-pastissos': 'Pan y bollería',
    'llet-formatge': 'Leche y queso',
    'carn-peix': 'Carne y pescado',
    'ingredients-especies': 'Despensa y especias',
    congelats: 'Congelados',
    'cereals-pasta': 'Cereales y pasta',
    'picar-dolcos': 'Aperitivos y dulces',
    begudes: 'Bebidas',
    llar: 'Hogar',
    'higiene-salut': 'Higiene y salud',
    mascotes: 'Mascotas',
    jardi: 'Jardín',
    [ID_PROPIS]: 'Artículos propios'
  }),
  en: Object.freeze({
    'fruita-verdura': 'Fruit and vegetables',
    'pa-pastissos': 'Bread and bakery',
    'llet-formatge': 'Milk and cheese',
    'carn-peix': 'Meat and fish',
    'ingredients-especies': 'Pantry and spices',
    congelats: 'Frozen goods',
    'cereals-pasta': 'Grains and pasta',
    'picar-dolcos': 'Snacks and sweets',
    begudes: 'Drinks',
    llar: 'Household',
    'higiene-salut': 'Personal care and health',
    mascotes: 'Pets',
    jardi: 'Garden',
    [ID_PROPIS]: 'Custom items'
  }),
  eu: Object.freeze({
    'fruita-verdura': 'Fruta eta barazkiak',
    'pa-pastissos': 'Ogia eta gozogintza',
    'llet-formatge': 'Esnea eta gazta',
    'carn-peix': 'Haragia eta arraina',
    'ingredients-especies': 'Jakitegia eta espeziak',
    congelats: 'Izoztuak',
    'cereals-pasta': 'Zerealak eta pasta',
    'picar-dolcos': 'Mokaduak eta gozoak',
    begudes: 'Edariak',
    llar: 'Etxea',
    'higiene-salut': 'Higienea eta osasuna',
    mascotes: 'Maskotak',
    jardi: 'Lorategia',
    [ID_PROPIS]: 'Norberaren artikuluak'
  }),
  gl: Object.freeze({
    'fruita-verdura': 'Froita e verdura',
    'pa-pastissos': 'Pan e pastelaría',
    'llet-formatge': 'Leite e queixo',
    'carn-peix': 'Carne e peixe',
    'ingredients-especies': 'Despensa e especias',
    congelats: 'Conxelados',
    'cereals-pasta': 'Cereais e pasta',
    'picar-dolcos': 'Petiscos e doces',
    begudes: 'Bebidas',
    llar: 'Fogar',
    'higiene-salut': 'Hixiene e saúde',
    mascotes: 'Mascotas',
    jardi: 'Xardín',
    [ID_PROPIS]: 'Artigos propios'
  })
});

const PLANTILLES_TEXT = Object.freeze({
  ca: Object.freeze({
    capcalera: (titol) => `Encàrrec per a la botiga local · ${titol}`,
    comerc: (v) => `Comerç: ${v}`,
    recollida: (v) => `Recollida o nota: ${v}`,
    signatura: (v) => `De part de: ${v}`,
    comptador: (n) => `${n} ${n === 1 ? 'article pendent' : 'articles pendents'}`,
    peu: 'Preparat des de La Nevera de Casa · Sóc de Poble'
  }),
  es: Object.freeze({
    capcalera: (titol) => `Encargo para la tienda local · ${titol}`,
    comerc: (v) => `Comercio: ${v}`,
    recollida: (v) => `Recogida o nota: ${v}`,
    signatura: (v) => `De parte de: ${v}`,
    comptador: (n) => `${n} ${n === 1 ? 'artículo pendiente' : 'artículos pendientes'}`,
    peu: 'Preparado desde La Nevera de Casa · Sóc de Poble'
  }),
  en: Object.freeze({
    capcalera: (titol) => `Pre-order for the local shop · ${titol}`,
    comerc: (v) => `Shop: ${v}`,
    recollida: (v) => `Pickup or note: ${v}`,
    signatura: (v) => `From: ${v}`,
    comptador: (n) => `${n} ${n === 1 ? 'pending item' : 'pending items'}`,
    peu: 'Prepared with Home Pantry · Sóc de Poble'
  }),
  eu: Object.freeze({
    capcalera: (titol) => `Herriko dendarako enkargua · ${titol}`,
    comerc: (v) => `Saltokia: ${v}`,
    recollida: (v) => `Bilketa edo oharra: ${v}`,
    signatura: (v) => `Noren partetik: ${v}`,
    comptador: (n) => `${n} artikulu zain`,
    peu: 'Etxeko Hozkailutik prestatua · Sóc de Poble'
  }),
  gl: Object.freeze({
    capcalera: (titol) => `Encargo para a tenda local · ${titol}`,
    comerc: (v) => `Comercio: ${v}`,
    recollida: (v) => `Recollida ou nota: ${v}`,
    signatura: (v) => `De parte de: ${v}`,
    comptador: (n) => `${n} ${n === 1 ? 'artigo pendente' : 'artigos pendentes'}`,
    peu: 'Preparado dende A Neveira da Casa · Sóc de Poble'
  })
});

function purgaMarquesGranSuperficie(valor) {
  if (typeof valor !== 'string') return '';
  return valor.replace(PATRO_MARCA_GRAN_SUPERFICIE, '').replace(/\s{2,}/g, ' ').trim();
}

function marcaProducteNeta(marca) {
  const neta = netejaText(marca, LIMITS.nom);
  if (!neta) return '';
  if (MARQUES_GRAN_SUPERFICIE.has(neta.toLocaleLowerCase('ca'))) return '';
  return purgaMarquesGranSuperficie(neta);
}

/* v1.2.19 · Gauntlet R1 (L3-02) · La llista de botiga es desa amb un nom canònic
   (o, si es va crear abans fora del valencià, amb una traducció): l'encàrrec la
   titula sempre en la llengua triada. */
const NOMS_LLISTA_BOTIGA = new Set([...Object.values(TITOLS_LLISTA_BOTIGA), 'Catàleg de botiga'].map((nom) => nom.toLocaleLowerCase('ca')));

export function netejaNomLlistaEncarrec(nom, idioma = 'ca') {
  const llengua = Object.hasOwn(TITOLS_LLISTA_BOTIGA, idioma) ? idioma : 'ca';
  const net = netejaText(nom, LIMITS.nom);
  const clau = net ? net.toLocaleLowerCase('ca') : '';
  if (!net || MARQUES_GRAN_SUPERFICIE.has(clau) || NOMS_LLISTA_BOTIGA.has(clau)) {
    return TITOLS_LLISTA_BOTIGA[llengua];
  }
  const purgat = purgaMarquesGranSuperficie(net);
  return purgat || TITOLS_LLISTA_BOTIGA[llengua];
}

export function netejaNomArticleEncarrec(article) {
  if (!article || typeof article.nom !== 'string') return '';
  const base = article.font ? purgaMarquesGranSuperficie(article.nom) : article.nom.trim();
  return netejaText(base, LIMITS.nom);
}

function detallArticleEncarrec(article, especificacioCrua) {
  const especificacio = purgaMarquesGranSuperficie(netejaText(especificacioCrua, LIMITS.especificacio));
  if (!article?.font) return especificacio;
  const quantitat = textQuantitat(article.quantitat, article.unitat);
  const envasCru = purgaMarquesGranSuperficie(netejaText(article.envas, LIMITS.especificacio));
  const jaHiEs = quantitat !== '' && ` ${clauDeNom(envasCru)} `.includes(` ${clauDeNom(quantitat)} `);
  const envas = [envasCru, jaHiEs ? '' : quantitat].filter(Boolean).join(' ');
  const marca = marcaProducteNeta(article.marca);
  const formatBotiga = [marca, envas].filter(Boolean).join(' · ');
  if (especificacio && formatBotiga) {
    return clauDeNom(especificacio) === clauDeNom(formatBotiga)
      ? especificacio
      : `${especificacio} (${formatBotiga})`;
  }
  return especificacio || formatBotiga;
}

/**
 * Genera l'estructura i el text pla d'una precomanda per a la botiga local.
 *
 * @param {object} estat Estat normalitzat de La Nevera.
 * @param {string} llistaId Identificador de la llista de la compra.
 * @param {object} [opcions]
 * @param {string} [opcions.idioma='ca'] Codi de llengua (`ca`, `es`, `en`, `eu`, `gl`).
 * @param {string} [opcions.comerc=''] Nom opcional del comerç, forn o cooperativa.
 * @param {string} [opcions.recollida=''] Franja de recollida o indicació breu.
 * @param {string} [opcions.signatura=''] Nom de qui fa l'encàrrec.
 */
export function creaEncarrecBotigaPoble(estat, llistaId, {
  idioma = 'ca',
  comerc = '',
  recollida = '',
  signatura = ''
} = {}) {
  const llista = llistaPerId(estat, llistaId);
  if (!llista) return Object.freeze({ ok: false, codi: 'sense-llista' });

  const llengua = Object.hasOwn(PLANTILLES_TEXT, idioma) ? idioma : 'ca';
  const plantilla = PLANTILLES_TEXT[llengua];
  const nomsSeccio = NOMS_SECCIO_I18N[llengua];
  const titolLlista = netejaNomLlistaEncarrec(llista.nom, llengua);

  const comercNet = purgaMarquesGranSuperficie(netejaText(comerc, LIMITS.nom));
  const recollidaNeta = purgaMarquesGranSuperficie(netejaText(recollida, LIMITS.especificacio));
  const signaturaNeta = purgaMarquesGranSuperficie(netejaText(signatura, LIMITS.nom));

  const ordenades = liniesOrdenades(estat, llistaId);
  const grupsMap = new Map();
  let totalArticles = 0;

  for (const fila of ordenades) {
    const article = articlePerId(estat, fila.articleId);
    if (!article) continue;
    const nom = netejaNomArticleEncarrec(article);
    if (!nom) continue;
    const detall = detallArticleEncarrec(article, fila.especificacio);
    const seccioId = article.categoriaId || ID_PROPIS;
    if (!grupsMap.has(seccioId)) {
      grupsMap.set(seccioId, {
        id: seccioId,
        nom: nomsSeccio[seccioId] || NOMS_SECCIO_I18N.ca[seccioId] || seccioId,
        linies: []
      });
    }
    grupsMap.get(seccioId).linies.push(Object.freeze({
      articleId: article.id,
      nom,
      detall
    }));
    totalArticles += 1;
  }

  if (totalArticles === 0) {
    return Object.freeze({ ok: false, codi: 'sense-articles' });
  }

  const seccions = Object.freeze(
    [...grupsMap.values()].map((grup) => Object.freeze({
      id: grup.id,
      nom: grup.nom,
      linies: Object.freeze(grup.linies)
    }))
  );

  const capcaleraLinies = [
    plantilla.capcalera(titolLlista),
    plantilla.comptador(totalArticles),
    comercNet ? plantilla.comerc(comercNet) : '',
    recollidaNeta ? plantilla.recollida(recollidaNeta) : '',
    signaturaNeta ? plantilla.signatura(signaturaNeta) : ''
  ].filter(Boolean);

  const cosSeccions = seccions.map((seccio) => {
    const filesText = seccio.linies.map((l) => (l.detall ? `- ${l.nom}: ${l.detall}` : `- ${l.nom}`));
    return [`[${seccio.nom}]`, ...filesText].join('\n');
  });

  const text = `${capcaleraLinies.join('\n')}\n\n${cosSeccions.join('\n\n')}\n\n— ${plantilla.peu}`;

  return Object.freeze({
    ok: true,
    titolLlista,
    totalArticles,
    seccions,
    text
  });
}
