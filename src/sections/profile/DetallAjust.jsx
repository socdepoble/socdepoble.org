import { useCallback, useEffect, useRef, useState } from 'react';
import { Globe, Lock } from 'lucide-react';
import { useNavigate } from '../../app/contexts/RouterContext';
import { MIDA_AVATAR, esAvisDeLaFoto, fotoDinsDelPressupost } from '../../utils/pujadaImatge.js';
import { isSafeUrl } from '../../components/universal/UniversalUtils';
import { useEixidaSegura } from '../../components/universal/EixidaSegura.jsx';
import { useToast } from '../../components/universal/NotificationContext.jsx';
import { Alerta, Boto, Camp, DialegConfirmacio, GrupOpcions, Insignia, Selector } from '../../components/PedraSeca';
import { BotoDretsAutor } from '../../components/universal/CopyrightSelector.jsx';
import { CopyrightPage } from '../../components/universal/drets/CopyrightPage.jsx';
import { sincronitzaLlicenciaPerDefecte } from '../../components/universal/drets/herencia.js';
import { classificaError } from '../../data/autodesament/errors.js';
import { ERROR_CORREU_INVALID, validaCorreu } from './contacteOrganitzacio.js';
import { fitxaDeLectura } from './perfilCamps.js';
import { formataPoble, llistaDePobles, poblePrincipal } from './fitxaDePerfil.js';
import { AVIS_FITXA_PUBLICA } from './visibilitatFitxa.js';
import { useEnquadramentAvatar } from './useEnquadramentAvatar.jsx';
import { AVIS_GPS_ELIMINAT_PERFIL } from '../../components/universal/enquadrament/DialegEnquadrament.jsx';
import { GestioMembres } from './GestioMembres.jsx';
import { SegonFactor } from '../admin/SegonFactor.jsx';

/* Onada 11 (261010; prompt 261010_1730, tasca 2) · La ruta del Tauler de
   superadministració (App.jsx: /admin/*, darrere de RequireAuth). */
const RUTA_ADMIN = '/admin';

/* Indirecció per a les proves: jsdom no deixa substituir location.reload. */
export const pagina = { recarrega: () => window.location.reload() };

/* Grup C (261008) · El mateix avís que la fitxa (AVIS_SENSE_COLUMNA de
   PerfilEditor.jsx, que no s'importa: les proves del Perfil substituïxen eixe
   mòdul, i DetallAjust.test.jsx vigila que diguen el mateix). PostgREST diu
   PGRST204 (o Postgres 42703) mentre la migració no s'ha aplicat: abans es
   pintava el text cru, en anglés. Ací no hi ha cua: el canvi no s'ha desat. */
export const AVIS_SENSE_COLUMNA = 'Este camp encara no té columna al servidor';

/** El text d'un desat que ha fallat: la columna absent, traduïda; la resta, el missatge del port. */
function textDeDesat(error) {
  const classificat = classificaError(error);
  if (classificat.tipus === 'columna') {
    const columna = classificat.columna ? ` («${classificat.columna}»)` : '';
    return `${AVIS_SENSE_COLUMNA}${columna}: no s’ha desat. Cal aplicar al servidor la migració pendent.`;
  }
  return error?.message || 'Error en desar.';
}

/* Si l'apujada ha fallat i la imatge es queda en data URL local, no la
   desarem a la BD si pesa com un manuscrit. */
const MAX_DATA_URL = 150_000;

/* El mateix mínim que el formulari d'alta (onboardingModel). */
const MINIM_CONTRASENYA = 10;

/* Els avisos de la pujada d'una imatge (els de sempre). */
const ERROR_SENSE_PUJADA = 'El servidor no admet pujada d\'imatges.';
const ERROR_PUJADA = 'No s\'ha pogut pujar la imatge al servidor.';
const ERROR_CONNEXIO = 'S\'ha produït un error al pujar la imatge. Comprova la teua connexió.';

/* Pla 261018_1605 (Tasca 2, D5; correcció de la revisió) · El catàleg de
   pobles d'un ajust de pobles (una opció = un sol poble) i els que encara no
   s'han triat. Pures: les comparteixen el formulari i el seu desat. */
const catalegDePobles = (ajust) => (Array.isArray(ajust?.opcions) ? ajust.opcions : []).filter((opcio) => (
  typeof opcio?.valor === 'string' && opcio.valor && llistaDePobles(opcio.valor).length === 1
));
const poblesDisponibles = (ajust, triats) => catalegDePobles(ajust).filter((opcio) => !triats.includes(opcio.valor));

/**
 * El formulari d'un ajust del catàleg. Ja no porta la closca de l'editor
 * (I8): la fitxa l'edita PerfilEditor i ací només queden els formularis
 * del compte, dins de DetallCompte.
 *
 * Grup C (261008) · `membres` (opcional): les accions de membres del context
 * del Perfil ({ usuariId, llistaMembres, desaMembre, llevaMembre,
 * cercaCandidats }). Sense, «Membres» i «Eixir» es pinten pendents.
 *
 * Pla 261016 (Bloc 3.1; ordre del Mestre) · Un ajust 'llicencia' (els drets
 * de sèrie de les notes de la persona) pinta la píndola dels drets de
 * l'editor (BotoDretsAutor) i obri CopyrightPage en línia, dins del bloc.
 */
