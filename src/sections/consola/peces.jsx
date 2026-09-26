/* Peces internes de la Consola (sense classes noves fora de sdp-consola__*).
   Les comparteixen els panells de ConsolaSection i el Mapa. */
import { createContext, forwardRef, useContext, useLayoutEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { UniversalCard } from '../../components/PedraSeca';
import { useNavigate } from '../../app/contexts/RouterContext';

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

/* La targeta de resum de la Consola és la del Panell de Control, sense cap
   variant pròpia (ordre del Mestre): UniversalCard «action», icona lucide de
   40 px amb traç 1,5, títol i descripció de subtítol, dins de .sdp-card-grid.
   Referència: src/sections/control/ControlSection.jsx. `a` la fa enllaç,
   `onObri` botó; sense cap dels dos, és només resum, i `sdp-consola__quieta`
   li lleva l'elevació i la mà de «clicable» que la recepta posa a totes. */
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

/** Una xifra és una targeta de resum amb el número de títol i el que compta de subtítol. */
export function Xifra({ etiqueta, valor, icona, a }) {
  return <TargetaResum icona={icona} titol={String(valor)} descripcio={etiqueta} a={a} />;
}

/* Autoria de les targetes explicatives: la mateixa marca que les targetes
   del Mur (espècimen de UniversalCard al catàleg de Disseny). */
export const AUTORIA_CONSOLA = Object.freeze({
  author: 'Consola Termodinàmica',
  avatarUrl: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg'
});

const dosXifres = (n) => String(n).padStart(2, '0');

/**
 * Hora i data d'una instantània per a la capçalera de la targeta, amb el
 * calendari local (mai UTC): { time: 'hh:mm', date: 'dd/mm/aa', dateTime }.
 * Sense instantània vàlida no hi ha data, i la capçalera no n'inventa cap.
 */
export function momentInstantania(iso) {
  if (typeof iso !== 'string' || !iso) return {};
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return {};
  return {
    time: `${dosXifres(d.getHours())}:${dosXifres(d.getMinutes())}`,
    date: `${dosXifres(d.getDate())}/${dosXifres(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`,
    dateTime: iso
  };
}

/* La targeta que explica una part de la Consola és la UniversalCard
   sencera del Mur, no la recepta compacta del Control (ordre del Mestre,
   260926): boina taronja amb l'autoria, la font i l'hora de la instantània;
   la icona de la part en el lloc de la foto (insígnia lateral, com les
   targetes sense foto del catàleg); títol, subtítol amb el «per a què»,
   entradilla i la dada viva; etiquetes d'estat; i el peu blau amb l'acció.
   `a` la fa enllaç (Compartir + «Obrir»); `onObri`, botó («Veure detall»);
   sense cap dels dos és només explicació: sense peu i sense aparença de
   clicable (no hi ha peus buits). */
export function TargetaConsola({
  icona: Icona, titol, subtitol, entradilla, dada, font, generat, a, onObri, etiquetes
}) {
  const navigate = useNavigate();
  const activa = Boolean(a || onObri);
  const obri = a ? () => navigate(a) : onObri;
  return (
    <UniversalCard
      className={activa ? 'sdp-consola__targeta' : 'sdp-consola__targeta sdp-consola__quieta'}
      author="Sóc de Poble"
      location="La Torre de les Maçanes"
      avatarUrl="/assets/system/ui/logo-socdepoble-cuadrat-verd.svg"
      {...momentInstantania(generat)}
      onDateTime={false}
      squareBadge={{
        type: 'custom',
        label: titol,
        content: <Icona size={48} strokeWidth={1.5} aria-hidden="true" focusable="false" />
      }}
      title={titol}
      subtitle={subtitol}
      body={(
        <>
          {entradilla && <p>{entradilla}</p>}
          {dada && <p className="sdp-consola__dada">{dada}</p>}
        </>
      )}
      labels={Array.isArray(etiquetes) ? [...etiquetes.map(aEtiqueta), { text: `Font: ${font}`, className: 'sdp-badge-tag' }] : (etiquetes ? [etiquetes, { text: `Font: ${font}`, className: 'sdp-badge-tag' }] : [{ text: `Font: ${font}`, className: 'sdp-badge-tag' }])}
      mainHref={a}
      onMainClick={onObri}
      showTranslate={true}
      showComment={true}
      showShare={true}
      showConnect={activa}
      onConnect={obri}
      telemetria={{ comptar: false }}
    />
  );
}

/* Etiquetes d'estat de les targetes, amb les classes del Panell de Control:
   el que funciona, en `sdp-badge-system` (ACTIU); la resta, en `sdp-badge-tag`. */
export const etiquetaBona = (text) => [{ text, className: 'sdp-badge-system' }];
export const etiquetaPendent = (text) => [{ text, className: 'sdp-badge-tag' }];

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
 * La targeta que obri un desplegable diu quin (aria-controls) i si està
 * obert (aria-expanded). UniversalCard no deixa passar atributs als seus
 * botons: s'escriuen al botó de la targeta (overlay) i al «Veure detall» del
 * peu, que React no gestiona. `desplegables[i]` va amb el fill i-èsim de la
 * graella: { controla, obert } o null si la targeta no obri res.
 */
export function useTargetesQueObrin(graella, desplegables) {
  const clau = desplegables.map((d) => (d ? `${d.controla}:${d.obert}` : '-')).join('|');
  useLayoutEffect(() => {
    const targetes = graella.current?.children ?? [];
    desplegables.forEach((d, i) => {
      const targeta = targetes[i];
      const botons = [
        [...(targeta?.children ?? [])]
          .find((el) => el.tagName === 'BUTTON' && el.classList.contains('sp-card-link-overlay')),
        targeta?.querySelector?.('.sp-card-footer button.sp-card-connect')
      ].filter(Boolean);
      for (const boto of botons) {
        if (d) {
          boto.setAttribute('aria-controls', d.controla);
          boto.setAttribute('aria-expanded', String(Boolean(d.obert)));
        } else {
          boto.removeAttribute('aria-controls');
          boto.removeAttribute('aria-expanded');
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graella, clau]);
}

/** Qui ha demanat menys moviment rep el salt directe, no el lliscament. */
export function movimentReduit() {
  try {
    return Boolean(globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  } catch {
    return false;
  }
}

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
