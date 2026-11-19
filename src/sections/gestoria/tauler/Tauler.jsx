/**
 * Tauler.jsx — el Tauler Central de la Gestoria i les seues pàgines.
 *
 * Ordre del Mestre, 261004 (onada 2, pas 1 del MAPA; principi 3 de la
 * Gestoria): el Tauler és fet de TargetaTauler (UniversalCard) en blocs:
 *   · VistaTauler · «La teua realitat» (Caixa real, Hisenda, Cobertura) i
 *     «Finances (últims 30 dies)» (Factures i vendes, Ingressos, Despeses,
 *     Rendiment);
 *   · VistaBancs · «Bancs i Tresoreria»: una targeta per compte i la de la
 *     conciliació;
 *   · VistaImpostos · les estimacions del 303 i del 130.
 * Tota targeta té la seua pàgina pròpia (PaginaTargeta, feta amb PaginaApp,
 * que porta la barra taronja amb la boina personal) i tota pàgina, la seua
 * targeta: la targeta i la pàgina lligen el mateix model
 * (nucli/targetesTauler.js).
 *
 * PortaTauler · la porta del tractor 'gestoria.tauler': sense la signatura
 * del Mestre, l'estat honest «Cal aprovar el tractor» i el camí al panell de
 * Tractors; amb ella, el selector dels extractes. Cap xifra es pinta fins que
 * la persona prem l'ull (a la targeta o a la boina de la pàgina).
 * Onada R24 (CODEX-R24-12) · El panell de Tractors només existix al servidor
 * de desenvolupament: fora de DEV, l'acció de l'avís és AccioAprovacio
 * (tractors/AprovacioEnLinia.jsx), que hi obri el diàleg d'aprovació amb la
 * fitxa sencera i signa en este navegador pel camí de sempre. En DEV, el botó
 * i les paraules de sempre.
 *
 * Panell ERP (ordre del Mestre, 261012):
 *   · LA VISTA COMPRIMIDA · el commutador «Targetes | Vista comprimida» de la
 *     captura de referència del Mestre. Les UniversalCards continuen sent la
 *     vista per defecte (regla d'or 1); la comprimida pinta cada bloc com una
 *     Taula densa amb el mateix model: cada fila obri la pàgina de la seua
 *     targeta, i la xifra la governa l'ull de la boina (cap ull per fila).
 *   · LA CAPÇALERA DE CONTEXT (ContextTrimestre) · el trimestre de les
 *     estimacions, que tria la persona amb «Hui ‹ ›» (NavegacioPeriode), el
 *     commutador i dues barres natives (Progres): el rellotge del termini,
 *     que és una data i es veu sempre, i la part de la caixa que caldria per
 *     a Hisenda, que és una xifra i només es pinta amb l'ull obert.
 *
 * Cabina d'Avió (ordre del Mestre, 13-10-2026, pla 261013_1405, front E).
 * Derogat EN PART el commutador de dues vistes de l'ordre del 261012: el del
 * Tauler en té tres, «Targetes | Cabina d’Avió | Vista comprimida»
 * (VISTES_TAULER), i Targetes continua sent la vista per defecte, amb les
 * UniversalCards i el seu art intactes (regla d'or 1). La Cabina és només
 * del Tauler: els Bancs i els Impostos es queden amb «Targetes | Vista
 * comprimida» (VISTES_PANELL), i quan la persona hi arriba amb la Cabina
 * triada, hi veuen la comprimida, la vista densa més pròxima
 * (vistaDelModul). La Cabina viu a CabinaAvio.jsx i la munta la closca
 * (ShellGestoria): este fitxer no l'importa, perquè ella en fa servir peces
 * (Xifra, XifraDeFila, AvisosComptes) i perquè entraria al graf de
 * l'Històric. Hisenda sobre la caixa: amb el total de GES-A5 (13-10-2026,
 * la part a pagar de cada model), el «res a pagar» ja no és el net del 303 i
 * del 130, sinó que cap dels dos surt a pagar.
 *
 * Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punts 2 i 5): la Cabina
 * d'Avió es diu «Quadre de comandament» (només el nom visible, VISTES_TAULER), i
 * les pàgines de la closca porten a la barra i al peu les accions de sempre,
 * inoperatives i amb el perquè (BlocTargetes amb `ambAccionsPrivades` i
 * PaginaTargeta amb `onAvis`). Sense les props, el DOM de sempre: l'Històric no
 * canvia cap píxel.
 */
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { Construction, EyeOff, FileSearch } from 'lucide-react';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { Carregant, EstatBuit, Progres } from '../../../components/PedraSeca/atoms/estats.jsx';
import { Insignia } from '../../../components/PedraSeca/atoms/Insignia.jsx';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { PillToggle } from '../../../components/PedraSeca/molecules/PillToggle.jsx';
import { Camp, CampText } from '../../../components/PedraSeca/organismes/formulari.jsx';
import { NavegacioPeriode } from '../../../components/PedraSeca/organismes/NavegacioPeriode.jsx';
import { PaginaApp } from '../../../components/PedraSeca/organismes/PaginaApp.jsx';
import { Taula } from '../../../components/PedraSeca/organismes/Taula.jsx';
import { AccioAprovacio, RevocaAprovacio, onSAprova } from '../../tractors/AprovacioEnLinia.jsx';
import { tg, tf, localitzaOpcionsGestoria } from '../i18nGestoria.js';
import { LLEGENDA_ESTIMACIO } from '../impostos/nucli/impostos.js';
import { TRACTOR_TAULER } from '../tractors.js';
import { BLOCS_TAULER, etiquetaXifra, textAmagat, textXifra } from './nucli/targetesTauler.js';
import { ACCEPTA_TAULER } from './nucli/tractorTauler.js';
import { TargetaTauler, barraPrivada } from './TargetaTauler.jsx';
import { adoptaFullDiferit } from '../../../config/fullDiferit.js';
import cssDiferitGestoria from '../../../css/diferit-gestoria.css?inline';
const adoptaEstilsDiferits = (el) => { adoptaFullDiferit(el, 'gestoria', cssDiferitGestoria); };

