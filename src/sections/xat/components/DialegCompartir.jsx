/**
 * DialegCompartir.jsx — «Envia a…» / «Reenvia a…» (261026 + R32.7).
 * Serveix tant els lots que arriben del menú «Compartir» del dispositiu
 * (config/compartirNatiu.js) com l'acció «Reenvia» d'una bombolla del Xat, amb
 * cerca de converses, selecció múltiple opcional i accés directe a «Nou grup».
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Circle, Search, Users } from 'lucide-react';
import { Dialeg } from '../../../components/PedraSeca/index.js';
import { rutaDEntrada } from '../../../config/rutaEntrada.js';
import FilaConversa from './FilaConversa.jsx';

/** El resum del lot: quantes imatges, el text, o el missatge a reenviar. */
function textDelLot(lot, t) {
  if (lot.reenviat) {
    return t('section.xat.compartir.reenviaResum', 'Tria on vols reenviar el missatge.');
  }
  const n = Array.isArray(lot.fitxers) ? lot.fitxers.length : 0;
  if (n === 1) return t('section.xat.compartir.unaImatge', 'Tens una imatge per enviar. Tria la conversa.');
  if (n > 1) return t('section.xat.compartir.imatges', 'Tens {n} imatges per enviar. Tria la conversa.').replace('{n}', String(n));
  if (lot.text) return t('section.xat.compartir.text', 'Tens un text per enviar. Tria la conversa.');
  return '';
}

