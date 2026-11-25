-- Fixture del filtre FN0 (C6 · desplaçament real de línies): una funció SECURITY DEFINER sense search_path buit.
-- No és cap migració i no s'aplica a cap base: tests/filtre-aprenentatge-node0.test.mjs la llig com a text.
-- La funció és la segona sentència perquè la capçalera d'una primera sentència comença sempre a la línia 1.
BEGIN;

CREATE OR REPLACE FUNCTION public.fixture_fn0_desplacament()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
  PERFORM 1;
END;
$func$;

COMMIT;
