/** Authorized original bytes. Only imported by the optional historical seed. */
import MANIFEST from './parroquiaFotos.generated.json';
const URLS = import.meta.glob('../../assets/bar/parroquia/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' });
const ASSETS = Object.fromEntries(Object.entries(URLS).map(([path, url]) => [path.split('/').at(-1), url]));
const MAPA = new Map(MANIFEST.associacions.map((entry) => [entry.destiOrigen, entry]));
const nfc = (text) => String(text ?? '').normalize('NFC');
const stem = (name) => name.slice(0, name.lastIndexOf('.'));

/** All 398 source records, including duplicate bytes and unmatched photos. */
export function indexFotosParroquia() {
  return { ...structuredClone(MANIFEST), imatges: MANIFEST.imatges.map((image) => ({ ...image, url: ASSETS[image.fitxer] })) };
}

/** Only exact source-map, product-slug or REF equality. No approximate name matching. */
export function fotoDeProducteParroquia(producte) {
  const destination = `${producte.categoriaOrigenId || producte.categoriaId}/${producte.imatge.slug}`;
  const mapping = MAPA.get(destination);
  if (mapping?.confirmacioPendent) return null;
  if (mapping?.estat === 'disponible') {
    const image = MANIFEST.imatges.find((item) => item.rutaOriginal === mapping.rutaOriginal);
    return image && ASSETS[image.fitxer] ? { ...image, url: ASSETS[image.fitxer], metode: mapping.metode, destiMapa: destination } : null;
  }
  const refs = new Set(producte.variants.map((variant) => nfc(variant.ref)).filter(Boolean));
  const candidates = MANIFEST.imatges.filter((image) => (!image.categoria || image.categoria === producte.categoriaHostaleria)
    && (nfc(stem(image.nomFitxerOriginal)) === producte.imatge.slug || refs.has(nfc(stem(image.nomFitxerOriginal)))));
  if (candidates.length !== 1 || !ASSETS[candidates[0].fitxer]) return null;
  const image = candidates[0];
  return { ...image, url: ASSETS[image.fitxer], metode: refs.has(nfc(stem(image.nomFitxerOriginal))) ? 'ref_exacta' : 'slug_exacte' };
}

export function incorporaFotosParroquia(carta) {
  let matched = 0;
  const productes = carta.productes.map((producte) => {
    const photo = fotoDeProducteParroquia(producte);
    if (!photo) return producte;
    matched += 1;
    return { ...producte, imatge: { ...producte.imatge, estat: 'definitiva', origen: 'corpus-parroquia',
      url: photo.url, sha256: photo.sha256, rutaOriginal: photo.rutaOriginal, metode: photo.metode } };
  });
  return { ...carta, productes, fotosParroquia: { ...structuredClone(MANIFEST.resum), productesAmbFoto: matched,
    productesPendentsFoto: productes.length - matched } };
}
