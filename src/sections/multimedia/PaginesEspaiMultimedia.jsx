/**
 * PaginesEspaiMultimedia.jsx — Les pàgines de la columna del detall de
 * /multimedia (IDEA-55 + P1-71 · Onada 261029_1605, Bloc E). Cada una és una
 * <UniversalPage chrome="context">, amb la barra blava i la taronja:
 *
 *   · PortadaMultimedia (`__intro`): «Arxiu visual», l'Accés ràpid a les
 *     galeries, la Barra de volums, les Accions de l'arrel, el commutador
 *     Graella/Taula i la graella (la de l'arrel local si hi ha un volum obert;
 *     si no, la Fototeca publicada).
 *   · VistaGaleria (la vista d'una galeria publicada o d'un mes): commutador i
 *     graella `.photo-grid` (Cella) o taula; la Cronologia, per mesos.
 *   · FitxaWeb (una imatge publicada): la imatge, «Veure la imatge a pantalla
 *     completa» (el visor) i les seues dades.
 *   · VistaCarpetaLocal (la vista d'una carpeta local): el panell del Gestor
 *     (Barra, diagnòstic i SHA-256, filtres, Accions i Fototeca o taula).
 *   · FitxaLocal (un arxiu local): el detall polimòrfic incrustat, el
 *     comparador amb la web i les accions de carpeta.
 *
 * Privadesa: a les pàgines LOCALS (i a la portada, que en pinta noms) cap text
 * ix del navegador: sense Traduir (traduccio={false}) i, a les locals, sense
 * Comentar, Compartir ni Connectar (el nom del fitxer aniria al servidor). Les
 * galeries i les fitxes publicades els porten. Gauntlet 261029 (cicle 1) · Les
 * locals, i la portada amb una font oberta, tampoc no escriuen ?seccio= (el
 * slug de l'Índex es fa del text: «Diagnòstic de «carpeta»»), i cada pàgina
 * passa `refTitol` a l'H1: navegar des del detall hi porta el focus.
 *
 * Només exporta components (Fast Refresh): DetallEspaiMultimedia tria la
 * pàgina a partir de la selecció efectiva que li passa MultimediaSection.
 */
import { useCallback, useId } from 'react';
import { CalendarDays, Images, Maximize2, Sparkles } from 'lucide-react';
import { Link, useNavigate } from '../../app/contexts/RouterContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { Boto, PillToggle, Taula } from '../../components/PedraSeca/index.js';
import { COPYRIGHT_SDP, dataHoraDeBarra } from '../../components/universal/editorial.js';
import { gestionaTeclaGraella } from '../../components/universal/workspace/navegacioTeclat.js';
import { resolRecursPropi } from '../../config/assetResolver.js';
import { objecteDe, rutaConnectarObjecte } from '../../config/navigation.js';
import { esMitjaOpac } from '../../utils/mitjaOpac.js';
import { esElementPublic, totsPublics } from '../../components/universal/traduccio/visibilitatTraduible.js';
import { MOCK_TOWNS } from '../pobles/townsSeed.js';
import {
  ARREL_LOCAL, GALERIA_CRONOLOGIA, GALERIA_IAIA, GALERIA_TOTS, ITEM_PORTADA, PREFIX_ARXIU_LOCAL, categoriaDeVista, esIdLocal,
  subtitolLocal
} from './arbreMultimedia.js';
import { SENSE_DATA, dataDelMitja, etiquetaDelMes } from './cronologia.js';
import { AccionsCarpetaLocal } from './AccionsCarpetaLocal.jsx';
import { DetallArxiuLocal } from './DetallArxiuLocal.jsx';
import { MissatgeLocal, PanellGestorLocal } from './GestorMultimediaLocal.jsx';
import { formatKb } from './motorMultimediaLocal.js';
import { esFotoDePersona } from './origenImatges.js';
import { filesDelPanell, formataDataHora } from './panellDeLaFoto.js';
import { nomVisibleLocal } from './suportGestorLocal.js';
import { TEXTOS_ESPAI as E, segonsNombre } from './textosEspaiMultimedia.js';
import { TEXTOS_LOCAL as T, tradueix } from './textosGestorLocal.js';
import { useMetadadesFoto } from './useMetadadesFoto.js';

