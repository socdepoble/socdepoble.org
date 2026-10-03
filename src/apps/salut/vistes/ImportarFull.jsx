/**
 * ImportarFull.jsx — importar un diari fet en un full de càlcul (/copia/full).
 *
 * La persona tria un .xlsx o un .csv, que es llig en este dispositiu (cap
 * xarxa); tria la data de cada dia (si el full resum la porta, ja ix posada)
 * i mira la proposta: quants apunts per jornada, els avisos i el que no
 * s'importa, cel·la per cel·la. No es desa res fins que no toca «Afig N
 * apunts», que només afig (mai substituïx): el que ja hi era es queda, i
 * tornar a importar el mateix full no duplica res (nucli/importacio.js).
 * En una pestanya de només lectura no es pot importar.
 */
import { useMemo, useState } from 'react';
import { Upload } from 'lucide-react';
import { Alerta, Boto, Camp, CampText, GrupCamps, Pila, Taula } from '../../../components/PedraSeca/index.js';
import { useApp } from '../../plataforma/index.js';
import { tipusDe } from '../nucli/diccionari.js';
import { etiquetaData } from '../nucli/hores.js';
import { diesDe, llegixFitxer, proposaApunts } from '../nucli/importacio.js';
import { textError } from '../textos.js';
import { useSalut } from '../useSalut.jsx';
import { EnllacBoto, MarcSalut } from './comunes.jsx';

const ACCEPTA = '.xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';
/* Les columnes de la vista prèvia: els tipus que porta un diari miccional. */
const TIPUS_PREVIA = Object.freeze(['miccio', 'ingesta', 'escapament', 'son']);

/* Els apunts proposats per jornada: [{ jornada, perTipus: { miccio: 2, … } }], en ordre. */
function perJornada(apunts) {
  const jornades = new Map();
  for (const apunt of apunts) {
    if (!jornades.has(apunt.jornada)) jornades.set(apunt.jornada, {});
    const perTipus = jornades.get(apunt.jornada);
    perTipus[apunt.tipus] = (perTipus[apunt.tipus] || 0) + 1;
  }
  return [...jornades].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([jornada, perTipus]) => ({ jornada, perTipus }));
}

/* El que no s'importa, agrupat pel motiu: «motiu: G9, G12». */
function perMotiu(descartats) {
  const motius = new Map();
  for (const { lloc, motiu } of descartats) {
    if (!motius.has(motiu)) motius.set(motiu, []);
    motius.get(motiu).push(lloc.slice(lloc.lastIndexOf('!') + 1));
  }
  return [...motius].map(([motiu, llocs]) => `${motiu} ${llocs.length === 1 ? 'Cel·la' : 'Cel·les'}: ${llocs.join(', ')}.`);
}

const apuntsEn = (n) => `${n} ${n === 1 ? 'apunt' : 'apunts'}`;

