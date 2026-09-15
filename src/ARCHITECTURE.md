# Arquitectura de Sóc de Poble (L'Herència de Pedra Seca)

Aquest document és el far per a futures generacions d'intel·ligències artificials i desenvolupadors. Conté el resum del model arquitectònic que dona vida a Sóc de Poble.

## 1. El Viatge: De l'Online-First a l'Online-First Estricte
- Sóc de Poble va nàixer amb una vocació purament Online-First. 
- **La Destil·lació (Agost 2026):** Després de successives auditories de frontera (Claude i Codex), l'arquitectura Offline va ser extirpada per considerar-se un risc ("optimisme tòxic") davant la injecció en sistemes externs com Sollutia. 
- Actualment el sistema és estrictament **Online-First**. La memòria cau actual actua només de passarel·la de lectura; el servidor remot (o el backend injectat) és l'única font de veritat de negoci. 

## 2. L'Enxufabilitat (El Contracte)
La capa de persistència (`src/data/backendPort.js`) no assumeix res sobre l'entorn on corre.
- **Terminal Estúpid:** El frontend no sincronitza dades. Envia i rep. Si falla, delega la responsabilitat o reverteix la UI (Rollback pessimista).
- **El Pany del Host:** La injecció del backend es fa via `host.js`, que congela (freeze) la implementació just abans de muntar React. Això evita injeccions tardanes i garanteix un contracte ferm.

## 3. Govern i Aïllament
- **Tractors:** Utilitzem el concepte de "Tractors" o "Portes Mecàniques" (`tooling/gates/`) que executen regles estructurals immutables a través de scripts (ex. el tractor d'enxufe garanteix l'agnoscitisme del backend).
- **Gutenberg vs React:** Com que el component es munta a través de l'editor de blocs de WordPress, s'utilitzen panys globals (`window.__SDP_REACT_MOUNTED__`) i microtasques (`queueMicrotask`) per evitar instàncies zombis i fuites de memòria en el cicle de vida de React.
- **El LEDGER:** A `.agents/LEDGER.md` trobaràs el registre immutable de les decisions estructurals i arquitectòniques aplicades al codi base.

## 4. Filosofia Pedra Seca
Resiliència sense ciment. Les dependències s'afegeixen només si l'esforç de mantenir-les és menor que el dolor del problema que resolen.
Llegiu `.agents/skills/pedra-seca/SKILL.md` per més detalls sobre l'estètica i els tokens.

*"Digues 'no ho sé' quan la font no arriba. Inventar és trair el poble."*
