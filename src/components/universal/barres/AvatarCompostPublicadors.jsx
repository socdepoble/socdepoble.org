import { useState } from 'react';
import { resolveAsset } from '../../../config/assetResolver.js';
import { useResolvedAsset } from '../../../hooks/useResolvedAsset.js';
import { esMitjaOpac } from '../../../utils/mitjaOpac.js';
import { isSafeAsset } from '../UniversalUtils.js';
import { inicialsDePublicador } from './publicadorsBarraTaronja.js';

/**
 * AvatarCompostPublicadors · Mosaic quadrangular Pedra Seca d'estil grup de xat
 * per a la co-publicació multi-entitat registrada a la BarraTaronja (Onada R19).
 *
 * Geometria ortogonal 48 × 48 px (`border-radius: 0`), sense cantonades redones
 * minúscules ni pics blancs, amb filet separador sobre tokens `--sdp-*`:
 * - 2 co-publicadors: 2 columnes verticals (`--2`).
 * - 3 co-publicadors: columna esquerra sencera + 2 quarts apilats a la dreta (`--3`).
 * - 4+ co-publicadors: graella 2 × 2, amb comptador `+N` a la quarta cel·la quan n'hi ha > 4 (`--4`).
 */
const CLASSES_VARIANT = {
  2: 'sdp-avatar-compost--2',
  3: 'sdp-avatar-compost--3',
  4: 'sdp-avatar-compost--4',
};

const refDelPort = (src) => (esMitjaOpac(src) ? src.trim().replace(/^sdp-media:/i, 'sdp-media:') : '');

function CellaAvatarCompost({ actor, index, fallida, onFallida }) {
  const avatarCru = actor?.avatarUrl || '';
  const avatarDelPort = useResolvedAsset(refDelPort(avatarCru));
  const fontAvatar = esMitjaOpac(avatarCru) ? avatarDelPort : avatarCru;
  const resolta = typeof fontAvatar === 'string' && fontAvatar && !esMitjaOpac(fontAvatar)
    ? resolveAsset(fontAvatar)
    : '';
  const srcSegura = resolta && isSafeAsset(resolta) && !fallida ? resolta : '';

  return (
    <span className="sdp-avatar-compost__cella" data-cella={index + 1}>
      {srcSegura ? (
        <img
          src={srcSegura}
          alt=""
          className="sdp-avatar-compost__img"
          width="24"
          height="24"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={onFallida}
        />
      ) : (
        <span className="sdp-avatar-compost__inicial">
          {inicialsDePublicador(actor?.name)}
        </span>
      )}
    </span>
  );
}

export function AvatarCompostPublicadors({ publicadors = [] }) {
  const [imatgesFallides, setImatgesFallides] = useState({});
  const total = Array.isArray(publicadors) ? publicadors.length : 0;
  if (total < 2) return null;

  const variant = total === 2 ? 2 : total === 3 ? 3 : 4;
  const teComptadorExtra = total > 4;
  const visibles = teComptadorExtra ? publicadors.slice(0, 3) : publicadors.slice(0, 4);
  const restants = teComptadorExtra ? total - 3 : 0;

  const marcaFallida = (clau) => {
    setImatgesFallides((prev) => (prev[clau] ? prev : { ...prev, [clau]: true }));
  };

  return (
    <span
      className={`sp-card-avatar sdp-avatar-compost ${CLASSES_VARIANT[variant]}`}
      aria-hidden="true"
    >
      {visibles.map((actor, index) => {
        const clau = actor?.id || `${actor?.href || 'actor'}-${index}`;
        return (
          <CellaAvatarCompost
            key={clau}
            actor={actor}
            index={index}
            fallida={Boolean(imatgesFallides[clau])}
            onFallida={() => marcaFallida(clau)}
          />
        );
      })}
      {teComptadorExtra ? (
        <span className="sdp-avatar-compost__cella sdp-avatar-compost__cella--mes sdp-avatar-compost__mes" data-cella="4">
          {`+${restants}`}
        </span>
      ) : null}
    </span>
  );
}
