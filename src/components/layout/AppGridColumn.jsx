import { useContext } from 'react';
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { AppGridContext, TextosDeLaColumna } from './contextDeLaGraella.js';

/* Ordre d'usabilitat del Mestre (30-10-2026) · El nom accessible del botó de
   la icona: un altre que el del [|<] («Replegar …»), perquè cada botó tinga
   el seu i cap consulta per nom no en trobe dos. {nom} és el títol. La
   traducció (nav.plegaColumna, a les cinc llengües) la posa qui munta les
   columnes amb este context: AppGridColumn no pot importar el traductor
   (UIContext), perquè les apps compilades com a mòdul el durien dins del seu
   cos (guardesDelModul.test.js). Sense proveïdor (el Xat, les apps, el
   catàleg), el valencià. L'UniversalWorkspace el proveïx.
   Corrector del Gauntlet (30-10-2026) · El mateix context porta també el nom
   del [|<] (replegaColumna), el del botó de dalt del rail (expandeixColumna)
   i el títol de l'acordió (acordioColumna): traduir només la icona deixava
   la mateixa capçalera en dos llengües. Sense proveïdor, els textos de
   sempre.
   Corrector del Gauntlet f4 (30-10-2026) · El context viu a
   contextDeLaGraella.js (la closca hi llig el nom dels separadors); ací es
   reexporta, el mateix objecte. */
export { TextosDeLaColumna };
const PLEGA_COLUMNA = 'Plegar la columna {nom}';
const REPLEGA_COLUMNA = 'Replegar {nom}';
const EXPANDEIX_COLUMNA = 'Expandir {nom}';
const ACORDIO_COLUMNA = 'Plegar o desplegar {nom}';
/* El títol al lloc de {nom}. Amb una funció, perquè un «$» del títol no
   es llija com a patró de substitució. */
const posaNom = (plantilla, titol) => plantilla.replace('{nom}', () => String(titol ?? ''));

/**
 * Capçalera única de columna.
 * Ordre visual (obert): [ esquerra / titol ] … [ accions ] [ replegar ]
 * Ordre d'usabilitat del Mestre (30-10-2026) · Amb `icona` i `onReplega`, la
 * icona de l'esquerra és un botó germà del [|<] que fa el mateix
 * (onReplega): plegada, el botó de dalt del rail porta la mateixa icona al
 * mateix lloc, i la columna es plega i es desplega sense moure el ratolí. Va
 * on es veu el [|<]: en «estret» la navegació no en porta (d-desktop-only) i
 * la icona hi queda de dibuix; amb `esquerra` o `startActions` davant, la
 * icona ja no és la de l'esquerra i tampoc. El focus en desplegar torna a
 * este botó (collapseBtnRef), l'equivalent del de dalt del rail.
 * L'acordió (`plegable`) només porta la paraula i el chevron (^ obert, v
 * plegat), apegat a la paraula; sense acordió, el títol és text fix.
 * `replegaTotaCapcalera` (tota la fila és el botó) queda per al Xat:
 * l'UniversalWorkspace ja no la passa.
 * Collapsed: [ expandir ] + accions + fills (vertical). Els fills són el rail
 * d'icones de la columna plegada: l'expandir i la roda queden sempre a dalt.
 * El botó [|<] és la parella PanelLeftClose (replegar) / PanelLeftOpen
 * (expandir), prompt 261014_0400 (ordre del Mestre); qui passa `icona` al rail
 * plegat (el Xat, amb la roda) la conserva.
 * Ordre del Mestre (30-10-2026) · Els rails plegats de l'UniversalWorkspace
 * passen sempre `icona`: la carpeta a la navegació (CARPETES) i la del
 * document a la llista (NOTES; al Bloc, NotebookPen). PanelLeftOpen queda
 * com a reserva per a qui no en passa cap.
 */
