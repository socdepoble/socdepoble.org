/**
 * Especimen.jsx — La fitxa d'un component al catàleg (nivell Obsidian).
 * Ordre fix, perquè una IA o una persona trobe sempre el mateix al mateix lloc:
 *   nom + fitxer · per a què serveix · ESPÈCIMEN VIU (el component real,
 *   mai una maqueta HTML) · contracte (props) · accessibilitat · fes / no facis.
 * Onada R28 · D-R27-1 (opció b) · L'estil de la fitxa (diferit-especimens.css) no viatja a l'arrencada:
 *   s'adopta a l'arrel on es munta el primer espècimen (useFullDiferit, abans del primer pintat).
 */
import { useRef } from 'react';
import { useUIActionsOpcional, useUIStateOpcional } from '../../../app/contexts/UIContext.jsx';
import { useFullDiferit } from '../../../config/fullDiferit.js';
import cssEspecimens from '../../../css/diferit-especimens.css?inline';
import { ETIQUETES_MARC_ESPECIMEN, normalitzaLlenguaDisseny } from './i18nControlsBarra.js';

function useAccionsDissenySegur() {
  try {
    return useUIActionsOpcional();
  } catch {
    return null;
  }
}

function useEstatDissenySegur() {
  try {
    return useUIStateOpcional();
  } catch {
    return null;
  }
}

export function useLlenguaDisseny() {
  const accions = useAccionsDissenySegur();
  const estat = useEstatDissenySegur();
  return normalitzaLlenguaDisseny(accions?.language || estat?.language || 'ca');
}

export function Especimen({ id, nom, fitxer, children, descripcio, contracte = [], a11y = [], fes = [], noFacis = [] }) {
  const arrel = useRef(null);
  const llengua = useLlenguaDisseny();
  const etiquetes = ETIQUETES_MARC_ESPECIMEN[llengua];
  useFullDiferit(arrel, 'especimens', cssEspecimens);
  return (
    <section ref={arrel} className="sdp-especimen" id={id} aria-labelledby={`${id}-nom`}>
      <header className="sdp-especimen__cap">
        <h3 id={`${id}-nom`} className="sdp-especimen__nom">{nom}</h3>
        {fitxer ? <code className="sdp-especimen__fitxer">{fitxer}</code> : null}
      </header>
      {descripcio ? <p>{descripcio}</p> : null}
      <div className="sdp-especimen__viu">{children}</div>
      {/* IDEA-26 (observació del Mestre, 261025) · Els noms del contracte no es
          parteixen mai: si la taula no cap a la columna, es desplaça dins de la
          seua caixa (com Taula de Pedra Seca), no la pàgina sencera. */}
      {contracte.length ? (
        <div className="sdp-especimen__contracte" role="region" aria-labelledby={`${id}-contracte ${id}-nom`} tabIndex={0}>
        <table>
          <caption id={`${id}-contracte`}>{etiquetes.contracte}</caption>
          <thead><tr><th scope="col">{etiquetes.prop}</th><th scope="col">{etiquetes.tipus}</th><th scope="col">{etiquetes.defecte}</th><th scope="col">{etiquetes.queFa}</th></tr></thead>
          <tbody>
            {contracte.map(([prop, tipus, defecte, que]) => (
              <tr key={prop}><td><code>{prop}</code></td><td><code>{tipus}</code></td><td>{defecte ?? '—'}</td><td>{que}</td></tr>
            ))}
          </tbody>
        </table>
        </div>
      ) : null}
      {a11y.length ? (
        <>
          <h4>{etiquetes.a11y}</h4>
          <ul>{a11y.map((t) => <li key={t}>{t}</li>)}</ul>
        </>
      ) : null}
      {fes.length || noFacis.length ? (
        <div className="sdp-especimen__regles">
          <div className="sdp-especimen__fes"><h4>{etiquetes.fes}</h4><ul>{fes.map((t) => <li key={t}>{t}</li>)}</ul></div>
          <div className="sdp-especimen__no"><h4>{etiquetes.noFacis}</h4><ul>{noFacis.map((t) => <li key={t}>{t}</li>)}</ul></div>
        </div>
      ) : null}
    </section>
  );
}
