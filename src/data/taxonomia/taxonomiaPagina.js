const CATEGORIES = new Set(['Sistema','Mur','Mercat','Calendari','Mapa','Transport','Animalets','Treball','Habitatge','Catàlegs','Vídeo','PDF']);
const CAMPS = ['idPagina','categoriesSistema','categoriesTematiques','etiquetes','geografia','mencions','versio'];
const GEO = ['xarxa','demarcacions','comarques','pobles','paratges'];
const falla = () => { throw new TypeError('Taxonomia de pàgina invàlida.'); };
function pla(v) { if (!v || typeof v !== 'object' || Array.isArray(v) || ![Object.prototype, null].includes(Object.getPrototypeOf(v))) falla(); return v; }
function valor(v, k) { const d = Object.getOwnPropertyDescriptor(v,k); if (d && !Object.hasOwn(d,'value')) falla(); return d?.value; }
function llista(v, max = 100) {
  if (!Array.isArray(v) || v.length > max) falla();
  const nets = [];
  for (let i = 0; i < v.length; i++) {
    const item = valor(v,String(i));
    if (typeof item !== 'string' || !item.trim() || item.length > 200 || /[\u0000-\u001f\u007f]/u.test(item)) falla();
    nets.push(item.trim());
  }
  return Object.freeze([...new Set(nets)]);
}
export function capturaIdPagina(id) {
  if (typeof id !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_/-]{0,199}$/.test(id) || id.split('/').some(s => !s)) falla();
  return id;
}
export function capturaTaxonomiaPagina(idPagina, input) {
  capturaIdPagina(idPagina); pla(input);
  if (Object.hasOwn(input,'idPagina') && valor(input,'idPagina') !== idPagina) falla();
  if (Object.keys(input).some(k => !CAMPS.includes(k))) falla();
  const categoriesSistema = llista(valor(input,'categoriesSistema'),12);
  if (!categoriesSistema.length || categoriesSistema.some(c => !CATEGORIES.has(c))) falla();
  const geografia = pla(valor(input,'geografia') ?? {}), geo = {};
  if (Object.keys(geografia).some(k => !GEO.includes(k))) falla();
  for (const clau of GEO) if (Object.hasOwn(geografia, clau)) geo[clau] = llista(valor(geografia,clau));
  const versio = valor(input,'versio') ?? 0;
  if (!Number.isSafeInteger(versio) || versio < 0) falla();
  return Object.freeze({ idPagina, categoriesSistema, categoriesTematiques: llista(valor(input,'categoriesTematiques') ?? []),
    etiquetes: llista(valor(input,'etiquetes') ?? []), geografia: Object.freeze(geo), mencions: llista(valor(input,'mencions') ?? []), versio });
}
export function projectaTaxonomiaPagina(row) {
  pla(row);
  const net = capturaTaxonomiaPagina(valor(row,'idPagina'), row);
  if (net.versio < 1) falla();
  return net;
}
