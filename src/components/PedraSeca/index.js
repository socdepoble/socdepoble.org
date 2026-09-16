/**
 * components/PedraSeca — façana pública del sistema de disseny.
 *
 * Totes les importacions a la resta de l'app deuen apuntar ací.
 */

// ── COMPOSICIÓ (Containers estructurals) ───────────────────────────────────
export * from './composicio/index.jsx';

// ── ÀTOMS (Elements base) ──────────────────────────────────────────────────
export { Boto, Boto as UniversalButton } from './atoms/Boto.jsx';
export { ActionControl, IconButton, DateTimeControl } from './atoms/controls.jsx';
export { Avatar } from './atoms/Avatar.jsx';
export { Insignia } from './atoms/Insignia.jsx';
export { Divisor } from './atoms/Divisor.jsx';
export {
  BackIcon, ForwardIcon, IndexIcon, TranslateIcon, CommentIcon, ShareIcon, PinIcon, IaiaIcon
} from './atoms/icones.jsx';
export { EstatBuit, Carregant, Esquelet, Progres } from './atoms/estats.jsx';

// ── MOLÈCULES (Combinacions simples) ───────────────────────────────────────
export { Alerta } from './molecules/Alerta.jsx';
export { Botonera } from './molecules/Botonera.jsx';
export { Pista } from './molecules/Pista.jsx';
export { PillToggle } from './molecules/PillToggle.jsx';
export { Dropdown, DropdownItem } from './molecules/Dropdown.jsx';

// ── ORGANISMES (Composicions complexes) ────────────────────────────────────
export { UniversalCard, UniversalCard as Targeta } from './organismes/UniversalCard.jsx';
export { UniversalIndicatorCard } from './organismes/UniversalIndicatorCard.jsx';
export { Dialeg } from './organismes/Dialeg.jsx';
export { Taula } from './organismes/Taula.jsx';
export { Accordion, AccordionItem } from './organismes/Accordion.jsx';
export { Pestanyes } from './organismes/Pestanyes.jsx';
export { UniversalSearch } from './organismes/UniversalSearch.jsx';
