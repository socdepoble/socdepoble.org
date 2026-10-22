/**
 * CalendariSection.jsx — la pàgina /calendari: el calendari de TOTES les
 * targetes del poble.
 *
 * Ordre del Mestre, 261001 · Abans era AgendaSection (sections/agenda/, ara
 * sense cap importador): l'agenda de Sollutia i res més, i sense la capacitat
 * 'agenda' tota la pàgina era l'Alerta «El calendari no està disponible». Ara
 * pinta totes les targetes que existixen (des de P6, 261003, a les vistes de
 * Google Calendar, i no al calendari del Mur): les publicacions, els actes i
 * els productes del Mur i del Mercat (useMur) i les pàgines del sistema que
 * el Mur hi barreja (targetesDeSistema). Cada targeta va al dia de la seua data
 * (calendariGlobal.js). Davall del calendari, les targetes del dia triat
 * (?date=, el mateix paràmetre del Mur: clicar un dia el posa i tornar-lo a
 * clicar el lleva) o, sense dia, TOTES les del mes que es veu, de la més nova
 * a la més vella, amb la MATEIXA targeta del Mur (TargetaDelMur).
 *
 * Ordre del Mestre, 261001 (carril A) · El mes que es veu el governa la URL,
 * sense cap estat propi (estatCalendari.js · estatDeLaUrl): el del ?date=;
 * si no, el del ?mes=AAAA-MM, on porta la pastilla de les targetes («el
 * Calendari ubicat exactament en el mes i l’any […] en què es va publicar
 * eixa targeta»); si no, el de hui o, si hui no en té cap, el de la targeta
 * més recent (mesDObertura): mai en un mes buit havent-hi targetes. Les
 * fletxes i «Hui» escriuen el període i lleven el ?date=: la graella i la
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
 * (estatCalendari.js).
 *
 * Ordre del Mestre, 261003 (P6 de l'onada de producció) · «La vista mensual
 * actual és massa bàsica»: sense ?vista=, la pàgina pintava el calendari de
 * la pestanya del Mur (CalendariMur: cel·les buides als mesos veïns, una
 * píndola de títol per dia, sense «+N més» ni selector de vista), i cap enllaç
 * de l'app duia a les vistes noves. Ara /calendari obri SEMPRE les vistes
 * noves, i sense ?vista= (o amb un valor que no és cap vista) la vista Mes:
 * el clon d'estructura de Google Calendar amb la pell de Pedra Seca. Les URL
 * d'abans (?mes= de la pastilla, ?date=) obrin el mateix mes. (Llavors
 * CalendariMur es quedava a la pestanya Calendari del Mur; des de l'Onada 6,
 * vegeu davall, ja no.)
 *
 * Onada 6 (prompt 261009_0230, punt 1) · Un sol calendari: el cos (la
 * navegació amb el títol a la mateixa fila, les vistes, els avisos i les
 * targetes de davall) és CalendariDelPoble, que munta també la pestanya
 * Calendari del Mur (CalendariMur queda sense importador). Clicar un
 * esdeveniment porta a la pàgina de la seua publicació (al Mes i a la
 * Setmana, amb ratolí; a l'Agenda, també amb el dit); clicar el dia, fora de
 * l'enllaç, en mostra les targetes davall (en tàctil, també tocar un
 * esdeveniment del Mes o de la Setmana). Ací queden el
 * contenidor i el que és només de la pàgina: l'estat de la URL, l'agenda de
 * Sollutia, les fonts de Google, la pantalla completa i la pastilla dins del
 * Calendari.
 *
 * Fase visual (prompt 261001_0445) · Cinc vistes: Setmana, Dues setmanes
 * (VistaMes amb dos files des d'un dilluns), Mes, Any (VistaAny: un dia obri
 * la seua setmana) i Agenda (VistaAgenda: el mes, des de hui si és el mes en
 * curs). La llista de davall diu el període de la vista (estatCalendari.js ·
 * rangDeLaVista), i la pastilla de les targetes porta a la vista Mes d'eixe
 * mes.
 *
 * Ordre del Mestre, 261001 · Pantalla completa: un botó a la barra del
 * calendari (entre el títol i el selector de vista) porta tot el bloc
 * (navegació, vista, avisos i targetes, i l'error del Mur si n'hi ha) a una
 * PantallaCompleta de Pedra Seca, que tapa la barra lateral i les de dalt.
 * L'estat viu ací (usePantallaCompleta), per damunt de la càrrega del Mur:
 * un refresc no en trau ningú. És efímer: cap paràmetre a la URL.
 *
 * T1 (prompt comú 261002_0125) · Fonts de calendari de fora (fonts/): amb
 * Google Calendar configurat (fonts/configFonts.js), el calendari va al
 * costat del panell «Els meus calendaris» i les entrades de les fonts
 * marcades s'hi barregen com les de l'agenda de Sollutia, en totes les
 * vistes. La pàgina només coneix el contracte de fonts, no Google. Sense
 * configuració, ni panell ni peticions: la pantalla d'ara, idèntica. Amb el
 * client de Google però sense poder-lo usar ací (incrustada sense adreça de
 * tornada, o mal configurat), un avís davant del calendari diu per què
 * (auditoria Codex, punt 23).
 */
