/**
 * VistaMultimedia.jsx — la columna central de «Contingut multimèdia»
 * (/xat?vista=multimedia, captura 19.41.58), operativa per ordre del Mestre
 * del 261004 (prompt 261004_0515, T5). Fins ara era una de les vistes en
 * construcció (VistaEnConstruccio).
 *
 * De dalt a baix, amb el MATEIX DOM de fila de títol i de control segmentat
 * que tenia en construcció (FilaDeTitolVista i FilaSegments):
 *   · la fila de títol amb la lupa, Ordena i Selecciona. Continuen INERTS
 *     (aria-disabled i «En construcció» en prémer-los): el Mestre encara no
 *     n'ha decidit la lògica i no hi ha captura del que fan;
 *   · el subtítol i el control segmentat «Fitxers | Enllaços | Documents»,
 *     ara de veres: aria-pressed diu la pestanya triada;
 *   · el cos, amb el contingut de multimediaXat.js agrupat per mes:
 *       - Enllaços: per a cada URL, el domini, l'enllaç (EnllacSegur: pestanya
 *         nova, rel="noopener noreferrer" i l'avís de domini enganyós) i el
 *         botó que obri la conversa on es va compartir. Són dos controls
 *         GERMANS: un <a> no pot viure dins d'un <button>;
 *       - Fitxers i Documents: F0 només envia text (SDP-XAT-010). Sense cap
 *         element, la targeta «En construcció» diu què hi haurà i que els
 *         adjunts arriben amb F1. Si n'arriben (d'un altre client o del
 *         servidor), una fila per element amb la icona del tipus i sense
 *         miniatura: encara no hi ha contracte d'URL;
 *   · sempre, l'avís local: només es veu el que s'ha carregat en esta sessió.
 * Cap previsualització d'enllaços: demanaria un servidor intermediari.
 *
 * Presentacional: no llig cap context de l'app, i per això es pot pintar al
 * catàleg de disseny. La pestanya triada és estat local.
 */
import { useId, useMemo, useState } from 'react';
import { Construction, ListChecks, ListFilter, Search } from 'lucide-react';
import { FilaDeTitolVista, FilaSegments, TEXTOS_CONSTRUCCIO } from './VistaEnConstruccio.jsx';
import EnllacSegur from './EnllacSegur.jsx';
import { AvatarFil } from './FilaConversa.jsx';
import { IconaFiltre } from './FiltresCerca.jsx';
import { FILTRES_CERCA_XAT } from '../cercaXat.js';
import { PESTANYES_MULTIMEDIA, agrupaPerMes, contingutMultimedia } from '../multimediaXat.js';
import { etiquetaLlista } from '../temps.js';

const CAP = Object.freeze([]);
const noop = () => {};

/* Els textos de la vista, parells [clau i18n, text en valencià]. Els de la
   fila de títol i del control segmentat són els que tenia en construcció,
   amb les mateixes claus; les opcions van en l'ordre de PESTANYES_MULTIMEDIA.
   `buit`: el que diu cada pestanya sense contingut. */
export const TEXTOS_MULTIMEDIA = Object.freeze({
  icones: Object.freeze([
    ['section.xat.vista.cerca', 'Cerca', Search],
    ['section.xat.vista.multimedia.ordena', 'Ordena', ListFilter],
    ['section.xat.vista.multimedia.selecciona', 'Selecciona', ListChecks]
  ]),
  subtitol: Object.freeze(['section.xat.vista.multimedia.subtitol', 'Contingut multimèdia de totes les converses']),
  segments: Object.freeze({
    etiqueta: Object.freeze(['section.xat.vista.multimedia.tipus', 'Tipus de contingut']),
    opcions: Object.freeze([
      ['section.xat.vista.multimedia.fitxers', 'Fitxers'],
      ['section.xat.vista.multimedia.enllacos', 'Enllaços'],
      ['section.xat.vista.multimedia.documents', 'Documents']
    ])
  }),
  buit: Object.freeze({
    fitxers: Object.freeze(['section.xat.vista.multimedia.fitxers.buit', "Ací hi haurà les fotos i els vídeos que s'han compartit en les converses."]),
    enllacos: Object.freeze(['section.xat.vista.multimedia.enllacos.buit', "Encara no s'ha compartit cap enllaç en les converses obertes."]),
    documents: Object.freeze(['section.xat.vista.multimedia.documents.buit', "Ací hi haurà els documents que s'han compartit en les converses."])
  }),
  adjunts: Object.freeze(['section.xat.vista.multimedia.adjunts', 'Els adjunts arriben amb la fase F1 del xat: ara només es pot enviar text.']),
  avisLocal: Object.freeze(['section.xat.vista.multimedia.avisLocal', 'Només es veu el contingut de les converses obertes en esta sessió.']),
  obri: Object.freeze(['section.xat.vista.multimedia.obri', 'Obri la conversa de {nom}']),
  senseData: Object.freeze(['section.xat.vista.multimedia.senseData', 'Sense data'])
});

