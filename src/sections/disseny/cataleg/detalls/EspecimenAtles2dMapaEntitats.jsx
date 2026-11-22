/**
 * EspecimenAtles2dMapaEntitats.jsx — 3. Mapa 2D de les 5 entitats (60 cel·les).
 *
 * Atles 2D (ordre del Mestre del 21-11-2026 a les 23:28; pla 261121_2335, Carril 1, Tram 1, punt b),
 * integrat el 22-11-2026 a /disseny?categoria=atles-2d&item=atles-2d-mapa-entitats. És la pestanya
 * «Mapa de les 5 entitats» de la maqueta ATLES_2D_SOC_DE_POBLE_MERCAT_I_ENTITATS.html: el resum de les
 * cinc entitats, la graella 12 × 5 amb el filtre d'estat i «Només les corregides», el visor de la cel·la
 * amb l'evidència fitxer:línia, l'estatut propi de l'Ajuntament (city_hall) i la taula de les rutes reals.
 * La graella és una taula de veres (capçaleres de columna i de fila) amb un botó per cel·la; es desplaça
 * dins de la seua caixa i no eixampla mai la pàgina. A l'iPad vertical, la caixa s'aprima (container
 * query del full diferit: capçalera de fila estreta i noms d'entitat curts) i la vista «Per entitat»
 * (una entitat triada i les seues 12 cel·les en llista) es llig sense cap desplaçament lateral.
 * La columna «Entitat» de les rutes reals diu el nom de l'entitat, no l'id de la matriu.
 */
import { useMemo, useRef, useState } from 'react';
import { Fila, Interruptor, Pila, PillToggle, Taula } from '../../../../components/PedraSeca/index.js';
import { useFullDiferit } from '../../../../config/fullDiferit.js';
import cssAtles from '../../../../css/diferit-atles-2d.css?inline';
import { ATLES } from '../dades/atles2dDades.js';
import {
  BarraApilada, GLIF_ESTAT, Llegenda, NOMS_ESTAT, NotaDatacio, ORDRE_MAPA, PeuAtles, PindolaEstat, TextFont, celles, compta,
  dataDeLaFotografia, dataDeVerificacio, esCorregida, nomsDEntitat, senseNumero, versioCurta
} from './atles2dComu.jsx';

const CLASSE_CEL = Object.freeze({
  fet: 'sdp-atles__cel sdp-atles__cel--fet',
  a_mitges: 'sdp-atles__cel sdp-atles__cel--mitges',
  falta: 'sdp-atles__cel sdp-atles__cel--falta',
  no_aplica: 'sdp-atles__cel sdp-atles__cel--na'
});
const CLASSE_CEL_APAGADA = Object.freeze({
  fet: 'sdp-atles__cel sdp-atles__cel--fet sdp-atles__cel--apagada',
  a_mitges: 'sdp-atles__cel sdp-atles__cel--mitges sdp-atles__cel--apagada',
  falta: 'sdp-atles__cel sdp-atles__cel--falta sdp-atles__cel--apagada',
  no_aplica: 'sdp-atles__cel sdp-atles__cel--na sdp-atles__cel--apagada'
});
const AJUNTAMENT = 'ajuntament_entitat_oficial';
/* La columna «Què cal planificar abans de picar codi» de la maqueta (no ve de la matriu: és planificació). */
const PLANIFICAR_AJUNTAMENT = Object.freeze([
  'Segell institucional verificat (DIR3 o domini oficial) i com es revoca.',
  'Tauler oficial de bàndols i edictes, amb data de publicació, vigència i arxiu consultable.',
  'Transparència: pressupostos, actes i contractes com a documents oberts, fora del feed.',
  'Rols delegats per regidoria i traspàs ordenat després d’unes eleccions.',
  'Separació nítida entre la veu política (grup municipal) i el servei públic (l’Ajuntament).',
  'Avisos d’emergència per push: quan s’encén `push_poble_actiu` i qui pot fer-ho.',
  'Accessibilitat i llengua oficial com a obligació legal, no com a preferència.'
]);

