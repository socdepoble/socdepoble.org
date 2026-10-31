-- Esmena al Lot 3 (2610311800_e2ee_fases_1b_1c_rpcs_i_adjunts.sql). Requerix el 2610311800.
-- NO aplicada: l'aplica el Mestre, en la mateixa branca i just després del 2610311800.
-- Les CHECK xat_fils_marques_lot3 i xat_missatges_sobre_lot3 criden validadors privats.
-- PostgreSQL comprova EXECUTE quan inicialitza l'expressió de la CHECK, per a qualsevol
-- fila (també els fils i missatges en clar), i el cos resol private.xat_b64 amb el rol
-- de qui escriu. Sense esta esmena, un DML directe amb service_role (PostgREST amb la
-- clau de servei) fallava: «permission denied for function xat_lot3_b64» o, en un fil
-- ja xifrat, «permission denied for schema private». Són funcions pures, sense accés a
-- dades: passen a SECURITY DEFINER amb el mateix search_path i només service_role
-- rep EXECUTE. No s'obri res a anon ni a authenticated.
BEGIN;
ALTER FUNCTION private.xat_lot3_b64(text, integer) SECURITY DEFINER;
ALTER FUNCTION private.xat_sobre_format_v1_valid(jsonb) SECURITY DEFINER;
REVOKE ALL ON FUNCTION private.xat_lot3_b64(text, integer), private.xat_sobre_format_v1_valid(jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.xat_lot3_b64(text, integer), private.xat_sobre_format_v1_valid(jsonb)
  TO service_role;
COMMIT;
