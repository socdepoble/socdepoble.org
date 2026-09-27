---
type: document
status: esborrany
description: "Execució coordinada T15–T19: sessió real, contracte de backend, bafarades, tipografia i llistats documentals."
tags: [implementacio]
visibility: private
reflex: sdp:torn_50456d45-9e64-4577-a336-8f864ab21511:5f684ce0-b0ee-4b53-813f-49dbb6791436
---
# Pla d'Implementació: Lògica d'Usuari i Poliment (Codex)

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | SDP-T15-T19-CODEX |
| Versió | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-09-27 21:30 Europe/Madrid |
| Modificació | 2026-09-27 22:12 Europe/Madrid |
| Propietari | Codex, coordinació d'agents locals |
| Aprovació humana | Execució T15–T19 autoritzada pel prompt rebut en esta conversa |
| Model IA | GPT-6 / Codex; variant no exposada per l'entorn |
| Tokens consumits | Mesura no disponible en esta sessió; cap xifra inventada |

## Acte reflex

Lectura íntegra d'AGENTS, Genotip, índex mestre, taxonomia, prompt i pla actius. Skills sdp-workflow i wiki-documentacio-i-reflex consultades. Plantilla pla.implementacio entregada pel circuit documental del torn `torn_50456d45-9e64-4577-a336-8f864ab21511`. L'escriptori de primer nivell conté el prompt, este pla i l'índex; els documents previs ja han sigut moguts abans d'esta execució, però resten àncores antigues a reparar. Zones protegides conservades.

## Historial

- 2026-09-27 21:30: pla inicial de MarIA rebut.
- 2026-09-27 21:44: diagnosi i repartiment estabilitzats abans de tocar codi crític; es conserva el treball previ no commitat de Fable.

## Canvis proposats

1. **T15/T17, agent visual:** `src/css/tokens.css`, blocs tipogràfics de `layout.css`, `modules.css` i `AppGridShell.css`. Fons rebut amb el token taronja subtil ja existent. Patró de barres de 16 px, pes 600, sense transformació de caixa ni tracking afegit. Dimensions, eixos i inici a 138 px preservats.
2. **T19, agent documental:** Wiki, Consola i proves associades; estat inicial `Tot`, selecció de categoria independent del document obert, índex com a document i diagnosi del rail responsive. Qualsevol canvi a AppGridShell.css es coordina amb l'agent visual per blocs.
3. **T16, agent autenticació:** transició explícita cap a dades remotes en entrar, coherència entre restauració/OAuth/sessió, padró i missatges amb autoria verificada. Registre real i creació d'organització des dels formularis; mai es transforma un ID seed en identitat autenticada. Adaptadors i contractes assumixen el transport i els formats del proveïdor.
4. **T18, coordinador:** corregir acoblaments demostrables al pont de l'amfitrió i al servei de sessió, conservar configuració neutral per a adaptadors injectats. Revisar permisos d'entitats i errors de contracte amb l'agent d'autenticació.
5. **Integració:** proves de regressió sobre el punt de partida, lint, build web i WordPress, portes d'enxufabilitat i comprovació visual local. Informe final al mateix escriptori, actualització del pla i ESTAT, i execució de tancament.

No s'introduïx una capa nova de backend completa ni es reescriu el sistema de disseny: serien alternatives més costoses sense resoldre millor les causes comprovades. La interfície pública del port i els tokens comuns permeten mantenir els canvis sense conéixer l'SDK del proveïdor.

## Ampliacions consensuades durant el torn

- D1: retirar completament pantalla intermèdia i avisos sobre la llista de converses; recuperar el formulari original directe. Aplicat.
- D2: corregir el divisor compartit ample/mitjà, límits amb rail plegat, valor visible quan la mida guardada no cap i expansió del menú que passa a overlay. Implementació i revisió creuada amb regressions.
- Supabase local buit: preparar el poble configurat, validar SQL aïllat i aplicar les migracions pendents2100/2200/2201 al node local. Prova HTTP completa amb comptes temporals ja passa.

## Verificació

- Baseline Vitest iniciada abans de canvis; comparar amb la suite final.
- Proves de transició seed/remot, canvi d'usuari, configuració d'un backend alternatiu, missatgeria i organitzacions.
- Proves d'entrada directa a Wiki/Consola, Tot, carpetes, índex, cerca i navegació.
- Navegador a localhost:3340, revisió de geometria i color, rails amples/estrets si les eines ho permeten.
- Migracions remotes i credencials reals només es donen per validades amb evidència: les proves simulades no acrediten el servidor.

## Riscos