/* Com diu la porta l'estat del tractor, quan no està aprovat. */
const ESTATS_TRACTOR = Object.freeze({
  pendent: 'encara no està aprovat',
  caducat: 'té l’aprovació caducada',
  revocat: 'té l’aprovació revocada',
  'empremta-divergent': 'ha canviat des que el vas aprovar',
  incomplet: 'no té tots els fitxers declarats',
  error: 'no s’ha pogut comprovar'
});

/** La xifra d'una pàgina: el text, o «Import amagat» mentre l'ull està tancat. */
export function Xifra({ xifra, visible = false, idioma = 'ca' }) {
  if (!xifra) return <span ref={adoptaEstilsDiferits}>{tg(idioma, 'Sense dades')}</span>;
  if (!visible) {
    return (
      <span ref={adoptaEstilsDiferits} className="sdp-gestoria-tauler__amagat">
        <EyeOff size={20} aria-hidden="true" focusable="false" />
        <span>{tg(idioma, textAmagat(xifra))}</span>
      </span>
    );
  }
  return <span ref={adoptaEstilsDiferits}>{textXifra(xifra)}</span>;
}

/**
 * Les tres vistes del Tauler. Derogat EN PART el commutador de dues de
 * l'ordre del 261012 («Universal Cards | Vista Comprimida», la captura del
 * Mestre) per l'ordre del Mestre, 13-10-2026 (pla 261013_1405, front E): la
 * Cabina d'Avió va entre les dues, i Targetes continua sent la primera i la de
 * per defecte.
 * Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 2): la Cabina d'Avió
 * es diu «Quadre de comandament». Només canvia el nom que es veu: el valor
 * intern continua sent 'cabina' (vistaDelModul, VISTES_DENSES i la vista
 * triada que es conserva entre mòduls). La «Plantilla Gestoria» (punt 3) no és
 * una vista més: és l'última secció del Quadre (CabinaAvio.jsx).
 */
