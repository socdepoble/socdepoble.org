/**
 * Salut · i18nSalutDomini.js (Onada R32.15).
 *
 * Traducció diferida pura del domini domèstic de Salut (diccionari d'entitats
 * i camps, avís, guia de 3 dies, alertes suaus, patrons, valoració setmanal i
 * etiquetes de data/errors) en es, en, eu i gl.
 * En valencià (ca) delega directament als mòduls purs del nucli (Llei del Píxel).
 * Zero diagnosi clínica, zero xarxa, zero DOM, Llei 32 estricta.
 */
import { FRANGES, textAssociacio } from './nucli/agitacio.js';
import { ETIQUETA_NIVELL, PEU_ALERTES } from './nucli/alertes.js';
import {
  AVIS_VALORACIO, CAMPS_COMUNS, DOMINIS_VALORACIO, ENTITATS, FREQUENCIES_VALORACIO, GRUPS_CONDUCTA,
  METRIQUES, campDe, etiquetaValor, opcionsDe, resumApunt, textDecimes, tipusDe
} from './nucli/diccionari.js';
import { textValorsAdmesos } from './nucli/full.js';
import { COLUMNES_DIARI_5_LLENGUES } from './nucli/importacio.js';
import { dataCurta, diaSetmana, etiquetaData, etiquetaDataLlarga } from './nucli/hores.js';
import { MOTIUS_SENSE_VOLUMS, textCobertura } from './nucli/metriques.js';
import { APARTATS_GUIA, AVIS_SALUT, FINALITAT, textError } from './textos.js';

const CODIS = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

function codiDe(idioma) {
  const base = String(idioma || 'ca').toLowerCase().split('-')[0];
  return CODIS.includes(base) ? base : 'ca';
}

/* ── Dates curtes i llargues ────────────────────────────────────────────── */

