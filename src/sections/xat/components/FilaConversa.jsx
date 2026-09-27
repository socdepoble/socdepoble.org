/**
 * FilaConversa.jsx — la fila de la llista de converses (XAT-A09, UX-B01):
 * avatar, nom, hora de l'últim missatge, previsualització d'una línia i el
 * comptador de no llegits. Un botó de 72px (--sdp-xat-fila-mida).
 */
import { BellOff, Pin } from 'lucide-react';
import { Avatar } from '../../../components/PedraSeca/index.js';
import PastillaNoLlegits from './PastillaNoLlegits.jsx';
import { etiquetaLlista } from '../temps.js';

export default function FilaConversa({ fil, activa = false, onSelect, locale, t }) {
  const nom = fil.name || fil.title || t('section.xat.conversaSenseNom', 'Conversa');
  const noLlegits = Number(fil.noLlegits) || 0;
  const ressaltada = noLlegits > 0 || Boolean(fil.noLlegitManual);
  const hora = etiquetaLlista(fil.ultimAl, { locale, t });

  return (
    <button
      type="button"
      className={`sdp-xat-fila${ressaltada ? ' sdp-xat-fila--nova' : ''}`}
      aria-current={activa ? 'true' : undefined}
      onClick={() => onSelect(fil.id)}
    >
      <Avatar nom={nom} src={fil.avatar_url} mida="md" llavor={fil.id} alt="" />
      <span className="sdp-xat-fila__cos">
        <span className="sdp-xat-fila__cap">
          <span className="sdp-xat-fila__nom">{nom}</span>
          {hora ? <time className="sdp-xat-fila__hora" dateTime={fil.ultimAl || undefined}>{hora}</time> : null}
        </span>
        <span className="sdp-xat-fila__peu">
          <span className="sdp-xat-fila__previa">{fil.ultimText || t('section.xat.capMissatge', 'Cap missatge.')}</span>
          {fil.silenciat || fil.fixat ? (
            <span className="sdp-xat-fila__icones">
              {fil.silenciat ? (
                <>
                  <BellOff size={16} aria-hidden="true" focusable="false" />
                  <span className="sdp-nomes-lector">{t('section.xat.silenciada', 'Silenciada')}</span>
                </>
              ) : null}
              {fil.fixat ? (
                <>
                  <Pin size={16} aria-hidden="true" focusable="false" />
                  <span className="sdp-nomes-lector">{t('section.xat.fixada', 'Fixada')}</span>
                </>
              ) : null}
            </span>
          ) : null}
          <PastillaNoLlegits quants={noLlegits} t={t} />
        </span>
      </span>
    </button>
  );
}
