/**
 * VistaMultimedia.jsx — la columna central de «Contingut multimèdia»
 * (/xat?vista=multimedia), 100 % operativa (Onada v1.2.25 · Lot G1):
 *
 *   · Fila de títol amb les 3 accions VIVES (zero inerts):
 *       - Cerca: desplega el cercador per text, conversa, autor, domini o nom de document;
 *       - Ordena: commuta entre més recents primer i més antics primer (aria-pressed);
 *       - Selecciona: permet marcar elements (i copiar enllaços seleccionats en lot).
 *   · Control segmentat «Fitxers | Enllaços | Documents» (aria-pressed).
 *   · Miniatures segures per a imatges amb `adjunt.id` resoltes sota demanda via `urlAdjuntXat`
 *     (MAI URLs externes crues de metadades — zero píxels espia).
 *   · Estats buits i avisos amb `<EstatBuit>` i `<Alerta>` canònics de Pedra Seca 2.0.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CircleX, Copy, FileText, Image as ImageIcon, Link2, ListChecks, ListFilter, Search, X } from 'lucide-react';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import { Alerta, Boto, EstatBuit } from '../../../components/PedraSeca/index.js';
import { useFullDiferit } from '../../../config/fullDiferit.js';
import { teCapacitat, urlAdjuntXat } from '../../../data/backendPort.js';
import { plega } from '../../search/indexCerca.js';
import cssV1225 from '../../../css/diferit-xat-v1225.css?inline';
import { FilaSegments } from './VistaEnConstruccio.jsx';
import EnllacSegur from './EnllacSegur.jsx';
import { AvatarFil } from './FilaConversa.jsx';
import { IconaFiltre } from './FiltresCerca.jsx';
import { FILTRES_CERCA_XAT } from '../cercaXat.js';
import { normalitzaLlenguaXat, textXatV1225 } from '../i18nVistesXatV1225.js';
import { PESTANYES_MULTIMEDIA, agrupaPerMes, contingutMultimedia } from '../multimediaXat.js';
import { etiquetaLlista } from '../temps.js';

const CAP = Object.freeze([]);
const noop = () => {};

/* Els textos de la vista, parells [clau i18n, text en valencià]. Es conserven
   totes les claus registrades als diccionaris globals. */
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
  avisAdjunts: Object.freeze(['section.xat.vista.multimedia.avisAdjunts', 'Pel xat ja es poden enviar fotos, vídeos, notes de veu i documents (PDF, CSV, ODT, DOCX, TXT), si la conversa ho permet.']),
  avisLocal: Object.freeze(['section.xat.vista.multimedia.avisLocal', 'Només es veu el contingut de les converses obertes en esta sessió.']),
  obri: Object.freeze(['section.xat.vista.multimedia.obri', 'Obri la conversa de {nom}']),
  senseData: Object.freeze(['section.xat.vista.multimedia.senseData', 'Sense data'])
});

function nomDe(fil, t) {
  return fil?.name || fil?.title || t('section.xat.conversaSenseNom', 'Conversa');
}

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

/* Miniatura segura: només per `adjunt.id` via port `urlAdjuntXat` (mai URLs externes). */
function MiniaturaSegura({ adjuntId, configAdjunts, fallback }) {
  const [urlResolta, setUrlResolta] = useState(null);
  useEffect(() => {
    if (!adjuntId || !teCapacitat('xatMultimedia')) return undefined;
    const ctrl = new AbortController();
    let allibera = null;
    let muntat = true;
    urlAdjuntXat(adjuntId, { ...configAdjunts, signal: ctrl.signal }, {
      renova: false,
      reten: (fn) => { if (typeof fn === 'function') allibera = fn; }
    }).then((url) => {
      if (!muntat || ctrl.signal.aborted) { allibera?.(); return; }
      setUrlResolta(url || null);
    }).catch(() => {});
    return () => {
      muntat = false;
      ctrl.abort();
      allibera?.();
    };
  }, [adjuntId, configAdjunts]);

  if (urlResolta) {
    return (
      <img
        src={urlResolta}
        alt=""
        className="sdp-xat-multimedia__miniatura"
        width="48"
        height="48"
        loading="lazy"
        decoding="async"
      />
    );
  }
  return fallback;
}

