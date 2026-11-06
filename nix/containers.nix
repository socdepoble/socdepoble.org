{ municipalModule }:
{ config, lib, ... }:
let
  inherit (lib) mkEnableOption mkIf mkOption types;
  cfg = config.services.socdepobleContainer;
in {
  options.services.socdepobleContainer = {
    enable = mkEnableOption "un contenidor NixOS Node 0 amb xarxa i estat propis";
    autoStart = mkOption { type = types.bool; default = false; };
    hostAddress = mkOption { type = types.str; default = "192.168.100.10"; };
    localAddress = mkOption { type = types.str; default = "192.168.100.11"; };
    credentialFile = mkOption {
      type = types.str;
      default = "/run/secrets/socdepoble-node0.env";
      description = "Ruta al host i al contenidor; bind mount de només lectura, mai contingut en Nix.";
    };
    stateVersion = mkOption { type = types.str; default = "26.05"; };
  };
  config = mkIf cfg.enable {
    assertions = [ {
      assertion = lib.hasPrefix "/" cfg.credentialFile && !(lib.hasPrefix "/nix/store/" cfg.credentialFile);
      message = "La credencial del contenidor ha de ser un fitxer extern al magatzem.";
    } ];
    containers.socdepoble-node0 = {
      inherit (cfg) autoStart hostAddress localAddress;
      privateNetwork = true;
      bindMounts.${cfg.credentialFile} = { hostPath = cfg.credentialFile; isReadOnly = true; };
      config = { ... }: {
        imports = [ municipalModule ];
        system.stateVersion = cfg.stateVersion;
        services.socdepoble = {
          enable = true;
          domain = "socdepoble.cat";
          municipality = "la-torre-de-les-macanes";
          enableOpenData = false;
          openFirewall = true;
          node0 = { enable = true; credentialFile = cfg.credentialFile; };
        };
      };
    };
    # DNS/NAT/forwarding and public TLS are deployment decisions, not hidden activation.
  };
}
