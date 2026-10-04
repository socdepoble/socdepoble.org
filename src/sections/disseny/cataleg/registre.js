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
/* T6-T8 (ordre del Mestre, 260930) · el mes amb esdeveniments (Agenda del Mur i Calendari de la Consola). */
REGISTRE.push({ nom: 'CalendariEsdeveniments', fitxer: 'PedraSeca/organismes/CalendariEsdeveniments.jsx', pagina: 'formularis', estat: 'viu' });
/* T10 (ordre del Mestre, 261001) · les vistes Setmana i Mes a l'estil Google Calendar: esquelet
   a EspecimenCalendari, sense colors definitius fins a les captures del Mestre (maqueta). */
REGISTRE.push({ nom: 'VistaSetmana', fitxer: 'PedraSeca/organismes/VistaSetmana.jsx', pagina: 'formularis', estat: 'maqueta' });
REGISTRE.push({ nom: 'VistaMes', fitxer: 'PedraSeca/organismes/VistaMes.jsx', pagina: 'formularis', estat: 'maqueta' });
REGISTRE.push({ nom: 'NavegacioPeriode', fitxer: 'PedraSeca/organismes/NavegacioPeriode.jsx', pagina: 'formularis', estat: 'maqueta' });
/* Fase visual (prompt 261001_0445) · les vistes Agenda i Any, amb espècimen a EspecimenCalendari (maqueta). */
REGISTRE.push({ nom: 'VistaAgenda', fitxer: 'PedraSeca/organismes/VistaAgenda.jsx', pagina: 'formularis', estat: 'maqueta' });
REGISTRE.push({ nom: 'VistaAny', fitxer: 'PedraSeca/organismes/VistaAny.jsx', pagina: 'formularis', estat: 'maqueta' });
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
/* Ordre del Mestre del 261004 (prompt 261004_0515, T5) · Contingut multimèdia operativa i
   l'enllaç segur extret de Bombolla; viuen a sections/xat/components/, fora de PedraSeca.
   Espècimens: EspecimenXatRail (la vista) i EspecimenXat (l'enllaç dins de la bombolla). */
REGISTRE.push({ nom: 'VistaMultimedia', fitxer: 'sections/xat/components/VistaMultimedia.jsx', pagina: 'navegacio', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'EnllacSegur', fitxer: 'sections/xat/components/EnllacSegur.jsx', pagina: 'fonaments', estat: 'viu', fora: true });
/* Torn 260930 (T1) · el full «Ajustos» del Xat; viu a sections/xat/components/, fora de
   PedraSeca. Espècimen: EspecimenXatAjustos. */
REGISTRE.push({ nom: 'FullAjustos', fitxer: 'sections/xat/components/FullAjustos.jsx', pagina: 'superposicions', estat: 'viu', fora: true });
/* T7-T9 (ordre del Mestre, 261001) · la marca de l'amfitrió (franja amb pilot, enllaç a
   /fedivers i X) i les peces de connexió; viuen a universal/, fora de PedraSeca.
   Espècimens: EspecimenShell (estructura/shell, #amfitrio) i EspecimenConnexio. */
REGISTRE.push({ nom: 'TitolAmfitrio', fitxer: 'universal/MarcaAmfitrio.jsx', pagina: 'estructura', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'FranjaAmfitrio', fitxer: 'universal/MarcaAmfitrio.jsx', pagina: 'estructura', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'PilotConnexio', fitxer: 'universal/connexio/PilotConnexio.jsx', pagina: 'retroalimentacio', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'LlistaNodes', fitxer: 'universal/connexio/LlistaNodes.jsx', pagina: 'retroalimentacio', estat: 'viu', fora: true });
/* Ordre del Mestre, 261001 · el Calendari a pantalla completa: el Dialeg de mida 'completa' i el
   botó d'entrar. Espècimen: EspecimenPantallaCompleta (superposicions/pantalla-completa). */
REGISTRE.push({ nom: 'PantallaCompleta', fitxer: 'PedraSeca/organismes/PantallaCompleta.jsx', pagina: 'superposicions', estat: 'viu' });
REGISTRE.push({ nom: 'BotoPantallaCompleta', fitxer: 'PedraSeca/organismes/PantallaCompleta.jsx', pagina: 'superposicions', estat: 'viu' });
/* Fase 0 de les apps El Bar i Salut (Pedra Seca §9: abans de connectar la lògica) · les
   peces genèriques de les graelles tàctils, els imports, els apunts i les barres.
   Espècimens: EspecimenRajola, EspecimenTeclatNumeric, EspecimenLiniaDelTemps i EspecimenHistograma. */
REGISTRE.push({ nom: 'Rajola', fitxer: 'PedraSeca/molecules/Rajola.jsx', pagina: 'formularis', estat: 'viu' });
REGISTRE.push({ nom: 'TeclatNumeric', fitxer: 'PedraSeca/organismes/TeclatNumeric.jsx', pagina: 'formularis', estat: 'viu' });
REGISTRE.push({ nom: 'LiniaDelTemps', fitxer: 'PedraSeca/organismes/LiniaDelTemps.jsx', pagina: 'fonaments', estat: 'viu' });
REGISTRE.push({ nom: 'Histograma', fitxer: 'PedraSeca/organismes/Histograma.jsx', pagina: 'fonaments', estat: 'viu' });
/* Ordre del Mestre (261002, sinergies T4/T8) · l'ESQUELET COMÚ de catàleg i col·lecció: un sol
   esquelet visual per al TPV del bar («La Parròquia») i La Compra («La Nevera de Casa»).
   Espècimens: EspecimenArticles, EspecimenSeccionsCategoria, EspecimenColleccio,
   EspecimenAfegitRapid, EspecimenDetallArticle, EspecimenMarcColumna i els dos vestits de les
   mateixes columnes, EspecimenEsqueletBar i EspecimenEsqueletCompra.
   Ordre del Mestre, 261004 (prompt 261004_0515, «no inventar targetes») · GraellaArticles i
   LlistaArticles són obsoletes per a codi nou: les llistes van amb UniversalCard dins de
   GraellaTargetes. Salut i el Bar encara les fan servir: no s'esborren, i el seu espècimen
   continua viu. */
