import { CheckCircle2, Trash2, FileText, ArrowDown, Paperclip } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import { Casella, Progres } from '../../../../components/PedraSeca/index.js';

const CHECKLIST = [
  ['Verificació prèvia a publicar', true],
  ['Revisar ortografia i valencià', true],
  ['Comprovar imatges (alt text obligatori)', true],
  ['Validar enllaços interns', false],
  ['Revisar contrast de colors (WCAG 2.2 AA)', false]
];

export default function EspecimenTasquesFitxers() {
  return (
    <Especimen id="tasques-fitxers" nom="Tasques, pujades i descàrregues" fitxer="src/css/modules.css (.checklist-admin · .upload-zone · .file-item · .download-card)"
      descripcio="Llistes de comprovació d'administració (Casella de Pedra Seca dins de .checklist-admin), zona d'arrossegament de fitxers amb progrés real i targeta de descàrrega amb nom, format i pes."
      a11y={['Cada casella és un control natiu amb etiqueta clicable.', 'La pujada mostra Progres amb valor real; mai una barra que s’inventa.', 'La descàrrega diu format i pes en text.']}
      fes={['Data al costat de la tasca amb .date-tag (done si està feta).']}
      noFacis={['Zones d’arrossegament sense botó alternatiu «selecciona’ls del teu dispositiu».']}>
      <h4>Checklist d’administració</h4>
      <div className="checklist-admin">
        {CHECKLIST.map(([text, feta]) => (
          <div className="checklist-item" key={text}>
            <Casella etiqueta={text} defaultChecked={feta} />
          </div>
        ))}
      </div>

      <h4>Llista de tasques amb data</h4>
      <div className="checklist-admin">
        <div className="checklist-item">
          <Casella etiqueta="Migrar base de dades històrica" defaultChecked />
          <span className="date-tag done">15/01</span>
        </div>
        <div className="checklist-item">
          <Casella etiqueta="Digitalitzar fotografies del fons municipal" />
          <span className="date-tag">01/02</span>
        </div>
      </div>

      <h4>Zona d’arrossegament de fitxers</h4>
      <div className="upload-zone">
        <div className="upload-zone-text"><Paperclip size={18} aria-hidden="true" /> Arrossega els arxius ací</div>
        <div className="upload-zone-sub">o <span>selecciona’ls del teu dispositiu</span></div>
        <div>Màxim 10 MB per arxiu. Formats: JPG, PNG, PDF</div>
      </div>
      <div className="file-item">
        <div className="file-item-info">
          <div className="file-item-name">festa_major_2024.jpg</div>
          <div className="file-item-meta">2,4 MB</div>
        </div>
        <button type="button" className="file-item-action" aria-label="Esborrar festa_major_2024.jpg"><Trash2 size={16} aria-hidden="true" /></button>
      </div>
      <Progres etiqueta="Pujada d’imatges" valor={45} />

      <h4>Enllaç de descàrrega</h4>
      <div className="download-card">
        <div className="download-card-icon"><FileText size={16} aria-hidden="true" /></div>
        <div className="download-card-info">
          <div className="download-card-title">Carta Pobla de Benigànim (1248)</div>
          <div className="download-card-meta">PDF • 3,2 MB • Transcripció paleogràfica</div>
        </div>
        <a className="download-card-btn" href="#descarrega" onClick={(e) => e.preventDefault()} aria-label="Descarregar la Carta Pobla de Benigànim"><ArrowDown size={16} aria-hidden="true" /></a>
      </div>
      <p><CheckCircle2 size={16} aria-hidden="true" /> Les icones són de lucide-react, com a la resta del sistema.</p>
    </Especimen>
  );
}
