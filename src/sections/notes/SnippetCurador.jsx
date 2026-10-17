/**
 * SnippetCurador.jsx · T7C (P1) · El detall del Bloc en mode desa: desar un
 * contingut de fora (una web) com una nota teua, triant on arriba.
 *
 * NotesSection el munta com a detall del mateix espai de treball del Bloc, en
 * mode compacte (UniversalWorkspace `compacte`): la columna de carpetes és el
 * rail plegat (triar-hi una carpeta és triar on arriba) i el detall és esta
 * Pàgina Universal (sdp-universal-page §5: dins de la columna dreta, mai
 * embolcallant el Workspace).
 *
 * Una sola peça per a cada cosa, cap de nova:
 *   · la previsualització és PrevisualitzacioExtern (correcció T7C-R3): la
 *     composició del contingut de fora (avís foraster, UniversalCard de P6,
 *     motius i peu), amb les classes del bloc T43 de modules.css;
 *   · la tria és la BotoneraClassificacio de l'editor (píndoles, P8), que obri
 *     DialegCarpeta (l'arbre niat de P5), DialegValors i DialegEmoticona;
 *   · desar és notaDeContingutExtern amb la carpeta triada (modeDesa.js).
 *
 * SN (ordre del Mestre, 261003) · Per a què és l'enllaç. Si el Lector de
 * notícies és disponible (plataforma/destinacions.js: l'app encesa per a
 * esta persona i este node) i el seu mòdul exporta una destinació (hui,
 * només amb port: la llavor), una secció «Destinació» oferix, amb dues
 * targetes (GrupOpcions, el patró de «Privacitat de la connexió» de
 * /connectar), el «Bloc de notes» (per defecte: tot el que hi ha davall és
 * el d'abans) o el «Lector de notícies». Amb el Lector: el nom proposat (el
 * títol o el domini), la categoria del poble (les del port del Lector) i
 * «Afegir al Lector», que l'apunta com una font personal PENDENT DEL
 * CONNECTOR (l'app no baixa res: Model B) i porta a la gestió de fonts del
 * Lector. Sense destinació resolta (l'app apagada, sense port, o el mòdul
 * encara arribant), cap secció nova: el snippet d'abans, píxel a píxel
 * (correcció SN-R1: mai una targeta morta). Només un ?desti=lector que ja
 * porta la URL mostra el Lector mentre el mòdul arriba.
 *
 * Tot l'estat és a la URL (modeDesa.js): cada tria la reescriu amb replace,
 * perquè el snippet ocupe una sola entrada de l'historial. Els diàlegs i el
 * nom de la font que s'escriu són de pas i no hi van. Les regles d'entrar
 * (D1) són les de /connectar (contingutExtern.reglaDEntrada): sense sessió,
 * en seed i local es desa al dispositiu; en remot cal entrar. El Lector no
 * demana sessió: les seues fonts viuen sempre en este dispositiu.
 *
 * Entrar (correcció T7C-R1). «Entra per a desar» porta a /registre amb push
 * i un ?tornar cap al snippet, però cap porta l'obeïx: per ordre del Mestre
 * (261002) tota entrada aterra al perfil (RUTA_DESPRES_D_ENTRAR) amb replace.
 * El snippet continua a l'historial just abans: Arrere hi torna amb tota la
 * tria (que és a la URL). Ho diu l'avís abans d'entrar. Amb Google per
 * redirecció, l'historial passa per Google: cal obrir l'enllaç de nou.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { NotebookPen, Rss } from 'lucide-react';
import { useLocation, useNavigate, useSearchParams } from '../../app/contexts/RouterContext';
import { useSession } from '../../app/contexts/SessionContext';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { useNotes } from './NotesContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { Camp, CampText, Carregant, GrupOpcions, Selector } from '../../components/PedraSeca/index.js';
import { PrevisualitzacioExtern } from './PrevisualitzacioExtern.jsx';
import { BotoneraClassificacio } from '../../components/universal/classificacio/BotoneraClassificacio.jsx';
import { DialegCarpeta } from '../../components/universal/classificacio/DialegCarpeta.jsx';
import { DialegValors } from '../../components/universal/classificacio/DialegValors.jsx';
import { DialegEmoticona } from '../../components/universal/classificacio/DialegEmoticona.jsx';
import { cataleg, usos } from '../../components/universal/classificacio/model.js';
import { rutaAmbConsulta } from '../../components/universal/workspace/seleccioUrl.js';
import { ESTATS_DESTINACIO, useDestinacioEnllac } from '../../apps/plataforma/destinacions.js';
import { rutaDEntrada } from '../../config/rutaEntrada.js';
import { reglaDEntrada } from '../connectar/contingutExtern.js';
import { missatgeDeLError } from '../connectar/abastConnexio.js';
import { AVIS_CATEGORIA } from './classificacioBloc.js';
import { carregaCatalegEmojis } from './canalEmojis.js';
import { useCoreContent } from '../../app/contexts/CoreContentContext.jsx';
import { categoriesBase, etiquetesBase } from '../../data/personalitzacio.js';
import {
  APP_LECTOR, DESTINS, entradaDeDesa, entradaDeFont, escriuDesa, escriuDesti, llegixDesa, llegixDesti, nomProposat,
  paramsDeLaNota
} from './modeDesa.js';

const CAP = Object.freeze([]);
const RUTA_BLOC = '/notes';

/* Carpetes: el port de dades no té cap mètode per a crear-ne, reanomenar-ne
   ni esborrar-ne (backendPort.js, AGENTS §8): només es tria. */
