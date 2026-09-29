/**
 * registre.js — ÚNICA FONT DE VERITAT del catàleg.
 * Cada component exportat per src/components/PedraSeca/ ha d'estar ací, o la porta
 * tooling/gates/tractor-cataleg.mjs falla. Així «tipificar-ho tot» deixa de
 * ser una promesa: és una condició de commit.
 *
 * estat: viu        → espècimen real al catàleg
 *        maqueta    → només HTML de mostra (deute)
 *        extern     → implementat per un altre torn; cal sincronitzar
 *        obsolet    → no s'ha d'usar en codi nou
 *
 * fitxer: relatiu a src/components/ (PedraSeca/, universal/, layout/) o a
 *         src/ (app/, sections/).
 * fora: true → la peça viu fora de PedraSeca/ i la porta no la vigila. Cap
 *         peça de PedraSeca/ l'ha de portar (T52: la marca amagava les sis de
 *         composició, que ara tenen espècimen).
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
  { nom: 'Camp', fitxer: 'PedraSeca/organismes/formulari.jsx', pagina: 'formularis', estat: 'viu' },
  { nom: 'CampText', fitxer: 'PedraSeca/organismes/formulari.jsx', pagina: 'formularis', estat: 'viu' },
  { nom: 'AreaText', fitxer: 'PedraSeca/organismes/formulari.jsx', pagina: 'formularis', estat: 'viu' },
  { nom: 'Selector', fitxer: 'PedraSeca/organismes/formulari.jsx', pagina: 'formularis', estat: 'viu' },
  { nom: 'Casella', fitxer: 'PedraSeca/organismes/formulari.jsx', pagina: 'formularis', estat: 'viu' },
  { nom: 'GrupOpcions', fitxer: 'PedraSeca/organismes/formulari.jsx', pagina: 'formularis', estat: 'viu' },
  { nom: 'GrupCamps', fitxer: 'PedraSeca/organismes/formulari.jsx', pagina: 'formularis', estat: 'viu' },
  { nom: 'Interruptor', fitxer: 'PedraSeca/organismes/formulari.jsx', pagina: 'formularis', estat: 'viu' },
  { nom: 'Boto', fitxer: 'PedraSeca/atoms/Boto.jsx', pagina: 'formularis', estat: 'viu' },
  { nom: 'UniversalSearch', fitxer: 'PedraSeca/organismes/UniversalSearch.jsx', pagina: 'formularis', estat: 'viu' },
  { nom: 'PillToggle', fitxer: 'PedraSeca/molecules/PillToggle.jsx', pagina: 'formularis', estat: 'viu' },
  // Superposicions
  { nom: 'Dialeg', fitxer: 'PedraSeca/organismes/Dialeg.jsx', pagina: 'superposicions', estat: 'viu' },
  { nom: 'DialegConfirmacio', fitxer: 'PedraSeca/organismes/Dialeg.jsx', pagina: 'superposicions', estat: 'viu' },
  { nom: 'Dropdown', fitxer: 'PedraSeca/molecules/Dropdown.jsx', pagina: 'superposicions', estat: 'viu' },
  { nom: 'DropdownItem', fitxer: 'PedraSeca/molecules/Dropdown.jsx', pagina: 'superposicions', estat: 'viu' },
  { nom: 'Pista', fitxer: 'PedraSeca/molecules/Pista.jsx', pagina: 'superposicions', estat: 'viu' },
  // Estats i avisos
  { nom: 'Alerta', fitxer: 'PedraSeca/molecules/Alerta.jsx', pagina: 'retroalimentacio', estat: 'viu' },
  { nom: 'Insignia', fitxer: 'PedraSeca/atoms/Insignia.jsx', pagina: 'retroalimentacio', estat: 'viu' },
  { nom: 'EstatBuit', fitxer: 'PedraSeca/atoms/estats.jsx', pagina: 'retroalimentacio', estat: 'viu' },
  { nom: 'Carregant', fitxer: 'PedraSeca/atoms/estats.jsx', pagina: 'retroalimentacio', estat: 'viu' },
  { nom: 'Esquelet', fitxer: 'PedraSeca/atoms/estats.jsx', pagina: 'retroalimentacio', estat: 'viu' },
  { nom: 'Progres', fitxer: 'PedraSeca/atoms/estats.jsx', pagina: 'retroalimentacio', estat: 'viu' },
  { nom: 'showToast (AvisadorEfimer)', fitxer: 'universal/AvisadorEfimer.jsx', pagina: 'retroalimentacio', estat: 'viu', fora: true },
  // Navegació
  { nom: 'Pestanyes', fitxer: 'PedraSeca/organismes/Pestanyes.jsx', pagina: 'navegacio', estat: 'viu' },
  { nom: 'MollaPa', fitxer: 'PedraSeca/organismes/navegacio.jsx', pagina: 'navegacio', estat: 'viu' },
  { nom: 'Paginacio', fitxer: 'PedraSeca/organismes/navegacio.jsx', pagina: 'navegacio', estat: 'viu' },
  { nom: 'Accordion', fitxer: 'PedraSeca/organismes/Accordion.jsx', pagina: 'navegacio', estat: 'viu' },
  { nom: 'AccordionItem', fitxer: 'PedraSeca/organismes/Accordion.jsx', pagina: 'navegacio', estat: 'viu' },
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
  // Estructura. La closca no és cap component: és el JSX d'App.jsx (barra
  // lateral, barra negra, main i navegació mòbil) i l'espècimen n'és l'anatomia.
  // El Divisor (àtom <hr>) i AppGridResizer (vora entre columnes) són dues peces:
  // T52 les separa. Els espècimens: EspecimenArbreUniversal, EspecimenShell,
  // EspecimenGestor, EspecimenColumnes, EspecimenDivisor i EspecimenComposicio.
  { nom: 'Closca (App.jsx)', fitxer: 'app/App.jsx', pagina: 'estructura', estat: 'maqueta', fora: true },
  { nom: 'Divisor', fitxer: 'PedraSeca/atoms/Divisor.jsx', pagina: 'estructura', estat: 'viu' },
  { nom: 'AppGridResizer', fitxer: 'layout/AppGridResizer.jsx', pagina: 'estructura', estat: 'viu', fora: true },
  { nom: 'AppGridShell', fitxer: 'layout/AppGridShell.jsx', pagina: 'estructura', estat: 'viu', fora: true },
  { nom: 'AppGridColumn', fitxer: 'layout/AppGridColumn.jsx', pagina: 'estructura', estat: 'viu', fora: true },
  { nom: 'UniversalWorkspace', fitxer: 'universal/workspace/index.js', pagina: 'estructura', estat: 'viu', fora: true },
  { nom: 'UniversalPage', fitxer: 'universal/UniversalPage.jsx', pagina: 'estructura', estat: 'viu', fora: true },
  { nom: 'UniversalToolbar', fitxer: 'universal/UniversalToolbar.jsx', pagina: 'estructura', estat: 'viu', fora: true },
  { nom: 'Pila', fitxer: 'PedraSeca/composicio/index.jsx', pagina: 'estructura', estat: 'viu' },
  { nom: 'Fila', fitxer: 'PedraSeca/composicio/index.jsx', pagina: 'estructura', estat: 'viu' },
  { nom: 'Graella', fitxer: 'PedraSeca/composicio/index.jsx', pagina: 'estructura', estat: 'viu' },
  { nom: 'Costat', fitxer: 'PedraSeca/composicio/index.jsx', pagina: 'estructura', estat: 'viu' },
  { nom: 'Centre', fitxer: 'PedraSeca/composicio/index.jsx', pagina: 'estructura', estat: 'viu' },
  { nom: 'Superficie', fitxer: 'PedraSeca/composicio/index.jsx', pagina: 'estructura', estat: 'viu' },
];
REGISTRE.push({ nom: 'Avatar', fitxer: 'PedraSeca/atoms/Avatar.jsx', pagina: 'fonaments', estat: 'viu' });
REGISTRE.push({ nom: 'GrupAvatars', fitxer: 'PedraSeca/atoms/Avatar.jsx', pagina: 'fonaments', estat: 'viu' });
REGISTRE.push({ nom: 'Botonera', fitxer: 'PedraSeca/molecules/Botonera.jsx', pagina: 'fonaments', estat: 'viu' });
REGISTRE.push({ nom: 'Taula', fitxer: 'PedraSeca/organismes/Taula.jsx', pagina: 'fonaments', estat: 'viu' });
REGISTRE.push({ nom: 'ControlContrasenya', fitxer: 'PedraSeca/atoms/ControlContrasenya.jsx', pagina: 'formularis', estat: 'viu' });
REGISTRE.push({ nom: 'ResultatCerca', fitxer: 'PedraSeca/organismes/ResultatCerca.jsx', pagina: 'fonaments', estat: 'viu' });
/* T40–T41 (ordre del Mestre, 260928) · el mes compartit Consola–editor, la pastilla de
   data de publicació i el selector de visibilitat (este, a universal/, fora de PedraSeca). */
