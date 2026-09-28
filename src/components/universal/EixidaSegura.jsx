/* ═══════════════════════════════════════════════════════════════════
   T47 (correcció de la revisió C01, 260928) · EIXIR SENSE PERDRE RES EN SILENCI

   «Totes les dades s'han de desar automàticament sense pèrdues de dades.»
   Eixir esborra d'este dispositiu els esborranys d'esta persona (un
   ordinador compartit del poble). Abans, el text que el servidor no havia
   confirmat (una entradilla massa llarga, un camp sense columna, sense
   xarxa) s'esborrava sense cap avís.

   Ara «Confirmar eixida» i «Eixir del poble» pregunten primer a la sessió
   (preparaEixida: l'intent final i el que queda). Si queda res, ho diuen
   amb una Alerta de Pedra Seca i dos botons: «No eixir encara» i «Eixir
   igualment». Només el segon tanca la sessió i oblida.
   ═══════════════════════════════════════════════════════════════════ */
import { useCallback, useState } from 'react';
import { Alerta, Boto } from '../PedraSeca/index.js';
import { useSession } from '../../app/contexts/SessionContext.jsx';

/* Els camps de la fitxa (perfilCamps.js), com els diu la persona. */
const NOMS_CAMPS = Object.freeze({
  title: 'el nom',
  subtitle: 'el subtítol',
  lead: 'l’entradilla',
  content: 'la presentació',
  logoImage: 'l’avatar',
  heroImage: 'la capçalera',
  copyright: 'els drets d’autor',
});

export const ERROR_EIXIDA = 'No s’ha pogut tancar la sessió.';

/** El text honest de l'avís: quants canvis, on són i què passarà si s'ix. */
export function textPendentsEixida(pendents = []) {
  const llista = Array.isArray(pendents) ? pendents : [];
  const total = llista.reduce((suma, pendent) => suma + (pendent?.camps?.length || 0), 0);
  const notes = llista.filter((pendent) => pendent?.entitat === 'nota');
  const fitxa = llista.filter((pendent) => pendent?.entitat !== 'nota');
  const on = [];
  if (fitxa.length) {
    const noms = [...new Set(fitxa.flatMap((pendent) => pendent.camps || []).map((camp) => NOMS_CAMPS[camp] || camp))];
    on.push(`a la fitxa: ${noms.join(', ')}`);
  }
  if (notes.length) on.push(`a Notes: ${notes.length === 1 ? '1 nota' : `${notes.length} notes`}`);
  const canvis = total === 1 ? '1 canvi' : `${total} canvis`;
  return `Tens ${canvis} que el servidor encara no té${on.length ? ` (${on.join('; ')})` : ''}. Si ixes ara, s’esborraran d’este dispositiu.`;
}

/**
 * `despres`: què fer quan la sessió s'ha tancat (navegar i recarregar).
 * Torna { demana, avis, error, ocupat }: `demana` és l'onClick del botó
 * d'eixir; `avis`, l'Alerta (o null) que el component pinta on vulga.
 */
export function useEixidaSegura({ despres } = {}) {
  const { logout, preparaEixida } = useSession();
  const [pendents, setPendents] = useState(null);
  const [ocupat, setOcupat] = useState(false);
  const [error, setError] = useState(null);

  const eix = useCallback(async () => {
    setError(null);
    setOcupat(true);
    try {
      await logout();
    } catch {
      setOcupat(false);
      setError(ERROR_EIXIDA);
      return;
    }
    setPendents(null);
    despres?.();
  }, [logout, despres]);

  const demana = useCallback(async () => {
    if (ocupat) return;
    setError(null);
    setOcupat(true);
    let queden = [];
    if (typeof preparaEixida === 'function') {
      try { queden = await preparaEixida(); } catch { queden = []; }
    }
    if (Array.isArray(queden) && queden.length) {
      setPendents(queden);
      setOcupat(false);
      return;
    }
    await eix();
  }, [ocupat, preparaEixida, eix]);

  const avis = pendents ? (
    <Alerta
      to="avis"
      titol="Encara hi ha canvis sense desar"
      accions={(
        <>
          {/* El focus va al botó que no esborra res (Llei de la Por Orgànica). */}
          <Boto varietat="secundari" onClick={() => setPendents(null)} autoFocus>No eixir encara</Boto>
          <Boto varietat="perill" onClick={eix} carregant={ocupat}>Eixir igualment</Boto>
        </>
      )}
    >
      <p>{textPendentsEixida(pendents)}</p>
    </Alerta>
  ) : null;

  return { demana, avis, error, ocupat };
}
