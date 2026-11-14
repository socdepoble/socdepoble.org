/* Onada R24 · wp_trinquet (SEO-R22-08, trinquet de l'arrencada estàtica) · Les
   recents del selector d'emoticones (emoticonesXat.js), en una fulla sense
   imports: XatContext.jsx, que és de l'arrencada, només en vol buidaRecents
   (quan canvia la persona) i, important-la d'emoticonesXat.js, arrossegava al
   tros d'entrada la pestanya «Del poble» sencera (EMOTICONES_DEL_POBLE) i la
   inserció al cursor, que només fa servir el compositor, diferit. L'estat és
   un de sol, el d'este mòdul: emoticonesXat.js en reexporta les funcions amb
   els mateixos noms i cap altre importador no canvia. Com abans, només en
   memòria: no toquen cap emmagatzematge persistent. */

/** Quantes recents es recorden: tres files de la graella gran. */
export const MAXIM_RECENTS = 18;

let recents = Object.freeze([]);

/** Les recents ([codi, glif, nom], primer la més nova). */
export function llegixRecents() {
  return recents;
}

/** El codi d'un glif amb la forma del catàleg: «2764 FE0F» per a ❤️. */
export function codiDe(glif) {
  return Array.from(String(glif ?? ''), (c) => c.codePointAt(0).toString(16).toUpperCase()).join(' ');
}

/** Recorda la triada (el que dona la graella: glif i nom) com la més nova; una repetida puja davant. */
export function recordaRecent(glif, nom) {
  if (typeof glif !== 'string' || !glif) return recents;
  recents = Object.freeze([
    Object.freeze([codiDe(glif), glif, typeof nom === 'string' && nom ? nom : glif]),
    ...recents.filter(([, altre]) => altre !== glif)
  ].slice(0, MAXIM_RECENTS));
  return recents;
}

/** Oblida les recents (XatContext, quan canvia la persona; i les proves). */
export function buidaRecents() {
  recents = Object.freeze([]);
}
