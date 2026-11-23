/**
 * HistorialRevisionsBar.jsx — R32.44 / R32.45 · IDEA-324 v3 · Franja compacta
 * d'historial de versions append-only (fins a 20 versions) amb botó «Desfer
 * última edició» d'1 sol clic, exportació JSON per al sentinella d'edicions
 * humanes i franja de confirmació de retorn d'identitat («Vols tornar a ser
 * Javi?»).
 *
 * Sense cap revisió desada a l'historial (`historial.length === 0`) ni cap
 * barra de retorn d'identitat, retorna `children` tal qual: zero DOM extra i
 * Llei del Píxel preservada.
 */
import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowLeft, Download, History, RotateCcw } from 'lucide-react';
import { Boto } from '../../components/PedraSeca/index.js';
import { useUIStateOpcional } from '../../app/contexts/UIContext';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { useFullDiferit } from '../../config/fullDiferit.js';
import cssHistorialRevisions from '../../css/diferit-historial-revisions.css?inline';
import {
  desferUltimaRevisioEditorial,
  exportaRevisionsHumanes,
  historialRevisionsEditorials,
  restauraVersioEditorial
} from '../../data/historialRevisionsEditorials.js';
import {
  subscriuRevisionsEditorials,
  versioRevisionsEditorials
} from '../../data/revisionsEditorials.js';
import {
  omplePlantillaEdicio,
  textosEdicioSistema
} from './i18nEdicioSistema.js';

function useIdiomaUI() {
  try {
    const ui = useUIStateOpcional();
    return ui?.llenguaDelText || ui?.language || 'ca';
  } catch {
    return 'ca';
  }
}

