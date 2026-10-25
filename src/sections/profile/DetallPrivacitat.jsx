import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { dataDeFila, diaIso } from '../../components/universal/editorial.js';
import { Alerta, AreaText, Boto, Camp, DialegConfirmacio } from '../../components/PedraSeca';
import { Link, useNavigate } from '../../app/contexts/RouterContext';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import {
  teCapacitat, exportaLesMeuesDades, estatBaixa, demanaBaixa, cancelaBaixa,
  estatConsentiment, registraConsentiment, revocaConsentiment,
} from '../../data/backendPort.js';
import { readableBackendError } from '../onboarding/onboardingModel.js';
import { BlocPerfil as Bloc } from './BlocPerfil.jsx';
import { rutaDePerfil } from '../../config/navigation.js';
import { pobleDeFitxa } from './fitxaDePerfil.js';
import { useModeracio } from '../../components/PedraSeca/hooks/moderacioDePoble.js';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { TEXTOS_MODERACIO } from '../../components/PedraSeca/organismes/textosModeracio.js';
import { LlistaBloquejos } from '../../components/universal/LlistaBloquejos.jsx';
/* Gauntlet 261025_0545 (BOT-04) · Dins de l'app nativa (el pont de Capacitor o
   l'entrada nativa registrada, com l'origen públic) i els textos amb {nom}. */
import { esAppNativa } from '../../config/origenPublic.js';
import { capturaSessio } from '../../data/identitat.js';
import { omple } from '../../config/moderacio.js';

/* ═══════════════════════════════════════════════════════════════════
   PRIVACITAT I DADES · els drets de la persona sobre el que guardem

   Tres blocs (D12 i D3), NOMÉS si el backend declara la capacitat:
     · «Les meues dades»   → exportaLesMeuesDades (fitxer JSON)   'compte'
     · «Consentiment»      → estatConsentiment / registra / revoca 'consentiment'
     · «Donar-se de baixa» → estatBaixa / demanaBaixa / cancelaBaixa 'compte'
   Un backend sense la capacitat no pinta el bloc: cap botó promet el
   que el servidor no sap fer. PerfilShell ni tan sols mostra l'element
   si no hi ha cap de les dues. Abans vivien dins de «El compte».
   ═══════════════════════════════════════════════════════════════════ */

/* Decisió D12: la purga arriba 30 dies després de demanar la baixa. La data
   exacta la dona el servidor en confirmar-la. */
const DIES_GRACIA = 30;
/* Correccions 261024 (revisió R3-04) · Si queda una autorització d'Apple per
   retirar, la purga espera fins a dies_espera_revocacio_apple dies més: el 7
   de private.ajustos (migracions 2610241420 i 2610241440). Si el Mestre el
   canvia, ha de canviar ací. */
const DIES_ESPERA_APPLE = 7;
const TIPUS_RGPD = 'rgpd_acepta';
/* Correccions 261024 (revisió R3-10) · L'excepció dels fitxers, la de la
   purga de 2610241440: es conserven els que encara usa una entitat (el logo,
   la portada, la fitxa o una publicació seua) o una publicació d'una altra
   persona. */
const FITXERS_EN_US = 'que encara fa servir una entitat (la seua fitxa o una publicació) o una publicació d’una altra persona';
const ESPERA_APPLE = `Si vas entrar amb Apple i encara no hem pogut retirar el permís, l’esborrat pot esperar fins a ${DIES_ESPERA_APPLE} dies més.`;

/** socdepoble-dades-AAAA-MM-DD.json amb la data local de hui (diaIso,
    el mateix dia que compon la pastilla: cap còpia pròpia de les xifres). */
export function nomFitxerExportacio(ara = new Date()) {
  return `socdepoble-dades-${diaIso(ara)}.json`;
}

/** Descàrrega amb Blob i un enllaç temporal: res passa per cap servidor.
    L'enllaç no es penja del document: l'app pot viure dins d'un shadow root
    (Llei 06 de Pedra Seca, encapsulament) i els navegadors del baseline ja
    descarreguen amb el clic d'un enllaç despenjat. */
