/**
 * Persones.jsx — les persones de l'arbre.
 *
 *   LlistaPersones  (mig)    totes les persones; a /fan enllaça a les col·laterals
 *   EditorPersona   (detall) la fitxa, les fonts (fins a 20) i els vincles amb la seua evidència
 *   Colaterals      (detall) germans, padrins, testimonis, veïns i parelles (FAN Club)
 *
 * Un vincle només naix d'una tria explícita de la persona, amb l'evidència en
 * tres caselles (font escrita, memòria oral, vincle explícit); l'estat del
 * vincle el deriva el nucli (estatDeVincle). Cap vincle per cognom.
 */
import { useMemo, useRef, useState } from 'react';
import { Link, useLocation } from '../../../app/contexts/RouterContext';
import {
  Accions, Alerta, AreaText, Boto, Camp, CampText, Casella, DialegConfirmacio, EstatBuit, GrupCamps, GrupOpcions, Pila, Selector, Taula
} from '../../../components/PedraSeca/index.js';
import { useApp } from '../../plataforma/index.js';
import {
  ESTATS, ETIQUETES_ESTAT, GENERACIONS, SEXES, TIPUS_FONT, VIVA, colateralsFan, escriuData, estatDeVincle, estatEfectiu, llegeixData,
  useGenealogia
} from '../nucli/index.js';
import { nomVisible, textError } from '../textos.js';
import { paperDeLAltra, usePersonesPerId, useTextData } from './Arbre.jsx';
import {
  CampData, EnllacBoto, EtiquetaEstat, MarcGenealogia, useIdioma, useNavegaGenealogia, useT
} from './comunes.jsx';

/* El límit de fonts per persona del nucli (segur.js · MAX_FONTS_PER_PERSONA). */
const MAX_FONTS = 20;

/* Les opcions de vincle, dites des de la persona que s'edita, i la relació que en ix. */
const OPCIONS_VINCLE = Object.freeze({
  esProgenitorDe: (id, altra) => ({ tipus: 'progenitor', de: id, a: altra }),
  esFillDe: (id, altra) => ({ tipus: 'progenitor', de: altra, a: id }),
  parella: (id, altra) => ({ tipus: 'parella', de: id, a: altra }),
  germa: (id, altra) => ({ tipus: 'germa', de: id, a: altra }),
  padri: (id, altra) => ({ tipus: 'padri', de: altra, a: id }),
  testimoni: (id, altra) => ({ tipus: 'testimoni', de: altra, a: id }),
  vei: (id, altra) => ({ tipus: 'vei', de: altra, a: id })
});

/** Les persones ordenades per cognom i nom (en la llengua de la interfície). */
function useOrdenades() {
  const g = useGenealogia();
  const idioma = useIdioma();
  return useMemo(() => [...(g.complet?.persones || [])].sort((a, b) => (
    `${a.cognom1} ${a.cognom2} ${a.nom}`.localeCompare(`${b.cognom1} ${b.cognom2} ${b.nom}`, idioma)
  )), [g.complet, idioma]);
}

