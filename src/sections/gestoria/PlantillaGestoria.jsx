/**
 * PlantillaGestoria.jsx — la secció «Plantilla Gestoria» del Quadre de
 * comandament del Tauler: el full trimestral ja generat, tal com el rebrà la
 * gestoria, per a descarregar-lo o preparar-ne el correu.
 *
 * Ordre del Mestre, 14-10-2026 (prompt 261014_2015, punt 3): l'última secció
 * del Quadre de comandament és «Plantilla Gestoria». La gestoria rebutja
 * qualsevol altre format que no siga PLANTILLA_GESTORIA en .xlsx
 * (nucli/plantilla.js: el fitxer canònic «{any}-FACTURACIO-{slug}_-_{n}T.xlsx»,
 * amb la fulla «{n}T»): ací es veu el full exacte i se'n descarreguen els bytes
 * exactes en un clic, o se'n prepara el correu.
 *
 * NO GENERA NI APROVA RES. Mostra els entregables que el Full trimestral
 * (PanellGestoria.jsx) ha fet després de la segona aprovació (aprovaProposta i
 * genera de useGestoria.js, amb l'aprovació vigent del tractor de factures) i
 * que li arriben pel cable onFactures: el full maquetat (entregables.full) i
 * l'XLSX (entregables.xlsx), els bytes que resumix entregables.empremtes.xlsx.
 * Ni maqueta el full ni en recalcula el nom: el nom és l'entregables.xlsx.nom
 * canònic (nomsFitxers). Qualsevol canvi de la proposta anul·la els entregables
 * (SENSE_APROVACIO) i el cable els torna null: ací torna l'estat buit, que porta
 * al Full trimestral (onObreFull). Per això este fitxer és font del tractor de
 * factures (TRACTOR_FACTURES) i no del Tauler, que declara que no escriu res.
 * La tercera aprovació, la del correu, és la d'EnviamentGestoria, intacta:
 * l'enviament el fa sempre la persona.
 *
 * Privacitat (ordre del Mestre, 261004): amb l'ull de la boina tancat
 * (`visible` fals) cap cel·la del full arriba al DOM, ni imports, ni noms, ni
 * NIF. Descarregar l'XLSX i preparar el correu es poden fer amb l'ull tancat.
 * Sense encapçalament propi: el títol de la secció («Plantilla Gestoria», h3)
 * el posa CabinaAvio, i el del correu va un nivell per davall (h4). Cap títol
 * porta dades.
 *
 * Props: { full: el cable del Full trimestral ({ any, t, titular, entregables,
 * factures, historial }) o null, visible, descarrega (per a les proves; per
 * defecte, la de PanellGestoria.jsx), onObreFull?: () => void }.
 */
import { useId, useMemo, useState } from 'react';
import { EyeOff, FileSearch } from 'lucide-react';
import { Boto } from '../../components/PedraSeca/atoms/Boto.jsx';
import { EstatBuit } from '../../components/PedraSeca/atoms/estats.jsx';
import EnviamentGestoria from './enviament/EnviamentGestoria.jsx';
import { descarregaPerDefecte } from './PanellGestoria.jsx';
import VistaPreviaFull from './VistaPreviaFull.jsx';

export function PlantillaGestoria({ full = null, visible = false, descarrega = descarregaPerDefecte, onObreFull }) {
  const entregables = full?.entregables ?? null;
  const [anunci, setAnunci] = useState('');
  const [correuObert, setCorreuObert] = useState(false);
  /* Uns entregables nous (o cap) tanquen el correu i esborren l'anunci: parlaven d'un altre full. */
  const [vistos, setVistos] = useState(entregables);
  if (vistos !== entregables) {
    setVistos(entregables);
    setAnunci('');
    setCorreuObert(false);
  }
  const idCorreu = useId();
  const adjunts = useMemo(() => (entregables ? [entregables.xlsx] : []), [entregables]);

  if (!entregables) {
    return (
      <EstatBuit icona={FileSearch} titol="Encara no hi ha cap full generat"
        accio={typeof onObreFull === 'function'
          ? <Boto varietat="primari" onClick={() => onObreFull()}>Obri el Full trimestral</Boto> : null}>
        Al Full trimestral, analitza el trimestre, revisa la proposta i prem «Genera el full»: ací el veuràs tal com
        el rebrà la gestoria, i el podràs descarregar o preparar-ne el correu.
      </EstatBuit>
    );
  }

  const { nom } = entregables.xlsx;

  /* Els bytes exactes de la segona aprovació: cada lectura de `dades` en dona una còpia (nucli/entregables.js). */
  function descarregaXlsx() {
    try {
      descarrega({ nom, tipus: entregables.xlsx.tipus, dades: entregables.xlsx.dades });
      setAnunci(`S’ha descarregat «${nom}».`);
    } catch {
      setAnunci(`No s’ha pogut descarregar «${nom}»: este navegador no deixa descarregar fitxers generats.`);
    }
  }

  return (
    <>
      <p role="status" className="sdp-nomes-lector">{anunci}</p>
      <p className="sdp-gestoria-cabina__nota">{`El full generat del ${full.t}T de ${full.any}: és el que es descarrega i s’adjunta.`}</p>
      {visible ? (
        <VistaPreviaFull full={entregables.full} titol="Taula · Plantilla Gestoria" />
      ) : (
        <EstatBuit icona={EyeOff} titol="Full amagat">
          Prem l’ull de la boina per a veure’l: el full porta imports, noms i NIF.
        </EstatBuit>
      )}
      <div className="sdp-gestoria-panell__accions">
        <code>{nom}</code>
        <Boto varietat="primari" onClick={descarregaXlsx}>Descarrega l’XLSX</Boto>
        <Boto varietat="secundari" aria-expanded={correuObert} aria-controls={correuObert ? idCorreu : undefined}
          onClick={() => setCorreuObert((obert) => !obert)}>
          Prepara el correu per a la gestoria
        </Boto>
      </div>
      {correuObert ? (
        <div id={idCorreu}>
          <EnviamentGestoria key={entregables.empremtes.xlsx} any={full.any} t={full.t} adjunts={adjunts}
            inicials={{ nom: full.titular ?? '' }} nivellTitol={4} descarrega={descarrega} />
        </div>
      ) : null}
    </>
  );
}
