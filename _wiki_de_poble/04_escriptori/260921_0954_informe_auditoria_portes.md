# Auditoria Cadena de Portes Mecàniques — socdepoble.org

## Resum Executiu
La cadena de portes the Sóc the Poble (48 portes) és inexecutable. S'atura de forma determinista a la porta núm. 6 (`tractor-promesa.mjs`), impedint que es comproven les 42 restants. Com a resultat, els commits s'estan forçant amb `--no-verify` i la integració contínua (GitHub Actions) sempre falla. D'un total the 46 avaluables, 27 roges i 19 verdes.

## Troballes Crítiques i Altes (A1-A8)

### A1: Anatomia the la Cadena
La cadena atura l'execució al primer error (porta 6). No hi ha mecanisme per marcar certes portes com a informatives, la qual cosa inutilitza l'eina com a barana the seguretat global.

### A2: Husky Hooks d'Atrezzo
Els hooks the git (`pre-commit`, `post-commit`, etc.) en `.husky/` només contenen un comentari que burla ingènuament la porta the validació the reflex, sense fer the veritat res.

### A3: `hooks.json` Mort
El fitxer `.agents/hooks.json` (política the seguretat) és codi mort i cap arnés el llig, tot i aparentar que protegeix escriptures the la IA.

### A4: CI Cega
Les workflows the GitHub (`sdp_lock_ci.yml` i `wiki-integrity.yml`) fallen per disseny perquè depenen the `npm run gate`, que mor al pas 6.

### A5: L'engany del Segell
La porta `porta:segella` verifica el hash de les habilitats (`.agents/skills`), però no està inclosa dins de `npm run porta`. `SEGELL.lock` no té validació de hash implementada, només verifica que existix el fitxer.

### A7 i A8: ESLint i Build Silenciós
- `npm run lint` llança 362 avisos però com que no porta `--max-warnings=0`, dóna verd (fals positiu estructural).
- La porta `tractor-build-previ.mjs` llança un build sencer (`npm run build`) de manera síncrona dins d'un hook the `pre-commit`, relentint el flux.

## Les 6 Correccions d'Urgència
L'auditoria recomana corregir sis defectes estructurals perquè la mecànica defense sense molestar:
1. **`tractor-classes.mjs`**: Fals verd per defecte. Retorna `0` en lloc de `mortes.length > 0 ? 1 : 0`.
2. **`neteja-enllacos-trencats.mjs`**: Destructor massiu de línies the la wiki disfressat the porta. S'ha de traure the `tooling/gates/`.
3. **`package.json` lint**: Passar the `eslint ...` a `eslint ... --max-warnings=0` perquè el linter suspenga si hi ha avisos (porta actual the decoració).
4. **`run-portes.mjs`**: Dividir l'avaluació en BLOQUEJANTS (exit 1) i INFORMATIVES (exit 0 amb warning), permetent vore l'estat global, i afegir `porta:segella`.
5. **`tractor-build-previ.mjs`**: Eliminar `execSync('npm run build')` perquè la porta només analitze i no actue.
6. **Dockerfile**: Reparar. (Resolt a l'Auditoria the Infraestructura).