export function LlistaPersones() {
  const g = useGenealogia();
  const tx = useT();
  const idioma = useIdioma();
  const { ruta } = useApp();
  const textData = useTextData();
  const persones = useOrdenades();
  /* /app/genealogia/<entrada>: a /fan cada persona porta a les seues col·laterals. */
  const entrada = useLocation().pathname.split('/')[3];
  const esFan = entrada === 'fan';
  if (!g.carregat) return null;
  const titol = esFan ? tx('fan.titol') : tx('persones.titol');
  if (!g.complet) {
    return (
      <MarcGenealogia titol={titol} columna="mig">
        <EstatBuit titol={tx('entrevista.senseArbre')}>{tx('entrevista.senseArbre.text')}</EstatBuit>
      </MarcGenealogia>
    );
  }
  const eines = esFan ? null : (
    <Accions><EnllacBoto a={ruta('persones', 'nova')}>{tx('persones.nova')}</EnllacBoto></Accions>
  );
  return (
    <MarcGenealogia titol={titol} columna="mig" eines={eines}>
      {!esFan && <RevisioDuplicats />}
      {persones.length ? (
        <Taula titol={tx('persones.taula')} densa>
          <thead>
            <tr>
              <th scope="col">{tx('arbre.col.persona')}</th>
              <th scope="col">{tx('arbre.col.naixement')}</th>
              <th scope="col">{tx('arbre.col.estat')}</th>
            </tr>
          </thead>
          <tbody>
            {persones.map((persona) => (
              <tr key={persona.id}>
                <td><Link to={esFan ? ruta('fan', persona.id) : ruta('persones', persona.id)}>{nomVisible(persona, idioma)}</Link></td>
                <td>{textData(persona.naixement)}</td>
                <td><EtiquetaEstat estat={estatEfectiu(persona, g.alertes)} /></td>
              </tr>
            ))}
          </tbody>
        </Taula>
      ) : <EstatBuit titol={tx('persones.cap')} />}
    </MarcGenealogia>
  );
}

function RevisioDuplicats(){
  const g = useGenealogia();
  const tx = useT();
  const idioma = useIdioma();
  const data = useTextData();
  const { ruta } = useApp();
  const [revisio, setRevisio] = useState(null);
  const [missatge, setMissatge] = useState(null);
  const pendent = useRef(false);
  const perId = useMemo(() => new Map((g.complet?.persones ?? []).map((p) => [p.id, p])), [g.complet]);
  const oberta = Boolean(revisio && revisio.esperat === g.complet);
  const nom = (id) => nomVisible(perId.get(id), idioma);
  const confirma = async () => {
    if (pendent.current || !oberta) return;
    pendent.current = true;
    try {
      await g.fusionaDuplicats(revisio.parell, { confirmada: true, esperat: revisio.esperat });
      setMissatge({ to: 'exit', text: tx('duplicats.fet') });
    } catch (error) {
      setMissatge({ to: 'error', text: textError(error, idioma) });
    } finally {
      pendent.current = false;
      setRevisio(null);
    }
  };

  if (!g.duplicats.length && !missatge) return null;
  return (
    <GrupCamps llegenda={tx('duplicats.titol')}>
      <Pila gap={4}>
        {g.duplicats.map((parell) => {
          const { conserva, duplicada, motiu } = parell;
          return (
            <Pila key={`${conserva}|${duplicada}`} gap={2}>
              <p>{tx(`duplicats.${motiu}`)}</p>
              {[conserva, duplicada].map((id) => {
                const persona = perId.get(id);
                return (
                  <Accions key={id}>
                    <EnllacBoto a={ruta('persones', id)}>{nom(id)}</EnllacBoto>
                    <span>{[data(persona.naixement), persona.lloc].filter(Boolean).join(' · ')}</span>
                  </Accions>
                );
              })}
              <Accions>
                <Boto varietat="secundari" disabled={g.nomesLectura} onClick={() => {
                  setMissatge(null);
                  setRevisio({ parell, esperat: g.complet });
                }}>{tx('duplicats.revisa')}</Boto>
              </Accions>
            </Pila>
          );
        })}
        {missatge && <Alerta to={missatge.to}>{missatge.text}</Alerta>}
      </Pila>
      <DialegConfirmacio obert={oberta} destructiu titol={tx('duplicats.titol')}
        descripcio={tx('duplicats.confirma.text', { nom: nom(revisio?.parell.conserva) })}
        etiquetaConfirma={tx('duplicats.confirma')} etiquetaCancela={tx('boto.cancela')}
        onTanca={() => setRevisio(null)} onConfirma={confirma} />
    </GrupCamps>
  );
}

/* ── L'editor ────────────────────────────────────────────────────────────── */

const fontNova = () => ({
  id: globalThis.crypto.randomUUID(), tipus: 'oral', titol: '', url: '', arxiuId: null, citacio: '', transcripcio: '', consultada: ''
});

