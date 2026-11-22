/**
 * Onada R32.30b · Lot 03 · Diccionari diferit d'accessibilitat per al Tauler
 * d'Administració (AdminSection, FacetaEstil, FacetaTaxonomia, SegonFactor)
 * en les 5 llengües oficials (ca, es, en, eu, gl).
 * Zero impacte a l'arrencada estàtica de WordPress (0 B a pesDelNucli) i
 * conservació byte a byte del valencià canònic (ca).
 * v1.2.19 · Gauntlet R1 (L3-01) · llevar, restaurar, afegirEtiqueta i canon són
 * el text visible dels botons; fora del valencià, el seu aria-label comença per
 * eixe text (WCAG 2.5.3). En ca, «Cànon» i «Afegir etiqueta» queden com en la
 * v1.2.18. categoriesNom, categoriaSingular, etiquetesNom i etiquetaSingular
 * són els noms que FacetaTaxonomia passa ja traduïts a les plantilles.
 */
const DICCIONARI_ADMIN_A11Y = Object.freeze({
  ca: Object.freeze({
    menuAdministracioAria: "Menú d'administració",
    tornarALaLlista: 'Tornar a la llista',
    canon: 'Cànon',
    tornarTokenAlCanonAria: (etiqueta) => `Tornar ${etiqueta} al cànon`,
    versionsDesadesAria: 'Versions desades',
    restaurar: 'Restaurar',
    restaurarVersioAria: (v) => `Restaurar la versió ${v}`,
    estilDelPobleAria: 'Estil del poble',
    contrastAria: 'Contrast',
    llistaAfegidesAria: (nom) => `${nom} afegides`,
    llevar: 'Llevar',
    categoriesNom: 'Categories',
    categoriaSingular: 'categoria',
    etiquetesNom: 'Etiquetes',
    etiquetaSingular: 'etiqueta',
    llevarValorSerieAria: (singular, valor) => `Llevar la ${singular} ${valor}`,
    accionsTaxonomiaAria: 'Accions de la taxonomia',
    previsualitzacioEtiquetesAria: (titol) => `Previsualització de les etiquetes de ${titol}`,
    llevarEtiquetaPaginaAria: (num, titol) => `Llevar l’etiqueta ${num} de ${titol}`,
    afegirEtiqueta: 'Afegir etiqueta',
    afegirEtiquetaPaginaAria: (titol) => `Afegir una etiqueta a ${titol}`,
    codiQrAlt: 'Codi QR per a l’aplicació d’autenticació',
    segonFactorAria: 'Segon factor',
  }),
  es: Object.freeze({
    menuAdministracioAria: 'Menú de administración',
    tornarALaLlista: 'Volver a la lista',
    canon: 'Canon',
    tornarTokenAlCanonAria: (etiqueta) => `Canon: restaurar ${etiqueta}`,
    versionsDesadesAria: 'Versiones guardadas',
    restaurar: 'Restaurar',
    restaurarVersioAria: (v) => `Restaurar la versión ${v}`,
    estilDelPobleAria: 'Estilo del pueblo',
    contrastAria: 'Contraste',
    llistaAfegidesAria: (nom) => `${nom} añadidas`,
    llevar: 'Quitar',
    categoriesNom: 'Categorías',
    categoriaSingular: 'categoría',
    etiquetesNom: 'Etiquetas',
    etiquetaSingular: 'etiqueta',
    llevarValorSerieAria: (singular, valor) => `Quitar la ${singular} ${valor}`,
    accionsTaxonomiaAria: 'Acciones de la taxonomía',
    previsualitzacioEtiquetesAria: (titol) => `Previsualización de las etiquetas de ${titol}`,
    llevarEtiquetaPaginaAria: (num, titol) => `Quitar la etiqueta ${num} de ${titol}`,
    afegirEtiqueta: 'Añadir etiqueta',
    afegirEtiquetaPaginaAria: (titol) => `Añadir etiqueta a ${titol}`,
    codiQrAlt: 'Código QR para la aplicación de autenticación',
    segonFactorAria: 'Segundo factor',
  }),
  en: Object.freeze({
    menuAdministracioAria: 'Administration menu',
    tornarALaLlista: 'Back to list',
    canon: 'Reset',
    tornarTokenAlCanonAria: (etiqueta) => `Reset ${etiqueta} to default`,
    versionsDesadesAria: 'Saved versions',
    restaurar: 'Restore',
    restaurarVersioAria: (v) => `Restore version ${v}`,
    estilDelPobleAria: 'Town style',
    contrastAria: 'Contrast',
    llistaAfegidesAria: (nom) => `Added ${nom}`,
    llevar: 'Remove',
    categoriesNom: 'Categories',
    categoriaSingular: 'category',
    etiquetesNom: 'Tags',
    etiquetaSingular: 'tag',
    llevarValorSerieAria: (singular, valor) => `Remove ${singular} ${valor}`,
    accionsTaxonomiaAria: 'Taxonomy actions',
    previsualitzacioEtiquetesAria: (titol) => `Tag preview for ${titol}`,
    llevarEtiquetaPaginaAria: (num, titol) => `Remove tag ${num} from ${titol}`,
    afegirEtiqueta: 'Add tag',
    afegirEtiquetaPaginaAria: (titol) => `Add tag to ${titol}`,
    codiQrAlt: 'QR code for authenticator app',
    segonFactorAria: 'Two-factor authentication',
  }),
  eu: Object.freeze({
    menuAdministracioAria: 'Administrazio-menua',
    tornarALaLlista: 'Itzuli zerrendara',
    canon: 'Kanona',
    tornarTokenAlCanonAria: (etiqueta) => `Kanona: leheneratu ${etiqueta}`,
    versionsDesadesAria: 'Gordetako bertsioak',
    restaurar: 'Leheneratu',
    restaurarVersioAria: (v) => `Leheneratu ${v}. bertsioa`,
    estilDelPobleAria: 'Herriaren estiloa',
    contrastAria: 'Kontrastea',
    llistaAfegidesAria: (nom) => `Gehitutako ${nom}`,
    llevar: 'Kendu',
    categoriesNom: 'Kategoriak',
    categoriaSingular: 'kategoria',
    etiquetesNom: 'Etiketak',
    etiquetaSingular: 'etiketa',
    llevarValorSerieAria: (singular, valor) => `Kendu ${valor} (${singular})`,
    accionsTaxonomiaAria: 'Taxonomiaren ekintzak',
    previsualitzacioEtiquetesAria: (titol) => `${titol} orriaren etiketen aurrebista`,
    llevarEtiquetaPaginaAria: (num, titol) => `Kendu ${titol} orriko ${num}. etiketa`,
    afegirEtiqueta: 'Gehitu etiketa',
    afegirEtiquetaPaginaAria: (titol) => `Gehitu etiketa bat ${titol} orrian`,
    codiQrAlt: 'Autentifikazio-aplikaziorako QR kodea',
    segonFactorAria: 'Bigarren faktorea',
  }),
  gl: Object.freeze({
    menuAdministracioAria: 'Menú de administración',
    tornarALaLlista: 'Volver á lista',
    canon: 'Canon',
    tornarTokenAlCanonAria: (etiqueta) => `Canon: restaurar ${etiqueta}`,
    versionsDesadesAria: 'Versións gardadas',
    restaurar: 'Restaurar',
    restaurarVersioAria: (v) => `Restaurar a versión ${v}`,
    estilDelPobleAria: 'Estilo do pobo',
    contrastAria: 'Contraste',
    llistaAfegidesAria: (nom) => `${nom} engadidas`,
    llevar: 'Quitar',
    categoriesNom: 'Categorías',
    categoriaSingular: 'categoría',
    etiquetesNom: 'Etiquetas',
    etiquetaSingular: 'etiqueta',
    llevarValorSerieAria: (singular, valor) => `Quitar a ${singular} ${valor}`,
    accionsTaxonomiaAria: 'Accións da taxonomía',
    previsualitzacioEtiquetesAria: (titol) => `Previsualización das etiquetas de ${titol}`,
    llevarEtiquetaPaginaAria: (num, titol) => `Quitar a etiqueta ${num} de ${titol}`,
    afegirEtiqueta: 'Engadir etiqueta',
    afegirEtiquetaPaginaAria: (titol) => `Engadir etiqueta a ${titol}`,
    codiQrAlt: 'Código QR para a aplicación de autenticación',
    segonFactorAria: 'Segundo factor',
  }),
});

export function codiLlenguaAdmin({ language = null, t = null } = {}) {
  if (typeof language === 'string' && language.trim()) {
    const base = language.trim().toLowerCase().split('-')[0];
    if (Object.hasOwn(DICCIONARI_ADMIN_A11Y, base)) return base;
  }
  if (typeof t === 'function') {
    const mostra = t('section.xat.ajustos.tancaSessio', 'Tanca la sessió');
    if (mostra === 'Cerrar sesión') return 'es';
    if (mostra === 'Log out') return 'en';
    if (mostra === 'Itxi saioa') return 'eu';
    if (mostra === 'Pechar sesión') return 'gl';
  }
  return 'ca';
}

export function textosAdminA11y(opcions = {}) {
  return DICCIONARI_ADMIN_A11Y[codiLlenguaAdmin(opcions)];
}
