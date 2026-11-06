{ mkNodeZeroRuntime }:
{ config, lib, pkgs, ... }:
let
  inherit (lib) mkEnableOption mkIf mkOption types;
  municipal = config.services.socdepoble;
  cfg = municipal.node0;
  runtime = mkNodeZeroRuntime pkgs;
  source = "${runtime}/share/socdepoble-node0";
in {
  options.services.socdepoble.node0 = {
    enable = mkEnableOption "el backend institucional Node 0 amb PostgreSQL 17 i Caddy";
    credentialFile = mkOption {
      type = types.str;
      default = "/run/secrets/socdepoble-node0.env";
      description = "Fitxer extern al magatzem de Nix; systemd LoadCredential el lliura al procés. Només SDP_NODE0_ADMIN_TOKEN i tokens Mastodon, mai PG* ni flags d'activació.";
    };
  };
  config = mkIf cfg.enable {
    assertions = [
      { assertion = municipal.enable && municipal.domain == "socdepoble.cat"
          && municipal.municipality.slug == "la-torre-de-les-macanes" && municipal.enableActivityPub;
        message = "El servidor Node 0 actual té identitat institucional socdepoble.cat/La Torre fixada al codi; no es reetiqueta com un altre poble."; }
      { assertion = lib.hasPrefix "/" cfg.credentialFile && !(lib.hasPrefix "/nix/store/" cfg.credentialFile)
          && builtins.match ".*[\n\r].*" cfg.credentialFile == null;
        message = "node0.credentialFile ha de ser un camí absolut extern al magatzem, sense salts de línia."; }
      { assertion = lib.versions.major pkgs.postgresql_17.version == "17";
        message = "Node 0 requerix PostgreSQL 17."; }
    ];
    users.groups.node0_runtime = {};
    users.users.node0_runtime = {
      isSystemUser = true;
      group = "node0_runtime";
      home = "/var/lib/socdepoble-node0";
    };
    services.postgresql = {
      enable = true;
      package = pkgs.postgresql_17;
      enableTCPIP = false;
      ensureDatabases = [ "socdepoble_node0" ];
      authentication = lib.mkBefore ''
        local socdepoble_node0 node0_runtime peer
      '';
    };
    systemd.services.socdepoble-node0-schema = {
      description = "Migracions canòniques CAS en la base dedicada del Node 0";
      requires = [ "postgresql.service" ];
      after = [ "postgresql.service" ];
      environment = {
        PGHOST = "/run/postgresql";
        PGPORT = "5432";
        PGDATABASE = "socdepoble_node0";
        PGUSER = "postgres";
        NODE0_PSQL = "${pkgs.postgresql_17}/bin/psql";
      };
      serviceConfig = {
        Type = "oneshot";
        User = "postgres";
        ExecStart = "${pkgs.nodejs_24}/bin/node ${source}/nix/bootstrap-node0.mjs";
        RemainAfterExit = true;
        NoNewPrivileges = true;
        ProtectSystem = "strict";
        ProtectHome = true;
        PrivateTmp = true;
        UMask = "0077";
      };
      # A changed runtime requires the schema gate again before the API restarts.
      restartTriggers = [ runtime ];
    };
    systemd.services.socdepoble-node0 = {
      description = "Node 0 institucional de Sóc de Poble";
      wantedBy = [ "multi-user.target" ];
      requires = [ "socdepoble-node0-schema.service" ];
      after = [ "socdepoble-node0-schema.service" "network-online.target" ];
      wants = [ "network-online.target" ];
      path = [ pkgs.postgresql_17 ];
      environment.NODE0_PSQL = "${pkgs.postgresql_17}/bin/psql";
      serviceConfig = {
        Type = "simple";
        User = "node0_runtime";
        Group = "node0_runtime";
        ExecStart = "${pkgs.nodejs_24}/bin/node ${source}/nix/start-node0.mjs";
        LoadCredential = [ "environment:${cfg.credentialFile}" ];
        StateDirectory = "socdepoble-node0";
        StateDirectoryMode = "0700";
        WorkingDirectory = source;
        Restart = "on-failure";
        RestartSec = 5;
        NoNewPrivileges = true;
        ProtectSystem = "strict";
        ProtectHome = true;
        PrivateTmp = true;
        PrivateDevices = true;
        ProtectKernelTunables = true;
        ProtectKernelModules = true;
        ProtectControlGroups = true;
        RestrictSUIDSGID = true;
        CapabilityBoundingSet = "";
        RestrictAddressFamilies = [ "AF_UNIX" "AF_INET" "AF_INET6" ];
        UMask = "0077";
      };
    };
    # nginx retains the release's CSP, MIME and static route guards behind Caddy.
    services.socdepoble.pobles.${municipal.municipality.slug}.acme = lib.mkForce false;
    services.nginx.virtualHosts.${municipal.domain}.listen = lib.mkForce [ { addr = "127.0.0.1"; port = 8080; } ];
    services.caddy = {
      enable = true;
      openFirewall = municipal.openFirewall;
      virtualHosts.${if municipal.enableACME then municipal.domain else "http://${municipal.domain}"}.extraConfig = ''
        @node0 path /api/v1/* /ap/inbox /ap/inbox/socdepoble /ap/actors/socdepoble /ap/actors/socdepoble.json /ap/outbox /ap/followers/socdepoble /ap/objects/*
        handle @node0 {
          reverse_proxy 127.0.0.1:4340
        }
        @webfinger {
          path /.well-known/webfinger
          query resource=acct:socdepoble@socdepoble.cat
        }
        handle @webfinger {
          reverse_proxy 127.0.0.1:4340
        }
        handle {
          reverse_proxy 127.0.0.1:8080
        }
      '';
    };
  };
}
