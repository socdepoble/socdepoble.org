import { useRef } from 'react';
import { Link } from '../../app/contexts/RouterContext';
import { useUIStateOpcional } from '../../app/contexts/UIContext';
import { useFullDiferit } from '../../config/fullDiferit.js';
import { SUPPORTED_LANGUAGES, normalizeLanguage } from '../../config/i18n.js';
import cssPeuICanals from '../../css/diferit-peu-i-canals.css?inline';
import { Globe } from '../../icons.jsx';
import { tradueix, useTraductorOpcional } from '../PedraSeca/hooks/useTraductorOpcional.js';

/* Un mock del Router sense Link fa petar la lectura de l'import: el peu torna a l'<a> de sempre. */
function resolLink() {
  try {
    return Link || null;
  } catch {
    return null;
  }
}

const PARELLS_PEU_IDIOMA = Object.freeze({
  titol: Object.freeze(['topbar.identitat.idioma', 'Idioma del sistema']),
  subtitol: Object.freeze([
    'nav.idiomaSubtitle',
    'Canvia l’idioma de la interfície i guarda la preferència al navegador.'
  ]),
  accio: Object.freeze(['nav.idiomaTitle', 'Tria un idioma'])
});

export function etiquetaPeuEditorialIdioma(t) {
  return tradueix(t, PARELLS_PEU_IDIOMA.titol);
}

export default function PeuEditorialIdioma() {
  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'peu-i-canals', cssPeuICanals);
  const ui = useUIStateOpcional();
  const t = useTraductorOpcional();
  const EnllacRouter = resolLink();
  const codiActiu = normalizeLanguage(ui?.llenguaDelText || ui?.language);
  const idiomaActiu =
    SUPPORTED_LANGUAGES.find((entrada) => entrada.code === codiActiu)?.name || 'Valencià';
  const classeAccio = 'sdp-boto sdp-boto--secundari sdp-peu-editorial-idioma__accio';
  const contingutAccio = (
    <>
      <Globe className="icona-linia" size={18} strokeWidth={2.1} aria-hidden="true" focusable="false" />
      <span>{tradueix(t, PARELLS_PEU_IDIOMA.accio)}</span>
    </>
  );

  return (
    <div ref={arrelRef} className="sdp-peu-editorial-idioma">
      <div className="sdp-peu-editorial-idioma__text">
        <p className="sdp-peu-editorial-idioma__titol">
          <span>{tradueix(t, PARELLS_PEU_IDIOMA.titol)}</span>
          <span className="sdp-peu-editorial-idioma__actual">{idiomaActiu}</span>
        </p>
        <p className="sdp-peu-editorial-idioma__subtitol">
          {tradueix(t, PARELLS_PEU_IDIOMA.subtitol)}
        </p>
      </div>
      {EnllacRouter ? (
        <EnllacRouter to="/traduccions" className={classeAccio}>
          {contingutAccio}
        </EnllacRouter>
      ) : (
        <a href="/traduccions" className={classeAccio}>
          {contingutAccio}
        </a>
      )}
    </div>
  );
}
