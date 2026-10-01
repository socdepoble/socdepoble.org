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
 * FALLADA TANCADA (de l'agenda): una resposta que no és una llista, o un acte
 * que no passa pel model d'esdeveniment, és «no ha respost». Mai mitja agenda.
 */
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from '../../app/contexts/RouterContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { ContentProvider } from '../../components/universal/ContentProvider';
import { Boto, Carregant, UniversalCard } from '../../components/PedraSeca/index.js';
import { fontsDeLActe } from '../../components/universal/EventCard.jsx';
import { DinsDelCalendari } from '../../components/universal/barres/pastillaCalendari.js';
import { dataHoraDeBarra, diaIso } from '../../components/universal/editorial.js';
import { getSectionListPath, objecteDePagina } from '../../config/navigation';
import { loadActesAgenda, teCapacitat } from '../../data/backendPort.js';
import { useSEO } from '../../hooks/useSEO';
import { CalendariMur } from '../mur/CalendariMur.jsx';
import { EstatErrorDades } from '../mur/EstatErrorDades.jsx';
import { useMur } from '../mur/MurContext';
import { TargetaDelMur } from '../mur/TargetaDelMur.jsx';
import { perMomentDescendent, targetesDeSistema } from '../mur/targetesMur.js';
import {
  TEXTOS_TARGETES, clauDeMes, diaDeLaClau, entradaDeLAgenda, entradesDelCalendari, entradesDelDia, entradesDelMes,
  mesDObertura, mesDeLaUrl, rangDelMes, recompteTargetes
} from './calendariGlobal.js';

const LOCALE = 'ca-ES';
const SENSE_AGENDA = Object.freeze({ fase: 'inactiu', entrades: Object.freeze([]) });

const nomDelMes = ({ any, mes }) => new Date(any, mes, 1).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });
const dataLlarga = (data) => data.toLocaleDateString(LOCALE, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Els actes de l'agenda de Sollutia del mes que es veu, com a entrades del
 * calendari. Sense la capacitat 'agenda', cap consulta i cap entrada.
 */
function useActesDeLAgenda({ any, mes }) {
  const disponible = teCapacitat('agenda');
  const [estat, setEstat] = useState(SENSE_AGENDA);
  const [intent, setIntent] = useState(0);

  useEffect(() => {
    // Sense capacitat declarada al contracte, no hi ha agenda que demanar.
    if (!disponible) return undefined;
    const control = new AbortController();
    const { desde, fins } = rangDelMes({ any, mes });
    setEstat({ fase: 'carregant', entrades: [] });

    // Promise.resolve().then(...) captura també els errors síncrons del backend.
    Promise.resolve()
      .then(() => loadActesAgenda({ desde: desde.toISOString(), fins: fins.toISOString() }, { signal: control.signal }))
      .then((actes) => {
        if (control.signal.aborted) return;
        if (!Array.isArray(actes)) throw new Error('Resposta d’agenda no vàlida.');
        const entrades = actes.map(entradaDeLAgenda);
        if (entrades.some((entrada) => !entrada)) throw new Error('Un acte de l’agenda no passa pel model d’esdeveniment.');
        setEstat({ fase: 'llest', entrades });
      })
      .catch((error) => {
        if (control.signal.aborted) return; // canvi de mes o desmuntatge: no és un error
        console.warn('[calendari] L’agenda de Sollutia no ha respost:', error?.message);
        setEstat({ fase: 'error', entrades: [] });
      });

    return () => control.abort();
  }, [disponible, any, mes, intent]);

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

/* El calendari i les targetes de davall. Es munta quan les dades del Mur ja
   han arribat: el mes d'obertura (mesDObertura) es tria amb totes les
   targetes, no amb la llista buida del carregant. */
function CalendariDeLesTargetes({ targetes }) {
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
  const agenda = useActesDeLAgenda(cursor);

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
  const titolLlista = diaTriat
    ? `Targetes del dia · ${dataTriada ? dataLlarga(dataTriada) : diaTriat}`
    : `Targetes del mes · ${nomDelMes(cursor)}`;

  return (
    <>
      <CalendariMur esdeveniments={esdeveniments} cursor={cursor} onCanviaCursor={canviaMes}
        diaTriat={diaTriat} onTriaDia={triaDia}
        textos={TEXTOS_TARGETES} locale={LOCALE} avui={avui} />

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
            ? 'Una targeta no es pot situar al calendari perquè no porta cap data o no té identificador: la trobaràs al Mur.'
            : `${senseData} targetes no es poden situar al calendari perquè no porten cap data o no tenen identificador: les trobaràs al Mur.`}
        </p>
      ) : null}

      <h2>{titolLlista}</h2>
      <p role="status">
        {visibles.length ? recompteTargetes(visibles.length) : (diaTriat ? 'Cap targeta este dia.' : 'Cap targeta este mes.')}
      </p>
      <div className="sdp-card-grid">
        {visibles.map((entrada) => (entrada.agenda
          ? <TargetaDeLAgenda key={entrada.clau} entrada={entrada} />
          : <TargetaDelMur key={entrada.clau} item={entrada.item} esdeveniment={entrada.acte} />))}
      </div>
    </>
  );
}

export default function CalendariSection() {
  const { status, error, refresh, sortedEvents, sortedFeedPosts, sortedMarketItems } = useMur();
  const { pageCopy } = useCoreContent();
  const { t } = useUIActions();

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
            <Carregant etiqueta={t('loading.content', 'Carregant contingut del poble...')} />
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
              amb el que tinga (l'agenda de Sollutia, si respon). */}
          {status === 'error' ? (
            <EstatErrorDades titol={t('section.calendari.error', 'No s’han pogut carregar les targetes del calendari')}
              error={error} onReintenta={refresh} />
          ) : null}
          {/* Dins del Calendari, la pastilla de les targetes reemplaça
              l'entrada de l'historial (revisió del carril A, P3): tres
              pastilles del mes que ja es veu no han de demanar quatre
              «Enrere» per a tornar d'on es venia. */}
          <DinsDelCalendari.Provider value>
            <CalendariDeLesTargetes targetes={targetes} />
          </DinsDelCalendari.Provider>
        </div>
      </UniversalPage>
    </ContentProvider>
  );
}