export const VISTES_TAULER = Object.freeze([
  Object.freeze({ valor: 'targetes', text: 'Targetes' }),
  Object.freeze({ valor: 'cabina', text: 'Quadre de comandament' }),
  Object.freeze({ valor: 'comprimida', text: 'Vista comprimida' })
]);

/** Les dues vistes dels Bancs i dels Impostos (ordre del Mestre, 13-10-2026: el Quadre de comandament és només del Tauler). */
export const VISTES_PANELL = Object.freeze([VISTES_TAULER[0], VISTES_TAULER[2]]);

/* Les vistes denses: quan un mòdul no oferix la triada, en mostra una altra de densa abans que les targetes. */
const VISTES_DENSES = Object.freeze(['cabina', 'comprimida']);

/**
 * La vista que pinta un mòdul quan la persona n'ha triat una: la mateixa si
 * el mòdul l'oferix; si és una vista densa que no oferix (la Cabina als Bancs
 * o als Impostos), la primera densa que sí que oferix; i, si no, la primera
 * de les seues. Pura: no canvia la vista triada, que es conserva per a quan
 * la persona torne al Tauler.
 * @param {string} vista la triada
 * @param {ReadonlyArray<{ valor: string, text: string }>} [vistes] les del mòdul
 * @returns {string}
 */
export function vistaDelModul(vista, vistes = VISTES_PANELL) {
  const valors = (Array.isArray(vistes) ? vistes : []).map((v) => v?.valor).filter(Boolean);
  if (valors.includes(vista)) return vista;
  const densa = VISTES_DENSES.includes(vista) ? VISTES_DENSES.find((v) => valors.includes(v)) : undefined;
  return densa ?? valors[0] ?? VISTES_TAULER[0].valor;
}

/* Les etiquetes del model (className de les targetes) en el vocabulari d'Insignia. */
const TIPUS_INSIGNIA = Object.freeze({ 'sdp-badge-system': 'sistema', 'sdp-badge-category': 'categoria', 'sdp-badge-tag': 'etiqueta' });

/**
 * La xifra d'una fila de la vista comprimida (i d'un instrument de la Cabina
 * d'Avió): amb la unitat que el text sol no diu (els mesos, els dies, les
 * vegades), o amagada. Sense xifra, el perquè.
 */
export function XifraDeFila({ targeta, visible, idioma = 'ca' }) {
  if (!targeta.xifra) return <span ref={adoptaEstilsDiferits} className="sdp-gestoria-comprimida__sense">{targeta.senseXifra}</span>;
  if (!visible) return <Xifra xifra={targeta.xifra} visible={false} idioma={idioma} />;
  return <span ref={adoptaEstilsDiferits}>{etiquetaXifra(targeta.xifra)}</span>;
}

/**
 * La vista comprimida d'un bloc: una Taula densa amb una fila per targeta.
 * El títol de cada fila és el botó que obri la pàgina de la targeta (tota
 * targeta té pàgina); la xifra, amagada fins que es prem l'ull de la boina.
 * La regió de la Taula porta un nom propi («Taula · …»): la secció del bloc ja
 * es diu com el bloc, i dues fites amb el mateix nom no es distingixen.
 */
