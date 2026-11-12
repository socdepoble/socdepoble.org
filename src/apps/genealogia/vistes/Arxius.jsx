/**
 * Arxius.jsx — l'investigador d'arxius públics i els prompts auto-emplenables.
 *
 *   LlistaArxius     (mig)    PARES, ARV/SAVEX, AHP, Quinque Libri, FamilySearch, Registre Civil, padrons, BVPH…
 *   FitxaArxiu       (detall) què hi ha, com s'hi accedix, el consell i les consultes per a copiar
 *   LlistaPlantilles (mig)    les plantilles de prompt (Carballo, mur, transcripció, GPS)
 *   GeneradorPrompt  (detall) el prompt emplenat amb l'arbre, per a copiar
 *
 * Tractor-promesa: l'app NO cerca als arxius ni envia res a cap IA. Prepara
 * textos que la persona copia (navigator.clipboard). Un enllaç oficial només
 * s'ensenya si el catàleg el dona per verificat; si no, s'explica on trobar-lo.
 * Les persones vives queden fora (filtraVius al nucli) llevat que la persona
 * marque la casella, desmarcada per defecte.
 */
import { useMemo, useState } from 'react';
import { Link } from '../../../app/contexts/RouterContext';
import { Accions, Alerta, AreaText, Camp, EstatBuit, GrupCamps, Pila, Selector, Taula } from '../../../components/PedraSeca/index.js';
import { useApp } from '../../plataforma/index.js';
import { ARXIUS, PLANTILLES_PROMPT, arxiuPerId, generaConsultes, generaPrompt } from '../arxius/index.js';
import { useGenealogia } from '../nucli/index.js';
import { nomVisible } from '../textos.js';
import { BotoCopia, CasellaVius, MarcGenealogia, useIdioma, useT } from './comunes.jsx';
import { enLlengua } from './Entrevista.jsx';

const ACCESSOS = Object.freeze(['en-linia', 'parcial', 'presencial']);

function textPeriode(periode, tx) {
  const des = periode?.des ?? null;
  const fins = periode?.fins ?? null;
  if (des !== null && fins !== null) return tx('periode.rang', { des, fins });
  if (des !== null) return tx('periode.des', { des });
  if (fins !== null) return tx('periode.fins', { fins });
  return tx('periode.sempre');
}

/*
 * La persona triada per defecte: la persona 1 si no està protegida; si no, la
 * primera de la línia Sosa que no ho estiga. Mai una persona viva per defecte.
 */
function primeraNoViva(g) {
  const arrel = g.complet?.arbre?.arrelId;
  if (arrel && !g.esViva(arrel)) return arrel;
  const perSosa = (g.sosa?.files || []).map((fila) => fila.personaId).filter(Boolean);
  return perSosa.find((id) => !g.esViva(id)) || (g.complet?.persones || []).find((p) => !g.esViva(p.id))?.id || '';
}

/* El selector de persona de l'arbre. */
function SelectorPersona({ etiqueta, valor, onCanvi, ambCap = false }) {
  const g = useGenealogia();
  const tx = useT();
  const idioma = useIdioma();
  const persones = g.complet?.persones || [];
  const opcions = persones.map((persona) => ({ valor: persona.id, etiqueta: nomVisible(persona, idioma) }));
  return (
    <Camp etiqueta={etiqueta}>
      <Selector value={valor} onChange={(event) => onCanvi(event.target.value)}
        opcions={ambCap || !valor ? [{ valor: '', etiqueta: tx('prompts.cap') }, ...opcions] : opcions} />
    </Camp>
  );
}

export function LlistaArxius() {
  const tx = useT();
  const idioma = useIdioma();
  const { ruta } = useApp();
  return (
    <MarcGenealogia titol={tx('arxius.titol')} columna="mig">
      <Pila gap={4}>
        <p>{tx('arxiu.consultes.explica')}</p>
        <Taula titol={tx('arxius.taula')} densa>
          <thead>
            <tr>
              <th scope="col">{tx('arxius.col.nom')}</th>
              <th scope="col">{tx('arxius.col.acces')}</th>
              <th scope="col">{tx('arxius.col.periode')}</th>
            </tr>
          </thead>
          <tbody>
            {ARXIUS.map((arxiu) => (
              <tr key={arxiu.id}>
                <td><Link to={ruta('arxius', arxiu.id)}>{enLlengua(arxiu.nom, idioma)}</Link></td>
                <td>{ACCESSOS.includes(arxiu.acces) ? tx(`acces.${arxiu.acces}`) : ''}</td>
                <td>{textPeriode(arxiu.periode, tx)}</td>
              </tr>
            ))}
          </tbody>
        </Taula>
      </Pila>
    </MarcGenealogia>
  );
}