function formulariDe(persona) {
  return {
    nom: persona?.nom || '',
    cognom1: persona?.cognom1 || '',
    cognom2: persona?.cognom2 || '',
    malnom: persona?.malnom || '',
    casa: persona?.casa || '',
    lloc: persona?.lloc || '',
    ofici: persona?.ofici || '',
    sexe: persona?.sexe || 'U',
    viva: persona?.viva || 'desconegut',
    generacio: persona?.generacio || '',
    estat: persona?.estat || 'falta-confirmar',
    notes: persona?.notes || '',
    naixement: persona?.naixement ? escriuData(persona.naixement) : '',
    defuncio: persona?.defuncio ? escriuData(persona.defuncio) : '',
    fonts: (persona?.fonts || []).map((font) => ({ ...font, consultada: font.consultada || '' }))
  };
}

function CampsFont({ font, n, onCanvi, onLleva, desactivat }) {
  const tx = useT();
  const posa = (camp, valor) => onCanvi({ ...font, [camp]: valor });
  return (
    <GrupCamps llegenda={tx('font.n', { n })}>
      <Camp etiqueta={tx('font.tipus')}>
        <Selector value={font.tipus} disabled={desactivat} onChange={(event) => posa('tipus', event.target.value)}
          opcions={TIPUS_FONT.map((tipus) => ({ valor: tipus, etiqueta: tx(`font.${tipus}`) }))} />
      </Camp>
      <Camp etiqueta={tx('font.titol')}>
        <CampText maxLength={200} value={font.titol} disabled={desactivat} onChange={(event) => posa('titol', event.target.value)} />
      </Camp>
      <Camp etiqueta={tx('font.url')}>
        <CampText tipus="url" maxLength={2048} value={font.url} disabled={desactivat} onChange={(event) => posa('url', event.target.value)} />
      </Camp>
      <Camp etiqueta={tx('font.citacio')}>
        <CampText maxLength={500} value={font.citacio} disabled={desactivat} onChange={(event) => posa('citacio', event.target.value)} />
      </Camp>
      <Camp etiqueta={tx('font.transcripcio')}>
        <AreaText maxLength={4000} value={font.transcripcio} disabled={desactivat} onChange={(event) => posa('transcripcio', event.target.value)} />
      </Camp>
      <Camp etiqueta={tx('font.consultada')}>
        <CampText maxLength={10} value={font.consultada} disabled={desactivat} onChange={(event) => posa('consultada', event.target.value)} />
      </Camp>
      <Accions><Boto varietat="fantasma" disabled={desactivat} onClick={onLleva}>{tx('editor.llevaFont')}</Boto></Accions>
    </GrupCamps>
  );
}

