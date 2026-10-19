/* Auditoria de seguretat 261019 (F4) · El src de la primera <img> d'un text,
   en temps lineal. Abans era /<img[^>]+src="([^">]+)"/, i un valor del payload
   amb molts '<img' i cap '>' (una cadena que començava per '/', i el disparador
   d'imatges pròpies la conservava) feia recórrer el text sencer des de cada
   '<img': treball quadràtic que congelava el Mur, el Mercat i el detall per a
   tot el poble. Este recorregut torna exactament el mateix que l'expressió:
   el tram d'una '<img' arriba fins al primer '>' (o al final), [^>]+ demana
   almenys un caràcter abans de 'src="' i, voraç, es queda amb l'últim
   src="…" vàlid del tram. Un tram sense cap no deixa casar cap '<img'
   posterior del mateix tram, i la cerca continua després del seu '>'. Cada
   caràcter es mira un nombre fitat de vegades. */
const VALOR_DEL_SRC = /([^">]+)"/y;

function srcDeLaPrimeraImg(text) {
  let inici = text.indexOf('<img');
  while (inici !== -1) {
    const tancament = text.indexOf('>', inici);
    const tram = text.slice(inici, tancament === -1 ? text.length : tancament);
    let posicio = tram.lastIndexOf('src="');
    while (posicio >= 5) {
      VALOR_DEL_SRC.lastIndex = posicio + 5;
      const trossos = VALOR_DEL_SRC.exec(tram);
      if (trossos) return trossos[1];
      posicio = tram.lastIndexOf('src="', posicio - 1);
    }
    if (tancament === -1) return null;
    inici = text.indexOf('<img', tancament);
  }
  return null;
}

export function getFirstImage(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    // Basic extraction if it happens to be an HTML string containing an image
    const src = srcDeLaPrimeraImg(val);
    if (src !== null) return src;
    return val;
  }
  if (Array.isArray(val) && val.length > 0) {
    return getFirstImage(val[0]);
  }
  return null;
}

/* Auditoria de seguretat 261019 (F12) · Si un text es llig com a HTML: el
   mateix que /<[a-z][\s\S]*>/i.test(text), en temps lineal. L'expressió, amb
   molts '<a' i cap '>', tornava a recórrer el text des de cada '<a' (treball
   quadràtic en cada pintada del detall). Casa si hi ha un '<' seguit d'una
   lletra ASCII i, més avant, un '>': n'hi ha prou amb el primer '<' i lletra,
   que és el que deixa més text per a trobar el '>'. */
const OBERTURA_D_ETIQUETA = /<[a-z]/i;

export function semblaHtml(text) {
  const obertura = OBERTURA_D_ETIQUETA.exec(text);
  return obertura !== null && text.indexOf('>', obertura.index + 2) !== -1;
}