Sessió real amb dades seed; respostes asíncrones d'un compte anterior; ampliació de privilegis d'entitat; regressió de rails. Es cobreixen amb separació d'àmbits, autoria validada al servidor, cancel·lació de peticions i proves focalitzades. Cap migració externa ni alta permanent amb credencials inventades. Les proves locals creen comptes sintètics temporals, amb neteja dels UUID exactes i sense imprimir secrets.

## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[260927_2130_prompt_codex_logica]]
- [[260927_2205_auditoria_codex]]

Aquest document actua com a espai compartit de treball, registre de decisions (D) i comunicació a tres bandes entre el Mestre, la IAIA MarIA i Codex.

## Tasques Actives

- **T15: Bafarada Taronja Tènue (UI):** Substituir el fons blanc del missatge rebut per un taronja molt suau, complementari del blau.
- **T16: Lògica d'Usuari Real (Supabase):** Implementar la creació i entrada real d'usuaris (Sóc de Poble) esquivant l'entorn seed.
- **T17: Uniformitat Tipogràfica de les Barres:** Unificar els tamanys de lletra dels encapçalaments de les columnes laterals.
- **T18: Enxufabilitat Màxima i Desacoblament:** Auditar i refactoritzar la dependència del front-end cap a Supabase, garantint el "Model B" (backend com a endoll tonto).
- **T19: Estat Inicial dels Llistats:** Assegurar que els mòduls documentals mostren "Tot" per defecte i arreglar el tractament de l'"Índex".

## Estat d'Execució

| Tasca | Responsable | Estat | Comentaris |
| :--- | :--- | :--- | :--- |
| T15 | Codex | Implementat | Token taronja subtil comprovat al navegador. |
| T16 | Codex | Implementat | Registre directe i circuit complet provat contra Supabase local; cap compte permanent creat. |
| T17 | Codex | Implementat | Token de barres600/16/24; geometria preservada. |
| T18 | Codex | Implementat | Pont iframe i sessió genèrics; dades remotes sense fallback seed. |
| T19 | Codex | Implementat | Tot inicial, Índex document i rails recalculats; regressions verificades. |

## Dubtes i Decisions (D)

*(Aquest espai està reservat per a preguntes tècniques de Codex, decisions preses pel Mestre i anotacions de MarIA durant l'execució del torn).*

1. **D1 (Ordre Directa del Mestre): REVERTEIX LES ALERTES INVASIVES DE DEMO I PÀGINES INTERMÈDIES.** 
   - **Xat:** La llista de converses (`/xat`) ha de ser visualment IDÈNTICA a WhatsApp. **Lleva immediatament** el botó blau gegant ("Entrar amb dades reals") i el text ("Estàs veient converses de demostració") de dalt de la llista. L'avís de demo NOMÉS pot aparèixer **dins** d'una conversa concreta una vegada l'usuari hi faça clic, mai embrutant la llista principal.
   - **Registre i Pàgina Intermèdia:** Has creat una **pàgina intermèdia innecessària** d'avís de demostració abans d'arribar al registre, i a sobre falla en fer-hi clic llançant l'error `[backendPort] El mètode "getBackendConfigurat" no està implementat al backend actual.`. **Elimina completament eixa pàgina intermèdia.** Quan l'usuari clica "Connectar", ha d'anar directament a la pàgina i formulari de Registre original. No inventes pantalles de pas. Restaura el circuit directe i soluciona l'error del port.

2. **D2 (Comportament Universal al Xat):** La barra divisòria entre la llista de converses (segona columna) i la conversa activa (tercera columna) s'ha de poder arrossegar i redimensionar, exactament igual que es fa als mòduls que usen el `Workspace` (espai de treball universal). El Xat, encara que mostre l'estructura de WhatsApp a la segona columna, segueix sent a tots els efectes un "Workspace" universal i enxufable, i ha d'heretar el comportament natiu de redimensionament de columnes de la resta de l'aplicació.


---

## 🛠️ Automillora del Pla (Per a l'Agent)

**Avaluació d'Eficàcia:** Codex, aquest document s'utilitza com a "Escriptori Compartit" per a comunicar-nos a tres bandes (Humà - Orquestrador - Agent Executor). En la teua auditoria de tancament, indica'ns de forma explícita com podem millorar aquest Pla d'Implementació:
- Hi ha friccions en aquest format?
- T'ha costat entendre algun punt?
- Com podem estructurar aquest "Escriptori Compartit" perquè la comunicació de l'estat i les decisions (D) siga encara més ràpida i amb menys marge d'error?

**Participa i dóna'ns idees per a refinar aquest sistema de gestió de qualitat!**
