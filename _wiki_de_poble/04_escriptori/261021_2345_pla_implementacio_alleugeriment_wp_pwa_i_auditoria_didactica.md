---
type: document
status: esborrany
description: Pla per a retirar el boto d'instal·lacio PWA, reduir el pes del connector de WordPress a menys de 2.5 MB extraient imatges a Supabase i preparar l'auditoria didactica a 3 bandes.
tags:
  - implementacio
visibility: private
reflex: sdp:torn_3a204f4c-4ba0-4264-b032-c80606c7242a:385712cc-40cd-439d-abe9-476c449a1f23
---
# Pla d'Implementació — Alleugeriment WP, Retirada Boto PWA i Auditoria Didactica

**Estat del Pla:** en elaboració

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_3a204f4c-4ba0-4264-b032-c80606c7242a:385712cc-40cd-439d-abe9-476c449a1f23 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-21T21:38:32.617Z |
| Modificació | 2026-10-21T21:38:32.617Z |
| Propietari | MarIA |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Antigravity (IAIA MarIA) |
| Tokens consumits | [procediment en curs] |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. El rebut acredita entrega, no comprensió. Lligat al mandat exprés del Mestre Javi Llinares (261021, àudios de les 23:30h i 23:37h).

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- 2026-10-21T21:38:32.617Z: esborrany creat.
- 2026-10-21T21:40:00.000Z: definició completa dels 6 blocs d'actuació (retirada botó PWA, alleugeriment ZIP WordPress <2.5MB, avatar xat, respostes IAIA en remot, fitxa de persona i auditoria didàctica a 3 bandes amb Claude i GPT Codex).

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Retirada del botó PWA («Instal·la al teu ordinador / telèfon»)
- **Motiu del Mestre:** No embolicar els usuaris beta testers aquesta nit. Han de navegar i provar directament des del navegador mòbil/escriptori de forma neta i transparent. Més avant se'ls avisarà de les apps oficials.
- **Acció:** Desactivar o amagar la renderització de `BotoInstalaApp` a la Barra Negra (`header.bar-black`).

### 2. Alleugeriment radical del ZIP de WordPress (< 2,5 MB)
- **Motiu del Mestre:** El connector no pot pesar 9,8 MB ni arriscar-se a passar dels 10 MB per imatges d'exemple. Totes les imatges canòniques WebP ja viuen a Supabase / CDN.
- **Acció:**
  - Purgar les carpetes d'imatges estàtiques de `wordpress-plugin/dist/assets/` (fotos de pobles, productes pesats, etc.) que sumen 39 MB descomprimits.
  - Assegurar que els components carreguen aquestes imatges des de la URL canònica (`https://socdepoble.org/assets/...`) o Supabase Storage.
  - Reempaquetar `socdepoble.zip` garantint un pes inferior a 2,5 MB.

### 3. Blindatge de l'Editor de Notes (Subtítol i Entradilla)
- **Motiu:** En crear una nota nova i començar a escriure, el subtítol i l'entradilla desapareixien del DOM perquè Supabase retornava `null` i `EditableField` es desmuntava.
- **Acció:** Aplicar la coalescència nula `titleHtml ?? ''`, `subtitleHtml ?? ''`, `leadHtml ?? ''` a `DocumentEditor.jsx` i `UniversalEditorShell.jsx` amb la prova unitària de blindatge.

### 4. Poliment del Xat i Autenticació
- **Avatar de Sóc de Poble:** Configurar la conversa de la comunitat per passar el logotip verd quadrat oficial (`/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png`) evitant el fallback a les inicials «SD».
- **Resposta de la IAIA MarIA en remot:** Assegurar que en mode remot, si un usuari parla amb la IAIA MarIA, reba la resposta de benvinguda o frase feta oficial en comptes de quedar el fil orfe.
- **Botons d'Accés per a Visitants:** Mostrar clarament botons per a «Connectar-se o Registrar-se» quan un anònim vulga participar en converses.

