-- IDEA-107: àrea privada de fonts i candidats. Cap RPC pública ni grants implícits.
BEGIN;
CREATE SCHEMA IF NOT EXISTS node0;
CREATE TABLE IF NOT EXISTS node0.corpus_dialectal_fonts (
 sha256 text PRIMARY KEY CHECK (sha256 ~ '^[a-f0-9]{64}$'),
 nom text NOT NULL CHECK(length(nom) BETWEEN 1 AND 500),
 metadades jsonb NOT NULL CHECK(jsonb_typeof(metadades)='object')
);
CREATE TABLE IF NOT EXISTS node0.corpus_dialectal_fragments (
 font_sha256 text NOT NULL REFERENCES node0.corpus_dialectal_fonts(sha256),
 pagina integer NOT NULL CHECK(pagina>0),
 sha256 text NOT NULL CHECK(sha256 ~ '^[a-f0-9]{64}$'),
 text_original text NOT NULL,
 PRIMARY KEY(font_sha256,pagina)
);
CREATE TABLE IF NOT EXISTS node0.corpus_dialectal_valencia (
 id text PRIMARY KEY CHECK(id ~ '^[a-f0-9]{64}$'),
 font_sha256 text NOT NULL,
 pagina integer NOT NULL,
 linia integer NOT NULL CHECK(linia>0),
 lema text NOT NULL CHECK(length(lema) BETWEEN 1 AND 160),
 dades jsonb NOT NULL CHECK(jsonb_typeof(dades)='object'),
 text_original text NOT NULL,
 estat text NOT NULL DEFAULT 'candidat' CHECK(estat IN ('candidat','revisat','descartat')),
 revisor text,
 CHECK(estat<>'revisat' OR revisor IS NOT NULL),
 UNIQUE(font_sha256,pagina,linia),
 FOREIGN KEY(font_sha256,pagina) REFERENCES node0.corpus_dialectal_fragments(font_sha256,pagina)
);
CREATE INDEX IF NOT EXISTS corpus_dialectal_lema ON node0.corpus_dialectal_valencia(lower(lema));
CREATE INDEX IF NOT EXISTS corpus_dialectal_dades ON node0.corpus_dialectal_valencia USING gin(dades);
-- Estes restriccions també s'afegeixen a un esquema creat pel lot anterior.
DO $corpus$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='node0.corpus_dialectal_valencia'::regclass AND conname='corpus_revisor_no_buit') THEN
  ALTER TABLE node0.corpus_dialectal_valencia ADD CONSTRAINT corpus_revisor_no_buit CHECK(estat<>'revisat' OR COALESCE(length(btrim(revisor))>0,false));
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='node0.corpus_dialectal_valencia'::regclass AND conname='corpus_dades_procedencia') THEN
  ALTER TABLE node0.corpus_dialectal_valencia ADD CONSTRAINT corpus_dades_procedencia CHECK(COALESCE(
   dades->>'id'=id AND dades->>'font_sha256'=font_sha256
   AND jsonb_typeof(dades->'pagina')='number' AND dades->>'pagina'=pagina::text
   AND jsonb_typeof(dades->'linia')='number' AND dades->>'linia'=linia::text
   AND dades->>'lema'=lema AND dades->>'text_original'=text_original
   AND dades->>'estat'='candidat' AND dades->'geografia_confirmada'='false'::jsonb
   AND dades->'skos'='[]'::jsonb,false));
 END IF;
END;
$corpus$;
ALTER TABLE node0.corpus_dialectal_fonts ENABLE ROW LEVEL SECURITY;
ALTER TABLE node0.corpus_dialectal_fragments ENABLE ROW LEVEL SECURITY;
ALTER TABLE node0.corpus_dialectal_valencia ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON node0.corpus_dialectal_fonts,node0.corpus_dialectal_fragments,node0.corpus_dialectal_valencia FROM PUBLIC;
-- Sense policy: cap rol ordinari pot llegir o escriure. Ingesta només pel rol de manteniment.
COMMIT;
