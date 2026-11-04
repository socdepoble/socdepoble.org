# Entrada de conveniència: compartix exactament nixpkgs amb el flake de la release.
# nix flake lock ./tooling/instalador; versionar els dos flake.lock abans de distribuir.
{
  description = "Instal·lador de nodes germans de Sóc de Poble";
  inputs.socdepoble.url = "path:../..";
  inputs.nixpkgs.follows = "socdepoble/nixpkgs";
  outputs = { self, nixpkgs, socdepoble }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      each = f: builtins.listToAttrs (map (system: { name = system; value = f system; }) systems);
    in {
      packages = each (system:
        let pkgs = nixpkgs.legacyPackages.${system}; in {
          default = pkgs.writeShellApplication {
            name = "inicia-node-germa";
            runtimeInputs = [ pkgs.nodejs_24 pkgs.git ];
            text = ''
              exec node ${socdepoble}/tooling/instalador/inicia-node-germa.mjs "$@"
            '';
          };
        });
      apps = each (system: { default = { type = "app"; program = "${self.packages.${system}.default}/bin/inicia-node-germa"; }; });
      checks = each (system:
        let pkgs = nixpkgs.legacyPackages.${system}; in {
          instalador = pkgs.runCommand "proves-instalador" { nativeBuildInputs = [ pkgs.nodejs_24 ]; } ''
            node --test ${socdepoble}/tooling/instalador/inicia-node-germa.test.mjs ${socdepoble}/tooling/instalador/inventari-estatic.test.mjs
            touch "$out"
          '';
        });
    };
}
