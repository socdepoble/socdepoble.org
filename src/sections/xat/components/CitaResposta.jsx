/**
 * CitaResposta.jsx — la cita dalt d'una bombolla que respon a un altre
 * missatge (torn 260930, T1), com a WhatsApp: qui el va escriure i dos
 * línies del seu text. És un botó que porta a l'original i el ressalta
 * (Conversa, vesAlMissatge).
 *
 * No promet el que no fa: si l'original no és entre els missatges carregats
 * diu «Missatge no carregat», i en mode de selecció (la bombolla ja és una
 * casella) la cita és un bloc sense acció.
 */
import { autorDeCita, textDeCita } from '../conversa.js';

export default function CitaResposta({ citat = null, onVes = null, interactiva = true, t }) {
  if (!citat) {
    return (
      <div className="sdp-xat-cita sdp-xat-cita--absent">
        <span className="sdp-xat-cita__text">{t('section.xat.resposta.noCarregat', 'Missatge no carregat')}</span>
      </div>
    );
  }
  /* L'espai entre autor i text no es pinta (la cita és una graella) però
     separa les paraules del nom accessible del botó. */
  const cos = (
    <>
      <span className="sdp-xat-cita__autor">{autorDeCita(citat, t)}</span>
      {' '}
      <span className="sdp-xat-cita__text">{textDeCita(citat, t)}</span>
    </>
  );
  if (!interactiva || typeof onVes !== 'function') return <div className="sdp-xat-cita">{cos}</div>;
  return (
    <button type="button" className="sdp-xat-cita" onClick={() => onVes(citat.id)}>
      <span className="sdp-nomes-lector">{`${t('section.xat.resposta.citat', 'Missatge citat')}:`}</span>
      {' '}
      {cos}
    </button>
  );
}
