/**
 * CalendariSection.jsx — la pàgina /calendari: el calendari de TOTES les
 * targetes del poble.
 *
 * Ordre del Mestre, 261001 · Abans era AgendaSection (sections/agenda/, ara
 * sense cap importador): l'agenda de Sollutia i res més, i sense la capacitat
 * 'agenda' tota la pàgina era l'Alerta «El calendari no està disponible». Ara
 * munta el MATEIX calendari del Mur (CalendariMur) amb totes les targetes que
 * existixen: les publicacions, els actes i els productes del Mur i del Mercat
 * (useMur) i les pàgines del sistema que el Mur hi barreja
 * (targetesDeSistema). Cada targeta va al dia de la seua data
 * (calendariGlobal.js). Davall del calendari, les targetes del dia triat
 * (?date=, el mateix paràmetre del Mur: clicar un dia el posa i tornar-lo a
 * clicar el lleva) o, sense dia, TOTES les del mes que es veu, de la més nova
 * a la més vella, amb la MATEIXA targeta del Mur (TargetaDelMur).
 *
 * Ordre del Mestre, 261001 (carril A) · El mes que es veu el governa la URL,
 * sense cap estat propi (calendariGlobal.js · mesDeLaUrl): el del ?date=; si
 * no, el del ?mes=AAAA-MM, on porta la pastilla de les targetes («el
 * Calendari ubicat exactament en el mes i l’any […] en què es va publicar
 * eixa targeta»); si no, el de hui o, si hui no en té cap, el de la targeta
 * més recent (mesDObertura): mai en un mes buit havent-hi targetes. Les
 * fletxes i «Hui» escriuen el ?mes= i lleven el ?date=: la graella i la
 * llista de davall mostren sempre el mateix període.
 *
 * Model B i Directiva Suprema (AGENTS.md §8) · L'agenda de Sollutia no
 * s'esborra: si el backend declara la capacitat 'agenda' (teCapacitat), els
 * seus actes del mes que es veu s'afigen al mateix calendari i a la llista.
 * Sense la capacitat, el calendari funciona igual amb les targetes del poble i
 * no en diu res; si la consulta falla, ho diu en una línia i deixa tornar-ho a
 * provar. Mai l'Alerta que tapava la pàgina. FRONTERA: esta secció continua
 * sense importar cap adaptador; només el port.
 *
 * FALLADA TANCADA (de l'agenda): una resposta que no és una llista, un acte
 * que no passa pel model d'esdeveniment o el mateix acte dos vegades (el
 * mateix identificador i el mateix inici) és «no ha respost». Mai mitja agenda.
 *
 * T10 (ordre del Mestre, 261001) · Amb ?vista=setmana o ?vista=mes, la pàgina
 * munta les vistes a l'estil Google Calendar (VistaSetmana, VistaMes i
 * NavegacioPeriode, esquelet de Pedra Seca), amb l'estat a la URL
 * (estatCalendari.js). Sense, o amb qualsevol altre valor, el calendari d'ara
 * (CalendariDeLesTargetes), idèntic: Llei del Píxel. Les dues versions
 * compartixen els avisos i les targetes de davall.
 *
 * Fase visual (prompt 261001_0445) · Cinc vistes: Setmana, Dues setmanes
 * (VistaMes amb dos files des d'un dilluns), Mes, Any (VistaAny: un dia obri
 * la seua setmana) i Agenda (VistaAgenda: el mes, des de hui si és el mes en
 * curs). La llista de davall diu el període de la vista (estatCalendari.js ·
 * rangDeLaVista), i la pastilla de les targetes porta a la vista Mes d'eixe
 * mes sense eixir de les vistes noves.
 *
 * Ordre del Mestre, 261001 · Pantalla completa: un botó a la barra del
 * calendari (al final de «‹ Hui ›» i, a les vistes noves, entre el títol i
 * el selector) porta tot el bloc (navegació, vista, avisos i targetes, i
 * l'error del Mur si n'hi ha) a una PantallaCompleta de Pedra Seca, que tapa
 * la barra lateral i les de dalt.
 * L'estat viu ací (usePantallaCompleta), per damunt de la càrrega del Mur:
 * un refresc no en trau ningú. És efímer: cap paràmetre a la URL.
 */
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from '../../app/contexts/RouterContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { ContentProvider } from '../../components/universal/ContentProvider';
import {
  Boto, BotoPantallaCompleta, Carregant, NavegacioPeriode, PantallaCompleta, UniversalCard, VistaAgenda, VistaAny, VistaMes, VistaSetmana,
  usePantallaCompleta
} from '../../components/PedraSeca/index.js';
import { fontsDeLActe } from '../../components/universal/EventCard.jsx';
import { DinsDelCalendari } from '../../components/universal/barres/pastillaCalendari.js';
import { RUTA_CALENDARI, dataHoraDeBarra, diaIso } from '../../components/universal/editorial.js';
import { getSectionListPath, objecteDePagina } from '../../config/navigation';
import { loadActesAgenda, teCapacitat } from '../../data/backendPort.js';
import { useSEO } from '../../hooks/useSEO';
import { recurrenciaSuportada } from '../../utils/esdeveniment.js';
import { clauDeData, sumaDies } from '../../utils/periodes.js';
import { CalendariMur } from '../mur/CalendariMur.jsx';
import { EstatErrorDades } from '../mur/EstatErrorDades.jsx';
import { useMur } from '../mur/MurContext';
import { TargetaDelMur } from '../mur/TargetaDelMur.jsx';
import { perMomentDescendent, targetesDeSistema } from '../mur/targetesMur.js';
import {
  TEXTOS_TARGETES, clauDeMes, cursorDeMes, diaDeLaClau, entradaDeLAgenda, entradesDelCalendari, entradesDelDia, entradesDelMes,
  entradesDelRang, mesDObertura, mesDeLaUrl, rangDelMes, recompteTargetes
} from './calendariGlobal.js';
import { SETMANES_DEL_MES, rangDeLaVista, vistaDeLaUrl } from './estatCalendari.js';
import { useEstatCalendari } from './useEstatCalendari.js';