function formataInstant(iso, idioma = 'ca') {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const localeMap = { ca: 'ca-ES', es: 'es-ES', en: 'en-GB', eu: 'eu-ES', gl: 'gl-ES' };
  const codi = String(idioma || 'ca').toLowerCase().split(/[-_]/)[0];
  return d.toLocaleString(localeMap[codi] || 'ca-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function HistorialRevisionsBar({
  actiu = false,
  seccio,
  itemId,
  autorNom = null,
  onRestaura,
  retornIdentitat = null,
  children
}) {
  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'historial-revisions', cssHistorialRevisions);
  const idioma = useIdiomaUI();
  const tx = textosEdicioSistema(idioma);
  const { showToast } = useToast();
  const [obert, setObert] = useState(false);

  const versioStore = useSyncExternalStore(
    subscriuRevisionsEditorials,
    versioRevisionsEditorials,
    versioRevisionsEditorials
  );
  void versioStore;

  const historial = actiu ? historialRevisionsEditorials(seccio, itemId) : [];

  const manegaDesfer = useCallback(() => {
    const resultat = desferUltimaRevisioEditorial(seccio, itemId);
    if (!resultat.restaurada) return;
    onRestaura?.(resultat.camps);
    showToast(tx.historialRestaurada, 'success');
  }, [seccio, itemId, onRestaura, showToast, tx]);

  const manegaRestauraVersio = useCallback((versio) => {
    const resultat = restauraVersioEditorial(seccio, itemId, versio, { autorNom });
    if (!resultat.restaurada) return;
    onRestaura?.(resultat.camps);
    setObert(false);
    showToast(tx.historialRestaurada, 'success');
  }, [seccio, itemId, autorNom, onRestaura, showToast, tx]);

  const manegaExporta = useCallback(() => {
    const paquet = exportaRevisionsHumanes();
    const json = `${JSON.stringify(paquet, null, 2)}\n`;
    if (typeof Blob === 'function' && typeof URL?.createObjectURL === 'function' && typeof document !== 'undefined') {
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const enllac = document.createElement('a');
      enllac.href = url;
      enllac.download = 'edicions_humanes_sdp.json';
      enllac.click();
      URL.revokeObjectURL(url);
    }
    showToast(tx.historialExportat, 'success');
  }, [showToast, tx]);

  const teHistorial = actiu && historial.length > 0;
  const teRetorn = Boolean(retornIdentitat);
  if (!teHistorial && !teRetorn) return children;

  const ordenades = teHistorial ? [...historial].reverse() : [];

  return (
    <div ref={arrelRef} className="sdp-historial-revisions-marc">
      {teRetorn ? (
        <section
          className="sdp-retorn-identitat"
          aria-label={tx.retornRegio}
          data-testid="barra-retorn-identitat"
        >
          {retornIdentitat.confirmant ? (
            <div className="sdp-retorn-identitat__confirmacio" role="group" aria-label={omplePlantillaEdicio(tx.preguntaRetorn, { anterior: retornIdentitat.anteriorNom })}>
              <p className="sdp-retorn-identitat__pregunta">
                {omplePlantillaEdicio(tx.preguntaRetorn, { anterior: retornIdentitat.anteriorNom })}
              </p>
              <p className="sdp-retorn-identitat__text">
                {omplePlantillaEdicio(tx.detallRetorn, { actual: retornIdentitat.actualNom })}
              </p>
              <div className="sdp-retorn-identitat__accions">
                <Boto
                  varietat="primari"
                  className="sdp-historial-revisions__boto"
                  onClick={retornIdentitat.onTornaAAnterior}
                >
                  {omplePlantillaEdicio(tx.siTorna, { anterior: retornIdentitat.anteriorNom })}
                </Boto>
                <Boto
                  varietat="secundari"
                  className="sdp-historial-revisions__boto"
                  onClick={retornIdentitat.onQuedatComActual}
                >
                  {omplePlantillaEdicio(tx.noQuedat, { actual: retornIdentitat.actualNom })}
                </Boto>
              </div>
            </div>
          ) : (
            <>
              <p className="sdp-retorn-identitat__text">
                {omplePlantillaEdicio(tx.avisCanviPerfil, { actual: retornIdentitat.actualNom })}
              </p>
              {retornIdentitat.onDemanaTornar ? (
                <Boto
                  varietat="secundari"
                  className="sdp-historial-revisions__boto"
                  onClick={retornIdentitat.onDemanaTornar}
                >
                  <ArrowLeft size={18} aria-hidden="true" focusable="false" />
                  <span>{tx.botoTornar}</span>
                </Boto>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      {teHistorial ? (
        <section className="sdp-historial-revisions" aria-label={tx.historialRegio}>
          <div className="sdp-historial-revisions__accions">
            <Boto
              varietat="secundari"
              className="sdp-historial-revisions__boto"
              onClick={manegaDesfer}
            >
              <RotateCcw size={18} aria-hidden="true" focusable="false" />
              <span>{tx.historialDesfer}</span>
            </Boto>
            <Boto
              varietat="secundari"
              className="sdp-historial-revisions__boto"
              aria-expanded={obert}
              onClick={() => setObert((actual) => !actual)}
            >
              <History size={18} aria-hidden="true" focusable="false" />
              <span>
                {obert
                  ? tx.historialTanca
                  : omplePlantillaEdicio(tx.historialBoto, { n: String(historial.length) })}
              </span>
            </Boto>
            <Boto
              varietat="secundari"
              className="sdp-historial-revisions__boto"
              onClick={manegaExporta}
            >
              <Download size={18} aria-hidden="true" focusable="false" />
              <span>{tx.historialExporta}</span>
            </Boto>
          </div>

          {obert ? (
            <ol className="sdp-historial-revisions__llista">
              {ordenades.map((entrada, index) => (
                <li key={entrada.versio} className="sdp-historial-revisions__fila">
                  <span className="sdp-historial-revisions__meta">
                    <strong>{`v${entrada.versio}`}</strong>
                    {entrada.autorNom ? <span>{entrada.autorNom}</span> : null}
                    {entrada.desadaEl ? (
                      <time className="sdp-historial-revisions__data" dateTime={entrada.desadaEl}>
                        {formataInstant(entrada.desadaEl, idioma)}
                      </time>
                    ) : null}
                  </span>
                  {index > 0 ? (
                    <Boto
                      varietat="secundari"
                      className="sdp-historial-revisions__boto"
                      onClick={() => manegaRestauraVersio(entrada.versio)}
                    >
                      {tx.historialRestaura}
                    </Boto>
                  ) : null}
                </li>
              ))}
              <li className="sdp-historial-revisions__fila">
                <span className="sdp-historial-revisions__meta">
                  <strong>v0</strong>
                  <span>{tx.historialOriginal}</span>
                </span>
                <Boto
                  varietat="secundari"
                  className="sdp-historial-revisions__boto"
                  onClick={() => manegaRestauraVersio(0)}
                >
                  {tx.historialRestaura}
                </Boto>
              </li>
            </ol>
          ) : null}
        </section>
      ) : null}

      <div className="sdp-historial-revisions-marc__editor">{children}</div>
    </div>
  );
}

export default HistorialRevisionsBar;
