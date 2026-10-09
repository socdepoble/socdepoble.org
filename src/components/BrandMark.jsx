import { resolveAsset } from '../config/assetResolver';

/* Onada 8 (261009) · El logotip de la barra és un PNG de public/ (985x256,
   el mateix del logotip de pàgina, DEFAULT_AUTHOR.logo). Abans eren dos
   imports d'SVG: al paquet de WordPress (mode lib) Vite inlinava cada un com
   a data URI dins del tros d'entrada (138 KB el blanc), i l'Onada 7 ja havia
   tret el negre amb import(). Ara cap dels dos hi viatja: es demanen pel
   camí, i el navegador només baixa el que es pinta.
   variant="light" és el blanc, per a la barra negra; "dark", el negre, per a
   un fons clar. Es resol dins del render, com l'avatar de DEFAULT_AUTHOR:
   així hi val la base de recursos que l'amfitrió fixe després
   (config/assetResolver.js). */
const LOGOTIP = Object.freeze({
  light: '/assets/system/ui/logo-socdepoble-rect-blanc-985x256.png',
  dark: '/assets/system/ui/logo-socdepoble-rect-negre-985x256.png'
});

export default function BrandMark({ variant = 'light', className = '' }) {
  const src = resolveAsset(variant === 'dark' ? LOGOTIP.dark : LOGOTIP.light);
  return <img className={className} src={src} alt="Sóc de Poble" width="300" height="78" fetchpriority="high" />;
}
