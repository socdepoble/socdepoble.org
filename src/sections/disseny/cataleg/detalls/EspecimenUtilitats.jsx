import { Especimen } from '../Especimen.jsx';
import { Pista, Boto, Camp, CampText, AreaText, Divisor } from '../../../../components/PedraSeca/index.js';

const UTILITATS = [
  ['Visibilitat', [['.sr-only / .sdp-sr-only', 'Ocult visualment, llegible pel lector de pantalla'], ['.sdp-nomes-lector', 'Idem, vocabulari Pedra Seca'], ['.sdp-ocult-mobil', 'Amaga per davall de 720px'], ['.light-only / .dark-only', 'Imatges segons tema']]],
  ['Color de text', [['.sdp-text-exit', '✓ Èxit'], ['.sdp-text-error', '✕ Error'], ['.sdp-text-avis', 'Avís'], ['.text-accent', 'Accent (taronja)']]],
  ['Alineació i pes', [['.sdp-text-dreta', 'Números en taules'], ['.sdp-text-negreta', 'Èmfasi']]]
];

export default function EspecimenUtilitats() {
  return (
    <Especimen id="utilitats" nom="Utilitats, llistes, divisors i peus" fitxer="src/css/utilities.css · src/css/modules.css"
      descripcio="Les peces menudes de la pàgina: pistes (tooltips), llistes editorials, divisors i separadors, classes utilitàries, peus de pàgina i un exemple de composició d'un formulari de contacte amb components canònics."
      fes={['Divisor per a separar seccions; hr només dins de contingut ric.', 'Pista només per a informació complementària, mai per a l’única instrucció.']}
      noFacis={['title com a únic mitjà d’ajuda en controls tàctils.', 'Utilitats per a maquetar pàgines senceres.']}>
      <h4>Pistes (toggletips)</h4>
      <p>El <code>title</code> del catàleg antic no existix en pantalla tàctil: la pista es toca, s’anuncia i es tanca amb Escape.</p>
      <div className="sdp-especimen__fila">
        <span className="tooltip-term">Terme amb ajuda <Pista etiqueta="Què vol dir «terme»?">Explicació addicional del terme, llegible pel lector de pantalla.</Pista></span>
        <span>Mesura de columna <Pista etiqueta="Què és la mesura de columna?">68 caràcters per línia: el límit abans de la fatiga ocular.</Pista></span>
      </div>

      <h4>Llistes</h4>
      <div className="lists-preview">
        <div>
          <h5>Ordenada</h5>
          <ol><li>Registrar-se al portal</li><li>Seleccionar el poble</li><li>Pujar contingut històric</li><li>Revisar i publicar</li></ol>
        </div>
        <div>
          <h5>Desordenada</h5>
          <ul><li>Fotografies antigues</li><li>Documents administratius</li><li>Entrevistes orals</li></ul>
        </div>
      </div>

      <h4>Divisors i separadors</h4>
      <div className="divider-preview"><div className="divider-label">Divisor (component)</div><Divisor /></div>
      <div className="divider-preview"><div className="divider-label">Divisor amb text</div><div className="divider-text">O BÉ</div></div>
      <div className="divider-preview"><div className="divider-label">Separador de secció (major)</div><div className="divider-major"></div></div>
      <div className="divider-preview"><div className="divider-label">Separador puntejat</div><div className="divider-dashed"></div></div>

      <h4>Classes utilitàries</h4>
      <div className="utils-grid">
        {UTILITATS.map(([grup, classes]) => (
          <div className="utils-box" key={grup}>
            <h5>{grup}</h5>
            <ul className="utils-list">
              {classes.map(([c, q]) => <li key={c}><strong>{c}</strong> · {q}</li>)}
            </ul>
          </div>
        ))}
      </div>

      <h4>Peus de pàgina</h4>
      <p><strong>Complet:</strong> enllaços, legal i xarxes (el de l’app, a la barra lateral: Versions · Legal i privacitat).</p>
      <p><strong>Minimalista:</strong> © 2026 Sóc de Poble. Tots els drets reservats.</p>

      <h4>Composició: formulari de contacte</h4>
      <form className="card dsg-center-600" onSubmit={(e) => e.preventDefault()} aria-label="Formulari de contacte (exemple)">
        <h5>Contacta amb nosaltres</h5>
        <p>Envia’ns els teus dubtes o suggeriments per a millorar el portal.</p>
        <Camp etiqueta="Correu electrònic" obligatori><CampText tipus="email" placeholder="elteu@correu.cat" autoComplete="email" /></Camp>
        <Camp etiqueta="El teu missatge"><AreaText placeholder="Com ens pots ajudar?" /></Camp>
        <div className="sdp-especimen__fila"><Boto tipus="submit" varietat="primari">Enviar el missatge</Boto></div>
      </form>
    </Especimen>
  );
}
