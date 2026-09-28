/**
 * AvatarResolt.jsx — L'Avatar de Pedra Seca amb la imatge ja resolta (T43,
 * ordre del Mestre, 260928).
 *
 * Un logo o una foto desats com a `sdp-media://…` no els pot carregar el
 * navegador: cal resoldre'ls amb la capacitat 'mitjans' del port
 * (useResolvedAsset). Mentre es resol, o si el node no la té, es pinten les
 * inicials del NOM que rep: mai la imatge d'una altra identitat.
 *
 * Presentacional: no llig cap context de l'app (es pot pintar al catàleg).
 */
import { Avatar } from '../../PedraSeca/index.js';
import { useResolvedAsset } from '../../../hooks/useResolvedAsset.js';

export function AvatarResolt({ nom, src = null, mida = 'sm', llavor = null, alt, className }) {
  const url = useResolvedAsset(typeof src === 'string' ? src : '');
  return <Avatar nom={nom} src={url || null} mida={mida} llavor={llavor} alt={alt} className={className} />;
}

export default AvatarResolt;
