/**
 * VistaMes.jsx — el mes de calendari a l'estil Google Calendar.
 *
 * T10 (ordre del Mestre, 261001) · Un acte de diversos dies és UNA barra per
 * setmana, no una píndola cada dia; cada barra va al seu carril i, si un dia no
 * hi cap, l'últim carril diu «+N més» (utils/disposicioCalendari.js). El «+N»
 * no és cap finestra: és el botó del dia, que ja tria el dia (?date= a
 * /calendari) i filtra la llista de davall.
 *
 * Fase visual (prompt 261001_0445) · La pintura de les captures del Mestre
 * (vistes Mes i 2 setmanes): només les setmanes que toquen el mes (de 4 a 6
 * files, graellaDelMes amb setmanes: 'justes') o N setmanes des d'un dilluns
 * (graellaDeSetmanes), totes de la mateixa alçada; l'abreviatura del dia,
 * només a dalt; el número centrat dalt de cada cel·la, hui en un cercle (el
 * d'acció des de l'Onada 6) i el primer dia d'un mes veí amb el nom curt del mes («1 de nov.»). Dins de
 * la cel·la, primer les barres de tot el dia o de diversos dies (plenes, amb el
 * color de la font: classeDeFont) i després les línies «● HH:MM Títol» dels
 * actes amb hora.
 *
 * MODE COMPACTE. Decidix l'amplada del contenidor (useAmpladaContenidor), mai
 * la del viewport: per davall de 41,5em les barres es fan tires de color sense
 * text, els actes amb hora es queden en el punt i el «+N més» es diu «+N». La
 * cel·la sencera continua sent el botó del dia (≥ --sdp-touch); el nom del
 * botó ho diu tot.
 *
 * No toca GraellaMes ni CalendariEsdeveniments: la Consola i el selector de
 * l'editor continuen amb el mes d'ara (Llei del Píxel). Des de l'Onada 6, la
 * pestanya Calendari del Mur munta esta vista (CalendariDelPoble), com
 * /calendari.
 *
 * TECLAT I ROLS (ordre del Mestre, 261003 · P6: des d'ara és la vista per
 * defecte de /calendari, el clon de Google Calendar). Amb onTriaDia, la
 * graella és UN sol punt de tabulació, com VistaAny: el dia actiu (l'últim
 * enfocat, el triat, hui o el primer del mes que es veu) té tabIndex 0 i la
 * resta -1. Les fletxes es mouen pels dies (← → un dia, ↑ ↓ una setmana);
 * Inici i Fi, al dilluns i al diumenge de la fila; Ctrl+Inici i Ctrl+Fi, a la
 * primera i a l'última cel·la. Mai ixen de la graella: el període el governa
 * qui munta la vista. La llista de setmanes és role="grid" («Dies d’octubre
 * del 2026»: un nom distint del de la regió, que el lector no repetix, i una
 * ajuda per al lector), cada setmana role="row" i cada dia role="gridcell": el
 * lector passa al mode de focus i les fletxes arriben a la graella. Cap regla
 * de CSS depén del rol ni del tabIndex: els píxels no canvien. L'ajuda és un
 * span: un p fill de .sdp-cal-mes rebria la regla del paràgraf «retallat»
 * (.sdp-cal-mes > p, capa components), que guanya .sdp-sr-only (capa legacy).
 * Sense onTriaDia, el DOM de sempre.
 *
 * Revisió de P6 · El dia enfocat només es recorda dins de la graella on es va
 * enfocar (la clau de la seua primera cel·la): en canviar de període, el punt
 * de tabulació torna al triat, a hui o a l'1 del mes, i no a un dia veí que
 * casualment es veu. Un clic també el recorda: Safari de macOS no enfoca el
 * botó en clicar-lo i l'onFocus no salta.
 *
 * Posicionament sense `style` en JSX: cada barra escriu les línies de graella
 * (--sdp-cal-col-inici, --sdp-cal-col-fi, --sdp-cal-carril, 1-based) des d'una
 * ref (usePropietatsCss), i l'arrel, --sdp-cal-carrils (l'alçada de la fila).
 *
 * CONTRACTE
 *   esdeveniments · llista del model (creaEsdeveniment); les nul·les no compten.
 *   cursor · { any, mes } (de 0 a 11). Amb dilluns, opcional (el mes del dilluns).
 *   setmanes · 'justes' (per defecte: les que toquen el mes) o un nombre de
 *     setmanes (6, la graella fixa de sempre).
 *   dilluns · Date | null. Amb dilluns, `setmanes` setmanes (2 per defecte)
 *     des del dilluns de la seua setmana, sense cap dia atenuat (la vista 2
 *     setmanes); cada dia 1 hi porta el nom curt del mes.
 *   diaTriat / onTriaDia · 'AAAA-MM-DD' | null / (clau) => void. Amb
 *     onTriaDia, cada dia és un botó amb aria-pressed i un nom amb la data
 *     llarga, el recompte, els títols i, si n'hi ha, el «+N més» (WCAG 2.5.3:
 *     el nom conté el text visible, en el mateix ordre; en compacte es veu
 *     «+N», que el nom també conté); sense, és quiet i el recompte i els títols
 *     van en text per al lector.
 *   maxCarrils · quants carrils caben en un dia (3 per defecte; 6 amb
 *     dilluns, perquè les files de la vista 2 setmanes són altes).
 *   densitat · 'responsiva' (per defecte: compacte en contenidor estret,
 *     alçades normals), 'normal' (mai compacte) o 'compacta' (compacte en
 *     contenidor estret i, amb ratolí, cel·les més baixes; @media (pointer:
 *     fine) al full, per a no baixar cap control tàctil de --sdp-touch).
 *   recompte · (n) => text del nom del dia («1 esdeveniment»).
 *   avui · Date (marca hui); titol · nom de la regió; locale; className.
 *
 * Les barres són aria-hidden: cada dia ja diu els seus actes, al nom del botó
 * o, en el mode quiet, al text per al lector (sdp-sr-only).
 *
 * ENLLAÇ DE L'ESDEVENIMENT (Onada 6, prompt 261009_0230, punt 1; pla de
 * l'Onada 5, tasca 16: «si es fa clic a l'enllaç de l'esdeveniment dins del
 * calendari, portarà a la pàgina de la publicació; si es fa clic al quadre del
 * dia (fora de l'enllaç), es mostraran les targetes d'eixe dia»).
 *   rutaDeLEsdeveniment · (esd) => string | null: la ruta de l'app de la
 *     publicació (la valida qui munta la vista). Amb ruta i fora del mode
 *     compacte, la peça porta un enllaç (.sdp-cal-enllac) amb tabIndex -1: la
 *     capa continua aria-hidden i la graella, un sol punt de tabulació (el
 *     teclat i el lector arriben a l'acte pel dia i per la targeta de davall).
 *     El full només el fa clicable amb ratolí (@media (pointer: fine)): en
 *     tàctil la peça fa 24px (Pedra Seca §6) i el toc passa al dia.
 *   LinkComponent · el Link del router de qui munta la vista (com
 *     BarraTaronja): dins d'un amfitrió, un <a> cru navegaria la seua pàgina.
 *     Per defecte, 'a'.
 * Sense rutaDeLEsdeveniment, el DOM de sempre.
 *
 * Importa per camí directe (mai per index.js): la porta de dependències
 * circulars de Pedra Seca ho exigix.
 */
