/**
 * SelectorDataHora.jsx — La pastilla de data i hora que obri el calendari.
 *
 * T40 (ordre del Mestre, 260928) · A la barra taronja, la data és clicable:
 * obri la finestra flotant de la barra (Dialeg lloc="barra") amb el mateix
 * mes de la Consola en xicotet (CalendariMes), un camp d'hora, «Sense data»
 * i «Fet». El disparador és la pastilla de sempre (.btn-date-time), ara un
 * <button aria-haspopup="dialog">.
 *
 * CONTRACTE
 *   valor (ISO | null) · onTria(iso | null) · locale ·
 *   reserva { time, date } (el que es mostra sense valor: hui, l'última
 *     edició) · etiquetaReserva (què és la reserva, per al lector) ·
 *   etiqueta (títol i nom) · descripcio · avisFutur (text; null = sense avís) ·
 *   avisDesament (text; null = la data es desa com la resta del document) ·
 *   avui (Date, injectable en proves)
 *
 * Triar un dia desa a l'instant i la finestra continua oberta per a ajustar
 * l'hora. Qui la consumix decidix on es desa (Model B: res de backend ací).
 * Si la finestra queda oberta i el disparador perd la caixa (la barra que
 * el conté s'amaga), es tanca sola.
 * Importa per camí directe (mai per index.js).
 */
import { useEffect, useRef, useState } from 'react';
import { Boto } from '../atoms/Boto.jsx';
import { Alerta } from '../molecules/Alerta.jsx';
import { Dialeg } from './Dialeg.jsx';
import { Camp, CampText } from './formulari.jsx';
import { GraellaMes, NavegacioMes } from './CalendariMes.jsx';
import { combinaDataHora, cursorDe, dataIsoONull, esMateixDia, horaDe } from '../../../utils/calendari.js';

const DESCRIPCIO = 'Tria el dia i l’hora de la publicació. Es desa sola, com la resta del document. Si no en tries cap, s’hi posarà l’hora en què publiques.';
/* Amb `avisDesament` la descripció no promet el desat de sempre: ho diu l'avís. */
const DESCRIPCIO_SENSE_DESAT = 'Tria el dia i l’hora de la publicació. Si no en tries cap, s’hi posarà l’hora en què publiques.';
const AVIS_FUTUR = 'La data no programa res: la publicació ix quan la publiques, però el Mur l’ordena amb esta data.';
const HORA_VALIDA = /^\d{2}:\d{2}$/;

/** L'hora d'ara arrodonida cap avall a 5 minuts (el pas del camp d'hora). */
function horaArrodonida(data) {
  const d = new Date(data);
  d.setMinutes(Math.floor(d.getMinutes() / 5) * 5, 0, 0);
  return horaDe(d);
}

