/**
 * BlocModeRuralPerfil.jsx — IDEA-341 · Accés explicat en les 5 llengües al
 * Mode rural (guardat local sense cobertura) dins d'«El meu perfil › Privacitat i dades».
 *
 * Viu com a tros diferit (0 B a pesDelNucli) i alinea el botó d'accés al centre
 * (Llei 9) conservant viva la ruta profunda /control?fitxa=mode-rural.
 */
import { useRef } from 'react';
import { Link } from '../../app/contexts/RouterContext';
import { useUIStateOpcional } from '../../app/contexts/UIContext';
import { useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { useFullDiferit } from '../../config/fullDiferit.js';
import cssPerfilShell from '../../css/diferit-perfil-shell.css?inline';
import { BlocPerfil } from './BlocPerfil.jsx';
import { codiLlenguaPerfil } from './i18nPerfilA11y.js';

export const RUTA_FITXA_MODE_RURAL = '/control?fitxa=mode-rural';

export const TEXTOS_MODE_RURAL_PERFIL = Object.freeze({
  ca: Object.freeze({
    titol: 'Mode rural (guardat local sense cobertura)',
    explica: 'Quan vas al camp, al bancal o al mas sense internet, el Mode rural et deixa apuntar notes directament en este aparell, exportar-ne una còpia en JSON i preparar paquets signats sense enviar res fora.',
    boto: 'Obrir el Mode rural',
  }),
  es: Object.freeze({
    titol: 'Modo rural (guardado local sin cobertura)',
    explica: 'Cuando vas al campo, al bancal o a la partida rural sin internet, el Modo rural te permite apuntar notas directamente en este dispositivo, exportar una copia en JSON y preparar paquetes firmados sin enviar nada fuera.',
    boto: 'Abrir el Modo rural',
  }),
  en: Object.freeze({
    titol: 'Rural mode (offline local notes)',
    explica: 'When you head out to the fields or a rural homestead without internet coverage, Rural mode lets you jot down notes directly on this device, export a JSON backup and prepare signed offline bundles.',
    boto: 'Open Rural mode',
  }),
  eu: Object.freeze({
    titol: 'Landa-modua (estaldurarik gabeko tokiko oharrak)',
    explica: 'Internetik gabe sorora edo baserrira zoazenean, Landa-moduak oharrak zuzenean gailu honetan gordetzeko, JSON kopia bat esportatzeko eta sinatutako paketeak prestatzeko aukera ematen dizu.',
    boto: 'Ireki Landa-modua',
  }),
  gl: Object.freeze({
    titol: 'Modo rural (gardado local sen cobertura)',
    explica: 'Cando vas ao campo, á leira ou ao lugar sen internet, o Modo rural permíteche apuntar notas directamente neste dispositivo, exportar unha copia en JSON e preparar paquetes asinados sen enviar nada fóra.',
    boto: 'Abrir o Modo rural',
  }),
});

export function BlocModeRuralPerfil({ idioma = null }) {
  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'perfil-shell', cssPerfilShell);
  const t = useTraductorOpcional();
  const languageUi = useUIStateOpcional()?.language ?? null;
  const codi = codiLlenguaPerfil({ language: idioma || languageUi, t });
  const tx = TEXTOS_MODE_RURAL_PERFIL[codi] || TEXTOS_MODE_RURAL_PERFIL.ca;

  return (
    <BlocPerfil titol={tx.titol}>
      <p ref={arrelRef} className="perfil-compte__text" data-testid="perfil-mode-rural-explica">
        {tx.explica}
      </p>
      <div className="sdp-alerta__accions perfil-compte__accions">
        <Link className="sdp-boto sdp-boto--secundari" to={RUTA_FITXA_MODE_RURAL}>
          {tx.boto}
        </Link>
      </div>
    </BlocPerfil>
  );
}

export default BlocModeRuralPerfil;