REGISTRE.push({ nom: 'GraellaArticles', fitxer: 'PedraSeca/organismes/GraellaArticles.jsx', pagina: 'fonaments', estat: 'obsolet', substitut: 'UniversalCard + GraellaTargetes' });
REGISTRE.push({ nom: 'LlistaArticles', fitxer: 'PedraSeca/organismes/LlistaArticles.jsx', pagina: 'fonaments', estat: 'obsolet', substitut: 'UniversalCard + GraellaTargetes' });
REGISTRE.push({ nom: 'SeccionsCategoria', fitxer: 'PedraSeca/organismes/SeccionsCategoria.jsx', pagina: 'navegacio', estat: 'viu' });
REGISTRE.push({ nom: 'SelectorCategoria', fitxer: 'PedraSeca/organismes/SeccionsCategoria.jsx', pagina: 'navegacio', estat: 'viu' });
REGISTRE.push({ nom: 'OrdenaCategories', fitxer: 'PedraSeca/organismes/SeccionsCategoria.jsx', pagina: 'navegacio', estat: 'viu' });
REGISTRE.push({ nom: 'LiniesColleccio', fitxer: 'PedraSeca/organismes/LiniesColleccio.jsx', pagina: 'fonaments', estat: 'viu' });
REGISTRE.push({ nom: 'BarraResum', fitxer: 'PedraSeca/organismes/BarraResum.jsx', pagina: 'fonaments', estat: 'viu' });
REGISTRE.push({ nom: 'TargetesColleccions', fitxer: 'PedraSeca/organismes/TargetesColleccions.jsx', pagina: 'fonaments', estat: 'viu' });
REGISTRE.push({ nom: 'AfegitRapid', fitxer: 'PedraSeca/organismes/AfegitRapid.jsx', pagina: 'formularis', estat: 'viu' });
REGISTRE.push({ nom: 'DetallArticle', fitxer: 'PedraSeca/organismes/DetallArticle.jsx', pagina: 'superposicions', estat: 'viu' });
REGISTRE.push({ nom: 'MarcColumna', fitxer: 'PedraSeca/organismes/MarcColumna.jsx', pagina: 'estructura', estat: 'viu' });
/* Les columnes i la pantalla viuen a src/apps/comu/esquelet/, fora de PedraSeca. Els dos vestits
   pinten les tres columnes de veres; la pantalla (ClosaAplicacio) no s'imbrica dins del catàleg,
   que ja és una AppGridShell, i la prova EsqueletCatalegColleccio.test.jsx la munta sencera. */
REGISTRE.push({ nom: 'EsqueletCatalegColleccio', fitxer: 'apps/comu/esquelet/EsqueletCatalegColleccio.jsx', pagina: 'estructura', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'ColumnaCataleg', fitxer: 'apps/comu/esquelet/ColumnaCataleg.jsx', pagina: 'estructura', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'ColumnaColleccio', fitxer: 'apps/comu/esquelet/ColumnaColleccio.jsx', pagina: 'estructura', estat: 'viu', fora: true });
REGISTRE.push({ nom: 'ColumnaColleccions', fitxer: 'apps/comu/esquelet/ColumnaColleccions.jsx', pagina: 'estructura', estat: 'viu', fora: true });
/* P5 · Onada 4 (PRD «Control amb targetes il·lustrades de doble acció», aprovat pel Mestre el
   261003, amb l'ESMENA 261003 22:34) · les portes d'UniversalCard, al final del cos de la
   targeta estàndard. L'índex de PedraSeca no l'exporta: la munta la targeta. Espècimen:
   EspecimenUniversalCard (fonaments/universalcard). */
REGISTRE.push({ nom: 'PortesTargeta', fitxer: 'PedraSeca/organismes/PortesTargeta.jsx', pagina: 'fonaments', estat: 'viu' });
/* Ordre del Mestre, 261004 (prompt 261004_0515; D-A del xat de les 06:38) · front «nucli».
   GraellaTargetes: el contenidor de les UniversalCard de les llistes de les apps (graella o
   columna, amb seccions). PaginaApp: la porta permesa de la Pàgina Universal per a les apps
   (PageFrame sense traductor ni telemetria). Espècimens: EspecimenGraellaTargetes
   (fonaments/graella-targetes) i EspecimenPaginaApp (estructura/pagina-app). */
REGISTRE.push({ nom: 'GraellaTargetes', fitxer: 'PedraSeca/organismes/GraellaTargetes.jsx', pagina: 'fonaments', estat: 'viu' });
REGISTRE.push({ nom: 'PaginaApp', fitxer: 'PedraSeca/organismes/PaginaApp.jsx', pagina: 'estructura', estat: 'viu' });
/* D-D (ordre del Mestre, 261004) · El selector de fitxers de Pedra Seca: CampText tipus="file"
   hi delega. Espècimen: EspecimenCamp (formularis/camp). */
REGISTRE.push({ nom: 'CampFitxer', fitxer: 'PedraSeca/organismes/formulari.jsx', pagina: 'formularis', estat: 'viu' });
