/**
 * acollidaForasterXatModel.js · v1.2.17 (IDEA-313, literal del Mestre 261121 16:03)
 *
 * La benvinguda del Foraster a /xat: un títol, dues línies i un sol «Entrar», amb una ✕ que la
 * tanca i ho recorda en aquest dispositiu. Substituïx les dues propostes de R32.26 (la cinta i la
 * targeta d'hostaleria amb tres passos plegables): zero insígnia, zero frase defensiva, zero
 * desplegable i cap pastilla després de tancar.
 *
 * Textos en les 5 llengües (ca, es, en, eu, gl), literals d'IDEA-313. `emfasi` és la paraula que la
 * segona línia destaca (CONNECTAR i les seues traduccions); `entrar` és el mateix verb de B9
 * (`section.login.loginButton` de config/idiomes), i una prova en vigila la coincidència.
 * v1.2.17 · Gauntlet R1 (L1-09) · `tanca`, el nom de la ✕, pren la forma de `section.xat.tancaCerca`
 * de cada diccionari («Tanca la cerca», «Cerrar la búsqueda», «Close search», «Itxi bilaketa»,
 * «Pechar a busca»); una prova en vigila el verb.
 * Llei de Poble: cap poble cablejat.
 */
import { delVal, getVal, setVal } from '../../../config/storage.js';

const CLAU_BENVINGUDA_TANCADA = 'acollida_foraster_xat_tancada_v1';

/* v1.2.17 · Gauntlet R1 (L1-05) · La reserva de la sessió: amb l'emmagatzematge bloquejat (setVal torna
   false), la ✕ es recorda igualment fins que es recarrega la pàgina. */
let tancadaEnMemoria = false;

export const LLENGUES_BENVINGUDA_FORASTER = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

export const TEXTOS_BENVINGUDA_FORASTER = Object.freeze({
  ca: Object.freeze({
    titol: 'Benvinguda al Projecte Sóc de Poble',
    linia1: 'Passeja al teu ritme, com a foraster pots veure qualsevol informació pública.',
    linia2: 'Entra quan vulgues CONNECTAR amb la teua gent, o treballar en privat.',
    emfasi: 'CONNECTAR',
    entrar: 'Entrar',
    tanca: 'Tanca la benvinguda',
  }),
  es: Object.freeze({
    titol: 'Bienvenida al Proyecto Sóc de Poble',
    linia1: 'Pasea a tu ritmo, como forastero puedes ver cualquier información pública.',
    linia2: 'Entra cuando quieras CONECTAR con tu gente, o trabajar en privado.',
    emfasi: 'CONECTAR',
    entrar: 'Entrar',
    tanca: 'Cerrar la bienvenida',
  }),
  en: Object.freeze({
    titol: 'Welcome to the Sóc de Poble Project',
    linia1: 'Stroll at your own pace, as a guest you can view any public information.',
    linia2: 'Sign in whenever you want to CONNECT with your people, or work in private.',
    emfasi: 'CONNECT',
    entrar: 'Sign in',
    tanca: 'Close welcome',
  }),
  eu: Object.freeze({
    titol: 'Ongi etorri Sóc de Poble Proiektura',
    linia1: 'Ibili zure erritmoan, kanpotar gisa edozein informazio publiko ikus dezakezu.',
    linia2: 'Sartu zure jendearekin KONEKTATU nahi duzunean, edo pribatuan lan egiteko.',
    emfasi: 'KONEKTATU',
    entrar: 'Sartu',
    tanca: 'Itxi ongietorria',
  }),
  gl: Object.freeze({
    titol: 'Benvida ao Proxecto Sóc de Poble',
    linia1: 'Pasea ao teu ritmo, como forasteiro podes ver calquera información pública.',
    linia2: 'Entra cando queiras CONECTAR coa túa xente, ou traballar en privado.',
    emfasi: 'CONECTAR',
    entrar: 'Entrar',
    tanca: 'Pechar a benvida',
  }),
});

/** v1.2.17 · Gauntlet R1 (L1-02) · El codi dels textos que es pinten (el lang de la targeta): la llengua
    demanada (els dos primers caràcters) si en té, o 'ca'. */
export function llenguaBenvingudaForaster(idioma = 'ca') {
  const codi = String(idioma || 'ca').toLowerCase().slice(0, 2);
  return Object.hasOwn(TEXTOS_BENVINGUDA_FORASTER, codi) ? codi : 'ca';
}

/** Els textos de la llengua demanada (els dos primers caràcters), o els valencians. */
export function textosBenvingudaForaster(idioma = 'ca') {
  return TEXTOS_BENVINGUDA_FORASTER[llenguaBenvingudaForaster(idioma)];
}

/**
 * La línia partida al voltant de la paraula destacada: { abans, paraula, despres }. Sense la
 * paraula, tota la línia va a `abans` i `paraula` és buida (cap èmfasi inventat).
 */
export function partsDeLinia(linia, emfasi) {
  const text = String(linia ?? '');
  const i = emfasi ? text.indexOf(emfasi) : -1;
  if (i < 0) return { abans: text, paraula: '', despres: '' };
  return { abans: text.slice(0, i), paraula: emfasi, despres: text.slice(i + emfasi.length) };
}

/** Cert si el Foraster ja l'ha tancada en aquest dispositiu (o en aquesta sessió, si no es pot desar). */
export function benvingudaForasterTancada() {
  return tancadaEnMemoria || getVal(CLAU_BENVINGUDA_TANCADA, false) === true;
}

/** Recorda (o oblida, amb `tancada = false`) que el Foraster l'ha tancada. Torna si ha quedat desat. */
export function desaBenvingudaForasterTancada(tancada = true) {
  tancadaEnMemoria = Boolean(tancada);
  return tancada ? setVal(CLAU_BENVINGUDA_TANCADA, true) : delVal(CLAU_BENVINGUDA_TANCADA);
}
