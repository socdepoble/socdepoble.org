-- 2611031750_oli_de_la_torre_preus_i_taula_mobil.sql
-- Correcció F1 (preus exactes de la taula = elem->>'price'), F3 (sense Blanqueta, pedra seca,
-- altitud 600–900 m ni temperatures inventades fora de la font oficial), F4 (sense class="sdp-num"
-- en cel·les de text llarg perquè la taula no desborde a 375 px en mòbil) i R4-SQL-01
-- (filtre estricte per tenant_id i verificació transaccional d'1 sola fila)
-- sobre els 7 productes d'Oli de La Torre a public.app_content (key = 'marketItems').

BEGIN;

DO $$
DECLARE
  v_files integer;
BEGIN
  UPDATE public.app_content
  SET payload = (
    SELECT jsonb_agg(
      CASE
        WHEN elem->>'author_org_id' = '3073b933-69fc-4c3e-80dc-b0df9c6b8391'
          OR elem->>'id' LIKE 'oli-de-la-torre-%'
        THEN jsonb_set(
          elem,
          '{description}',
          to_jsonb(
            replace(
              replace(
                replace(
                  replace(
                    replace(
                      replace(
                        replace(
                          replace(
                            elem->>'description',
                            '<tr><th scope="row">Format i preu oficial</th><td class="sdp-num">2,25 €</td>',
                            '<tr><th scope="row">Format i preu oficial</th><td class="sdp-num">' || (elem->>'price') || '</td>'
                          ),
                          '<tr><th scope="row">Format i preu oficial</th><td class="sdp-num">9,90 €</td>',
                          '<tr><th scope="row">Format i preu oficial</th><td class="sdp-num">' || (elem->>'price') || '</td>'
                        ),
                        '<tr><th scope="row">Format i preu oficial</th><td class="sdp-num">8,90 €</td>',
                        '<tr><th scope="row">Format i preu oficial</th><td class="sdp-num">' || (elem->>'price') || '</td>'
                      ),
                      '<td class="sdp-num">51 mg (425 % VRN)</td>',
                      '<td>51 mg (425 % VRN)</td>'
                    ),
                    '<td class="sdp-num">Alfafarenca, Blanqueta i Mançanella</td>',
                    '<td>Alfafarenca i Mançanella</td>'
                  ),
                  '<td class="sdp-num">1a extracció en fred (&lt; 27 °C)</td>',
                  '<td>Extracció mecànica en fred</td>'
                ),
                '<td class="sdp-num">Lloc fresc i fosc (14–20 °C)</td>',
                '<td>Lloc fresc i fosc</td>'
              ),
              'a partir d’<strong>oliveres de secà</strong> cultivades en <strong>bancals de pedra seca</strong> entre 600 i 900 metres d’altitud.',
              'a partir d’<strong>oliveres tradicionals de muntanya</strong> de la nostra comarca.'
            )
          )
        )
        ELSE elem
      END
    )
    FROM jsonb_array_elements(payload) AS elem
  )
  WHERE key = 'marketItems'
    AND tenant_id = '11111111-2222-3333-4444-555555555555'
    AND jsonb_typeof(payload) = 'array'
    AND jsonb_array_length(payload) > 0;

  GET DIAGNOSTICS v_files = ROW_COUNT;
  IF v_files <> 1 THEN
    RAISE EXCEPTION 'S''esperava actualitzar exactament 1 fila de marketItems per al tenant fundacional, però se n''han afectat %', v_files;
  END IF;
END $$;

COMMIT;
