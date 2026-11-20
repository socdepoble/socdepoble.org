/**
 * SubnavigacioPoblesIGent.jsx — Subnavegació transversal centrada entre Pobles (/pobles),
 * Gent i Entitats (/perfil) i Demografia (/poblacio), més barra de filtres
 * accessibles per al directori públic (/perfil).
 *
 * R21.5:
 *  - Centra horitzontalment tant la fila de pestanyes com la fila de filtres.
 *  - Elimina la pestanya d'agents (`ia`), deixant exclusivament `Tots` · `Persones` · `Entitats i Grups`.
 *  - Aplica la mateixa purga que el catàleg/servidor: identificadors històrics i IA/animals,
 *    amb l'excepció canònica de la IAIA MarIA. Noms, personaKey i prefixos no identifiquen bots.
 */
import { Link } from '../../app/contexts/RouterContext';
import { ITEMS_SUBNAV, OPCIONS_FILTRE, TEXTOS_SUBNAV_POBLES_GENT } from './subnavigacioPoblesIGentModel.js';

export default function SubnavigacioPoblesIGent({
  actiu = 'pobles',
  filtreActiu = null,
  onCanviaFiltre = null,
  idioma = 'ca'
}) {
  const demanada = String(idioma || 'ca').toLowerCase().split('-')[0];
  /* C6-05 (R16b) · Les 5 llengües de la interfície; qualsevol altra, en valencià. */
  const codiIdioma = Object.hasOwn(TEXTOS_SUBNAV_POBLES_GENT, demanada) ? demanada : 'ca';
  const textos = TEXTOS_SUBNAV_POBLES_GENT[codiIdioma];
  const filtreNormalitzat = filtreActiu === 'persona' || filtreActiu === 'entitat' ? filtreActiu : 'tots';

  return (
    <div className="sdp-subnav-pobles-gent-contenidor">
      <nav aria-label={textos.ariaNav}>
        <ul className="sdp-subnav-pobles-gent__llista">
          {ITEMS_SUBNAV.map((item) => {
            const esActiu = actiu === item.id;
            return (
              <li key={item.id}>
                <Link
                  to={item.href}
                  className={
                    esActiu
                      ? 'sdp-subnav-pobles-gent__enllac sdp-subnav-pobles-gent__enllac--actiu'
                      : 'sdp-subnav-pobles-gent__enllac'
                  }
                  aria-current={esActiu ? 'page' : undefined}
                >
                  {/* Un sol fill de l'enllaç (inline-flex): l'espai entre l'emoji i el text es conserva. */}
                  <span>
                    <span aria-hidden="true">{item.emoji}</span> {textos[item.id]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {typeof onCanviaFiltre === 'function' ? (
        <div className="sdp-directori-filtres" role="group" aria-label={textos.ariaFiltres}>
          <div className="sdp-directori-filtres__botons">
            {OPCIONS_FILTRE.map((opcio) => {
              const premut = filtreNormalitzat === opcio.id;
              return (
                <button
                  key={opcio.id}
                  type="button"
                  className={
                    premut
                      ? 'sdp-directori-filtres__boto sdp-directori-filtres__boto--actiu'
                      : 'sdp-directori-filtres__boto'
                  }
                  aria-pressed={premut}
                  onClick={() => onCanviaFiltre(opcio.id === 'tots' ? '' : opcio.id)}
                >
                  {textos[opcio.id]}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