export function TaulaComprimida({ titol, targetes, visible = false, onObri, idioma = 'ca' }) {
  return (
    <Taula titol={tf(idioma, 'taulaBloc', titol)} densa className="sdp-gestoria-comprimida">
      <thead ref={adoptaEstilsDiferits}>
        <tr><th scope="col">{tg(idioma, 'Concepte')}</th><th scope="col">{tg(idioma, 'Xifra')}</th></tr>
      </thead>
      <tbody>
        {targetes.map((t) => (
          <tr ref={adoptaEstilsDiferits} key={t.id}>
            <th scope="row">
              <button type="button" className="sdp-gestoria-comprimida__obri" onClick={() => onObri?.(t.id)}>{t.titol}</button>
              <span className="sdp-gestoria-comprimida__subtitol">{t.subtitol}</span>
              {/* Les etiquetes davall del concepte i no en una columna pròpia: en un telèfon, dues columnes caben senceres. */}
              <span className="sdp-gestoria-comprimida__etiquetes">
                {t.etiquetes.map((e) => <Insignia key={e.text} tipus={TIPUS_INSIGNIA[e.className] ?? 'etiqueta'}>{e.text}</Insignia>)}
              </span>
            </th>
            <td className={t.xifra ? 'sdp-num' : 'sdp-gestoria-comprimida__motiu'}><XifraDeFila targeta={t} visible={visible} idioma={idioma} /></td>
          </tr>
        ))}
      </tbody>
    </Taula>
  );
}

/**
 * Un bloc del Tauler: el títol i la graella de targetes o, amb la vista
 * comprimida, la seua Taula. La clau de cada targeta porta l'ull de la closca
 * i la `generacio` de la lectura: quan canvia l'una o l'altra, la targeta
 * torna a nàixer amb l'ull de la closca, i l'ull que s'havia obert en una
 * targeta no passa a la lectura següent.
 */
export function BlocTargetes({
  titol, targetes, titular, pastilla, visible, generacio = 0, vista = 'targetes', onObri, onAvis, ambAccionsPrivades = false, idioma = 'ca'
}) {
  const id = useId();
  if (!targetes.length) return null;
  return (
    <section ref={adoptaEstilsDiferits} className="sdp-gestoria-tauler__bloc" aria-labelledby={id}>
      <h2 id={id} className="sdp-gestoria-tauler__titol">{titol}</h2>
      {vista === 'comprimida' ? (
        <TaulaComprimida titol={titol} targetes={targetes} visible={visible} onObri={onObri} idioma={idioma} />
      ) : (
        <div ref={adoptaEstilsDiferits} className="sdp-card-grid sdp-gestoria-tauler__graella">
          {targetes.map((t) => (
            <TargetaTauler key={`${t.id}-${visible ? 'mostrades' : 'amagades'}-${generacio}`} targeta={t} titular={titular} pastilla={pastilla}
              visibleInicial={visible} onObri={onObri} onAvis={onAvis} ambAccionsPrivades={ambAccionsPrivades} idioma={idioma} />
          ))}
        </div>
      )}
    </section>
  );
}

const ETIQUETES_TRIMESTRE = Object.freeze({ anterior: 'Trimestre anterior', hui: 'Hui', seguent: 'Trimestre següent' });

/* La part de la caixa que caldria per a Hisenda: amb l'ull tancat, només si no hi ha res a mesurar. */
function HisendaSobreCaixa({ liquidacio, visible, idioma = 'ca' }) {
  if (liquidacio.estat === 'sense') return <p ref={adoptaEstilsDiferits} className="sdp-gestoria-context__nota">{liquidacio.motiu}</p>;
  if (!visible) {
    return (
      <p ref={adoptaEstilsDiferits} className="sdp-gestoria-tauler__amagat">
        <EyeOff size={20} aria-hidden="true" focusable="false" />
        <span>{tg(idioma, 'Xifra amagada')}</span>
      </p>
    );
  }
  const llegendaText = tg(idioma, LLEGENDA_ESTIMACIO);
  const llegenda = <p ref={adoptaEstilsDiferits} className="sdp-gestoria-context__nota">{liquidacio.completa ? llegendaText : `${tg(idioma, 'Estimació incompleta')}. ${llegendaText}`}</p>;
  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, fronts I i E; GES-A5): el total ja no és el net del 303 i
     del 130 de l'acord del 261012, sinó la part a pagar de cada model; «res» vol dir que cap dels dos en surt. */
  if (liquidacio.estat === 'res') {
    /* Revisió adversarial 13-10-2026, troballa FIN-3: amb un model sense estimació (`desconegut`), només es diu
       el que se sap de l'altre, mai que cap dels dos surt a pagar; l'estimació és incompleta i la llegenda ho diu. */
    const { desconegut } = liquidacio;
    const conegut = desconegut === '303' ? '130' : desconegut === '130' ? '303' : null;
    return (
      <>
        <p ref={adoptaEstilsDiferits} className="sdp-gestoria-context__nota">
          {conegut
            ? `El ${conegut} d’este trimestre no surt a pagar, i del ${desconegut} encara no hi ha estimació: el detall de cada model és a la targeta Hisenda.`
            : tg(idioma, 'Ni el 303 ni el 130 d’este trimestre surten a pagar: el detall de cada model és a la targeta Hisenda.')}
        </p>
        {llegenda}
      </>
    );
  }
  if (liquidacio.estat === 'descobert') {
    return (
      <>
        <p ref={adoptaEstilsDiferits} className="sdp-gestoria-context__nota">{tg(idioma, 'La caixa real és zero o en descobert: no en queda cap part per a l’estimació de Hisenda.')}</p>
        {llegenda}
      </>
    );
  }
  return (
    <>
      <Progres etiqueta={tg(idioma, 'La part de la caixa real que caldria per a Hisenda')} valor={liquidacio.percentatge} max={100} />
      {liquidacio.supera ? <p ref={adoptaEstilsDiferits} className="sdp-gestoria-context__nota">{tg(idioma, 'L’estimació supera la caixa real.')}</p> : null}
      {llegenda}
    </>
  );
}

