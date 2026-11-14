/* Onada R24 · wp_trinquet (SEO-R22-08, trinquet de l'arrencada estàtica) · La
   darrera ruta fora del Xat d'«Informa d'un error» (informeDError.js), en una
   fulla sense imports: XatContext.jsx, que és de l'arrencada, només en vol
   recordaRutaForaDelXat i, important-la d'informeDError.js, arrossegava al tros
   d'entrada la plantilla de l'informe, la lectura del navegador i l'enllaç de
   correu, que només fa servir el botó del Xat, diferit. L'estat és un de sol,
   el d'este mòdul: informeDError.js en reexporta les funcions amb els mateixos
   noms i el llig amb darreraRutaForaDelXat(). */

/* La darrera ruta de l'app fora del Xat: on era la persona abans d'entrar-hi.
   La deixa XatContext (AvisadorXat, que viu per damunt de les rutes). Només
   en memòria, en esta pestanya. */
let darreraForaDelXat = null;
const RE_RUTA_XAT = /(^|\/)xat(\/|$)/;

/** Recorda `ruta` si no és del Xat. */
export function recordaRutaForaDelXat(ruta) {
  const valor = String(ruta || '');
  if (valor && !RE_RUTA_XAT.test(valor)) darreraForaDelXat = valor;
}

/** Per a les proves. */
export function oblidaRutaForaDelXat() {
  darreraForaDelXat = null;
}

/** La ruta recordada, o null (composaInforme, informeDError.js). */
export function darreraRutaForaDelXat() {
  return darreraForaDelXat;
}
