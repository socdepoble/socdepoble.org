/**
 * CitaResposta.jsx — la cita dalt d'una bombolla que respon a un altre
 * missatge (torn 260930, T1 + R32.7 §4), com a les apps de missatgeria: qui el
 * va escriure, fins a dos línies del seu text i, si cita un enllaç intern de
 * Sóc de Poble, la miniatura quadrada a la dreta estil WhatsApp.
 *
 * No promet el que no fa: si l'original no és entre els missatges carregats
 * diu «Missatge no carregat», i en mode de selecció (la bombolla ja és una
 * casella) la cita és un bloc sense acció.
 */
import { autorDeCita, textDeCita } from '../conversa.js';
import { extreuPreviaInterna } from '../previaEnllacIntern.js';

export default function CitaResposta({ citat = null, onVes = null, interactiva = true, t }) {
  if (!citat) {
    return (
      <div className="sdp-xat-cita sdp-xat-cita--absent">
        <span className="sdp-xat-cita__text">{t('section.xat.resposta.noCarregat', 'Missatge no carregat')}</span>
      </div>
    );
  }
  const text = textDeCita(citat, t);
  const previa = !citat.bloquejat && !citat.esborrat ? extreuPreviaInterna(citat.text ?? '') : null;
  const classe = previa ? 'sdp-xat-cita sdp-xat-cita--miniatura' : 'sdp-xat-cita';
  /* L'espai entre autor i text no es pinta però separa les paraules del nom
     accessible del botó; la miniatura decorativa porta alt="" i aria-hidden. */
  const cos = (
    <>
      <span className="sdp-xat-cita__cos">
        <span className="sdp-xat-cita__autor">{autorDeCita(citat, t)}</span>
        {' '}
        <span className="sdp-xat-cita__text">{text}</span>
      </span>
      {previa ? (
        <img
          className="sdp-xat-cita__img"
          src={previa.imatgeUrl}
          alt=""
          aria-hidden="true"
          loading="lazy"
        />
      ) : null}
    </>
  );
  if (!interactiva || typeof onVes !== 'function') return <div className={classe}>{cos}</div>;
  return (
    <button type="button" className={classe} onClick={() => onVes(citat.id)}>
      <span className="sdp-nomes-lector">{`${t('section.xat.resposta.citat', 'Missatge citat')}:`}</span>
      {' '}
      {cos}
    </button>
  );
}