/**
 * La capçalera de context del panell: el trimestre de les estimacions i el
 * commutador de vista; amb `periode` (Tauler i Impostos), també les fletxes
 * del trimestre i les dues barres de la liquidació. Sense `periode` (Bancs, on
 * el trimestre no canvia res), només el commutador. El títol del trimestre és
 * un paràgraf, no un encapçalament: l'Índex no el recull.
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front E): `vistes` són les
 * opcions del commutador del mòdul. Per defecte, les dues dels Bancs i dels
 * Impostos (VISTES_PANELL); el Tauler hi passa VISTES_TAULER, amb la Cabina
 * d'Avió. L'opció premuda és la que el mòdul pinta (vistaDelModul).
 * @param {{ dades: object, visible?: boolean, vista: string, onCanviaVista: (vista: string) => void,
 *   vistes?: ReadonlyArray<{ valor: string, text: string }>,
 *   periode?: { onAnterior: () => void, onHui: () => void, onSeguent: () => void }|null }} p
 */
export function ContextTrimestre({ dades, visible = false, vista, onCanviaVista, vistes = VISTES_PANELL, periode = null, idioma = 'ca' }) {
  const premuda = vistaDelModul(vista, vistes);
  const vistesLoc = localitzaOpcionsGestoria(vistes, idioma);
  if (!periode) {
    return (
      <section ref={adoptaEstilsDiferits} className="sdp-gestoria-context" aria-label={tg(idioma, 'Context del panell')}>
        {/* La mateixa píndola que porta NavegacioPeriode al Tauler i a Impostos (.sdp-cal-vistes): el commutador no canvia d'aspecte entre mòduls. */}
        <PillToggle className="sdp-cal-vistes" opcions={vistesLoc} valor={premuda} onCanvi={onCanviaVista} etiqueta={tg(idioma, 'Vista del panell')} />
      </section>
    );
  }
  const { iva, rellotge, liquidacio } = dades;
  const titol = Number.isInteger(iva.t) ? `${iva.t}T ${iva.any}` : tg(idioma, 'Sense trimestre');
  const etiquetesTrim = idioma === 'ca'
    ? ETIQUETES_TRIMESTRE
    : { anterior: tg(idioma, ETIQUETES_TRIMESTRE.anterior), hui: tg(idioma, ETIQUETES_TRIMESTRE.hui), seguent: tg(idioma, ETIQUETES_TRIMESTRE.seguent) };
  return (
    <section ref={adoptaEstilsDiferits} className="sdp-gestoria-context" aria-label={tg(idioma, 'Context del panell')}>
      <NavegacioPeriode etiquetes={etiquetesTrim} titol={titol} onAnterior={periode.onAnterior} onHui={periode.onHui}
        onSeguent={periode.onSeguent} vista={premuda} onCanviaVista={onCanviaVista} vistes={vistesLoc} etiquetaVistes={tg(idioma, 'Vista del panell')} />
      <div className="sdp-gestoria-context__barres">
        <div className="sdp-gestoria-context__barra">
          <p className="sdp-gestoria-context__titol">{tg(idioma, 'El termini')}</p>
          {rellotge.valor == null ? null : <Progres etiqueta={rellotge.etiqueta} valor={rellotge.valor} max={rellotge.max} />}
          <p className="sdp-gestoria-context__nota">{rellotge.text}</p>
          {rellotge.obert ? <p ref={adoptaEstilsDiferits} className="sdp-gestoria-context__obert">{rellotge.obert}</p> : null}
          {/* Els terminis són [NO VERIFICAT] a impostos.js: la capçalera no els dona per segurs. */}
          {rellotge.fase === 'sense' ? null : <p ref={adoptaEstilsDiferits} className="sdp-gestoria-context__nota">{tg(idioma, 'Terminis orientatius: a verificar amb la gestoria.')}</p>}
        </div>
        <div className="sdp-gestoria-context__barra">
          <p className="sdp-gestoria-context__titol">{tg(idioma, 'Hisenda sobre la caixa real')}</p>
          <HisendaSobreCaixa liquidacio={liquidacio} visible={visible} idioma={idioma} />
        </div>
      </div>
    </section>
  );
}

