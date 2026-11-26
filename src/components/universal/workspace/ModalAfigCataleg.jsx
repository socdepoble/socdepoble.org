/**
 * ModalAfigCataleg.jsx — IDEA-367 (v1.2.26 · Modal dual «Afig Catàleg / Fitxa»).
 *
 * Carregat sempre via `lazyRoute` (+0 B al nucli WP d'arrencada).
 * Oferix dos camins clars i accessibles:
 *   · Camí A: obrir el Bloc de Notes preassignat a la categoria Catàlegs i al llibre actual.
 *   · Camí B: seleccionar un PDF o document per preparar la seua conversió en llibre/fitxes.
 */
import { useId, useRef, useState } from 'react';
import { FileUp, NotebookPen } from 'lucide-react';
import { Boto } from '../../PedraSeca/atoms/Boto.jsx';
import { Dialeg } from '../../PedraSeca/organismes/Dialeg.jsx';
import { useFullDiferit } from '../../../config/fullDiferit.js';
import cssTaxonomiaV26 from '../../../css/diferit-taxonomia-v26.css?inline';
import { textosCatalegAfigV26 } from './i18nCatalegAfigV26.js';

function formatMida(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

export default function ModalAfigCataleg({
  obert,
  onTanca,
  font = 'catalegs',
  idioma = 'ca',
  onNavega,
  esSuperadmin = false
}) {
  const tx = textosCatalegAfigV26(idioma);
  const inputId = useId();
  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'taxonomia-v26', cssTaxonomiaV26);
  const [fitxer, setFitxer] = useState(null);

  const clauFont = encodeURIComponent(String(font || 'catalegs'));
  const obriBlocNotes = () => {
    onTanca?.();
    onNavega?.(`/notes?ambit=catalegs&cataleg=${clauFont}`);
  };
  const continuaAmbFitxer = () => {
    const nom = fitxer?.name ? `&importaFitxer=${encodeURIComponent(fitxer.name)}` : '';
    onTanca?.();
    onNavega?.(`/notes?ambit=catalegs&cataleg=${clauFont}${nom}`);
  };
  const obriAdminImportacio = () => {
    onTanca?.();
    onNavega?.('/el-meu-perfil?vista=admin-importacio');
  };

  return (
    <Dialeg
      obert={obert}
      onTanca={onTanca}
      titol={tx.catalegAfigV26Titol}
      etiquetaTancar={tx.catalegAfigV26Tanca}
      mida="g"
    >
      <div ref={arrelRef} className="sdp-cataleg-afig">
        <p>{tx.catalegAfigV26Subtitol}</p>
        <div className="sdp-cataleg-afig__camins">
          <section className="sdp-cataleg-afig__cami" aria-label={tx.catalegAfigV26CamiATitol}>
            <h3>{tx.catalegAfigV26CamiATitol}</h3>
            <p>{tx.catalegAfigV26CamiACos}</p>
            <div>
              <Boto varietat="primari" icona={NotebookPen} onClick={obriBlocNotes}>
                {tx.catalegAfigV26CamiABoto}
              </Boto>
            </div>
          </section>

          <section className="sdp-cataleg-afig__cami" aria-label={tx.catalegAfigV26CamiBTitol}>
            <h3>{tx.catalegAfigV26CamiBTitol}</h3>
            <p>{tx.catalegAfigV26CamiBCos}</p>
            <div className="sdp-cataleg-afig__fitxer">
              <label htmlFor={inputId}>{tx.catalegAfigV26CamiBSelector}</label>
              <input
                id={inputId}
                type="file"
                accept=".pdf,.md,.txt,.doc,.docx,.odt"
                onChange={(event) => setFitxer(event.target.files?.[0] ?? null)}
              />
              {fitxer ? (
                <p role="status">
                  {tx.catalegAfigV26CamiBPreparat
                    .replace('{nom}', () => fitxer.name)
                    .replace('{mida}', () => formatMida(fitxer.size))}
                </p>
              ) : null}
            </div>
            <div className="sdp-alerta__accions">
              <Boto varietat="secundari" icona={FileUp} disabled={!fitxer} onClick={continuaAmbFitxer}>
                {tx.catalegAfigV26CamiBContinua}
              </Boto>
              {esSuperadmin ? (
                <Boto varietat="fantasma" onClick={obriAdminImportacio}>
                  {tx.catalegAfigV26CamiBAdmin}
                </Boto>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </Dialeg>
  );
}
