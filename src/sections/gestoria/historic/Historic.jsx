/**
 * Historic.jsx — la vista «Històric i IA» de la Gestoria (/app/gestoria/historic).
 *
 * Onada 6, ordre del Mestre (261009): «portar els comptes del banc, calcular
 * les despeses massives en IA, fer simulacions i descarregar-se un full de
 * càlcul per a la gestora real», amb «un panell de control financer bestial».
 * Arriba pel pont de l'app (src/apps/gestoria/AppGestoria.jsx), com la
 * Facturació: ShellGestoria és font del tractor del Tauler i no es toca.
 *
 * La pàgina (PaginaApp, amb la boina personal i l'ull de privacitat):
 *   · LA PORTA del tractor 'gestoria.historic': sense la signatura del
 *     Mestre, «Cal aprovar el tractor»; amb ella, el selector d'extractes.
 *   · LA FOTO DEL DIRECTOR FINANCER: caixa, despesa mensual, consum net,
 *     autonomia, pes de l'IA i provisió d'impostos (targetes del Tauler, cada
 *     una amb la seua pàgina).
 *   · L'HISTÒRIC per mes, trimestre i any (amb el gràfic de les eixides i
 *     la taula per categoria); LA DESPESA EN IA per mes (Histograma) i per
 *     proveïdor; ELS MOVIMENTS PER REVISAR (eixides i entrades, amb la
 *     categoria i el proveïdor) i les regles; LES SIMULACIONS
 *     (PanellSimulacio.jsx) i EL LLIBRE per a la gestora.
 * CAP XIFRA es pinta fins que la persona prem l'ull de la boina: ni als
 * quadrats, ni a les taules, ni als recomptes, ni als gràfics (l'alçada de
 * les barres també és una xifra: amb l'ull tancat, el gràfic no es pinta).
 * Una lectura nova i «Oblida les dades» tornen a tancar l'ull.
 *
 * EL COFRE (integració de l'Onada 6, 261009: «xifra-ho i protegeix-ho perquè
 * el Mestre puga provar amb dades reals»). L'export per defecte, el que munta
 * la ruta, posa TOTA la vista darrere de PortaCofre (cofre/PortaCofre.jsx):
 * amb el cofre sense crear o bloquejat, ni la porta del tractor, ni el
 * selector, ni cap xifra, regla o classificació; només el títol i la porta
 * del cofre. La configuració de la persona (regles, reclassificacions,
 * paràmetres, suposicions i escenari) es desa xifrada a la col·lecció
 * 'historic' (persistenciaDelCofre); els moviments del banc no es desen mai:
 * es tornen a llegir dels extractes. En bloquejar-se (botó, autobloqueig o
 * una altra pestanya), useHistoric ho buida tot. El cofre és l'ÚNIC de l'app
 * (cofreDeLaGestoria, a cofre.js) i es bloqueja en eixir d'esta vista.
 * VistaHistoric és la vista sense la porta: només per a les proves, que hi
 * injecten la persistència; la ruta munta sempre la porta.
 *
 * LA BOINA (ordre del Mestre, 13-10-2026, pla 261013_1405, front B: «la barra
 * taronja de TOTES les pàgines de la Gestoria porta el titular real
 * autenticat, i a la dreta SEMPRE la data i l'hora vives») · Amb sessió, el
 * pont passa `titular` ({ nom, avatar, poble }, el de useSessioApp) i la
 * boina, les targetes i la pàgina de cada targeta porten la persona,
 * enllaçada al seu perfil; sense, «Titular sense configurar» (TITULAR_HISTORIC),
 * com abans. La PaginaApp i la PaginaTargeta porten el rellotge viu
 * (rellotgeViu), sempre l'últim de la barra: també amb el cofre bloquejat,
 * quan la boina no té l'ull. L'hora de la darrera lectura dels extractes es
 * queda com un xip secundari a l'esquerra del rellotge
 * (sdp-gestoria-boina__lectura), amb la data només si no és la d'avui.
 * Derogat EN PART per eixa ordre el «Sense configuració local, la boina diu
 * la veritat» de l'Onada 6 (261009): continua valent sense sessió. També la
 * lectura com a pastilla del document de la PaginaApp (261009): la data de la
 * barra és el rellotge, i la lectura només viu al xip de la boina.
 * Proves: el cofre, el magatzem, subtle, el catàleg, l'entorn, el rellotge,
 * avui, la persistència (VistaHistoric), descarrega i el titular s'injecten.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { CheckCheck, EyeOff, FileDown, FileSearch, RotateCcw, Undo2 } from 'lucide-react';
import { useNavigate } from '../../../app/contexts/RouterContext';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { DateTimeControl } from '../../../components/PedraSeca/atoms/controls.jsx';
import { Carregant, EstatBuit } from '../../../components/PedraSeca/atoms/estats.jsx';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { DialegConfirmacio } from '../../../components/PedraSeca/organismes/Dialeg.jsx';
import { Camp, CampText, Selector } from '../../../components/PedraSeca/organismes/formulari.jsx';
import { Histograma } from '../../../components/PedraSeca/organismes/Histograma.jsx';
import { PaginaApp } from '../../../components/PedraSeca/organismes/PaginaApp.jsx';
import { Pestanyes } from '../../../components/PedraSeca/organismes/Pestanyes.jsx';
import { Taula } from '../../../components/PedraSeca/organismes/Taula.jsx';
import { cofreDeLaGestoria, persistenciaDelCofre } from '../cofre/cofre.js';
import PortaCofre from '../cofre/PortaCofre.jsx';
import { CATEGORIES, PROVEIDORS, TEXT_MOTIUS, categoriaDe, proveidorDe } from '../despeses/nucli/categories.js';
import { perRevisar } from '../despeses/nucli/serieHistorica.js';
import { formatData, nomMes } from '../nucli/dates.js';
import { formatImport } from '../nucli/diners.js';
import { BlocTargetes, PaginaTargeta, Xifra } from '../tauler/Tauler.jsx';
import { UllPrivacitat } from '../tauler/TargetaTauler.jsx';
import { AVIS_SENSE_XIFRAR, creaLlibreGestora } from './nucli/llibreGestora.js';
import { TEXT_COBERTURA, nomDelTram, targetesHistoric } from './nucli/targetesHistoric.js';
import { ACCEPTA_HISTORIC } from './nucli/tractorHistoric.js';
import { PanellSimulacio, Percentatge, importDe, recompteDe } from './PanellSimulacio.jsx';
import { useHistoric } from './useHistoric.js';

/* La consulta que obri la porta dels Tractors (la mateixa que CONSULTA_TRACTORS de ContenidorGestoria.jsx; una prova ho comprova). */
export const CONSULTA_TRACTORS_HISTORIC = '?categoria=tractors_cat&item=tractors_aprovacio';
/* Sense sessió, la boina diu la veritat: cap autora fingida (com la closca). */
export const TITULAR_HISTORIC = Object.freeze({ nom: 'Titular sense configurar', poble: '', avatar: null, href: '/el-meu-perfil' });
/** Les files de «Per revisar» que es pinten com a molt. */
export const MAX_REVISIO = 40;
/** La col·lecció del cofre on es desa, xifrada, la configuració de la persona. */
export const COLLECCIO_HISTORIC = 'historic';