const CAP = Object.freeze([]);
/* Les files del panell del visor que la fitxa ja porta a la barra blava. */
const FILES_DE_LA_BARRA = new Set(['comentar', 'connectar']);
/* Gauntlet 261029 (cicle 1) · I sense ?seccio= (seccioALaUrl): l'Índex hi
   escrivia el slug d'un encapçalament local («Diagnòstic de «Carpeta»»), que
   anava a l'historial i, des d'una altra pàgina, a Compartir i a /connectar. */
const SENSE_ACCIONS_DE_XARXA = Object.freeze({ onConnect: false, onComment: false, showShare: false, traduccio: false, seccioALaUrl: false });

const textNet = (valor) => (typeof valor === 'string' ? valor.trim() : '');
const isoDeMs = (ms) => (Number.isFinite(Number(ms)) && Number(ms) > 0 ? new Date(Number(ms)).toISOString() : null);
const nomDeRuta = (ruta) => ruta.slice(ruta.lastIndexOf('/') + 1);

/* La cel·la de la Fototeca publicada: un botó (la fitxa de la imatge, a la
   columna del detall) amb la cel·la de sempre a dins. Llei del Píxel
   (revisió adversarial del 261016): el botó és un embolcall transparent i la
   cel·la (.photo-grid__item, la caixa quadrada que creix fins a contindre la
   foto) va a dins; un <button> amb la classe de la cel·la no creixia
   (modules.css, LES CEL·LES DE L'ARXIU VISUAL). */
export function Cella({ item, onObri, t }) {
  return (
    <button type="button" className="photo-grid__boto" onClick={() => onObri(item)}>
      <span className="photo-grid__item">
        {/* T5 · El src es resol en pintar-lo: incrustat, un '/assets/…' penja del paquet. Sense base, el de sempre. */}
        {item.src ? (
          <img src={resolRecursPropi(item.src)} alt={item.title || item.tag} loading="lazy" onError={(e) => { e.target.style.display = 'none'; }} />
        ) : (
          <div className="media-frame__buit">
            <span className="sdp-sr-only">{item.title || tradueix(t, E.senseImatge)}</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          </div>
        )}
      </span>
    </button>
  );
}

/* La taula de la Fototeca publicada: el nom obri la fitxa. */
function TaulaCataleg({ t, membres, onObri }) {
  const tr = (parell, valors) => tradueix(t, parell, valors);
  return (
    <Taula titol={tr(T['vista.taula'])} densa>
      <thead>
        <tr>
          <th scope="col">{tr(T['col.nom'])}</th>
          <th scope="col">{tr(E.colFont)}</th>
          <th scope="col">{tr(E.colData)}</th>
        </tr>
      </thead>
      <tbody>
        {membres.map((m) => (
          <tr key={String(m.id)}>
            <td>
              <button type="button" className="sdp-boto sdp-boto--fantasma" onClick={() => onObri(m)}>
                {textNet(m.title) || textNet(m.tag) || tr(E.senseTitol)}
              </button>
            </td>
            <td>{textNet(m.tag) || textNet(m.source) || '—'}</td>
            <td>{formataDataHora(dataDelMitja(m)) || '—'}</td>
          </tr>
        ))}
      </tbody>
    </Taula>
  );
}

