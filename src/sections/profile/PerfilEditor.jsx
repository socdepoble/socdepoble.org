import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DocumentEditor } from '../../components/universal/DocumentEditor';
import { desaLlicenciaPerDefecte, sincronitzaLlicenciaPerDefecte } from '../../components/universal/drets/herencia.js';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { Alerta } from '../../components/PedraSeca/index.js';
import { usePerfil } from './PerfilContext.jsx';
import { DialegCapcaleraAvatar } from './DialegCapcaleraAvatar.jsx';
import { bloqueigDeFitxa, textosDeFitxa } from './visibilitatFitxa.js';
import {
  CAMPS_FITXA, LIMITS_TEXT, documentDeFitxa, fitxaDeLectura, llargariaDeCamp, menaDeFitxa, retallaCamp, textDeCamp, valorPerDesar,
} from './perfilCamps.js';
import { ENTITATS_FITXA } from './perfilEscriptor.js';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { useAutodesament } from '../../data/autodesament/useAutodesament.js';
import { useResolvedAsset } from '../../hooks/useResolvedAsset.js';

/* Qui pot editar la fitxa d'una organització (la RLS ho torna a dir al servidor). */
const ROLS_QUE_EDITEN = new Set(['owner', 'admin']);

/* T47 (ordre del Mestre, 260928) · Els errors de desat ja no són toasts
   efímers: van en línia, davall del camp, i el text es conserva. PostgREST
   diu PGRST204 (o Postgres 42703) quan la columna no existix: passa mentre
   una migració no s'ha aplicat. */
export const AVIS_SENSE_COLUMNA = 'Este camp encara no té columna al servidor';

/* Camps de text de la fitxa amb límit de llargària: comptador a partir del 80 %. */
const CAMPS_AMB_COMPTADOR = Object.freeze(['title', 'subtitle', 'lead']);
const LLINDAR_COMPTADOR = 0.8;

/** On es guarda de veres el que encara no té el servidor. */
const llocDelText = (persistent) => (persistent ? 'en este dispositiu' : 'en esta pestanya');

/** Un error de validació per excés de llargària (el que té eixida «Retallar»). */
const esMassaLlarg = (error) => error?.tipus === 'validacio'
  && error.maxim != null && error.llargaria != null && error.llargaria > error.maxim;

/**
 * El missatge en línia d'un error de camp. Honest: diu on és el text i què falta.
 * T47 (correcció de la revisió) · Va dins d'una alerta (role=alert), que el
 * lector relleu sencera a cada canvi: el text ha de ser ESTABLE mentre
 * s'escriu. La llargària viva («183 de 120») va al comptador, fora de l'alerta.
 * T47 (correcció de la revisió C01, 260928) · Eixir de la sessió l'esborra
 * d'este dispositiu (després d'avisar-ho): el text ho diu.
 */
function missatgeDError(error, persistent) {
  const lloc = llocDelText(persistent);
  if (esMassaLlarg(error)) return `Com a màxim ${error.maxim} caràcters. El text es guarda ${lloc} fins que l’escurces o tanques la sessió.`;
  if (error.tipus === 'validacio') return `${error.missatge} El text es guarda ${lloc} fins que el corregisques o tanques la sessió.`;
  if (error.tipus === 'columna') {
    return `${AVIS_SENSE_COLUMNA}${error.columna ? ` («${error.columna}»)` : ''}: el canvi es guarda ${lloc} fins que s’aplique la migració o tanques la sessió.`;
  }
  if (error.tipus === 'conflicte') return `Hi ha una versió més nova al servidor. El teu text es guarda ${lloc} fins que tries o tanques la sessió.`;
  /* T47 (correcció de la revisió, 260928) · Ara també arriben ací els
     missatges de l'adaptador (frases amb punt final): sense «.).». */
  const motiu = String(error.missatge || '').replace(/[.\s]+$/, '');
  return `El servidor no ha acceptat el canvi${motiu ? ` (${motiu})` : ''}. El text es guarda ${lloc} fins que tanques la sessió.`;
}

