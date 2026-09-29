/**
 * ConnectarSection.jsx — «Connectar» qualsevol element (una casa, una faena,
 * un poble, una persona, una pàgina…) amb el MAS de qui mira (T5, T43).
 *
 *   · La connexió és una nota del Bloc que recorda d'on ve (`origen`): QUÈ és
 *     (objecte tipat, T43), secció, element, títol, qui el signa i la ruta
 *     per a tornar-hi. Naix a la carpeta triada («Connectats» per defecte),
 *     amb les categories i les etiquetes que es trien ací.
 *   · T54 · Al MAS la connexió es llig, no s'edita (notes/ConnexioDetall.jsx):
 *     la pàgina de l'original, «Obri l'original», «Compartir al Mur» (la
 *     mateixa acció del context que feia l'editor, compartirNota, només amb
 *     sessió i servidor), canviar-la de carpeta i borrar-la. «Tot el poble»
 *     es desa com a tria i el resum el deixa com a pas pendent: no ix sola.
 *   · T54 · La mini-card resol la foto en local (detail/elementDeSeccio.js)
 *     amb sectionId + item_id: l'URL no porta cap imatge.
 *   · T43 (ordre del Mestre, 260928) · «Qui ho pot vore?» és una tria honesta
 *     (abastConnexio.js): Privada, Persones concretes i Grups (enviaments per
 *     xat, que no són permisos) i Tot el poble (compartir-la al Mur des del
 *     lector del MAS, T54: la gent registrada del poble, no Internet). La
 *     tria es desa a origen.abast i el resultat es mostra per destinatari
 *     (ResumConnexio).
 *   · T43 · D6: la connexió és sempre personal, encara que s'actue com a
 *     entitat, i es diu. D8: la vista viu dins d'una UniversalPage (H1 al seu
 *     lloc) i el seu CSS és al bloc T43 de css/modules.css; cap import de CSS.
 *   · El que arriba per URL (item_id, title, sectionId, targetUserId,
 *     autorTipus, author, objecte, ruta) ho escriu rutaConnectarObjecte
 *     (config/objecteConnectable.js), i ací no es creu res sense validar-ho.
 *   · T71 · La mini-card resol l'original amb useOriginalDeConnexio (també
 *     les pàgines de text: «L'Ànima de la IAIA» ix amb la seua foto). Quan es
 *     resol, el títol i l'autor són els de l'original, a la vista i a la
 *     memòria cau que es desa (títol i cos, per a la cerca i la caiguda del
 *     lector), mai els de l'URL (title, author). T71b · Tampoc la identitat
 *     de l'autor (targetUserId, autorTipus): o ve de l'original o no n'hi ha.
 *   · T71 · Amb `url` a la query, el que es guarda és un contingut de FORA
 *     (contingutExtern.js): es mostra la url validada i només un clic el
 *     guarda, com una nota nova i editable a «Connectats». Carregar la ruta
 *     no crea mai res. Una url que no és http o https no es guarda.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from '../../app/contexts/RouterContext';
import { Check, Globe, Layers, X } from 'lucide-react';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { useUIActions } from '../../app/contexts/UIContext';
import { useSession } from '../../app/contexts/SessionContext';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useNotesData } from '../notes/NotesDataContext';
import { useXat } from '../xat/XatContext.jsx';
import { CARPETA_CONNECTATS, carpetesDelBloc, iconaDeCarpeta } from '../notes/carpetes.js';
import { autorDe, esRutaInterna, getSectionItemPath, tipusDeSeccio, TIPUS_OBJECTE } from '../../config/navigation.js';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { Alerta, Boto, Camp, CampText, Carregant, Casella, GrupCamps, GrupOpcions, UniversalCard } from '../../components/PedraSeca/index.js';
import { urlPerCompartir } from '../../components/PedraSeca/hooks/useAccions.js';
import { normalitzaAbast } from '../../data/origenNota.js';
import { useOriginalDeConnexio } from '../detail/elementDeSeccio.js';
import { contingutExternDeParams, notaDeContingutExtern } from './contingutExtern.js';
import {
  ETIQUETA_OBJECTE, LIMIT_GRUPS, LIMIT_PERSONES, estatDelXat, grupsDeXat, missatgeDeConnexio,
  missatgeDeLError, modeAplicable, opcionsDAbast
} from './abastConnexio.js';
/* El cos que es desa a la nota: mòdul pur de connexions, el mateix que llig el lector del MAS. */
import { contingutDeLaConnexio } from '../notes/connexions.js';
import { useAplicaAbast } from './useAplicaAbast.js';
import { ResumConnexio } from './ResumConnexio.jsx';
/* T43b (ordre del Mestre, 260928) · administrar l'organització (?organitzacio=ID). */
import { BlocAdministrarOrganitzacio } from './organitzacio/BlocAdministrarOrganitzacio.jsx';

