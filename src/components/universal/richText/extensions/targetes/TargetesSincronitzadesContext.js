/**
 * TargetesSincronitzadesContext.js — La targeta incrustada és una targeta de
 * veritat, sincronitzada amb el seu original.
 *
 * Ordre del Mestre (261007) · «No vull cards inventades, vull cards de
 * veritat»: una targeta incrustada que té una UniversalPage darrere (una
 * pàgina del sistema o de text, una publicació, un producte, un acte o un
 * poble) es pinta sincronitzada amb el seu original, en lectura
 * (CosAmbTargetes) i a l'editor (TargetaIncrustadaNodeView): la portada, el
 * títol, el subtítol, l'entradilla, les etiquetes, el rellotge, la boina
 * (avatar, nom i poble), els drets i l'acció gran de la pàgina si en té. La
 * instantània desada a l'HTML (data-titol, data-imatge…) passa a ser la
 * reserva: el que es pinta mentre l'original no es resol (encara carrega, ja
 * no hi és o el cos es llig fora de l'app).
 *
 * components/ no llig cap secció: qui coneix els originals (l'app,
 * sections/detail/SincronitzacioTargetes.jsx) injecta ací el seu resolvedor.
 * El valor del context és un HOOK ESTABLE (una constant de mòdul, sempre el
 * mateix durant tota la vida de l'arbre, perquè l'ordre dels hooks no
 * canvie): attrs → les props de DADES d'UniversalCard de l'original, o null.
 * Sense proveïdor (les proves, un editor sol), la instantània de sempre, byte
 * a byte.
 *
 * Mòdul a banda, sense TipTap, pel mateix motiu que
 * TargetesIncrustadesContext.js: les proves que substituïxen './richText' i
 * './richText/extensions' amb fàbriques tancades no el veuen.
 */
import { createContext, useContext } from 'react';

export const TargetesSincronitzadesContext = createContext(null);

const senseOriginal = () => null;

/**
 * Les props d'UniversalCard d'una targeta incrustada amb les dades fresques
 * de l'original per damunt de les de la instantània. Les accions (la
 * navegació, Connectar, Comentar i els avisos de l'editor) són sempre les de
 * qui pinta: l'original només porta dades. El descriptor de l'objecte
 * (Comentar i Connectar) pren el títol viu: el xat públic d'una publicació
 * es diu com la seua targeta.
 */
export function useTargetaSincronitzada(attrs, props) {
  const useDadesDeLOriginal = useContext(TargetesSincronitzadesContext) || senseOriginal;
  const fresques = useDadesDeLOriginal(attrs);
  if (!fresques) return props;
  const objecte = props?.objecte && fresques.title
    ? { ...props.objecte, titol: String(fresques.title) }
    : props?.objecte;
  return { ...props, ...fresques, ...(objecte ? { objecte } : null) };
}