/** «1. Usuari / Veí» → «1. Usuari»: el nom curt de la capçalera quan la caixa és estreta. */
const nomCurt = (titol) => String(titol || '').split(' / ')[0];
const VISTES = Object.freeze([{ valor: 'graella', text: 'Graella 12 × 5' }, { valor: 'entitat', text: 'Per entitat' }]);
/* v1.2.19 · Gauntlet R2 (L4R2-05): el lector de pantalla també sap quines cel·les queden fora del ressalt. */
const FORA_DEL_FILTRE = ', fora del filtre';


/** La primera cel·la corregida (la que obri el visor en entrar), o la primera de totes. */
function primeraCella(mapa) {
  for (let f = 0; f < mapa.files.length; f += 1) {
    for (const entitat of mapa.entitats) {
      if (esCorregida(mapa.files[f].cel_les?.[entitat.id])) return { f, e: entitat.id };
    }
  }
  return { f: 0, e: mapa.entitats[0]?.id };
}

export default function EspecimenAtles2dMapaEntitats() {
  const arrel = useRef(null);
  useFullDiferit(arrel, 'atles-2d', cssAtles);
  const mapa = ATLES.entitats;
  const subtitols = ATLES.entitats_gemini || {};
  const [ressalt, setRessalt] = useState('');
  const [nomesCorregides, setNomesCorregides] = useState(false);
  const [vista, setVista] = useState('graella');
  const [triada, setTriada] = useState(() => primeraCella(mapa));

  const totes = useMemo(() => celles(mapa), [mapa]);
  const perEstat = compta(totes, 'estat');
  const corregides = totes.filter(esCorregida).length;
  const fila = mapa.files[triada.f];
  const entitat = mapa.entitats.find((e) => e.id === triada.e);
  const cella = fila?.cel_les?.[triada.e];
  const ajuntament = mapa.files.map((f) => ({ fila: f, cella: f.cel_les?.[AJUNTAMENT] })).filter((x) => x.cella);
  const apagadaSi = (c) => Boolean((ressalt && c.estat !== ressalt) || (nomesCorregides && !esCorregida(c)));
  const classeDe = (c) => (apagadaSi(c) ? CLASSE_CEL_APAGADA : CLASSE_CEL)[c.estat] || CLASSE_CEL.no_aplica;

  return (
    <div ref={arrel} className="sdp-atles">
      <section className="sdp-atles__bloc">
        <h2 id="atles-mapa-resum">Les cinc pàgines d’entitat, en dues dimensions</h2>
        <p>
          Files: {mapa.files.length} dimensions (rutes, alta, anatomia, aparador, xat, governança, federació, micro-apps,
          bàndols, confiança, privacitat i requisits legals). Columnes: les {mapa.entitats.length} entitats. Cada cel·la diu què
          hi havia al codi de la {versioCurta()} el {dataDeLaFotografia()}, amb l’evidència <code>fitxer:línia</code>. Gemini va
          fer la primera passada; una verificació independent n’ha corregit {mapa.resum.canvis_respecte_gemini} cel·les.
        </p>
        {/* v1.2.19 · Gauntlet R2 (L4R2-04): les cel·les i les línies citades són les del codi d'eixe dia. */}
        <NotaDatacio />
        <div className="sdp-atles__fitxa">
          <p className="sdp-atles__etiqueta">Les {totes.length} cel·les</p>
          <BarraApilada recompte={perEstat} ordre={ORDRE_MAPA} etiqueta="Cel·les del mapa per estat" />
          <Llegenda recompte={perEstat} ordre={ORDRE_MAPA} />
          <p className="sdp-atles__suau"><TextFont text={String(mapa.criteri || '').replace(/a_mitges/g, '«a mitges»')} /></p>
        </div>
        <ul className="sdp-atles__graella">
          {mapa.entitats.map((e) => {
            const seues = mapa.files.map((f) => f.cel_les?.[e.id]).filter(Boolean);
            return (
              <li key={e.id} className="sdp-atles__fitxa">
                <h3>{e.titol}</h3>
                {subtitols[e.id]?.subtitol ? <p className="sdp-atles__suau"><TextFont text={subtitols[e.id].subtitol} /></p> : null}
                <div><PindolaEstat estat={e.estat_global} /></div>
                <BarraApilada recompte={compta(seues, 'estat')} ordre={ORDRE_MAPA} etiqueta={e.titol} />
                <p className="sdp-atles__mono"><TextFont text={e.ruta_actual} /></p>
                <p><TextFont text={e.nota} /></p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="sdp-atles__bloc">
        <h2 id="atles-mapa-graella">La graella {mapa.files.length} × {mapa.entitats.length}</h2>
        <p>
          Toca una cel·la per a llegir-ne la nota i l’evidència al visor de davall. Els filtres només ressalten: no amaguen
          cap cel·la. En una pantalla estreta, la vista «Per entitat» posa les {mapa.files.length} cel·les d’una entitat en llista.
        </p>
        <div className="sdp-atles__filtres">
          <Pila gap={1}>
            <span className="sdp-atles__etiqueta" aria-hidden="true">Vista</span>
            <PillToggle etiqueta="Vista" valor={vista} onCanvi={setVista} opcions={VISTES} />
          </Pila>
          <Pila gap={1}>
            <span className="sdp-atles__etiqueta" aria-hidden="true">Ressalta un estat</span>
            <PillToggle etiqueta="Ressalta un estat" valor={ressalt} onCanvi={setRessalt}
              opcions={[{ valor: '', text: 'Tots' }, ...ORDRE_MAPA.map((estat) => ({ valor: estat, text: NOMS_ESTAT[estat], icona: GLIF_ESTAT[estat] }))]} />
          </Pila>
          <Interruptor etiqueta={`Només les corregides (${corregides})`} actiu={nomesCorregides} onCanvi={setNomesCorregides} />
        </div>
        {vista === 'graella' ? (
          <Taula titol="Mapa 2D: dimensions per entitat" className="sdp-atles__mapa">
            <thead>
              <tr>
                <th scope="col">Dimensió</th>
                {mapa.entitats.map((e) => (
                  <th key={e.id} scope="col">
                    <span className="sdp-atles__nom-llarg">{e.titol}</span>
                    <span className="sdp-atles__nom-curt">{nomCurt(e.titol)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mapa.files.map((f, indexFila) => (
                <tr key={f.dimensio_id}>
                  <th scope="row">{f.titol}</th>
                  {mapa.entitats.map((e) => {
                    const c = f.cel_les?.[e.id] || { estat: 'no_aplica' };
                    const premuda = triada.f === indexFila && triada.e === e.id;
                    return (
                      <td key={e.id}>
                        <button type="button" className={classeDe(c)}
                          aria-pressed={premuda ? 'true' : 'false'} onClick={() => setTriada({ f: indexFila, e: e.id })}>
                          <span><span className="sdp-atles__cel-glif" aria-hidden="true">{GLIF_ESTAT[c.estat]}</span> {NOMS_ESTAT[c.estat] || c.estat}</span>
                          {esCorregida(c) ? <span className="sdp-atles__cel-marca">Corregida · Gemini: {NOMS_ESTAT[c.estat_gemini] || c.estat_gemini}</span> : null}
                          <span className="sdp-sr-only">, {f.titol} · {e.titol}{apagadaSi(c) ? FORA_DEL_FILTRE : ''}</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </Taula>
        ) : (
          <div className="sdp-atles__fitxa">
            <Pila gap={1}>
              <span className="sdp-atles__etiqueta" aria-hidden="true">Entitat</span>
              <PillToggle etiqueta="Entitat" valor={triada.e} onCanvi={(id) => setTriada((previ) => ({ f: previ.f, e: id }))}
                opcions={mapa.entitats.map((e) => ({ valor: e.id, text: nomCurt(e.titol) }))} />
            </Pila>
            <h3 id="atles-mapa-per-entitat">Les {mapa.files.length} cel·les de {entitat?.titol}</h3>
            <ul className="sdp-atles__graella" aria-labelledby="atles-mapa-per-entitat">
              {mapa.files.map((f, indexFila) => {
                const c = f.cel_les?.[triada.e] || { estat: 'no_aplica' };
                return (
                  <li key={f.dimensio_id}>
                    <button type="button" className={classeDe(c)}
                      aria-pressed={triada.f === indexFila ? 'true' : 'false'} onClick={() => setTriada((previ) => ({ f: indexFila, e: previ.e }))}>
                      <span className="sdp-atles__cel-dimensio">{f.titol}</span>
                      <span><span className="sdp-atles__cel-glif" aria-hidden="true">{GLIF_ESTAT[c.estat]}</span> {NOMS_ESTAT[c.estat] || c.estat}</span>
                      {esCorregida(c) ? <span className="sdp-atles__cel-marca">Corregida · Gemini: {NOMS_ESTAT[c.estat_gemini] || c.estat_gemini}</span> : null}
                      {apagadaSi(c) ? <span className="sdp-sr-only">{FORA_DEL_FILTRE}</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        {cella && fila && entitat ? (
          <div className="sdp-atles__fitxa sdp-atles__detall" aria-live="polite">
            <p className="sdp-atles__etiqueta">Cel·la triada</p>
            <Fila gap={2}>
              <h3>{fila.titol} · {entitat.titol}</h3>
              <PindolaEstat estat={cella.estat} />
              {esCorregida(cella) ? <span className="sdp-atles__suau">Gemini deia: {NOMS_ESTAT[cella.estat_gemini] || cella.estat_gemini}</span> : null}
            </Fila>
            <p><TextFont text={cella.nota} /></p>
            {cella.canvi ? <p><strong>Per què canvia:</strong> <TextFont text={cella.canvi} /></p> : null}
            {(cella.evidencia || []).length ? (
              <>
                <p className="sdp-atles__etiqueta">Evidència al codi de la {versioCurta()}</p>
                <ul className="sdp-atles__evidencies">
                  {cella.evidencia.map((cami, index) => <li key={`${index}-${cami}`} className="sdp-atles__mono">{cami}</li>)}
                </ul>
              </>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="sdp-atles__bloc">
        <h2 id="atles-mapa-ajuntament">Per què l’Ajuntament necessita un estatut propi</h2>
        <p>
          És la pàgina amb més requisits que no té cap altra entitat. El tipus <code>city_hall</code> ja existix a la base de
          dades i el servidor no deixa crear-lo ni transferir-lo: es reclama. Però no hi ha cap pàgina d’Ajuntament, cap
          pantalla per a aprovar la reclamació i cap tauler oficial.
        </p>
        <ul className="sdp-atles__graella sdp-atles__graella--ampla">
          <li className="sdp-atles__fitxa">
            <h3>Què hi ha ja al codi</h3>
            <ul>
              {ajuntament.filter(({ cella: c }) => c.estat !== 'falta').map(({ fila: f, cella: c }) => (
                <li key={f.dimensio_id}><strong>{senseNumero(f.titol)}:</strong> <TextFont text={c.nota} /></li>
              ))}
            </ul>
          </li>
          <li className="sdp-atles__fitxa">
            <h3>Què cal planificar abans de picar codi</h3>
            <ul>{PLANIFICAR_AJUNTAMENT.map((text) => <li key={text}><TextFont text={text} /></li>)}</ul>
          </li>
          <li className="sdp-atles__fitxa">
            <h3>Què falta del tot</h3>
            <ul>
              {ajuntament.filter(({ cella: c }) => c.estat === 'falta').map(({ fila: f, cella: c }) => (
                <li key={f.dimensio_id}><strong>{senseNumero(f.titol)}:</strong> <TextFont text={c.nota} /></li>
              ))}
            </ul>
          </li>
        </ul>
      </section>

      <section className="sdp-atles__bloc">
        <h2 id="atles-mapa-rutes">Les {(mapa.rutes_reals || []).length} rutes reals de cada entitat</h2>
        <Taula titol="Les rutes reals de cada entitat">
          <thead><tr><th scope="col">Ruta</th><th scope="col">Component</th><th scope="col">Entitat</th></tr></thead>
          <tbody>
            {(mapa.rutes_reals || []).map((ruta, index) => (
              <tr key={`${index}-${ruta.ruta}`}>
                <td><code>{ruta.ruta}</code></td>
                <td className="sdp-atles__mono">{ruta.component}</td>
                <td>{nomsDEntitat(ruta.entitat, mapa.entitats)}</td>
              </tr>
            ))}
          </tbody>
        </Taula>
        {/* v1.2.19 · Gauntlet R2 (L4R2-04): la marca de `date` de la verificació, en valencià. */}
        <p className="sdp-atles__recompte">Verificat el {dataDeVerificacio(mapa.verificat_el)} · {mapa.base_codi}</p>
      </section>

      <PeuAtles actual="atles-2d-mapa-entitats" />
    </div>
  );
}
