/**
 * Arbre.jsx — l'arbre generacional amb la numeració Sosa-Stradonitz.
 *
 *   LlistaAhnentafel  (mig)    les posicions Sosa per generació, també les buides
 *   FitxaPersona      (detall) la fitxa, els números Sosa (implex), fonts i vincles
 *   Inspector         (detall) les contradiccions de dates i els avisos «Cognom ≠ Parentiu»
 *
 * Cada estat va amb el seu text ([CONFIRMAT], [APROXIMAT], [FALTA CONFIRMAR],
 * [CONTRADICCIÓ]), mai només amb color. Les dates porten la seua precisió
 * (1908, ~1908, 1908?) i una data desconeguda ho diu.
 */
import { useMemo, useState } from 'react';
import { Link } from '../../../app/contexts/RouterContext';
import { Accions, Alerta, Boto, EstatBuit, GrupCamps, Insignia, Pila, Taula } from '../../../components/PedraSeca/index.js';
import { useApp } from '../../plataforma/index.js';
import { avisosCognom, estatEfectiu, etiquetaData, urlSegura, useGenealogia } from '../nucli/index.js';
import { nomVisible, textAlerta, textError } from '../textos.js';
import { EnllacBoto, EtiquetaEstat, LlegendaEstats, MarcGenealogia, useEstret, useIdioma, useT } from './comunes.jsx';

/** Les persones de l'arbre per id. */
export function usePersonesPerId() {
  const g = useGenealogia();
  return useMemo(() => new Map((g.complet?.persones || []).map((persona) => [persona.id, persona])), [g.complet]);
}

/** «1908», «~1908», «1908?», «Data desconeguda» o, per a una defunció que no consta, «No consta». */
export function useTextData() {
  const tx = useT();
  const idioma = useIdioma();
  return (data) => {
    if (!data) return tx('data.noConsta');
    return etiquetaData(data, idioma) || tx('data.desconeguda');
  };
}

const titolGeneracio = (generacio, tx) => (generacio >= 1 && generacio <= 4 ? tx(`arbre.generacio.${generacio}`) : tx('arbre.generacio.n', { n: generacio }));

export function LlistaAhnentafel() {
  const g = useGenealogia();
  const tx = useT();
  const idioma = useIdioma();
  const { ruta } = useApp();
  const estret = useEstret();
  const perId = usePersonesPerId();
  const textData = useTextData();
  if (!g.carregat) return null;
  if (!g.complet) {
    return (
      <MarcGenealogia titol={tx('arbre.titol')} columna="mig">
        <EstatBuit titol={tx('entrevista.senseArbre')}>{tx('entrevista.senseArbre.text')}</EstatBuit>
      </MarcGenealogia>
    );
  }
  if (!g.sosa || !g.complet.arbre.arrelId) {
    return (
      <MarcGenealogia titol={tx('arbre.titol')} columna="mig">
        <EstatBuit titol={tx('arbre.senseArrel')}
          accio={<Accions><EnllacBoto a={ruta('entrevista')}>{tx('entrevista.titol')}</EnllacBoto><EnllacBoto a={ruta('persones')}>{tx('persones.titol')}</EnllacBoto></Accions>}>
          {tx('arbre.senseArrel.text')}
        </EstatBuit>
      </MarcGenealogia>
    );
  }
  const generacions = [];
  for (const fila of g.sosa.files) {
    const darrera = generacions[generacions.length - 1];
    if (darrera && darrera.generacio === fila.generacio) darrera.files.push(fila);
    else generacions.push({ generacio: fila.generacio, files: [fila] });
  }
  const eines = estret ? <Accions><EnllacBoto a={ruta('arbre', 'inspector')}>{tx('arbre.inspector')}</EnllacBoto></Accions> : null;
  return (
    <MarcGenealogia titol={tx('arbre.titol')} columna="mig" eines={eines}>
      <Pila gap={6}>
        <p>{tx('arbre.explica')}</p>
        {generacions.map(({ generacio, files }) => (
          <Taula key={generacio} titol={titolGeneracio(generacio, tx)} densa>
            <caption>{titolGeneracio(generacio, tx)}</caption>
            <thead>
              <tr>
                <th scope="col">{tx('arbre.col.sosa')}</th>
                <th scope="col">{tx('arbre.col.persona')}</th>
                <th scope="col">{tx('arbre.col.naixement')}</th>
                <th scope="col">{tx('arbre.col.defuncio')}</th>
                <th scope="col">{tx('arbre.col.estat')}</th>
              </tr>
            </thead>
            <tbody>
              {files.map((fila) => {
                const persona = fila.personaId ? perId.get(fila.personaId) : null;
                return (
                  <tr key={fila.sosa}>
                    <th scope="row">{fila.sosa}</th>
                    <td>
                      {persona ? (
                        <>
                          <Link to={ruta('arbre', persona.id)}>{nomVisible(persona, idioma)}</Link>
                          {fila.ambigu ? ` ${tx('arbre.ambigu')}` : null}
                        </>
                      ) : <Link to={ruta('persones', 'nova')}>{tx('arbre.falta')}</Link>}
                    </td>
                    <td>{persona ? textData(persona.naixement) : null}</td>
                    <td>{persona ? textData(persona.defuncio) : null}</td>
                    <td>{persona ? <EtiquetaEstat estat={estatEfectiu(persona, g.alertes)} /> : null}</td>
                  </tr>
                );
              })}
            </tbody>
          </Taula>
        ))}
        <LlegendaEstats />
      </Pila>
    </MarcGenealogia>
  );
}

