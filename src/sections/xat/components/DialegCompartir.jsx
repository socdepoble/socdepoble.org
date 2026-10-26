/**
 * DialegCompartir.jsx — «Envia a…» (261026, ordre del Mestre, prompt
 * 261026_1615, tasca 2). El que arriba del menú «Compartir» del dispositiu
 * (config/compartirNatiu.js) espera ací que la persona trie la conversa, com
 * a les apps de missatgeria. Les files són les de la llista (FilaConversa),
 * amb la conversa oberta primer. Triar no envia res: la imatge apareix al
 * compositor d'eixa conversa amb la seua miniatura i un camp per al text, i
 * la persona prem «Envia el fitxer» (ControlsAdjunt.jsx). Un text sense
 * imatges va a l'esborrany de la conversa.
 *
 * Tancar el diàleg (Escape, el vel o «Descarta») descarta el lot. Triar la
 * conversa el tanca per la via pròpia (obert=false), que no avisa onTanca.
 * Sense sessió, «Entrar» porta a l'entrada i el lot espera a la tornada.
 */
import { useEffect, useRef } from 'react';
import { Dialeg } from '../../../components/PedraSeca/index.js';
import { rutaDEntrada } from '../../../config/rutaEntrada.js';
import FilaConversa from './FilaConversa.jsx';

/** El resum del lot: quantes imatges, o el text, i el que no s'ha pogut rebre. */
function textDelLot(lot, t) {
  const n = lot.fitxers.length;
  if (n === 1) return t('section.xat.compartir.unaImatge', 'Tens una imatge per enviar. Tria la conversa.');
  if (n > 1) return t('section.xat.compartir.imatges', 'Tens {n} imatges per enviar. Tria la conversa.').replace('{n}', String(n));
  if (lot.text) return t('section.xat.compartir.text', 'Tens un text per enviar. Tria la conversa.');
  return '';
}

export default function DialegCompartir({ obert, lot: lotViu, fils, filActiuId = null, senseSessio = false, carregant = false, tornar, onTria, onDescarta, onVes, locale, t, joId = null }) {
  /* Revisió 261026 · Descartat el lot, el diàleg encara es pinta amb l'últim
     mentre es tanca per la seua via: així el focus torna on era. */
  const darrer = useRef(lotViu);
  if (lotViu) darrer.current = lotViu;
  const lot = lotViu || darrer.current;
  /* Tancat ja (el Dialeg fill restaura el focus abans, en el mateix commit),
     les imatges del lot descartat no han de quedar en memòria. */
  useEffect(() => { if (!lotViu) darrer.current = null; }, [lotViu]);
  if (!lot) return null;
  const resum = textDelLot(lot, t);
  const nomesRebutjats = !resum;
  return (
    <Dialeg
      obert={obert && Boolean(lotViu)}
      onTanca={onDescarta}
      titol={nomesRebutjats ? t('section.xat.compartir.titolRebutjat', 'No s’ha pogut rebre') : t('section.xat.compartir.titol', 'Envia a…')}
      mida="s"
      className="sdp-xat-dialeg"
    >
      <div className="sdp-xat-dialeg__cos">
        {resum ? <p>{resum}</p> : null}
        {lot.rebutjats > 0 ? (
          <p className="sdp-xat-avis" role="status">
            {lot.rebutjats === 1
              ? t('section.xat.compartir.rebutjat', 'Un fitxer no es pot enviar al xat: només fotos JPEG, PNG, WebP o GIF de fins a 20 MB.')
              : t('section.xat.compartir.rebutjats', '{n} fitxers no es poden enviar al xat: només fotos JPEG, PNG, WebP o GIF de fins a 20 MB.').replace('{n}', String(lot.rebutjats))}
          </p>
        ) : null}
        {nomesRebutjats ? null : senseSessio ? (
          <p className="sdp-xat-avis" role="status">
            {t('section.xat.compartir.calEntrar', 'Entra per enviar-ho.')}
            {' '}<button type="button" className="sdp-xat-pindola" onClick={() => onVes(rutaDEntrada({ tornar }))}>
              {t('section.xat.sessio.entrar', 'Entrar')}
            </button>
          </p>
        ) : carregant && !fils.length ? (
          <p className="sdp-xat-avis" role="status">{t('section.xat.carregant', 'Carregant…')}</p>
        ) : fils.length ? (
          <ul className="sdp-xat-llista" aria-label={t('section.xat.compartir.converses', 'Converses on es pot enviar')}>
            {fils.map((fil) => (
              <li key={fil.id}>
                <FilaConversa
                  fil={fil}
                  activa={filActiuId != null && String(fil.id) === String(filActiuId)}
                  onSelect={() => onTria(fil)}
                  locale={locale}
                  t={t}
                  joId={joId}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="sdp-xat-avis" role="status">{t('section.xat.compartir.senseConverses', 'Encara no tens cap conversa on es puga enviar.')}</p>
        )}
        <div className="sdp-xat-dialeg__accions">
          <button type="button" className="sdp-xat-pindola sdp-xat-pindola--secundaria" onClick={onDescarta}>
            {nomesRebutjats ? t('section.xat.compartir.entesos', 'Entesos') : t('section.xat.compartir.descarta', 'Descarta')}
          </button>
        </div>
      </div>
    </Dialeg>
  );
}