const LOCALE = 'ca-ES';
const SENSE_AGENDA = Object.freeze({ fase: 'inactiu', entrades: Object.freeze([]) });
/* El nom accessible del diàleg de la pantalla completa. */
const TITOL_PANTALLA = 'Calendari a pantalla completa';

const nomDelMes = ({ any, mes }) => new Date(any, mes, 1).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });
const dataLlarga = (data) => data.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Els actes de l'agenda de Sollutia del període que es veu ({ desde, fins },
 * dos Date), com a entrades del calendari. Sense la capacitat 'agenda', cap
 * consulta i cap entrada. T10 (261001) · Rep el rang i no el mes: el calendari
 * d'ara li passa el mes natural (rangDelMes, com sempre) i les vistes noves, el
 * que es veu (la setmana o les sis setmanes de la graella).
 */
function useActesDeLAgenda({ desde: dataDesde, fins: dataFins }) {
  const disponible = teCapacitat('agenda');
  const [estat, setEstat] = useState(SENSE_AGENDA);
  const [intent, setIntent] = useState(0);
  const [desde, fins] = [dataDesde.toISOString(), dataFins.toISOString()];

  useEffect(() => {
    // Sense capacitat declarada al contracte, no hi ha agenda que demanar.
    if (!disponible) return undefined;
    const control = new AbortController();
    setEstat({ fase: 'carregant', entrades: [] });

    // Promise.resolve().then(...) captura també els errors síncrons del backend.
    Promise.resolve()
      .then(() => loadActesAgenda({ desde, fins }, { signal: control.signal }))
      .then((actes) => {
        if (control.signal.aborted) return;
        if (!Array.isArray(actes)) throw new Error('Resposta d’agenda no vàlida.');
        const entrades = actes.map(entradaDeLAgenda);
        if (entrades.some((entrada) => !entrada)) throw new Error('Un acte de l’agenda no passa pel model d’esdeveniment.');
        /* Revisió adversarial (prompt 261001_1140) · El mateix acte dos
           vegades (el mateix id i el mateix inici) és la mateixa clau a les
           vistes i a les targetes: React els duplicava o se'n menjava un.
           Fallada tancada, com la resta. El mateix id en dies diferents (un
           acte que es repetix, expandit) són actes distints i es pinten tots
           (calendariGlobal.js · entradaDeLAgenda). */
        if (new Set(entrades.map((entrada) => entrada.clau)).size !== entrades.length) throw new Error('Dos actes de l’agenda porten el mateix identificador i el mateix inici.');
        setEstat({ fase: 'llest', entrades });
      })
      .catch((error) => {
        if (control.signal.aborted) return; // canvi de mes o desmuntatge: no és un error
        console.warn('[calendari] L’agenda de Sollutia no ha respost:', error?.message);
        setEstat({ fase: 'error', entrades: [] });
      });

    return () => control.abort();
  }, [disponible, desde, fins, intent]);

  return { ...(disponible ? estat : SENSE_AGENDA), reintenta: () => setIntent((i) => i + 1) };
}

