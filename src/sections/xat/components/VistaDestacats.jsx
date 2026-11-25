/**
 * VistaDestacats.jsx — Vista operativa de missatges destacats del Xat (v1.2.25 · Lot G1).
 *
 *  · Substituïx el placeholder «En construcció» de `?vista=destacats`.
 *  · Combina els destacats sincronitzats del compte (`missatgesDestacats` via `carregaDestacats`)
 *    amb els missatges destacats carregats en esta sessió (`missatgesPerFil`), ordenats pel més recent.
 *  · Cerca local en temps real (plegant accents) per text, autor i nom de la conversa.
 *  · Mode «Edita» per a llevar destacats ràpidament o botó germà d'estrela en cada fila.
 *  · Salt directe a la conversa i al missatge (`onObriMissatge(filId, missatgeId)`).
 *  · Estats buits i avisos amb `<EstatBuit>` i `<Alerta>` canònics de Pedra Seca 2.0.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleX, Search, Star } from 'lucide-react';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import { Alerta, Carregant, EstatBuit } from '../../../components/PedraSeca/index.js';
import { useFullDiferit } from '../../../config/fullDiferit.js';
import { plega } from '../../search/indexCerca.js';
import cssV1225 from '../../../css/diferit-xat-v1225.css?inline';
import { etiquetaLlista } from '../temps.js';
import { textXatV1225 } from '../i18nVistesXatV1225.js';

const CAP = Object.freeze([]);
const noop = () => {};

function nomDeFil(fil, fallback) {
  return fil?.name || fil?.title || fallback;
}

function instantDe(iso) {
  const ms = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(ms) ? ms : 0;
}

function llistaMissatgesDe(missatgesPerFil, filId) {
  if (typeof missatgesPerFil === 'function') {
    const res = missatgesPerFil(filId);
    return Array.isArray(res) ? res : CAP;
  }
  const res = missatgesPerFil?.[filId];
  return Array.isArray(res) ? res : CAP;
}

function recullDestacats({ fils, missatgesPerFil, missatgesDestacats, idioma, t }) {
  const filPerId = new Map();
  for (const fil of fils || CAP) {
    if (fil?.id != null) filPerId.set(String(fil.id), fil);
  }

  const perClau = new Map();
  const nomPerDefecte = t?.('section.xat.conversaSenseNom', 'Conversa') || 'Conversa';
  const nomTu = t?.('section.xat.rail.tu', 'Tu') || 'Tu';

  // 1) Missatges destacats carregats en memòria de cada fil
  for (const fil of fils || CAP) {
    if (fil?.id == null) continue;
    const filId = String(fil.id);
    const llista = llistaMissatgesDe(missatgesPerFil, filId);
    for (const m of llista) {
      if (!m || m.id == null || m.esborrat || m.esborratAl || m.bloquejat || m.amagat) continue;
      if (!(m.destacat === true || m.metadades?.destacat === true)) continue;
      const clau = `${filId}::${m.id}`;
      perClau.set(clau, {
        clau,
        filId,
        missatgeId: String(m.id),
        conversa: nomDeFil(fil, nomPerDefecte),
        autor: m.sender === 'me' ? nomTu : (m.author || m.autorNom || nomDeFil(fil, nomPerDefecte)),
        text: String(m.text ?? '').trim(),
        creatAl: m.creatAl || m.created_at || null,
        instant: instantDe(m.creatAl || m.created_at),
        missatge: { ...m, filId },
        carregat: true
      });
    }
  }

  // 2) Índex de destacats del compte (carregaDestacats -> estatAccions.destacats)
  for (const entrada of missatgesDestacats || CAP) {
    if (!entrada || entrada.missatgeId == null || entrada.filId == null || entrada.destacat === false) continue;
    const filId = String(entrada.filId);
    const missatgeId = String(entrada.missatgeId);
    const clau = `${filId}::${missatgeId}`;
    if (perClau.has(clau)) continue;
    const fil = filPerId.get(filId) || null;
    const llista = llistaMissatgesDe(missatgesPerFil, filId);
    const trobat = llista.find((m) => m?.id != null && String(m.id) === missatgeId) || null;
    if (trobat && (trobat.esborrat || trobat.esborratAl || trobat.bloquejat || trobat.amagat)) continue;
    const creatAl = trobat?.creatAl || entrada.creatAl || entrada.actualitzatAl || fil?.ultimAl || null;
    perClau.set(clau, {
      clau,
      filId,
      missatgeId,
      conversa: nomDeFil(fil, nomPerDefecte),
      autor: trobat ? (trobat.sender === 'me' ? nomTu : (trobat.author || trobat.autorNom || nomDeFil(fil, nomPerDefecte))) : nomDeFil(fil, nomPerDefecte),
      text: trobat ? String(trobat.text ?? '').trim() : textXatV1225(idioma, 'destacats.pendentCarrega'),
      creatAl,
      instant: instantDe(creatAl),
      missatge: trobat ? { ...trobat, filId } : { id: missatgeId, filId, destacat: true },
      carregat: Boolean(trobat)
    });
  }

  return [...perClau.values()].sort((a, b) => b.instant - a.instant);
}

export default function VistaDestacats({
  titol,
  icona = Star,
  esquerra = null,
  fils = CAP,
  missatgesPerFil = CAP,
  missatgesDestacats = CAP,
  onCarregaDestacats = null,
  onObriMissatge = noop,
  onAlternaDestacat = null,
  senseSessio = false,
  locale = 'ca-ES',
  idioma = 'ca',
  t = (_, fallback) => fallback
}) {
  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'xat-v1225', cssV1225);

  const [terme, setTerme] = useState('');
  const [editant, setEditant] = useState(false);
  const [carregant, setCarregant] = useState(false);
  const [errorCarrega, setErrorCarrega] = useState(false);
  const [tretsLocals, setTretsLocals] = useState(() => new Set());
  const campCercaRef = useRef(null);

  useEffect(() => {
    if (typeof onCarregaDestacats !== 'function' || senseSessio) return undefined;
    let actiu = true;
    setCarregant(true);
    setErrorCarrega(false);
    /* GEM-34 · La crida és síncrona, dins de l'efecte (la prova de G1 la compta en
       muntar), i un throw síncron també arriba a l'Alerta, com un rebuig. */
    let carrega;
    try {
      carrega = Promise.resolve(onCarregaDestacats());
    } catch (error) {
      carrega = Promise.reject(error);
    }
    carrega
      .catch(() => { if (actiu) setErrorCarrega(true); })
      .finally(() => { if (actiu) setCarregant(false); });
    return () => { actiu = false; };
  }, [onCarregaDestacats, senseSessio]);

  const tots = useMemo(
    () => recullDestacats({ fils, missatgesPerFil, missatgesDestacats, idioma, t })
      .filter((item) => !tretsLocals.has(item.clau)),
    [fils, missatgesPerFil, missatgesDestacats, idioma, t, tretsLocals]
  );

  const termeNet = terme.trim();
  const plegat = plega(termeNet);
  const visibles = useMemo(() => {
    if (!plegat) return tots;
    return tots.filter((item) => plega(`${item.conversa} ${item.autor} ${item.text}`).includes(plegat));
  }, [tots, plegat]);

  const etiquetaCerca = textXatV1225(idioma, 'destacats.cerca');
  const etiquetaEdita = editant ? textXatV1225(idioma, 'destacats.fet') : textXatV1225(idioma, 'destacats.editar');

  const llevaDestacat = (item) => {
    setTretsLocals((previs) => {
      const nous = new Set(previs);
      nous.add(item.clau);
      return nous;
    });
    onAlternaDestacat?.(item.missatge, false);
  };

  return (
    <div ref={arrelRef} className="sdp-xat-destacats">
      <AppGridColumn esDark={true} titol={esquerra ? null : titol} icona={esquerra ? null : icona} esquerra={esquerra}>
        {tots.length > 0 && typeof onAlternaDestacat === 'function' ? (
          <button
            type="button"
            className="sdp-xat-vista__pindola"
            aria-pressed={editant ? 'true' : 'false'}
            onClick={() => setEditant((v) => !v)}
          >
            {etiquetaEdita}
          </button>
        ) : null}
      </AppGridColumn>

      <div className="sdp-xat-cerca">
        <div className="sdp-xat-cerca__camp">
          <label className="sdp-xat-cerca__etiqueta">
            <span className="sdp-nomes-lector">{etiquetaCerca}</span>
            <Search size={20} aria-hidden="true" focusable="false" />
            <input
              ref={campCercaRef}
              type="search"
              autoComplete="off"
              value={terme}
              placeholder={etiquetaCerca}
              onChange={(e) => setTerme(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && terme) {
                  e.preventDefault();
                  setTerme('');
                }
              }}
            />
          </label>
          {terme ? (
            <button
              type="button"
              className="sdp-xat-icona"
              aria-label={textXatV1225(idioma, 'destacats.netejaCerca')}
              title={textXatV1225(idioma, 'destacats.netejaCerca')}
              onClick={() => { setTerme(''); campCercaRef.current?.focus(); }}
            >
              <CircleX size={20} aria-hidden="true" focusable="false" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="sdp-workspace-column__body">
        {errorCarrega ? (
          <Alerta to="error" className="sdp-xat-destacats__alerta">
            {textXatV1225(idioma, 'destacats.errorCarrega')}
          </Alerta>
        ) : null}
        {carregant && tots.length === 0 ? (
          <Carregant etiqueta={textXatV1225(idioma, 'destacats.carregant')} />
        ) : visibles.length > 0 ? (
          <section aria-label={titol}>
            <p className="sdp-xat-resultats__avis" role="status">
              {visibles.length === 1
                ? textXatV1225(idioma, 'destacats.comptadorUn')
                : textXatV1225(idioma, 'destacats.comptador', { n: visibles.length })}
            </p>
            <ul className="sdp-xat-destacats__llista">
              {visibles.map((item) => {
                const hora = item.creatAl ? etiquetaLlista(item.creatAl, { locale, t }) : '';
                const textVisible = item.text || textXatV1225(idioma, 'destacats.senseText');
                return (
                  <li key={item.clau} className="sdp-xat-destacats__item">
                    <button
                      type="button"
                      className="sdp-xat-destacats__obri"
                      aria-label={textXatV1225(idioma, 'destacats.obriMissatge', { conversa: item.conversa })}
                      onClick={() => onObriMissatge(item.filId, item.missatgeId)}
                    >
                      <span className="sdp-xat-destacats__cap">
                        <span className="sdp-xat-destacats__conversa">{item.conversa}</span>
                        {hora ? <time className="sdp-xat-destacats__data" dateTime={item.creatAl}>{hora}</time> : null}
                      </span>
                      <span className="sdp-xat-destacats__text">{textVisible}</span>
                      <span className="sdp-xat-destacats__meta">{item.autor}</span>
                    </button>
                    {typeof onAlternaDestacat === 'function' ? (
                      <button
                        type="button"
                        className="sdp-xat-destacats__treu"
                        aria-label={textXatV1225(idioma, 'destacats.desdestaca')}
                        title={textXatV1225(idioma, 'destacats.desdestaca')}
                        onClick={() => llevaDestacat(item)}
                      >
                        <Star size={20} fill="currentColor" aria-hidden="true" focusable="false" />
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
            <Alerta to="info" viva={false} className="sdp-xat-destacats__alerta">
              {senseSessio ? textXatV1225(idioma, 'destacats.senseSessio') : textXatV1225(idioma, 'destacats.avisLocal')}
            </Alerta>
          </section>
        ) : termeNet ? (
          <div role="status">
            <EstatBuit icona={Search} titol={textXatV1225(idioma, 'destacats.buit.cercaTitol')}>
              <p>{textXatV1225(idioma, 'destacats.buit.cercaText', { terme: termeNet })}</p>
            </EstatBuit>
          </div>
        ) : (
          <section aria-label={titol}>
            <EstatBuit icona={Star} titol={textXatV1225(idioma, 'destacats.buit.titol')}>
              <p>{textXatV1225(idioma, 'destacats.buit.text')}</p>
            </EstatBuit>
            <Alerta to="info" viva={false} className="sdp-xat-destacats__alerta">
              {senseSessio ? textXatV1225(idioma, 'destacats.senseSessio') : textXatV1225(idioma, 'destacats.avisLocal')}
            </Alerta>
          </section>
        )}
      </div>
    </div>
  );
}
