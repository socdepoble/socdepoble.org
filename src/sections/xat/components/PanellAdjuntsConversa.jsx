/**
 * PanellAdjuntsConversa.jsx — Gestor net d'adjunts i contingut compartit
 * dins d'una conversa de xat (Onada R22 · T1, continuació del Clon de WhatsApp).
 *
 *   · S'integra en la pila LIFO de `useCapaEnrere`: `Escape` o Arrere tanca
 *     primer el panell sense eixir de la conversa i retorna el focus al botó
 *     obridor («⋯»).
 *   · 3 pestanyes WAI-ARIA (`role="tablist"` / `role="tab"` / `role="tabpanel"`)
 *     amb navegació per teclat (`ArrowLeft`, `ArrowRight`, `Home`, `End`):
 *       1. Fotos i vídeos (`imatge` i `video` compartits)
 *       2. Enllaços (`segmentaEnllacos`, amb `EnllacSegur` i botó germà de salt)
 *       3. Àudios i llistes (`veu` i `llista_comu`)
 *   · Honest i sense fugues: exclou làpides (`esborrat`), missatges bloquejats,
 *     avisos de sistema i enviaments en error o pendents sense `seq`.
 *   · Cada entrada permet botar suaument al missatge original dins de la
 *     conversa (`onVesAlMissatge(id)`), tancant el panell.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { FileAudio, Image, Link2, ListTodo, MessageSquare, Video, X } from 'lucide-react';
import { useCapaEnrere } from '../../../components/PedraSeca/hooks/useCapaEnrere.js';
import { teCapacitat, urlAdjuntXat } from '../../../data/backendPort.js';
import { marcaTemps } from '../../search/indexCerca.js';
import { autorDeCita } from '../conversa.js';
import { segmentaEnllacos } from '../enllacos.js';
import { etiquetaLlista } from '../temps.js';
import EnllacSegur from './EnllacSegur.jsx';

export const PESTANYES_ADJUNTS_CONVERSA = Object.freeze(['media', 'enllacos', 'altres']);

function esMissatgeCompartit(m) {
  if (!m || typeof m !== 'object') return false;
  if (m.esborrat || m.esborratAl || m.bloquejat || m.tipus === 'sistema') return false;
  if (m.estatEnviament === 'error') return false;
  if (m.estatEnviament === 'pendent' && m.seq == null) return false;
  return true;
}

/** Classifica de manera pura els missatges compartits d'una conversa en 3 grups cronològics inversos. */
export function extrauContingutConversa(messages, t) {
  const llista = Array.isArray(messages) ? messages : [];
  const media = [];
  const enllacos = [];
  const altres = [];

  llista.forEach((m, index) => {
    if (!esMissatgeCompartit(m)) return;
    const msgId = m.id != null ? String(m.id) : null;
    const clauBase = msgId || `idx-${index}`;
    const autor = autorDeCita(m, t);
    const creatAl = m.creatAl || null;
    const seq = Number.isFinite(Number(m.seq)) ? Number(m.seq) : -1;
    const instant = marcaTemps(creatAl);
    const tipus = typeof m.tipus === 'string' ? m.tipus : 'text';
    const adjunt = m.metadades?.adjunt && typeof m.metadades.adjunt === 'object'
      ? m.metadades.adjunt
      : null;
    const adjuntId = adjunt?.id ? String(adjunt.id) : null;

    if (tipus === 'imatge' || tipus === 'video') {
      media.push({
        clau: `media:${clauBase}`,
        missatge: m,
        missatgeId: msgId,
        tipus,
        adjuntId,
        autor,
        creatAl,
        text: String(m.text ?? m.content ?? '').trim(),
        instant,
        seq
      });
    } else if (tipus === 'veu' || tipus === 'llista_comu') {
      const titolLlista = tipus === 'llista_comu'
        ? String(m.metadades?.llista?.titol || m.metadades?.titol || m.text || '').trim()
        : '';
      const duradaSegons = tipus === 'veu' && Number.isFinite(Number(adjunt?.durada_s))
        ? Math.max(1, Math.round(Number(adjunt.durada_s)))
        : null;
      altres.push({
        clau: `altre:${clauBase}`,
        missatge: m,
        missatgeId: msgId,
        tipus,
        autor,
        creatAl,
        titolLlista,
        duradaSegons,
        instant,
        seq
      });
    }

    const vistesEnMissatge = new Set();
    for (const seg of segmentaEnllacos(m.text ?? m.content ?? '')) {
      if (seg.tipus !== 'enllac' || vistesEnMissatge.has(seg.href)) continue;
      vistesEnMissatge.add(seg.href);
      enllacos.push({
        clau: `enllac:${clauBase}:${seg.href}`,
        missatge: m,
        missatgeId: msgId,
        enllac: { text: seg.text, href: seg.href, host: seg.host, sospitos: seg.sospitos },
        autor,
        creatAl,
        instant,
        seq
      });
    }
  });

  const ordena = (a, b) => (b.instant - a.instant) || (b.seq - a.seq);
  media.sort(ordena);
  enllacos.sort(ordena);
  altres.sort(ordena);
  return { media, enllacos, altres };
}

