/**
 * DetallArxiuLocal.jsx — El detall polimòrfic d'un arxiu local (IDEA-55 ·
 * Onada 261029_1605): imatge (EXIF, GPS i proposta de poble; laboratori WebP
 * per a png/jpg/jpeg), SVG, text editable, codi de només lectura, àudio,
 * vídeo, PDF i la resta (només descàrrega). Sota, les operacions al disc.
 *
 * Seguretat (decisions.md, critic.md §seguretat):
 *   · blob: només amb un MIME de la llista blanca (urlsArxiuLocal.visor); la
 *     descàrrega, sempre com a application/octet-stream.
 *   · SVG: només `data:` dins d'un <img> (on no s'executa res); la seua font,
 *     com a text. HTML, CSS, JS, XML, VCF i LOG: text pla, mai renderitzats.
 *   · PDF: cap <iframe>, <object> ni <embed> (la CSP no admet blob: a
 *     frame-src): un enllaç per a obrir-lo en una pestanya nova, després de
 *     comprovar la signatura «%PDF-».
 *   · Cada detall (un per ruta) té el seu registre de blob:, que es tanca en
 *     canviar de selecció o en desmuntar: una resposta tardana no deixa res.
 *
 * IDEA-55 + P1-71 (Onada 261029_1605, Bloc E) · `incrustat`: dins de la fitxa
 * d'una UniversalPage (la columna del detall de /multimedia), sense la seua
 * capçalera (el nom ja és l'H1 de la pàgina i «Tancar» no hi té sentit), amb
 * un h3 `titolIncrustat` (H1 → H2 → h3 → h4) i SENSE posar el focus en
 * muntar (faria saltar la pàgina per damunt de les barres). `comparador`
 * ({ titol, original, web, srcWeb }): l'original local al costat de la seua
 * parella publicada, amb la MATEIXA URL blob: del detall (cap segona lectura
 * del disc). Sense estes props, el DOM de sempre.
 *
 * Gauntlet 261029 (cicle 1) · `onDesat(ruta)`: el desat de l'editor (el gestor
 * n'actualitza només l'entrada, sense tornar a recórrer el volum); sense,
 * onFet({ seleccio }). Els noms i la ruta es pinten amb nomVisibleLocal.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Download, ExternalLink, X } from 'lucide-react';
import { Alerta, Boto, Carregant } from '../../components/PedraSeca/index.js';
import {
  EXTENSIONS_RASTER_CONVERTIBLE, MAX_BYTES_SVG_DATA, esBytesPdf, formatKb, inspeccionaImatgeLocal, llegixTextLocal,
  suggerixPobleLocal
} from './motorMultimediaLocal.js';
import { formataCamera, formataDataHora, formataGps } from './panellDeLaFoto.js';
import { EditorTextLocal } from './EditorTextLocal.jsx';
import { LaboratoriWebpLocal } from './LaboratoriWebpLocal.jsx';
import { OperacionsArxiuLocal } from './OperacionsArxiuLocal.jsx';
import { PropostaPobleLocal } from './PropostaPobleLocal.jsx';
import { dataCurtaLocal, nomVisibleLocal } from './suportGestorLocal.js';
import { TEXTOS_LOCAL as T, missatgeDErrorLocal, tradueix } from './textosGestorLocal.js';
import { creaUrlsArxiuLocal } from './urlsArxiuLocal.js';
import { useLocaleOpcional } from './useLocaleOpcional.js';

/* El que cal per a pintar cada vista (sense el text editable, que el llig l'editor). */
async function carregaVista(font, ruta, vista, blob, urls) {
  if (vista === 'imatge' || vista === 'svg') {
    const info = await inspeccionaImatgeLocal(font, ruta);
    if (vista === 'svg') {
      const fontSvg = info.bytes.byteLength <= MAX_BYTES_SVG_DATA ? new TextDecoder('utf-8').decode(info.bytes) : null;
      return { src: info.dataUrl, fontSvg, exif: null, massaGran: !info.dataUrl };
    }
    return { src: urls.visor(info.blob), exif: info.exif };
  }
  if (vista === 'audio' || vista === 'video') return { src: urls.visor(blob) };
  if (vista === 'pdf') {
    const cap = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
    return esBytesPdf(cap) ? { src: urls.visor(blob) } : { src: null, noPdf: true };
  }
  if (vista === 'codi') {
    const llegit = await llegixTextLocal(font, ruta);
    return { text: llegit.text };
  }
  return {};
}