const AVIS_CARPETES = 'Crear, reanomenar i esborrar carpetes encara no té contracte de dades amb el servidor. De moment, tria on arriba este enllaç.';
/* Reanomenar i esborrar toquen totes les notes: es fan des de l'editor. */
const AVIS_CATALEG = 'Reanomenar i esborrar s’apliquen a totes les notes i es fan des d’una nota del Bloc. Ací només tries les d’este enllaç.';
const ERROR_DESAR = 'No s’ha pogut desar. Torna-ho a provar.';
/* Correcció T7C-R1 · Abans d'entrar, on s'aterra i com es recupera l'enllaç. */
const AVIS_ENTRAR = 'Per a desar cal entrar al teu compte. Després d’entrar aniràs al teu perfil: per a desar este enllaç, torna arrere o obri’l de nou.';

/* SN · Els textos de cada destinació. El títol i el subtítol no acaben en
   punt (qualitat.test.js). */
const SUBTITOL = 'On el vols desar?';
const TEXTOS_DESTI = Object.freeze({
  [DESTINS.bloc]: Object.freeze({
    titol: 'Desar al Bloc',
    lead: 'Un enllaç de fora de Sóc de Poble arriba com una nota teua, que podràs editar.'
  }),
  [DESTINS.lector]: Object.freeze({
    titol: 'Afegir al Lector',
    lead: 'Un enllaç de fora de Sóc de Poble arriba al teu Lector com una font de notícies.'
  })
});
const ICONA_DESTI = { size: 28, strokeWidth: 1.5, 'aria-hidden': 'true', focusable: 'false' };
const OPCIONS_DESTI = Object.freeze([
  Object.freeze({
    valor: DESTINS.bloc,
    etiqueta: 'Bloc de notes',
    ajuda: 'Una anotació o un marcador: arriba com una nota teua, que podràs editar.',
    icona: <NotebookPen {...ICONA_DESTI} />
  }),
  Object.freeze({
    valor: DESTINS.lector,
    etiqueta: 'Lector de notícies',
    ajuda: 'Una font de notícies (RSS) per a seguir-la al Lector.',
    icona: <Rss {...ICONA_DESTI} />
  })
]);
const AJUDA_LECTOR = 'L’app no baixa res per ella mateixa: la font queda pendent del connector fins que l’amfitrió o el servidor la servisquen.';
const NOTA_LECTOR = 'Arriba al Lector com una font teua, només en este dispositiu.';
const AJUDA_CATEGORIA = 'Les categories del poble al Lector. Pots deixar-la sense.';
const SENSE_CATEGORIA = Object.freeze({ valor: '', etiqueta: 'Sense categoria' });
/* Correcció SN-R1 · Només per a fallades de pas (el mòdul o el port no han
   respost): una app sense destinació ja no arriba ací, no s'oferix. */
const ERROR_LECTOR = 'No s’ha pogut obrir el Lector ara mateix. Pots desar l’enllaç al Bloc de notes o tornar-ho a provar més tard.';
const ERROR_AFEGIR = 'No s’ha pogut afegir al Lector. Torna-ho a provar.';

const INACTIU = Object.freeze({ estat: 'inactiu', api: null, categories: CAP });
const CARREGANT = Object.freeze({ estat: 'carregant', api: null, categories: CAP });
const FALLIT = Object.freeze({ estat: 'error', api: null, categories: CAP });

/**
 * SN · Les categories del poble del Lector, demanades només quan el Lector
 * és la destinació (poden passar pel port: Model B). `api`: la destinació
 * resolta o null. { estat, categories }: 'inactiu', 'carregant', 'llest' o 'error'.
 */