/* Commutador Graella/Taula i la graella d'una galeria publicada (o la Cronologia, per mesos). */
function GaleriaWeb({ espai, categoria, membres }) {
  const { t, locale, cataleg, vistaWeb, setVistaWeb, navega, textosModel } = espai;
  const tr = (parell, valors) => tradueix(t, parell, valors);
  const obri = (item) => navega(categoria, String(item.id));
  let graella;
  if (membres.length === 0) graella = <p>{tr(E.senseImatges)}</p>;
  else if (vistaWeb === 'taula') graella = <TaulaCataleg t={t} membres={membres} onObri={obri} />;
  else if (categoria === GALERIA_CRONOLOGIA) {
    graella = (
      <div className="stack-grid">
        {cataleg.grupsMes.map((grup) => (
          <section key={grup.key} className="card--soft">
            <div className="card__body">
              <div className="notes-list-header">
                <h3>{grup.key === SENSE_DATA ? t('section.multimedia.senseData', 'Sense data') : (etiquetaDelMes(grup.key, locale, textosModel?.calendari) || grup.label)}</h3>
                <span className="pill">{tr(segonsNombre(grup.items.length, E.elements, E.elementsUn), { n: grup.items.length })}</span>
              </div>
              {/* IDEA-58 · Fletxes 2D (gestionaTeclaGraella): cada mes és una graella independent. */}
              <div className="photo-grid" data-graella-teclat="" onKeyDown={gestionaTeclaGraella}>
                {grup.items.map((item) => <Cella key={item.id} item={item} onObri={obri} t={t} />)}
              </div>
            </div>
          </section>
        ))}
      </div>
    );
  } else {
    graella = (
      <div className="photo-grid" data-graella-teclat="" onKeyDown={gestionaTeclaGraella}>
        {/* Ordre del Mestre (18-10-2026) · La clau és l'id de la foto (únic), mai la posició.
            IDEA-58 · Fletxes 2D: → ← ±1, ↓ ↑ la fila (columnes per geometria), Inici, Fi. */}
        {membres.map((item) => <Cella key={item.id} item={item} onObri={obri} t={t} />)}
      </div>
    );
  }
  return (
    <>
      <PillToggle
        className="sdp-arxiu-local__pindola"
        etiqueta={tr(T.vista)}
        valor={vistaWeb}
        onCanvi={setVistaWeb}
        opcions={[
          { valor: 'graella', text: tr(T['vista.graella']) },
          { valor: 'taula', text: tr(T['vista.taula']) }
        ]}
      />
      {graella}
    </>
  );
}

/* El panell del Gestor en mode espai: triar un fitxer porta a la seua fitxa. */
function PanellLocal({ espai, carpeta, barra = null }) {
  const { gestor, navega, idCarpeta, idArxiu, blocDeNotes } = espai;
  return (
    <PanellGestorLocal
      gestor={gestor}
      carpeta={carpeta}
      barra={barra}
      blocDeNotes={blocDeNotes}
      pobles={MOCK_TOWNS}
      onTriaArxiu={(el) => navega(idCarpeta(el.carpeta || ''), idArxiu(el.ruta))}
    />
  );
}

export function PortadaMultimedia({ espai }) {
  const { t, gestor, cataleg, navega } = espai;
  const tr = (parell, valors) => tradueix(t, parell, valors);
  const id = useId();
  const { propsBarra } = gestor;
  /* Vincular, triar un volum o reconnectar porten primer a «Carpeta local»
     (síncron) i després fan l'acció: el permís continua sent la primera
     espera del clic. */
  const barra = {
    onVincula: () => {
      navega(ARREL_LOCAL);
      propsBarra.onVincula();
    },
    onTria: (volum) => {
      navega(ARREL_LOCAL);
      propsBarra.onTria(volum);
    },
    onReconnecta: (volum) => {
      navega(ARREL_LOCAL);
      propsBarra.onReconnecta(volum);
    }
  };
  return (
    <UniversalPage
      chrome="context"
      title={t('section.multimedia.title', 'Arxiu visual')}
      subtitle={tr(E.portadaSubtitol)}
      lead={tr(E.portadaEntradeta)}
      labels={[{ text: t('section.multimedia.kicker', 'Multimèdia'), className: 'sdp-badge-system' }]}
      copyright={COPYRIGHT_SDP}
      showLogos
      traduccio={false}
      refTitol={espai.refTitol}
      /* Amb una font oberta, el panell porta «Diagnòstic de «nom»»: cap slug local a ?seccio=. */
      seccioALaUrl={!gestor.font}
    >
      <div className="sdp-espai-multimedia__cos">
        <section className="sdp-arxiu-local__panell" aria-labelledby={`${id}-acces`}>
          <h3 id={`${id}-acces`}>{tr(E.accesRapid)}</h3>
          <div className="sdp-arxiu-local__fila">
            <Boto icona={Images} onClick={() => navega(GALERIA_TOTS)}>
              {tr(E.ambRecompte, { nom: tr(E.galeriaTots), n: cataleg.totes.length })}
            </Boto>
            <Boto icona={Sparkles} onClick={() => navega(GALERIA_IAIA)}>
              {tr(E.ambRecompte, { nom: tr(E.galeriaIaia), n: cataleg.deLaIaia.length })}
            </Boto>
            <Boto icona={CalendarDays} onClick={() => navega(GALERIA_CRONOLOGIA)}>
              {tr(E.ambRecompte, { nom: tr(E.cronologia), n: tr(segonsNombre(cataleg.grupsMes.length, E.mesos, E.mesosUn), { n: cataleg.grupsMes.length }) })}
            </Boto>
          </div>
        </section>
        <PanellLocal espai={espai} carpeta="" barra={barra} />
        {gestor.volumObert ? null : <GaleriaWeb espai={espai} categoria={GALERIA_TOTS} membres={cataleg.totes} />}
      </div>
    </UniversalPage>
  );
}

