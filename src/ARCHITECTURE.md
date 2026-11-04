---
type: document
status: esborrany
description: Arquitectura del client modular, port neutral i eines rurals opt-in de Sóc de Poble.
---
# Arquitectura de Sóc de Poble (L'Herència de Pedra Seca)

Aquest document és el far per a futures generacions d'intel·ligències artificials i desenvolupadors. Conté el resum del model arquitectònic que dona vida a Sóc de Poble.

## 1. Online-first i eines rurals opt-in
- Sóc de Poble va nàixer amb una vocació purament Online-First. 
- **La Destil·lació (Agost 2026):** Després de successives auditories de frontera (Claude i Codex), l'arquitectura Offline va ser extirpada per considerar-se un risc ("optimisme tòxic") davant la injecció en sistemes externs com Sollutia. 
- El servei de negoci continua **online-first** darrere del port neutral. En el Model B, el Supabase de Sóc de Poble és l'única font de veritat; l'amfitrió allotja el component i la Frontissa només consulta dades amb GET.
- Les eines rurals són **opt-in** i explícites: `src/data/sessioRural.js` compon persistència de dispositiu, cua, còpia de notes i pont d'emergència per a `/control?fitxa=mode-rural`. No canvien el backend, no confirmen publicacions remotes ni convertixen Auth o Xat en serveis offline. El replay remot exigix una capacitat idempotent comprovada.

## 2. L'Enxufabilitat (El Contracte)
La capa de persistència (`src/data/backendPort.js`) no assumeix res sobre l'entorn on corre.
- **Contracte de negoci:** les escriptures remotes es confirmen pel port. Una nota guardada al dispositiu o un paquet importat no equivalen a una escriptura remota; les eines locals ho indiquen i mantenen el seu àmbit separat.
- **El Pany del Host:** La injecció del backend es fa via `host.js`, que congela (freeze) la implementació just abans de muntar React. Això evita injeccions tardanes i garanteix un contracte ferm.

## 3. Govern i Aïllament
- **Tractors:** Utilitzem el concepte de "Tractors" o "Portes Mecàniques" (`tooling/gates/`) que executen regles estructurals immutables a través de scripts (ex. el tractor d'enxufe garanteix l'agnoscitisme del backend).
- **Shadow DOM**: El component `PedraSecaEmbed` es munta dins un Shadow DOM estricte per aïllar els estils. Tot el CSS del sistema (design tokens) s'injecta dinàmicament a la fulla del Shadow Root.
- **Gutenberg vs React:** El seguiment real de muntatges viu dins `PedraSecaEmbed` utilitzant microtasques (`queueMicrotask`) per evitar instàncies zombis i fuites de memòria en el cicle de vida de React quan l'usuari interactua amb CMS amfitrions.
- **El LEDGER:** A `.agents/LEDGER.md` trobaràs el registre immutable de les decisions estructurals i arquitectòniques aplicades al codi base.

## 4. Filosofia Pedra Seca
Composició visual explícita. Les dependències s'afegeixen només si l'esforç de mantenir-les és menor que el dolor del problema que resolen.
Llegiu `.agents/skills/sdp-pedra-seca/SKILL.md` per més detalls sobre l'estètica i els tokens.

*"Digues 'no ho sé' quan la font no arriba. Inventar és trair el poble."*

## Vincles

- [[00_index]]
- [[api_port_neutral_i_allotjament_model_b]]
- [[perfil_minim_allotjament_node_municipal]]
