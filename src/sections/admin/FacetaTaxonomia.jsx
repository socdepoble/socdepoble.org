/**
 * FacetaTaxonomia.jsx — La faceta «Etiquetes i categories» del Tauler de
 * superadmin.
 *
 * Onada 11 (261010; prompt 261010_1730, tasca 2; brainstorming 261009_2005
 * §2-§4, F2; front D2) · La superadmin personalitza, per a este poble:
 *   (a) les etiquetes de cada pàgina del sistema (SYSTEM_PAGES): text i
 *       classe del conjunt tancat (CLASSES_ETIQUETA), afegir i llevar;
 *   (b) les categories i etiquetes de sèrie que s'afigen a les del Bloc
 *       (categoriesBase / etiquetesBase, src/data/personalitzacio.js);
 *   (c) «Desar» → adminDesaPersonalitzacio({ clau: 'taxonomia', payload,
 *       versio: la vigent o 0 }), amb Alerta d'èxit, de conflicte de versió
 *       («Algú ha desat una versió nova: recarrega») i de segon factor;
 *   (d) «Historial» → adminHistorialPersonalitzacio('taxonomia') en una
 *       Taula amb «Restaurar» (desa el payload vell com a versió nova);
 *   (e) «Exporta JSON» → descàrrega d'un Blob (com DetallPrivacitat).
 * Sense la capacitat 'personalitzacio' (un node que no l'oferix), un
 * EstatBuit honest, com SenseCapacitat d'AdminSection.
 *
 * El payload que es desa només nomena les pàgines que difereixen de les
 * etiquetes de sèrie (PAGE_COPY): tornar una pàgina a les de sèrie és
 * deixar de personalitzar-la. La versió amb què s'edita és la que hi havia en
 * obrir la faceta (o l'última desada ací): si el servidor en té una més nova,
 * el conflicte es diu i «Recarregar» torna a llegir el contingut core i
 * reinicia l'esborrany. Les etiquetes noves arriben a tota l'app pel
 * pageCopy de CoreContentContext (refresh).
 *
 * NO toca AdminSection.jsx: l'integrador la cableja amb FACETA_TAXONOMIA.
 * Només peces de Pedra Seca; el Bloc d'ací és maquetació local (com
 * BlocPerfil), no un component nou del catàleg. Textos en valencià, literals
 * (només els veu la superadmin, com la resta del Tauler).
 */
import { useEffect, useId, useRef, useState } from 'react';
import { Download, History, Plus, RotateCcw, Save, Tags, Trash2, X } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { Alerta, Boto, Camp, CampText, Carregant, EstatBuit, Selector, Taula } from '../../components/PedraSeca/index.js';
import { adminDesaPersonalitzacio, adminHistorialPersonalitzacio, teCapacitat } from '../../data/backendPort.js';
import { useCoreContent } from '../../app/contexts/CoreContentContext.jsx';
import { SYSTEM_PAGES } from '../../config/systemPages.js';
import { PAGE_COPY } from '../text/pageContent.js';
import {
  CATEGORIES_BASE, CLASSES_ETIQUETA, ETIQUETES_BASE, MAX_TEXT, VERSIO_TAXONOMIA, validaTaxonomia
} from '../../data/personalitzacio.js';
import { CODI_PERSONALITZACIO, MISSATGE_PERSONALITZACIO } from '../../data/errorsBackend.js';

/** La faceta, per a qui la cableja al menú del Tauler. */
export const FACETA_TAXONOMIA = Object.freeze({ id: 'taxonomia', titol: 'Etiquetes i categories', icona: Tags });

const CLAU = 'taxonomia';
const CLASSE_PER_DEFECTE = 'sdp-badge-tag';
const LEAD = 'Les etiquetes de cada pàgina del sistema i les categories i etiquetes de sèrie del Bloc de notes, per a este poble. Cada «Desar» crea una versió nova; des de l’historial se’n pot restaurar una d’anterior.';
const TEXT_SENSE_CAPACITAT = 'Este node no admet personalització';
const TEXT_CONFLICTE = 'Algú ha desat una versió nova: recarrega';

