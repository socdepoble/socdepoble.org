/**
 * mitjaOpac.js — la referència opaca del port de mitjans ('sdp-media://…').
 *
 * Una foto o un logo pujats el node els desa com a 'sdp-media://<bucket>/<camí>'
 * (PerfilEditor, pujaMitja), i només el port la sap resoldre
 * (useResolvedAsset, capacitat 'mitjans'). El navegador no coneix l'esquema:
 * un <img> amb eixa font no carrega res i la consola diu
 * ERR_UNKNOWN_URL_SCHEME. El filtre de seguretat (esFontImatgeSegura i
 * esFontImatgePropia de sanitize.js) l'admet perquè és nostra, no perquè es
 * puga pintar: les peces que posen un <img> la descarten abans i hi pinten el
 * seu substitut (Avatar, marca.jsx i, al Xat, CaraXat).
 *
 * XAT-02 (ordre del Mestre, 261014, pla 261014_0210) · Abans vivia a
 * sections/xat/components/CaraXat.jsx. Ara és ací perquè un àtom de Pedra
 * Seca no importa d'una secció; CaraXat la reexporta i la seua API no canvia.
 * Funció pura: cap import, cap global.
 *
 * Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 4; decisió de les
 * 21:20): la referència opaca d'una pujada ('sdp-media://') es resol pel port
 * amb useResolvedAsset abans de passar per fontSegura; mentre es resol, o si
 * no es pot, la silueta honesta, mai la referència crua. Derogat EN PART el
 * primer paràgraf («les peces que posen un <img> la descarten abans i hi
 * pinten el seu substitut»): PaginaApp (la portada i l'avatar), UniversalCard
 * (imageUrl i avatarUrl) i BarraTaronja (authorAvatar) ja no la descarten
 * d'entrada: la demanen al port i només descarten el que torna encara opac o
 * buit. Avatar, marca.jsx (fontSegura) i CaraXat la continuen descartant, i
 * qui la vol veure la resol abans pel port: AvatarResolt, CaraXat i ara estes
 * tres peces. Sense la capacitat 'mitjans', el substitut de sempre.
 * Revisió adversarial, 14-10-2026 · Al port es demana la forma canònica,
 * sense espais i amb l'esquema en minúscules (refDelPort, a cada una de les
 * tres peces): useResolvedAsset només reconeix 'sdp-media://' escrit així i,
 * en qualsevol altra caixa, envia la referència al resolutor de camins, que
 * torna '/SDP-MEDIA://…', un camí del mateix origen que els filtres deixen
 * passar. Esta funció no canvia: continua reconeixent les dues formes.
 */

/* L'esquema d'una URL no distingix majúscules, i el filtre tampoc (sanitize.js, admetFont amb /i): la guarda
   ha de reconéixer el mateix conjunt que deixa passar, o un 'SDP-MEDIA://…' tornaria a muntar l'<img>. */
const MITJA_OPAC = /^sdp-media:\/\//i;

/** Cert si `src` és una referència opaca del port de mitjans, també amb espais davant o en majúscules. */
export const esMitjaOpac = (src) => typeof src === 'string' && MITJA_OPAC.test(src.trim());

/* Revisió del Gauntlet 261017 (ID2, contrast final) · La foto pujada al bucket
   PÚBLIC, l'única referència opaca que qualsevol lector del Mur pot obrir i
   que pot viatjar a una publicació (autoriaNota.js · fotoPublica), escriure's
   a la fila (mapejadorSeccions.js · avatarDeLaPublicacio) i demanar-se al port
   des d'una targeta (TargetaDelMur.jsx). Una sola regla per a les tres: abans
   cadascuna mirava només el prefix 'sdp-media://mitjans/', i
   'sdp-media://mitjans/../mitjans_privats/…' hi passava; el navegador
   normalitzava la URL pública del port cap al bucket privat. Ara el camí ha de
   tindre la forma de les pujades (storage.js · uploadToStorage:
   <poble>/<uid>/<carpeta>/<uuid>.<ext>): segments de lletres, xifres, '_', '-'
   i '.', que no comencen per punt (fora '.', '..' i els amagats), sense '%',
   barres inverses, espais ni caràcters de control. Torna la forma canònica
   (esquema i bucket en minúscules), o null. */
const FOTO_DEL_BUCKET_PUBLIC = /^sdp-media:\/\/mitjans\/((?:[a-z0-9_-][a-z0-9._-]*\/)*[a-z0-9_-][a-z0-9._-]*)$/i;

/** La referència canònica d'una foto del bucket públic de mitjans, o null si no ho és o el camí no és net. */
export function fotoDelBucketPublic(src) {
  if (typeof src !== 'string') return null;
  const cami = FOTO_DEL_BUCKET_PUBLIC.exec(src.trim());
  return cami ? `sdp-media://mitjans/${cami[1]}` : null;
}