export function VistaGaleria({ espai, categoria }) {
  const { t, cataleg, membresDe, etiquetaDe } = espai;
  const tr = (parell, valors) => tradueix(t, parell, valors);
  const membres = membresDe(categoria);
  return (
    <UniversalPage
      chrome="context"
      title={etiquetaDe(categoria)}
      subtitle={categoria === GALERIA_CRONOLOGIA
        ? tr(segonsNombre(cataleg.grupsMes.length, E.mesos, E.mesosUn), { n: cataleg.grupsMes.length })
        : tr(segonsNombre(membres.length, E.imatges, E.imatgesUn), { n: membres.length })}
      labels={[{ text: tr(E.publicada), className: 'sdp-badge-system' }]}
      showLogos
      refTitol={espai.refTitol}
      /* Gauntlet 261030 (Fase 3, TC3.2) · Traduir només si totes les imatges
         que es veuen són públiques (la Cronologia, totes les publicades). */
      traduccio={totsPublics(categoria === GALERIA_CRONOLOGIA ? cataleg.totes : membres)}
    >
      <div className="sdp-espai-multimedia__cos">
        <GaleriaWeb espai={espai} categoria={categoria} membres={membres} />
      </div>
    </UniversalPage>
  );
}

export function FitxaWeb({ espai, item }) {
  const { t, cens, obriVisor, visorObert } = espai;
  const tr = (parell, valors) => tradueix(t, parell, valors);
  const id = useId();
  const navigate = useNavigate();
  const { towns = CAP } = useCoreContent();
  const persona = esFotoDePersona(item, cens);
  /* Amb el visor obert (la mateixa foto, damunt), la lectura de l'EXIF és
     seua: la fitxa la reprén en tancar-lo (memòria de useMetadadesFoto). */
  const { estat, exif } = useMetadadesFoto(visorObert ? null : (item.src || null), { persona });
  const nomDelPoble = (slug) => towns.find((town) => String(town?.id) === slug)?.title || null;
  const files = filesDelPanell(item, { exif, estatExif: estat, mides: null, estatMides: 'sense', persona, cens, nomDelPoble, t })
    .filter((fila) => !FILES_DE_LA_BARRA.has(fila.clau));
  const objecte = objecteDe(item, 'multimedia');
  const titol = textNet(item.title) || textNet(item.tag) || tr(E.senseTitol);
  const src = typeof item.src === 'string' && item.src && !esMitjaOpac(item.src) ? item.src : null;
  const subtitol = textNet(item.tag) || textNet(item.source) || undefined;
  return (
    <UniversalPage
      chrome="context"
      title={titol}
      subtitle={subtitol}
      labels={[{ text: tr(E.publicada), className: 'sdp-badge-system' }]}
      heroImage={src || undefined}
      heroAlt={titol}
      showLogos
      objecte={objecte}
      onConnect={() => navigate(rutaConnectarObjecte(objecte))}
      refTitol={espai.refTitol}
      /* Gauntlet 261030 (Fase 3, TC3.2) · Traduir només amb una imatge
         pública: una del veïnat (section_submissions, només per als membres)
         no ix cap al motor (traduccio/visibilitatTraduible.js). */
      traduccio={esElementPublic(item)}
      {...dataHoraDeBarra({ creat: textNet(item.created_at) || null })}
    >
      <div className="sdp-espai-multimedia__cos">
        {/* H1 → H2 → h3 (Gauntlet 261029, cicle 1): sense etiqueta ni font no hi ha
            subtítol; un h2 només per al lector (fora de l'Índex: sr-only) en fa les voltes. */}
        {subtitol ? null : <h2 className="sr-only">{tr(E.publicada)}</h2>}
        <div className="sdp-arxiu-local__fila">
          <Boto icona={Maximize2} onClick={() => obriVisor(item)}>
            {t('section.multimedia.visor.obri', 'Veure la imatge a pantalla completa')}
          </Boto>
        </div>
        <section aria-labelledby={`${id}-dades`}>
          <h3 id={`${id}-dades`}>{tr(E.dadesFoto)}</h3>
          <dl className="sdp-arxiu-local__dades">
            {files.map((fila) => (
              <div key={fila.clau} className="sdp-arxiu-local__dada">
                <dt>{fila.etiqueta}</dt>
                <dd>{fila.ruta ? <Link to={fila.ruta}>{fila.valor}</Link> : fila.valor}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </UniversalPage>
  );
}

export function VistaCarpetaLocal({ espai, categoria }) {
  const { t, locale, gestor, index } = espai;
  const tr = (parell, valors) => tradueix(t, parell, valors);
  const ruta = index?.carpetaDeId.get(categoria) ?? '';
  const prefix = ruta ? `${ruta}/` : '';
  let n = 0;
  let pes = 0;
  let ms = 0;
  for (const el of gestor.analisi.elements) {
    if (prefix && !el.ruta.startsWith(prefix)) continue;
    n += 1;
    pes += Number(el.mida) || 0;
    if (Number(el.modificat) > ms) ms = Number(el.modificat);
  }
  const titol = nomVisibleLocal(ruta ? nomDeRuta(ruta) : (gestor.volumObert && gestor.nomVolum) || tr(E.local));
  return (
    <UniversalPage
      chrome="context"
      title={titol}
      subtitle={gestor.volumObert ? tr(segonsNombre(n, E.arxius, E.arxiusUn), { n, pes: formatKb(pes, locale) }) : undefined}
      labels={[{ text: tr(T.pestanya), className: 'sdp-badge-system' }]}
      showLogos
      refTitol={espai.refTitol}
      {...SENSE_ACCIONS_DE_XARXA}
      {...dataHoraDeBarra({ modificat: isoDeMs(ms) })}
    >
      <div className="sdp-espai-multimedia__cos">
        {/* H1 → H2 → h3 (Gauntlet 261029, cicle 1): sense volum obert no hi ha subtítol; el
            títol del Gestor, només per al lector (fora de l'Índex: sr-only), en fa les voltes. */}
        {gestor.volumObert ? null : <h2 className="sr-only">{tr(T.titol)}</h2>}
        <PanellLocal espai={espai} carpeta={ruta} />
      </div>
    </UniversalPage>
  );
}

export function FitxaLocal({ espai, el }) {
  const { t, locale, gestor, textosModel, blocDeNotes } = espai;
  const tr = (parell, valors) => tradueix(t, parell, valors);
  const { marcaCanvis, font, potEscriure, carpetes, nomVolum, exactes, canvisPendents, versioDetall } = gestor;
  const ruta = el.ruta;
  /* L'editor diu de quina ruta són els canvis: si la persona canvia de fitxa,
     el text es queda «congelat» en esta fins que decidix. */
  const marca = useCallback((valor) => marcaCanvis(valor, ruta), [marcaCanvis, ruta]);
  const parella = el.tipus === 'imatge' && el.emparelladaWeb && typeof el.parellaWeb?.src === 'string' ? el.parellaWeb.src : '';
  const srcWeb = parella && !esMitjaOpac(parella) ? resolRecursPropi(parella) : '';
  const comparador = srcWeb
    ? { titol: tr(E.comparador), original: tr(E.originalLocal, { pes: formatKb(el.mida, locale) }), web: tr(E.webPublicada), srcWeb }
    : null;
  const tipus = T[`tipus.${el.tipus}`] || T['tipus.altre'];
  return (
    <UniversalPage
      chrome="context"
      title={nomVisibleLocal(el.nom)}
      subtitle={subtitolLocal(el, exactes, textosModel, locale)}
      labels={[{ text: tr(T.pestanya), className: 'sdp-badge-system' }, { text: tr(tipus), className: 'sdp-badge-category' }]}
      showLogos
      refTitol={espai.refTitol}
      {...SENSE_ACCIONS_DE_XARXA}
      {...dataHoraDeBarra({ modificat: isoDeMs(el.modificat) })}
    >
      <div className="sdp-espai-multimedia__cos">
        <MissatgeLocal gestor={gestor} t={t} />
        <DetallArxiuLocal
          key={`${ruta}\u0000${versioDetall}`}
          incrustat
          titolIncrustat={tr(E.fitxaArxiu)}
          comparador={comparador}
          t={t}
          font={font}
          el={el}
          potEscriure={potEscriure}
          carpetes={carpetes}
          nomVolum={nomVolum}
          pobles={MOCK_TOWNS}
          blocDeNotes={blocDeNotes}
          exactes={exactes}
          bloquejat={canvisPendents}
          onCanvisPendents={marca}
          onFet={gestor.enFet}
          onNouFitxer={gestor.enNouFitxer}
          onDesat={gestor.enDesatText}
        />
        {potEscriure ? (
          <AccionsCarpetaLocal
            t={t}
            font={font}
            carpeta={el.carpeta || ''}
            nomVolum={nomVolum}
            buida={false}
            bloquejat={canvisPendents}
            onFet={(resultat) => gestor.enFet({ ...resultat, carpeta: undefined })}
            onNouFitxer={gestor.enNouFitxer}
          />
        ) : null}
      </div>
    </UniversalPage>
  );
}

/**
 * La pàgina de la columna del detall per a la selecció efectiva. Amb text
 * sense desar en un arxiu que ja no és el triat (QA-A04: un clic a una altra
 * fitxa o carpeta, Arrere o Avant), es queda la MATEIXA FitxaLocal (la mateixa
 * clau): React conserva l'editor amb el text mentre la persona decidix.
 */
export function DetallEspaiMultimedia({ espai }) {
  const { seleccio, gestor, mitjaDe } = espai;
  const elBrut = gestor.rutaBruta ? gestor.elementDe(gestor.rutaBruta) : null;
  if (elBrut && seleccio.local?.ruta !== elBrut.ruta) return <FitxaLocal key={`local:${elBrut.ruta}`} espai={espai} el={elBrut} />;
  const itemId = seleccio.itemId;
  if (!itemId || itemId === ITEM_PORTADA) return <PortadaMultimedia key="portada" espai={espai} />;
  const deVista = categoriaDeVista(itemId);
  if (deVista) {
    return esIdLocal(deVista)
      ? <VistaCarpetaLocal key={`carpeta:${deVista}`} espai={espai} categoria={deVista} />
      : <VistaGaleria key={`galeria:${deVista}`} espai={espai} categoria={deVista} />;
  }
  if (itemId.startsWith(PREFIX_ARXIU_LOCAL)) {
    const el = gestor.elementDe(seleccio.local?.ruta);
    return el ? <FitxaLocal key={`local:${el.ruta}`} espai={espai} el={el} /> : null;
  }
  const item = mitjaDe(itemId);
  return item ? <FitxaWeb key={`web:${itemId}`} espai={espai} item={item} /> : null;
}
