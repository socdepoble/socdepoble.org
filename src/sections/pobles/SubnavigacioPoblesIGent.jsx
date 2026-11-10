/**
 * SubnavigacioPoblesIGent.jsx — Subnavegació transversal entre Pobles (/pobles),
 * Gent i Entitats (/perfil) i Demografia (/poblacio), més barra de filtres
 * accessibles per al directori públic (/perfil).
 *
 * Onada R16.12 (`Expedient R16-X1`):
 *  - Connecta visualment i amb 1 clic `/pobles`, `/perfil` i `/poblacio`.
 *  - A `/perfil`, ofereix filtres accessibles (`aria-pressed`) per tipus
 *    (`Tots`, `Persones`, `Entitats i Grups`, `IA`) i filtra perfils no públics
 *    (`publicat !== false`).
 *
 * R16b (3a ronda) · L'emoji de cada enllaç és decoració: va en un `<span aria-hidden="true">`
 * i el nom accessible és només el text. Dins del grup de filtres ja no hi ha la píndola «Gent»:
 * era un enllaç a la mateixa `/perfil`, sense `aria-current` i sense filtrar res, i l'enllaç
 * «Gent i Entitats» de la subnavegació ja hi porta, marcat com a pàgina actual.
 */
import { Link } from '../../app/contexts/RouterContext';
import { tipusDAgent } from '../../data/agentsSeed.js';

export const TEXTOS_SUBNAV_POBLES_GENT = Object.freeze({
  ca: Object.freeze({
    ariaNav: 'Directori de pobles i gent',
    pobles: 'Pobles',
    perfil: 'Gent i Entitats',
    poblacio: 'Demografia',
    ariaFiltres: 'Filtra el directori per tipus',
    tots: 'Tots',
    persona: 'Persones',
    entitat: 'Entitats i Grups',
    ia: 'IA'
  }),
  es: Object.freeze({
    ariaNav: 'Directorio de pueblos y gente',
    pobles: 'Pueblos',
    perfil: 'Gente y Entidades',
    poblacio: 'Demografía',
    ariaFiltres: 'Filtrar el directorio por tipo',
    tots: 'Todos',
    persona: 'Personas',
    entitat: 'Entidades y Grupos',
    ia: 'IA'
  }),
  en: Object.freeze({
    ariaNav: 'Towns and people directory',
    pobles: 'Towns',
    perfil: 'People & Entities',
    poblacio: 'Demographics',
    ariaFiltres: 'Filter directory by type',
    tots: 'All',
    persona: 'People',
    entitat: 'Entities & Groups',
    ia: 'AI'
  }),
  eu: Object.freeze({
    ariaNav: 'Herrien eta jendearen direktorioa',
    pobles: 'Herriak',
    perfil: 'Jendea eta Entitateak',
    poblacio: 'Demografia',
    ariaFiltres: 'Iragazi direktorioa motaren arabera',
    tots: 'Denak',
    persona: 'Pertsonak',
    entitat: 'Entitateak eta Taldeak',
    ia: 'AA'
  }),
  gl: Object.freeze({
    ariaNav: 'Directorio de vilas e xente',
    pobles: 'Vilas',
    perfil: 'Xente e Entidades',
    poblacio: 'Demografía',
    ariaFiltres: 'Filtrar o directorio por tipo',
    tots: 'Todos',
    persona: 'Persoas',
    entitat: 'Entidades e Grupos',
    ia: 'IA'
  })
});

const ITEMS_SUBNAV = Object.freeze([
  Object.freeze({ id: 'pobles', href: '/pobles', emoji: '🏘️' }),
  Object.freeze({ id: 'perfil', href: '/perfil', emoji: '👥' }),
  Object.freeze({ id: 'poblacio', href: '/poblacio', emoji: '📊' })
]);

const OPCIONS_FILTRE = Object.freeze([
  Object.freeze({ id: 'tots' }),
  Object.freeze({ id: 'persona' }),
  Object.freeze({ id: 'entitat' }),
  Object.freeze({ id: 'ia' })
]);

/** Cert si el perfil és públic i pot eixir al directori obert `/perfil`. */
export function esAgentPublicDelDirectori(agent) {
  if (!agent || typeof agent !== 'object') return false;
  if (agent.publicat === false || agent.privat === true) return false;
  if (typeof agent.visibility === 'string' && agent.visibility.toLowerCase() === 'private') return false;
  return true;
}

/**
 * Filtra la llista d'agents del directori públic per visibilitat pública i
 * pel tipus seleccionat (`''` | `'tots'` | `'persona'` | `'entitat'` | `'ia'`).
 */
export function filtraAgentsDelDirectori(agents = [], filtreTipus = 'tots') {
  const llista = Array.isArray(agents) ? agents.filter(esAgentPublicDelDirectori) : [];
  const filtre = !filtreTipus || filtreTipus === 'tots' ? 'tots' : filtreTipus;
  if (filtre === 'tots') return llista;
  /* tipusDAgent (agentsSeed.js) només torna 'ia', 'entitat' o 'persona': cap altra branca. */
  return llista.filter((agent) => tipusDAgent(agent) === filtre);
}

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
  const filtreNormalitzat = !filtreActiu || filtreActiu === 'tots' ? 'tots' : filtreActiu;

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