const CALENDARI = Object.freeze({
  es: Object.freeze({
    curts: Object.freeze(['dom.', 'lun.', 'mar.', 'mié.', 'jue.', 'vie.', 'sáb.']),
    llargs: Object.freeze(['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']),
    mesos: Object.freeze(['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']),
    formata: (diaSet, dia, mes) => `${diaSet}, ${dia} de ${mes}`,
  }),
  en: Object.freeze({
    curts: Object.freeze(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']),
    llargs: Object.freeze(['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
    mesos: Object.freeze(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']),
    formata: (diaSet, dia, mes) => `${diaSet}, ${dia} ${mes}`,
  }),
  eu: Object.freeze({
    curts: Object.freeze(['ig.', 'al.', 'ar.', 'az.', 'og.', 'ol.', 'lr.']),
    llargs: Object.freeze(['igandea', 'astelehena', 'asteartea', 'asteazkena', 'osteguna', 'ostirala', 'larunbata']),
    mesos: Object.freeze(['urtarrilak', 'otsailak', 'martxoak', 'apirilak', 'maiatzak', 'ekainak', 'uztailak', 'abuztuak', 'irailak', 'urriak', 'azaroak', 'abenduak']),
    formata: (diaSet, dia, mes) => `${diaSet}, ${mes} ${dia}`,
  }),
  gl: Object.freeze({
    curts: Object.freeze(['dom.', 'lun.', 'mar.', 'mér.', 'xov.', 'ven.', 'sáb.']),
    llargs: Object.freeze(['domingo', 'luns', 'martes', 'mércores', 'xoves', 'venres', 'sábado']),
    mesos: Object.freeze(['xaneiro', 'febreiro', 'marzo', 'abril', 'maio', 'xuño', 'xullo', 'agosto', 'setembro', 'outubro', 'novembro', 'decembro']),
    formata: (diaSet, dia, mes) => `${diaSet}, ${dia} de ${mes}`,
  }),
});

export function etiquetaDataSalut(data, idioma = 'ca') {
  const codi = codiDe(idioma);
  if (codi === 'ca') return etiquetaData(data);
  const cal = CALENDARI[codi];
  return `${cal.curts[diaSetmana(data)]} ${dataCurta(data)}`;
}

export function etiquetaDataLlargaSalut(data, idioma = 'ca') {
  const codi = codiDe(idioma);
  if (codi === 'ca') return etiquetaDataLlarga(data);
  const cal = CALENDARI[codi];
  const [, mes, dia] = data.split('-').map(Number);
  return cal.formata(cal.llargs[diaSetmana(data)], dia, cal.mesos[mes - 1]);
}

/* ── Errors del magatzem ────────────────────────────────────────────────── */

const ERRORS_MAGATZEM = Object.freeze({
  es: Object.freeze({
    NOMES_LECTURA: 'Otra pestaña está anotando: aquí solo puedes mirar.',
    CONFLICTE: 'El apunte ha cambiado en otra pestaña. Vuelve a abrirlo antes de guardarlo.',
    VERSIO_ANTIGA: 'Recarga la página para continuar: los datos de este dispositivo han cambiado.',
    BLOQUEJAT: 'Cierra las demás pestañas de Salud para continuar.',
    INVALID: 'Hay algún dato que no es válido.',
    DEFECTE: 'No se ha podido guardar. Vuelve a intentarlo.',
  }),
  en: Object.freeze({
    NOMES_LECTURA: 'Another tab is logging entries: this tab is read-only.',
    CONFLICTE: 'This entry changed in another tab. Reopen it before saving.',
    VERSIO_ANTIGA: 'Reload the page to continue: local data on this device has changed.',
    BLOQUEJAT: 'Close other Care log tabs to continue.',
    INVALID: 'Some entered data is invalid.',
    DEFECTE: 'Could not save. Please try again.',
  }),
  eu: Object.freeze({
    NOMES_LECTURA: 'Beste fitxa bat oharrak hartzen ari da: hemen begiratu besterik ezin duzu egin.',
    CONFLICTE: 'Oharra beste fitxa batean aldatu da. Ireki berriro gorde aurretik.',
    VERSIO_ANTIGA: 'Kargatu berriro orria jarraitzeko: gailu honetako datuak aldatu dira.',
    BLOQUEJAT: 'Itxi Osasunaren beste fitxak jarraitzeko.',
    INVALID: 'Daturen bat ez da baliozkoa.',
    DEFECTE: 'Ezin izan da gorde. Saiatu berriro.',
  }),
  gl: Object.freeze({
    NOMES_LECTURA: 'Outra lapela está anotando: aquí só podes mirar.',
    CONFLICTE: 'O apuntamento cambiou noutra lapela. Volve abrilo antes de gardalo.',
    VERSIO_ANTIGA: 'Recarga a páxina para continuar: os datos deste dispositivo cambiaron.',
    BLOQUEJAT: 'Pecha as outras lapelas de Saúde para continuar.',
    INVALID: 'Hai algún dato que non é válido.',
    DEFECTE: 'Non se puido gardar. Téntao de novo.',
  }),
});

export function textErrorSalut(error, idioma = 'ca') {
  const codi = codiDe(idioma);
  if (codi === 'ca') return textError(error);
  const taula = ERRORS_MAGATZEM[codi];
  switch (error?.codi) {
    case 'NOMES_LECTURA': return taula.NOMES_LECTURA;
    case 'CONFLICTE': return taula.CONFLICTE;
    case 'VERSIO_ANTIGA':
    case 'NO_DISPONIBLE': return taula.VERSIO_ANTIGA;
    case 'BLOQUEJAT': return taula.BLOQUEJAT;
    default: return error instanceof TypeError ? taula.INVALID : taula.DEFECTE;
  }
}

/* ── Avís i Guia (textos.js) ────────────────────────────────────────────── */

const TEXTOS_LLARGS = Object.freeze({
  es: Object.freeze({
    finalitat: 'Un cuaderno doméstico para anotar cómo orina, bebe, hace de vientre, duerme y cómo está la persona que cuidamos, y enseñarlo al médico o a enfermería en una hoja clara.',
    avis: Object.freeze([
      Object.freeze({
        titol: 'Qué es',
        paragrafs: Object.freeze([
          'Un cuaderno doméstico para anotar cómo orina, bebe, hace de vientre, duerme y cómo está la persona que cuidamos, y enseñarlo al médico o a enfermería en una hoja clara.',
          'Sirve para no tener que recordarlo todo de memoria y llevarlo ordenado a la consulta.',
        ]),
      }),
      Object.freeze({
        titol: 'Qué no es',
        paragrafs: Object.freeze([
          'No es un producto sanitario. No pone etiquetas a nadie, no dice qué le ocurre a una persona ni sugiere pautas ni cantidades de medicación.',
          'Cuando detecta algo que conviene revisar, únicamente dice «koméntalo con el médico» o, si hay peligro, «llama al 112».'.replace('koméntalo', 'coméntalo'),
        ]),
      }),
      Object.freeze({
        titol: 'Dónde van los datos',
        paragrafs: Object.freeze([
          'Se quedan en este dispositivo, dentro de este navegador. No se envían a Sóc de Poble, ni a ningún servidor, ni a ninguna inteligencia artificial.',
          'Si se borran los datos del navegador o se cambia de dispositivo, se pierden. Por eso conviene hacer copias de seguridad de vez en cuando (Copia y borrado).',
          'Quien abra este navegador en este dispositivo puede verlo todo. El historial del navegador guarda las direcciones de la app, que solo llevan fechas.',
          'Si quien lo utiliza es un profesional o una residencia, son responsables de su custodia, como con cualquier otro registro de cuidados.',
        ]),
      }),
      Object.freeze({
        titol: 'El 112',
        paragrafs: Object.freeze([
          'Esta app no sustituye al 112 ni a los servicios de salud. Si hay peligro ahora mismo, llama al 112.',
        ]),
      }),
    ]),
    guia: Object.freeze([
      Object.freeze({
        id: 'diari-3-dies',
        titol: 'Cómo hacer el diario de 3 días',
        paragrafs: Object.freeze([
          'Elige tres días seguidos que sean habituales en casa. Empieza el diario en «Días y periodos».',
          'Anota cada vez que orina y, si puedes, cuánto: con una jarra graduada o un recipiente medidor. Si no se ha podido medir, anótalo igual y marca «No se ha medido».',
          'Anota también lo que bebe, los escapes, los cambios de absorbente y cuándo se acuesta, se duerme, se despierta de noche y se levanta.',
          'A la mañana siguiente del último día, anota la primera micción al levantarse: cierra el recuento de la noche.',
          'Al terminar cada jornada, marca «He anotado todo el día». Sin ello, la app no calcula medias ni proporciones.',
          'Anota lo mínimo necesario, con respeto. Si la persona puede participar, coméntalo con ella.',
        ]),
      }),
      Object.freeze({
        id: 'signes',
        titol: 'Señales para consultar',
        paragrafs: Object.freeze([
          'Si hay peligro ahora mismo (una caída con herida, no responde como siempre, le cuesta respirar), llama al 112.',
          'Si cambia de repente (de golpe está mucho más confuso, inquieto o adormilado que de costumbre), háblalo hoy mismo con el médico o enfermería: puede deberse a una causa física que conviene revisar.',
          'La temperatura alta, la sangre en la orina o en las heces, el escozor o el dolor al orinar, la piel herida o varios días sin hacer de vientre son motivos para consultar con el médico o enfermería.',
          'Que la app no muestre ningún aviso no significa que todo vaya bien: si algo te preocupa, consulta.',
        ]),
      }),
    ]),
  }),
  en: Object.freeze({
    finalitat: 'A home care notebook to log bathroom visits, fluids, bowel movements, sleep and daily wellbeing for the person we care for, ready to share with a doctor or nurse on a clear sheet.',
    avis: Object.freeze([
      Object.freeze({
        titol: 'What it is',
        paragrafs: Object.freeze([
          'A home care notebook to log bathroom visits, fluids, bowel movements, sleep and daily wellbeing for the person we care for, ready to share with a doctor or nurse on a clear sheet.',
          'It spares families from relying on memory alone before a medical appointment.',
        ]),
      }),
      Object.freeze({
        titol: 'What it is not',
        paragrafs: Object.freeze([
          'It is not a medical device. It never labels conditions, never states what is wrong with anyone, and never suggests medications or amounts.',
          'When an entry pattern deserves attention, it simply says “discuss this with your doctor” or, in an emergency, “call 112”.',
        ]),
      }),
      Object.freeze({
        titol: 'Where data stays',
        paragrafs: Object.freeze([
          'Everything stays on this device, inside this browser. Nothing is sent to Sóc de Poble, to any server, or to any artificial intelligence.',
          'Clearing browser storage or switching devices erases entries. Save backup copies regularly under Backup & erase.',
          'Anyone opening this browser on this device can view the log. Browser history only records dates in app URLs.',
          'Care professionals or facilities using this tool remain responsible for data stewardship, just like with paper charts.',
        ]),
      }),
      Object.freeze({
        titol: 'Emergency 112',
        paragrafs: Object.freeze([
          'This app never replaces 112 or healthcare services. If there is immediate danger right now, call 112.',
        ]),
      }),
    ]),
    guia: Object.freeze([
      Object.freeze({
        id: 'diari-3-dies',
        titol: 'How to keep a 3-day diary',
        paragrafs: Object.freeze([
          'Pick three typical consecutive days. Start the diary under “Days & periods”.',
          'Log every bathroom visit and, whenever possible, the volume in ml using a measuring jug. If unmeasured, log it anyway and choose “Not measured”.',
          'Also log drinks, leaks, pad changes, and when the person goes to bed, falls asleep, wakes at night, and gets up.',
          'On the morning after the third day, log the first morning bathroom visit: it closes the final night window.',
          'At the end of each day, switch on “I logged the whole day”. Averages and ratios require complete days.',
          'Record only what is helpful, with dignity. Whenever possible, involve the person you care for.',
        ]),
      }),
      Object.freeze({
        id: 'signes',
        titol: 'When to call for advice',
        paragrafs: Object.freeze([
          'If there is immediate danger (a fall with injury, sudden unresponsiveness, trouble breathing), call 112.',
          'If behaviour changes abruptly (suddenly far more confused, restless or drowsy than usual), speak with a doctor or nurse today: a physical cause may need checking.',
          'High temperature, visible blood in urine or stool, burning or pain when passing urine, broken skin, or several days without a bowel movement warrant speaking with a doctor or nurse.',
          'No notices in the app never guarantees everything is fine: whenever something worries you, seek advice.',
        ]),
      }),
    ]),
  }),
  eu: Object.freeze({
    finalitat: 'Etxeko koaderno bat, zaintzen dugun pertsonak nola pixa egiten duen, edaten duen, sabel-hustuketa egiten duen, lo egiten duen eta nola dagoen apuntatzeko, eta medikuari edo erizaintzari orri argi batean erakusteko.',
    avis: Object.freeze([
      Object.freeze({
        titol: 'Zer da',
        paragrafs: Object.freeze([
          'Etxeko koaderno bat, zaintzen dugun pertsonak nola pixa egiten duen, edaten duen, sabel-hustuketa egiten duen, lo egiten duen eta nola dagoen apuntatzeko, eta medikuari edo erizaintzari orri argi batean erakusteko.',
          'Dena buruz gogoratu behar ez izateko eta kontsultara txukun eramateko balio du.',
        ]),
      }),
      Object.freeze({
        titol: 'Zer ez da',
        paragrafs: Object.freeze([
          'Ez da osasun-produktu bat. Ez dio inori etiketarik jartzen, ez du esaten zer gertatzen zaion inori eta ez du medikazio edo kopururik proposatzen.',
          'Begiratzea merezi duen zerbait ikustean, «hitz egin medikuarekin» edo, arriskua badago, «deitu 112ra» soilik esaten du.',
        ]),
      }),
      Object.freeze({
        titol: 'Nora doaz datuak',
        paragrafs: Object.freeze([
          'Gailu honetan geratzen dira, nabigatzaile honen barruan. Ez dira Sóc de Poblera bidaltzen, ez zerbitzari batera, ez adimen artifizial batera.',
          'Nabigatzaileko datuak ezabatuz gero edo gailuz aldatuz gero, galdu egiten dira. Horregatik komeni da noizean behin segurtasun-kopiak egitea (Kopia eta ezabaketa).',
          'Gailu honetan nabigatzaile hau irekitzen duen edonork ikus dezake dena. Nabigatzailearen historiak aplikazioaren helbideak gordetzen ditu, datak soilik daramatzatenak.',
          'Erabiltzailea profesional bat edo egoitza bat bada, beraiek dira arduradunak, beste edozein zaintza-erregistrorekin bezala.',
        ]),
      }),
      Object.freeze({
        titol: '112 zenbakia',
        paragrafs: Object.freeze([
          'Aplikazio honek ez ditu 112a ez osasun-zerbitzuak ordezkatzen. Une honetan arriskua badago, deitu 112ra.',
        ]),
      }),
    ]),
    guia: Object.freeze([
      Object.freeze({
        id: 'diari-3-dies',
        titol: 'Nola egin 3 eguneko egunkaria',
        paragrafs: Object.freeze([
          'Aukeratu etxean ohikoak diren hiru egun jarraian. Hasi egunkaria «Egunak eta aldiak» atalean.',
          'Apuntatu pixa egiten duen bakoitzean eta, ahal baduzu, zenbat: pitxer graduatu edo neurri-ontzi batekin. Ezin izan bada neurtu, apuntatu berdin eta markatu «Ez da neurtu».',
          'Apuntatu edaten duena, ihesak, xurgatzaile-aldaketak eta noiz oheratzen den, lokartzen den, gauez esnatzen den eta jaikitzen den ere.',
          'Azken egunaren biharamunean, apuntatu goizeko lehen pixa-egitea: horrek ixten du gaueko kontua.',
          'Egun bakoitza amaitzean, markatu «Egun osoa apuntatu dut». Horiek gabe, aplikazioak ez du batezbestekorik kalkulatzen.',
          'Apuntatu beharrezkoa den gutxienekoa, errespetuz. Parte har badezake, hitz egin berarekin.',
        ]),
      }),
      Object.freeze({
        id: 'signes',
        titol: 'Deitzeko seinaleak',
        paragrafs: Object.freeze([
          'Une honetan arriskua badago (zauridun erorikoa, ez du betiko moduan erantzuten, arnasa hartzea kostatzen zaio), deitu 112ra.',
          'Bat-batean aldatzen bada (kolpetik ohi baino askoz nahasiago, urduriago edo logaleago badago), hitz egin gaur bertan medikuarekin edo erizaintzarekin: begiratu beharreko arrazoi fisiko bat egon daiteke.',
          'Tenperatura altua, odola gernuan edo gorotzean, erremina edo mina pixa egitean, azala zaurituta egotea edo sabel-hustuketarik gabeko hainbat egun medikuarekin edo erizaintzarekin hitz egiteko arrazoiak dira.',
          'Aplikazioak oharrik ez erakusteak ez du esan nahi dena ondo doanik: zerbaitek kezkatzen bazaitu, galdetu.',
        ]),
      }),
    ]),
  }),
  gl: Object.freeze({
    finalitat: 'Un caderno doméstico para anotar como ouriña, bebe, fai de ventre, durme e como está a persoa que coidamos, e amosalo ao médico ou a enfermaría nunha folla clara.',
    avis: Object.freeze([
      Object.freeze({
        titol: 'Que é',
        paragrafs: Object.freeze([
          'Un caderno doméstico para anotar como ouriña, bebe, fai de ventre, durme e como está a persoa que coidamos, e amosalo ao médico ou a enfermaría nunha folla clara.',
          'Serve para non ter que lembralo todo de memoria e levalo ordenado á consulta.',
        ]),
      }),
      Object.freeze({
        titol: 'Que non é',
        paragrafs: Object.freeze([
          'Non é un produto sanitario. Non pon etiquetas a ninguén, non di que lle pasa a unha persoa nin propón pautas nin cantidades de medicación.',
          'Cando detecta algo que paga a pena mirar, só di «fálao co médico» ou, se hai perigo, «chama ao 112».',
        ]),
      }),
      Object.freeze({
        titol: 'Onde van os datos',
        paragrafs: Object.freeze([
          'Quedan neste dispositivo, dentro deste navegador. Non se envían a Sóc de Poble, nin a ningún servidor, nin a ningunha intelixencia artificial.',
          'Se se borran os datos do navegador ou se cambia de dispositivo, pérdense. Por iso convén facer copias de seguridade de cando en vez (Copia e borrado).',
          'Quen abra este navegador neste dispositivo pode velo todo. O historial do navegador garda os enderezos da app, que só levan datas.',
          'Se quen o emprega é un profesional ou unha residencia, son responsables da súa custodia, coma con calquera outro rexistro de coidados.',
        ]),
      }),
      Object.freeze({
        titol: 'O 112',
        paragrafs: Object.freeze([
          'Esta app non substitúe o 112 nin os servizos de saúde. Se hai perigo agora mesmo, chama ao 112.',
        ]),
      }),
    ]),
    guia: Object.freeze([
      Object.freeze({
        id: 'diari-3-dies',
        titol: 'Como facer o diario de 3 días',
        paragrafs: Object.freeze([
          'Escolle tres días seguidos que sexan normais na casa. Comeza o diario en «Días e períodos».',
          'Anota cada vez que ouriña e, se podes, canto: cunha xerra graduada ou botella medidora. Se non se puido medir, anótao igual e marca «Non se mediu».',
          'Anota tamén o que bebe, as perdas, os cambios de absorbente e cando se deita, adormece, esperta de noite e se ergue.',
          'Á mañá seguinte do último día, anota a primeira micción ao erguerse: pecha a conta da noite.',
          'Cando remate cada día, marca «Anotei todo o día». Sen iso, a app non calcula medias nin proporcións.',
          'Anota o mínimo necesario, con respecto. Se pode participar, fálao con ela ou con el.',
        ]),
      }),
      Object.freeze({
        id: 'signes',
        titol: 'Sinais para chamar',
        paragrafs: Object.freeze([
          'Se hai perigo agora mesmo (unha caída con ferida, non responde coma sempre, cústalle respirar), chama ao 112.',
          'Se cambia de súpeto (de golpe está moito máis confuso, inquieto ou adormecido ca de costume), fálao hoxe mesmo co médico ou enfermaría: pode ter unha causa física que cómpre mirar.',
          'A temperatura alta, o sangue nos ouriños ou nas feces, o ardor ou a dor ao ouriñar, a pel ferida ou varios días sen facer de ventre son motivos para falar co médico ou enfermaría.',
          'Que a app non amose ningún aviso non quere dicir que todo vaia ben: se algo che preocupa, consulta.',
        ]),
      }),
    ]),
  }),
});

export const finalitatSalut = (idioma = 'ca') => (codiDe(idioma) === 'ca' ? FINALITAT : TEXTOS_LLARGS[codiDe(idioma)].finalitat);
export const avisSalutTraduit = (idioma = 'ca') => (codiDe(idioma) === 'ca' ? AVIS_SALUT : TEXTOS_LLARGS[codiDe(idioma)].avis);
export const apartatsGuiaSalut = (idioma = 'ca') => (codiDe(idioma) === 'ca' ? APARTATS_GUIA : TEXTOS_LLARGS[codiDe(idioma)].guia);

/* ── Traducció d'entitats, camps, grups i valors (diccionari.js) ────────── */

/* Mapa compacte: [es, en, eu, gl] per a cada cadena de diccionari.js. */
const L4 = (es, en, eu, gl) => Object.freeze({ es, en, eu, gl });

const ENTITATS_TR = Object.freeze({
  miccio: Object.freeze({
    nom: L4('Micción', 'Bathroom visit', 'Pixa-egitea', 'Micción'),
    boto: L4('Ha orinado', 'Bathroom visit', 'Pixa egin du', 'Ouriñou'),
    definicio: L4(
      'cada vez que orina, en el inodoro, el orinal o la cuña',
      'each time they pass urine, in the toilet, handheld urinal or bedpan',
      'pixa egiten duen bakoitzean, komunean, pixontzian edo ohe-ontzian',
      'cada vez que ouriña, no váter, no ouriñal ou na cuña'
    ),
  }),
  ingesta: Object.freeze({
    nom: L4('Bebida', 'Fluid intake', 'Edaria', 'Bebida'),
    boto: L4('Ha bebido', 'Had a drink', 'Edan du', 'Bebeu'),
    definicio: L4(
      'cada vez que bebe (o se le ofrece beber)',
      'each drink taken (or offered)',
      'edaten duen (edo edatea eskaintzen zaion) bakoitzean',
      'cada vez que bebe (ou se lle ofrece beber)'
    ),
  }),
  escapament: Object.freeze({
    nom: L4('Escape', 'Urine leak', 'Ihesa', 'Perda'),
    boto: L4('Escape', 'Leak', 'Ihesa', 'Perda'),
    definicio: L4(
      'orina que se escapa involuntariamente',
      'unintended urine leakage',
      'nahi gabe ihes egiten duen gernua',
      'ouriños que escapan sen querer'
    ),
  }),
  absorbent: Object.freeze({
    nom: L4('Cambio de absorbente', 'Pad change', 'Xurgatzaile-aldaketa', 'Cambio de absorbente'),
    boto: L4('Absorbente', 'Pad', 'Xurgatzailea', 'Absorbente'),
    definicio: L4('cada cambio de absorbente', 'each absorbent pad change', 'xurgatzaile-aldaketa bakoitza', 'cada cambio de absorbente'),
  }),
  deposicio: Object.freeze({
    nom: L4('Deposición', 'Bowel movement', 'Sabel-hustuketa', 'Deposición'),
    boto: L4('Ha hecho de vientre', 'Bowel movement', 'Sabela hustu du', 'Fixo de ventre'),
    definicio: L4('cada vez que hace de vientre', 'each bowel movement', 'sabela husten duen bakoitzean', 'cada vez que fai de ventre'),
  }),
  conducta: Object.freeze({
    nom: L4('Episodio de conducta', 'Behaviour episode', 'Jokabide-gertakaria', 'Episodio de conduta'),
    boto: L4('Conducta', 'Behaviour', 'Jokabidea', 'Conduta'),
    definicio: L4(
      'un momento de inquietud o conducta difícil, anotado en tres pasos: qué ha hecho, qué ocurría antes y qué hemos hecho',
      'a moment of restlessness or challenging behaviour, logged in three steps: what happened, what preceded it, and how we responded',
      'urduritasun edo jokabide zaileko une bat, hiru urratsetan apuntatua: zer egin duen, aurretik zer gertatzen zen eta zer egin dugun',
      'un momento de inquietude ou conduta difícil, anotado en tres pasos: que fixo, que pasaba antes e que fixemos'
    ),
  }),
  medicacio: Object.freeze({
    nom: L4('Medicación', 'Medication', 'Medikazioa', 'Medicación'),
    boto: L4('Medicación', 'Medication', 'Medikazioa', 'Medicación'),
    definicio: L4(
      'cada toma de medicación, tal como la nombra la familia',
      'each medication dose, using the family’s everyday name',
      'medikazio-hartualdi bakoitza, etxean esaten zaion bezala',
      'cada toma de medicación, tal como lle chama a familia'
    ),
  }),
  son: Object.freeze({
    nom: L4('Sueño', 'Sleep', 'Loa', 'Sono'),
    boto: L4('Sueño', 'Sleep', 'Loa', 'Sono'),
    definicio: L4(
      'cuándo se acuesta, se duerme, se despierta de noche o se levanta',
      'when they go to bed, fall asleep, wake at night or get up',
      'noiz oheratzen den, lokartzen den, gauez esnatzen den edo jaikitzen den',
      'cando se deita, adormece, esperta de noite ou se ergue'
    ),
  }),
  observacio: Object.freeze({
    nom: L4('Observación', 'Observation', 'Behaketa', 'Observación'),
    boto: L4('Otros', 'Other', 'Besteak', 'Outros'),
    definicio: L4(
      'otras cosas observadas: temperatura, una caída, que come poco o que está distinto',
      'other observations: temperature, a fall, low appetite or sudden change',
      'ikusitako beste gauza batzuk: tenperatura, eroriko bat, gutxi jatea edo ezberdin egotea',
      'outras cousas que se ven: temperatura, unha caída, que come pouco ou que está diferente'
    ),
  }),
  persona: Object.freeze({
    nom: L4('Persona', 'Person', 'Pertsona', 'Persoa'),
    definicio: L4(
      'a quien cuidamos; una sola en este dispositivo',
      'the person we care for; one profile on this device',
      'zaintzen dugun pertsona; bakarra gailu honetan',
      'a quen coidamos; unha soa neste dispositivo'
    ),
  }),
  jornada: Object.freeze({
    nom: L4('Jornada', 'Day', 'Eguna', 'Xornada'),
    definicio: L4(
      'un día, desde que se levanta hasta que se levanta al día siguiente',
      'one care day, from waking up until waking up the next morning',
      'egun bat, jaikitzen denetik biharamunean jaikitzen den arte',
      'un día, dende que se ergue ata que se ergue ao día seguinte'
    ),
  }),
  metriques: Object.freeze({
    nom: L4('Medidas calculadas', 'Calculated figures', 'Kalkulatutako neurriak', 'Medidas calculadas'),
    definicio: L4(
      'lo que calcula la app con los apuntes de una jornada completa',
      'figures computed from entries on a complete day',
      'aplikazioak egun oso bateko oharrekin kalkulatzen duena',
      'o que calcula a app cos apuntamentos dunha xornada completa'
    ),
  }),
  derivats: Object.freeze({
    nom: L4('Columnas calculadas', 'Derived columns', 'Kalkulatutako zutabeak', 'Columnas calculadas'),
    definicio: L4(
      'columnas de la exportación que calcula la app automáticamente',
      'spreadsheet columns computed automatically on export',
      'esportazioan aplikazioak berez kalkulatzen dituen zutabeak',
      'columnas da exportación que non se anotan á man'
    ),
  }),
});

/* Traducció literal de cadenes del diccionari (etiquetes, valors, definicions i motius). */
const CADENES_DICCIONARI = Object.freeze({
  /* Camps comuns */
  'Dia i hora': L4('Día y hora', 'Date & time', 'Eguna eta ordua', 'Día e hora'),
  'quan ha passat, amb l’hora del rellotge de casa': L4('cuándo ha pasado, con la hora del reloj de casa', 'when it happened, in local wall-clock time', 'noiz gertatu den, etxeko erlojuaren orduarekin', 'cando pasou, coa hora do reloxo da casa'),
  'ordena el dia i separa el dia de la nit; amb el canvi d’hora es guarda també la diferència amb l’hora universal': L4('ordena la jornada y separa el día de la noche; en cambios de hora conserva la diferencia con UTC', 'orders the timeline and separates day from night, preserving UTC offset across clock changes', 'eguna ordenatzen du eta eguna eta gaua bereizten ditu; ordu-aldaketarekin UTC aldea ere gordetzen da', 'ordena o día e separa o día da noite; co cambio de hora gárdase tamén a diferenza coa hora universal'),
  Nota: L4('Nota', 'Note', 'Oharra', 'Nota'),
  'una nota curta, escrita amb respecte': L4('una nota breve, escrita con respeto', 'a short, respectful note', 'ohar labur bat, errespetuz idatzia', 'unha nota curta, escrita con respecto'),
  'el que no cap en cap altre camp i el metge ha de saber': L4('lo que no cabe en otro campo y conviene comentar al médico', 'context that does not fit elsewhere and helps the clinician', 'beste eremu batean sartzen ez dena eta medikuak jakin beharrekoa', 'o que non colle noutro campo e o médico debe saber'),
  /* Micció + Ingesta + Escapament + Absorbent + Deposició + Son + Medicació + Conducta + Observació */
  'Quant (ml)': L4('Cuánto (ml)', 'Amount (ml)', 'Zenbat (ml)', 'Canto (ml)'),
  'Més de 800 ml d’una vegada és poc habitual: revisa la xifra.': L4('Más de 800 ml de una sola vez es poco habitual: revisa la cifra.', 'Over 800 ml in a single visit is unusual: please check the number.', 'Aldi batean 800 ml baino gehiago ez da ohikoa: berrikusi kopurua.', 'Máis de 800 ml dunha vez é pouco habitual: revisa a cifra.'),
  'quant ha orinat, mesurat amb una gerra graduada o una ampolla': L4('cuánto ha orinado, medido con jarra graduada o botella', 'urine volume measured with a graduated jug or container', 'zenbat pixa egin duen, pitxer graduatu edo ontzi batekin neurtuta', 'canto ouriñou, medido cunha xerra graduada ou botella'),
  'el volum total, el de la nit i el de cada vegada són la base del diari': L4('el volumen total, el nocturno y el de cada vez son la base del diario', '24 h, night-time and single-visit volumes form the core of the diary', 'bolumen osoa, gauekoa eta aldi bakoitzekoa dira egunkariaren oinarria', 'o volume total, o da noite e o de cada vez son a base do diario'),
  'Com s’ha mesurat': L4('Cómo se ha medido', 'How it was measured', 'Nola neurtu da', 'Como se mediu'),
  Mesurat: L4('Medido', 'Measured', 'Neurtuta', 'Medido'),
  'A ull': L4('A ojo', 'Estimated', 'Begiz', 'A ollo'),
  'No s’ha mesurat': L4('No se ha medido', 'Not measured', 'Ez da neurtu', 'Non se mediu'),
  'si el volum s’ha mesurat, s’ha calculat a ull o no se sap': L4('si el volumen se ha medido, estimado a ojo o no se sabe', 'whether volume was measured, estimated or unrecorded', 'bolumena neurtu den, begiz kalkulatu den edo ez dakigun', 'se o volume se mediu, se calculou a ollo ou non se sabe'),
  'sense mesura no es calculen volums; ho diu la cobertura del dia': L4('sin medida no se calculan volúmenes; lo indica la cobertura del día', 'volumes require measured visits, reflected in daily coverage', 'neurketarik gabe ez da bolumenik kalkulatzen; eguneko estaldurak adierazten du', 'sen medida non se calculan volumes; indícao a cobertura do día'),
  On: L4('Dónde', 'Where', 'Non', 'Onde'),
  Vàter: L4('Inodoro', 'Toilet', 'Komuna', 'Váter'),
  'Orinal de mà': L4('Orinal de mano', 'Handheld urinal', 'Eskuko pixontzia', 'Ouriñal de man'),
  Cunya: L4('Cuña', 'Bedpan', 'Ohe-ontzia', 'Cuña'),
  'Cadira vàter': L4('Silla inodoro', 'Commode chair', 'Komuneko aulkia', 'Cadeira váter'),
  'on ha orinat': L4('dónde ha orinado', 'where urine was passed', 'non egin duen pixa', 'onde ouriñou'),
  'ajuda a entendre quanta autonomia té i el risc de caure': L4('ayuda a entender su autonomía y el riesgo de caída', 'helps understand mobility independence and fall risk', 'zenbateko autonomia duen eta erortzeko arriskua ulertzen laguntzen du', 'axuda a entender canta autonomía ten e o risco de caer'),
  Ganes: L4('Ganas', 'Urgency', 'Gogoa', 'Ganas'),
  '0 · Cap': L4('0 · Ninguna', '0 · None', '0 · Batere ez', '0 · Ningunha'),
  '1 · Lleus': L4('1 · Leves', '1 · Mild', '1 · Arina', '1 · Leves'),
  '2 · Moderades': L4('2 · Moderadas', '2 · Moderate', '2 · Ertaina', '2 · Moderadas'),
  '3 · Intenses': L4('3 · Intensas', '3 · Strong', '3 · Handia', '3 · Intensas'),
  '4 · Se li ha escapat de pressa': L4('4 · Se le ha escapado con prisa', '4 · Leaked before reaching', '4 · Presaka ihes egin dio', '4 · Escapóuselle coa présa'),
  'com de fortes eren les ganes d’orinar (escala de 0 a 4)': L4('intensidad de las ganas de orinar (escala de 0 a 4)', 'strength of the urge to pass urine (0 to 4 scale)', 'pixa egiteko gogoaren indarra (0tik 4rako eskala)', 'como de fortes eran as ganas de ouriñar (escala de 0 a 4)'),
  'unes ganes fortes i sovint són una cosa que el metge vol saber': L4('unas ganas intensas y frecuentes son relevantes para el médico', 'frequent strong urges are helpful for the clinician to know', 'gogo bizia eta sarria medikuak jakin nahi duen zerbait da', 'unhas ganas fortes e frecuentes son algo que o médico quere saber'),
  Ajuda: L4('Ayuda', 'Assistance', 'Laguntza', 'Axuda'),
  'Ha anat sol': L4('Ha ido solo', 'Went independently', 'Bakarrik joan da', 'Foi só'),
  'Amb ajuda': L4('Con ayuda', 'With assistance', 'Laguntzarekin', 'Con axuda'),
  'Li l’hem oferit per horari': L4('Ofrecido por horario', 'Scheduled prompt', 'Ordutegiaren arabera eskainia', 'Ofrecido por horario'),
  'si ha anat tot sol o se li ha oferit': L4('si ha ido por su cuenta o se le ha ofrecido', 'whether independent, assisted or prompted on schedule', 'bakarrik joan den edo eskaini zaion', 'se foi pola súa conta ou se lle ofreceu'),
  'mostra si oferir el vàter a hores fixes funciona': L4('muestra si ofrecer ir al baño a horas fijas funciona', 'shows whether scheduled bathroom prompts help', 'komuna ordu finkoetan eskaintzeak funtzionatzen duen erakusten du', 'amosa se ofrecer o váter a horas fixas funciona'),
  Molèsties: L4('Molestias', 'Discomfort', 'Eragozpenak', 'Molestias'),
  Cap: L4('Ninguna', 'None', 'Batere ez', 'Ningunha'),
  Cremor: L4('Escozor', 'Burning', 'Erremina', 'Ardor'),
  Dolor: L4('Dolor', 'Pain', 'Mina', 'Dor'),
  'Li costa començar': L4('Le cuesta empezar', 'Hesitancy starting', 'Hastea kostatzen zaio', 'Cústalle comezar'),
  'Raig fluix': L4('Chorro flojo', 'Weak stream', 'Zurrusta ahula', 'Chorro frouxo'),
  'què ha notat en orinar': L4('qué ha notado al orinar', 'any discomfort noticed while passing urine', 'pixa egitean zer nabaritu duen', 'que notou ao ouriñar'),
  'el cremor o el dolor són un motiu per a parlar-ne amb el metge': L4('el escozor o el dolor son motivo para hablar con el médico', 'burning or pain warrants speaking with a doctor', 'erremina edo mina medikuarekin hitz egiteko arrazoia dira', 'o ardor ou a dor son motivo para falar co médico'),
  'Com era': L4('Aspecto', 'Appearance', 'Nolakoa zen', 'Como era'),
  Normal: L4('Normal', 'Normal', 'Normala', 'Normal'),
  Clara: L4('Clara', 'Pale', 'Argia', 'Clara'),
  Fosca: L4('Oscura', 'Dark', 'Iluna', 'Escura'),
  Tèrbola: L4('Turbia', 'Cloudy', 'Arrea', 'Turba'),
  'Sang visible': L4('Sangre visible', 'Visible blood', 'Ageriko odola', 'Sangue visible'),
  'Olor forta': L4('Olor fuerte', 'Strong odour', 'Usain handia', 'Cheiro forte'),
  'com era l’orina a simple vista': L4('aspecto de la orina a simple vista', 'how the urine looked to the naked eye', 'gernuaren itxura begi hutsez', 'como eran os ouriños a simple vista'),
  'la sang visible o un canvi brusc són un motiu per a consultar': L4('la sangre visible o un cambio brusco son motivo para consultar', 'visible blood or sudden change is a reason to seek medical advice', 'ageriko odola edo bat-bateko aldaketa kontsultatzeko arrazoia dira', 'o sangue visible ou un cambio brusco son motivo para consultar'),
  'quant ha begut; un got normal són uns 200 ml': L4('cuánto ha bebido; un vaso normal son unos 200 ml', 'amount drunk; an ordinary glass is roughly 200 ml', 'zenbat edan duen; edalontzi arrunt bat 200 ml inguru da', 'canto bebeu; un vaso normal son uns 200 ml'),
  'sense saber què entra no s’entén el que ix': L4('sin saber cuánto bebe no se entiende cuánto orina', 'fluid output only makes sense alongside fluid intake', 'zer sartzen den jakin gabe ez da ulertzen zer ateratzen den', 'sen saber que entra non se entende o que sae'),
  Què: L4('Qué', 'What', 'Zer', 'Que'),
  Aigua: L4('Agua', 'Water', 'Ura', 'Auga'),
  Cafè: L4('Café', 'Coffee', 'Kafea', 'Café'),
  Te: L4('Té', 'Tea', 'Tea', 'Té'),
  Infusió: L4('Infusión', 'Herbal tea', 'Infusioa', 'Infusión'),
  Llet: L4('Leche', 'Milk', 'Esnea', 'Leite'),
  Suc: L4('Zumo', 'Juice', 'Zukua', 'Zume'),
  Refresc: L4('Refresco', 'Soft drink', 'Freskagarria', 'Refresco'),
  'Refresc amb cafeïna': L4('Refresco con cafeína', 'Caffeinated drink', 'Kafeinadun freskagarria', 'Refresco con cafeína'),
  Alcohol: L4('Alcohol', 'Alcohol', 'Alkohola', 'Alcol'),
  'Brou o sopa': L4('Caldo o sopa', 'Broth or soup', 'Salda edo zopa', 'Caldo ou sopa'),
  'Postres líquides': L4('Postre líquido', 'Liquid dessert', 'Postre likidoa', 'Sobremesa líquida'),
  'Beguda espessida': L4('Bebida espesada', 'Thickened drink', 'Edari loditua', 'Bebida espesada'),
  'Una altra': L4('Otra', 'Other', 'Beste bat', 'Outra'),
  'què ha begut': L4('qué tipo de bebida ha tomado', 'type of drink taken', 'zer edan duen', 'que bebeu'),
  'la cafeïna i l’alcohol fan orinar més; les begudes espessides compten igual': L4('la cafeína y el alcohol hacen orinar más; las bebidas espesadas cuentan igual', 'caffeine and alcohol increase urine output; thickened fluids count too', 'kafeinak eta alkoholak pixa gehiago eragiten dute; edari lodituek berdin balio dute', 'a cafeína e o alcol fan ouriñar máis; as bebidas espesadas contan igual'),
  'Calculat a ull': L4('Calculado a ojo', 'Estimated amount', 'Begiz kalkulatua', 'Calculado a ollo'),
  'el volum no s’ha mesurat, s’ha calculat a ull': L4('el volumen no se ha medido, se ha estimado a ojo', 'volume was estimated rather than measured', 'bolumena ez da neurtu, begiz kalkulatu da', 'o volume non se mediu, calculouse a ollo'),
  'per a saber quant ens podem refiar del total': L4('para saber qué precisión tiene el total del día', 'indicates how exact the daily total is', 'eguneko guztizkoaz zenbat fida gaitezkeen jakiteko', 'para saber canto nos podemos fiar do total'),
  'Li l’hem oferida i no l’ha volguda': L4('Se la hemos ofrecido y no la ha querido', 'Offered but declined', 'Eskaini diogu eta ez du nahi izan', 'Ofrecémoslla e non a quixo'),
  'se li ha oferit beure i no ha volgut': L4('se le ha ofrecido bebida y la ha rechazado', 'a drink was offered and declined', 'edatea eskaini zaio eta ez du nahi izan', 'ofrecéuselle beber e non quixo'),
  'si en rebutja molt, pot beure massa poc': L4('si rechaza a menudo, puede beber demasiado poco', 'frequent refusals may lead to low fluid intake', 'askotan ukatzen badu, gutxiegi edan dezake', 'se rexeita moito, pode beber demasiado pouco'),
  Quant: L4('Cuánto', 'Amount', 'Zenbat', 'Canto'),
  'Unes gotes': L4('Unas gotas', 'A few drops', 'Tanta batzuk', 'Unhas pingas'),
  Humit: L4('Húmedo', 'Damp', 'Hezea', 'Húmido'),
  Xopat: L4('Empapado', 'Soaked', 'Blai eginda', 'Empapado'),
  'quant s’ha escapat': L4('cuánta orina se ha escapado', 'extent of urine leakage', 'zenbat ihes egin duen', 'canto escapou'),
  'la quantitat i les vegades ajuden a entendre de quina mena d’escapament es tracta': L4('la cantidad y la frecuencia ayudan a entender el patrón de escapes', 'amount and frequency help clarify the leakage pattern', 'kopuruak eta maiztasunak ihes-eredua ulertzen laguntzen dute', 'a cantidade e as veces axudan a entender o tipo de perda'),
  'Quan ha passat': L4('Cuándo ha pasado', 'When it happened', 'Noiz gertatu da', 'Cando pasou'),
  'Amb ganes urgents': L4('Con ganas urgentes', 'With sudden urge', 'Larrialdiko gogoarekin', 'Con ganas urxentes'),
  'En un esforç (tos, alçar-se)': L4('Al hacer esfuerzo (tos, levantarse)', 'On exertion (coughing, standing up)', 'Ahalegin batean (eztula, jaikitzea)', 'Nun esforzo (tose, erguerse)'),
  'Sense adonar-se’n': L4('Sin darse cuenta', 'Without noticing', 'Konturatu gabe', 'Sen decatarse'),
  'No se sap': L4('No se sabe', 'Unknown', 'Ez dakigu', 'Non se sabe'),
  'què passava quan s’ha escapat': L4('qué ocurría cuando se ha escapado', 'circumstance around the leak', 'ihes egitean zer gertatzen zen', 'que pasaba cando escapou'),
  'no és el mateix escapar-se en un esforç, amb ganes urgents o sense adonar-se’n': L4('es distinto un escape al hacer esfuerzo, con urgencia o sin notarlo', 'leaks on exertion, with urgency or unawares point to different needs', 'ez da gauza bera ahaleginean, larrialdiz edo konturatu gabe ihes egitea', 'non é o mesmo unha perda nun esforzo, con ganas urxentes ou sen decatarse'),
  'Pes de l’absorbent mullat (g)': L4('Peso del absorbente mojado (g)', 'Wet pad weight (g)', 'Xurgatzaile bustiaren pisua (g)', 'Peso do absorbente mollado (g)'),
  'el pes de l’absorbent mullat, si hi ha balança': L4('peso del absorbente mojado, si tenéis báscula', 'weight of the used pad if a scale is available', 'xurgatzaile bustiaren pisua, balantzarik badago', 'o peso do absorbente mollado, se hai balanza'),
  'el pes menys el pes en sec són, més o menys, els ml que s’han escapat': L4('el peso menos el peso en seco equivale aproximadamente a los ml escapados', 'wet weight minus dry weight approximates leaked ml', 'pisua ken pisu lehorra ihes egindako ml-ak dira gutxi gorabehera', 'o peso menos o peso en seco son, máis ou menos, os ml que escaparon'),
  'Com estava': L4('Cómo estaba', 'Condition', 'Nola zegoen', 'Como estaba'),
  Sec: L4('Seco', 'Dry', 'Lehorra', 'Seco'),
  Mullat: L4('Mojado', 'Wet', 'Bustia', 'Mollado'),
  'Amb femta': L4('Con heces', 'With stool', 'Gorotzarekin', 'Con feces'),
  'com estava l’absorbent que s’ha llevat': L4('cómo estaba el absorbente retirado', 'condition of the removed pad', 'kendutako xurgatzailea nola zegoen', 'como estaba o absorbente retirado'),
  'el nombre de canvis i com estaven diuen quant s’escapa': L4('el número de cambios y su estado indican cuánto se escapa', 'change count and pad wetness show overall leakage', 'aldaketa-kopuruak eta egoerak zenbat ihes egiten duen adierazten dute', 'o número de cambios e como estaban indican canto escapa'),
  'Pes (g)': L4('Peso (g)', 'Weight (g)', 'Pisua (g)', 'Peso (g)'),
  'el pes de l’absorbent llevat, si hi ha balança': L4('peso del absorbente retirado, si hay báscula', 'removed pad weight if weighed', 'kendutako xurgatzailearen pisua, balantzarik badago', 'o peso do absorbente retirado, se hai balanza'),
  'amb el pes en sec, dona una idea dels ml': L4('junto al peso en seco orienta sobre los ml', 'paired with dry pad weight, estimates ml', 'pisu lehorrarekin batera, ml-en ideia ematen du', 'co peso en seco dá unha idea dos ml'),
  'La pell': L4('La piel', 'Skin condition', 'Azala', 'A pel'),
  Bé: L4('Bien', 'Intact', 'Ondo', 'Ben'),
  Envermellida: L4('Enrojecida', 'Reddened', 'Gorritua', 'avermellada'.replace(/^a/, 'A')),
  Ferida: L4('Herida', 'Broken skin', 'Zauritua', 'Ferida'),
  'com està la pell de la zona': L4('estado de la piel de la zona', 'skin condition in the area', 'inguruko azala nola dagoen', 'como está a pel da zona'),
  'la pell ferida és un motiu per a consultar amb infermeria': L4('la piel herida es motivo para consultar con enfermería', 'broken skin is a reason to consult a nurse', 'azala zaurituta egotea erizaintzarekin kontsultatzeko arrazoia da', 'a pel ferida é motivo para consultar con enfermaría'),
  'Com era (escala de Bristol)': L4('Cómo era (escala de Bristol)', 'Consistency (Bristol scale)', 'Nolakoa zen (Bristol eskala)', 'Como era (escala de Bristol)'),
  '1 · Boletes dures i separades': L4('1 · Bolitas duras y separadas', '1 · Separate hard lumps', '1 · Pilota gogor eta bereiziak', '1 · Boliñas duras e separadas'),
  '2 · Dura i grumollosa': L4('2 · Dura y grumosa', '2 · Lumpy and firm', '2 · Gogorra eta pikortsua', '2 · Dura e grumosa'),
  '3 · Allargada, amb clivelles': L4('3 · Alargada, con grietas', '3 · Sausage-shaped with cracks', '3 · Luzanga, arrakalekin', '3 · Alongada, con fendas'),
  '4 · Llisa i tova': L4('4 · Lisa y blanda', '4 · Smooth and soft', '4 · Leuna eta biguna', '4 · Lisa e branda'),
  '5 · Trossos tous': L4('5 · Trozos blandos', '5 · Soft blobs', '5 · Zati bigunak', '5 · Anacos brandos'),
  '6 · Pastosa, de vores irregulars': L4('6 · Pastosa, bordes irregulares', '6 · Mushy, ragged edges', '6 · Ore antzekoa, ertz irregularrak', '6 · Pastosa, de bordos irregulares'),
  '7 · Líquida': L4('7 · Líquida', '7 · Entirely liquid', '7 · Likidoa', '7 · Líquida'),
  'la forma de la femta, de l’1 (molt dura) al 7 (líquida)': L4('consistencia de las heces, del 1 (muy dura) al 7 (líquida)', 'stool form from 1 (very hard) to 7 (liquid)', 'gorotzaren forma, 1etik (oso gogorra) 7ra (likidoa)', 'a forma das feces, do 1 (moi dura) ao 7 (líquida)'),
  'el restrenyiment pot fer que estiga més inquiet i que orine pitjor; la femta líquida fa perdre aigua': L4('el estreñimiento puede aumentar la inquietud y dificultar orinar; las heces líquidas restan hidratación', 'constipation can increase restlessness and affect bladder emptying; loose stools cause fluid loss', 'idorreriak urduriago egotea eta pixa okerrago egitea eragin dezake; gorotz likidoak ura galtzea dakar', 'o estrinximento pode facer que estea máis inquieto e ouriñe peor; as feces líquidas fan perder auga'),
  Poca: L4('Poca', 'Small', 'Gutxi', 'Pouca'),
  Molta: L4('Mucha', 'Large', 'Asko', 'Moita'),
  'quanta quantitat, a ull': L4('cantidad aproximada', 'approximate amount', 'zenbateko kopurua, begiz', 'canta cantidade, a ollo'),
  'una quantitat petita i dura acompanya sovint els dies sense fer de ventre': L4('poca cantidad y dura suele acompañar varios días sin evacuar', 'small hard stools often accompany days without a full movement', 'kopuru txiki eta gogorra sabel-hustuketarik gabeko egunekin batera etortzen da sarri', 'pouca cantidade e dura adoita acompañar os días sen facer de ventre'),
  'Amb esforç o dolor': L4('Con esfuerzo o dolor', 'Straining or pain', 'Ahaleginarekin edo minarekin', 'Con esforzo ou dor'),
  'li ha costat o li ha fet mal': L4('le ha costado o le ha dolido', 'straining or discomfort occurred', 'kostatu zaio edo min hartu du', 'custoulle ou fíxolle dano'),
  'és un senyal de restrenyiment': L4('es señal de estreñimiento', 'a common sign of constipation', 'idorreriaren seinalea da', 'é un sinal de estrinximento'),
  'Se li ha escapat': L4('Se le ha escapado', 'Accidental leak', 'Ihes egin dio', 'Escapóuselle'),
  'no ha arribat a temps': L4('no ha llegado a tiempo', 'did not reach the toilet in time', 'ez da garaiz iritsi', 'non chegou a tempo'),
  'el metge ho vol saber': L4('es importante comentarlo al médico', 'helpful for the doctor to know', 'medikuak jakin nahi du', 'o médico quéreo saber'),
  's’hi veu sang': L4('se aprecia sangre', 'visible blood present', 'odola ikusten da', 'vese sangue'),
  'és un motiu per a consultar': L4('es motivo para consultar', 'warrants consulting a clinician', 'kontsultatzeko arrazoia da', 'é motivo para consultar'),
  'Se’n va al llit': L4('Se va a la cama', 'Goes to bed', 'Ohera doa', 'Vai para a cama'),
  'S’adorm': L4('Se duerme', 'Falls asleep', 'Lokartzen da', 'Adormece'),
  'Es desperta de nit': L4('Se despierta de noche', 'Wakes at night', 'Gauez esnatzen da', 'Esperta de noite'),
  'S’alça (comença el dia)': L4('Se levanta (empieza el día)', 'Gets up (starts day)', 'Jaikitzen da (eguna hasten da)', 'Érguese (comeza o día)'),
  'Comença la migdiada': L4('Empieza la siesta', 'Starts nap', 'Siesta hasten du', 'Comeza a sesta'),
  'Acaba la migdiada': L4('Termina la siesta', 'Ends nap', 'Siesta amaitzen du', 'Remata a sesta'),
  'el moment del son que s’apunta': L4('momento del descanso que se anota', 'sleep milestone being logged', 'apuntatzen den loaren unea', 'o momento do sono que se anota'),
  'adormir-se i alçar-se marquen què és la nit per a comptar les vegades que s’alça a orinar': L4('dormirse y levantarse delimitan la noche para contar las veces que orina de noche', 'falling asleep and getting up define night-time bathroom visits', 'lokartzeak eta jaikitzeak gaua mugatzen dute gaueko pixa-egiteak zenbatzeko', 'adormecer e erguerse marcan que é a noite para contar as veces que ouriña de noite'),
  'Per què s’ha despertat': L4('Por qué se ha despertado', 'Reason for waking', 'Zergatik esnatu da', 'Por que espertou'),
  'Per a orinar': L4('Para orinar', 'To pass urine', 'Pixa egiteko', 'Para ouriñar'),
  'Confusió o inquietud': L4('Confusión o inquietud', 'Confusion or restlessness', 'Nahasmena edo urduritasuna', 'Confusión ou inquietude'),
  Soroll: L4('Ruido', 'Noise', 'Zarata', 'Ruído'),
  'el motiu del despertar, si se sap': L4('motivo del despertar, si se conoce', 'apparent reason for waking, if known', 'esnatzearen arrazoia, ezagutzen bada', 'o motivo do espertar, se se sabe'),
  'les nits dolentes solen anar amb dies més inquiets': L4('las malas noches suelen ir seguidas de días más inquietos', 'restless nights often precede harder days', 'gau txarrak egun urduriagoekin lotu ohi dira', 'as noites malas adoitan ir con días máis inquietos'),
  'Nom (com li dieu a casa)': L4('Nombre (como le llamáis en casa)', 'Name (as you call it at home)', 'Izena (etxean esaten diozuen bezala)', 'Nome (como lle chamades na casa)'),
  'el nom que li doneu a casa; val «la pastilla de la pressió»': L4('el nombre cotidiano en casa; vale «la pastilla de la tensión»', 'your household name for it, e.g. “morning blood pressure pill”', 'etxean ematen diozuen izena; «tentsioko pilula» balio du', 'o nome que lle dades na casa; vale «a pastilla da tensión»'),
  'el metge vol veure l’hora de les preses al costat de la resta del dia': L4('permite al médico ver la hora de cada toma junto al resto del día', 'lets the clinician see dose timing alongside daily events', 'medikuak hartualdien ordua eguneko gainerakoarekin batera ikusteko', 'o médico quere ver a hora das tomas xunto co resto do día'),
  Quantitat: L4('Cantidad', 'Amount', 'Kopurua', 'Cantidade'),
  'la quantitat, tal com diu la recepta o la caixa': L4('la cantidad, tal como figura en la receta o en el envase', 'strength or amount as written on the box or prescription', 'kopurua, errezetak edo kaxak dioen bezala', 'a cantidade, tal como di a receita ou a caixa'),
  'per a saber què s’ha pres de veritat': L4('para saber qué se ha tomado realmente', 'records what was actually taken', 'benetan zer hartu den jakiteko', 'para saber que tomou de verdade'),
  Pauta: L4('Pauta', 'Schedule', 'Jarraibidea', 'Pauta'),
  'A hora fixa': L4('A hora fija', 'Scheduled time', 'Ordu finkoan', 'A hora fixa'),
  'Només si cal': L4('Solo si hace falta', 'As needed', 'Behar denean soilik', 'Só se cómpre'),
  'si es pren a hores fixes o només quan cal': L4('si se toma a horas fijas o solo cuando hace falta', 'whether scheduled regularly or taken only as needed', 'ordu finkoetan edo behar denean soilik hartzen den', 'se se toma a horas fixas ou só cando cómpre'),
  'les preses «si cal» diuen quan ha fet falta': L4('las tomas «si hace falta» muestran cuándo fue necesario', 'as-needed doses show when extra support was required', '«behar denean» hartutakoek noiz behar izan den adierazten dute', 'as tomas «se cómpre» indican cando fixo falta'),
  'Què ha passat': L4('Qué ha pasado', 'Outcome', 'Zer gertatu da', 'Que pasou'),
  Presa: L4('Tomada', 'Taken', 'Hartuta', 'Tomada'),
  'No l’ha volguda': L4('No la ha querido', 'Declined', 'Ez du nahi izan', 'Non a quixo'),
  Oblidada: L4('Olvidada', 'Missed', 'Ahaztuta', 'Esquecida'),
  'L’ha tornada': L4('La ha vomitado', 'Brought back up', 'Bota egin du', 'Devolveuna'),
  'si s’ha pres o no': L4('si llegó a tomarse o no', 'whether the dose was taken', 'hartu den ala ez', 'se a tomou ou non'),
  'les preses que falten s’han de parlar amb el metge abans de canviar res': L4('las tomas no realizadas deben comentarse con el médico antes de cambiar nada', 'missed doses should be discussed with a doctor before changing anything', 'hartu gabeko pilulak medikuarekin hitz egin behar dira ezer aldatu aurretik', 'as tomas que faltan débense falar co médico antes de cambiar nada'),
  'Per a què és (ho trieu vosaltres)': L4('Para qué es (lo elegís vosotros)', 'Purpose (chosen by family)', 'Zertarako da (zuek aukeratua)', 'Para que é (escollédelo vós)'),
  'Per a dormir': L4('Para dormir', 'For sleep', 'Lo egiteko', 'Para durmir'),
  'Per a la inquietud': L4('Para la inquietud', 'For restlessness', 'Urduritasunerako', 'Para a inquietude'),
  'Per a fer de ventre': L4('Para ir de vientre', 'For bowel regularity', 'Sabela husteko', 'Para facer de ventre'),
  'Per al dolor': L4('Para el dolor', 'For pain', 'Minerako', 'Para a dor'),
  'una etiqueta que posa la família; l’app no classifica medicaments': L4('etiqueta familiar orientativa; la app no clasifica medicamentos', 'family-chosen label; the app never classifies medicines', 'familiak jartzen duen etiketa; aplikazioak ez ditu botikak sailkatzen', 'unha etiqueta que pon a familia; a app non clasifica medicamentos'),
  'ajuda a llegir el full: una pastilla per a orinar a la vesprada es nota a la nit': L4('ayuda a leer la hoja: un comprimido para orinar por la tarde se nota de noche', 'helps read the chart: an afternoon water tablet affects the night', 'orria irakurtzen laguntzen du: arratsaldeko pilula bat gauez nabaritzen da', 'axuda a ler a folla: unha pastilla para ouriñar á tarde nótase á noite'),
  /* Conducta i grups */
  'Física, amb risc': L4('Física, con riesgo', 'Physical, with safety risk', 'Fisikoa, arriskuarekin', 'Física, con risco'),
  Colpejar: L4('Golpear', 'Hitting', 'Kolpatzea', 'Golpear'),
  Empentar: L4('Empujar', 'Pushing', 'Bultzatzea', 'Empurrar'),
  Esgarrapar: L4('Arañar', 'Scratching', 'Atzamarkatzea', 'Rabunar'),
  Mossegar: L4('Morder', 'Biting', 'Kosk egitea', 'Morder'),
  'Llançar coses': L4('Lanzar objetos', 'Throwing objects', 'Gauzak botatzea', 'Lanzar cousas'),
  'Física, sense risc': L4('Física, sin riesgo', 'Physical, non-hazardous', 'Fisikoa, arriskurik gabe', 'Física, sen risco'),
  'Caminar sense parar': L4('Caminar sin parar', 'Pacing continuously', 'Gelditu gabe ibiltzea', 'Camiñar sen parar'),
  'No parar quiet': L4('No parar quieto', 'Restless fidgeting', 'Geldirik ez egotea', 'Non parar quieto'),
  'Vestir-se o despullar-se fora de lloc': L4('Vestirse o desvestirse a deshora', 'Dressing or undressing out of context', 'Lekuz kanpo janztea edo eranztea', 'Vestirse ou espise fóra de lugar'.replace('espise', 'espirse')),
  'Voler anar-se’n': L4('Querer irse', 'Trying to leave', 'Alde egin nahi izatea', 'Querer marchar'),
  'Tocar o desmuntar coses': L4('Tocar o desmontar cosas', 'Handling or taking things apart', 'Gauzak ukitzea edo desmuntatzea', 'Tocar ou desmontar cousas'),
  'Amagar coses': L4('Esconder cosas', 'Hiding items', 'Gauzak ezkutatzea', 'Agochar cousas'),
  Verbal: L4('Verbal', 'Verbal', 'Hitzezkoa', 'Verbal'),
  Cridar: L4('Gritar', 'Shouting', 'Oihu egitea', 'Berrar'),
  'Demanar o queixar-se sense parar': L4('Pedir o quejarse sin parar', 'Repeated calling or complaining', 'Gelditu gabe eskatzea edo kexatzea', 'Pedir ou queixarse sen parar'),
  'Preguntar el mateix': L4('Preguntar lo mismo', 'Repeating the same question', 'Gauza bera galdetzea', 'Preguntar o mesmo'),
  Insultar: L4('Insultar', 'Swearing or insulting', 'Irain egitea', 'Insultar'),
  'Fer sorolls': L4('Hacer ruidos', 'Making repetitive sounds', 'Zaratak egitea', 'Facer ruídos'),
  Altres: L4('Otros', 'Other', 'Besteak', 'Outros'),
  Plorar: L4('Llorar', 'Crying', 'Negar egitea', 'Chorar'),
  'Por o angoixa': L4('Miedo o angustia', 'Fear or distress', 'Beldurra edo larritasuna', 'Medo ou angustia'),
  'Veure o sentir coses que no hi són (aparentment)': L4('Ver o escuchar cosas que no están (aparentemente)', 'Seeing or hearing things not apparently there', 'Ez dauden gauzak ikustea edo entzutea (itxuraz)', 'Ver ou ouvir cousas que non están (aparentemente)'),
  'Rebutjar la higiene': L4('Rechazar la higiene', 'Refusing personal care', 'Higienea ukatzea', 'Rexeitar a hixiene'),
  'Rebutjar la medicació': L4('Rechazar la medicación', 'Refusing medication', 'Medikazioa ukatzea', 'Rexeitar a medicación'),
  'Rebutjar el menjar': L4('Rechazar la comida', 'Refusing food', 'Janaria ukatzea', 'Rexeitar a comida'),
  'Què ha fet': L4('Qué ha hecho', 'What happened', 'Zer egin du', 'Que fixo'),
  'què ha fet, de manera concreta i que es puga veure o sentir': L4('qué ha hecho, descrito de forma concreta y observable', 'concrete, observable actions', 'zer egin duen, modu zehatz eta ikusgarrian', 'que fixo, de maneira concreta e observable'),
  'descriure bé és el primer pas per a entendre-ho': L4('describir con precisión es el primer paso para comprenderlo', 'clear description is the first step to understanding', 'ongi deskribatzea ulertzeko lehen urratsa da', 'describir ben é o primeiro paso para entendelo'),
  'Com de fort': L4('Intensidad', 'Intensity', 'Zenbateko indarra', 'Intensidade'),
  Lleu: L4('Leve', 'Mild', 'Arina', 'Leve'),
  Moderat: L4('Moderado', 'Moderate', 'Ertaina', 'Moderado'),
  Fort: L4('Fuerte', 'Severe', 'Handia', 'Forte'),
  'com de fort ha sigut': L4('qué intensidad ha tenido', 'how intense the episode was', 'zenbateko indarra izan duen', 'como de forte foi'),
  'per a veure si va a més o a menys': L4('para ver si va a más o a menos', 'tracks whether episodes are easing or intensifying', 'gora ala behera doan ikusteko', 'para ver se vai a máis ou a menos'),
  'Quant ha durat (minuts)': L4('Cuánto ha durado (minutos)', 'Duration (minutes)', 'Zenbat iraun du (minutuak)', 'Canto durou (minutos)'),
  'els minuts que ha durat, més o menys': L4('los minutos aproximados que ha durado', 'approximate duration in minutes', 'zenbat minutu iraun duen, gutxi gorabehera', 'os minutos aproximados que durou'),
  'Què passava abans': L4('Qué ocurría antes', 'What was happening beforehand', 'Zer gertatzen zen aurretik', 'Que pasaba antes'),
  'Ganes d’orinar o de fer de ventre': L4('Ganas de orinar o de ir de vientre', 'Need for toilet', 'Pixa egiteko edo sabela husteko gogoa', 'Ganas de ouriñar ou facer de ventre'),
  'Absorbent mullat': L4('Absorbente mojado', 'Wet pad', 'Xurgatzaile bustia', 'Absorbente mollado'),
  'Dolor aparent': L4('Dolor aparente', 'Apparent pain', 'Itxurazko mina', 'Dor aparente'),
  'Set o fam': L4('Sed o hambre', 'Thirst or hunger', 'Egarria edo gosea', 'Sede ou fame'),
  'Fred o calor': L4('Frío o calor', 'Cold or heat', 'Hotza edo beroa', 'Frío ou calor'),
  'Cansament o son': L4('Cansancio o sueño', 'Tiredness or sleepiness', 'Nekea edo logura', 'Cansazo ou sono'),
  'Soroll o molta gent': L4('Ruido o mucha gente', 'Noise or crowding', 'Zarata edo jende asko', 'Ruído ou moita xente'),
  'Canvi de rutina o de lloc': L4('Cambio de rutina o de lugar', 'Change in routine or surroundings', 'Errutina edo leku aldaketa', 'Cambio de rutina ou de lugar'),
  'El moment de la higiene': L4('El momento de la higiene', 'Personal care routine', 'Higienearen unea', 'O momento da hixiene'),
  'Una visita': L4('Una visita', 'Visitors', 'Bisita bat', 'Unha visita'),
  'La vesprada o la foscor': L4('La tarde o el anochecer', 'Late afternoon or dusk', 'Iluntzea edo iluntasuna', 'A tardiña ou a escuridade'),
  'Després d’una medicació': L4('Después de una medicación', 'After medication', 'Medikazio baten ondoren', 'Despois dunha medicación'),
  'què passava just abans': L4('qué ocurría justo antes', 'what was happening right beforehand', 'aurretik zer gertatzen zen', 'que pasaba xusto antes'),
  'moltes vegades la inquietud ve d’una necessitat que no s’ha cobert': L4('a menudo la inquietud nace de una necesidad física no cubierta', 'restlessness often stems from an unmet comfort need', 'askotan urduritasuna bete gabeko behar batetik dator', 'moitas veces a inquietude vén dunha necesidade sen cubrir'),
  'Una altra cosa que passava': L4('Otra cosa que ocurría', 'Other context beforehand', 'Gertatzen zen beste zerbait', 'Outra cousa que pasaba'),
  'el que passava abans, si no és a la llista': L4('lo que pasaba antes, si no figura en la lista', 'anything else happening beforehand', 'aurretik gertatzen zena, zerrendan ez badago', 'o que pasaba antes, se non está na lista'),
  'per a no perdre cap pista': L4('para no perder ninguna pista útil', 'keeps useful clues for the care team', 'inolako pistarik ez galtzeko', 'para non perder ningunha pista'),
  'Què hem fet': L4('Qué hemos hecho', 'How we responded', 'Zer egin dugu', 'Que fixemos'),
  'Acompanyar-lo al vàter': L4('Acompañarle al baño', 'Guided to the toilet', 'Komunera lagundu', 'Acompañalo ao váter'),
  'Canviar l’absorbent': L4('Cambiar el absorbente', 'Changed pad', 'Xurgatzailea aldatu', 'Cambiar o absorbente'),
  'Oferir beguda o menjar': L4('Ofrecer bebida o comida', 'Offered drink or snack', 'Edaria edo janaria eskaini', 'Ofrecer bebida ou comida'),
  'Calmar-lo parlant': L4('Calmarle hablando con suavidad', 'Reassured calmly', 'Hitz eginez lasaitu', 'Calmalo falando'),
  'Distraure o fer una activitat': L4('Distraer o proponer una actividad', 'Gentle distraction or activity', 'Arreta desbideratu edo jarduera bat egin', 'Distraer ou facer unha actividade'),
  'Deixar-li espai': L4('Dejarle espacio tranquilo', 'Gave quiet space', 'Bere espazioa utzi', 'Deixarlle espazo'),
  'Medicació «si cal»': L4('Medicación «si hace falta»', 'As-needed medication', '«Behar denean» medikazioa', 'Medicación «se cómpre»'),
  'Una altra cosa': L4('Otra cosa', 'Something else', 'Beste zerbait', 'Outra cousa'),
  'què hem fet per a ajudar': L4('qué hemos hecho para ayudar', 'steps taken to help settle', 'laguntzeko zer egin dugun', 'que fixemos para axudar'),
  'per a saber què funciona': L4('para descubrir qué medidas ayudan más', 'highlights what helps most', 'zerk funtzionatzen duen jakiteko', 'para saber que funciona'),
  'Com ha acabat': L4('Cómo ha terminado', 'Outcome', 'Nola amaitu da', 'Como rematou'),
  'Es calma prompte': L4('Se calma pronto', 'Calmed quickly', 'Laster lasaitu da', 'Cálmase axiña'),
  'Es calma a poc a poc': L4('Se calma poco a poco', 'Calmed gradually', 'Pixkanaka lasaitu da', 'Cálmase pouco a pouco'),
  'No es calma': L4('No se calma', 'Did not settle', 'Ez da lasaitu', 'Non se calma'),
  'Va a pitjor': L4('Va a peor', 'Escalated', 'Okerrera egin du', 'Vai a peor'),
  'com ha acabat': L4('cómo terminó el episodio', 'how the episode resolved', 'nola amaitu den', 'como rematou'),
  'per a saber quina manera d’ajudar funciona millor': L4('para identificar qué forma de acompañar funciona mejor', 'shows which soothing approaches work best', 'zein laguntza-moduk funtzionatzen duen hobeto jakiteko', 'para saber que xeito de axudar funciona mellor'),
  'Hi ha hagut perill': L4('Ha habido peligro', 'Safety risk', 'Arriskurik egon da', 'Houbo perigo'),
  'Una caiguda': L4('Una caída', 'A fall', 'Eroriko bat', 'Unha caída'),
  'Una ferida': L4('Una herida', 'An injury', 'Zauri bat', 'Unha ferida'),
  'Perill per a altres': L4('Peligro para otros', 'Risk to others', 'Besteentzako arriskua', 'Perigo para outros'),
  'si hi ha hagut perill per a ell o per a altres': L4('si hubo riesgo físico para la persona o para otros', 'any safety risk to themselves or others', 'beretzat edo besteentzat arriskurik egon den', 'se houbo perigo para a persoa ou para outros'),
  'si hi ha perill, cal ajuda: el 112 ara mateix o l’equip que el porta': L4('si hay peligro, pide ayuda: el 112 ahora mismo o su equipo sanitario', 'if unsafe, seek help: 112 immediately or your care team', 'arriskua badago, laguntza behar da: 112 orain bertan edo osasun-taldea', 'se hai perigo, cómpre axuda: o 112 agora mesmo ou o equipo que o leva'),
  Temperatura: L4('Temperatura', 'Temperature', 'Tenperatura', 'Temperatura'),
  'Menja poc': L4('Come poco', 'Low appetite', 'Gutxi jaten du', 'Come pouco'),
  'Està diferent de sempre, de colp': L4('Está distinto de lo habitual, de repente', 'Sudden change from usual self', 'Betikoaz bestela dago, bat-batean', 'Está diferente de sempre, de súpeto'),
  'què s’ha observat': L4('qué se ha observado', 'what was noticed', 'zer ikusi den', 'que se observou'),
  'un canvi de colp pot tindre una causa física que cal mirar': L4('un cambio brusco puede deberse a una causa física que conviene revisar', 'sudden changes often have a physical cause worth checking', 'bat-bateko aldaketa batek begiratu beharreko arrazoi fisiko bat izan dezake', 'un cambio brusco pode ter unha causa física que cómpre mirar'),
  'Temperatura (°C)': L4('Temperatura (°C)', 'Temperature (°C)', 'Tenperatura (°C)', 'Temperatura (°C)'),
  'la temperatura, amb un decimal (37,8)': L4('temperatura con un decimal (37,8)', 'body temperature to one decimal place (37.8)', 'tenperatura, hamartar batekin (37,8)', 'a temperatura, cun decimal (37,8)'),
  'en persones grans, una temperatura no gaire alta ja pot ser important': L4('en personas mayores, una subida moderada de temperatura ya puede ser relevante', 'in older adults, even a modest temperature rise matters', 'adineko pertsonengan, tenperatura igoera txiki bat ere garrantzitsua izan daiteke', 'en persoas maiores, unha temperatura non moi alta xa pode ser importante'),
  /* Persona, jornada, mètriques i derivats */
  'Com li dieu': L4('Cómo le llamáis', 'Nickname or alias', 'Nola deitzen diozue', 'Como lle chamades'),
  'un àlies; no cal el nom': L4('un alias familiar; no hace falta el nombre real', 'a household nickname; real name not needed', 'ezizen bat; ez da benetako izena behar', 'un alcume; non cómpre o nome real'),
  'només es veu ací; el fitxer exportat no el porta si no ho demaneu': L4('solo se ve aquí; el archivo exportado no lo incluye salvo que lo indiques', 'shown on this device only; omitted from exports unless requested', 'hemen soilik ikusten da; esportatutako fitxategiak ez darama eskatu ezean', 'só se ve aquí; o ficheiro exportado non o leva se non o pides'),
  'Té més de 65 anys': L4('Tiene más de 65 años', 'Aged 65 or over', '65 urte baino gehiago ditu', 'Ten máis de 65 anos'),
  'si té més de 65 anys': L4('si supera los 65 años', 'whether aged 65 or older', '65 urtetik gorakoa den', 'se ten máis de 65 anos'),
  'canvia la referència de la part de l’orina feta de nit': L4('ajusta el umbral orientativo del porcentaje de orina nocturna', 'adjusts the reference threshold for night-time urine share', 'gauez egindako gernu-zatiaren erreferentzia aldatzen du', 'cambia a referencia da parte dos ouriños feita de noite'),
  'Pes (kg)': L4('Peso (kg)', 'Weight (kg)', 'Pisua (kg)', 'Peso (kg)'),
  'el pes, si se sap': L4('peso corporal aproximado, si se conoce', 'body weight if known', 'pisua, ezagutzen bada', 'o peso, se se sabe'),
  'permet comparar l’orina d’un dia amb el pes': L4('permite relacionar el volumen diario de orina con el peso', 'allows comparing 24 h urine volume with body weight', 'egun bateko gernua pisuarekin alderatzeko aukera ematen du', 'permite comparar os ouriños dun día co peso'),
  'Límit de líquids que ha dit el metge (ml al dia)': L4('Límite diario de líquidos pautado por el médico (ml)', 'Doctor-advised daily fluid limit (ml)', 'Medikuak esandako likido-muga (ml egunean)', 'Límite de líquidos indicado polo médico (ml ao día)'),
  'només si el metge ha pautat un límit': L4('solo si el médico ha indicado restringir líquidos', 'fill only if a clinician prescribed a fluid limit', 'medikuak muga bat ezarri badu soilik', 'só se o médico indicou un límite'),
  'si n’hi ha, l’app no avisa de beure poc': L4('cuando existe límite médico, se desactivan los avisos por beber poco', 'suppresses low-intake notices when a medical fluid limit applies', 'halakorik badago, aplikazioak ez du gutxi edateaz ohartarazten', 'se o hai, a app non avisa por beber pouco'),
  'Fa servir absorbent': L4('Usa absorbente', 'Uses absorbent pads', 'Xurgatzailea erabiltzen du', 'Usa absorbente'),
  'si porta absorbent': L4('si utiliza absorbente habitualmente', 'whether absorbent pads are used', 'xurgatzailerik daraman', 'se leva absorbente'),
  'per a apuntar els canvis': L4('para registrar los cambios de absorbente', 'for tracking pad changes', 'aldaketak apuntatzeko', 'para anotar os cambios'),
  'Pes de l’absorbent sec (g)': L4('Peso del absorbente seco (g)', 'Dry pad weight (g)', 'Xurgatzaile lehorraren pisua (g)', 'Peso do absorbente seco (g)'),
  'el pes d’un absorbent sense usar': L4('peso de un absorbente limpio sin usar', 'weight of an unused dry pad', 'erabili gabeko xurgatzaile baten pisua', 'o peso dun absorbente sen usar'),
  'per a calcular, a partir del pes, quant s’ha escapat': L4('permite estimar la cantidad escapada restando el peso seco', 'used to estimate leaked volume from pad weight', 'pisutik abiatuta zenbat ihes egin duen kalkulatzeko', 'para calcular, a partir do peso, canto escapou'),
  'Hora d’alçar-se habitual': L4('Hora habitual de levantarse', 'Usual wake-up time', 'Jaikitzeko ohiko ordua', 'Hora habitual de erguerse'),
  'a quina hora s’alça normalment': L4('a qué hora suele levantarse', 'typical morning wake-up time', 'normalean zein ordutan jaikitzen den', 'a que hora se ergue normalmente'),
  'si no s’apunta, marca on comença el dia': L4('marca el inicio del día cuando no se anota el despertar', 'fallback start of day when morning wake-up is not logged', 'apuntatzen ez bada, eguna non hasten den markatzen du', 'se non se anota, marca onde comeza o día'),
  'Hora de gitar-se habitual': L4('Hora habitual de acostarse', 'Usual bedtime', 'Oheratzeko ohiko ordua', 'Hora habitual de deitarse'),
  'a quina hora es gita normalment': L4('a qué hora suele acostarse', 'typical evening bedtime', 'normalean zein ordutan oheratzen den', 'a que hora se deita normalmente'),
  'si no s’apunta, marca on comença la nit': L4('marca el inicio de la noche cuando no se anota al acostarse', 'fallback start of night when bedtime is not logged', 'apuntatzen ez bada, gaua non hasten den markatzen du', 'se non se anota, marca onde comeza a noite'),
  'Temperatura habitual (°C)': L4('Temperatura habitual (°C)', 'Usual baseline temperature (°C)', 'Ohiko tenperatura (°C)', 'Temperatura habitual (°C)'),
  'la temperatura que té normalment': L4('su temperatura basal habitual', 'their normal baseline temperature', 'normalean izaten duen tenperatura', 'a temperatura que ten normalmente'),
  'una pujada d’un grau sobre la seua habitual ja és un avís': L4('subir más de un grado respecto a su basal ya merece consulta', 'a rise of over 1 °C above baseline warrants attention', 'bere ohikotik gradu bat igotzea dagoeneko abisu bat da', 'unha suba dun grao sobre a súa habitual xa é un aviso'),
  Jornada: L4('Jornada', 'Day', 'Eguna', 'Xornada'),
  'el dia que comença quan s’alça; la nit és de la jornada d’abans d’alçar-se': L4('el día empieza al levantarse; la noche pertenece a la jornada previa', 'starts at morning wake-up; overnight events belong to that day', 'jaikitzean hasten den eguna; gaua jaiki aurreko egunekoa da', 'o día que comeza cando se ergue; a noite pertence á xornada anterior'),
  'agrupa la nit amb el dia que la precedix': L4('agrupa cada noche con el día anterior', 'pairs each night with the preceding daytime', 'gaua aurreko egunarekin elkartzen du', 'agrupa a noite co día anterior'),
  'He apuntat tot el dia': L4('He anotado todo el día', 'I logged the whole day', 'Egun osoa apuntatu dut', 'Anotei todo o día'),
  'la família diu que no s’ha deixat res': L4('confirma que el registro de esa jornada está completo', 'confirms all events for that 24 h cycle were recorded', 'familiak dio ez duela ezer utzi apuntatu gabe', 'a familia confirma que non quedou nada sen anotar'),
  'sense això no es calcula cap mitjana ni cap índex': L4('sin marcarlo no se calculan medias ni proporciones', 'averages and ratios are only computed on complete days', 'hori gabe ez da batezbestekorik ez indizerik kalkulatzen', 'sen isto non se calcula ningunha media nin proporción'),
  'Notes del dia': L4('Notas del día', 'Daily notes', 'Eguneko oharrak', 'Notas do día'),
  'el que va passar eixe dia': L4('contexto general de esa jornada', 'general notes about that day', 'egun horretan gertatutakoa', 'o que pasou ese día'),
  'context per a llegir el full': L4('contexto útil al revisar la hoja', 'helpful context when reading the sheet', 'orria irakurtzeko testuingurua', 'contexto para ler a folla'),
  'Vegades de dia': L4('Veces de día', 'Daytime visits', 'Eguneko aldiak', 'Veces de día'),
  'miccions de quan s’alça fins que s’adorm, la primera i l’última incloses': L4('micciones desde que se levanta hasta que se duerme, ambas incluidas', 'bathroom visits from waking up until falling asleep, inclusive', 'jaikitzen denetik lokartu arteko pixa-egiteak, lehena eta azkena barne', 'miccións dende que se ergue ata que adormece, ambas incluídas'),
  'diu cada quant orina': L4('muestra la frecuencia diurna', 'shows daytime bathroom frequency', 'zenbatetik behin pixa egiten duen adierazten du', 'indica cada canto ouriña'),
  'Vegades de nit': L4('Veces de noche', 'Night-time visits', 'Gaueko aldiak', 'Veces de noite'),
  'miccions entre adormir-se i alçar-se, sense la primera del matí': L4('micciones entre dormirse y levantarse, sin contar la primera de la mañana', 'visits between falling asleep and waking up, excluding first morning void', 'lokartu eta jaiki arteko pixa-egiteak, goizeko lehena gabe', 'miccións entre adormecer e erguerse, sen a primeira da mañá'),
  'cada vegada que s’alça de nit hi ha risc de caure': L4('levantarse varias veces de noche aumenta el riesgo de caídas', 'getting up at night increases fall risk', 'gauez jaikitzen den bakoitzean erortzeko arriskua dago', 'cada vez que se ergue de noite hai risco de caer'),
  'Orina en 24 h (ml)': L4('Orina en 24 h (ml)', '24 h urine volume (ml)', '24 orduko gernua (ml)', 'Ouriños en 24 h (ml)'),
  'des de després de la primera micció del matí fins a la primera de l’endemà, inclosa': L4('desde después de la primera micción matinal hasta incluir la primera del día siguiente', 'from after the first morning visit through the next morning’s first visit inclusive', 'goizeko lehen pixa-egitearen ondotik biharamuneko lehena barne hartu arte', 'dende despois da primeira micción da mañá ata a primeira do día seguinte incluída'),
  'el total d’un dia sencer': L4('volumen total de un ciclo de 24 horas', 'total output over a full 24-hour cycle', 'egun oso bateko guztizkoa', 'o total dun día enteiro'),
  'Orina de nit (ml)': L4('Orina de noche (ml)', 'Night urine volume (ml)', 'Gaueko gernua (ml)', 'Ouriños de noite (ml)'),
  'les miccions de la nit més la primera del matí següent': L4('las micciones nocturnas más la primera de la mañana siguiente', 'night visits plus the first visit of the following morning', 'gaueko pixa-egiteak gehi biharamun goizeko lehena', 'as miccións da noite máis a primeira da mañá seguinte'),
  'compara la nit amb el dia': L4('compara la producción nocturna con la diurna', 'compares overnight production with daytime', 'gaua egunarekin alderatzen du', 'compara a noite co día'),
  'Part de l’orina feta de nit (NPi, %)': L4('Proporción nocturna de orina (NPi, %)', 'Night-time urine share (NPi, %)', 'Gauez egindako gernuaren zatia (NPi, %)', 'Parte dos ouriños feita de noite (NPi, %)'),
  'l’orina de nit dividida per la de 24 hores; com a referència, més del 33 % en persones grans (20 % en joves)': L4('orina nocturna dividida entre la de 24 h; referencia orientativa > 33 % en mayores (20 % en jóvenes)', 'night volume divided by 24 h volume; reference > 33% in older adults (20% in younger)', 'gaueko gernua zati 24 ordukoa; erreferentzia gisa, % 33 baino gehiago adinekoengan (% 20 gazteengan)', 'ouriños da noite divididos polos de 24 h; referencia > 33 % en maiores (20 % en novos)'),
  'diu si la nit pesa més del que tocaria': L4('indica si se concentra demasiada orina durante la noche', 'indicates whether overnight output is disproportionately high', 'gauak dagokiona baino pisu handiagoa duen esaten du', 'indica se a noite pesa máis do habitual'),
  'Índex de nit (Ni)': L4('Índice nocturno (Ni)', 'Night index (Ni)', 'Gaueko indizea (Ni)', 'Índice de noite (Ni)'),
  'l’orina de nit dividida per la micció més gran; si passa d’1,5, la nit no cap a la bufeta': L4('orina nocturna dividida por la micción máxima; por encima de 1,5 supera la capacidad habitual', 'night volume divided by largest single void; above 1.5 exceeds typical bladder capacity', 'gaueko gernua zati pixa-egiterik handiena; 1,5etik gora maskurian ez da sartzen', 'ouriños da noite divididos pola micción máis grande; se pasa de 1,5 non colle na vexiga'),
  'ajuda el metge a llegir les nits': L4('orienta al médico al valorar los despertares nocturnos', 'helps clinicians interpret night-time waking', 'medikuari gauak irakurtzen laguntzen dio', 'axuda o médico a interpretar as noites'),
  'Micció més gran (ml)': L4('Micción máxima (ml)', 'Largest single visit (ml)', 'Pixa-egiterik handiena (ml)', 'Micción máis grande (ml)'),
  'la micció mesurada més gran': L4('el mayor volumen medido de una sola vez', 'largest single measured volume', 'neurtutako pixa-egiterik handiena', 'a micción medida máis grande'),
  'dona una idea de quant aguanta la bufeta': L4('orienta sobre la capacidad funcional de la vejiga', 'estimates functional bladder capacity', 'maskuriak zenbat eusten duen erakusten du', 'dá unha idea de canto aguanta a vexiga'),
  'Micció mitjana (ml)': L4('Micción media (ml)', 'Average visit volume (ml)', 'Batez besteko pixa-egitea (ml)', 'Micción media (ml)'),
  'la mitjana de les miccions mesurades': L4('promedio de las micciones medidas', 'mean volume across measured visits', 'neurtutako pixa-egiteen batezbestekoa', 'a media das miccións medidas'),
  'una mitjana baixa amb moltes vegades és un patró conegut': L4('volúmenes pequeños y muy frecuentes forman un patrón útil para el médico', 'frequent small voids are a helpful pattern for clinicians', 'batezbesteko txikia aldi askorekin eredu ezaguna da', 'unha media baixa con moitas veces é un patrón coñecido'),
  'Begut (ml)': L4('Bebido (ml)', 'Fluids taken (ml)', 'Edandakoa (ml)', 'Bebido (ml)'),
  'tot el que ha begut (sense les begudes rebutjades)': L4('total bebido (excluyendo bebidas rechazadas)', 'total fluids consumed (excluding declined drinks)', 'edan duen guztia (ukatutako edariak gabe)', 'todo o que bebeu (sen as bebidas rexeitadas)'),
  Cobertura: L4('Cobertura', 'Coverage', 'Estaldura', 'Cobertura'),
  'les miccions mesurades sobre totes les miccions del dia': L4('proporción de micciones con volumen medido sobre el total del día', 'share of visits with measured volume out of all visits that day', 'neurtutako pixa-egiteak eguneko guztien gainean', 'as miccións medidas sobre todas as do día'),
  'si no és del 100 %, no es calcula cap volum ni cap índex': L4('si no alcanza el 100 %, no se calculan totales ni índices de volumen', 'unless 100%, 24 h volumes and ratios are left blank', '% 100 ez bada, ez da bolumenik ez indizerik kalkulatzen', 'se non é do 100 %, non se calcula ningún volume nin índice'),
  'Dia o nit': L4('Día o noche', 'Day or night', 'Eguna edo gaua', 'Día ou noite'),
  'nit és entre adormir-se i alçar-se; si no s’ha apuntat, es fan servir les hores habituals. «Matí següent» és la primera micció de l’endemà de l’últim dia, que tanca la nit': L4('noche va desde dormirse hasta levantarse (o el horario habitual). «Mañana siguiente» es la primera micción tras el último día', 'night spans sleep to wake-up (or usual hours). “Next morning” marks the closing void after the final day', 'gaua lokartu eta jaiki artekoa da (edo ohiko orduak). «Biharamun goiza» azken egunaren ondoko lehen pixa-egitea da', 'noite vai dende adormecer ata erguerse (ou as horas habituais). «Mañá seguinte» é a primeira micción tras o último día'),
  'separa les miccions de nit': L4('distingue los registros nocturnos', 'separates night-time events', 'gaueko pixa-egiteak bereizten ditu', 'separa as miccións da noite'),
  Hora: L4('Hora', 'Time', 'Ordua', 'Hora'),
  'l’hora del rellotge de casa': L4('hora local del reloj de casa', 'local household clock time', 'etxeko erlojuaren ordua', 'a hora do reloxo da casa'),
  'ordena el dia': L4('ordena cronológicamente la jornada', 'orders events chronologically', 'eguna ordenatzen du', 'ordena o día'),
});

const tr = (text, codi) => (codi === 'ca' || !text ? text : CADENES_DICCIONARI[text]?.[codi] || text);

function valorsTraduits(valors, codi) {
  if (!valors || codi === 'ca') return valors;
  return Object.freeze(valors.map((o) => Object.freeze({ ...o, etiqueta: tr(o.etiqueta, codi) })));
}

export function campSalutTraduit(c, idioma = 'ca') {
  const codi = codiDe(idioma);
  if (!c || codi === 'ca') return c;
  return Object.freeze({
    ...c,
    etiqueta: tr(c.etiqueta, codi),
    definicio: tr(c.definicio, codi),
    perQueImporta: tr(c.perQueImporta, codi),
    ...(c.valors ? { valors: valorsTraduits(c.valors, codi) } : {}),
    ...(c.grups ? {
      grups: Object.freeze(c.grups.map((g) => Object.freeze({
        ...g,
        etiqueta: tr(g.etiqueta, codi),
        valors: valorsTraduits(g.valors, codi),
      }))),
    } : {}),
    ...(c.avisa ? { avisa: Object.freeze({ ...c.avisa, text: tr(c.avisa.text, codi) }) } : {}),
  });
}

export function tipusSalutTraduit(tipusObj, idioma = 'ca') {
  const codi = codiDe(idioma);
  if (!tipusObj || codi === 'ca') return tipusObj;
  const info = ENTITATS_TR[tipusObj.id];
  return Object.freeze({
    ...tipusObj,
    nom: info?.nom?.[codi] || tipusObj.nom,
    boto: info?.boto?.[codi] || tipusObj.boto,
    definicio: info?.definicio?.[codi] || tipusObj.definicio,
    camps: Object.freeze(tipusObj.camps.map((c) => campSalutTraduit(c, codi))),
  });
}

export function entitatsSalutTraduites(idioma = 'ca') {
  const codi = codiDe(idioma);
  if (codi === 'ca') return ENTITATS;
  return Object.freeze(ENTITATS.map((entitat) => {
    const info = ENTITATS_TR[entitat.id];
    return Object.freeze({
      ...entitat,
      nom: info?.nom?.[codi] || entitat.nom,
      definicio: info?.definicio?.[codi] || entitat.definicio,
      camps: Object.freeze(entitat.camps.map((c) => campSalutTraduit(c, codi))),
    });
  }));
}

export function metriquesSalutTraduites(idioma = 'ca') {
  const codi = codiDe(idioma);
  if (codi === 'ca') return METRIQUES;
  return Object.freeze(METRIQUES.map((m) => campSalutTraduit(m, codi)));
}

export function textValorsAdmesosSalut(camp, idioma = 'ca') {
  const codi = codiDe(idioma);
  if (codi === 'ca') return textValorsAdmesos(camp);
  const opcions = opcionsDe(camp);
  if (opcions.length) return opcions.map((o) => tr(o.etiqueta, codi)).join('; ');
  if (camp.tipus === 'decimes') return `${textDecimes(camp.min)}–${textDecimes(camp.max)}`;
  if (Number.isFinite(camp.min)) return `${camp.min}–${camp.max}`;
  if (camp.maxLlargada) {
    const sufix = {
      es: `hasta ${camp.maxLlargada} caracteres`,
      en: `up to ${camp.maxLlargada} characters`,
      eu: `gehienez ${camp.maxLlargada} karaktere`,
      gl: `ata ${camp.maxLlargada} caracteres`,
    }[codi];
    return sufix;
  }
  return '';
}

export function etiquetaValorSalut(tipusId, clauCamp, valor, idioma = 'ca') {
  const codi = codiDe(idioma);
  const base = etiquetaValor(campDe(tipusId, clauCamp), valor);
  return codi === 'ca' ? base : tr(base, codi);
}

/* ── Resum d'una línia i cobertura ──────────────────────────────────────── */

const RESUM_EXTRA = Object.freeze({
  es: Object.freeze({ ull: ' a ojo', senseMesurar: 'sin medir', ganes: 'ganas', rebutjada: 'no la ha querido', tipus: 'tipo' }),
  en: Object.freeze({ ull: ' est.', senseMesurar: 'unmeasured', ganes: 'urge', rebutjada: 'declined', tipus: 'type' }),
  eu: Object.freeze({ ull: ' begiz', senseMesurar: 'neurtu gabe', ganes: 'gogoa', rebutjada: 'ukatuta', tipus: 'mota' }),
  gl: Object.freeze({ ull: ' a ollo', senseMesurar: 'sen medir', ganes: 'ganas', rebutjada: 'non a quixo', tipus: 'tipo' }),
});

export function resumApuntSalut(apunt, idioma = 'ca') {
  const codi = codiDe(idioma);
  if (codi === 'ca') return resumApunt(apunt);
  const definicio = tipusDe(apunt?.tipus);
  if (!definicio) return '';
  const extra = RESUM_EXTRA[codi];
  const e = (clau) => etiquetaValorSalut(apunt.tipus, clau, apunt[clau], codi);
  const parts = [ENTITATS_TR[apunt.tipus]?.boto?.[codi] || definicio.boto];
  switch (apunt.tipus) {
    case 'miccio':
      parts.push(apunt.volumMl !== undefined ? `${apunt.volumMl} ml${apunt.mesura === 'estimat' ? extra.ull : ''}` : extra.senseMesurar);
      if (apunt.urgencia !== undefined) parts.push(`${extra.ganes} ${apunt.urgencia}`);
      break;
    case 'ingesta':
      parts.push(`${e('beguda').toLowerCase()} ${apunt.volumMl} ml`);
      if (apunt.rebutjada) parts.push(extra.rebutjada);
      break;
    case 'escapament': parts.push(e('quantitat').toLowerCase()); break;
    case 'absorbent': parts.push(e('estat').toLowerCase()); break;
    case 'deposicio': parts.push(`${extra.tipus} ${apunt.bristol}`); break;
    case 'son': parts.push(e('event').toLowerCase()); break;
    case 'medicacio': parts.push(apunt.nom, e('estat').toLowerCase()); break;
    case 'conducta': parts.push(e('intensitat').toLowerCase(), ...(apunt.duradaMin ? [`${apunt.duradaMin} min`] : [])); break;
    case 'observacio':
      parts.push(apunt.que === 'temperatura' && apunt.temperaturaDecimes !== undefined ? `${textDecimes(apunt.temperaturaDecimes)} °C` : e('que').toLowerCase());
      break;
    default: break;
  }
  return parts.filter(Boolean).join(' · ');
}

export function textCoberturaSalut(metriques, idioma = 'ca') {
  const codi = codiDe(idioma);
  if (codi === 'ca') return textCobertura(metriques);
  if (metriques.cobertura === null) return '—';
  if (metriques.cobertura === 100) return '100 %';
  if (codi === 'en') return `partial (${metriques.cobertura}%)`;
  if (codi === 'eu') return `partziala (% ${metriques.cobertura})`;
  return `parcial (${metriques.cobertura} %)`;
}

const MOTIUS_VOLUMS_TR = Object.freeze({
  'no-completa': L4(
    'La jornada no está marcada como completa.',
    'This day is not marked as complete.',
    'Eguna ez dago osotzat markatuta.',
    'A xornada non está marcada como completa.'
  ),
  'sense-miccions': L4(
    'No hay ninguna micción anotada.',
    'No bathroom visits logged.',
    'Ez dago pixa-egiterik apuntatuta.',
    'Non hai ningunha micción anotada.'
  ),
  cobertura: L4(
    'Hay micciones sin medir.',
    'Some visits were not measured.',
    'Neurtu gabeko pixa-egiteak daude.',
    'Hai miccións sen medir.'
  ),
  'sense-mati-seguent': L4(
    'Falta la primera micción de la mañana siguiente, medida.',
    'Missing the measured first morning visit of the next day.',
    'Biharamun goizeko lehen pixa-egite neurtua falta da.',
    'Falta a primeira micción da mañá seguinte, medida.'
  ),
});

export function motiuSenseVolumsSalut(motiu, idioma = 'ca') {
  const codi = codiDe(idioma);
  if (codi === 'ca') return MOTIUS_SENSE_VOLUMS[motiu] || '';
  return MOTIUS_VOLUMS_TR[motiu]?.[codi] || MOTIUS_SENSE_VOLUMS[motiu] || '';
}

/* ── Validació de formularis traduïda quan idioma !== 'ca' ──────────────── */

const PLANTILLES_VALIDACIO = Object.freeze({
  es: Object.freeze({
    falta: (e) => `Falta «${e}».`,
    sencer: (e) => `«${e}» debe ser un número entero.`,
    rang: (e, min, max) => `«${e}» debe estar entre ${min} y ${max}.`,
    opcio: (e) => `Elige una opción de «${e}».`,
    moment: 'Falta el día y la hora, o no son válidos.',
    volumBlanc: 'Si no se ha medido, deja el volumen vacío o marca «Medido».',
    escriuVolum: 'Escribe el volumen o marca «No se ha medido».',
    invalid: 'Este dato no es válido.',
  }),
  en: Object.freeze({
    falta: (e) => `“${e}” is required.`,
    sencer: (e) => `“${e}” must be a whole number.`,
    rang: (e, min, max) => `“${e}” must be between ${min} and ${max}.`,
    opcio: (e) => `Choose an option for “${e}”.`,
    moment: 'Date and time are missing or invalid.',
    volumBlanc: 'If unmeasured, leave volume blank or select “Measured”.',
    escriuVolum: 'Enter the volume or select “Not measured”.',
    invalid: 'Invalid value.',
  }),
  eu: Object.freeze({
    falta: (e) => `«${e}» falta da.`,
    sencer: (e) => `«${e}» zenbaki oso bat izan behar da.`,
    rang: (e, min, max) => `«${e}» ${min} eta ${max} artean egon behar da.`,
    opcio: (e) => `Aukeratu «${e}» eremuko aukera bat.`,
    moment: 'Eguna eta ordua falta dira, edo ez dira baliozkoak.',
    volumBlanc: 'Neurtu ez bada, utzi bolumena hutsik edo markatu «Neurtuta».',
    escriuVolum: 'Idatzi bolumena edo markatu «Ez da neurtu».',
    invalid: 'Datu hau ez da baliozkoa.',
  }),
  gl: Object.freeze({
    falta: (e) => `Falta «${e}».`,
    sencer: (e) => `«${e}» ten que ser un número enteiro.`,
    rang: (e, min, max) => `«${e}» ten que estar entre ${min} e ${max}.`,
    opcio: (e) => `Escolle unha opción de «${e}».`,
    moment: 'Falta o día e a hora, ou non son válidos.',
    volumBlanc: 'Se non se mediu, pon o volume baleiro ou escolle «Medido».',
    escriuVolum: 'Escribe o volume ou escolle «Non se mediu».',
    invalid: 'Este dato non é válido.',
  }),
});

function tradueixErrorCamp( missatgeCa, camp, codi ) {
  const p = PLANTILLES_VALIDACIO[codi];
  if (!p || !missatgeCa) return missatgeCa;
  if (missatgeCa === 'Si no s’ha mesurat, deixa el volum en blanc o tria «Mesurat».') return p.volumBlanc;
  if (missatgeCa === 'Escriu el volum o tria «No s’ha mesurat».') return p.escriuVolum;
  if (missatgeCa.startsWith('Falta el dia')) return p.moment;
  const etiqueta = camp ? tr(camp.etiqueta, codi) : '';
  if (missatgeCa.startsWith('Falta «')) return p.falta(etiqueta);
  if (missatgeCa.includes('nombre sencer')) return p.sencer(etiqueta);
  if (missatgeCa.includes('estar entre') && camp) {
    const min = camp.tipus === 'decimes' ? textDecimes(camp.min) : String(camp.min);
    const max = camp.tipus === 'decimes' ? textDecimes(camp.max) : String(camp.max);
    return p.rang(etiqueta, min, max);
  }
  if (missatgeCa.startsWith('Tria una opció')) return p.opcio(etiqueta);
  return p.invalid;
}

export function tradueixValidacioSalut(validacio, tipusId, idioma = 'ca') {
  const codi = codiDe(idioma);
  if (codi === 'ca' || !validacio) return validacio;
  const errors = {};
  for (const [clau, msg] of Object.entries(validacio.errors || {})) {
    const c = campDe(tipusId, clau) || CAMPS_COMUNS.find((x) => x.clau === clau);
    errors[clau] = tradueixErrorCamp(msg, c, codi);
  }
  const avisos = {};
  for (const [clau, msg] of Object.entries(validacio.avisos || {})) {
    avisos[clau] = tr(msg, codi);
  }
  return { ...validacio, errors, avisos };
}

export function tradueixErrorsPersonaSalut(errorsCa, campsPersona, idioma = 'ca') {
  const codi = codiDe(idioma);
  if (codi === 'ca' || !errorsCa) return errorsCa;
  const errors = {};
  for (const [clau, msg] of Object.entries(errorsCa)) {
    const c = campsPersona.find((x) => x.clau === clau);
    errors[clau] = tradueixErrorCamp(msg, c, codi);
  }
  return errors;
}

/* ── Alertes suaus (Resum.jsx + alertes.js) ─────────────────────────────── */

const NIVELLS_TR = Object.freeze({
  informa: L4('Para tenerlo en cuenta', 'Good to know', 'Jakiteko', 'Para telo en conta'),
  'parla-ho': L4('Coméntalo', 'Discuss with clinician', 'Hitz egin medikuarekin', 'Fálao co médico'),
  urgent: L4('Urgente', 'Urgent', 'Premiazkoa', 'Urxente'),
});

const PEU_ALERTES_TR = L4(
  'Que no aparezca ningún aviso no significa que todo vaya bien.',
  'Having no notices here does not guarantee everything is fine.',
  'Oharrik ez agertzeak ez du esan nahi dena ondo doanik.',
  'Que non haxa ningún aviso non quere dicir que todo vaia ben.'
);

const NOMS_DADES_TR = Object.freeze({
  vegades: L4('Veces', 'Times', 'Aldiak', 'Veces'),
  observacions: L4('Observaciones', 'Observations', 'Behaketak', 'Observacións'),
  data: L4('Día', 'Day', 'Eguna', 'Día'),
  episodis: L4('Episodios', 'Episodes', 'Gertakariak', 'Episodios'),
  mitjana: L4('Media previa', 'Prior average', 'Aurreko batezbestekoa', 'Media anterior'),
  maximaDecimes: L4('Temperatura máxima', 'Peak temperature', 'Tenperatura altuena', 'Temperatura máis alta'),
  motiu: L4('Motivo', 'Reason', 'Arrazoia', 'Motivo'),
  dies: L4('Días', 'Days', 'Egunak', 'Días'),
  ml: L4('Bebido (ml)', 'Fluids (ml)', 'Edandakoa (ml)', 'Bebido (ml)'),
  mitjanaMl: L4('Media bebida (ml)', 'Average fluids (ml)', 'Batez besteko edaria (ml)', 'Media bebida (ml)'),
  jornades: L4('Jornadas', 'Days', 'Egunak', 'Xornadas'),
  percent: L4('Parte nocturna (%)', 'Night share (%)', 'Gaueko zatia (%)', 'Parte de noite (%)'),
  referencia: L4('Referencia (%)', 'Reference (%)', 'Erreferentzia (%)', 'Referencia (%)'),
  mlPerKg: L4('ml por kg', 'ml per kg', 'ml kg-ko', 'ml por kg'),
  dures: L4('Deposiciones duras', 'Hard stools', 'Gorotz gogorrak', 'Deposicións duras'),
  preses: L4('Tomas', 'Doses', 'Hartualdiak', 'Tomas'),
  ara: L4('Ahora, por día', 'Current per day', 'Orain, eguneko', 'Agora, por día'),
  abans: L4('Antes, por día', 'Previous per day', 'Lehen, eguneko', 'Antes, por día'),
  ambTemperatura: L4('Con temperatura alta', 'With high temperature', 'Tenperatura altuarekin', 'Con temperatura alta'),
});

const MOTIUS_FEBRE_TR = Object.freeze({
  'una presa alta': L4('una toma alta', 'single high reading', 'neurketa altu bat', 'unha toma alta'),
  'dos preses en 24 hores': L4('dos tomas en 24 horas', 'two readings within 24 hours', 'bi neurketa 24 ordutan', 'dúas tomas en 24 horas'),
  'un grau per damunt de l’habitual': L4('un grado sobre su habitual', 'over 1 °C above baseline', 'ohikotik gradu bat gora', 'un grao sobre a habitual'),
});

const REGLES_TR = Object.freeze({
  risc: Object.freeze({
    text: L4('Si hay peligro ahora mismo, llama al 112. Si no, coméntalo con el equipo que le atiende.', 'If there is immediate danger, call 112. Otherwise, speak with your care team.', 'Une honetan arriskua badago, deitu 112ra. Bestela, hitz egin bere osasun-taldearekin.', 'Se hai perigo agora mesmo, chama ao 112. Se non, fálao co equipo que o atende.'),
    perQue: L4('Has anotado una caída o una situación de peligro.', 'A fall or safety risk was logged.', 'Eroriko bat edo arrisku-une bat apuntatu duzu.', 'Anotaches unha caída ou un momento de perigo.'),
    criteri: L4('Cualquier episodio con riesgo o cualquier caída registrada.', 'Any episode with safety risk or any logged fall.', 'Arriskudun edozein gertakari edo apuntatutako edozein eroriko.', 'Calquera episodio con perigo ou calquera caída anotada.'),
  }),
  'canvi-brusc': Object.freeze({
    text: L4('Ha cambiado de repente. Un cambio brusco puede tener una causa física: consúltalo hoy con el médico o enfermería.', 'Sudden change noted. Abrupt shifts can have a physical cause: speak with a doctor or nurse today.', 'Bat-batean aldatu da. Aldaketa azkar batek arrazoi fisiko bat izan dezake: hitz egin gaur medikuarekin edo erizaintzarekin.', 'Cambiou de súpeto. Un cambio brusco pode ter unha causa física: fálao hoxe co médico ou enfermaría.'),
    perQue: L4('Hay un día con el doble de episodios que la media previa, o has anotado un cambio repentino.', 'One day had twice the prior 7-day episode average, or a sudden change was logged.', 'Aurreko zazpi egunetako batezbestekoaren bikoitza duen egun bat dago, edo bat-bateko aldaketa apuntatu duzu.', 'Hai un día co dobre de episodios ca a media anterior, ou anotaches un cambio brusco.'),
    criteri: L4('Episodios del día ≥ 2 × media de los 7 días previos (mínimo 3 días), u observación «cambio brusco».', 'Daily episodes ≥ 2 × prior 7-day average (min 3 days logged), or “sudden change” observation.', 'Eguneko gertakariak ≥ aurreko 7 egunen batezbestekoa × 2 (gutxienez 3 egun), edo «bat-bateko aldaketa» behaketa.', 'Episodios do día ≥ 2 × media dos 7 días anteriores (mínimo 3 días), ou observación «cambio brusco».'),
  }),
  febre: Object.freeze({
    text: L4('Tiene la temperatura alta. Consúltalo hoy con el médico.', 'Elevated temperature logged. Speak with a doctor today.', 'Tenperatura altua du. Hitz egin gaur medikuarekin.', 'Ten a temperatura alta. Fálao hoxe co médico.'),
    perQue: L4('Has anotado una temperatura elevada.', 'An elevated temperature reading was logged.', 'Tenperatura altua apuntatu duzu.', 'Anotaches unha temperatura alta.'),
    criteri: L4('Una toma ≥ 37,8 °C, dos ≥ 37,2 °C en 24 h, o +1,1 °C sobre su habitual.', 'One reading ≥ 37.8 °C, two ≥ 37.2 °C within 24 h, or +1.1 °C above baseline.', 'Neurketa bat ≥ 37,8 °C, bi ≥ 37,2 °C 24 ordutan, edo ohikotik +1,1 °C gora.', 'Unha toma ≥ 37,8 °C, dúas ≥ 37,2 °C en 24 h, ou +1,1 °C sobre a habitual.'),
  }),
  'orina-diferent': Object.freeze({
    text: L4('Has anotado cambios en la orina o molestias al orinar. Coméntalo con el médico.', 'Changes in urine or discomfort when passing urine were logged. Discuss with a doctor.', 'Gernuan edo pixa egitean aldaketak apuntatu dituzu. Hitz egin medikuarekin.', 'Anotaches cambios nos ouriños ou molestias ao ouriñar. Fálao co médico.'),
    perQue: L4('Has registrado sangre visible, escozor o dolor al orinar, u orina turbia con temperatura alta.', 'Visible blood, burning or pain, or cloudy urine alongside high temperature was logged.', 'Ageriko odola, erremina edo mina pixa egitean, edo gernu arrea tenperatura altuarekin apuntatu duzu.', 'Anotaches sangue visible, ardor ou dor ao ouriñar, ou ouriños turbos con temperatura alta.'),
    criteri: L4('Sangre visible, escozor o dolor; u orina turbia con temperatura alta.', 'Visible blood, burning or pain; or cloudy urine with elevated temperature.', 'Ageriko odola, erremina edo mina; edo gernu arrea tenperatura altuarekin.', 'Sangue visible, ardor ou dor; ou ouriños turbos con temperatura alta.'),
  }),
  'beu-poc': Object.freeze({
    text: L4('Ha bebido poco dos días seguidos. Coméntalo con el médico o enfermería.', 'Low fluid intake on two consecutive days. Discuss with a doctor or nurse.', 'Bi egunez jarraian gutxi edan du. Hitz egin medikuarekin edo erizaintzarekin.', 'Bebeu pouco dous días seguidos. Fálao co médico ou enfermaría.'),
    perQue: L4('Dos jornadas completas seguidas con menos de 1 litro de bebida anotada.', 'Two consecutive complete days under 1,000 ml of fluids.', 'Bi egun osotan jarraian litro bat baino gutxiago edan du.', 'Dúas xornadas completas seguidas con menos de 1 litro de bebida anotada.'),
    criteri: L4('Menos de 1.000 ml en dos jornadas completas seguidas (sin límite médico de líquidos).', 'Under 1,000 ml on two consecutive complete days (unless fluid limit applies).', '1.000 ml baino gutxiago jarraiko bi egun osotan (likido-mugarik gabe).', 'Menos de 1.000 ml en dúas xornadas completas seguidas (sen límite médico).'),
  }),
  'davall-referencia': Object.freeze({
    text: L4('Ha bebido menos de la referencia habitual para personas mayores, salvo indicación distinta del médico.', 'Average fluid intake is below typical older-adult guidance, unless otherwise advised by a doctor.', 'Adinekoentzako ohiko erreferentzia baino gutxiago edan du, medikuak besterik esan ezean.', 'Bebeu menos da referencia habitual para persoas maiores, salvo outra indicación médica.'),
    perQue: L4('La media de las jornadas completas es inferior a 1,6 litros.', 'Average across complete days is below 1.6 litres.', 'Egun osoen batezbestekoa 1,6 litro baino txikiagoa da.', 'A media das xornadas completas é inferior a 1,6 litros.'),
    criteri: L4('Referencia orientativa de 1,6 l diarios en personas mayores (ESPEN 2019).', 'ESPEN 2019 older-adult reference of 1.6 L/day of drinks.', 'Adinekoentzako egunean 1,6 l-ko erreferentzia (ESPEN 2019).', 'Referencia orientativa de 1,6 l diarios en persoas maiores (ESPEN 2019).'),
  }),
  nicturia: Object.freeze({
    text: L4('Se levanta a orinar de noche a menudo. Lleva la hoja al médico y revisad cómo prevenir caídas nocturnas.', 'Frequent night-time bathroom visits. Share the sheet with a doctor and review night fall prevention.', 'Gauez pixa egitera sarri jaikitzen da. Eraman orria medikuari eta begiratu gaueko erorikoak nola saihestu.', 'Érguese a ouriñar de noite a miúdo. Leva a folla ao médico e falade de como evitar caídas nocturnas.'),
    perQue: L4('Hay dos o más jornadas completas con 2 o más micciones nocturnas.', 'Two or more complete days had 2 or more night visits.', 'Bi egun osotan edo gehiagotan gaueko 2 pixa-egite edo gehiago daude.', 'Hai dúas ou máis xornadas completas con 2 ou máis miccións nocturnas.'),
    criteri: L4('2 o más micciones nocturnas en al menos 2 jornadas completas (ICS 2019).', '2+ night visits on 2+ complete days (ICS 2019).', 'Gaueko 2 pixa-egite edo gehiago 2 egun osotan gutxienez (ICS 2019).', '2 ou máis miccións de noite en 2 ou máis xornadas completas (ICS 2019).'),
  }),
  'orina-nit': Object.freeze({
    text: L4('Buena parte de la orina se produce de noche. Lleva la hoja al médico.', 'A large share of daily urine is passed overnight. Share the sheet with a doctor.', 'Gernuaren zati handi bat gauez egiten du. Eraman orria medikuari.', 'Boa parte dos ouriños prodúcese de noite. Leva a folla ao médico.'),
    perQue: L4('La proporción de orina nocturna supera la referencia orientativa.', 'Night-time urine share exceeds the reference threshold.', 'Gaueko gernu-zatiak erreferentzia gainditzen du.', 'A parte dos ouriños feita de noite supera a referencia.'),
    criteri: L4('NPi > 33 % en mayores (20 % en menores de 65), con jornadas completas medidas (ICS 2019).', 'NPi > 33% in older adults (20% under 65) across complete measured days (ICS 2019).', 'NPi > % 33 adinekoengan (% 20 gazteagoengan), egun oso neurtuetan (ICS 2019).', 'NPi > 33 % en maiores (20 % en menores de 65), con xornadas completas medidas (ICS 2019).'),
  }),
  'molta-orina': Object.freeze({
    text: L4('Volumen total de orina elevado en 24 horas. Lleva la hoja al médico.', 'High 24-hour urine volume relative to weight. Share the sheet with a doctor.', 'Egun bateko gernu-bolumen handia. Eraman orria medikuari.', 'Moito volume de ouriños nun día. Leva a folla ao médico.'),
    perQue: L4('Una jornada supera los 40 ml por kg de peso.', 'At least one day exceeded 40 ml per kg of body weight.', 'Egun batek pisu-kiloko 40 ml gainditu ditu.', 'Unha xornada pasa de 40 ml por kg de peso.'),
    criteri: L4('Más de 40 ml por kg en 24 h cuando consta el peso (ICS 2019).', 'Over 40 ml/kg in 24 h when weight is recorded (ICS 2019).', '40 ml/kg baino gehiago 24 ordutan pisua jarrita dagoenean (ICS 2019).', 'Máis de 40 ml por kg en 24 h cando consta o peso (ICS 2019).'),
  }),
  ventre: Object.freeze({
    text: L4('Lleva días sin hacer de vientre o le cuesta. El estreñimiento puede aumentar la inquietud: consúltalo con enfermería.', 'Several days without a bowel movement or hard stools logged. Constipation can increase discomfort: consult a nurse.', 'Egunak daramatza sabela hustu gabe edo kostatzen zaio. Idorreriak urduritasuna areagotu dezake: hitz egin erizaintzarekin.', 'Leva días sen facer de ventre ou cústalle. O estrinximento pode aumentar a inquietude: fálao con enfermaría.'),
    perQue: L4('Han pasado 3 o más días desde la última deposición, o las últimas han sido muy duras.', '3+ days since last logged movement, or recent stools were Bristol 1–2.', '3 egun edo gehiago igaro dira azken sabel-hustuketatik, edo azkenak oso gogorrak izan dira.', 'Pasaron 3 días ou máis dende a última deposición, ou as últimas foron moi duras.'),
    criteri: L4('3 o más días sin deposición, o Bristol 1–2 en 2 de las 3 últimas.', '3+ days without a movement, or Bristol 1–2 in 2 of the last 3.', '3 egun edo gehiago sabel-hustuketarik gabe, edo Bristol 1–2 azken 3etatik 2tan.', '3 días ou máis sen deposición, ou Bristol 1–2 en 2 das 3 últimas.'),
  }),
  'medicacio-rebutjada': Object.freeze({
    text: L4('Faltan tomas de medicación. Habla con el médico antes de cambiar nada.', 'Missed or declined medication doses logged. Speak with a doctor before changing anything.', 'Medikazio-hartualdiak falta dira. Hitz egin medikuarekin ezer aldatu aurretik.', 'Faltan tomas de medicación. Fala co médico antes de cambiar nada.'),
    perQue: L4('Dos o más tomas no se han realizado en los últimos tres días.', 'Two or more doses were declined or missed within three days.', 'Bi hartualdi edo gehiago ez dira egin azken hiru egunetan.', 'Dúas ou máis tomas non se fixeron en tres días.'),
    criteri: L4('2 o más tomas rechazadas u olvidadas en 3 días.', '2+ declined or missed doses over 3 days.', '2 hartualdi edo gehiago ukatuta edo ahaztuta 3 egunetan.', '2 ou máis tomas rexeitadas ou esquecidas en 3 días.'),
  }),
  pell: Object.freeze({
    text: L4('Has anotado piel herida. Consúltalo con enfermería.', 'Broken skin was logged during a pad change. Consult a nurse.', 'Azala zaurituta apuntatu duzu. Hitz egin erizaintzarekin.', 'Anotaches a pel ferida. Fálao con enfermaría.'),
    perQue: L4('Un cambio de absorbente registra la piel con herida.', 'A pad change recorded broken skin.', 'Xurgatzaile-aldaketa batean azala zaurituta ageri da.', 'Un cambio de absorbente rexistra pel ferida.'),
    criteri: L4('Cualquier cambio de absorbente con piel herida.', 'Any pad change with broken skin.', 'Azala zaurituta duen edozein xurgatzaile-aldaketa.', 'Calquera cambio de absorbente con pel ferida.'),
  }),
  'escapaments-augmenten': Object.freeze({
    text: L4('Hay más escapes que en el periodo anterior. Llévalo al médico.', 'Leaks are more frequent than in the previous period. Share with a doctor.', 'Aurreko aldian baino ihes gehiago daude. Eraman medikuari.', 'Hai máis perdas ca no período anterior. Lévao ao médico.'),
    perQue: L4('Los escapes diarios superan en al menos la mitad a los del periodo previo.', 'Daily leaks increased by at least half compared with the previous period.', 'Eguneko ihesak aurreko aldikoak baino erdia gehiago dira gutxienez.', 'As perdas por día son polo menos a metade máis ca no período anterior.'),
    criteri: L4('Escapes por día ≥ 1,5 × periodo anterior.', 'Leaks per day ≥ 1.5 × previous period.', 'Eguneko ihesak ≥ aurreko aldia × 1,5.', 'Perdas por día ≥ 1,5 × período anterior.'),
  }),
});

export const etiquetaNivellSalut = (nivell, idioma = 'ca') => (
  codiDe(idioma) === 'ca' ? ETIQUETA_NIVELL[nivell] : NIVELLS_TR[nivell]?.[codiDe(idioma)] || ETIQUETA_NIVELL[nivell]
);

export const peuAlertesSalut = (idioma = 'ca') => (
  codiDe(idioma) === 'ca' ? PEU_ALERTES : PEU_ALERTES_TR[codiDe(idioma)]
);

export const nomDadaAlertaSalut = (clau, idioma = 'ca') => {
  const codi = codiDe(idioma);
  if (codi === 'ca') return null;
  return NOMS_DADES_TR[clau]?.[codi] || clau;
};

export const valorMotiuFebreSalut = (valor, idioma = 'ca') => {
  const codi = codiDe(idioma);
  if (codi === 'ca') return valor;
  return MOTIUS_FEBRE_TR[valor]?.[codi] || valor;
};

export function alertaSalutTraduida(alerta, idioma = 'ca') {
  const codi = codiDe(idioma);
  if (!alerta || codi === 'ca') return alerta;
  const r = REGLES_TR[alerta.id];
  if (!r) return alerta;
  return Object.freeze({
    ...alerta,
    text: r.text[codi],
    perQue: r.perQue[codi],
    criteri: r.criteri[codi],
  });
}

/* ── Agitació: franges, associació i valoració setmanal ─────────────────── */

const FRANGES_TR = Object.freeze({
  mati: L4('Mañana y mediodía (6–16 h)', 'Morning & midday (6–16 h)', 'Goiza eta eguerdia (6–16 h)', 'Mañá e mediodía (6–16 h)'),
  vesprada: L4('Tarde (16–20 h)', 'Late afternoon (16–20 h)', 'Arratsaldea (16–20 h)', 'Tarde (16–20 h)'),
  nit: L4('Noche (20–6 h)', 'Night (20–6 h)', 'Gaua (20–6 h)', 'Noite (20–6 h)'),
});

export function frangesSalut(idioma = 'ca') {
  const codi = codiDe(idioma);
  if (codi === 'ca') return FRANGES;
  return Object.freeze(FRANGES.map((f) => Object.freeze({ ...f, etiqueta: FRANGES_TR[f.id]?.[codi] || f.etiqueta })));
}

export function textAssociacioSalut(resultat, idioma = 'ca') {
  if (!resultat) return null;
  const codi = codiDe(idioma);
  if (codi === 'ca') return textAssociacio(resultat);
  const esp = String(resultat.esperat).replace('.', codi === 'en' ? '.' : ',');
  if (codi === 'es') return `${resultat.ambOrina} de ${resultat.n} episodios terminaron con una micción, escape o cambio de absorbente en menos de una hora. Por azar esperaríamos unos ${esp}. Es una pista para probar a ofrecer el baño antes; coméntalo con el equipo.`;
  if (codi === 'en') return `${resultat.ambOrina} out of ${resultat.n} episodes were followed within an hour by a bathroom visit, leak or pad change. By chance alone we would expect around ${esp}. Consider offering the bathroom earlier and discuss with your care team.`;
  if (codi === 'eu') return `${resultat.n} gertakaritatik ${resultat.ambOrina} ordubete baino gutxiagoan pixa-egite, ihes edo xurgatzaile-aldaketa batekin amaitu ziren. Zoriz ${esp} inguru espero genituzke. Komuna lehenago eskaintzen saiatzeko pista bat da; hitz egin taldearekin.`;
  return `${resultat.ambOrina} de ${resultat.n} episodios remataron cunha micción, perda ou cambio de absorbente en menos dunha hora. Por azar agardariamos uns ${esp}. É unha pista para probar a ofrecer o váter antes; fálao co equipo.`;
}

const VALORACIO_TR = Object.freeze({
  avis: L4(
    'Inspirada en instrumentos clínicos; no es ninguna escala validada.',
    'Inspired by clinical observation tools; not a validated clinical scale.',
    'Tresna klinikoetan oinarritua; ez da baliozkotutako eskala bat.',
    'Inspirada en instrumentos clínicos; non é ningunha escala validada.'
  ),
  gravetats: Object.freeze({
    es: ['0 · No', '1 · Leve', '2 · Moderada', '3 · Intensa'],
    en: ['0 · None', '1 · Mild', '2 · Moderate', '3 · Severe'],
    eu: ['0 · Ez', '1 · Arina', '2 · Ertaina', '3 · Handia'],
    gl: ['0 · Non', '1 · Leve', '2 · Moderada', '3 · Intensa'],
  }),
  angoixes: Object.freeze({
    es: ['0 · Nada', '1', '2', '3', '4', '5 · Muchísimo'],
    en: ['0 · Not at all', '1', '2', '3', '4', '5 · Very high'],
    eu: ['0 · Batere ez', '1', '2', '3', '4', '5 · Asko'],
    gl: ['0 · Nada', '1', '2', '3', '4', '5 · Moitísimo'],
  }),
  freq: Object.freeze({
    1: L4('1 · Nunca', '1 · Never', '1 · Inoiz ez', '1 · Nunca'),
    2: L4('2 · Menos de una vez por semana', '2 · Less than once a week', '2 · Astean behin baino gutxiagotan', '2 · Menos dunha vez por semana'),
    3: L4('3 · Una o dos veces por semana', '3 · Once or twice a week', '3 · Astean behin edo bitan', '3 · Unha ou dúas veces por semana'),
    4: L4('4 · Varias veces por semana', '4 · Several times a week', '4 · Astean hainbat aldiz', '4 · Varias veces por semana'),
    5: L4('5 · Una o dos veces al día', '5 · Once or twice a day', '5 · Egunean behin edo bitan', '5 · Unha ou dúas veces ao día'),
    6: L4('6 · Varias veces al día', '6 · Several times a day', '6 · Egunean hainbat aldiz', '6 · Varias veces ao día'),
    7: L4('7 · Varias veces por hora', '7 · Several times an hour', '7 · Orduko hainbat aldiz', '7 · Varias veces por hora'),
  }),
  dominis: Object.freeze({
    idees: L4('Ideas que no son ciertas', 'Beliefs that are not true', 'Egia ez diren ideiak', 'Ideas que non son certas'),
    percepcions: L4('Ver o escuchar cosas que no están', 'Seeing or hearing things not there', 'Ez dauden gauzak ikusi edo entzutea', 'Ver ou ouvir cousas que non están'),
    agitacio: L4('Inquietud o agresividad', 'Restlessness or resistance', 'Urduritasuna edo oldarkortasuna', 'Inquietude ou agresividade'),
    tristesa: L4('Tristeza', 'Low mood or sadness', 'Tristura', 'Tristura'),
    ansietat: L4('Nervios o miedo', 'Worry or fear', 'Urduritasuna edo beldurra', 'Nervios ou medo'),
    euforia: L4('Alegría fuera de lugar', 'Unusual elation', 'Lekuz kanpoko poza', 'Alegría fóra de lugar'),
    apatia: L4('Desgana', 'Loss of interest', 'Gogorik eza', 'Desgana'),
    desinhibicio: L4('Hacer o decir cosas fuera de lugar', 'Acting or speaking without filter', 'Lekuz kanpoko gauzak egin edo esatea', 'Facer ou dicir cousas fóra de lugar'),
    irritabilitat: L4('Irritabilidad', 'Irritability', 'Suminkortasuna', 'Irritabilidade'),
    repeticio: L4('Movimientos o acciones repetitivos', 'Repetitive movements or actions', 'Mugimendu edo ekintza errepikakorrak', 'Movementos ou accións repetitivos'),
    'son-nit': L4('Sueño y noche', 'Sleep & night-time', 'Loa eta gaua', 'Sono e noite'),
    apetit: L4('Apetito y comida', 'Appetite & eating', 'Gosea eta janaria', 'Apetito e comida'),
  }),
});

export function valoracioSetmanalSalut(idioma = 'ca') {
  const codi = codiDe(idioma);
  if (codi === 'ca') {
    return {
      avis: AVIS_VALORACIO,
      grups: GRUPS_CONDUCTA,
      frequencies: FREQUENCIES_VALORACIO,
      dominis: DOMINIS_VALORACIO,
      gravetats: ['0 · No', '1 · Lleu', '2 · Moderada', '3 · Greu'],
      angoixes: ['0 · Gens', '1', '2', '3', '4', '5 · Moltíssima'],
    };
  }
  return {
    avis: VALORACIO_TR.avis[codi],
    grups: GRUPS_CONDUCTA.map((g) => ({ ...g, etiqueta: tr(g.etiqueta, codi) })),
    frequencies: FREQUENCIES_VALORACIO.map((o) => ({ ...o, etiqueta: VALORACIO_TR.freq[o.valor]?.[codi] || o.etiqueta })),
    dominis: DOMINIS_VALORACIO.map((d) => ({ ...d, etiqueta: VALORACIO_TR.dominis[d.valor]?.[codi] || d.etiqueta })),
    gravetats: VALORACIO_TR.gravetats[codi],
    angoixes: VALORACIO_TR.angoixes[codi],
  };
}

/* ── Full per al metge (capçalera i taula visual en Full.jsx) ───────────── */

const COLUMNES_RESUM_TR = Object.freeze({
  Dia: L4('Día', 'Day', 'Eguna', 'Día'),
  Completa: L4('Completa', 'Complete', 'Osoa', 'Completa'),
  Cobertura: L4('Cobertura', 'Coverage', 'Estaldura', 'Cobertura'),
  'Vegades de dia': L4('Veces día', 'Day visits', 'Egunekoak', 'Veces día'),
  'Vegades de nit': L4('Veces noche', 'Night visits', 'Gauekoak', 'Veces noite'),
  'Orina 24 h (ml)': L4('Orina 24 h (ml)', '24 h urine (ml)', '24 h gernua (ml)', 'Ouriños 24 h (ml)'),
  'Orina de nit (ml)': L4('Orina noche (ml)', 'Night urine (ml)', 'Gaueko gernua (ml)', 'Ouriños noite (ml)'),
  'Part de nit (%)': L4('Parte noche (%)', 'Night share (%)', 'Gaueko zatia (%)', 'Parte noite (%)'),
  'Índex de nit (Ni)': L4('Índice noche (Ni)', 'Night index (Ni)', 'Gaueko indizea (Ni)', 'Índice noite (Ni)'),
  'Màxim (ml)': L4('Máximo (ml)', 'Max (ml)', 'Gehiena (ml)', 'Máximo (ml)'),
  'Mitjana (ml)': L4('Media (ml)', 'Mean (ml)', 'Batezbestekoa (ml)', 'Media (ml)'),
  'Begut (ml)': L4('Bebido (ml)', 'Fluids (ml)', 'Edandakoa (ml)', 'Bebido (ml)'),
  Escapaments: L4('Escapes', 'Leaks', 'Ihesak', 'Perdas'),
  Absorbents: L4('Absorbentes', 'Pads', 'Xurgatzaileak', 'Absorbentes'),
  Deposicions: L4('Deposiciones', 'Bowel', 'Sabel-hustuketak', 'Deposicións'),
  Episodis: L4('Episodios', 'Episodes', 'Gertakariak', 'Episodios'),
});

export function resumFullTraduit(resum, { des, fins, dies, completes, nomPersona, idioma = 'ca' }) {
  const codi = codiDe(idioma);
  if (codi === 'ca' || !resum) return resum;
  const nom = typeof nomPersona === 'string' && nomPersona.trim()
    ? nomPersona.trim()
    : { es: 'la persona', en: 'the person', eu: 'pertsona', gl: 'a persoa' }[codi];
  const capcalera = {
    es: [
      `Persona: ${nom}`,
      `Periodo: ${dataCurta(des)} – ${dataCurta(fins)} (${dies} ${dies === 1 ? 'día' : 'días'})`,
      'Registro doméstico. No es un informe clínico ni un producto sanitario.',
    ],
    en: [
      `Person: ${nom}`,
      `Period: ${dataCurta(des)} – ${dataCurta(fins)} (${dies} ${dies === 1 ? 'day' : 'days'})`,
      'Home care log. Not a clinical report or medical device.',
    ],
    eu: [
      `Pertsona: ${nom}`,
      `Aldia: ${dataCurta(des)} – ${dataCurta(fins)} (${dies} egun)`,
      'Etxeko erregistroa. Ez da txosten klinikoa ez osasun-produktua.',
    ],
    gl: [
      `Persoa: ${nom}`,
      `Período: ${dataCurta(des)} – ${dataCurta(fins)} (${dies} ${dies === 1 ? 'día' : 'días'})`,
      'Rexistro doméstico. Non é un informe clínico nin un produto sanitario.',
    ],
  }[codi];
  const siNo = { Sí: { es: 'Sí', en: 'Yes', eu: 'Bai', gl: 'Si' }[codi], No: { es: 'No', en: 'No', eu: 'Ez', gl: 'Non' }[codi] };
  const mitjanaEtiqueta = {
    es: `Media de ${completes} ${completes === 1 ? 'jornada completa' : 'jornadas completas'}`,
    en: `Average across ${completes} complete ${completes === 1 ? 'day' : 'days'}`,
    eu: `${completes} egun osoren batezbestekoa`,
    gl: `Media de ${completes} ${completes === 1 ? 'xornada completa' : 'xornadas completas'}`,
  }[codi];
  const filesOrig = resum.files.slice(3);
  const files = filesOrig.map((fila, idx) => {
    if (idx === filesOrig.length - 1) return [mitjanaEtiqueta, ...fila.slice(1)];
    const cob = typeof fila[2] === 'string' && fila[2].startsWith('parcial (')
      ? textCoberturaSalut({ cobertura: Number(/\d+/.exec(fila[2])?.[0] || 0) }, codi)
      : fila[2];
    const dataIso = typeof fila[0] === 'string' && /\d{2}\/\d{2}\/\d{4}$/.test(fila[0])
      ? fila[0].slice(-10).split('/').reverse().join('-')
      : null;
    return [dataIso ? etiquetaDataSalut(dataIso, codi) : fila[0], siNo[fila[1]] || fila[1], cob, ...fila.slice(3)];
  });
  return {
    ...resum,
    columnes: resum.columnes.map((c) => ({ ...c, titol: COLUMNES_RESUM_TR[c.titol]?.[codi] || c.titol })),
    files: [
      ...capcalera.map((t, i) => [t, ...resum.files[i].slice(1)]),
      ...files,
    ],
  };
}

/* ── Exportació completa del model (5 fulles) i proposta d'importació ───── */

const NOMS_FULLES_TR = Object.freeze({
  Resum: L4('Resumen', 'Summary', 'Laburpena', 'Resumo'),
  Diari: L4('Diario', 'Diary', 'Egunkaria', 'Diario'),
  Conducta: L4('Conducta', 'Behaviour', 'Jokabidea', 'Conduta'),
  'Medicació': L4('Medicación', 'Medication', 'Medikazioa', 'Medicación'),
  Diccionari: L4('Diccionario', 'Dictionary', 'Hiztegia', 'Dicionario'),
});

const PERIODE_DIARI_TR = Object.freeze({
  Dia: L4('Día', 'Day', 'Eguna', 'Día'),
  Nit: L4('Noche', 'Night', 'Gaua', 'Noite'),
  'Matí següent': L4('Mañana siguiente', 'Next morning', 'Biharamun goiza', 'Mañá seguinte'),
});

const COLUMNES_ALTRES_TR = Object.freeze({
  Data: L4('Fecha', 'Date', 'Data', 'Data'),
  Hora: L4('Hora', 'Time', 'Ordua', 'Hora'),
  'Durada (min)': L4('Duración (min)', 'Duration (min)', 'Iraupena (min)', 'Duración (min)'),
  Intensitat: L4('Intensidad', 'Intensity', 'Intentsitatea', 'Intensidade'),
  'Què ha fet': L4('Qué ha hecho', 'What happened', 'Zer egin du', 'Que fixo'),
  'Què passava abans': L4('Qué pasaba antes', 'Context beforehand', 'Zer gertatzen zen aurretik', 'Que pasaba antes'),
  'Què hem fet': L4('Qué hemos hecho', 'How we responded', 'Zer egin dugu', 'Que fixemos'),
  'Com ha acabat': L4('Cómo ha terminado', 'Outcome', 'Nola amaitu da', 'Como rematou'),
  Perill: L4('Peligro', 'Safety risk', 'Arriskua', 'Perigo'),
  Notes: L4('Notas', 'Notes', 'Oharrak', 'Notas'),
  Nom: L4('Nombre', 'Name', 'Izena', 'Nome'),
  Quantitat: L4('Cantidad', 'Amount', 'Kopurua', 'Cantidade'),
  Pauta: L4('Pauta', 'Schedule', 'Jarraibidea', 'Pauta'),
  Estat: L4('Estado', 'Status', 'Egoera', 'Estado'),
  'Per a què (ho diu la família)': L4('Para qué (según la familia)', 'Purpose (family label)', 'Zertarako (familiak dioena)', 'Para que (dio a familia)'),
  Entitat: L4('Entidad', 'Section', 'Atala', 'Entidade'),
  Camp: L4('Campo', 'Field', 'Eremua', 'Campo'),
  Columna: L4('Columna', 'Column', 'Zutabea', 'Columna'),
  Tipus: L4('Tipo', 'Type', 'Mota', 'Tipo'),
  Unitat: L4('Unidad', 'Unit', 'Unitatea', 'Unidade'),
  'Valors admesos': L4('Valores admitidos', 'Allowed values', 'Balio onartuak', 'Valores admitidos'),
  'Definició': L4('Definición', 'Meaning', 'Definizioa', 'Definición'),
  'Per què importa': L4('Por qué importa', 'Why it matters', 'Zergatik inporta du', 'Por que importa'),
});

const TIPUS_LLEGIBLE_TR = Object.freeze({
  enter: L4('número entero', 'whole number', 'zenbaki osoa', 'número enteiro'),
  decimes: L4('número con un decimal', 'number to 1 decimal', 'hamartar bateko zenbakia', 'número cun decimal'),
  escala: L4('escala', 'scale', 'eskala', 'escala'),
  opcio: L4('una opción', 'single choice', 'aukera bat', 'unha opción'),
  multiopcio: L4('varias opciones', 'multiple choice', 'aukera anitz', 'varias opcións'),
  boolea: L4('sí o no', 'yes or no', 'bai ala ez', 'si ou non'),
  text: L4('texto', 'text', 'testua', 'texto'),
  moment: L4('día y hora', 'date and time', 'eguna eta ordua', 'día e hora'),
  hora: L4('hora', 'time', 'ordua', 'hora'),
  data: L4('fecha', 'date', 'data', 'data'),
  decimal: L4('número con decimales', 'decimal number', 'hamartardun zenbakia', 'número con decimais'),
});

function tradueixLlistaPuntIComa(valor, codi) {
  if (!valor) return '';
  return String(valor).split('; ').map((item) => tr(item, codi)).join('; ');
}

function tradueixColumnaDiccionari(titolCa, codi) {
  if (!titolCa || codi === 'ca') return titolCa || '';
  if (COLUMNES_RESUM_TR[titolCa]?.[codi]) return COLUMNES_RESUM_TR[titolCa][codi];
  const entradaDiari = Object.values(COLUMNES_DIARI_5_LLENGUES).find((m) => m.ca === titolCa);
  if (entradaDiari?.[codi]) return entradaDiari[codi];
  return COLUMNES_ALTRES_TR[titolCa]?.[codi] || titolCa;
}

function tradueixCelConductaDiari(valor, codi) {
  if (!valor) return '';
  const idx = valor.indexOf(' · ');
  if (idx < 0) return tr(valor, codi);
  return `${tr(valor.slice(0, idx), codi)} · ${tradueixLlistaPuntIComa(valor.slice(idx + 3), codi)}`;
}

function tradueixCelMedicacioDiari(valor, codi) {
  if (!valor) return '';
  const idx = valor.lastIndexOf(' · ');
  if (idx < 0) return valor;
  return `${valor.slice(0, idx)} · ${tr(valor.slice(idx + 3), codi)}`;
}

/**
 * Traduïx el model complet de 5 fulles (`fullDiari`) a l'idioma actiu
 * (`ca, es, en, eu, gl`). En `ca` retorna el model canònic intacte.
 * v1.2.19 · Gauntlet R1 (L3-03): la columna Notes del Diari no es traduïx.
 */
export function modelFullSalutTraduit(model, { des, fins, dies, completes, nomPersona, idioma = 'ca' }) {
  const codi = codiDe(idioma);
  if (codi === 'ca' || !model || !Array.isArray(model.fulles)) return model;
  const entitatsTr = entitatsSalutTraduites(codi);
  const filesDiccionari = ENTITATS.flatMap((entitatOrig, idxEnt) => {
    const entitatTr = entitatsTr[idxEnt];
    return entitatOrig.camps.map((cOrig, idxCamp) => {
      const cTr = entitatTr.camps[idxCamp];
      return [
        entitatTr.nom,
        cTr.etiqueta,
        tradueixColumnaDiccionari(cOrig.columna, codi),
        TIPUS_LLEGIBLE_TR[cOrig.tipus]?.[codi] || cOrig.tipus,
        cOrig.unitat || '',
        textValorsAdmesosSalut(cOrig, codi),
        cTr.definicio,
        cTr.perQueImporta,
      ];
    });
  });

  const fulles = model.fulles.map((fulla, index) => {
    const nomFulla = NOMS_FULLES_TR[fulla.nom]?.[codi] || fulla.nom;
    if (index === 0) {
      const resum = resumFullTraduit(fulla, { des, fins, dies, completes, nomPersona, idioma: codi });
      return { ...resum, nom: nomFulla };
    }
    if (index === 1) {
      return {
        ...fulla,
        nom: nomFulla,
        columnes: fulla.columnes.map((c) => ({
          ...c,
          titol: COLUMNES_DIARI_5_LLENGUES[c.font]?.[codi] || c.titol,
        })),
        files: fulla.files.map((fila) => [
          fila[0],
          fila[1],
          PERIODE_DIARI_TR[fila[2]]?.[codi] || fila[2],
          tr(fila[3], codi),
          fila[4],
          fila[5],
          tr(fila[6], codi),
          fila[7],
          tr(fila[8], codi),
          tr(fila[9], codi),
          fila[10],
          tradueixCelConductaDiari(fila[11], codi),
          tradueixCelMedicacioDiari(fila[12], codi),
          /* v1.2.19 · Gauntlet R1 (L3-03): Notes és text de la persona; les marques del sistema queden canòniques. */
          fila[13],
        ]),
      };
    }
    if (index === 2) {
      return {
        ...fulla,
        nom: nomFulla,
        columnes: fulla.columnes.map((c) => ({ ...c, titol: COLUMNES_ALTRES_TR[c.titol]?.[codi] || c.titol })),
        files: fulla.files.map((fila) => [
          fila[0],
          fila[1],
          fila[2],
          tr(fila[3], codi),
          tradueixLlistaPuntIComa(fila[4], codi),
          tradueixLlistaPuntIComa(fila[5], codi),
          tradueixLlistaPuntIComa(fila[6], codi),
          tr(fila[7], codi),
          tradueixLlistaPuntIComa(fila[8], codi),
          fila[9],
        ]),
      };
    }
    if (index === 3) {
      return {
        ...fulla,
        nom: nomFulla,
        columnes: fulla.columnes.map((c) => ({ ...c, titol: COLUMNES_ALTRES_TR[c.titol]?.[codi] || c.titol })),
        files: fulla.files.map((fila) => [
          fila[0], fila[1], fila[2], fila[3],
          tr(fila[4], codi), tr(fila[5], codi), tr(fila[6], codi),
        ]),
      };
    }
    return {
      ...fulla,
      nom: nomFulla,
      columnes: fulla.columnes.map((c) => ({ ...c, titol: COLUMNES_ALTRES_TR[c.titol]?.[codi] || c.titol })),
      files: filesDiccionari,
    };
  });

  return { ...model, fulles };
}

const AVISOS_IMPORTACIO_TR = Object.freeze({
  /* v1.2.19 · Gauntlet R1 (L5-08): el full de l'exportació amb el nom que li dona l'exportació en eixa llengua. */
  'format-desconegut': L4(
    `Esta hoja no tiene la forma de un diario reconocible: una cuadrícula con la columna «HORA» y sus franjas, o la hoja «${NOMS_FULLES_TR.Diari.es}» exportada por Salud.`,
    `This spreadsheet does not match a supported diary layout: an hourly grid with a “HORA” column, or the “${NOMS_FULLES_TR.Diari.en}” tab exported by this app.`,
    `Orri honek ez du aplikazioak ezagutzen duen egunkari-itxurarik: «HORA» zutabea duen sareta bat, edo aplikazioak esportatutako «${NOMS_FULLES_TR.Diari.eu}» orria.`,
    `Esta folla non ten a forma dun diario recoñecible: unha grella coa columna «HORA» e as franxas, ou a folla «${NOMS_FULLES_TR.Diari.gl}» exportada por Saúde.`
  ),
  'camps-per-defecte': L4(
    'Esta hoja no incluye todos los campos (como el lugar, la ayuda o las circunstancias): quedan con los valores habituales del formulario. Para conservarlo todo, importa la copia (.json).',
    'This spreadsheet omits detailed fields (such as location, assistance or circumstances): default form values are used. Import a backup (.json) to restore every detail.',
    'Orri honek ez ditu eremu guztiak ekartzen (lekua, laguntza edo inguruabarrak): inprimakiaren balio lehenetsiekin geratzen dira. Dena berreskuratzeko, inportatu kopia (.json).',
    'Esta folla non trae todos os campos (como o lugar, a axuda ou as circunstancias): quedan cos valores habituais do formulario. Para recuperalo todo, importa a copia (.json).'
  ),
});

function tradueixAvisImportacio(avis, codi) {
  if (!avis || codi === 'ca') return avis;
  if (AVISOS_IMPORTACIO_TR[avis.codi]?.[codi]) {
    return Object.freeze({ ...avis, text: AVISOS_IMPORTACIO_TR[avis.codi][codi] });
  }
  const t = avis.text;
  if (avis.codi === 'falta-data') {
    const nom = /«([^»]+)»/.exec(t)?.[1] || '';
    const map = {
      es: `Falta la fecha de la hoja «${nom}»: elígela para ver qué se añadirá.`,
      en: `Date missing for sheet “${nom}”: pick a date to preview entries.`,
      eu: `«${nom}» orriaren data falta da: aukeratu zer gehituko den ikusteko.`,
      gl: `Falta a data da folla «${nom}»: escóllea para ver que se engadirá.`,
    };
    return Object.freeze({ ...avis, text: map[codi] });
  }
  if (avis.codi === 'grup-no-importat') {
    const m = /^El grup «([^»]+)» \((\d+)/.exec(t);
    const grup = m?.[1] || '';
    const n = Number(m?.[2] || 1);
    const map = {
      es: `El grupo «${grup}» (${n} ${n === 1 ? 'celda' : 'celdas'}) no se importa en la app.`,
      en: `Group “${grup}” (${n} ${n === 1 ? 'cell' : 'cells'}) is not imported by the app.`,
      eu: `«${grup}» taldea (${n} gelaxka) ez da aplikazioan inportatzen.`,
      gl: `O grupo «${grup}» (${n} ${n === 1 ? 'cela' : 'celas'}) non se importa na app.`,
    };
    return Object.freeze({ ...avis, text: map[codi] });
  }
  if (avis.codi === 'columna-no-reconeguda') {
    const m = /^La columna «([^»]+)» de «([^»]+)»/.exec(t);
    const col = m?.[1] || '';
    const grup = m?.[2] || '';
    const map = {
      es: `La columna «${col}» de «${grup}» no se reconoce y no se importa.`,
      en: `Column “${col}” under “${grup}” is unrecognised and skipped.`,
      eu: `«${grup}» taldeko «${col}» zutabea ez da ezagutzen eta ez da inportatzen.`,
      gl: `A columna «${col}» de «${grup}» non se recoñece e non se importa.`,
    };
    return Object.freeze({ ...avis, text: map[codi] });
  }
  if (avis.codi === 'urgencia-sense-miccio') {
    const hores = /micció a (.+?): no es desa/.exec(t)?.[1] || '';
    const map = {
      es: `Hay urgencia anotada sin micción en ${hores}: no se guarda porque las ganas se registran dentro de cada micción.`,
      en: `Urgency logged without a bathroom visit at ${hores}: skipped because urgency is stored inside each visit.`,
      eu: `Pixa-egiterik gabeko larrialdia dago ${hores} orduetan: ez da gordetzen, gogoa pixa-egite bakoitzaren barruan gordetzen baita.`,
      gl: `Hai urxencia anotada sen micción ás ${hores}: non se garda porque as ganas van dentro de cada micción.`,
    };
    return Object.freeze({ ...avis, text: map[codi] });
  }
  if (avis.codi === 'franja-alcar') {
    const m = /^(\d+) apunts? de la franja de les (\d\d:\d\d) .* a les (\d\d:\d\d)/.exec(t);
    const n = Number(m?.[1] || 1);
    const franja = m?.[2] || '';
    const hora = m?.[3] || '';
    const map = {
      es: `${n} ${n === 1 ? 'apunte' : 'apuntes'} de la franja de las ${franja} se ${n === 1 ? 'sitúa' : 'sitúan'} a las ${hora} (hora de levantarse) para contar en el día actual.`,
      en: `${n} ${n === 1 ? 'entry' : 'entries'} in the ${franja} slot ${n === 1 ? 'is' : 'are'} placed at wake-up time (${hora}) so ${n === 1 ? 'it counts' : 'they count'} towards this day.`,
      eu: `${franja} tarteko ${n} ohar ${hora}(e)tan (jaikitzeko orduan) kokatzen dira egun honetan zenbatzeko.`,
      gl: `${n} ${n === 1 ? 'apuntamento' : 'apuntamentos'} da franxa das ${franja} ${n === 1 ? 'ponse' : 'póñense'} ás ${hora} (hora de erguerse) para contar no día actual.`,
    };
    return Object.freeze({ ...avis, text: map[codi] });
  }
  if (avis.codi === 'totals-no-quadren') {
    const detall = /franges a (.+?): revisa/.exec(t)?.[1] || '';
    const map = {
      es: `Los totales de la hoja no cuadran con las franjas en ${detall}: revisa la hoja por si hay valores no legibles.`,
      en: `Sheet totals do not match slot sums in ${detall}: check the sheet for unreadable cells.`,
      eu: `Orriaren guztizkoak ez datoz bat tarteekin hemen: ${detall}. Berrikusi orria.`,
      gl: `Os totais da folla non cadran coas franxas en ${detall}: revisa a folla por se hai valores non lexibles.`,
    };
    return Object.freeze({ ...avis, text: map[codi] });
  }
  if (avis.codi === 'nit-jornada-anterior') {
    const m = /^(\d+) apunts? de la matinada \(abans de les (\d\d:\d\d)\)/.exec(t);
    const n = Number(m?.[1] || 1);
    const alcar = m?.[2] || '07:00';
    const map = {
      es: `${n} ${n === 1 ? 'apunte' : 'apuntes'} de madrugada (antes de las ${alcar}) ${n === 1 ? 'pasa' : 'pasan'} a la jornada del día anterior.`,
      en: `${n} early-morning ${n === 1 ? 'entry' : 'entries'} (before ${alcar}) ${n === 1 ? 'belongs' : 'belong'} to the previous care day’s night.`,
      eu: `Goizaldeko ${n} ohar (${alcar} baino lehenagokoak) aurreko eguneko jardunaldira doaz.`,
      gl: `${n} ${n === 1 ? 'apuntamento' : 'apuntamentos'} da madrugada (antes das ${alcar}) ${n === 1 ? 'vai' : 'van'} á xornada do día anterior.`,
    };
    return Object.freeze({ ...avis, text: map[codi] });
  }
  if (avis.codi === 'falta-mati-seguent') {
    const diesTxt = /la nit del (.+?) cal la primera/.exec(t)?.[1] || '';
    const map = {
      es: `Para cerrar la noche del ${diesTxt} falta la primera micción de la mañana siguiente: anótala en la app o importa también el día siguiente.`,
      en: `To close the night of ${diesTxt}, the first morning visit of the next day is needed: log it in the app or import the next day too.`,
      eu: `${diesTxt} eguneko gaua ixteko biharamun goizeko lehen pixa-egitea falta da: apuntatu aplikazioan edo inportatu hurrengo eguna ere.`,
      gl: `Para pechar a noite do ${diesTxt} falta a primeira micción da mañá seguinte: anótaa na app ou importa tamén o día seguinte.`,
    };
    return Object.freeze({ ...avis, text: map[codi] });
  }
  if (avis.codi === 'canvi-hora') {
    const diesTxt = /^El (.+?) canvia l’hora/.exec(t)?.[1] || '';
    const map = {
      es: `El ${diesTxt} cambia la hora oficial: las franjas de madrugada pueden desplazarse una hora.`,
      en: `Clocks change on ${diesTxt}: overnight slots may shift by one hour.`,
      eu: `${diesTxt} egunean ordu-aldaketa dago: goizaldeko tarteak ordubete mugi daitezke.`,
      gl: `O ${diesTxt} cambia a hora: as franxas da madrugada poden desprazarse unha hora.`,
    };
    return Object.freeze({ ...avis, text: map[codi] });
  }
  return avis;
}

const MOTIUS_DESCARTAT_FIXOS = Object.freeze({
  'És una fórmula: el full la calcula i no s’importa (escriu-hi el valor).': L4(
    'Es una fórmula: la hoja la calcula y no se importa (escribe el valor).',
    'Formula cell: calculated by the sheet and skipped (enter the plain number).',
    'Formula bat da: orriak kalkulatzen du eta ez da inportatzen (idatzi balioa).',
    'É unha fórmula: a folla calcúlaa e non se importa (escribe o valor).'
  ),
  'No és un volum en ml (un nombre sencer).': L4(
    'No es un volumen en ml (un número entero).',
    'Not a volume in ml (whole number expected).',
    'Ez da ml-tan emandako bolumen oso bat.',
    'Non é un volume en ml (un número enteiro).'
  ),
  'La micció d’esta franja no té un volum que es puga llegir: la urgència no es pot desar.': L4(
    'La micción de esta franja no tiene un volumen legible: la urgencia no se puede guardar.',
    'Bathroom visit in this slot has an unreadable volume: urgency cannot be saved.',
    'Tarte honetako pixa-egiteak ez du bolumen irakurgarria: larrialdia ezin da gorde.',
    'A micción desta franxa non ten un volume lexible: a urxencia non se pode gardar.'
  ),
  'Urgència sense micció a la mateixa franja.': L4(
    'Urgencia sin micción en la misma franja.',
    'Urgency without a bathroom visit in the same slot.',
    'Pixa-egiterik gabeko larrialdia tarte berean.',
    'Urxencia sen micción na mesma franxa.'
  ),
  'Fila sense hora.': L4('Fila sin hora.', 'Row without time.', 'Ordurik gabeko errenkada.', 'Fila sen hora.'),
  'Fila sense data o hora.': L4('Fila sin fecha u hora.', 'Row missing date or time.', 'Data edo ordurik gabeko errenkada.', 'Fila sen data ou hora.'),
  'Fila buida.': L4('Fila vacía.', 'Empty row.', 'Errenkada hutsa.', 'Fila baleira.'),
  'La beguda que no ha volgut no porta el volum al full.': L4(
    'La bebida rechazada no incluye el volumen en la hoja.',
    'Declined drink has no volume recorded in the sheet.',
    'Ukatutako edariak ez dakar bolumenik orrian.',
    'A bebida rexeitada non trae o volume na folla.'
  ),
  'Falta el volum de la beguda.': L4(
    'Falta el volumen de la bebida.',
    'Drink volume is missing.',
    'Edariaren bolumena falta da.',
    'Falta o volume da bebida.'
  ),
  'No s’entén quin moment del son és.': L4(
    'No se reconoce qué momento del sueño es.',
    'Unrecognised sleep event.',
    'Ez da ulertzen zein lo-une den.',
    'Non se entende que momento do sono é.'
  ),
  'El full no porta tots els camps d’este apunt: per a recuperar-lo, importa la còpia (.json).': L4(
    'La hoja no incluye todos los campos de este apunte: para recuperarlo, importa la copia (.json).',
    'This spreadsheet lacks required fields for this entry type: import a backup (.json) instead.',
    'Orriak ez ditu ohar honen eremu guztiak: berreskuratzeko, inportatu kopia (.json).',
    'A folla non trae todos os campos deste apuntamento: para recuperalo, importa a copia (.json).'
  ),
});

function tradueixMotiuDescartat(motiu, codi) {
  if (!motiu || codi === 'ca') return motiu;
  if (MOTIUS_DESCARTAT_FIXOS[motiu]?.[codi]) return MOTIUS_DESCARTAT_FIXOS[motiu][codi];
  let m = /^El grup «([^»]+)» no s’importa\.$/.exec(motiu);
  if (m) return { es: `El grupo «${m[1]}» no se importa.`, en: `Group “${m[1]}” is not imported.`, eu: `«${m[1]}» taldea ez da inportatzen.`, gl: `O grupo «${m[1]}» non se importa.` }[codi];
  m = /^La columna «([^»]+)» no s’importa\.$/.exec(motiu);
  if (m) return { es: `La columna «${m[1]}» no se importa.`, en: `Column “${m[1]}” is not imported.`, eu: `«${m[1]}» zutabea ez da inportatzen.`, gl: `A columna «${m[1]}» non se importa.` }[codi];
  m = /^Més d’una marca a «([^»]+)»/.exec(motiu);
  if (m) return { es: `Más de una marca en «${m[1]}» en la misma franja.`, en: `Multiple marks under “${m[1]}” in the same slot.`, eu: `Marka bat baino gehiago «${m[1]}» taldean tarte berean.`, gl: `Máis dunha marca en «${m[1]}» na mesma franxa.` }[codi];
  m = /^La marca de «([^»]+)» no és cap nivell/.exec(motiu);
  if (m) return { es: `La marca de «${m[1]}» no corresponde a un nivel válido.`, en: `Mark under “${m[1]}” does not match a valid level.`, eu: `«${m[1]}» taldeko marka ez dagokio baliozko maila bati.`, gl: `A marca de «${m[1]}» non corresponde a ningún nivel válido.` }[codi];
  m = /^La marca de «([^»]+)» porta un nombre/.exec(motiu);
  if (m) return { es: `La marca de «${m[1]}» lleva un número distinto al nivel de su columna.`, en: `Mark under “${m[1]}” contains a number different from its column level.`, eu: `«${m[1]}» taldeko markak bere zutabeko maila ez den zenbaki bat darama.`, gl: `A marca de «${m[1]}» leva un número distinto ao nivel da súa columna.` }[codi];
  m = /^No s’entén l’hora de «([^»]+)»\.$/.exec(motiu);
  if (m) return { es: `No se reconoce la hora de «${m[1]}».`, en: `Unrecognised time in “${m[1]}”.`, eu: `Ez da ulertzen «${m[1]}» eremuko ordua.`, gl: `Non se entende a hora de «${m[1]}».` }[codi];
  m = /^«([^»]+)» ha d’estar entre (\S+) i (\S+)\.$/.exec(motiu);
  if (m) return PLANTILLES_VALIDACIO[codi].rang(tr(m[1], codi), m[2], m[3]);
  return motiu;
}

export function propostaImportacioTraduida(proposta, idioma = 'ca') {
  const codi = codiDe(idioma);
  if (!proposta || codi === 'ca') return proposta;
  return Object.freeze({
    ...proposta,
    avisos: Object.freeze(proposta.avisos.map((avis) => tradueixAvisImportacio(avis, codi))),
    descartats: Object.freeze(proposta.descartats.map((d) => Object.freeze({
      ...d,
      motiu: tradueixMotiuDescartat(d.motiu, codi),
    }))),
  });
}

const ERRORS_FITXER_TR = Object.freeze({
  'El fitxer és buit.': L4('El archivo está vacío.', 'The file is empty.', 'Fitxategia hutsik dago.', 'O ficheiro está baleiro.'),
  'El fitxer passa de 20 MB: és massa gran per a ser un diari.': L4(
    'El archivo supera los 20 MB: es demasiado grande para ser un diario.',
    'File exceeds 20 MB: too large to be a care diary.',
    'Fitxategiak 20 MB gainditzen ditu: handiegia da egunkari bat izateko.',
    'O ficheiro pasa de 20 MB: é demasiado grande para ser un diario.'
  ),
  'El fitxer té massa cel·les per a llegir-lo ací.': L4(
    'El archivo tiene demasiadas celdas para leerlo aquí.',
    'File contains too many cells to process locally.',
    'Fitxategiak gelaxka gehiegi ditu hemen irakurtzeko.',
    'O ficheiro ten demasiadas celas para lelo aquí.'
  ),
});

export function errorLlegirFitxerSalut(errorCa, idioma = 'ca', reserva = '') {
  const codi = codiDe(idioma);
  if (codi === 'ca') return errorCa;
  return ERRORS_FITXER_TR[errorCa]?.[codi] || reserva || ERRORS_MAGATZEM[codi].DEFECTE;
}