/** El text de la ploma (EstatDesament) quan cal més que el text per defecte. */
function detallDesament(desament) {
  const lloc = llocDelText(desament.persistent);
  if (desament.problema?.tipus === 'temporal') {
    const motiu = desament.problema.missatge ? ` (${desament.problema.missatge})` : '';
    return `No s’ha pogut desar${motiu}. Es tornarà a provar sol; mentrestant, el text es guarda ${lloc} fins que tanques la sessió.`;
  }
  if (desament.estat === 'error') return `Hi ha canvis que el servidor encara no té: mira els avisos del document. Es guarden ${lloc} fins que tanques la sessió.`;
  return '';
}

/* Lògica d'Usuari (T4): la fitxa d'un agent IA es diu clarament el que és. */
export const ETIQUETA_IA = 'Intel·ligència artificial';
export const AVIS_FITXA_IA = 'Esta fitxa és d’una intel·ligència artificial de Sóc de Poble. La mantenen les persones que administren l’entitat; el que hi escrigues és el que veurà tot el poble.';

/**
 * La fitxa de la persona, de l'organització o d'un agent IA, amb l'Editor
 * Universal (D2 i D13): H1 = nom, H2 = bio / descripció / rol, entradilla =
 * lema, cos = presentació. Qui només n'és membre la veu en lectura.
 */
