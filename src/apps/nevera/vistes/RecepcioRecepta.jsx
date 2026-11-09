import { useEffect, useState } from 'react';
import { useLocation, useRouter } from '../../../app/contexts/RouterContext';
import { Alerta, Boto, Botonera, Camp, CampText, Casella, GrupCamps } from '../../../components/PedraSeca/index.js';
import { LIMITS, ingredientDArticle } from '../nucli/index.js';
import { useVistaNevera } from './context.js';
import { carregaReceptes, mesuraIngredient, validaEsborranyTrasllat } from '../../plataforma/index.js';

const racionsValides = (valor) => /^\d{1,5}$/.test(String(valor)) && Number(valor) > 0 && Number(valor) <= 10000;

function FormulariRecepcio({ recepta, mesuraIngredient, llista, esborrany }) {
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
    if (!valides) { setResultat('Confirma les racions de la recepta original i les que vols preparar.'); return; }
    try {
      const canvi = accions.afigIngredientsRecepta(llista.id, mesures.map((_, index) => ({ nom: noms[index], especificacio: quantitatDe(index), index })).filter((l) => !exclusions[l.index]));
      setResultat(canvi ? `Ingredients afegits a «${llista.nom}». Els que ja hi eren s’han conservat.` : 'No s’ha canviat la llista. Els ingredients poden estar-hi ja o la llista ha passat a només lectura.');
    } catch (error) { setResultat(error.message); }
  };
  return (
    <GrupCamps llegenda={`Ingredients de «${recepta.nom}»`}>
      <p>Revisa els ingredients abans d’afegir-los a «{llista.nom}». Indica les racions originals i les que vols preparar: el llibre no les fixa per a totes les receptes. Les quantitats escrites a mà es conserven quan canvies les racions; les línies sense mesura necessiten una quantitat o una indicació teua.</p>
      <Camp etiqueta="Racions de la recepta original"><CampText value={base} inputMode="numeric" onChange={(event) => { setBase(event.target.value); setResultat(null); }} /></Camp>
      <Camp etiqueta="Racions que vols preparar"><CampText value={racions} inputMode="numeric" onChange={(event) => { setRacions(event.target.value); setResultat(null); }} /></Camp>
      <p>Si un ingredient es repetix, combina les indicacions en una fila i exclou l’altra abans de confirmar.</p>
      {mesures.map((mesura, index) => (
        <GrupCamps key={index} llegenda={mesura.text || recepta.ingredients[index]}>
          <Casella etiqueta={`Inclou l’ingredient ${index + 1}`} checked={!exclusions[index]} onChange={(e) => setExclusions((prev) => ({ ...prev, [index]: !e.target.checked }))} />
          <Camp etiqueta={`Ingredient ${index + 1}`} ajuda="Nom exacte del catàleg o text propi. No assignem productes per semblança.">
            <CampText value={noms[index]} maxLength={LIMITS.nom} onChange={(event) => { setNoms((actuals) => actuals.map((nom, i) => i === index ? event.target.value : nom)); setResultat(null); }} />
          </Camp>
          <Camp etiqueta={`Quantitat o indicació ${index + 1}`}>
            <CampText value={quantitatDe(index)} maxLength={LIMITS.especificacio} onChange={(event) => { setNotes((actuals) => ({ ...actuals, [index]: event.target.value })); setResultat(null); }} />
          </Camp>
        </GrupCamps>
      ))}
      <Botonera etiqueta="Ingredients de la recepta">
        <Boto disabled={!llegit || mode === 'lectora' || !valides} onClick={afegix}>Afig els ingredients de la recepta</Boto>
      </Botonera>
      {resultat ? <p role="status">{resultat}</p> : null}
    </GrupCamps>
  );
}

function CarregaRecepcio({ slug, llista, esborrany }) {
  const [dades, setDades] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let viu = true;
    carregaReceptes().then((cataleg) => {
      if (viu) setDades({ recepta: cataleg.receptes.find((r) => r.slug === slug), mesuraIngredient });
    }).catch(() => { if (viu) setError(true); });
    return () => { viu = false; };
  }, [slug]);
  if (error) return <Alerta to="error" titol="No s’ha pogut obrir la recepta">Recarrega la pàgina per a tornar-ho a provar. No s’ha afegit cap ingredient.</Alerta>;
  if (!dades) return <Alerta to="info" titol="Obrint la recepta">La llista no canvia fins que confirmes els ingredients.</Alerta>;
  if (!dades.recepta) return <Alerta to="avis" titol="La recepta no existix">No s’ha afegit cap ingredient a la llista.</Alerta>;
  return <FormulariRecepcio recepta={dades.recepta} mesuraIngredient={dades.mesuraIngredient} llista={llista} esborrany={esborrany} />;
}

/** La URL només obri una previsualització. Afegir és una acció explícita. */
export function RecepcioRecepta({ llista }) {
  const { search, state } = useLocation();
  const { navegacio } = useRouter();
  const params = new URLSearchParams(search);
  const slug = params.get('recepta');
  if (!slug || !llista) return null;
  if (!/^[a-z0-9-]{1,120}$/.test(slug)) return <Alerta to="avis" titol="Recepta desconeguda">L’identificador de la recepta no és vàlid. No s’ha afegit cap ingredient.</Alerta>;
  const draft = state?.trasllatRecepta;
  const valid = validaEsborranyTrasllat(draft, slug);
  if (draft && !valid) return <Alerta to="avis" titol="Revisa el trasllat">Les dades de treball no són vàlides. No s’ha afegit cap ingredient.</Alerta>;
  // A receipt belongs to one navigation and validated draft. Repeated URLs
  // must not retain names, quantities or confirmation from a previous receipt.
  const entrada = JSON.stringify([slug, llista.id, navegacio?.clau ?? null, valid ? draft : null]);
  return <CarregaRecepcio key={entrada} slug={slug} llista={llista} esborrany={valid ? draft : null} />;
}