function VinclesPersona({ persona }) {
  const g = useGenealogia();
  const tx = useT();
  const idioma = useIdioma();
  const perId = usePersonesPerId();
  const persones = useOrdenades();
  const [opcio, setOpcio] = useState('esFillDe');
  const [altra, setAltra] = useState('');
  const [evidencia, setEvidencia] = useState({ fontEscrita: false, memoriaOral: true, vincleExplicit: true });
  const [missatge, setMissatge] = useState(null);
  const vincles = (g.complet?.relacions || []).filter((relacio) => relacio.de === persona.id || relacio.a === persona.id);
  const candidates = persones.filter((altraPersona) => altraPersona.id !== persona.id);
  const afig = async (event) => {
    event.preventDefault();
    if (!altra) {
      setMissatge({ to: 'error', text: tx('editor.triaPersona') });
      return;
    }
    try {
      const resultat = await g.desaRelacio({ ...OPCIONS_VINCLE[opcio](persona.id, altra), evidencia, fontIds: [] });
      if (resultat?.ok) {
        setAltra('');
        setMissatge(null);
      } else setMissatge({ to: 'error', text: tx('error.invalid') });
    } catch (error) {
      setMissatge({ to: 'error', text: textError(error, idioma) });
    }
  };
  const lleva = (id) => g.esborraRelacio(id).catch((error) => setMissatge({ to: 'error', text: textError(error, idioma) }));
  return (
    <GrupCamps llegenda={tx('editor.vincles')}>
      {vincles.length ? vincles.map((relacio) => {
        const altraPersona = perId.get(relacio.de === persona.id ? relacio.a : relacio.de);
        return (
          <Pila key={relacio.id} gap={1}>
            <p>
              {`${tx(paperDeLAltra(relacio, persona.id))}: ${altraPersona ? nomVisible(altraPersona, idioma) : '—'} `}
              <EtiquetaEstat estat={relacio.estat} />
            </p>
            <Accions><Boto varietat="fantasma" disabled={g.nomesLectura} onClick={() => lleva(relacio.id)}>{tx('editor.llevaVincle')}</Boto></Accions>
          </Pila>
        );
      }) : <p>{tx('fitxa.senseVincles')}</p>}
      <form onSubmit={afig} noValidate aria-label={tx('editor.nouVincle')}>
        <Pila gap={2}>
          <Camp etiqueta={tx('editor.tipusVincle')}>
            <Selector value={opcio} disabled={g.nomesLectura} onChange={(event) => setOpcio(event.target.value)}
              opcions={Object.keys(OPCIONS_VINCLE).map((clau) => ({ valor: clau, etiqueta: tx(`opcio.${clau}`) }))} />
          </Camp>
          <Camp etiqueta={tx('editor.ambQui')}>
            <Selector value={altra} disabled={g.nomesLectura} onChange={(event) => setAltra(event.target.value)}
              opcions={[{ valor: '', etiqueta: tx('editor.triaPersona') }, ...candidates.map((c) => ({ valor: c.id, etiqueta: nomVisible(c, idioma) }))]} />
          </Camp>
          <GrupCamps llegenda={tx('evidencia')}>
            {['fontEscrita', 'memoriaOral', 'vincleExplicit'].map((clau) => (
              <Casella key={clau} etiqueta={tx(`evidencia.${clau}`)} checked={evidencia[clau]} disabled={g.nomesLectura}
                onChange={(event) => setEvidencia({ ...evidencia, [clau]: event.target.checked })} />
            ))}
            <p>{`${tx('evidencia.resultat')} `}<EtiquetaEstat estat={estatDeVincle(evidencia)} /></p>
          </GrupCamps>
          {missatge ? <Alerta to={missatge.to}>{missatge.text}</Alerta> : null}
          <Accions><Boto varietat="secundari" tipus="submit" disabled={g.nomesLectura}>{tx('editor.afigVincle')}</Boto></Accions>
        </Pila>
      </form>
    </GrupCamps>
  );
}

