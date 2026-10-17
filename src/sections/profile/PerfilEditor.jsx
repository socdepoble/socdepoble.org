import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DocumentEditor } from '../../components/universal/DocumentEditor';
import { usePublicaDocumentViu } from '../../components/universal/TargetaViva.jsx';
import { LLINDAR_COMPTADOR } from '../../data/limitsText.js';
import { desaLlicenciaPerDefecte, sincronitzaLlicenciaPerDefecte } from '../../components/universal/drets/herencia.js';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { Alerta, DialegConfirmacio } from '../../components/PedraSeca/index.js';
import { usePerfil } from './PerfilContext.jsx';
import { AVIS_IMATGE_PUJANT, ERROR_DESAT_IMATGE, useImatgeDeFitxa } from './useImatgeDeFitxa.jsx';
import { AJUDA_FOTO } from '../../components/universal/enquadrament/useEnquadramentImatge.jsx';
import { AJUDA_IMATGE_PUJANT } from '../../components/universal/UniversalEditorShell.jsx';
import { DialegEmoticona } from '../../components/universal/classificacio/DialegEmoticona.jsx';
import { bloqueigDeFitxa, textosDeFitxa } from './visibilitatFitxa.js';
import {
  CAMPS_FITXA, LIMITS_TEXT, copyrightDeFitxa, documentDeFitxa, fitxaDeLectura, llargariaDeCamp, menaDeFitxa, retallaCamp, textDeCamp,
  valorPerDesar,
} from './perfilCamps.js';
import { ENTITATS_FITXA } from './perfilEscriptor.js';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { useAutodesament } from '../../data/autodesament/useAutodesament.js';
import { useResolvedAsset } from '../../hooks/useResolvedAsset.js';
import { registraEntitatDelProjecte } from '../../config/navigation.js';
import { esRutaDelProjecte } from '../../components/universal/UniversalUtils.js';
import {
  ETIQUETA_IA, avatarDeLaBarraDeFitxa, avatarDeLaFitxa, esFitxaDelPilot, etiquetesDeFitxa, pobleDeReservaDeFitxa, potEditarFitxa,
  rutaDeFitxaPublica, slugDEntitat,
} from './fitxaDePerfil.js';

/* Línia I2 de l'Onada 4 (pla 261008_1201) · La lògica pura de la fitxa viu
   en un sol lloc, fitxaDePerfil.js, la mateixa que llig «Les vistes»
   (DetallVistes): on porta la barra taronja, el slug de l'entitat, qui la pot
   editar i les seues píndoles. Abans n'hi havia una còpia ací, idèntica línia
   a línia. rutaDeFitxaPublica i slugDEntitat es tornen a exportar d'ací: les
   proves del Perfil les importen d'esta ruta. El poble NO ve d'allí: vegeu
   `poble`, a baix, i el motiu.
   Ordre del Mestre (261007) · «Quan isquen, les barres taronges han de
   portar a la pàgina de l'autor que l'ha creada»: la persona, per l'id de la
   seua fila (dades.id, mai 'jo'); una organització, per rutaDAutoria; un
   agent IA, a /perfil/:id; sense id, null (la barra queda sense enllaç).
   Auditoria 261007 (retocs de l'ordre E) · En remot, l'id de l'entitat pilot
   és un UUID que rutaDAutoria no reconeix fins que algú el registra
   (useEntitatDelProjecte a App.jsx). La fila de list_my_organizations porta
   el slug: amb el declarat (ENTITAT_PILOT_SLUG), el seu perfil (Onada 8;
   abans, /projecte) des del primer render, pel slug i mai pel nom. Un grup, una persona o un agent no poden
   ser l'entitat pilot (slugDEntitat torna ''). */
export { ETIQUETA_IA, rutaDeFitxaPublica, slugDEntitat };

/* T47 (ordre del Mestre, 260928) · Els errors de desat ja no són toasts
   efímers: van en línia, davall del camp, i el text es conserva. PostgREST
   diu PGRST204 (o Postgres 42703) quan la columna no existix: passa mentre
   una migració no s'ha aplicat. */
export const AVIS_SENSE_COLUMNA = 'Este camp encara no té columna al servidor';

/* Camps de text de la fitxa amb límit de llargària: comptador a partir del
   80 % (LLINDAR_COMPTADOR, limitsText.js; el catàleg en deriva les mostres). */
const CAMPS_AMB_COMPTADOR = Object.freeze(['title', 'subtitle', 'lead']);

/** On es guarda de veres el que encara no té el servidor. */
const llocDelText = (persistent) => (persistent ? 'en este dispositiu' : 'en esta pestanya');

/** Un error de validació per excés de llargària (el que té eixida «Retallar»). */
const esMassaLlarg = (error) => error?.tipus === 'validacio'
  && error.maxim != null && error.llargaria != null && error.llargaria > error.maxim;

/**
 * El missatge en línia d'un error de camp. Honest: diu on és el text i què falta.
 * T47 (correcció de la revisió) · Va dins d'una alerta (role=alert), que el
 * lector relleu sencera a cada canvi: el text ha de ser ESTABLE mentre
 * s'escriu. La llargària viva («300 de 256») va al comptador, fora de l'alerta.
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

/**
 * Bloc 3.5.4 (Gauntlet 261016; P2 de Codex, «error 403») · El que diu la
 * finestra de retall quan la cua no ha pogut deixar una imatge al servidor:
 * el motiu de l'avís en línia (missatgeDError), dit per a una imatge, i on es
 * guarda mentrestant. `desament` és la instantània de la cua (cuaDesament.llig).
 */