export function PerfilEditor({ identitat }) {
  const { guardarCampPerfil, pujaMitja, recarrega, identitats, autodesament } = usePerfil();
  const { showToast } = useToast();
  const mena = menaDeFitxa(identitat);
  const dades = identitat?.dades || {};
  const esAgent = mena === 'agent';
  /* Amb una baixa en curs el servidor té el perfil congelat (política
     restrictiva «profiles sense baixa»): cap desat arribaria. La fitxa es veu
     en lectura i es desfà cancel·lant la baixa des de «El compte». */
  const enBaixa = mena === 'persona' && Boolean(dades.baixa_demanada_at);
  /* La lectura de profiles ha fallat i getProfile ha tornat la fila de reserva
     (només nom i foto de la sessió): editar-la trepitjaria la bio, el lema i la
     presentació de veres amb camps buits. En lectura fins que es torne a llegir. */
  const deReserva = mena === 'persona' && dades.reserva === true;
  const potEditar = !enBaixa && !deReserva && (mena === 'persona' || esAgent || ROLS_QUE_EDITEN.has(dades.role));
  /* list_my_organizations no porta el poble: el d'una entitat és el de la persona. */
  const poble = dades.town_name
    || (identitats || []).find((i) => i?.mena === 'persona')?.dades?.town_name
    || '';

  /* T39 (ordre del Mestre, 260928) · L'id amb què les notes noves hereten els
     drets d'esta fitxa: el de l'actor (IdentitatContext). La persona NO és
     `identitat.id` ('jo') sinó l'id de la seua fila; l'organització, el seu id.
     Un agent IA no signa notes: sense herència. */
  const idHerencia = mena === 'persona' ? (dades.id ?? null) : esAgent ? null : identitat.id;
  const copyrightServidor = dades.copyright;

  /* T47 (ordre del Mestre, 260928) · La fitxa es desa sola, com Google Docs.
     Cada tecla va a la cua d'autodesament (memòria i IndexedDB) ABANS de cap
     xarxa; la cua l'envia en una pausa, en el blur o quan l'editor es
     desmunta, i no l'oblida fins que el servidor confirma eixa versió. Un
     text que el servidor no accepta (massa llarg, sense columna) es queda
     com a esborrany amb l'avís en línia: mai es perd en eixir i tornar. */
  const ref = useMemo(() => (autodesament && potEditar ? {
    ambit: autodesament.ambit, context: autodesament.context, entitat: ENTITATS_FITXA[mena], id: identitat.id,
  } : null), [autodesament, potEditar, mena, identitat.id]);
  const desament = useAutodesament(ref);

  /* T39 (correcció de la revisió, 260928) · La preferència heretable és el
     mirall dels drets d'esta fitxa en este dispositiu:
       · mentre la cua guarda un esborrany de «Desar autoria» (també si el
         servidor l'ha rebutjat, p. ex. sense la columna), l'esborrany;
       · si no, el valor del servidor cada vegada que n'arriba un de nou (en
         obrir la fitxa o quan canvia), damunt de qualsevol còpia vella: el
         canvi fet en un altre dispositiu arriba ací en obrir la fitxa.
     «De nou» i no «sempre»: en confirmar un desat, la cua es buida un render
     abans que la fitxa porte el valor confirmat, i el vell no l'ha de
     trepitjar. Un servidor buit no esborra res (la columna pot faltar): qui
     hi renuncia és «Tornar al que hi ha desat» (descarta). */
  const esborranyCopyright = desament.camps.copyright;
  const servidorVist = useRef(null);
  useEffect(() => {
    if (!potEditar) return;
    const vist = servidorVist.current;
    const nou = !vist || vist.id !== idHerencia || vist.valor !== copyrightServidor;
    servidorVist.current = { id: idHerencia, valor: copyrightServidor };
    if (esborranyCopyright !== undefined) sincronitzaLlicenciaPerDefecte(idHerencia, esborranyCopyright);
    else if (nou) sincronitzaLlicenciaPerDefecte(idHerencia, copyrightServidor);
  }, [potEditar, idHerencia, copyrightServidor, esborranyCopyright]);

  /* El que s'està escrivint guanya a les dades del servidor, i en obrir la
     fitxa comença amb l'esborrany que haja quedat (PerfilScope ja l'ha
     carregat abans de deixar editar). */
  const [local, setLocal] = useState(() => ({ ...desament.camps }));
  const fitxa = useMemo(() => documentDeFitxa(identitat, local), [identitat, local]);
  /* El que diu el servidor, sense el que s'està escrivint: un blur sense canvis no desa. */
  const original = useMemo(() => documentDeFitxa(identitat), [identitat]);

  const posaLocal = useCallback((camp, valor) => {
    setLocal((previ) => (previ[camp] === valor ? previ : { ...previ, [camp]: valor }));
  }, []);

  /* T47 (correcció de la revisió C04, 260928) · El valor que el servidor té ara
     per a un camp, tal com es desaria: és la base de l'esborrany (el que la
     persona tenia davant) i el que `verifica` hi compara en obrir la fitxa. */
  const valorServidor = useCallback((camp) => {
    try { return valorPerDesar(mena, camp, original[camp]).valor; } catch {
      return camp === 'content' ? String(original[camp] ?? '') : textDeCamp(original[camp]);
    }
  }, [mena, original]);
  /* Només el primer canvi d'un camp porta la base; els següents l'hereten a la cua. */
  const ambBase = useCallback((camp) => (
    ref && !Object.hasOwn(cuaDesament.llig(ref).camps, camp) ? { baseValor: valorServidor(camp) } : undefined
  ), [ref, valorServidor]);

  /* C04 · En obrir la fitxa amb dades fresques (i quan n'arriben de noves): un
     esborrany d'una altra sessió no s'envia sol. Si la seua base és el que hi ha
     al servidor, ix; si algú l'ha canviat mentrestant (un altre dispositiu), es
     queda en conflicte i la persona tria. */
  useEffect(() => {
    if (!ref) return;
    const servidor = Object.fromEntries(Object.keys(CAMPS_FITXA[mena]).map((camp) => [camp, valorServidor(camp)]));
    void cuaDesament.verifica(ref, servidor);
  }, [ref, mena, valorServidor]);

  const updateLocal = useCallback((_id, camp, valor) => {
    posaLocal(camp, valor);
    if (ref) cuaDesament.encua(ref, camp, valor, ambBase(camp));
  }, [ref, posaLocal, ambBase]);

  /* Torna una promesa que es resol quan el carril queda quiet (true: desat).
     No rebutja mai: una fallada es queda a la cua i es veu en línia. */
  const saveRemote = useCallback((_id, camp, valor) => {
    if (!ref) return Promise.resolve(false);
    /* T39 (ordre del Mestre, 260928) · Els drets de la fitxa són els de sèrie
       de les notes noves: la preferència es desa ABANS de la xarxa i de la
       comparació «igual», perquè quede encara que el servidor el rebutge
       (p. ex. sense la columna). Sense cua (`ref`) la fitxa no desa res, i
       la preferència tampoc (correcció de la revisió). */
    if (camp === 'copyright') desaLlicenciaPerDefecte(idHerencia, valor);
    if (!Object.hasOwn(cuaDesament.llig(ref).camps, camp)) {
      /* L'editor desa a cada blur, també sense haver tocat res. Comparat amb el
         valor del servidor passat pel mateix camí, un blur així no envia res: ni
         aplana una descripció de diversos paràgrafs ni fa un PUT i un PATCH. */
      let igual = false;
      try { igual = valorPerDesar(mena, camp, original[camp]).valor === valorPerDesar(mena, camp, valor).valor; } catch { igual = false; }
      if (igual) return Promise.resolve(true);
    }
    posaLocal(camp, valor);
    cuaDesament.encua(ref, camp, valor, ambBase(camp));
    return cuaDesament.desaAra(ref, camp);
  }, [ref, mena, original, posaLocal, idHerencia, ambBase]);

  /* Les dues eixides d'un avís en línia. «Retallar» escurça al límit i desa;
     «Tornar al que hi ha desat» renuncia a l'esborrany d'eixe camp. */
  const retalla = useCallback((camp, maxim) => {
    const retallat = retallaCamp(fitxa[camp] ?? '', maxim);
    posaLocal(camp, retallat);
    if (!ref) return;
    cuaDesament.encua(ref, camp, retallat, ambBase(camp));
    void cuaDesament.desaAra(ref, camp);
  }, [fitxa, ref, posaLocal, ambBase]);
  const descarta = useCallback((camp) => {
    setLocal((previ) => {
      if (!Object.hasOwn(previ, camp)) return previ;
      const resta = { ...previ };
      delete resta[camp];
      return resta;
    });
    if (!ref) return;
    cuaDesament.descarta(ref, camp);
    /* T39 (correcció de la revisió, 260928) · Renunciar a l'esborrany dels
       drets hi renuncia també per a les notes noves: la preferència torna al
       valor del servidor (sense valor, s'esborra). Si no, una CC0 rebutjada
       continuaria dedicant cada nota nova al domini públic. */
    if (camp === 'copyright') desaLlicenciaPerDefecte(idHerencia, copyrightServidor);
  }, [ref, idHerencia, copyrightServidor]);
  const reintenta = useCallback((camp) => {
    if (ref) void cuaDesament.reintenta(ref, camp);
  }, [ref]);
  /* C04 · «Conservar el meu»: l'esborrany guanya al que ara té el servidor,
     que passa a ser la seua base. */
  const conserva = useCallback((camp) => {
    if (ref) void cuaDesament.conserva(ref, camp, valorServidor(camp));
  }, [ref, valorServidor]);

  /* Davall dels camps: l'error persistent (role=alert) i, a partir del 80 %
     del límit, el comptador. La closca (UniversalEditorShell) els pinta. */
  const avisosCamps = useMemo(() => {
    if (!ref) return undefined;
    const avisos = {};
    for (const camp of CAMPS_AMB_COMPTADOR) {
      const maxim = LIMITS_TEXT[CAMPS_FITXA[mena][camp]]?.[1];
      if (!maxim) continue;
      const llargaria = llargariaDeCamp(fitxa[camp]);
      if (llargaria >= maxim * LLINDAR_COMPTADOR) avisos[camp] = { comptador: { llargaria, maxim } };
    }
    for (const [camp, error] of Object.entries(desament.errors)) {
      const accions = [];
      const massaLlarg = esMassaLlarg(error);
      if (massaLlarg && CAMPS_AMB_COMPTADOR.includes(camp)) {
        accions.push({ text: `Retallar a ${error.maxim}`, onClick: () => retalla(camp, error.maxim) });
      }
      if (error.tipus === 'servidor') accions.push({ text: 'Tornar a provar', onClick: () => reintenta(camp) });
      if (error.tipus === 'conflicte') accions.push({ text: 'Conservar el meu', onClick: () => conserva(camp) });
      accions.push({ text: 'Tornar al que hi ha desat', onClick: () => descarta(camp) });
      /* La xifra viva sempre al comptador (fora de l'alerta), també per al cos. */
      const comptador = avisos[camp]?.comptador
        ?? (massaLlarg ? { llargaria: error.llargaria, maxim: error.maxim } : undefined);
      avisos[camp] = {
        ...(comptador ? { comptador } : {}),
        error: { missatge: missatgeDError(error, desament.persistent), accions },
      };
    }
    return avisos;
  }, [ref, mena, fitxa, desament, retalla, reintenta, conserva, descarta]);

  /* La ploma de la skill sdp-universal-editor §1, a la barra taronja.
     T47 (correcció de la revisió) · Amb `ref`, PerfilScope té àmbit, i només en
     té amb la persona dins de la sessió de React: ací 'sessio' vol dir la
     finestra d'una renovació del JWT (el port diu «ningú» fins que aterra), no
     «cal tornar a entrar». La cua ho torna a enviar quan la sessió es renova
     ('sdp:auth-change'): es pinta com a pendent. */
  const estatDesament = useMemo(
    () => (ref ? { estat: desament.estat === 'sessio' ? 'pendent' : desament.estat, detall: detallDesament(desament) } : undefined),
    [ref, desament],
  );

  /* T41 (ordre del Mestre, 260928) · PUBLICAR i la bola del món obrin el
     selector de visibilitat (DocumentEditor). Confirmar POSA el valor triat,
     no el commuta: persona → is_public; organització → visibility
     ('public' | 'members'). Sense canvi, o per a un agent (sempre pública),
     no toca res. Sense toast d'èxit: es veu en la icona i en la finestra que
     es tanca. Un error es llança perquè el selector el pinte en línia. */
  const triaVisibilitat = useCallback(async (publica) => {
    if (esAgent || publica === Boolean(fitxa.isPublished)) return true;
    /* T47 · Canviar la visibilitat salta la pausa: el que s'acaba d'escriure ix abans. */
    if (ref) await cuaDesament.desaAra(ref);
    if (mena === 'persona') await guardarCampPerfil('is_public', publica, identitat.id);
    else await guardarCampPerfil('visibility', publica ? 'public' : 'members', identitat.id);
    return true;
  }, [esAgent, fitxa.isPublished, mena, guardarCampPerfil, identitat.id, ref]);
  const visibilitat = useMemo(() => ({
    textos: textosDeFitxa(mena),
    bloqueig: bloqueigDeFitxa(mena),
    onTria: triaVisibilitat,
  }), [mena, triaVisibilitat]);

  const uploadMedia = useCallback(
    (fitxer) => pujaMitja(fitxer, mena === 'persona' ? 'avatars' : esAgent ? 'agents' : 'organitzacions'),
    [pujaMitja, mena, esAgent],
  );

  /* T35 · Sense el logotip damunt del nom, la barra taronja és l'únic lloc de
     la fitxa on es veu l'avatar. Una foto pujada és una referència opaca
     (sdp-media://) que PageFrame no resol (resolveAsset síncron): es resol ací
     pel port. La resta de valors passen tal qual. */
  const avatarDesat = identitat.avatar || '';
  const avatarResolt = useResolvedAsset(avatarDesat);
  const avatarBarra = avatarDesat.startsWith('sdp-media://') ? avatarResolt : avatarDesat;

  /* T35 (ordre del Mestre, 260928) · Cas ÚNIC del Perfil: el botó de la
     capçalera obri DialegCapcaleraAvatar (capçalera, avatar o les dues).
     La closca hi passa `acaba`, que la torna a la imatge quan s'ha desat. */
  const [dialegImatge, setDialegImatge] = useState(null);
  const obriDialegImatge = useCallback((control) => setDialegImatge(control || {}), []);
  const tancaDialegImatge = useCallback((motiu) => {
    if (motiu === 'desat') dialegImatge?.acaba?.();
    setDialegImatge(null);
  }, [dialegImatge]);
  const desaImatge = useCallback(
    (camp, valor) => saveRemote(identitat.id, camp, valor),
    [saveRemote, identitat.id],
  );

  const adapter = useMemo(() => {
    const etiquetes = enBaixa ? [{ text: identitat.rol }, { text: 'Baixa en curs' }]
      : deReserva ? [{ text: identitat.rol }, { text: 'Sense connexió' }]
        : esAgent ? [{ text: identitat.rol }, { text: ETIQUETA_IA }]
          : [{ text: identitat.rol }];
    return {
      document: potEditar ? fitxa : null,
      emptyDocument: potEditar ? undefined : { ...fitxaDeLectura(identitat), labels: etiquetes },
      updateLocal,
      saveRemote,
      /* T41 · el selector de visibilitat (PUBLICAR i la bola del món). La
         identitat ja no va a la barra taronja (T40): viu a la barra negra.
         La fitxa no té data de publicació: sense `ambDataPublicacio`. */
      visibilitat,
      uploadMedia,
      labels: etiquetes,
      /* D13: les eines baixen davall de l'entradilla. La fitxa no porta
         llavor, i ho diu: sense la clau, DocumentEditor hi posa la de Notes. */
      posicioEines: 'davall-entradilla',
      seedContent: null,
      /* T35 · Un sol botó per a capçalera i avatar. El logotip damunt del nom
         desapareix, com a la fitxa pública (PerfilPublicSection, showLogos
         false): l'avatar es veu a la barra taronja i s'edita des del diàleg. */
      heroEditLabel: 'Editar capçalera i avatar',
      heroEditHelp: 'Tria si la imatge va a la capçalera, a l’avatar o a les dues.',
      onHeroEdit: obriDialegImatge,
      showLogoUpload: false,
      barAuthorAvatar: avatarBarra,
      barAuthorName: identitat.nom,
      barAuthorLocation: poble,
      /* T47 · La ploma de l'autodesament i els avisos en línia dels camps. */
      estatDesament,
      avisosCamps,
      /* T39 (ordre del Mestre, 260928) · La vista de drets d'autor diu que estos
         són els de sèrie de les notes noves (un agent no en signa: sense avís).
         L'autor és el mateix nom del «© Nom» de sèrie de la fitxa. */
      dretsAutor: { ambit: esAgent ? 'neutre' : 'perfil', autor: fitxaDeLectura(identitat).title },
    };
  }, [enBaixa, deReserva, esAgent, potEditar, fitxa, identitat, poble, updateLocal, saveRemote, visibilitat, uploadMedia, obriDialegImatge, avatarBarra, estatDesament, avisosCamps]);

  /* Només qui pot editar la fitxa té el diàleg (T35). */
  const dialegCapcalera = potEditar ? (
    <DialegCapcaleraAvatar
      obert={Boolean(dialegImatge)}
      onTanca={tancaDialegImatge}
      onDesaCamp={desaImatge}
      onImageUpload={uploadMedia}
      onError={(msg) => showToast(msg, 'error')}
      ambAvatar={Boolean(fitxa.logoImage)}
    />
  ) : null;

  if (deReserva) {
    return (
      <>
        <div className="sdp-alerta sdp-alerta--error" role="alert">
          <p>No s’ha pogut llegir la fitxa del servidor. Es mostra en lectura perquè cap canvi trepitge el que ja hi ha.</p>
          <div className="sdp-alerta__accions">
            <button type="button" className="sdp-boto sdp-boto--secundari" onClick={recarrega}>Tornar a provar</button>
          </div>
        </div>
        <DocumentEditor adapter={adapter} onToast={showToast} />
      </>
    );
  }

  if (esAgent) {
    return (
      <>
        <Alerta to="avis" titol={ETIQUETA_IA}>{AVIS_FITXA_IA}</Alerta>
        <DocumentEditor adapter={adapter} onToast={showToast} />
        {dialegCapcalera}
      </>
    );
  }

  return (
    <>
      <DocumentEditor adapter={adapter} onToast={showToast} />
      {dialegCapcalera}
    </>
  );
}

export default PerfilEditor;
