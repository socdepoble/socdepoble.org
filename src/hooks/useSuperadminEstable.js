/**
 * useSuperadminEstable.js · Gauntlet 261016, diürn 1530 (Bloc 3.4; revisió
 * adversarial del carril D, problema 2) · Si qui mira és superadmin, sense
 * que el rol «parpellege» mentre la sessió es torna a comprovar.
 *
 * La maquinària interna (la carpeta «Maquinària de la IAIA» de la Wiki, amb la
 * Consola incrustada, i les utilitats internes de l'aside del Perfil) només ix
 * per a qui és superadmin. El rol arriba de manera asíncrona (sessionService.js
 * · elMeuRol): en arrencar, i també a cada renovació del JWT (versioSessio),
 * la sessió passa per 'comprovant' amb el rol 'desconegut' i esSuperadmin val
 * false fins que torna la consulta. Si eixe false s'aplicava tal qual, la
 * maquinària desapareixia, el workspace donava la selecció per absent i la
 * reconciliava: un superadmin que treballava a la Consola o a les Mètriques
 * en queia a cada renovació.
 *
 * Mentre la sessió es comprova amb el MATEIX compte que ja tenia un rol resolt,
 * es conserva l'últim rol resolt, el mateix criteri que RequireAuth (no desmunta
 * el que es veia durant la renovació). Un compte nou, o cap compte, no hereta
 * res: el rol queda pendent (`rolPendent`) i qui pinta decidix si espera.
 * Només afecta el que es MOSTRA: les dades continuen protegides al servidor
 * (private.es_superadmin()).
 *
 * Sense proveïdor de sessió (una peça muntada sola), ningú no és superadmin i
 * no hi ha res pendent.
 *
 * @returns {{ esSuperadmin: boolean, rolPendent: boolean }}
 */
import { useRef } from 'react';
import { useSessioOpcional } from '../app/contexts/SessionContext.jsx';

export function useSuperadminEstable() {
  const sessio = useSessioOpcional();
  const usuariId = sessio?.currentUser?.id ?? null;
  const comprovant = sessio?.estat === 'comprovant';
  /* L'últim estat resolt: { usuariId, esSuperadmin }. S'escriu en pintar, com
     el `mostrat` de RequireAuth; és idempotent (StrictMode pinta dues voltes). */
  const resolt = useRef(null);
  if (sessio && !comprovant) resolt.current = { usuariId, esSuperadmin: sessio.esSuperadmin === true };
  const heretaRol = comprovant && usuariId != null && resolt.current?.usuariId === usuariId;
  return {
    esSuperadmin: sessio?.esSuperadmin === true || (heretaRol && resolt.current.esSuperadmin === true),
    rolPendent: comprovant && !heretaRol,
  };
}
