/**
 * Plataforma d'Apps Enxufables · la FONT del pont de sessió (sessioApp.js).
 *
 * L'ÚNIC mòdul de la plataforma que llig els contexts de l'arrel de l'app,
 * SessionContext i IdentitatContext. L'importa només RutaApps.jsx:
 * ContenidorApp passa el ganxo (useFontSessio, no el seu valor) a
 * ProveidorApp (ContextApp.jsx), i useSessioApp (sessioApp.js) el crida
 * dins de l'app, per useSessioDeLaRuta. Així només llig la sessió l'app que
 * la demana (una que no crida mai useSessioApp no la toca), i la llig on es
 * pinta: un canvi de SessionContext arriba directament al component que
 * crida el pont.
 *
 * Per què a part (correcció del 261006): eixos dos contexts són ascendents de
 * totes les apps (SessionContext → sessionService → host.js → registreApps →
 * import() de cada app), i Vite els invalida cada vegada que es desa una
 * vista. Si l'API pública (index.js) els importava, la vista desada en
 * carregava una instància nova i React Refresh deixava sense proveïdor la
 * closca de l'app (TopBar, CoreContentProvider). Este mòdul NO és a la
 * clausura d'imports de plataforma/index.js, ni ha d'estar-hi: ho vigila
 * fronteres.test.js. RutaApps no s'importa des de cap vista, i per això la
 * font (la instància d'este mòdul que crida el pont) no es torna a carregar
 * mai en desar-ne una.
 *
 *   useFontSessio() · Object.freeze({
 *     estat         el de SessionContext tal qual, o null sense SessionProvider
 *                   (el pont el normalitza: un estat desconegut és 'fora');
 *     idUsuari      l'id del compte, o null. NOMÉS per a la continuïtat de la
 *                   renovació del JWT (sessioApp.js el guarda en un ref
 *                   intern); useSessioApp no el torna mai;
 *     esSuperadmin  el booleà de SessionContext, mai el rol cru;
 *     marca         la de l'actor actiu (marcaDeLActor), o null;
 *     titular       { nom, avatar, poble } de la persona de la sessió
 *                   (titularDeLActor), o null
 *   })
 *
 * Ni el testimoni, ni l'usuari sencer, ni el rol, ni l'actor: només això. La
 * instantània només canvia quan canvia algun dels cinc camps. Derogat EN PART
 * per l'ordre del Mestre del 13-10-2026 (pla 261013_1405, front B: la boina
 * de la Gestoria porta el titular de la sessió), sobre l'ordre i la correcció
 * del 261006: la instantània porta ara una projecció filtrada de la persona
 * (nom, avatar i poble; titularNet), mai el seu id, el rol, el kind ni
 * l'actor sencer. La persona és SEMPRE la identitat de tipus 'persona' que
 * IdentitatContext posa primera a `identitats`, mai l'entitat activa; sense
 * sessió (un convidat), no n'hi ha cap. Només la torna el pont a l'app que la
 * declara al manifest (sessioApp.js, «El titular»).
 *
 * Cap binding dels contexts es llig en carregar el mòdul, només en cridar el
 * ganxo: moltes proves del repo simulen SessionContext sense ESTAT.
 */
import { useMemo } from 'react';
import { useSessioOpcional } from '../../app/contexts/SessionContext';
import { ROLS_QUE_SIGNEN, useIdentitatOpcional } from '../../app/contexts/IdentitatContext';
import { NOM_SENSE_NOM, marcaNeta, titularNet } from './sessioApp.js';

/** La marca de l'actor actiu: només d'una entitat on la persona és owner o admin; si no, null. */
export function marcaDeLActor(actor) {
  if (!actor || actor.tipus !== 'entitat' || !ROLS_QUE_SIGNEN.includes(actor.rol)) return null;
  return marcaNeta({ nom: actor.nom, logotip: actor.avatar, slug: actor.slug });
}

/**
 * El titular d'una identitat (ordre del Mestre, 13-10-2026, pla 261013_1405,
 * front B): només d'una persona amb sessió (tipus i rol 'persona'); una
 * entitat o un convidat, null. Sense nom, o amb el correu per nom, el de
 * reserva (NOM_SENSE_NOM). Tres camps i prou (titularNet).
 */
export function titularDeLActor(actor) {
  if (!actor || actor.tipus !== 'persona' || actor.rol !== 'persona') return null;
  const nom = typeof actor.nom === 'string' && actor.nom.trim() !== '' && !actor.nom.includes('@') ? actor.nom : NOM_SENSE_NOM;
  return titularNet({ nom, avatar: actor.avatar, poble: actor.poble });
}

/* La persona de la sessió: la identitat de tipus 'persona' de la llista (IdentitatContext la posa primera), o null. */
const personaDe = (identitats) => (Array.isArray(identitats) ? identitats.find((identitat) => identitat?.tipus === 'persona') ?? null : null);

/** La instantània mínima i congelada de la sessió de l'arrel (vegeu la capçalera). */
export function useFontSessio() {
  const sessio = useSessioOpcional();
  const identitat = useIdentitatOpcional();
  const actor = identitat?.actor ?? null;
  const persona = personaDe(identitat?.identitats);
  const estat = typeof sessio?.estat === 'string' ? sessio.estat : null;
  const idUsuari = typeof sessio?.currentUser?.id === 'string' ? sessio.currentUser.id : null;
  const esSuperadmin = sessio?.esSuperadmin === true;
  const marca = useMemo(() => marcaDeLActor(actor), [actor]);
  const titular = useMemo(() => titularDeLActor(persona), [persona]);
  return useMemo(
    () => Object.freeze({ estat, idUsuari, esSuperadmin, marca, titular }),
    [estat, idUsuari, esSuperadmin, marca, titular]
  );
}
