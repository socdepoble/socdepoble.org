/**
 * CaraXat.jsx — l'únic lloc on el Xat decidix com es pinta una cara (Onada 3,
 * AV, 261003).
 *
 * Una cara del Xat pot arribar de quatre maneres: un recurs propi del paquet
 * ('/assets/…': agents, entitats, pobles i la llavor), una URL http(s) d'un
 * origen permés, una data:image i, amb sessió en remot, una foto PUJADA, que
 * el node desa com a referència opaca 'sdp-media://mitjans/…' (PerfilEditor,
 * pujaMitja). Les tres primeres les resol Avatar en pintar (resolRecursPropi,
 * amb la base de l'amfitrió, i el filtre de seguretat). La quarta el navegador
 * no la sap carregar: Avatar la deixava passar tal qual i la fila pintava un
 * <img> trencat. Ara la resol el port (useResolvedAsset, capacitat 'mitjans'),
 * com AvatarResolt. Mentre es resol, si el node no té la capacitat, si el port
 * llança un error o si torna encara una referència opaca, es pinten les
 * inicials del nom, mai una imatge trencada.
 *
 * Revisió (AV) · L'adaptador de Supabase no sempre llança: si no pot firmar
 * una URL de mitjans_privats, o la referència no té carpeta, torna la MATEIXA
 * 'sdp-media://…' (data/supabase/storage.js, resolveAsset). El filtre de
 * seguretat l'accepta i AvatarResolt la pintaria. Per això ací no es fa
 * servir AvatarResolt sinó el seu hook, i es descarta tot valor resolt que
 * continue sent opac.
 *
 * Qualsevol altre valor pinta EL MATEIX Avatar que abans, amb les mateixes
 * props (Llei del Píxel). Model B: el Xat no toca Supabase; resol el port.
 *
 * Onada 6 (tasca 12) · La IAIA té cara pròpia al xat: quan arriba amb el seu
 * avatar del padró (caraDeLaIAIA, data/xatsPerDefecte.js), es pinta la iaia
 * del mocador roig de «Festa del Poble», retallada per l'enquadrament 'iaia'
 * d'Avatar. Ho veuen igual la llista, la capçalera de la conversa, «Nova
 * conversa», la cerca i el xat de mostra: totes les cares passen per ací.
 */
import { Avatar } from '../../../components/PedraSeca/index.js';
import { useResolvedAsset } from '../../../hooks/useResolvedAsset.js';
import { caraDeLaIAIA } from '../../../data/xatsPerDefecte.js';

/** Una referència opaca del port de mitjans ('sdp-media://…'). */
export const esMitjaOpac = (src) => typeof src === 'string' && src.trim().startsWith('sdp-media://');

/* La foto pujada, resolta pel port. El mateix Avatar que AvatarResolt; només
   canvia que una resolució que torna opaca es queda amb les inicials. */
function CaraPujada({ nom, src, mida, llavor, alt, className }) {
  const url = useResolvedAsset(src);
  const font = url && !esMitjaOpac(url) ? url : null;
  return <Avatar nom={nom} src={font} mida={mida} llavor={llavor} alt={alt} className={className} />;
}

export default function CaraXat({ nom, src = null, mida = 'md', llavor = null, alt, className }) {
  const iaia = caraDeLaIAIA(src);
  if (iaia) {
    return <Avatar nom={nom} src={iaia.src} mida={mida} llavor={llavor} alt={alt} className={className} enquadrament={iaia.enquadrament} />;
  }
  const Cara = esMitjaOpac(src) ? CaraPujada : Avatar;
  return <Cara nom={nom} src={src} mida={mida} llavor={llavor} alt={alt} className={className} />;
}
