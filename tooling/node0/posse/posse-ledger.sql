-- AH09 R11 durable ledger and explicit canonical SQL bindings. No automatic deployment.
-- Install as a dedicated privileged schema owner; request roles get one gate.
BEGIN;
DO $guard$ BEGIN
 IF current_database() NOT IN ('socdepoble_node0','node0_gauntlet_r4','node0_gauntlet_r6')
 -- Support the deployed canonical 76 and the reviewed, complete R20b pair (78),
 -- each also with the R9 /legal 2.5 seal 2611061520 (77, 79); a changed 2.5 text
 -- changes its sha256 and needs new pins (tests/node0-posse-sql.cases.mjs).
 -- R33 adds the exact full catalogue80 with P1-75 seed revisions. This pin
 -- does not advertise private Node0 revision methods or apply SQL remotely.
 -- R13-C7 adds the exact full catalogue81 with the superadmin-only session
 -- counts (2611082238); every earlier profile excludes it, as with SQL80.
 -- R54 adds the exact full85 catalogue with IAIA/push and preservedR13-C7.
 -- A count alone cannot prove a migration identity or its source bytes.
 OR NOT EXISTS(
 SELECT 1 FROM(VALUES
-- POSSE_MIGRATION_PINS_BEGIN
(76,'091d1e11b6e773c531cb88a5f79d1d932f96d19bc50fca837cbdd1dea30b0260'),
(77,'9b021cd927914be1ab8223a976a4b2518a96a0d85f068999aeebd174969dc94e'),
(78,'76d70ba0f769ddeda61980e489814adbd318146a00825574879ac985b2be52b1'),
(79,'a4c9054de9898e7a7c0de7825f23fde105c9bed77c833fadee69e2a9c5840798'),
(80,'6d03b86a5f9236a3d1734b4c52e23752c23b42a19009b666e22b40f0ba14d858'),
(81,'2b805488de510fb5c433c238dcf81b14d1b877920c2c4b221c88005c86ee8187')
,
(85,'c068a25593a05717070adc14f32d9d4c95762d15f3bb3facd7b622c10224ee5b')
-- POSSE_MIGRATION_PINS_END
 ) expected(migrations,sha256)
 CROSS JOIN(SELECT count(*) migrations,encode(pg_catalog.sha256(convert_to(coalesce(string_agg(version||E'\t'||file||E'\t'||sha256,E'\n' ORDER BY version COLLATE "C"),''),'UTF8')),'hex') sha256 FROM node0.schema_migrations) actual
 WHERE actual.migrations=expected.migrations AND actual.sha256=expected.sha256)
 OR NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=current_user AND (rolsuper OR rolbypassrls))
 THEN RAISE EXCEPTION 'posse_install_guard'; END IF;
 IF EXISTS(SELECT 1 FROM pg_namespace n WHERE n.nspname='node0_posse' AND n.nspowner<>(SELECT oid FROM pg_roles WHERE rolname=current_user))
 OR EXISTS(SELECT 1 FROM pg_proc f JOIN pg_namespace n ON n.oid=f.pronamespace WHERE n.nspname='node0_posse' AND f.proowner<>(SELECT oid FROM pg_roles WHERE rolname=current_user))
 OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='node0_posse' AND c.relkind IN('r','p') AND c.relowner<>(SELECT oid FROM pg_roles WHERE rolname=current_user))
 THEN RAISE EXCEPTION 'posse_owner_drift'; END IF;
END $guard$;
CREATE SCHEMA IF NOT EXISTS node0_posse;
REVOKE ALL ON SCHEMA node0_posse FROM PUBLIC,anon,authenticated,node0_runtime,node0_authenticator;
GRANT USAGE ON SCHEMA node0_posse TO authenticated;

CREATE TABLE IF NOT EXISTS node0_posse.remote_bindings(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),tenant_id uuid NOT NULL REFERENCES public.towns(id),
 owner_user_id uuid REFERENCES auth.users(id),owner_org_id uuid REFERENCES public.organizations(id),
 remote_account text NOT NULL,secret_ref text NOT NULL,proof_sha256 text NOT NULL CHECK(proof_sha256 ~ '^[a-f0-9]{64}$'),
 verified_at timestamptz NOT NULL,expires_at timestamptz NOT NULL,revoked_at timestamptz,
 CHECK((owner_user_id IS NOT NULL)::int+(owner_org_id IS NOT NULL)::int=1),
 CHECK(expires_at>verified_at AND expires_at<=verified_at+interval '24 hours'));
CREATE TABLE IF NOT EXISTS node0_posse.bridges(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES public.towns(id),
 owner_user_id uuid REFERENCES auth.users(id),owner_org_id uuid REFERENCES public.organizations(id),
 remote_account text NOT NULL CHECK(length(remote_account)<=2048 AND remote_account ~ '^https://[^/?#@[:space:]]+/[^?#[:space:]]+$'),
 secret_ref text NOT NULL CHECK(secret_ref ~ '^(bridges|credentials)/[A-Za-z0-9][A-Za-z0-9/_-]{0,223}$'),
 binding_id uuid NOT NULL REFERENCES node0_posse.remote_bindings(id),
 binding_proof text NOT NULL CHECK(binding_proof ~ '^[a-f0-9]{64}$'),
 policy jsonb NOT NULL CHECK(jsonb_typeof(policy)='object'),default_tags jsonb NOT NULL DEFAULT '[]',
 policy_revision bigint NOT NULL DEFAULT 1 CHECK(policy_revision>0), enabled boolean NOT NULL DEFAULT false,
 quota_daily integer NOT NULL DEFAULT 10 CHECK(quota_daily BETWEEN 1 AND 1000),
 cadence_seconds integer NOT NULL DEFAULT 60 CHECK(cadence_seconds BETWEEN 1 AND 86400),
 next_reserved_at timestamptz,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK((owner_user_id IS NOT NULL)::int+(owner_org_id IS NOT NULL)::int=1),UNIQUE(remote_account));
CREATE TABLE IF NOT EXISTS node0_posse.bridge_authors(
 bridge_id uuid NOT NULL REFERENCES node0_posse.bridges(id),kind text NOT NULL CHECK(kind IN('person','entity')),
 author_id uuid NOT NULL,PRIMARY KEY(bridge_id,kind,author_id));
CREATE TABLE IF NOT EXISTS node0_posse.records(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),bridge_id uuid NOT NULL REFERENCES node0_posse.bridges(id),
 tenant_id uuid NOT NULL,section_id text NOT NULL,record_id uuid NOT NULL,remote_account text NOT NULL,canonical_uri text NOT NULL,
 external_status_id text CHECK(external_status_id IS NULL OR external_status_id ~ '^[A-Za-z0-9_-]{1,128}$'),external_url text,published_hash text,
 UNIQUE(tenant_id,section_id,record_id,remote_account),UNIQUE(remote_account,canonical_uri),UNIQUE(remote_account,external_status_id));
CREATE UNIQUE INDEX IF NOT EXISTS posse_external_url_unique ON node0_posse.records(external_url) WHERE external_url IS NOT NULL;
CREATE TABLE IF NOT EXISTS node0_posse.canonical_uris(
 remote_account text NOT NULL,uri text NOT NULL,record_id uuid NOT NULL REFERENCES node0_posse.records(id),
 PRIMARY KEY(remote_account,uri));
CREATE TABLE IF NOT EXISTS node0_posse.drafts(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),record_id uuid NOT NULL REFERENCES node0_posse.records(id),
 snapshot jsonb NOT NULL, snapshot_sha256 text NOT NULL,draft_hash text NOT NULL CHECK(draft_hash ~ '^[a-f0-9]{64}$'),
 ready boolean NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(record_id,draft_hash));
