/**
 * useInformaDUnError.js — Onada 6 (prompt 261009_0230, punt 4: els beta
 * testers fan servir el xat per a informar d'errors) · On porta «Informa
 * d'un error», sense cap migració ni res que el Mestre haja de crear:
 *   · en llavor, el grup «Beta testers» de la comunitat de Sóc de Poble
 *     (ID_FIL_BETA_TESTERS_LLAVOR, per id: mai pel nom; l'id viu a
 *     xatsPerDefecte.js perquè la interfície no importe la llavor sencera);
 *   · si no hi és (en remot), el xat privat amb Sóc de Poble, el MATEIX camí
 *     que la fila «Sóc de Poble» i que «Comentar → En privat»: l'entitat la
 *     resol una sola vegada per a tota l'app (useXatSocDePoble) i creaFil
 *     obri (o troba) la conversa. Al servidor és el canal de l'entitat, i qui
 *     la gestiona (propietària o administradora) ja el veu i el respon.
 * Abans de navegar, deixa l'esborrany de l'informe (informeDError.js) per a
 * eixa conversa (esborranys.js, amb la clau de XatSection): el compositor
 * l'ensenya en obrir-la i la persona el completa. Res no s'envia sol.
 * Revisió 261009 · Si la conversa no es pot obrir (SDP-XAT-003 perquè l'alta
 * ha entrat sense pertinença al poble, l'entitat no és al servidor, la
 * xarxa…), l'informe no es perd: `reserva` el guarda amb l'enllaç de correu
 * i `copiaInforme` el copia al porta-retalls (BotoInformaDUnError ho ensenya).
 * Qui gestiona l'entitat pilot no el veu en remot (no es pot escriure a ella
 * mateixa, SDP-XAT-002); sense sessió, tampoc.
 */
import { useCallback, useRef, useState } from 'react';
import { useXat } from './XatContext.jsx';
import { useXatSocDePoble } from '../../components/PedraSeca/hooks/xatSocDePoble.js';
import { useIdentitatOpcional } from '../../app/contexts/IdentitatContext.jsx';
import { ID_FIL_BETA_TESTERS_LLAVOR, gestionaLEntitatPilot } from '../../data/xatsPerDefecte.js';
import { desaEsborrany, llegixEsborrany } from './esborranys.js';
import { afigInforme, composaInforme, enllacDeCorreu } from './informeDError.js';
import { textDeFalladaDirecte } from './errorsXat.js';

/** El destinatari de /xat?amb=<id> (l'enllaç de useXatSocDePoble), o null. */
export function destinatariDeLEnllac(href) {
  const text = String(href || '');
  const i = text.indexOf('?');
  if (i < 0) return null;
  return new URLSearchParams(text.slice(i + 1)).get('amb') || null;
}

/**
 * { disponible, obrint, informa(): Promise<string|null>, reserva, copiaInforme() } ·
 * `informa` torna l'id de la conversa on ha deixat l'esborrany (i hi navega),
 * o null; si no l'ha pogut obrir, `reserva` és { informe, correu } (el text i
 * el seu enllaç mailto:) fins al pròxim intent. `t`, `navigate`, `showToast`
 * i `pathname` són els de XatSection.
 */
export default function useInformaDUnError({ t, navigate, showToast, pathname }) {
  const { chatThreads = [], creaFil, ambitEstable = '', joId = null, senseSessio = false } = useXat();
  const xatSocDePoble = useXatSocDePoble();
  const identitat = useIdentitatOpcional();
  const [obrint, setObrint] = useState(false);
  const [reserva, setReserva] = useState(null);
  const enCurs = useRef(false);

  const filBeta = chatThreads.find((f) => String(f?.id) === ID_FIL_BETA_TESTERS_LLAVOR) || null;
  const gestiona = gestionaLEntitatPilot(identitat?.identitats);
  const disponible = Boolean(joId) && !senseSessio && (Boolean(filBeta) || !gestiona);

  const informa = useCallback(async () => {
    if (!disponible || enCurs.current) return null;
    enCurs.current = true;
    setObrint(true);
    setReserva(null);
    const informe = composaInforme({ t, rutaActual: pathname });
    /* La conversa no s'ha pogut obrir: l'informe es queda a mà. */
    const guardaReserva = () => {
      setReserva({ informe, correu: enllacDeCorreu(informe, t('section.xat.informe.assumpte', "Informe d'un error a Sóc de Poble")) });
      return null;
    };
    try {
      let filId = filBeta ? String(filBeta.id) : null;
      if (!filId) {
        let { href, avis, resol } = xatSocDePoble;
        if (!href && typeof resol === 'function') ({ href, avis } = await resol());
        const amb = destinatariDeLEnllac(href);
        if (!amb) {
          showToast(avis || t('section.xat.obrirError', "No s'ha pogut obrir la conversa."), 'info');
          return guardaReserva();
        }
        filId = await creaFil(amb, null);
        if (!filId) return guardaReserva();
        filId = String(filId);
      }
      /* La clau és la de Conversa a XatSection: ambitEstable::<fil>. */
      const clau = ambitEstable ? `${ambitEstable}::${filId}` : null;
      desaEsborrany(clau, afigInforme(llegixEsborrany(clau), informe));
      navigate(`/xat/${encodeURIComponent(filId)}`);
      return filId;
    } catch (error) {
      showToast(textDeFalladaDirecte(error, t), 'error');
      return guardaReserva();
    } finally {
      enCurs.current = false;
      setObrint(false);
    }
  }, [disponible, filBeta, xatSocDePoble, creaFil, ambitEstable, t, pathname, navigate, showToast]);

  /* «Copia l'informe»: dins del mateix clic (Safari només deixa escriure al
     porta-retalls amb un gest de la persona). Els textos són els de «Copia el
     text» d'una bombolla. */
  const copiaInforme = useCallback(async () => {
    const text = reserva?.informe;
    if (!text) return false;
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) throw new Error('Sense porta-retalls');
      await navigator.clipboard.writeText(text);
      showToast(t('section.xat.missatge.copiat', 'Text copiat'), 'success');
      return true;
    } catch {
      showToast(t('section.xat.missatge.noCopiat', "No s'ha pogut copiar el text"), 'error');
      return false;
    }
  }, [reserva, showToast, t]);

  return { disponible, obrint, informa, reserva, copiaInforme };
}
