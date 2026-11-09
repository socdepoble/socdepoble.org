-- Dedicated IAIA-worker-role defaults, scoped to the current Node0 database.
-- A new connection is sufficient; no server restart or global log changes.
BEGIN;
DO $guard$
DECLARE setting record;
BEGIN
  IF current_database() NOT IN ('socdepoble_node0','node0_gauntlet_r4') OR
     to_regclass('node0.schema_migrations') IS NULL OR
     (SELECT count(*) FROM node0.schema_migrations)<>85 OR
     NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=current_user AND rolsuper) OR
     NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='node0_iaia_authenticator' AND NOT rolsuper AND NOT rolbypassrls AND NOT rolinherit AND rolcanlogin AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolreplication) OR
     (SELECT count(*) FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname='node0_iaia_authenticator'))<>1 OR
     NOT EXISTS(SELECT 1 FROM pg_auth_members membership JOIN pg_roles parent ON parent.oid=membership.roleid
       WHERE membership.member=(SELECT oid FROM pg_roles WHERE rolname='node0_iaia_authenticator')
         AND parent.rolname='node0_iaia_worker' AND NOT membership.admin_option
         AND NOT membership.inherit_option AND membership.set_option
         AND NOT (parent.rolsuper OR parent.rolbypassrls OR parent.rolcreatedb OR parent.rolcreaterole OR parent.rolreplication OR parent.rolcanlogin)
         AND NOT EXISTS(SELECT 1 FROM pg_auth_members ancestor WHERE ancestor.member=parent.oid)) THEN
    RAISE EXCEPTION 'node0_private_logging_installer_required';
  END IF;
  FOR setting IN SELECT * FROM (VALUES
    ('log_parameter_max_length','0'),('log_parameter_max_length_on_error','0'),
    ('log_statement','none'),('log_min_error_statement','panic'),('log_min_messages','fatal'),
    ('log_min_duration_statement','-1'),('log_min_duration_sample','-1'),('log_statement_sample_rate','0'),
    ('log_transaction_sample_rate','0'),('log_duration','off'),
    ('debug_print_parse','off'),('debug_print_plan','off'),('debug_print_rewritten','off')
  ) AS values(name,value) LOOP
    EXECUTE format('ALTER ROLE node0_iaia_authenticator IN DATABASE %I SET %I = %L',current_database(),setting.name,setting.value);
  END LOOP;
END $guard$;
COMMIT;