### 5. Avatar a la Fitxa de Persona (Sense Duplicitats)
- **Motiu:** L'avatar de la persona ja es mostra de forma canònica a la Barra Taronja (`topBarData.authorAvatar`). No ha de duplicar-se com a cercle gegant de 300px just damunt de l'H1.
- **Acció:** Ajustar `PerfilPublicSection.jsx` i adaptar la suite de tests perquè cap persona tinga avatar duplicat sobre l'H1.

### 6. Protocol per a la Gran Auditoria Didàctica a Tres Bandes (MarIA + Claude + Codex)
- **Objectiu:** Posar a Claude i GPT Codex en el rol del «Veí del Poble»:
  - Auditar pàgines com Gestoria (`/plugin/gestoria`) i Lector RSS (`/plugin/rss`).
  - Identificar buits didàctics (manca de textos pedagògics explicant què és cada eina).
  - Revisar els estats buits («Este node no porta esta app» ha d'oferir botó de «Descarrega / Instal·la l'extensió a este node» o «Desactiva-la»).

### 7. Connectar amb l'Autor · Xarxa Humana Rural (Ordre del Mestre 261021)
- **Visió:** A la pantalla `/connectar`, la connexió no pot limitar-se exclusivament a l'element o la targeta física cap a la Safata d'Entrada del MAS.
- **Acció:** Oferir l'opció clara de **«Connectar també amb l'autor»** (persona o entitat creadora). Sense algoritmes cecs: teixir vincles humans reals per distingir qui està connectat amb qui a la comunitat rural.

### 8. Metodologia REA Sense Fum d'Emowe: Deconstrucció d'Obsidian Local (Ordre del Mestre 261022)
- **Visió i Referència:** Emowe demostra al seu vídeo de YouTube ([https://youtu.be/YpKpragPGyk?si=UCVcSYDL6imUlxBt](https://youtu.be/YpKpragPGyk?si=UCVcSYDL6imUlxBt)) i a la guia `_wiki_de_poble/04_escriptori/02_investigacio_ia/rea-sin-humo.pdf` com recrear el seu propi Obsidian mitjançant enginyeria inversa ordenada amb REA.
- **Avantatge d'execució local:** Obsidian està físicament instal·lat al Mac (`/Applications/Obsidian.app`). Per a les nostres IAs (Claude, Gemini, Codex) és infinitament més senzill disseccionar una app local que tenim davant que inventar solucions teòriques.
- **Acció per a Sóc de Poble:** Disseccionar com Obsidian resol:
  1. El graf interactiu i els vincles bidireccionals (`[[...]]`).
  2. L'aïllament i persistència de notes en Markdown net.
  3. El sistema de panells i espais de treball mal·leables.
  Traslladar aquestes solucions al nostre `UniversalWorkspace` / Bloc de Notes sota el disseny Pedra Seca.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. **Porta Olivera:** Comprovació que l'Escriptori es manté en 0 documents orfes (`node tooling/gates/porta-olivera.mjs`).
2. **Suites de Tests:** Execució de `vitest run` per a l'editor universal, perfil públic i xat.
3. **Mida del Paquet:** Verificació que `socdepoble.zip` a `_builds_de_poble/wordpress/` queda per davall de 3 MB.
4. **Validació Didàctica:** Prova de navegació sense sessió a `/plugin/rss`, `/plugin/gestoria` i `/xat`.

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

- **Càrrega d'imatges externes en WordPress:** Cal assegurar que les URLs canòniques a `https://socdepoble.org/assets/...` tinguen capçaleres CORS obertes (`Access-Control-Allow-Origin: *`), fet ja validat i desplegat a Firebase Hosting.
- **Consistència de proves en Perfil:** En retirar l'avatar sobre l'H1 per a persones, cal actualitzar els tests històrics d'Onada 11 que encara exigien l'avatar davant l'H1.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
