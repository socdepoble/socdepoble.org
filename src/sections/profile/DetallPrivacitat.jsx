import { useCallback, useEffect, useRef, useState } from 'react';
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
const TIPUS_RGPD = 'rgpd_acepta';

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

function BlocDades({ config }) {
  const configRef = useConfigActual(config);
  const [estat, setEstat] = useState({ fase: 'repos' });

  const descarrega = async () => {
    setEstat({ fase: 'treballant' });
    try {
      const dades = await exportaLesMeuesDades(configRef.current);
      const nom = nomFitxerExportacio();
      descarregaJson(dades, nom);
      setEstat({ fase: 'fet', nom });
    } catch (e) {
      setEstat({ fase: 'error', text: missatgeDe(e, 'No s’han pogut preparar les teues dades. Torna-ho a provar.') });
    }
  };

  return (
    <Bloc titol="Les meues dades">
      <p className="perfil-compte__text">
        Descarrega una còpia de tot el que Sóc de Poble guarda del teu compte: perfil, organitzacions,
        publicacions, notes, converses i consentiments. És un fitxer JSON que pots obrir amb qualsevol editor de text.
      </p>
      {estat.fase === 'error' ? <Alerta to="error">{estat.text}</Alerta> : null}
      {estat.fase === 'fet' ? <Alerta to="exit">{`Ja tens el fitxer ${estat.nom} a les descàrregues.`}</Alerta> : null}
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
      /* El servidor ha anonimitzat el perfil i el port ha tancat totes les
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
          {`L’has demanada el ${dataLlegible(baixa.demanadaAl)}. El compte i les dades s’esborraran definitivament el ${dataLlegible(baixa.purgaPrevistaAl)}.`}
        </Alerta>
      ) : null}
      {!carregant && baixa && !baixa.demanada ? (
        <>
          <p className="perfil-compte__text">
            {`Si te’n vas, el perfil s’anonimitza en el moment i tens ${DIES_GRACIA} dies per a penedir-te’n. Passat eixe termini, el compte i les dades s’esborren per sempre.`}
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
          <li>Ara mateix el perfil s’anonimitza: el teu nom es canvia per un d’anònim, la fitxa deixa de ser pública i les teues publicacions deixen de mostrar el teu nom i la teua foto.</li>
          {/* Fase D (261020, tasca 1) · Qui va entrar amb Apple o Google no té contrasenya: torna a entrar com sempre. */}
          <li>{`Durant ${DIES_GRACIA} dies pots cancel·lar-la: entra de nou com sempre (amb el correu, Apple o Google), torna a «Privacitat i dades» i prem «Cancel·lar la baixa».`}</li>
          <li>{`Passats els ${DIES_GRACIA} dies, el compte i totes les dades s’esborren definitivament.`}</li>
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
