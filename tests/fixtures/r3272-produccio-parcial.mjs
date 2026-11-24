/** Synthetic structural projection, not a copy of production DDL or data.
 * These ten FK names/columns/references are observed in the pinned JSON but
 * absent in the canonical HEAD131 catalogue. Referential actions, types not
 * visible in that JSON and all unrelated policies/bodies are not certified.
 */
export async function sembraFkObservadesR3272(pg) {
  await pg.exec(`
    CREATE TABLE private.publicacions_cas_rebuts (
      owner_user_id uuid REFERENCES auth.users(id),
      submission_id uuid REFERENCES public.section_submissions(id),
      tenant_id uuid REFERENCES public.towns(id)
    );
    CREATE TABLE private.r3213_crdt_captures (owner_id uuid REFERENCES auth.users(id));
    CREATE TABLE private.r3213_crdt_dots (owner_id uuid REFERENCES auth.users(id));
    CREATE TABLE private.r3213_lssi_audit (
      actor_id uuid REFERENCES auth.users(id), denuncia_id uuid REFERENCES public.denuncies(id)
    );
    CREATE TABLE private.r3213_lssi_rebuts (actor_id uuid REFERENCES auth.users(id));
    CREATE TABLE public.branques_saber (id uuid PRIMARY KEY);
    ALTER TABLE public.aportacions_culturals ADD COLUMN branca_id uuid
      CONSTRAINT aportacions_culturals_branca_id_fkey REFERENCES public.branques_saber(id);
    CREATE TABLE public.inventari_brain_node0 (id uuid PRIMARY KEY);
    ALTER TABLE public.inventari_brain_node0 ADD COLUMN branca_id uuid
      CONSTRAINT inventari_brain_node0_branca_id_fkey REFERENCES public.branques_saber(id);
  `);
}

/** Isolate the observed permissive profiles policy from a canonical local
 * restrictive legacy-bucket fence, so the new protection must do real work.
 * This does not assert that these are all policies/ACL of hosted Storage.
 */
export async function sembraEnumeracioProfilesR3272(pg) {
  await pg.exec(`
    INSERT INTO storage.buckets(id,name,public) VALUES ('profiles','profiles',true),('r3272_control','r3272_control',true);
    INSERT INTO storage.objects(bucket_id,name) VALUES ('profiles','synthetic-account/avatar.webp'),('r3272_control','public-control.webp');
    DROP POLICY "r22 frontera de buckets" ON storage.objects;
    GRANT SELECT ON storage.objects TO anon;
    CREATE POLICY "Public Access" ON storage.objects FOR SELECT TO public USING (bucket_id='profiles');
    CREATE POLICY r3272_control ON storage.objects FOR SELECT TO public USING (bucket_id='r3272_control');
  `);
}
