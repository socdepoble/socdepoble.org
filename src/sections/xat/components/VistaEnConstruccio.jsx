/**
 * VistaEnConstruccio.jsx — la columna central d'una entrada del rail que encara
 * no té lògica (onada 3B, decisió del Mestre, 260928): Telefonades i Destacats
 * existixen perquè l'esquelet de navegació seguisca el patró estàndard de
 * missatgeria (captures de referència 19.41.49 i 19.42.17), però no fan res
 * encara i ho diuen.
 *
 * Ordre del Mestre del 261004 (prompt 261004_0515, T5) · Contingut multimèdia
 * (captura 19.41.58) ix d'ací: ja és operativa i la pinta VistaMultimedia.
 * La fila de títol (FilaDeTitolVista) i el bloc del subtítol i el control
 * segmentat (FilaSegments) s'exporten perquè les dos vistes pinten el MATEIX
 * DOM; ací no canvia res.
 *
 * De dalt a baix, seguint la captura de referència de cada vista:
 *   · la fila de títol (AppGridColumn, fila 1 de la graella) amb el títol i
 *     les accions de la dreta: el «+» redó (Telefonades), la píndola
 *     «Editar» (Destacats) o, si en porta, botons d'icona;
 *   · si la captura en porta, el subtítol i el control segmentat;
 *   · si la captura en porta, el cercador en píndola (Telefonades i
 *     Destacats);
 *   · el cos: una targeta «En construcció» que diu què hi haurà i que encara
 *     no està disponible. L'avís és el genèric del xat, llevat que la vista en
 *     porte un de propi (`avis`): Telefonades porta el de D17 (ordre del
 *     Mestre, 260930), que és l'única font d'eixe text per al rail i el toast
 *     dels controls inerts. La barra mòbil ja no el porta: Telefonades n'ha
 *     eixit per decisió del Mestre (261006).
 *
 * Tots els controls són INERTS: aria-disabled="true" (no `disabled`, perquè
 * es puguen enfocar i llegir) i, en prémer-los, `onEnConstruccio` (qui la
 * munta hi posa el toast «En construcció»). El cercador és readOnly. Cap
 * control fa com si. Presentacional: no llig cap context de l'app, i per això
 * es pot pintar al catàleg de disseny.
 */
import { useId } from 'react';
import { Construction, Plus, Search } from 'lucide-react';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import { Alerta, EstatBuit } from '../../../components/PedraSeca/index.js';
import { adoptaFullDiferit } from '../../../config/fullDiferit.js';
import cssV1225 from '../../../css/diferit-xat-v1225.css?inline';
import { TEXTOS_CONSTRUCCIO } from './vistaEnConstruccioModel.js';

const adoptaEstilsV1225 = (el) => { adoptaFullDiferit(el, 'xat-v1225', cssV1225); };

const CAP = Object.freeze([]);
const noop = () => {};

function IconaConstruccio() {
  return (
    <span className="sdp-xat-construccio__icona" aria-hidden="true">
      <Construction size={24} aria-hidden="true" focusable="false" />
    </span>
  );
}

/**
 * La fila de títol d'una vista del rail: el títol, la icona i, a la dreta,
 * els botons d'icona i l'acció (el «+» redó o la píndola). Tots INERTS:
 * `inert` porta aria-disabled i el clic que diu «En construcció».
 * Torn 261004 (T5) · Exportada: VistaMultimedia hi pinta la lupa, Ordena i
 * Selecciona, encara inerts, amb el mateix DOM.
 */
export function FilaDeTitolVista({ titol, icona = null, icones = CAP, accio = null, esquerra = null, inert }) {
  return (
    <AppGridColumn esDark={true} titol={esquerra ? null : titol} icona={esquerra ? null : icona} esquerra={esquerra}>
      {(icones || CAP).map(({ etiqueta, Icona }) => (
        <button key={etiqueta} type="button" className="sdp-xat-icona sdp-xat-inert" aria-label={etiqueta} title={etiqueta} {...inert}>
          <Icona size={24} aria-hidden="true" focusable="false" />
        </button>
      ))}
      {accio?.tipus === 'nou' ? (
        <button type="button" className="sdp-xat-nova sdp-xat-inert" aria-label={accio.etiqueta} title={accio.etiqueta} {...inert}>
          <Plus size={24} aria-hidden="true" focusable="false" />
        </button>
      ) : null}
      {accio?.tipus === 'pindola' ? (
        <button type="button" className="sdp-xat-vista__pindola sdp-xat-inert" {...inert}>
          {accio.etiqueta}
        </button>
      ) : null}
    </AppGridColumn>
  );
}