export default function AppGridColumn({
  titol,
  icona: Icona = null,
  accions = [],
  startActions = [],
  endActions = [],
  esquerra = null, // node opcional a l'esquerra (ex. botó "Tot", lupa)
  plegable = false,
  obert = true,
  onPlega = null,
  onReplega = null,
  replegaTotaCapcalera = false,
  etiquetaReplega = null,
  controls = undefined,
  /* P6 (ordre del Mestre, 261003) · En «mitja» i «estret», el Replegar és
     el desplegador de la llista: es veu també en estret i declara
     aria-expanded i aria-controls (`controls`). Sense, el d'abans. */
  replegaCompacte = false,
  /* P6 · En el rail d'estret, l'Expandir obri la columna de la llista
     (tancada): es declara obridor de la closca (data-obri-columna) perquè la
     guarda del focus hi torne quan el panell es tanca. */
  expandObridor = false,
  variant = null,
  esDark = false,
  collapseBtnRef = null,
  expandBtnRef = null,
  children,
}) {
  const esAcordio = variant === 'accordion';
  /* Ordre d'usabilitat (30-10-2026) · El chevron de l'acordió és ^ obert i v
     plegat: el mateix ChevronDown, girat mig volt quan és obert
     (.app-grid-col-header__chevron--obert, modules.css). Abans, plegat era >. */
  const Chevron = ChevronDown;
  const graella = useContext(AppGridContext);
  const textos = useContext(TextosDeLaColumna);
  /* La icona és el botó germà del [|<] allà on el [|<] es veu: fora d'«estret»
     sempre, i en «estret» quan el [|<] hi és visible (replegaCompacte). Fora
     de la closca (el catàleg), també. Sense res davant: ha de ser la de
     l'esquerra. */
  const replegaVisible = replegaCompacte || graella?.mida !== 'estret';
  const iconaReplega = Boolean(Icona && onReplega && replegaVisible && !esquerra && startActions.length === 0);
  /* El [|<] (i la icona germana) declara la columna que plega quan la closca
     la nomena (`controls`): abans només amb replegaCompacte, o amb tota la
     fila (replegaTotaCapcalera, que l'UniversalWorkspace ja no passa). */
  const declaraControl = replegaCompacte || Boolean(controls);
  const etiquetaDeLaIcona = posaNom(textos?.plegaColumna || PLEGA_COLUMNA, titol);
  const etiquetaDelReplega = posaNom(textos?.replegaColumna || REPLEGA_COLUMNA, titol);
  const etiquetaDelExpandir = posaNom(textos?.expandeixColumna || EXPANDEIX_COLUMNA, titol);
  const titolDeLAcordio = posaNom(textos?.acordioColumna || ACORDIO_COLUMNA, titol);

  const renderActions = (actionsList) => actionsList.map((a) => {
    let cls =
      a.variant === 'text'
        ? 'app-grid-col-header__accio-text'
        : a.variant === 'primary'
          ? 'app-grid-col-header__accio'
          : 'app-grid-col-header__accio-icon';
    if (a.className) cls = `${cls} ${a.className}`;

    /* P6 · Una acció que obri una columna de la closca (l'obridor de la
       navegació del rail de la llista) en declara el control i l'estat, i
       es marca obridor (data-obri-columna) per a la guarda del focus. */
    return (
      <button
        key={a.id}
        type="button"
        className={cls}
        onClick={() => a.onAcciona?.()}
        disabled={a.desactivat || (a.onAcciona == null && a.variant !== 'text')}
        aria-label={a.etiqueta}
        title={a.etiqueta}
        aria-pressed={a.pressed}
        aria-controls={a.controls}
        aria-expanded={a.expanded}
        data-obri-columna={a.obridor ? '' : undefined}
      >
        {a.icona ? <a.icona size={a.iconSize || 24} aria-hidden focusable="false" /> : null}
        {a.label ? <span>{a.label}</span> : null}
      </button>
    );
  });

  const resolvedEndActions = endActions.length > 0 ? endActions : accions;

  if (variant === 'collapsed') {
    const CollapsedIcon = Icona || PanelLeftOpen;
    /* Prompt 261014_0400 (ordre del Mestre), front B · Amb una sola acció (la
       roda de Disseny, Wiki i Perfil, o la lupa de la llista en «ample»),
       eixa acció ocupa la fila 2, com a la columna oberta (AppGridShell.css).
       Amb dues (el Bloc; l'obridor de la navegació i la lupa en «mitja» i
       «estret»), oberta comparteixen la fila 2 i plegada s'apilen: la fila 2
       per a la primera feia baixar la segona 10px. Sense :has(), la marca. */
    const unaAccio = startActions.length + resolvedEndActions.length === 1;
    return (
      <div className={['app-grid-col-header', 'app-grid-col-header--collapsed', unaAccio ? 'app-grid-col-header--una-accio' : '', esDark === 'intens' ? 'app-grid-col-header--dark-intens' : esDark ? 'app-grid-col-header--dark' : ''].filter(Boolean).join(' ')}>
        {/* Fila superior del rail: el mateix botó és la fila, amb l'alçada de
            la capçalera oberta (var(--sdp-alt-accio)) i la icona centrada. La
            geometria viu a AppGridShell.css (.app-grid-col-header__rail-top),
            no en línia, i el DOM queda pla: expandir, accions i rail són
            germans (UniversalWorkspace.test.jsx ho comprova). */}
        <button
          ref={expandBtnRef}
          type="button"
          className="btn-icon app-grid-col-header__rail-top"
          onClick={onReplega}
          aria-expanded={controls ? false : undefined}
          aria-controls={controls}
          data-obri-columna={expandObridor && controls ? '' : undefined}
          aria-label={etiquetaDelExpandir}
          title={etiquetaDelExpandir}
        >
          <CollapsedIcon size={24} aria-hidden focusable="false" />
        </button>
        {renderActions(startActions)}
        {renderActions(resolvedEndActions)}
        {children}
      </div>
    );
  }

  // Opt-in per a capçaleres amb una sola acció. Les barres amb accions
  // independents conserven botons germans; mai els imbricarem en un botó.
  if (replegaTotaCapcalera && onReplega && !plegable && !esquerra &&
      startActions.length === 0 && resolvedEndActions.length === 0 && children == null) {
    const etiqueta = etiquetaReplega || etiquetaDelReplega;
    return (
      <button
        ref={collapseBtnRef}
        type="button"
        className={esDark === 'intens'
          ? 'app-grid-col-header app-grid-col-header--replegable app-grid-col-header--dark-intens'
          : esDark ? 'app-grid-col-header app-grid-col-header--replegable app-grid-col-header--dark' : 'app-grid-col-header app-grid-col-header--replegable'}
        onClick={onReplega}
        aria-label={etiqueta}
        aria-expanded={true}
        aria-controls={controls}
        title={etiqueta}
      >
        <span className="app-grid-col-header__plec">
          {Icona ? <Icona size={24} aria-hidden focusable="false" /> : null}
          {titol ? <span className="app-grid-col-header__titol">{titol}</span> : null}
        </span>
        <span className="app-grid-col-header__accio-icon" aria-hidden="true">
          <PanelLeftClose size={24} focusable="false" />
        </span>
      </button>
    );
  }

  return (
    <div className={`app-grid-col-header${esAcordio ? ' app-grid-col-header--accordion' : ''}${esDark === 'intens' ? ' app-grid-col-header--dark-intens' : esDark ? ' app-grid-col-header--dark' : ''}`}>
      {esquerra}
      {startActions.length > 0 && (
        <div className="app-grid-col-header__accions">
          {renderActions(startActions)}
        </div>
      )}

      {/* Ordre d'usabilitat (30-10-2026) · El grup de l'esquerra: la icona
          (botó germà del [|<] o dibuix) i, al costat, el títol fix o l'acordió.
          L'acordió ja no porta la icona: només la paraula i el chevron, junts
          dins de .app-grid-col-header__acordio (AppGridShell.css), perquè el
          gap del botó (modules.css) no els separe. La icona i el títol cauen
          on queien (la icona a la vora de 16 px, el títol a 56). */}
      <div className="app-grid-col-header__plec app-grid-col-header__plec--fix">
        {Icona && iconaReplega ? (
          <button
            ref={collapseBtnRef}
            type="button"
            className="app-grid-col-header__icona"
            onClick={onReplega}
            aria-label={etiquetaDeLaIcona}
            title={etiquetaDeLaIcona}
            aria-expanded={declaraControl ? true : undefined}
            aria-controls={declaraControl ? controls : undefined}
          >
            <Icona size={24} aria-hidden focusable="false" />
          </button>
        ) : Icona ? <Icona size={24} aria-hidden focusable="false" /> : null}
        {plegable ? (
          <button
            ref={onReplega ? null : collapseBtnRef}
            type="button"
            className="sdp-workspace-nav-item app-grid-col-header__plegable"
            onClick={onPlega}
            aria-expanded={obert}
            title={titolDeLAcordio}
          >
            <span className="app-grid-col-header__acordio">
              {titol ? <span className="sdp-workspace-nav-item__label">{titol}</span> : null}
              <span className={obert ? 'app-grid-col-header__chevron app-grid-col-header__chevron--obert' : 'app-grid-col-header__chevron'}>
                <Chevron size={24} aria-hidden focusable="false" />
              </span>
            </span>
          </button>
        ) : titol ? <span className="app-grid-col-header__titol">{titol}</span> : null}
      </div>

      <div className="app-grid-col-header__accions">
        {renderActions(resolvedEndActions)}
        {children}
        {onReplega ? (
          <button
            ref={iconaReplega ? null : collapseBtnRef}
            type="button"
            className={replegaCompacte ? 'app-grid-col-header__accio-icon' : 'app-grid-col-header__accio-icon d-desktop-only'}
            onClick={onReplega}
            aria-label={etiquetaDelReplega}
            title={etiquetaDelReplega}
            aria-expanded={declaraControl ? true : undefined}
            aria-controls={declaraControl ? controls : undefined}
          >
            <PanelLeftClose size={24} aria-hidden focusable="false" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
