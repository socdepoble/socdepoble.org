/**
 * GestorMultimediaLocal.jsx — Gestor d'arxius i volums locals del Mas
 * (`/multimedia` → «Carpeta local» · IDEA-54 + IDEA-55 · Onada 261029_1605).
 *
 * L'orquestrador: tot el que toca el disc ho fa el motor
 * (motorMultimediaLocal.js, l'únic import), i res no puja a Internet tret de
 * «Enviar al Bloc de Notes», que ho diu.
 *
 *   · Volums: les carpetes recordades (biblioteca del navegador) en pastilles
 *     d'1 clic. En muntar, la darrera s'obri sola si el permís és 'granted';
 *     si és 'prompt', el bàner «Reconnectar amb 1 clic». El permís i el
 *     selector són SEMPRE la primera espera del clic (l'activació caduca).
 *     Sense selector (Safari, Firefox), un <input webkitdirectory> de només
 *     lectura, que no es recorda mai.
 *   · Fototeca mixta: arbre de carpetes i, per a la carpeta triada, TOTS els
 *     seus fitxers, en «Graella d'àlbum» (24 per pàgina, miniatures reals) o
 *     en «Explorador d'arxius (taula)» (100 per pàgina).
 *   · Detall polimòrfic, duplicats exactes (SHA-256), laboratori WebP i
 *     operacions al disc (moure, reanomenar, nova carpeta, eliminar).
 *   · Testimonis de generació: obrir un volum, tornar a llegir-lo i la cerca
 *     de duplicats porten el seu; una resposta tardana s'ignora. Els blob: els
 *     tanquen els registres de cada pàgina i de cada detall.
 *   · Amb canvis sense desar a l'editor, canviar de fitxer, de volum o tornar
 *     a llegir demana confirmació, i les operacions del fitxer es bloquegen.
 *
 * IDEA-55 + P1-71 (Onada 261029_1605, Bloc E) · L'estat i els fluxos viuen a
 * useGestorArxiusLocals.js (una sola lectura del disc, compartida amb les
 * tres columnes de /multimedia). Ací queden les peces que es pinten:
 *   · GestorMultimediaLocal: el mode AUTÒNOM (panell amb arbre propi i detall
 *     en línia), amb el mateix DOM d'abans; la selecció és seua.
 *   · PanellGestorLocal: el panell; en mode espai (la columna del detall de
 *     /multimedia), sense capçalera, sense arbre i sense detall en línia: les
 *     tessel·les porten a la fitxa de l'arxiu (onTriaArxiu).
 *   · InputCarpetaLocal i DialegDescartaLocal: una sola instància, germanes
 *     del panell en l'espai i dins de la secció en el mode autònom.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ShieldCheck, Square } from 'lucide-react';
import {
  Alerta, Boto, Camp, CampText, Carregant, DialegConfirmacio, Insignia, PillToggle, Progres, Selector
} from '../../components/PedraSeca/index.js';
import { MOCK_TOWNS } from '../pobles/townsSeed.js';
import { MIDA_PAGINA_ALBUM, MIDA_PAGINA_TAULA, PRESSUPOST_DUPLICATS, formatKb, paginaLocal } from './motorMultimediaLocal.js';
import { ArbreCarpetesLocals } from './ArbreCarpetesLocals.jsx';
import { AccionsCarpetaLocal } from './AccionsCarpetaLocal.jsx';
import { BarraVolumsLocals } from './BarraVolumsLocals.jsx';
import { DetallArxiuLocal } from './DetallArxiuLocal.jsx';
import { GraellaAlbumLocal } from './GraellaAlbumLocal.jsx';
import { TaulaArxiusLocals } from './TaulaArxiusLocals.jsx';
import { nomVisibleLocal } from './suportGestorLocal.js';
import {
  TEXTOS_LOCAL as T, missatgeDErrorLocal, missatgeDeBibliotecaLocal, missatgeDeLimitacioLocal, traduccioDeReserva, tradueix
} from './textosGestorLocal.js';
import { useGestorArxiusLocals } from './useGestorArxiusLocals.js';
import { useLocaleOpcional } from './useLocaleOpcional.js';

const CANCELA = ['common.cancela', 'Cancel·lar'];
const FILTRES_ESTAT = Object.freeze([
  ['tots', 'filtre.tots'], ['publicades', 'filtre.publicades'], ['inedites', 'filtre.inedites'],
  ['bessones', 'filtre.bessones'], ['alertes', 'filtre.alertes']
]);
const TIPUS = Object.freeze([
  ['imatge', 'tipus.imatge'], ['audio', 'tipus.audio'], ['video', 'tipus.video'], ['text', 'tipus.text'],
  ['codi', 'tipus.codi'], ['document', 'tipus.document'], ['altre', 'tipus.altre']
]);

/* El text d'un missatge desat com a descripció (es tradueix en pintar-lo). */
function textDelMissatge(t, missatge) {
  if (!missatge) return '';
  if (missatge.error) return missatgeDErrorLocal(t, missatge.error, missatge.valors);
  const text = tradueix(t, missatge.parell, missatge.valors);
  return missatge.motiu ? `${text} ${missatgeDeBibliotecaLocal(t, missatge.motiu)}` : text;
}