/* Un acte de l'agenda de Sollutia: la targeta universal amb el títol, el lloc
   i la pastilla del seu inici (la regla de la barra taronja: sempre plena).
   No porta cap enllaç: l'acte no té pàgina a Sóc de Poble. */
function TargetaDeLAgenda({ entrada }) {
  const esdeveniment = entrada.acte;
  const data = dataHoraDeBarra(fontsDeLActe(esdeveniment));
  return (
    <UniversalCard title={esdeveniment.titol} body={esdeveniment.lloc || undefined}
      date={data.date} time={data.time} dateTime={data.dateTime} />
  );
}

/* Els avisos de davall del calendari: l'agenda que no respon i les targetes
   que no es poden situar. T10 (261001) · Peça compartida pel calendari d'ara
   i per les vistes noves; el DOM és el mateix que abans d'extraure-la. */
function AvisosDelCalendari({ agenda, senseData }) {
  return (
    <>
      {agenda.fase === 'error' ? (
        <p role="status">
          Ara mateix no podem consultar els actes de l’agenda: el calendari mostra només les targetes del poble.{' '}
          <Boto varietat="fantasma" onClick={agenda.reintenta}>Torna a provar</Boto>
        </p>
      ) : null}
      {/* Revisió del carril A (ordre del Mestre, 261001) · Una targeta sense
          esdeveniment no ix ni a la graella ni a la llista, i l'avís diu la
          veritat: pot ser que no porte data o que no tinga identificador
          (abans deia «no porta cap data», fals per a la segona). */}
      {senseData ? (
        <p>
          {senseData === 1
            ? 'Una publicació no es pot situar al calendari perquè no porta cap data o no té identificador: la trobaràs al Mur.'
            : `${senseData} publicacions no es poden situar al calendari perquè no porten cap data o no tenen identificador: les trobaràs al Mur.`}
        </p>
      ) : null}
    </>
  );
}

/* Les targetes de davall, amb la MATEIXA targeta del Mur. T10 (261001) · Peça
   compartida, com AvisosDelCalendari; `buit` és el que diu sense cap targeta. */
function TargetesDeDavall({ visibles, buit }) {
  return (
    <>
      <h4 role="status">
        {visibles.length ? recompteTargetes(visibles.length) : buit}
      </h4>
      <div className="sdp-card-grid">
        {visibles.map((entrada) => (entrada.agenda
          ? <TargetaDeLAgenda key={entrada.clau} entrada={entrada} />
          : <TargetaDelMur key={entrada.clau} item={entrada.item} esdeveniment={entrada.acte} />))}
      </div>
    </>
  );
}

/* El calendari i les targetes de davall. Es munta quan les dades del Mur ja
   han arribat: el mes d'obertura (mesDObertura) es tria amb totes les
   targetes, no amb la llista buida del carregant. */
