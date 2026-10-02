/**
 * EnviamentGestoria.jsx — prepara el correu que porta el full trimestral a
 * la gestoria. És la tercera aprovació humana (després d'aprovar el tractor
 * i la proposta del full): el sistema prepara l'esborrany i la persona prem
 * «Envia» al seu correu. Mai s'envia sol.
 *
 * Res es guarda: els camps viuen en memòria i s'obliden en tancar la vista.
 * Cap crida de xarxa del mòdul: «Obri la redacció de Gmail» obri una pestanya
 * nova amb una adreça que només porta el destinatari, l'assumpte i el text
 * (ni l'adjunt ni cap dada del full: Gmail no admet adjunts per l'adreça).
 * La resta són descàrregues fetes ací mateix (Blob) i el menú de compartir
 * del sistema, que obri l'aplicació que tria la persona.
 *
 * Bucle adversarial (auditoria Codex 261002_0148, punt 11) · LA REVISIÓ VAL
 * PER ALS BYTES QUE IXEN. Marcar la casella captura una còpia dels adjunts i
 * en calcula l'empremta SHA-256 (revisioAdjunts.js). Fins que l'empremta no
 * hi és, no ix res; sense crypto.subtle la casella no es pot marcar i es diu
 * per què. Les tres eixides usen només la còpia revisada, i abans comproven
 * que els adjunts d'ara són els mateixos: si el full ha canviat (encara que
 * siga el mateix array mutat) o s'ha canviat el destinatari (T4), la revisió
 * es desmarca i es diu.
 * Proves: `obri`, `descarrega`, `navegador` i `subtle` són injectables.
 *
 * `nivellTitol` (2 per defecte, de 2 a 5): el nivell del títol, perquè
 * l'esquema de títols seguisca on es munta. Dins d'un pas del panell (un h2),
 * 3; «Vista prèvia» va sempre un nivell per davall.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { AreaText, Camp, CampText, Casella } from '../../../components/PedraSeca/organismes/formulari.jsx';
import {
  PLANTILLA_CORREU_PER_DEFECTE, TIPUS_EML, adrecaValida, construeixEml, fitxersPerCompartir,
  nomEsborrany, ompliPlantilla, potCompartirFitxers, urlRedaccioGmail, valorsCorreu
} from './correuGestoria.js';
import { copiaAdjunts, empremtaAdjunts, mateixosAdjunts, potCalcularEmpremta } from './revisioAdjunts.js';

const ORDRE_CAMPS = ['per', 'nom', 'assumpte', 'revisat'];
const formatKb = new Intl.NumberFormat('ca-ES', { maximumFractionDigits: 1 });

const REVISIO = Object.freeze({
  falta: 'Marca la casella quan hages revisat el full i l\'adjunt.',
  calculant: 'Encara s’està calculant l’empremta del full revisat: torna-ho a provar en un moment.',
  canviat: 'El full ha canviat des que l’has revisat: revisa’l de nou i torna a marcar la casella.',
  destinatari: 'Has canviat el destinatari des que has revisat el correu: torna a marcar la casella.',
  error: 'No s’ha pogut calcular l’empremta del full revisat: torna a marcar la casella.',
  senseEmpremta: 'Este navegador no pot calcular l’empremta SHA-256 del full: cal obrir esta pàgina amb una connexió segura (https). Sense empremta, la revisió no es pot lligar al full que s’envia.'
});

/* L'empremta en huit grups de huit: es llig i no desborda la columna. */
const empremtaLlegible = (hex) => hex.match(/.{1,8}/g).join(' ');

/* noreferrer: Gmail no ha de saber des de quina pàgina s'obri. */
const obriPerDefecte = (url) => window.open(url, '_blank', 'noopener,noreferrer');

/* Descàrrega amb Blob i un enllaç temporal, com a DetallPrivacitat.jsx: res
   passa per cap servidor i l'enllaç no es penja del document. */