const SELECCIO_BUIDA = Object.freeze({ carpeta: '', ruta: null });

/* La clau de les miniatures d'una pàgina (la mateixa que useMiniaturesLocals):
   en l'espai, la graella es torna a muntar quan canvia, i el registre vell es
   tanca DESPRÉS que el DOM ja no pinta cap de les seues URL. */
const clauDeMiniatures = (elements) => elements
  .filter((el) => el.vista === 'imatge' || el.vista === 'svg')
  .map((el) => `${el.ruta}\u0000${el.mida}\u0000${el.modificat}`)
  .join('\u0001');

/** L'<input webkitdirectory> de la reserva de només lectura: una sola instància. */
export function InputCarpetaLocal({ gestor }) {
  return (
    <input
      ref={gestor.inputRef}
      type="file"
      webkitdirectory=""
      directory=""
      multiple
      hidden
      onChange={gestor.enTriarFitxers}
      data-testid="input-carpeta-multimedia-local"
    />
  );
}

/** L'avís del gestor (el resultat d'una operació, un error), tancable. */
export function MissatgeLocal({ gestor, t = gestor.t }) {
  const { missatge, setMissatge } = gestor;
  if (!missatge) return null;
  return <Alerta to={missatge.to} onTanca={() => setMissatge(null)}>{textDelMissatge(t, missatge)}</Alerta>;
}

/** «Descartar els canvis?» abans d'una acció del gestor (volums, tornar a llegir, fitxer nou). */
export function DialegDescartaLocal({ gestor, t = gestor.t }) {
  const tr = (parell, valors) => tradueix(t, parell, valors);
  if (!gestor.pendent) return null;
  return (
    <DialegConfirmacio
      obert
      destructiu
      titol={tr(T['text.descartaTitol'])}
      descripcio={tr(T['text.descartaText'])}
      etiquetaConfirma={tr(T['text.descarta'])}
      etiquetaCancela={tr(CANCELA)}
      onTanca={gestor.cancelaPendent}
      onConfirma={gestor.confirmaPendent}
    />
  );
}

/**
 * El panell del Gestor sobre la carpeta `carpeta` (recursiu: també els
 * fitxers de les subcarpetes). `autonom`: el mode de sempre, amb capçalera,
 * arbre i detall en línia. Sense: el mode espai de /multimedia (la columna
 * del detall), on triar un fitxer és `onTriaArxiu(el)`. `barra`: props de
 * BarraVolumsLocals que substituïxen les del gestor (la portada hi navega
 * abans de l'acció).
 */