function ConsultesArxiu({ arxiu }) {
  const g = useGenealogia();
  const tx = useT();
  const [personaId, setPersonaId] = useState(() => primeraNoViva(g) || g.complet?.persones?.[0]?.id || '');
  const [incloureVius, setIncloureVius] = useState(false);
  /* Només es recalcula quan canvia l'arbre, la persona o la casella, no a cada render. */
  const resultat = useMemo(
    () => (g.complet && personaId ? generaConsultes(g.complet, personaId, { anyActual: g.anyActual, incloureVius }) : null),
    [g.complet, g.anyActual, personaId, incloureVius]
  );
  if (!g.complet || g.complet.persones.length === 0) return null;
  const consultes = (resultat?.consultes || []).filter((consulta) => consulta.arxiuId === arxiu.id);
  /* La consulta del Censo-guía no és d'un registre: diu on és l'arxiu del poble. */
  const etiquetaRegistre = (registre) => (typeof registre === 'string' && registre !== '' ? tx(`registre.${registre}`) : tx('registre.arxiu'));
  return (
    <GrupCamps llegenda={tx('arxiu.consultes')}>
      <p>{tx('arxiu.consultes.explica')}</p>
      <SelectorPersona etiqueta={tx('arxiu.persona')} valor={personaId} onCanvi={setPersonaId} />
      <CasellaVius marcada={incloureVius} onCanvi={setIncloureVius} />
      {resultat && !resultat.ok ? (
        <Alerta to="avis" viva={false}>{resultat.motiu === 'persona-viva' ? tx('arxiu.viva') : tx('arxiu.senseDades')}</Alerta>
      ) : null}
      {resultat?.ok && consultes.length === 0 ? <p>{tx('arxiu.cap')}</p> : null}
      {consultes.map((consulta, i) => (
        <Pila key={`${consulta.registre}-${i}`} gap={2}>
          <Camp etiqueta={tx('arxiu.consulta', { n: i + 1, registre: etiquetaRegistre(consulta.registre) })}>
            <AreaText files={2} readOnly value={consulta.text} />
          </Camp>
          <BotoCopia text={consulta.text} />
        </Pila>
      ))}
    </GrupCamps>
  );
}

export function FitxaArxiu({ params }) {
  const g = useGenealogia();
  const tx = useT();
  const idioma = useIdioma();
  const arxiu = params?.arxiu ? arxiuPerId(params.arxiu) : null;
  if (!g.carregat) return null;
  if (!arxiu) {
    return (
      <MarcGenealogia titol={tx('arxius.titol')}>
        <Pila gap={4}>
          <p>{tx('arxiu.consultes.explica')}</p>
          <EstatBuit titol={tx('arxiu.tria')} />
        </Pila>
      </MarcGenealogia>
    );
  }
  const apartats = [['que', arxiu.que], ['comAccedir', arxiu.comAccedir], ['consell', arxiu.consell]];
  return (
    <MarcGenealogia titol={enLlengua(arxiu.nom, idioma)}>
      <Pila gap={6}>
        {apartats.map(([clau, textos]) => {
          const text = enLlengua(textos, idioma);
          return text ? (
            <Pila key={clau} gap={1}>
              <p><strong>{tx(`arxiu.${clau}`)}</strong></p>
              <p>{text}</p>
            </Pila>
          ) : null;
        })}
        {arxiu.url && !arxiu.verificar ? (
          <Accions>
            <a href={arxiu.url} target="_blank" rel="noopener noreferrer" className="sdp-boto sdp-boto--secundari">{tx('arxiu.obri')}</a>
          </Accions>
        ) : (
          <Alerta to="avis" viva={false}>{tx('arxiu.verificar')}</Alerta>
        )}
        <ConsultesArxiu key={arxiu.id} arxiu={arxiu} />
      </Pila>
    </MarcGenealogia>
  );
}