import { useEffect, useMemo, useState } from 'react';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { ContentProvider } from '../../components/universal/ContentProvider';
import {
  Alerta, Boto, BotoPantallaCompleta, Carregant, PantallaCompleta, usePantallaCompleta
} from '../../components/PedraSeca/index.js';
import { DinsDelCalendari } from '../../components/universal/barres/pastillaCalendari.js';
import { RUTA_CALENDARI, diaIso } from '../../components/universal/editorial.js';
import { getSectionListPath, objecteDePagina } from '../../config/navigation';
import { loadActesAgenda, teCapacitat } from '../../data/backendPort.js';
import { useSEO } from '../../hooks/useSEO';
import { EstatErrorDades } from '../mur/EstatErrorDades.jsx';
import { useMur } from '../mur/MurContext';
import { perMomentDescendent, targetesDeSistema } from '../mur/targetesMur.js';
import { CalendariDelPoble } from './CalendariDelPoble.jsx';
import {
  cursorDeMes, diaDeLaClau, entradaDeLAgenda, entradesDelCalendari, mesDObertura
} from './calendariGlobal.js';
import { rangDeLaVista } from './estatCalendari.js';
import { PanellFontsCalendari } from './fonts/PanellFontsCalendari.jsx';
import { useFontsCalendari } from './fonts/useFontsCalendari.js';
import { useEstatCalendari } from './useEstatCalendari.js';

const SENSE_AGENDA = Object.freeze({ fase: 'inactiu', entrades: Object.freeze([]) });
/* El nom accessible del diàleg de la pantalla completa. */
const TITOL_PANTALLA = 'Calendari a pantalla completa';

/**
 * Els actes de l'agenda de Sollutia del període que es veu ({ desde, fins },
 * dos Date), com a entrades del calendari. Sense la capacitat 'agenda', cap
 * consulta i cap entrada. T10 (261001) · Rep el rang i no el mes: el que es
 * veu (la setmana, les setmanes de la graella del mes, l'any o l'agenda).
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

/* L'avís de davall del calendari quan l'agenda de Sollutia no respon. T10
   (261001) · El DOM és el mateix que abans d'extraure'l. Onada 6 · L'avís de
   les targetes que no es poden situar, que anava al costat, el pinta
   CalendariDelPoble: és el mateix al Mur. */
function AvisDeLAgenda({ agenda }) {
  if (agenda.fase !== 'error') return null;
  return (
    <p role="status">
      Ara mateix no podem consultar els actes de l’agenda: el calendari mostra només les targetes del poble.{' '}
      <Boto varietat="fantasma" onClick={agenda.reintenta}>Torna a provar</Boto>
    </p>
  );
}

/* T1 · Les entrades de fora (l'agenda de Sollutia i les fonts de calendari)
   barrejades amb les targetes. Sense cap, les targetes tal qual: el mateix
   objecte i el mateix ordre que abans. */
function useEntradesBarrejades(targetes, agenda, calendaris) {
  return useMemo(() => {
    const externes = calendaris.entrades.length ? [...agenda.entrades, ...calendaris.entrades] : agenda.entrades;
    return externes.length ? [...targetes, ...externes].sort(perMomentDescendent) : targetes;
  }, [targetes, agenda.entrades, calendaris.entrades]);
}

/* T1 · Amb fonts configurades, el calendari al costat del panell «Els meus
   calendaris». Sense, els fills tal qual: el DOM d'ara (Llei del Píxel).
   Auditoria Codex, punt 23 · Amb client de Google però sense poder-lo usar
   (incrustada sense adreça de tornada declarada, o mal configurat), `motiu`
   ho diu al veí amb un avís de Pedra Seca davant del calendari; abans només
   ho sabia la consola. Sense client de Google, `motiu` és null: res de nou. */