/**
 * La porta del tractor del Tauler.
 * @param {{ tauler: object, onObreTractors: () => void, onOblida?: () => void }} p `tauler`: el de useTauler;
 *   `onOblida`: el que fa «Oblida les dades» (la closca hi tanca també l'ull); sense, tauler.oblida
 */
export function PortaTauler({ tauler, onObreTractors, onOblida, idioma = 'ca' }) {
  const { porta, fila, aprovat, llegint, error, lectura, generacio } = tauler;
  const refPorta = useRef(null);
  const focusPropi = useRef(null);
  const anterior = useRef({ generacio, llegint });
  const [anunci, setAnunci] = useState('');

  useLayoutEffect(() => {
    const focus = focusPropi.current;
    if (llegint && focus?.node.disabled) focus.desactivat = true;
    const canviDeLot = anterior.current.generacio !== generacio;
    const fiDeLectura = anterior.current.llegint && !llegint;
    if (canviDeLot || fiDeLectura) {
      if (!llegint && lectura && !error) setAnunci(tg(idioma, 'Lectura completada.'));
      if (focus && (!focus.node.isConnected || focus.node.disabled || focus.desactivat)) {
        const doc = focus.node.ownerDocument;
        // En un endoll Shadow DOM, activeElement del document és l'amfitrió.
        const esShadow = focus.arrel !== doc;
        const actiu = focus.arrel.activeElement;
        const tornaAlCos = esShadow
          ? !actiu && (doc.activeElement === focus.arrel.host || doc.activeElement === doc.body || !doc.activeElement)
          : actiu === doc.body;
        if (tornaAlCos) refPorta.current?.querySelector('button:not([disabled])')?.focus();
      }
    }
    anterior.current = { generacio, llegint };
  }, [generacio, llegint, lectura, error, idioma]);

  const recordaFocus = (event) => {
    focusPropi.current = { node: event.target, arrel: event.target.getRootNode(), desactivat: false };
  };
  const oblida = () => {
    setAnunci(tg(idioma, llegint ? 'Lectura cancel·lada. Les dades s’han oblidat.' : 'Les dades s’han oblidat.'));
    (onOblida ?? tauler.oblida)();
  };
  if (porta.carregant) return <Carregant etiqueta={tg(idioma, 'Llegint les aprovacions dels tractors…')} />;
  if (!aprovat) {
    const estat = tg(idioma, ESTATS_TRACTOR[fila?.estat] ?? ESTATS_TRACTOR.pendent);
    return (
      <Alerta to="avis" titol={tg(idioma, 'Cal aprovar el tractor')}
        accions={<AccioAprovacio porta={porta} id={TRACTOR_TAULER.id} onObreTractors={onObreTractors} idioma={idioma} />}>
        {tf(idioma, 'portaTauler', estat, onSAprova(idioma))}
        {porta.error ? ` ${porta.error}` : ''}
      </Alerta>
    );
  }
  return (
    <div className="sdp-gestoria-tauler__porta" ref={refPorta} onFocusCapture={recordaFocus}>
      <p ref={adoptaEstilsDiferits} role="status" aria-label={tg(idioma, 'Estat de la lectura')} aria-atomic="true" className="sdp-nomes-lector">{anunci}</p>
      <Camp key={tauler.generacio} etiqueta={tg(idioma, 'Tria els extractes del banc')}
        ajuda={tg(idioma, 'Norma 43 o el CSV de moviments i, si vols, la configuració de l’empresa (.json) per a la teua boina. Res es puja enlloc.')}>
        <CampText tipus="file" multiple accept={ACCEPTA_TAULER} disabled={llegint}
          onChange={(event) => { setAnunci(''); tauler.llig(Array.from(event.target.files ?? [])); }} />
      </Camp>
      {llegint ? <Carregant etiqueta={tg(idioma, 'Llegint els extractes…')} /> : null}
      {error ? <Alerta to="error" titol={tg(idioma, 'No s’han pogut llegir els extractes')}>{error}</Alerta> : null}
      {lectura?.avisos?.length ? (
        <Alerta to="avis" titol={tg(idioma, 'Hi ha fitxers que no s’han llegit')}>
          <ul ref={adoptaEstilsDiferits} className="sdp-gestoria-tauler__avisos">
            {lectura.avisos.map((a, i) => <li ref={adoptaEstilsDiferits} key={`${a.codi}-${i}`}>{a.missatge}</li>)}
          </ul>
        </Alerta>
      ) : null}
      {lectura || llegint ? (
        <Boto varietat="secundari" onClick={oblida}>{tg(idioma, 'Oblida les dades')}</Boto>
      ) : null}
      <RevocaAprovacio porta={porta} id={TRACTOR_TAULER.id} idioma={idioma} />
    </div>
  );
}