CREATE TABLE IF NOT EXISTS node0_posse.approvals(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),draft_id uuid NOT NULL REFERENCES node0_posse.drafts(id),
 actor_id uuid NOT NULL REFERENCES auth.users(id),actor_proof text NOT NULL,credential_certification text NOT NULL,
 policy_revision bigint NOT NULL,binding_id uuid NOT NULL REFERENCES node0_posse.remote_bindings(id),
 binding_proof text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE TABLE IF NOT EXISTS node0_posse.quota_days(
 bridge_id uuid NOT NULL REFERENCES node0_posse.bridges(id),day date NOT NULL,reserved integer NOT NULL CHECK(reserved>=0),PRIMARY KEY(bridge_id,day));
CREATE TABLE IF NOT EXISTS node0_posse.attempts(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),record_id uuid NOT NULL REFERENCES node0_posse.records(id),
 draft_id uuid NOT NULL REFERENCES node0_posse.drafts(id),approval_id uuid NOT NULL REFERENCES node0_posse.approvals(id),
 actor_id uuid NOT NULL,lease_id uuid NOT NULL DEFAULT gen_random_uuid(),lease_until timestamptz NOT NULL,
 state text NOT NULL CHECK(state IN('claimed','media-pending','dispatching','indeterminate','published','released')),
 operation text NOT NULL CHECK(operation IN('create','update')),dispatch_stage text,
 media_id text,media_ready boolean NOT NULL DEFAULT false,observed_external_id text,observed_external_url text,
 reserved_day date NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),completed_at timestamptz,
 CHECK(dispatch_stage IS NULL OR dispatch_stage IN('media-post','status-post','status-put')));
CREATE UNIQUE INDEX IF NOT EXISTS posse_one_active_attempt ON node0_posse.attempts(record_id)
 WHERE state IN('claimed','media-pending','dispatching','indeterminate');
CREATE UNIQUE INDEX IF NOT EXISTS posse_unique_lease ON node0_posse.attempts(lease_id);

-- R11 explicit publication and identity attestations. Only the schema owner
-- inserts these after independent publication/account verification. JSON source
-- claims, organization names and slugs cannot create an attestation.
CREATE TABLE IF NOT EXISTS node0_posse.institutional_authors(
 tenant_id uuid NOT NULL REFERENCES public.towns(id),role text NOT NULL CHECK(role IN('socdepoble','rentonar')),
 organization_id uuid NOT NULL REFERENCES public.organizations(id),proof_sha256 text NOT NULL CHECK(proof_sha256 ~ '^[a-f0-9]{64}$'),
 active boolean NOT NULL DEFAULT true,PRIMARY KEY(tenant_id,role),UNIQUE(tenant_id,organization_id));
CREATE TABLE IF NOT EXISTS node0_posse.publication_certifications(
 tenant_id uuid NOT NULL REFERENCES public.towns(id),section_id text NOT NULL,record_id uuid NOT NULL REFERENCES public.section_submissions(id) ON DELETE CASCADE,
 source_revision text NOT NULL CHECK(source_revision ~ '^[a-f0-9]{64}$'),canonical_uri text NOT NULL CHECK(canonical_uri ~ '^https://socdepoble[.]org/(mur|mercat|events|calendari|mapa|vehicle|animalets|treball|habitatge|page)/[A-Za-z0-9_-]{1,128}$'),
 article_sha256 text NOT NULL CHECK(article_sha256 ~ '^[a-f0-9]{64}$'),proof_sha256 text NOT NULL CHECK(proof_sha256 ~ '^[a-f0-9]{64}$'),
 public_audience boolean NOT NULL CHECK(public_audience),commercial boolean NOT NULL,cover jsonb,
 verified_at timestamptz NOT NULL,expires_at timestamptz NOT NULL,revoked_at timestamptz,
 CHECK(expires_at>verified_at AND expires_at<=verified_at+interval '24 hours'),PRIMARY KEY(tenant_id,section_id,record_id));
CREATE TABLE IF NOT EXISTS node0_posse.legacy_aliases(
 tenant_id uuid NOT NULL REFERENCES public.towns(id),section_id text NOT NULL,record_id uuid NOT NULL REFERENCES public.section_submissions(id) ON DELETE CASCADE,
 legacy_uri text NOT NULL CHECK(legacy_uri ~ '^https?://[^[:space:]#]+$'),canonical_uri text NOT NULL,
 proof_sha256 text NOT NULL CHECK(proof_sha256 ~ '^[a-f0-9]{64}$'),PRIMARY KEY(tenant_id,section_id,record_id,legacy_uri));
CREATE TABLE IF NOT EXISTS node0_posse.remote_observations(
 remote_account text NOT NULL,external_status_id text NOT NULL CHECK(external_status_id ~ '^[A-Za-z0-9_-]{1,128}$'),
 external_url text NOT NULL CHECK(external_url ~ '^https://[^[:space:]]+$'),links jsonb NOT NULL CHECK(jsonb_typeof(links)='array' AND jsonb_array_length(links)<=64),
 public_audience boolean NOT NULL CHECK(public_audience),draft_hash text CHECK(draft_hash ~ '^[a-f0-9]{64}$'),
 proof_sha256 text NOT NULL CHECK(proof_sha256 ~ '^[a-f0-9]{64}$'),verified_at timestamptz NOT NULL,revoked_at timestamptz,
 PRIMARY KEY(remote_account,external_status_id),UNIQUE(remote_account,external_url));
CREATE TABLE IF NOT EXISTS node0_posse.historical_plans(
 bridge_id uuid NOT NULL REFERENCES node0_posse.bridges(id),record_id uuid NOT NULL,record_revision text NOT NULL,canonical_uri text NOT NULL,
 action text NOT NULL CHECK(action IN('prepare-create','review-link-existing','review-ambiguous-match')),existing jsonb NOT NULL,
 refreshed_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(bridge_id,record_id));
ALTER TABLE node0_posse.remote_bindings ADD COLUMN IF NOT EXISTS credential_sha256 text CHECK(credential_sha256 ~ '^[a-f0-9]{64}$');
ALTER TABLE node0_posse.remote_bindings ADD COLUMN IF NOT EXISTS scopes jsonb NOT NULL DEFAULT '[]'::jsonb CHECK(jsonb_typeof(scopes)='array');

CREATE OR REPLACE FUNCTION node0_posse.source_revision(s public.section_submissions) RETURNS text
 LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $f$
 SELECT encode(pg_catalog.sha256(convert_to(to_jsonb(s)::text,'UTF8')),'hex') $f$;
CREATE OR REPLACE FUNCTION node0_posse.source_current(t uuid,s text,i uuid) RETURNS jsonb
 LANGUAGE plpgsql SET search_path=pg_catalog,public,node0_posse AS $f$
 DECLARE row0 public.section_submissions;c node0_posse.publication_certifications;o public.organizations;rev text;commercial0 boolean; BEGIN
 SELECT * INTO row0 FROM public.section_submissions WHERE tenant_id=t AND section_id=s AND id=i FOR SHARE;
 IF row0.id IS NULL THEN RETURN NULL; END IF;
 rev:=node0_posse.source_revision(row0);
 SELECT * INTO c FROM node0_posse.publication_certifications WHERE tenant_id=t AND section_id=s AND record_id=i
 AND source_revision=rev AND public_audience AND verified_at<=clock_timestamp() AND expires_at>clock_timestamp() AND revoked_at IS NULL FOR SHARE;
 IF c.record_id IS NULL OR row0.payload->>'source'='mastodon' OR row0.payload->>'visibility' IN('private','members','unlisted','direct','followers') THEN RETURN NULL; END IF;
 IF row0.author_org_id IS NOT NULL THEN
  SELECT * INTO o FROM public.organizations WHERE id=row0.author_org_id AND tenant_id=t AND visibility='public' FOR SHARE;
  IF o.id IS NULL THEN RETURN NULL; END IF;
 END IF;
 commercial0:=c.commercial OR s='mercat' OR coalesce(row0.payload->>'ambit','') IN('mercat','oli')
 OR coalesce(row0.payload->>'type','') IN('product','producte','market','oli') OR coalesce(row0.payload->>'commercial','false')<>'false';
 RETURN jsonb_build_object('recordId',jsonb_build_object('tenantId',t,'sectionId',s,'id',i),'recordRevision',rev,'visibility','public',
 'source','socdepoble','canonicalUrl',c.canonical_uri,'articleSha256',c.article_sha256,'title',row0.title,'summary',coalesce(row0.description,''),
 'tags',CASE WHEN jsonb_typeof(row0.payload->'tags')='array' THEN row0.payload->'tags' ELSE '[]'::jsonb END,
 'editorialProvenance',jsonb_build_object('authorKind',CASE WHEN row0.author_org_id IS NULL THEN 'person' ELSE 'entity' END,
 'authorId',coalesce(row0.author_org_id,row0.owner_user_id),'proofSha256',encode(pg_catalog.sha256(convert_to(jsonb_build_object('sourceRevision',rev,'article',c.article_sha256,'proof',c.proof_sha256,'author',coalesce(row0.author_org_id,row0.owner_user_id),'commercial',commercial0,'cover',c.cover)::text,'UTF8')),'hex'),'commercial',commercial0))
 || CASE WHEN c.cover IS NOT NULL THEN jsonb_build_object('cover',c.cover) ELSE '{}'::jsonb END;
 END $f$;
