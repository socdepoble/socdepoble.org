/**
 * arbreMultimedia.js — El model de l'espai de treball de /multimedia
 * (IDEA-55 + P1-71 · Onada 261029_1605, Bloc E): les categories (Columna 1),
 * els ítems (Columna 2), la selecció efectiva que es llig de la URL i els
 * paràmetres que s'hi escriuen. Pur: sense React ni JSX (les icones i els
 * textos arriben injectats), es prova en Node.
 *
 * Privadesa (el més seriós):
 *   · Cap ruta ni cap nom local a la URL: les carpetes i els arxius locals
 *     porten ids OPACS, `__lc_<hash>` i `__lf_<hash>`, fets amb cyrb53 sobre
 *     la SAL del volum + '\u0000' + la ruta. La sal és aleatòria per a TOTS
 *     els volums: l'UUID de la biblioteca per als recordats i un
 *     crypto.randomUUID() fet en crear-lo per als d'esta sessió. Sense la sal,
 *     un diccionari de noms de carpeta (00_inbox, documents_i_pdfs…) no
 *     reverteix l'id de l'historial sincronitzat del navegador.
 *   · L'arrel del volum és sempre `local_root`, sense hash.
 *
 * Ordre del model (decidix l'autoselecció del workspace, que tria el primer
 * ítem elegible en l'ordre del model): la portada, les vistes de les galeries,
 * la vista de l'arrel local i la de la carpeta local activa, el catàleg i, al
 * final, els arxius DIRECTES de la carpeta activa. Una vista porta la data
 * més nova dels seus membres (`updatedAt`): amb l'ordenació per data de la
 * Columna 2 (estable) va la primera.
 */
import { ALL_CATEGORY_ID } from '../../components/universal/workspace/workspaceState.js';
import { SENSE_DATA, etiquetaDelMes } from './cronologia.js';
import { etiquetesEstatLocal, formatKb } from './motorMultimediaLocal.js';
import { nomVisibleLocal } from './suportGestorLocal.js';
import { omple } from './textosGestorLocal.js';
import { segonsNombre } from './textosEspaiMultimedia.js';

export const CATEGORIA_PORTADA = '__intro_cat';
export const ITEM_PORTADA = '__intro';
export const GALERIA_TOTS = 'galeria_tots';
export const GALERIA_IAIA = 'galeria_iaia';
export const GALERIA_CRONOLOGIA = 'galeria_cronologia';
export const PREFIX_MES = 'mes_';
export const ARREL_LOCAL = 'local_root';
export const PREFIX_CARPETA_LOCAL = '__lc_';
export const PREFIX_ARXIU_LOCAL = '__lf_';
export const PREFIX_VISTA = '__carpeta_';
/** Arxius locals a la Columna 2, per carpeta (el llistat del workspace no es virtualitza). */
export const MAX_ARXIUS_A_LA_LLISTA = 1000;
/** Miniatures reals a la Columna 2 (dues pàgines d'àlbum); la resta, la icona del tipus. */
export const MAX_MINIATURES_A_LA_LLISTA = 48;
export const TOT = ALL_CATEGORY_ID;

const GALERIES = new Set([GALERIA_TOTS, GALERIA_IAIA, GALERIA_CRONOLOGIA]);
/* Un sol col·lador per a ordenar fins a 10.000 rutes (localeCompare amb llengua en crea un a cada crida). */
const ORDRE_CA = new Intl.Collator('ca');

/**
 * cyrb53 síncron, en base 36 (prou per a ids opacs d'un volum; no és cap
 * secret criptogràfic: la sal aleatòria és el que impedix revertir-lo).
 */
