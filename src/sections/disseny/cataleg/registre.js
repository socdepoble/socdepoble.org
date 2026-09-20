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
  // Fonaments (espècimens vius a detalls/EspecimenUniversalCard, EspecimenControlsBarra,
  // EspecimenAvatar, EspecimenBotonera, EspecimenTaula i EspecimenIndicador)
  { nom: 'UniversalCard', fitxer: 'PedraSeca/organismes/UniversalCard.jsx', pagina: 'fonaments', estat: 'viu' },
  { nom: 'UniversalIndicatorCard', fitxer: 'PedraSeca/organismes/UniversalIndicatorCard.jsx', pagina: 'fonaments', estat: 'viu' },
  { nom: 'ActionControl', fitxer: 'PedraSeca/atoms/controls.jsx', pagina: 'fonaments', estat: 'viu' },
  { nom: 'IconButton', fitxer: 'PedraSeca/atoms/controls.jsx', pagina: 'fonaments', estat: 'viu' },
  { nom: 'UniversalButton', fitxer: 'PedraSeca/atoms/controls.jsx', pagina: 'fonaments', estat: 'obsolet', substitut: 'Boto' },
  { nom: 'DateTimeControl', fitxer: 'PedraSeca/atoms/controls.jsx', pagina: 'fonaments', estat: 'viu' },
  { nom: 'IaiaIcon', fitxer: 'PedraSeca/atoms/icones.jsx', pagina: 'fonaments', estat: 'viu' },
  { nom: 'BackIcon', fitxer: 'PedraSeca/atoms/icones.jsx', pagina: 'fonaments', estat: 'viu' },
  { nom: 'ForwardIcon', fitxer: 'PedraSeca/atoms/icones.jsx', pagina: 'fonaments', estat: 'viu' },
  { nom: 'IndexIcon', fitxer: 'PedraSeca/atoms/icones.jsx', pagina: 'fonaments', estat: 'viu' },
  { nom: 'TranslateIcon', fitxer: 'PedraSeca/atoms/icones.jsx', pagina: 'fonaments', estat: 'viu' },
  { nom: 'CommentIcon', fitxer: 'PedraSeca/atoms/icones.jsx', pagina: 'fonaments', estat: 'viu' },
  { nom: 'ShareIcon', fitxer: 'PedraSeca/atoms/icones.jsx', pagina: 'fonaments', estat: 'viu' },
  { nom: 'PinIcon', fitxer: 'PedraSeca/atoms/icones.jsx', pagina: 'fonaments', estat: 'viu' },
  // Estructura (torn de Codex: l'anatomia és canònica, l'API s'ha de sincronitzar)
  { nom: 'UniversalShell', fitxer: 'layout/ (Codex)', pagina: 'estructura', estat: 'extern', fora: true },
  { nom: 'Divisor', fitxer: 'layout/ (Codex)', pagina: 'estructura', estat: 'extern', fora: true },
  { nom: 'AppGridShell', fitxer: 'layout/AppGridShell.jsx', pagina: 'estructura', estat: 'viu', fora: true },
  { nom: 'UniversalWorkspace', fitxer: 'universal/workspace/index.js', pagina: 'estructura', estat: 'viu', fora: true },
  { nom: 'UniversalPage', fitxer: 'universal/UniversalPage.jsx', pagina: 'estructura', estat: 'viu', fora: true },
  { nom: 'Pila', fitxer: 'PedraSeca/composicio/index.jsx', pagina: 'estructura', estat: 'viu', fora: true },
  { nom: 'Fila', fitxer: 'PedraSeca/composicio/index.jsx', pagina: 'estructura', estat: 'viu', fora: true },
  { nom: 'Graella', fitxer: 'PedraSeca/composicio/index.jsx', pagina: 'estructura', estat: 'viu', fora: true },
  { nom: 'Costat', fitxer: 'PedraSeca/composicio/index.jsx', pagina: 'estructura', estat: 'viu', fora: true },
  { nom: 'Centre', fitxer: 'PedraSeca/composicio/index.jsx', pagina: 'estructura', estat: 'viu', fora: true },
  { nom: 'Superficie', fitxer: 'PedraSeca/composicio/index.jsx', pagina: 'estructura', estat: 'viu', fora: true },
];
REGISTRE.push({ nom: 'Avatar', fitxer: 'PedraSeca/atoms/Avatar.jsx', pagina: 'fonaments', estat: 'viu' });
REGISTRE.push({ nom: 'GrupAvatars', fitxer: 'PedraSeca/atoms/Avatar.jsx', pagina: 'fonaments', estat: 'viu' });
REGISTRE.push({ nom: 'Botonera', fitxer: 'PedraSeca/molecules/Botonera.jsx', pagina: 'fonaments', estat: 'viu' });
REGISTRE.push({ nom: 'Taula', fitxer: 'PedraSeca/organismes/Taula.jsx', pagina: 'fonaments', estat: 'viu' });