import { useId, useMemo, useRef, useState } from 'react';
import { DIES_CURTS, DIES_LLARGS, cursorDe, horaDe } from '../../../utils/calendari.js';
import { classeDeFont, disposaMes, ocurrenciesDeLaLlista } from '../../../utils/disposicioCalendari.js';
import { clauDeData, dillunsDe, graellaDeSetmanes, graellaDelMes, sumaDies } from '../../../utils/periodes.js';
import { usePropietatsCss } from '../../../hooks/usePropietatsCss.js';
import { esEstret, useAmpladaContenidor } from '../../../hooks/useAmpladaContenidor.js';

/* Per davall d'esta amplada del contenidor, en em seus (≈ 664 px amb 16 px),
   set columnes de text no es lligen: mode compacte. */
const LLINDAR_COMPACTE_EM = 41.5;
const DENSITATS = Object.freeze(['responsiva', 'normal', 'compacta']);
/* La vista 2 setmanes té poques files i altes: hi caben més carrils. */
const SETMANES_DES_DEL_DILLUNS = 2;
const CARRILS_DEL_MES = 3;
const CARRILS_DES_DEL_DILLUNS = 6;
/* P6 (261003) · Les fletxes de la graella: ← → un dia, ↑ ↓ una setmana. */
const PASSOS_TECLAT = Object.freeze({ ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 });
const AJUDA_TECLAT = 'Les fletxes es mouen pels dies; Inici i Fi, al principi i al final de la setmana.';