function Exif({ t, exif }) {
  const tr = (parell, valors) => tradueix(t, parell, valors);
  const files = [
    ['data', T['detall.data'], formataDataHora(exif?.dataCaptura)],
    ['camera', T['detall.camera'], formataCamera(exif?.camera)],
    ['autor', T['detall.autor'], typeof exif?.autor === 'string' && exif.autor.trim() ? exif.autor.trim() : null],
    ['gps', T['detall.gps'], formataGps(exif?.gps)]
  ].filter(([, , valor]) => valor);
  return (
    <section className="sdp-arxiu-local__bloc">
      <h4>{tr(T['detall.exif'])}</h4>
      {files.length > 0 ? (
        <dl className="sdp-arxiu-local__dades">
          {files.map(([clau, parell, valor]) => (
            <div key={clau} className="sdp-arxiu-local__dada">
              <dt>{tr(parell)}</dt>
              <dd>{valor}</dd>
            </div>
          ))}
        </dl>
      ) : <p>{tr(T['detall.senseExif'])}</p>}
    </section>
  );
}

function EstatWeb({ t, el, exactes }) {
  const tr = (parell, valors) => tradueix(t, parell, valors);
  const locale = useLocaleOpcional();
  const exacte = exactes?.get?.(el.ruta) || null;
  return (
    <section className="sdp-arxiu-local__bloc">
      <h4>{tr(T['detall.estatWeb'])}</h4>
      <ul className="sdp-arxiu-local__llista">
        <li>
          {el.emparelladaWeb
            ? tr(T['detall.emparellada'], { src: el.parellaWeb?.src || '' })
            : el.inedita ? tr(T['detall.inedita']) : tr(T['detall.suport'])}
        </li>
        {el.bessonaWebpRuta ? (
          <li>{tr(T['detall.teBessona'], { ruta: el.bessonaWebpRuta, pes: formatKb(el.bessonaWebpMida, locale), estalvi: formatKb(el.estalviBytes, locale) })}</li>
        ) : null}
        {el.originalRasterRuta ? (
          <li>{tr(T['detall.esBessona'], { ruta: el.originalRasterRuta, pes: formatKb(el.originalRasterMida, locale) })}</li>
        ) : null}
        {el.coincidenciesMida?.length ? <li>{tr(T['detall.mateixaMida'], { rutes: el.coincidenciesMida.join(', ') })}</li> : null}
        {el.coincidenciesNom?.length ? <li>{tr(T['detall.mateixNom'], { rutes: el.coincidenciesNom.join(', ') })}</li> : null}
        {exacte ? <li>{tr(T['detall.exactes'], { rutes: exacte.altres.join(', ') })}</li> : null}
      </ul>
    </section>
  );
}

