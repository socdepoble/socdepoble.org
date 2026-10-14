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

#### Front E: Enginyeria Inversa de la Usabilitat (Calcar WhatsApp al Xat i Factura Directa a la Gestoria)
- **Inspiració i Metodologia REA (Reverse Engineer Anything via MCP)**:
  - Aplicar la lògica de desconstrucció estructural sobre aplicacions madures de referència per nodrir els nostres tractors de Pedra Seca sense inventar la roda ni generar fricció.
  - **Xat (Clonatge de WhatsApp Desktop)**:
    - Extracció d'evidència del comportament de WhatsApp Web / Desktop (estructures DOM, estils computats, espaiats exactes de 24/48px, gestió d'àudios i canvis d'estat de lectura).
    - Assegurar que el flux de resposta, reenviament i composició complisca la directriu canònica `.agents/skills/sdp-clon-whatsapp/SKILL.md`.
  - **Gestoria (Simplificació Radical calcada de Factura Directa / Holded)**:
    - El Mestre percep la Gestoria actual com a difícil i carregada d'utilitzar per a la vida rural real.
    - Desconstruir el flux canònic de Factura Directa:
      1. Formulari simple i humà: Qui factura? A qui? Què s'ha venut?
      2. Taula de línies amb autocompletat de productes del camp o serveis locals.
      3. Càlcul transparent d'IVA i retencions sense requerir formació fiscal.
      4. Emissió de factura oficial amb segell en PDF amb 1 sol clic (integrada amb el generador PDF de Pedra Seca).
      5. Menús d'alta enginyeria amagats darrere de desplegables discrets perquè l'usuari només veja facilitat.

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

