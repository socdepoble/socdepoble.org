/**
 * Intercanvi.jsx — GEDCOM, còpia JSON i l'avís.
 *
 *   MenuIntercanvi  (mig)    Exporta, Importa i Avís
 *   Exporta         (detall) GEDCOM 7.0, GEDCOM 5.5.1 o còpia JSON: «Prepara, no publica»
 *   Importa         (detall) un .ged o un .json (còpia o llavor privada), detectat pel contingut,
 *                   amb el límit de mida abans de llegir-lo. La càrrega d'un clic és a PanellArbres.
 *   AvisGenealogia  (detall) privacitat i què fa l'app; s'accepta la primera vegada
 *
 * «Prepara, no publica»: el fitxer es prepara en este dispositiu i es mostra
 * sencer per a revisar-lo abans de descarregar-lo. No es puja enlloc. Les
 * persones vives ixen anonimitzades llevat que la persona marque la casella.
 */
import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import {
  Accions, Alerta, AreaText, Boto, Camp, CampFitxer, DialegConfirmacio, GrupOpcions, Pila
} from '../../../components/PedraSeca/index.js';
import { useApp } from '../../plataforma/index.js';
import {
  TIPUS_GED, TIPUS_JSON, creaCopiaJson, descarregaText, escriuGedcom, llegeixFitxerArbre, lligTextFitxerArbre, nomFitxer
} from '../gedcom/index.js';
import { MIDA_MAXIMA_IMPORTACIO, useGenealogia } from '../nucli/index.js';
import { textCodiLectura, textError } from '../textos.js';
import { BotoCopia, CasellaVius, EnllacBoto, MarcGenealogia, useIdioma, useNavegaGenealogia, useT } from './comunes.jsx';

const FORMATS = Object.freeze(['ged7', 'ged551', 'json']);
const nouId = () => globalThis.crypto.randomUUID();

export function MenuIntercanvi() {
  const tx = useT();
  const { ruta } = useApp();
  const opcions = [
    { id: 'exporta', a: ruta('intercanvi') },
    { id: 'importa', a: ruta('intercanvi', 'importa') },
    { id: 'avis', a: ruta('avis') }
  ];
  return (
    <MarcGenealogia titol={tx('intercanvi.titol')} columna="mig">
      <Pila gap={6}>
        {opcions.map((opcio) => (
          <Pila key={opcio.id} gap={2}>
            <p>{tx(`intercanvi.${opcio.id}.sec`)}</p>
            <Accions><EnllacBoto a={opcio.a}>{tx(`intercanvi.${opcio.id}`)}</EnllacBoto></Accions>
          </Pila>
        ))}
      </Pila>
    </MarcGenealogia>
  );
}

