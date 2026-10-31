/**
 * LaboratoriWebpLocal.jsx — «Laboratori WebP: abans i després» del Gestor
 * d'arxius locals (IDEA-54 · Onada 261029_1605), per a png, jpg i jpeg.
 *
 *   · La previsualització es fa amb un canvas del mateix document que la
 *     imatge (també dins de l'ombra de l'encastat) i es comprova que el
 *     navegador ha tornat de veres un WebP (WebKit torna PNG): si no, cap botó
 *     de desar.
 *   · Cada canvi de qualitat o de resolució fa una previsualització nova i
 *     tanca el registre de blob: de l'anterior quan ja no es pinta.
 *   · «Desar .webp a la carpeta local» (o «Substituir la bessona .webp», amb
 *     confirmació prèvia) i «Desar .webp i moure l'original a
 *     originals_raster_public/» (amagada si l'original ja hi és). Mai se
 *     sobreescriu sense confirmar-ho; el permís readwrite és la primera espera
 *     del motor dins del clic.
 *   · La descàrrega va com a application/octet-stream.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Download, FolderInput, Save } from 'lucide-react';
import { Alerta, Boto, Camp, DialegConfirmacio, Selector } from '../../components/PedraSeca/index.js';
import {
  desaWebpALaCarpetaLocal, desaWebpIMouOriginalLocal, esBytesWebp, formatKb, potMoureOriginalRaster,
  rutaBessonaWebp, troncSenseExtensio
} from './motorMultimediaLocal.js';
import { comparaPesWebp } from './suportGestorLocal.js';
import { TEXTOS_LOCAL as T, tradueix } from './textosGestorLocal.js';
import { creaUrlsArxiuLocal } from './urlsArxiuLocal.js';
import { useLocaleOpcional } from './useLocaleOpcional.js';

const CANCELA = ['common.cancela', 'Cancel·lar'];
const QUALITATS = Object.freeze([[0.72, 'lab.q72'], [0.78, 'lab.q78'], [0.84, 'lab.q84'], [0.92, 'lab.q92']]);
const COSTATS = Object.freeze([0, 1200, 1024]);

/* La imatge en WebP amb un canvas del seu document: { blob, ample, alt } o null. */
async function codificaWebp(img, qualitat, maxCostat) {
  const ample0 = img?.naturalWidth;
  const alt0 = img?.naturalHeight;
  if (!ample0 || !alt0 || !img.ownerDocument) return null;
  let ample = ample0;
  let alt = alt0;
  if (maxCostat > 0 && Math.max(ample0, alt0) > maxCostat) {
    const escala = maxCostat / Math.max(ample0, alt0);
    ample = Math.round(ample0 * escala);
    alt = Math.round(alt0 * escala);
  }
  const canvas = img.ownerDocument.createElement('canvas');
  canvas.width = ample;
  canvas.height = alt;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, ample, alt);
  const blob = await new Promise((resol) => {
    if (typeof canvas.toBlob === 'function') canvas.toBlob(resol, 'image/webp', qualitat);
    else resol(null);
  });
  return blob ? { blob, ample, alt } : null;
}

/* Gauntlet 261029 c1 (lab-webp-mateix-pes-fals) · comparaPesWebp (la
   diferència de pes AMB SIGNE) viu a suportGestorLocal.js: este fitxer només
   exporta components (Fast Refresh, exportacionsComponents.test.js). */

