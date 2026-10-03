/**
 * Lector de notícies · les icones de categoria: el port en dona el NOM d'una
 * llista tancada (nucli/model.js · ICONES_CATEGORIA) i ací es resol al
 * component de lucide. Cap SVG ni HTML ve de fora.
 */
import { BookOpen, CloudSun, Landmark, Newspaper, PartyPopper, Sprout, Store, Trophy } from 'lucide-react';

const ICONES = Object.freeze({ BookOpen, CloudSun, Landmark, Newspaper, PartyPopper, Sprout, Store, Trophy });

/** El component d'una icona de categoria, o undefined (la marca va sense icona). */
export const iconaDeCategoria = (nom) => (Object.hasOwn(ICONES, nom ?? '') ? ICONES[nom] : undefined);

export const NOMS_ICONES_CATEGORIA = Object.freeze(Object.keys(ICONES));
