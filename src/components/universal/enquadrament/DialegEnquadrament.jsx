/**
 * DialegEnquadrament — T46 (ordre del Mestre, 260928). Re-enquadrar la foto de
 * capçalera abans de desar-la. La miniatura del llistat (ItemMedia) i la
 * targeta del Mur pinten la mateixa heroImage: l'enquadrament val per a totes
 * (la del Mur és la còpia publicada: canvia quan la nota es torna a publicar).
 *
 * PRINCIPI: l'enquadrament es «cou» dins de l'arxiu. onDesa rep un File ja
 * retallat; al servidor no hi ha paràmetres de retall (sense migració, D2).
 * Per això re-enquadrar una imatge ja retallada només pot tancar més el pla,
 * i el diàleg ho diu abans de desar.
 *
 * CONTRACTE
 *   obert (true) · font (File | URL ja resolta) · formatInicial ('1:1') ·
 *   formats (FORMATS) · titol · descripcio · onTanca(motiu) ·
 *   onDesa(fitxer, { format, rect, sencera }) → Promise<boolean>: el pare el
 *   tanca; si llança, el missatge es mostra ací i el diàleg continua obert ·
 *   carregador / exportador / dibuixant: injectables per a les proves.
 *   «Original» sense zoom amb un File torna el MATEIX File (el camí d'abans);
 *   amb una URL no hi ha res a desar i es tanca.
 *
 * El visor és un <canvas> WYSIWYG (mida en atributs, sense style=): es mou
 * amb el dit o el ratolí (pointer events amb captura) i s'amplia amb dos dits.
 * El teclat i el lector de pantalla van pels lliscadors natius (al costat en
 * escriptori, davall en mòbil: correcció C19).
 */
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Alerta, Boto, Camp, CampText, Carregant, Dialeg, GrupOpcions } from '../../PedraSeca/index.js';
import {
  FORMATS, FORMAT_PER_DEFECTE, ambLliscador, arrossega, esSencera, estatInicial, limita, lliscador,
  marges, midaSortida, midaVisor, pessic, proporcio, rectDeRetall, textAmpliacio, tipusDeSortida, zoomMaxim,
} from './enquadrament.js';
import { carregaImatge, dibuixaVisor, exportaRetall } from './imatgeCanvas.js';

export const ERROR_CARREGA_FITXER = 'No s’ha pogut obrir esta foto. Prova amb una imatge JPEG, PNG o WebP.';
export const ERROR_CARREGA_URL = 'No s’ha pogut obrir esta imatge per a enquadrar-la. Torna-la a pujar des del dispositiu.';
export const ERROR_EXPORTA = 'No s’ha pogut preparar la imatge enquadrada. Torna-ho a provar.';