const ETIQUETES = Object.freeze([
  Object.freeze({ text: 'GESTORIA', className: 'sdp-badge-system' }),
  Object.freeze({ text: 'Històric i IA', className: 'sdp-badge-category' })
]);
const ESTATS_TRACTOR = Object.freeze({
  pendent: 'encara no està aprovat',
  caducat: 'té l’aprovació caducada',
  revocat: 'té l’aprovació revocada',
  'empremta-divergent': 'ha canviat des que el vas aprovar',
  incomplet: 'no té tots els fitxers declarats',
  error: 'no s’ha pogut comprovar'
});
const OPCIONS_CATEGORIA = Object.freeze(CATEGORIES.map((c) => Object.freeze({ valor: c.id, etiqueta: c.nom })));
const TRACTAMENT_CURT = Object.freeze({
  interior: 'Espanya', 'isp-intracomunitari': 'Inversió del subjecte passiu (UE)', 'isp-extracomunitari': 'Inversió del subjecte passiu (fora UE)',
  desconegut: 'Desconegut'
});
const dosXifres = (n) => String(n).padStart(2, '0');
const dia = (d) => formatData(d, 'dd/mm/aaaa');

/* Descàrrega amb Blob i un enllaç temporal, com PanellGestoria: res passa per cap servidor. */
function descarregaPerDefecte({ nom, tipus, dades }) {
  const url = URL.createObjectURL(new Blob([dades], { type: tipus || 'application/octet-stream' }));
  const enllac = document.createElement('a');
  enllac.href = url;
  enllac.download = nom;
  enllac.rel = 'noopener';
  enllac.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** La pastilla de la boina: l'instant de la darrera lectura (hh:mm i dd/mm/aa). */
export function pastillaDe(ms) {
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms);
  const data = `${dosXifres(d.getDate())}/${dosXifres(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`;
  const hora = `${dosXifres(d.getHours())}:${dosXifres(d.getMinutes())}`;
  return { time: hora, date: data, dateTime: `${d.getFullYear()}-${dosXifres(d.getMonth() + 1)}-${dosXifres(d.getDate())}T${hora}` };
}