export function hash53(text, llavor = 0) {
  const cadena = String(text ?? '');
  let h1 = 0xdeadbeef ^ llavor;
  let h2 = 0x41c6ce57 ^ llavor;
  for (let i = 0; i < cadena.length; i += 1) {
    const codi = cadena.charCodeAt(i);
    h1 = Math.imul(h1 ^ codi, 2654435761);
    h2 = Math.imul(h2 ^ codi, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

const llavorDe = (sal, ruta) => `${String(sal ?? '')}\u0000${String(ruta ?? '')}`;

/** L'id opac d'una carpeta local: l'arrel ('') és `local_root`. */
export function idCarpetaLocal(sal, ruta, hash = hash53) {
  return !ruta ? ARREL_LOCAL : `${PREFIX_CARPETA_LOCAL}${hash(llavorDe(sal, ruta))}`;
}

/** L'id opac d'un arxiu local. */
export function idArxiuLocal(sal, ruta, hash = hash53) {
  return `${PREFIX_ARXIU_LOCAL}${hash(llavorDe(sal, ruta))}`;
}

/** L'ítem «vista de carpeta» d'una categoria (el primer de la Columna 2). */
export const idVistaDe = (categoryId) => `${PREFIX_VISTA}${categoryId}`;

/** La categoria d'una vista, o null si l'id no és cap vista. */
export const categoriaDeVista = (id) => (typeof id === 'string' && id.startsWith(PREFIX_VISTA) ? id.slice(PREFIX_VISTA.length) : null);

/** Si un id (de categoria o d'ítem) és de l'arbre local. */
export function esIdLocal(id) {
  if (typeof id !== 'string' || id === '') return false;
  const base = categoriaDeVista(id) ?? id;
  return base === ARREL_LOCAL || base.startsWith(PREFIX_CARPETA_LOCAL) || base.startsWith(PREFIX_ARXIU_LOCAL);
}

/** Els ids que fabrica l'espai (portada, vistes, locals) comencen per '__'. */
export const esIdSintetic = (id) => typeof id === 'string' && id.startsWith('__');

/** Si una categoria és del catàleg publicat (les galeries, els mesos o «Tot»). */
export const esCategoriaCataleg = (id) => typeof id === 'string' && (GALERIES.has(id) || id.startsWith(PREFIX_MES) || id === TOT);

/** L'ítem que es veu en triar una categoria sense cap ítem. */
export function itemPerDefecte(categoryId) {
  return categoryId === CATEGORIA_PORTADA || categoryId === TOT ? ITEM_PORTADA : idVistaDe(categoryId);
}

/* Les carpetes mares d'una ruta ('a/b/c' → 'a', 'a/b'). */
const maresDe = (ruta) => {
  const segs = ruta.split('/');
  return segs.slice(0, -1).map((_, i) => segs.slice(0, i + 1).join('/'));
};
const nomDe = (ruta) => ruta.slice(ruta.lastIndexOf('/') + 1);
const textNet = (valor) => (typeof valor === 'string' ? valor.trim() : '');

/**
 * L'índex del volum obert: una passada sobre l'anàlisi. Les col·lisions de
 * hash es resolen amb el sufix '_2', '_3'… en l'ordre de les rutes
 * (determinista).
 * → { sal, categories: [{ id, label, parentId }], idDeCarpeta, carpetaDeId,
 *     idDArxiu, arxiuDeId, directes: Map<carpeta, element[]> }
 */
export function indexaArbreLocal({ sal, carpetes = [], elements = [], hash = hash53 }) {
  const totes = new Set();
  const afig = (ruta) => {
    if (typeof ruta !== 'string' || ruta === '' || totes.has(ruta)) return;
    for (const mare of maresDe(ruta)) totes.add(mare);
    totes.add(ruta);
  };
  for (const ruta of carpetes) afig(ruta);
  for (const el of elements) afig(el?.carpeta);
  const ordenades = [...totes].sort(ORDRE_CA.compare);

  const usats = new Set([ARREL_LOCAL]);
  const unic = (base) => {
    if (!usats.has(base)) {
      usats.add(base);
      return base;
    }
    let n = 2;
    while (usats.has(`${base}_${n}`)) n += 1;
    usats.add(`${base}_${n}`);
    return `${base}_${n}`;
  };

  const idDeCarpeta = new Map([['', ARREL_LOCAL]]);
  const carpetaDeId = new Map([[ARREL_LOCAL, '']]);
  const categories = [];
  for (const ruta of ordenades) {
    const id = unic(idCarpetaLocal(sal, ruta, hash));
    idDeCarpeta.set(ruta, id);
    carpetaDeId.set(id, ruta);
    const barra = ruta.lastIndexOf('/');
    categories.push({ id, label: nomVisibleLocal(nomDe(ruta)), parentId: barra > 0 ? idDeCarpeta.get(ruta.slice(0, barra)) ?? ARREL_LOCAL : ARREL_LOCAL });
  }

  const idDArxiu = new Map();
  const arxiuDeId = new Map();
  const directes = new Map();
  const perRuta = [...elements].filter((el) => el && typeof el.ruta === 'string').sort((a, b) => ORDRE_CA.compare(a.ruta, b.ruta));
  for (const el of perRuta) {
    const id = unic(idArxiuLocal(sal, el.ruta, hash));
    idDArxiu.set(el.ruta, id);
    arxiuDeId.set(id, el);
    const carpeta = el.carpeta || '';
    if (!directes.has(carpeta)) directes.set(carpeta, []);
    directes.get(carpeta).push(el);
  }
  return { sal, categories, idDeCarpeta, carpetaDeId, idDArxiu, arxiuDeId, directes };
}

/**
 * El subtítol d'un arxiu local a la Columna 2: «carpeta · KB · ESTATS». Els
 * estats són les insígnies del Gestor en MAJÚSCULES; tot el que no és una
 * imatge porta «DOCUMENT» (i «DUPLICADA» si té un duplicat exacte).
 */
export function subtitolLocal(el, exactes, textos, locale = 'ca') {
  const insignies = textos?.insignies || {};
  const exacte = typeof exactes?.has === 'function' && exactes.has(el.ruta);
  const estats = el.tipus === 'imatge'
    ? etiquetesEstatLocal(el, exactes).map((etiqueta) => insignies[etiqueta]).filter(Boolean)
    : [textos?.document, exacte ? insignies.duplicada : null].filter(Boolean);
  const majuscules = estats.map((text) => {
    try {
      return String(text).toLocaleUpperCase(locale);
    } catch {
      return String(text).toUpperCase();
    }
  });
  return [nomVisibleLocal(el.carpeta || '/'), formatKb(el.mida, locale), ...(majuscules.length ? [majuscules.join(' · ')] : [])].join(' · ');
}

const maxIso = (valors) => {
  let millor = null;
  let ms = -Infinity;
  for (const valor of valors) {
    const t = Date.parse(valor);
    if (Number.isFinite(t) && t > ms) {
      ms = t;
      millor = new Date(t).toISOString();
    }
  }
  return millor || undefined;
};
const isoDeMs = (ms) => (Number.isFinite(ms) && ms > 0 ? new Date(ms).toISOString() : undefined);

/** Els mitjans del catàleg amb un id net i únic (cap '__…', cap repetit). */
export function mitjansValids(totes = []) {
  const vists = new Set();
  const valids = [];
  for (const m of totes) {
    const id = typeof m?.id === 'string' || typeof m?.id === 'number' ? String(m.id) : '';
    if (!id || id.startsWith('__') || vists.has(id)) continue;
    vists.add(id);
    valids.push(m);
  }
  return valids;
}

/** Les categories de la Columna 1 (es memoritzen a banda del model). */
export function construeixCategoriesMultimedia({ grupsMes = [], index = null, textos, icones = {}, locale = 'ca-ES' }) {
  return [
    { id: CATEGORIA_PORTADA, label: textos.portada, icon: icones.portada },
    { id: GALERIA_TOTS, label: textos.galeriaTots, icon: icones.tots },
    { id: GALERIA_IAIA, label: textos.galeriaIaia, icon: icones.iaia },
    { id: GALERIA_CRONOLOGIA, label: textos.cronologia, icon: icones.cronologia },
    ...grupsMes.map((grup) => ({
      id: `${PREFIX_MES}${grup.key}`,
      parentId: GALERIA_CRONOLOGIA,
      label: grup.key === SENSE_DATA ? textos.senseData : (etiquetaDelMes(grup.key, locale, textos.calendari) || grup.label || grup.key),
      icon: icones.mes
    })),
    /* Gauntlet 261029 (cicle 1, IDEA-57) · Triada, «Carpeta local» desplega les
       subcarpetes del volum actiu sense haver de prémer el chevron (expandOnSelect). */
    { id: ARREL_LOCAL, label: textos.local, icon: icones.local, expandOnSelect: true },
    ...(index ? index.categories : [])
  ];
}

/* El recompte i la data més nova dels arxius d'una carpeta i de les seues subcarpetes. */
function resumDeCarpeta(elements, carpeta) {
  const prefix = carpeta ? `${carpeta}/` : '';
  let n = 0;
  let pes = 0;
  let ms = 0;
  for (const el of elements) {
    if (prefix && !el.ruta.startsWith(prefix)) continue;
    n += 1;
    pes += Number(el.mida) || 0;
    if (Number(el.modificat) > ms) ms = Number(el.modificat);
  }
  return { n, pes, ms };
}

/**
 * Els ítems del model (Columna 2 i el que en trien les columnes 1 i 3).
 * `cataleg`: { totes, deLaIaia, grupsMes } de MultimediaSection. `index`:
 * indexaArbreLocal o null sense volum obert. `carpetaActiva`: la ruta local
 * activa ('' l'arrel) o null si la categoria no és local. `rutaSeleccionada`:
 * la de l'arxiu local actiu (s'hi afig encara que siga d'una altra carpeta).
 * `miniatures`: Map ruta → src (blob: o data:) de la Columna 2.
 */
export function construeixItemsMultimedia({
  cataleg = {}, index = null, elements = [], nomVolum = '', carpetaActiva = null, rutaSeleccionada = null,
  miniatures = null, exactes = null, textos, icones = {}, locale = 'ca-ES'
}) {
  const totes = mitjansValids(cataleg.totes || []);
  const deLaIaia = new Set(mitjansValids(cataleg.deLaIaia || []).map((m) => String(m.id)));
  const grupsMes = cataleg.grupsMes || [];
  const mesDe = new Map();
  for (const grup of grupsMes) {
    for (const m of grup.items || []) {
      const id = m?.id == null ? '' : String(m.id);
      if (id && !mesDe.has(id)) mesDe.set(id, grup.key);
    }
  }
  const etiquetaMes = (clau) => (clau === SENSE_DATA ? textos.senseData : etiquetaDelMes(clau, locale, textos.calendari));
  /* Gauntlet 261029 (i18n) · Amb un sol arxiu o una sola imatge, el singular
     (textos.*Un, si la secció el passa): cap «1 arxius». */
  const resumArxius = ({ n, pes }) => omple(segonsNombre(n, textos.arxius, textos.arxiusUn), { n, pes: formatKb(pes, locale) });
  const vista = (categoryId, nom, membres, extra = {}) => ({
    id: idVistaDe(categoryId),
    categoryIds: [categoryId],
    title: omple(textos.vistaCarpeta, { nom }),
    subtitle: omple(segonsNombre(membres.length, textos.imatges, textos.imatgesUn), { n: membres.length }),
    icon: icones.vista,
    updatedAt: maxIso(membres.map((m) => m.created_at)),
    ...extra
  });

  const items = [{
    id: ITEM_PORTADA,
    categoryIds: [CATEGORIA_PORTADA],
    title: textos.titol,
    subtitle: textos.portadaSubtitol,
    icon: icones.portada
  }];

  items.push(vista(GALERIA_TOTS, textos.galeriaTots, totes));
  items.push(vista(GALERIA_IAIA, textos.galeriaIaia, totes.filter((m) => deLaIaia.has(String(m.id)))));
  items.push(vista(GALERIA_CRONOLOGIA, textos.cronologia, totes));
  for (const grup of grupsMes) {
    const membres = mitjansValids(grup.items || []);
    items.push(vista(`${PREFIX_MES}${grup.key}`, etiquetaMes(grup.key) || grup.label || grup.key, membres));
  }

  /* Les vistes locals: l'arrel sempre (el lloc de «Vincular carpeta local») i
     la carpeta activa si és una subcarpeta. Les altres carpetes no en tenen
     fins que es trien (selectCategory dona itemId null i la secció ho llig
     com la seua vista). */
  const ambVolum = Boolean(index);
  const arrel = ambVolum ? resumDeCarpeta(elements, '') : null;
  items.push({
    id: idVistaDe(ARREL_LOCAL),
    categoryIds: [ARREL_LOCAL],
    title: ambVolum ? omple(textos.vistaCarpeta, { nom: nomVisibleLocal(nomVolum) || textos.local }) : textos.local,
    ...(ambVolum ? { subtitle: resumArxius(arrel), updatedAt: isoDeMs(arrel.ms) } : {}),
    icon: icones.vista
  });

  const carpeta = ambVolum && typeof carpetaActiva === 'string' ? carpetaActiva : null;
  const idCarpeta = carpeta !== null ? index.idDeCarpeta.get(carpeta) : null;
  if (carpeta && idCarpeta) {
    const resum = resumDeCarpeta(elements, carpeta);
    items.push({
      id: idVistaDe(idCarpeta),
      categoryIds: [idCarpeta],
      title: omple(textos.vistaCarpeta, { nom: nomVisibleLocal(nomDe(carpeta)) }),
      subtitle: resumArxius(resum),
      icon: icones.vista,
      updatedAt: isoDeMs(resum.ms)
    });
  }

  for (const m of totes) {
    const id = String(m.id);
    const clau = mesDe.get(id);
    items.push({
      id,
      categoryIds: [GALERIA_TOTS, GALERIA_CRONOLOGIA, ...(clau ? [`${PREFIX_MES}${clau}`] : []), ...(deLaIaia.has(id) ? [GALERIA_IAIA] : [])],
      title: textNet(m.title) || textNet(m.tag) || textos.senseTitol,
      subtitle: [textNet(m.tag) || textNet(m.source), clau ? etiquetaMes(clau) : ''].filter(Boolean).join(' · '),
      image: textNet(m.src) || undefined,
      updatedAt: textNet(m.created_at) || undefined
    });
  }

  if (carpeta !== null && idCarpeta) {
    const directes = index.directes.get(carpeta) || [];
    const recents = directes.length > MAX_ARXIUS_A_LA_LLISTA
      ? [...directes].sort((a, b) => (Number(b.modificat) || 0) - (Number(a.modificat) || 0)).slice(0, MAX_ARXIUS_A_LA_LLISTA)
      : directes;
    if (recents.length < directes.length) {
      const vistaActiva = items.find((item) => item.id === idVistaDe(idCarpeta));
      if (vistaActiva) vistaActiva.subtitle = omple(textos.llistaRetallada, { n: recents.length, total: directes.length });
    }
    const llista = [...recents];
    if (typeof rutaSeleccionada === 'string' && !llista.some((el) => el.ruta === rutaSeleccionada)) {
      const triat = index.arxiuDeId.get(index.idDArxiu.get(rutaSeleccionada));
      if (triat) llista.push(triat);
    }
    for (const el of llista) {
      const src = miniatures?.get?.(el.ruta);
      items.push({
        id: index.idDArxiu.get(el.ruta),
        categoryIds: [index.idDeCarpeta.get(el.carpeta || '') ?? ARREL_LOCAL],
        /* Gauntlet 261029 (cicle 1) · El nom per a pintar-lo (cap control de
           direcció del text: «RTL_<U+202E>gnp.md» no es fa passar per «RTL_dm.png»). */
        title: nomVisibleLocal(el.nom),
        subtitle: subtitolLocal(el, exactes, textos, locale),
        icon: (icones.tipus && (icones.tipus[el.tipus] || icones.tipus.document)) || undefined,
        ...(src ? { image: src } : {}),
        updatedAt: isoDeMs(Number(el.modificat)),
        searchText: `${el.nom} ${el.ruta}`
      });
    }
  }
  return items;
}

const textOnull = (valor) => (typeof valor === 'string' && valor !== '' ? valor : null);

/**
 * El que demana la URL, per a l'estat 'loading' del model: el catàleg
 * (galeries, mesos, «Tot», una foto o un ítem publicat) i un id local que no
 * és l'arrel (una carpeta o un arxiu: cal el volum obert per a resoldre'l).
 */
export function demandaDeLaUrl({ categoria = null, item = null, foto = null } = {}) {
  const c = textOnull(categoria);
  const i = textOnull(item);
  return {
    cataleg: Boolean(textOnull(foto)) || (Boolean(i) && !esIdSintetic(i)) || esCategoriaCataleg(c) || esCategoriaCataleg(categoriaDeVista(i)),
    localProfund: (esIdLocal(c) && c !== ARREL_LOCAL) || (esIdLocal(i) && i !== idVistaDe(ARREL_LOCAL))
  };
}

/**
 * La selecció que es veu, a partir de la URL ({ categoria, item, foto }).
 * Torna { categoryId, itemId, local } amb `local` = { carpeta, ruta|null } si
 * és de l'arbre local (o null). Mai escriu res: la URL es queda com és (un id
 * local sense el volum obert apunta a l'arrel i, en reconnectar, a l'arxiu).
 *   · `index`: indexaArbreLocal o null; `idsCataleg`: Set dels ids publicats;
 *     `catalegLlest`: si el catàleg ja ha arribat (una ?foto= absent només es
 *     descarta llavors).
 */
export function seleccioEfectiva(url = {}, { index = null, idsCataleg = null, catalegLlest = true } = {}) {
  const categoria = textOnull(url.categoria);
  const item = textOnull(url.item);
  const foto = textOnull(url.foto);
  const deLaVista = categoriaDeVista(item);

  if (esIdLocal(categoria) || esIdLocal(item)) {
    const arrel = { categoryId: ARREL_LOCAL, itemId: idVistaDe(ARREL_LOCAL), local: { carpeta: '', ruta: null } };
    if (!index) return arrel;
    if (item && item.startsWith(PREFIX_ARXIU_LOCAL)) {
      const el = index.arxiuDeId.get(item);
      if (el) {
        const deLaCarpeta = index.idDeCarpeta.get(el.carpeta || '') ?? ARREL_LOCAL;
        return { categoryId: categoria === TOT ? TOT : deLaCarpeta, itemId: item, local: { carpeta: el.carpeta || '', ruta: el.ruta } };
      }
    }
    const demanada = esIdLocal(categoria) ? categoria : deLaVista;
    if (!demanada || !index.carpetaDeId.has(demanada)) return arrel;
    return { categoryId: demanada, itemId: idVistaDe(demanada), local: { carpeta: index.carpetaDeId.get(demanada), ruta: null } };
  }

  const categoriaCataleg = esCategoriaCataleg(categoria) ? categoria : null;
  if (foto && !item && (!catalegLlest || !idsCataleg || idsCataleg.has(foto))) {
    return { categoryId: categoriaCataleg ?? GALERIA_TOTS, itemId: foto, local: null };
  }
  if (item === ITEM_PORTADA) return { categoryId: categoria === TOT ? TOT : CATEGORIA_PORTADA, itemId: ITEM_PORTADA, local: null };
  if (deLaVista) return { categoryId: deLaVista, itemId: item, local: null };
  if (item && !esIdSintetic(item)) return { categoryId: categoriaCataleg ?? GALERIA_TOTS, itemId: item, local: null };
  if (categoria) return { categoryId: categoria, itemId: itemPerDefecte(categoria), local: null };
  return { categoryId: CATEGORIA_PORTADA, itemId: ITEM_PORTADA, local: null };
}

/**
 * Els paràmetres nous de la URL per a una selecció del workspace: els valors
 * per defecte no s'hi escriuen (la portada, la vista de la categoria), mai
 * toca `foto` ni els paràmetres aliens, i sempre lleva `pagina` i `seccio`
 * (Gauntlet 261029, cicle 1: la secció de l'Índex és de la pàgina d'abans, i
 * la d'una pàgina local podia portar el nom d'un volum a una galeria
 * publicada, i d'allí a Compartir i a /connectar).
 */
export function paramsDeSeleccio(params, sel) {
  const next = new URLSearchParams(params);
  const categoria = sel?.categoryId == null ? TOT : String(sel.categoryId);
  const item = sel?.itemId == null ? null : String(sel.itemId);
  if (categoria === CATEGORIA_PORTADA && (item === null || item === ITEM_PORTADA)) {
    next.delete('categoria');
    next.delete('item');
  } else {
    next.set('categoria', categoria);
    if (item === null || item === itemPerDefecte(categoria)) next.delete('item');
    else next.set('item', item);
  }
  next.delete('pagina');
  next.delete('seccio');
  return next;
}

/** Si dues seleccions són la mateixa (un itemId null és la vista de la categoria). */
export function mateixaSeleccio(a, b) {
  const cat = (s) => (s?.categoryId == null ? TOT : String(s.categoryId));
  const item = (s) => (s?.itemId == null ? itemPerDefecte(cat(s)) : String(s.itemId));
  return cat(a) === cat(b) && item(a) === item(b);
}
