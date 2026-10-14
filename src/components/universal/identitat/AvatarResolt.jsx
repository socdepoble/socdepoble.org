/**
 * AvatarResolt.jsx — L'Avatar de Pedra Seca amb la imatge ja resolta (T43,
 * ordre del Mestre, 260928).
 *
 * Un logo o una foto desats com a `sdp-media://…` no els pot carregar el
 * navegador: cal resoldre'ls amb la capacitat 'mitjans' del port
 * (useResolvedAsset). Mentre es resol, o si el node no la té, es pinten les
 * inicials del NOM que rep: mai la imatge d'una altra identitat.
 *
 * XAT-02 (ordre del Mestre, 261014, pla 261014_0210) · El port no sempre
 * llança: si no pot firmar una URL de mitjans_privats torna la MATEIXA
 * referència opaca (data/supabase/storage.js, resolveAsset). Un valor resolt
 * que continua sent opac (esMitjaOpac) compta com a font absent: inicials,
 * mai un <img src="sdp-media://…">. Avatar ja el descarta; ací es diu en la
 * frontera, com fa CaraXat.
 *
 * Presentacional: no llig cap context de l'app (es pot pintar al catàleg).
 */
import { Avatar } from '../../PedraSeca/index.js';
import { useResolvedAsset } from '../../../hooks/useResolvedAsset.js';
import { esMitjaOpac } from '../../../utils/mitjaOpac.js';

export function AvatarResolt({ nom, src = null, mida = 'sm', llavor = null, alt, titol, className }) {
  const url = useResolvedAsset(typeof src === 'string' ? src : '');
  const font = url && !esMitjaOpac(url) ? url : null;
  return <Avatar nom={nom} src={font} mida={mida} llavor={llavor} alt={alt} titol={titol} className={className} />;
}

export default AvatarResolt;
