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
import { Printer } from 'lucide-react';
import { Link } from '../../../app/contexts/RouterContext';
import { Accions, Alerta, Boto, EstatBuit, GrupCamps, Insignia, PillToggle, Pila, Taula } from '../../../components/PedraSeca/index.js';
import { useApp } from '../../plataforma/index.js';
import { avisosCognom, estatEfectiu, etiquetaData, urlSegura, useGenealogia } from '../nucli/index.js';
import { nomVisible, textAlerta, textError } from '../i18nGenealogia.js';
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

const TEXTOS_ARBRE_GRAFIC = Object.freeze({
  ca: Object.freeze({
    vista: 'Format de vista de l’arbre',
    taula: 'Taula Sosa',
    grafic: 'Arbre visual (4 generacions)',
    imprimix: 'Imprimix arbre (A4 apaïsat)',
    ariaSvg: 'Arbre genealògic gràfic de quatre generacions (numeració Sosa 1 a 15)',
    sensePersona: 'Per completar'
  }),
  es: Object.freeze({
    vista: 'Formato de vista del árbol',
    taula: 'Tabla Sosa',
    grafic: 'Árbol visual (4 generaciones)',
    imprimix: 'Imprimir árbol (A4 apaisado)',
    ariaSvg: 'Árbol genealógico gráfico de cuatro generaciones (numeración Sosa 1 a 15)',
    sensePersona: 'Por completar'
  }),
  en: Object.freeze({
    vista: 'Tree display format',
    taula: 'Ahnentafel table',
    grafic: 'Visual tree (4 generations)',
    imprimix: 'Print tree (A4 landscape)',
    ariaSvg: 'Four-generation family tree chart (Sosa numbering 1 to 15)',
    sensePersona: 'To be completed'
  }),
  eu: Object.freeze({
    vista: 'Zuhaitzaren ikuspegi-formatua',
    taula: 'Sosa taula',
    grafic: 'Zuhaitz bisuala (4 belaunaldi)',
    imprimix: 'Inprimatu zuhaitza (A4 etzana)',
    ariaSvg: 'Lau belaunaldiko zuhaitz genealogiko grafikoa (Sosa 1etik 15era)',
    sensePersona: 'Osatzeko'
  }),
  gl: Object.freeze({
    vista: 'Formato de vista da árbore',
    taula: 'Táboa Sosa',
    grafic: 'Árbore visual (4 xeracións)',
    imprimix: 'Imprimir árbore (A4 apaisado)',
    ariaSvg: 'Árbore xenealóxica gráfica de catro xeracións (numeración Sosa 1 a 15)',
    sensePersona: 'Por completar'
  })
});

function textosArbreGrafic(idioma = 'ca') {
  const codi = String(idioma || 'ca').toLowerCase().slice(0, 2);
  return Object.hasOwn(TEXTOS_ARBRE_GRAFIC, codi) ? TEXTOS_ARBRE_GRAFIC[codi] : TEXTOS_ARBRE_GRAFIC.ca;
}

/* Posicions netes (x, y) per a les 4 generacions Sosa 1..15 en llenç A4 apaïsat (960 × 560). */
const POSICIONS_SOSA = Object.freeze({
  1: { x: 20, y: 245 },
  2: { x: 255, y: 115 },
  3: { x: 255, y: 375 },
  4: { x: 490, y: 50 },
  5: { x: 490, y: 180 },
  6: { x: 490, y: 310 },
  7: { x: 490, y: 440 },
  8: { x: 725, y: 15 },
  9: { x: 725, y: 85 },
  10: { x: 725, y: 150 },
  11: { x: 725, y: 215 },
  12: { x: 725, y: 280 },
  13: { x: 725, y: 345 },
  14: { x: 725, y: 410 },
  15: { x: 725, y: 475 }
});

function ArbreGrafic4Gen({ files, perId, idioma, textData }) {
  const tg = textosArbreGrafic(idioma);
  const perSosa = new Map(files.filter((f) => f.sosa >= 1 && f.sosa <= 15).map((f) => [f.sosa, f]));
  const ample = 210;
  const alt = 56;
  const arestes = [];
  for (let sosa = 1; sosa <= 7; sosa += 1) {
    const origen = POSICIONS_SOSA[sosa];
    for (const fill of [sosa * 2, sosa * 2 + 1]) {
      const desti = POSICIONS_SOSA[fill];
      if (!desti) continue;
      const x1 = origen.x + ample;
      const y1 = origen.y + alt / 2;
      const x2 = desti.x;
      const y2 = desti.y + alt / 2;
      const xm = (x1 + x2) / 2;
      arestes.push(`M ${x1} ${y1} H ${xm} V ${y2} H ${x2}`);
    }
  }

  return (
    <Pila gap={2}>
      <svg viewBox="0 0 960 550" role="img" aria-label={tg.ariaSvg} data-testid="arbre-grafic-4gen" data-sdp-arbre="llenc">
        <g data-sdp-arbre="branques" fill="none" stroke="currentColor" strokeWidth="1.5">
          {arestes.map((d, i) => <path key={i} d={d} />)}
        </g>
        {Object.entries(POSICIONS_SOSA).map(([sosaStr, pos]) => {
          const sosa = Number(sosaStr);
          const fila = perSosa.get(sosa);
          const persona = fila?.personaId ? perId.get(fila.personaId) : null;
          const nom = persona ? nomVisible(persona, idioma) : tg.sensePersona;
          const dates = persona ? [textData(persona.naixement), textData(persona.defuncio)].filter(Boolean).join(' – ') : '';
          return (
            <g key={sosa} transform={`translate(${pos.x}, ${pos.y})`} data-sdp-arbre="node">
              <rect width={ample} height={alt} rx="8" ry="8" data-sdp-arbre="caixa" />
              <text x="10" y="21" data-sdp-arbre="nom">{`${sosa}. ${nom.slice(0, 24)}`}</text>
              {dates ? <text x="10" y="42" data-sdp-arbre="meta">{dates.slice(0, 28)}</text> : null}
            </g>
          );
        })}
      </svg>
    </Pila>
  );
}

export function LlistaAhnentafel() {
  const g = useGenealogia();
  const tx = useT();
  const idioma = useIdioma();
  const tg = textosArbreGrafic(idioma);
  const { ruta } = useApp();
  const estret = useEstret();
  const perId = usePersonesPerId();
  const textData = useTextData();
  const [formatVista, setFormatVista] = useState('taula');
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
        <Accions>
          <PillToggle
            etiqueta={tg.vista}
            valor={formatVista}
            onCanvi={setFormatVista}
            opcions={[
              { valor: 'taula', text: tg.taula },
              { valor: 'grafic', text: tg.grafic }
            ]}
          />
          <Boto
            varietat="secundari"
            icona={Printer}
            onClick={() => {
              if (formatVista !== 'grafic') setFormatVista('grafic');
              if (typeof window !== 'undefined' && typeof window.print === 'function') window.print();
            }}
          >
            {tg.imprimix}
          </Boto>
        </Accions>
        {formatVista === 'grafic' ? (
          <ArbreGrafic4Gen files={g.sosa.files} perId={perId} idioma={idioma} textData={textData} />
        ) : generacions.map(({ generacio, files }) => (
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