function FormulariPersona({ persona }) {
  const g = useGenealogia();
  const tx = useT();
  const idioma = useIdioma();
  const navega = useNavegaGenealogia();
  const [valors, setValors] = useState(() => formulariDe(persona));
  const esperat = useRef(persona);
  const [errors, setErrors] = useState({});
  const [missatge, setMissatge] = useState(null);
  const [esborrant, setEsborrant] = useState(null);
  const posa = (camp, valor) => setValors((abans) => ({ ...abans, [camp]: valor }));
  const opcionsAmb = (llista, prefix) => llista.map((valor) => ({ valor, etiqueta: tx(`${prefix}.${valor}`) }));

  const desa = async (event) => {
    event.preventDefault();
    const naixement = llegeixData(valors.naixement, { anyActual: g.anyActual });
    const defuncio = valors.defuncio.trim() === '' ? null : llegeixData(valors.defuncio, { anyActual: g.anyActual });
    const nous = {};
    if (!naixement.ok) nous.naixement = tx('error.data');
    if (defuncio && !defuncio.ok) nous.defuncio = tx('error.data');
    setErrors(nous);
    if (Object.keys(nous).length) return;
    const cru = {
      ...(persona || {}),
      ...valors,
      generacio: valors.generacio || null,
      naixement: naixement.data,
      defuncio: defuncio ? defuncio.data : null,
      fonts: valors.fonts.map((font) => ({ ...font, consultada: font.consultada.trim() || null })),
      origen: persona?.origen || 'ma'
    };
    try {
      const resultat = await g.desaPersona(cru, { esperat: esperat.current });
      if (!resultat?.ok) {
        setMissatge({ to: 'error', text: textError(resultat?.errors?.[0]?.clau, idioma) });
        return;
      }
      esperat.current = resultat.persona;
      setMissatge({ to: 'exit', text: tx('editor.desada') });
      if (!persona && resultat.persona?.id) navega(['persones', resultat.persona.id], { replace: true });
    } catch (error) {
      setMissatge({ to: 'error', text: textError(error, idioma) });
    }
  };
  const esborra = async () => {
    const arbreEsperat = esborrant;
    setEsborrant(null);
    if (!arbreEsperat) return;
    try {
      await g.esborraPersona(persona.id, { esperat: arbreEsperat });
      navega(['persones'], { replace: true });
    } catch (error) {
      setMissatge({ to: 'error', text: textError(error, idioma) });
    }
  };
  const des = g.nomesLectura;
  const text = (camp, max) => (
    <Camp etiqueta={tx(`camp.${camp}`)} error={errors[camp]}>
      <CampText maxLength={max} autoComplete="off" value={valors[camp]} disabled={des} onChange={(event) => posa(camp, event.target.value)} />
    </Camp>
  );
  return (
    <Pila gap={6}>
      <form onSubmit={desa} noValidate aria-label={tx('editor.titol')}>
        <Pila gap={4}>
          <GrupCamps llegenda={tx('editor.dades')}>
            {text('nom', 80)}
            {text('cognom1', 80)}
            {text('cognom2', 80)}
            {text('malnom', 80)}
            {text('casa', 80)}
            {text('lloc', 120)}
            {text('ofici', 80)}
            <GrupOpcions llegenda={tx('camp.sexe')} valor={valors.sexe} onCanvi={(valor) => posa('sexe', valor)} disabled={des} opcions={opcionsAmb(SEXES, 'sexe')} />
            <CampData etiqueta={tx('camp.naixement')} valor={valors.naixement} error={errors.naixement} desactivat={des} onCanvi={(valor) => posa('naixement', valor)} />
            <CampData etiqueta={tx('camp.defuncio')} valor={valors.defuncio} error={errors.defuncio} desactivat={des} onCanvi={(valor) => posa('defuncio', valor)} />
            <GrupOpcions llegenda={tx('camp.viva')} valor={valors.viva} onCanvi={(valor) => posa('viva', valor)} disabled={des} opcions={opcionsAmb(VIVA, 'viva')} />
            <Camp etiqueta={tx('camp.generacio')}>
              <Selector value={valors.generacio} disabled={des} onChange={(event) => posa('generacio', event.target.value)}
                opcions={[{ valor: '', etiqueta: tx('generacio.cap') }, ...GENERACIONS.map((generacio) => ({ valor: generacio, etiqueta: generacio }))]} />
            </Camp>
            <Camp etiqueta={tx('camp.estat')}>
              <Selector value={valors.estat} disabled={des} onChange={(event) => posa('estat', event.target.value)}
                opcions={ESTATS.map((estat) => ({ valor: estat, etiqueta: `${ETIQUETES_ESTAT[estat]} ${tx(`estat.${estat}`)}` }))} />
            </Camp>
            <Camp etiqueta={tx('camp.notes')}>
              <AreaText maxLength={2000} value={valors.notes} disabled={des} onChange={(event) => posa('notes', event.target.value)} />
            </Camp>
          </GrupCamps>
          <GrupCamps llegenda={tx('editor.fonts')}>
            {valors.fonts.map((font, i) => (
              <CampsFont key={font.id} font={font} n={i + 1} desactivat={des}
                onCanvi={(nova) => posa('fonts', valors.fonts.map((f) => (f.id === font.id ? nova : f)))}
                onLleva={() => posa('fonts', valors.fonts.filter((f) => f.id !== font.id))} />
            ))}
            <Accions>
              <Boto varietat="secundari" disabled={des || valors.fonts.length >= MAX_FONTS} onClick={() => posa('fonts', [...valors.fonts, fontNova()])}>
                {tx('editor.afigFont')}
              </Boto>
            </Accions>
          </GrupCamps>
          {missatge ? <Alerta to={missatge.to}>{missatge.text}</Alerta> : null}
          <Accions><Boto varietat="primari" tipus="submit" disabled={des}>{tx('boto.desa')}</Boto></Accions>
        </Pila>
      </form>
      {persona ? <VinclesPersona persona={persona} /> : <p>{tx('editor.primerDesa')}</p>}
      {persona ? (
        <Accions><Boto varietat="perill" disabled={des} onClick={() => setEsborrant(g.complet)}>{tx('editor.esborra')}</Boto></Accions>
      ) : null}
      <DialegConfirmacio obert={Boolean(esborrant)} destructiu titol={tx('editor.esborra.titol')} etiquetaConfirma={tx('editor.esborra')}
        etiquetaCancela={tx('boto.cancela')} descripcio={tx('editor.esborra.text')} onTanca={() => setEsborrant(null)} onConfirma={esborra} />
    </Pila>
  );
}

