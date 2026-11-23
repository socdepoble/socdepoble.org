/**
 * textosCalaixIdentitats.js — Els textos fixos del calaix «Amb qui actues?»
 * (CalaixIdentitats.jsx) en les 5 llengües oficials (`ca`, `es`, `en`, `eu`, `gl`).
 *
 * v1.2.23 · L5-02 (Gauntlet R1) · El peu del rail del Xat ja diu «{nom}: Who
 * are you acting as?» (section.xat.rail.ambQuiActues) i obria un calaix que
 * només parlava valencià. El títol és el d'eixa clau sense «{nom}: ».
 * Mòdul diferit: l'importa ClosCaXat.jsx, del tros del Xat, i
 * useIdentitatDeLaBarra.js amb import() (v1.2.23 · R2E-04), mai de manera
 * estàtica: +0 B a pesDelNucli i cap clau nova a ca.js.
 */
import { tradueix } from '../../PedraSeca/hooks/useTraductorOpcional.js';
import { parellDeRol } from './rols.js';

export const TEXTOS_CALAIX_IDENTITATS = Object.freeze({
  ca: Object.freeze({
    titol: 'Amb qui actues?',
    descripcio: 'Tria amb quina identitat vols publicar i editar. Pots canviar quan vullgues.',
    llista: 'Identitats',
    activa: 'Activa'
  }),
  es: Object.freeze({
    titol: '¿Con quién actúas?',
    descripcio: 'Elige con qué identidad quieres publicar y editar. Puedes cambiar cuando quieras.',
    llista: 'Identidades',
    activa: 'Activa'
  }),
  en: Object.freeze({
    titol: 'Who are you acting as?',
    descripcio: 'Choose which identity you want to publish and edit as. You can switch whenever you like.',
    llista: 'Identities',
    activa: 'Active'
  }),
  eu: Object.freeze({
    titol: 'Norekin ari zara?',
    descripcio: 'Aukeratu zein identitaterekin argitaratu eta editatu nahi duzun. Nahi duzunean alda dezakezu.',
    llista: 'Identitateak',
    activa: 'Aktiboa'
  }),
  gl: Object.freeze({
    titol: 'Con quen actúas?',
    descripcio: 'Escolle con que identidade queres publicar e editar. Podes cambiar cando queiras.',
    llista: 'Identidades',
    activa: 'Activa'
  })
});

/** v1.2.23 · L5-02 (Gauntlet R1) · Els textos d'una llengua; una llengua desconeguda, el valencià. */
export function textosCalaixIdentitats(llengua) {
  return Object.hasOwn(TEXTOS_CALAIX_IDENTITATS, llengua) ? TEXTOS_CALAIX_IDENTITATS[llengua] : TEXTOS_CALAIX_IDENTITATS.ca;
}

/* v1.2.23 · integració (pesDelNucli ≤ 1.590.500 B) · El rol de cada fila del calaix, amb les claus de sempre del
   Perfil (rols.js · PARELLS_ROL): en valencià, les mateixes etiquetes que CalaixIdentitats pinta sense traductor
   (ca.js, lletra per lletra). El compartixen ClosCaXat.jsx i la barra negra, des d'este tros diferit. */
export function rolDeLaIdentitat(t, identitat) {
  return tradueix(t, identitat?.tipus !== 'entitat'
    ? ['section.perfil.membres.tipus.persona', 'Persona']
    : parellDeRol(identitat.rol) ?? ['section.perfil.membres.tipus.organitzacio', 'Organització']);
}

/* v1.2.23 · integració (pesDelNucli) · Les props del calaix de la barra negra (useIdentitatDeLaBarra.js) d'una
   peça: els textos fixos d'una llengua i el rol de cada fila. Si el tros no arriba, la barra no en passa cap i
   el calaix s'obri amb el valencià de sempre, rols inclosos. */
export function propsDelCalaix(llengua, t) {
  const textos = textosCalaixIdentitats(llengua);
  return {
    etiquetaTitol: textos.titol,
    etiquetaDescripcio: textos.descripcio,
    etiquetaLlista: textos.llista,
    etiquetaActiva: textos.activa,
    etiquetaRol: (identitat) => rolDeLaIdentitat(t, identitat)
  };
}
