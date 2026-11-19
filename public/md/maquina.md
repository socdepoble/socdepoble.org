# maquina

> Nota d'etiqueta de la màquina de Sóc de Poble, amb l'arquitectura del codi, les portes de qualitat i les eines del cervell documental.

- Document a la Wiki de Poble: https://socdepoble.org/wikidepoble?item=maquina
- Llicència de sèrie del contingut: CC BY-NC-SA 4.0 (https://creativecommons.org/licenses/by-nc-sa/4.0/)

---

# Màquina

El codi viu fora de la Wiki, a `src/` i `tooling/`, i esta nota agrupa els documents que expliquen **com es construïx, es comprova i s'allotja** Sóc de Poble. El mapa complet d'especificacions i decisions és l'**Índex de la Màquina**.

## Peces vives de la màquina (tall del 14 de novembre de 2026)

- **Aplicació modular i port neutral (`src/`):** interfície **Pedra Seca** connectada darrere de `src/data/backendPort.js`, amb el reproductor flotant universal **«Escolta la IAIA»** de 48 píxels integrat sota la barra de lectura i cròniques interactives com `/mur/la-veu-de-soc-de-poble` fonamentades en el projecte **NEL-VIVES** (Universitat d'Alacant).
- **Portes deterministes (`tooling/gates/`):** validacions automàtiques d'accessibilitat, seguretat RLS, integritat d'enllaços, vocabulari i maquetació que protegeixen cada entrega abans del desplegament.
- **Node 0 · Mac mini M4 a La Torre de les Maçanes (L'Alacantí):** servidor pilot comunitari (`socdepoble.cat`) amb **PostgreSQL 17.11** local per a l'API en proves, síntesi de veu oberta en directe amb **Matxa-TTS v2 Multiaccent** (`https://socdepoble.cat/api/v1/node0/veu`, set veus verificades per to fonamental), **8 escoles locals** de revisió al taller i la ronda diària de frescor editorial (`org.socdepoble.node0.frescor-editorial`) en només lectura.

## Vincles

- [[00_index]]
- [[00_index_maquina]]
- [[perfil_minim_allotjament_node_municipal]]
