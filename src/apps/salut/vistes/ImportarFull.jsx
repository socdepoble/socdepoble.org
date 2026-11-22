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
import {
  errorLlegirFitxerSalut, etiquetaDataSalut, propostaImportacioTraduida, textErrorSalut, tipusSalutTraduit
} from '../i18nSalut.js';
import { tipusDe } from '../nucli/diccionari.js';
import { diesDe, llegixFitxer, proposaApunts } from '../nucli/importacio.js';
import { useSalut } from '../useSalut.jsx';
import { EnllacBoto, MarcSalut, useTextosSalut } from './comunes.jsx';

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
function perMotiu(descartats, tx) {
  const motius = new Map();
  for (const { lloc, motiu } of descartats) {
    if (!motius.has(motiu)) motius.set(motiu, []);
    motius.get(motiu).push(lloc.slice(lloc.lastIndexOf('!') + 1));
  }
  return [...motius].map(([motiu, llocs]) => `${motiu} ${llocs.length === 1 ? tx.cella : tx.celles}: ${llocs.join(', ')}.`);
}

export function ImportarFull() {
  const salut = useSalut();
  const { ruta, idioma = 'ca' } = useApp();
  const tx = useTextosSalut();
  const [triat, setTriat] = useState(null);
  const [dates, setDates] = useState([]);
  const [missatge, setMissatge] = useState(null);
  const [versio, setVersio] = useState(0);
  const [desant, setDesant] = useState(false);
  const { persona, ofsetDe, apunts: existents } = salut;
  const propostaCrua = useMemo(() => (triat ? proposaApunts({
    llibre: triat.llibre, dates, persona, ofsetDe, fitxer: triat.nom, existents
  }) : null), [triat, dates, persona, ofsetDe, existents]);
  const proposta = useMemo(() => propostaImportacioTraduida(propostaCrua, idioma), [propostaCrua, idioma]);
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
        setMissatge({ to: 'error', text: errorLlegirFitxerSalut(llegit.error, idioma, tx.errorLlegirFitxer) });
        return;
      }
      setDates(diesDe(llegit.llibre).map((dia) => dia.data || ''));
      setTriat({ nom: fitxer.name, llibre: llegit.llibre });
    } catch {
      setTriat(null);
      setMissatge({ to: 'error', text: tx.errorLlegirFitxer });
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
      setMissatge({ to: 'exit', text: tx.fetImportarFull(informe.afegits, informe.duplicats) });
    } catch (error) {
      setMissatge({ to: 'error', text: textErrorSalut(error, idioma) });
    }
    setDesant(false);
  };

  const n = proposta ? proposta.apunts.length : 0;
  const jornades = proposta ? perJornada(proposta.apunts) : [];
  const resum = proposta ? [
    tx.apuntsNousCount(n),
    proposta.jaHiSon ? tx.jaHiSonCount(tx.apuntsCount(proposta.jaHiSon)) : '',
    proposta.descartats.length ? tx.cellesNoImportades(proposta.descartats.length) : ''
  ].filter(Boolean).join('; ') : '';

  return (
    <MarcSalut titol={tx.importarFullCalcul}>
      <Pila gap={6}>
        <Pila gap={2}>
          <p>{tx.importarFullIntro1}</p>
          <p>{tx.importarFullIntro2}</p>
        </Pila>
        <Camp etiqueta={tx.fullCalculEtiqueta}>
          <CampText key={versio} tipus="file" accept={ACCEPTA} onChange={tria} disabled={salut.nomesLectura} />
        </Camp>
        {proposta && proposta.dies.length ? (
          <GrupCamps llegenda={tx.quinDiaCadaFull}>
            {proposta.dies.map((dia, i) => (
              <Camp key={`${dia.nom}-${i}`} etiqueta={tx.dataDeFull(dia.nom)}>
                <CampText tipus="date" value={dia.data || ''} onChange={(event) => posaData(i, event.target.value)} />
              </Camp>
            ))}
          </GrupCamps>
        ) : null}
        {proposta ? (
          <Pila gap={4}>
            {jornades.length ? (
              <Taula titol={tx.queSAfegira} densa>
                <thead>
                  <tr>
                    <th scope="col">{tx.jornada}</th>
                    {TIPUS_PREVIA.map((tipus) => <th key={tipus} scope="col">{tipusSalutTraduit(tipusDe(tipus), idioma).nom}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {jornades.map(({ jornada, perTipus }) => (
                    <tr key={jornada}>
                      <th scope="row">{etiquetaDataSalut(jornada, idioma)}</th>
                      {TIPUS_PREVIA.map((tipus) => <td key={tipus}>{perTipus[tipus] || 0}</td>)}
                    </tr>
                  ))}
                </tbody>
              </Taula>
            ) : null}
            <p>{`${resum}.`}</p>
            {proposta.avisos.map((avis, i) => <Alerta key={`${avis.codi}-${i}`} to="avis" viva={false}>{avis.text}</Alerta>)}
            {proposta.descartats.length ? (
              <Alerta to="info" viva={false} titol={tx.elQueNoSImporta}>
                {perMotiu(proposta.descartats, tx).map((linia) => <p key={linia}>{linia}</p>)}
              </Alerta>
            ) : null}
            {n > 0 ? (
              <p>{tx.horesAproximadesText}</p>
            ) : null}
            <Boto varietat="primari" icona={Upload} disabled={salut.nomesLectura || desant || n === 0} onClick={afig}>{tx.afigApuntsBoto(tx.apuntsCount(n))}</Boto>
          </Pila>
        ) : null}
        {missatge ? <Alerta to={missatge.to}>{missatge.text}</Alerta> : null}
        <EnllacBoto a={ruta('copia')}>{tx.tornaACopiaIEsborrat}</EnllacBoto>
      </Pila>
    </MarcSalut>
  );
}