REGISTRE.push({ nom: 'NavegacioMes', fitxer: 'PedraSeca/organismes/CalendariMes.jsx', pagina: 'formularis', estat: 'viu' });
REGISTRE.push({ nom: 'GraellaMes', fitxer: 'PedraSeca/organismes/CalendariMes.jsx', pagina: 'formularis', estat: 'viu' });
REGISTRE.push({ nom: 'SelectorDataHora', fitxer: 'PedraSeca/organismes/SelectorDataHora.jsx', pagina: 'formularis', estat: 'viu' });
REGISTRE.push({ nom: 'SelectorVisibilitat', fitxer: 'universal/SelectorVisibilitat.jsx', pagina: 'superposicions', estat: 'viu', fora: true });
/* T39 (ordre del Mestre, 260928) · drets d'autor a pantalla completa dins de l'editor; viuen a universal/, fora de PedraSeca. */
REGISTRE.push({ nom: 'CopyrightPage', fitxer: 'universal/drets/CopyrightPage.jsx', pagina: 'formularis', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'BotoDretsAutor', fitxer: 'universal/CopyrightSelector.jsx', pagina: 'formularis', estat: 'viu', fora: true });
/* T47 (ordre del Mestre, 260928) · l'estat de l'autodesament; viu a universal/, fora de PedraSeca. */
REGISTRE.push({ nom: 'EstatDesament', fitxer: 'universal/EstatDesament.jsx', pagina: 'retroalimentacio', estat: 'viu', fora: true });
/* T43 (ordre del Mestre, 260928) · el resum per destinatari de Connectar; viu a sections/connectar/, fora de PedraSeca. */
REGISTRE.push({ nom: 'ResumConnexio', fitxer: 'sections/connectar/ResumConnexio.jsx', pagina: 'retroalimentacio', estat: 'viu', fora: true });
/* T43 (ordre del Mestre, 260928) · identitat activa a la barra negra i administrar organitzacions; fora de PedraSeca. */
REGISTRE.push({ nom: 'BotoIdentitatActiva', fitxer: 'universal/identitat/BotoIdentitatActiva.jsx', pagina: 'fonaments', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'CalaixIdentitats', fitxer: 'universal/identitat/CalaixIdentitats.jsx', pagina: 'superposicions', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'AvatarResolt', fitxer: 'universal/identitat/AvatarResolt.jsx', pagina: 'fonaments', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'TargetaAdministrar', fitxer: 'sections/connectar/organitzacio/TargetaAdministrar.jsx', pagina: 'retroalimentacio', estat: 'viu', fora: true });
/* T46 (ordre del Mestre, 260928) · re-enquadrar la capçalera; viu a universal/enquadrament/, fora de PedraSeca. */
REGISTRE.push({ nom: 'DialegEnquadrament', fitxer: 'universal/enquadrament/DialegEnquadrament.jsx', pagina: 'superposicions', estat: 'viu', fora: true });
/* T52 (ordre del Mestre, 260928) · la classificació de davall del títol i la vista A4
   de l'editor; viuen a universal/, fora de PedraSeca. */
