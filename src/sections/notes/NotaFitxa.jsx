import { useResolvedAsset } from '../../hooks/useResolvedAsset.js';

/**
 * Targeta rica de nota per al llistat del Bloc de Notes.
 * S'injecta al UniversalWorkspace via `renderItem`; el nucli no la coneix.
 * Miniatura quadrada a l'esquerra; a la dreta el títol, la data i l'entradeta.
 */
export function NotaFitxa({ item, active, onSelect }) {
  return (
    <button
      type="button"
      className="sdp-gestor-fitxa sdp-nota-fitxa"
      aria-current={active ? 'true' : undefined}
      onClick={onSelect}
    >
      <NotaMiniatura item={item} />
      <span className="sdp-gestor-fitxa__text sdp-nota-fitxa__text">
        <span className="sdp-nota-fitxa__capcalera">
          <span className="sdp-gestor-fitxa__titol sdp-nota-fitxa__titol">{item.title || 'Sense títol'}</span>
          {item.subtitle ? (
            <time className="sdp-nota-fitxa__data" dateTime={item.updatedAt || undefined}>
              {item.subtitle}
            </time>
          ) : null}
        </span>
        {item.excerpt ? (
          <span className="sdp-gestor-fitxa__subtitol sdp-nota-fitxa__entradeta">{item.excerpt}</span>
        ) : null}
      </span>
    </button>
  );
}

/* Resol referències sdp-media:// i cau a la inicial si no hi ha imatge. */
function NotaMiniatura({ item }) {
  const src = useResolvedAsset(item.image || '');
  return (
    <span className="sdp-gestor-fitxa__media sdp-nota-fitxa__media" aria-hidden="true">
      {src ? (
        <img className="sdp-gestor-fitxa__imatge" src={src} alt="" loading="lazy" />
      ) : (
        <span className="sdp-gestor-fitxa__inicial">
          {String(item.title || '?').trim().charAt(0).toLocaleUpperCase('ca')}
        </span>
      )}
    </span>
  );
}
