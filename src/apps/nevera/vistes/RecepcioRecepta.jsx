import { useEffect, useState } from 'react';
import { useLocation, useRouter } from '../../../app/contexts/RouterContext';
import { Alerta, Boto, Botonera, Camp, CampText, Casella, GrupCamps } from '../../../components/PedraSeca/index.js';
import { textosVistaNevera } from '../i18nNevera.js';
import { LIMITS, ingredientDArticle } from '../nucli/index.js';
import { useVistaNevera } from './context.js';
import { carregaReceptes, mesuraIngredient, validaEsborranyTrasllat } from '../../plataforma/index.js';

const racionsValides = (valor) => /^\d{1,5}$/.test(String(valor)) && Number(valor) > 0 && Number(valor) <= 10000;

function FormulariRecepcio({ recepta, mesuraIngredient, llista, esborrany, tx }) {
  const { accions, mode, llegit } = useVistaNevera();
  const [base, setBase] = useState(esborrany ? String(esborrany.racionsBase) : '');
  const [racions, setRacions] = useState(esborrany ? String(esborrany.racions) : '');
  const mesures = esborrany?.linies || recepta.ingredients.map(mesuraIngredient);
  const [noms, setNoms] = useState(() => mesures.map((m) => ingredientDArticle({ nom: m.nom })?.nom || m.nom));
  const [notes, setNotes] = useState({});
  const [exclusions, setExclusions] = useState({});
  const [resultat, setResultat] = useState(null);
  const valides = racionsValides(base) && racionsValides(racions);
  const quantitatDe = (index) => {
    if (Object.hasOwn(notes, index)) return notes[index];
    const mesura = mesures[index];
    if (!valides || mesura.quantitat == null || !['g', 'kg', 'ml', 'cl', 'l', 'u'].includes(mesura.unitat)) return '';
    return `${Number((mesura.quantitat * Number(racions) / Number(base)).toFixed(6)).toLocaleString('ca', { maximumFractionDigits: 6, useGrouping: false })} ${mesura.unitat}`;
  };
  const afegix = () => {
    if (!valides) { setResultat(tx.confirmaRacions); return; }
    try {
      const canvi = accions.afigIngredientsRecepta(llista.id, mesures.map((_, index) => ({ nom: noms[index], especificacio: quantitatDe(index), index })).filter((l) => !exclusions[l.index]));
      setResultat(canvi ? tx.ingredientsAfegits(llista.nom) : tx.llistaSenseCanvi);
    } catch (error) { setResultat(error.message); }
  };
  return (
    <GrupCamps llegenda={tx.ingredientsDeRecepta(recepta.nom)}>
      <p>{tx.revisaIngredientsText(llista.nom)}</p>
      <Camp etiqueta={tx.racionsOriginals}><CampText value={base} inputMode="numeric" onChange={(event) => { setBase(event.target.value); setResultat(null); }} /></Camp>
      <Camp etiqueta={tx.racionsPreparar}><CampText value={racions} inputMode="numeric" onChange={(event) => { setRacions(event.target.value); setResultat(null); }} /></Camp>
      <p>{tx.ingredientRepetitAjuda}</p>
      {mesures.map((mesura, index) => (
        <GrupCamps key={index} llegenda={mesura.text || recepta.ingredients[index]}>
          <Casella etiqueta={tx.inclouIngredient(index + 1)} checked={!exclusions[index]} onChange={(e) => setExclusions((prev) => ({ ...prev, [index]: !e.target.checked }))} />
          <Camp etiqueta={tx.ingredientN(index + 1)} ajuda={tx.ajudaIngredientExacte}>
            <CampText value={noms[index]} maxLength={LIMITS.nom} onChange={(event) => { setNoms((actuals) => actuals.map((nom, i) => i === index ? event.target.value : nom)); setResultat(null); }} />
          </Camp>
          <Camp etiqueta={tx.quantitatIndicacioN(index + 1)}>
            <CampText value={quantitatDe(index)} maxLength={LIMITS.especificacio} onChange={(event) => { setNotes((actuals) => ({ ...actuals, [index]: event.target.value })); setResultat(null); }} />
          </Camp>
        </GrupCamps>
      ))}
      <Botonera etiqueta={tx.ingredientsBotonera}>
        <Boto disabled={!llegit || mode === 'lectora' || !valides} onClick={afegix}>{tx.afigIngredientsBoto}</Boto>
      </Botonera>
      {resultat ? <p role="status">{resultat}</p> : null}
    </GrupCamps>
  );
}

function CarregaRecepcio({ slug, llista, esborrany, tx }) {
  const [dades, setDades] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let viu = true;
    carregaReceptes().then((cataleg) => {
      if (viu) setDades({ recepta: cataleg.receptes.find((r) => r.slug === slug), mesuraIngredient });
    }).catch(() => { if (viu) setError(true); });
    return () => { viu = false; };
  }, [slug]);
  if (error) return <Alerta to="error" titol={tx.errorObrirReceptaTitol}>{tx.errorObrirReceptaText}</Alerta>;
  if (!dades) return <Alerta to="info" titol={tx.obrintReceptaTitol}>{tx.obrintReceptaText}</Alerta>;
  if (!dades.recepta) return <Alerta to="avis" titol={tx.receptaNoExistixTitol}>{tx.receptaNoExistixText}</Alerta>;
  return <FormulariRecepcio recepta={dades.recepta} mesuraIngredient={dades.mesuraIngredient} llista={llista} esborrany={esborrany} tx={tx} />;
}

/** La URL només obri una previsualització. Afegir és una acció explícita. */
export function RecepcioRecepta({ llista }) {
  const { search, state } = useLocation();
  const { navegacio } = useRouter();
  /* R32.11 (lot 04 de Gemini) · La llengua ve del context de la Nevera (AppNevera hi posa la de
     l'app, la mateixa del text de la closca), com AvisNevera: la recepció és un avís de la llista i
     no demana la closca de columnes (useClosaAplicacio només viu dins d'AppGridShell). */
  const { idioma = 'ca' } = useVistaNevera();
  const tx = textosVistaNevera(idioma);
  const params = new URLSearchParams(search);
  const slug = params.get('recepta');
  if (!slug || !llista) return null;
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return <Alerta to="avis" titol={tx.receptaDesconegudaTitol}>{tx.receptaDesconegudaText}</Alerta>;
  const draft = state?.trasllatRecepta;
  const valid = validaEsborranyTrasllat(draft, slug);
  if (draft && !valid) return <Alerta to="avis" titol={tx.revisaTrasllatTitol}>{tx.revisaTrasllatText}</Alerta>;
  // A receipt belongs to one navigation and validated draft. Repeated URLs
  // must not retain names, quantities or confirmation from a previous receipt.
  const entrada = JSON.stringify([slug, llista.id, navegacio?.clau ?? null, valid ? draft : null]);
  return <CarregaRecepcio key={entrada} slug={slug} llista={llista} esborrany={valid ? draft : null} tx={tx} />;
}
