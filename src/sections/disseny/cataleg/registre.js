/**
 * registre.js — ÚNICA FONT DE VERITAT del catàleg.
 * Cada component exportat per src/components/PedraSeca/ ha d'estar ací, o la porta
 * tooling/gates/tractor-cataleg.mjs falla. Així «tipificar-ho tot» deixa de
 * ser una promesa: és una condició de commit.
 *
 * estat: viu        → espècimen real al catàleg
 *        maqueta    → només HTML de mostra a Fonaments (deute)
 *        extern     → implementat per un altre torn (Codex); cal sincronitzar
 *        obsolet    → no s'ha d'usar en codi nou
 */
export const PAGINES = [
  { id: 'fonaments', titol: 'Fonaments' },
  { id: 'estructura', titol: 'Estructura' },
  { id: 'formularis', titol: 'Formularis' },
  { id: 'superposicions', titol: 'Diàlegs i calaixos' },
  { id: 'retroalimentacio', titol: 'Estats i avisos' },
  { id: 'navegacio', titol: 'Navegació' },
  { id: 'inventari', titol: 'Inventari' },
];

export const REGISTRE = [
  // Formularis
  { nom: 'Camp', fitxer: 'ui/formulari.jsx', pagina: 'formularis', estat: 'viu' },
  { nom: 'CampText', fitxer: 'ui/formulari.jsx', pagina: 'formularis', estat: 'viu' },
  { nom: 'AreaText', fitxer: 'ui/formulari.jsx', pagina: 'formularis', estat: 'viu' },
  { nom: 'Selector', fitxer: 'ui/formulari.jsx', pagina: 'formularis', estat: 'viu' },
  { nom: 'Casella', fitxer: 'ui/formulari.jsx', pagina: 'formularis', estat: 'viu' },
  { nom: 'GrupOpcions', fitxer: 'ui/formulari.jsx', pagina: 'formularis', estat: 'viu' },
  { nom: 'GrupCamps', fitxer: 'ui/formulari.jsx', pagina: 'formularis', estat: 'viu' },
  { nom: 'Interruptor', fitxer: 'ui/formulari.jsx', pagina: 'formularis', estat: 'viu' },
  { nom: 'Boto', fitxer: 'ui/Boto.jsx', pagina: 'formularis', estat: 'viu' },
  { nom: 'UniversalSearch', fitxer: 'ui/UniversalSearch.jsx', pagina: 'formularis', estat: 'viu' },
  { nom: 'PillToggle', fitxer: 'ui/PillToggle.jsx', pagina: 'formularis', estat: 'viu' },
  // Superposicions
  { nom: 'Dialeg', fitxer: 'ui/Dialeg.jsx', pagina: 'superposicions', estat: 'viu' },
  { nom: 'DialegConfirmacio', fitxer: 'ui/Dialeg.jsx', pagina: 'superposicions', estat: 'viu' },
  { nom: 'Dropdown', fitxer: 'PedraSeca/molecules/Dropdown.jsx', pagina: 'superposicions', estat: 'viu' },
  { nom: 'DropdownItem', fitxer: 'PedraSeca/molecules/Dropdown.jsx', pagina: 'superposicions', estat: 'viu' },
  { nom: 'Pista', fitxer: 'ui/Pista.jsx', pagina: 'superposicions', estat: 'viu' },
  // Estats i avisos
  { nom: 'Alerta', fitxer: 'ui/Alerta.jsx', pagina: 'retroalimentacio', estat: 'viu' },
  { nom: 'Insignia', fitxer: 'ui/Insignia.jsx', pagina: 'retroalimentacio', estat: 'viu' },
  { nom: 'EstatBuit', fitxer: 'ui/estats.jsx', pagina: 'retroalimentacio', estat: 'viu' },
  { nom: 'Carregant', fitxer: 'ui/estats.jsx', pagina: 'retroalimentacio', estat: 'viu' },
  { nom: 'Esquelet', fitxer: 'ui/estats.jsx', pagina: 'retroalimentacio', estat: 'viu' },
  { nom: 'Progres', fitxer: 'ui/estats.jsx', pagina: 'retroalimentacio', estat: 'viu' },
  { nom: 'showToast (AvisadorEfimer)', fitxer: 'universal/AvisadorEfimer.jsx', pagina: 'retroalimentacio', estat: 'viu', fora: true },
  // Navegació
  { nom: 'Pestanyes', fitxer: 'ui/Pestanyes.jsx', pagina: 'navegacio', estat: 'viu' },
  { nom: 'MollaPa', fitxer: 'ui/navegacio.jsx', pagina: 'navegacio', estat: 'viu' },
  { nom: 'Paginacio', fitxer: 'ui/navegacio.jsx', pagina: 'navegacio', estat: 'viu' },
  { nom: 'Accordion', fitxer: 'ui/Accordion.jsx', pagina: 'navegacio', estat: 'viu' },
  { nom: 'AccordionItem', fitxer: 'ui/Accordion.jsx', pagina: 'navegacio', estat: 'viu' },
  // Fonaments (maquetes que encara no són components)
  { nom: 'UniversalCard', fitxer: 'ui/UniversalCard.jsx', pagina: 'fonaments', estat: 'viu' },
  { nom: 'UniversalIndicatorCard', fitxer: 'ui/UniversalIndicatorCard.jsx', pagina: 'fonaments', estat: 'maqueta' },
  { nom: 'ActionControl', fitxer: 'ui/controls.jsx', pagina: 'fonaments', estat: 'maqueta' },
  { nom: 'IconButton', fitxer: 'ui/controls.jsx', pagina: 'fonaments', estat: 'maqueta' },
  { nom: 'UniversalButton', fitxer: 'ui/controls.jsx', pagina: 'fonaments', estat: 'obsolet', substitut: 'Boto' },
  { nom: 'DateTimeControl', fitxer: 'ui/controls.jsx', pagina: 'fonaments', estat: 'maqueta' },
  { nom: 'IaiaIcon', fitxer: 'ui/icones.jsx', pagina: 'fonaments', estat: 'maqueta' },
  { nom: 'BackIcon', fitxer: 'ui/icones.jsx', pagina: 'fonaments', estat: 'maqueta' },
  { nom: 'ForwardIcon', fitxer: 'ui/icones.jsx', pagina: 'fonaments', estat: 'maqueta' },
  { nom: 'IndexIcon', fitxer: 'ui/icones.jsx', pagina: 'fonaments', estat: 'maqueta' },
  { nom: 'TranslateIcon', fitxer: 'ui/icones.jsx', pagina: 'fonaments', estat: 'maqueta' },
  { nom: 'CommentIcon', fitxer: 'ui/icones.jsx', pagina: 'fonaments', estat: 'maqueta' },
  { nom: 'ShareIcon', fitxer: 'ui/icones.jsx', pagina: 'fonaments', estat: 'maqueta' },
  { nom: 'PinIcon', fitxer: 'ui/icones.jsx', pagina: 'fonaments', estat: 'maqueta' },
  // Estructura (torn de Codex: l'anatomia és canònica, l'API s'ha de sincronitzar)
  { nom: 'UniversalShell', fitxer: 'layout/ (Codex)', pagina: 'estructura', estat: 'extern', fora: true },
  { nom: 'Divisor', fitxer: 'layout/ (Codex)', pagina: 'estructura', estat: 'extern', fora: true },
  { nom: 'AppGridShell + UniversalWorkspace', fitxer: 'layout/ + universal/workspace/', pagina: 'estructura', estat: 'estable' },
  { nom: 'UniversalPage', fitxer: 'universal/UniversalPage.jsx', pagina: 'estructura', estat: 'viu', fora: true },
  { nom: 'Pila', fitxer: 'PedraSeca/composicio/index.jsx', pagina: 'estructura', estat: 'viu', fora: true },
  { nom: 'Fila', fitxer: 'PedraSeca/composicio/index.jsx', pagina: 'estructura', estat: 'viu', fora: true },
  { nom: 'Graella', fitxer: 'PedraSeca/composicio/index.jsx', pagina: 'estructura', estat: 'viu', fora: true },
  { nom: 'Costat', fitxer: 'PedraSeca/composicio/index.jsx', pagina: 'estructura', estat: 'viu', fora: true },
  { nom: 'Centre', fitxer: 'PedraSeca/composicio/index.jsx', pagina: 'estructura', estat: 'viu', fora: true },
  { nom: 'Superficie', fitxer: 'PedraSeca/composicio/index.jsx', pagina: 'estructura', estat: 'viu', fora: true },
];
REGISTRE.push({ nom: 'Avatar', fitxer: 'ui/Avatar.jsx', pagina: 'fonaments', estat: 'maqueta' });
REGISTRE.push({ nom: 'GrupAvatars', fitxer: 'ui/Avatar.jsx', pagina: 'fonaments', estat: 'maqueta' });
REGISTRE.push({ nom: 'Botonera', fitxer: 'ui/Botonera.jsx', pagina: 'fonaments', estat: 'maqueta' });
REGISTRE.push({ nom: 'Taula', fitxer: 'ui/Taula.jsx', pagina: 'fonaments', estat: 'maqueta' });