/* El vincle vist des de la persona `id`: el nom del paper de l'altra persona. */
export function paperDeLAltra(relacio, id) {
  const esDe = relacio.de === id;
  switch (relacio.tipus) {
    case 'progenitor': return esDe ? 'rel.fill' : 'rel.progenitor';
    case 'padri': return esDe ? 'rel.fillol' : 'rel.padri';
    case 'testimoni': return esDe ? 'rel.testimoniDe' : 'rel.testimoni';
    case 'parella': return 'rel.parella';
    case 'germa': return 'rel.germa';
    default: return 'rel.vei';
  }
}

export function FitxaPersona({ params }) {
  const g = useGenealogia();
  const tx = useT();
  const idioma = useIdioma();
  const { ruta } = useApp();
  const perId = usePersonesPerId();
  const textData = useTextData();
  const [error, setError] = useState(null);
  if (!g.carregat) return null;
  const persona = perId.get(params?.persona);
  if (!persona) {
    return (
      <MarcGenealogia titol={tx('fitxa.noTrobada')}>
        <EstatBuit titol={tx('fitxa.noTrobada')} />
      </MarcGenealogia>
    );
  }
  const numeros = g.sosa?.perPersona?.get(persona.id) || [];
  const vincles = (g.complet?.relacions || []).filter((relacio) => relacio.de === persona.id || relacio.a === persona.id);
  const esArrel = g.complet?.arbre?.arrelId === persona.id;
  const posaArrel = () => g.posaArrel(persona.id).then(() => setError(null), (e) => setError(textError(e, idioma)));
  const detalls = [persona.malnom && `«${persona.malnom}»`, persona.casa, persona.lloc, persona.ofici].filter(Boolean);
  return (
    <MarcGenealogia titol={nomVisible(persona, idioma)}>
      <Pila gap={6}>
        <Pila gap={2}>
          <p><EtiquetaEstat estat={estatEfectiu(persona, g.alertes)} /></p>
          {detalls.length ? <p>{detalls.join(' · ')}</p> : null}
          <p>{`${tx('camp.naixement')}: ${textData(persona.naixement)} · ${tx('camp.defuncio')}: ${textData(persona.defuncio)}`}</p>
          <p>{numeros.length ? tx('fitxa.sosa', { numeros: numeros.join(', ') }) : tx('fitxa.senseSosa')}</p>
          {esArrel ? <p>{tx('fitxa.esArrel')}</p> : null}
        </Pila>
        <GrupCamps llegenda={tx('fitxa.fonts')}>
          {persona.fonts?.length ? persona.fonts.map((font) => {
            const url = urlSegura(font.url);
            return (
              <Pila key={font.id} gap={1}>
                <p><strong>{font.titol || tx(`font.${font.tipus}`)}</strong>{` · ${tx(`font.${font.tipus}`)}`}</p>
                {font.citacio ? <p>{font.citacio}</p> : null}
                {font.transcripcio ? <p>{font.transcripcio}</p> : null}
                {url ? <p><a href={url} target="_blank" rel="noopener noreferrer">{tx('fitxa.obri')}</a></p> : null}
              </Pila>
            );
          }) : <p>{tx('fitxa.senseFonts')}</p>}
        </GrupCamps>
        <GrupCamps llegenda={tx('fitxa.vincles')}>
          {vincles.length ? vincles.map((relacio) => {
            const altra = perId.get(relacio.de === persona.id ? relacio.a : relacio.de);
            return (
              <p key={relacio.id}>
                {`${tx(paperDeLAltra(relacio, persona.id))}: `}
                {altra ? <Link to={ruta('arbre', altra.id)}>{nomVisible(altra, idioma)}</Link> : '—'}
                {' '}<EtiquetaEstat estat={relacio.estat} />
              </p>
            );
          }) : <p>{tx('fitxa.senseVincles')}</p>}
        </GrupCamps>
        {error ? <Alerta to="error">{error}</Alerta> : null}
        <Accions>
          <EnllacBoto a={ruta('persones', persona.id)}>{tx('fitxa.edita')}</EnllacBoto>
          <EnllacBoto a={ruta('fan', persona.id)}>{tx('fitxa.fan')}</EnllacBoto>
          {esArrel ? null : <Boto varietat="secundari" disabled={g.nomesLectura} onClick={posaArrel}>{tx('fitxa.arrel')}</Boto>}
        </Accions>
      </Pila>
    </MarcGenealogia>
  );
}

