/**
 * i18nEdicioSistema.js — R32.45 · IDEA-324 v3 · Textos en les 5 llengües
 * oficials (`ca`, `es`, `en`, `eu`, `gl`) per a l'edició in situ de Sistema,
 * l'historial de versions append-only i la confirmació de retorn d'identitat
 * («Vols tornar a ser {anterior}?»).
 *
 * Viu dins de `src/sections/notes/` (`lazyRoute`: `+0 B` a `pesDelNucli`) i
 * allibera claus del diccionari síncron d'arrencada.
 *
 * v1.2.23 · L5-07 (Gauntlet R1) · `avisCanviPerfil` diu el que ha passat, en
 * valencià normatiu i igual en les 5 llengües: el Mas ha canviat la identitat
 * activa per a editar (useEdicioEnLloc · setActor), no la persona, i el que
 * s'edita pot ser una pàgina del sistema o una publicació, no sempre un article.
 */

export const TEXTOS_EDICIO_SISTEMA = Object.freeze({
  ca: Object.freeze({
    revisioSistemaDesada: 'Pàgina del sistema actualitzada en este navegador: els canvis ja són visibles.',
    historialRegio: 'Historial de versions',
    historialDesfer: 'Desfer última edició',
    historialBoto: 'Versions ({n})',
    historialTanca: 'Tancar les versions',
    historialOriginal: 'Original canònic',
    historialRestaura: 'Restaurar',
    historialRestaurada: 'S’ha restaurat la versió anterior.',
    historialExporta: 'Exportar per a la IAIA',
    historialExportat: 'S’ha descarregat el registre d’edicions humanes.',
    retornRegio: 'Canvi temporal d’identitat per a edició',
    avisCanviPerfil: 'Per a editar este contingut, ara actues com a {actual}.',
    botoTornar: 'Tornar',
    preguntaRetorn: 'Vols tornar a ser {anterior}?',
    detallRetorn: 'Ara actues com a {actual}. Tria amb quin perfil vols tornar a la pàgina.',
    siTorna: 'Sí, torna a {anterior}',
    noQuedat: 'No, queda’t com a {actual}'
  }),
  es: Object.freeze({
    revisioSistemaDesada: 'Página del sistema actualizada en este navegador: los cambios ya son visibles.',
    historialRegio: 'Historial de versiones',
    historialDesfer: 'Deshacer última edición',
    historialBoto: 'Versiones ({n})',
    historialTanca: 'Cerrar las versiones',
    historialOriginal: 'Original canónico',
    historialRestaura: 'Restaurar',
    historialRestaurada: 'Se ha restaurado la versión anterior.',
    historialExporta: 'Exportar para la IAIA',
    historialExportat: 'Se ha descargado el registro de ediciones humanas.',
    retornRegio: 'Cambio temporal de identidad para edición',
    avisCanviPerfil: 'Para editar este contenido, ahora actúas como {actual}.',
    botoTornar: 'Volver',
    preguntaRetorn: '¿Quieres volver a ser {anterior}?',
    detallRetorn: 'Ahora actúas como {actual}. Elige con qué perfil quieres volver a la página.',
    siTorna: 'Sí, volver a {anterior}',
    noQuedat: 'No, seguir como {actual}'
  }),
  en: Object.freeze({
    revisioSistemaDesada: 'System page updated in this browser: changes are now visible.',
    historialRegio: 'Version history',
    historialDesfer: 'Undo last edit',
    historialBoto: 'Versions ({n})',
    historialTanca: 'Close versions',
    historialOriginal: 'Canonical original',
    historialRestaura: 'Restore',
    historialRestaurada: 'Previous version restored.',
    historialExporta: 'Export for IAIA',
    historialExportat: 'Human edits log downloaded.',
    retornRegio: 'Temporary identity switch for editing',
    avisCanviPerfil: 'To edit this content, you are now acting as {actual}.',
    botoTornar: 'Back',
    preguntaRetorn: 'Do you want to switch back to {anterior}?',
    detallRetorn: 'You are currently acting as {actual}. Choose which profile to return with.',
    siTorna: 'Yes, switch back to {anterior}',
    noQuedat: 'No, stay as {actual}'
  }),
  eu: Object.freeze({
    revisioSistemaDesada: 'Sistemaren orria eguneratu da nabigatzaile honetan: aldaketak ikusgai daude jada.',
    historialRegio: 'Bertsioen historia',
    historialDesfer: 'Desegin azken edizioa',
    historialBoto: 'Bertsioak ({n})',
    historialTanca: 'Itxi bertsioak',
    historialOriginal: 'Jatorrizko kanonikoa',
    historialRestaura: 'Leheneratu',
    historialRestaurada: 'Aurreko bertsioa leheneratu da.',
    historialExporta: 'Esportatu IAIArentzat',
    historialExportat: 'Giza edizioen erregistroa deskargatu da.',
    retornRegio: 'Editatzeko aldi baterako identitate-aldaketa',
    avisCanviPerfil: 'Eduki hau editatzeko, orain {actual} gisa ari zara.',
    botoTornar: 'Itzuli',
    preguntaRetorn: 'Berriro {anterior} izan nahi duzu?',
    detallRetorn: 'Une honetan {actual} gisa ari zara. Aukeratu zein profilekin itzuli nahi duzun.',
    siTorna: 'Bai, itzuli {anterior} izatera',
    noQuedat: 'Ez, jarraitu {actual} gisa'
  }),
  gl: Object.freeze({
    revisioSistemaDesada: 'Páxina do sistema actualizada neste navegador: os cambios xa son visibles.',
    historialRegio: 'Historial de versións',
    historialDesfer: 'Desfacer última edición',
    historialBoto: 'Versións ({n})',
    historialTanca: 'Pechar as versións',
    historialOriginal: 'Orixinal canónico',
    historialRestaura: 'Restaurar',
    historialRestaurada: 'Restaurouse a versión anterior.',
    historialExporta: 'Exportar para a IAIA',
    historialExportat: 'Descargouse o rexistro de edicións humanas.',
    retornRegio: 'Cambio temporal de identidade para edición',
    avisCanviPerfil: 'Para editar este contido, agora actúas como {actual}.',
    botoTornar: 'Volver',
    preguntaRetorn: 'Queres volver ser {anterior}?',
    detallRetorn: 'Agora actúas como {actual}. Escolle con que perfil queres volver á páxina.',
    siTorna: 'Si, volver ser {anterior}',
    noQuedat: 'Non, seguir como {actual}'
  })
});

export function normalitzaIdiomaEdicioSistema(idioma) {
  const codi = String(idioma || 'ca').toLowerCase().split(/[-_]/)[0];
  return Object.hasOwn(TEXTOS_EDICIO_SISTEMA, codi) ? codi : 'ca';
}

export function textosEdicioSistema(idioma) {
  return TEXTOS_EDICIO_SISTEMA[normalitzaIdiomaEdicioSistema(idioma)];
}

export function omplePlantillaEdicio(plantilla, valors = {}) {
  return String(plantilla || '').replace(/\{(\w+)\}/g, (_tot, clau) => (
    Object.hasOwn(valors, clau) && valors[clau] != null ? String(valors[clau]) : ''
  ));
}
