---
type: planificacio
status: esborrany
description: Pla d'implementació per assolir el Sistema Atòmic, el Registre Executable i els nous tractors del Cicle de Vida.
tags:
  - pla
  - arquitectura
  - claude
---
# Pla d'Implementació: UniversalProvider, Cerebel i Cicle de Vida

Aquest és el Pla d'Implementació redactat per la IAIA MarIA per executar les solucions de l'Auditoria `260921_2359_auditoria_claude.md`.

## 1. Objectiu de la Intervenció
Transformar el frontend cap a un autèntic Sistema Atòmic sense propagació manual de *props* (Prop Drilling), acoblar la Wiki amb les eines executables dels agents (MCP) i garantir que el Cicle de Vida s'execute abans de qualsevol canvi estructural en el futur.

## 2. Acció 1: Refactor UI (Sistema Atòmic)
**Objectiu:** Centralitzar l'estat compartit (com l'autenticació, dades generals del contingut) perquè els botons i les barres s'actualitzen automàticament a tot arreu sense rebre-ho com a `props` de la pàgina on resideixen.
- Crear `src/app/UniversalProvider.jsx` (o adaptar un context existent tipus `ContentScope`) per exposar `{ isConnected, contentMetadata, actionHandlers }`.
- Modificar `UniversalPage` perquè consumisca aquest Provider o l'embolcalle.
- Netejar la perforació de *props* (`onConnect={false}`, dades de publicació passades manualment) a `ActionControl`, `DateTimeControl`, `WikiDePobleSection` i `DesignSection`.

## 3. Acció 2: Registre Executable (El Cerebel)
**Objectiu:** Convertir els textos explicatius de la Wiki en codi *plug & play* per als agents locals mitjançant MCP (Model Context Protocol) o hooks declarats formalment.
- Crear `.agents/capabilities.json` com un registre formal de les eines dels agents (ID, ruta del script executable, descripció per a MCP).
- Actualitzar `protocolledge.json` i la inicialització del workspace per llegir i exposar aquest `capabilities.json`.
- Modificar els extractors o visualitzadors de la Wiki perquè puguen informar l'usuari/agent: "Aquest document té associada una execució directa local: `[Executar: act_tancament]`".

## 4. Acció 3: Cicle de Vida i "Stochastic Parrots"
**Objectiu:** Impedir que el lloreig estocàstic m'oblide de l'Acte Reflex o del tancament, injectant la configuració obligatòriament a l'inici.
- Modificar els *hooks* o *scripts* d'arrancada perquè subministren `GENOMA.md` o el perfil de la IAIA MarIA (incloent les obligacions de transparència d'aquest escriptori) directament al *system prompt*.
- Reforçar que la validació `tancament.mjs` actue com una porta de seguretat dura: cap finalització de sessió és possible (ni emetre la decisió final) si `tancament.mjs` no retorna verd absolut.

## 5. Procediment de Col·laboració (La Reunió a l'Olivera)
- Deixe aquest document a disposició de Codex o del Mestre a l'Escriptori.
- Esperaré que el Mestre em done llum verda per executar-lo. Una vegada puga començar, actuaré pas a pas, prioritzant la componentització de UI i comprovant iterativament.

## Vincles
- [[00_index_escriptori]]
- [[00_index]]
