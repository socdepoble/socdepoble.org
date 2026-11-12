import { resolveAsset } from '../../config/assetResolver.js';

export default function LaminesBotaniquesNode0({ lamina, nom, binomi, titolElement: Titol = 'h3' }) {
  if (!lamina) return null;
  const titol = lamina.variants.length ? 'Estudi morfològic i làmines botàniques' : 'Estudi morfològic';
  return (
    <section className="sdp-lamines-node0" aria-label={`${titol} de ${nom}`}>
      <Titol>{titol}</Titol>
      <p lang="ca">{lamina.morfologiaDoctoralCa}</p>
      {lamina.variants.length > 0 && (
        <div className="sdp-lamines-node0__graella">
          {lamina.variants.map((variant) => (
            <figure key={variant.variant} className="sdp-lamines-node0__figura">
              <img
                className="sdp-lamines-node0__imatge"
                src={resolveAsset(variant.src)}
                width={variant.width}
                height={variant.height}
                loading="lazy"
                alt={`${nom} (${binomi}) · ${variant.etiqueta}`}
              />
              <figcaption className="sdp-lamines-node0__peu">
                {variant.etiqueta}
                <br />
                {variant.tipusImatge === 'recreacio-auditada' && 'Recreació botànica · '}
                <a href={variant.urlOrigen}>{variant.titolImatge}</a> · {variant.autor} ·{' '}
                <a href={variant.llicenciaUrl}>{variant.llicencia}</a>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