function nomDe(fil, t) {
  return fil?.name || fil?.title || t('section.xat.conversaSenseNom', 'Conversa');
}

/* Qui l'ha compartit: «Tu» si és meu; si no, l'autor, quan se sap. */
function autorDe(missatge, t) {
  if (missatge?.sender === 'me') return t('section.xat.fila.tu', 'Tu');
  return missatge?.author || '';
}

function GrupDeMes({ titol, children }) {
  const id = useId();
  return (
    <section className="sdp-xat-seccio" aria-labelledby={id}>
      <h3 id={id} className="sdp-xat-seccio__titol">{titol}</h3>
      <ul className="sdp-xat-llista">{children}</ul>
    </section>
  );
}

/* Una URL: el domini, l'enllaç i, germà, el botó de la conversa.
   Revisió 261004 (Relleus 4-12) · El nom accessible del botó conté, sencer i
   en el mateix ordre, el que es veu (WCAG 2.5.3): el nom de la conversa, qui
   l'ha compartit i l'hora, darrere del verb. Abans només deia el nom de la
   conversa. El reemplaçament és una funció: amb una cadena, String.replace
   interpretaria $&, $`, $' i $$ del nom, que el posa la gent. */
function FilaEnllac({ item, onObriFil, locale, t }) {
  const { fil, missatge, enllac } = item;
  const nom = nomDe(fil, t);
  const autor = autorDe(missatge, t);
  const hora = etiquetaLlista(missatge.creatAl, { locale, t });
  const vist = autor ? `${nom} · ${autor}` : nom;
  const etiqueta = t(...TEXTOS_MULTIMEDIA.obri).replace('{nom}', () => (hora ? `${vist} ${hora}` : vist));
  return (
    <li className="sdp-xat-multimedia__item">
      <span className="sdp-xat-multimedia__host">{enllac.host}</span>
      <div className="sdp-xat-multimedia__enllac">
        <EnllacSegur segment={enllac} t={t} />
      </div>
      <button
        type="button"
        className="sdp-xat-multimedia__conversa"
        aria-label={etiqueta}
        onClick={() => onObriFil(fil.id)}
      >
        <AvatarFil fil={fil} nom={nom} mida="sm" />
        <span className="sdp-xat-multimedia__nom">{vist}</span>
        {hora ? <time className="sdp-xat-fila__hora" dateTime={missatge.creatAl}>{hora}</time> : null}
      </button>
    </li>
  );
}

/* Un fitxer o un document: una fila de xat, amb la icona del tipus en lloc
   de la miniatura, que obri la conversa.
   Ordre del Mestre (261026_2126; pla 261026_2130, P1-36) · Un adjunt no és
   cap targeta de conversa: la fila senzilla (sdp-xat-fila--senzilla)
   conserva els 72px i la icona de 48 amb el dibuix de 24 d'abans. */
