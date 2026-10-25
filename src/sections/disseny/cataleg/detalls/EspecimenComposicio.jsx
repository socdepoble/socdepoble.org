import { Especimen } from '../Especimen.jsx';
import { Pila, Fila, Graella, Costat, Centre, Superficie, Accions, Boto } from '../../../../components/PedraSeca/index.js';
import { Llinatge } from '../Llinatge.jsx';

/* T52 (ordre del Mestre, 260928) · Els sis contenidors de composició de
   PedraSeca/composicio, REALS. Fins ara estaven marcats «viu» amb fora:true al
   registre i cap espècimen no els pintava: la porta no els veia. Les caixes
   de mostra només fan visible l'espai; el que es prova és el contenidor.
   IDEA-26 i IDEA-27 (ordre del Mestre, 261025) · El seté, Accions: el bloc
   dels botons, que va sempre després del text que els explica. */

const CAIXES = Object.freeze(['Tomaques', 'Pebreres', 'Albergínies']);
const caixes = (noms = CAIXES) => noms.map((nom) => <div key={nom} className="sdp-especimen__caixa">{nom}</div>);

export default function EspecimenComposicio() {
  return (
    <>
      <Llinatge id="composicio" />
      <Especimen id="composicio" nom="Composició · Pila, Fila, Graella, Costat, Centre, Superficie i Accions"
        fitxer="src/components/PedraSeca/composicio/index.jsx"
        descripcio="Els contenidors de maquetació de Pedra Seca. Cap d’ells pinta res propi: només col·loquen els fills. L’espai (gap) és sempre un graó de l’escala: gap={4} vol dir var(--sdp-space-4). Els fa servir, per exemple, l’Agenda. Accions és el bloc dels botons: va després del paràgraf que diu per a què són, centrat i sempre a 24px del text de dalt, siga un paràgraf, un h2 o un h4."
        contracte={[
          ['Pila', '{ gap = 4, as = "div", className }', '—', 'Fills apilats cap avall.'],
          ['Fila', '{ gap = 4, wrap = true, align = "center", justify = "flex-start", as, className }', '—', 'Fills de costat; salten de línia si no caben.'],
          ['Graella', '{ gap = 4, columns = "auto", minWidth = "300px", as, className }', '—', 'Amb columns="auto", tantes columnes com càpiguen de minWidth; amb un número, columnes fixes.'],
          ['Costat', '{ width = "250px", gap = 4, reversed = false, className }', '—', 'Dos fills: el primer fa de barra lateral de width; reversed la passa a la dreta.'],
          ['Centre', '{ className }', '—', 'Centrat amb l’amplada de lectura (--sdp-measure).'],
          ['Superficie', '{ eleva = 1, radi = "m", as, className }', '—', 'Fons de superfície, ombra de token (1–3) i radi de token.'],
          ['Accions', '{ as = "div", className, ref }', '—', 'Els botons, després del text que els explica: centrats, a 12px entre ells i a 24px del text de dalt i del de baix.'],
        ]}
        a11y={['Són contenidors neutres: amb as es pot fer que siguen section, ul o article i conservar la semàntica.']}
        fes={['Triar el graó de gap de l’escala (0–6, 8, 10, 12, 16, 20).', 'Usar as per a donar semàntica (as="ul" per a una llista).', 'Posar els botons dins d’Accions, després del paràgraf que els explica.']}
        noFacis={[
          'Posar marges a mà entre fills: el gap ja ho fa.',
          'Posar un botó just davall d’un títol, sense el paràgraf que diu per a què és.',
          'Deute: Graella i Costat escriuen grid-template-columns en línia dins del component (el guard els té al deute), i Costat no s’apila en pantalla estreta.'
        ]}>
        <h4>Pila (gap 3)</h4>
        <Pila gap={3}>{caixes()}</Pila>
        <h4>Fila (gap 2, que salta de línia)</h4>
        <Fila gap={2}>{caixes()}</Fila>
        <h4>Graella automàtica (columnes de 10rem com a mínim)</h4>
        <Graella gap={3} minWidth="10rem" as="ul" className="sdp-especimen__llista-neta" aria-label="Hortalisses de mostra">
          {CAIXES.map((nom) => <li key={nom} className="sdp-especimen__caixa">{nom}</li>)}
        </Graella>
        <h4>Costat (barra lateral de 10rem)</h4>
        <Costat width="10rem" gap={3}>
          <div className="sdp-especimen__caixa">Barra lateral</div>
          <div className="sdp-especimen__caixa">Contingut principal, que ocupa la resta de l’amplada.</div>
        </Costat>
        <h4>Centre (amplada de lectura)</h4>
        <Centre>
          <p className="sdp-especimen__caixa">Un paràgraf de lectura no passa mai de l’amplada de lectura, encara que la columna siga molt ampla: així la vista no es perd en saltar de línia.</p>
        </Centre>
        <h4>Superficie (eleva 1, 2 i 3)</h4>
        <Fila gap={4}>
          {[1, 2, 3].map((eleva) => (
            <Superficie key={eleva} eleva={eleva} className="sdp-especimen__farciment">eleva={eleva}</Superficie>
          ))}
        </Fila>
        <h4>Accions (els botons, després del text)</h4>
        <p>Primer el paràgraf que diu què passarà; després, el bloc amb els botons, centrat i a 24px d’este text.</p>
        <Accions>
          <Boto varietat="primari" onClick={() => {}}>Desa els canvis</Boto>
          <Boto varietat="secundari" onClick={() => {}}>Cancel·la</Boto>
        </Accions>
      </Especimen>
    </>
  );
}
