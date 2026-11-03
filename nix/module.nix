{ release, mkMunicipalWeb }:
{ config, lib, pkgs, ... }:
let
  inherit (lib) mkEnableOption mkIf mkOption mkForce mkBefore mkAfter types;
  cfg = config.services.socdepoble;
  globals = (lib.findFirst (rule: (rule.source or null) == "**")
    (throw "firebase.json: falta la política global") (builtins.fromJSON (builtins.readFile ../firebase.json)).hosting.headers).headers;
  # Política de seguretat de la release, sense copiar CSP a mà ni interpolar $ d'nginx.
  quote = value: assert !(lib.hasInfix "$" value); builtins.toJSON value;
  headers = lib.concatMapStringsSep "\n" (h: "add_header ${h.key} ${quote h.value} always;") globals;
  readOnly = ''
    add_header Allow "GET, HEAD, OPTIONS" always;
    add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Accept" always;
    if ($request_method = OPTIONS) { return 204; }
    if ($request_method !~ "^(GET|HEAD)$") { return 405; }
  '';
  publicHeaders = ''
    ${headers}
    add_header Access-Control-Allow-Origin "*" always;
  '';
  disabled = { return = "404"; extraConfig = headers; };
  apPaths = [ "^~ /ap/" "^~ /ap/inbox/" "= /.well-known/webfinger"
    "^~ /.well-known/webfinger/" "= /.well-known/nodeinfo" "= /nodeinfo/2.1.json" ];
  methodGuard = ''
    add_header Allow "GET, HEAD, OPTIONS" always;
    if ($request_method !~ "^(GET|HEAD|OPTIONS)$") { return 405; }
  '';
  package = mkMunicipalWeb pkgs {
    inherit (cfg) domain municipality enableActivityPub enableOpenData openDataSource dataMode supabaseUrl publicKey tenantId;
  };