function FilaAdjunt({ item, onObriFil, locale, t }) {
  const { fil, missatge, tipus } = item;
  const filtre = FILTRES_CERCA_XAT.find((f) => f.id === tipus) || null;
  const nom = nomDe(fil, t);
  const etiqueta = filtre ? t(filtre.clauI18n, filtre.etiqueta) : '';
  const text = typeof missatge.text === 'string' ? missatge.text.trim() : '';
  const hora = etiquetaLlista(missatge.creatAl, { locale, t });
  return (
    <li className="sdp-xat-multimedia__adjunt">
      <button type="button" className="sdp-xat-fila sdp-xat-fila--senzilla" onClick={() => onObriFil(fil.id)}>
        <span className="sdp-xat-avatar-icona" aria-hidden="true">
          <IconaFiltre nom={filtre?.icona} size={24} />
        </span>
        <span className="sdp-xat-fila__cos">
          <span className="sdp-xat-fila__cap">
            <span className="sdp-xat-fila__nom">{nom}</span>
            {hora ? <time className="sdp-xat-fila__hora" dateTime={missatge.creatAl}>{hora}</time> : null}
          </span>
          <span className="sdp-xat-fila__peu">
            <span className="sdp-xat-fila__previa">{text ? `${etiqueta} · ${text}` : etiqueta}</span>
          </span>
        </span>
      </button>
    </li>
  );
}

export default function VistaMultimedia({
  titol, icona = null, esquerra = null, fils = CAP, missatgesPerFil = null,
  onObriFil = noop, onEnConstruccio = noop, locale = 'ca-ES', t
}) {
  const [pestanya, setPestanya] = useState(PESTANYES_MULTIMEDIA[0]);
  const idBuit = useId();
  const tr = (parell) => t(parell[0], parell[1]);
  /* La lupa, Ordena i Selecciona: inerts però enfocables, com abans. */
  const inert = { 'aria-disabled': 'true', onClick: onEnConstruccio };
  const icones = TEXTOS_MULTIMEDIA.icones.map(([clau, text, Icona]) => ({ etiqueta: t(clau, text), Icona }));
  const segments = { etiqueta: tr(TEXTOS_MULTIMEDIA.segments.etiqueta), opcions: TEXTOS_MULTIMEDIA.segments.opcions.map(tr) };
  const triat = PESTANYES_MULTIMEDIA.indexOf(pestanya);

  const grups = useMemo(
    () => agrupaPerMes(contingutMultimedia({ fils, missatgesPerFil, pestanya }), { locale }),
    [fils, missatgesPerFil, pestanya, locale]
  );

  let cos;
  if (grups.length) {
    const Fila = pestanya === 'enllacos' ? FilaEnllac : FilaAdjunt;
    cos = grups.map((grup) => (
      <GrupDeMes key={grup.clau || 'sense-data'} titol={grup.titol || tr(TEXTOS_MULTIMEDIA.senseData)}>
        {grup.items.map((item) => <Fila key={item.clau} item={item} onObriFil={onObriFil} locale={locale} t={t} />)}
      </GrupDeMes>
    ));
  } else if (pestanya === 'enllacos') {
    cos = <p className="sdp-workspace-state" role="status">{tr(TEXTOS_MULTIMEDIA.buit.enllacos)}</p>;
  } else {
    /* F0 només envia text: els adjunts encara no existixen, i es diu. */
    cos = (
      <section className="sdp-xat-construccio" aria-labelledby={idBuit}>
        <span className="sdp-xat-construccio__icona" aria-hidden="true">
          <Construction size={32} aria-hidden="true" focusable="false" />
        </span>
        <h3 id={idBuit} className="sdp-xat-construccio__titol">{t(...TEXTOS_CONSTRUCCIO.titol)}</h3>
        <p className="sdp-xat-construccio__text">{tr(TEXTOS_MULTIMEDIA.buit[pestanya])}</p>
        <p className="sdp-xat-construccio__avis">{tr(TEXTOS_MULTIMEDIA.adjunts)}</p>
      </section>
    );
  }

  return (
    <>
      <FilaDeTitolVista titol={titol} icona={icona} icones={icones} esquerra={esquerra} inert={inert} />

      <FilaSegments
        subtitol={tr(TEXTOS_MULTIMEDIA.subtitol)}
        segments={segments}
        triat={triat}
        onTria={(i) => setPestanya(PESTANYES_MULTIMEDIA[i])}
      />

      <div className="sdp-workspace-column__body">
        <div className="sdp-xat-multimedia" role="region" aria-label={segments.opcions[triat]}>
          {cos}
          <p className="sdp-xat-resultats__avis">{tr(TEXTOS_MULTIMEDIA.avisLocal)}</p>
        </div>
      </div>
    </>
  );
}