function useCategoriesLector(api, actiu) {
  const [carrega, setCarrega] = useState({ per: null, estat: 'carregant', categories: CAP });
  useEffect(() => {
    if (!actiu || !api) return undefined;
    let viu = true;
    Promise.resolve()
      .then(() => api.categories())
      .then((categories) => {
        if (viu) setCarrega({ per: api, estat: 'llest', categories });
      }, () => {
        if (viu) setCarrega({ per: api, estat: 'error', categories: CAP });
      });
    return () => { viu = false; };
  }, [actiu, api]);
  if (!actiu || !api) return INACTIU;
  if (carrega.per !== api) return CARREGANT;
  return carrega;
}

/**
 * `carpetes`: les del Bloc en la forma del contracte { id, nom, parentId }
 * (opcionsDeCarpetes). `carpetaId`: on arribarà, ja validada (carpetaDeDesa).
 */
export function SnippetCurador({ carpetes = CAP, carpetaId }) {
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useSession();
  const { showToast } = useToast();
  const { creaNota, canCreate, config, notes = CAP } = useNotes() || {};
  const id = useId();
  /* Onada 11 (261010; prompt 261010_1730, tasca 2) · Les llistes de sèrie
     del Bloc, ampliades per la taxonomia del poble si n'hi ha; sense
     personalització, les mateixes de classificacioBloc.js. */
  const { personalitzacio } = useCoreContent();
  const taxonomia = personalitzacio?.taxonomia?.payload;
  const CATEGORIES_BASE = categoriesBase(taxonomia);
  const ETIQUETES_BASE = etiquetesBase(taxonomia);

  const { contingut, categories, etiquetes, emoticona } = useMemo(() => llegixDesa(params), [params]);
  const valor = contingut?.ok ? contingut.valor : null;
  const nomCarpeta = carpetes.find((c) => String(c.id) === String(carpetaId))?.nom || String(carpetaId ?? '');

  /* SN · On va. La tria s'oferix només amb la destinació del Lector resolta
     ('llesta'). Un ?desti=lector es respecta mentre el mòdul arriba o si ha
     fallat de pas; si l'app no en té cap ('cap'), és el Bloc. */
  const destinacio = useDestinacioEnllac(APP_LECTOR);
  const { desti, categoriaFont } = useMemo(() => llegixDesti(params), [params]);
  const ofertaLector = destinacio.estat === ESTATS_DESTINACIO.llesta;
  const efectiu = desti === DESTINS.lector && destinacio.estat !== ESTATS_DESTINACIO.cap ? DESTINS.lector : DESTINS.bloc;
  const alLector = efectiu === DESTINS.lector;
  /* Amb un enllaç que no val no hi ha formulari: les categories no es demanen. */
  const api = ofertaLector ? destinacio.destinacio : null;
  const categoriesLector = useCategoriesLector(api, alLector && Boolean(valor));
  /* { estat, api, categories }: 'inactiu', 'carregant', 'llest' o 'error'. */
  let lector;
  if (!alLector || !valor) lector = INACTIU;
  else if (destinacio.estat === ESTATS_DESTINACIO.carregant) lector = CARREGANT;
  else if (destinacio.estat === ESTATS_DESTINACIO.error) lector = FALLIT;
  else lector = { ...categoriesLector, api };
  /* Correcció SN-R7 · Un error de camp mou el focus al control que el porta:
     així es llegix (aria-invalid i aria-describedby del Camp). */
  const panellLector = useRef(null);

  const [dialeg, setDialeg] = useState(null); // 'carpeta' | 'categories' | 'etiquetes' | 'emoticona' | null
  const [desant, setDesant] = useState(false);
  const [error, setError] = useState(null);
  /* SN · El nom de la font que escriu la persona (de pas: per a l'adreça que el porta). */
  const [nomEditat, setNomEditat] = useState(null);
  const [errorCamp, setErrorCamp] = useState(null);
  useEffect(() => {
    if (errorCamp) panellLector.current?.querySelector('[aria-invalid="true"]')?.focus();
  }, [errorCamp]);
  const muntat = useRef(true);
  useEffect(() => {
    muntat.current = true;
    return () => { muntat.current = false; };
  }, []);

  const { calEntrar, potCrear: potDesar } = reglaDEntrada({ teSessio: Boolean(currentUser), config, canCreate });

  const tanca = () => setDialeg(null);
  /* Cada tria és un refinament del mateix esborrany: replace. */
  const reescriu = (next) => {
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
  };
  const escriu = (tria) => {
    setDialeg(null);
    reescriu(escriuDesa(params, tria));
  };
  const triaDesti = (nou) => {
    setError(null);
    setErrorCamp(null);
    reescriu(escriuDesti(params, { desti: nou }));
  };

  const desa = async () => {
    if (calEntrar) {
      navigate(rutaDEntrada({ mode: 'entrar', tornar: rutaAmbConsulta(pathname || RUTA_BLOC, params) }));
      return;
    }
    if (!valor || desant || !potDesar) return;
    const entrada = entradaDeDesa(valor, { carpeta: carpetaId, categories, etiquetes, emoticona });
    if (!entrada) return;
    setError(null);
    setDesant(true);
    try {
      const nota = await creaNota(entrada);
      showToast(`Desat a «${nomCarpeta}». És una nota teua: la pots editar.`, 'success');
      if (!muntat.current) return;
      /* La URL passa a la nota desada; replace: Arrere no torna al snippet. */
      setParams(paramsDeLaNota({ carpeta: carpetaId, nota: nota?.id ?? null }), { replace: true });
    } catch (err) {
      /* El motiu de veres (també la migració de l'origen que falta, com a
         /connectar); sense missatge, el de desar. */
      if (muntat.current) setError(missatgeDeLError({ message: err?.message || ERROR_DESAR }));
    } finally {
      if (muntat.current) setDesant(false);
    }
  };

  /* SN · El Lector: el nom proposat fins que la persona l'edita, i la
     categoria de la URL només si és una del poble. */
  const nomMaxim = lector.api?.nomMaxim;
  const nomFont = nomEditat && nomEditat.url === valor?.url ? nomEditat.text : nomProposat(valor, nomMaxim);
  const categoriaTriada = lector.categories.some((c) => c.id === categoriaFont) ? categoriaFont : '';

  const afegix = async () => {
    if (!valor || desant || lector.estat !== 'llest') return;
    setError(null);
    setErrorCamp(null);
    setDesant(true);
    try {
      const font = await lector.api.afig(entradaDeFont(valor, { nom: nomFont, categoriaId: categoriaTriada || null }));
      showToast(`Afegida al Lector: «${font.nom}». Queda pendent del connector.`, 'success');
      if (!muntat.current) return;
      /* A la gestió de fonts del Lector, on es veu; replace: Arrere no torna al snippet. */
      if (font.ruta) navigate(font.ruta, { replace: true });
    } catch (err) {
      if (!muntat.current) return;
      /* Els motius del Lector i del magatzem porten `codi` i ja es diuen en
         valencià; la resta, el genèric. */
      const motiu = typeof err?.codi === 'string' && err.message ? err.message : ERROR_AFEGIR;
      if (err?.camp === 'nom' || err?.camp === 'categoria') setErrorCamp({ [err.camp]: motiu });
      else setError(motiu);
    } finally {
      if (muntat.current) setDesant(false);
    }
  };

  const etiquetaDesar = calEntrar ? 'Entra per a desar'
    : !potDesar ? 'Obrint el teu Bloc…'
      : `Desar a «${nomCarpeta}»`;

  /* Correcció T7C-R2 · Des del snippet el catàleg no es reanomena ni
     s'esborra. DialegValors encara no té cap opció per a no pintar el llapis
     i la paperera d'un valor propi: amb globalActiu=false (el seu estat de
     pas «falten notes») es veuen desactivats, que és la forma que P8 mana
     llevar. Pendent fora del T7C (classificació): una opció com
     gestioCataleg={false} que no els pinte; llavors el snippet la passarà i
     la prova «el catàleg…» de NotesSection.desa.test.jsx esperarà que no hi
     siguen. */
  const propsValors = (camp, base) => ({
    obert: true,
    onTanca: tanca,
    cataleg: cataleg(notes, camp, base),
    fixos: base,
    usos: usos(notes, camp),
    globalActiu: false,
    avisGlobal: AVIS_CATALEG
  });

  const textos = TEXTOS_DESTI[efectiu];
  const peu = alLector ? {
    calEntrar: false,
    verb: 'afegir',
    participi: 'afegit',
    error: error || (lector.estat === 'error' ? ERROR_LECTOR : null),
    boto: { etiqueta: 'Afegir al Lector', onClick: afegix, carregant: desant, disabled: lector.estat !== 'llest' },
    nota: NOTA_LECTOR
  } : {
    calEntrar,
    verb: 'desar',
    participi: 'desat',
    error,
    boto: { etiqueta: etiquetaDesar, onClick: desa, carregant: desant, disabled: !calEntrar && !potDesar },
    nota: `Arriba com una nota nova a «${nomCarpeta}», que podràs editar. La imatge de l’altra web no es copia.`
  };

  return (
    <UniversalPage
      chrome="system"
      title={textos.titol}
      subtitle={SUBTITOL}
      lead={textos.lead}
      onConnect={false}
    >
      <PrevisualitzacioExtern
        contingut={contingut}
        teSessio={Boolean(currentUser)}
        avisEntrar={AVIS_ENTRAR}
        {...peu}
      >
        {ofertaLector || alLector ? (
          <section className="sdp-connectar__seccio" aria-labelledby={`${id}-desti`}>
            <h3 id={`${id}-desti`} className="sdp-connectar__titol-seccio">Destinació</h3>
            <GrupOpcions
              llegenda="Per a què és este enllaç?"
              nom={`${id}-desti-opcio`}
              aspecte="targetes"
              textTriada="Triada"
              opcions={OPCIONS_DESTI}
              valor={efectiu}
              onCanvi={triaDesti}
              disabled={desant}
            />
            {alLector ? (
              <div ref={panellLector} className="sdp-connectar__panell">
                <p className="sdp-connectar__ajuda">{AJUDA_LECTOR}</p>
                {lector.estat === 'carregant' ? <Carregant etiqueta="Obrint el Lector…" /> : null}
                {lector.estat === 'llest' ? (
                  <>
                    <Camp etiqueta="Nom de la font" obligatori error={errorCamp?.nom}>
                      <CampText
                        value={nomFont}
                        maxLength={nomMaxim}
                        autoComplete="off"
                        onChange={(e) => {
                          setErrorCamp(null);
                          setNomEditat({ url: valor?.url, text: e.target.value });
                        }}
                      />
                    </Camp>
                    <Camp etiqueta="Categoria del poble" ajuda={AJUDA_CATEGORIA} error={errorCamp?.categoria}>
                      <Selector
                        opcions={[SENSE_CATEGORIA, ...lector.categories.map((c) => ({ valor: c.id, etiqueta: c.nom }))]}
                        value={categoriaTriada}
                        onChange={(e) => {
                          setErrorCamp(null);
                          reescriu(escriuDesti(params, { categoriaFont: e.target.value || null }));
                        }}
                      />
                    </Camp>
                  </>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}
        {alLector ? null : (
          <section className="sdp-connectar__seccio" aria-labelledby={`${id}-classificacio`}>
            <h3 id={`${id}-classificacio`} className="sdp-connectar__titol-seccio">Classificació</h3>
            <BotoneraClassificacio
              carpeta={nomCarpeta}
              categories={categories}
              etiquetes={etiquetes}
              emoticona={emoticona}
              onObri={setDialeg}
            />
          </section>
        )}
      </PrevisualitzacioExtern>

      {dialeg === 'carpeta' ? (
        <DialegCarpeta
          key="carpeta"
          obert
          onTanca={tanca}
          opcions={carpetes}
          seleccionada={String(carpetaId)}
          onDesa={(carpeta) => escriu({ carpeta })}
          avis={AVIS_CARPETES}
        />
      ) : null}
      {dialeg === 'categories' ? (
        <DialegValors
          key="categories"
          {...propsValors('categories', CATEGORIES_BASE)}
          titol="Categories de l’enllaç"
          etiquetaNou="Nova categoria"
          seleccionats={categories}
          minim={1}
          avisMinim={AVIS_CATEGORIA}
          onDesa={(valors) => escriu({ categories: valors })}
        />
      ) : null}
      {dialeg === 'etiquetes' ? (
        <DialegValors
          key="etiquetes"
          {...propsValors('tags', ETIQUETES_BASE)}
          titol="Etiquetes de l’enllaç"
          etiquetaNou="Nova etiqueta"
          seleccionats={etiquetes}
          minim={0}
          onDesa={(valors) => escriu({ etiquetes: valors })}
        />
      ) : null}
      {/* Gauntlet 261017 (F30) · L'emoticona, amb la graella del catàleg
          Emojis XL, com al Bloc: un clic l'assigna. */}
      {dialeg === 'emoticona' ? (
        <DialegEmoticona
          key="emoticona"
          obert
          onTanca={tanca}
          actual={emoticona}
          onDesa={(icona) => escriu({ emoticona: icona })}
          carregaCataleg={carregaCatalegEmojis}
        />
      ) : null}
    </UniversalPage>
  );
}

export default SnippetCurador;
