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
export { ControlContrasenya } from './atoms/ControlContrasenya.jsx';
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
/* Ordre del Mestre, 261004 (prompt 261004_0515; D-A) · la graella de targetes de les
   llistes de les apps i la porta permesa de la Pàgina Universal per a les apps
   (PageFrame sense traductor ni telemetria). */
export { GraellaTargetes } from './organismes/GraellaTargetes.jsx';
export { PaginaApp } from './organismes/PaginaApp.jsx';
export { UniversalIndicatorCard } from './organismes/UniversalIndicatorCard.jsx';
export { Dialeg } from './organismes/Dialeg.jsx';
/* Ordre del Mestre, 261001 · un bloc a tota la caixa de l'App (el Calendari). */
export { PantallaCompleta, BotoPantallaCompleta } from './organismes/PantallaCompleta.jsx';
export { usePantallaCompleta } from './hooks/usePantallaCompleta.js';
export { Taula } from './organismes/Taula.jsx';
/* T40 (ordre del Mestre, 260928) · el mes compartit Consola–editor i la pastilla de data. */
export { NavegacioMes, GraellaMes } from './organismes/CalendariMes.jsx';
/* T6-T8 (ordre del Mestre, 260930) · el mes amb esdeveniments: l'Agenda del Mur i el Calendari de la Consola. */
export { CalendariEsdeveniments } from './organismes/CalendariEsdeveniments.jsx';
/* T10 (ordre del Mestre, 261001) · les vistes Setmana i Mes a l'estil Google Calendar (esquelet, maqueta). */
export { VistaSetmana } from './organismes/VistaSetmana.jsx';
export { VistaMes } from './organismes/VistaMes.jsx';
export { NavegacioPeriode } from './organismes/NavegacioPeriode.jsx';
/* Fase visual (prompt 261001_0445) · les vistes Agenda i Any (maqueta). */
export { VistaAgenda } from './organismes/VistaAgenda.jsx';
export { VistaAny } from './organismes/VistaAny.jsx';
export { SelectorDataHora } from './organismes/SelectorDataHora.jsx';
export { Accordion, AccordionItem } from './organismes/Accordion.jsx';
export { Pestanyes } from './organismes/Pestanyes.jsx';
export { UniversalSearch } from './organismes/UniversalSearch.jsx';
export { ResultatCerca } from './organismes/ResultatCerca.jsx';
export * from './organismes/formulari.jsx';
export * from './organismes/navegacio.jsx';
export { DialegConfirmacio } from './organismes/Dialeg.jsx';
export { GrupAvatars } from './atoms/Avatar.jsx';

// ── PECES DE LES APPS (Fase 0 del Bar i de Salut; estils a pecesApps.css) ──
export { Rajola, inicialsDe } from './molecules/Rajola.jsx';
export { TeclatNumeric, seguentValor } from './organismes/TeclatNumeric.jsx';
export { LiniaDelTemps } from './organismes/LiniaDelTemps.jsx';
export { Histograma, nivellHistograma } from './organismes/Histograma.jsx';

// ── ESQUELET DE CATÀLEG I COL·LECCIÓ (ordre del Mestre, 261002: sinergies T4/T8;
//    un sol esquelet per al TPV del bar i La Compra; estils a catalegColleccio.css) ──
/* Ordre del Mestre, 261004 · GraellaArticles i LlistaArticles són obsoletes per a codi
   nou (UniversalCard + GraellaTargetes). Salut i el Bar encara les fan servir: no s'esborren. */
export { GraellaArticles } from './organismes/GraellaArticles.jsx';
export { LlistaArticles } from './organismes/LlistaArticles.jsx';
export { SeccionsCategoria, SelectorCategoria, OrdenaCategories } from './organismes/SeccionsCategoria.jsx';
export { LiniesColleccio } from './organismes/LiniesColleccio.jsx';
export { AfegitRapid } from './organismes/AfegitRapid.jsx';
export { DetallArticle } from './organismes/DetallArticle.jsx';
export { BarraResum } from './organismes/BarraResum.jsx';
export { TargetesColleccions } from './organismes/TargetesColleccions.jsx';
export { MarcColumna } from './organismes/MarcColumna.jsx';
export {
  ESTATS_ARTICLE, ESTATS_LINIA, TEXTOS_ESTAT_LINIA, agrupaPerCategoria, categoriesEnOrdre, categoriesVisibles,
  estatLinia, filtraSuggeriments, mouCategoria, normalitzaText
} from './organismes/articles.js';

// ── TPV UNIVERSAL (ordre del Mestre, 261006: prompt 261006_1215 i skill
//    sdp-clon-loiverse; l'estructura de Loyverse per al Bar i per a la Llista de
//    la Compra o el Rebost; estils a tpv.css) ──
export { UniversalTPV } from './organismes/UniversalTPV.jsx';

// ── ICONES D'AL·LÈRGENS (ordre del Mestre, 261006: «vital per a la Carta
//    Digital i el TPV»; els dibuixos del Mestre viatgen dins del paquet, sense
//    xarxa; estils a alergens.css) ──
export { IconesAlergens } from './molecules/IconesAlergens.jsx';