function CalendariDeLesTargetes({ targetes, pantalla, avisError }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const diaTriat = searchParams.get('date') || null;
  const mesTriat = searchParams.get('mes') || null;
  const avui = new Date();
  const hui = diaIso(avui);

  /* Ordre del Mestre, 261001 (carril A) · El mes que es veu el diu la URL
     (mesDeLaUrl), cap useState: el ?date=, el ?mes= o el mes d'obertura. El
     porta la pàgina (i no el calendari sol) perquè la llista de davall i
     l'agenda de Sollutia sàpien quin mes és. El mes d'obertura es recalcula
     quan canvien les targetes: les pàgines del sistema del CoreContent poden
     arribar després de les del Mur, i abans el mes quedava fixat amb la
     primera llista (revisió, P3). Depén del dia (`hui`), no de l'instant:
     el mateix mes tot el dia, sense recalcular-lo a cada pintada. */
  const obertura = useMemo(() => mesDObertura(targetes, diaDeLaClau(hui)), [targetes, hui]);
  const { any, mes } = mesDeLaUrl({ date: diaTriat, mes: mesTriat }, obertura);
  const cursor = useMemo(() => ({ any, mes }), [any, mes]);
  const rangMes = useMemo(() => rangDelMes(cursor), [cursor]);
  const agenda = useActesDeLAgenda(rangMes);

  /* Les fletxes i «Hui» escriuen el mes nou al ?mes= i lleven el ?date=: la
     llista no es pot quedar en un dia que la graella ja no mostra (revisió,
     P2: amb un dia triat i l'agenda de Sollutia, passar de mes demanava els
     actes del mes nou i la llista, filtrada al dia vell, els perdia). Clicar
     un dia el posa al ?date= (que ja porta el mes) i lleva el ?mes=; tornar-lo
     a clicar el lleva i deixa escrit el mes que es veu. `replace`: moure's
     pel calendari no omple l'historial, com abans (el valor per defecte de
     setSearchParams, dit ací en veu alta). */
  const canviaMes = (nou) => setSearchParams({ mes: clauDeMes(nou), date: null }, { replace: true });
  const triaDia = (dia) => setSearchParams(dia ? { date: dia, mes: null } : { date: null, mes: clauDeMes(cursor) }, { replace: true });

  const entrades = useMemo(
    () => (agenda.entrades.length ? [...targetes, ...agenda.entrades].sort(perMomentDescendent) : targetes),
    [targetes, agenda.entrades]
  );
  const esdeveniments = useMemo(() => entrades.map((entrada) => entrada.esdeveniment).filter(Boolean), [entrades]);
  const visibles = useMemo(
    () => (diaTriat ? entradesDelDia(entrades, diaTriat) : entradesDelMes(entrades, cursor)),
    [entrades, diaTriat, cursor]
  );
  const senseData = targetes.filter((entrada) => !entrada.esdeveniment).length;

  const dataTriada = diaTriat ? diaDeLaClau(diaTriat) : null;
  const titolSuperior = new Date(cursor.any, cursor.mes, 1).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });
  /* Pantalla completa · el botó tanca la fila «‹ Hui ›», amb la pell dels
     seus veïns (secundari). Dins del diàleg no hi és: la franja ja porta «Eixir». */
  const boto = pantalla.oberta ? null : <BotoPantallaCompleta id={pantalla.idObridor} onClick={pantalla.obri} varietat="secundari" />;

  return (
    <PantallaCompleta oberta={pantalla.oberta} onTanca={pantalla.tanca} titol={TITOL_PANTALLA}>
      {avisError}
      <h3 className="sdp-cal-titol-superior" aria-live="polite">
        {titolSuperior.charAt(0).toUpperCase() + titolSuperior.slice(1)}
      </h3>
      <CalendariMur esdeveniments={esdeveniments} cursor={cursor} onCanviaCursor={canviaMes}
        diaTriat={diaTriat} onTriaDia={triaDia}
        textos={TEXTOS_TARGETES} locale={LOCALE} avui={avui} accions={boto} />
      <AvisosDelCalendari agenda={agenda} senseData={senseData} />
      <TargetesDeDavall visibles={visibles} buit={diaTriat ? 'Cap publicació este dia.' : 'Cap publicació este mes.'} />
    </PantallaCompleta>
  );
}

const MES_PER_PAS = Object.freeze({ anterior: 'Mes anterior', hui: 'Hui', seguent: 'Mes següent' });
const ETIQUETES_PERIODE = Object.freeze({
  setmana: Object.freeze({ anterior: 'Setmana anterior', hui: 'Hui', seguent: 'Setmana següent' }),
  'dues-setmanes': Object.freeze({ anterior: 'Dues setmanes anteriors', hui: 'Hui', seguent: 'Dues setmanes següents' }),
  mes: MES_PER_PAS,
  any: Object.freeze({ anterior: 'Any anterior', hui: 'Hui', seguent: 'Any següent' }),
  agenda: MES_PER_PAS
});
/* Fase visual · La densitat de Setmana, Dues setmanes i Mes: la responsiva
   (decisió per defecte; la compacta només amb ratolí). */