/* El nom llegible de cada classe del conjunt tancat (modules.css, «Sistema de Badges Universals»). */
const NOM_DE_CLASSE = Object.freeze({
  'sdp-badge-system': 'Sistema (blau fosc)',
  'sdp-badge-category': 'Categoria (blau clar)',
  'sdp-badge-tag': 'Etiqueta (taronja clar)',
  'sdp-badge-accent': 'Accent (taronja)',
  'sdp-badge-neutral': 'Neutra (gris)',
  'sdp-badge-buit': 'Buida (només contorn)'
});
const OPCIONS_CLASSE = CLASSES_ETIQUETA.map((valor) => ({ valor, etiqueta: NOM_DE_CLASSE[valor] || valor }));
const CLASSES = new Set(CLASSES_ETIQUETA);

const netejaTextos = (valors) => [...new Set((Array.isArray(valors) ? valors : []).map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean))];

/* Les etiquetes d'una pàgina en la forma de l'editor: { text, className } amb
   la classe dins del conjunt (una de text, com pinta UniversalCard, és 'tag'). */
function normalitza(labels) {
  return (Array.isArray(labels) ? labels : []).map((label) => (typeof label === 'string'
    ? { text: label, className: CLASSE_PER_DEFECTE }
    : { text: String(label?.text ?? ''), className: CLASSES.has(label?.className) ? label.className : CLASSE_PER_DEFECTE }));
}
const iguals = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const etiquetesDeSerie = (clau) => normalitza(PAGE_COPY[clau]?.labels);

/* Higiene d'amfitrió (261004) · Un port que no és a punt i llança també val com a «sense». */
function ambCapacitatPersonalitzacio() {
  try {
    return teCapacitat('personalitzacio') === true;
  } catch {
    return false;
  }
}

/**
 * L'esborrany de l'editor. Les etiquetes de cada pàgina: les de la taxonomia
 * si la nomena; si no, les actuals (el pageCopy del contingut core, que ja
 * porta la personalització aplicada) o les de sèrie (PAGE_COPY).
 */
function esborranyInicial(pageCopy, taxonomia) {
  const pagines = Object.fromEntries(SYSTEM_PAGES.map(({ key }) => {
    const actual = pageCopy?.[key] || PAGE_COPY[key];
    const labels = taxonomia?.pagines?.[key]?.labels ?? actual?.labels;
    return [key, { titol: actual?.title || key, labels: normalitza(labels) }];
  }));
  return { pagines, categories: netejaTextos(taxonomia?.categories), etiquetes: netejaTextos(taxonomia?.etiquetes) };
}

/** El payload que es desa: només les pàgines que no són com les de sèrie. */
export function payloadDe(esborrany) {
  const pagines = {};
  for (const [clau, pagina] of Object.entries(esborrany.pagines)) {
    const labels = pagina.labels.map((label) => ({ text: label.text.trim(), className: label.className }));
    if (!iguals(labels, etiquetesDeSerie(clau))) pagines[clau] = { labels };
  }
  return { v: VERSIO_TAXONOMIA, pagines, categories: netejaTextos(esborrany.categories), etiquetes: netejaTextos(esborrany.etiquetes) };
}

const textDError = (error, generic) => (typeof error?.message === 'string' && error.message.trim() ? error.message : generic);
const esCancel = (error) => error?.name === 'AbortError';