/* Auditoria del kit de Gemini R22 · Com la bombolla (AdjuntXat.jsx: «la
   bombolla guarda l'id, mai una URL»), la miniatura només es resol pel port
   amb l'id de l'adjunt. Una URL de les metadades del missatge (lliures per a
   qualsevol membre) no es carrega mai: seria un píxel espia. */
function MiniaturaAdjunt({ item, configAdjunts, onObriImatge, onVesAlMissatge, locale, t }) {
  const [urlResolta, setUrlResolta] = useState(null);

  useEffect(() => {
    if (item.tipus !== 'imatge' || !item.adjuntId || !teCapacitat('xatMultimedia')) {
      return undefined;
    }
    const ctrl = new AbortController();
    let allibera = null;
    let muntat = true;
    urlAdjuntXat(item.adjuntId, { ...configAdjunts, signal: ctrl.signal }, {
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
  }, [item.adjuntId, item.tipus, configAdjunts]);

  const data = etiquetaLlista(item.creatAl, { locale, t });
  const esImatge = item.tipus === 'imatge';
  const etiquetaTipus = esImatge
    ? t('section.xat.adjunts.foto', 'Foto adjunta')
    : t('section.xat.adjunts.video', 'Vídeo adjunt');
  const resum = item.text || etiquetaTipus;

  return (
    <li className="sdp-xat-adjunts-panell__item">
      <div className="sdp-xat-adjunts-panell__media-fila">
        {esImatge && typeof onObriImatge === 'function' && item.missatgeId ? (
          <button
            type="button"
            className="sdp-xat-adjunts-panell__miniatura-boto"
            onClick={(e) => onObriImatge(item.missatge, urlResolta, e.currentTarget)}
            aria-label={`${etiquetaTipus} · ${item.autor}`}
          >
            {urlResolta ? (
              <img
                src={urlResolta}
                alt=""
                className="sdp-xat-adjunts-panell__miniatura-img"
                width="64"
                height="64"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <Image size={22} aria-hidden="true" focusable="false" />
            )}
          </button>
        ) : (
          <span className="sdp-xat-adjunts-panell__icona-caixa" aria-hidden="true">
            {esImatge ? <Image size={22} focusable="false" /> : <Video size={22} focusable="false" />}
          </span>
        )}
        <div className="sdp-xat-adjunts-panell__detall">
          <strong className="sdp-xat-adjunts-panell__titol-item">{resum}</strong>
          <span className="sdp-xat-adjunts-panell__meta">
            {data ? `${item.autor} · ${data}` : item.autor}
          </span>
        </div>
        {item.missatgeId ? (
          <button
            type="button"
            className="sdp-xat-adjunts-panell__salta"
            onClick={() => onVesAlMissatge(item.missatgeId)}
          >
            <MessageSquare size={16} aria-hidden="true" focusable="false" />
            <span>{t('section.xat.contingutCompartit.mostraAlXat', 'Mostra al xat')}</span>
          </button>
        ) : null}
      </div>
    </li>
  );
}

export default function PanellAdjuntsConversa({
  obert = false,
  onTanca,
  obridor = null,
  messages = [],
  configAdjunts = null,
  onVesAlMissatge,
  onObriImatge = null,
  locale = 'ca-ES',
  t
}) {
  const [pestanya, setPestanya] = useState('media');
  const panellRef = useRef(null);
  const tancaRef = useRef(null);
  const pestanyesRefs = useRef([]);
  const idTitol = useId();
  const idBase = useId();

  const tancaAmbFocus = useCallback(() => {
    onTanca?.();
    if (obridor && typeof obridor.focus === 'function') {
      obridor.focus();
    }
  }, [onTanca, obridor]);

  const teCapaDamunt = useCapaEnrere(obert, tancaAmbFocus);

  useEffect(() => {
    if (!obert) return undefined;
    tancaRef.current?.focus();
    const node = panellRef.current;
    const arrel = node?.getRootNode?.() || document;
    const alTeclat = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented || teCapaDamunt()) return;
      e.preventDefault();
      tancaAmbFocus();
    };
    arrel.addEventListener('keydown', alTeclat);
    return () => arrel.removeEventListener('keydown', alTeclat);
  }, [obert, tancaAmbFocus, teCapaDamunt]);

  const contingut = useMemo(() => extrauContingutConversa(messages, t), [messages, t]);

  if (!obert) return null;

  const definicions = [
    {
      id: 'media',
      etiqueta: t('section.xat.contingutCompartit.pestanya.media', 'Fotos i vídeos'),
      quants: contingut.media.length
    },
    {
      id: 'enllacos',
      etiqueta: t('section.xat.contingutCompartit.pestanya.enllacos', 'Enllaços'),
      quants: contingut.enllacos.length
    },
    {
      id: 'altres',
      etiqueta: t('section.xat.contingutCompartit.pestanya.altres', 'Àudios i llistes'),
      quants: contingut.altres.length
    }
  ];

  const canviaPestanya = (id, idx) => {
    setPestanya(id);
    const boto = pestanyesRefs.current[idx];
    if (typeof boto?.scrollIntoView === 'function') {
      boto.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  };

  const mouPestanya = (e, idxActual) => {
    let desti = -1;
    if (e.key === 'ArrowRight') desti = (idxActual + 1) % definicions.length;
    else if (e.key === 'ArrowLeft') desti = (idxActual - 1 + definicions.length) % definicions.length;
    else if (e.key === 'Home') desti = 0;
    else if (e.key === 'End') desti = definicions.length - 1;
    if (desti < 0) return;
    e.preventDefault();
    canviaPestanya(definicions[desti].id, desti);
    pestanyesRefs.current[desti]?.focus();
  };

  const saltaAlMissatge = (msgId) => {
    onTanca?.();
    onVesAlMissatge?.(msgId);
  };

  const idTab = (id) => `${idBase}-tab-${id}`;
  const panellBuit = (contingut[pestanya]?.length ?? 0) === 0;

  return (
    <section
      ref={panellRef}
      className="sdp-xat-adjunts-panell"
      aria-labelledby={idTitol}
    >
      <div className="sdp-xat-adjunts-panell__cap">
        <strong id={idTitol} className="sdp-xat-adjunts-panell__titol">
          {t('section.xat.contingutCompartit.titol', 'Contingut compartit')}
        </strong>
        <button
          ref={tancaRef}
          type="button"
          className="sdp-xat-icona"
          onClick={tancaAmbFocus}
          aria-label={t('section.xat.contingutCompartit.tanca', 'Tanca el contingut compartit')}
        >
          <X size={22} aria-hidden="true" focusable="false" />
        </button>
      </div>

      <div
        className="sdp-xat-adjunts-panell__pestanyes"
        role="tablist"
        aria-label={t('section.xat.contingutCompartit.titol', 'Contingut compartit')}
      >
        {definicions.map((def, idx) => {
          const activa = pestanya === def.id;
          return (
            <button
              key={def.id}
              ref={(el) => { pestanyesRefs.current[idx] = el; }}
              id={idTab(def.id)}
              type="button"
              role="tab"
              aria-selected={activa}
              tabIndex={activa ? 0 : -1}
              className="sdp-xat-adjunts-panell__pestanya"
              onClick={() => canviaPestanya(def.id, idx)}
              onKeyDown={(e) => mouPestanya(e, idx)}
            >
              <span className="sdp-xat-adjunts-panell__pestanya-etiqueta">{def.etiqueta}</span>
              <span className="sdp-xat-adjunts-panell__comptador">{def.quants}</span>
            </button>
          );
        })}
      </div>

      <p className="sdp-xat-adjunts-panell__avis">
        {t('section.xat.contingutCompartit.avis', 'Es mostren els elements ja carregats en esta conversa.')}
      </p>

      <div
        role="tabpanel"
        aria-labelledby={idTab(pestanya)}
        tabIndex={panellBuit ? 0 : undefined}
        className="sdp-xat-adjunts-panell__cos"
      >
        {pestanya === 'media' ? (
          contingut.media.length === 0 ? (
            <p className="sdp-xat-adjunts-panell__buit">
              {t('section.xat.contingutCompartit.buit.media', 'Encara no s’han compartit fotos ni vídeos entre els missatges carregats.')}
            </p>
          ) : (
            <ul className="sdp-xat-adjunts-panell__llista">
              {contingut.media.map((item) => (
                <MiniaturaAdjunt
                  key={item.clau}
                  item={item}
                  configAdjunts={configAdjunts}
                  onObriImatge={onObriImatge}
                  onVesAlMissatge={saltaAlMissatge}
                  locale={locale}
                  t={t}
                />
              ))}
            </ul>
          )
        ) : null}

        {pestanya === 'enllacos' ? (
          contingut.enllacos.length === 0 ? (
            <p className="sdp-xat-adjunts-panell__buit">
              {t('section.xat.contingutCompartit.buit.enllacos', 'Encara no s’han compartit enllaços entre els missatges carregats.')}
            </p>
          ) : (
            <ul className="sdp-xat-adjunts-panell__llista">
              {contingut.enllacos.map((item) => {
                const data = etiquetaLlista(item.creatAl, { locale, t });
                return (
                  <li key={item.clau} className="sdp-xat-adjunts-panell__item">
                    <div className="sdp-xat-adjunts-panell__media-fila">
                      <span className="sdp-xat-adjunts-panell__icona-caixa" aria-hidden="true">
                        <Link2 size={20} focusable="false" />
                      </span>
                      <div className="sdp-xat-adjunts-panell__detall">
                        <strong className="sdp-xat-adjunts-panell__domini">{item.enllac.host}</strong>
                        <div className="sdp-xat-adjunts-panell__enllac">
                          <EnllacSegur segment={item.enllac} t={t} />
                        </div>
                        <span className="sdp-xat-adjunts-panell__meta">
                          {data ? `${item.autor} · ${data}` : item.autor}
                        </span>
                      </div>
                      {item.missatgeId ? (
                        <button
                          type="button"
                          className="sdp-xat-adjunts-panell__salta"
                          onClick={() => saltaAlMissatge(item.missatgeId)}
                        >
                          <MessageSquare size={16} aria-hidden="true" focusable="false" />
                          <span>{t('section.xat.contingutCompartit.mostraAlXat', 'Mostra al xat')}</span>
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )
        ) : null}

        {pestanya === 'altres' ? (
          contingut.altres.length === 0 ? (
            <p className="sdp-xat-adjunts-panell__buit">
              {t('section.xat.contingutCompartit.buit.altres', 'Encara no hi ha notes de veu ni llistes compartides entre els missatges carregats.')}
            </p>
          ) : (
            <ul className="sdp-xat-adjunts-panell__llista">
              {contingut.altres.map((item) => {
                const data = etiquetaLlista(item.creatAl, { locale, t });
                const esVeu = item.tipus === 'veu';
                const titol = esVeu
                  ? (item.duradaSegons
                    ? `${t('section.xat.adjunts.veu', 'Missatge de veu')} (${item.duradaSegons} s)`
                    : t('section.xat.adjunts.veu', 'Missatge de veu'))
                  : (item.titolLlista || t('section.xat.contingutCompartit.llistaComu', 'Llista compartida'));
                return (
                  <li key={item.clau} className="sdp-xat-adjunts-panell__item">
                    <div className="sdp-xat-adjunts-panell__media-fila">
                      <span className="sdp-xat-adjunts-panell__icona-caixa" aria-hidden="true">
                        {esVeu ? <FileAudio size={20} focusable="false" /> : <ListTodo size={20} focusable="false" />}
                      </span>
                      <div className="sdp-xat-adjunts-panell__detall">
                        <strong className="sdp-xat-adjunts-panell__titol-item">{titol}</strong>
                        <span className="sdp-xat-adjunts-panell__meta">
                          {data ? `${item.autor} · ${data}` : item.autor}
                        </span>
                      </div>
                      {item.missatgeId ? (
                        <button
                          type="button"
                          className="sdp-xat-adjunts-panell__salta"
                          onClick={() => saltaAlMissatge(item.missatgeId)}
                        >
                          <MessageSquare size={16} aria-hidden="true" focusable="false" />
                          <span>{t('section.xat.contingutCompartit.mostraAlXat', 'Mostra al xat')}</span>
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )
        ) : null}
      </div>
    </section>
  );
}