export function LaboratoriWebpLocal({ t, font, el, src, potEscriure = false, onMides, onFet }) {
  const tr = (parell, valors) => tradueix(t, parell, valors);
  const locale = useLocaleOpcional();
  const id = useId();
  const [img, setImg] = useState(null);
  const [qualitat, setQualitat] = useState(0.84);
  const [maxCostat, setMaxCostat] = useState(0);
  const [resultat, setResultat] = useState(null);
  const [senseWebp, setSenseWebp] = useState(false);
  const [generant, setGenerant] = useState(false);
  const [ocupat, setOcupat] = useState(null);
  const [confirmacio, setConfirmacio] = useState(null);
  const viu = useRef(true);
  const titolRef = useRef(null);

  useEffect(() => {
    viu.current = true;
    return () => {
      viu.current = false;
    };
  }, []);

  /* Gauntlet 261029 (cicle 1, IDEA-57) · El registre de blob: d'una
     previsualització vella no es tanca en el pas del canvi de qualitat o de
     resolució (encara es pinta), sinó després del commit que ja no la pinta
     (l'efecte de `resultat`) o en desmuntar: cap blob: revocat a la vista. */
  const registresVells = useRef([]);
  const tancaVells = useCallback(() => {
    const vells = registresVells.current;
    registresVells.current = [];
    vells.forEach((urls) => urls.tanca());
  }, []);

  useEffect(() => {
    if (!img) return undefined;
    let actiu = true;
    const urls = creaUrlsArxiuLocal();
    setResultat(null);
    setSenseWebp(false);
    setGenerant(true);
    (async () => {
      try {
        const codificat = await codificaWebp(img, qualitat, maxCostat);
        if (!actiu) return;
        if (!codificat) {
          setSenseWebp(true);
          return;
        }
        const bytes = new Uint8Array(await codificat.blob.arrayBuffer());
        if (!actiu) return;
        if (codificat.blob.type !== 'image/webp' || !esBytesWebp(bytes)) {
          setSenseWebp(true);
          return;
        }
        setResultat({
          ample: codificat.ample,
          alt: codificat.alt,
          mida: bytes.byteLength,
          bytes,
          url: urls.visor(codificat.blob),
          descarrega: urls.descarrega(codificat.blob)
        });
      } catch {
        if (actiu) setSenseWebp(true);
      } finally {
        if (actiu) setGenerant(false);
      }
    })();
    return () => {
      actiu = false;
      registresVells.current.push(urls);
    };
  }, [img, qualitat, maxCostat]);
  /* Pintat el resultat nou (o cap), els registres vells ja no són a la vista. */
  useEffect(() => {
    tancaVells();
  }, [resultat, tancaVells]);
  /* Declarat després: en desmuntar, corre quan l'efecte de dalt ja hi ha deixat el seu. */
  useEffect(() => tancaVells, [tancaVells]);

  const enCarregar = (event) => {
    const node = event.currentTarget;
    if (!node?.naturalWidth || !node?.naturalHeight) return;
    onMides?.({ ample: node.naturalWidth, alt: node.naturalHeight });
    setImg(node);
  };

  const rutaWebp = rutaBessonaWebp(el.ruta);
  const substitucio = el.bessonaWebpRuta === rutaWebp;

  const desa = async (sobreescriu = false) => {
    if (!resultat || ocupat) return;
    setConfirmacio(null);
    setOcupat('desa');
    try {
      const desat = await desaWebpALaCarpetaLocal(font, rutaWebp, resultat.bytes, { sobreescriu });
      onFet?.({
        missatge: { to: 'exit', parell: T['lab.desat'], valors: { ruta: desat.ruta, pes: formatKb(desat.mida, locale) } },
        seleccio: viu.current ? el.ruta : undefined,
        origen: { ruta: el.ruta }
      });
    } catch (error) {
      if (error?.codi === 'FITXER_JA_EXISTEIX' && !sobreescriu) {
        if (viu.current) setConfirmacio({ tipus: 'webp', ruta: rutaWebp });
      } else {
        onFet?.({ error });
      }
    } finally {
      if (viu.current) setOcupat(null);
    }
  };

  const desaIMou = async (sobreescriuWebp = false) => {
    if (!resultat || ocupat) return;
    setConfirmacio(null);
    setOcupat('mou');
    try {
      const fet = await desaWebpIMouOriginalLocal(font, el.ruta, resultat.bytes, { sobreescriuWebp });
      onFet?.({
        missatge: { to: 'exit', parell: T['lab.desatIMogut'], valors: { webp: fet.webp.ruta, original: fet.original.ruta } },
        seleccio: viu.current ? fet.original.ruta : undefined,
        origen: { ruta: el.ruta }
      });
    } catch (error) {
      if (error?.codi === 'FITXER_JA_EXISTEIX' && error?.detall?.quina === 'webp' && !sobreescriuWebp) {
        if (viu.current) setConfirmacio({ tipus: 'mou', ruta: error.detall.ruta || rutaWebp });
      } else {
        onFet?.({ error, refresca: error?.codi === 'ORIGINAL_NO_MOGUT' });
      }
    } finally {
      if (viu.current) setOcupat(null);
    }
  };

  const pes = resultat ? comparaPesWebp(el.mida, resultat.mida) : null;
  let estalvi = '';
  if (pes?.tipus === 'menys') estalvi = `-${pes.percent} %`;
  else if (pes?.tipus === 'mes') estalvi = tr(T['lab.mesPesat'], { percent: pes.percent });
  else if (pes?.tipus === 'igual') estalvi = tr(T['lab.mateixPes']);

  return (
    <section className="sdp-arxiu-local__laboratori" aria-labelledby={`${id}-titol`}>
      <h4 id={`${id}-titol`} ref={titolRef} tabIndex={-1}>{tr(T['lab.titol'])}</h4>
      <div className="sdp-arxiu-local__controls">
        <Camp etiqueta={tr(T['lab.qualitat'])}>
          <Selector
            opcions={QUALITATS.map(([valor, clau]) => ({ valor: String(valor), etiqueta: tr(T[clau]) }))}
            value={String(qualitat)}
            onChange={(event) => setQualitat(Number(event.target.value))}
          />
        </Camp>
        <Camp etiqueta={tr(T['lab.resolucio'])}>
          <Selector
            opcions={COSTATS.map((px) => ({ valor: String(px), etiqueta: px === 0 ? tr(T['lab.midaOriginal']) : tr(T['lab.maxim'], { px }) }))}
            value={String(maxCostat)}
            onChange={(event) => setMaxCostat(Number(event.target.value))}
          />
        </Camp>
      </div>
      <div className="sdp-arxiu-local__comparacio">
        <figure className="sdp-arxiu-local__figura">
          {src ? <img className="sdp-arxiu-local__imatge" src={src} alt={el.nom} onLoad={enCarregar} /> : null}
          <figcaption>{tr(T['lab.abans'], { ext: el.ext.toUpperCase(), pes: formatKb(el.mida, locale) })}</figcaption>
        </figure>
        {resultat?.url ? (
          <figure className="sdp-arxiu-local__figura">
            <img className="sdp-arxiu-local__imatge" src={resultat.url} alt={tr(T['lab.previsualitzacio'], { nom: el.nom })} />
            <figcaption>{tr(T['lab.despres'], { ample: resultat.ample, alt: resultat.alt, pes: formatKb(resultat.mida, locale), estalvi })}</figcaption>
          </figure>
        ) : null}
      </div>
      {generant ? <p role="status" className="sdp-arxiu-local__ajuda">{tr(T['lab.generant'])}</p> : null}
      {senseWebp ? <Alerta to="avis">{tr(T['lab.senseWebp'])}</Alerta> : null}
      {resultat ? (
        <div className="sdp-arxiu-local__fila">
          {resultat.descarrega ? (
            <a className="sdp-boto sdp-boto--secundari" href={resultat.descarrega} download={`${troncSenseExtensio(el.nom)}.webp`}>
              <Download size={20} aria-hidden="true" focusable="false" />
              <span>{tr(T['lab.descarrega'], { pes: formatKb(resultat.mida, locale) })}</span>
            </a>
          ) : null}
          {potEscriure ? (
            <Boto
              varietat="primari"
              icona={Save}
              carregant={ocupat === 'desa'}
              disabled={Boolean(ocupat)}
              onClick={() => (substitucio ? setConfirmacio({ tipus: 'webp', ruta: rutaWebp }) : desa(false))}
            >
              {tr(substitucio ? T['lab.substitueix'] : T['lab.desa'])}
            </Boto>
          ) : null}
          {potEscriure && potMoureOriginalRaster(el.ruta) ? (
            <Boto icona={FolderInput} carregant={ocupat === 'mou'} disabled={Boolean(ocupat)} onClick={() => desaIMou(false)}>
              {tr(T['lab.desaIMou'])}
            </Boto>
          ) : null}
        </div>
      ) : null}
      {confirmacio ? (
        <DialegConfirmacio
          obert
          destructiu
          titol={tr(T['lab.confirmaTitol'], { ruta: confirmacio.ruta })}
          descripcio={tr(T['lab.confirmaText'])}
          etiquetaConfirma={tr(T['lab.confirma'])}
          etiquetaCancela={tr(CANCELA)}
          onTanca={() => {
            setConfirmacio(null);
            titolRef.current?.focus();
          }}
          onConfirma={() => {
            titolRef.current?.focus();
            if (confirmacio.tipus === 'mou') desaIMou(true);
            else desa(true);
          }}
        />
      ) : null}
    </section>
  );
}
