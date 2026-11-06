{
  description = "Node municipal Fediversity de Sóc de Poble: façana, Node 0 PostgreSQL 17 i contenidor NixOS opt-in";

  # Revisió pública immutable observada el 2026-11-03 amb git ls-remote.
  # Falta generar/verificar flake.lock amb Nix real en CI; no s'inventa narHash.
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/7dcdd87373d72e7a2173e4db02e20d3d7f495cfd";

  outputs = { self, nixpkgs }:
    let
      lib = nixpkgs.lib;
      # Reutilitza font allowlist, importNpmLock i recepta web ja existents.
      # Useu el flake Git de la release amb ?dir=nix: el pare forma part de la mateixa font.
      release = (import ../flake.nix).outputs { inherit self nixpkgs; };
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      each = f: lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
      example = {
        domain = "socdepoble.example.org";
        municipality = { slug = "la-torre-de-les-macanes"; name = "La Torre de les Maçanes"; };
        enableActivityPub = true;
        enableOpenData = true;
      };
      # Cap .env, claus, dumps ni docker.env de supabase entra al magatzem.
      nodeZeroSource = lib.fileset.toSource {
        root = ../.;
        fileset = lib.fileset.unions [
          ../package.json ../src ../tooling ../scripts/supabase
          ../supabase/migrations ../supabase/ordre_desplegament.json
          ./start-node0.mjs ./bootstrap-node0.mjs
        ];
      };
      mkNodeZeroRuntime = pkgs: pkgs.runCommand "socdepoble-node0-runtime" {} ''
        mkdir -p "$out/share/socdepoble-node0"
        cp -R ${nodeZeroSource}/. "$out/share/socdepoble-node0/"
      '';
      mkMunicipalWeb = pkgs: settings:
        let
          cfg = example // settings;
          configFile = pkgs.writeText "socdepoble-public-config.json" (builtins.toJSON {
            inherit (cfg) domain municipality enableActivityPub enableOpenData;
          });
          identity = pkgs.writeText "socdepoble-node-germa.json" (builtins.toJSON {
            slug = cfg.municipality.slug;
            nom = cfg.municipality.name;
            origen = "https://${cfg.domain}";
            mode = settings.dataMode or "seed";
          });
          base = release.lib.mkWeb pkgs {
            origen = "https://${cfg.domain}";
            modeDades = settings.dataMode or "seed";
            supabaseUrl = settings.supabaseUrl or "https://seed.invalid";
            clauPublica = settings.publicKey or "sb_publishable_demostracio_seed";
            tenantId = settings.tenantId or null;
          };
          # El paquet Open Data entra al magatzem amb context: el .drv en depén i el sandbox el veu.
          openDataSrc =
            let src = settings.openDataSource or null; in
            if src == null then null
            else if builtins.isPath src then builtins.path { path = src; name = "socdepoble-opendata"; }
            else assert lib.assertMsg (builtins.hasContext (toString src))
              "socdepoble: openDataSource ha de ser un path Nix (./paquet) o una derivació, no una ruta absoluta en text";
              toString src;
        in
        # Guarda en avaluar, abans d'escriure cap .drv (llegible per tothom al magatzem):
        # la de vite només actua dins del build. Els missatges no repetixen el valor.
        # builtins.match és std::regex::extended: només s'escapa .[\()*+?{|^$, i «]» fora de claudàtors ja és literal.
        assert lib.assertMsg (builtins.match "sb_publishable_[A-Za-z0-9_-]+" (settings.publicKey or "sb_publishable_demostracio_seed") != null)
          "socdepoble: publicKey ha de ser una clau sb_publishable_; cap sb_secret_ ni JWT entra al magatzem de Nix";
        assert lib.assertMsg (builtins.match "https://[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:[0-9]{1,5})?/?|http://(localhost|127\\.0\\.0\\.1|\\[::1])(:[0-9]{1,5})?/?" (settings.supabaseUrl or "https://seed.invalid") != null)
          "socdepoble: supabaseUrl ha de ser un origen HTTPS (o HTTP local) sense credencials, ruta ni consulta";
        base.overrideAttrs (old: {
          postPatch = (old.postPatch or "") + ''
            cp ${identity} node-germa.json
            cp ${./prepare-public.mjs} sdp-prepare-public.mjs
          '';
          postBuild = (old.postBuild or "") + ''
            node sdp-prepare-public.mjs --root . --dist dist --config ${configFile} ${lib.optionalString (openDataSrc != null) "--open-data-source ${lib.escapeShellArg openDataSrc}"}
          '';
        });
    in {
      lib = { inherit mkMunicipalWeb mkNodeZeroRuntime; };
      nixosModules.default = import ./module.nix {
        inherit release;
        mkNodeZeroRuntime = hostPkgs: mkNodeZeroRuntime nixpkgs.legacyPackages.${hostPkgs.stdenv.hostPlatform.system};
        # El sistema amfitrió tria l'arquitectura, no una versió flotant del builder.
        mkMunicipalWeb = hostPkgs: settings:
          mkMunicipalWeb nixpkgs.legacyPackages.${hostPkgs.stdenv.hostPlatform.system} settings;
      };
      nixosModules.socdepoble = self.nixosModules.default;
      nixosModules.containers = import ./containers.nix { municipalModule = self.nixosModules.default; };
      packages = each (pkgs: rec {
        web = mkMunicipalWeb pkgs example;
        node0-runtime = mkNodeZeroRuntime pkgs;
        default = web;
      });
      # La comprovació d'avaluació no reemplaça la VM HTTP de la release.
      checks = lib.genAttrs [ "x86_64-linux" "aarch64-linux" ] (system:
        let
          nodeConfig = settings: nixpkgs.lib.nixosSystem {
            inherit system;
            modules = [ self.nixosModules.default ({ ... }: {
              services.socdepoble = example // { enable = true; } // settings;
              boot.isContainer = true;
              system.stateVersion = "26.05";
            }) ];
          };
          config = nodeConfig { };
          nodeZero = nodeConfig {
            domain = "socdepoble.cat";
            node0.enable = true;
            enableOpenData = false;
          };
          container = nixpkgs.lib.nixosSystem {
            inherit system;
            modules = [ self.nixosModules.containers ({ ... }: {
              services.socdepobleContainer.enable = true;
              boot.isContainer = true;
              system.stateVersion = "26.05";
            }) ];
          };
          shorthand = nodeConfig { municipality = example.municipality.slug; };
          newShorthand = nodeConfig { municipality = "sella"; enableOpenData = false; };
          pkgs = nixpkgs.legacyPackages.${system};
        in {
          web = self.packages.${system}.web;
          node0-runtime = self.packages.${system}.node0-runtime;
          node0-evaluation =
            assert lib.all (a: a.assertion) nodeZero.config.assertions;
            assert nodeZero.config.services.postgresql.package.version == pkgs.postgresql_17.version;
            assert nodeZero.config.services.postgresql.enableTCPIP == false;
            assert nodeZero.config.systemd.services.socdepoble-node0.serviceConfig.User == "node0_runtime";
            assert nodeZero.config.services.caddy.enable;
            pkgs.writeText "socdepoble-node0-evaluation" (builtins.toJSON {
              postgres = nodeZero.config.services.postgresql.package.version;
              service = nodeZero.config.systemd.services.socdepoble-node0.serviceConfig.ExecStart;
              credential = nodeZero.config.systemd.services.socdepoble-node0.serviceConfig.LoadCredential;
            });
          container-evaluation =
            assert lib.all (a: a.assertion) container.config.assertions;
            assert container.config.containers.socdepoble-node0.privateNetwork;
            assert container.config.containers.socdepoble-node0.autoStart == false;
            assert lib.all (a: a.assertion) container.config.containers.socdepoble-node0.config.assertions;
            assert container.config.containers.socdepoble-node0.config.services.socdepoble.node0.enable;
            pkgs.writeText "socdepoble-container-evaluation" container.config.containers.socdepoble-node0.localAddress;
          # Real Linux VM: schema bootstrap, peer identity, gateway and closed API.
          # This public fixture token is confined to the test VM, not a deployment secret.
          node0-http = pkgs.testers.runNixOSTest {
            name = "socdepoble-node0-postgresql17";
            nodes.node0 = { ... }: {
              imports = [ self.nixosModules.default ];
              services.socdepoble = example // {
                enable = true;
                domain = "socdepoble.cat";
                enableOpenData = false;
                node0 = { enable = true; credentialFile = "/run/secrets/node0-test.env"; };
              };
              systemd.tmpfiles.rules = [
                "d /run/secrets 0700 root root -"
                "f /run/secrets/node0-test.env 0600 root root - SDP_NODE0_ADMIN_TOKEN=public-test-token-never-use-in-deployment-0000000000"
              ];
            };
            testScript = ''
              start_all()
              node0.wait_for_unit("postgresql.service")
              node0.wait_for_unit("socdepoble-node0.service")
              node0.wait_for_unit("caddy.service")
              node0.wait_for_open_port(80)
              def status(route):
                  return node0.succeed(f"curl -s -o /dev/null -w '%{{http_code}}' -H 'Host: socdepoble.cat' http://127.0.0.1{route}").strip()
              assert status("/api/v1/node0/status") == "200"
              assert status("/ap/actors/socdepoble") == "200"
              assert status("/opendata/manifest.json") == "404"
              assert node0.succeed("sudo -u postgres psql -d socdepoble_node0 -Atc 'SHOW server_version_num'").strip().startswith("17")
              assert node0.succeed("sudo -u node0_runtime psql -d socdepoble_node0 -Atc 'SELECT current_user'").strip() == "node0_runtime"
              privileges = node0.succeed("""sudo -u postgres psql -d socdepoble_node0 -Atc "SELECT rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole FROM pg_roles WHERE rolname='node0_runtime'" """)
              assert privileges.strip() == "f"
              assert "0.0.0.0:5432" not in node0.succeed("ss -lnt")
              assert node0.succeed("stat -c %a /var/lib/socdepoble-node0/node0_ed25519.json").strip() == "600"
            '';
          };
          # La via d'openDataSource (path → magatzem) dins del sandbox, amb el paquet real de La Torre.
          web-open-data-source = mkMunicipalWeb pkgs (example // { openDataSource = ../public/opendata; });
          module-evaluation = assert config.config.services.nginx.enable;
            assert lib.all (a: a.assertion) config.config.assertions;
            assert shorthand.config.services.socdepoble.municipality == example.municipality;
            assert lib.all (a: a.assertion) shorthand.config.assertions;
            assert newShorthand.config.services.socdepoble.municipality == { slug = "sella"; name = "sella"; };
            assert lib.all (a: a.assertion) newShorthand.config.assertions;
            pkgs.writeText "socdepoble-module-evaluation" (toString config.config.services.nginx.virtualHosts.${example.domain}.root);
          # Prova HTTP real de Nginx en NixOS; no executada en l'amfitrió sense Nix.
          module-http = pkgs.testers.runNixOSTest {
            name = "socdepoble-fediversity-municipal";
            nodes = {
              public = { ... }: {
                imports = [ self.nixosModules.default ];
                services.socdepoble = example // { enable = true; };
              };
              disabled = { ... }: {
                imports = [ self.nixosModules.default ];
                services.socdepoble = example // {
                  enable = true;
                  enableActivityPub = false;
                  enableOpenData = false;
                };
              };
            };
            testScript = ''
              start_all()
              for node in [public, disabled]:
                  node.wait_for_unit("nginx.service")
                  node.wait_for_open_port(80)

              def status(node, route, method="GET"):
                  return node.succeed(
                      f"curl -s -o /dev/null -w '%{{http_code}}' -X {method} -H 'Host: ${example.domain}' 'http://localhost{route}'"
                  ).strip()

              def headers(node, route, method="GET"):
                  return node.succeed(
                      f"curl -s -D - -o /dev/null -X {method} -H 'Host: ${example.domain}' 'http://localhost{route}'"
                  ).lower()

              assert status(public, "/") == "200"
              assert status(public, "/ap/actor.json") == "200"
              assert status(public, "/.well-known/webfinger?resource=acct:la-torre-de-les-macanes@${example.domain}") == "200"
              assert status(public, "/.well-known/webfinger?resource=acct:desconegut@${example.domain}") == "404"
              assert status(public, "/.well-known/webfinger") == "400"
              assert status(public, "/.well-known/nodeinfo") == "200"
              assert status(public, "/nodeinfo/2.1.json") == "200"
              # Sense host-meta: la plantilla LRDD per camí no té cap ruta pública en nginx.
              assert status(public, "/.well-known/host-meta") == "404"
              assert status(public, "/.well-known/webfinger/acct:la-torre-de-les-macanes@${example.domain}") == "404"
              assert status(public, "/opendata/manifest.json") == "200"
              assert status(public, "/opendata/inexistent.json") == "404"
              assert status(public, "/ap/inexistent.json") == "404"
              for route in ["/ap/actor.json", "/ap/inbox/la-torre-de-les-macanes", "/opendata/manifest.json", "/opendata/activitystreams.json",
                            "/.well-known/webfinger?resource=acct:la-torre-de-les-macanes@${example.domain}", "/nodeinfo/2.1.json"]:
                  assert status(public, route, "POST") == "405"
                  assert "allow: get, head, options" in headers(public, route, "POST")
                  assert status(public, route, "OPTIONS") == "204"
                  h = headers(public, route)
                  assert "access-control-allow-origin: *" in h
                  assert "x-content-type-options: nosniff" in h
                  assert "content-security-policy:" in h
              assert "content-type: application/activity+json" in headers(public, "/ap/actor.json")
              assert "content-type: application/ld+json" in headers(public, "/opendata/municipi.jsonld")
              assert "content-type: application/activity+json; charset=utf-8" in headers(public, "/opendata/activitystreams.json")
              assert "content-type: text/markdown; charset=utf-8" in headers(public, "/opendata/memoria.md")
              for route in ["/ap/actor.json", "/ap/actors/la-torre-de-les-macanes.json", "/ap/inbox/la-torre-de-les-macanes",
                            "/.well-known/webfinger", "/.well-known/nodeinfo", "/nodeinfo/2.1.json", "/opendata/manifest.json",
                            "/opendata/activitystreams.json"]:
                  assert status(disabled, route) == "404"
              assert status(disabled, "/") == "200"
            '';
          };
        });
    };
}