/**
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B) · El xip de la
 * darrera lectura, a l'esquerra del rellotge viu: l'hora sempre i la data
 * només si no és la d'avui (dues pastilles amb la mateixa data no diuen res i
 * resten amplada en mòbil). El dateTime i el nom accessible, sempre sencers.
 * @param {number|null} ms l'instant de la lectura
 * @param {number} ara l'instant d'ara (el rellotge de la pàgina)
 * @returns {{ time: string, date: string|undefined, dateTime: string, etiqueta: string }|null}
 */
export function pastillaDeLectura(ms, ara) {
  const pastilla = pastillaDe(ms);
  if (!pastilla) return null;
  const avui = pastillaDe(ara);
  const mateixDia = Boolean(avui) && avui.dateTime.slice(0, 10) === pastilla.dateTime.slice(0, 10);
  return {
    time: pastilla.time,
    date: mateixDia ? undefined : pastilla.date,
    dateTime: pastilla.dateTime,
    etiqueta: `Dades llegides a les ${pastilla.time} del ${pastilla.date}`
  };
}

/**
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B) · L'autoria de la
 * boina: el titular de la sessió que passa el pont, enllaçat al seu perfil;
 * sense nom, TITULAR_HISTORIC.
 * @param {{ nom?: string, avatar?: string|null, poble?: string }|null} titular
 * @returns {{ nom: string, poble: string, avatar: string|null, href: string }}
 */
export function titularDelHistoric(titular) {
  const nom = typeof titular?.nom === 'string' ? titular.nom.trim() : '';
  if (!nom) return TITULAR_HISTORIC;
  return Object.freeze({
    nom,
    poble: typeof titular.poble === 'string' ? titular.poble : '',
    avatar: typeof titular.avatar === 'string' ? titular.avatar : null,
    href: TITULAR_HISTORIC.href
  });
}

/* La porta del tractor i el selector dels extractes. */
function PortaHistoric({ h, onObreTractors, onOblida }) {
  if (h.porta.carregant) return <Carregant etiqueta="Llegint les aprovacions dels tractors…" />;
  if (!h.aprovat) {
    const estat = ESTATS_TRACTOR[h.fila?.estat] ?? ESTATS_TRACTOR.pendent;
    return (
      <Alerta to="avis" titol="Cal aprovar el tractor"
        accions={<Boto varietat="primari" onClick={onObreTractors}>Obri el panell de Tractors</Boto>}>
        {`L’Històric llig els extractes del banc amb el tractor «Gestoria · Històric del banc i despesa en IA», que ${estat}. `}
        {'Aprova’l amb la teua signatura al panell de Tractors: sense, cap fitxer es llig i no hi ha cap xifra.'}
        {h.porta.error ? ` ${h.porta.error}` : ''}
      </Alerta>
    );
  }
  const periode = h.rang ? `del ${dia(h.rang.inici)} al ${dia(h.rang.fi)}` : '';
  return (
    <div className="sdp-gestoria-historic__porta">
      <Camp key={h.generacio} etiqueta="Tria els extractes del banc de tot el període"
        ajuda={`Norma 43 o el CSV de moviments, fins a 60 fitxers: l’històric va ${periode}. Res es puja enlloc.`}>
        <CampText tipus="file" multiple accept={ACCEPTA_HISTORIC} disabled={h.llegint}
          onChange={(event) => h.llig(Array.from(event.target.files ?? []))} />
      </Camp>
      {h.llegint ? <Carregant etiqueta="Llegint i classificant els extractes…" /> : null}
      {h.error ? <Alerta to="error" titol="No s’han pogut llegir els extractes">{h.error}</Alerta> : null}
      {h.lectura?.avisos?.length ? (
        <Alerta to="avis" titol="Hi ha fitxers que no s’han llegit">
          <ul className="sdp-gestoria-historic__avisos">
            {h.lectura.avisos.map((a, i) => <li key={`${a.codi}-${i}`}>{a.missatge}</li>)}
          </ul>
        </Alerta>
      ) : null}
      {h.lectura || h.llegint ? (
        <div className="sdp-gestoria-historic__accions">
          {h.potTornarALlegir ? <Boto icona={RotateCcw} onClick={() => h.tornaALlegir()}>Torna a llegir amb les regles</Boto> : null}
          <Boto varietat="secundari" onClick={onOblida}>Oblida les dades</Boto>
        </div>
      ) : null}
    </div>
  );
}

/* Una secció amb el seu títol (h2). */
function Seccio({ titol, children, ajuda }) {
  const id = useId();
  return (
    <section className="sdp-gestoria-historic__seccio" aria-labelledby={id}>
      <h2 id={id} className="sdp-gestoria-historic__titol">{titol}</h2>
      {ajuda ? <p className="sdp-gestoria-historic__nota">{ajuda}</p> : null}
      {children}
    </section>
  );
}

