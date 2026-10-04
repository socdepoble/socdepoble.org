/**
 * VistaEnConstruccio.jsx — la columna central d'una entrada del rail que encara
 * no té lògica (onada 3B, decisió del Mestre, 260928): Telefonades i Destacats
 * existixen per a que l'esquelet de navegació quede idèntic al de WhatsApp
 * Desktop (captures 19.41.49 i 19.42.17), però no fan res encara i ho diuen.
 *
 * Ordre del Mestre del 261004 (prompt 261004_0515, T5) · Contingut multimèdia
 * (captura 19.41.58) ix d'ací: ja és operativa i la pinta VistaMultimedia.
 * La fila de títol (FilaDeTitolVista) i el bloc del subtítol i el control
 * segmentat (FilaSegments) s'exporten perquè les dos vistes pinten el MATEIX
 * DOM; ací no canvia res.
 *
 * De dalt a baix, calcant la captura de cada vista:
 *   · la fila de títol (AppGridColumn, fila 1 de la graella) amb el títol i
 *     les accions de la dreta: el «+» redó (Telefonades), la píndola
 *     «Editar» (Destacats) o, si en porta, botons d'icona;
 *   · si la captura en porta, el subtítol i el control segmentat;
 *   · si la captura en porta, el cercador en píndola (Telefonades i
 *     Destacats);
 *   · el cos: una targeta «En construcció» que diu què hi haurà i que encara
 *     no està disponible. L'avís és el genèric del xat, llevat que la vista en
 *     porte un de propi (`avis`): Telefonades porta el de D17 (ordre del
 *     Mestre, 260930), que és l'única font d'eixe text per al rail, la barra
 *     mòbil i el toast dels controls inerts.
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

const CAP = Object.freeze([]);
const noop = () => {};

/* Les dos vistes en construcció: què porta cada fila de títol i què hi
   haurà. Parells [clau i18n, text en valencià]; el títol i la icona són els
   de l'entrada del rail (ENTRADES_RAIL, ClosCaXat.jsx). `icones`: botons
   d'icona de la fila de títol, [clau, text, Icona]. `avis`: l'avís propi de
   la vista, en lloc del genèric (D17, Telefonades).
   Torn 261004 (T5) · Contingut multimèdia ja no hi és: els seus textos viuen
   a TEXTOS_MULTIMEDIA (VistaMultimedia.jsx), amb les mateixes claus. */
export const VISTES_EN_CONSTRUCCIO = Object.freeze({
  telefonades: Object.freeze({
    accio: Object.freeze({ tipus: 'nou', etiqueta: ['section.xat.vista.telefonades.nova', 'Nova telefonada'] }),
    cerca: ['section.xat.nou.cerca', "Nom, número o @nom d'usuari"],
    descripcio: ['section.xat.vista.telefonades.text', 'Ací hi haurà les telefonades i les videotelefonades amb la gent del poble: les perdudes, les rebudes i les que fas tu.'],
    avis: Object.freeze(['nav.telefonades.avis', 'Aquest és un projecte lliure CC. Aquesta funció està prevista per a quan puguem mantenir-la econòmicament.'])
  }),
  destacats: Object.freeze({
    accio: Object.freeze({ tipus: 'pindola', etiqueta: ['section.xat.vista.destacats.editar', 'Editar'] }),
    cerca: ['section.xat.vista.cerca', 'Cerca'],
    descripcio: ['section.xat.vista.destacats.text', "Ací hi haurà els missatges que marques amb l'estrela, de totes les converses, per a trobar-los de pressa."]
  })
});

/* Torn 260930 (T1) · El títol i l'avís genèric de la targeta, en un sol lloc:
   les pàgines en construcció del full «Ajustos» (FullAjustos) diuen el
   mateix amb les mateixes claus. */
export const TEXTOS_CONSTRUCCIO = Object.freeze({
  titol: Object.freeze(['section.xat.construccio.titol', 'En construcció']),
  avis: Object.freeze(['section.xat.construccio.avis', 'Encara no està disponible: es construirà en una fase següent del xat.'])
});

/**
 * Els textos d'una vista, ja traduïts, per a passar-los a VistaEnConstruccio.
 * Null si la vista no és una de les que estan en construcció (des del 261004,
 * Telefonades i Destacats). `avis` és buit si la vista no en porta cap de
 * propi (la targeta pinta llavors el genèric).
 */
export function textosDeVista(id, t) {
  const config = VISTES_EN_CONSTRUCCIO[id];
  if (!config) return null;
  const tr = (parell) => (parell ? t(parell[0], parell[1]) : '');
  return {
    icones: (config.icones || CAP).map(([clau, text, Icona]) => ({ etiqueta: t(clau, text), Icona })),
    subtitol: tr(config.subtitol),
    accio: config.accio ? { tipus: config.accio.tipus, etiqueta: tr(config.accio.etiqueta) } : null,
    segments: config.segments ? { etiqueta: tr(config.segments.etiqueta), opcions: config.segments.opcions.map(tr) } : null,
    cerca: tr(config.cerca),
    descripcio: tr(config.descripcio),
    avis: tr(config.avis)
  };
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
    <AppGridColumn esDark={true} titol={titol} icona={icona} esquerra={esquerra}>
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

      <div className="sdp-workspace-column__body">
        <section className="sdp-xat-construccio" aria-labelledby={idTitol}>
          <span className="sdp-xat-construccio__icona" aria-hidden="true">
            <Construction size={32} aria-hidden="true" focusable="false" />
          </span>
          <h3 id={idTitol} className="sdp-xat-construccio__titol">{t(...TEXTOS_CONSTRUCCIO.titol)}</h3>
          {descripcio ? <p className="sdp-xat-construccio__text">{descripcio}</p> : null}
          <p className="sdp-xat-construccio__avis">
            {avis || t(...TEXTOS_CONSTRUCCIO.avis)}
          </p>
        </section>
      </div>
    </>
  );
}