export function ImportarFull() {
  const salut = useSalut();
  const { ruta } = useApp();
  const [triat, setTriat] = useState(null);
  const [dates, setDates] = useState([]);
  const [missatge, setMissatge] = useState(null);
  const [versio, setVersio] = useState(0);
  const [desant, setDesant] = useState(false);
  const { persona, ofsetDe, apunts: existents } = salut;
  const proposta = useMemo(() => (triat ? proposaApunts({
    llibre: triat.llibre, dates, persona, ofsetDe, fitxer: triat.nom, existents
  }) : null), [triat, dates, persona, ofsetDe, existents]);
  if (!salut.carregat) return null;

  const tria = async (event) => {
    const [fitxer] = event.target.files || [];
    setMissatge(null);
    if (!fitxer) {
      setTriat(null);
      return;
    }
    /* Llegir el fitxer o els seus dies no ha de deixar la pantalla a mitges: un error es diu. */
    try {
      const llegit = llegixFitxer(new Uint8Array(await fitxer.arrayBuffer()), fitxer.name);
      if (!llegit.ok) {
        setTriat(null);
        setMissatge({ to: 'error', text: llegit.error });
        return;
      }
      setDates(diesDe(llegit.llibre).map((dia) => dia.data || ''));
      setTriat({ nom: fitxer.name, llibre: llegit.llibre });
    } catch {
      setTriat(null);
      setMissatge({ to: 'error', text: 'No s’ha pogut llegir el fitxer.' });
    }
  };
  const posaData = (i, data) => setDates((abans) => Object.assign([...abans], { [i]: data }));
  const afig = async () => {
    setDesant(true);
    try {
      const informe = await salut.importa({ persona, apunts: proposta.apunts, jornades: [], periodes: [], valoracions: [] }, 'afegir');
      setTriat(null);
      setDates([]);
      setVersio((n) => n + 1);
      setMissatge({ to: 'exit', text: `Fet: ${informe.afegits} ${informe.afegits === 1 ? 'apunt nou' : 'apunts nous'}; ${informe.duplicats} ja hi eren.` });
    } catch (error) {
      setMissatge({ to: 'error', text: textError(error) });
    }
    setDesant(false);
  };

  const n = proposta ? proposta.apunts.length : 0;
  const jornades = proposta ? perJornada(proposta.apunts) : [];
  const resum = proposta ? [
    `${n === 1 ? '1 apunt nou' : `${n} apunts nous`}`,
    proposta.jaHiSon ? `${apuntsEn(proposta.jaHiSon)} que ja hi són` : '',
    proposta.descartats.length ? `${proposta.descartats.length} ${proposta.descartats.length === 1 ? 'cel·la que no s’importa' : 'cel·les que no s’importen'}` : ''
  ].filter(Boolean).join('; ') : '';

  return (
    <MarcSalut titol="Importar un full de càlcul">
      <Pila gap={6}>
        <Pila gap={2}>
          <p>Un diari fet en un full de càlcul: la plantilla del diari miccional (de Numbers, Excel o LibreOffice, en .xlsx o en .csv) o el full que exporta esta app.</p>
          <p>El fitxer es llig en este dispositiu i no s’envia enlloc. No es desa res fins que no ho confirmes, i només s’afig: el que ja hi ha es queda.</p>
        </Pila>
        <Camp etiqueta="Full de càlcul (.xlsx o .csv)">
          <CampText key={versio} tipus="file" accept={ACCEPTA} onChange={tria} disabled={salut.nomesLectura} />
        </Camp>
        {proposta && proposta.dies.length ? (
          <GrupCamps llegenda="Quin dia és cada full">
            {proposta.dies.map((dia, i) => (
              <Camp key={`${dia.nom}-${i}`} etiqueta={`Data de «${dia.nom}»`}>
                <CampText tipus="date" value={dia.data || ''} onChange={(event) => posaData(i, event.target.value)} />
              </Camp>
            ))}
          </GrupCamps>
        ) : null}
        {proposta ? (
          <Pila gap={4}>
            {jornades.length ? (
              <Taula titol="Què s’hi afegirà" densa>
                <thead>
                  <tr>
                    <th scope="col">Jornada</th>
                    {TIPUS_PREVIA.map((tipus) => <th key={tipus} scope="col">{tipusDe(tipus).nom}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {jornades.map(({ jornada, perTipus }) => (
                    <tr key={jornada}>
                      <th scope="row">{etiquetaData(jornada)}</th>
                      {TIPUS_PREVIA.map((tipus) => <td key={tipus}>{perTipus[tipus] || 0}</td>)}
                    </tr>
                  ))}
                </tbody>
              </Taula>
            ) : null}
            <p>{`${resum}.`}</p>
            {proposta.avisos.map((avis, i) => <Alerta key={`${avis.codi}-${i}`} to="avis" viva={false}>{avis.text}</Alerta>)}
            {proposta.descartats.length ? (
              <Alerta to="info" viva={false} titol="El que no s’importa">
                {perMotiu(proposta.descartats).map((linia) => <p key={linia}>{linia}</p>)}
              </Alerta>
            ) : null}
            {n > 0 ? (
              <p>Les hores de la graella són les de cada franja: la nota de l’apunt diu que són aproximades. El que el full no porta (on ha orinat, per exemple) queda com ho proposa el formulari.</p>
            ) : null}
            <Boto varietat="primari" icona={Upload} disabled={salut.nomesLectura || desant || n === 0} onClick={afig}>{`Afig ${apuntsEn(n)}`}</Boto>
          </Pila>
        ) : null}
        {missatge ? <Alerta to={missatge.to}>{missatge.text}</Alerta> : null}
        <EnllacBoto a={ruta('copia')}>Torna a Còpia i esborrat</EnllacBoto>
      </Pila>
    </MarcSalut>
  );
}
