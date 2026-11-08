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
 *   reserva { time, date } (el que es mostra sense valor; T51 · sense
 *     reserva, la data i l'hora d'ara: la pastilla d'un document en edició
 *     mai queda buida, i l'editor mai hi posa la de l'última edició) ·
 *   etiquetaReserva (què és la reserva, per al lector; per defecte, la
 *     data i l'hora d'ara: mai l'última edició, que la regla prohibix) ·
 *   etiqueta (títol i nom) · descripcio · avisFutur (text; null = sense avís) ·
 *   avisDesament (text; null = la data es desa com la resta del document) ·
 *   avui (Date, injectable en proves) ·
 *   zona (IANA; per defecte, la del dispositiu; injectable en proves)
 *
 * R51 (P0-49 / IDEA-180) · Sota l'«Hora», la zona i el desfasament visibles.
 * Cada tria passa per utils/zonaHoraria.js: una hora que el canvi d'estiu se
 * salta no es desa (error al camp) i una que el d'hivern repetix demana quin
 * desfasament. «Posar data i hora d'ara mateix» ompli l'esborrany amb el
 * rellotge del clic (publicationDateNow) pel mateix onTria: no publica res.
 * VU-01 · Teclejar l'hora no deixa mai a l'esborrany una hora intermèdia que
 * ningú no ha triat: si el que es tecleja acaba ambigu o inexistent, l'esborrany
 * torna a l'últim valor triat de veres (en obrir, en entrar al camp, un dia,
 * un desfasament, «ara mateix», «Sense data» o, V2-05, l'hora que resol un
 * dia triat que esperava: el dia no es perd) fins que es resol.
 * VU-02 · La pregunta del desfasament s'anuncia (regió viva educada, també
 * l'hora inexistent) i, si ve d'un dia triat, s'hi porta el focus; triat el
 * desfasament, el focus torna al dia (o al camp «Hora»), visible, mai a BODY.
 *
 * Triar un dia desa a l'instant (llevat que la seua hora siga ambigua o
 * inexistent: R51, espera el desfasament o una altra hora) i la finestra
 * continua oberta per a ajustar l'hora. Qui la consumix decidix on es desa
 * (Model B: res de backend ací).
 * Si la finestra queda oberta i el disparador perd la caixa (la barra que
 * el conté s'amaga), es tanca sola.
 * Importa per camí directe (mai per index.js).
 */
import { useEffect, useRef, useState } from 'react';
import { useTraductorOpcional, tradueix } from '../hooks/useTraductorOpcional.js';
import { omple } from '../../../config/moderacio.js';
import { Boto } from '../atoms/Boto.jsx';
import { Alerta } from '../molecules/Alerta.jsx';
import { Dialeg } from './Dialeg.jsx';
import { Camp, CampText, GrupOpcions } from './formulari.jsx';
import { GraellaMes, NavegacioMes } from './CalendariMes.jsx';
import { cursorDe, esMateixDia } from '../../../utils/calendari.js';
import { dataDeDocument } from '../../universal/editorial.js';
import { ETIQUETA_RESERVA_ARA, dataHoraAra, dataHoraEdicio } from '../../universal/barres/dataHoraBarra.js';
import { publicationDateNow } from '../../../utils/publicationDateControl.js';
import {
  desfasamentA, esZonaValida, horaDeParet, partsALaZona, resolHoraDeParet, textDesfasament, zonaDelDispositiu
} from '../../../utils/zonaHoraria.js';

const DESCRIPCIO = ["editor.data.descripcio", "Tria el dia i l’hora de la publicació. Es desa sola, com la resta del document. Si no en tries cap, s’hi posarà l’hora en què publiques."];
/* Amb `avisDesament` la descripció no promet el desat de sempre: ho diu l'avís. */
const DESCRIPCIO_SENSE_DESAT = ["editor.data.descripcioSenseDesat", "Tria el dia i l’hora de la publicació. Si no en tries cap, s’hi posarà l’hora en què publiques."];
const AVIS_FUTUR = ["editor.data.avisFutur", "La data no programa res: la publicació ix quan la publiques, però el Mur l’ordena amb esta data."];
const HORA_VALIDA = /^\d{2}:\d{2}$/;
/* R51 (P0-49 / IDEA-180) · La zona visible, el botó d'ara mateix i els dos
   casos del canvi d'hora. */
const ZONA = ["editor.data.zona", "Zona: {zona} · {desfasament}."];
const ARA_MATEIX = ["editor.data.araMateix", "Posar data i hora d’ara mateix"];
const HORA_AMBIGUA = ["editor.data.horaAmbigua", "Eixa hora passa dues vegades este dia pel canvi d’hora. Tria quina:"];
const HORA_INEXISTENT = ["editor.data.horaInexistent", "Eixa hora no existix este dia pel canvi d’hora. Tria’n una altra."];

const dosDigits = (n) => String(n).padStart(2, '0');

/** «hh:mm» d'un instant a la zona, arrodonit cap avall a `pas` minuts. */
function horaALaZona(instantMs, zona, pas = 1) {
  const { hora, minut } = partsALaZona(instantMs, zona);
  return `${dosDigits(hora)}:${dosDigits(Math.floor(minut / pas) * pas)}`;
}

const dataLlarga = (data, locale) => data.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export function SelectorDataHora({
  valor = null, onTria, locale = 'ca-ES', reserva = null, etiquetaReserva = ETIQUETA_RESERVA_ARA,
  etiqueta: etiquetaProp, descripcio, avisFutur: avisFuturProp, avisDesament = null, avui: avuiProp = null,
  zona: zonaProp = null,
}) {
  const t = useTraductorOpcional();
  const etiqueta = etiquetaProp === undefined ? tradueix(t, ["editor.data.etiqueta", "Data de publicació"]) : etiquetaProp;
  const avisFutur = avisFuturProp === undefined ? tradueix(t, AVIS_FUTUR) : avisFuturProp;
  const avui = avuiProp || new Date();
  /* R51 · La zona IANA on es llig l'hora de paret (la del dispositiu; `zona`,
     injectable en proves). El mòdul pur rep sempre el desfasament explícit. */
  const zona = esZonaValida(zonaProp) ? zonaProp : zonaDelDispositiu();
  const horaArrodonida = (data) => horaALaZona(data.getTime(), zona, 5);
  /* Correcció W3A D4 · La tria es llig amb el MATEIX lector que la pastilla
     (editorial.js · dataDeDocument, el de dataHoraEdicio): el dia marcat, la
     data llarga del nom i el text visible no poden dir dies diferents. Un
     dia sol és aquell dia en hora LOCAL (mai la mitjanit UTC), i com que no
     porta hora, el camp «Hora» no n'hi inventa cap: s'obri a l'hora d'ara. */
  const lectura = dataDeDocument({ publicat: valor });
  const triada = lectura ? lectura.instant : null;
  const horaInicial = () => (lectura?.ambHora ? horaALaZona(triada.getTime(), zona) : horaArrodonida(avui));
  const [obert, setObert] = useState(false);
  const [cursor, setCursor] = useState(() => cursorDe(triada || avui));
  const [hora, setHora] = useState(horaInicial);
  /* R51 · Una hora ambigua (canvi d'hivern) espera que se'n tria el
     desfasament: { local, opcions }. Una d'inexistent (canvi d'estiu) no desa
     res i ho diu. */
  const [dubte, setDubte] = useState(null);
  const [horaInexistent, setHoraInexistent] = useState(false);
  /* VU-01 · L'últim valor triat de veres (no una pulsació a mitges del camp
     «Hora»): l'esborrany hi torna si el que es tecleja acaba ambigu o
     inexistent. */
  const [valorTriat, setValorTriat] = useState(valor);
  /* El dia triat que encara no s'ha desat («AAAA-MM-DD»: la seua hora era
     ambigua o inexistent): una hora teclejada després s'hi aplica, no al dia
     d'abans. */
  const [diaPendent, setDiaPendent] = useState(null);
  const cosRef = useRef(null);
  const disparadorRef = useRef(null);
  /* VU-02 · On torna el focus després de triar el desfasament (el dia o el camp «Hora»). */
  const tornaRef = useRef(null);
  /* Sense la prop (undefined), la descripció de sèrie; null explícit, cap. */
  const descripcioVigent = descripcio !== undefined ? descripcio : tradueix(t, avisDesament ? DESCRIPCIO_SENSE_DESAT : DESCRIPCIO);

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
      setHora(horaInicial());
      setDubte(null);
      setHoraInexistent(false);
      setValorTriat(valor);
      setDiaPendent(null);
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

  const horaVigent = HORA_VALIDA.test(hora) ? hora : horaInicial();
  /* R51 · Cada tria passa per l'adaptador de zona (utils/zonaHoraria.js), no
     per combinaDataHora, que en un salt d'hora movia l'hora sense dir-ho. */
  /* `deLHora`: la tria ve del teclat del camp «Hora» (cada pulsació completa),
     no d'una acció de veres (un dia). */
  const aplica = (local, deLHora = false) => {
    const resolta = resolHoraDeParet(local, zona);
    /* VU-02 · Una pregunta que ve d'un dia triat porta el focus al primer
       desfasament (efecte de baix); la del teclat, no: no es pot robar el
       focus a qui encara tecleja (és el pas de Tab següent). */
    setDubte(resolta.estat === 'ambigua' ? { local, opcions: resolta.opcions, enfoca: !deLHora } : null);
    setHoraInexistent(resolta.estat === 'inexistent');
    if (resolta.estat === 'valida') setDiaPendent(null);
    else if (!deLHora) setDiaPendent(local.slice(0, 10));
    if (resolta.estat === 'valida') {
      onTria?.(resolta.iso);
      /* V2-05 · Una hora teclejada que resol un dia pendent (triat de veres,
         amb l'hora ambigua o inexistent) completa eixa tria: passa a ser el
         valor triat. Si no, una pulsació ambigua o inexistent de després
         tornaria l'esborrany al dia d'abans i el dia triat es perdria sense
         dir res. */
      if (!deLHora || diaPendent) setValorTriat(resolta.iso);
    } else if (deLHora && valor !== valorTriat) {
      /* VU-01 · Una pulsació d'abans (02:03 camí de 02:30) ja s'havia desat:
         l'esborrany torna a l'últim valor triat de veres fins que es resol. */
      onTria?.(valorTriat);
    }
  };
  const triaDia = (dia, boto) => {
    tornaRef.current = boto || null;
    aplica(horaDeParet(cursor.any, cursor.mes, dia, horaVigent));
  };
  const canviaHora = (event) => {
    const nova = event.target.value;
    tornaRef.current = event.target;
    setHora(nova);
    if (!HORA_VALIDA.test(nova)) return;
    const base = partsALaZona((triada || avui).getTime(), zona);
    aplica(diaPendent ? `${diaPendent}T${nova}` : horaDeParet(base.any, base.mes, base.dia, nova), true);
  };
  const triaDesfasament = (valor) => {
    const opcio = dubte?.opcions.find((o) => String(o.desfasament) === valor);
    if (!opcio) return;
    /* VU-02 · Abans que el grup es desmunte, el focus torna d'on venia la
       pregunta (el dia, que focus() porta a la vista, o el camp «Hora»), mai
       a BODY, fora del diàleg modal. */
    const torna = tornaRef.current?.isConnected ? tornaRef.current : cosRef.current?.querySelector('input[type="time"]');
    torna?.focus();
    setDubte(null);
    setDiaPendent(null);
    onTria?.(opcio.iso);
    setValorTriat(opcio.iso);
  };
  /* VU-02 · La pregunta d'un dia triat rep el focus (el primer desfasament). */
  useEffect(() => {
    if (dubte?.enfoca) cosRef.current?.querySelector('fieldset input[type="radio"]')?.focus();
  }, [dubte]);
  /* R51 · «Posar data i hora d'ara mateix»: el rellotge del moment del clic
     (`avui` en proves), amb els mil·lisegons. Només ompli l'esborrany pel
     mateix canal que la resta (onTria): ni desa a banda ni publica. */
  const posaAra = () => {
    const ara = avuiProp ? avuiProp.getTime() : Date.now();
    setDubte(null);
    setHoraInexistent(false);
    setCursor(cursorDe(new Date(ara)));
    setHora(horaALaZona(ara, zona));
    const iso = publicationDateNow(ara);
    onTria?.(iso);
    setValorTriat(iso);
    setDiaPendent(null);
  };

  /* «Sense data» no es desactiva mai davall del focus: buida i porta el focus al dia de hui. */
  const buida = () => {
    if (!triada) return;
    onTria?.(null);
    setValorTriat(null);
    setDiaPendent(null);
    (cosRef.current?.querySelector('.sdp-calendari__dia[aria-current="date"]')
      || cosRef.current?.querySelector('.sdp-calendari__dia'))?.focus();
  };

  /* T51 (decisió del Mestre, 260928) · Cap document sense data: sense valor
     ni reserva, la pastilla diu la data i l'hora d'ara (mai «Data» ni buida).
     Amb data triada, la regla d'edició (barres/dataHoraBarra.js ·
     dataHoraEdicio): la tria tal qual, i un dia sol sense hora inventada. */
  const reservaAmbText = Boolean(reserva?.time || reserva?.date);
  const mostra = triada
    ? dataHoraEdicio({ publicat: valor }, avui)
    : (reservaAmbText ? reserva : dataHoraAra(avui));
  const queEsLaReserva = reservaAmbText && etiquetaReserva !== ETIQUETA_RESERVA_ARA
    ? etiquetaReserva : tradueix(t, ["editor.data.ara", "la data i l’hora d’ara"]);
  const visible = [mostra.time, mostra.date].filter(Boolean).join(' ');
  /* Poliment T40 (ordre del Mestre, 260928) · WCAG 2.5.3: amb data triada, el
     nom comença pel que es veu a la pastilla (hora i data curta), perquè qui
     la nomena per veu l'encerte; després, la data llarga amb el dia. */
  const nom = triada
    ? omple(tradueix(t, ["editor.data.triada", "{visible}. {etiqueta}: {data}. Canviar-la"]), { visible, etiqueta, data: dataLlarga(triada, locale) })
    : omple(tradueix(t, ["editor.data.senseTriar", "{etiqueta}: sense triar; ara es mostra {reserva} ({visible}). Triar-la"]), { etiqueta, reserva: queEsLaReserva, visible });
  const futura = Boolean(triada && avisFutur && triada.getTime() > avui.getTime());
  /* R51 · Sota l'«Hora», la zona IANA i el desfasament de l'instant que es
     mostra (el triat o, sense, el d'ara): és la descripció del camp d'hora. */
  const textZona = omple(tradueix(t, ZONA), { zona, desfasament: textDesfasament(desfasamentA((triada || avui).getTime(), zona)) });
  const ajudaHora = triada ? null : tradueix(t, ["editor.data.ajudaHora", "Si encara no has triat cap dia, l’hora s’aplica a hui."]);

  return (
    <>
      <button ref={disparadorRef} type="button" className="btn-date-time" aria-haspopup="dialog" aria-expanded={obert}
        aria-label={nom} title={nom} onClick={() => setObert(true)}>
        {mostra.time ? <span>{mostra.time}</span> : null}
        {mostra.date ? <span>{mostra.date}</span> : null}
      </button>
      <Dialeg obert={obert} onTanca={() => setObert(false)} titol={etiqueta} descripcio={descripcioVigent}
        mida="s" lloc="barra" className="sdp-selector-data"
        accions={(
          <>
            <Boto varietat="secundari" onClick={buida} aria-disabled={triada ? undefined : 'true'}>{tradueix(t, ["editor.data.senseData", "Sense data"])}</Boto>
            <Boto varietat="secundari" onClick={posaAra}>{tradueix(t, ARA_MATEIX)}</Boto>
            <Boto varietat="primari" onClick={() => setObert(false)}>{tradueix(t, ["editor.data.fet", "Fet"])}</Boto>
          </>
        )}>
        {obert ? (
          <div ref={cosRef} className="sdp-calendari">
            {/* Correcció C20 (260928) · L'«Hora» damunt del mes: en una pantalla
                curta, davall de la graella quedava fora de la vista. */}
            <Camp etiqueta={tradueix(t, ["editor.data.hora", "Hora"])} ajuda={ajudaHora ? `${textZona} ${ajudaHora}` : textZona}
              error={horaInexistent ? tradueix(t, HORA_INEXISTENT) : undefined}>
              <CampText tipus="time" step={300} value={hora} onChange={canviaHora}
                onFocus={() => { if (!dubte && !horaInexistent) setValorTriat(valor); }} />
            </Camp>
            {/* VU-02 i VU-03 · La pregunta del desfasament i l'hora inexistent,
                anunciades sense interrompre (aria-live="polite"): la regió viu
                des que s'obri el cos, buida, perquè el lector senta el canvi. */}
            <p className="sdp-sr-only" aria-live="polite">
              {dubte ? tradueix(t, HORA_AMBIGUA) : horaInexistent ? tradueix(t, HORA_INEXISTENT) : ''}
            </p>
            {dubte ? (
              <GrupOpcions llegenda={tradueix(t, HORA_AMBIGUA)}
                opcions={dubte.opcions.map((o) => ({ valor: String(o.desfasament), etiqueta: `${dubte.local.slice(11, 16)} ${textDesfasament(o.desfasament)}` }))}
                onCanvi={triaDesfasament} />
            ) : null}
            <NavegacioMes className="sdp-calendari__navegacio" cursor={cursor} onCanvia={setCursor} avui={avui} />
            <GraellaMes compacta any={cursor.any} mes={cursor.mes} locale={locale} avui={avui}
              renderDia={(dia, { esAvui }) => (
                <button type="button" className="sdp-calendari__dia"
                  aria-pressed={Boolean(triada) && esMateixDia(triada, cursor.any, cursor.mes, dia)}
                  aria-current={esAvui ? 'date' : undefined}
                  aria-label={dataLlarga(new Date(cursor.any, cursor.mes, dia), locale)}
                  onClick={(event) => triaDia(dia, event.currentTarget)}>
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
