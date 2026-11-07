/** La mateixa versió que servix /legal. A Supabase, handle_new_user (2609261500) registra el consentiment
 * de l'alta amb esta versió si public.politiques_privacitat ja la té en vigor (vigent_des_de <= now());
 * si no, la substituïx en silenci per la vigent (private.versio_vigent()) i l'alta no falla. La lectura REST
 * del 6-11-2026 hi troba la 2.5 (2611061520, en vigor des del 6-11-2026 00:00 CET): el registre diu la
 * versió que la persona ha vist. El Node 0 (tooling/node0/auth-node0.mjs) no substituïx res: si no
 * coincidix amb la política del node, rebutja l'alta (i la verificació) amb consent_version_invalid (422).
 * Mai canvies este valor per una versió llegida després del consentiment. */
export const VERSIO_POLITICA_PRIVACITAT = '2.5';
export const RUTA_POLITICA_PRIVACITAT = '/legal';
export const consentimentMostrat = checked => Object.freeze({rgpd:checked===true,versio_politica:checked===true?VERSIO_POLITICA_PRIVACITAT:''});
