/**
 * DialegExportacio.jsx — el full per al metge se'n va del dispositiu ACÍ, i
 * només ací, i sempre per mà de la persona:
 *   · diu exactament què inclou (fulles i columnes);
 *   · un nom per a la capçalera del full, opcional: s'escriu en el moment i
 *     NO es desa enlloc (ni al dispositiu ni al nom del fitxer). Sense nom, la
 *     capçalera diu «la persona»: l'àlies desat no ix del dispositiu;
 *   · XLSX (totes les fulles) o CSV (només el diari);
 *   · descarregar, o compartir amb el menú del sistema (Web Share) si el
 *     sistema ho admet. És l'únic fitxer de Salut que pot compartir.
 */
import { useMemo, useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import {
  Alerta, Boto, Camp, CampText, Casella, Dialeg, GrupOpcions, Pila
} from '../../../components/PedraSeca/index.js';
import { FULLA_CSV, exporta } from '../nucli/exportacio.js';
import { fullDiari } from '../nucli/full.js';
import { useSalut } from '../useSalut.jsx';
import { descarregaFitxer } from './descarrega.js';

const FORMATS = Object.freeze([
  { valor: 'xlsx', etiqueta: 'Full de càlcul (XLSX)', ajuda: 'Totes les fulles: resum, diari, conducta, medicació i diccionari.' },
  { valor: 'csv', etiqueta: 'Text separat (CSV)', ajuda: 'Només la fulla del diari.' }
]);

function potCompartirFitxers() {
  return typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && typeof navigator.share === 'function'
    && typeof File === 'function';
}

export function DialegExportacio({ obert, onTanca, des, dies }) {
  const salut = useSalut();
  const [format, setFormat] = useState('xlsx');
  const [ambNom, setAmbNom] = useState(false);
  const [nom, setNom] = useState('');
  const [missatge, setMissatge] = useState(null);
  const model = useMemo(() => (obert ? fullDiari({
    des, dies, apunts: salut.apunts, jornades: salut.jornades, persona: salut.persona, ofsetDe: salut.ofsetDe, nomPersona: ambNom ? nom : ''
  }).model : null), [obert, des, dies, salut.apunts, salut.jornades, salut.persona, salut.ofsetDe, ambNom, nom]);

  const tanca = (motiu) => {
    /* El nom no es guarda: en tancar, s'oblida. */
    setNom('');
    setAmbNom(false);
    setMissatge(null);
    onTanca?.(motiu);
  };
  const fitxer = () => exporta({ model, format, des, dies });

  const descarrega = () => {
    setMissatge(descarregaFitxer(fitxer()) ? 'Fet. Busca el fitxer a les descàrregues.' : 'Este navegador no pot descarregar fitxers.');
  };

  const compartix = async () => {
    const { nom: nomFitxer, tipus, dades } = fitxer();
    const arxiu = new File([dades], nomFitxer, { type: tipus });
    if (!navigator.canShare({ files: [arxiu] })) {
      setMissatge('Este sistema no pot compartir este fitxer. Descarrega’l i envia’l tu.');
      return;
    }
    try {
      await navigator.share({ files: [arxiu] });
    } catch {
      /* La persona ha tancat el menú de compartir: no passa res. */
    }
  };

  const fulles = model ? model.fulles.filter((fulla) => format === 'xlsx' || fulla.nom === FULLA_CSV) : [];
  return (
    <Dialeg obert={obert} onTanca={tanca} titol="Exportar el full per al metge" mida="g"
      descripcio="El fitxer es fa en este dispositiu. Quan l’envies, ja no és només teu: pensa a qui l’envies i per on."
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => tanca('boto')}>Tanca</Boto>
          {potCompartirFitxers() ? <Boto varietat="secundari" icona={Share2} onClick={compartix}>Compartix</Boto> : null}
          <Boto varietat="primari" icona={Download} onClick={descarrega}>Descarrega</Boto>
        </>
      )}>
      <Pila gap={4}>
        <GrupOpcions llegenda="Format" opcions={FORMATS} valor={format} onCanvi={setFormat} />
        <Casella etiqueta="Afig un nom a la capçalera del full" ajuda="S’escriu ara i no es guarda enlloc. El nom del fitxer no el porta mai."
          checked={ambNom} onChange={(event) => setAmbNom(event.target.checked)} />
        {ambNom ? (
          <Camp etiqueta="Nom per a la capçalera">
            <CampText maxLength={60} autoComplete="off" value={nom} onChange={(event) => setNom(event.target.value)} />
          </Camp>
        ) : null}
        <Pila gap={2}>
          <p>El fitxer inclou:</p>
          <ul>
            {fulles.map((fulla) => <li key={fulla.nom}>{`${fulla.nom}: ${fulla.columnes.map((c) => c.titol).join(', ')}.`}</li>)}
          </ul>
        </Pila>
        {missatge ? <Alerta to="info">{missatge}</Alerta> : null}
      </Pila>
    </Dialeg>
  );
}
