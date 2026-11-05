BEGIN;
CREATE TABLE IF NOT EXISTS node0.inbox (
  id text PRIMARY KEY, actor text NOT NULL, type text NOT NULL, received_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(id)<=2048), CHECK (length(actor)<=2048)
);
CREATE TABLE IF NOT EXISTS node0.followers (
  actor text PRIMARY KEY, inbox text NOT NULL, follow_id text NOT NULL, followed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS node0.outbox (
  id text NOT NULL, target text NOT NULL, activity jsonb NOT NULL,
  attempts integer NOT NULL DEFAULT 0, next_attempt timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz, lease_until timestamptz, lease_owner text, PRIMARY KEY(id,target)
);
ALTER TABLE node0.outbox ADD COLUMN IF NOT EXISTS lease_until timestamptz;
ALTER TABLE node0.outbox ADD COLUMN IF NOT EXISTS lease_owner text;
CREATE TABLE IF NOT EXISTS node0.tombstones (id text PRIMARY KEY, actor text NOT NULL, deleted_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON node0.inbox,node0.followers,node0.outbox,node0.tombstones FROM PUBLIC;
GRANT SELECT,INSERT,UPDATE,DELETE ON node0.inbox,node0.followers,node0.outbox,node0.tombstones TO node0_runtime;
COMMIT;