const SUGGESTED_TAGS = ['Història local', 'Interessant', 'Patrimoni', 'Gent del Poble', 'Debat'];
/* Les mateixes categories de sèrie que el Bloc (NotesSection). */
const CATEGORIES_BASE = ['Sistema'];
const TIPUS_DE_PERFIL = new Set(['persona', 'entitat', 'grup', 'ia']);

/** El que la nota recordarà de l'element connectat. */
export function origenDeLaConnexio(params) {
  const sectionId = params.get('sectionId') || '';
  const itemId = params.get('item_id') || '';
  const titol = params.get('title') || itemId || 'element-desconegut';
  const autorTipus = params.get('autorTipus') || '';
  /* T43 · la ruta ve escrita (pàgines, perfils) o es deduïx de la secció; en
     els dos casos només si és interna i segura. */
  const demanada = params.get('ruta') || '';
  const deduida = sectionId && itemId ? getSectionItemPath(sectionId, itemId) : '';
  const ruta = esRutaInterna(demanada) ? demanada : (esRutaInterna(deduida) ? deduida : '');
  /* T43 · QUÈ és: el tipus declarat si és de la llista tancada; si no, el de
     la secció; un perfil sense tipus pren el de l'autor; sense res, 'pagina'. */
  const declarat = params.get('objecte');
  const objecte = TIPUS_OBJECTE.includes(declarat) ? declarat
    : tipusDeSeccio(sectionId) || (sectionId === 'perfil' && TIPUS_DE_PERFIL.has(autorTipus) ? autorTipus : 'pagina');
  return {
    tipus: 'connexio',
    sectionId,
    itemId: itemId || titol,
    titol,
    autorId: params.get('targetUserId') || '',
    autorNom: params.get('author') || '',
    autorTipus,
    ruta,
    objecte
  };
}

/** Afig un valor net a una llista sense repetir-lo. */
const ambValor = (llista, valor) => {
  const net = String(valor || '').trim();
  return !net || llista.includes(net) ? llista : [...llista, net];
};

/** T71 · Qui mira /connectar: amb `url` a la query, un contingut de fora;
 * si no, un element de Sóc de Poble. Components distints: canviar de l'un a
 * l'altre (la query canvia) remunta la vista sencera. */
export default function ConnectarSection() {
  const [params] = useSearchParams();
  return params.has('url') ? <ConnectarContingutExtern params={params} /> : <ConnectarElementIntern />;
}

/** El que la nota recordarà quan l'original es resol: el títol i l'autor de
 * l'original, no els de l'URL. Sense original, l'origen tal com ve. Una
 * pàgina de text no declara autor (la seua barra signa amb el de sèrie):
 * l'origen no en guarda cap.
 * T71b · L'autoria no es mescla: el nom, l'id i el tipus de l'autor són tots
 * de l'original (`item`, el mateix criteri que rutaDePerfilDAutor: entitat
 * o persona) o cap. Mai el targetUserId ni l'autorTipus de l'URL. */
export function origenAmbOriginal(origen, targeta, item = null) {
  if (!targeta) return origen;
  const autor = autorDe(item);
  return {
    ...origen,
    titol: targeta.titol || origen.titol,
    autorNom: targeta.autor?.propi ? targeta.autor.nom : '',
    autorId: autor?.id || '',
    autorTipus: autor?.tipus || ''
  };
}

