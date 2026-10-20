/**
 * TargetaDelMercat.jsx — la targeta d'un producte del Mercat: la UniversalCard
 * de /mercat, amb el seu objecte, Connectar i el peu canònic.
 *
 * Esmena 2 del pla 261007_1645 (ordre del Mestre, 261007: «Esta lògica de
 * llistar elements de la categoria per a l'avatar actiu ha d'estar disponible
 * per tot el sistema») · Abans esta peça vivia dins del bucle de
 * MercatSection; ara la munten MercatSection i l'històric de l'actor
 * (PublicacionsDeLActor), com es va fer amb TargetaDelMur el 261001:
 * un producte no pot tindre dues targetes segons la superfície on ix.
 * Llei del Píxel: el JSX és el de MercatSection, sense cap canvi (la
 * Decisió 3, més avall, només hi afig el mode estricte de les imatges).
 *
 * Les props de la targeta (boina, data, drets, foto, etiquetes) són les de
 * targetaDeProducte.js (revisió del 261007, M3-12). Fora de l'App (l'espècimen
 * del catàleg muntat sol, sense UIProvider) no hi ha traductor: les etiquetes
 * porten la reserva en valencià, la mateixa que dins de l'App en valencià.
 *
 * Decisió 3 del Mestre (261007, confirmada) · «Imatges externes al Mur:
 * PROHIBIDES (PRIVACITAT).» Relleu 261007 (peça «imatges-detall») · Com
 * TargetaDelMur: la foto i l'avatar del producte passen pel MODE ESTRICTE
 * (fontImatgePropia de utils/sanitize.js: el mateix origen, el nostre servidor
 * de mitjans, data:image i sdp-media://; cap servidor de tercers, tampoc els
 * avatars de Google, Facebook o GitHub) i es demanen sense referent
 * (`imatgePrivada` d'UniversalCard). Una foto de fora no es demana i la
 * targeta queda sense bloc d'imatge; un avatar de fora, la silueta de sempre
 * (sp-card-avatar--fallback). Les pròpies es pinten igual: el mateix src i
 * un atribut referrerpolicy de més, cap píxel. La pinten /mercat i l'històric
 * de l'actor (PublicacionsDeLActor).
 */
import { UniversalCard } from '../../components/PedraSeca';
import { objecteDe, rutaConnectarObjecte } from '../../config/navigation';
import { useNavigate } from '../../app/contexts/RouterContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { isSafeAsset } from '../../components/universal/UniversalUtils.js';
import { fontImatgePropia } from '../../utils/sanitize.js';
import { propsDeTargetaDeProducte } from './targetaDeProducte.js';

/* Decisió 3 (261007) · El filtre de sempre de la targeta (isSafeAsset, el
   d'UniversalCard sense imatgePrivada) i, a més, el mode estricte: el que es
   pinta és un subconjunt del d'abans, amb el mateix src. Només el mode
   estricte no n'hi ha prou: amb imatgePrivada, UniversalCard admet un
   sdp-media:// cru (esFontImatgeSegura), que abans no es pintava i ara
   pintaria una imatge trencada (la mateixa raó que logoDeSrc a
   detail/elementDeSeccio.js). */
const imatgePropia = (font) => (isSafeAsset(font) ? fontImatgePropia(font) : null);

/* El traductor de l'App, o res fora d'ella. La forma `return useX()` dins
   d'un try és la que rules-of-hooks accepta (useEntitatDelProjecte.js). */
function useTraductor() {
  try {
    return useUIActions().t;
  } catch {
    return undefined;
  }
}

export function TargetaDelMercat({ item }) {
  const t = useTraductor();
  const navigate = useNavigate();
  /* T63.2 · el descriptor del producte: Connectar se l'emporta i
     Comentar obri el seu xat comú. Lògica d'Usuari (T4, T5):
     Connectar recorda d'on ve. */
  const producte = objecteDe(item, 'mercat');
  const props = propsDeTargetaDeProducte(item, t);

  return (
    <UniversalCard
      {...props}
      /* Decisió 3 (261007) · Només la foto i l'avatar propis, ja resolts
         (targetaDeProducte.js); un de fora, null: cap petició. */
      imageUrl={imatgePropia(props.imageUrl)}
      avatarUrl={imatgePropia(props.avatarUrl)}
      imatgePrivada
      objecte={producte}
      onConnect={() => navigate(rutaConnectarObjecte(producte))}
      /* Fase D (261020, tasca 2) · «Més opcions»: denunciar i bloquejar. */
      ambModeracio
      hasFooter={true}
      showTranslate={true}
      showComment={true}
      showShare={true}
      showConnect={true}
    />
  );
}

export default TargetaDelMercat;