/** Els avisos dels comptes (extractes que es solapen, files del CSV sense parella): del Tauler, dels Bancs i de la Cabina d'Avió. */
export function AvisosComptes({ avisos, idioma = 'ca' }) {
  const delsComptes = avisos.filter((a) => !a.fitxer);
  if (!delsComptes.length) return null;
  return (
    <Alerta to="info" titol={tg(idioma, 'Notes de la lectura')}>
      <ul ref={adoptaEstilsDiferits} className="sdp-gestoria-tauler__avisos">
        {delsComptes.map((a, i) => <li ref={adoptaEstilsDiferits} key={`${a.codi}-${i}`}>{a.missatge}</li>)}
      </ul>
    </Alerta>
  );
}

const delBloc = (dades, bloc) => dades.targetes.filter((t) => t.bloc === bloc);

/** El Tauler d'Inici: «La teua realitat» i «Finances (últims 30 dies)». */
export function VistaTauler({ dades, comuns, idioma = 'ca' }) {
  return (
    <>
      <AvisosComptes avisos={dades.avisos} idioma={idioma} />
      <BlocTargetes titol={tg(idioma, BLOCS_TAULER.realitat)} targetes={delBloc(dades, 'realitat')} {...comuns} idioma={idioma} />
      <BlocTargetes titol={tg(idioma, BLOCS_TAULER.finances)} targetes={delBloc(dades, 'finances')} {...comuns} idioma={idioma} />
    </>
  );
}