export function LlistaPlantilles() {
  const tx = useT();
  const idioma = useIdioma();
  const { ruta } = useApp();
  return (
    <MarcGenealogia titol={tx('prompts.titol')} columna="mig">
      <Pila gap={4}>
        <p>{tx('prompts.explica')}</p>
        <Taula titol={tx('prompts.taula')} densa>
          <tbody>
            {PLANTILLES_PROMPT.map((plantilla) => (
              <tr key={plantilla.id}>
                <td><Link to={ruta('prompts', plantilla.id)}>{enLlengua(plantilla.titol, idioma)}</Link></td>
                <td>{enLlengua(plantilla.descripcio, idioma)}</td>
              </tr>
            ))}
          </tbody>
        </Taula>
      </Pila>
    </MarcGenealogia>
  );
}

function Generador({ plantilla }) {
  const g = useGenealogia();
  const tx = useT();
  const idioma = useIdioma();
  const [personaId, setPersonaId] = useState(() => primeraNoViva(g));
  const [arxiuId, setArxiuId] = useState('');
  const [incloureVius, setIncloureVius] = useState(false);
  /* El prompt només es refà quan canvia alguna dada que l'afecta, no a cada render. */
  const resultat = useMemo(() => generaPrompt(plantilla.id, g.complet, {
    personaId: personaId || null, arxiuId: arxiuId || null, idioma, incloureVius, anyActual: g.anyActual
  }), [plantilla.id, g.complet, personaId, arxiuId, idioma, incloureVius, g.anyActual]);
  const falta = plantilla.necessitaPersona && !personaId;
  return (
    <Pila gap={4}>
      <p>{enLlengua(plantilla.descripcio, idioma)}</p>
      <p>{tx('prompts.explica')}</p>
      <SelectorPersona etiqueta={tx('prompts.persona')} valor={personaId} onCanvi={setPersonaId} ambCap />
      <Camp etiqueta={tx('prompts.arxiu')}>
        <Selector value={arxiuId} onChange={(event) => setArxiuId(event.target.value)}
          opcions={[{ valor: '', etiqueta: tx('prompts.cap') }, ...ARXIUS.map((arxiu) => ({ valor: arxiu.id, etiqueta: enLlengua(arxiu.nom, idioma) }))]} />
      </Camp>
      <CasellaVius marcada={incloureVius} onCanvi={setIncloureVius} />
      {falta ? <Alerta to="info" viva={false}>{tx('prompts.necessitaPersona')}</Alerta> : null}
      {!resultat?.ok && resultat?.motiu === 'persona-viva' ? <Alerta to="avis" viva={false}>{tx('prompts.viva')}</Alerta> : null}
      {resultat?.ocultes > 0 ? <p>{tx('prompts.ocultes', { n: resultat.ocultes })}</p> : null}
      <Camp etiqueta={tx('prompts.text')}>
        <AreaText files={14} readOnly value={resultat?.ok ? resultat.text : ''} />
      </Camp>
      <BotoCopia text={resultat?.ok ? resultat.text : ''} />
      {resultat?.avisos?.length ? (
        <Alerta to="info" viva={false} titol={tx('prompts.avisos')}>
          {resultat.avisos.map((avis) => <p key={avis}>{tx(`avis.${avis}`)}</p>)}
        </Alerta>
      ) : null}
    </Pila>
  );
}

export function GeneradorPrompt({ params }) {
  const g = useGenealogia();
  const tx = useT();
  const idioma = useIdioma();
  const plantilla = PLANTILLES_PROMPT.find((p) => p.id === params?.plantilla) || null;
  if (!g.carregat) return null;
  if (!plantilla || !g.complet) {
    return (
      <MarcGenealogia titol={tx('prompts.titol')}>
        <Pila gap={4}>
          <p>{tx('prompts.explica')}</p>
          {plantilla ? (
            <EstatBuit titol={tx('entrevista.senseArbre')}>{tx('entrevista.senseArbre.text')}</EstatBuit>
          ) : <EstatBuit titol={tx('prompts.tria')} />}
        </Pila>
      </MarcGenealogia>
    );
  }
  return (
    <MarcGenealogia titol={enLlengua(plantilla.titol, idioma)}>
      <Generador key={plantilla.id} plantilla={plantilla} />
    </MarcGenealogia>
  );
}