export function DetallArxiuLocal({
  t,
  font,
  el,
  potEscriure = false,
  carpetes = [],
  nomVolum = '',
  pobles,
  blocDeNotes = null,
  exactes = null,
  bloquejat = false,
  onTanca,
  onCanvisPendents,
  onFet,
  onNouFitxer,
  onDesat,
  incrustat = false,
  titolIncrustat = '',
  comparador = null
}) {
  const tr = (parell, valors) => tradueix(t, parell, valors);
  const locale = useLocaleOpcional();
  const id = useId();
  const titolRef = useRef(null);
  const [dades, setDades] = useState({ estat: 'carregant' });
  const [mides, setMides] = useState(null);
  const [noReprodueix, setNoReprodueix] = useState(false);
  const ruta = el.ruta;
  const vista = el.vista;

  useEffect(() => {
    if (!incrustat) titolRef.current?.focus();
  }, [incrustat]);

  useEffect(() => {
    let actiu = true;
    const urls = creaUrlsArxiuLocal();
    setDades({ estat: 'carregant' });
    setMides(null);
    setNoReprodueix(false);
    (async () => {
      let blob;
      try {
        blob = await font.fitxer(ruta);
        if (!actiu) return;
      } catch (error) {
        if (actiu) setDades({ estat: 'error', error });
        return;
      }
      try {
        const carregat = await carregaVista(font, ruta, vista, blob, urls);
        if (actiu) setDades({ estat: 'llest', ...carregat });
      } catch (error) {
        if (actiu) setDades({ estat: 'error', error, ambBytes: true });
      }
    })();
    return () => {
      actiu = false;
      urls.tanca();
    };
  }, [font, ruta, vista]);

  /* «Descarregar» (Gauntlet 261029, cicle 1) · font.fitxer és una instantània
     del disc (mida i data): quan l'editor desa (o un altre programa canvia
     l'arxiu obert), Chrome ja no la pot llegir (NotReadableError) i la
     baixada fallava en silenci. L'enllaç es torna a fer quan canvien la mida
     o la data de l'element, i el registre vell es tanca quan el nou ja es
     pinta (o en desmuntar). */
  const mida = el.mida;
  const modificat = el.modificat;
  const [descarrega, setDescarrega] = useState(null);
  const registresDescarrega = useRef([]);
  const tancaDescarreguesVelles = useCallback(() => {
    const vells = registresDescarrega.current;
    registresDescarrega.current = [];
    vells.forEach((urls) => urls.tanca());
  }, []);
  useEffect(() => {
    let actiu = true;
    const urls = creaUrlsArxiuLocal();
    Promise.resolve()
      .then(() => font.fitxer(ruta))
      .then((blob) => {
        if (actiu) setDescarrega(urls.descarrega(blob));
      }, () => {
        if (actiu) setDescarrega(null);
      });
    return () => {
      actiu = false;
      registresDescarrega.current.push(urls);
    };
  }, [font, ruta, mida, modificat]);
  useEffect(() => {
    tancaDescarreguesVelles();
  }, [descarrega, tancaDescarreguesVelles]);
  useEffect(() => tancaDescarreguesVelles, [tancaDescarreguesVelles]);
  /* Com abans: l'enllaç apareix amb la vista (o amb l'error d'una vista que sí que té bytes). */
  const ambDescarrega = Boolean(descarrega) && (dades.estat === 'llest' || dades.ambBytes === true);

  const enCarregar = (event) => {
    const node = event.currentTarget;
    if (node?.naturalWidth && node?.naturalHeight) setMides({ ample: node.naturalWidth, alt: node.naturalHeight });
  };

  const errorText = (error) => (error?.codi === 'FITXER_MASSA_GRAN'
    ? tr(T['detall.massaGran'], { pes: formatKb(el.mida, locale) })
    : missatgeDErrorLocal(t, error));

  let cos = null;
  if (vista === 'text') {
    cos = (
      <EditorTextLocal
        t={t}
        font={font}
        el={el}
        potEscriure={potEscriure}
        blocDeNotes={blocDeNotes}
        nomCarpeta={nomVolum}
        onCanvisPendents={onCanvisPendents}
        onDesat={(desada) => (onDesat ? onDesat(desada) : onFet?.({ seleccio: desada }))}
        onNouFitxer={(nova) => onNouFitxer?.(nova)}
      />
    );
  } else if (dades.estat === 'carregant') {
    cos = <Carregant etiqueta={tr(T['detall.carregant'], { nom: nomVisibleLocal(el.nom) })} />;
  } else if (dades.estat === 'error') {
    cos = <Alerta to="avis">{errorText(dades.error)}</Alerta>;
  } else if (vista === 'imatge' && EXTENSIONS_RASTER_CONVERTIBLE.has(el.ext)) {
    cos = (
      <LaboratoriWebpLocal t={t} font={font} el={el} src={dades.src} potEscriure={potEscriure} onMides={setMides} onFet={onFet} />
    );
  } else if (vista === 'imatge') {
    cos = dades.src ? (
      <figure className="sdp-arxiu-local__figura">
        <img className="sdp-arxiu-local__imatge" src={dades.src} alt={el.nom} onLoad={enCarregar} />
      </figure>
    ) : <p>{tr(T['detall.senseVista'])}</p>;
  } else if (vista === 'svg') {
    cos = (
      <>
        {dades.src ? (
          <figure className="sdp-arxiu-local__figura">
            <img className="sdp-arxiu-local__imatge" src={dades.src} alt={el.nom} onLoad={enCarregar} />
          </figure>
        ) : <p>{tr(T['detall.massaGran'], { pes: formatKb(el.mida, locale) })}</p>}
        <p className="sdp-arxiu-local__ajuda">{tr(T['detall.codiSegur'])}</p>
        {dades.fontSvg !== null && dades.fontSvg !== undefined ? (
          <section className="sdp-arxiu-local__bloc">
            <h4>{tr(T['detall.fontSvg'])}</h4>
            <pre className="sdp-arxiu-local__font">{dades.fontSvg}</pre>
          </section>
        ) : null}
      </>
    );
  } else if (vista === 'codi') {
    cos = (
      <section className="sdp-arxiu-local__bloc">
        <h4>{tr(T['detall.text'])}</h4>
        <p className="sdp-arxiu-local__ajuda">{tr(T['detall.codiSegur'])}</p>
        <pre className="sdp-arxiu-local__font">{dades.text}</pre>
      </section>
    );
  } else if (vista === 'audio' || vista === 'video') {
    const Mitja = vista === 'audio' ? 'audio' : 'video';
    cos = dades.src && !noReprodueix ? (
      <Mitja
        className="sdp-arxiu-local__mitja"
        controls
        preload="metadata"
        playsInline={vista === 'video' ? true : undefined}
        src={dades.src}
        onError={() => setNoReprodueix(true)}
      />
    ) : <Alerta to="avis">{tr(T['detall.noReprodueix'])}</Alerta>;
  } else if (vista === 'pdf') {
    cos = dades.src ? (
      <div className="sdp-arxiu-local__fila">
        <a className="sdp-boto sdp-boto--primari" href={dades.src} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={20} aria-hidden="true" focusable="false" />
          <span>{tr(T['detall.pdf'])}</span>
        </a>
      </div>
    ) : <Alerta to="avis">{tr(T['detall.noPdf'])}</Alerta>;
  } else {
    cos = <p>{tr(T['detall.senseVista'])}</p>;
  }

  const ambImatge = vista === 'imatge' || vista === 'svg';
  const proposta = ambImatge && dades.estat === 'llest'
    ? suggerixPobleLocal({ exif: dades.exif, ruta, parellaWeb: el.parellaWeb, pobles })
    : null;

  return (
    <section className="sdp-arxiu-local__panell sdp-arxiu-local__detall" aria-labelledby={`${id}-titol`}>
      {incrustat ? (
        <h3 id={`${id}-titol`}>{titolIncrustat || nomVisibleLocal(el.nom)}</h3>
      ) : (
        <div className="sdp-arxiu-local__capdetall">
          <h3 id={`${id}-titol`} ref={titolRef} tabIndex={-1}>{nomVisibleLocal(el.nom)}</h3>
          <Boto icona={X} onClick={onTanca}>{tr(T['detall.tanca'])}</Boto>
        </div>
      )}
      <dl className="sdp-arxiu-local__dades">
        <div className="sdp-arxiu-local__dada">
          <dt>{tr(T['detall.ruta'])}</dt>
          <dd><code>{nomVisibleLocal(el.ruta)}</code></dd>
        </div>
        <div className="sdp-arxiu-local__dada">
          <dt>{tr(T['col.mida'])}</dt>
          <dd>{formatKb(el.mida, locale)}</dd>
        </div>
        <div className="sdp-arxiu-local__dada">
          <dt>{tr(T['col.modificat'])}</dt>
          <dd>{dataCurtaLocal(el.modificat)}</dd>
        </div>
        {mides ? (
          <div className="sdp-arxiu-local__dada">
            <dt>{tr(T['detall.mides'])}</dt>
            <dd>{`${mides.ample} × ${mides.alt} px`}</dd>
          </div>
        ) : null}
      </dl>
      {ambDescarrega ? (
        <div className="sdp-arxiu-local__fila">
          <a className="sdp-boto sdp-boto--secundari" href={descarrega} download={el.nom}>
            <Download size={20} aria-hidden="true" focusable="false" />
            <span>{tr(T['detall.descarrega'])}</span>
          </a>
        </div>
      ) : null}
      {cos}
      {incrustat && comparador?.srcWeb && vista === 'imatge' && dades.estat === 'llest' && dades.src ? (
        <section className="sdp-arxiu-local__bloc">
          <h4>{comparador.titol}</h4>
          <div className="sdp-arxiu-local__comparacio">
            <figure className="sdp-arxiu-local__figura">
              <img className="sdp-arxiu-local__imatge" src={dades.src} alt={el.nom} />
              <figcaption>{comparador.original}</figcaption>
            </figure>
            <figure className="sdp-arxiu-local__figura">
              <img className="sdp-arxiu-local__imatge" src={comparador.srcWeb} alt={comparador.web} loading="lazy" />
              <figcaption>{comparador.web}</figcaption>
            </figure>
          </div>
        </section>
      ) : null}
      {vista === 'imatge' && dades.estat === 'llest' ? <Exif t={t} exif={dades.exif} /> : null}
      {proposta ? <PropostaPobleLocal t={t} proposta={proposta} /> : null}
      {el.tipus === 'imatge' ? <EstatWeb t={t} el={el} exactes={exactes} /> : null}
      {potEscriure ? (
        <OperacionsArxiuLocal t={t} font={font} el={el} carpetes={carpetes} nomVolum={nomVolum} bloquejat={bloquejat} onFet={onFet} />
      ) : null}
    </section>
  );
}