export function Inspector() {
  const g = useGenealogia();
  const tx = useT();
  const idioma = useIdioma();
  const perId = usePersonesPerId();
  const cognoms = useMemo(() => (g.complet ? avisosCognom(g.complet) : []), [g.complet]);
  if (!g.carregat) return null;
  const nomDe = (id) => nomVisible(perId.get(id), idioma) || '—';
  const alertes = g.alertes || [];
  return (
    <MarcGenealogia titol={tx('inspector.titol')}>
      <Pila gap={6}>
        {alertes.length === 0 && cognoms.length === 0 ? <p>{tx('inspector.cap')}</p> : null}
        {alertes.length ? (
          <GrupCamps llegenda={tx('inspector.alertes')}>
            {alertes.map((alerta, i) => (
              <Alerta key={`${alerta.tipus}-${alerta.personaId}-${alerta.altraId || ''}-${i}`} viva={false}
                to={alerta.gravetat === 'contradiccio' ? 'error' : 'avis'}
                titol={alerta.gravetat === 'contradiccio' ? <EtiquetaEstat estat="contradiccio" /> : <Insignia to="avis">{tx('gravetat.avis')}</Insignia>}>
                {textAlerta(alerta, idioma, nomDe)}
              </Alerta>
            ))}
          </GrupCamps>
        ) : null}
        {cognoms.length ? (
          <GrupCamps llegenda={tx('inspector.cognoms')}>
            {cognoms.map(({ a, b }) => <p key={`${a}-${b}`}>{tx('inspector.cognom', { a: nomDe(a), b: nomDe(b) })}</p>)}
          </GrupCamps>
        ) : null}
        <LlegendaEstats />
      </Pila>
    </MarcGenealogia>
  );
}
