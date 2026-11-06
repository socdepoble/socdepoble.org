/* D-P016 (Onada R9, ordre del Mestre del 261106) · L'interruptor de les sis RPC
   de connexions públiques i membres que crea
   supabase/migrations/2611032100_connexions_publiques_i_membres.sql:
   preferencies_connexions, desa_visibilitat_connexions, connexions_publiques_de,
   membres_i_entitats_connectades_de, inclou_persona_en_entitat i
   solicita_unir_se_a_entitat.

   ENCENDRE (true) QUAN S'APLIQUE 2611032100 a la base de Supabase de producció.

   Hui (R8, sense la migració) cada lectura fa un 404 a la consola, i
   runtime.rpc() (src/data/supabase/runtime.js) el torna com un error sense
   `code`: es perd el PGRST202, errorConnexionsRpc en fa DESCONEGUT, la vista
   pinta l'avís «No s’han pogut llegir les connexions» i sondaConnexions.js no
   ho recorda. Mesurat el 261106 amb el dist de R8 a
   /pobles/la-torre-de-les-macanes i a fitxes /empresa/:id.

   Apagat, l'adaptador remot (src/data/supabase/seguiments.js, executaConnexions)
   no fa cap petició: després de les mateixes validacions de sempre, respon el
   NO-DISPONIBLE que preveu el disseny (ConnexionsPubliques.sonda.test.jsx). La
   vista calla (ni bloc ni avís), sondaConnexions.js recorda que este backend
   no les té i la consola no veu cap 404 (P0-16). Això canvia el que es veu a
   les vistes de connexions (D-C4-1). Els modes seed i local no en depenen: el
   seu servidor és localSeguiments.js.

   Una constant literal, com AVISOS_PUSH_XAT_ACTIUS: Rollup la plega i, apagada,
   la crida rpc() de les connexions no viatja al paquet. És d'abast de build:
   un node amb un backend propi que ja tinga 2611032100 també l'ha d'encendre. */
export const CONNEXIONS_PUBLIQUES_REMOTES_ACTIVES = false;