function descarregaPerDefecte({ nom, tipus, dades }) {
  const url = URL.createObjectURL(new Blob([dades], { type: tipus || 'application/octet-stream' }));
  const enllac = document.createElement('a');
  enllac.href = url;
  enllac.download = nom;
  enllac.rel = 'noopener';
  enllac.click();
  // Safari necessita que la URL visca un moment després del clic.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const bytesDe = (dades) => (ArrayBuffer.isView(dades) ? new Uint8Array(dades.buffer, dades.byteOffset, dades.byteLength) : null);

function midaLlegible(dades) {
  const n = bytesDe(dades)?.length ?? 0;
  return n < 1024 ? `${n} bytes` : `${formatKb.format(n / 1024)} kB`;
}

/* La fase de la revisió ara mateix: 'cap', 'calculant', 'llesta', o per què
   ja no val ('canviat': els bytes, el nom o el tipus; 'destinatari'). */
function faseDeLaRevisio(revisio, adjunts, per) {
  if (!revisio) return 'cap';
  if (!mateixosAdjunts(adjunts, revisio.copia)) return 'canviat';
  if (revisio.per !== per.trim()) return 'destinatari';
  return revisio.empremta ? 'llesta' : 'calculant';
}

function derivaCorreu(plantilla, valors) {
  try {
    const periode = valorsCorreu(valors);
    return {
      periode,
      assumpte: ompliPlantilla(plantilla?.assumpte, periode),
      cos: ompliPlantilla(plantilla?.cos, periode),
      error: null
    };
  } catch (error) {
    return { periode: null, assumpte: null, cos: null, error: error?.message ?? String(error) };
  }
}

/* Un nivell de títol vàlid per a este bloc i el seu subtítol (fins a h6); si no ho és, 2. */
const nivellDe = (nivell) => (Number.isInteger(nivell) && nivell >= 2 && nivell <= 5 ? nivell : 2);

/* Una còpia dels errors sense el del camp que ja s'ha tocat. */
function senseError(errors, camp) {
  if (!(camp in errors)) return errors;
  const copia = { ...errors };
  delete copia[camp];
  return copia;
}

export default function EnviamentGestoria({
  any, t, adjunts, plantilla = PLANTILLA_CORREU_PER_DEFECTE,
  obri = obriPerDefecte, descarrega = descarregaPerDefecte, navegador = globalThis.navigator,
  subtle = globalThis.crypto?.subtle, inicials = {}, compteGmail = null, nivellTitol = 2
}) {
  const nivell = nivellDe(nivellTitol);
  const Titol = `h${nivell}`;
  const Subtitol = `h${nivell + 1}`;
  const [per, setPer] = useState(inicials.per ?? '');
  const [nom, setNom] = useState(inicials.nom ?? '');
  const [persona, setPersona] = useState(inicials.persona ?? '');
  const [assumpteEditat, setAssumpteEditat] = useState(null);
  const [cosEditat, setCosEditat] = useState(null);
  /* { copia, per, empremta }: la còpia dels adjunts revisats, el destinatari
     d'aquell moment i l'empremta SHA-256 (null mentre es calcula). */
  const [revisio, setRevisio] = useState(null);
  const [errors, setErrors] = useState({});
  const [resultat, setResultat] = useState(null);
  const [compartint, setCompartint] = useState(false);
  const [aEnfocar, setAEnfocar] = useState(null);
  const formulari = useRef(null);
  const revisioViva = useRef(0);
  const id = useId();

  const llistaAdjunts = useMemo(() => (Array.isArray(adjunts) ? adjunts : []), [adjunts]);
  const potEmpremta = potCalcularEmpremta(subtle);
  const potCompartir = useMemo(() => {
    try {
      return potCompartirFitxers(navegador, fitxersPerCompartir(llistaAdjunts));
    } catch {
      return false;
    }
  }, [navegador, llistaAdjunts]);

  useEffect(() => {
    if (aEnfocar) formulari.current?.elements.namedItem(aEnfocar.camp)?.focus();
  }, [aEnfocar]);

  /* Es mira a cada pintada, byte a byte: un array mutat sense canviar
     d'identitat també es veu (mateixosAdjunts no memoritza res). */
  const fase = faseDeLaRevisio(revisio, llistaAdjunts, per);

  /* La revisió ja no val: es desmarca, el resultat d'abans se'n va i la casella diu per què. */
  const invalida = useCallback((motiu) => {
    revisioViva.current += 1;
    setRevisio(null);
    setResultat(null);
    setErrors((previs) => ({ ...previs, revisat: REVISIO[motiu] }));
  }, []);

  useEffect(() => {
    if (fase === 'canviat' || fase === 'destinatari') invalida(fase);
  }, [fase, invalida]);

  /* Marcar captura la còpia i n'inicia l'empremta; desmarcar la deixa anar. */
  function marca(marcar) {
    revisioViva.current += 1;
    const viva = revisioViva.current;
    setResultat(null);
    setErrors((previs) => senseError(previs, 'revisat'));
    if (!marcar || !potEmpremta) {
      setRevisio(null);
      return;
    }
    const copia = copiaAdjunts(llistaAdjunts);
    setRevisio({ copia, per: per.trim(), empremta: null });
    empremtaAdjunts(copia, subtle).then((empremta) => {
      if (revisioViva.current === viva) setRevisio((ara) => (ara && ara.copia === copia ? { ...ara, empremta } : ara));
    }).catch(() => {
      if (revisioViva.current === viva) invalida('error');
    });
  }

  const derivat = derivaCorreu(plantilla, { nom, persona, any, t });
  const assumpte = assumpteEditat ?? derivat.assumpte?.text ?? '';
  const cos = cosEditat ?? derivat.cos?.text ?? '';
  const avisos = [
    ...(assumpteEditat === null ? derivat.assumpte?.avisos ?? [] : []),
    ...(cosEditat === null ? derivat.cos?.avisos ?? [] : [])
  ].filter((avis, i, tots) => tots.findIndex((a) => a.marcador === avis.marcador) === i);
  const nomCal = assumpteEditat === null && typeof plantilla?.assumpte === 'string' && plantilla.assumpte.includes('{nom}');
  // La casella es veu marcada mentre la revisió val per als adjunts i el destinatari d'ara.
  const marcada = fase === 'calculant' || fase === 'llesta';
  let ajudaRevisio = null;
  if (!potEmpremta) ajudaRevisio = REVISIO.senseEmpremta;
  else if (fase === 'calculant') ajudaRevisio = 'Calculant l’empremta SHA-256 del full revisat…';
  else if (fase === 'llesta') ajudaRevisio = `Empremta SHA-256 del que has revisat: ${empremtaLlegible(revisio.empremta)}`;

  /* Qualsevol canvi invalida el resultat anterior (l'enllaç de Gmail ja no valdria). */
  const canvia = (camp, desa) => (event) => {
    desa(event.target.value);
    setResultat(null);
    setErrors((previs) => senseError(previs, camp));
  };

  /* Per què la revisió no deixa actuar ara mateix (null si la deixa). */
  function motiuDeLaRevisio(faseAra) {
    if (faseAra === 'llesta') return null;
    if (!potEmpremta) return 'Sense empremta SHA-256, en este navegador no es pot donar el full per revisat.';
    if (faseAra === 'cap') return errors.revisat ?? REVISIO.falta;
    return REVISIO[faseAra];
  }

  function valida(accio, faseAra) {
    const nous = {};
    if (accio !== 'comparteix') {
      if (!per.trim()) nous.per = 'Escriu l\'adreça de correu de la gestoria.';
      else if (!adrecaValida(per)) nous.per = 'Esta adreça no sembla vàlida: ha de ser com nom@example.org, sense espais ni comes.';
    }
    if (nomCal && !nom.trim()) nous.nom = 'Escriu el nom que va a l\'assumpte, o escriu l\'assumpte a mà.';
    if (!assumpte.trim()) nous.assumpte = 'L\'assumpte no pot quedar buit.';
    const motiu = motiuDeLaRevisio(faseAra);
    if (motiu) nous.revisat = motiu;
    if (derivat.error) nous.general = derivat.error;
    else if (!llistaAdjunts.length) nous.general = 'No hi ha cap full per adjuntar: genera\'l i aprova\'l abans.';
    return nous;
  }

  /* Al moment d'actuar la revisió es torna a mirar, byte a byte: el full
     s'ha pogut mutar sense cap pintada pel mig. */
  function prepara(accio) {
    const faseAra = faseDeLaRevisio(revisio, llistaAdjunts, per);
    if (faseAra === 'canviat' || faseAra === 'destinatari') invalida(faseAra);
    const nous = valida(accio, faseAra);
    setErrors(nous);
    setResultat(null);
    const primer = ORDRE_CAMPS.find((camp) => nous[camp]);
    if (primer) setAEnfocar({ camp: primer });
    return Object.keys(nous).length === 0;
  }

  const falla = (error) => setResultat({ tipus: 'error', missatge: error?.message ?? String(error) });

  /* Totes les eixides porten la còpia revisada, mai els adjunts d'ara; qui la
     rep (la descàrrega) en rep una altra còpia: la revisada no la toca ningú. */
  function obriGmail() {
    if (!prepara('gmail')) return;
    try {
      const url = urlRedaccioGmail({ per, assumpte, cos, compte: compteGmail });
      const revisats = copiaAdjunts(revisio.copia);
      // Primer la pestanya, dins del mateix gest de la persona; després l'adjunt.
      obri(url);
      for (const adjunt of revisats) descarrega(adjunt);
      setResultat({ tipus: 'gmail', url, noms: revisats.map((a) => a.nom) });
    } catch (error) {
      falla(error);
    }
  }

  function descarregaEml() {
    if (!prepara('eml')) return;
    try {
      const eml = construeixEml({ per, assumpte, cos, adjunts: revisio.copia });
      const nomFitxer = nomEsborrany({ any, t });
      descarrega({ nom: nomFitxer, tipus: TIPUS_EML, dades: new TextEncoder().encode(eml) });
      setResultat({ tipus: 'eml', nom: nomFitxer });
    } catch (error) {
      falla(error);
    }
  }

  async function comparteix() {
    if (!prepara('comparteix')) return;
    let fitxers;
    try {
      fitxers = fitxersPerCompartir(revisio.copia);
    } catch (error) {
      falla(error);
      return;
    }
    setCompartint(true);
    try {
      await navegador.share({ files: fitxers, title: assumpte, text: cos });
      setResultat({ tipus: 'compartit' });
    } catch (error) {
      if (error?.name === 'AbortError') setResultat({ tipus: 'cancelat' });
      else falla(error);
    } finally {
      setCompartint(false);
    }
  }

  function restaura() {
    setAssumpteEditat(null);
    setCosEditat(null);
    setResultat(null);
    setErrors((previs) => senseError(previs, 'assumpte'));
  }

  const idTitol = `${id}-titol`;
  const idVista = `${id}-vista`;
  const idErrorRevisat = `${id}-revisat-error`;
  const idAjudaRevisat = `${id}-revisat-ajuda`;
  const descripcioRevisat = [errors.revisat ? idErrorRevisat : null, ajudaRevisio ? idAjudaRevisat : null].filter(Boolean).join(' ');
  const idAjudaGmail = `${id}-ajuda-gmail`;
  const idAjudaEml = `${id}-ajuda-eml`;
  const idAjudaComparteix = `${id}-ajuda-comparteix`;
  const trimestre = derivat.periode ? `${derivat.periode.n}T de ${derivat.periode.any}` : null;

  return (
    <section className="sdp-gestoria-enviament" aria-labelledby={idTitol}>
      <Titol id={idTitol}>Prepara el correu per a la gestoria</Titol>
      <p>
        {trimestre ? `Full del ${trimestre}. ` : ''}
        Ací només es prepara l&apos;esborrany: l&apos;envies tu des del teu correu, després de revisar-lo.
        Res d&apos;açò es guarda; quan tanques esta vista, s&apos;oblida.
      </p>
      <Alerta to="info" viva={false}>
        Este pas és la tercera aprovació: ningú ni res envia el correu per tu. Gmail rep només el destinatari,
        l&apos;assumpte i el text; el full no ix d&apos;este ordinador fins que tu l&apos;adjuntes o el comparteixes.
      </Alerta>
      {derivat.error ? <Alerta to="error">{derivat.error}</Alerta> : null}
      {!llistaAdjunts.length ? (
        <Alerta to="avis" viva={false}>Encara no hi ha cap full per adjuntar.</Alerta>
      ) : null}

      <form ref={formulari} className="sdp-gestoria-enviament__formulari" noValidate onSubmit={(event) => event.preventDefault()}>
        <Camp etiqueta="Destinatari" ajuda="L'adreça de correu de la gestoria." error={errors.per} obligatori>
          <CampText tipus="email" name="per" value={per} onChange={canvia('per', setPer)}
            autoComplete="off" inputMode="email" spellCheck={false} />
        </Camp>
        <Camp etiqueta="Nom per a l'assumpte" ajuda="Com et coneix la gestoria: el teu nom o el de l'empresa."
          error={errors.nom} obligatori={nomCal}>
          <CampText name="nom" value={nom} onChange={canvia('nom', setNom)} autoComplete="off" />
        </Camp>
        <Camp etiqueta="Persona de la gestoria (opcional)" ajuda="El nom per a la salutació. Si el deixes buit, el correu diu només «Hola».">
          <CampText name="persona" value={persona} onChange={canvia('persona', setPersona)} autoComplete="off" />
        </Camp>
        <Camp etiqueta="Assumpte" error={errors.assumpte}>
          <CampText name="assumpte" value={assumpte} onChange={canvia('assumpte', setAssumpteEditat)} autoComplete="off" />
        </Camp>
        <Camp etiqueta="Text del correu">
          <AreaText name="cos" files={5} value={cos} onChange={canvia('cos', setCosEditat)} />
        </Camp>
        {assumpteEditat !== null || cosEditat !== null ? (
          <Boto varietat="fantasma" onClick={restaura}>Torna a la plantilla</Boto>
        ) : null}
        {avisos.length ? (
          <Alerta to="avis" titol="La plantilla té marcadors sense valor">
            <ul>
              {avisos.map((avis) => <li key={avis.marcador}>{avis.missatge}</li>)}
            </ul>
          </Alerta>
        ) : null}

        <section className="sdp-gestoria-enviament__vista" aria-labelledby={idVista}>
          <Subtitol id={idVista}>Vista prèvia</Subtitol>
          <dl className="sdp-gestoria-enviament__dades">
            <dt>Per a</dt>
            <dd>{per.trim() || 'Encara no hi ha destinatari.'}</dd>
            <dt>Assumpte</dt>
            <dd>{assumpte.trim() || 'Sense assumpte.'}</dd>
            <dt>Adjunts</dt>
            <dd>
              {llistaAdjunts.length ? (
                <ul className="sdp-gestoria-enviament__adjunts">
                  {llistaAdjunts.map((adjunt, i) => (
                    <li key={`${i}-${adjunt?.nom}`}>{adjunt?.nom} ({midaLlegible(adjunt?.dades)})</li>
                  ))}
                </ul>
              ) : 'Cap.'}
            </dd>
          </dl>
          <p className="sdp-gestoria-enviament__cos">{cos}</p>
        </section>

        <Casella name="revisat" etiqueta="He revisat el full i l'adjunt abans d'enviar-lo"
          checked={marcada} required disabled={!potEmpremta}
          onChange={(event) => marca(event.target.checked)}
          aria-invalid={errors.revisat ? 'true' : undefined}
          aria-describedby={descripcioRevisat || undefined} />
        {errors.revisat ? (
          <p id={idErrorRevisat} className="sdp-camp__error">
            <CircleAlert size={18} aria-hidden="true" focusable="false" />
            <span>{errors.revisat}</span>
          </p>
        ) : null}
        {ajudaRevisio ? <p id={idAjudaRevisat} className="sdp-gestoria-enviament__ajuda">{ajudaRevisio}</p> : null}

        {errors.general ? <Alerta to="error">{errors.general}</Alerta> : null}

        <ul className="sdp-gestoria-enviament__accions">
          <li className="sdp-gestoria-enviament__opcio">
            <Boto varietat="primari" onClick={obriGmail} aria-describedby={idAjudaGmail}>Obri la redacció de Gmail</Boto>
            <p id={idAjudaGmail} className="sdp-gestoria-enviament__ajuda">
              Obri Gmail en una pestanya nova amb el destinatari, l&apos;assumpte i el text. Gmail no admet adjunts
              per l&apos;adreça: el full es descarrega alhora i l&apos;has d&apos;arrossegar a la finestra del correu.
            </p>
          </li>
          <li className="sdp-gestoria-enviament__opcio">
            <Boto varietat="secundari" onClick={descarregaEml} aria-describedby={idAjudaEml}>Descarrega l&apos;esborrany (.eml)</Boto>
            <p id={idAjudaEml} className="sdp-gestoria-enviament__ajuda">
              Un esborrany amb el full ja adjunt, per a obrir-lo amb Mail, Outlook o Thunderbird.
            </p>
          </li>
          {potCompartir ? (
            <li className="sdp-gestoria-enviament__opcio">
              <Boto varietat="secundari" onClick={comparteix} carregant={compartint} aria-describedby={idAjudaComparteix}>
                Comparteix…
              </Boto>
              <p id={idAjudaComparteix} className="sdp-gestoria-enviament__ajuda">
                El menú de compartir del sistema, amb el full adjunt. El destinatari el tries a l&apos;aplicació.
              </p>
            </li>
          ) : null}
        </ul>
      </form>

      {resultat?.tipus === 'gmail' ? (
        <Alerta to="avis" titol="Falta adjuntar el full">
          <p>
            S&apos;ha obert la redacció de Gmail en una pestanya nova i s&apos;ha descarregat {resultat.noms.map((n) => `«${n}»`).join(', ')}.
            Gmail no admet adjunts per l&apos;adreça: arrossega el fitxer descarregat a la finestra del correu,
            revisa-ho tot i prem «Envia» tu.
          </p>
          <p>
            Si no s&apos;ha obert cap pestanya,{' '}
            <a href={resultat.url} target="_blank" rel="noopener noreferrer">obri la redacció de Gmail ací</a>.
          </p>
        </Alerta>
      ) : null}
      {resultat?.tipus === 'eml' ? (
        <Alerta to="exit" titol="Esborrany descarregat">
          S&apos;ha descarregat «{resultat.nom}», amb el full adjunt. Obri&apos;l amb el teu programa de correu,
          revisa&apos;l i prem «Envia» tu. Si s&apos;obri com un missatge rebut, tria «Torna a enviar» o «Edita com a nou».
        </Alerta>
      ) : null}
      {resultat?.tipus === 'compartit' ? (
        <Alerta to="exit" titol="Full compartit">
          Acaba a l&apos;aplicació que has triat: posa el destinatari, revisa-ho i prem «Envia» tu.
        </Alerta>
      ) : null}
      {resultat?.tipus === 'cancelat' ? (
        <Alerta to="info">Has tancat el menú de compartir. No s&apos;ha enviat res.</Alerta>
      ) : null}
      {resultat?.tipus === 'error' ? (
        <Alerta to="error" titol="No s'ha pogut preparar el correu">{resultat.missatge}</Alerta>
      ) : null}
    </section>
  );
}
