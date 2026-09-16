import { useCallback, useEffect, useRef, useState } from 'react';
import { logout } from '../../data/backendPort.js';
import { useNavigate } from '../../app/contexts/RouterContext';
import { compressImage } from '../../utils/imageUtils.js';
import UniversalToolbar from '../../components/universal/UniversalToolbar';
import { UniversalEditorShell } from '../../components/universal/UniversalEditorShell';
import { isSafeUrl } from '../../components/universal/UniversalUtils';

/** Un data URL comprimit tornat a Blob, per a pujar-lo com a fitxer. */
async function aBlob(dataUrl) {
  const resposta = await fetch(dataUrl);
  return await resposta.blob();
}

/* Si l'apujada ha fallat i la imatge es queda en data URL local, no la
   desarem a la BD si pesa com un manuscrit. */
const MAX_DATA_URL = 150_000;

export default function DetallAjust({
  ajust,
  identitat,
  guardarAjust,
  guardarCampPerfil,
  pujaMitja,
}) {
  const navigate = useNavigate();

  const [valorTemp, setValorTemp] = useState('');
  const [desant, setDesant] = useState(false);
  const [pujant, setPujant] = useState(false);
  const [missatge, setMissatge] = useState(null);
  const timeoutMissatge = useRef(null);

  /* ── Tots els hooks ABANS de cap return condicional ── */
  const dades = identitat?.dades || {};
  const isPersona = identitat?.mena === 'persona';
  const carpetaMitjans = isPersona ? 'avatars' : 'organitzacions';

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
  }, [ajust?.id, identitat?.id]);

  /* Abans: funcions noves per render (memo busting). */
  const pujaDesDeLaClosca = useCallback(
    (file) => (typeof pujaMitja === 'function' ? pujaMitja(file, carpetaMitjans) : null),
    [pujaMitja, carpetaMitjans],
  );

  const desaCampClosca = useCallback(
    (field, value, identitatId) => {
      if (!identitatId) return;
      if (field === 'title') guardarCampPerfil(isPersona ? 'full_name' : 'name', value, identitatId);
      else if (field === 'subtitle' && !isPersona) guardarCampPerfil('lema', value, identitatId);
      else if (field === 'lead' && !isPersona) guardarCampPerfil('description', value, identitatId);
      else if (field === 'logoImage') guardarCampPerfil(isPersona ? 'avatar_url' : 'logo_url', value, identitatId);
    },
    [guardarCampPerfil, isPersona],
  );

  /* El botó de la barra ja no menteix amb un alert(): commuta la
     visibilitat de veres. */
  const commutaPublicacio = useCallback(async () => {
    if (!identitat?.id) return;
    try {
      await guardarCampPerfil('is_public', !dades.is_public, identitat.id);
    } catch (e) {
      setMissatge({ tipus: 'error', text: e?.message || "No s'ha pogut canviar la visibilitat." });
    }
  }, [guardarCampPerfil, dades.is_public, identitat?.id]);

  /* ── Accions ── */

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMissatge({ tipus: 'error', text: 'Només imatges, de moment.' });
      return;
    }

    setPujant(true);
    setMissatge(null);
    let dataUrl = null;
    try {
      dataUrl = await compressImage(file, {
        maxSize: 600,
        format: 'image/webp',
        quality: 0.8,
      });

      if (typeof pujaMitja !== 'function') {
        setMissatge({ tipus: 'error', text: 'El servidor no admet pujada d\'imatges.' });
        return;
      }

      const blob = await aBlob(dataUrl);
      const fitxer = new File([blob], 'avatar.webp', { type: 'image/webp' });
      const url = await pujaMitja(fitxer, carpetaMitjans);

      if (url) {
        setValorTemp(url);
        setMissatge({ tipus: 'exit', text: 'Imatge pujada. Ara dóna-li a Guardar.' });
      } else {
        setMissatge({ tipus: 'error', text: 'No s\'ha pogut pujar la imatge al servidor.' });
      }
    } catch (error) {
      console.warn('Upload to storage failed', error);
      setMissatge({ tipus: 'error', text: 'S\'ha produït un error al pujar la imatge. Comprova la teua connexió.' });
    } finally {
      setPujant(false);
    }
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

  async function handleLogout() {
    try {
      await logout();
    } catch (e) {
      setMissatge({ tipus: 'error', text: "No s'ha pogut tancar la sessió." });
      return;
    }
    /* Recàrrega completa: cap context en memòria sobreviu a la sessió. */
    navigate('/', { replace: true });
    window.location.reload();
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
          <button type="button" className="sdp-boto sdp-boto--perill" onClick={handleLogout}>
            Confirmar eixida
          </button>
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
      return (
        <p className="sdp-buit">
          {ajust.motiu || 'Aquest ajust no es pot modificar.'}
        </p>
      );
    }

    if (ajust.tipus === 'accio') return renderitzaAccio();

    const tipus = ajust.tipus || 'text';

    return (
      <form onSubmit={handleSubmit} className="sdp-form">
        <div className="sdp-camp">
          <label className="sdp-camp__etiqueta" htmlFor={`ajust-${ajust.id}`}>
            {tipus === 'boolean'
              ? `${ajust.titol}:`
              : `Nou valor per a ${ajust.titol.toLowerCase()}:`}
          </label>

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
            <label className="sdp-camp__check">
              <input
                type="checkbox"
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
          ) : (
            <input
              type={tipus === 'password' ? 'password' : 'text'}
              id={`ajust-${ajust.id}`}
              className="sdp-control"
              value={valorTemp}
              onChange={(e) => setValorTemp(e.target.value)}
              placeholder={tipus === 'password' ? 'Introdueix nova contrasenya...' : ''}
            />
          )}

          {missatge && (
            <p className={missatge.tipus === 'exit' ? 'sdp-text-exit' : 'sdp-camp__error'}>
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
    <UniversalEditorShell
      key={identitat.id}
      id={identitat.id}
      topBar={
        <UniversalToolbar
          onPublish={commutaPublicacio}
          isPublished={Boolean(dades.is_public)}
          publishDisabled={false}
        />
      }
      titleHtml={identitat.nom || ''}
      subtitleHtml={isPersona ? null : dades.lema || ''}
      leadHtml={isPersona ? null : dades.description || ''}
      heroImage={null}
      logoImage={dades.avatar_url || dades.logo_url}
      isPublished={Boolean(dades.is_public)}
      onImageUpload={pujaDesDeLaClosca}
      onSaveField={desaCampClosca}
      showStatusToggle={false}
    >
      <div className="perfil-detall">
        {ajust ? renderitzaFormulari() : (
          <p className="sdp-buit">
            Selecciona un ajust de l'esquerra per a modificar-lo.
          </p>
        )}
      </div>
    </UniversalEditorShell>
  );
}
