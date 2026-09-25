/* Peces internes de la Consola (sense classes noves fora de sdp-consola__*).
   Les comparteixen els panells de ConsolaSection i el Mapa. */
import { createContext, useContext } from 'react';
import { UniversalCard } from '../../components/PedraSeca';

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

/* La targeta de resum de la Consola és la del Panell de Control, sense cap
   variant pròpia (ordre del Mestre): UniversalCard «action», icona lucide de
   40 px amb traç 1,5, títol i descripció de subtítol, dins de .sdp-card-grid.
   Referència: src/sections/control/ControlSection.jsx. `a` la fa enllaç,
   `onObri` botó; sense cap dels dos, és només resum. */
export function TargetaResum({ icona: Icona, titol, descripcio, a, onObri, etiquetes }) {
  return (
    <UniversalCard
      variant="action"
      icon={<Icona size={40} strokeWidth={1.5} />}
      title={titol}
      subtitle={descripcio}
      mainHref={a}
      onMainClick={onObri}
      labels={etiquetes}
    />
  );
}

/** Una xifra és una targeta de resum amb el número de títol i el que compta de subtítol. */
export function Xifra({ etiqueta, valor, icona, a }) {
  return <TargetaResum icona={icona} titol={String(valor)} descripcio={etiqueta} a={a} />;
}

/* Etiquetes d'estat de les targetes, amb les classes del Panell de Control:
   el que funciona, en `sdp-badge-system` (ACTIU); la resta, en `sdp-badge-tag`. */
export const etiquetaBona = (text) => [{ text, className: 'sdp-badge-system' }];
export const etiquetaPendent = (text) => [{ text, className: 'sdp-badge-tag' }];