function AmbLesFonts({ calendaris, children }) {
  if (!calendaris.configurades) {
    if (!calendaris.motiu) return children;
    return (
      <>
        <Alerta to="avis" viva={false}>{calendaris.motiu}</Alerta>
        {children}
      </>
    );
  }
  return (
    <div className="sdp-calendari-fonts-costat">
      <PanellFontsCalendari comptes={calendaris.comptes} onCommuta={calendaris.commuta} onConnecta={calendaris.connecta}
        onCancella={calendaris.cancella} onDesconnecta={calendaris.desconnecta} onReintenta={calendaris.reintenta} />
      <div className="sdp-calendari-fonts-costat__principal">{children}</div>
    </div>
  );
}

/* Fase visual · Dins del Calendari, la pastilla de les targetes porta a la
   vista Mes d'eixe mes (pastillaCalendari.js), també des de les altres vistes.
   Sense un mes vàlid, a la vista Mes sense mes (el d'obertura). */
const rutaDeLaPastilla = (mes) => (cursorDeMes(mes) ? `${RUTA_CALENDARI}?vista=mes&mes=${mes}` : `${RUTA_CALENDARI}?vista=mes`);

/* T10 (ordre del Mestre, 261001) · Les vistes a l'estil Google Calendar; P6
   (261003) · sense ?vista=, la vista Mes. La URL governa l'estat
   (useEstatCalendari: ?vista=, ?setmana=, ?date=, ?mes=, ?any=), l'agenda de
   Sollutia es demana per al període que es veu i la llista de davall diu el
   mateix període que la vista: el dia triat, la setmana, les dues setmanes,
   el mes, l'any o l'agenda (estatCalendari.js · rangDeLaVista). Es munta quan
   les dades del Mur ja han arribat: el mes d'obertura (mesDObertura) es tria
   amb totes les targetes, no amb la llista buida del carregant, i depén del
   dia (`hui`), no de l'instant.
   Onada 6 (prompt 261009_0230, punt 1) · Ara és el contenidor: l'estat de la
   URL, l'agenda de Sollutia, les fonts de Google i la pantalla completa. El
   calendari (navegació, vistes, avisos i targetes de davall) és
   CalendariDelPoble, el mateix que munta la pestanya Calendari del Mur. */
function CalendariDeLesVistes({ targetes, pantalla, avisError }) {
  const hui = diaIso(new Date());
  const avui = useMemo(() => diaDeLaClau(hui), [hui]);
  const obertura = useMemo(() => mesDObertura(targetes, avui), [targetes, avui]);
  const { estat, navega, canviaVista, triaDia, obriDia } = useEstatCalendari({ obertura, avui });
  const rang = useMemo(() => rangDeLaVista(estat, avui), [estat, avui]);
  const agenda = useActesDeLAgenda(rang);
  const calendaris = useFontsCalendari(rang);
  const entrades = useEntradesBarrejades(targetes, agenda, calendaris);
  const senseData = targetes.filter((entrada) => !entrada.esdeveniment).length;
  /* Pantalla completa · entre el títol i el selector, amb la pell de les
     fletxes (fantasma). L'estat de la URL i l'agenda queden per damunt:
     entrar o eixir no torna a demanar res. */
  const boto = pantalla.oberta ? null : <BotoPantallaCompleta id={pantalla.idObridor} onClick={pantalla.obri} />;

  return (
    <PantallaCompleta oberta={pantalla.oberta} onTanca={pantalla.tanca} titol={TITOL_PANTALLA}>
      <AmbLesFonts calendaris={calendaris}>
        <CalendariDelPoble estat={estat} navega={navega} canviaVista={canviaVista} triaDia={triaDia} obriDia={obriDia}
          entrades={entrades} avui={avui} senseData={senseData} avisos={avisError}
          avisAgenda={<AvisDeLAgenda agenda={agenda} />} accions={boto} />
      </AmbLesFonts>
    </PantallaCompleta>
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
              <Carregant etiqueta={t('loading.content', 'Carregant contingut...')} />
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
              bloc de la pantalla completa (primer fill de la PantallaCompleta):
              fora, el modal el deixaria inert i el calendari diria «Cap
              publicació» sense cap avís. Dins del Calendari, la pastilla de
              les targetes porta a la vista Mes del seu mes i reemplaça
              l'entrada de l'historial (revisió del carril A, P3): tres
              pastilles del mes que ja es veu no han de demanar quatre
              «Enrere». El proveïdor no pinta res. */}
          <DinsDelCalendari.Provider value={rutaDeLaPastilla}>
            <CalendariDeLesVistes targetes={targetes} pantalla={pantalla} avisError={status === 'error' ? (
              <EstatErrorDades titol={t('section.calendari.error', 'No s’han pogut carregar les targetes del calendari')}
                error={error} onReintenta={refresh} />
            ) : null} />
          </DinsDelCalendari.Provider>
        </div>
      </UniversalPage>
    </ContentProvider>
  );
}