export function EditorPersona({ params }) {
  const g = useGenealogia();
  const tx = useT();
  const idioma = useIdioma();
  const perId = usePersonesPerId();
  if (!g.carregat) return null;
  if (!g.complet) {
    return (
      <MarcGenealogia titol={tx('editor.titol')}>
        <EstatBuit titol={tx('entrevista.senseArbre')}>{tx('entrevista.senseArbre.text')}</EstatBuit>
      </MarcGenealogia>
    );
  }
  const id = params?.persona || null;
  const persona = id ? perId.get(id) : null;
  if (id && !persona) {
    return (
      <MarcGenealogia titol={tx('fitxa.noTrobada')}>
        <EstatBuit titol={tx('fitxa.noTrobada')} />
      </MarcGenealogia>
    );
  }
  return (
    <MarcGenealogia titol={persona ? nomVisible(persona, idioma) : tx('editor.nova')}>
      <FormulariPersona key={id || 'nova'} persona={persona} />
    </MarcGenealogia>
  );
}

/* ── FAN Club ────────────────────────────────────────────────────────────── */

const GRUPS_FAN = Object.freeze(['germans', 'padrins', 'testimonis', 'veins', 'parelles']);

export function Colaterals({ params }) {
  const g = useGenealogia();
  const tx = useT();
  const idioma = useIdioma();
  const { ruta } = useApp();
  const perId = usePersonesPerId();
  if (!g.carregat) return null;
  const persona = params?.persona ? perId.get(params.persona) : null;
  if (!g.complet || !persona) {
    return (
      <MarcGenealogia titol={tx('fan.titol')}>
        <Pila gap={4}>
          <p>{tx('fan.explica')}</p>
          <EstatBuit titol={params?.persona ? tx('fitxa.noTrobada') : tx('fan.tria')} />
        </Pila>
      </MarcGenealogia>
    );
  }
  const fan = colateralsFan(g.complet, persona.id);
  return (
    <MarcGenealogia titol={nomVisible(persona, idioma)}>
      <Pila gap={6}>
        <p>{tx('fan.explica')}</p>
        {GRUPS_FAN.map((grup) => {
          const ids = Array.isArray(fan?.[grup]) ? fan[grup] : [];
          return (
            <GrupCamps key={grup} llegenda={tx(`fan.${grup}`)}>
              {ids.length ? ids.map((id) => {
                const altra = perId.get(id);
                return <p key={id}>{altra ? <Link to={ruta('fan', id)}>{nomVisible(altra, idioma)}</Link> : '—'}</p>;
              }) : <p>{tx('fan.cap')}</p>}
            </GrupCamps>
          );
        })}
        <Accions><EnllacBoto a={ruta('arbre', persona.id)}>{tx('entrevista.veuArbre')}</EnllacBoto></Accions>
      </Pila>
    </MarcGenealogia>
  );
}