function descarregaJson(dades, nom) {
  const blob = new Blob([JSON.stringify(dades, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const enllac = document.createElement('a');
  enllac.href = url;
  enllac.download = nom;
  enllac.rel = 'noopener';
  enllac.click();
  // Safari necessita que la URL visca un moment després del clic.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* Gauntlet 261025_0545 (BOT-04; RGPD art. 20) · Dins de l'app nativa el clic
   de descarregaJson no desa res, i la vista deia que el fitxer era a les
   descàrregues: iOS passa l'enllaç blob: a UIApplication.open i el
   cancel·la, i el WebView d'Android no té cap DownloadListener. Sense cap
   dependència nova, el que sí que funciona: el menú de compartir del sistema
   amb el fitxer (Web Share amb `files`, si el WebView l'admet per a ESTE
   fitxer: WKWebView sí, el d'Android no), copiar el text i, sempre, el JSON en
   un quadre de només lectura. Mai «a les descàrregues» sense descàrrega. Els
   textos, en parells [clau i18n, reserva en valencià], com TEXTOS_MODERACIO. */
const textDades = (nom, reserva) => Object.freeze([`section.perfil.privacitat.dades.${nom}`, reserva]);
const TEXTOS_DADES_NATIU = Object.freeze({
  preparades: textDades('natiu', 'Les teues dades ja estan preparades. Dins de l’app no es poden desar soles a les descàrregues: guarda-les tu com a {nom}.'),
  compartix: textDades('compartix', 'Compartir el fitxer'),
  copia: textDades('copia', 'Copiar el text'),
  text: textDades('text', 'Les teues dades, en JSON'),
  textAjuda: textDades('textAjuda', 'Si no pots compartir el fitxer ni copiar el text amb el botó, selecciona’l ací i enganxa’l en una nota o un correu.'),
  compartit: textDades('compartit', 'Fet: has enviat el fitxer {nom} des del menú de compartir.'),
  errorCompartir: textDades('errorCompartir', 'No s’ha pogut compartir el fitxer. Copia’n el text i desa’l tu.'),
  copiat: textDades('copiat', 'Text copiat. Enganxa’l en una nota o un correu i desa’l com a {nom}.'),
  errorCopiar: textDades('errorCopiar', 'No s’ha pogut copiar el text. Selecciona’l al quadre i copia’l tu.'),
});

/** El fitxer de l'exportació per al menú de compartir, o null (sense File). */
function fitxerDeLExportacio(text, nom) {
  try {
    return typeof File === 'function' ? new File([text], nom, { type: 'application/json' }) : null;
  } catch {
    return null;
  }
}

/** Si el sistema pot compartir ESTE fitxer. Web Share amb `files` és fora del baseline: es pregunta. */
function potCompartirFitxer(fitxer) {
  const nav = typeof navigator === 'undefined' ? null : navigator;
  if (!fitxer || typeof nav?.share !== 'function' || typeof nav.canShare !== 'function') return false;
  try {
    return nav.canShare({ files: [fitxer] }) === true;
  } catch {
    return false;
  }
}

const potCopiar = () => typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function';

export function dataLlegible(iso) {
  if (!iso) return '';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleDateString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

const missatgeDe = (error, perDefecte) => {
  const text = readableBackendError(error);
  return text && text !== 'S’ha produït un error inesperat.' ? text : perDefecte;
};

/** El `config` canvia d'identitat a cada render del pare: el llegim d'un ref. */
function useConfigActual(config) {
  const ref = useRef(config);
  ref.current = config;
  return ref;
}

/* ── «Les meues dades» ─────────────────────────────────────────────── */

/** BOT-04 · Les dades ja preparades, dins de l'app nativa: compartir el fitxer, copiar-ne el text o seleccionar-lo. */
function DadesDinsDeLApp({ nom, text, t }) {
  const [avis, setAvis] = useState(null);
  const fitxer = useMemo(() => fitxerDeLExportacio(text, nom), [text, nom]);
  const ambCompartir = potCompartirFitxer(fitxer);
  const ambCopiar = potCopiar();
  const diu = (to, parell) => setAvis({ to, text: omple(tradueix(t, parell), { nom }) });

  /* Un clic nou i no el de «Descarregar»: després de la consulta, el gest
     d'aquell clic ja pot haver caducat i el sistema rebutjaria el menú. */
  const compartix = async () => {
    setAvis(null);
    try {
      await navigator.share({ files: [fitxer] });
      diu('exit', TEXTOS_DADES_NATIU.compartit);
    } catch (e) {
      /* La persona ha tancat el menú de compartir: no passa res. */
      if (e?.name !== 'AbortError') diu('error', TEXTOS_DADES_NATIU.errorCompartir);
    }
  };
  const copia = async () => {
    setAvis(null);
    try {
      await navigator.clipboard.writeText(text);
      diu('exit', TEXTOS_DADES_NATIU.copiat);
    } catch {
      diu('error', TEXTOS_DADES_NATIU.errorCopiar);
    }
  };

  return (
    <>
      <Alerta to="info">{omple(tradueix(t, TEXTOS_DADES_NATIU.preparades), { nom })}</Alerta>
      {avis ? <Alerta to={avis.to}>{avis.text}</Alerta> : null}
      {ambCompartir || ambCopiar ? (
        <div className="sdp-alerta__accions perfil-compte__accions">
          {ambCompartir ? <Boto varietat="primari" onClick={compartix}>{tradueix(t, TEXTOS_DADES_NATIU.compartix)}</Boto> : null}
          {ambCopiar ? <Boto varietat="secundari" onClick={copia}>{tradueix(t, TEXTOS_DADES_NATIU.copia)}</Boto> : null}
        </div>
      ) : null}
      <Camp etiqueta={tradueix(t, TEXTOS_DADES_NATIU.text)} ajuda={tradueix(t, TEXTOS_DADES_NATIU.textAjuda)}>
        <AreaText files={8} readOnly spellCheck={false} value={text} />
      </Camp>
    </>
  );
}

function BlocDades({ config }) {
  const configRef = useConfigActual(config);
  const t = useTraductorOpcional();
  const [estat, setEstat] = useState({ fase: 'repos' });
  /* La sessió i la vista tenen vides distintes: el port comprova la seua
     resposta, i ací tornem a comprovar abans de descarregar o mostrar-la. */
  const vidaRef = useRef({ muntat: false, peticio: 0, control: null, deslliga: null });
  useEffect(() => {
    const vida = vidaRef.current;
    vida.muntat = true;
    return () => {
      vida.muntat = false;
      vida.peticio += 1;
      vida.control?.abort();
      vida.deslliga?.();
      vida.control = null;
      vida.deslliga = null;
    };
  }, []);

  const descarrega = async () => {
    const vida = vidaRef.current;
    const configuracio = configRef.current;
    const extern = configuracio?.signal;
    if (!vida.muntat || extern?.aborted) return;
    const peticio = ++vida.peticio;
    vida.control?.abort();
    vida.deslliga?.();
    const control = new AbortController();
    vida.control = control;
    const avorta = () => {
      control.abort();
      if (vida.muntat && vida.peticio === peticio) setEstat({ fase: 'repos' });
    };
    const deslliga = () => extern?.removeEventListener('abort', avorta);
    extern?.addEventListener('abort', avorta, { once: true });
    vida.deslliga = deslliga;
    const current = capturaSessio();
    const vigent = () => vida.muntat && vida.peticio === peticio && !control.signal.aborted;
    setEstat({ fase: 'treballant' });
    try {
      const dades = await exportaLesMeuesDades({ ...configuracio, signal: control.signal });
      if (!vigent()) return;
      current();
      const nom = nomFitxerExportacio();
      /* Gauntlet 261025_0545 (BOT-04) · Dins de l'app nativa, cap clic de
         descàrrega ni cap «a les descàrregues»: les dades es queden a la
         vista per a compartir-les o copiar-les. A la web, el de sempre. */
      if (esAppNativa()) {
        setEstat({ fase: 'natiu', nom, text: JSON.stringify(dades, null, 2) });
        return;
      }
      descarregaJson(dades, nom);
      setEstat({ fase: 'fet', nom });
    } catch (e) {
      if (!vigent()) return;
      try { current(); } catch { return; }
      if (e?.name === 'AbortError') {
        setEstat({ fase: 'repos' });
        return;
      }
      setEstat({ fase: 'error', text: missatgeDe(e, 'No s’han pogut preparar les teues dades. Torna-ho a provar.') });
    } finally {
      deslliga();
      if (vida.peticio === peticio) {
        vida.control = null;
        vida.deslliga = null;
      }
    }
  };

  return (
    <Bloc titol="Les meues dades">
      {/* P2-08 (pla 261024_1315, T7; auditoria Codex C-04) · La llista honesta
          del que porta l'exportació (migració 2610241410) i el que no hi diu. */}
      <p className="perfil-compte__text">
        Descarrega una còpia de les dades que Sóc de Poble guarda del teu compte: perfil, organitzacions,
        publicacions, notes, converses, la llista dels teus fitxers i adjunts, consentiments, les denúncies que has
        fet, les persones i entitats que has bloquejat o que seguixes i les normes que has acceptat. Per a protegir
        altres persones, no hi diem qui t’ha denunciat, qui t’ha bloquejat ni qui et seguix: de les denúncies sobre tu
        només hi ha quantes han acabat amb una mesura (si en vols el detall, demana-nos-el per correu) i, de qui et
        seguix, quantes persones són. Tampoc no hi posem les empremtes de l’adreça IP ni el permís xifrat d’Apple. És
        un fitxer JSON que pots obrir amb qualsevol editor de text.
      </p>
      {estat.fase === 'error' ? <Alerta to="error">{estat.text}</Alerta> : null}
      {estat.fase === 'fet' ? <Alerta to="exit">{`Ja tens el fitxer ${estat.nom} a les descàrregues.`}</Alerta> : null}
      {estat.fase === 'natiu' ? <DadesDinsDeLApp nom={estat.nom} text={estat.text} t={t} /> : null}
      <div className="sdp-alerta__accions perfil-compte__accions">
        <Boto varietat="secundari" onClick={descarrega} carregant={estat.fase === 'treballant'}>
          Descarregar les meues dades
        </Boto>
      </div>
    </Bloc>
  );
}

/* ── «Consentiment» ────────────────────────────────────────────────── */

function EnllacPolitica({ url }) {
  if (typeof url !== 'string' || !url) return null;
  if (url.startsWith('/') && !url.startsWith('//')) return <Link to={url}>Llegir la política</Link>;
  if (/^https:\/\//i.test(url)) return <a href={url} target="_blank" rel="noopener noreferrer">Llegir la política</a>;
  return null;
}

function BlocConsentiment({ config }) {
  const configRef = useConfigActual(config);
  const [estat, setEstat] = useState(null);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');
  const [treballant, setTreballant] = useState(false);
  const [confirmaRetirada, setConfirmaRetirada] = useState(false);

  const llig = useCallback(async () => {
    try {
      const resposta = await estatConsentiment(configRef.current);
      setEstat(resposta || null);
      setError('');
    } catch (e) {
      setError(missatgeDe(e, 'No s’ha pogut llegir l’estat del consentiment.'));
    } finally {
      setCarregant(false);
    }
  }, [configRef]);

  useEffect(() => { llig(); }, [llig]);

  const actua = async (accio, perDefecte) => {
    setTreballant(true);
    setError('');
    try {
      await accio();
      setConfirmaRetirada(false);
      await llig();
    } catch (e) {
      setError(missatgeDe(e, perDefecte));
    } finally {
      setTreballant(false);
    }
  };

  const accepta = () => actua(
    () => registraConsentiment(TIPUS_RGPD, estat.versioVigent, configRef.current),
    'No s’ha pogut registrar el consentiment.',
  );
  const retira = () => actua(
    () => revocaConsentiment(TIPUS_RGPD, configRef.current),
    'No s’ha pogut retirar el consentiment.',
  );

  const rgpd = (estat?.consentiments || []).find((c) => c.tipus === TIPUS_RGPD) || null;
  const atorgat = rgpd?.accio === 'atorga';
  const versioVigent = estat?.versioVigent || null;

  let darrera = 'No consta que hages acceptat la política de privacitat.';
  if (rgpd && atorgat) darrera = `L’has acceptada (versió ${rgpd.versio}) el ${dataLlegible(rgpd.al)}.`;
  else if (rgpd) darrera = `La vas retirar el ${dataLlegible(rgpd.al)}.`;

  return (
    <Bloc titol="Consentiment">
      {carregant ? <p className="perfil-compte__text" role="status">Comprovant el consentiment…</p> : null}
      {/* Amb el diàleg obert, el fons és inert: l'error es pinta dins del diàleg. */}
      {error && !confirmaRetirada ? <Alerta to="error">{error}</Alerta> : null}
      {!carregant && estat ? (
        <>
          <p className="perfil-compte__text">
            {versioVigent
              ? `Política de privacitat vigent: versió ${versioVigent}. `
              : 'Encara no hi ha cap política de privacitat publicada. '}
            <EnllacPolitica url={estat.url} />
          </p>
          <p className="perfil-compte__text">{darrera}</p>
          {estat.calReconsentir && versioVigent ? (
            <Alerta
              to="avis"
              titol="Cal el teu consentiment"
              accions={(
                <Boto varietat="primari" onClick={accepta} carregant={treballant}>
                  {`Acceptar la versió ${versioVigent}`}
                </Boto>
              )}
            >
              Sense acceptar la política vigent no apareixes al padró del poble.
            </Alerta>
          ) : null}
          {atorgat ? (
            <div className="sdp-alerta__accions perfil-compte__accions">
              <Boto varietat="secundari" onClick={() => setConfirmaRetirada(true)} disabled={treballant}>
                Retirar el consentiment
              </Boto>
            </div>
          ) : null}
        </>
      ) : null}
      <DialegConfirmacio
        obert={confirmaRetirada}
        onTanca={() => setConfirmaRetirada(false)}
        onConfirma={retira}
        titol="Retirar el consentiment"
        descripcio="Deixaràs d’aparéixer al padró del poble fins que el tornes a acceptar."
        etiquetaConfirma="Retirar-lo"
        destructiu
        carregant={treballant}
      >
        {error ? <Alerta to="error">{error}</Alerta> : null}
        <p className="perfil-compte__text">
          El compte no s’esborra: per a això, demana la baixa. El registre de quan l’has donat i
          retirat es conserva, perquè la llei ens obliga a poder demostrar-ho.
        </p>
      </DialegConfirmacio>
    </Bloc>
  );
}

/* ── «Donar-se de baixa» ───────────────────────────────────────────── */

function BlocBaixa({ config, onSessioTancada, onPerfilCanviat }) {
  const configRef = useConfigActual(config);
  const [baixa, setBaixa] = useState(null);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState('');
  const [avis, setAvis] = useState('');
  const [dialeg, setDialeg] = useState(false);
  const [motiu, setMotiu] = useState('');
  const [treballant, setTreballant] = useState(false);
  const sessio = useSessioOpcional();

  useEffect(() => {
    let viu = true;
    Promise.resolve()
      .then(() => estatBaixa(configRef.current))
      .then((resposta) => { if (viu) setBaixa(resposta || { demanada: false }); })
      .catch((e) => { if (viu) setError(missatgeDe(e, 'No s’ha pogut comprovar si tens una baixa pendent.')); })
      .finally(() => { if (viu) setCarregant(false); });
    return () => { viu = false; };
  }, [configRef]);

  const confirma = async () => {
    setTreballant(true);
    setError('');
    try {
      const text = motiu.trim();
      const baixa = () => demanaBaixa(text ? { motiu: text } : {}, configRef.current);
      /* T47 (correcció de la revisió, 260928) · La baixa tanca la sessió dins
         de l'adaptador: passa per la mateixa eixida que «Tancar sessió»
         (SessionContext): primer s'envia el pendent amb la sessió encara
         vàlida i, confirmada la baixa, els esborranys s'obliden d'este
         dispositiu. Amb la configuració del perfil: la dels esborranys. */
      if (sessio?.eixAmb) await sessio.eixAmb(baixa, configRef.current);
      else await baixa();
      /* El servidor ha amagat el perfil i el port ha tancat totes les
         sessions: res d'esta pantalla continua sent vàlid. */
      setDialeg(false);
      onSessioTancada?.();
    } catch (e) {
      setError(missatgeDe(e, 'No s’ha pogut demanar la baixa.'));
    } finally {
      setTreballant(false);
    }
  };

  const cancela = async () => {
    setTreballant(true);
    setError('');
    try {
      const resposta = await cancelaBaixa(configRef.current);
      setBaixa(resposta || { demanada: false, demanadaAl: null, purgaPrevistaAl: null });
      setAvis('Baixa cancel·lada. El teu perfil torna a ser com era.');
      onPerfilCanviat?.();
    } catch (e) {
      setError(missatgeDe(e, 'No s’ha pogut cancel·lar la baixa.'));
    } finally {
      setTreballant(false);
    }
  };

  return (
    <Bloc titol="Donar-se de baixa">
      {carregant ? <p className="perfil-compte__text" role="status">Comprovant l’estat del compte…</p> : null}
      {/* Amb el diàleg obert, el fons és inert: l'error es pinta dins del diàleg. */}
      {error && !dialeg ? <Alerta to="error">{error}</Alerta> : null}
      {avis ? <Alerta to="exit">{avis}</Alerta> : null}
      {!carregant && baixa?.demanada ? (
        <Alerta
          to="avis"
          titol="Tens una baixa pendent"
          accions={(
            <Boto varietat="primari" onClick={cancela} carregant={treballant}>Cancel·lar la baixa</Boto>
          )}
        >
          {`L’has demanada el ${dataLlegible(baixa.demanadaAl)}. El compte, les teues publicacions personals i els teus fitxers s’esborraran definitivament el ${dataLlegible(baixa.purgaPrevistaAl)}, llevat dels fitxers ${FITXERS_EN_US}. ${ESPERA_APPLE}`}
        </Alerta>
      ) : null}
      {!carregant && baixa && !baixa.demanada ? (
        <>
          {/* P2-08 (T7; auditoria Codex C-06, migració 2610241440 de T8) · Què
              passa de veres: durant els dies de gràcia amaguem el perfil (nom
              genèric i sense foto; cancela_baixa ho torna tot, per això no es
              diu que queda anònim); després s'esborra el que és personal, i el que
              es va publicar en nom d'una entitat es queda a l'entitat. */}
          <p className="perfil-compte__text">
            {`Si te’n vas, en el moment amaguem el teu perfil: deixa d’aparéixer al padró, hi posem un nom genèric en lloc del teu i li llevem la foto. Tens ${DIES_GRACIA} dies per a penedir-te’n. Passat eixe termini, s’esborren per sempre el compte, les teues publicacions personals i els teus fitxers, llevat dels ${FITXERS_EN_US}; el que vas publicar en nom d’una entitat es queda a l’entitat. ${ESPERA_APPLE}`}
          </p>
          <div className="sdp-alerta__accions perfil-compte__accions">
            <Boto varietat="perill" onClick={() => setDialeg(true)}>Donar-me de baixa</Boto>
          </div>
        </>
      ) : null}
      <DialegConfirmacio
        obert={dialeg}
        onTanca={() => { if (!treballant) setDialeg(false); }}
        onConfirma={confirma}
        titol="Donar-te de baixa"
        descripcio={`Tens ${DIES_GRACIA} dies de gràcia per a tornar arrere.`}
        etiquetaConfirma="Sí, donar-me de baixa"
        destructiu
        carregant={treballant}
      >
        {error ? <Alerta to="error">{error}</Alerta> : null}
        <ul className="perfil-compte__llista">
          {/* Correccions 261024 (revisió R3-03; Codex C-06) · S'amaga, no queda anònim: cancela_baixa ho torna tot. */}
          <li>Ara mateix amaguem el teu perfil: deixa d’aparéixer al padró, hi posem un nom genèric en lloc del teu i li llevem la foto, i les teues publicacions deixen de mostrar el teu nom i la teua foto.</li>
          {/* Fase D (261020, tasca 1) · Qui va entrar amb Apple o Google no té contrasenya: torna a entrar com sempre. */}
          <li>{`Durant ${DIES_GRACIA} dies pots cancel·lar-la: entra de nou com sempre (amb el correu, Apple o Google), torna a «Privacitat i dades» i prem «Cancel·lar la baixa».`}</li>
          {/* P2-08 (T7; T1, revocació d'Apple) · Qui va entrar amb Apple ho ha de saber abans de confirmar.
              Correccions 261024 (revisions R3-01, R1-02 i R3-04) · Només ho intentem: sense el permís custodiat
              (entrades d'abans de la custòdia) o si Apple falla, no es retira, i la purga espera fins a 7 dies més. */}
          <li>{`Si vas entrar amb Apple, en demanar la baixa intentem retirar el permís que vas donar a Sóc de Poble; si no ho aconseguim, el pots retirar tu a Configuració › el teu nom › Inici de sessió amb Apple, o a account.apple.com. Si quan passen els ${DIES_GRACIA} dies encara no l’hem pogut retirar, l’esborrat definitiu pot esperar fins a ${DIES_ESPERA_APPLE} dies més. Si l’hem retirat i tornes a entrar amb Apple per a cancel·lar la baixa, Apple et tornarà a demanar permís.`}</li>
          {/* Correccions 261024 (revisió R3-10) · Amb l'excepció dels fitxers que encara fa servir algú altre. */}
          <li>{`Passats els ${DIES_GRACIA} dies, s’esborren definitivament el compte, les teues publicacions personals i els teus fitxers, llevat dels ${FITXERS_EN_US}. El que vas publicar en nom d’una entitat es queda a l’entitat.`}</li>
          {/* Auditoria Codex C-06 · El que es guarda no es presenta com a anònim del tot.
              Correccions 261024 (revisió R3-10) · Com diu el §10 de la política: també les denúncies sobre tu. */}
          <li>Es guarden, ja sense el teu compte però no del tot anònimes, la prova del consentiment, que la llei ens obliga a conservar, i, per a l’historial de moderació, les denúncies que vas fer i les que altres persones han fet sobre tu o sobre el teu contingut, amb l’identificador intern que tenia el teu compte.</li>
          <li>Es tancarà la sessió en tots els teus dispositius.</li>
        </ul>
        <Camp etiqueta="Per què te’n vas? (opcional)" ajuda="Ens ajuda a millorar. Com a màxim 500 caràcters.">
          <AreaText files={3} maxLength={500} value={motiu} onChange={(e) => setMotiu(e.target.value)} />
        </Camp>
      </DialegConfirmacio>
    </Bloc>
  );
}

/* ── La vista ──────────────────────────────────────────────────────── */

/* Indirecció per a les proves: jsdom no deixa substituir location.reload. */
export const pagina = { recarrega: () => window.location.reload() };

function recarregaSenseSessio(navigate) {
  /* Recàrrega completa: cap context en memòria sobreviu a la sessió
     (mateix criteri que «Tancar sessió» de DetallAjust). */
  navigate('/xat', { replace: true });
  pagina.recarrega();
}

export function DetallPrivacitat({
  identitat, config = {}, onPerfilCanviat, onSessioTancada,
}) {
  const navigate = useNavigate();
  const tancaSessio = useCallback(
    () => (onSessioTancada ? onSessioTancada() : recarregaSenseSessio(navigate)),
    [onSessioTancada, navigate],
  );
  /* Fase D (261020, tasca 2; crítica 261020, 18) · Les persones i entitats
     bloquejades, amb «Desbloqueja»: la mateixa llista que el Control del
     xat, darrere del consentiment. Sense la moderació, el DOM de sempre. */
  const moderacio = useModeracio();
  const t = useTraductorOpcional();

  /* Els drets són de la persona: una organització no en té cap pàgina. */
  if (identitat?.mena !== 'persona') return null;

  const ambCompte = teCapacitat('compte');
  const ambConsentiment = teCapacitat('consentiment');
  const ambBloquejos = moderacio?.disponible === true;
  const dades = identitat.dades;

  return (
    <UniversalPage
      chrome="context"
      layout="contained"
      title="Privacitat i dades"
      lead="Els teus drets sobre el que guardem: una còpia de les dades, el consentiment i la baixa."
      /* T51 · la data real del compte de la persona (profiles). */
      {...dataDeFila(dades)}
      /* Ordre del Mestre (261007) · La barra taronja porta a la fitxa
         pública de la persona, per l'id de la seua fila (no 'jo'). */
      topBarData={{
        authorName: identitat.nom,
        authorAvatar: identitat.avatar || '',
        authorLocation: pobleDeFitxa(identitat),
        authorHref: rutaDePerfil('persona', dades?.id),
      }}
    >
      <div className="perfil-compte">
        {ambCompte ? <BlocDades config={config} /> : null}
        {ambConsentiment ? <BlocConsentiment config={config} /> : null}
        {ambBloquejos ? (
          <Bloc titol={tradueix(t, TEXTOS_MODERACIO.bloquejosTitol)}>
            <LlistaBloquejos moderacio={moderacio} ambTitol={false} />
          </Bloc>
        ) : null}
        {ambCompte ? (
          <BlocBaixa config={config} onSessioTancada={tancaSessio} onPerfilCanviat={onPerfilCanviat} />
        ) : null}
        {!ambCompte && !ambConsentiment && !ambBloquejos ? (
          <p className="perfil-compte__text">Este node encara no oferix cap d’estes opcions.</p>
        ) : null}
      </div>
    </UniversalPage>
  );
}

export default DetallPrivacitat;
