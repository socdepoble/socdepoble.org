---
type: document
status: esborrany
description: Pla d'implementació per a Claude i Gemini 4 per unificar la identitat activa entre TopBar i Xat, prioritzar l'avatar pujat i eliminar l'esquizofrènia de perfils
tags:
  - implementacio
visibility: private
reflex: sdp:torn_d54543b5-24fc-47a3-b2d7-6c664e6ec516:4b8fdb39-2bf4-4919-a3c1-f245d0516de4
---
# Sincronització d'Identitats, Avatar Personal i Coherència de Personalitats al Xat

**Estat del Pla:** aprovat per a auditoria i execució per les IAs (Claude / Gemini 4 / Codex)

<!-- SDP:SECTION pla.implementacio.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_d54543b5-24fc-47a3-b2d7-6c664e6ec516:4b8fdb39-2bf4-4919-a3c1-f245d0516de4 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-14T12:46:20.933Z |
| Modificació | 2026-10-14T12:48:00.000Z |
| Propietari | MarIA (Orquestradora) per al Mestre Javi Llinares |
| Aprovació humana | Requeriment directe del Mestre en àudio 261014_1445 i captura de gentdelatorre.net |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md (v2.0.0) |
| Model IA | Antigravity (Directora Tècnica / Orquestració) |
| Tokens consumits | Ordinari |

<!-- SDP:SECTION pla.implementacio.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/pla_implementacio.md; SHA-256 d05074ef89d1ec60596509565d7ac7a1e02b0e2bed1b304311b7fa651b0d23d0. L'Escriptori ha sigut sanejat amb la Porta Olivera (12 fitxers de torns passats arxivats a 90_arxiu_historic). Cap edició de codi en producció ha sigut executada per MarIA: el pla s'entrega a les IAs executores (Claude / Gemini 4 / Codex).

<!-- SDP:SECTION pla.implementacio.s3 -->
## Historial

- 2026-10-14T12:46:20.933Z: Esborrany inicial creat per MarIA.
- 2026-10-14T12:48:00.000Z: Formalitzat el diagnòstic forense complet de la dissociació d'identitats detectada pel Mestre a producció (gentdelatorre.net).

<!-- SDP:SECTION pla.implementacio.s4 -->
## Canvis proposats

### 1. Context i Troballes Forenses (Research)

En provar l'entorn real a `https://gentdelatorre.net/#sdp=/xat`, el Mestre ha identificat una fallada crítica de dissociació de personalitat («esquizofrènia identitària») que afecta la confiança de l'usuari:

1. **TopBar vs Carril del Xat**: A la barra superior negra es mostra l'avatar de **Sóc de Poble** (quadrat verd amb l'olivera en blanc), indicant que la identitat activa seleccionada és l'entitat institucional `Sóc de Poble`. No obstant això, a la cantonada inferior esquerra del rail de navegació del xat apareix un cercle amb les inicials `JL`.
2. **Avatar propi sense imatge al rail del Xat (`ClosCaXat.jsx:371`)**:
   ```javascript
   const avatarPropi = <Avatar nom={nomJo} mida="xs" llavor={joId} alt="" />;
   ```
   El component no rep ni passa la propietat `src` (o `avatar`), provocant que el component `<Avatar>` de Pedra Seca faça sempre un fallback rígid a les inicials de text (`JL`), ignorant la imatge de perfil existent.
3. **Imatge de Google vs Imatge Pujada per l'Usuari (`FullAjustos.jsx:367` i perfil)**:
   En prémer sobre el peu del rail i desplegar el modal d'«Ajustos», l'avatar de «Javi Llinares» mostra la foto associada al compte de Google OAuth (cercle multicolor de Google) en lloc de la imatge de perfil que l'usuari ha pujat manualment a la plataforma.
   - La prioritat d'avatars ha de ser estricta:
     1. Imatge personal pujada per l'usuari a Sóc de Poble (Supabase storage / base de dades local).
     2. En el seu defecte, imatge aportada pel proveïdor d'OAuth (Google, etc.).
     3. En el seu defecte, generació d'inicials sobre fons cromàtic amb llavor determinista.
