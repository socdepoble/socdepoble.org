/**
 * SelectorDeVariacions.jsx — el selector compacte de variants d'un producte
 * del Mercat: una píndola per variació, una sola triada.
 *
 * Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 1) · «Aplica el
 * selector compacte de variants en píndoles (role="radiogroup" accessible)
 * dissenyat a l'auditoria de Gemini». Auditoria Codex 2030 (§4.1) · El valor
 * és la clau estable de la variació (mercat/variacionsDeProducte.js), mai la
 * posició.
 *
 * Abans de crear-lo es va buscar la maquinària que ja hi havia (lliçó 261007):
 *  · PillToggle (Pedra Seca) és un grup de botons commutadors (aria-pressed,
 *    role="group"): no té la semàntica d'una tria única.
 *  · GrupOpcions (PedraSeca/organismes/formulari.jsx) són ràdios natius en
 *    files de formulari o en targetes grans («elecció protagonista»), sense
 *    píndoles ni role="radiogroup".
 * Ací, el fonament de GrupOpcions: ràdios natius amb el mateix name dins d'un
 * fieldset real amb la seua llegenda, i el fieldset porta role="radiogroup"
 * (ARIA in HTML el permet en un fieldset). Tab entra al grup per la triada i
 * les fletxes canvien la tria: ho fa el navegador, cap JS de teclat. Cada
 * píndola és el label del seu ràdio (la zona tàctil sencera, mai menys de
 * --sdp-touch), i la triada es pinta des del :checked del ràdio (sense :has(),
 * Baseline Safari 16), amb el blau ple de la píndola de Pedra Seca. Res del
 * codi d'exemple de l'auditoria (botons amb role="radio" i variables amb
 * fallback): estils a src/css/modules.css, només tokens.
 * Una variació esgotada es marca (vora discontínua i la Insignia de Pedra Seca
 * amb el text, que forma part del nom del ràdio) però es pot triar: qui la
 * tria en veu la fitxa i el botó del cabàs desactivat (detailSectionMeta.jsx).
 *
 * Props:
 *   llegenda     string · el nom del grup, visible.
 *   opcions      [{ valor, etiqueta, esgotada? }] · valor: la clau estable.
 *   valor        la clau triada (controlat).
 *   onCanvi      (valor) => void.
 *   textEsgotat  string · el text de la insígnia, ja traduït.
 */
import { useId } from 'react';
import { Insignia } from '../../components/PedraSeca/atoms/Insignia.jsx';

export function SelectorDeVariacions({ llegenda, opcions = [], valor, onCanvi, textEsgotat = 'Esgotat' }) {
  const id = useId();
  const idLlegenda = `${id}-llegenda`;
  return (
    <fieldset className="sdp-variants" role="radiogroup" aria-labelledby={idLlegenda}>
      <legend id={idLlegenda} className="sdp-variants__llegenda">{llegenda}</legend>
      <div className="sdp-variants__pindoles">
        {opcions.map((opcio) => {
          const idOpcio = `${id}-${opcio.valor}`;
          return (
            <div key={opcio.valor} className={opcio.esgotada ? 'sdp-variant sdp-variant--esgotada' : 'sdp-variant'}>
              <input type="radio" id={idOpcio} name={id} value={opcio.valor}
                className="sdp-variant__control sdp-sr-only"
                checked={opcio.valor === valor}
                onChange={() => onCanvi?.(opcio.valor)} />
              <label htmlFor={idOpcio} className="sdp-variant__pindola">
                <span className="sdp-variant__nom">{opcio.etiqueta}</span>
                {/* L'espai separa les dues paraules al nom del ràdio («Edició
                    Verda Esgotat»); dins del flex de la píndola no es pinta. */}
                {opcio.esgotada ? <>{' '}<Insignia to="avis" className="sdp-variant__estat">{textEsgotat}</Insignia></> : null}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