/* La taula d'un tipus de tram (mesos, trimestres o anys). */
function TaulaTrams({ titol, trams, visible }) {
  return (
    <Taula titol={titol} densa>
      <thead>
        <tr>
          <th scope="col">Període</th><th scope="col">Cobertura</th><th scope="col">Entrades</th><th scope="col">Eixides</th>
          <th scope="col">Net</th><th scope="col">Despesa en IA</th><th scope="col">IA sobre les eixides</th>
        </tr>
      </thead>
      <tbody>
        {trams.map((t) => (
          <tr key={t.clau}>
            <th scope="row">{nomDelTram(t)}</th>
            <td>{TEXT_COBERTURA[t.cobertura]}</td>
            <td className="sdp-gestoria-historic__xifra"><Xifra xifra={importDe(t.entrades)} visible={visible} /></td>
            <td className="sdp-gestoria-historic__xifra"><Xifra xifra={importDe(t.eixides)} visible={visible} /></td>
            <td className="sdp-gestoria-historic__xifra"><Xifra xifra={importDe(t.net)} visible={visible} /></td>
            <td className="sdp-gestoria-historic__xifra"><Xifra xifra={importDe(t.ia?.net)} visible={visible} /></td>
            <td className="sdp-gestoria-historic__xifra">
              <Percentatge valor={t.ia && t.eixides > 0 ? Math.round((t.ia.net / t.eixides) * 1000) / 10 : null} visible={visible} />
            </td>
          </tr>
        ))}
      </tbody>
    </Taula>
  );
}

/*
 * Un gràfic de barres per mes, amagat amb l'ull tancat: les alçades de les
 * barres també són xifres (proporcionals a l'import), així que, sense l'ull,
 * en lloc del gràfic hi ha un estat buit que ho diu. Només els mesos amb
 * extractes: un mes sense dades no és un zero; un valor negatiu, a zero.
 */
function GraficMensual({ titol, mesos, valorDe, visible }) {
  const barres = mesos.filter((m) => Number.isSafeInteger(valorDe(m))).map((m) => ({
    id: m.clau,
    etiqueta: nomDelTram(m),
    valor: Math.max(0, valorDe(m)),
    marca: m.mes === 1 ? String(m.any) : nomMes(m.mes).slice(0, 3)
  }));
  if (!visible && barres.length) {
    return (
      <EstatBuit icona={EyeOff} titol={`Gràfic amagat: «${titol}»`} className="sdp-gestoria-historic__grafic">
        Prem l’ull de la barra per a veure’l: l’alçada de les barres diu les xifres.
      </EstatBuit>
    );
  }
  /* Sense xifres damunt de les barres (21 mesos no hi caben): les diu el lector i la taula per mes. */
  return (
    <Histograma titol={titol} barres={barres} valors={false} formatValor={(valor) => formatImport(Math.round(valor))}
      buit="Encara no hi ha cap mes." className="sdp-gestoria-historic__grafic" />
  );
}

/* La despesa per categoria de tot el període, en l'ordre del catàleg. */
function TaulaCategories({ totals, visible }) {
  const files = CATEGORIES.map((c) => ({ c, xifres: totals?.perCategoria?.[c.id] })).filter((f) => f.xifres);
  if (!files.length) return null;
  return (
    <Taula titol="El període per categoria" densa>
      <thead>
        <tr><th scope="col">Categoria</th><th scope="col">Entrades</th><th scope="col">Eixides</th><th scope="col">Moviments</th></tr>
      </thead>
      <tbody>
        {files.map(({ c, xifres }) => (
          <tr key={c.id}>
            <th scope="row">{c.nom}</th>
            <td className="sdp-gestoria-historic__xifra"><Xifra xifra={importDe(xifres.entrades)} visible={visible} /></td>
            <td className="sdp-gestoria-historic__xifra"><Xifra xifra={importDe(xifres.eixides)} visible={visible} /></td>
            <td className="sdp-gestoria-historic__xifra"><Xifra xifra={recompteDe(xifres.moviments)} visible={visible} /></td>
          </tr>
        ))}
      </tbody>
    </Taula>
  );
}

/* La despesa en IA: el gràfic per mes i la taula per proveïdor. */
function SeccioIa({ serie, visible }) {
  const proveidors = serie.ia?.perProveidor ?? [];
  return (
    <Seccio titol="La despesa en IA" ajuda="Neta: les eixides menys les devolucions. Els dòlars són els del registre de divisa de la Norma 43, quan el banc el porta.">
      <GraficMensual titol="Despesa neta en IA per mes" mesos={serie.mesos} valorDe={(m) => m.ia?.net} visible={visible} />
      {proveidors.length ? (
        <Taula titol="La despesa en IA per proveïdor" densa>
          <thead>
            <tr>
              <th scope="col">Proveïdor</th><th scope="col">País</th><th scope="col">IVA</th><th scope="col">Despesa neta</th>
              <th scope="col">En dòlars</th><th scope="col">Part de la IA</th><th scope="col">Moviments</th>
            </tr>
          </thead>
          <tbody>
            {proveidors.map((p) => (
              <tr key={p.clau}>
                <th scope="row">{p.nom}</th>
                <td>{p.pais ?? '—'}</td>
                <td>{TRACTAMENT_CURT[p.tractament]}</td>
                <td className="sdp-gestoria-historic__xifra"><Xifra xifra={importDe(p.net)} visible={visible} /></td>
                <td className="sdp-gestoria-historic__xifra">
                  <Xifra xifra={p.usd ? { tipus: 'import', valor: p.usd, moneda: 'USD' } : null} visible={visible} />
                </td>
                <td className="sdp-gestoria-historic__xifra"><Percentatge valor={p.percentatge} visible={visible} /></td>
                <td className="sdp-gestoria-historic__xifra"><Xifra xifra={{ tipus: 'recompte', valor: p.moviments }} visible={visible} /></td>
              </tr>
            ))}
          </tbody>
        </Taula>
      ) : <p className="sdp-gestoria-historic__nota">Cap moviment del període és d’IA.</p>}
    </Seccio>
  );
}