CREATE OR REPLACE FUNCTION node0_posse.remote_current(b uuid,d uuid,i text) RETURNS jsonb
 LANGUAGE plpgsql SET search_path=pg_catalog,node0_posse AS $f$
 DECLARE bridge0 node0_posse.bridges;draft0 node0_posse.drafts;o node0_posse.remote_observations; BEGIN
 SELECT * INTO bridge0 FROM node0_posse.bridges WHERE id=b FOR SHARE;
 SELECT * INTO draft0 FROM node0_posse.drafts WHERE id=d FOR SHARE;
 SELECT * INTO o FROM node0_posse.remote_observations WHERE remote_account=bridge0.remote_account AND external_status_id=i
 AND public_audience AND draft_hash=draft0.draft_hash AND verified_at<=clock_timestamp() AND revoked_at IS NULL FOR SHARE;
 IF o.external_status_id IS NULL THEN RAISE EXCEPTION 'posse_positive_remote_proof_required' USING ERRCODE='N0P02'; END IF;
 RETURN jsonb_build_object('remoteAccountIdentity',o.remote_account,'externalStatusId',o.external_status_id,'externalUrl',o.external_url,'visibility','public','draftHash',o.draft_hash);
 END $f$;
CREATE OR REPLACE FUNCTION node0_posse.credential_proof(b node0_posse.bridges) RETURNS text
 LANGUAGE plpgsql SET search_path=pg_catalog,node0_posse AS $f$
 DECLARE rb node0_posse.remote_bindings;BEGIN
 SELECT * INTO rb FROM node0_posse.remote_bindings WHERE id=b.binding_id AND credential_sha256 IS NOT NULL AND revoked_at IS NULL AND verified_at<=clock_timestamp() AND expires_at>clock_timestamp() FOR SHARE;
 IF rb.id IS NULL THEN RETURN NULL; END IF;
 RETURN encode(pg_catalog.sha256(convert_to(jsonb_build_object('id',rb.id,'proof',rb.proof_sha256,'token',rb.credential_sha256,'scopes',rb.scopes,'account',rb.remote_account)::text,'UTF8')),'hex');
 END $f$;
CREATE OR REPLACE FUNCTION node0_posse.assert_default_policy(b node0_posse.bridges) RETURNS void
 LANGUAGE plpgsql SET search_path=pg_catalog,public,node0_posse AS $f$
 BEGIN
 IF b.remote_account<>'https://mastodont.cat/users/depoble' THEN RETURN; END IF;
 PERFORM 1 FROM node0_posse.institutional_authors a JOIN public.organizations o ON o.id=a.organization_id AND o.tenant_id=a.tenant_id
 WHERE a.tenant_id=b.tenant_id AND a.role='socdepoble' AND a.active AND o.id=b.owner_org_id AND o.visibility='public' FOR SHARE OF a,o;
 IF NOT FOUND OR b.owner_user_id IS NOT NULL OR b.policy->>'excludeCommercial' IS DISTINCT FROM 'true' OR NOT coalesce(b.policy->'excludedSections','[]'::jsonb) ? 'mercat'
 OR EXISTS(SELECT 1 FROM node0_posse.bridge_authors ba WHERE ba.bridge_id=b.id AND (ba.kind<>'entity' OR NOT EXISTS(SELECT 1 FROM node0_posse.institutional_authors a JOIN public.organizations o ON o.id=a.organization_id AND o.tenant_id=a.tenant_id WHERE a.tenant_id=b.tenant_id AND a.organization_id=ba.author_id AND a.active AND o.visibility='public')))
 OR (SELECT count(*) FROM node0_posse.bridge_authors WHERE bridge_id=b.id)<>2
 THEN RAISE EXCEPTION 'posse_institutional_policy_required' USING ERRCODE='42501'; END IF;
 END $f$;
CREATE OR REPLACE FUNCTION node0_posse.source_for_bridge(b node0_posse.bridges,s text,i uuid) RETURNS jsonb
 LANGUAGE plpgsql SET search_path=pg_catalog,public,node0_posse AS $f$
 DECLARE row0 jsonb;author0 uuid;kind0 text; BEGIN
 PERFORM node0_posse.assert_default_policy(b);
 row0:=node0_posse.source_current(b.tenant_id,s,i);
 IF row0 IS NULL THEN RETURN NULL; END IF;
 author0:=(row0->'editorialProvenance'->>'authorId')::uuid;kind0:=row0->'editorialProvenance'->>'authorKind';
 IF NOT EXISTS(SELECT 1 FROM node0_posse.bridge_authors WHERE bridge_id=b.id AND kind=kind0 AND author_id=author0)
 OR NOT node0_posse.can_act(b.tenant_id,CASE WHEN kind0='person' THEN author0 END,CASE WHEN kind0='entity' THEN author0 END)
 OR (b.policy->>'excludeCommercial'='true' AND row0->'editorialProvenance'->>'commercial' IS DISTINCT FROM 'false')
 OR coalesce(b.policy->'excludedSections','[]'::jsonb) ? s
 OR (b.policy ? 'allowedSections' AND NOT b.policy->'allowedSections' ? s)
 THEN RETURN NULL; END IF;
 RETURN row0;
 END $f$;
CREATE OR REPLACE FUNCTION node0_posse.history_matches(b node0_posse.bridges,s jsonb) RETURNS jsonb
 LANGUAGE plpgsql SET search_path=pg_catalog,node0_posse AS $f$
 DECLARE o node0_posse.remote_observations;matches jsonb:='[]'::jsonb; BEGIN
 FOR o IN SELECT * FROM node0_posse.remote_observations WHERE remote_account=b.remote_account AND public_audience AND verified_at<=clock_timestamp() AND revoked_at IS NULL FOR SHARE LOOP
  IF o.links ? (s->>'canonicalUrl') OR EXISTS(SELECT 1 FROM node0_posse.legacy_aliases a WHERE a.tenant_id=b.tenant_id AND a.section_id=s->'recordId'->>'sectionId' AND a.record_id=(s->'recordId'->>'id')::uuid AND a.canonical_uri=s->>'canonicalUrl' AND o.links ? a.legacy_uri) THEN
   matches:=matches||jsonb_build_array(jsonb_build_object('externalStatusId',o.external_status_id,'externalUrl',o.external_url));
  END IF;
 END LOOP;
 RETURN matches;
 END $f$;