export default function DialegCompartir({
  obert,
  lot: lotViu,
  fils = [],
  filActiuId = null,
  senseSessio = false,
  carregant = false,
  tornar,
  onTria,
  onTriaMultiples = null,
  onNouGrup = null,
  onDescarta,
  onVes,
  locale,
  t,
  joId = null
}) {
  /* Revisió 261026 · Descartat el lot, el diàleg encara es pinta amb l'últim
     mentre es tanca per la seua via: així el focus torna on era. */
  const darrer = useRef(lotViu);
  if (lotViu) darrer.current = lotViu;
  const lot = lotViu || darrer.current;

  const [cerca, setCerca] = useState('');
  const [seleccionats, setSeleccionats] = useState(() => new Set());

  /* Tancat ja (el Dialeg fill restaura el focus abans, en el mateix commit),
     les imatges del lot descartat no han de quedar en memòria. */
  useEffect(() => {
    if (!lotViu) {
      darrer.current = null;
      setCerca('');
      setSeleccionats((previs) => (previs.size ? new Set() : previs));
    }
  }, [lotViu]);

  const esReenviament = Boolean(lot?.reenviat);
  const modeMultiple = esReenviament && typeof onTriaMultiples === 'function';

  const filsFiltrats = useMemo(() => {
    const q = cerca.trim().toLowerCase();
    if (!q) return fils;
    return fils.filter((f) => {
      const nom = String(f?.name || f?.title || f?.titol || '').toLowerCase();
      const extra = Array.isArray(f?.altresNoms) ? f.altresNoms.join(' ').toLowerCase() : '';
      return nom.includes(q) || extra.includes(q);
    });
  }, [fils, cerca]);

  if (!lot) return null;

  const resum = textDelLot(lot, t);
  const nomesRebutjats = !resum;
  const titolDialeg = nomesRebutjats
    ? t('section.xat.compartir.titolRebutjat', 'No s’ha pogut rebre')
    : esReenviament
      ? t('section.xat.compartir.titolReenvia', 'Reenvia a…')
      : t('section.xat.compartir.titol', 'Envia a…');

  const alternaFil = (fil) => {
    if (!modeMultiple) {
      onTria?.(fil);
      return;
    }
    const clau = String(fil.id);
    setSeleccionats((previs) => {
      const nous = new Set(previs);
      if (nous.has(clau)) nous.delete(clau);
      else nous.add(clau);
      return nous;
    });
  };

  const confirmaMultiples = () => {
    const triats = fils.filter((f) => seleccionats.has(String(f.id)));
    if (triats.length > 0) onTriaMultiples(triats);
  };

  return (
    <Dialeg
      obert={obert && Boolean(lotViu)}
      onTanca={onDescarta}
      titol={titolDialeg}
      mida="s"
      className="sdp-xat-dialeg"
    >
      <div className="sdp-xat-dialeg__cos">
        {resum ? <p>{resum}</p> : null}
        {lot.rebutjats > 0 ? (
          <p className="sdp-xat-avis" role="status">
            {lot.rebutjats === 1
              ? t('section.xat.compartir.rebutjat', "Un fitxer no es pot enviar al xat: s'admeten imatges del dispositiu (es comprimeixen automàticament) i text.")
              : t('section.xat.compartir.rebutjats', "{n} fitxers no es poden enviar al xat: s'admeten imatges del dispositiu (es comprimeixen automàticament) i text.").replace('{n}', String(lot.rebutjats))}
          </p>
        ) : null}
        {nomesRebutjats ? null : senseSessio ? (
          <p className="sdp-xat-avis" role="status">
            {t('section.xat.compartir.calEntrar', 'Entra per enviar-ho.')}
            {' '}<button type="button" className="sdp-xat-pindola" onClick={() => onVes(rutaDEntrada({ tornar }))}>
              {t('section.xat.sessio.entrar', 'Entrar')}
            </button>
          </p>
        ) : (
          <>
            {typeof onNouGrup === 'function' ? (
              <button
                type="button"
                className="sdp-xat-compartir__nou-grup"
                onClick={() => onNouGrup(lot)}
              >
                <span className="sdp-xat-compartir__nou-grup-icona" aria-hidden="true">
                  <Users size={20} focusable="false" />
                </span>
                <span>{t('section.xat.compartir.nouGrup', 'Nou grup')}</span>
              </button>
            ) : null}
            {esReenviament && fils.length > 1 ? (
              <label className="sdp-xat-compartir__cerca">
                <Search size={18} aria-hidden="true" focusable="false" />
                <input
                  type="search"
                  value={cerca}
                  onChange={(e) => setCerca(e.target.value)}
                  placeholder={t('section.xat.compartir.cerca', 'Cerca una conversa…')}
                  aria-label={t('section.xat.compartir.cerca', 'Cerca una conversa…')}
                />
              </label>
            ) : null}
            {carregant && !fils.length ? (
              <p className="sdp-xat-avis" role="status">{t('section.xat.carregant', 'Carregant…')}</p>
            ) : filsFiltrats.length ? (
              <ul className="sdp-xat-llista" aria-label={t('section.xat.compartir.converses', 'Converses on es pot enviar')}>
                {filsFiltrats.map((fil) => {
                  const marcat = modeMultiple && seleccionats.has(String(fil.id));
                  return (
                    <li key={fil.id} className={modeMultiple ? 'sdp-xat-compartir__fila-multiple' : undefined}>
                      {modeMultiple ? (
                        <span className="sdp-xat-compartir__casella" aria-hidden="true">
                          {marcat ? <CheckCircle2 size={20} focusable="false" /> : <Circle size={20} focusable="false" />}
                        </span>
                      ) : null}
                      <FilaConversa
                        fil={fil}
                        activa={modeMultiple ? marcat : (filActiuId != null && String(fil.id) === String(filActiuId))}
                        onSelect={() => alternaFil(fil)}
                        locale={locale}
                        t={t}
                        joId={joId}
                      />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="sdp-xat-avis" role="status">{t('section.xat.compartir.senseConverses', 'Encara no tens cap conversa on es puga enviar.')}</p>
            )}
          </>
        )}
        <div className="sdp-xat-dialeg__accions">
          {modeMultiple && seleccionats.size > 0 ? (
            <button type="button" className="sdp-xat-pindola" onClick={confirmaMultiples}>
              {t('section.xat.compartir.enviaSeleccionades', 'Reenvia ({n})').replace('{n}', String(seleccionats.size))}
            </button>
          ) : null}
          <button type="button" className="sdp-xat-pindola sdp-xat-pindola--secundaria" onClick={onDescarta}>
            {nomesRebutjats ? t('section.xat.compartir.entesos', 'Entesos') : t('section.xat.compartir.descarta', 'Descarta')}
          </button>
        </div>
      </div>
    </Dialeg>
  );
}