const DENSITAT = 'responsiva';
const dataSenseDiaDeLaSetmana = (data) => data.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
/* Un rang semiobert [desde, fins) en text: «28 de setembre – 4 d’octubre de 2026». */
const nomDelRang = ({ desde, fins }) => `${dataSenseDiaDeLaSetmana(desde)} – ${dataSenseDiaDeLaSetmana(sumaDies(fins, -1))}`;
/* «de setembre de 2026», «d’octubre de 2026»: la preposició s'apostrofa davant de vocal. */
const ambDe = (text) => (/^[aeiouàèéíòóú]/i.test(text) ? `d’${text}` : `de ${text}`);

/* Fase visual · Dins de les vistes noves, la pastilla de les targetes porta a
   la vista Mes d'eixe mes (pastillaCalendari.js): abans tornava al calendari
   d'ara. Sense un mes vàlid, a la vista Mes sense mes (el d'obertura). */
const rutaDeLaPastilla = (mes) => (cursorDeMes(mes) ? `${RUTA_CALENDARI}?vista=mes&mes=${mes}` : `${RUTA_CALENDARI}?vista=mes`);

/* Els textos de cada vista: el títol de la navegació, el nom de la regió i
   el títol i el buit de la llista de davall (sense dia triat). */
function textosDeLaVista(vista, cursor, rang) {
  if (vista === 'setmana') {
    const periode = nomDelRang(rang);
    return { periode, regio: `Calendari de la setmana del ${periode}`, llista: `Publicacions de la setmana · ${periode}`, buit: 'Cap publicació esta setmana.' };
  }
  if (vista === 'dues-setmanes') {
    const periode = nomDelRang(rang);
    return { periode, regio: `Calendari de les dues setmanes del ${periode}`, llista: `Publicacions de les dues setmanes · ${periode}`, buit: 'Cap publicació estes dues setmanes.' };
  }
  if (vista === 'any') {
    const periode = String(cursor.any);
    return { periode, regio: `Calendari de l’any ${periode}`, llista: `Publicacions de l’any · ${periode}`, buit: 'Cap publicació este any.' };
  }
  const periode = nomDelMes(cursor);
  if (vista === 'agenda') {
    return { periode, regio: `Agenda ${ambDe(periode)}`, llista: `Publicacions de l’agenda · ${nomDelRang(rang)}`, buit: 'Cap publicació en este període.' };
  }
  const nomMesLlarg = new Date(cursor.any, cursor.mes, 1).toLocaleDateString(LOCALE, { month: 'long' });
  const llistaMes = nomMesLlarg.charAt(0).toUpperCase() + nomMesLlarg.slice(1);
  return { periode, regio: `Calendari ${ambDe(periode)}`, llista: llistaMes, buit: 'Cap publicació este mes.' };
}

/* T10 (ordre del Mestre, 261001) · Les vistes a l'estil Google Calendar,
   només amb un ?vista= de la llista. La URL governa l'estat
   (useEstatCalendari: ?vista=, ?setmana=, ?date=, ?mes=, ?any=), l'agenda de
   Sollutia es demana per al període que es veu i la llista de davall diu el
   mateix període que la vista: el dia triat, la setmana, les dues setmanes,
   el mes, l'any o l'agenda (estatCalendari.js · rangDeLaVista). */
