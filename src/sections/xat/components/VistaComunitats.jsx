/**
 * VistaComunitats.jsx — la vista «Comunitats» de la columna central (onada
 * 3B, captura de referència 19.41.43). S'obri amb /xat?vista=comunitats
 * des de l'entrada «Comunitats» del rail.
 *
 * De dalt a baix:
 *   · la fila de títol «Comunitats» amb el «+» redó. Cap RPC crea una
 *     comunitat: naixen de la Pàgina Universal d'una entitat o d'un poble
 *     («Comentar» a la seua pàgina), i el «+» ho diu (`onNova`, un avís);
 *   · per a cada comunitat (useXat().comunitats), la fila de capçalera amb
 *     l'avatar QUADRAT net (sense les targetes apilades de la fila de la
 *     llista de Xats: a la captura no n'hi ha) i el nom en negreta; les
 *     files dels seus fills, primer
 *     els Avisos (el megàfon) i després els grups, amb l'hora i l'avanç de la
 *     llista (FilaConversa); i «Veure-ho tot ›», que obri la seua fitxa
 *     (/xat?comunitat=<id>, FitxaComunitat de l'onada 3A);
 *   · sense cap comunitat, un estat buit que diu d'on naixen.
 *
 * Presentacional: no llig cap context de l'app, i per això es pot pintar al
 * catàleg de disseny. Qui la munta decidix on porta cada clic.
 */
import { useId } from 'react';
import { ChevronRight, Plus, Users } from 'lucide-react';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import CaraXat from './CaraXat.jsx';
import FilaConversa from './FilaConversa.jsx';

const CAP = Object.freeze([]);
const noop = () => {};

/* Els fills en l'ordre de la captura: els Avisos (canal) primer i després
   els grups, cadascun en l'ordre que ja porten (activitat, agrupaComunitats). */
export function fillsEnOrdre(fills = CAP) {
  const llista = Array.isArray(fills) ? fills : CAP;
  return [...llista.filter((f) => f?.tipus === 'canal'), ...llista.filter((f) => f?.tipus !== 'canal')];
}

export default function VistaComunitats({
  comunitats = CAP, filActiuId = null, onObriFil = noop, onObriComunitat = noop, onNova = noop,
  esquerra = null, carregant = false, locale, t, joId = null
}) {
  const base = useId();
  const titol = t('section.xat.rail.comunitats', 'Comunitats');
  const etiquetaNova = t('section.xat.nou.comunitat', 'Nova comunitat');
  const llista = Array.isArray(comunitats) ? comunitats : CAP;

  let cos;
  if (!llista.length) {
    cos = carregant ? (
      <p className="sdp-workspace-state" role="status" aria-live="polite">{t('section.xat.carregant', 'Carregant…')}</p>
    ) : (
      <div className="sdp-workspace-state" role="status">
        <strong>{t('section.xat.vista.comunitats.buit.titol', 'Encara no formes part de cap comunitat')}</strong>
        <p>{t('section.xat.vista.comunitats.buit.text', "Les comunitats naixen de la Pàgina Universal d'una entitat o d'un poble. Obri la seua pàgina i prem «Comentar».")}</p>
      </div>
    );
  } else {
    cos = (
      <div className="sdp-xat-vista-comunitats">
        {llista.map((comunitat, i) => {
          const { fil } = comunitat;
          const nom = fil.name || fil.title || t('section.xat.conversaSenseNom', 'Conversa');
          const idNom = `${base}-${i}`;
          return (
            <section key={fil.id} className="sdp-xat-vista-comunitats__bloc" aria-labelledby={idNom} data-comunitat={String(fil.id)}>
              <h3 id={idNom} className="sdp-xat-vista-comunitats__cap">
                <span className="sdp-xat-vista-comunitats__avatar" aria-hidden="true">
                  <CaraXat nom={nom} src={fil.avatar_url} mida="md" llavor={fil.id} alt="" className="sdp-xat-avatar--quadrat" />
                </span>
                <span className="sdp-xat-vista-comunitats__nom">{nom}</span>
              </h3>
              <ul className="sdp-xat-llista">
                {fillsEnOrdre(comunitat.fills).map((f) => (
                  <li key={f.id}>
                    <FilaConversa
                      fil={f}
                      activa={filActiuId != null && String(f.id) === String(filActiuId)}
                      onSelect={onObriFil}
                      locale={locale}
                      t={t}
                      joId={joId}
                    />
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="sdp-xat-vista-comunitats__tot"
                aria-label={t('section.xat.vista.comunitats.veureTotDe', 'Veure-ho tot de {nom}').replace('{nom}', nom)}
                onClick={() => onObriComunitat(fil.id)}
              >
                <span>{t('section.xat.vista.comunitats.veureTot', 'Veure-ho tot')}</span>
                <ChevronRight size={20} aria-hidden="true" focusable="false" />
              </button>
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <AppGridColumn esDark={true} titol={titol} icona={Users} esquerra={esquerra}>
        <button type="button" className="sdp-xat-nova" aria-label={etiquetaNova} title={etiquetaNova} onClick={onNova}>
          <Plus size={24} aria-hidden="true" focusable="false" />
        </button>
      </AppGridColumn>
      <div className="sdp-workspace-column__body">{cos}</div>
    </>
  );
}
