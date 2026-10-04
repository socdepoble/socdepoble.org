/**
 * useImatgeTargeta.js — La imatge (o l'avatar) d'una targeta, a punt per a
 * UniversalCard.
 *
 * Extret de TargetaViva.jsx sense cap canvi (T7, ordre del Mestre, prompt
 * 261004_0515): ara també el fa servir la targeta incrustada a l'editor.
 *
 * Una imatge pujada és una referència opaca (sdp-media://) que UniversalCard
 * no accepta (isSafeAsset): es resol pel port. Un recurs propi ('/assets/…')
 * pren la base de l'amfitrió en pintar-se (SPEC G); sense base, el mateix
 * valor. La resta passa tal qual, sense esperar cap efecte.
 */
import { useResolvedAsset } from './useResolvedAsset.js';
import { resolRecursPropi } from '../config/assetResolver.js';

const esMitja = (ref) => typeof ref === 'string' && ref.startsWith('sdp-media://');

export function useImatgeResolta(ref) {
  const resolta = useResolvedAsset(esMitja(ref) ? ref : '');
  return (esMitja(ref) ? resolta : resolRecursPropi(ref)) || undefined;
}