export function avisDeImatgeNoDesada(desament, camp) {
  const lloc = llocDelText(desament?.persistent);
  const error = desament?.errors?.[camp];
  const temporal = !error && desament?.problema?.tipus === 'temporal' ? desament.problema : null;
  const motiu = error?.tipus === 'columna'
    ? `${AVIS_SENSE_COLUMNA}${error.columna ? ` «${error.columna}»` : ''}`
    : String((error || temporal)?.missatge || '').replace(/[.\s]+$/, '');
  const perque = motiu ? ` (${motiu})` : '';
  if (error) return `El servidor no ha acceptat la imatge${perque}. No s’ha desat: es guarda ${lloc} fins que tanques la sessió, i la pots tornar a provar.`;
  if (temporal) return `No s’ha pogut desar la imatge${perque}. Es tornarà a provar sola; mentrestant, es guarda ${lloc} fins que tanques la sessió.`;
  return `La imatge encara no s’ha desat al servidor. Es guarda ${lloc} fins que tanques la sessió, i eixirà sola quan es puga.`;
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

/* Auditoria 261007 (retocs de l'ordre E, accessibilitat) · On torna el focus
   després de desar l'avatar des de damunt de l'H1: el botó de l'avatar redó
   (PageFrame) i, si encara no n'hi ha, el de la ranura, dins de l'editor.
   Relleu 261007 (revisor de perfil-retocs, onada 3b) · Derivats de
   DESTINS_FOCUS.logoImage de la closca (avatar primer; sense la imatge
   role=button, que la persona no té). */
const DESTI_FOCUS_AVATAR = '.sdp-editor-document .page-title .page-title-avatar--canvia';
const DESTI_FOCUS_RANURA = '.sdp-editor-document .page-title-logo-personalitzat button:not(:disabled)';

/* L'arrel on buscar-los: la del control que ha obert el diàleg, mentre és al
   DOM (dins del Web Component, el seu shadow root, que és tancat i cap
   selector sobre `document` hi entra); sense control, el document. */
const arrelDe = (node) => (node?.isConnected && typeof node.getRootNode === 'function' ? node.getRootNode() : document);

/* Correcció de la revisió de la línia I2 (pla 261008_1201) · El focus és
   perdut: al body o enlloc. Dins del Web Component, l'arrel (shadow root)
   diu null si el focus no és dins; llavors mana el del document. */
function focusPerdut(arrel) {
  const actiu = arrel?.activeElement ?? document.activeElement;
  return !actiu || actiu === document.body;
}

/* Correcció de la revisió de la línia I2 · Escape a mitja pujada.
   useImatgeDeFitxa deixa tancar la finestra de retall mentre la imatge puja,
   i la finestra torna el focus a qui l'havia oberta. Si era la píndola
   «Avatar» (PageFrame, avatarAutor.pujant), en eixe moment està desactivada:
   focus() no fa res i el focus cau al body. Este hook crida `enAcabar` UNA
   vegada quan la pujada acaba amb la finestra tancada abans d'hora (bé o
   malament); en el camí de sempre (Guardar i esperar) no fa res. */
function useTancadaAMitjaPujada(pujant, obert, enAcabar) {
  const pujava = useRef(false);
  const tancada = useRef(false);
  const enAcabarRef = useRef(enAcabar);
  enAcabarRef.current = enAcabar;
  useEffect(() => {
    const acabada = pujava.current && !pujant;
    pujava.current = pujant;
    if (obert) {
      tancada.current = false;
      return;
    }
    if (pujant) {
      tancada.current = true;
      return;
    }
    if (!acabada || !tancada.current) return;
    tancada.current = false;
    enAcabarRef.current?.();
  }, [pujant, obert]);
}

/* Onada 4 (retallador senzill, ordre del Mestre 261008) · Els noms dels dos
   botons d'imatge i del de llevar l'avatar. */
export const ETIQUETA_CAPCALERA = 'Capçalera';
export const ETIQUETA_AVATAR = 'Avatar';
export const ETIQUETA_LOGOTIP = 'Logotip';
export const ETIQUETA_LLEVA_AVATAR = 'Llevar l’avatar';

/* Lògica d'Usuari (T4): la fitxa d'un agent IA es diu clarament el que és
   (ETIQUETA_IA ve de fitxaDePerfil.js, la mateixa de la seua píndola). */
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
  /* La lectura de profiles ha fallat i getProfile ha tornat la fila de reserva
     (només nom i foto de la sessió): editar-la trepitjaria la bio, el lema i la
     presentació de veres amb camps buits. En lectura fins que es torne a llegir. */
  const deReserva = mena === 'persona' && dades.reserva === true;
  /* Qui pot editar (fitxaDePerfil.js): la persona i els agents, i qui és
     propietària o administradora d'una organització (la RLS ho torna a dir al
     servidor). Mai amb la fila de reserva ni amb una baixa en curs: amb una
     baixa el servidor té el perfil congelat (política restrictiva «profiles
     sense baixa»), cap desat arribaria, i es desfà cancel·lant-la des de
     «El compte». */
  const potEditar = potEditarFitxa(identitat);
  /* Onada 4 (decisió del Mestre, 261008, per coherència amb la fitxa
     pública) · Una organització porta el SEU poble (dades.town_name) o cap:
     ja no s'hi posa el de la persona. Un agent conserva la reserva de
     sempre (el poble de la persona).
     Línia I2 (pla 261008_1201) · No és pobleDeFitxa (fitxaDePerfil.js), que
     no hi fa el mateix: per a una persona sense poble a la seua fila, ací
     encara es mira la persona d'`identitats`, i allí no; i allí el valor
     passa per String(). Fins que algú decidisca quina de les dues mana, cada
     una es queda com era.
     Gauntlet 261016 (Bloc 3.5.2; ordre del Mestre: «Prohibit mostrar entitats
     sense poble») · Sense cap poble, la fitxa d'una de les tres identitats
     del Mestre porta el seu (pobleDeReservaDeFitxa, la mateixa reserva que
     pobleDeFitxa i la fitxa pública: clauFundacional, mai pel nom). La barra
     taronja i la targeta viva ja no pinten Sóc de Poble ni Rentonar sense
     poble. El poble desat sempre mana; cap altra fitxa se n'inventa cap. */
  const poble = (mena === 'organitzacio'
    ? (dades.town_name || '')
    : (dades.town_name || (identitats || []).find((i) => i?.mena === 'persona')?.dades?.town_name || ''))
    || pobleDeReservaDeFitxa(identitat);

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
     hi renuncia és «Tornar al que hi ha desat» (descarta).
     Pla 261016 (Bloc 3.1; ordre del Mestre) · Per a la persona, l'esborrany
     no compta: la seua fitxa ja no en pot crear cap (ambDrets: false) i els
     drets de sèrie de les notes es trien a «El compte». Un esborrany vell de
     «Desar autoria» que encara siga a la cua trepitjaria eixa tria (també amb
     una CC0): el mirall només hi copia el valor del servidor. L'organització,
     com sempre. */
  const esborranyCopyright = mena === 'persona' ? undefined : desament.camps.copyright;
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
  /* Línia I2 (pla 261008_1201) · La llicència TRIADA de veres, per a la
     píndola dels drets (clau dretsTriats de DocumentEditor): la que s'acaba
     de triar o l'esborrany de la cua (local.copyright) i, si no, la del
     servidor. Mai el «© Nom» que perfilCamps.js posa a la fitxa quan no n'hi
     ha cap: amb eixe, la píndola deia «Drets d'autor: © Pep» a qui encara
     no n'havia triat cap. Sense llicència, '' («Elegir drets d'autor»). */
  const dretsTriats = local.copyright ?? (typeof copyrightServidor === 'string' ? copyrightServidor : '');

  const posaLocal = useCallback((camp, valor) => {
    setLocal((previ) => (previ[camp] === valor ? previ : { ...previ, [camp]: valor }));
  }, []);

  /* Directiva de Dignitat Humana (pla 261015_1900) · La fitxa d'una persona ja
     no pinta drets (documentDeFitxa hi posa ''), però l'autodesament compara
     el camp `copyright` amb la DADA de sempre (copyrightDeFitxa: la desada o el
     «© Nom» de reserva): un esborrany vell de «Desar autoria» que encara siga a
     la cua no entra en un conflicte fals. Per a l'organització i l'agent és el
     mateix valor que `original.copyright`. */
  const baseDelServidor = useCallback(
    (camp) => (camp === 'copyright' ? copyrightDeFitxa(identitat) : original[camp]),
    [identitat, original],
  );

  /* T47 (correcció de la revisió C04, 260928) · El valor que el servidor té ara
     per a un camp, tal com es desaria: és la base de l'esborrany (el que la
     persona tenia davant) i el que `verifica` hi compara en obrir la fitxa. */
  const valorServidor = useCallback((camp) => {
    const base = baseDelServidor(camp);
    try { return valorPerDesar(mena, camp, base).valor; } catch {
      return camp === 'content' ? String(base ?? '') : textDeCamp(base);
    }
  }, [mena, baseDelServidor]);
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
      try { igual = valorPerDesar(mena, camp, baseDelServidor(camp)).valor === valorPerDesar(mena, camp, valor).valor; } catch { igual = false; }
      if (igual) return Promise.resolve(true);
    }
    posaLocal(camp, valor);
    cuaDesament.encua(ref, camp, valor, ambBase(camp));
    return cuaDesament.desaAra(ref, camp);
  }, [ref, mena, baseDelServidor, posaLocal, idHerencia, ambBase]);

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
      /* Directiva de Dignitat Humana (pla 261015_1900) · La fitxa d'una
         persona ja no mostra ni tria drets: un esborrany vell de «Desar
         autoria» que quede en error o en conflicte només es pot deixar anar
         («Tornar al que hi ha desat», que torna també la llicència de sèrie
         de les notes al valor del servidor). Ni «Tornar a provar» ni
         «Conservar el meu»: seria triar a cegues un valor que no es veu. */
      const dretsSenseFitxa = mena === 'persona' && camp === 'copyright';
      if (massaLlarg && CAMPS_AMB_COMPTADOR.includes(camp)) {
        accions.push({ text: `Retallar a ${error.maxim}`, onClick: () => retalla(camp, error.maxim) });
      }
      if (error.tipus === 'servidor' && !dretsSenseFitxa) accions.push({ text: 'Tornar a provar', onClick: () => reintenta(camp) });
      if (error.tipus === 'conflicte' && !dretsSenseFitxa) accions.push({ text: 'Conservar el meu', onClick: () => conserva(camp) });
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
     ('sdp:auth-change'): es pinta com a pendent.
     Línia I2 (pla 261008_1201) · Un error temporal (sense xarxa, 5xx) la cua
     el torna a provar sola: `reintentant` ho diu a la icona, i el seu pas a
     'net' és la confirmació del servidor (pinta el check). La clau només hi
     és quan és certa: la resta d'estats, { estat, detall } com sempre. */
  const estatDesament = useMemo(
    () => (ref ? {
      estat: desament.estat === 'sessio' ? 'pendent' : desament.estat,
      detall: detallDesament(desament),
      ...(desament.problema?.tipus === 'temporal' ? { reintentant: true } : null),
    } : undefined),
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

  /* T35 · L'avatar de la barra taronja. Una foto pujada és una referència
     opaca (sdp-media://) que la barra no resol (resolveAsset síncron): es
     resol ací pel port. La resta de valors passen tal qual. Ordre E (261007) ·
     També és el logotip ja resolt d'una entitat en lectura (logoDeLectura).
     Revisió del prompt 261014_0400 (ordre del Mestre) · La fitxa del pilot no
     pinta el logo de la fila enlloc (avatarTaronja i logoDeLectura, a baix):
     no es demana al port (esFitxaDelPilot, el criteri d'esPilot), com a la
     fitxa pública.
     Bloc 3.5.4 (Gauntlet 261016; pla, Onada 1.1.4: «la targeta central
     (TargetaViva) i el panell d'edició (PerfilEditor) han de beure exactament
     de la mateixa instància de dades») · Abans, la barra taronja i la targeta
     viva (documentViu, la fitxa de la llista de PerfilShell) llegien
     identitat.avatar, el del servidor, i l'avatar redó i la ranura, la fitxa
     (fitxa.logoImage, amb l'esborrany): després d'un 403, una foto a cada
     banda (P2 de Codex). Ara totes porten la imatge de la fitxa: tal qual
     mentre la cua en guarda un esborrany (pendent o rebutjat, també el buit
     de «Llevar l'avatar»); si no, la de la fitxa o, sense cap, la reserva de
     la identitat (per a la persona, la foto de la sessió: pla 261014_1450,
     front B), com fins ara.
     Gauntlet 261016 (encàrrec D) · La regla ja no viu ací: és
     avatarDeLaFitxa (fitxaDePerfil.js), la mateixa que lligen «Les vistes»,
     «El compte» i la fitxa compacta de la llista central. */
  const imatgeDeLaFitxa = fitxa.logoImage || '';
  /* Gauntlet 261016 (Bloc 3.5.4, verificació) · Una imatge que esta fitxa ha
     canviat ací (`local`: una pujada o «Llevar l'avatar»; «Tornar al que hi ha
     desat» la retira) compta com l'esborrany de la cua fins que el context
     del Perfil porta la fila nova (aplicaColumnes). Sense, entre la
     confirmació de la cua i la identitat nova, la reserva d'abans (la foto
     vella o la de la sessió, que aplicaColumnes també buida) tornava a eixir
     un instant després de llevar l'avatar. */
  const campsDeLaImatge = useMemo(
    () => (Object.hasOwn(local, 'logoImage') && !Object.hasOwn(desament.camps, 'logoImage')
      ? { ...desament.camps, logoImage: local.logoImage } : desament.camps),
    [local, desament.camps],
  );
  const avatarDesat = avatarDeLaFitxa(fitxa, campsDeLaImatge, identitat);
  const avatarResolt = useResolvedAsset(esFitxaDelPilot(identitat) ? '' : avatarDesat);
  const avatarBarra = avatarDesat.startsWith('sdp-media://') ? avatarResolt : avatarDesat;

  /* Onada 4 (retallador senzill, ordre del Mestre 261008) · Dos botons clars
     i separats, sense el diàleg intermedi (DialegCapcaleraAvatar ja no es
     munta; es perd «La mateixa per a les dues», autoritzat): «Capçalera» i
     «Avatar» (persona, agent) o «Logotip» (organització). Cada botó obri el
     selector de fitxers dins del gest de la persona i, després, la mateixa
     finestra de retall (useImatgeDeFitxa): capçalera en quadrat de
     1.200 × 1.200 (Llei del Quadrat, Gauntlet 261016, Bloc 1: la mateixa
     imatge que la targeta; abans 16:9), avatar en cercle de 400 × 400,
     logotip en quadrat de 600 × 600. UNA pujada pel camí de sempre
     (uploadMedia) i el camp es desa per la cua de la fitxa. La closca hi
     passa `acaba`, que la torna a la imatge quan s'ha desat (T35). */
  const desaImatge = useCallback(
    (camp, valor) => saveRemote(identitat.id, camp, valor),
    [saveRemote, identitat.id],
  );
  /* Bloc 3.5.4 (Gauntlet 261016; P2 de Codex, «error 403») · El desat de les
     finestres de retall: saveRemote no rebutja mai, i el seu false (la cua
     no ha pogut deixar la imatge al servidor) es donava per bo. Ara és un error
     amb el motiu de la cua (avisDeImatgeNoDesada): la finestra continua
     oberta amb el retall, i la cua conserva el valor per a «Tornar a
     provar». «Llevar l'avatar» continua amb desaImatge: la seua confirmació
     es tanca i l'avís en línia diu el que ha passat. */
  const desaImatgeDeLaFinestra = useCallback(async (camp, valor) => {
    if (await desaImatge(camp, valor)) return true;
    throw new Error(ref ? avisDeImatgeNoDesada(cuaDesament.llig(ref), camp) : ERROR_DESAT_IMATGE);
  }, [desaImatge, ref]);
  /* Correcció de la revisió (261008) · «Encara s'està desant» no és cap error: 'info'. */
  const avisImatge = useCallback((missatge, tipus = 'error') => showToast(missatge, tipus), [showToast]);
  /* Auditoria 261007 (retocs de l'ordre E, accessibilitat) · Una persona sense
     avatar el posa des de la ranura: la ranura es desmunta, ix l'avatar redó i
     el focus, que tornava al botó que l'havia obert (ja fora del DOM), queia
     al body. «Llevar l'avatar» fa el camí contrari. Quan la imatge pròpia
     s'ha desat (o llevat), s'apunta l'arrel del control que l'ha obert
     (arrelDe: dins del Web Component, el seu shadow root; la ranura no porta
     cap node, el document) i, quan la finestra ja és tancada, l'efecte de
     davall porta el focus al botó de l'avatar o, si encara hi és, a la ranura. */
  const focusAvatarPendent = useRef(null);
  const arrelImatgePropia = useRef(null);
  const apuntaFocusAvatar = useCallback(() => {
    focusAvatarPendent.current = arrelImatgePropia.current || document;
  }, []);
  const capcalera = useImatgeDeFitxa({
    camp: 'heroImage', forma: 'capcalera', onImageUpload: uploadMedia, onDesaCamp: desaImatgeDeLaFinestra, onError: avisImatge,
  });
  const imatgePropia = useImatgeDeFitxa({
    camp: 'logoImage', forma: mena === 'organitzacio' ? 'logotip' : 'avatar',
    onImageUpload: uploadMedia, onDesaCamp: desaImatgeDeLaFinestra, onError: avisImatge, onDesat: apuntaFocusAvatar,
  });
  const { obri: obriCapcalera, pujant: capcaleraPujant } = capcalera;
  const { obri: obriFitxerPropi, obert: imatgePropiaOberta, pujant: imatgePropiaPujant } = imatgePropia;
  /* La ranura crida amb el control de la closca ({ acaba }); l'avatar redó
     (PageFrame), amb l'esdeveniment del clic, que dona l'arrel.
     Correcció de la revisió de la línia I2 · I el control mateix (l'avatar
     o la píndola «Avatar»), per a tornar-li el focus si es perd. La ranura
     no en dona cap: el seu botó el recupera la closca (heroPujant i
     logoPujant). */
  const controlImatgePropia = useRef(null);
  const obriImatgePropia = useCallback((control) => {
    const element = control?.currentTarget ?? null;
    arrelImatgePropia.current = arrelDe(element);
    controlImatgePropia.current = typeof element?.focus === 'function' ? element : null;
    obriFitxerPropi(control);
  }, [obriFitxerPropi]);

  /* «Llevar l'avatar» (CONTRACTE-1 de l'avatar redó): després de confirmar,
     el camp buit per la cua de la fitxa, com feia el diàleg intermedi.
     Correcció de la revisió (261008) · La guarda de pujada de l'ordre E: amb
     la foto nova encara pujant (Escape la deixa continuar), llevar-lo no fa
     res més que dir-ho; la pujada, en acabar, el tornaria a posar.
     Línia I2 (pla 261008_1201) · Ara la píndola ja ix desactivada mentre
     puja (avatarAutor.pujant): esta guarda queda de reserva, per a qui
     cridara onLleva per un altre camí. */
  const [confirmaLleva, setConfirmaLleva] = useState(false);
  const [llevant, setLlevant] = useState(false);
  const obriLleva = useCallback((e) => {
    if (imatgePropiaPujant) {
      avisImatge(AVIS_IMATGE_PUJANT, 'info');
      return;
    }
    arrelImatgePropia.current = arrelDe(e?.currentTarget ?? null);
    setConfirmaLleva(true);
  }, [imatgePropiaPujant, avisImatge]);
  /* Escape s'accepta sempre (el navegador pot tancar el <dialog> pel seu compte). */
  const tancaLleva = useCallback((motiu) => {
    if (!llevant || motiu === 'esc') setConfirmaLleva(false);
  }, [llevant]);
  const llevaAvatar = useCallback(async () => {
    setLlevant(true);
    try {
      await desaImatge('logoImage', '');
    } finally {
      setLlevant(false);
    }
    apuntaFocusAvatar();
    setConfirmaLleva(false);
  }, [desaImatge, apuntaFocusAvatar]);

  /* Després del commit que tanca la finestra: els efectes dels fills (el que
     retorna el focus al control que l'havia obert) ja han corregut. */
  useEffect(() => {
    const arrel = focusAvatarPendent.current;
    if (imatgePropiaOberta || confirmaLleva || !arrel) return;
    focusAvatarPendent.current = null;
    const desti = arrel.querySelector(DESTI_FOCUS_AVATAR) || arrel.querySelector(DESTI_FOCUS_RANURA);
    desti?.focus();
  }, [imatgePropiaOberta, confirmaLleva]);

  /* Correcció de la revisió de la línia I2 · Escape a mitja pujada: la
     píndola que l'havia oberta estava desactivada i el focus ha caigut al
     body. Quan la pujada acaba, i només si el focus continua perdut (la
     persona pot haver seguit escrivint en un altre camp, i no se li roba):
       · desada, al mateix destí que el camí de sempre (l'avatar redó o la
         ranura), i el focus pendent es consumix ací, perquè l'efecte de
         dalt no el faça servir més tard (en tancar «Llevar l'avatar?»);
       · fallada, al control que l'havia oberta, si encara hi és i està
         actiu; si no, al mateix destí. */
  const tornaElFocusDeLaImatgePropia = useCallback(() => {
    const pendent = focusAvatarPendent.current;
    focusAvatarPendent.current = null;
    const arrel = pendent || arrelImatgePropia.current || document;
    if (!focusPerdut(arrel)) return;
    const control = controlImatgePropia.current;
    const desti = !pendent && control?.isConnected && !control.disabled
      ? control
      : arrel.querySelector(DESTI_FOCUS_AVATAR) || arrel.querySelector(DESTI_FOCUS_RANURA);
    desti?.focus();
  }, []);
  useTancadaAMitjaPujada(imatgePropiaPujant, imatgePropiaOberta, tornaElFocusDeLaImatgePropia);

  /* T66 (ordre del Mestre, 260928) · L'emoticona de la fitxa, com a les Notes
     (NotesEditor): l'espai central de la barra taronja obri DialegEmoticona i
     la tria va per l'autodesament, primer com a esborrany (el mateix camí que
     DocumentEditor: desaLocal i després el desat). Només qui pot editar i la
     mena que en té columna (la persona, CAMPS_FITXA): la resta, la cel·la de
     lectura de sempre. Buida = llevar-la. */
  const ambEmoticona = potEditar && Boolean(CAMPS_FITXA[mena].icon);
  const [dialegEmoticona, setDialegEmoticona] = useState(false);
  const obriEmoticona = useCallback(() => setDialegEmoticona(true), []);
  const tancaEmoticona = useCallback(() => setDialegEmoticona(false), []);
  const desaEmoticona = useCallback((icon) => {
    const valor = icon || '';
    if (valor !== (fitxa.icon || '')) {
      updateLocal(identitat.id, 'icon', valor);
      void saveRemote(identitat.id, 'icon', valor);
    }
    setDialegEmoticona(false);
  }, [fitxa.icon, updateLocal, saveRemote, identitat.id]);

  /* Les píndoles (fitxaDePerfil.js): el rol i, si cal, «Baixa en curs»,
     «Sense connexió» o l'avís d'IA. */
  const etiquetes = useMemo(() => etiquetesDeFitxa(identitat), [identitat]);

  /* T50 (decisió del Mestre, 260928: «Llista + dreta si hi cap») · La fitxa
     activa de la columna central és la targeta viva d'este document: el que
     s'escriu (`fitxa`, amb `local`) es publica per a la llista (documentViu,
     clau = id de la identitat), amb la mateixa autoria de la barra taronja i
     les mateixes píndoles. Per a qui només la llig, la fitxa del servidor. */
  /* Ordre del Mestre (261007) · La barra taronja porta a la fitxa pública.
     Onada 8 (261009) · La boina de la targeta viva també (autorTargeta.ruta).
     Onada 8 (261009) · La fitxa del pilot és el seu perfil
     (RUTA_PERFIL_PROJECTE): es reconeix per esRutaDelProjecte.
     Prompt 261014_0400 (ordre del Mestre, tasca 4: «Quan l'usuari actua com
     a Sóc de Poble, la barra taronja ha de carregar automàticament l'autoria
     oficial», el PNG verd, «evitant en qualsevol cas la silueta negra») · La
     fitxa del pilot porta a la barra taronja i a la targeta viva el PNG verd
     oficial (DEFAULT_AUTHOR.avatarUrl), no la silueta ni el logo_url de la
     fila: el mateix criteri de l'ordre E, que hi fixa el logotip de damunt de
     l'H1 (ranuraDelLogo i logoDeLectura, a baix). El nom i el poble
     continuen sent els de la fitxa.
     Revisió del prompt 261014_0400 (ordre del Mestre) · La regla ja viu a
     fitxaDePerfil.js (avatarDeLaBarraDeFitxa), la mateixa que lligen «Les
     vistes» (DetallVistes: la barra i la «Vista targeta») i «El compte»
     (DetallCompte); la fitxa pública (PerfilPublicSection) hi aplica el seu
     esElProjecte. Abans vivia només ací i, a la fitxa del pilot, les
     superfícies canviaven en passar d'apartat. */
  const rutaFitxa = rutaDeFitxaPublica(identitat);
  const esPilot = esRutaDelProjecte(rutaFitxa);
  const avatarTaronja = avatarDeLaBarraDeFitxa(identitat, avatarBarra);
  const autorTargeta = useMemo(
    () => ({ nom: identitat.nom, avatar: avatarTaronja, poble, ruta: rutaFitxa }),
    [identitat.nom, avatarTaronja, poble, rutaFitxa],
  );
  /* Auditoria 261007 (retocs de l'ordre E) · Com PerfilPublicSection, la
     fitxa registra ella mateixa l'organització que té davant: si el seu slug
     és el declarat, el seu id (en remot, un UUID) passa a ser un identificador
     del projecte per a tota l'app (boines, barres i xats), encara que la
     resolució d'App.jsx no haja arribat o espere després d'una fallada. És
     idempotent i reconeix el projecte pel slug, mai pel nom. Un grup no hi
     entra (slugDEntitat). En un efecte i no en el render: avisa els qui
     escolten (useSyncExternalStore), i esta fitxa ja no l'espera, perquè
     rutaDeFitxaPublica la reconeix pel slug des del primer render. */
  const slugOrganitzacio = slugDEntitat(identitat);
  const idOrganitzacio = identitat?.id;
  useEffect(() => {
    if (slugOrganitzacio && idOrganitzacio != null) {
      registraEntitatDelProjecte({ tipus: 'entitat', id: idOrganitzacio, slug: slugOrganitzacio });
    }
  }, [slugOrganitzacio, idOrganitzacio]);

  /* Ordre del Mestre (261007, ordre E) · «No hi ha cap botó per a posar el
     logotip (o cap imatge) damunt de l'H1». Damunt del nom, el mateix que la
     fitxa pública (PerfilPublicSection: el 261004 el Mestre va derogar el
     showLogos={false} en què es recolzava T35) i, a qui pot editar, el botó
     per a canviar-ho:
       · l'entitat pilot (la seua fitxa és el seu perfil, esRutaDelProjecte): cap ranura, PageFrame
         hi pinta el logotip rectangular de Sóc de Poble (via d);
       · una altra organització: la ranura del logotip de la closca, que desa
         logoImage → logo_url pel camí de sempre (uploadMedia, carpeta
         'organitzacions'). En lectura, el logotip d'una entitat
         (logoEntitat); un grup no en porta, com a la fitxa pública;
       · una persona o un agent IA: l'avatar redó (sdp-pedra-seca §11). Amb
         avatar, avatarAutor amb onCanvia (el botó amb la càmera, com a la
         fitxa pública); sense, la ranura buida amb el botó.
     La imatge és el camp de la fitxa (logoImage: avatar_url o logo_url), el
     que llig la fitxa pública, i ja porta el que s'acaba de desar.
     Auditoria 261007 (retocs de l'ordre E) · L'entitat pilot també per slug
     (rutaDeFitxaPublica): en remot, abans, mentre el UUID no estava
     registrat, al propietari de Sóc de Poble se li oferia la ranura «Editar
     logotip», que guanyava al logotip fix (via a de PageFrame), i una pujada
     sobreescrivia el logo_url del pilot.
     Onada 4 (retallador senzill, ordre del Mestre 261008) · La ranura i
     l'avatar redó obrin directament la finestra de retall (useImatgeDeFitxa):
     «Avatar» (cercle) per a la persona i l'agent, «Logotip» (quadrat de
     600 × 600) per a TOTA organització que no és la pilot. L'avatar redó
     porta, a més, les claus del CONTRACTE-1 (PageFrame): etiquetaCanvia,
     onLleva (amb confirmació) i etiquetaLleva.
     Línia I2 (pla 261008_1201) · I, en edició, les de la línia I1: `ajuda`
     (el que s'admet, AJUDA_FOTO, davall de les píndoles: dit abans de triar
     també quan ja hi ha foto) i `pujant` (mentre la foto nova puja, «Avatar»
     i «Llevar l'avatar» queden desactivades).
     Correcció de la revisió de la línia I2 · Mentre puja, l'ajuda ho diu
     (AJUDA_IMATGE_PUJANT, el text de la closca): unes píndoles desactivades
     sense cap motiu a la vista no fan res i no diuen per què.
     L'entitat pilot es reconeix per esPilot (esRutaDelProjecte de rutaFitxa,
     a dalt, amb l'autoria de la barra taronja).
     Bloc 3.5.4 · `imatgeDeLaFitxa` es calcula a dalt, amb l'avatar de la
     barra taronja i de la targeta viva: la mateixa instància per a tots.
     Gauntlet 261016 (Bloc 3.5.4, verificació; ordre del Mestre: «És
     inadmissible que a la mateixa pantalla es mostre una foto al centre i una
     altra a la dreta») · L'avatar redó i la ranura beuen ara d'avatarDesat
     (avatarDeLaFitxa), la mateixa font que la barra taronja, la targeta viva
     i la fitxa compacta. Abans lligen només fitxa.logoImage: una persona
     sense avatar_url i amb la foto de la sessió (Google) veia la foto a la
     barra i al centre i la ranura buida damunt de l'H1. Amb avatar propi o
     amb un esborrany a la cua, el mateix valor que abans (cap píxel canvia).
     «Llevar l'avatar» només hi és quan la fitxa té una imatge pròpia
     (imatgeDeLaFitxa): la foto de la sessió no és cap camp de la fitxa, i
     buidar avatar_url, que ja és buit, no faria res. */
  const ambAvatarRedo = mena !== 'organitzacio';
  const ranuraDelLogo = potEditar && !esPilot && (!ambAvatarRedo || !avatarDesat);
  const etiquetaImatgePropia = ambAvatarRedo ? ETIQUETA_AVATAR : ETIQUETA_LOGOTIP;
  const avatarDeCapcalera = useMemo(() => (ambAvatarRedo && avatarDesat ? {
    src: avatarDesat,
    alt: `Avatar de ${identitat.nom}`,
    ...(potEditar ? {
      onCanvia: obriImatgePropia, etiquetaCanvia: ETIQUETA_AVATAR,
      ...(imatgeDeLaFitxa ? { onLleva: obriLleva, etiquetaLleva: ETIQUETA_LLEVA_AVATAR } : null),
      ajuda: imatgePropiaPujant ? AJUDA_IMATGE_PUJANT : AJUDA_FOTO, pujant: imatgePropiaPujant,
    } : null),
  } : null), [ambAvatarRedo, avatarDesat, imatgeDeLaFitxa, identitat.nom, potEditar, obriImatgePropia, obriLleva, imatgePropiaPujant]);
  /* El logo_url ja resolt (avatarBarra): PageFrame no resol cap sdp-media://
     del logotip d'una entitat. */
  const logoDeLectura = useMemo(() => (
    !potEditar && !ambAvatarRedo && identitat.mena !== 'grup' && !esPilot && avatarBarra
      ? { clar: avatarBarra, alt: `Logotip de ${identitat.nom}` } : null
  ), [potEditar, ambAvatarRedo, identitat.mena, identitat.nom, esPilot, avatarBarra]);

  const documentViu = useMemo(
    () => ({ document: fitxa, autor: autorTargeta, etiquetes }),
    [fitxa, autorTargeta, etiquetes],
  );
  usePublicaDocumentViu(identitat.id, documentViu);

  const adapter = useMemo(() => {
    return {
      document: potEditar ? fitxa : null,
      /* Ordre E (261007) · En lectura, damunt de l'H1, el mateix que la fitxa
         pública: el logotip d'una entitat o l'avatar redó, sense botó. */
      emptyDocument: potEditar ? undefined : {
        ...fitxaDeLectura(identitat),
        labels: etiquetes,
        ...(logoDeLectura ? { logoEntitat: logoDeLectura } : null),
        ...(avatarDeCapcalera ? { avatarAutor: avatarDeCapcalera } : null),
      },
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
      /* Onada 4 (retallador senzill, ordre del Mestre 261008) · Derogat el
         botó únic de T35 («Editar capçalera i avatar» i el seu diàleg): la
         capçalera té el seu botó, «Capçalera», que diu ABANS de triar què
         s'admet, i obri la finestra de retall en quadrat de 1.200 × 1.200
         (Llei del Quadrat, Gauntlet 261016, Bloc 1; abans 16:9). La imatge
         pròpia té el seu a la ranura o a l'avatar redó (ranuraDelLogo i
         avatarDeCapcalera, a dalt). Derogat també el «logotip damunt del nom desapareix» de T35
         (ordre E, 261007).
         Línia I2 (pla 261008_1201) · Les imatges pugen fora de la closca
         (useImatgeDeFitxa): `heroPujant` i `logoPujant` li diuen que hi ha
         una pujada en curs, i bloqueja el seu control (el botó, «Esborrar» i
         «Enquadrar») com amb la seua guarda. El límit (AJUDA_FOTO) es diu
         abans de triar a tots els botons d'imatge: a la ranura
         (`logoEditHelp`), davall del botó quan ja hi ha imatge
         (`ajudaAmbImatge`) i a l'avatar redó (avatarAutor.ajuda, a dalt).
         Correcció de la revisió de la línia I2 · Mentre puja, la closca hi
         diu AJUDA_IMATGE_PUJANT i, quan acaba, torna el focus al seu botó si
         s'havia perdut (Escape a mitja pujada, amb el botó desactivat). */
      heroEditLabel: ETIQUETA_CAPCALERA,
      heroEditHelp: AJUDA_FOTO,
      onHeroEdit: obriCapcalera,
      heroPujant: capcaleraPujant,
      ajudaAmbImatge: AJUDA_FOTO,
      showLogoUpload: ranuraDelLogo,
      ...(ranuraDelLogo ? {
        onLogoEdit: obriImatgePropia, logoEditLabel: etiquetaImatgePropia, logoEditHelp: AJUDA_FOTO, logoPujant: imatgePropiaPujant,
      } : null),
      ...(potEditar && avatarDeCapcalera ? { avatarAutor: avatarDeCapcalera } : null),
      /* CONTRACTE-3 (Onada 4) · Les vistes (A4, portada, targeta) no van al
         centre de la fitxa: DocumentEditor les porta a «Les vistes». */
      ambVistes: false,
      barAuthorAvatar: autorTargeta.avatar,
      barAuthorName: autorTargeta.nom,
      barAuthorLocation: autorTargeta.poble,
      /* Ordre del Mestre (261007) · L'autoria enllaça a la fitxa pública
         d'esta identitat (rutaDeFitxaPublica), amb l'id real i no 'jo'. */
      barAuthorHref: rutaFitxa,
      /* T47 · L'indicador de l'autodesament i els avisos en línia dels camps. */
      estatDesament,
      avisosCamps,
      /* Directiva de Dignitat Humana (pla 261015_1900, Onada 1.1) · Una
         persona no és una obra: la seua fitxa no porta drets d'autor enlloc
         (ambDrets: false a DocumentEditor: ni píndola, ni línia de la
         capçalera, ni vista de drets) ni la píndola del rol (etiquetesDeFitxa).
         La llicència de sèrie de les seues notes noves (T39) és la que té
         desada al servidor, i es tria a «El compte» (pla 261016, Bloc 3.1):
         el mirall d'a dalt (idHerencia) només hi copia la del servidor.
         T39 (ordre del Mestre, 260928) · Per a l'organització i l'agent, la
         vista de drets d'autor diu que estos són els de sèrie de les notes
         noves (un agent no en signa: sense avís). L'autor és el mateix nom del
         «© Nom» de sèrie de la fitxa.
         Línia I2 (pla 261008_1201) · La píndola dels drets diu la llicència
         TRIADA de veres (dretsTriats, a dalt), no el «© Nom» de lectura. */
      ...(mena === 'persona' ? { ambDrets: false } : {
        dretsAutor: { ambit: esAgent ? 'neutre' : 'perfil', autor: fitxaDeLectura(identitat).title },
        dretsTriats,
      }),
      /* T66 · L'espai central de la barra taronja (sdp-pedra-seca §10): el
         camp CRU i, en edició, el botó que obri el diàleg. */
      emoticona: fitxa.icon || '',
      onObriEmoticona: ambEmoticona ? obriEmoticona : null,
    };
  }, [mena, esAgent, potEditar, fitxa, identitat, etiquetes, autorTargeta, rutaFitxa, updateLocal, saveRemote, visibilitat, uploadMedia,
    obriCapcalera, capcaleraPujant, obriImatgePropia, imatgePropiaPujant, etiquetaImatgePropia, ranuraDelLogo, avatarDeCapcalera,
    logoDeLectura, estatDesament, avisosCamps, dretsTriats, ambEmoticona, obriEmoticona]);

  /* Només qui pot editar la fitxa té els selectors i les finestres de retall.
     Germans del DocumentEditor i no fills de cap altre diàleg. La confirmació
     de «Llevar l'avatar» viu sempre muntada (tancada no es veu): així, en
     cancel·lar, Dialeg torna el focus a l'avatar que l'ha oberta. */
  const dialegsImatge = potEditar ? (
    <>
      {capcalera.input}
      {imatgePropia.input}
      {capcalera.dialeg}
      {imatgePropia.dialeg}
      {ambAvatarRedo ? (
        <DialegConfirmacio
          obert={confirmaLleva}
          onTanca={tancaLleva}
          onConfirma={llevaAvatar}
          titol="Llevar l’avatar?"
          descripcio="La fitxa es quedarà sense foto. La pots tornar a posar quan vulgues."
          etiquetaConfirma={ETIQUETA_LLEVA_AVATAR}
          destructiu
          carregant={llevant}
        />
      ) : null}
    </>
  ) : null;

  /* T66 · Muntat només mentre és obert (com a les Notes): cada obertura
     comença amb l'emoticona desada. */
  const dialegDEmoticona = ambEmoticona && dialegEmoticona ? (
    <DialegEmoticona
      key={`emoticona:${identitat.id}`}
      obert
      onTanca={tancaEmoticona}
      actual={fitxa.icon || ''}
      onDesa={desaEmoticona}
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
        {dialegsImatge}
        {dialegDEmoticona}
      </>
    );
  }

  return (
    <>
      <DocumentEditor adapter={adapter} onToast={showToast} />
      {dialegsImatge}
      {dialegDEmoticona}
    </>
  );
}

export default PerfilEditor;
