/* Peces internes de la Consola (sense classes noves fora de sdp-consola__*).
   Les comparteixen els panells de ConsolaSection i el Mapa. */
import { createContext, forwardRef, useContext } from 'react';
import { ChevronDown } from 'lucide-react';
import { Insignia, UniversalCard } from '../../components/PedraSeca';
import { useNavigate } from '../../app/contexts/RouterContext';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
import { AUTORIA_SOCDEPOBLE } from '../control/destinsControl.js';
import { retallaProblemes } from './problemesConsola.js';

/* Mode privacitat (l'interruptor d'Emowe): amaga rutes, ordres i empremtes
   per a gravar o compartir pantalla sense repassar-la abans. Tot el que la
   Consola pinta amb <Mono> o <Privat> passa per ací. */
export const PrivacitatConsola = createContext(false);

/** Una ruta, ordre o empremta dins de text corrent: la mateixa tipografia, amagada si cal. */
export function Privat({ children }) {
  const privat = useContext(PrivacitatConsola);
  if (!privat) return children;
  return (
    <>
      <span aria-hidden="true">••••••</span>
      <span className="sdp-nomes-lector">dada amagada pel mode privacitat</span>
    </>
  );
}

export function Mono({ children }) {
  return <code className="sdp-consola__mono"><Privat>{children}</Privat></code>;
}

/* Una etiqueta amb `to` (el vocabulari d'Insignia: error, avis, info, exit,
   neutre) porta les classes d'Insignia dins de la targeta; la resta passa
   tal qual, amb les classes del Panell de Control. */
const aEtiqueta = (e) => (e?.to ? { text: e.text, className: `sdp-insignia sdp-insignia--${e.to}` } : e);

/* OBSOLETA · Ordre del Mestre, 261004 (xat: cap xifra solta). Derogat per
   l'ordre del Mestre del 261004 (xat: cap xifra solta): cap pàgina de la
   Consola no la pinta. Tota xifra i tota peça és ara una TargetaConsola amb
   boina i pàgina pròpia (TargetaXifra, XifresMas.jsx). Es conserva perquè
   ningú no l'esborre a cegues; no s'ha de tornar a fer servir.
   Era la targeta de resum del Panell de Control, sense cap variant pròpia:
   UniversalCard «action», icona lucide de 40 px amb traç 1,5, títol i
   descripció de subtítol, dins de .sdp-card-grid. `a` la feia enllaç,
   `onObri` botó; sense cap dels dos, `sdp-consola__quieta` li llevava
   l'elevació i la mà de «clicable». */
export function TargetaResum({ icona: Icona, titol, descripcio, a, onObri, etiquetes }) {
  return (
    <UniversalCard
      variant="action"
      className={a || onObri ? undefined : 'sdp-consola__quieta'}
      icon={<Icona size={40} strokeWidth={1.5} />}
      title={titol}
      subtitle={descripcio}
      mainHref={a}
      onMainClick={onObri}
      labels={Array.isArray(etiquetes) ? etiquetes.map(aEtiqueta) : etiquetes}
    />
  );
}

/** OBSOLETA (ordre del Mestre, 261004, xat: cap xifra solta) · Una xifra
    solta, sense boina ni pàgina. Cap pàgina de la Consola no la pinta: les
    xifres són TargetaXifra (XifresMas.jsx). No s'ha de tornar a fer servir. */
export function Xifra({ etiqueta, valor, icona, a }) {
  return <TargetaResum icona={icona} titol={String(valor)} descripcio={etiqueta} a={a} />;
}

