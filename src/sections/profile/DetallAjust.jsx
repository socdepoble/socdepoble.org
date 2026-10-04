import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from '../../app/contexts/RouterContext';
import { compressImage } from '../../utils/imageUtils.js';
import { isSafeUrl } from '../../components/universal/UniversalUtils';
import { useEixidaSegura } from '../../components/universal/EixidaSegura.jsx';
import { ERROR_CORREU_INVALID, validaCorreu } from './contacteOrganitzacio.js';
import { useEnquadramentAvatar } from './useEnquadramentAvatar.jsx';

/* Indirecció per a les proves: jsdom no deixa substituir location.reload. */
export const pagina = { recarrega: () => window.location.reload() };

/** Un data URL comprimit tornat a Blob, per a pujar-lo com a fitxer. */
async function aBlob(dataUrl) {
  const resposta = await fetch(dataUrl);
  return await resposta.blob();
}

/* Si l'apujada ha fallat i la imatge es queda en data URL local, no la
   desarem a la BD si pesa com un manuscrit. */
const MAX_DATA_URL = 150_000;

/* El mateix mínim que el formulari d'alta (onboardingModel). */
const MINIM_CONTRASENYA = 10;

/* Els avisos de la pujada d'una imatge (els de sempre). */
const ERROR_SENSE_PUJADA = 'El servidor no admet pujada d\'imatges.';
const ERROR_PUJADA = 'No s\'ha pogut pujar la imatge al servidor.';
const ERROR_CONNEXIO = 'S\'ha produït un error al pujar la imatge. Comprova la teua connexió.';

/**
 * El formulari d'un ajust del catàleg. Ja no porta la closca de l'editor
 * (I8): la fitxa l'edita PerfilEditor i ací només queden els formularis
 * del compte, dins de DetallCompte.
 */