const esFitxer = (font) => typeof Blob !== 'undefined' && font instanceof Blob;
const distancia = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function DialegEnquadrament({
  obert = true,
  font,
  formatInicial = FORMAT_PER_DEFECTE,
  formats = FORMATS,
  titol = 'Enquadrar la imatge',
  descripcio = 'Tria la forma i mou la foto fins que el que importa quede dins del marc. Només es guarda el que hi ha dins.',
  onTanca,
  onDesa,
  carregador = carregaImatge,
  exportador = exportaRetall,
  dibuixant = dibuixaVisor,
}) {
  const id = useId();
  const arrelRef = useRef(null);
  const canvasRef = useRef(null);
  const retornRef = useRef(null);
  const muntatRef = useRef(false);
  const formatsRef = useRef(formats);
  formatsRef.current = formats;
  const [imatge, setImatge] = useState(null);
  const [errorCarrega, setErrorCarrega] = useState(null);
  /* { text, intent }: cada intent fallit és un valor nou, encara que el text
     es repetisca i React ajunte el «null» de l'intent amb l'error. */
  const [errorDesat, setErrorDesat] = useState(null);
  const intentsFallits = useRef(0);
  const [desant, setDesant] = useState(false);
  const [estat, setEstat] = useState(() => estatInicial(formatInicial));
  /* L'estat viu per als pointer events: dos moviments seguits abans d'un
     render parteixen del darrer valor, no del pintat. */
  const estatRef = useRef(estat);
  const punters = useRef(new Map());
  const pessicInici = useRef(null);

  const actualitza = useCallback((nou) => {
    estatRef.current = nou;
    setEstat(nou);
  }, []);

  /* El focus torna a qui l'ha obert. Es captura en layout (abans que Dialeg
     faça showModal) i es torna en la neteja passiva, quan el <dialog> ja no
     és al DOM: amb el modal obert, la resta del document és inert. Si qui
     l'ha obert ja no hi és (s'ha desat i la capçalera ha canviat), el pare
     decidix on va el focus. StrictMode (App.jsx) repetix els efectes en
     desenvolupament: es captura UNA vegada (la segona, el focus ja és dins del
     diàleg) i només es torna en el desmuntatge real, amb el node fora del DOM. */
  useLayoutEffect(() => {
    muntatRef.current = true;
    if (!retornRef.current) {
      const arrel = arrelRef.current?.getRootNode?.();
      retornRef.current = arrel?.activeElement || document.activeElement;
    }
    return () => { muntatRef.current = false; };
  }, []);
  useEffect(() => {
    const node = arrelRef.current;
    return () => {
      if (node?.isConnected) return;
      const element = retornRef.current;
      if (element?.isConnected && typeof element.focus === 'function') element.focus();
    };
  }, []);

  useEffect(() => {
    if (!obert || !font) return undefined;
    const controlador = new AbortController();
    let viu = true;
    let carregada = null;
    setImatge(null);
    setErrorCarrega(null);
    setErrorDesat(null);
    (async () => {
      try {
        const img = await carregador(font, { signal: controlador.signal });
        if (!viu) { img?.allibera?.(); return; }
        carregada = img;
        actualitza(limita(estatRef.current, img.amplada, img.alcada, formatsRef.current));
        setImatge(img);
      } catch (err) {
        if (viu && err?.name !== 'AbortError') setErrorCarrega(esFitxer(font) ? ERROR_CARREGA_FITXER : ERROR_CARREGA_URL);
      }
    })();
    return () => {
      viu = false;
      controlador.abort();
      carregada?.allibera?.();
    };
  }, [obert, font, carregador, actualitza]);

  /* En layout: el canvas es buida quan canvien els atributs de mida (canvi de
     forma) i així no hi ha cap fotograma en blanc. */
  useLayoutEffect(() => {
    if (!imatge) return;
    const rect = rectDeRetall(estat, imatge.amplada, imatge.alcada, formatsRef.current);
    dibuixant(canvasRef.current, imatge.element, rect);
  }, [imatge, estat, dibuixant]);

  /* T46 (ordre del Mestre, 260928). «Desar» és al peu fix i el cos del diàleg
     fa scroll: qui ha baixat fins als lliscadors no veuria l'avís de dalt.
     Cada intent fallit porta l'avís a la vista ('nearest': si ja es veu, no
     es mou res). La key el torna a inserir i role="alert" el torna a anunciar. */
  useEffect(() => {
    if (!errorDesat) return;
    arrelRef.current?.querySelector(':scope > [role="alert"]')?.scrollIntoView?.({ block: 'nearest' });
  }, [errorDesat]);

  const fallaDesat = (text) => {
    if (!muntatRef.current) return;
    intentsFallits.current += 1;
    setErrorDesat({ text, intent: intentsFallits.current });
  };

  const W = imatge?.amplada || 1;
  const H = imatge?.alcada || 1;
  const r = imatge ? proporcio(estat.format, W, H, formats) : (formats.find((f) => f.valor === estat.format)?.ratio ?? 1);
  const visor = midaVisor(r);
  const zMax = imatge ? zoomMaxim(W, H, r) : 1;
  const hiHaMarge = imatge ? marges(estat, W, H, formats) : { x: false, y: false };
  const posX = imatge ? lliscador(estat, 'x', W, H, formats) : 50;
  const posY = imatge ? lliscador(estat, 'y', W, H, formats) : 50;
  const quiet = !imatge || desant;

  /* Esc s'accepta sempre: el navegador pot tancar el <dialog> pel seu compte.
     La X, mentre desa, no: el desat continua i el pare el tanca en acabar. */
  const tanca = (motiu) => {
    if (!desant || motiu === 'esc') onTanca?.(motiu);
  };

  const canviaForma = (format) => {
    const nou = { ...estatRef.current, format };
    actualitza(imatge ? limita(nou, W, H, formats) : nou);
  };

  const centra = () => {
    const nou = estatInicial(estatRef.current.format);
    actualitza(imatge ? limita(nou, W, H, formats) : nou);
  };

  /* Poliment T46 (ordre del Mestre, 260928) · Només el botó principal
     arrossega (el dret és el menú contextual). Un moviment sense cap botó
     premut vol dir que el pointerup s'ha perdut (fora de la finestra): el
     punter s'allibera, com quan es perd la captura. */
  const onPointerDown = (e) => {
    if (quiet || e.button > 0) return;
    // Sense açò, un arrossegament amb el ratolí que ix del visor selecciona el text del diàleg.
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    punters.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (punters.current.size === 2) {
      const [a, b] = [...punters.current.values()];
      pessicInici.current = { d: distancia(a, b), zoom: estatRef.current.zoom };
    }
  };

  const onPointerMove = (e) => {
    const previ = punters.current.get(e.pointerId);
    if (!previ || quiet) return;
    if (e.buttons === 0) {
      deixaPunter(e);
      return;
    }
    const actual = { x: e.clientX, y: e.clientY };
    punters.current.set(e.pointerId, actual);
    if (punters.current.size >= 2 && pessicInici.current) {
      const [a, b] = [...punters.current.values()];
      actualitza(pessic(estatRef.current, pessicInici.current.zoom, pessicInici.current.d, distancia(a, b), W, H, formats));
      return;
    }
    const ample = e.currentTarget.getBoundingClientRect().width;
    actualitza(arrossega(estatRef.current, actual.x - previ.x, actual.y - previ.y, ample, W, H, formats));
  };

  const deixaPunter = (e) => {
    punters.current.delete(e.pointerId);
    if (punters.current.size < 2) pessicInici.current = null;
  };

  const desa = async () => {
    if (!imatge || desant) return;
    const e = estatRef.current;
    const rect = rectDeRetall(e, W, H, formats);
    const sencera = esSencera(e, W, H, formats);
    if (sencera && !esFitxer(font)) {
      onTanca?.('boto');
      return;
    }
    setErrorDesat(null);
    setDesant(true);
    try {
      let fitxer = font;
      if (!sencera) {
        try {
          fitxer = await exportador(imatge.element, rect, { ...midaSortida(rect), tipus: tipusDeSortida(imatge.tipus) });
        } catch {
          fallaDesat(ERROR_EXPORTA);
          return;
        }
      }
      await onDesa?.(fitxer, { format: e.format, rect, sencera });
    } catch (err) {
      fallaDesat(err?.message || ERROR_EXPORTA);
    } finally {
      if (muntatRef.current) setDesant(false);
    }
  };

  return (
    <Dialeg
      obert={obert}
      onTanca={tanca}
      titol={titol}
      descripcio={descripcio}
      mida="g"
      className="sdp-enquadrament__dialeg"
      tancaEnVel={false}
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => tanca('boto')} disabled={desant}>Cancel·lar</Boto>
          {/* Secundari i no fantasma: al peu del diàleg només es restituïxen
              secundari i perill (components.css, trampa de PerfilShell.css). */}
          <Boto varietat="secundari" onClick={centra} disabled={quiet}>Centrar</Boto>
          <Boto varietat="primari" onClick={desa} carregant={desant} disabled={!imatge}>Desar l’enquadrament</Boto>
        </>
      )}
    >
      <div ref={arrelRef} className="sdp-enquadrament">
        {errorCarrega ? <Alerta to="error">{errorCarrega}</Alerta> : null}
        {/* Dalt de tot i no al final: el cos fa scroll i «Desar» és al peu fix. */}
        {errorDesat ? <Alerta key={errorDesat.intent} to="error">{errorDesat.text}</Alerta> : null}
        {!errorCarrega && !imatge ? <Carregant etiqueta="Obrint la imatge…" /> : null}
        {/* Correcció C19 (260928) · La foto i els lliscadors han de cabre alhora:
            a ≥721px, la vista a una banda i els controls a l'altra (bloc T46 de
            modules.css); en mòbil, en columna. Els lliscadors van abans que la
            forma (també en el DOM: l'ordre del focus és el que es veu). */}
        {imatge ? (
          <div className="sdp-enquadrament__obra">
            <div className="sdp-enquadrament__vista">
              <div className="sdp-enquadrament__visor-marc">
                <canvas
                  ref={canvasRef}
                  className="sdp-enquadrament__visor"
                  width={visor.amplada}
                  height={visor.alcada}
                  role="img"
                  aria-label="Previsualització de l’enquadrament"
                  aria-describedby={`${id}-ajuda`}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={deixaPunter}
                  onPointerCancel={deixaPunter}
                  onLostPointerCapture={deixaPunter}
                />
              </div>
              <p id={`${id}-ajuda`} className="sdp-camp__ajuda">
                Arrossega la foto amb el dit o el ratolí per a moure-la; amb dos dits, l’amplies. També la pots moure i ampliar amb els lliscadors.
              </p>
            </div>
            <div className="sdp-enquadrament__controls">
              <div className="sdp-enquadrament__lliscadors">
                <Camp etiqueta="Ampliació" ajuda={zMax <= 1 ? 'Esta foto és massa xicoteta per a ampliar-la més.' : undefined}>
                  <CampText tipus="range" className="sdp-enquadrament__lliscador" min={1} max={zMax} step={0.01}
                    value={estat.zoom} aria-valuetext={textAmpliacio(estat.zoom)} disabled={quiet || zMax <= 1}
                    onChange={(ev) => actualitza(limita({ ...estatRef.current, zoom: Number(ev.target.value) }, W, H, formats))} />
                </Camp>
                <Camp etiqueta="Posició horitzontal" ajuda={hiHaMarge.x ? undefined : 'En esta direcció la foto ja omple tot el marc.'}>
                  <CampText tipus="range" className="sdp-enquadrament__lliscador" min={0} max={100} step={1}
                    value={posX} aria-valuetext={`${posX} % des de l’esquerra`} disabled={quiet || !hiHaMarge.x}
                    onChange={(ev) => actualitza(ambLliscador(estatRef.current, 'x', ev.target.value, W, H, formats))} />
                </Camp>
                <Camp etiqueta="Posició vertical" ajuda={hiHaMarge.y ? undefined : 'En esta direcció la foto ja omple tot el marc.'}>
                  <CampText tipus="range" className="sdp-enquadrament__lliscador" min={0} max={100} step={1}
                    value={posY} aria-valuetext={`${posY} % des de dalt`} disabled={quiet || !hiHaMarge.y}
                    onChange={(ev) => actualitza(ambLliscador(estatRef.current, 'y', ev.target.value, W, H, formats))} />
                </Camp>
              </div>
              <GrupOpcions llegenda="Forma" opcions={formats} valor={estat.format} onCanvi={canviaForma} disabled={desant} />
            </div>
          </div>
        ) : null}
      </div>
    </Dialeg>
  );
}

export default DialegEnquadrament;