function CalendariDeLesVistes({ targetes, pantalla, avisError }) {
  const hui = diaIso(new Date());
  const avui = useMemo(() => diaDeLaClau(hui), [hui]);
  const obertura = useMemo(() => mesDObertura(targetes, avui), [targetes, avui]);
  const { estat, navega, canviaVista, triaDia, obriDia } = useEstatCalendari({ obertura, avui });
  const { vista, diaTriat, cursor, dilluns } = estat;
  const rang = useMemo(() => rangDeLaVista(estat, avui), [estat, avui]);
  const agenda = useActesDeLAgenda(rang);

  const entrades = useMemo(
    () => (agenda.entrades.length ? [...targetes, ...agenda.entrades].sort(perMomentDescendent) : targetes),
    [targetes, agenda.entrades]
  );
  const esdeveniments = useMemo(() => entrades.map((entrada) => entrada.esdeveniment).filter(Boolean), [entrades]);
  /* Revisió de T10 · Un acte amb una recurrència que no es pinta (FALLA) no
     té cap ocurrència a la graella, però la llista de davall el du el dia que
     comença: es diu, amb el mateix paràgraf que el calendari d'ara
     (CalendariMur), perquè la graella i la llista no discrepen en silenci. */
  const sensePintar = useMemo(() => esdeveniments.filter((esd) => !recurrenciaSuportada(esd)).length, [esdeveniments]);
  /* La llista de davall: el dia triat; el mes natural a la vista Mes (com
     sempre); i a la resta, el rang que pinta la vista. L'Agenda no marca ni
     deixa llevar el dia triat que hereta de Mes o de Setmana: la llista diu
     el seu rang, que ja el conté (rangDeLaVista). */
  const delDia = vista === 'agenda' ? null : diaTriat;
  const visibles = useMemo(() => {
    if (delDia) return entradesDelDia(entrades, delDia);
    if (vista === 'mes') return entradesDelMes(entrades, cursor);
    return entradesDelRang(entrades, { desde: clauDeData(rang.desde), fins: clauDeData(rang.fins) });
  }, [entrades, delDia, vista, cursor, rang]);
  const senseData = targetes.filter((entrada) => !entrada.esdeveniment).length;

  const textos = textosDeLaVista(vista, cursor, rang);
  const titolLlista = delDia ? `Publicacions del dia · ${dataLlarga(diaDeLaClau(delDia))}` : textos.llista;
  const buit = delDia ? 'Cap publicació este dia.' : textos.buit;
  const comunes = { esdeveniments, avui, recompte: recompteTargetes, locale: LOCALE, titol: textos.regio };
  /* Pantalla completa · entre el títol i el selector, amb la pell de les
     fletxes (fantasma). L'estat de la URL i l'agenda queden per damunt:
     entrar o eixir no torna a demanar res. */
  const boto = pantalla.oberta ? null : <BotoPantallaCompleta id={pantalla.idObridor} onClick={pantalla.obri} />;

  const titolSuperior = textos.periode.charAt(0).toUpperCase() + textos.periode.slice(1);

  return (
    <PantallaCompleta oberta={pantalla.oberta} onTanca={pantalla.tanca} titol={TITOL_PANTALLA}>
      {avisError}
      <h3 className="sdp-cal-titol-superior" aria-live="polite">{titolSuperior}</h3>
      <NavegacioPeriode titol={null} etiquetes={ETIQUETES_PERIODE[vista]}
        onAnterior={() => navega('anterior')} onHui={() => navega('hui')} onSeguent={() => navega('seguent')}
        vista={vista} onCanviaVista={canviaVista} accions={boto} />
      {vista === 'setmana' ? (
        <VistaSetmana {...comunes} dilluns={dilluns} diaTriat={diaTriat} onTriaDia={triaDia} densitat={DENSITAT} />
      ) : null}
      {/* Mes i Dues setmanes: la mateixa anatomia (VistaMes); Dues setmanes, dos files des del dilluns. */}
      {vista === 'mes' || vista === 'dues-setmanes' ? (
        <VistaMes {...comunes} cursor={cursor} dilluns={vista === 'dues-setmanes' ? dilluns : null}
          setmanes={vista === 'dues-setmanes' ? 2 : SETMANES_DEL_MES} diaTriat={diaTriat} onTriaDia={triaDia} densitat={DENSITAT} />
      ) : null}
      {/* Any: clicar un dia obri la seua setmana, amb el dia triat (obriDia). */}
      {vista === 'any' ? <VistaAny {...comunes} any={cursor.any} diaTriat={diaTriat} onTriaDia={obriDia} /> : null}
      {vista === 'agenda' ? <VistaAgenda {...comunes} desde={rang.desde} fins={rang.fins} buit="Cap publicació en este període." /> : null}
      {sensePintar ? <p>{TEXTOS_TARGETES.sensePintar(sensePintar)}</p> : null}
      <AvisosDelCalendari agenda={agenda} senseData={senseData} />
      <TargetesDeDavall visibles={visibles} buit={buit} />
    </PantallaCompleta>
  );
}

