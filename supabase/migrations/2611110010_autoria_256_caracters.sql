-- L'autoria té un límit de 256 caràcters. La marca de drets és metadada.
-- Depén de 2609262232 (columnes copyright i CHECK original).
begin;

do $autoria$
declare
  nom_taula text;
begin
  foreach nom_taula in array array['notes', 'profiles', 'organizations']
  loop
    execute format($alter$
      alter table public.%I
        drop constraint %I,
        add constraint %I check (
          char_length(copyright) <= 274
          and char_length(
            case
              when copyright ~ '^(CC BY(-NC(-SA|-ND)?|-SA|-ND)? 4[.]0|CC0 1[.]0) · '
                then regexp_replace(copyright, '^(CC BY(-NC(-SA|-ND)?|-SA|-ND)? 4[.]0|CC0 1[.]0) · ', '')
              when left(copyright, 4) = '© · ' then substr(copyright, 5)
              when right(copyright, 10) = ' · CC0 1.0' then left(copyright, -10)
              when copyright ~ '^(CC BY(-NC(-SA|-ND)?|-SA|-ND)? 4[.]0|CC0 1[.]0) '
                then regexp_replace(copyright, '^(CC BY(-NC(-SA|-ND)?|-SA|-ND)? 4[.]0|CC0 1[.]0) ', '')
              when left(copyright, 1) = '©' then ltrim(substr(copyright, 2))
              else copyright
            end
          ) <= 256
        )
    $alter$, nom_taula, nom_taula || '_copyright_longitud', nom_taula || '_copyright_longitud');
  end loop;
end;
$autoria$;

commit;