export function Exporta() {
  const g = useGenealogia();
  const tx = useT();
  const idioma = useIdioma();
  const [format, setFormat] = useState('ged7');
  const [consentiment, setConsentiment] = useState(null);
  const incloureVius = Boolean(g.complet && consentiment === g.complet);
  const [previsualitzat, setPreparat] = useState(null);
  const preparat = previsualitzat?.origen === g.complet ? previsualitzat : null;
  const [missatge, setMissatge] = useState(null);
  if (!g.carregat) return null;
  const canviaFormat = (nou) => { setFormat(nou); setPreparat(null); setMissatge(null); };
  const canviaVius = (nou) => { setConsentiment(nou ? g.complet : null); setPreparat(null); setMissatge(null); };

  const prepara = () => {
    const ara = new Date().toISOString();
    try {
      if (format === 'json') {
        const { text, ocultes } = creaCopiaJson(g.complet, { incloureVius, anyActual: g.anyActual, ara });
        setPreparat({ origen: g.complet, text, ocultes, nom: nomFitxer('json', { ara }), tipus: TIPUS_JSON });
      } else {
        const { text, ocultes } = escriuGedcom(g.complet, {
          versio: format === 'ged551' ? '5.5.1' : '7.0', incloureVius, anyActual: g.anyActual, ara, etiquetaViva: tx('persona.viva')
        });
        setPreparat({ origen: g.complet, text, ocultes, nom: nomFitxer('ged', { ara }), tipus: TIPUS_GED });
      }
      setMissatge(null);
    } catch (error) {
      setPreparat(null);
      setMissatge({ to: 'error', text: textError(error, idioma) });
    }
  };
  const descarrega = async () => {
    if (!descarregaText(preparat.text, preparat.nom, preparat.tipus)) {
      setMissatge({ to: 'avis', text: tx('exporta.noDescarrega') });
      return;
    }
    setMissatge({ to: 'exit', text: tx('exporta.descarregat') });
    try {
      await g.marcaCopia();
    } catch {
      /* La còpia ja és a les mans de la persona: no saber-ne la data no és cap error seu. */
    }
  };

  return (
    <MarcGenealogia titol={tx('intercanvi.exporta')}>
      <Pila gap={4}>
        <Alerta to="info" viva={false} titol={tx('exporta.preparaNoPublica.titol')}>{tx('exporta.preparaNoPublica')}</Alerta>
        {g.complet ? (
          <>
            <GrupOpcions llegenda={tx('exporta.format')} valor={format} onCanvi={canviaFormat}
              opcions={FORMATS.map((valor) => ({ valor, etiqueta: tx(`format.${valor}`) }))} />
            <CasellaVius marcada={incloureVius} onCanvi={canviaVius} />
            <Accions><Boto varietat={preparat ? 'secundari' : 'primari'} onClick={prepara}>{tx('exporta.prepara')}</Boto></Accions>
          </>
        ) : <p>{tx('exporta.senseArbre')}</p>}
        {preparat ? (
          <>
            {preparat.ocultes > 0 && <>
              <p>{tx('exporta.ocultes', { n: preparat.ocultes })}</p>
              <p>{tx('exporta.ocultes.notes')}</p>
            </>}
            <Camp etiqueta={tx('exporta.revisa')}>
              <AreaText files={14} readOnly value={preparat.text} />
            </Camp>
            <Accions><Boto varietat="primari" icona={Download} onClick={descarrega}>{tx('exporta.descarrega')}</Boto></Accions>
            <BotoCopia text={preparat.text} />
          </>
        ) : null}
        {missatge ? <Alerta to={missatge.to}>{missatge.text}</Alerta> : null}
      </Pila>
    </MarcGenealogia>
  );
}