REGISTRE.push({ nom: 'BotoneraClassificacio', fitxer: 'universal/classificacio/BotoneraClassificacio.jsx', pagina: 'formularis', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'DialegCarpeta', fitxer: 'universal/classificacio/DialegCarpeta.jsx', pagina: 'formularis', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'DialegValors', fitxer: 'universal/classificacio/DialegValors.jsx', pagina: 'formularis', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'DialegEmoticona', fitxer: 'universal/classificacio/DialegEmoticona.jsx', pagina: 'formularis', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'DocumentPrintPreview', fitxer: 'universal/DocumentPrintPreview.jsx', pagina: 'superposicions', estat: 'viu', fora: true });
/* T51 (ordre del Mestre, 260928) · les barres de color de PageFrame, ja components propis;
   els espècimens vius són EspecimenControlsBarra i, per a l'espai central, EspecimenEmoticonaBarra. */
REGISTRE.push({ nom: 'BarraBlava', fitxer: 'universal/barres/BarraBlava.jsx', pagina: 'fonaments', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'BarraTaronja', fitxer: 'universal/barres/BarraTaronja.jsx', pagina: 'fonaments', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'BotoVisibilitat', fitxer: 'universal/barres/BotoVisibilitat.jsx', pagina: 'fonaments', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'EmoticonaBarra', fitxer: 'universal/EmoticonaBarra.jsx', pagina: 'fonaments', estat: 'viu', fora: true });
/* T50 (decisió del Mestre, 260928: «Llista + dreta si hi cap») · la targeta del document
   que s'escriu i el seu xip; viuen a universal/, fora de PedraSeca. Espècimen: EspecimenTargetaViva. */