const dataCurta = (data, locale) => data.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: '2-digit' });
const dataLlarga = (data, locale) => data.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export function SelectorDataHora({
  valor = null, onTria, locale = 'ca-ES', reserva = null, etiquetaReserva = 'la data de l’última edició',
  etiqueta = 'Data de publicació', descripcio, avisFutur = AVIS_FUTUR, avisDesament = null, avui: avuiProp = null,
}) {
  const avui = avuiProp || new Date();
  const iso = dataIsoONull(valor);
  const triada = iso ? new Date(iso) : null;
  const [obert, setObert] = useState(false);
  const [cursor, setCursor] = useState(() => cursorDe(triada || avui));
  const [hora, setHora] = useState(() => (triada ? horaDe(triada) : horaArrodonida(avui)));
  const cosRef = useRef(null);
  const disparadorRef = useRef(null);
  /* Sense la prop (undefined), la descripció de sèrie; null explícit, cap. */
  const descripcioVigent = descripcio !== undefined ? descripcio : (avisDesament ? DESCRIPCIO_SENSE_DESAT : DESCRIPCIO);

  /* Correcció T40 (ordre del Mestre, 260928) · El <dialog> naix dins de la
     barra taronja, que T38 amaga (display:none) en mòbil i en columna
     estreta. Si s'amaga amb la finestra oberta (girar el mòbil, estrènyer la
     finestra), el modal queda obert sense caixa i tota la pàgina, inert. Quan
     el disparador PASSA de tindre caixa a no tindre'n, la finestra es tanca:
     la data ja és desada (cada tria desa a l'instant). Només la transició:
     un disparador que mai no ha tingut caixa (jsdom) no tanca res. */
  useEffect(() => {
    const boto = disparadorRef.current;
    if (!obert || !boto || typeof ResizeObserver !== 'function') return undefined;
    let teniaCaixa = boto.getClientRects().length > 0;
    const vigia = new ResizeObserver(() => {
      const teCaixa = boto.getClientRects().length > 0;
      if (teniaCaixa && !teCaixa) setObert(false);
      teniaCaixa = teCaixa;
    });
    vigia.observe(boto);
    return () => vigia.disconnect();
  }, [obert]);

  /* En obrir, el mes i l'hora tornen als del valor (ajust durant el render,
     com EditableField: sense efecte ni pintada intermèdia). */
  const [obertAbans, setObertAbans] = useState(obert);
  if (obert !== obertAbans) {
    setObertAbans(obert);
    if (obert) {
      setCursor(cursorDe(triada || avui));
      setHora(triada ? horaDe(triada) : horaArrodonida(avui));
    }
  }

  /* El focus entra al dia triat (o al de hui) quan la finestra ja és oberta:
     l'efecte del Dialeg (fill) fa el showModal abans que este. */
  useEffect(() => {
    if (!obert) return;
    const cos = cosRef.current;
    const dia = cos?.querySelector('.sdp-calendari__dia[aria-pressed="true"]')
      || cos?.querySelector('.sdp-calendari__dia[aria-current="date"]')
      || cos?.querySelector('.sdp-calendari__dia');
    dia?.focus();
  }, [obert]);

  const horaVigent = HORA_VALIDA.test(hora) ? hora : (triada ? horaDe(triada) : horaArrodonida(avui));
  const triaDia = (dia) => onTria?.(combinaDataHora(cursor.any, cursor.mes, dia, horaVigent));
  const canviaHora = (event) => {
    const nova = event.target.value;
    setHora(nova);
    if (!HORA_VALIDA.test(nova)) return;
    const base = triada || avui;
    const resultat = combinaDataHora(base.getFullYear(), base.getMonth(), base.getDate(), nova);
    if (resultat) onTria?.(resultat);
  };

  /* «Sense data» no es desactiva mai davall del focus: buida i porta el focus al dia de hui. */
  const buida = () => {
    if (!triada) return;
    onTria?.(null);
    (cosRef.current?.querySelector('.sdp-calendari__dia[aria-current="date"]')
      || cosRef.current?.querySelector('.sdp-calendari__dia'))?.focus();
  };

  const mostra = triada ? { time: horaDe(triada), date: dataCurta(triada, locale) } : (reserva || {});
  const teText = Boolean(mostra.time || mostra.date);
  /* Poliment T40 (ordre del Mestre, 260928) · WCAG 2.5.3: amb data triada, el
     nom comença pel que es veu a la pastilla (hora i data curta), perquè qui
     la nomena per veu l'encerte; després, la data llarga amb el dia. */
  const nom = triada
    ? `${mostra.time} ${mostra.date}. ${etiqueta}: ${dataLlarga(triada, locale)}. Canviar-la`
    : teText
      ? `${etiqueta}: sense triar; ara es mostra ${etiquetaReserva} (${[mostra.time, mostra.date].filter(Boolean).join(' ')}). Triar-la`
      : `${etiqueta}: sense triar. Triar-la`;
  const futura = Boolean(triada && avisFutur && triada.getTime() > avui.getTime());

  return (
    <>
      <button ref={disparadorRef} type="button" className="btn-date-time" aria-haspopup="dialog" aria-expanded={obert}
        aria-label={nom} title={nom} onClick={() => setObert(true)}>
        {teText ? (
          <>
            {mostra.time ? <span>{mostra.time}</span> : null}
            {mostra.date ? <span>{mostra.date}</span> : null}
          </>
        ) : <span>Data</span>}
      </button>
      <Dialeg obert={obert} onTanca={() => setObert(false)} titol={etiqueta} descripcio={descripcioVigent}
        mida="s" lloc="barra" className="sdp-selector-data"
        accions={(
          <>
            <Boto varietat="secundari" onClick={buida} aria-disabled={triada ? undefined : 'true'}>Sense data</Boto>
            <Boto varietat="primari" onClick={() => setObert(false)}>Fet</Boto>
          </>
        )}>
        {obert ? (
          <div ref={cosRef} className="sdp-calendari">
            {/* Correcció C20 (260928) · L'«Hora» damunt del mes: en una pantalla
                curta, davall de la graella quedava fora de la vista. */}
            <Camp etiqueta="Hora" ajuda={triada ? undefined : 'Si encara no has triat cap dia, l’hora s’aplica a hui.'}>
              <CampText tipus="time" step={300} value={hora} onChange={canviaHora} />
            </Camp>
            <NavegacioMes className="sdp-calendari__navegacio" cursor={cursor} onCanvia={setCursor} avui={avui} />
            <GraellaMes compacta any={cursor.any} mes={cursor.mes} locale={locale} avui={avui}
              renderDia={(dia, { esAvui }) => (
                <button type="button" className="sdp-calendari__dia"
                  aria-pressed={Boolean(triada) && esMateixDia(triada, cursor.any, cursor.mes, dia)}
                  aria-current={esAvui ? 'date' : undefined}
                  aria-label={dataLlarga(new Date(cursor.any, cursor.mes, dia), locale)}
                  onClick={() => triaDia(dia)}>
                  {dia}
                </button>
              )} />
            {avisDesament ? <Alerta to="avis">{avisDesament}</Alerta> : null}
            {futura ? <Alerta to="avis">{avisFutur}</Alerta> : null}
          </div>
        ) : null}
      </Dialeg>
    </>
  );
}