export function Importa() {
  const g = useGenealogia();
  const tx = useT();
  const idioma = useIdioma();
  const navega = useNavegaGenealogia();
  const [llegit, setLlegit] = useState(null);
  const [missatge, setMissatge] = useState(null);
  const [substituint, setSubstituint] = useState(null);
  const [desant, setDesant] = useState(false);
  const generacio = useRef(0);
  const desadaEnCurs = useRef(false);
  useEffect(() => () => { generacio.current += 1; }, []);
  if (!g.carregat) return null;

  const tria = async (event) => {
    if (desadaEnCurs.current) return;
    const token = ++generacio.current;
    const [fitxer] = event.target.files || [];
    setSubstituint(null);
    setLlegit(null);
    setMissatge(null);
    if (!fitxer) return;
    /* El límit es mira abans de llegir: un fitxer massa gran no entra mai a la memòria. */
    if (!(fitxer.size <= MIDA_MAXIMA_IMPORTACIO)) {
      setMissatge({ to: 'error', text: tx('importa.massaGran') });
      return;
    }
    try {
      const text = await lligTextFitxerArbre(fitxer);
      if (token !== generacio.current) return;
      /* El format es detecta pel contingut, no pel nom: un JSON (còpia o llavor privada) o un GEDCOM. */
      const resultat = llegeixFitxerArbre(text, { nouId, ara: new Date().toISOString(), anyActual: g.anyActual, titol: tx('panell.titolPerDefecte') });
      if (token !== generacio.current) return;
      const esJson = resultat.format !== 'gedcom';
      if (!resultat?.ok || !resultat.complet) {
        setMissatge({ to: 'error', text: tx('importa.noValid') });
        setLlegit(resultat?.errors?.length ? { ...resultat, complet: null, esJson } : null);
        return;
      }
      setLlegit({ ...resultat, generacio: token, versio: esJson ? 'JSON' : resultat.versio, esJson });
      setMissatge(null);
    } catch (error) {
      if (token !== generacio.current) return;
      setMissatge({ to: 'error', text: textError(error, idioma) });
    }
  };
  const importa = async (mode) => {
    if (desadaEnCurs.current || !llegit?.complet || llegit.generacio !== generacio.current) return;
    const token = generacio.current;
    const complet = llegit.complet;
    const esperat = mode === 'substituix' ? substituint : undefined;
    if (mode === 'substituix' && !esperat) return;
    desadaEnCurs.current = true;
    setDesant(true);
    setSubstituint(null);
    try {
      await g.importa(complet, { mode, esperat });
      if (token !== generacio.current) return;
      setLlegit(null);
      setMissatge({ to: 'exit', text: tx('importa.fet') });
      navega(['arbre']);
    } catch (error) {
      if (token !== generacio.current) return;
      setMissatge({ to: 'error', text: textError(error, idioma) });
    } finally {
      desadaEnCurs.current = false;
      if (token === generacio.current) setDesant(false);
    }
  };

  return (
    <MarcGenealogia titol={tx('intercanvi.importa')}>
      <Pila gap={4}>
        <p>{tx('importa.explica')}</p>
        <Camp etiqueta={tx('importa.fitxer')}>
          {/* Sense els noms a la línia d'estat: el nom del fitxer pot portar cognoms. */}
          <CampFitxer accept=".ged,.json" textBoto={tx('importa.tria')} nomsVisibles={false} onChange={tria} disabled={g.nomesLectura || desant} />
        </Camp>
        {llegit ? (
          <Pila gap={2}>
            {llegit.versio ? <p>{tx('importa.versio', { versio: llegit.versio })}</p> : null}
            {llegit.complet ? (
              <p>{tx('importa.recompte', { persones: llegit.complet.persones.length, relacions: llegit.complet.relacions.length })}</p>
            ) : null}
            {[...(llegit.errors || []), ...(llegit.avisos || [])].length ? (
              <Alerta to="avis" viva={false} titol={tx('importa.avisos')}>
                {/* Els codis del lector es traduïxen: mai es pinta la clau crua. */}
                {[...(llegit.errors || []), ...(llegit.avisos || [])].slice(0, 50).map((avis, i) => (
                  <p key={`${i}-${String(avis)}`}>{textCodiLectura(avis, idioma, { json: llegit.esJson === true })}</p>
                ))}
              </Alerta>
            ) : null}
            {llegit.complet ? (
              <Accions>
                <Boto varietat="primari" disabled={g.nomesLectura || desant} onClick={() => importa('nou')}>{tx('importa.desaNou')}</Boto>
                {g.complet ? (
                  <Boto varietat="perill" disabled={g.nomesLectura || desant} onClick={() => setSubstituint(g.complet)}>{tx('importa.substituix')}</Boto>
                ) : null}
              </Accions>
            ) : null}
          </Pila>
        ) : null}
        {missatge ? <Alerta to={missatge.to}>{missatge.text}</Alerta> : null}
      </Pila>
      <DialegConfirmacio obert={Boolean(substituint)} destructiu titol={tx('importa.substituix.titol')} etiquetaConfirma={tx('importa.substituix.confirma')}
        etiquetaCancela={tx('boto.cancela')} descripcio={tx('importa.substituix.text')} onTanca={() => setSubstituint(null)}
        onConfirma={() => importa('substituix')} />
    </MarcGenealogia>
  );
}

const APARTATS_AVIS = Object.freeze(['que', 'on', 'vius', 'noFa', 'estats']);

export function AvisGenealogia() {
  const g = useGenealogia();
  const tx = useT();
  const idioma = useIdioma();
  const navega = useNavegaGenealogia();
  const [error, setError] = useState(null);
  if (!g.carregat) return null;
  const accepta = () => g.acceptaAvis().then(() => navega(['entrevista'], { replace: true }), (e) => setError(textError(e, idioma)));
  return (
    <MarcGenealogia titol={tx('avis.titol')}>
      <Pila gap={6}>
        {APARTATS_AVIS.map((apartat) => (
          <Pila key={apartat} gap={2}>
            <p><strong>{tx(`avis.${apartat}.titol`)}</strong></p>
            <p>{tx(`avis.${apartat}`)}</p>
          </Pila>
        ))}
        {error ? <Alerta to="error">{error}</Alerta> : null}
        {g.avisAcceptat ? <p>{tx('avis.acceptat')}</p> : (
          <Accions><Boto varietat="primari" mida="gran" disabled={g.nomesLectura} onClick={accepta}>{tx('boto.entesos')}</Boto></Accions>
        )}
      </Pila>
    </MarcGenealogia>
  );
}
