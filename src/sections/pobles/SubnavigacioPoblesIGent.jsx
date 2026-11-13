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
import { tipusDAgent } from '../../data/agentsSeed.js';
import { esAgentFicticiLegacy } from '../../data/catalegAgents.js';

export const TEXTOS_SUBNAV_POBLES_GENT = Object.freeze({
  ca: Object.freeze({
    ariaNav: 'Directori de pobles i gent',
    pobles: 'Pobles',
    perfil: 'Gent i Entitats',
    subtitolPerfil: 'Directori de persones, entitats i col·lectius del poble.',
    poblacio: 'Demografia',
    ariaFiltres: 'Filtra el directori per tipus',
    tots: 'Tots',
    persona: 'Persones',
    entitat: 'Entitats i Grups'
  }),
  es: Object.freeze({
    ariaNav: 'Directorio de pueblos y gente',
    pobles: 'Pueblos',
    perfil: 'Gente y Entidades',
    subtitolPerfil: 'Directorio de personas, entidades y colectivos del pueblo.',
    poblacio: 'Demografía',
    ariaFiltres: 'Filtrar el directorio por tipo',
    tots: 'Todos',
    persona: 'Personas',
    entitat: 'Entidades y Grupos'
  }),
  en: Object.freeze({
    ariaNav: 'Towns and people directory',
    pobles: 'Towns',
    perfil: 'People & Entities',
    subtitolPerfil: 'Directory of people, entities and local groups.',
    poblacio: 'Demographics',
    ariaFiltres: 'Filter directory by type',
    tots: 'All',
    persona: 'People',
    entitat: 'Entities & Groups'
  }),
  eu: Object.freeze({
    ariaNav: 'Herrien eta jendearen direktorioa',
    pobles: 'Herriak',
    perfil: 'Jendea eta Entitateak',
    subtitolPerfil: 'Herriko pertsona, entitate eta taldeen direktorioa.',
    poblacio: 'Demografia',
    ariaFiltres: 'Iragazi direktorioa motaren arabera',
    tots: 'Denak',
    persona: 'Pertsonak',
    entitat: 'Entitateak eta Taldeak'
  }),
  gl: Object.freeze({
    ariaNav: 'Directorio de vilas e xente',
    pobles: 'Vilas',
    perfil: 'Xente e Entidades',
    subtitolPerfil: 'Directorio de persoas, entidades e colectivos da vila.',
    poblacio: 'Demografía',
    ariaFiltres: 'Filtrar o directorio por tipo',
    tots: 'Todos',
    persona: 'Persoas',
    entitat: 'Entidades e Grupos'
  })
});

export function encapcalamentDirectoriGent(idioma = 'ca', titolTraduit = '', subtitolTraduit = '') {
  const demanada = String(idioma || 'ca').toLowerCase().split('-')[0];
  const codiIdioma = Object.hasOwn(TEXTOS_SUBNAV_POBLES_GENT, demanada) ? demanada : 'ca';
  const textos = TEXTOS_SUBNAV_POBLES_GENT[codiIdioma];
  const portaAgents = (s) => typeof s === 'string' && /\b(agents|agentes|agenteak|axentes)\b/i.test(s);
  return {
    titol: !titolTraduit || portaAgents(titolTraduit) ? textos.perfil : titolTraduit,
    subtitol: !subtitolTraduit || portaAgents(subtitolTraduit) ? textos.subtitolPerfil : subtitolTraduit
  };
}

const ITEMS_SUBNAV = Object.freeze([
  Object.freeze({ id: 'pobles', href: '/pobles', emoji: '🏘️' }),
  Object.freeze({ id: 'perfil', href: '/perfil', emoji: '👥' }),
  Object.freeze({ id: 'poblacio', href: '/poblacio', emoji: '📊' })
]);

export const OPCIONS_FILTRE = Object.freeze([
  Object.freeze({ id: 'tots' }),
  Object.freeze({ id: 'persona' }),
  Object.freeze({ id: 'entitat' })
]);

export function esPersonatgeObsoletOIA(agent) {
  if (!agent || typeof agent !== 'object' || Array.isArray(agent)) return true;
  /* Same historical-identity rule as the server repair. Names, personaKey
     and a UUID prefix do not establish that a real person is fictional.
     The canonical IAIA is the single AI exception, including in All. */
  return esAgentFicticiLegacy(agent);
}

/** Cert si el perfil és públic i pertany al directori de persones i entitats `/perfil`. */
export function esAgentPublicDelDirectori(agent) {
  if (!agent || typeof agent !== 'object') return false;
  if (agent.publicat === false || agent.privat === true) return false;
  if (typeof agent.visibility === 'string' && agent.visibility.toLowerCase() === 'private') return false;
  if (esPersonatgeObsoletOIA(agent)) return false;
  return true;
}

/**
 * Filtra la llista del directori públic per visibilitat, excloent IA/bots/personatges
 * ficticis obsolets, i pel tipus seleccionat (`''` | `'tots'` | `'persona'` | `'entitat'`).
 */
export function filtraAgentsDelDirectori(agents = [], filtreTipus = 'tots') {
  const llista = Array.isArray(agents) ? agents.filter(esAgentPublicDelDirectori) : [];
  const filtre = !filtreTipus || filtreTipus === 'tots' ? 'tots' : filtreTipus;
  if (filtre === 'tots') return llista;
  if (filtre !== 'persona' && filtre !== 'entitat') return [];
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