in {
  imports = [ release.nixosModules.default ];
  options.services.socdepoble = {
    enable = mkEnableOption "el node municipal declaratiu de Sóc de Poble";
    domain = mkOption {
      type = types.strMatching "[a-z0-9]([a-z0-9.-]*[a-z0-9])?";
      default = "socdepoble.example.org";
      description = "Domini DNS ASCII; l'origen públic del paquet és HTTPS.";
    };
    municipality = mkOption {
      default = { slug = "la-torre-de-les-macanes"; name = "La Torre de les Maçanes"; };
      description = "Identitat del poble o slug abreujat; es recomana slug/name per al nom complet. No crea dades ni comptes remots.";
      type = types.coercedTo (types.strMatching "[a-z0-9]+(-[a-z0-9]+)*")
        (slug: { inherit slug; name = if slug == "la-torre-de-les-macanes" then "La Torre de les Maçanes" else slug; })
        (types.submodule {
        options = {
          slug = mkOption { type = types.strMatching "[a-z0-9]+(-[a-z0-9]+)*"; };
          name = mkOption { type = types.str; };
        };
      });
    };
    enableActivityPub = mkOption {
      type = types.bool; default = true;
      description = "Descoberta i documents estàtics de lectura. No habilita la inbox de fase 2.";
    };
    enableOpenData = mkOption { type = types.bool; default = true; description = "Publica només un paquet Open Data 1.2.0 verificat del municipi configurat."; };
    openDataSource = mkOption {
      type = types.nullOr types.path; default = null;
      description = "Paquet públic amb manifest/recursos SHA-256, com a path Nix (./paquet) o derivació: entra al magatzem i el build en depén. Una ruta absoluta en text falla en avaluar. Null reutilitza public/opendata, només si concorda el municipi.";
    };
    dataMode = mkOption { type = types.enum [ "seed" "remote" "local" ]; default = "seed"; };
    supabaseUrl = mkOption { type = types.str; default = "https://seed.invalid"; description = "Origen públic del backend (HTTPS, o HTTP local), sense credencials, ruta ni consulta; es comprova en avaluar."; };
    publicKey = mkOption { type = types.str; default = "sb_publishable_demostracio_seed"; description = "Només clau sb_publishable_, comprovada en avaluar abans d'escriure cap .drv; un JWT anon heretat va per services.socdepoble.pobles de la release."; };
    tenantId = mkOption { type = types.nullOr types.str; default = null; };
    enableACME = mkOption { type = types.bool; default = false; description = "Operador aporta acceptació/contacte ACME al sistema amfitrió."; };
    openFirewall = mkOption { type = types.bool; default = false; };
  };
  config = mkIf cfg.enable {
    assertions = [
      { assertion = builtins.stringLength cfg.domain <= 253 && lib.hasInfix "." cfg.domain && lib.all
          (label: builtins.match "[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?" label != null) (lib.splitString "." cfg.domain);
        message = "services.socdepoble.domain ha de ser un domini DNS ASCII vàlid."; }
      { assertion = cfg.municipality.slug != "socdepoble" && builtins.stringLength cfg.municipality.slug <= 64
          && builtins.stringLength cfg.municipality.name > 0 && builtins.stringLength cfg.municipality.name <= 120;
        message = "services.socdepoble.municipality: cal una identitat municipal pròpia, no l'actor del projecte."; }
      { assertion = cfg.dataMode != "remote" || cfg.tenantId != null;
        message = "El mode remote requerix el tenant públic; no crea cap Supabase ni sessió."; }
    ];
    services.socdepoble.pobles.${cfg.municipality.slug} = {
      domini = cfg.domain;
      paquet = package;
      acme = cfg.enableACME;
      obriTallafocs = cfg.openFirewall;
    };
    services.nginx.virtualHosts.${cfg.domain}.locations =
      (if cfg.enableActivityPub then {
        # El guard va abans de les reescriptures de WebFinger: cap POST pot
        # saltar a l'arxiu JRD intern abans de rebre el 405 amb Allow.
        "= /.well-known/webfinger".extraConfig = mkBefore methodGuard;
        "^~ /ap/".extraConfig = mkBefore methodGuard;
        "= /.well-known/nodeinfo".extraConfig = mkAfter readOnly;
        "= /nodeinfo/2.1.json".extraConfig = mkAfter readOnly;
        # host-meta no es servix: la seua plantilla LRDD per camí (/.well-known/webfinger/{uri})
        # cau en la location internal de l'arrel (404). Ací WebFinger és per paràmetre.
        "= /ap/actor.json" = {
          tryFiles = "/ap/actors/${cfg.municipality.slug}.json =404";
          extraConfig = ''
            types { }
            default_type "application/activity+json; charset=utf-8";
            ${publicHeaders}
            ${readOnly}
          '';
        };
      } else lib.genAttrs (apPaths ++ [ "= /ap/actor.json" ]) (_: mkForce disabled))
      // {
        "= /ap" = mkForce disabled;
        "^~ /nodeinfo/" = mkForce disabled;
        "= /opendata" = mkForce disabled;
        # RFC 7763: el Markdown porta charset, i el charset_types per defecte d'nginx no l'inclou.
        "^~ /opendata/" = mkForce (if cfg.enableOpenData then {
          tryFiles = "$uri =404";
          extraConfig = ''
            autoindex off;
            types { application/ld+json jsonld; application/json json; text/markdown md; text/calendar ics; }
            default_type "application/octet-stream";
            charset utf-8;
            charset_types text/markdown text/calendar;
            ${publicHeaders}
            ${readOnly}
          '';
        } else disabled);
        # El mediatype del manifest 1.2.0 i de firebase.json, no el de l'extensió .json.
        "= /opendata/activitystreams.json" = mkForce (if cfg.enableOpenData then {
          tryFiles = "$uri =404";
          extraConfig = ''
            types { }
            default_type "application/activity+json; charset=utf-8";
            ${publicHeaders}
            ${readOnly}
          '';
        } else disabled);
      };
  };
}