CREATE OR REPLACE FUNCTION node0_posse.assert_history(b node0_posse.bridges,s jsonb) RETURNS void
 LANGUAGE plpgsql SET search_path=pg_catalog,node0_posse AS $f$
 DECLARE matches jsonb;r node0_posse.records;x jsonb; BEGIN
 matches:=node0_posse.history_matches(b,s);
 IF jsonb_array_length(matches)=0 THEN RETURN; END IF;
 SELECT * INTO r FROM node0_posse.records WHERE bridge_id=b.id AND section_id=s->'recordId'->>'sectionId' AND record_id=(s->'recordId'->>'id')::uuid FOR SHARE;
 FOR x IN SELECT value FROM jsonb_array_elements(matches) LOOP
  IF r.external_status_id IS NULL OR r.external_status_id<>x->>'externalStatusId' THEN RAISE EXCEPTION 'posse_historical_review_required' USING ERRCODE='N0P02'; END IF;
 END LOOP;
 END $f$;

CREATE OR REPLACE FUNCTION node0_posse.can_act(t uuid,u uuid,o uuid) RETURNS boolean
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private AS $f$
 BEGIN
 IF auth.uid() IS NULL THEN RETURN false; END IF;
 PERFORM 1 FROM public.town_memberships WHERE town_id=t AND user_id=auth.uid() FOR SHARE;
 IF NOT FOUND THEN RETURN false; END IF;
 IF u IS NOT NULL THEN RETURN u=auth.uid(); END IF;
 PERFORM 1 FROM public.organizations WHERE id=o AND tenant_id=t FOR SHARE;
 IF NOT FOUND THEN RETURN false; END IF;
 PERFORM 1 FROM public.organization_memberships WHERE organization_id=o AND user_id=auth.uid() AND role IN('owner','admin') FOR SHARE;
 RETURN FOUND AND private.can_manage_organization(o);
 END $f$;
CREATE OR REPLACE FUNCTION node0_posse.require_bridge(i uuid) RETURNS node0_posse.bridges
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private,node0_posse AS $f$
 DECLARE b node0_posse.bridges; BEGIN
 SELECT * INTO b FROM node0_posse.bridges WHERE id=i FOR UPDATE;
 IF b.id IS NULL OR NOT node0_posse.can_act(b.tenant_id,b.owner_user_id,b.owner_org_id) THEN RAISE EXCEPTION 'posse_denied' USING ERRCODE='42501'; END IF;
 PERFORM node0_posse.assert_default_policy(b); RETURN b; END $f$;
CREATE OR REPLACE FUNCTION node0_posse.bridge_json(b node0_posse.bridges) RETURNS jsonb
 LANGUAGE sql STABLE SET search_path=pg_catalog,node0_posse AS $f$
 SELECT jsonb_build_object('id',b.id,'tenantId',b.tenant_id,'ownerUserId',b.owner_user_id,'ownerOrgId',b.owner_org_id,
 'configRevision',b.policy_revision::text,'remoteAccountIdentity',b.remote_account,
 'policyProofSha256',encode(pg_catalog.sha256(convert_to((jsonb_build_object('policy',b.policy,'authors',coalesce((SELECT jsonb_agg(jsonb_build_object('kind',a.kind,'id',a.author_id,'enabled',true) ORDER BY a.kind,a.author_id) FROM node0_posse.bridge_authors a WHERE a.bridge_id=b.id),'[]'::jsonb),'revision',b.policy_revision,'remote',b.remote_account))::text,'UTF8')),'hex'),
 'linkedAuthors',coalesce((SELECT jsonb_agg(jsonb_build_object('kind',a.kind,'id',a.author_id,'enabled',true) ORDER BY a.kind,a.author_id) FROM node0_posse.bridge_authors a WHERE a.bridge_id=b.id),'[]'::jsonb),
 'policy',b.policy,'defaultTags',b.default_tags,'enabled',b.enabled)
 $f$;
CREATE OR REPLACE FUNCTION node0_posse.binding_current(b node0_posse.bridges) RETURNS boolean
 LANGUAGE plpgsql SET search_path=pg_catalog,node0_posse AS $f$
 BEGIN
 PERFORM 1 FROM node0_posse.remote_bindings WHERE id=b.binding_id AND tenant_id=b.tenant_id
 AND owner_user_id IS NOT DISTINCT FROM b.owner_user_id AND owner_org_id IS NOT DISTINCT FROM b.owner_org_id
 AND remote_account=b.remote_account AND secret_ref=b.secret_ref AND proof_sha256=b.binding_proof AND verified_at<=clock_timestamp()
 AND expires_at>clock_timestamp() AND revoked_at IS NULL FOR SHARE;
 RETURN FOUND;
 END $f$;
CREATE OR REPLACE FUNCTION node0_posse.assert_current(b node0_posse.bridges,d node0_posse.drafts) RETURNS void
 LANGUAGE plpgsql SET search_path=pg_catalog,public,private,node0_posse AS $f$
 DECLARE s jsonb;p jsonb;a uuid;k text; BEGIN
 IF NOT node0_posse.binding_current(b) THEN RAISE EXCEPTION 'posse_remote_binding_required'; END IF;
 IF NOT b.enabled OR NOT d.ready OR d.snapshot->'canonicalProof' IS NULL OR d.snapshot->'canonicalProof'='null'::jsonb
 OR d.snapshot->'draft'->>'visibility' IS DISTINCT FROM 'public'
 OR d.snapshot->'canonicalProof'->>'url' IS DISTINCT FROM d.snapshot->'draft'->>'canonicalUrl'
 OR d.snapshot->'bridge'->>'bridgeRevision' IS DISTINCT FROM b.policy_revision::text
 OR d.snapshot->'bridge'->>'remoteAccountIdentity' IS DISTINCT FROM b.remote_account
 OR d.snapshot->'bridge'->>'policyProofSha256' IS DISTINCT FROM node0_posse.bridge_json(b)->>'policyProofSha256'
 THEN RAISE EXCEPTION 'posse_stale' USING ERRCODE='N0P01'; END IF;
 s:=node0_posse.source_for_bridge(b,d.snapshot->'recordId'->>'sectionId',(d.snapshot->'recordId'->>'id')::uuid);
 PERFORM node0_posse.assert_history(b,s);
 p:=s->'editorialProvenance';a:=(p->>'authorId')::uuid;k:=p->>'authorKind';
 IF s IS NULL OR s->>'visibility' IS DISTINCT FROM 'public'
 OR s->'recordId' IS DISTINCT FROM d.snapshot->'recordId'
 OR s->>'recordRevision' IS DISTINCT FROM d.snapshot->>'recordRevision'
 OR s->>'articleSha256' IS DISTINCT FROM d.snapshot->'canonicalProof'->>'articleSha256'
 OR p IS DISTINCT FROM d.snapshot->'editorialProvenance'
 OR s->>'canonicalUrl' IS DISTINCT FROM d.snapshot->'draft'->>'canonicalUrl'
 OR NOT EXISTS(SELECT 1 FROM node0_posse.bridge_authors WHERE bridge_id=b.id AND kind=k AND author_id=a)
 OR NOT node0_posse.can_act(b.tenant_id,CASE WHEN k='person' THEN a END,CASE WHEN k='entity' THEN a END)
 OR (b.policy->>'excludeCommercial'='true' AND (p->>'commercial')::boolean IS DISTINCT FROM false)
 OR coalesce(b.policy->'excludedSections','[]'::jsonb) ? (d.snapshot->'recordId'->>'sectionId')
 OR (b.policy ? 'allowedSections' AND NOT b.policy->'allowedSections' ? (d.snapshot->'recordId'->>'sectionId'))
 THEN RAISE EXCEPTION 'posse_stale' USING ERRCODE='N0P01'; END IF;
 END $f$;

CREATE OR REPLACE FUNCTION node0_posse.immutable() RETURNS trigger LANGUAGE plpgsql AS $f$
 BEGIN RAISE EXCEPTION 'posse_immutable_snapshot'; END $f$;