/* La cel·la (de 0 a total - 1, set per fila) on porta una tecla des de la
   cel·la `index`, o null si la tecla no és de la graella (o porta Alt, Meta o
   Maj: dreceres del navegador). Pot caure fora del rang: qui la crida no es
   mou. */
function destiDeLaTecla({ key, ctrlKey, altKey, metaKey, shiftKey }, index, total) {
  if (altKey || metaKey || shiftKey) return null;
  if (key === 'Home') return ctrlKey ? 0 : index - (index % 7);
  if (key === 'End') return ctrlKey ? total - 1 : index - (index % 7) + 6;
  if (ctrlKey || !Object.hasOwn(PASSOS_TECLAT, key)) return null;
  return index + PASSOS_TECLAT[key];
}

const recompteEsdeveniments = (n) => (n === 1 ? '1 esdeveniment' : `${n} esdeveniments`);
const dataLlarga = (data, locale) => data.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const dataDelPeriode = (data, locale) => data.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
/* «de setembre de 2026», «d’octubre de 2026»: la preposició s'apostrofa
   davant de vocal (la mateixa regla que ambDe de CalendariDelPoble). */
const ambDe = (text) => (/^[aeiouàèéíòóú]/i.test(text) ? `d’${text}` : `de ${text}`);
/* El recompte i els títols d'un dia: el nom del botó o el text per al lector. */
const actesDelDia = (delDia, recompte) => `${recompte(delDia.length)}${delDia.length ? `: ${delDia.map((esd) => esd.titol).join(', ')}` : ''}`;

/* La graella que es pinta: N setmanes des del dilluns, les justes del mes o N
   setmanes des de l'1 del mes. */
function graellaDeLaVista(cursor, setmanes, tempsDilluns) {
  if (tempsDilluns !== null) return graellaDeSetmanes(new Date(tempsDilluns), setmanes ?? SETMANES_DES_DEL_DILLUNS);
  if (setmanes === null) return graellaDelMes(cursor, { setmanes: 'justes' });
  return graellaDeSetmanes(new Date(cursor.any, cursor.mes, 1), setmanes, { mes: cursor });
}

/* Onada 6 · L'enllaç d'un esdeveniment a la pàgina de la seua publicació: el
   Link del router de qui munta la vista (LinkComponent, com BarraTaronja) o
   un <a>. És l'únic de les tres vistes (VistaSetmana i VistaAgenda
   l'importen per camí directe); `resta` hi passa, per exemple, el tabIndex. */
export function EnllacDeLEsdeveniment({ ruta, LinkComponent = 'a', children, ...resta }) {
  const desti = LinkComponent === 'a' ? { href: ruta } : { to: ruta };
  return <LinkComponent className="sdp-cal-enllac" {...desti} {...resta}>{children}</LinkComponent>;
}

/* Una barra (o un punt amb l'hora, si és d'un sol dia) d'una fila de setmana.
   En compacte, la tira o el punt sols: el nom del dia ja diu el títol.
   Onada 6 · Amb `ruta` i fora del compacte, el contingut és l'enllaç a la
   publicació (tabIndex -1: la capa és aria-hidden). */
function PecaDelMes({ peca, compacte, ruta = null, LinkComponent }) {
  const ref = useRef(null);
  usePropietatsCss(ref, { '--sdp-cal-col-inici': peca.colInici + 1, '--sdp-cal-col-fi': peca.colFi + 1, '--sdp-cal-carril': peca.carril + 1 });
  const { ocurrencia, tipus } = peca.segment;
  const enllac = compacte ? null : ruta;
  const classe = [
    'sdp-cal-barra', classeDeFont(ocurrencia.esd), tipus === 'punt' && 'sdp-cal-barra--punt',
    peca.continuaAbans && 'sdp-cal-barra--abans', peca.continuaDespres && 'sdp-cal-barra--despres', enllac && 'sdp-cal-barra--enllac'
  ].filter(Boolean).join(' ');
  const contingut = tipus !== 'punt' ? (compacte ? null : ocurrencia.esd.titol) : (
    <>
      <span className="sdp-cal-mes__punt" />
      {compacte ? null : (
        <>
          <span className="sdp-cal-mes__hora">{horaDe(new Date(ocurrencia.inici))}</span>
          {` ${ocurrencia.esd.titol}`}
        </>
      )}
    </>
  );
  return (
    <li ref={ref} className={classe}>
      {enllac ? <EnllacDeLEsdeveniment ruta={enllac} LinkComponent={LinkComponent} tabIndex={-1}>{contingut}</EnllacDeLEsdeveniment> : contingut}
    </li>
  );
}

