-- Dedicated request-role defaults, scoped to the current Node0 database.
-- A new connection is sufficient; no server restart or global log changes.
BEGIN;
DO $guard$
DECLARE setting record;
BEGIN
  IF current_database() NOT IN ('socdepoble_node0','node0_gauntlet_r4') OR
     to_regclass('node0.schema_migrations') IS NULL OR
     (SELECT count(*) FROM node0.schema_migrations)<>75 OR
     NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=current_user AND rolsuper) OR
     NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='node0_authenticator' AND NOT rolsuper AND NOT rolbypassrls AND NOT rolinherit) THEN
    RAISE EXCEPTION 'node0_private_logging_installer_required';
  END IF;
  FOR setting IN SELECT * FROM (VALUES
    ('log_parameter_max_length','0'),('log_parameter_max_length_on_error','0'),
    ('log_statement','none'),('log_min_error_statement','panic'),('log_min_messages','fatal'),
    ('log_min_duration_statement','-1'),('log_min_duration_sample','-1'),('log_statement_sample_rate','0'),
    ('log_transaction_sample_rate','0'),('log_duration','off'),
    ('debug_print_parse','off'),('debug_print_plan','off'),('debug_print_rewritten','off')
  ) AS values(name,value) LOOP
    EXECUTE format('ALTER ROLE node0_authenticator IN DATABASE %I SET %I = %L',current_database(),setting.name,setting.value);
  END LOOP;
END $guard$;
COMMIT;
