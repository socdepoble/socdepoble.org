/**
 * GestorMultimediaLocal.jsx — Gestor Multimèdia Local Intel·ligent sobre
 * `_multimedia_de_poble/` (IDEA-54 · Ordre del Mestre 261029).
 *
 * Reutilitza el mateix motor de lectura de carpetes locals de la Gestoria
 * (`fontNavegador.js`) per explorar `_multimedia_de_poble/` sense pujar res a
 * Internet, creuar els arxius amb el cens web (`CENS_IMATGES`) i provar en viu
 * la compressió WebP comprovant a ull que no es pixel·le abans de desar.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  EXTENSIONS_RASTER_CONVERTIBLE,
  analitzaCarpetaMultimediaLocal,
  demanaCarpeta,
  desarWebpEnHandleLocal,
  fontDesDeFitxers,
  fontDesDeHandle,
  formatKb,
  inspeccionaImatgeLocal,
  oblidaFont,
  potTriarCarpeta,
  troncSenseExtensio
} from './motorMultimediaLocal.js';

const QUALITATS_LABORATORI = Object.freeze([
  { valor: 0.72, etiqueta: '72% (Més lleuger)' },
  { valor: 0.78, etiqueta: '78% (Equilibrat)' },
  { valor: 0.84, etiqueta: '84% (Recomanat · Alta nitidesa)' },
  { valor: 0.92, etiqueta: '92% (Màxima fidelitat)' }
]);

const ESCALES_LABORATORI = Object.freeze([
  { valor: 0, etiqueta: 'Mida original (100% píxels)' },
  { valor: 1200, etiqueta: 'Màx. 1200 px' },
  { valor: 1024, etiqueta: 'Màx. 1024 px' }
]);

export function GestorMultimediaLocal({ cens = null, mitjansWeb = [] }) {
  const [fontActiva, setFontActiva] = useState(null);
  const [handleNatiu, setHandleNatiu] = useState(null);
  const [entrades, setEntrades] = useState([]);
  const [carregant, setCarregant] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [subcarpetaActiva, setSubcarpetaActiva] = useState('totes');
  const [filtreEstat, setFiltreEstat] = useState('tots');
  const [cerca, setCerca] = useState('');

  const [seleccionat, setSeleccionat] = useState(null);
  const [detallSeleccionat, setDetallSeleccionat] = useState(null);
  const [midesOriginals, setMidesOriginals] = useState(null);
  const [qualitatWebp, setQualitatWebp] = useState(0.84);
  const [maxCostat, setMaxCostat] = useState(0);
  const [resultatWebp, setResultatWebp] = useState(null);
  const [missatgeDesat, setMissatgeDesat] = useState('');

  const inputCarpetaRef = useRef(null);
  const urlsTemporalsRef = useRef([]);

  const netejaUrlsTemporals = () => {
    for (const u of urlsTemporalsRef.current) {
      try {
        URL.revokeObjectURL(u);
      } catch {
        // Ignora errors en revocar URLs d'objecte
      }
    }
    urlsTemporalsRef.current = [];
  };

  useEffect(() => () => netejaUrlsTemporals(), []);

  const carregaFont = async (novaFont, nouHandle = null) => {
    setCarregant(true);
    setErrorMsg('');
    setMissatgeDesat('');
    try {
      const llista = await novaFont.llista();
      if (fontActiva) oblidaFont(fontActiva);
      netejaUrlsTemporals();
      setFontActiva(novaFont);
      setHandleNatiu(nouHandle);
      setEntrades(llista);
      setSubcarpetaActiva('totes');
      setFiltreEstat('tots');
      setSeleccionat(null);
      setDetallSeleccionat(null);
      setResultatWebp(null);
    } catch (err) {
      setErrorMsg(err?.message || 'No s’ha pogut llegir la carpeta local.');
    } finally {
      setCarregant(false);
    }
  };

  const connectaAmbSelectorNatiu = async () => {
    setErrorMsg('');
    if (!potTriarCarpeta()) {
      inputCarpetaRef.current?.click();
      return;
    }
    try {
      const handle = await demanaCarpeta({ mode: 'read' });
      const novaFont = fontDesDeHandle(handle);
      await carregaFont(novaFont, handle);
    } catch (err) {
      if (err?.codi === 'SELECCIO_CANCELLADA') return;
      setErrorMsg(err?.message || 'No s’ha pogut obrir el selector de carpetes.');
    }
  };

  const enTriarInputCarpeta = async (e) => {
    const files = e.target?.files;
    if (!files || files.length === 0) return;
    try {
      const novaFont = fontDesDeFitxers(files);
      await carregaFont(novaFont, null);
    } catch (err) {
      setErrorMsg(err?.message || 'No s’han pogut llegir els fitxers seleccionats.');
    }
  };

  const desconnectaCarpeta = () => {
    if (fontActiva) oblidaFont(fontActiva);
    netejaUrlsTemporals();
    setFontActiva(null);
    setHandleNatiu(null);
    setEntrades([]);
    setSeleccionat(null);
    setDetallSeleccionat(null);
    setResultatWebp(null);
    setErrorMsg('');
    setMissatgeDesat('');
  };

  const analisi = useMemo(
    () => analitzaCarpetaMultimediaLocal(entrades, { cens, mitjansWeb }),
    [entrades, cens, mitjansWeb]
  );

  const elementsFiltrats = useMemo(() => {
    const q = cerca.trim().toLowerCase();
    return analisi.elements.filter((el) => {
      if (subcarpetaActiva !== 'totes' && el.subcarpeta !== subcarpetaActiva) return false;
      if (filtreEstat === 'emparellades' && !el.emparelladaWeb) return false;
      if (filtreEstat === 'inedites' && !el.inedita) return false;
      if (filtreEstat === 'bessones' && !el.teBessonaLocal) return false;
      if (filtreEstat === 'alertes' && !el.pesAlt && !el.duplicada) return false;
      if (q && !el.ruta.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [analisi.elements, subcarpetaActiva, filtreEstat, cerca]);

  const obriElementLocal = async (el) => {
    setSeleccionat(el);
    setDetallSeleccionat(null);
    setMidesOriginals(null);
    setResultatWebp(null);
    setMissatgeDesat('');
    if (!fontActiva || el.tipus !== 'imatge') return;
    try {
      const info = await inspeccionaImatgeLocal(fontActiva, el.ruta);
      const url = URL.createObjectURL(info.blob);
      urlsTemporalsRef.current.push(url);
      setDetallSeleccionat({ ...info, url });
    } catch (err) {
      setErrorMsg(err?.message || `No s’ha pogut llegir «${el.nom}».`);
    }
  };

  const generaPrevisualitzacioWebp = async (imgElement, qualitat = qualitatWebp, limitCostat = maxCostat) => {
    if (!imgElement || !imgElement.naturalWidth || !imgElement.naturalHeight) return;
    const w0 = imgElement.naturalWidth;
    const h0 = imgElement.naturalHeight;
    setMidesOriginals({ ample: w0, alt: h0 });

    let w = w0;
    let h = h0;
    if (limitCostat > 0 && Math.max(w0, h0) > limitCostat) {
      const escala = limitCostat / Math.max(w0, h0);
      w = Math.round(w0 * escala);
      h = Math.round(h0 * escala);
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(imgElement, 0, 0, w, h);

    const blobWebp = await new Promise((resolve) => {
      if (typeof canvas.toBlob === 'function') {
        canvas.toBlob((b) => resolve(b), 'image/webp', qualitat);
      } else {
        resolve(null);
      }
    });
    if (!blobWebp) return;
    const ab = await blobWebp.arrayBuffer();
    const bytesWebp = new Uint8Array(ab);
    const urlWebp = URL.createObjectURL(blobWebp);
    urlsTemporalsRef.current.push(urlWebp);
    setResultatWebp({
      ample: w,
      alt: h,
      mida: bytesWebp.byteLength,
      bytes: bytesWebp,
      url: urlWebp,
      qualitat
    });
  };

  const descarregaWebpGenerat = () => {
    if (!resultatWebp || !seleccionat) return;
    const a = document.createElement('a');
    a.href = resultatWebp.url;
    const nomWebp = `${troncSenseExtensio(seleccionat.nom)}.webp`;
    a.download = nomWebp;
    a.click();
  };

  const desaWebpACarpetaLocal = async () => {
    if (!resultatWebp || !seleccionat || !handleNatiu) return;
    setErrorMsg('');
    setMissatgeDesat('');
    try {
      const rutaWebp = `${troncSenseExtensio(seleccionat.ruta)}.webp`;
      await desarWebpEnHandleLocal(handleNatiu, rutaWebp, resultatWebp.bytes);
      const novaLlista = await fontActiva.llista();
      setEntrades(novaLlista);
      setMissatgeDesat(`S’ha desat «${rutaWebp}» (${formatKb(resultatWebp.mida)}) directament a la carpeta local.`);
    } catch (err) {
      setErrorMsg(err?.message || 'No s’ha pogut desar el fitxer WebP a la carpeta local.');
    }
  };

  return (
    <section className="stack-grid" aria-label="Gestor Multimèdia Local">
      <div className="card card--soft">
        <div className="card__body">
          <div className="notes-list-header">
            <div>
              <h2 className="section-title">Arxiu Multimèdia Local (_multimedia_de_poble)</h2>
              <p>
                Explora la carpeta local del teu ordinador sense pujar cap fitxer a Internet. El motor creua les
                imatges locals amb el cens publicat a la web, detecta originals sense <code>.webp</code> i et permet
                ajustar la compressió comprovant a ull la nitidesa.
              </p>
            </div>
            <div className="univ-manager-toolbar">
              <button type="button" className="sdp-boto sdp-boto--primari" onClick={connectaAmbSelectorNatiu} disabled={carregant}>
                {fontActiva ? `Canviar carpeta (${fontActiva.nom})` : 'Connectar carpeta local (_multimedia_de_poble)'}
              </button>
              {fontActiva && (
                <button type="button" className="sdp-boto sdp-boto--secundari" onClick={desconnectaCarpeta}>
                  Desconnectar
                </button>
              )}
              <input
                ref={inputCarpetaRef}
                type="file"
                webkitdirectory=""
                directory=""
                multiple
                hidden
                onChange={enTriarInputCarpeta}
                data-testid="input-carpeta-multimedia-local"
              />
            </div>
          </div>

          {errorMsg && (
            <p role="alert" className="sdp-workspace-state">
              {errorMsg}
            </p>
          )}
          {missatgeDesat && (
            <p role="status" className="sdp-workspace-state">
              {missatgeDesat}
            </p>
          )}
        </div>
      </div>

      {fontActiva && (
        <>
          <div className="card card--soft">
            <div className="card__body">
              <div className="notes-list-header">
                <strong className="univ-manager-facet-header">
                  Diagnòstic intel·ligent de «{fontActiva.nom}» ({analisi.resum.totalFitxers} fitxers · {formatKb(analisi.resum.pesTotalBytes)})
                </strong>
                <div className="univ-manager-toolbar">
                  <span className="pill">
                    Emparellades Web: {analisi.resum.totalEmparelladesWeb}
                  </span>
                  <span className="pill">
                    Inèdites sense WebP: {analisi.resum.totalInedites}
                  </span>
                  <span className="pill">
                    Bessones locals: {analisi.resum.totalBessonesLocals} (estalvi {formatKb(analisi.resum.estalviBessonesBytes)})
                  </span>
                  <span className="pill">
                    Avisos pes/duplicats: {analisi.resum.totalPesAlt + analisi.resum.totalDuplicades}
                  </span>
                </div>
              </div>

              <div className="notes-list-header">
                <div className="univ-manager-toolbar" role="group" aria-label="Filtre per subcarpeta local">
                  <button
                    type="button"
                    className={`pill ${subcarpetaActiva === 'totes' ? 'sdp-badge-system' : ''}`.trim()}
                    aria-pressed={subcarpetaActiva === 'totes'}
                    onClick={() => setSubcarpetaActiva('totes')}
                  >
                    Totes les carpetes ({analisi.resum.totalFitxers})
                  </button>
                  {analisi.subcarpetes.map((sub) => (
                    <button
                      key={sub.nom}
                      type="button"
                      className={`pill ${subcarpetaActiva === sub.nom ? 'sdp-badge-system' : ''}`.trim()}
                      aria-pressed={subcarpetaActiva === sub.nom}
                      onClick={() => setSubcarpetaActiva(sub.nom)}
                    >
                      {sub.nom} ({sub.total} · {formatKb(sub.bytes)})
                    </button>
                  ))}
                </div>

                <div className="univ-manager-toolbar" role="group" aria-label="Filtre per estat d'auditoria">
                  {[
                    ['tots', 'Tots els estats'],
                    ['emparellades', 'Emparellades amb la Web'],
                    ['inedites', 'Inèdites (pendents de WebP)'],
                    ['bessones', 'Amb bessona .webp local'],
                    ['alertes', 'Pes alt o duplicades']
                  ].map(([codi, text]) => (
                    <button
                      key={codi}
                      type="button"
                      className={`pill ${filtreEstat === codi ? 'sdp-badge-category' : ''}`.trim()}
                      aria-pressed={filtreEstat === codi}
                      onClick={() => setFiltreEstat(codi)}
                    >
                      {text}
                    </button>
                  ))}
                  <input
                    type="search"
                    className="sdp-camp__control"
                    placeholder="Cerca per nom o ruta…"
                    aria-label="Cerca per nom o ruta a la carpeta local"
                    value={cerca}
                    onChange={(e) => setCerca(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {seleccionat && (
            <div className="card card--soft" data-testid="laboratori-multimedia-local">
              <div className="card__body">
                <div className="notes-list-header">
                  <div>
                    <h3 className="section-title">{seleccionat.nom}</h3>
                    <p>
                      Ruta local: <code>{seleccionat.ruta}</code> · Pes original: <strong>{formatKb(seleccionat.mida)}</strong>
                      {midesOriginals ? ` · Dimensions: ${midesOriginals.ample} × ${midesOriginals.alt} px` : ''}
                    </p>
                  </div>
                  <button type="button" className="sdp-boto sdp-boto--secundari" onClick={() => setSeleccionat(null)}>
                    Tancar inspector
                  </button>
                </div>

                <ul>
                  <li>
                    <strong>Estat respecte al sistema web:</strong>{' '}
                    {seleccionat.emparelladaWeb
                      ? `Emparellada amb el cens web (${seleccionat.parellaWeb?.src || 'activa'})`
                      : seleccionat.inedita
                        ? 'Inèdita en local (encara no té versió .webp ni figura al cens web)'
                        : 'Arxiu local de suport'}
                  </li>
                  {seleccionat.teBessonaLocal && (
                    <li>
                      <strong>Parella en carpeta local:</strong>{' '}
                      {seleccionat.bessonaWebpRuta
                        ? `Té bessona ${seleccionat.bessonaWebpRuta} (${formatKb(seleccionat.bessonaWebpMida)} · estalvi de ${formatKb(seleccionat.estalviBytes)})`
                        : `És la bessona WebP de ${seleccionat.originalRasterRuta} (${formatKb(seleccionat.originalRasterMida)})`}
                    </li>
                  )}
                  {seleccionat.coincidenciesMida.length > 0 && (
                    <li>
                      <strong>Possible duplicat exacte per mida:</strong>{' '}
                      <code>{seleccionat.coincidenciesMida.join(', ')}</code>
                    </li>
                  )}
                  {detallSeleccionat?.exif && (detallSeleccionat.exif.dataCaptura || detallSeleccionat.exif.camera || detallSeleccionat.exif.autor) && (
                    <li>
                      <strong>Metadades EXIF:</strong>{' '}
                      {[
                        detallSeleccionat.exif.dataCaptura && `Data: ${detallSeleccionat.exif.dataCaptura}`,
                        detallSeleccionat.exif.camera && `Càmera: ${detallSeleccionat.exif.camera}`,
                        detallSeleccionat.exif.autor && `Autor: ${detallSeleccionat.exif.autor}`,
                        detallSeleccionat.exif.gps && `GPS: ${detallSeleccionat.exif.gps.lat.toFixed(4)}, ${detallSeleccionat.exif.gps.lng.toFixed(4)}`
                      ].filter(Boolean).join(' · ')}
                    </li>
                  )}
                </ul>

                {detallSeleccionat?.url && (
                  <div className="stack-grid">
                    <div className="notes-list-header">
                      <strong>Laboratori de Nitidesa i Compressió WebP (Comparació Humana Abans / Després)</strong>
                      <div className="univ-manager-toolbar">
                        <label>
                          Qualitat WebP:{' '}
                          <select
                            className="sdp-camp__control"
                            value={qualitatWebp}
                            onChange={(e) => {
                              const q = Number(e.target.value);
                              setQualitatWebp(q);
                              const img = document.getElementById('sdp-img-original-local');
                              if (img) generaPrevisualitzacioWebp(img, q, maxCostat);
                            }}
                          >
                            {QUALITATS_LABORATORI.map((op) => (
                              <option key={op.valor} value={op.valor}>{op.etiqueta}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          Resolució:{' '}
                          <select
                            className="sdp-camp__control"
                            value={maxCostat}
                            onChange={(e) => {
                              const m = Number(e.target.value);
                              setMaxCostat(m);
                              const img = document.getElementById('sdp-img-original-local');
                              if (img) generaPrevisualitzacioWebp(img, qualitatWebp, m);
                            }}
                          >
                            {ESCALES_LABORATORI.map((op) => (
                              <option key={op.valor} value={op.valor}>{op.etiqueta}</option>
                            ))}
                          </select>
                        </label>
                        {resultatWebp && (
                          <>
                            <button type="button" className="sdp-boto sdp-boto--primari" onClick={descarregaWebpGenerat}>
                              Descarregar .webp ({formatKb(resultatWebp.mida)})
                            </button>
                            {handleNatiu && EXTENSIONS_RASTER_CONVERTIBLE.has(seleccionat.ext) && (
                              <button type="button" className="sdp-boto sdp-boto--secundari" onClick={desaWebpACarpetaLocal}>
                                Guardar .webp a la carpeta local
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="photo-grid">
                      <figure className="card">
                        <div className="card__body">
                          <figcaption>
                            <strong>Original ({seleccionat.ext.toUpperCase()} · {formatKb(seleccionat.mida)})</strong>
                          </figcaption>
                          <img
                            id="sdp-img-original-local"
                            src={detallSeleccionat.url}
                            alt={seleccionat.nom}
                            onLoad={(e) => generaPrevisualitzacioWebp(e.currentTarget, qualitatWebp, maxCostat)}
                          />
                        </div>
                      </figure>

                      {resultatWebp && (
                        <figure className="card">
                          <div className="card__body">
                            <figcaption>
                              <strong>
                                Resultat WebP ({resultatWebp.ample} × {resultatWebp.alt} px · {formatKb(resultatWebp.mida)} ·{' '}
                                {seleccionat.mida > resultatWebp.mida
                                  ? `-${Math.round(((seleccionat.mida - resultatWebp.mida) / seleccionat.mida) * 100)}%`
                                  : 'mateix pes'})
                              </strong>
                            </figcaption>
                            <img src={resultatWebp.url} alt={`Previsualització WebP de ${seleccionat.nom}`} />
                          </div>
                        </figure>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="card card--soft">
            <div className="card__body">
              <div className="notes-list-header">
                <h3 className="section-title">
                  Fitxers a la vista ({elementsFiltrats.length})
                </h3>
              </div>
              <div className="stack-grid">
                {elementsFiltrats.map((el) => (
                  <div key={el.ruta} className="notes-list-header">
                    <div>
                      <strong>{el.nom}</strong>{' '}
                      <span className="pill">{el.subcarpeta}</span>{' '}
                      <span className="pill">{formatKb(el.mida)}</span>{' '}
                      {el.emparelladaWeb && <span className="pill sdp-badge-system">Emparellada Web</span>}
                      {el.inedita && <span className="pill sdp-badge-category">Inèdita (sense .webp)</span>}
                      {el.teBessonaLocal && <span className="pill">Bessona .webp local</span>}
                      {el.pesAlt && <span className="pill">Pes alt</span>}
                      {el.duplicada && <span className="pill">Possible duplicat</span>}
                      <div>
                        <small><code>{el.ruta}</code></small>
                      </div>
                    </div>
                    {el.tipus === 'imatge' && (
                      <button
                        type="button"
                        className="sdp-boto sdp-boto--secundari"
                        onClick={() => obriElementLocal(el)}
                      >
                        Inspeccionar i provar WebP
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

