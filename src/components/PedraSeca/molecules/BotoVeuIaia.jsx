/**
 * BotoVeuIaia.jsx · IDEA-108 (Onada R7, 261106) · «🔊 Escolta la IAIA».
 *
 * Botó reutilitzable que fa dir en veu alta un text a la veu de la IAIA
 * (veuIaiaService). És un botó d'alternança: `aria-pressed` diu si està
 * parlant i tornar-lo a prémer atura la veu. El nom accessible no canvia.
 *
 * `privat` val true per defecte: el text no ix del dispositiu (no es fa cap
 * petició de xarxa). Només cal posar-lo a false per a contingut públic.
 * Si el navegador no té síntesi de veu, el botó queda desactivat i ho explica.
 *
 * El servei de veu es carrega amb import() quan el botó es munta: el codi de
 * la veu viu en un tros lazy i no engreixa el tros d'entrada. Mentrestant, el
 * botó està desactivat.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Boto } from '../atoms/Boto.jsx';
import { tradueix, useTraductorOpcional } from '../hooks/useTraductorOpcional.js';
import { useUIStateOpcional } from '../../../app/contexts/UIContext';

const CODI_VEU_AVORTADA = 'VEU_AVORTADA';
const CODI_VEU_NO_DISPONIBLE = 'VEU_NO_DISPONIBLE';
const ESCOLTA = Object.freeze(['common.veuIaiaEscolta', '🔊 Escolta la IAIA']);
const NO_DISPONIBLE = Object.freeze(['common.veuIaiaNoDisponible', 'Este navegador no pot llegir en veu alta.']);
const FALLADA = Object.freeze(['common.veuIaiaFallada', 'No s’ha pogut llegir en veu alta. Torna-ho a provar.']);

/* L'emoji inicial és decoració: va en un span aria-hidden i el nom accessible
   és només el text («Escolta la IAIA»). */
function separaEmoji(etiqueta) {
  const trobat = /^(\p{Extended_Pictographic}\uFE0F?)\s*(.+)$/u.exec(etiqueta);
  return trobat ? { emoji: trobat[1], text: trobat[2] } : { emoji: null, text: etiqueta };
}

function useLlenguaOpcional() {
  try {
    return useUIStateOpcional()?.language || 'ca';
  } catch {
    return 'ca';
  }
}

export function BotoVeuIaia({ text, idioma, privat = true, varietat = 'secundari', className, ...rest }) {
  const t = useTraductorOpcional();
  const llenguaDeLaInterficie = useLlenguaOpcional();
  const [parlant, setParlant] = useState(false);
  const [fallada, setFallada] = useState(null);
  const [servei, setServei] = useState(null);
  const meua = useRef(null);
  const viu = useRef(true);
  const serveiRef = useRef(null);
  const idMissatge = useId();

  useEffect(() => {
    viu.current = true;
    import('../../../services/veuIaiaService.js').then((modul) => {
      serveiRef.current = modul;
      if (viu.current) setServei(modul);
    }, () => { if (viu.current) setServei(false); });
    return () => {
      viu.current = false;
      if (meua.current) serveiRef.current?.atura();
    };
  }, []);

  /* V-02 · Si el text canvia mentre parla, la veu calla i el botó torna a
     repòs: no es llig un text que ja no és el de la pàgina. */
  useEffect(() => {
    if (!meua.current) return;
    meua.current = null;
    serveiRef.current?.atura();
    setParlant(false);
    setFallada(null);
  }, [text]);

  const carregat = Boolean(servei);
  const disponible = servei === false ? false : (carregat ? servei.veuDisponible({ privat }) : true);

  const alternar = useCallback(async () => {
    if (!servei) return;
    if (parlant) {
      servei.atura();
      return;
    }
    const jo = {};
    meua.current = jo;
    setFallada(null);
    setParlant(true);
    try {
      await servei.parla(text, { idioma: idioma || llenguaDeLaInterficie, privat });
    } catch (error) {
      if (viu.current && meua.current === jo && error?.codi !== CODI_VEU_AVORTADA) {
        setFallada(error?.codi === CODI_VEU_NO_DISPONIBLE ? NO_DISPONIBLE : FALLADA);
      }
    } finally {
      if (meua.current === jo) meua.current = null;
      if (viu.current) setParlant(false);
    }
  }, [servei, parlant, text, idioma, llenguaDeLaInterficie, privat]);

  /* V-06 · Si el servei lazy no ha pogut carregar-se, és una fallada, no un
     navegador sense veu. */
  let explicacio = fallada;
  if (servei === false) explicacio = FALLADA;
  else if (!disponible) explicacio = NO_DISPONIBLE;
  const { emoji, text: etiqueta } = separaEmoji(tradueix(t, ESCOLTA));
  return (
    <>
      <Boto
        varietat={parlant ? 'primari' : varietat}
        className={className}
        aria-pressed={parlant}
        disabled={!disponible || !carregat}
        aria-describedby={explicacio ? idMissatge : undefined}
        onClick={alternar}
        {...rest}
      >
        {emoji ? <span aria-hidden="true">{emoji} </span> : null}
        {etiqueta}
      </Boto>
      {explicacio ? <p id={idMissatge} className="sdp-muted" role="status">{tradueix(t, explicacio)}</p> : null}
    </>
  );
}