DROP TRIGGER IF EXISTS posse_draft_immutable ON node0_posse.drafts;
CREATE TRIGGER posse_draft_immutable BEFORE UPDATE OR DELETE ON node0_posse.drafts FOR EACH ROW EXECUTE FUNCTION node0_posse.immutable();
DROP TRIGGER IF EXISTS posse_approval_immutable ON node0_posse.approvals;
CREATE TRIGGER posse_approval_immutable BEFORE UPDATE OR DELETE ON node0_posse.approvals FOR EACH ROW EXECUTE FUNCTION node0_posse.immutable();
DROP TRIGGER IF EXISTS posse_uri_immutable ON node0_posse.canonical_uris;
CREATE TRIGGER posse_uri_immutable BEFORE UPDATE OR DELETE ON node0_posse.canonical_uris FOR EACH ROW EXECUTE FUNCTION node0_posse.immutable();

CREATE OR REPLACE FUNCTION node0_posse.rpc(op text,p jsonb) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,private,node0_posse AS $f$
 DECLARE b node0_posse.bridges;r node0_posse.records;d node0_posse.drafts;at node0_posse.attempts;
 x jsonb;s jsonb;approval uuid;bid uuid;binding uuid;binding_proof0 text;day0 date;used integer;was_media boolean; BEGIN
 IF auth.uid() IS NULL OR jsonb_typeof(p)<>'object' OR NOT private.is_town_member((p->>'contextTenant')::uuid) THEN RAISE EXCEPTION 'posse_denied' USING ERRCODE='42501'; END IF;
 IF op='default-bridge' THEN
  SELECT * INTO b FROM node0_posse.bridges bb WHERE bb.tenant_id=(p->>'contextTenant')::uuid AND bb.remote_account='https://mastodont.cat/users/depoble';
  IF b.id IS NULL THEN RAISE EXCEPTION 'posse_default_bridge_missing' USING ERRCODE='42501'; END IF;
  b:=node0_posse.require_bridge(b.id);RETURN node0_posse.bridge_json(b);
 END IF;
 IF op='certify' THEN
  s:=node0_posse.source_current((p->>'contextTenant')::uuid,p->'recordId'->>'sectionId',(p->'recordId'->>'id')::uuid);
  IF s IS NULL OR s->>'recordRevision' IS DISTINCT FROM p->>'recordRevision' OR s->>'canonicalUrl' IS DISTINCT FROM p->>'canonicalUrl' THEN RETURN jsonb_build_object('ok',false); END IF;
  IF NOT node0_posse.can_act((p->>'contextTenant')::uuid,CASE WHEN s->'editorialProvenance'->>'authorKind'='person' THEN (s->'editorialProvenance'->>'authorId')::uuid END,CASE WHEN s->'editorialProvenance'->>'authorKind'='entity' THEN (s->'editorialProvenance'->>'authorId')::uuid END) THEN RAISE EXCEPTION 'posse_denied' USING ERRCODE='42501'; END IF;
  RETURN jsonb_build_object('ok',true,'url',s->>'canonicalUrl','articleSha256',s->>'articleSha256');
 END IF;
 IF op='configure' THEN
  bid:=(p->>'id')::uuid;
  IF (p->>'tenantId') IS DISTINCT FROM (p->>'contextTenant') THEN RAISE EXCEPTION 'posse_denied' USING ERRCODE='42501'; END IF;
  SELECT * INTO b FROM node0_posse.bridges WHERE id=bid FOR UPDATE;
  IF b.id IS NOT NULL THEN
   b:=node0_posse.require_bridge(bid);
   IF b.tenant_id<>(p->>'tenantId')::uuid OR b.owner_user_id IS DISTINCT FROM (p->>'ownerUserId')::uuid OR b.owner_org_id IS DISTINCT FROM (p->>'ownerOrgId')::uuid OR b.remote_account IS DISTINCT FROM p->>'remoteAccountIdentity'
   THEN RAISE EXCEPTION 'posse_identity_immutable'; END IF;
  ELSIF NOT node0_posse.can_act((p->>'tenantId')::uuid,(p->>'ownerUserId')::uuid,(p->>'ownerOrgId')::uuid) THEN RAISE EXCEPTION 'posse_denied' USING ERRCODE='42501'; END IF;
  FOR x IN SELECT value FROM jsonb_array_elements(p->'linkedAuthors') LOOP
   IF x->>'kind' NOT IN('person','entity') OR NOT node0_posse.can_act((p->>'tenantId')::uuid,CASE WHEN x->>'kind'='person' THEN (x->>'id')::uuid END,CASE WHEN x->>'kind'='entity' THEN (x->>'id')::uuid END) THEN RAISE EXCEPTION 'posse_author_denied' USING ERRCODE='42501'; END IF;
  END LOOP;
  SELECT id,proof_sha256 INTO binding,binding_proof0 FROM node0_posse.remote_bindings WHERE tenant_id=(p->>'tenantId')::uuid
  AND owner_user_id IS NOT DISTINCT FROM (p->>'ownerUserId')::uuid AND owner_org_id IS NOT DISTINCT FROM (p->>'ownerOrgId')::uuid
  AND remote_account=p->>'remoteAccountIdentity' AND secret_ref=p->>'secretRef'
  AND verified_at<=clock_timestamp() AND expires_at>clock_timestamp() AND revoked_at IS NULL
  ORDER BY verified_at DESC,id DESC LIMIT 1 FOR SHARE;
  IF binding IS NULL THEN RAISE EXCEPTION 'posse_remote_binding_required' USING ERRCODE='42501'; END IF;
  INSERT INTO node0_posse.bridges(id,tenant_id,owner_user_id,owner_org_id,remote_account,secret_ref,binding_id,binding_proof,policy,default_tags,enabled,quota_daily,cadence_seconds)
  VALUES(bid,(p->>'tenantId')::uuid,(p->>'ownerUserId')::uuid,(p->>'ownerOrgId')::uuid,p->>'remoteAccountIdentity',p->>'secretRef',binding,binding_proof0,p->'policy',p->'defaultTags',(p->>'enabled')::boolean,(p->>'quotaDaily')::integer,(p->>'cadenceSeconds')::integer)
  ON CONFLICT(id) DO UPDATE SET policy=EXCLUDED.policy,default_tags=EXCLUDED.default_tags,enabled=EXCLUDED.enabled,secret_ref=EXCLUDED.secret_ref,binding_id=EXCLUDED.binding_id,binding_proof=EXCLUDED.binding_proof,quota_daily=EXCLUDED.quota_daily,cadence_seconds=EXCLUDED.cadence_seconds,policy_revision=node0_posse.bridges.policy_revision+1;
  DELETE FROM node0_posse.bridge_authors WHERE bridge_id=bid;
  INSERT INTO node0_posse.bridge_authors SELECT bid,entry.value->>'kind',(entry.value->>'id')::uuid FROM jsonb_array_elements(p->'linkedAuthors') entry;
  SELECT * INTO b FROM node0_posse.bridges WHERE id=bid;PERFORM node0_posse.assert_default_policy(b);RETURN node0_posse.bridge_json(b);
 END IF;
 IF op IN('bridge','list','record','prepare','claim','sources','history','refresh-history','credential') THEN b:=node0_posse.require_bridge((p->>'bridgeId')::uuid);
 ELSE
  IF op='prepared' THEN
   SELECT * INTO d FROM node0_posse.drafts WHERE id=(p->>'preparedId')::uuid;
   SELECT * INTO r FROM node0_posse.records WHERE id=d.record_id;
  ELSE
   SELECT * INTO at FROM node0_posse.attempts WHERE lease_id=(p->>'leaseId')::uuid;
   SELECT * INTO r FROM node0_posse.records WHERE id=at.record_id;
   IF at.id IS NULL OR at.actor_id<>auth.uid() THEN RAISE EXCEPTION 'posse_denied' USING ERRCODE='42501'; END IF;
   SELECT * INTO d FROM node0_posse.drafts WHERE id=at.draft_id;
  END IF;
  b:=node0_posse.require_bridge(r.bridge_id);
  IF op<>'prepared' THEN
   SELECT * INTO at FROM node0_posse.attempts WHERE lease_id=(p->>'leaseId')::uuid FOR UPDATE;
   SELECT * INTO r FROM node0_posse.records WHERE id=at.record_id FOR UPDATE;
   IF at.id IS NULL OR at.actor_id<>auth.uid() THEN RAISE EXCEPTION 'posse_denied' USING ERRCODE='42501'; END IF;
  END IF;
 END IF;
 IF b.tenant_id IS DISTINCT FROM (p->>'contextTenant')::uuid THEN RAISE EXCEPTION 'posse_denied' USING ERRCODE='42501'; END IF;
 IF op='bridge' THEN RETURN node0_posse.bridge_json(b); END IF;
 IF op='credential' THEN
  IF NOT node0_posse.binding_current(b) OR NOT EXISTS(SELECT 1 FROM node0_posse.remote_bindings rb WHERE rb.id=b.binding_id AND rb.credential_sha256=p->>'tokenSha256' AND rb.scopes @> (p->'requiredScopes') AND rb.verified_at<=clock_timestamp() AND rb.revoked_at IS NULL AND rb.expires_at>clock_timestamp()) THEN RAISE EXCEPTION 'posse_credential_proof_required' USING ERRCODE='42501'; END IF;
  RETURN (SELECT jsonb_build_object('tokenSha256',credential_sha256,'scopes',scopes,'accountIdentity',remote_account,'certificationId',node0_posse.credential_proof(b)) FROM node0_posse.remote_bindings WHERE id=b.binding_id);
 END IF;
 IF op IN('sources','history','refresh-history') THEN
  x:='[]'::jsonb;
  FOR bid IN SELECT ss.id FROM public.section_submissions ss
   JOIN node0_posse.publication_certifications pc ON pc.tenant_id=ss.tenant_id AND pc.section_id=ss.section_id AND pc.record_id=ss.id
   WHERE ss.tenant_id=b.tenant_id AND pc.revoked_at IS NULL AND pc.expires_at>clock_timestamp()
   AND EXISTS(SELECT 1 FROM node0_posse.bridge_authors ba WHERE ba.bridge_id=b.id AND ((ba.kind='entity' AND ba.author_id=ss.author_org_id) OR (ba.kind='person' AND ss.author_org_id IS NULL AND ba.author_id=ss.owner_user_id)))
   ORDER BY ss.created_at DESC,ss.id LOOP
   s:=node0_posse.source_for_bridge(b,(SELECT section_id FROM public.section_submissions WHERE id=bid),bid);
   IF s IS NOT NULL THEN x:=x||jsonb_build_array(s); END IF;
   EXIT WHEN jsonb_array_length(x)>=100;
  END LOOP;
  IF op='sources' THEN RETURN coalesce((SELECT jsonb_agg(value->'recordId') FROM jsonb_array_elements(x)),'[]'::jsonb); END IF;
  IF op='refresh-history' THEN
   DELETE FROM node0_posse.historical_plans WHERE bridge_id=b.id;
   FOR s IN SELECT value FROM jsonb_array_elements(x) LOOP
    INSERT INTO node0_posse.historical_plans(bridge_id,record_id,record_revision,canonical_uri,action,existing)
    SELECT b.id,(s->'recordId'->>'id')::uuid,s->>'recordRevision',s->>'canonicalUrl',CASE jsonb_array_length(node0_posse.history_matches(b,s)) WHEN 0 THEN 'prepare-create' WHEN 1 THEN 'review-link-existing' ELSE 'review-ambiguous-match' END,node0_posse.history_matches(b,s);
   END LOOP;
   RETURN jsonb_build_object('refreshed',jsonb_array_length(x));
  END IF;
  RETURN jsonb_build_object('records',coalesce((SELECT jsonb_agg(jsonb_build_object('recordId',value->'recordId','recordRevision',value->>'recordRevision','canonicalUrl',value->>'canonicalUrl','primaryCertified',true)) FROM jsonb_array_elements(x)),'[]'::jsonb),
   'mappings',coalesce((SELECT jsonb_agg(jsonb_build_object('recordId',jsonb_build_object('tenantId',tenant_id,'sectionId',section_id,'id',record_id),'legacyUrl',legacy_uri,'canonicalUrl',canonical_uri,'proofSha256',proof_sha256)) FROM node0_posse.legacy_aliases a WHERE a.tenant_id=b.tenant_id AND EXISTS(SELECT 1 FROM jsonb_array_elements(x) v WHERE v.value->'recordId'->>'id'=a.record_id::text)),'[]'::jsonb),
   'inventory',coalesce((SELECT jsonb_agg(jsonb_build_object('id',external_status_id,'url',external_url,'accountIdentity',remote_account,'links',links,'proofSha256',proof_sha256)) FROM node0_posse.remote_observations WHERE remote_account=b.remote_account AND public_audience AND verified_at<=clock_timestamp() AND revoked_at IS NULL),'[]'::jsonb));
 END IF;
 IF op='mutation' THEN
  IF at.state<>'dispatching' OR at.dispatch_stage IS DISTINCT FROM p->>'stage' OR at.lease_until<=clock_timestamp() THEN RAISE EXCEPTION 'posse_stale' USING ERRCODE='N0P01'; END IF;
  PERFORM node0_posse.assert_current(b,d);
  IF NOT EXISTS(SELECT 1 FROM node0_posse.approvals WHERE id=at.approval_id AND credential_certification=node0_posse.credential_proof(b)) THEN RAISE EXCEPTION 'posse_credential_changed' USING ERRCODE='N0P01'; END IF;
  RETURN jsonb_build_object('allowed',true);
 END IF;

 IF op='record' THEN
  IF (p->'recordId'->>'tenantId')::uuid<>b.tenant_id THEN RAISE EXCEPTION 'posse_denied' USING ERRCODE='42501'; END IF;
  RETURN node0_posse.source_for_bridge(b,p->'recordId'->>'sectionId',(p->'recordId'->>'id')::uuid);
 END IF;
 IF op='list' THEN RETURN coalesce((SELECT jsonb_agg(q.value) FROM(SELECT jsonb_build_object('preparedId',selected.id,'snapshot',selected.snapshot,'draftHash',selected.draft_hash,'externalStatusId',rr.external_status_id,'externalUrl',rr.external_url,'publishedHash',rr.published_hash,'ledgerState',CASE WHEN recent.state='dispatching' THEN 'indeterminate' ELSE recent.state END,'state',CASE WHEN recent.state='dispatching' THEN 'indeterminate' ELSE recent.state END) value FROM node0_posse.records rr JOIN LATERAL(SELECT * FROM node0_posse.drafts dd WHERE dd.record_id=rr.id ORDER BY dd.created_at DESC,dd.id DESC LIMIT 1)selected ON true LEFT JOIN LATERAL(SELECT a.state FROM node0_posse.attempts a WHERE a.record_id=rr.id ORDER BY a.created_at DESC,a.id DESC LIMIT 1)recent ON true WHERE rr.bridge_id=b.id ORDER BY selected.created_at DESC LIMIT 100)q),'[]'::jsonb); END IF;
 IF op='prepared' THEN RETURN jsonb_build_object('preparedId',d.id,'snapshot',d.snapshot,'draftHash',d.draft_hash,'externalStatusId',r.external_status_id,'externalUrl',r.external_url,'publishedHash',r.published_hash); END IF;
 IF op='prepare' THEN
  s:=p->'snapshot';
  x:=node0_posse.source_for_bridge(b,s->'recordId'->>'sectionId',(s->'recordId'->>'id')::uuid);
  IF x IS NULL OR x->'recordId' IS DISTINCT FROM s->'recordId' OR x->>'recordRevision' IS DISTINCT FROM s->>'recordRevision' OR x->'editorialProvenance' IS DISTINCT FROM s->'editorialProvenance'
   OR x->>'canonicalUrl' IS DISTINCT FROM s->'draft'->>'canonicalUrl' OR x->>'articleSha256' IS DISTINCT FROM s->'canonicalProof'->>'articleSha256' THEN RAISE EXCEPTION 'posse_stale' USING ERRCODE='N0P01'; END IF;
  IF (s->'recordId'->>'tenantId')::uuid<>b.tenant_id OR s->'bridge'->>'bridgeId'<>b.id::text THEN RAISE EXCEPTION 'posse_denied' USING ERRCODE='42501'; END IF;
  INSERT INTO node0_posse.records(bridge_id,tenant_id,section_id,record_id,remote_account,canonical_uri) VALUES(b.id,b.tenant_id,s->'recordId'->>'sectionId',(s->'recordId'->>'id')::uuid,b.remote_account,s->'draft'->>'canonicalUrl') ON CONFLICT(tenant_id,section_id,record_id,remote_account) DO NOTHING;
  SELECT * INTO r FROM node0_posse.records WHERE tenant_id=b.tenant_id AND section_id=s->'recordId'->>'sectionId' AND record_id=(s->'recordId'->>'id')::uuid AND remote_account=b.remote_account FOR UPDATE;
  IF r.bridge_id<>b.id THEN RAISE EXCEPTION 'posse_record_identity_conflict'; END IF;
  INSERT INTO node0_posse.canonical_uris(remote_account,uri,record_id) VALUES(b.remote_account,s->'draft'->>'canonicalUrl',r.id) ON CONFLICT DO NOTHING;
  IF NOT EXISTS(SELECT 1 FROM node0_posse.canonical_uris WHERE remote_account=b.remote_account AND uri=s->'draft'->>'canonicalUrl' AND record_id=r.id) THEN RAISE EXCEPTION 'posse_canonical_uri_owned'; END IF;
  UPDATE node0_posse.records SET canonical_uri=s->'draft'->>'canonicalUrl' WHERE id=r.id;
  INSERT INTO node0_posse.drafts(record_id,snapshot,snapshot_sha256,draft_hash,ready) VALUES(r.id,s,encode(pg_catalog.sha256(convert_to(s::text,'UTF8')),'hex'),p->>'draftHash',(p->>'ready')::boolean) ON CONFLICT(record_id,draft_hash) DO NOTHING;
  SELECT * INTO d FROM node0_posse.drafts WHERE record_id=r.id AND draft_hash=p->>'draftHash';
  RETURN jsonb_build_object('preparedId',d.id);
 END IF;
 IF op='claim' THEN
  SELECT * INTO d FROM node0_posse.drafts WHERE id=(p->>'preparedId')::uuid;
  SELECT * INTO r FROM node0_posse.records WHERE id=d.record_id FOR UPDATE;
  IF r.bridge_id<>b.id OR p->>'expectedBridgeRevision'<>b.policy_revision::text OR p->>'remoteAccountIdentity'<>b.remote_account OR p->>'draftHash'<>d.draft_hash OR p->>'expectedRevision'<>d.snapshot->>'recordRevision' OR p->>'editorialProof'<>d.snapshot->'editorialProvenance'->>'proofSha256' OR p->>'bridgePolicyProof'<>node0_posse.bridge_json(b)->>'policyProofSha256' THEN RAISE EXCEPTION 'posse_stale' USING ERRCODE='N0P01'; END IF;
  PERFORM node0_posse.assert_current(b,d);
  IF p->>'credentialCertificationId' IS DISTINCT FROM node0_posse.credential_proof(b) THEN RAISE EXCEPTION 'posse_credential_changed' USING ERRCODE='42501'; END IF;
  IF r.external_status_id IS NOT NULL AND r.published_hash=d.draft_hash THEN RETURN jsonb_build_object('state','published','externalStatusId',r.external_status_id,'externalUrl',r.external_url,'publishedHash',r.published_hash); END IF;
  SELECT * INTO at FROM node0_posse.attempts WHERE record_id=r.id AND state IN('claimed','media-pending','dispatching','indeterminate') FOR UPDATE;
  IF at.state='dispatching' AND at.lease_until>clock_timestamp() THEN RETURN jsonb_build_object('state','busy'); END IF;
  IF at.state IN('dispatching','indeterminate') THEN UPDATE node0_posse.attempts SET state='indeterminate' WHERE id=at.id;RETURN jsonb_build_object('state','indeterminate');END IF;
  IF at.state='claimed' AND at.lease_until>clock_timestamp() THEN RETURN jsonb_build_object('state','busy');END IF;
  was_media:=coalesce(at.state IN('media-pending','claimed') AND at.media_id IS NOT NULL AND at.draft_id=d.id,false);
  IF at.id IS NOT NULL AND NOT was_media THEN UPDATE node0_posse.attempts SET state='released',lease_until=clock_timestamp() WHERE id=at.id; END IF;
  IF NOT was_media THEN
   IF b.next_reserved_at>clock_timestamp() THEN RETURN jsonb_build_object('state','cadence-limited');END IF;
   day0:=(clock_timestamp() AT TIME ZONE 'UTC')::date;
   INSERT INTO node0_posse.quota_days VALUES(b.id,day0,0) ON CONFLICT DO NOTHING;
   UPDATE node0_posse.quota_days SET reserved=reserved+1 WHERE bridge_id=b.id AND day=day0 AND reserved<b.quota_daily RETURNING reserved INTO used;
   IF used IS NULL THEN RETURN jsonb_build_object('state','quota-limited');END IF;
   UPDATE node0_posse.bridges SET next_reserved_at=clock_timestamp()+make_interval(secs=>b.cadence_seconds) WHERE id=b.id;
  END IF;
  INSERT INTO node0_posse.approvals(draft_id,actor_id,actor_proof,credential_certification,policy_revision,binding_id,binding_proof) VALUES(d.id,auth.uid(),p->>'actorProof',p->>'credentialCertificationId',b.policy_revision,b.binding_id,b.binding_proof) RETURNING id INTO approval;
  IF was_media THEN UPDATE node0_posse.attempts SET actor_id=auth.uid(),approval_id=approval,lease_id=gen_random_uuid(),lease_until=clock_timestamp()+interval '60 seconds',state='claimed' WHERE id=at.id RETURNING * INTO at;
  ELSE INSERT INTO node0_posse.attempts(record_id,draft_id,approval_id,actor_id,lease_until,state,operation,reserved_day) VALUES(r.id,d.id,approval,auth.uid(),clock_timestamp()+interval '60 seconds','claimed',CASE WHEN r.external_status_id IS NULL THEN 'create' ELSE 'update' END,day0) RETURNING * INTO at; END IF;
  RETURN jsonb_build_object('state','claimed','quotaReserved',true,'leaseId',at.lease_id,'approvedSnapshot',d.snapshot,'operation',at.operation,'externalStatusId',r.external_status_id,'mediaId',at.media_id);
 END IF;
 IF op='start' THEN
  IF at.state<>'claimed' OR at.lease_until<=clock_timestamp() OR p->>'stage' NOT IN('media-post','status-post','status-put') OR (p->>'stage'='status-post' AND at.operation<>'create') OR (p->>'stage'='status-put' AND at.operation<>'update') OR (p->>'stage'='media-post' AND (d.snapshot->'draft'->'cover'='null'::jsonb OR d.snapshot->'draft'->'cover' IS NULL OR at.media_id IS NOT NULL)) OR (p->>'stage' IN('status-post','status-put') AND d.snapshot->'draft'->'cover' IS NOT NULL AND d.snapshot->'draft'->'cover'<>'null'::jsonb AND at.media_id IS NULL) THEN RAISE EXCEPTION 'posse_lease_refused';END IF;
  PERFORM node0_posse.assert_current(b,d);
  IF NOT EXISTS(SELECT 1 FROM node0_posse.approvals WHERE id=at.approval_id AND credential_certification=node0_posse.credential_proof(b)) THEN RAISE EXCEPTION 'posse_credential_changed' USING ERRCODE='N0P01'; END IF;
  UPDATE node0_posse.attempts SET state='dispatching',dispatch_stage=p->>'stage' WHERE id=at.id;
  RETURN jsonb_build_object('authorized',true);
 END IF;
 IF op='media' THEN
  IF at.state NOT IN('dispatching','indeterminate') OR at.dispatch_stage<>'media-post' THEN RAISE EXCEPTION 'posse_lease_refused';END IF;
  UPDATE node0_posse.attempts SET state='claimed',dispatch_stage=NULL,media_id=p->>'mediaId',media_ready=(p->>'ready')::boolean WHERE id=at.id;
 ELSIF op='media-pending' THEN
  IF at.state<>'claimed' OR at.media_id IS NULL THEN RAISE EXCEPTION 'posse_lease_refused'; END IF;
  UPDATE node0_posse.attempts SET state='media-pending',lease_until=clock_timestamp() WHERE id=at.id;
 ELSIF op='release' THEN
  IF at.state<>'claimed' OR at.dispatch_stage IS NOT NULL THEN RAISE EXCEPTION 'posse_dispatched_cannot_release'; END IF;
  UPDATE node0_posse.attempts SET state=CASE WHEN media_id IS NULL THEN 'released' ELSE 'media-pending' END,lease_until=clock_timestamp() WHERE id=at.id;
 ELSIF op='uncertain' THEN
  IF at.state='published' THEN RETURN jsonb_build_object('state','published'); END IF;
  IF at.state NOT IN('dispatching','indeterminate') THEN RAISE EXCEPTION 'posse_no_dispatch_marker'; END IF;
  UPDATE node0_posse.attempts SET state='indeterminate',observed_external_id=coalesce(p->>'externalStatusId',observed_external_id),observed_external_url=coalesce(p->>'externalUrl',observed_external_url),media_id=coalesce(p->>'mediaId',media_id) WHERE id=at.id;
 ELSIF op='reconcile' THEN
  IF at.state<>'indeterminate' THEN RAISE EXCEPTION 'posse_reconcile_refused'; END IF;
  IF NOT node0_posse.binding_current(b) THEN RAISE EXCEPTION 'posse_remote_binding_required'; END IF;
  s:=node0_posse.remote_current(b.id,d.id,p->>'externalStatusId');
  IF s IS NULL OR s->>'remoteAccountIdentity' IS DISTINCT FROM b.remote_account OR s->>'externalStatusId' IS DISTINCT FROM p->>'externalStatusId' OR s->>'draftHash' IS DISTINCT FROM d.draft_hash OR s->>'visibility' IS DISTINCT FROM 'public' OR split_part(s->>'externalUrl','/',3) IS DISTINCT FROM split_part(b.remote_account,'/',3) OR (at.operation='update' AND r.external_status_id IS DISTINCT FROM p->>'externalStatusId') THEN RAISE EXCEPTION 'posse_remote_unverified'; END IF;
  UPDATE node0_posse.records SET external_status_id=p->>'externalStatusId',external_url=s->>'externalUrl',published_hash=d.draft_hash WHERE id=r.id;
  UPDATE node0_posse.attempts SET state='published',completed_at=clock_timestamp() WHERE id=at.id;
 ELSIF op='complete' THEN
  IF at.state='published' AND r.external_status_id=p->>'externalStatusId' AND r.published_hash=p->>'draftHash' THEN RETURN jsonb_build_object('state','published'); END IF;
  IF at.state NOT IN('dispatching','indeterminate') OR at.dispatch_stage NOT IN('status-post','status-put') OR p->>'draftHash'<>d.draft_hash OR p->>'canonicalUrl'<>d.snapshot->'draft'->>'canonicalUrl' OR split_part(p->>'externalUrl','/',3) IS DISTINCT FROM split_part(b.remote_account,'/',3) OR (at.operation='update' AND r.external_status_id IS DISTINCT FROM p->>'externalStatusId') THEN RAISE EXCEPTION 'posse_complete_refused'; END IF;
  IF NOT node0_posse.binding_current(b) OR NOT EXISTS(SELECT 1 FROM node0_posse.approvals WHERE id=at.approval_id AND binding_id=b.binding_id AND binding_proof=b.binding_proof AND policy_revision=b.policy_revision AND credential_certification=node0_posse.credential_proof(b)) THEN
   UPDATE node0_posse.attempts SET state='indeterminate',observed_external_id=p->>'externalStatusId',observed_external_url=p->>'externalUrl' WHERE id=at.id;
   RETURN jsonb_build_object('state','indeterminate');
  END IF;
  UPDATE node0_posse.records SET external_status_id=p->>'externalStatusId',external_url=p->>'externalUrl',published_hash=d.draft_hash WHERE id=r.id;
  UPDATE node0_posse.attempts SET state='published',completed_at=clock_timestamp() WHERE id=at.id;
  RETURN jsonb_build_object('state','published');
 ELSE RAISE EXCEPTION 'posse_operation_unavailable'; END IF;
 RETURN jsonb_build_object('ok',true);