/** Bancs i Tresoreria: una targeta per compte i la de la conciliació. */
export function VistaBancs({ dades, comuns, idioma = 'ca' }) {
  return (
    <>
      <AvisosComptes avisos={dades.avisos} idioma={idioma} />
      {dades.comptes.length ? null : (
        <EstatBuit icona={FileSearch} titol={tg(idioma, 'Encara no hi ha cap compte')}>
          {tg(idioma, 'Tria els extractes del banc: cada compte hi tindrà la seua targeta, amb el saldo i el que hi ha entrat i eixit.')}
        </EstatBuit>
      )}
      <BlocTargetes titol={tg(idioma, BLOCS_TAULER.bancs)} targetes={delBloc(dades, 'bancs')} {...comuns} idioma={idioma} />
    </>
  );
}

/** Impostos: les estimacions del 303 i del 130 del trimestre. */
export function VistaImpostos({ dades, comuns, idioma = 'ca' }) {
  return <BlocTargetes titol={tg(idioma, BLOCS_TAULER.impostos)} targetes={delBloc(dades, 'impostos')} {...comuns} idioma={idioma} />;
}

export function PaginaTargeta({
  targeta, titular, visible = false, barActions, rellotgeViu = true, rellotge, onTorna, refTitol, onAvis = null, avis = null, idioma = 'ca'
}) {
  const id = useId();
  /* Ordre del Mestre, 14-10-2026 (punt 5): amb `onAvis` (la closca), la barra porta Comentar, Compartir i
     Connectar inoperatius, que diuen per què no ixen; `avis` és l'Alerta on ho diuen. Sense (l'Històric),
     apagats: el DOM de sempre. */
  return (
    <PaginaApp title={targeta.titol} subtitle={targeta.subtitol} lead={targeta.entradeta}
      author={titular} barActions={barActions} rellotgeViu={rellotgeViu === true} rellotge={rellotge} labels={targeta.etiquetes}
      onBack={onTorna} refTitol={refTitol} {...barraPrivada(onAvis, idioma)}>
      {avis}
      <section ref={adoptaEstilsDiferits} className="sdp-gestoria-tauler__seccio" aria-labelledby={`${id}-xifra`}>
        <h2 id={`${id}-xifra`}>{tg(idioma, 'La xifra')}</h2>
        <p className="sdp-gestoria-tauler__xifra"><Xifra xifra={targeta.xifra} visible={visible} idioma={idioma} /></p>
        {targeta.xifra ? null : <p ref={adoptaEstilsDiferits}>{targeta.senseXifra}</p>}
      </section>
      {targeta.detall.length ? (
        <Taula titol={tf(idioma, 'detallTargeta', targeta.titol)} densa>
          <thead ref={adoptaEstilsDiferits}>
            <tr><th scope="col">{tg(idioma, 'Concepte')}</th><th scope="col">{tg(idioma, 'Xifra')}</th></tr>
          </thead>
          <tbody>
            {targeta.detall.map((fila) => (
              <tr ref={adoptaEstilsDiferits} key={fila.etiqueta}>
                <th scope="row">{fila.etiqueta}</th>
                <td><Xifra xifra={fila.xifra} visible={visible} idioma={idioma} /></td>
              </tr>
            ))}
          </tbody>
        </Taula>
      ) : null}
      {targeta.notes.length ? (
        <ul ref={adoptaEstilsDiferits} className="sdp-gestoria-tauler__notes">
          {targeta.notes.map((nota) => <li ref={adoptaEstilsDiferits} key={nota}>{nota}</li>)}
        </ul>
      ) : null}
      <section className="sdp-gestoria-tauler__seccio" aria-labelledby={`${id}-font`}>
        <h2 id={`${id}-font`}>{tg(idioma, 'D’on ix')}</h2>
        <p>{targeta.font}</p>
      </section>
    </PaginaApp>
  );
}

/** La pàgina d'un mòdul que encara no existix: «en obres», honest. */
export function ModulEnObres({ modul, idioma = 'ca' }) {
  return (
    <EstatBuit icona={Construction} titol={tg(idioma, 'En obres')}>
      {tg(idioma, modul.explica)}
    </EstatBuit>
  );
}