export default function DetallAjust({
  ajust,
  identitat,
  guardarAjust,
  pujaMitja,
}) {
  const navigate = useNavigate();
  /* T47 (correcció de la revisió C01, 260928) · «Confirmar eixida» pregunta
     primer què no ha arribat al servidor i ho diu abans d'esborrar-ho.
     Recàrrega completa: cap context en memòria sobreviu a la sessió. */
  const despresDEixir = useCallback(() => {
    navigate('/xat', { replace: true });
    pagina.recarrega();
  }, [navigate]);
  const eixida = useEixidaSegura({ despres: despresDEixir });

  const [valorTemp, setValorTemp] = useState('');
  const [desant, setDesant] = useState(false);
  const [pujant, setPujant] = useState(false);
  const [missatge, setMissatge] = useState(null);
  const timeoutMissatge = useRef(null);

  /* ── Tots els hooks ABANS de cap return condicional ── */
  const isPersona = identitat?.mena === 'persona';
  const carpetaMitjans = isPersona ? 'avatars' : 'organitzacions';

  /* Onada 4 · T3 (RETALLADOR.txt §3) · Una foto d'avatar passa abans pel
     retallador en quadrat, el mateix del Perfil (useEnquadramentAvatar).
     Cancel·lar no puja res i el focus torna al selector de fitxers. Avui cap
     ajust de «compte» és una imatge (l'avatar s'edita a la fitxa, amb
     DialegCapcaleraAvatar): esta branca espera el dia que el catàleg en porte. */
  const enquadrament = useEnquadramentAvatar({
    onEnquadrat: pujaImatge,
    onError: (text) => setMissatge({ tipus: 'error', text }),
  });

  /* El timeout del missatge de "Desat" es neteja en desmuntar. */
  useEffect(() => () => clearTimeout(timeoutMissatge.current), []);

  useEffect(() => {
    clearTimeout(timeoutMissatge.current);
    const valorInicial =
      ajust?.tipus === 'password'
        ? ''
        : ajust?.tipus === 'boolean'
          ? Boolean(ajust?.valor)
          : ajust?.valor ?? '';
    setValorTemp(valorInicial);
    setMissatge(null);
  }, [ajust?.id, identitat?.id, ajust?.tipus, ajust?.valor]);

  /* ── Accions ── */

  /* La foto triada no es puja encara: primer s'enquadra. Sense pujada al
     servidor no s'obri el retallador (es diria després d'haver retallat). */
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMissatge(null);
    if (typeof pujaMitja !== 'function') {
      setMissatge({ tipus: 'error', text: ERROR_SENSE_PUJADA });
      return;
    }
    enquadrament.obri(file);
  }

  /* El fitxer ja retallat: la compressió i la pujada de sempre (600 px, WebP,
     la carpeta de la identitat), un sol fitxer. Si falla, l'avís ix al
     formulari i també dins del retallador, que continua obert. */
  async function pujaImatge(file) {
    setPujant(true);
    setMissatge(null);
    let error = ERROR_PUJADA;
    try {
      const dataUrl = await compressImage(file, {
        maxSize: 600,
        format: 'image/webp',
        quality: 0.8,
      });
      const blob = await aBlob(dataUrl);
      const fitxer = new File([blob], 'avatar.webp', { type: 'image/webp' });
      const url = await pujaMitja(fitxer, carpetaMitjans);

      if (url) {
        setValorTemp(url);
        setMissatge({ tipus: 'exit', text: 'Imatge pujada. Ara dóna-li a Guardar.' });
        return;
      }
    } catch (err) {
      console.warn('Upload to storage failed', err);
      error = ERROR_CONNEXIO;
    } finally {
      setPujant(false);
    }
    setMissatge({ tipus: 'error', text: error });
    throw new Error(error);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ajust || !identitat) return;

    if (
      ajust.tipus === 'imatge' &&
      typeof valorTemp === 'string' &&
      valorTemp.startsWith('data:') &&
      valorTemp.length > MAX_DATA_URL
    ) {
      setMissatge({
        tipus: 'error',
        text: 'La imatge local és massa gran per a desar-la. Torna-ho a provar amb connexió.',
      });
      return;
    }

    if (ajust.tipus === 'password' && String(valorTemp).length < MINIM_CONTRASENYA) {
      setMissatge({ tipus: 'error', text: `La contrasenya ha de tindre almenys ${MINIM_CONTRASENYA} caràcters.` });
      return;
    }

    /* T43 (ordre del Mestre, 260928) · Un correu buit és vàlid: vol dir
       «el per defecte». Un correu escrit ha de tindre una forma segura. */
    if (ajust.tipus === 'correu' && String(valorTemp).trim() && !validaCorreu(valorTemp)) {
      setMissatge({ tipus: 'error', text: ERROR_CORREU_INVALID });
      return;
    }

    setDesant(true);
    setMissatge(null);
    try {
      /* Identitat EXPLÍCITA: este era el forat que escrivia a
         l'entitat equivocada. */
      await guardarAjust(identitat.id, ajust.id, valorTemp);
      setMissatge({ tipus: 'exit', text: 'Desat correctament.' });
      clearTimeout(timeoutMissatge.current);
      timeoutMissatge.current = setTimeout(() => setMissatge(null), 3000);
    } catch (error) {
      setMissatge({ tipus: 'error', text: error?.message || 'Error en desar.' });
    } finally {
      setDesant(false);
    }
  }

  function obriFitxa() {
    if (ajust?.valor && isSafeUrl(ajust.valor)) navigate(ajust.valor);
  }

  /* ── Render: el CATÀLEG mana, la UI obedeix ── */

  function renderitzaAccio() {
    if (ajust.pendent) {
      /* Honestedat abans que promeses: acció declarada però sense
         backend = botó desactivat + explicació, mai "permission
         denied" en silenci. */
      return (
        <div className="sdp-buit">
          <button type="button" className="sdp-boto" disabled>
            {ajust.titol}
          </button>
          <p className="sdp-buit">
            Aquesta acció encara no està implementada en aquesta versió.
          </p>
        </div>
      );
    }
    if (ajust.accio === 'logout') {
      return (
        <div className="sdp-buit">
          <button type="button" className="sdp-boto sdp-boto--perill" onClick={eixida.demana}
            disabled={eixida.ocupat || Boolean(eixida.avis)}>
            Confirmar eixida
          </button>
          {eixida.avis}
          {eixida.error ? <p className="sdp-camp__error" role="alert">{eixida.error}</p> : null}
        </div>
      );
    }
    if (ajust.accio === 'obrir-fitxa') {
      return (
        <div className="sdp-buit">
          <button type="button" className="sdp-boto" onClick={obriFitxa}>
            Veure la fitxa pública
          </button>
        </div>
      );
    }
    /* Acció declarada però sense despachar: que el catàleg i la UI no
       tornen a divergir en silenci. */
    if (import.meta.env.DEV) {
      console.error(`[DetallAjust] Acció sense implementar: "${ajust.accio}" (ajust "${ajust.id}")`);
    }
    return <p className="sdp-buit">Acció pendent d'implementació.</p>;
  }

  function renderitzaFormulari() {
    if (!ajust.obert) {
      /* Un ajust tancat amb valor (el correu, l'identificador) el mostra:
         saber-lo també és part del compte. */
      const valorVisible = ajust.tipus === 'text' && typeof ajust.valor === 'string' ? ajust.valor : '';
      return (
        <>
          {valorVisible ? <p className="perfil-ajust__valor">{valorVisible}</p> : null}
          <p className="sdp-buit">
            {ajust.motiu || 'Aquest ajust no es pot modificar.'}
          </p>
        </>
      );
    }

    if (ajust.tipus === 'accio') return renderitzaAccio();

    const tipus = ajust.tipus || 'text';
    /* T43 · L'ajuda del catàleg (p. ex. d'on ix el correu per defecte) es
       llig amb el control (aria-describedby). */
    const idAjuda = ajust.ajuda ? `ajust-${ajust.id}-ajuda` : undefined;

    return (
      <form onSubmit={handleSubmit} className="sdp-form">
        <div className="sdp-camp">
          <label className="sdp-camp__etiqueta" htmlFor={`ajust-${ajust.id}`}>
            {tipus === 'boolean'
              ? `${ajust.titol}:`
              : `Nou valor per a ${ajust.titol.toLowerCase()}:`}
          </label>
          {ajust.ajuda ? <p id={idAjuda} className="sdp-camp__ajuda">{ajust.ajuda}</p> : null}

          {tipus === 'imatge' ? (
            <div className="sdp-alerta__accions">
              {valorTemp && (
                <div className="sdp-avatar sdp-avatar--xl">
                  <img src={valorTemp} alt="Previsualització" className="sdp-avatar__imatge" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                id={`ajust-${ajust.id}`}
                className="sdp-control"
                onChange={handleFileChange}
                disabled={pujant}
              />
              {pujant && <p className="sdp-camp__ajuda">Pujant la imatge...</p>}
            </div>
          ) : tipus === 'boolean' ? (
            /* El nom de la casella és estable («Perfil públic»): l'estat que es
               pinta al costat canvia, i com a nom faria dir «Privat, no marcada». */
            <label className="sdp-camp__check">
              <input
                type="checkbox"
                id={`ajust-${ajust.id}`}
                aria-label={ajust.casella || ajust.titol}
                aria-describedby={idAjuda}
                checked={Boolean(valorTemp)}
                onChange={(e) => setValorTemp(e.target.checked)}
              />
              {valorTemp ? 'Públic' : 'Privat'}
            </label>
          ) : tipus === 'area' ? (
            <textarea
              id={`ajust-${ajust.id}`}
              className="sdp-control sdp-control--area"
              rows="5"
              value={valorTemp}
              onChange={(e) => setValorTemp(e.target.value)}
            />
          ) : tipus === 'correu' ? (
            <input
              type="email"
              id={`ajust-${ajust.id}`}
              className="sdp-control"
              value={valorTemp}
              onChange={(e) => setValorTemp(e.target.value)}
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              aria-describedby={idAjuda}
            />
          ) : (
            <input
              type={tipus === 'password' ? 'password' : 'text'}
              id={`ajust-${ajust.id}`}
              className="sdp-control"
              value={valorTemp}
              onChange={(e) => setValorTemp(e.target.value)}
              placeholder={tipus === 'password' ? 'Introdueix nova contrasenya...' : ''}
              autoComplete={tipus === 'password' ? 'new-password' : undefined}
              minLength={tipus === 'password' ? MINIM_CONTRASENYA : undefined}
            />
          )}

          {missatge && (
            <p
              className={missatge.tipus === 'exit' ? 'sdp-text-exit' : 'sdp-camp__error'}
              role={missatge.tipus === 'exit' ? 'status' : 'alert'}
            >
              {missatge.text}
            </p>
          )}

          <div className="sdp-alerta__accions">
            <button type="submit" className="sdp-boto sdp-boto--primari" disabled={desant || pujant}>
              {desant ? 'Desant...' : 'Guardar'}
            </button>
          </div>
        </div>
      </form>
    );
  }

  if (!identitat) {
    return (
      <div className="sdp-buit">
        <p>Crea el teu compte o inicia sessió per a començar.</p>
      </div>
    );
  }

  return (
    <div className="perfil-detall">
      {ajust ? renderitzaFormulari() : (
        <p className="sdp-buit">
          Selecciona un ajust de l'esquerra per a modificar-lo.
        </p>
      )}
      {/* Fora del <form>: els controls del retallador no l'han d'enviar. */}
      {enquadrament.dialeg}
    </div>
  );
}