END $f$;

CREATE OR REPLACE FUNCTION node0_posse.readiness() RETURNS jsonb
 LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,node0_posse AS $f$
 SELECT jsonb_build_object('version','posse.r11.v1','migrations',(SELECT count(*) FROM node0.schema_migrations),
 'migrationLedgerSha256',(SELECT encode(pg_catalog.sha256(convert_to(coalesce(string_agg(version||E'\t'||file||E'\t'||sha256,E'\n' ORDER BY version COLLATE "C"),''),'UTF8')),'hex') FROM node0.schema_migrations),
 'ownerStable',NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='node0_posse' AND p.proowner<>n.nspowner) AND NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='node0_posse' AND c.relowner<>n.nspowner),
 'tablesPrivate',NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace CROSS JOIN unnest(ARRAY['anon','authenticated','node0_runtime','node0_authenticator']) role0 CROSS JOIN unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) privilege0 WHERE n.nspname='node0_posse' AND c.relkind IN('r','p','v','m') AND has_table_privilege(role0,c.oid,privilege0))
 AND NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace CROSS JOIN unnest(ARRAY['anon','authenticated','node0_runtime','node0_authenticator']) role0 WHERE n.nspname='node0_posse' AND has_function_privilege(role0,p.oid,'EXECUTE') AND NOT (role0='authenticated' AND p.proname='rpc') AND NOT (role0='node0_authenticator' AND p.proname='readiness')),
 'functionHashes',(SELECT jsonb_object_agg(p.proname,encode(pg_catalog.sha256(convert_to(p.prosrc,'UTF8')),'hex')) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='node0_posse' AND p.proname=ANY(ARRAY['source_current','source_for_bridge','remote_current','assert_current','assert_history','rpc','credential_proof'])),
 'sourceInstalled',to_regprocedure('node0_posse.source_current(uuid,text,uuid)') IS NOT NULL,
 'remoteInstalled',to_regprocedure('node0_posse.remote_current(uuid,uuid,text)') IS NOT NULL)
 $f$;

REVOKE ALL ON ALL TABLES IN SCHEMA node0_posse FROM PUBLIC,anon,authenticated,node0_runtime,node0_authenticator;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA node0_posse FROM PUBLIC,anon,authenticated,node0_runtime,node0_authenticator;
GRANT EXECUTE ON FUNCTION node0_posse.rpc(text,jsonb) TO authenticated;
GRANT USAGE ON SCHEMA node0_posse TO node0_authenticator;
GRANT EXECUTE ON FUNCTION node0_posse.readiness() TO node0_authenticator;
ALTER TABLE node0_posse.bridges ENABLE ROW LEVEL SECURITY;
ALTER TABLE node0_posse.remote_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE node0_posse.bridge_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE node0_posse.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE node0_posse.canonical_uris ENABLE ROW LEVEL SECURITY;
ALTER TABLE node0_posse.drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE node0_posse.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE node0_posse.quota_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE node0_posse.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE node0_posse.institutional_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE node0_posse.publication_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE node0_posse.legacy_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE node0_posse.remote_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE node0_posse.historical_plans ENABLE ROW LEVEL SECURITY;
COMMIT;
