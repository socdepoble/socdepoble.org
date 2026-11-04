import { useMemo } from 'react';
import { ItemMedia } from '../../components/universal/workspace/ItemMedia.jsx';
import { TEXTOS_LLAVOR } from '../../components/universal/textosLlavor.js';
import { textPla } from '../../components/universal/targetaViva.js';
import { TITOL_NOTA_PREPARADA } from './notaPreparada.js';

/**
 * Fitxa compacta de nota per al llistat de la columna NOTES.
 * S'injecta al UniversalWorkspace via `renderItem`; el nucli no la coneix.
 * AH-02 · Totes les notes de la columna de llista (actives o no) es mostren
 * sempre com a fitxa compacta normal (`button.sdp-gestor-fitxa` amb
 * `is-active` i `aria-current="true"`), amb la seua icona/miniatura, títol viu
 * en text pla, data i subtítol/entradilla.
 */
export function NotaFitxa({ item, active, onSelect }) {
  const titolViu = useMemo(
    () => textPla(item?.data?.title || item?.title || '').trim() || TITOL_NOTA_PREPARADA,
    [item?.data?.title, item?.title]
  );

  /* G3-g2-matriu-25 · El subtítol primer i, sense, l'entradilla: el mateix
     ordre del model de la llista (NotesSection · excerpt) i de ConnexioFitxa.
     Cada font es mira en text pla: un subtítol buit en HTML no l'amaga. */
  const subtitolViu = useMemo(() => {
    for (const font of [item?.data?.subtitle, item?.data?.lead, item?.excerpt]) {
      const text = textPla(font || '').trim();
      if (text) return text;
    }
    return TEXTOS_LLAVOR.entradilla;
  }, [item?.data?.subtitle, item?.data?.lead, item?.excerpt]);

  const itemMedia = useMemo(() => {
    const image = item?.data?.heroImage || item?.image || undefined;
    const icon = item?.data?.icon || item?.icon || undefined;
    if (image === item?.image && icon === item?.icon && titolViu === item?.title) {
      return item;
    }
    return {
      ...item,
      title: titolViu,
      image,
      icon
    };
  }, [item, titolViu]);

  return (
    <button
      type="button"
      className={`sdp-gestor-fitxa ${active ? 'is-active' : ''}`.trim()}
      aria-current={active ? 'true' : undefined}
      onClick={onSelect}
    >
      <ItemMedia item={itemMedia} titleFallback={TITOL_NOTA_PREPARADA} />
      <span className="sdp-gestor-fitxa__text">
        <span className="sdp-nota-fitxa__capcalera">
          <span className="sdp-gestor-fitxa__titol">{titolViu}</span>
          {item?.subtitle ? (
            <time className="sdp-nota-fitxa__data" dateTime={item.updatedAt || undefined}>
              {item.subtitle}
            </time>
          ) : null}
        </span>
        <span className="sdp-gestor-fitxa__subtitol">{subtitolViu}</span>
      </span>
    </button>
  );
}