REGISTRE.push({ nom: 'TargetaViva', fitxer: 'universal/TargetaViva.jsx', pagina: 'fonaments', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'BotoTargetaViva', fitxer: 'universal/TargetaViva.jsx', pagina: 'fonaments', estat: 'viu', fora: true });
/* Onada 3B (Pedra Seca §9) · les peces del Xat; viuen a sections/xat/components/, fora de
   PedraSeca. Espècimens: EspecimenXat, EspecimenXatLlista, EspecimenXatCerca,
   EspecimenXatComunitats, EspecimenXatNovaConversa i EspecimenXatRail. */
REGISTRE.push({ nom: 'FilaConversa', fitxer: 'sections/xat/components/FilaConversa.jsx', pagina: 'fonaments', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'FilaComunitat', fitxer: 'sections/xat/components/FilaConversa.jsx', pagina: 'fonaments', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'Bombolla', fitxer: 'sections/xat/components/Bombolla.jsx', pagina: 'fonaments', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'Compositor', fitxer: 'sections/xat/components/Compositor.jsx', pagina: 'fonaments', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'CapcaleraConversa', fitxer: 'sections/xat/components/CapcaleraConversa.jsx', pagina: 'fonaments', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'MenuLlista', fitxer: 'sections/xat/components/MenuLlista.jsx', pagina: 'fonaments', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'BarraSeleccio', fitxer: 'sections/xat/components/BarraSeleccio.jsx', pagina: 'fonaments', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'FiltresCerca', fitxer: 'sections/xat/components/FiltresCerca.jsx', pagina: 'fonaments', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'ResultatsCercaXat', fitxer: 'sections/xat/components/ResultatsCercaXat.jsx', pagina: 'fonaments', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'FitxaComunitat', fitxer: 'sections/xat/components/FitxaComunitat.jsx', pagina: 'fonaments', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'VistaComunitats', fitxer: 'sections/xat/components/VistaComunitats.jsx', pagina: 'fonaments', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'DialegNovaConversa', fitxer: 'sections/xat/components/DialegNovaConversa.jsx', pagina: 'superposicions', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'RailXat', fitxer: 'sections/xat/components/ClosCaXat.jsx', pagina: 'navegacio', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'VistaEnConstruccio', fitxer: 'sections/xat/components/VistaEnConstruccio.jsx', pagina: 'navegacio', estat: 'viu', fora: true });