export default function DetallAjust({
  ajust,
  identitat,
  guardarAjust,
  pujaMitja,
  membres = null,
}) {
  const navigate = useNavigate();
  /* T47 (correcció de la revisió C01, 260928) · «Confirmar eixida» pregunta
     primer què no ha arribat al servidor i ho diu abans d'esborrar-ho.
     Recàrrega completa: cap context en memòria sobreviu a la sessió. */
  const despresDEixir = useCallback(() => {
    navigate('/xat', { replace: true });
    pagina.recarrega();
  }, [navigate]);
  const eixida = useEixidaSegura({ despres: despresDEixir });

  const [valorTemp, setValorTemp] = useState('');
  const [pobleExtra, setPobleExtra] = useState('');
  const [desant, setDesant] = useState(false);
  const [pujant, setPujant] = useState(false);
  const [missatge, setMissatge] = useState(null);
  const timeoutMissatge = useRef(null);
  /* Grup C (261008) · «Eixir de l'organització»: la confirmació, la guarda de
     doble enviament i l'error (l'èxit el diu l'avís efímer de l'App). */
  const { showToast } = useToast();
  const [confirmaEixir, setConfirmaEixir] = useState(false);
  const [eixint, setEixint] = useState(false);
  const [errorEixir, setErrorEixir] = useState(null);
  const eixintRef = useRef(false);
  const muntat = useRef(true);
  useEffect(() => { muntat.current = true; return () => { muntat.current = false; }; }, []);
  /* Correcció 261008 · L'error d'«Eixir» es pinta quan la confirmació ja
     s'ha tancat: el <dialog> el tanca el seu efecte (el del fill, abans que
     este), i un avís nascut amb el modal obert naix en una pàgina inert i el
     lector no l'anuncia. */
  const errorEixirPendent = useRef(null);
  useEffect(() => {
    if (confirmaEixir || errorEixirPendent.current == null) return;
    setErrorEixir(errorEixirPendent.current);
    errorEixirPendent.current = null;
  }, [confirmaEixir]);

  /* ── Tots els hooks ABANS de cap return condicional ── */
  const isPersona = identitat?.mena === 'persona';
  const carpetaMitjans = isPersona ? 'avatars' : 'organitzacions';

  /* Onada 4 · T3 (RETALLADOR.txt §3) · Una foto d'avatar passa abans pel
     retallador en quadrat, el mateix del Perfil (useEnquadramentAvatar).
     Cancel·lar no puja res i el focus torna al selector de fitxers. Avui cap
     ajust de «compte» és una imatge (l'avatar s'edita a la fitxa, amb el
     botó «Avatar» i la seua finestra de retall, useImatgeDeFitxa): esta
     branca espera el dia que el catàleg en porte. */
  const enquadrament = useEnquadramentAvatar({
    onEnquadrat: pujaImatge,
    onError: (text) => setMissatge({ tipus: 'error', text }),
  });

  /* El timeout del missatge de "Desat" es neteja en desmuntar. */
  useEffect(() => () => clearTimeout(timeoutMissatge.current), []);

  /* Grup C (correcció 261008) · Mentre dura el «Desat correctament.», el canvi
     de valor que porta el nostre desat (el Perfil refà l'ajust amb el valor
     nou: PerfilContext.aplicaColumnes) només sincronitza el control; abans
     esborrava el missatge al commit següent. Un altre ajust o una altra
     identitat sí que l'esborren, i un canvi de valor sense desat nostre també. */
  const acabaDeDesar = useRef(false);

  /* Pla 261016 (Bloc 3.1; ordre del Mestre) · Els drets de sèrie de les notes
     (tipus 'llicencia'): la píndola obri CopyrightPage dins del bloc i, en
     tancar-la, el focus torna a la píndola (el patró d'EspecimenDretsAutor).
     L'esborrany de la vista (la tria i el text) dura mentre esta pàgina és
     muntada, com a l'editor (DocumentEditor): «Tornar al compte», Escape o un
     desat que el servidor rebutja no el perden; «Cancel·lar» i un desat bo,
     sí. La casella de CC0 no hi va mai. */
  /* Pla 261018_1605 (Tasca 2, D5; correcció de la revisió) · Els pobles de la
     persona: «Llevar», «Fer principal» i «Afegir poble» canvien la llista, i
     el botó premut desapareix o es desactiva. El focus va a un lloc estable
     (el «Llevar» del costat, el del poble que ara és principal, el Selector o
     la llista) i una regió viva diu el canvi i que encara cal «Guardar». */
  const contenidorPobles = useRef(null);
  const focusPobles = useRef(null);
  const [avisPobles, setAvisPobles] = useState('');

  const [dretsOberts, setDretsOberts] = useState(false);
  const esborranyDrets = useRef(null);
  const pindolaDrets = useRef(null);
  const tornaFocusDrets = useRef(false);
  useEffect(() => {
    if (dretsOberts || !tornaFocusDrets.current) return;
    tornaFocusDrets.current = false;
    pindolaDrets.current?.querySelector('[data-sdp-drets]')?.focus();
  }, [dretsOberts]);

  useEffect(() => {
    const objectiu = focusPobles.current;
    const arrel = contenidorPobles.current;
    if (!objectiu || !arrel) return;
    focusPobles.current = null;
    const boto = objectiu.etiqueta
      ? [...arrel.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === objectiu.etiqueta && !b.disabled)
      : null;
    (boto || arrel.querySelector(objectiu.selector || 'ul') || arrel.querySelector('select'))?.focus?.();
  }, [valorTemp, pobleExtra]);

  /* Pla 261016 (Bloc 3.1) · Els drets que el servidor té desats són els de
     sèrie de les notes noves també en este dispositiu: el mirall que la fitxa
     ja fa (PerfilEditor, T39) quan n'arriba un valor, ara també en obrir «El
     compte». Per l'id de la fila, mai 'jo'. Un valor buit no esborra res: la
     columna pot faltar al servidor. */
  const dretsDelServidor = isPersona && ajust?.tipus === 'llicencia' && typeof ajust.valor === 'string' ? ajust.valor : '';
  const idHerencia = identitat?.dades?.id;
  useEffect(() => {
    if (dretsDelServidor) sincronitzaLlicenciaPerDefecte(idHerencia, dretsDelServidor);
  }, [dretsDelServidor, idHerencia]);

  useEffect(() => {
    acabaDeDesar.current = false;
    /* Pla 261016 · Un altre ajust o una altra identitat: la vista dels drets
       es tanca i el seu esborrany no hi passa. */
    setDretsOberts(false);
    esborranyDrets.current = null;
  }, [ajust?.id, identitat?.id, ajust?.tipus]);

  useEffect(() => {
    const valorInicial =
      ajust?.tipus === 'password'
        ? ''
        : ajust?.tipus === 'boolean' || ajust?.tipus === 'visibilitat'
          ? Boolean(ajust?.valor)
          : ajust?.valor ?? '';
    setValorTemp(valorInicial);
    setPobleExtra('');
    setAvisPobles('');
    if (acabaDeDesar.current) return;
    clearTimeout(timeoutMissatge.current);
    setMissatge(null);
  }, [ajust?.id, identitat?.id, ajust?.tipus, ajust?.valor]);

  /* ── Accions ── */

  /* La foto triada no es puja encara: primer s'enquadra. Sense pujada al
     servidor no s'obri el retallador (es diria després d'haver retallat). */
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMissatge(null);
    if (typeof pujaMitja !== 'function') {
      setMissatge({ tipus: 'error', text: ERROR_SENSE_PUJADA });
      return;
    }
    enquadrament.obri(file);
  }

  /* El fitxer ja retallat: la compressió i la pujada de sempre (WebP, la
     carpeta de la identitat), un sol fitxer. Si falla, l'avís ix al
     formulari i també dins del retallador, que continua obert.
     Gauntlet 261016 (Bloc 1, Llei del Quadrat) · L'avatar ix a MIDA_AVATAR
     (400 px) i dins del pressupost de les fotos (menys de 80.000 bytes, només
     baixant la qualitat: fotoDinsDelPressupost). Si ni la qualitat més baixa
     hi cap, no puja res i es diu ERROR_PRESSUPOST, no un error de connexió.
     El fitxer porta el tipus i l'extensió reals: JPEG si el canvas no ha
     sabut fer WebP (Safari 16).
     Gauntlet 261016 (Bloc 1.2, mandat del Mestre) · `exif` és la tria de la
     casella del retallador (useEnquadramentImatge), que diu «Conserva la
     ubicació i la data de la foto» o, si la foto només porta la càmera,
     «Conserva les dades de la càmera de la foto». Marcada, l'avatar porta
     l'EXIF publicable de l'original: si és ell el que no cap, es diu
     ERROR_PRESSUPOST_EXIF (o ERROR_PRESSUPOST_EXIF_CAMERA), i si no es pot
     conservar (l'original no ho permet o el format que ix no el porta),
     ERROR_EXIF_NO_CONSERVABLE (o el de la càmera).
     Gauntlet 261016 (F1) · Tots els avisos de la foto (esAvisDeLaFoto, la
     llista única de pujadaImatge.js) es diuen tal qual. Abans només en
     reconeixia dos, i la resta eixien com un error de connexió.
     P1-64 (Mestre 261028, decisió 7) · L'avatar és identitat: el retallador
     no oferix cap casella i `exif` és { conservaExif: false }. Si la foto
     portava GPS (info.gpsEliminat), la línia d'èxit ho diu amb
     AVIS_GPS_ELIMINAT_PERFIL. */
  async function pujaImatge(file, info, exif) {
    setPujant(true);
    setMissatge(null);
    let error = ERROR_PUJADA;
    try {
      const { fitxer } = await fotoDinsDelPressupost(file, { mida: MIDA_AVATAR, nom: 'avatar', ...exif });
      const url = await pujaMitja(fitxer, carpetaMitjans);

      if (url) {
        setValorTemp(url);
        const pujada = 'Imatge pujada. Ara dóna-li a Guardar.';
        setMissatge({ tipus: 'exit', text: info?.gpsEliminat === true ? `${pujada} ${AVIS_GPS_ELIMINAT_PERFIL}` : pujada });
        return;
      }
    } catch (err) {
      if (esAvisDeLaFoto(err?.message)) {
        error = err.message;
      } else {
        console.warn('Upload to storage failed', err);
        error = ERROR_CONNEXIO;
      }
    } finally {
      setPujant(false);
    }
    setMissatge({ tipus: 'error', text: error });
    throw new Error(error);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ajust || !identitat) return;

    if (
      ajust.tipus === 'imatge' &&
      typeof valorTemp === 'string' &&
      valorTemp.startsWith('data:') &&
      valorTemp.length > MAX_DATA_URL
    ) {
      setMissatge({
        tipus: 'error',
        text: 'La imatge local és massa gran per a desar-la. Torna-ho a provar amb connexió.',
      });
      return;
    }

    if (ajust.tipus === 'password' && String(valorTemp).length < MINIM_CONTRASENYA) {
      setMissatge({ tipus: 'error', text: `La contrasenya ha de tindre almenys ${MINIM_CONTRASENYA} caràcters.` });
      return;
    }

    /* T43 (ordre del Mestre, 260928) · Un correu buit és vàlid: vol dir
       «el per defecte». Un correu escrit ha de tindre una forma segura. */
    if (ajust.tipus === 'correu' && String(valorTemp).trim() && !validaCorreu(valorTemp)) {
      setMissatge({ tipus: 'error', text: ERROR_CORREU_INVALID });
      return;
    }

    /* Pla 261018_1605 (Tasca 2, D5; correcció de la revisió) · Un poble triat
       al Selector i encara no afegit («Afegir poble») entra en el desat: abans
       es desava sense ell i es deia «Desat correctament.». */
    if (ajust.tipus === 'selector' && ajust.multiple && pobleExtra) {
      const triats = llistaDePobles(valorTemp);
      if (poblesDisponibles(ajust, triats).some((opcio) => opcio.valor === pobleExtra)) {
        const ambElPendent = formataPoble([...triats, pobleExtra]);
        setValorTemp(ambElPendent);
        setPobleExtra('');
        await desaValor(ambElPendent);
        return;
      }
    }

    await desaValor(valorTemp);
  }

  /* El desat d'un ajust, amb el seu missatge: el de «Guardar» i, des del pla
     261016 (Bloc 3.1), el de «Desar autoria» dels drets de sèrie. Torna true
     si el servidor l'ha acceptat. */
  async function desaValor(valor) {
    setDesant(true);
    setMissatge(null);
    /* Abans de la crida: el Perfil pot aplicar el valor nou (i tornar a pintar
       este ajust) abans que la promesa es resolga. */
    acabaDeDesar.current = true;
    try {
      /* Identitat EXPLÍCITA: este era el forat que escrivia a
         l'entitat equivocada. */
      await guardarAjust(identitat.id, ajust.id, valor);
      /* Un poble triat al Selector que no s'ha desat no es queda a la vista
         com si ho estiguera (el valor desat pot ser el mateix i l'efecte de
         reinici no torna a córrer). */
      setPobleExtra('');
      setAvisPobles('');
      setMissatge({ tipus: 'exit', text: 'Desat correctament.' });
      clearTimeout(timeoutMissatge.current);
      timeoutMissatge.current = setTimeout(() => {
        acabaDeDesar.current = false;
        setMissatge(null);
      }, 3000);
      return true;
    } catch (error) {
      acabaDeDesar.current = false;
      setMissatge({ tipus: 'error', text: textDeDesat(error) });
      return false;
    } finally {
      setDesant(false);
    }
  }

  /* Pla 261016 (Bloc 3.1) · Obrir i tancar la vista dels drets de sèrie.
     «Desar autoria» la tanca abans del desat (com a l'editor) i el resultat
     es diu davall de la píndola; si el servidor el rebutja, l'esborrany es
     queda per a la pròxima obertura. Mentre es desa, la píndola no la torna
     a obrir. */
  function obriDrets() {
    if (!desant) setDretsOberts(true);
  }
  function tancaDrets(motiu) {
    if (motiu === 'boto') esborranyDrets.current = null;
    tornaFocusDrets.current = true;
    setDretsOberts(false);
  }
  async function desaDrets(valor) {
    tornaFocusDrets.current = true;
    setDretsOberts(false);
    if (await desaValor(valor)) esborranyDrets.current = null;
  }

  function obriFitxa() {
    if (ajust?.valor && isSafeUrl(ajust.valor)) navigate(ajust.valor);
  }

  /* Grup C (261008) · La persona se'n va: es lleva ella mateixa (el seu id de
     persona). Si ix bé, el Perfil ja no porta l'organització i esta pàgina es
     desmunta; si no, l'error es diu en línia i la persona continua dins.
     Correcció 261008 · Per això la confirmació no és un text d'esta pàgina
     (no es veia mai): és l'avís efímer de l'App (useToast), el mateix que
     confirma una organització nova a PerfilShell, que sobreviu al desmuntatge. */
  async function eixDeLOrganitzacio() {
    if (eixintRef.current) return;
    if (membres?.usuariId == null) {
      errorEixirPendent.current = 'Cal iniciar sessió.';
      setConfirmaEixir(false);
      return;
    }
    const nom = identitat.nom;
    eixintRef.current = true;
    setEixint(true);
    setErrorEixir(null);
    try {
      await membres.llevaMembre(identitat.id, { tipus: 'persona', id: membres.usuariId });
      showToast(`Ja no formes part de ${nom}.`, 'success');
    } catch (error) {
      if (muntat.current && error?.name !== 'AbortError') {
        errorEixirPendent.current = error?.message || 'No s’ha pogut eixir de l’organització.';
      }
    } finally {
      eixintRef.current = false;
      if (muntat.current) {
        setEixint(false);
        setConfirmaEixir(false);
      }
    }
  }

  /* ── Render: el CATÀLEG mana, la UI obedeix ── */

  function renderitzaAccio() {
    /* Grup C · «Membres» i «Eixir» necessiten les accions del Perfil. */
    const senseMembres = (ajust.accio === 'membres' || ajust.accio === 'eixir') && !membres;
    if (ajust.pendent || senseMembres) {
      /* Honestedat abans que promeses: acció declarada però sense
         backend = botó desactivat + explicació, mai "permission
         denied" en silenci. */
      return (
        <div className="sdp-buit">
          <button type="button" className="sdp-boto" disabled>
            {ajust.titol}
          </button>
          <p className="sdp-buit">
            Aquesta acció encara no està implementada en aquesta versió.
          </p>
        </div>
      );
    }
    if (ajust.accio === 'logout') {
      return (
        <div className="sdp-buit">
          <button type="button" className="sdp-boto sdp-boto--perill" onClick={eixida.demana}
            disabled={eixida.ocupat || Boolean(eixida.avis)}>
            Confirmar eixida
          </button>
          {eixida.avis}
          {eixida.error ? <p className="sdp-camp__error" role="alert">{eixida.error}</p> : null}
        </div>
      );
    }
    if (ajust.accio === 'obrir-fitxa') {
      return (
        <div className="sdp-buit perfil-compte__accions">
          <Boto varietat="primari" onClick={obriFitxa}>
            Veure la fitxa pública
          </Boto>
        </div>
      );
    }
    /* Ordre del Mestre (261008, grup C) · La gestió dels membres. */
    if (ajust.accio === 'membres') {
      return <GestioMembres organitzacio={identitat} accions={membres} />;
    }
    /* Onada 11 (261010; prompt 261010_1730, tasca 2) · El segon factor del
       superadmin, en línia com els membres, i l'entrada al Tauler. */
    if (ajust.accio === 'segon-factor') {
      return <SegonFactor />;
    }
    if (ajust.accio === 'obrir-admin') {
      return (
        <div className="sdp-buit">
          <Boto varietat="primari" onClick={() => navigate(RUTA_ADMIN)}>{ajust.titol}</Boto>
        </div>
      );
    }
    if (ajust.accio === 'eixir') {
      return (
        <div className="sdp-buit">
          <button type="button" className="sdp-boto sdp-boto--perill"
            onClick={() => { setErrorEixir(null); setConfirmaEixir(true); }} disabled={eixint}>
            Eixir de l’organització
          </button>
          {errorEixir ? <p className="sdp-camp__error" role="alert">{errorEixir}</p> : null}
        </div>
      );
    }
    /* Acció declarada però sense despachar: que el catàleg i la UI no
       tornen a divergir en silenci. */
    if (import.meta.env.DEV) {
      console.error(`[DetallAjust] Acció sense implementar: "${ajust.accio}" (ajust "${ajust.id}")`);
    }
    return <p className="sdp-buit">Acció pendent d'implementació.</p>;
  }

  /* Pla 261016 (Bloc 3.1; ordre del Mestre) · Els drets de sèrie de les
     notes. Tancada, la píndola de l'editor (la llicència desada o «Elegir
     drets d'autor») i el missatge del desat, com les accions del compte.
     Oberta, CopyrightPage dins del bloc: l'àmbit 'compte' diu amb què naixen
     les notes noves, i els textos que a l'editor parlen del document parlen
     ací del compte i de les notes. L'autor de «Copyright (C)» és el de la
     fitxa (fitxaDeLectura: el nom de la fila o el de la identitat). */
  function renderitzaDrets(blocMissatge) {
    const desats = typeof ajust.valor === 'string' ? ajust.valor : '';
    if (dretsOberts) {
      return (
        <CopyrightPage
          valor={desats}
          autor={fitxaDeLectura(identitat).title}
          ambit="compte"
          esborrany={esborranyDrets.current}
          onEsborrany={(esborrany) => { esborranyDrets.current = esborrany; }}
          onDesa={desaDrets}
          onTanca={tancaDrets}
          etiquetaTornar="Tornar al compte"
          introduccio={desats
            ? `Tria amb quins drets naixen les teues notes noves. Ara són «${desats}». Res no canvia fins que prems «Desar autoria».`
            : 'Tria amb quins drets naixen les teues notes noves. Res no canvia fins que prems «Desar autoria».'}
          llegenda="Tria els drets de sèrie de les teues notes"
        />
      );
    }
    return (
      <div className="sdp-buit" ref={pindolaDrets}>
        <BotoDretsAutor valor={desats} triada={desats} onClick={obriDrets} />
        {blocMissatge}
      </div>
    );
  }

  /* Pla 261018_1605 (Tasca 2, D5; ordre del Mestre, 18-10-2026) · Els pobles
     de la persona (`ajust.multiple`). La columna és una sola (town_name) i hi
     va la cadena canònica 'A · B' (formataPoble): el primer és el principal.
     Els triats, una llista amb «Llevar» per a cada un (mai l'últim: una
     persona no es queda sense poble). Afegir-ne, NOMÉS del catàleg
     («El poble és innegociable»): el Selector porta les opcions del catàleg
     que encara no hi són, mai text lliure, i una opció que ja porta més d'un
     poble no hi entra. Res no es desa fins a «Guardar». Tot de Pedra Seca.
     Correcció de la revisió · Un poble triat al Selector i no afegit també
     entra en «Guardar» (handleSubmit). El focus no es perd quan el botó premut
     desapareix (efecte de focusPobles), i una regió viva, només per al
     lector, diu el canvi. Sense cap poble al catàleg (encara no s'ha pogut
     llegir), el Selector ho diu: no és que no en quede cap. */
  function renderitzaPobles(blocMissatge, blocGuardar) {
    const triats = llistaDePobles(valorTemp);
    const cataleg = catalegDePobles(ajust);
    const disponibles = poblesDisponibles(ajust, triats);
    const afig = () => {
      if (!disponibles.some((opcio) => opcio.valor === pobleExtra)) return;
      setValorTemp(formataPoble([...triats, pobleExtra]));
      setAvisPobles(`S’ha afegit ${pobleExtra}: prem «Guardar» per a desar-ho.`);
      setPobleExtra('');
      focusPobles.current = { selector: 'select' };
    };
    const lleva = (nom) => {
      if (triats.length < 2) return;
      const index = triats.indexOf(nom);
      const queden = triats.filter((poble) => poble !== nom);
      setValorTemp(formataPoble(queden));
      setAvisPobles(`S’ha llevat ${nom}: prem «Guardar» per a desar-ho.`);
      focusPobles.current = queden.length > 1
        ? { etiqueta: `Llevar ${queden[Math.min(index, queden.length - 1)]}` }
        : { selector: 'ul' };
    };
    const fesPrincipal = (nom) => {
      setValorTemp(formataPoble([nom, ...triats.filter((poble) => poble !== nom)]));
      setAvisPobles(`${nom} és ara el poble principal: prem «Guardar» per a desar-ho.`);
      focusPobles.current = { etiqueta: `Llevar ${nom}` };
    };
    const textSenseOpcions = cataleg.length ? 'No en queda cap més al catàleg' : 'Encara no s’ha pogut llegir el catàleg de pobles';
    return (
      <form onSubmit={handleSubmit}>
        <div className="perfil-pobles-multi" ref={contenidorPobles}>
          <p className="sdp-nomes-lector" aria-live="polite">{avisPobles}</p>
          {triats.length > 0 ? (
            <ul className="perfil-pobles-multi__llista" aria-label="Els teus pobles" tabIndex={-1}>
              {triats.map((nom, index) => (
                <li key={nom} className="perfil-pobles-multi__poble">
                  <span>{nom}</span>
                  {index === 0 ? <Insignia to="info">Principal</Insignia> : (
                    <Boto varietat="fantasma" aria-label={`Fer principal ${nom}`} onClick={() => fesPrincipal(nom)} disabled={desant}>
                      Fer principal
                    </Boto>
                  )}
                  {triats.length > 1 ? (
                    <Boto varietat="fantasma" aria-label={`Llevar ${nom}`} onClick={() => lleva(nom)} disabled={desant}>
                      Llevar
                    </Boto>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="perfil-compte__text">Encara no has triat cap poble.</p>
          )}
          <Camp etiqueta="Afegir un poble:" ajuda={ajust.ajuda}>
            <Selector
              value={pobleExtra}
              onChange={(e) => setPobleExtra(e.target.value)}
              opcions={[
                { valor: '', etiqueta: disponibles.length ? 'Tria un poble…' : textSenseOpcions },
                ...disponibles,
              ]}
              disabled={desant || disponibles.length === 0}
            />
          </Camp>
          <div className="perfil-pobles-multi__afegir">
            <Boto varietat="secundari" onClick={afig} disabled={desant || !pobleExtra}>
              Afegir poble
            </Boto>
          </div>
        </div>
        {blocMissatge}
        {blocGuardar}
      </form>
    );
  }

  function renderitzaFormulari() {
    if (!ajust.obert) {
      /* Un ajust tancat amb valor (el correu, l'identificador) el mostra:
         saber-lo també és part del compte. Grup C · també el poble triat.
         Pla 261016 (Bloc 3.1) · I els drets de sèrie desats. */
      const valorVisible = (ajust.tipus === 'text' || ajust.tipus === 'selector' || ajust.tipus === 'llicencia')
        && typeof ajust.valor === 'string' ? ajust.valor : '';
      return (
        <>
          {valorVisible ? <p className="perfil-ajust__valor">{valorVisible}</p> : null}
          <p className="sdp-buit">
            {ajust.motiu || 'Aquest ajust no es pot modificar.'}
          </p>
        </>
      );
    }

    if (ajust.tipus === 'accio') return renderitzaAccio();

    const tipus = ajust.tipus || 'text';
    /* T43 · L'ajuda del catàleg (p. ex. d'on ix el correu per defecte) es
       llig amb el control (aria-describedby). */
    const idAjuda = ajust.ajuda ? `ajust-${ajust.id}-ajuda` : undefined;

    const blocMissatge = missatge && (
      <p
        className={missatge.tipus === 'exit' ? 'sdp-text-exit' : 'sdp-camp__error'}
        role={missatge.tipus === 'exit' ? 'status' : 'alert'}
      >
        {missatge.text}
      </p>
    );
    /* Encàrrec d'harmonització (261018) · Guardar, centrat (PerfilShell.css). */
    const blocGuardar = (
      <div className="sdp-alerta__accions perfil-compte__accions">
        <button type="submit" className="sdp-boto sdp-boto--primari" disabled={desant || pujant}>
          {desant ? 'Desant...' : 'Guardar'}
        </button>
      </div>
    );

    if (tipus === 'llicencia') return renderitzaDrets(blocMissatge);

    /* Encàrrec d'harmonització (261018, ordre del Mestre: «l'estat del perfil,
       visible i amigable») · En lloc de la casella «Privat», les dues eixides
       explicades com a targetes de Pedra Seca (GrupOpcions, el model de
       SelectorVisibilitat), amb el perfil públic primer. Es confirma amb
       Guardar. Els textos diuen el que fa el servidor (perfil_public,
       2610021520; text legal §13): públic, sencer per a tothom amb compte;
       privat, només el nom, la foto i el poble, per a la gent del poble. */
    if (tipus === 'visibilitat') {
      /* Pla 261018_1605 (Tasca 2, D5) · Amb diversos pobles, el principal. */
      const poble = poblePrincipal(identitat?.dades?.town_name);
      const actual = Boolean(ajust.valor);
      const opcio = (publica) => {
        const Icona = publica ? Globe : Lock;
        return {
          valor: publica ? 'public' : 'privat',
          antetitol: publica === actual ? 'Com està ara' : undefined,
          etiqueta: publica ? 'Perfil públic' : 'Perfil privat',
          ajuda: publica
            ? `Tot el veïnat del Mas el pot llegir sencer i trobar-te${poble ? ` des de ${poble}` : ''}: el poble sap qui hi és i et pot escriure.`
            : `Només el nom, la foto i el poble, i només per a la gent ${poble ? `de ${poble}` : 'del teu poble'}. La resta, per a tu.`,
          icona: <Icona size={28} strokeWidth={1.5} aria-hidden="true" focusable="false" />,
        };
      };
      return (
        <form onSubmit={handleSubmit}>
          {/* Pla 261018_1605 (Tasca 1, D3; ordre del Mestre, 18-10-2026) · L'avís
              només quan el valor DESAT és públic (amb el privat, mentiria).
              Sense regió viva: el missatge del desat és l'únic rol status del bloc. */}
          {actual ? <Alerta to="info" viva={false}>{AVIS_FITXA_PUBLICA}</Alerta> : null}
          <GrupOpcions
            aspecte="targetes"
            llegenda="Qui pot vore el teu perfil?"
            nom={`ajust-${ajust.id}`}
            valor={valorTemp ? 'public' : 'privat'}
            onCanvi={(valor) => setValorTemp(valor === 'public')}
            disabled={desant}
            textTriada="Triat"
            opcions={[opcio(true), opcio(false)]}
          />
          {blocMissatge}
          {blocGuardar}
        </form>
      );
    }

    /* Grup C (261008) · Un ajust amb opcions (el poble de l'organització):
       Camp i Selector de Pedra Seca, amb el mateix missatge i el mateix
       Guardar. Camp ja porta l'etiqueta, l'ajuda i l'aria-describedby.
       Pla 261018_1605 (Tasca 2, D5) · Amb `ajust.multiple` (els pobles de la
       persona), la seua llista: renderitzaPobles. */
    if (tipus === 'selector' && ajust.multiple) return renderitzaPobles(blocMissatge, blocGuardar);
    if (tipus === 'selector') {
      return (
        <form onSubmit={handleSubmit}>
          <Camp etiqueta={`Nou valor per a ${ajust.titol.toLowerCase()}:`} ajuda={ajust.ajuda}>
            <Selector
              value={valorTemp}
              onChange={(e) => setValorTemp(e.target.value)}
              opcions={Array.isArray(ajust.opcions) ? ajust.opcions : []}
              disabled={desant}
            />
            {blocMissatge}
            {blocGuardar}
          </Camp>
        </form>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="sdp-form">
        <div className="sdp-camp">
          <label className="sdp-camp__etiqueta" htmlFor={`ajust-${ajust.id}`}>
            {tipus === 'boolean'
              ? `${ajust.titol}:`
              : `Nou valor per a ${ajust.titol.toLowerCase()}:`}
          </label>
          {ajust.ajuda ? <p id={idAjuda} className="sdp-camp__ajuda">{ajust.ajuda}</p> : null}

          {tipus === 'imatge' ? (
            <div className="sdp-alerta__accions">
              {valorTemp && (
                <div className="sdp-avatar sdp-avatar--xl">
                  <img src={valorTemp} alt="Previsualització" className="sdp-avatar__imatge" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                id={`ajust-${ajust.id}`}
                className="sdp-control"
                onChange={handleFileChange}
                disabled={pujant}
              />
              {pujant && <p className="sdp-camp__ajuda">Pujant la imatge...</p>}
            </div>
          ) : tipus === 'boolean' ? (
            /* El nom de la casella és estable («Perfil públic»): l'estat que es
               pinta al costat canvia, i com a nom faria dir «Privat, no marcada». */
            <label className="sdp-camp__check">
              <input
                type="checkbox"
                id={`ajust-${ajust.id}`}
                aria-label={ajust.casella || ajust.titol}
                aria-describedby={idAjuda}
                checked={Boolean(valorTemp)}
                onChange={(e) => setValorTemp(e.target.checked)}
              />
              {valorTemp ? 'Públic' : 'Privat'}
            </label>
          ) : tipus === 'area' ? (
            <textarea
              id={`ajust-${ajust.id}`}
              className="sdp-control sdp-control--area"
              rows="5"
              value={valorTemp}
              onChange={(e) => setValorTemp(e.target.value)}
            />
          ) : tipus === 'correu' ? (
            <input
              type="email"
              id={`ajust-${ajust.id}`}
              className="sdp-control"
              value={valorTemp}
              onChange={(e) => setValorTemp(e.target.value)}
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              aria-describedby={idAjuda}
            />
          ) : (
            <input
              type={tipus === 'password' ? 'password' : 'text'}
              id={`ajust-${ajust.id}`}
              className="sdp-control"
              value={valorTemp}
              onChange={(e) => setValorTemp(e.target.value)}
              placeholder={tipus === 'password' ? 'Introdueix nova contrasenya...' : ''}
              autoComplete={tipus === 'password' ? 'new-password' : undefined}
              minLength={tipus === 'password' ? MINIM_CONTRASENYA : undefined}
            />
          )}

          {blocMissatge}

          {blocGuardar}
        </div>
      </form>
    );
  }

  if (!identitat) {
    return (
      <div className="sdp-buit">
        <p>Crea el teu compte o inicia sessió per a començar.</p>
      </div>
    );
  }

  return (
    <div className="perfil-detall">
      {ajust ? renderitzaFormulari() : (
        <p className="sdp-buit">
          Selecciona un ajust de l'esquerra per a modificar-lo.
        </p>
      )}
      {/* Fora del <form>: els controls del retallador no l'han d'enviar. */}
      {enquadrament.dialeg}
      {/* Grup C (261008) · La confirmació d'«Eixir de l'organització». */}
      {ajust?.accio === 'eixir' && membres ? (
        <DialegConfirmacio
          obert={confirmaEixir}
          onTanca={() => { if (!eixintRef.current) setConfirmaEixir(false); }}
          onConfirma={eixDeLOrganitzacio}
          titol={`Eixir de ${identitat.nom}?`}
          descripcio="Deixaràs de ser-ne membre i ja no la veuràs al teu perfil. Per a tornar-hi, algú que l’administre t’hi haurà d’afegir."
          etiquetaConfirma="Eixir"
          destructiu
          carregant={eixint}
        />
      ) : null}
    </div>
  );
}
