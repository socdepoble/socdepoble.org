# P1-23 (ordre del Mestre, 30-10-2026) · Empaquetat reproduïble de Sóc de Poble (el Mas).
#
# ESTAT: NO VERIFICAT AMB NIX. Este fitxer s'ha escrit en una màquina sense Nix
# (nix no està instal·lat i no s'hi ha d'instal·lar sense el Mestre). S'ha
# revisat contra la documentació i el codi de nixpkgs (branca nixos-26.05:
# buildNpmPackage, importNpmLock, mòdul nginx, testers.runNixOSTest) i contra el
# que sí que es pot executar ací: la recepta de build de baix és la que
# tooling/seo/comprova-reproductibilitat.mjs executa dues vegades en còpies
# del fitxer de fonts d'este flake i compara byte a byte (les proves de
# tooling/seo/comprova-reproductibilitat.test.mjs vigilen que les dues llistes
# no es despengen). Revisió de la reconciliació (30-10-2026): buildPhase i
# installPhase explícits desactiven els ganxos d'npm (doc. de buildNpmPackage);
# importNpmLock pren `package` i `packageLock` ja llegits i el package-lock.json
# és v3 amb tots els paquets del registre amb integrity (cap git: ni file:);
# nodejs_24 és 24.22.1; la configuració d'nginx passa per gixy en construir-se
# (writeNginxConfig) i un avís atura el build: per això cap «return» porta una
# captura que puga contindre CR o LF. Un flake de git només veu els fitxers
# versionats: el build de Nix és el de l'últim estat afegit a git, no el de
# l'arbre de treball. Correcció de la peça A (30-10-2026): la inbox es llig
# (col·lecció buida) i el 405 porta Allow (RFC 9110 §15.5.6); WebFinger respon
# 400 a un resource malformat (RFC 7033 §4.2) i tria el JRD amb les regles
# generades (.well-known/webfinger.nginx), sense caixa, com el servidor de
# desenvolupament; comprova-reproductibilitat.test.mjs les executa contra el
# connector.
#
# Primer ús (el fa el Mestre; necessita xarxa per a fixar nixpkgs):
#   git add flake.nix                    # un flake de git només veu fitxers versionats
#   nix flake lock                       # crea flake.lock: cal versionar-lo
#   nix build .#web                      # el frontal d'exemple (vegeu packages.web)
#   nix build .#web --rebuild            # el reconstruïx i el compara: reproductibilitat
#   nix flake check                      # en Linux, també el mòdul NixOS en una VM
#
# Una instància real (dades del backend públiques per disseny, Model B: viatgen
# dins del paquet; cap secret entra mai al magatzem de Nix, que tothom pot llegir):
#   socdepoble.lib.mkWeb pkgs { supabaseUrl = "https://…"; clauPublica = "sb_publishable_…";
#                               tenantId = "…"; origen = "https://poble.example.org"; }
# o el mòdul NixOS: services.socdepoble.pobles.<nom> = { domini = "…"; supabaseUrl = "…"; … };
{
  description = "Sóc de Poble (el Mas): frontal web reproduïble i mòdul NixOS amb nginx";

  # nixos-26.05 és la branca estable vigent el 30-10-2026 (verificada a GitHub);
  # flake.lock en fixa la revisió exacta.
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

  outputs =
    { self, nixpkgs }:
    let
      lib = nixpkgs.lib;

      # El paquet web és portable (Linux i macOS); el mòdul i la seua prova, només Linux.
      sistemes = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      sistemesLinux = [
        "x86_64-linux"
        "aarch64-linux"
      ];
      perSistema = llista: f: lib.genAttrs llista (sistema: f nixpkgs.legacyPackages.${sistema});

      paquetNpm = lib.importJSON ./package.json;

      # Les fonts del build, i res més: un canvi a l'escriptori de la Wiki, al
      # connector WordPress o a supabase/ (que porta un docker.env versionat) no
      # entra al magatzem ni refà el paquet. De la Wiki, només les tres carpetes
      # públiques (tooling/wiki/lib/publication-policy.mjs, PUBLIC_WIKI_DIRS).
      # .agents/AGENTS.md és el marcador d'arrel obligatori (tooling/lib/arrel.mjs):
      # sense ell, vite.config.js peta en importar consola-iaia.mjs. AGENTS.md de
      # l'arrel entra al bundle (PanellAgents.jsx i DocumentacioMaquinaria.jsx el
      # importen amb ?raw): sense ell, vite build falla (trobat pel comprovador).
      # El comprovador de reproductibilitat construïx a partir d'esta mateixa llista.
      font = lib.fileset.toSource {
        root = ./.;
        fileset = lib.fileset.unions [
          # sdp:font-inici
          ./package.json
          ./package-lock.json
          ./index.html
          ./firebase.json
          ./vite.config.js
          ./AGENTS.md
          ./.agents/AGENTS.md
          ./src
          ./public
          ./tooling
          ./_wiki_de_poble/01_ser
          ./_wiki_de_poble/02_saber
          ./_wiki_de_poble/03_actuar
          # sdp:font-fi
        ];
      };

      # El paquet web d'una instància. Tot el que porta és públic per disseny
      # (Model B): l'URL del backend, la clau anon o publishable i el poble.
      # vite.config.js rebutja una clau service_role (validatePublicCredentials).
      mkWeb =
        pkgs:
        {
          supabaseUrl,
          clauPublica,
          tenantId ? null,
          modeDades ? "remote",
          origen ? "https://socdepoble.org",
          # La data del commit (la de flake.lock per a les entrades). Sense,
          # stdenv posaria 315532800 (1980) i el segell de versió (SDP_BUILD,
          # vite.config.js · segellDeBuild) diria 800101.
          epoca ? self.lastModified or 315532800,
        }:
        assert lib.assertMsg (lib.hasPrefix "https://" origen) "mkWeb: l'origen ha de ser https://…";
        assert lib.assertMsg (lib.elem modeDades [
          "remote"
          "seed"
          "local"
        ]) "mkWeb: modeDades ha de ser remote, seed o local";
        pkgs.buildNpmPackage {
          pname = "socdepoble-web";
          version = "${paquetNpm.version}+${self.shortRev or self.dirtyShortRev or "sense-git"}";
          src = font;

          # engines de package.json: ^22.20.0 || ^24.12.0 || >=25 (nixos-26.05 porta 24.22.1).
          nodejs = pkgs.nodejs_24;

          # Les dependències ixen de package-lock.json (v3, totes del registre
          # amb integrity): cap npmDepsHash a mà.
          npmDeps = pkgs.importNpmLock {
            package = paquetNpm;
            packageLock = lib.importJSON ./package-lock.json;
          };
          npmConfigHook = pkgs.importNpmLock.npmConfigHook;

          env = {
            # El «prepare» de husky no té res a fer dins del magatzem.
            HUSKY = "0";
            # El sandbox de Nix no té xarxa: el prerender social ix sense
            # publicacions remotes (tooling/seo/projeccio-publica.mjs, l'única
            # eixida explícita). La targeta de /mur/<id> serà la genèrica.
            SDP_SOCIAL_SENSE_REMOT = "1";
            SDP_ORIGEN = origen;
            VITE_SUPABASE_URL = supabaseUrl;
            VITE_SUPABASE_ANON_KEY = clauPublica;
            VITE_DATA_MODE = modeDades;
          }
          // lib.optionalAttrs (tenantId != null) { VITE_TENANT_ID = tenantId; }
          # Els id federats de /ap/ ixen de VITE_CANONICAL_URL o, sense, de
          # https://socdepoble.org (tooling/seo/genera-federacio.mjs ·
          # origenDeLaPublicacio). Només s'hi posa per a un altre origen: el paquet
          # de socdepoble.org queda com el build de Firebase, que no la porta.
          // lib.optionalAttrs (origen != "https://socdepoble.org") { VITE_CANONICAL_URL = origen; };

          # La mateixa recepta que «npm run build» per al dist/ de Firebase,
          # sense build:wp ni build:seo (són del connector WordPress) i amb
          # l'origen de la instància; vite build ja hi emet els JSON-LD de /ap/
          # (tooling/vite/federacio-iaia.mjs). L'última línia hi afig el que només
          # un servidor pot servir i Firebase no (WebFinger per paràmetre i
          # NodeInfo): .well-known/webfinger/<slug>.json, .well-known/nodeinfo i
          # nodeinfo/2.1.json; reescriu ap/** amb els mateixos bytes i no esborra
          # res. Les línies entre les marques són les que executa el comprovador;
          # "$SDP_ORIGEN" hi és {origen}.
          buildPhase = ''
            runHook preBuild
            export SOURCE_DATE_EPOCH=${toString epoca}
            # sdp:recepta-inici
            npm run prebuild
            npm run build:tokens
            npm run rag:build
            npm run slugs:build
            npm run build:web
            node tooling/seo/projeccio-publica.mjs --root . --origin "$SDP_ORIGEN" --out node_modules/.cache/sdp-social/snapshot.json
            node tooling/seo/prerender-social.mjs --root . --dist dist --origin "$SDP_ORIGEN" --snapshot node_modules/.cache/sdp-social/snapshot.json
            node tooling/seo/genera-federacio.mjs --desti dist --origen "$SDP_ORIGEN" --servidor
            # sdp:recepta-fi
            runHook postBuild
          '';

          # $out és el dist/ tal qual: el que Firebase desplegaria més els fitxers
          # de servidor de la federació (Firebase ignora els que comencen per punt).
          installPhase = ''
            runHook preInstall
            cp -R dist "$out"
            runHook postInstall
          '';
          # Cap retoc posterior (patchShebangs, strip…): els bytes de $out són
          # els del build, els que compara el comprovador.
          dontFixup = true;

          meta = {
            description = "Sóc de Poble (el Mas): frontal web estàtic";
            homepage = "https://socdepoble.org";
            license = lib.licenses.agpl3Plus;
            platforms = lib.platforms.unix;
          };
        };

      # La configuració d'exemple: un backend inexistent d'un domini reservat
      # (RFC 2606) i les dades de llavor de l'App. Construïx i servix el frontal
      # sense cap credencial real; per a una instància, lib.mkWeb o el mòdul.
      exemple = {
        supabaseUrl = "https://backend.example.org";
        clauPublica = "sb_publishable_exemple_sense_backend";
        modeDades = "seed";
      };

      # ─── Capçaleres: firebase.json és la font única (cap còpia a mà de la CSP) ───
      firebase = lib.importJSON ./firebase.json;
      reglesFirebase = firebase.hosting.headers;
      reglaDeFont =
        font:
        lib.findFirst (r: (r.source or null) == font) (throw "firebase.json: falta la regla «${font}»") reglesFirebase;
      capcaleresDe = font: (reglaDeFont font).headers;
      reglaImmutable = lib.findFirst (r: r ? regex) (throw "firebase.json: falta la regla regex dels actius") reglesFirebase;
      # /ap/** l'afig l'ordre del Mestre del 30-10-2026; si encara no hi és, els
      # mateixos valors que demana l'ordre.
      capcaleresFederacio =
        let
          r = lib.findFirst (r: (r.source or null) == "/ap/**") null reglesFirebase;
        in
        if r == null then
          [
            {
              key = "Content-Type";
              value = "application/activity+json; charset=utf-8";
            }
            {
              key = "Access-Control-Allow-Origin";
              value = "*";
            }
            {
              key = "Cache-Control";
              value = "public, max-age=300";
            }
          ]
        else
          r.headers;
      valorDe = clau: hs: (lib.findFirst (h: h.key == clau) { value = null; } hs).value;
      senseClau = clau: hs: lib.filter (h: h.key != clau) hs;

      # Un valor entre cometes per a nginx. «$» s'hi interpolaria com a variable:
      # millor un error d'avaluació que una capçalera canviada en silenci.
      cometes =
        valor:
        assert lib.assertMsg (!(lib.hasInfix "$" valor)) "capçalera amb «$»: nginx la interpolaria";
        "\"${lib.escape [ "\\" "\"" ] valor}\"";
      # Una expressió regular entre cometes (porta «{8}», que nginx només admet
      # entre cometes). Ací «$» és l'àncora final, no cap variable.
      cometesRegex = expr: "\"${lib.escape [ "\\" "\"" ] expr}\"";
      # En nginx, un add_header dins d'una location anul·la TOTS els del server:
      # cada location porta la llista sencera. «always»: també als 4xx/5xx.
      capcaleres = hs: lib.concatMapStringsSep "\n" (h: "add_header ${h.key} ${cometes h.value} always;") hs;

      modulNixos =
        {
          config,
          lib,
          pkgs,
          ...
        }:
        let
          cfg = config.services.socdepoble;
          inherit (lib) mkOption types;
          # El nixpkgs fixat del flake (no el del sistema): el paquet que servix
          # el mòdul és el mateix, byte a byte, que lib.mkWeb i nix build.
          pkgsFixats = nixpkgs.legacyPackages.${pkgs.stdenv.hostPlatform.system};
          paquetDe =
            p:
            if p.paquet != null then
              p.paquet
            else
              mkWeb pkgsFixats {
                inherit (p) supabaseUrl clauPublica tenantId modeDades;
                origen = "https://${p.domini}";
              };

          vhostDe =
            p:
            let
              paquet = paquetDe p;
              globals = map (h: if h.key == "Content-Security-Policy" then h // { value = p.csp; } else h) (
                capcaleresDe "**"
              );
              senseCache = capcaleresDe "!/@(assets|fonts)/**";
              corsActius = capcaleresDe "/assets/**";
              # CORS i cache de la regla /ap/** de firebase.json, també per al JRD i
              # NodeInfo (RFC 7033 §5: Access-Control-Allow-Origin obligatori).
              federacio = senseClau "Content-Type" capcaleresFederacio;
              tipusFederacio = valorDe "Content-Type" capcaleresFederacio;
              # La resposta a un preflight CORS, com el servidor de desenvolupament
              # (tooling/vite/federacio-iaia.mjs): un Accept amb «"» o «:» el provoca.
              preflight = [
                {
                  key = "Access-Control-Allow-Methods";
                  value = "GET, HEAD, OPTIONS";
                }
                {
                  key = "Access-Control-Allow-Headers";
                  value = "Accept";
                }
              ];
              # RFC 9110 §15.5.6: un 405 porta Allow amb els mètodes admesos (nginx
              # no en pot enviar un de buit: add_header descarta els valors buits).
              permesos = [
                {
                  key = "Allow";
                  value = "GET, HEAD, OPTIONS";
                }
              ];
            in
            {
              root = paquet;
              enableACME = p.acme;
              forceSSL = p.acme;
              extraConfig = ''
                charset utf-8;
              '';
              locations = {
                # L'SPA: el fitxer, la pàgina prerenderitzada (dist/<ruta>/index.html,
                # «trailingSlash: false») o la closca, com la reescriptura de Firebase.
                "/" = {
                  tryFiles = "$uri $uri/index.html /index.html";
                  extraConfig = capcaleres (globals ++ senseCache);
                };
                # Firebase no desplega cap fitxer amb punt («ignore: **/.*»).
                "~ /\\." = {
                  priority = 500;
                  return = "404";
                  extraConfig = capcaleres globals;
                };
                # «trailingSlash: false»: /projecte/ → /projecte. La captura no admet
                # CR ni LF: el $uri ja ve descodificat (%0d, %0a) i gixy, que NixOS
                # passa sobre la configuració en construir-la (writeNginxConfig),
                # atura el build amb un «return» que en pot portar (http_splitting).
                "~ ^([^\\r\\n]+)/$" = {
                  priority = 600;
                  return = "301 $1$is_args$args";
                  extraConfig = capcaleres (globals ++ senseCache);
                };
                "^~ /assets/" = {
                  tryFiles = "$uri =404";
                  extraConfig = ''
                    ${capcaleres (globals ++ corsActius)}
                    location ~ ${cometesRegex reglaImmutable.regex} {
                      try_files $uri =404;
                      ${capcaleres (globals ++ corsActius ++ reglaImmutable.headers)}
                    }
                  '';
                };
                "^~ /fonts/" = {
                  tryFiles = "$uri =404";
                  extraConfig = capcaleres globals;
                };
                # Federació (fase 1, lectura): els JSON-LD estàtics del build. Un
                # fitxer absent és un 404 (a Firebase, la reescriptura de l'SPA).
                "^~ /ap/" = {
                  tryFiles = "$uri =404";
                  extraConfig = ''
                    types { }
                    default_type ${cometes tipusFederacio};
                    ${capcaleres (globals ++ federacio ++ preflight)}
                    if ($request_method = OPTIONS) {
                      return 204;
                    }
                  '';
                };
                # La inbox (fase 1): GET i HEAD donen la col·lecció buida del build
                # (ap/inbox/<slug>, sense extensió); rebre-hi (signatures HTTP,
                # Follow/Accept) és de la fase 2: 405 amb Allow a la resta de mètodes;
                # OPTIONS, 204; un poble que no existix, 404. Com el servidor de
                # desenvolupament (tooling/vite/federacio-iaia.mjs).
                "^~ /ap/inbox/" = {
                  extraConfig = ''
                    types { }
                    default_type ${cometes tipusFederacio};
                    ${capcaleres (globals ++ federacio ++ preflight ++ permesos)}
                    set $sdp_inbox "";
                    if ($uri ~ "^/ap/inbox/([a-z0-9]+(?:-[a-z0-9]+)*)$") {
                      set $sdp_inbox $1;
                    }
                    if (!-f $document_root/ap/actors/$sdp_inbox.json) {
                      return 404;
                    }
                    if ($request_method = OPTIONS) {
                      return 204;
                    }
                    if ($request_method !~ "^(?:GET|HEAD)$") {
                      return 405;
                    }
                    try_files $uri =404;
                  '';
                };
                # WebFinger (RFC 7033) per al paràmetre resource. 400 (§4.2) si falta,
                # si n'hi ha més d'un, si passa de 512 caràcters o si és malformat: sense
                # esquema, amb caràcters que cap URI no porta o un acct: sense
                # usuari@host (els mateixos criteris que analitzaRecursWebFinger de
                # src/data/activitypub.js, sobre el valor CRU: un «+» és un espai
                # codificat, i el «+» d'un esquema, git+ssh:, arriba com a %2B). Si
                # és ben format, les regles que genera «genera-federacio.mjs
                # --servidor» (.well-known/webfinger.nginx) trien el JRD estàtic de
                # cada actor: acct:<slug>@<domini> en qualsevol caixa, com el servidor
                # de desenvolupament i Mastodon, amb «:» i «@» tal qual o codificats
                # (%3A, %40), i l'URL exacta de l'actor o del perfil, amb «:» i «/»
                # tal qual o codificats (%3A, %2F). La resta, 404. «rel» s'ignora (RFC
                # 7033 §4.3 ho permet: els enllaços són dos). Un %XX de qualsevol
                # altra lletra només el resol el servidor de desenvolupament (nginx
                # no descodifica $arg_resource).
                "= /.well-known/webfinger" = {
                  extraConfig = ''
                    ${capcaleres (globals ++ federacio ++ preflight)}
                    if ($request_method = OPTIONS) {
                      return 204;
                    }
                    if ($arg_resource = "") {
                      return 400;
                    }
                    if ($arg_resource ~ "^.{513}") {
                      return 400;
                    }
                    if ($args ~ "(?:^|&)resource=[^&]*&(?:[^&]*&)*resource=") {
                      return 400;
                    }
                    if ($arg_resource !~ "^[A-Za-z](?:[A-Za-z0-9.-]|%2[Bb])*(?::|%3[Aa])(?:[A-Za-z0-9._~:/?@!$'()*,;=\[\]-]|%[0-9A-Fa-f]{2})*$") {
                      return 400;
                    }
                    set $sdp_acct_malformat "";
                    if ($arg_resource ~* "^acct(?::|%3a)") {
                      set $sdp_acct_malformat 1;
                    }
                    if ($arg_resource ~* "^acct(?::|%3a)(?:[a-z0-9._~!$'()*,;=-]|%(?:[0-35-9a-f][0-9a-f]|4[1-9a-f]))+(?:@|%40)(?:[a-z0-9._~!$'()*,;=:\[\]-]|%[0-9a-f]{2})+$") {
                      set $sdp_acct_malformat "";
                    }
                    if ($sdp_acct_malformat) {
                      return 400;
                    }
                    include ${paquet}/.well-known/webfinger.nginx;
                    return 404;
                  '';
                };
                "^~ /.well-known/webfinger/" = {
                  tryFiles = "$uri =404";
                  extraConfig = ''
                    internal;
                    types { }
                    default_type "application/jrd+json; charset=utf-8";
                    ${capcaleres (globals ++ federacio ++ preflight)}
                  '';
                };
                # NodeInfo 2.1 (descobriment i document), els tipus del servidor de
                # desenvolupament.
                "= /.well-known/nodeinfo" = {
                  tryFiles = "$uri =404";
                  extraConfig = ''
                    types { }
                    default_type "application/json; charset=utf-8";
                    ${capcaleres (globals ++ federacio)}
                  '';
                };
                "= /nodeinfo/2.1.json" = {
                  tryFiles = "$uri =404";
                  extraConfig = ''
                    types { }
                    default_type ${cometes "application/json; profile=\"http://nodeinfo.diaspora.software/ns/schema/2.1#\""};
                    ${capcaleres (globals ++ federacio)}
                  '';
                };
                # La resta de /.well-known/ no existix: 404, no la closca de l'SPA.
                # L'ACME de NixOS hi afig la seua location, més llarga.
                "^~ /.well-known/" = {
                  return = "404";
                  extraConfig = capcaleres globals;
                };
              };
            };
        in
        {
          options.services.socdepoble.pobles = mkOption {
            default = { };
            description = "Instàncies web de Sóc de Poble (el Mas), una per domini, servides per nginx.";
            type = types.attrsOf (
              types.submodule (
                { name, ... }:
                {
                  options = {
                    domini = mkOption {
                      type = types.str;
                      default = name;
                      example = "socdepoble.org";
                      description = "Nom del servidor virtual; també el host dels acct: de WebFinger i de l'origen dels id federats.";
                    };
                    supabaseUrl = mkOption {
                      type = types.nullOr types.str;
                      default = null;
                      description = "URL pública del backend (Model B: viatja dins del paquet).";
                    };
                    clauPublica = mkOption {
                      type = types.nullOr types.str;
                      default = null;
                      description = "Clau anon o publishable (pública per disseny). Mai la service_role: el build la rebutja.";
                    };
                    tenantId = mkOption {
                      type = types.nullOr types.str;
                      default = null;
                      description = "UUID del poble (VITE_TENANT_ID).";
                    };
                    modeDades = mkOption {
                      type = types.enum [
                        "remote"
                        "seed"
                        "local"
                      ];
                      default = "remote";
                      description = "VITE_DATA_MODE del paquet.";
                    };
                    paquet = mkOption {
                      type = types.nullOr types.package;
                      default = null;
                      description = "Un paquet ja construït (lib.mkWeb). Si és null, el mòdul el construïx amb les opcions de dalt.";
                    };
                    csp = mkOption {
                      type = types.str;
                      default = valorDe "Content-Security-Policy" (capcaleresDe "**");
                      defaultText = lib.literalMD "la CSP de `firebase.json` (regla `**`)";
                      description = "Content-Security-Policy de tot el lloc. Una altra instància hi pot acotar frame-ancestors i connect-src.";
                    };
                    acme = mkOption {
                      type = types.bool;
                      default = false;
                      description = "Certificat ACME i redirecció a HTTPS (enableACME + forceSSL).";
                    };
                    obriTallafocs = mkOption {
                      type = types.bool;
                      default = false;
                      description = "Obri els ports 80 i 443 al tallafocs.";
                    };
                  };
                }
              )
            );
          };

          config = lib.mkIf (cfg.pobles != { }) {
            assertions = lib.mapAttrsToList (nom: p: {
              assertion = p.paquet != null || (p.supabaseUrl != null && p.clauPublica != null);
              message = "services.socdepoble.pobles.${nom}: cal «paquet» o bé «supabaseUrl» i «clauPublica».";
            }) cfg.pobles;
            services.nginx.enable = true;
            services.nginx.virtualHosts = lib.mapAttrs' (_nom: p: lib.nameValuePair p.domini (vhostDe p)) cfg.pobles;
            networking.firewall.allowedTCPPorts = lib.mkIf (lib.any (p: p.obriTallafocs) (lib.attrValues cfg.pobles)) [
              80
              443
            ];
          };
        };
    in
    {
      lib = { inherit mkWeb; };

      packages = perSistema sistemes (pkgs: rec {
        web = mkWeb pkgs exemple;
        default = web;
      });

      nixosModules.socdepoble = modulNixos;
      nixosModules.default = modulNixos;

      devShells = perSistema sistemes (pkgs: {
        default = pkgs.mkShell {
          packages = [
            pkgs.nodejs_24
            pkgs.git
          ];
        };
      });

      checks = perSistema sistemesLinux (
        pkgs:
        let
          sistema = pkgs.stdenv.hostPlatform.system;
        in
        {
          # nix build .#checks.<sistema>.web --rebuild: la reproductibilitat a Linux.
          web = self.packages.${sistema}.web;
          # El mòdul en una VM: rutes, codis i capçaleres de nginx.
          modul-nixos = pkgs.testers.runNixOSTest {
            name = "socdepoble-modul-nixos";
            nodes.servidor = {
              imports = [ self.nixosModules.default ];
              services.socdepoble.pobles.prova = exemple // {
                domini = "socdepoble.org";
              };
            };
            testScript = ''
              servidor.wait_for_unit("nginx.service")
              servidor.wait_for_open_port(80)

              def codi(ruta, extra=""):
                  return servidor.succeed(
                      f"curl -s -o /dev/null -w '%{{http_code}}' -H 'Host: socdepoble.org' {extra} 'http://localhost{ruta}'"
                  ).strip()

              def capcaleres(ruta):
                  return servidor.succeed(f"curl -s -D - -o /dev/null -H 'Host: socdepoble.org' 'http://localhost{ruta}'").lower()

              assert codi("/") == "200"
              assert codi("/mur") == "200"
              assert codi("/projecte/") == "301"
              assert codi("/assets/no-existix.js") == "404"
              assert codi("/.htaccess") == "404"
              assert codi("/.well-known/security.txt") == "404"
              assert codi("/.well-known/webfinger") == "400"
              assert codi("/.well-known/webfinger?resource=acct:socdepoble@socdepoble.org&resource=acct:sella@socdepoble.org") == "400"
              assert codi("/.well-known/webfinger?resource=acct:no-existix@socdepoble.org") == "404"
              assert codi("/.well-known/webfinger?resource=acct:socdepoble@altre.example") == "404"
              assert codi("/.well-known/webfinger/socdepoble.json") == "404"
              assert codi("/.well-known/webfinger?resource=acct:socdepoble@socdepoble.org") == "200"
              assert codi("/.well-known/webfinger?resource=acct%3Asocdepoble%40socdepoble.org") == "200"
              assert codi("/.well-known/webfinger?resource=acct:Socdepoble@SocDePoble.org") == "200"
              assert codi("/.well-known/webfinger?resource=ACCT%3ASOCDEPOBLE%40SOCDEPOBLE.ORG") == "200"
              assert codi("/.well-known/webfinger?resource=https%3A%2F%2Fsocdepoble.org%2Fap%2Factors%2Fsocdepoble.json") == "200"
              assert codi("/.well-known/webfinger?resource=http%3A%2F%2Fsocdepoble.org%2Fap%2Factors%2Fsocdepoble.json") == "404"
              assert codi("/.well-known/webfinger?resource=git%2Bssh:socdepoble@socdepoble.org") == "404"
              assert codi("/.well-known/webfinger?resource=acct:") == "400"
              assert codi("/.well-known/webfinger?resource=notauri") == "400"
              assert codi("/.well-known/webfinger?resource=acct:socdepoble") == "400"
              assert codi("/.well-known/webfinger?resource=acct:@socdepoble.org") == "400"
              assert codi("/.well-known/webfinger?resource=mailto:socdepoble@socdepoble.org") == "404"
              assert codi("/.well-known/webfinger.nginx") == "404"
              assert codi("/ap/actors/socdepoble.json") == "200"
              assert codi("/ap/outbox/socdepoble.json") == "200"
              assert codi("/ap/actors/no-existix.json") == "404"
              assert codi("/ap/inbox/socdepoble") == "200"
              assert codi("/ap/inbox/socdepoble", "-X OPTIONS") == "204"
              assert codi("/ap/inbox/socdepoble", "-X POST") == "405"
              assert codi("/ap/inbox/no-existix", "-X POST") == "404"
              assert codi("/ap/actors/socdepoble.json", "-X OPTIONS") == "204"
              assert codi("/.well-known/nodeinfo") == "200"
              assert codi("/nodeinfo/2.1.json") == "200"

              mur = capcaleres("/mur")
              assert "content-security-policy: default-src 'self'" in mur
              assert "x-content-type-options: nosniff" in mur
              assert "cache-control: no-cache" in mur

              jrd = capcaleres("/.well-known/webfinger?resource=acct:socdepoble@socdepoble.org")
              assert "content-type: application/jrd+json" in jrd
              assert "access-control-allow-origin: *" in jrd
              assert '"subject": "acct:socdepoble@socdepoble.org"' in servidor.succeed(
                  "curl -s -H 'Host: socdepoble.org' 'http://localhost/.well-known/webfinger?resource=acct:socdepoble@socdepoble.org'"
              )

              actor = capcaleres("/ap/actors/socdepoble.json")
              assert "content-type: application/activity+json; charset=utf-8" in actor
              assert "access-control-allow-origin: *" in actor
              assert "content-security-policy: default-src 'self'" in actor

              # RFC 9110 §15.5.6: el 405 de la inbox porta Allow.
              inbox = servidor.succeed(
                  "curl -s -D - -o /dev/null -X POST -H 'Host: socdepoble.org' 'http://localhost/ap/inbox/socdepoble'"
              ).lower()
              assert "allow: get, head, options" in inbox
              assert "access-control-allow-origin: *" in inbox
              assert '"type": "orderedcollection"' in servidor.succeed(
                  "curl -s -H 'Host: socdepoble.org' 'http://localhost/ap/inbox/socdepoble'"
              ).lower()
            '';
          };
        }
      );
    };
}