function ConnectarElementIntern() {
  const { showToast } = useToast();
  const { t } = useUIActions();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const origenDeLURL = useMemo(() => origenDeLaConnexio(params), [params]);
  const id = useId();
  /* T54 · la foto de la mini-card: l'element original resolt en local amb
     sectionId + item_id sobre les dades dels proveïdors, mai des de l'URL.
     T71 · també les pàgines de text (paginaDeText.js), i quan l'original es
     resol en manen el títol i l'autor. */
  const { targeta: original, item: itemOriginal } = useOriginalDeConnexio(origenDeLURL);
  const origen = useMemo(
    () => origenAmbOriginal(origenDeLURL, original, itemOriginal),
    [origenDeLURL, original, itemOriginal]
  );
  const contextTitle = origen.titol;
  const imatgeOriginal = original?.imatge || '';
  const autorVisible = original ? original.autor.nom : origen.autorNom;

  const { currentUser } = useSession();
  const { actor, identitats } = useIdentitat();
  const { noteFolders, notes, creaNota, canCreate, config } = useNotesData();
  const { chatThreads, cercaMembres, status: statusXat, avis: avisXat } = useXat();
  const { aplica } = useAplicaAbast();

  const isGuest = !currentUser;
  const teSessio = Boolean(currentUser);
  /* Sense sessió, en seed i local el Bloc és del dispositiu: la connexió es
     guarda igual. En remot, el Foraster només simula. */
  const potGuardar = Boolean(canCreate);
  const dataMode = config?.dataMode === 'seed' || config?.dataMode === 'local' ? config.dataMode : 'remote';

  /* D6 · la connexió és sempre de la persona, encara que actue com a entitat. */
  const persona = (identitats || []).find((identitat) => identitat.tipus === 'persona')?.nom
    || (actor?.tipus === 'persona' ? actor.nom : null);
  const actuaComEntitat = actor?.tipus === 'entitat' && actor?.nom;

  const grups = useMemo(() => grupsDeXat(chatThreads), [chatThreads]);
  /* Una llista buida mentre el xat carrega (o si ha fallat) no vol dir «cap grup». */
  const xat = estatDelXat({ status: statusXat, avis: avisXat, fils: chatThreads });
  const opcions = useMemo(() => opcionsDAbast({ dataMode, teSessio, grups, xat }), [dataMode, teSessio, grups, xat]);
  const [modeTriat, setModeTriat] = useState('privada');
  const mode = modeAplicable(modeTriat, opcions);

  const [persones, setPersones] = useState([]);
  const [grupsTriats, setGrupsTriats] = useState([]);
  const [cerca, setCerca] = useState('');
  const [padro, setPadro] = useState({ estat: 'inactiu', membres: [], error: null });

  const [selectedFolder, setSelectedFolder] = useState(CARPETA_CONNECTATS);
  const [customTags, setCustomTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoriaInput, setCategoriaInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [resum, setResum] = useState(null);
  const resumRef = useRef(null);

  const displayFolders = carpetesDelBloc(noteFolders);
  const categoriesDisponibles = useMemo(() => {
    const totes = new Set(CATEGORIES_BASE);
    for (const nota of notes || []) for (const categoria of nota?.categories || []) if (categoria) totes.add(String(categoria));
    return [...totes].sort((a, b) => a.localeCompare(b));
  }, [notes]);

  /* El padró del poble només es consulta mentre «Persones concretes» és la
     tria, amb un xicotet retard mentre s'escriu (com el xat). */
  useEffect(() => {
    if (mode !== 'persones') return undefined;
    let viu = true;
    const espera = setTimeout(() => {
      setPadro((previ) => ({ ...previ, estat: 'carregant', error: null }));
      Promise.resolve()
        .then(() => cercaMembres(cerca.trim() || null))
        .then((llista) => { if (viu) setPadro({ estat: 'llest', membres: Array.isArray(llista) ? llista : [], error: null }); })
        .catch((e) => { if (viu) setPadro({ estat: 'error', membres: [], error: e?.message || 'No s’ha pogut obrir el padró del poble.' }); });
    }, cerca ? 250 : 0);
    return () => { viu = false; clearTimeout(espera); };
  }, [mode, cerca, cercaMembres]);

  /* El resum rep el focus en aparéixer: és el que ha passat de veres. */
  useEffect(() => {
    if (resum) resumRef.current?.focus();
  }, [resum]);

  /* Correcció C16 (260928) · Llevar una persona o una etiqueta desmunta el
     botó premut, i una suggerida triada es mou a l'altra llista: el focus no
     pot caure al <body> (WCAG 2.4.3). Cada acció diu on ha d'anar (índex de
     la mateixa llista) i ací es resol quan el DOM ja és el nou. */
  const [focusDesti, setFocusDesti] = useState(null);
  const panellPersonesRef = useRef(null);
  const personesTriadesRef = useRef(null);
  const etiquetesRef = useRef(null);
  const etiquetaLliureRef = useRef(null);
  useEffect(() => {
    if (!focusDesti) return;
    const { llista, index, reserva } = focusDesti;
    const botons = (ref, selector) => [...(ref.current?.querySelectorAll(selector) || [])];
    let desti = null;
    if (llista === 'persones') {
      desti = botons(personesTriadesRef, 'button')[index] || panellPersonesRef.current?.querySelector('input');
    } else if (llista === 'etiquetes') {
      desti = botons(etiquetesRef, '.sdp-connectar__pindola--triada')[index] || etiquetaLliureRef.current?.querySelector('input');
    } else if (llista === 'suggerides') {
      desti = botons(etiquetesRef, '.sdp-connectar__pindola:not(.sdp-connectar__pindola--triada)')[index]
        || botons(etiquetesRef, '.sdp-connectar__pindola--triada')[reserva];
    }
    desti?.focus();
    setFocusDesti(null);
  }, [focusDesti]);

  const commutaPersona = (membre) => {
    const clau = String(membre.usuari_id);
    setPersones((actuals) => {
      if (actuals.some((p) => p.id === clau)) return actuals.filter((p) => p.id !== clau);
      if (actuals.length >= LIMIT_PERSONES) return actuals;
      return [...actuals, { id: clau, nom: String(membre.nom || clau), filId: membre.fil_id || null }];
    });
  };
  const llevaPersona = (clau) => {
    setFocusDesti({ llista: 'persones', index: persones.findIndex((p) => p.id === clau) });
    setPersones((actuals) => actuals.filter((p) => p.id !== clau));
  };
  const commutaGrup = (clau) => setGrupsTriats((actuals) => {
    if (actuals.includes(clau)) return actuals.filter((g) => g !== clau);
    return actuals.length >= LIMIT_GRUPS ? actuals : [...actuals, clau];
  });

  /* T43 (ordre del Mestre, 260928) · Només es buida el camp quan l'etiqueta
     ve d'ell: triar una suggerida no esborra el que s'estava escrivint. */
  const addTag = (tag, { buidaCamp = true } = {}) => {
    setCustomTags((actuals) => ambValor(actuals, tag));
    if (buidaCamp) setTagInput('');
  };
  const removeTag = (tag) => {
    setFocusDesti({ llista: 'etiquetes', index: customTags.indexOf(tag) });
    setCustomTags((actuals) => actuals.filter((x) => x !== tag));
  };
  const suggerides = SUGGESTED_TAGS.filter((tag) => !customTags.includes(tag));
  /* La suggerida ix de la seua llista: el focus va a la següent o, si era
     l'última, a la píndola nova (va al final de les triades). */
  const triaSuggerida = (tag) => {
    setFocusDesti({ llista: 'suggerides', index: suggerides.indexOf(tag), reserva: customTags.length });
    addTag(tag, { buidaCamp: false });
  };
  const commutaCategoria = (categoria) => setCategories((actuals) => (
    actuals.includes(categoria) ? actuals.filter((c) => c !== categoria) : [...actuals, categoria]
  ));
  const addCategoria = (categoria) => { setCategories((actuals) => ambValor(actuals, categoria)); setCategoriaInput(''); };

  const grupsDeLaTria = grups.filter((grup) => grupsTriats.includes(grup.id));
  const tria = { mode, persones: mode === 'persones' ? persones : [], grups: mode === 'grups' ? grupsDeLaTria : [] };
  const faltenDestins = (mode === 'persones' && persones.length === 0) || (mode === 'grups' && grupsDeLaTria.length === 0);
  const nomCarpeta = displayFolders.find((folder) => folder.id === selectedFolder)?.name || 'Connectats';

  const handleConnect = async () => {
    if (!selectedFolder || isSaving || (potGuardar && faltenDestins)) return;
    setError(null);
    setIsSaving(true);
    try {
      if (!potGuardar) {
        showToast(t('section.connectar.simulat', 'Mode Foraster: simulant que es guarda. Registra’t per fer-ho real.'), 'info');
        setTimeout(() => navigate(-1), 1000);
        return;
      }
      const origenDesat = { ...origen, abast: normalitzaAbast(tria) };
      const nota = await creaNota({
        title: contextTitle,
        content: contingutDeLaConnexio(origen),
        folderId: selectedFolder,
        tags: customTags,
        categories,
        origen: origenDesat
      });
      const rutaNota = nota?.id ? `/notes?nota=${encodeURIComponent(nota.id)}` : '/notes';
      if (mode === 'privada') {
        showToast(t('section.connectar.desat', 'Element connectat al teu MAS: el trobaràs a «Connectats».'), 'success');
        /* T54 · replace: «arrere» des del lector torna a l'original, no a este formulari ja desat. */
        navigate(rutaNota, { replace: true });
        return;
      }
      const missatge = missatgeDeConnexio(origen, origen.ruta ? urlPerCompartir(origen.ruta) : '');
      const { resultats } = await aplica({ nota, origen: origenDesat, abast: tria, missatge });
      setResum({
        ruta: rutaNota,
        resultats: [{ clau: 'mas', nom: 'El teu MAS', estat: 'fet', detall: `Guardada a «${nomCarpeta}».` }, ...resultats]
      });
    } catch (err) {
      setError(missatgeDeLError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const n = mode === 'persones' ? persones.length : grupsDeLaTria.length;
  const etiquetaGuardar = !potGuardar ? 'Simular Guardat'
    : mode === 'persones' ? `Guardar i enviar a ${n} ${n === 1 ? 'persona' : 'persones'}`
      : mode === 'grups' ? `Guardar i enviar a ${n} ${n === 1 ? 'grup' : 'grups'}`
        : 'Guardar Connexió';

  return (
    <UniversalPage
      chrome="system"
      title="Connectar"
      subtitle="On vols guardar açò?"
      lead="Tria on la guardes, qui la pot vore i com la trobaràs després."
      onConnect={false}
    >
      <div className="sdp-connectar">
        {isGuest && (
          <Alerta to="avis" titol="Mode Foraster actiu">
            {potGuardar
              ? 'Sense sessió, la connexió es guarda només en este dispositiu. Quan et registres, el teu MAS la conservarà de debò.'
              : 'Estàs provant la funcionalitat en mode simulació. Explora, crea carpetes i organitza este element com vullgues. Quan et registres, el teu MAS guardarà els elements permanentment de debò.'}
          </Alerta>
        )}

        <section className="sdp-connectar__objecte" aria-labelledby={`${id}-objecte`}>
          <p className="sdp-connectar__tipus">{ETIQUETA_OBJECTE[origen.objecte] || 'Element'}</p>
          {/* T54 · mini-card de lectura: foto i títol, sense peu ni data
              clicable. Sense foto (perfil, pàgina o element que no és ací), la
              icona de capes ocupa el lloc de la icona del títol perquè la
              targeta no quede en una línia de text nua. */}
          <div id={`${id}-objecte`} className="sdp-connectar__previsualitzacio">
            <UniversalCard
              title={contextTitle}
              imageUrl={imatgeOriginal || undefined}
              imageAlt=""
              icon={imatgeOriginal ? undefined : <Layers size={32} aria-hidden="true" focusable="false" />}
              hasFooter={false}
              onDateTime={false}
              showDateTime={false}
            />
          </div>
          {autorVisible ? <p className="sdp-connectar__autor">{`De ${autorVisible}`}</p> : null}
          {persona ? <p className="sdp-connectar__identitat">{`Es guarda al MAS de ${persona}.`}</p> : null}
          {actuaComEntitat ? (
            <p className="sdp-connectar__identitat">{`Actues com a ${actor.nom}, però les connexions són personals.`}</p>
          ) : null}
        </section>
        {/* T43b-3 · el nom de l'organització no ve de l'URL (title): el resol el bloc d'una font de confiança. */}
        {params.get('organitzacio') ? <BlocAdministrarOrganitzacio orgId={params.get('organitzacio')} config={config} /> : null}

        <section className="sdp-connectar__seccio" aria-labelledby={`${id}-privacitat`}>
          <h3 id={`${id}-privacitat`} className="sdp-connectar__titol-seccio">Privacitat de la connexió</h3>
          <GrupOpcions
            llegenda="Qui ho pot vore?"
            nom={`${id}-abast`}
            aspecte="targetes"
            textTriada="Triada"
            opcions={opcions}
            valor={mode}
            onCanvi={setModeTriat}
            disabled={isSaving || Boolean(resum)}
          />

          {mode === 'persones' ? (
            <div ref={panellPersonesRef} className="sdp-connectar__panell">
              <Camp etiqueta="Cerca al padró del poble" ajuda={`Tria fins a ${LIMIT_PERSONES} persones. Només reben l’enllaç: la connexió continua sent teua.`}>
                <CampText value={cerca} onChange={(e) => setCerca(e.target.value)} autoComplete="off" />
              </Camp>
              {padro.estat === 'carregant' ? <Carregant etiqueta="Buscant al padró…" /> : null}
              {padro.error ? <Alerta to="error">{padro.error}</Alerta> : null}
              {padro.estat === 'llest' && padro.membres.length === 0 ? (
                <p className="sdp-connectar__ajuda">Ningú del padró coincidix amb la cerca.</p>
              ) : null}
              {padro.membres.length > 0 ? (
                <ul className="sdp-connectar__pindoles" aria-label="Gent del padró">
                  {padro.membres.map((membre) => {
                    const clau = String(membre.usuari_id);
                    const triada = persones.some((p) => p.id === clau);
                    return (
                      <li key={clau}>
                        <button type="button" className="sdp-connectar__pindola" aria-pressed={triada}
                          disabled={!triada && persones.length >= LIMIT_PERSONES}
                          onClick={() => commutaPersona(membre)}>
                          {membre.tipus === 'entitat' ? `${membre.nom} · entitat` : membre.nom}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              <p className="sdp-connectar__ajuda" aria-live="polite">{`${persones.length} de ${LIMIT_PERSONES} persones triades.`}</p>
              {persones.length > 0 ? (
                <ul ref={personesTriadesRef} className="sdp-connectar__pindoles" aria-label="Persones triades">
                  {persones.map((p) => (
                    <li key={p.id}>
                      <button type="button" className="sdp-connectar__pindola sdp-connectar__pindola--triada"
                        aria-label={`Lleva ${p.nom} de la llista`} onClick={() => llevaPersona(p.id)}>
                        {p.nom}<X size={16} aria-hidden="true" focusable="false" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {mode === 'grups' ? (
            <div className="sdp-connectar__panell">
              <GrupCamps llegenda={`Grups de xat on ja eres (fins a ${LIMIT_GRUPS})`}>
                {grups.map((grup) => {
                  const triat = grupsTriats.includes(grup.id);
                  return (
                    <Casella key={grup.id} etiqueta={grup.nom} checked={triat}
                      disabled={!triat && grupsTriats.length >= LIMIT_GRUPS}
                      onChange={() => commutaGrup(grup.id)} />
                  );
                })}
              </GrupCamps>
            </div>
          ) : null}

          {/* T54 · al MAS la connexió es llig (ConnexioDetall) i des del lector es
              compartix al Mur. Guardar no la publica: es diu quin és el pas. */}
          {mode === 'poble' ? (
            <Alerta to="info" titol="Compartir al Mur, un pas més">
              La tria es guarda amb la connexió, però el Mur no la rep sola: obri-la al teu MAS i prem «Compartir al Mur». El Mur el llig la gent registrada del poble, no Internet.
            </Alerta>
          ) : null}
        </section>

        <section className="sdp-connectar__seccio" aria-labelledby={`${id}-caixa`}>
          <h3 id={`${id}-caixa`} className="sdp-connectar__titol-seccio">Caixa principal</h3>
          <p className="sdp-connectar__ajuda">
            Tota connexió naix a «Connectats»; des d’allí la podràs moure a qualsevol carpeta del teu Bloc.
          </p>
          <div className="sdp-connectar__carpetes">
            {displayFolders.map((folder) => {
              const Icon = iconaDeCarpeta(folder.id);
              const isSelected = selectedFolder === folder.id;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => setSelectedFolder(folder.id)}
                  className="sdp-connectar__carpeta"
                  aria-pressed={isSelected}
                >
                  <Icon size={32} className="sdp-connectar__carpeta-icona" aria-hidden="true" />
                  <span className="sdp-connectar__carpeta-nom">{folder.name}</span>
                  {/* Correcció C18 (260928) · La triada es llig sense color (la
                      vora taronja no arriba al 3:1). Sempre hi és, perquè triar
                      no moga la graella, i només es veu en la triada (CSS, des
                      d'aria-pressed, que ja diu l'estat: aria-hidden). */}
                  <span className="sdp-insignia sdp-insignia--exit sdp-connectar__carpeta-insignia" aria-hidden="true">
                    <Check size={16} aria-hidden="true" focusable="false" />Triada
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="sdp-connectar__seccio" aria-labelledby={`${id}-categories`}>
          <h3 id={`${id}-categories`} className="sdp-connectar__titol-seccio">Categories</h3>
          <p className="sdp-connectar__ajuda">Opcional: la connexió també apareixerà en estes categories del teu Bloc.</p>
          <ul className="sdp-connectar__pindoles" aria-label="Categories del teu Bloc">
            {[...new Set([...categoriesDisponibles, ...categories])].map((categoria) => (
              <li key={categoria}>
                <button type="button" className="sdp-connectar__pindola" aria-pressed={categories.includes(categoria)}
                  onClick={() => commutaCategoria(categoria)}>
                  {categoria}
                </button>
              </li>
            ))}
          </ul>
          <div className="sdp-connectar__entrada">
            <Camp etiqueta="Categoria nova">
              <CampText value={categoriaInput} onChange={(e) => setCategoriaInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategoria(categoriaInput); } }} />
            </Camp>
            <Boto onClick={() => addCategoria(categoriaInput)} disabled={!categoriaInput.trim()}>Afegir categoria</Boto>
          </div>
        </section>

        <section className="sdp-connectar__seccio" aria-labelledby={`${id}-context`}>
          <h3 id={`${id}-context`} className="sdp-connectar__titol-seccio">Assistent de context</h3>
          <p className="sdp-connectar__ajuda">
            La IAIA et suggereix estes etiquetes en base al sistema de Poble. Afig tu les que vullgues per trobar-ho ràpid.
          </p>
          <ul ref={etiquetesRef} className="sdp-connectar__pindoles" aria-label="Etiquetes">
            {suggerides.map((tag) => (
              <li key={tag}>
                <button type="button" onClick={() => triaSuggerida(tag)} className="sdp-connectar__pindola">{tag}</button>
              </li>
            ))}
            {customTags.map((tag) => (
              <li key={tag}>
                <button type="button" onClick={() => removeTag(tag)} className="sdp-connectar__pindola sdp-connectar__pindola--triada"
                  aria-label={`Lleva l’etiqueta ${tag}`}>
                  {tag}<X size={16} aria-hidden="true" focusable="false" />
                </button>
              </li>
            ))}
          </ul>
          <div ref={etiquetaLliureRef} className="sdp-connectar__entrada">
            <Camp etiqueta="Etiqueta lliure">
              <CampText value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }} />
            </Camp>
            <Boto onClick={() => addTag(tagInput)} disabled={!tagInput.trim()}>Afegir</Boto>
          </div>
        </section>

        <div className="sdp-connectar__peu">
          {error ? <Alerta to="error" titol="La connexió no s’ha guardat">{error}</Alerta> : null}
          {resum ? (
            <div ref={resumRef} tabIndex={-1} className="sdp-connectar__resum">
              <ResumConnexio
                resultats={resum.resultats}
                accions={(
                  <Boto varietat="primari" onClick={() => navigate(resum.ruta, { replace: true })}>
                    Obrir la connexió al teu MAS
                  </Boto>
                )}
              />
            </div>
          ) : (
            <>
              <Boto varietat="primari" mida="gran" ple onClick={handleConnect} carregant={isSaving}
                disabled={!selectedFolder || (potGuardar && faltenDestins)}>
                {etiquetaGuardar}
              </Boto>
              <p className="sdp-connectar__nota">
                {mode === 'persones' || mode === 'grups'
                  ? (faltenDestins
                    ? (mode === 'persones' ? 'Tria almenys una persona del padró.' : 'Tria almenys un grup.')
                    : 'L’enviament per xat no es pot desfer.')
                  : 'Al teu MAS la llegiràs i la podràs canviar de carpeta; les categories i les etiquetes, tria-les ara.'}
              </p>
            </>
          )}
        </div>
      </div>
    </UniversalPage>
  );
}

/**
 * T71 · Un contingut de FORA (una web) arriba amb `url`. Es mostra validat
 * (contingutExtern.js) i només el guarda un clic, com una nota nova i
 * editable a «Connectats». Carregar la ruta no crea res. La imatge de
 * l'altra web ni es copia ni es carrega (cap hotlink): la targeta porta una
 * icona, i la url es mostra com a text, no com a enllaç.
 */
function ConnectarContingutExtern({ params }) {
  const { showToast } = useToast();
  const { t } = useUIActions();
  const navigate = useNavigate();
  const { currentUser } = useSession();
  const { creaNota, canCreate } = useNotesData();
  const id = useId();
  const contingut = useMemo(() => contingutExternDeParams(params), [params]);
  const valor = contingut?.ok ? contingut.valor : null;
  const motius = contingut && !contingut.ok ? Object.values(contingut.errors) : [];
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  /* Com l'element intern: sense sessió, en seed i local es guarda al
     dispositiu; en remot, el Foraster només simula. */
  const potGuardar = Boolean(canCreate);

  const guarda = async () => {
    if (!valor || isSaving) return;
    setError(null);
    if (!potGuardar) {
      showToast(t('section.connectar.simulat', 'Mode Foraster: simulant que es guarda. Registra’t per fer-ho real.'), 'info');
      return;
    }
    const entrada = notaDeContingutExtern(valor);
    if (!entrada) return;
    setIsSaving(true);
    try {
      const nota = await creaNota(entrada);
      showToast('Guardat a «Connectats». És una nota teua: la pots editar.', 'success');
      navigate(nota?.id ? `/notes?nota=${encodeURIComponent(nota.id)}` : '/notes', { replace: true });
    } catch (err) {
      setError(missatgeDeLError(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <UniversalPage
      chrome="system"
      title="Connectar"
      subtitle="On vols guardar açò?"
      lead="Un enllaç de fora de Sóc de Poble es guarda com una nota teua, que podràs editar."
      onConnect={false}
    >
      <div className="sdp-connectar">
        {!currentUser ? (
          <Alerta to="avis" titol="Mode Foraster actiu">
            {potGuardar
              ? 'Sense sessió, l’enllaç es guarda només en este dispositiu.'
              : 'Estàs provant la funcionalitat en mode simulació: no es guardarà res fins que et registres.'}
          </Alerta>
        ) : null}

        <section className="sdp-connectar__objecte" aria-labelledby={`${id}-objecte`}>
          <p className="sdp-connectar__tipus">Enllaç de fora de Sóc de Poble</p>
          {valor ? (
            <>
              <div id={`${id}-objecte`} className="sdp-connectar__previsualitzacio">
                <UniversalCard
                  title={valor.titol}
                  subtitle={valor.subtitol || undefined}
                  body={valor.entradilla || undefined}
                  icon={<Globe size={32} aria-hidden="true" focusable="false" />}
                  hasFooter={false}
                  onDateTime={false}
                  showDateTime={false}
                />
              </div>
              <p className="sdp-connectar__autor">{`De ${valor.lloc}`}</p>
              <p className="sdp-connectar__identitat">{valor.url}</p>
            </>
          ) : (
            <p id={`${id}-objecte`} className="sdp-connectar__autor">Este enllaç no es pot guardar.</p>
          )}
        </section>

        {motius.length ? (
          <Alerta to="error" titol="Este enllaç no es pot guardar">{motius.join(' ')}</Alerta>
        ) : null}

        <div className="sdp-connectar__peu">
          {error ? <Alerta to="error" titol="L’enllaç no s’ha guardat">{error}</Alerta> : null}
          {valor ? (
            <>
              <Boto varietat="primari" mida="gran" ple onClick={guarda} carregant={isSaving}>
                {potGuardar ? 'Guardar a Connectats' : 'Simular Guardat'}
              </Boto>
              <p className="sdp-connectar__nota">
                Es guarda com una nota nova a «Connectats», que podràs editar. La imatge de l’altra web no es copia.
              </p>
            </>
          ) : null}
        </div>
      </div>
    </UniversalPage>
  );
}