function FilaEnllac({ item, onObriFil, locale, t, seleccio = null }) {
  const { fil, missatge, enllac } = item;
  const nom = nomDe(fil, t);
  const autor = autorDe(missatge, t);
  const hora = etiquetaLlista(missatge.creatAl, { locale, t });
  const vist = autor ? `${nom} · ${autor}` : nom;
  const etiqueta = t(...TEXTOS_MULTIMEDIA.obri).replace('{nom}', () => (hora ? `${vist} ${hora}` : vist));
  const triat = Boolean(seleccio?.triats?.has(item.clau));
  return (
    <li className="sdp-xat-multimedia__item">
      <div className="sdp-xat-multimedia__seleccio-item">
        {seleccio ? (
          <input
            type="checkbox"
            checked={triat}
            aria-label={enllac.href}
            onChange={() => seleccio.onAlterna(item.clau)}
          />
        ) : null}
        <span className="sdp-xat-multimedia__host">{enllac.host}</span>
      </div>
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

function FilaAdjunt({ item, onObriFil, locale, t, configAdjunts = null, seleccio = null }) {
  const { fil, missatge, tipus } = item;
  const filtre = FILTRES_CERCA_XAT.find((f) => f.id === tipus) || null;
  const nom = nomDe(fil, t);
  const etiqueta = filtre ? t(filtre.clauI18n, filtre.etiqueta) : '';
  const nomAdjunt = String(missatge.metadades?.adjunt?.nom || missatge.metadades?.adjunt?.name || '').trim();
  const text = typeof missatge.text === 'string' && missatge.text.trim() ? missatge.text.trim() : nomAdjunt;
  const hora = etiquetaLlista(missatge.creatAl, { locale, t });
  const adjuntId = missatge.tipus === 'imatge' && missatge.metadades?.adjunt?.id
    ? String(missatge.metadades.adjunt.id)
    : null;
  const iconaFallback = (
    <span className="sdp-xat-avatar-icona" aria-hidden="true">
      <IconaFiltre nom={filtre?.icona} size={24} />
    </span>
  );
  const triat = Boolean(seleccio?.triats?.has(item.clau));

  return (
    <li className="sdp-xat-multimedia__adjunt">
      <div className="sdp-xat-multimedia__seleccio-item">
        {seleccio ? (
          <input
            type="checkbox"
            checked={triat}
            aria-label={text ? `${nom}: ${text}` : `${nom}: ${etiqueta}`}
            onChange={() => seleccio.onAlterna(item.clau)}
          />
        ) : null}
        <button type="button" className="sdp-xat-fila sdp-xat-fila--senzilla" onClick={() => onObriFil(fil.id)}>
          {adjuntId ? (
            <MiniaturaSegura adjuntId={adjuntId} configAdjunts={configAdjunts} fallback={iconaFallback} />
          ) : iconaFallback}
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
      </div>
    </li>
  );
}

export default function VistaMultimedia({
  titol, icona = null, esquerra = null, fils = CAP, missatgesPerFil = null,
  configAdjunts = null, onObriFil = noop, locale = 'ca-ES', idioma: idiomaProp = null, t
}) {
  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'xat-v1225', cssV1225);

  const idioma = normalitzaLlenguaXat(idiomaProp || locale);
  const [pestanya, setPestanya] = useState(PESTANYES_MULTIMEDIA[0]);
  const [cercaOberta, setCercaOberta] = useState(false);
  const [terme, setTerme] = useState('');
  const [ordreAntic, setOrdreAntic] = useState(false);
  const [modeSeleccio, setModeSeleccio] = useState(false);
  const [triats, setTriats] = useState(() => new Set());
  const [avisCopia, setAvisCopia] = useState('');
  const cercaRef = useRef(null);
  const lupaRef = useRef(null);
  const idCerca = useId();

  const tr = (parell) => t(parell[0], parell[1]);
  const segments = { etiqueta: tr(TEXTOS_MULTIMEDIA.segments.etiqueta), opcions: TEXTOS_MULTIMEDIA.segments.opcions.map(tr) };
  const triat = PESTANYES_MULTIMEDIA.indexOf(pestanya);

  useEffect(() => {
    if (cercaOberta) cercaRef.current?.focus();
  }, [cercaOberta]);

  const itemsBase = useMemo(
    () => contingutMultimedia({ fils, missatgesPerFil, pestanya }),
    [fils, missatgesPerFil, pestanya]
  );

  const termeNet = terme.trim();
  const plegat = plega(termeNet);
  const itemsFiltrats = useMemo(() => {
    const filtrats = !plegat ? itemsBase : itemsBase.filter((item) => {
      const text = [
        item.fil?.name,
        item.fil?.title,
        item.missatge?.author,
        item.missatge?.text,
        item.missatge?.metadades?.adjunt?.nom,
        item.enllac?.host,
        item.enllac?.href
      ].filter(Boolean).join(' ');
      return plega(text).includes(plegat);
    });
    return ordreAntic ? [...filtrats].reverse() : filtrats;
  }, [itemsBase, plegat, ordreAntic]);

  const grups = useMemo(
    () => agrupaPerMes(itemsFiltrats, { locale }),
    [itemsFiltrats, locale]
  );

  const alternaSeleccioItem = (clau) => {
    setTriats((previs) => {
      const nous = new Set(previs);
      if (nous.has(clau)) nous.delete(clau);
      else nous.add(clau);
      return nous;
    });
  };

  const copiaEnllacosTriats = async () => {
    const urls = itemsFiltrats
      .filter((item) => triats.has(item.clau) && item.enllac?.href)
      .map((item) => item.enllac.href);
    if (!urls.length) return;
    if (typeof navigator?.clipboard?.writeText !== 'function') {
      setAvisCopia(textXatV1225(idioma, 'multimedia.errorCopia'));
      return;
    }
    try {
      await navigator.clipboard.writeText(urls.join('\n'));
      setAvisCopia(textXatV1225(idioma, 'multimedia.enllacosCopiats'));
    } catch {
      setAvisCopia(textXatV1225(idioma, 'multimedia.errorCopia'));
    }
  };

  const etiquetaCerca = tr(TEXTOS_MULTIMEDIA.icones[0]);
  const etiquetaOrdena = tr(TEXTOS_MULTIMEDIA.icones[1]);
  const etiquetaSelecciona = tr(TEXTOS_MULTIMEDIA.icones[2]);
  const titolOrdena = ordreAntic ? textXatV1225(idioma, 'multimedia.ordenaAntic') : textXatV1225(idioma, 'multimedia.ordenaRecent');

  const seleccioObj = modeSeleccio ? { triats, onAlterna: alternaSeleccioItem } : null;
  let cos;
  if (grups.length) {
    const Fila = pestanya === 'enllacos' ? FilaEnllac : FilaAdjunt;
    cos = grups.map((grup) => (
      <GrupDeMes key={grup.clau || 'sense-data'} titol={grup.titol || tr(TEXTOS_MULTIMEDIA.senseData)}>
        {grup.items.map((item) => (
          <Fila
            key={item.clau}
            item={item}
            onObriFil={onObriFil}
            locale={locale}
            t={t}
            configAdjunts={configAdjunts}
            seleccio={seleccioObj}
          />
        ))}
      </GrupDeMes>
    ));
  } else if (termeNet) {
    cos = (
      <div role="status">
        <EstatBuit icona={Search} titol={textXatV1225(idioma, 'multimedia.buitCercaTitol')}>
          <p>{textXatV1225(idioma, 'multimedia.buitCercaText', { terme: termeNet })}</p>
        </EstatBuit>
      </div>
    );
  } else if (pestanya === 'enllacos') {
    cos = (
      <div role="status">
        <EstatBuit icona={Link2} titol={textXatV1225(idioma, 'multimedia.buitEnllacosTitol')}>
          <p>{tr(TEXTOS_MULTIMEDIA.buit.enllacos)}</p>
        </EstatBuit>
      </div>
    );
  } else {
    const IconaBuit = pestanya === 'documents' ? FileText : ImageIcon;
    const titolBuit = pestanya === 'documents'
      ? textXatV1225(idioma, 'multimedia.buitDocumentsTitol')
      : textXatV1225(idioma, 'multimedia.buitFitxersTitol');
    cos = (
      <div className="sdp-xat-multimedia__alerta">
        <EstatBuit icona={IconaBuit} titol={titolBuit}>
          <p>{tr(TEXTOS_MULTIMEDIA.buit[pestanya])}</p>
        </EstatBuit>
        <Alerta to="info" viva={false}>
          <p>{tr(TEXTOS_MULTIMEDIA.avisAdjunts)}</p>
        </Alerta>
      </div>
    );
  }

  return (
    <div ref={arrelRef}>
      <AppGridColumn esDark={true} titol={esquerra ? null : titol} icona={esquerra ? null : icona} esquerra={esquerra}>
        <button
          ref={lupaRef}
          type="button"
          className="sdp-xat-icona"
          aria-label={etiquetaCerca}
          title={etiquetaCerca}
          aria-expanded={cercaOberta}
          aria-controls={cercaOberta ? idCerca : undefined}
          onClick={() => {
            if (cercaOberta) { setCercaOberta(false); setTerme(''); }
            else setCercaOberta(true);
          }}
        >
          <Search size={24} aria-hidden="true" focusable="false" />
        </button>
        <button
          type="button"
          className="sdp-xat-icona"
          aria-label={etiquetaOrdena}
          title={titolOrdena}
          aria-pressed={ordreAntic ? 'true' : 'false'}
          onClick={() => setOrdreAntic((v) => !v)}
        >
          <ListFilter size={24} aria-hidden="true" focusable="false" />
        </button>
        <button
          type="button"
          className="sdp-xat-icona"
          aria-label={etiquetaSelecciona}
          title={modeSeleccio ? textXatV1225(idioma, 'multimedia.surtSeleccio') : textXatV1225(idioma, 'multimedia.selecciona')}
          aria-pressed={modeSeleccio ? 'true' : 'false'}
          onClick={() => {
            setModeSeleccio((v) => {
              if (v) { setTriats(new Set()); setAvisCopia(''); }
              return !v;
            });
          }}
        >
          <ListChecks size={24} aria-hidden="true" focusable="false" />
        </button>
      </AppGridColumn>

      <FilaSegments
        subtitol={tr(TEXTOS_MULTIMEDIA.subtitol)}
        segments={segments}
        triat={triat}
        onTria={(i) => {
          setPestanya(PESTANYES_MULTIMEDIA[i]);
          setTriats(new Set());
          setAvisCopia('');
        }}
      />

      {cercaOberta ? (
        <div id={idCerca} className="sdp-xat-cerca">
          <div className="sdp-xat-cerca__camp">
            <label className="sdp-xat-cerca__etiqueta">
              <span className="sdp-nomes-lector">{etiquetaCerca}</span>
              <Search size={20} aria-hidden="true" focusable="false" />
              <input
                ref={cercaRef}
                type="search"
                autoComplete="off"
                value={terme}
                placeholder={textXatV1225(idioma, 'multimedia.cercaPlaceholder')}
                onChange={(e) => setTerme(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    if (terme) setTerme('');
                    else { setCercaOberta(false); lupaRef.current?.focus(); }
                  }
                }}
              />
            </label>
            <button
              type="button"
              className="sdp-xat-icona"
              aria-label={textXatV1225(idioma, 'multimedia.cercaNeteja')}
              title={textXatV1225(idioma, 'multimedia.cercaNeteja')}
              onClick={() => {
                if (terme) { setTerme(''); cercaRef.current?.focus(); }
                else { setCercaOberta(false); lupaRef.current?.focus(); }
              }}
            >
              <CircleX size={20} aria-hidden="true" focusable="false" />
            </button>
          </div>
        </div>
      ) : null}

      {modeSeleccio ? (
        <div className="sdp-xat-multimedia__barra-seleccio" role="region" aria-label={etiquetaSelecciona}>
          <span role="status">
            {avisCopia || textXatV1225(idioma, 'multimedia.seleccionats', { n: triats.size })}
          </span>
          <div className="sdp-xat-cerca-conversa__accions">
            {pestanya === 'enllacos' && triats.size > 0 ? (
              <Boto varietat="secundari" icona={Copy} onClick={copiaEnllacosTriats}>
                {textXatV1225(idioma, 'multimedia.copiaEnllacos')}
              </Boto>
            ) : null}
            <button
              type="button"
              className="sdp-xat-icona"
              aria-label={textXatV1225(idioma, 'multimedia.surtSeleccio')}
              onClick={() => { setModeSeleccio(false); setTriats(new Set()); setAvisCopia(''); }}
            >
              <X size={20} aria-hidden="true" focusable="false" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="sdp-workspace-column__body">
        <div className="sdp-xat-multimedia" role="region" aria-label={segments.opcions[triat]}>
          {cos}
          <p className="sdp-xat-resultats__avis">{tr(TEXTOS_MULTIMEDIA.avisLocal)}</p>
        </div>
      </div>
    </div>
  );
}