/**
 * El subtítol i el control segmentat, davall de la fila de títol (captura
 * 19.41.58). Res si no hi ha cap dels dos.
 *   · Sense `onTria`, els segments són inerts (`inert`) i el primer és el
 *     premut: el de les vistes en construcció.
 *   · Torn 261004 (T5) · Amb `onTria`, cada segment és un commutador de
 *     veres: aria-pressed diu quin és el `triat` i el clic crida onTria(i).
 *     El DOM és el mateix, sense aria-disabled ni .sdp-xat-inert.
 */
export function FilaSegments({ subtitol = '', segments = null, triat = 0, onTria = null, inert }) {
  const opcions = segments?.opcions || CAP;
  if (!subtitol && !opcions.length) return null;
  return (
    <div className="sdp-xat-vista__fila">
      {subtitol ? <p className="sdp-xat-vista__subtitol">{subtitol}</p> : null}
      {opcions.length ? (
        <div className="sdp-xat-segments" role="group" aria-label={segments.etiqueta}>
          {opcions.map((opcio, i) => (onTria ? (
            <button
              key={opcio}
              type="button"
              className="sdp-xat-segments__opcio"
              aria-pressed={i === triat ? 'true' : 'false'}
              onClick={() => onTria(i)}
            >
              {opcio}
            </button>
          ) : (
            <button
              key={opcio}
              type="button"
              className="sdp-xat-segments__opcio sdp-xat-inert"
              aria-pressed={i === 0 ? 'true' : 'false'}
              {...inert}
            >
              {opcio}
            </button>
          )))}
        </div>
      ) : null}
    </div>
  );
}

export default function VistaEnConstruccio({
  titol, icona = null, icones = CAP, subtitol = '', accio = null, segments = null, cerca = '', descripcio = '',
  avis = '', esquerra = null, onEnConstruccio = noop, t
}) {
  const idTitol = useId();
  /* Inert però enfocable: aria-disabled, i el clic diu «En construcció». */
  const inert = { 'aria-disabled': 'true', onClick: onEnConstruccio };

  return (
    <>
      <FilaDeTitolVista titol={titol} icona={icona} icones={icones} accio={accio} esquerra={esquerra} inert={inert} />

      <FilaSegments subtitol={subtitol} segments={segments} inert={inert} />

      {cerca ? (
        <div className="sdp-xat-cerca">
          <div className="sdp-xat-cerca__camp sdp-xat-cerca__camp--inert">
            <label className="sdp-xat-cerca__etiqueta">
              <span className="sdp-nomes-lector">{cerca}</span>
              <Search size={20} aria-hidden="true" focusable="false" />
              <input
                type="search"
                autoComplete="off"
                readOnly
                aria-disabled="true"
                placeholder={cerca}
                onClick={onEnConstruccio}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key.length === 1) onEnConstruccio(); }}
              />
            </label>
          </div>
        </div>
      ) : null}

      <div ref={adoptaEstilsV1225} className="sdp-workspace-column__body">
        <section className="sdp-xat-construccio" aria-labelledby={idTitol}>
          <EstatBuit
            icona={IconaConstruccio}
            titol={<span id={idTitol} role="heading" aria-level={3} className="sdp-xat-construccio__titol">{t(...TEXTOS_CONSTRUCCIO.titol)}</span>}
          >
            {descripcio ? <p className="sdp-xat-construccio__text">{descripcio}</p> : null}
            <Alerta to="info" viva={false} className="sdp-xat-construccio__avis">
              {avis || t(...TEXTOS_CONSTRUCCIO.avis)}
            </Alerta>
          </EstatBuit>
        </section>
      </div>
    </>
  );
}
