/* D-P016 (Onada R9, ordre del Mestre del 261106) · L'interruptor de les sis RPC
   de connexions públiques i membres que crea
   supabase/migrations/2611032100_connexions_publiques_i_membres.sql:
   preferencies_connexions, desa_visibilitat_connexions, connexions_publiques_de,
   membres_i_entitats_connectades_de, inclou_persona_en_entitat i
   solicita_unir_se_a_entitat.

   ENCENDRE (true) QUAN S'APLIQUE 2611032100: fet a l'Onada R10 (IDEA-133, B2-04).

   El fet llegit (6-11-2026, 22:00, GET de només lectura a la base de
   producció): connexions_publiques_de i membres_i_entitats_connectades_de
   responen 200 a anon, i el Mestre diu que hi ha aplicat la 2611032100. Abans
   (R8 i R9, sense la migració) cada lectura feia un 404 PGRST202 a la consola, i
   runtime.rpc() (src/data/supabase/runtime.js) el tornava com un error sense
   `code`: la vista pintava l'avís «No s’han pogut llegir les connexions». Per
   això R9 el va deixar apagat.

   Encés, l'adaptador remot (src/data/supabase/seguiments.js, executaConnexions)
   crida les RPC: la fitxa del poble i les fitxes públiques tornen a pintar el
   bloc de connexions (D-C4-1). Apagat, després de les mateixes validacions de
   sempre, respon el NO-DISPONIBLE que preveu el disseny
   (ConnexionsPubliques.sonda.test.jsx), sense cap petició. Els modes seed i
   local no en depenen: el seu servidor és localSeguiments.js.

   Una constant literal, com AVISOS_PUSH_XAT_ACTIUS: Rollup la plega. És d'abast
   de build: un node amb un backend propi sense 2611032100 l'ha d'apagar. */
export const CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES = true;