export function dataLlegible(iso) {
  if (!iso) return '';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleString('ca-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/** Descàrrega amb Blob i un enllaç temporal, com DetallPrivacitat: res passa per cap servidor. */
function descarregaJson(dades, nom) {
  const blob = new Blob([JSON.stringify(dades, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const enllac = document.createElement('a');
  enllac.href = url;
  enllac.download = nom;
  enllac.rel = 'noopener';
  enllac.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const nomFitxerExportacio = (ara = new Date()) => `taxonomia-${ara.toISOString().slice(0, 10)}.json`;

/* Un bloc de la faceta: una secció amb el seu H2, que és també el seu nom accessible. */
function Bloc({ titol, children }) {
  const id = useId();
  return (
    <section className="sdp-superadmin-bloc" aria-labelledby={id}>
      <h2 id={id} className="sdp-superadmin-bloc__titol">{titol}</h2>
      {children}
    </section>
  );
}

/* Les llistes de valors de sèrie: les de sempre (fixes) i les afegides pel poble. */
function LlistaDeSerie({ nom, singular, fixes, valors, onAfig, onLleva, ocupat }) {
  const [nou, setNou] = useState('');
  const afig = (e) => {
    e.preventDefault();
    const text = nou.trim();
    if (!text) return;
    onAfig(text);
    setNou('');
  };
  return (
    <>
      <p className="sdp-camp__ajuda">De sèrie, sempre: {fixes.join(', ')}.</p>
      {valors.length ? (
        <ul className="sdp-superadmin-llista" aria-label={`${nom} afegides`}>
          {valors.map((valor) => (
            <li key={valor}>
              <span>{valor}</span>
              <Boto varietat="fantasma" icona={X} onClick={() => onLleva(valor)} disabled={ocupat} aria-label={`Llevar la ${singular} ${valor}`}>Llevar</Boto>
            </li>
          ))}
        </ul>
      ) : <p className="sdp-camp__ajuda">Encara no n’hi ha cap d’afegida.</p>}
      <form className="sdp-superadmin-afegir" onSubmit={afig} noValidate>
        <Camp etiqueta={`Nova ${singular}`}>
          <CampText value={nou} maxLength={MAX_TEXT} autoComplete="off" onChange={(e) => setNou(e.target.value)} />
        </Camp>
        <Boto tipus="submit" icona={Plus} disabled={ocupat || !nou.trim()}>Afegir</Boto>
      </form>
    </>
  );
}

export function FacetaTaxonomia({ onBack = null }) {
  const [ambCapacitat] = useState(ambCapacitatPersonalitzacio);
  const { status, pageCopy, personalitzacio, refresh } = useCoreContent();
  const taxonomia = personalitzacio?.taxonomia?.payload;
  const versioDelServidor = personalitzacio?.taxonomia?.versio ?? 0;

  const [esborrany, setEsborrany] = useState(() => esborranyInicial(pageCopy, taxonomia));
  const [versio, setVersio] = useState(versioDelServidor);
  const [missatge, setMissatge] = useState(null);
  const [ocupat, setOcupat] = useState(null);
  const [historial, setHistorial] = useState(null);

  /* Guarda de doble enviament i de desmuntatge (com GestioMembres). */
  const ocupatRef = useRef(false);
  const viu = useRef(true);
  useEffect(() => { viu.current = true; return () => { viu.current = false; }; }, []);

  /* «Recarregar» (després d'un conflicte) torna a llegir el contingut core i,
     quan arriba, reinicia l'esborrany i la versió amb el que hi ha de veres.
     La mateixa espera val per a la primera arribada: si la faceta es munta
     abans que el contingut core siga 'ready' (pageCopy buit, versió 0), queda
     pendent fins que arriba, i només aleshores pren l'esborrany i la versió
     de veres; mentre no és 'ready' l'efecte no consumix la bandera. */
  const recarregant = useRef(status !== 'ready');
  useEffect(() => {
    if (!recarregant.current || status !== 'ready') return;
    recarregant.current = false;
    setEsborrany(esborranyInicial(pageCopy, taxonomia));
    setVersio(versioDelServidor);
  }, [status, personalitzacio, pageCopy, taxonomia, versioDelServidor]);
  const recarrega = () => {
    recarregant.current = true;
    setMissatge(null);
    refresh?.();
  };

  const canviaPagina = (clau, transforma) => setEsborrany((previ) => ({
    ...previ,
    pagines: { ...previ.pagines, [clau]: { ...previ.pagines[clau], labels: transforma(previ.pagines[clau].labels) } }
  }));
  const canviaEtiqueta = (clau, i, canvi) => canviaPagina(clau, (labels) => labels.map((label, j) => (j === i ? { ...label, ...canvi } : label)));
  const afigEtiqueta = (clau) => canviaPagina(clau, (labels) => [...labels, { text: '', className: CLASSE_PER_DEFECTE }]);
  const llevaEtiqueta = (clau, i) => canviaPagina(clau, (labels) => labels.filter((_, j) => j !== i));
  const afigValor = (camp, text) => setEsborrany((previ) => (previ[camp].includes(text) ? previ : { ...previ, [camp]: [...previ[camp], text] }));
  const llevaValor = (camp, text) => setEsborrany((previ) => ({ ...previ, [camp]: previ[camp].filter((v) => v !== text) }));

  /* Desa un payload com a versió nova sobre la vigent. `despres` només si ha anat bé. */
  async function desa(payload, clauOcupat, despres) {
    if (ocupatRef.current) return;
    const errors = validaTaxonomia(payload);
    if (errors.length) {
      setMissatge({ to: 'error', titol: 'Hi ha errors a la taxonomia i no s’ha desat', llista: errors });
      return;
    }
    ocupatRef.current = true;
    setOcupat(clauOcupat);
    setMissatge(null);
    try {
      const resultat = await adminDesaPersonalitzacio({ clau: CLAU, payload, versio: versio || 0 });
      if (!viu.current) return;
      setVersio(resultat.versio);
      setMissatge({ to: 'exit', text: `Desat com a versió ${resultat.versio}. Les etiquetes noves es veuen a tota l’app en tornar a llegir el contingut.` });
      despres?.(resultat);
      refresh?.();
    } catch (error) {
      if (!viu.current || esCancel(error)) return;
      if (error?.code === CODI_PERSONALITZACIO.CONFLICTE_VERSIO) {
        setMissatge({ to: 'error', text: TEXT_CONFLICTE, recarrega: true });
      } else if (error?.code === CODI_PERSONALITZACIO.CAL_SEGON_FACTOR) {
        setMissatge({ to: 'avis', titol: 'Falta el segon factor', text: `${MISSATGE_PERSONALITZACIO[CODI_PERSONALITZACIO.CAL_SEGON_FACTOR]} Confirma’l des d’«El compte» i torna a desar.` });
      } else {
        setMissatge({ to: 'error', text: textDError(error, MISSATGE_PERSONALITZACIO[CODI_PERSONALITZACIO.DESCONEGUT]) });
      }
    } finally {
      ocupatRef.current = false;
      if (viu.current) setOcupat(null);
    }
  }

  async function obriHistorial() {
    setHistorial({ carregant: true, files: [], error: null });
    try {
      const files = await adminHistorialPersonalitzacio(CLAU);
      if (viu.current) setHistorial({ carregant: false, files: Array.isArray(files) ? files : [], error: null });
    } catch (error) {
      if (viu.current && !esCancel(error)) setHistorial({ carregant: false, files: [], error: textDError(error, 'No s’ha pogut llegir l’historial.') });
    }
  }

  const restaura = (registre) => desa(registre.payload, `restaura:${registre.versio}`, () => {
    setEsborrany(esborranyInicial(null, registre.payload));
    setHistorial(null);
  });

  const exporta = () => {
    if (typeof URL.createObjectURL !== 'function') {
      setMissatge({ to: 'error', text: 'Este navegador no permet descarregar el fitxer.' });
      return;
    }
    descarregaJson(payloadDe(esborrany), nomFitxerExportacio());
  };

  /* Onada 11 (261010; front D4, integració) · Quan el Tauler la pinta amb
     `onBack`, la fletxa de la barra blava torna al Tauler, no a l'historial. */
  const tornada = onBack || undefined;

  /* Gauntlet 261030 (cicle 4, traduir-tauler-taxonomia-uuid-autors) · Com la
     resta del Tauler (decisió 261030 §7): sense Traductor (traduccio={false}).
     L'«Historial» porta a la columna Autor l'uuid de qui va desar cada
     versió, i l'esborrany encara no és públic: res d'açò ix cap a un motor.
     Traduir avisa; el botó no canvia (Llei del Píxel). */
  if (!ambCapacitat) {
    return (
      <UniversalPage chrome="context" layout="contained" title={FACETA_TAXONOMIA.titol} lead={LEAD} onBack={tornada}
        traduccio={false}>
        <EstatBuit icona={Tags} titol={TEXT_SENSE_CAPACITAT}
          accio={onBack ? <Boto varietat="secundari" onClick={onBack}>Tornar al Tauler</Boto> : null}>
          Les etiquetes i categories són les de sèrie: este node no oferix la capacitat de desar-ne de pròpies.
        </EstatBuit>
      </UniversalPage>
    );
  }

  const treballant = Boolean(ocupat);
  return (
    <UniversalPage chrome="context" layout="contained" title={FACETA_TAXONOMIA.titol} lead={LEAD} onBack={tornada}
      traduccio={false}>
      <div className="sdp-superadmin-taxonomia">
        {missatge ? (
          <Alerta to={missatge.to} titol={missatge.titol} onTanca={() => setMissatge(null)}
            accions={missatge.recarrega ? <Boto varietat="secundari" icona={RotateCcw} onClick={recarrega}>Recarregar</Boto> : null}>
            {missatge.text ? <p>{missatge.text}</p> : null}
            {missatge.llista ? <ul>{missatge.llista.map((linia) => <li key={linia}>{linia}</li>)}</ul> : null}
          </Alerta>
        ) : null}

        <div className="sdp-superadmin-taxonomia__accions" role="group" aria-label="Accions de la taxonomia">
          <Boto varietat="primari" icona={Save} onClick={() => desa(payloadDe(esborrany), 'desa')} disabled={treballant} carregant={ocupat === 'desa'}>Desar</Boto>
          <Boto varietat="secundari" icona={History} onClick={obriHistorial} disabled={treballant || Boolean(historial?.carregant)}>Historial</Boto>
          <Boto varietat="secundari" icona={Download} onClick={exporta} disabled={treballant}>Exporta JSON</Boto>
          <p className="sdp-camp__ajuda">{versio ? `Versió vigent: ${versio}.` : 'Encara no hi ha cap versió desada: tot és de sèrie.'}</p>
        </div>

        {historial ? (
          <Bloc titol="Historial de versions">
            {historial.carregant ? <Carregant etiqueta="Carregant l’historial…" />
              : historial.error ? <Alerta to="error">{historial.error}</Alerta>
                : historial.files.length ? (
                  <Taula titol="Versions desades de la taxonomia">
                    <thead>
                      <tr><th scope="col">Versió</th><th scope="col">Data</th><th scope="col">Autor</th><th scope="col">Accions</th></tr>
                    </thead>
                    <tbody>
                      {historial.files.map((registre) => (
                        <tr key={registre.versio}>
                          <th scope="row">{registre.versio}</th>
                          <td>{dataLlegible(registre.creat)}</td>
                          <td>{registre.autor || ''}</td>
                          <td>
                            <Boto varietat="secundari" icona={RotateCcw} onClick={() => restaura(registre)} disabled={treballant}
                              carregant={ocupat === `restaura:${registre.versio}`} aria-label={`Restaurar la versió ${registre.versio}`}>
                              Restaurar
                            </Boto>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Taula>
                ) : <p className="sdp-camp__ajuda">Encara no s’ha desat cap versió.</p>}
          </Bloc>
        ) : null}

        <Bloc titol="Categories de sèrie del Bloc">
          <LlistaDeSerie nom="Categories" singular="categoria" fixes={CATEGORIES_BASE} valors={esborrany.categories} ocupat={treballant}
            onAfig={(text) => afigValor('categories', text)} onLleva={(text) => llevaValor('categories', text)} />
        </Bloc>
        <Bloc titol="Etiquetes de sèrie del Bloc">
          <LlistaDeSerie nom="Etiquetes" singular="etiqueta" fixes={ETIQUETES_BASE} valors={esborrany.etiquetes} ocupat={treballant}
            onAfig={(text) => afigValor('etiquetes', text)} onLleva={(text) => llevaValor('etiquetes', text)} />
        </Bloc>

        {SYSTEM_PAGES.map(({ key }) => {
          const pagina = esborrany.pagines[key];
          return (
            <Bloc key={key} titol={`Pàgina «${pagina.titol}»`}>
              {pagina.labels.length ? (
                <ul className="sp-card-labels" aria-label={`Previsualització de les etiquetes de ${pagina.titol}`}>
                  {pagina.labels.map((label, i) => (
                    <li key={`${i}-${label.className}`} className={`sp-card-label ${label.className}`}>{label.text.trim() || '…'}</li>
                  ))}
                </ul>
              ) : <p className="sdp-camp__ajuda">Sense etiquetes.</p>}
              {pagina.labels.map((label, i) => (
                <div className="sdp-superadmin-etiqueta" key={i}>
                  <Camp etiqueta={`Text de l’etiqueta ${i + 1} de ${pagina.titol}`}>
                    <CampText value={label.text} maxLength={MAX_TEXT} autoComplete="off" disabled={treballant}
                      onChange={(e) => canviaEtiqueta(key, i, { text: e.target.value })} />
                  </Camp>
                  <Camp etiqueta={`Classe de l’etiqueta ${i + 1} de ${pagina.titol}`}>
                    <Selector value={label.className} opcions={OPCIONS_CLASSE} disabled={treballant}
                      onChange={(e) => canviaEtiqueta(key, i, { className: e.target.value })} />
                  </Camp>
                  <Boto varietat="perill" icona={Trash2} onClick={() => llevaEtiqueta(key, i)} disabled={treballant}
                    aria-label={`Llevar l’etiqueta ${i + 1} de ${pagina.titol}`}>
                    Llevar
                  </Boto>
                </div>
              ))}
              <div className="sdp-superadmin-taxonomia__accions">
                <Boto varietat="secundari" icona={Plus} onClick={() => afigEtiqueta(key)} disabled={treballant}
                  aria-label={`Afegir una etiqueta a ${pagina.titol}`}>
                  Afegir etiqueta
                </Boto>
              </div>
            </Bloc>
          );
        })}
      </div>
    </UniversalPage>
  );
}

export default FacetaTaxonomia;
