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
 * Tot l'estat és a la URL (modeDesa.js): cada tria la reescriu amb replace,
 * perquè el snippet ocupe una sola entrada de l'historial. Els diàlegs són
 * de pas i no hi van. Les regles d'entrar (D1) són les de /connectar
 * (contingutExtern.reglaDEntrada): sense sessió, en seed i local es desa al
 * dispositiu; en remot cal entrar.
 *
 * Entrar (correcció T7C-R1). «Entra per a desar» porta a /registre amb push
 * i un ?tornar cap al snippet, però cap porta l'obeïx: per ordre del Mestre
 * (261002) tota entrada aterra al perfil (RUTA_DESPRES_D_ENTRAR) amb replace.
 * El snippet continua a l'historial just abans: Arrere hi torna amb tota la
 * tria (que és a la URL). Ho diu l'avís abans d'entrar. Amb Google per
 * redirecció, l'historial passa per Google: cal obrir l'enllaç de nou.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from '../../app/contexts/RouterContext';
import { useSession } from '../../app/contexts/SessionContext';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { useNotes } from './NotesContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { PrevisualitzacioExtern } from './PrevisualitzacioExtern.jsx';
import { BotoneraClassificacio } from '../../components/universal/classificacio/BotoneraClassificacio.jsx';
import { DialegCarpeta } from '../../components/universal/classificacio/DialegCarpeta.jsx';
import { DialegValors } from '../../components/universal/classificacio/DialegValors.jsx';
import { DialegEmoticona } from '../../components/universal/classificacio/DialegEmoticona.jsx';
import { cataleg, usos } from '../../components/universal/classificacio/model.js';
import { rutaAmbConsulta } from '../../components/universal/workspace/seleccioUrl.js';
import { rutaDEntrada } from '../../config/rutaEntrada.js';
import { reglaDEntrada } from '../connectar/contingutExtern.js';
import { missatgeDeLError } from '../connectar/abastConnexio.js';
import { AVIS_CATEGORIA, CATEGORIES_BASE, ETIQUETES_BASE } from './classificacioBloc.js';
import { entradaDeDesa, escriuDesa, llegixDesa, paramsDeLaNota } from './modeDesa.js';

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

  const { contingut, categories, etiquetes, emoticona } = useMemo(() => llegixDesa(params), [params]);
  const valor = contingut?.ok ? contingut.valor : null;
  const nomCarpeta = carpetes.find((c) => String(c.id) === String(carpetaId))?.nom || String(carpetaId ?? '');

  const [dialeg, setDialeg] = useState(null); // 'carpeta' | 'categories' | 'etiquetes' | 'emoticona' | null
  const [desant, setDesant] = useState(false);
  const [error, setError] = useState(null);
  const muntat = useRef(true);
  useEffect(() => {
    muntat.current = true;
    return () => { muntat.current = false; };
  }, []);

  const { calEntrar, potCrear: potDesar } = reglaDEntrada({ teSessio: Boolean(currentUser), config, canCreate });

  const tanca = () => setDialeg(null);
  /* Cada tria és un refinament del mateix esborrany: replace. */
  const escriu = (tria) => {
    setDialeg(null);
    const next = escriuDesa(params, tria);
    if (next.toString() !== params.toString()) setParams(next, { replace: true });
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

  return (
    <UniversalPage
      chrome="system"
      title="Desar al Bloc"
      subtitle="On el vols desar?"
      lead="Un enllaç de fora de Sóc de Poble arriba com una nota teua, que podràs editar."
      onConnect={false}
    >
      <PrevisualitzacioExtern
        contingut={contingut}
        teSessio={Boolean(currentUser)}
        calEntrar={calEntrar}
        verb="desar"
        participi="desat"
        avisEntrar={AVIS_ENTRAR}
        error={error}
        boto={{ etiqueta: etiquetaDesar, onClick: desa, carregant: desant, disabled: !calEntrar && !potDesar }}
        nota={`Arriba com una nota nova a «${nomCarpeta}», que podràs editar. La imatge de l’altra web no es copia.`}
      >
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
      {dialeg === 'emoticona' ? (
        <DialegEmoticona
          key="emoticona"
          obert
          onTanca={tanca}
          actual={emoticona}
          onDesa={(icona) => escriu({ emoticona: icona })}
        />
      ) : null}
    </UniversalPage>
  );
}

export default SnippetCurador;