export function VistaMes({
  esdeveniments, cursor, avui = new Date(), diaTriat = null, onTriaDia, maxCarrils,
  setmanes = 'justes', dilluns = null, densitat = 'responsiva',
  recompte = recompteEsdeveniments, titol, locale, className, rutaDeLEsdeveniment, LinkComponent = 'a'
}) {
  const arrel = useRef(null);
  // Un número primitiu per a les dependències: un Date nou a cada pintada no recalcula res.
  const tempsDilluns = dilluns ? dillunsDe(dilluns).getTime() : null;
  const ambSetmanes = tempsDilluns !== null;
  const carrils = maxCarrils ?? (ambSetmanes ? CARRILS_DES_DEL_DILLUNS : CARRILS_DEL_MES);
  usePropietatsCss(arrel, { '--sdp-cal-carrils': carrils });
  const mida = useAmpladaContenidor(arrel);
  const { any, mes } = cursor ?? cursorDe(dilluns ?? avui);
  const nSetmanes = Number.isInteger(setmanes) && setmanes > 0 ? setmanes : null;
  const graella = useMemo(() => graellaDeLaVista({ any, mes }, nSetmanes, tempsDilluns), [any, mes, nSetmanes, tempsDilluns]);
  const { ocurrencies, retallat } = useMemo(
    () => ocurrenciesDeLaLlista(esdeveniments, graella[0][0].data, sumaDies(graella[graella.length - 1][6].data, 1)),
    [esdeveniments, graella]
  );
  const files = useMemo(() => disposaMes(ocurrencies, graella, { maxCarrils: carrils }), [ocurrencies, graella, carrils]);
  const hui = clauDeData(avui);
  const mode = DENSITATS.includes(densitat) ? densitat : 'responsiva';
  const compacte = mode !== 'normal' && esEstret(mida, LLINDAR_COMPACTE_EM);
  const nomPeriode = ambSetmanes
    ? `del ${dataDelPeriode(graella[0][0].data, locale)} al ${dataDelPeriode(graella[graella.length - 1][6].data, locale)}`
    : ambDe(new Date(any, mes, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' }));
  const nom = titol ?? `Calendari ${nomPeriode}`;
  // Revisió de P6 · La graella porta el seu nom, distint del de la regió.
  const nomGraella = `Dies ${nomPeriode}`;
  const classe = [
    'sdp-cal-mes', compacte && 'sdp-cal-mes--compacte', mode === 'compacta' && 'sdp-cal-mes--densitat-compacta', className
  ].filter(Boolean).join(' ');

  /* P6 (261003) · Teclat. `dies` és la graella en ordre de lectura (set per
     fila) i `indexDe`, la posició de cada clau. El dia actiu és l'únic amb
     tabIndex 0: l'últim enfocat, el triat, hui o el primer del mes que es veu
     (a les N setmanes, el primer de la graella), si es veuen a la graella.
     Revisió de P6 · L'enfocat porta la primera cel·la de la seua graella i
     només val mentre es veu eixa graella. */
  const idAjuda = `${useId()}-ajuda`;
  const [enfocat, setEnfocat] = useState(null);
  const dies = useMemo(() => files.flatMap((fila) => fila.dies), [files]);
  const indexDe = useMemo(() => new Map(dies.map((dia, i) => [dia.clau, i])), [dies]);
  const triable = Boolean(onTriaDia);
  const primera = dies[0].clau;
  const recordat = enfocat?.graella === primera ? enfocat.clau : null;
  const recorda = (clau) => setEnfocat((abans) => (abans?.graella === primera && abans.clau === clau ? abans : { graella: primera, clau }));
  const actiu = [recordat, diaTriat, hui].find((clau) => indexDe.has(clau)) ?? (dies.find((dia) => dia.delMes) ?? dies[0]).clau;
  const onKeyDown = (event) => {
    const index = indexDe.get(event.target?.dataset?.clau);
    if (index === undefined) return;
    const desti = destiDeLaTecla(event, index, dies.length);
    if (desti === null) return;
    // Les tecles de la graella no fan scroll de la pàgina, tampoc a la vora.
    event.preventDefault();
    if (desti < 0 || desti >= dies.length || desti === index) return;
    const clau = dies[desti].clau;
    recorda(clau);
    arrel.current?.querySelector(`[data-clau="${clau}"]`)?.focus();
  };

  return (
    <section ref={arrel} className={classe} aria-label={nom}>
      {triable ? <span className="sdp-sr-only" id={idAjuda}>{AJUDA_TECLAT}</span> : null}
      <ol className="sdp-cal-mes__setmana" aria-hidden="true">
        {DIES_CURTS.map((dia, i) => <li key={dia}><abbr title={DIES_LLARGS[i]}>{dia}</abbr></li>)}
      </ol>
      <ol className="sdp-cal-mes__files" role={triable ? 'grid' : undefined} aria-label={triable ? nomGraella : undefined}
        aria-describedby={triable ? idAjuda : undefined} onKeyDown={triable ? onKeyDown : undefined}>
        {files.map((fila) => (
          <li key={fila.dies[0].clau} className="sdp-cal-mes__fila" role={triable ? 'presentation' : undefined}>
            <ol className="sdp-cal-mes__dies" role={triable ? 'row' : undefined}>
              {fila.dies.map((dia, i) => {
                const delDia = fila.delDia[i];
                const esHui = dia.clau === hui;
                const classeDia = ['sdp-cal-dia', 'sdp-cal-dia--mes', !dia.delMes && 'sdp-cal-dia--fora'].filter(Boolean).join(' ');
                const mesText = fila.mes[i] ? `+${fila.mes[i]} més` : null;
                // L'1 d'un mes veí (o, en N setmanes, de qualsevol mes) diu el mes; en compacte i a hui, el número sol.
                const ambMes = dia.data.getDate() === 1 && (ambSetmanes || !dia.delMes) && !compacte && !esHui;
                const contingut = (
                  <>
                    <span className="sdp-cal-dia__numero">
                      {ambMes ? dia.data.toLocaleDateString(locale, { day: 'numeric', month: 'short' }) : dia.data.getDate()}
                    </span>
                    {mesText ? <span className="sdp-cal-mes__mes">{compacte ? `+${fila.mes[i]}` : mesText}</span> : null}
                  </>
                );
                return (
                  <li key={dia.clau} className="sdp-cal-mes__cella" role={triable ? 'gridcell' : undefined}>
                    {triable ? (
                      <button type="button" className={classeDia} data-clau={dia.clau} tabIndex={dia.clau === actiu ? 0 : -1}
                        aria-pressed={diaTriat === dia.clau} aria-current={esHui ? 'date' : undefined}
                        aria-label={`${dataLlarga(dia.data, locale)} · ${actesDelDia(delDia, recompte)}${mesText ? ` · ${mesText}` : ''}`}
                        onFocus={() => recorda(dia.clau)} onClick={() => { recorda(dia.clau); onTriaDia(dia.clau); }}>
                        {contingut}
                      </button>
                    ) : (
                      <span className={classeDia} aria-current={esHui ? 'date' : undefined}>
                        {contingut}
                        {delDia.length ? <span className="sdp-sr-only">{` · ${actesDelDia(delDia, recompte)}`}</span> : null}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
            <ol className="sdp-cal-mes__barres" aria-hidden="true">
              {fila.peces.map((peca) => (
                <PecaDelMes key={`${peca.segment.ocurrencia.clau}·${peca.colInici}`} peca={peca} compacte={compacte}
                  ruta={rutaDeLEsdeveniment?.(peca.segment.ocurrencia.esd) ?? null} LinkComponent={LinkComponent} />
              ))}
            </ol>
          </li>
        ))}
      </ol>
      {retallat ? <p>Algun acte es repetix massa sovint per a pintar-lo sencer: el trobaràs a les targetes.</p> : null}
    </section>
  );
}