export function PanellGestorLocal({
  gestor,
  t = gestor.t,
  carpeta = '',
  seleccionat = null,
  autonom = false,
  onTriaArxiu,
  onTriaCarpeta,
  onTancaDetall,
  onFet = gestor.enFet,
  pobles = MOCK_TOWNS,
  blocDeNotes = null,
  registraTessela,
  titolFitxersRef,
  barra = null
}) {
  const tr = (parell, valors) => tradueix(t, parell, valors);
  const locale = useLocaleOpcional();
  const id = useId();
  const idTitol = `${id}-titol`;
  const idDiagnostic = `${id}-diagnostic`;
  const idFitxers = `${id}-fitxers`;
  const {
    font, analisi, exactes, carpetes, comptes, filtreEstat, filtreTipus, cerca, vista, limitacions,
    progresHash, duplicats, entrades, potEscriure, nomVolum, ocupat, canvisPendents, versioDetall
  } = gestor;

  const filtrats = useMemo(() => {
    const q = cerca.trim().toLowerCase();
    return analisi.elements.filter((el) => {
      if (carpeta && !el.ruta.startsWith(`${carpeta}/`)) return false;
      if (filtreTipus !== 'tots' && el.tipus !== filtreTipus) return false;
      if (filtreEstat === 'publicades' && !el.emparelladaWeb) return false;
      if (filtreEstat === 'inedites' && !el.inedita) return false;
      if (filtreEstat === 'bessones' && !el.teBessonaLocal) return false;
      if (filtreEstat === 'alertes' && !el.pesAlt && !el.duplicada && !exactes?.has(el.ruta)) return false;
      if (q && !el.ruta.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [analisi.elements, carpeta, filtreTipus, filtreEstat, cerca, exactes]);

  const triaPagina = (n) => gestor.triaPagina(carpeta, n);
  const pag = paginaLocal(filtrats, gestor.paginaDe(carpeta), vista === 'taula' ? MIDA_PAGINA_TAULA : MIDA_PAGINA_ALBUM);
  const elSeleccionat = autonom && seleccionat ? gestor.elementDe(seleccionat) : null;
  const carpetaBuida = Boolean(carpeta) && !comptes.get(carpeta) && !carpetes.some((c) => c.startsWith(`${carpeta}/`));

  /* Gauntlet 261029 (cicle 1, WCAG 4.1.3) · Cercar o filtrar canvia «Fitxers
     a la vista (n)», que és un encapçalament: el recompte (o «cap fitxer») es
     diu en una regió d'estat per al lector, mig segon després de l'última
     tecla. En muntar no es diu res. */
  const textRecompte = filtrats.length === 0
    ? tr(carpetaBuida ? T.carpetaBuida : T.buit)
    : tr(T.fitxers, { n: filtrats.length });
  const clauFiltres = `${cerca}\u0000${filtreEstat}\u0000${filtreTipus}`;
  const [clauFiltresInicial] = useState(clauFiltres);
  const [anunciRecompte, setAnunciRecompte] = useState('');
  useEffect(() => {
    if (clauFiltres === clauFiltresInicial && anunciRecompte === '') return undefined;
    const espera = setTimeout(() => setAnunciRecompte(textRecompte), 500);
    return () => clearTimeout(espera);
  }, [clauFiltres, clauFiltresInicial, textRecompte, anunciRecompte]);

  const cos = (
    <>
      <BarraVolumsLocals {...gestor.propsBarra} t={t} {...barra} />
      {autonom ? <InputCarpetaLocal gestor={gestor} /> : null}

      <MissatgeLocal gestor={gestor} t={t} />
      {ocupat ? <Carregant etiqueta={tr(T.llegint)} /> : null}

      {font ? (
        <>
          <section className="sdp-arxiu-local__panell" aria-labelledby={idDiagnostic}>
            <h3 id={idDiagnostic}>{tr(T.diagnostic, { nom: nomVisibleLocal(nomVolum) })}</h3>
            <p>{tr(T.diagnosticXifres, { n: analisi.resum.totalFitxers, pes: formatKb(analisi.resum.pesTotalBytes, locale) })}</p>
            <div className="sdp-arxiu-local__fila">
              <Insignia to="exit">{tr(T['resum.publicades'], { n: analisi.resum.totalEmparelladesWeb })}</Insignia>
              <Insignia to="avis">{tr(T['resum.inedites'], { n: analisi.resum.totalInedites })}</Insignia>
              <Insignia to="info">
                {tr(T['resum.bessones'], {
                  n: analisi.resum.totalBessonesLocals,
                  /* Un estalvi nul ja es diu «0 KB» (formatKb, Gauntlet 261029). */
                  pes: formatKb(analisi.resum.estalviBessonesBytes, locale)
                })}
              </Insignia>
              <Insignia to="neutre">{tr(T['resum.avisos'], { n: analisi.resum.totalPesAlt + analisi.resum.totalDuplicades })}</Insignia>
              {exactes ? <Insignia to="error">{tr(T['resum.exactes'], { n: exactes.size })}</Insignia> : null}
            </div>
            {limitacions.length > 0 ? (
              <Alerta to="avis">
                <ul className="sdp-arxiu-local__llista">
                  {limitacions.map((l) => <li key={l.codi}>{missatgeDeLimitacioLocal(t, l.codi)}</li>)}
                </ul>
              </Alerta>
            ) : null}
            <div className="sdp-arxiu-local__fila">
              {progresHash ? (
                <>
                  <Progres
                    className="sdp-arxiu-local__progres"
                    etiqueta={tr(T['hash.calculant'], { n: progresHash.fets, total: progresHash.total })}
                    valor={progresHash.fets}
                    max={Math.max(1, progresHash.total)}
                  />
                  <Boto icona={Square} onClick={gestor.aturaHash}>{tr(T['hash.atura'])}</Boto>
                </>
              ) : (
                <Boto icona={ShieldCheck} disabled={entrades.length === 0} onClick={gestor.verificaDuplicats}>{tr(T['hash.verifica'])}</Boto>
              )}
            </div>
            {duplicats ? (
              <div role="status" className="sdp-arxiu-local__resultat">
                <p>
                  {duplicats.grups.length > 0 || duplicats.cancellat
                    ? tr(T['hash.resultat'], { n: duplicats.grups.length })
                    : tr(T['hash.cap'])}
                </p>
                {duplicats.cancellat ? <p>{tr(T['hash.aturada'])}</p> : null}
                {duplicats.truncat ? (
                  <p>{tr(T['hash.truncat'], { fitxers: PRESSUPOST_DUPLICATS.maxFitxers, pes: formatKb(PRESSUPOST_DUPLICATS.maxBytes, locale) })}</p>
                ) : null}
                {duplicats.omesos.length > 0 ? <p>{tr(T['hash.omesos'], { n: duplicats.omesos.length })}</p> : null}
              </div>
            ) : null}
          </section>

          {autonom ? (
            <div className="sdp-arxiu-local__explorador">
              <ArbreCarpetesLocals
                t={t}
                carpetes={carpetes}
                comptes={comptes}
                total={analisi.resum.totalFitxers}
                activa={carpeta}
                onTria={onTriaCarpeta}
              />
              {principal()}
            </div>
          ) : principal()}
        </>
      ) : null}
    </>
  );

  function principal() {
    const triaFitxer = autonom ? onTriaArxiu : (el) => onTriaArxiu?.(el);
    const llista = filtrats.length === 0 ? (
      <p>{carpetaBuida ? tr(T.carpetaBuida) : tr(T.buit)}</p>
    ) : vista === 'taula' ? (
      <TaulaArxiusLocals
        t={t}
        elements={pag.elements}
        seleccionat={seleccionat}
        exactes={exactes}
        onSelecciona={triaFitxer}
        registraTessela={registraTessela}
        ambEstat={autonom}
      />
    ) : (
      <GraellaAlbumLocal
        key={autonom ? undefined : clauDeMiniatures(pag.elements)}
        t={t}
        font={font}
        elements={pag.elements}
        seleccionat={seleccionat}
        exactes={exactes}
        onSelecciona={triaFitxer}
        registraTessela={registraTessela}
        ambEstat={autonom}
      />
    );
    return (
      <div className="sdp-arxiu-local__principal">
        <div className="sdp-arxiu-local__panell sdp-arxiu-local__filtres">
          <PillToggle
            className="sdp-arxiu-local__pindola"
            etiqueta={tr(T['filtre.estat'])}
            valor={filtreEstat}
            onCanvi={(valor) => {
              gestor.setFiltreEstat(valor);
              triaPagina(1);
            }}
            opcions={FILTRES_ESTAT.map(([valor, clau]) => ({ valor, text: tr(T[clau]) }))}
          />
          <div className="sdp-arxiu-local__controls">
            <Camp etiqueta={tr(T['filtre.tipus'])}>
              <Selector
                opcions={[
                  { valor: 'tots', etiqueta: tr(T['tipus.tots']) },
                  ...TIPUS.map(([valor, clau]) => ({ valor, etiqueta: tr(T[clau]) }))
                ]}
                value={filtreTipus}
                onChange={(event) => {
                  gestor.setFiltreTipus(event.target.value);
                  triaPagina(1);
                }}
              />
            </Camp>
            <Camp etiqueta={tr(T.cerca)}>
              <CampText
                tipus="search"
                value={cerca}
                autoComplete="off"
                onChange={(event) => {
                  gestor.setCerca(event.target.value);
                  triaPagina(1);
                }}
              />
            </Camp>
          </div>
          <PillToggle
            className="sdp-arxiu-local__pindola"
            etiqueta={tr(T.vista)}
            valor={vista}
            onCanvi={(valor) => {
              gestor.setVista(valor);
              triaPagina(1);
            }}
            opcions={[
              { valor: 'graella', text: tr(T['vista.graella']) },
              { valor: 'taula', text: tr(T['vista.taula']) }
            ]}
          />
        </div>

        {potEscriure ? (
          <AccionsCarpetaLocal
            t={t}
            font={font}
            carpeta={carpeta}
            nomVolum={nomVolum}
            buida={carpetaBuida}
            onFet={onFet}
            onNouFitxer={gestor.enNouFitxer}
          />
        ) : null}

        <div className={elSeleccionat ? 'sdp-arxiu-local__cos sdp-arxiu-local__cos--amb-detall' : 'sdp-arxiu-local__cos'}>
          <section className="sdp-arxiu-local__fitxers" aria-labelledby={idFitxers}>
            <h3 id={idFitxers} ref={titolFitxersRef} tabIndex={-1}>{tr(T.fitxers, { n: filtrats.length })}</h3>
            <p role="status" className="sdp-nomes-lector">{anunciRecompte}</p>
            {llista}
            {pag.pagines > 1 ? (
              <nav className="sdp-arxiu-local__paginacio" aria-label={tr(T.paginacio)}>
                <Boto icona={ChevronLeft} disabled={pag.pagina <= 1} onClick={() => triaPagina(pag.pagina - 1)}>{tr(T.anterior)}</Boto>
                <p aria-live="polite">{tr(T.pagina, { n: pag.pagina, total: pag.pagines })}</p>
                <Boto icona={ChevronRight} disabled={pag.pagina >= pag.pagines} onClick={() => triaPagina(pag.pagina + 1)}>{tr(T.seguent)}</Boto>
              </nav>
            ) : null}
          </section>
          {elSeleccionat ? (
            <DetallArxiuLocal
              key={`${elSeleccionat.ruta}\u0000${versioDetall}`}
              t={t}
              font={font}
              el={elSeleccionat}
              potEscriure={potEscriure}
              carpetes={carpetes}
              nomVolum={nomVolum}
              pobles={pobles}
              blocDeNotes={blocDeNotes}
              exactes={exactes}
              bloquejat={canvisPendents}
              onTanca={onTancaDetall}
              onCanvisPendents={gestor.marcaCanvis}
              onFet={onFet}
              onNouFitxer={gestor.enNouFitxer}
              onDesat={gestor.enDesatText}
            />
          ) : null}
        </div>
      </div>
    );
  }

  if (!autonom) return <div className="sdp-arxiu-local">{cos}</div>;
  return (
    <section className="sdp-arxiu-local" aria-labelledby={idTitol}>
      <header className="sdp-arxiu-local__capcalera">
        <h2 id={idTitol}>{tr(T.titol)}</h2>
        <p>{tr(T.entradeta)}</p>
      </header>
      {cos}
      <DialegDescartaLocal gestor={gestor} t={t} />
    </section>
  );
}

/**
 * El Gestor autònom: el panell amb arbre propi i detall en línia, amb el seu
 * estat de selecció (carpeta i arxiu). El de les proves del Gestor i el banc
 * de proves de la peça; /multimedia fa servir les tres columnes.
 */
export function GestorMultimediaLocal({ blocDeNotes = null, pobles = MOCK_TOWNS, t = traduccioDeReserva, ...opcions }) {
  const [seleccio, setSeleccio] = useState(SELECCIO_BUIDA);
  const seleccioRef = useRef(seleccio);
  seleccioRef.current = seleccio;
  const onSeleccio = useCallback((canvi) => {
    setSeleccio((abans) => (canvi?.portada ? SELECCIO_BUIDA : {
      carpeta: canvi?.carpeta !== undefined ? canvi.carpeta : abans.carpeta,
      ruta: canvi?.ruta !== undefined ? canvi.ruta : abans.ruta
    }));
  }, []);
  const gestor = useGestorArxiusLocals({ ...opcions, t, seleccioRef, onSeleccio });
  const { carpeta: carpetaActiva, ruta: seleccionat } = seleccio;
  const { font, carpetes, elementDe, demanaCanvi, descartaCanvis } = gestor;
  const titolFitxersRef = useRef(null);
  const tesseles = useRef(new Map());
  const focusTornada = useRef(null);
  const elSeleccionat = seleccionat ? elementDe(seleccionat) : null;

  /* Una carpeta o una selecció que ja no hi són (moguda, esborrada des de fora) es deixen. */
  useEffect(() => {
    if (carpetaActiva && font && !carpetes.includes(carpetaActiva)) setSeleccio((abans) => ({ ...abans, carpeta: '' }));
  }, [carpetaActiva, carpetes, font]);
  useEffect(() => {
    if (seleccionat && font && !elSeleccionat) {
      setSeleccio((abans) => ({ ...abans, ruta: null }));
      descartaCanvis();
    }
  }, [seleccionat, font, elSeleccionat, descartaCanvis]);

  /* En tancar el detall, el focus torna a la tessel·la (o al títol de «Fitxers»). */
  useEffect(() => {
    if (seleccionat !== null || focusTornada.current === null) return;
    const ruta = focusTornada.current;
    focusTornada.current = null;
    const node = tesseles.current.get(ruta);
    (node?.isConnected ? node : titolFitxersRef.current)?.focus();
  }, [seleccionat]);

  const registraTessela = useCallback((ruta, node) => {
    if (node) tesseles.current.set(ruta, node);
    else tesseles.current.delete(ruta);
  }, []);

  const selecciona = (el) => {
    if (el.ruta === seleccionat) return;
    demanaCanvi(() => setSeleccio((abans) => ({ ...abans, ruta: el.ruta })));
  };

  const tancaDetall = () => demanaCanvi(() => {
    focusTornada.current = seleccionat;
    setSeleccio((abans) => ({ ...abans, ruta: null }));
  });

  const triaCarpeta = (ruta) => {
    setSeleccio((abans) => ({ ...abans, carpeta: ruta }));
    gestor.triaPagina(ruta, 1);
  };

  /* El resultat d'una operació: si deixa el detall, el focus torna a la tessel·la. */
  const enFet = (resultat = {}) => {
    if (resultat?.seleccio === null) focusTornada.current = seleccionat;
    gestor.enFet(resultat);
  };

  return (
    <PanellGestorLocal
      autonom
      gestor={gestor}
      t={t}
      carpeta={carpetaActiva}
      seleccionat={seleccionat}
      onTriaArxiu={selecciona}
      onTriaCarpeta={triaCarpeta}
      onTancaDetall={tancaDetall}
      onFet={enFet}
      pobles={pobles}
      blocDeNotes={blocDeNotes}
      registraTessela={registraTessela}
      titolFitxersRef={titolFitxersRef}
    />
  );
}
