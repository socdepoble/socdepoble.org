-- R32.52 · suport real de FOREIGN KEY: igualtat sobre totes les columnes FK.
-- L'ordre entre estes columnes és indiferent si ocupen totes el prefix B-tree.
-- INCLUDE no és clau; només s'accepta parcial exactament FKcol IS NOT NULL,
-- implicat per la igualtat estricta de les comprovacions FK. Altres predicats
-- es reporten conservadorament i requerixen prova de pla abans de DDL. Una expressió
-- al prefix no equival a la columna. Una expressió posterior al prefix sí és útil.
SELECT n.nspname AS schema_name,c.relname AS table_name,con.conname AS constraint_name,
 ARRAY(SELECT a.attname FROM unnest(con.conkey) WITH ORDINALITY k(attnum,ord)
       JOIN pg_attribute a ON a.attrelid=con.conrelid AND a.attnum=k.attnum ORDER BY k.ord) AS fk_columns,
 con.confrelid::regclass::text AS referenced_table
FROM pg_constraint con
JOIN pg_class c ON c.oid=con.conrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE con.contype='f' AND n.nspname IN ('public','private') AND NOT EXISTS (
 SELECT 1 FROM pg_index i JOIN pg_class ic ON ic.oid=i.indexrelid JOIN pg_am am ON am.oid=ic.relam
 WHERE i.indrelid=con.conrelid AND i.indisvalid AND i.indisready AND i.indislive
   AND am.amname='btree' AND i.indnkeyatts>=cardinality(con.conkey)
   AND (i.indpred IS NULL OR EXISTS (
     SELECT 1 FROM pg_attribute a WHERE a.attrelid=con.conrelid AND a.attnum=ANY(con.conkey)
       AND pg_get_expr(i.indpred,i.indrelid)=format('(%I IS NOT NULL)',a.attname)
   ))
   AND ARRAY(SELECT k.attnum FROM unnest(i.indkey::smallint[]) WITH ORDINALITY k(attnum,ord)
             WHERE k.ord<=cardinality(con.conkey) ORDER BY k.attnum)
       = ARRAY(SELECT k.attnum FROM unnest(con.conkey) k(attnum) ORDER BY k.attnum)
)
ORDER BY n.nspname,c.relname,con.conname;
