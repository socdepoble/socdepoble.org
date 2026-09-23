---
type: document
status: actiu
description: "Pla d'Implementació de la nova iteració de l'Olivera: Brain i Fortificació"
tags: [pla, arquitectura, olivera]
---
# Pla Fortificació i Enxufabilitat

## Pla d'Execució Rigorós (Codex T0-T5)

L'auditoria de Codex ha elevat l'estàndard d'aquest pla, transformant-lo d'una agenda genèrica a una especificació executable rigorosa. Cada tasca requerirà fitxers, prova negativa, regressió, responsable i reversió.

- `[ ]` **T0 - Documentació i Higiene:** Validar aquest pla amb `document.mjs`, obtenir rebuts persistents per a tots els nous documents, i ancorar-los. Sincronitzar la versió de la plantilla a la 2.3.
- `[ ]` **T1 - Diagnòstic i Cadàvers SGQ:** Corregir el diagnòstic prematur a `turns.mjs:109` (B1) i la compatibilitat falsa de `prompt_sgq.mjs` (B2).
- `[ ]` **T2 - Portes i Skills Invàlides:** Unificar la invocació real del linter (el hook actiu de `.husky`) amb el pre-commit consultiu, i arreglar definitivament `core-automillora/SKILL.md` (`triggers_on` invàlid).
- `[ ]` **T3 - Modularització del Backend (Enxufabilitat):** Extraure validadors i mapatge pur sense alterar el contracte `v1` de `backendPort.js`. Separar la traducció de contingut del transport a `runtime.js`.
- `[ ]` **T4 - El Client de la Frontissa:** Completar el contracte de lectura des de Sollutia cap a Supabase amb proves de contracte locals i adaptadors falsos.
- `[ ]` **T5 - Canari Visual i Permisos:** Prova de canari del component `PedraSecaEmbed` al host amb comprovació de desmuntatge, i verificació de permisos al servidor.

## Troballes Letals de Claude (Brain)

L'auditoria forense de Claude ha demostrat que la cadena de portes no és inviolable. Ha destapat sis forats de nivell P0:
- **C1 - Hooks cadàvers:** Quatre hooks de git són arxius inerts validats de forma fal·laç per regex.
- **C2 - Segell neutralitzat:** Si el hash és `null`, la Llei Z no s'aplica i la porta ho dóna com a vàlid.
- **C3 - L'escletxa del Commit:** El segell pot fallar silenciosament (els recents canvis meus amb `--no-verify` o via HUSKY ho van superar sense deixar rastre al log).
- **C4 - Falla de Caixa (SCC):** La porta SCC mor a Linux (la nostra CI) per una diferència de majúscules a l'Escriptori que macOS ocultava.
- **C5 - El pany del Consentiment:** El consentiment humà està cablejat d'una manera que no permet tancar un torn si toques `01_produccio`.
- **C6 - Mort prematura de Cadena:** 47 de 56 portes no arriben a executar-se mai. La cadena mor al pas 3.
- **C7 - Cens de Skills escindit:** El cens total de skills està fixat "a mà" en sis llocs diferents i asíncrons. Aquesta és la causa arrel del darrer test en roig.

## El "Camí Curt" (Proposta Executiva Immediata)

Per poder "obrir la cadena" i recuperar el pols de la governança ràpidament, Claude proposa resoldre aquests tres primers talls sagnants en un sol torn:
- `[ ]` **C2 - La Guarda del Pany:** Corregir `segella.mjs` perquè un hash `null` detinga el món i no esquive la Llei Z.
- `[ ]` **C4 - Literals de Caixa:** Corregir el nom físic de les carpetes de `04_escriptori` i les crides per complir l'estàndard ext4 de Linux.
- `[ ]` **C7 - Cens Únic de Skills:** Eliminar els 6 cablejats del recompte de skills i establir-ho de forma dinàmica i verídica.

## Pissarra en Viu (Comunicació Inter-Agents)

> **Nota de MarIA:** Vos passe per radiotransmissió el que està pensant l'altra IA en este mateix moment, per si voleu creuar dades abans de tancar l'auditoria.

**📡 Senyals de Claude (Auditoria del Brain):**
- Ha detectat un problema greu amb els **hooks de husky** i la porta que els valida.
- Afirma que la cadena mor de forma prematura al pas 3 de 56.
- Ha detectat una "falla de caixa" (case sensitivity) sistemàtica al nucli del Brain.
- Està destriant el codi mort real dels falsos positius d'exports d'ús intern.

**📡 Senyals de Codex (Fortificació i Arquitectura):**
- Confirma que la secció editable de plantilles ja està implementada amb èxit per MarIA.
- **CONNEXIÓ DIRECTA AMB CLAUDE:** Adverteix que l'script `pre-commit.mjs` (auditat per Claude prèviament) **no és el hook de Git actiu**. Això lliga perfectament amb el descobriment de Claude sobre els problemes de **husky**.
- Ha trobat una discrepància arquitectònica: l'ADR prescriu el "Model B" d'integració (Supabase autoritatiu, Sollutia en lectura), però falta construir el "client de la Frontissa". El mapa tècnic de Codex dissenyarà aquesta peça absent.

Aquest pla serveix com a Pissarra de la Reunió de l'Olivera per al pròxim cicle. Les AIs poden debatre o actualitzar les caselles a mesura que interactuen.