/* Les opcions de proveïdor d'una categoria: els del catàleg d'eixa categoria, l'actual si no n'és, i «Sense proveïdor». */
function opcionsProveidor(categoria, actual = null) {
  const delCataleg = PROVEIDORS.filter((p) => p.categoria === categoria);
  const ambActual = actual && !delCataleg.some((p) => p.clau === actual) && proveidorDe(actual) ? [proveidorDe(actual), ...delCataleg] : delCataleg;
  return [{ valor: '', etiqueta: 'Sense proveïdor' }, ...ambActual.map((p) => ({ valor: p.clau, etiqueta: p.nom }))];
}

/* Una taula de moviments per revisar: la categoria i el proveïdor de cada un es poden canviar; «Desfés» torna al del catàleg. */
function TaulaRevisio({ titol, moviments, total, visible, h }) {
  if (!moviments.length) return null;
  return (
    <>
      <Taula titol={titol} densa>
        <thead>
          <tr><th scope="col">Data</th><th scope="col">Import</th><th scope="col">Per què</th><th scope="col">Categoria i proveïdor</th></tr>
        </thead>
        <tbody>
          {moviments.map((m) => (
            <tr key={m.id ?? `${dia(m.data)}-${m.compte}-${m.centims}`}>
              <th scope="row">{dia(m.data)}</th>
              <td className="sdp-gestoria-historic__xifra"><Xifra xifra={importDe(m.centims)} visible={visible} /></td>
              <td>{TEXT_MOTIUS[m.motiu] ?? '—'}</td>
              <td>
                <div className="sdp-gestoria-historic__reclassifica">
                  <Camp etiqueta={`Categoria del moviment del ${dia(m.data)}`} className="sdp-gestoria-historic__camp-curt">
                    <Selector opcions={OPCIONS_CATEGORIA} value={m.categoria}
                      onChange={(event) => h.reclassificaMoviment(m.id, { categoria: event.target.value, proveidor: m.proveidor })} />
                  </Camp>
                  <Camp etiqueta={`Proveïdor del moviment del ${dia(m.data)}`} className="sdp-gestoria-historic__camp-curt">
                    <Selector opcions={opcionsProveidor(m.categoria, m.proveidor)} value={m.proveidor ?? ''}
                      onChange={(event) => h.reclassificaMoviment(m.id, { categoria: m.categoria, proveidor: event.target.value || null })} />
                  </Camp>
                  {m.motiu === 'RECLASSIFICAT' ? (
                    <Boto varietat="fantasma" icona={Undo2} onClick={() => h.reclassificaMoviment(m.id, null)}>Desfés</Boto>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Taula>
      {total > moviments.length ? (
        <p className="sdp-gestoria-historic__nota">
          {`Se’n mostren els ${moviments.length} primers de `}
          <Xifra xifra={recompteDe(total)} visible={visible} />
          {': amb una regla en pots classificar molts de colp.'}
        </p>
      ) : null}
    </>
  );
}

/* Els moviments per revisar (reclassificar a mà), separats en eixides i entrades, i les regles de la persona. */
function SeccioRevisio({ h, visible }) {
  const [patro, setPatro] = useState('');
  const [categoria, setCategoria] = useState('ia');
  const [proveidor, setProveidor] = useState('');
  const [error, setError] = useState('');
  const revisables = h.serie.moviments.filter((m) => perRevisar(m) || m.motiu === 'RECLASSIFICAT');
  const eixides = revisables.filter((m) => m.centims < 0);
  const entrades = revisables.filter((m) => m.centims > 0);
  /* Les entrades sense origen que encara compten com a clients: es poden confirmar totes de colp. */
  const senseOrigen = h.serie.moviments.filter((m) => m.centims > 0 && m.categoria === 'clients' && m.confianca === 'baixa' && m.id);
  const afig = (event) => {
    event.preventDefault();
    const errors = h.afegixRegla({ patro, categoria, proveidor: proveidor || null });
    if (errors.length) setError(errors[0]);
    else {
      setError('');
      setPatro('');
    }
  };
  return (
    <Seccio titol="Per revisar" ajuda="Els proveïdors ambigus (Google o Microsoft sense producte), els moviments sense cap patró conegut, les entrades sense origen (compten com a cobraments de clients) i els traspassos probables entre els teus comptes. La teua tria es guarda per a la lectura següent.">
      {eixides.length || entrades.length ? null : <p className="sdp-gestoria-historic__nota">No hi ha cap moviment per revisar.</p>}
      <TaulaRevisio titol="Eixides per revisar" moviments={eixides.slice(0, MAX_REVISIO)} total={eixides.length} visible={visible} h={h} />
      <TaulaRevisio titol="Entrades per revisar" moviments={entrades.slice(0, MAX_REVISIO)} total={entrades.length} visible={visible} h={h} />
      {senseOrigen.length ? (
        <div className="sdp-gestoria-historic__accions">
          <Boto varietat="secundari" icona={CheckCheck}
            onClick={() => h.reclassificaMoviments(senseOrigen.map((m) => ({ id: m.id, canvi: { categoria: 'clients', proveidor: null } })))}>
            Confirma la resta d’entrades com a cobraments de clients
          </Boto>
        </div>
      ) : null}
      <form className="sdp-gestoria-historic__regla" onSubmit={afig}>
        <Camp etiqueta="Text que apareix al moviment" ajuda="Per exemple, el nom del comerç. Majúscules i accents no importen." error={error || undefined}>
          <CampText value={patro} spellCheck={false} onChange={(event) => setPatro(event.target.value)} maxLength={60} />
        </Camp>
        <Camp etiqueta="Categoria per a eixos moviments">
          <Selector opcions={OPCIONS_CATEGORIA} value={categoria} onChange={(event) => { setCategoria(event.target.value); setProveidor(''); }} />
        </Camp>
        <Camp etiqueta="Proveïdor per a eixos moviments">
          <Selector opcions={opcionsProveidor(categoria)} value={proveidor} onChange={(event) => setProveidor(event.target.value)} />
        </Camp>
        <Boto tipus="submit" varietat="secundari">Afig la regla</Boto>
      </form>
      {h.configuracio.regles.length ? (
        <ul className="sdp-gestoria-historic__regles" aria-label="Les teues regles">
          {h.configuracio.regles.map((r, i) => (
            <li key={`${r.patro}-${i}`}>
              <span>{`«${r.patro}» → ${categoriaDe(r.categoria)?.nom ?? r.categoria}${r.proveidor ? ` (${proveidorDe(r.proveidor)?.nom ?? r.proveidor})` : ''}`}</span>
              <Boto varietat="fantasma" onClick={() => h.llevaRegla(i)} aria-label={`Lleva la regla «${r.patro}»`}>Lleva</Boto>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="sdp-gestoria-historic__nota">Les regles miren el text del banc, que només llig el tractor: s’apliquen quan tornes a llegir els extractes.</p>
    </Seccio>
  );
}

/* El llibre per a la gestora: es prepara, s'avisa que ix sense xifrar i se'n mostra l'empremta. */
function SeccioLlibre({ h, subtle, descarrega, onAnuncia }) {
  const [llibre, setLlibre] = useState(null);
  const [preparant, setPreparant] = useState(false);
  const [error, setError] = useState('');
  const viu = useRef(true);
  useEffect(() => () => { viu.current = false; }, []);
  const prepara = async () => {
    setPreparant(true);
    setError('');
    try {
      const fitxer = await creaLlibreGestora({ serie: h.serie, simulacio: h.simulacio, suposits: h.suposits, subtle });
      if (viu.current) setLlibre(fitxer);
    } catch (e) {
      if (viu.current) setError(e?.message ?? String(e));
    } finally {
      if (viu.current) setPreparant(false);
    }
  };
  const confirma = () => {
    try {
      descarrega({ nom: llibre.nom, tipus: llibre.tipus, dades: llibre.dades });
      onAnuncia(`S’ha descarregat «${llibre.nom}».`);
    } catch {
      onAnuncia(`No s’ha pogut descarregar «${llibre.nom}»: este navegador no deixa descarregar fitxers generats.`);
    }
    setLlibre(null);
  };
  return (
    <Seccio titol="El llibre per a la gestora" ajuda="Un XLSX amb set fulles: el resum anual i trimestral, els moviments categoritzats (sense el text dels conceptes), la despesa en IA per mes i proveïdor, les estimacions i els paràmetres amb la seua font.">
      <div className="sdp-gestoria-historic__accions">
        <Boto varietat="primari" icona={FileDown} carregant={preparant} onClick={prepara}>Prepara el llibre (XLSX)</Boto>
      </div>
      {error ? <Alerta to="error" titol="No s’ha pogut preparar el llibre">{error}</Alerta> : null}
      <DialegConfirmacio obert={Boolean(llibre)} onTanca={() => setLlibre(null)} onConfirma={confirma}
        titol="Descarregar el llibre sense xifrar?" descripcio={AVIS_SENSE_XIFRAR} etiquetaConfirma="Descarrega’l" etiquetaCancela="Encara no">
        {llibre ? (
          <dl className="sdp-gestoria-historic__dades">
            <dt>Fitxer</dt><dd>{llibre.nom}</dd>
            <dt>Mida</dt><dd>{`${Math.max(1, Math.round(llibre.mida / 1024))} kB`}</dd>
            <dt>Empremta SHA-256</dt><dd><code className="sdp-gestoria-historic__empremta">{llibre.empremta}</code></dd>
          </dl>
        ) : null}
      </DialegConfirmacio>
    </Seccio>
  );
}

/**
 * La vista «Històric i IA» SENSE la porta del cofre: la fan servir l'export
 * per defecte (que hi passa la persistència del cofre i la porta) i les
 * proves. `porta(contingut)`, si n'hi ha, embolcalla tot el que va davall
 * del títol (Historic hi posa PortaCofre).
 * @param {{ magatzem?: object, subtle?: SubtleCrypto, tractors?: object[], entorn?: object, rellotge?: () => number,
 *   avui?: object, persistencia?: { llig: Function, desa: Function, subscriu?: Function }, descarrega?: Function,
 *   porta?: (contingut: import('react').ReactNode) => import('react').ReactNode,
 *   titular?: { nom: string, avatar?: string|null, poble?: string }|null }} props
 *   `titular`: el de la sessió, que passa el pont (ordre del Mestre, 13-10-2026, front B); sense, l'estat honest
 */
export function VistaHistoric({
  magatzem, subtle, tractors, entorn, rellotge, avui, persistencia, descarrega = descarregaPerDefecte, porta = null, titular: titularPropi = null
}) {
  const navigate = useNavigate();
  const h = useHistoric({ magatzem, subtle, tractors, entorn, rellotge, avui, persistencia });
  const [visible, setVisible] = useState(false);
  const [oberta, setOberta] = useState(null);
  const [anunci, setAnunci] = useState('');
  const refTitol = useRef(null);
  const navegat = useRef(false);

  /* Una lectura nova o un oblit tornen a tancar l'ull i tanquen la pàgina d'una targeta. */
  useEffect(() => {
    setVisible(false);
    setOberta(null);
  }, [h.generacio]);
  useEffect(() => {
    if (!navegat.current) return;
    navegat.current = false;
    refTitol.current?.focus();
  }, [oberta]);
  useEffect(() => {
    if (!h.llegint && h.lectura && !h.error) setAnunci('Lectura completada.');
  }, [h.llegint, h.lectura, h.error]);

  const targetes = useMemo(() => targetesHistoric({ serie: h.serie, indicadors: h.indicadors, provisio: h.provisio }),
    [h.serie, h.indicadors, h.provisio]);
  const pastilla = pastillaDe(h.llegit);
  /* Ordre del Mestre, 13-10-2026 (pla 261013_1405, front B): el titular de la sessió i el xip de la lectura. */
  const titular = titularDelHistoric(titularPropi);
  const lectura = pastillaDeLectura(h.llegit, typeof rellotge === 'function' ? rellotge() : Date.now());
  /* Amb el cofre bloquejat no hi ha cap xifra que mostrar: la boina va sense
     l'ull (i sense xip). El rellotge viu el posa PaginaApp igualment. */
  const boina = h.persistenciaBloquejada ? null : (
    <span className="sdp-gestoria-boina">
      <UllPrivacitat visible={visible} onCommuta={() => setVisible((abans) => !abans)} etiqueta="Mostra les xifres" />
      {lectura ? (
        <span className="sdp-gestoria-boina__lectura">
          <DateTimeControl time={lectura.time} date={lectura.date} dateTime={lectura.dateTime} label={lectura.etiqueta} />
        </span>
      ) : null}
    </span>
  );
  const oblida = () => {
    setAnunci(h.llegint ? 'Lectura cancel·lada. Les dades s’han oblidat.' : 'Les dades s’han oblidat.');
    setVisible(false);
    h.oblida();
  };
  const obri = (id) => {
    navegat.current = true;
    setOberta(id);
  };
  const comuns = { titular, pastilla, visible, generacio: h.generacio, onObri: obri, onAvis: setAnunci };
  const targeta = oberta ? targetes.find((t) => t.id === oberta) ?? null : null;

  if (targeta) {
    return (
      <PaginaTargeta targeta={targeta} titular={titular} visible={visible} barActions={boina} rellotge={rellotge}
        onTorna={() => { navegat.current = true; setOberta(null); }} refTitol={refTitol} />
    );
  }

  const contingut = (
    <>
      <PortaHistoric h={h} onObreTractors={() => navigate(CONSULTA_TRACTORS_HISTORIC)} onOblida={oblida} />
      {h.errorPersistencia ? <Alerta to="avis" titol="Configuració">{h.errorPersistencia}</Alerta> : null}
      {h.serie ? (
        <>
          {h.serie.avisos.length ? (
            <Alerta to="info" titol="Notes de la lectura">
              <ul className="sdp-gestoria-historic__avisos">
                {h.serie.avisos.map((a, i) => <li key={`${a.codi}-${i}`}>{a.missatge}</li>)}
              </ul>
            </Alerta>
          ) : null}
          <BlocTargetes titol="La foto del director financer" targetes={targetes} {...comuns} />
          <Seccio titol="L’històric" ajuda={h.serie.rang ? `Del ${dia(h.serie.rang.inici)} al ${dia(h.serie.rang.fi)}. Sense extractes, un període no té xifra; si en falta algun dia d’algun compte, és «parcial». Els traspassos entre comptes propis no són ni entrada ni eixida.` : undefined}>
            <GraficMensual titol="Eixides per mes, sense traspassos" mesos={h.serie.mesos} valorDe={(m) => m.eixides} visible={visible} />
            <Pestanyes etiqueta="Agrupa l’històric" pestanyes={[
              { id: 'mes', etiqueta: 'Per mes', contingut: <TaulaTrams titol="L’històric per mes" trams={h.serie.mesos} visible={visible} /> },
              { id: 'trimestre', etiqueta: 'Per trimestre', contingut: <TaulaTrams titol="L’històric per trimestre" trams={h.serie.trimestres} visible={visible} /> },
              { id: 'any', etiqueta: 'Per any', contingut: <TaulaTrams titol="L’històric per any" trams={h.serie.anys} visible={visible} /> }
            ]} />
            <TaulaCategories totals={h.serie.totals} visible={visible} />
          </Seccio>
          <SeccioIa serie={h.serie} visible={visible} />
          <SeccioRevisio h={h} visible={visible} />
          <PanellSimulacio h={h} visible={visible} />
          <SeccioLlibre h={h} subtle={subtle} descarrega={descarrega} onAnuncia={setAnunci} />
        </>
      ) : h.aprovat && !h.llegint && !h.porta.carregant ? (
        <EstatBuit icona={FileSearch} titol="Encara no hi ha cap extracte">
          Tria els extractes del banc de tot el període (un per trimestre i compte, per exemple): l’Històric els unix sense comptar dues vegades els dies repetits.
        </EstatBuit>
      ) : null}
    </>
  );

  return (
    <PaginaApp title="Històric i IA" subtitle="El banc des de l’any passat, la despesa en IA i les simulacions"
      lead="El panell del director financer: tots els extractes de l’1 de gener de l’any passat al final del trimestre passat, classificats en este ordinador."
      author={titular} barActions={boina} rellotgeViu rellotge={rellotge} labels={ETIQUETES} refTitol={refTitol}
      showComment={false} showShare={false} showConnect={false}>
      <p role="status" aria-live="polite" className="sdp-nomes-lector">{anunci}</p>
      {typeof porta === 'function' ? porta(contingut) : contingut}
    </PaginaApp>
  );
}

/**
 * La vista «Històric i IA» de la ruta: darrere del cofre xifrat. La
 * configuració de la persona viu xifrada a la col·lecció 'historic' de
 * l'únic cofre de l'app; en eixir de la vista, el cofre es bloqueja (la clau
 * i tot el que és desxifrat fora de la memòria).
 * @param {{ cofre?: object, magatzem?: object, subtle?: SubtleCrypto, tractors?: object[], entorn?: object,
 *   rellotge?: () => number, avui?: object, descarrega?: Function, titular?: object|null }} props
 *   `cofre`: per a les proves (creaCofreLocal); sense, el de l'app (cofreDeLaGestoria)
 *   `titular`: el de la sessió, que passa el pont (ordre del Mestre, 13-10-2026, pla 261013_1405, front B)
 */
export default function Historic({ cofre: cofreDeFora = null, ...props }) {
  const [cofre] = useState(() => cofreDeFora ?? cofreDeLaGestoria());
  const persistencia = useMemo(() => persistenciaDelCofre(cofre, COLLECCIO_HISTORIC), [cofre]);
  useEffect(() => () => cofre.bloqueja('eixida'), [cofre]);
  const { descarrega, rellotge } = props;
  const porta = useCallback((contingut) => (
    <PortaCofre cofre={cofre} descarrega={descarrega} rellotge={rellotge}>{() => contingut}</PortaCofre>
  ), [cofre, descarrega, rellotge]);
  return <VistaHistoric {...props} persistencia={persistencia} porta={porta} />;
}