4. **Dissociació d'Actor al Xat (`XatContext.jsx:397-399`)**:
   ```javascript
   const persona = Array.isArray(identitats) ? identitats.find((i) => i?.tipus === 'persona' && i.id === usuari?.id) : null;
   const joNom = persona?.nom || null;
   const joAvatar = persona?.avatar || null;
   ```
   `XatContext` filtra de manera rígida només la identitat de tipus `persona`, ignorant completament l'actor seleccionat (`useIdentitat().actor`). Si l'usuari ha seleccionat actuar com a `Sóc de Poble` o com a entitat/organització:
   - La TopBar mostra l'entitat.
   - El xat continua mostrant i enviant missatges com la persona física sense reflectir l'actor ni donar coherència a la interfície.
   - Cal unificar la gestió de l'actor actiu perquè el xat respongui a la identitat triada per l'usuari.

---

### 2. Canvis Concrets a Executar per les IAs (Proposed Changes)

#### Front A: Reparació del botó i avatar al peu del rail del Xat
- **Fitxer**: `src/sections/xat/components/ClosCaXat.jsx`
  - A `RailXat`: rebre `joAvatar` a les props (igual que ja rep `joId` i `joNom`).
  - A la línia 371: actualitzar `avatarPropi` per passar `src={joAvatar}`:
    ```javascript
    const avatarPropi = <Avatar nom={nomJo} src={joAvatar} mida="xs" llavor={joId} alt="" />;
    ```
  - Assegurar que tant en estat plegat com desplegat, l'avatar visualitze la foto real de l'usuari (o logo de l'entitat si actua com a entitat) i no només les inicials.

#### Front B: Jerarquia i resolució d'avatar d'usuari (Prioritat Local > OAuth)
- **Fitxers**:
  - `src/app/contexts/SessionContext.jsx` (o servei de sessió)
  - `src/app/contexts/IdentitatContext.jsx`
  - `src/sections/xat/XatContext.jsx`
  - `src/sections/profile/ProfileSection.jsx`
- **Regla innegociable de resolució**:
  ```javascript
  const avatarFinal = perfilPujat?.avatar_url || perfilPujat?.avatar || usuariOAuth?.avatar_url || usuariOAuth?.user_metadata?.avatar_url || null;
  ```
  L'avatar pujat per l'usuari a Sóc de Poble ha de tenir prioritat absoluta sobre la foto per defecte importada de Google durant el registre social.

#### Front C: Unificació de l'Actor Actiu entre la TopBar i el Xat
- **Fitxers**:
  - `src/sections/xat/XatContext.jsx`
  - `src/sections/xat/components/ClosCaXat.jsx`
  - `src/sections/xat/components/FullAjustos.jsx`
- **Comportament requerit**:
  - `XatContext` ha de sincronitzar-se amb l'actor actiu d'`IdentitatContext`:
    - Si l'usuari tria actuar com a `Sóc de Poble` (entitat), el rail del xat, la capçalera dels xats i el peu han de mostrar l'avatar i el nom de l'entitat activa.
    - Si l'usuari tria actuar com a si mateix (persona física), totes les superfícies han de mostrar la persona física amb el seu avatar propi.
    - S'elimina completament l'ambigüitat on una barra diu una cosa i el panell de xat en diu una altra.

#### Front D: Proves unitàries i d'integració
- Actualitzar i verificar:
  - `src/sections/xat/components/ClosCaXat.test.jsx` (comprovar que `avatarPropi` passa `src` al component `Avatar`).
  - `src/sections/xat/components/FullAjustos.test.jsx`.
  - `src/sections/xat/XatContext.test.jsx`.
  - `src/components/universal/identitat/useIdentitatDeLaBarra.test.jsx`.

#### Front E: Enginyeria Inversa de la Usabilitat (Metodologia REA: Obsidian, WhatsApp, Feedly, Raindrop i GnuCash)
- **Inspiració i Metodologia REA (Reverse Engineer Anything via MCP)**:
  - **Vídeo de referència obligatòria:** `https://youtu.be/NzXzcCVv5FI?si=GntOb1utK0zyqlnv` (*"I tried the viral repo for recreating apps"*).
  - **Repositori Oficial:** `https://github.com/morluto/rea` (disponible per a agents via MCP amb `npx rea-agents setup`).
  - Aplicar la lògica de desconstrucció estructural sobre aplicacions madures de referència («seen vs inferred») per nodrir els components de Pedra Seca sense inventar la roda ni generar codi a mitges:
    * **ARQUETIP MESTRE: Obsidian (i Notion)**: La base fundacional de Sóc de Poble és Obsidian: sistema de fitxers locals plans (Markdown), graf de coneixement viu, arquitectura modular de plugins extensibles i espais de treball mal·leables. Desconstruir com Obsidian gestiona la mal·leabilitat dels panells, el renderitzat i l'extensibilitat per veure què ens falta a la nostra Wiki/Workspace i fer-la encara més agradable i intuïtiva per als veïns.
    * **Xat Rural (WhatsApp Desktop)**: Estructures DOM exactes, separadors temporals, espaiats de 24/48px, gestió d'àudios i ergonomia d'escriptori / mòbil seguint `.agents/skills/sdp-clon-whatsapp/SKILL.md`.
    * **Lector Rural (Feedly)**: Jerarquia de carpetes, estils de targeta i lectura àgil d'RSS.
    * **Marcadors i Recursos (Raindrop.io)**: Previsualitzacions riques, col·leccions i etiquetatge ràpid.
    * **Salut Rural**: Eines de tele-assistència i suport a gent gran (avisos de medicació i xarxa de suport veïnal).
    * **Gestoria Rural (Factura Directa + Holded + GnuCash)**: Simplificació humana en 3 passos, autocompletat de productes agrícoles i la sobirania de dades i doble partida neta de GnuCash.

#### Front F: Quadre de Comandament i Exportació en Full de Càlcul (Excel / XLSX / CSV)
- **Fitxers implicats:**
  - `src/sections/gestoria/components/FullTrimestral.jsx`
  - `src/sections/gestoria/components/TaulerGestoria.jsx`
  - `src/sections/gestoria/services/exportadorExcel.js` (o servei de generació CSV/XLSX)
- **Objectiu:**
  - Generar un **Quadre de Comandament Executiu** i una taula completa de 12 columnes que es puga exportar en 1 sol clic com a **full de càlcul descarregable (Excel / XLSX / CSV)**.
  - El fitxer ha de contenir:
    1. **Full Resum (Quadre de Comandament):** Total d'ingressos, total de despeses, base imposable, IVA repercutit, IVA suportat, diferència a ingressar/compensar (Model 303), retencions d'IRPF acumulades (Model 130) i rendiment net del trimestre.
    2. **Full Detallat de Factures i Despeses:** Les 12 columnes ordenades (Data, Núm. Factura, NIF/CIF, Emissor/Receptor, Concepte, Tipus Operació, Base Imposable, % IVA, Quota IVA, % IRPF, Quota IRPF, Total).
  - **Usabilitat rural immediata:** L'usuari pot descarregar este full i enviar-lo directament per correu electrònic a la seua gestoria abans del dia 20 sense tocar ni un sol paper físic, a més de conservar-lo com a còpia de seguretat sobirana al seu disc dur.

#### Front G: Blindatge Defensiu davant `useSession` a la Pàgina de Pobles
- **Problema reproduït pel Mestre en captura de pantalla:** En navegar a `/pobles/la-torre-de-les-macanes`, es produeix un crash d'ErrorBoundary amb el missatge: `useSession ha de ser usat dins de SessionProvider`.
- **Fitxers a revisar:** `src/sections/pobles/**`, `src/components/universal/**`, `src/app/routes/**`.
- **Solució:** Aplicar la mateixa guarda defensiva implementada a `useIdentitatDeLaBarra.js` (retornar valors per defecte si el context de sessió és nul o no està muntat), evitant que la fallada de context trenqui la visualització de la pàgina del poble.

#### Front H: Resolució de l'Avatar de la Comunitat «Gent de la Torre» al Xat
- **Problema detectat pel Mestre:** A la llista de converses del xat, la fila de «Gent de la Torre» mostra les inicials `GD` sobre fons gris rígid en comptes de la imatge de la Torre de les Maçanes (imatge històrica de Viquipèdia / imatge oficial del poble).
- **Fitxers implicats:** `src/sections/xat/XatContext.jsx`, `src/sections/xat/components/Conversa.jsx`, `src/sections/xat/components/CaraXat.jsx`.
- **Solució:** Assegurar que la comunitat del poble resolgui el seu `avatar_url` a partir de les dades del poble associat (`poble:la-torre-de-les-macanes`), assignant-li la seua foto oficial sense caure al fallback de lletres.

#### Front I: Mostrar Totes les Publicacions a la Pàgina del Poble (Prou de límit a 3 targetes)
- **Problema detectat pel Mestre:** A la pàgina de Gent de la Torre només apareixen 3 targetes («Samarreta Sóc de Poble», «Mac Mini», «2n Aplec pel Territori»), quan s'han publicat moltes més targetes des de la Torre de les Maçanes.
- **Fitxers implicats:** `src/sections/pobles/PobleSection.jsx` (o component de graella del poble) i consultes a `src/data/`.
- **Solució:** Eliminar el `limit(3)` o tall rígid i connectar la càrrega completa de targetes vinculades al poble (o implementar botó «Mostra més publicacions»).

#### Front J: Pàgina Didàctica del Plugin de WordPress (Estil Pedra Seca) i Missatge Sollutia
- **Objectiu:** Modernitzar `wordpress-plugin/includes/ajustos.php`:
  * Presentació càlida i humana: Què és Sóc de Poble? Portal de Pobles Connectats.
  * Quants nodes connectats hi ha (La Torre de les Maçanes, Rentonar...) i com enxufar el poble amb el bloc natiu o shortcode `[socdepoble]`.
  * Amagar la diagnosi tècnica freda (SHA-256, integritat, node, marcatge universal) sota un desplegable `<details>` de diagnosi per a desenvolupadors.
  * Preparar el text del WhatsApp per a Sollutia per demanar l'enxufe de `socdepoble.org` com `gentdelatorre.net`.

<!-- SDP:SECTION pla.implementacio.s5 -->
## Verificació

1. Execució de la suite de tests pertinents:
   ```bash
   npx vitest run src/sections/xat/ src/components/universal/identitat/ tests/enxufe-plugin.test.mjs
   ```
2. Validació visual i d'accessibilitat:
   - Comprovar que l'avatar del rail mostra la imatge personal de Javi Llinares quan actua com a persona.
   - Comprovar que si es canvia d'actor al calaix de la TopBar a «Sóc de Poble», el Xat s'actualitza coherentment.
   - Comprovar que a `FullAjustos`, la imatge de la targeta d'usuari utilitza l'avatar pujat de Sóc de Poble i no el cercle genèric de Google OAuth.
3. Passatge de portes canòniques:
   ```bash
   node tooling/gates/porta-olivera.mjs
   ```

<!-- SDP:SECTION pla.implementacio.s6 -->
## Riscos

1. **Risc de regressió en `scopeKey` del Xat**: `XatContext` utilitza `scopeKey` i `ambitEstable` per indexar la memòria local i els fils de conversa. Quan l'usuari canvia d'actor entre persona i entitat, s'ha de garantir que els fils d'eixe actor es mantinguen nets i no es barregen amb els personals.
2. **Cache d'imatges d'avatar**: Assegurar que la resolució d'imatges locals de Pedra Seca (`AvatarResolt`, `CaraXat`) no falle si la URL és relativa o prové d'un blob / CDN extern.

<!-- SDP:SECTION pla.implementacio.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[../90_arxiu_historic/261014_0425_pla_implementacio_gestoria_i_replegament]]