/* La targeta que explica una part de la Consola és la UniversalCard
   sencera del Mur, no la recepta compacta del Control (ordre del Mestre,
   260926): la icona de la part en el lloc de la foto (insígnia lateral, com
   les targetes sense foto del catàleg); títol, subtítol amb el «per a què»,
   entradilla i la dada viva; etiquetes d'estat; i el peu blau.
   Ordre del Mestre, 261004 (xat: tota targeta amb boina i pàgina pròpia) ·
   Derogat per l'ordre del Mestre del 261004 (xat: tota targeta amb boina i
   pàgina pròpia): la targeta de sistema sense boina i la data a l'última
   línia del cos (prompt 261004_0515, §6/T8). El que no es podia fer era
   inventar l'autor «Consola Termodinàmica»; l'autor real és l'entitat:
    · LA BOINA DE SÓC DE POBLE (AUTORIA_SOCDEPOBLE, destinsControl.js): el
      logo, el nom i el poble, i l'autor porta al perfil de l'entitat
      (rutaDAutoria per l'id de l'entitat, mai pel nom; Onada 8, 261009:
      /empresa/socdepoble, abans la pàgina del projecte, /projecte).
    · LA DATA, A LA PASTILLA DE LA BOINA (T51, regla del Mestre: cap document
      sense data). `creat` és la data de redacció del seu text (el copy de la
      Consola) i `generat`, la de la instantània: es pinta la més recent
      (editorial.js, dataHoraDeBarra), amb el format únic hh:mm i dd/mm/aa.
      És una instantània de dades, no una publicació: un <time> sense clic
      (onDateTime={false}), que no porta al Calendari.
    · LA IMATGE O LA ICONA. `imatge` va al mitjà de la targeta (i és la
      portada de la seua pàgina); sense, la icona a la insígnia lateral.
      Derogat EN PART per l'ordre del Mestre del 13-10-2026 (pla
      261013_1405, front F): «la icona de la part en el lloc de la foto»
      (ordre del 260926) per a les nou targetes del tauler de /consola, que
      porten la il·lustració de la seua pàgina (imatgesConsola.js). La
      portada de la pàgina encara no: la imatge només n'és la del SEO
      (ConsolaSection.jsx · seoDe). Les xifres, els panells del pols i la
      Consola incrustada de la Wiki continuen amb la icona.
    · TOTA CLICABLE. `a` la fa enllaç cap a la seua pàgina; `onObri`, botó.
      Sense cap dels dos és només explicació: sense peu i sense aparença de
      clicable (no hi ha peus buits). Ordre del Mestre, 261004 (xat: cap xifra
      solta) · hui tota targeta de la Consola porta `a` (la seua pàgina
      pròpia): el pols ja no obri desplegables i cap targeta no és quieta.
    · EL PEU DE LA BARRA BLAVA. Traduir, Comentar, Compartir i Connectar per
      defecte (useAccions), amb el verb canònic «Connectar»: res de «Obrir» ni
      «Veure detall». Connectar porta on porta la targeta (la pàgina, o el
      detall del pols) i compta com qualsevol Connectar; Compartir comparteix
      l'adreça de la seua pàgina (mainHref).
   T2 (ordre del Mestre, 260930) · `metriques`: amb una llista no buida, cada
   mètrica és un h5 centrat (efecte tauler, i l'Índex de la Consola les
   recull); sense, `dada` en paràgraf, que és on van els missatges d'estat
   («Saldo desconegut», «Mapa no disponible…»): no són mètriques.
   T3 (ordre del Mestre, 260930) · `estats`: el que la pàgina marca per dins
   ({ clau, text, to }, el més greu primer; consolaPagines.js · estatsPagina),
   en una llista d'insígnies darrere de les mètriques. Ni capçaleres (l'Índex
   no s'empastra) ni etiquetes de la targeta (el nivell i «Canvis nous» van a
   part). Sense estats, el cos és el de sempre.
   Onada 6 (requisit 9: informació en superfície) · `problemes`: quins són,
   no només quants ({ clau, text, ruta? }, problemesConsola.js), en una llista
   darrere dels estats. Com a molt MAX_PROBLEMES_TARGETA i «i N més»: la llista
   sencera és a la pàgina. La ruta va en <Mono> i el mode privacitat l'amaga.
   La targeta continua portant a la seua pàgina (ordre del Mestre, 261004).
   Sense problemes (null o buida), el cos és el de sempre. Correcció de
   l'Onada 6 (revisió adversarial) · la `marca` de cada problema (la severitat
   d'un avís, l'estat d'una tasca, el color d'una skill) va davant, en una
   Insignia amb el color del semàfor: la llista també fa de semàfor. */