/* T10 · Sense un ?vista= de la llista, el calendari d'ara, idèntic (Llei del
   Píxel); amb, les vistes noves. Dins del Calendari, la pastilla de les
   targetes reemplaça l'entrada de l'historial (revisió del carril A, P3):
   tres pastilles del mes que ja es veu no han de demanar quatre «Enrere» per
   a tornar d'on es venia. Al calendari d'ara, el context és `true` (porta al
   ?mes= de sempre); a les vistes noves, la ruta de la vista Mes. El
   proveïdor no pinta res: el DOM del calendari d'ara no canvia.
   Pantalla completa · `avisError` és l'error del Mur, que cada calendari pinta
   com a primer fill de la PantallaCompleta: tancada, davant del calendari com
   abans; oberta, dins del diàleg, on «Torna-ho a provar» es pot clicar. */
function CalendariSegonsLaVista({ targetes, pantalla, avisError }) {
  const [searchParams] = useSearchParams();
  return vistaDeLaUrl(searchParams.get('vista')) ? (
    <DinsDelCalendari.Provider value={rutaDeLaPastilla}>
      <CalendariDeLesVistes targetes={targetes} pantalla={pantalla} avisError={avisError} />
    </DinsDelCalendari.Provider>
  ) : (
    <DinsDelCalendari.Provider value>
      <CalendariDeLesTargetes targetes={targetes} pantalla={pantalla} avisError={avisError} />
    </DinsDelCalendari.Provider>
  );
}

export default function CalendariSection() {
  const { status, error, refresh, sortedEvents, sortedFeedPosts, sortedMarketItems } = useMur();
  const { pageCopy } = useCoreContent();
  const { t } = useUIActions();
  /* Pantalla completa · ací, per damunt de la branca de càrrega: un refresc
     del Mur no en trau ningú. */
  const pantalla = usePantallaCompleta();

  useSEO({
    title: t('section.events.calendarMeta', 'Calendari'),
    description: t('section.calendari.subtitle', 'Cada publicació, acte i producte, el dia de la seua data.')
  });

  const pagines = useMemo(() => targetesDeSistema(pageCopy), [pageCopy]);
  const targetes = useMemo(
    () => entradesDelCalendari(sortedEvents, sortedFeedPosts, sortedMarketItems, pagines),
    [sortedEvents, sortedFeedPosts, sortedMarketItems, pagines]
  );

  const config = {
    title: t('section.events.calendarMeta', 'Calendari'),
    subtitle: t('section.calendari.title', 'Totes les targetes del poble'),
    lead: t('section.calendari.subtitle', 'Cada publicació, acte i producte, el dia de la seua data.'),
    chrome: 'system',
    showLogos: true
  };
  /* El xat comú i el Connectar de la pàgina, els de la seua ruta canònica: ni
     el ?date= ni el ?mes= en fan cap altra. */
  const paginaCalendari = objecteDePagina({ titol: config.title, ruta: getSectionListPath('calendari') });

  if (status === 'loading') {
    return (
      <ContentProvider initialConfig={config}>
        <UniversalPage objecte={paginaCalendari}>
          <div className="content-wrapper">
            {/* Tancada, no afig cap node; oberta, «Eixir» continua a mà mentre torna el calendari. */}
            <PantallaCompleta oberta={pantalla.oberta} onTanca={pantalla.tanca} titol={TITOL_PANTALLA}>
              <Carregant etiqueta={t('loading.content', 'Carregant contingut del poble...')} />
            </PantallaCompleta>
          </div>
        </UniversalPage>
      </ContentProvider>
    );
  }

  return (
    <ContentProvider initialConfig={config}>
      <UniversalPage layout="contained" objecte={paginaCalendari}>
        <div className="content-wrapper">
          {/* L'error del Mur es queda dins de la pàgina: el calendari continua
              amb el que tinga (l'agenda de Sollutia, si respon). Va dins del
              bloc de la pantalla completa: fora, el modal el deixaria inert i
              el calendari diria «Cap publicació» sense cap avís. El context
              de la pastilla (DinsDelCalendari) el posa CalendariSegonsLaVista:
              depén de la vista. */}
          <CalendariSegonsLaVista targetes={targetes} pantalla={pantalla} avisError={status === 'error' ? (
            <EstatErrorDades titol={t('section.calendari.error', 'No s’han pogut carregar les targetes del calendari')}
              error={error} onReintenta={refresh} />
          ) : null} />
        </div>
      </UniversalPage>
    </ContentProvider>
  );
}
