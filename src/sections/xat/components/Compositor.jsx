/**
 * Compositor.jsx — el camp d'escriure (XAT-B01, XAT-B03, UX-A08).
 *
 *   · <textarea> que creix fins a 6 línies. El creixement és CSS pur: el
 *     contenidor és una graella amb un ::after que replica el text
 *     (data-valor) i marca l'alçada; cap style en línia ni mesura de DOM.
 *   · A l'escriptori, Retorn envia i Maj+Retorn fa salt de línia; en mode
 *     estret Retorn fa salt i s'envia amb el botó, com a WhatsApp.
 *   · Límit de 4.096 caràcters amb comptador visible a partir de 3.900.
 *   · Cap botó d'adjuntar ni de micròfon: són F1 i la interfície no promet el
 *     que no fa.
 *   · Xat de pàgina (T63.2, T67): amb `fil`, si no s'hi pot escriure (els
 *     Avisos per a qui no n'és administrador) el compositor dona pas a l'avís
 *     que ho diu; si el fil té subjecte i s'hi pot escriure, un avís menut
 *     damunt recorda que és el xat públic d'una pàgina.
 */
import { Megaphone, Send, Users } from 'lucide-react';
import { useAppGrid } from '../../../components/layout/AppGridShell.jsx';

export const LIMIT_TEXT = 4096;
export const LLINDAR_COMPTADOR = 3900;

export default function Compositor({ valor, onCanvia, onEnvia, t, desactivat = false, fil = null }) {
  if (fil && fil.potEscriure === false) {
    return (
      <p className="sdp-xat-compositor sdp-xat-compositor--avis" role="status">
        <Megaphone size={20} aria-hidden="true" focusable="false" />
        <span>{t('section.xat.canal.nomesAdmins', 'En Avisos només escriuen els administradors.')}</span>
      </p>
    );
  }
  const titolPublic = fil?.subjecte ? (fil.subjecte.titol || fil.name || fil.title || '') : '';
  const formulari = <Formulari valor={valor} onCanvia={onCanvia} onEnvia={onEnvia} t={t} desactivat={desactivat} />;
  if (!fil?.subjecte) return formulari;
  return (
    <>
      <p className="sdp-xat-avis-public">
        <Users size={16} aria-hidden="true" focusable="false" />
        <span>{t('section.xat.pagina.avisPublic', 'Escrius al xat públic de «{titol}».').replace('{titol}', titolPublic)}</span>
      </p>
      {formulari}
    </>
  );
}

function Formulari({ valor, onCanvia, onEnvia, t, desactivat }) {
  const { mida } = useAppGrid();
  const estret = mida === 'estret';
  const buit = !String(valor ?? '').trim();
  const llargada = String(valor ?? '').length;
  const mostraComptador = llargada >= LLINDAR_COMPTADOR;

  const envia = () => {
    if (buit || desactivat) return;
    onEnvia();
  };

  const alTeclat = (e) => {
    if (e.key !== 'Enter' || estret || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.nativeEvent?.isComposing) return;
    e.preventDefault();
    envia();
  };

  return (
    <form
      className="sdp-xat-compositor"
      onSubmit={(e) => { e.preventDefault(); envia(); }}
    >
      <div className="sdp-xat-compositor__camp" data-valor={valor}>
        <textarea
          id="xat-message-input"
          name="message"
          className="sdp-xat-compositor__textarea"
          rows={1}
          value={valor}
          maxLength={LIMIT_TEXT}
          onChange={(e) => onCanvia(e.target.value)}
          onKeyDown={alTeclat}
          placeholder={t('section.xat.composePlaceholder', 'Escriu un missatge...')}
          aria-label={t('section.xat.compositor.etiqueta', 'Escriu un missatge')}
          aria-describedby={mostraComptador ? 'xat-message-comptador' : undefined}
          enterKeyHint={estret ? 'enter' : 'send'}
          disabled={desactivat}
        />
        {mostraComptador ? (
          <span
            id="xat-message-comptador"
            className={`sdp-xat-compositor__comptador${llargada >= LIMIT_TEXT ? ' sdp-xat-compositor__comptador--limit' : ''}`}
            aria-live="polite"
          >
            {t('section.xat.compositor.comptador', '{n} de {max} caràcters')
              .replace('{n}', String(llargada))
              .replace('{max}', String(LIMIT_TEXT))}
          </span>
        ) : null}
      </div>
      <button
        type="submit"
        className="sdp-xat-compositor__envia"
        aria-label={t('section.xat.compositor.envia', 'Envia')}
        disabled={buit || desactivat}
      >
        <Send size={20} aria-hidden="true" focusable="false" />
      </button>
    </form>
  );
}