export function TargetaConsola({
  icona: Icona, titol, subtitol, entradilla, dada, metriques, estats, problemes, creat, generat, a, onObri, etiquetes,
  imatge = null, imatgeAlt = ''
}) {
  const navigate = useNavigate();
  const activa = Boolean(a || onObri);
  const obri = a ? () => navigate(a) : onObri;
  const ambMetriques = Array.isArray(metriques) && metriques.length > 0;
  const ambEstats = Array.isArray(estats) && estats.length > 0;
  const { visibles, resta } = retallaProblemes(problemes);
  const quan = dataHoraDeBarra({ creat, modificat: generat });
  return (
    <UniversalCard
      className={activa ? 'sdp-consola__targeta' : 'sdp-consola__targeta sdp-consola__quieta'}
      {...AUTORIA_SOCDEPOBLE}
      time={quan.time}
      date={quan.date}
      dateTime={quan.dateTime}
      onDateTime={false}
      imageUrl={imatge || undefined}
      imageAlt={imatgeAlt}
      squareBadge={imatge ? null : {
        type: 'custom',
        label: titol,
        content: <Icona size={48} strokeWidth={1.5} aria-hidden="true" focusable="false" />
      }}
      title={titol}
      subtitle={subtitol}
      body={(
        <>
          {entradilla && <p>{entradilla}</p>}
          {ambMetriques ? (
            <div className="sdp-consola__metriques">
              {metriques.map((m, i) => <h5 key={i} className="sdp-consola__metrica">{m}</h5>)}
            </div>
          ) : dada && <p className="sdp-consola__dada">{dada}</p>}
          {ambEstats && (
            <ul className="sdp-consola__estats" aria-label="Estat per dins, el més greu primer">
              {estats.map((e) => <li key={e.clau}><Insignia to={e.to}>{e.text}</Insignia></li>)}
            </ul>
          )}
          {visibles.length > 0 && (
            <ul className="sdp-consola__evidencies sdp-consola__problemes" aria-label="Quins problemes hi ha">
              {visibles.map((p) => (
                <li key={p.clau}>
                  {p.marca ? <><Insignia to={p.to ?? 'neutre'}>{p.marca}</Insignia>{' '}</> : null}
                  {p.text}{p.text && p.ruta ? ' · ' : null}{p.ruta ? <Mono>{p.ruta}</Mono> : null}
                </li>
              ))}
              {resta > 0 && <li>{`i ${resta} més`}</li>}
            </ul>
          )}
        </>
      )}
      labels={Array.isArray(etiquetes) ? etiquetes.map(aEtiqueta) : etiquetes}
      mainHref={a}
      onMainClick={onObri}
      hasFooter={activa}
      onConnect={activa ? obri : undefined}
    />
  );
}

/* Etiquetes d'estat de les targetes, amb els colors del semàfor (Onada 6):
   el que falta, taronja. Viuen a xifresComu.js (sense React), perquè les
   peces del Mapa les calculen. Correcció de l'Onada 6 (revisió adversarial) ·
   derogades etiquetaBona i etiquetaGreu: ningú no les cridava (el verd i el
   roig de les xifres els posa xifresComu.js · etiquetaDeColor). */
export { etiquetaPendent } from './xifresComu.js';

/* ── Desplegables «Veure detall de…» ─────────────────────────────────────
   <details> natiu: s'obri i es tanca sense JavaScript i el lector de
   pantalla ja n'anuncia l'estat. El disseny (fila sencera, xebró que gira,
   marge sota la barra blava) viu a src/css/modules.css (§ CONSOLA). */
export const Desplegable = forwardRef(function Desplegable({ id, titol, onToggle, children }, ref) {
  return (
    <details id={id} ref={ref} className="sdp-consola__detall" onToggle={onToggle}>
      <summary className="sdp-consola__detall-cap">
        <span>{titol}</span>
        <ChevronDown className="sdp-consola__detall-xebro" size={24} aria-hidden="true" focusable="false" />
      </summary>
      <div className="sdp-consola__detall-cos">{children}</div>
    </details>
  );
});

/**
 * Torna al cim el primer contenidor desplaçat que embolcalla `el`. Les
 * pàgines de /consola/* compartixen un sol element muntat i el contenidor de
 * scroll de l'aplicació conserva la posició: sense açò, una targeta del peu
 * del tauler obria la pàgina nova a mitges, sense títol ni controls.
 */
export function tornaAlCim(el) {
  for (let pare = el?.parentElement; pare; pare = pare.parentElement) {
    if (pare.scrollTop > 0) {
      pare.scrollTop = 0;
      return pare;
    }
  }
  return null;
}
