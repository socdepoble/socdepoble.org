---
type: pla_implementacio
status: esborrany
description: Pla per a Claude Opus 5.5 Ultracode - Perfil d'empresa i resolució d'incidències UX
---

# Pla d'Implementació: Resolució d'Incidències UX (Notes i Autenticació)

**Data:** 27 de setembre de 2026
**Estat:** Esborrany (Pendent d'execució per Claude Opus 5.5 Ultracode)

## Objectius del Cicle

1.  **Resolució d'Incidències UX pendents (F0):**
    *   Corregir l'offset de la barra d'eines de text enrinquit a Notes (`UniversalRichTextToolbar`).
    *   Afegeix l'opció "Borrar" al costat de "Publicar" amb un diàleg/modal d'opcions (Paperera 30 dies, Esborrar definitivament, Arxivar).
    *   Afegir l'opció de veure la contrasenya (icona d'ull) als camps de text de contrasenya (pantalles d'autenticació/registre).
    *   Desembossar el formulari de registre (arreglar l'estat congelat `isLoading`).
2.  **Validació del Login d'Usuari Registrat:** Connectar i comprovar l'estat actual del perfil d'usuari (usant la base de dades local de Supabase).

---

## FASE 1: Resolució d'Incidències (UX i UI)

### 1.1 Offset de la Barra de Format de Text (Notes)
**Problema:** En fer *scroll* a l'editor de Notes, la barra d'eines de format (TipTap) no aplega fins a dalt de tot. Es queda fixada a una distància de l'alçada de dues capçaleres per davall de la barra negra.
**Causa Tècnica:** En `modules.css`, la classe `.sdp-editor-eines` té `top: calc(var(--sdp-alt-accio) * 2);` per defecte (pensat per al layout del Mur on hi ha les barres blava i taronja *sticky*).
**Solució:** Dins de l'àmbit del mòdul de Notes (`NotesEditor` o CSS específic de les Notes), cal sobreescriure esta propietat per a restablir `top: 0;` o el valor que corresponga a l'alçada de la barra superior.

### 1.2 Botó "Borrar" amb Opcions a l'Editor de Notes
**Problema:** Actualment falta el botó "Borrar" de forma clara al costat de "Publicar", i no hi ha una finestra de confirmació amb opcions.
**Solució:**
*   A l'editor de Notes, afegir o habilitar el botó "Borrar".
*   En comptes d'esborrar immediatament, obrir una finestra modal (Dialog/Modal Pedra Seca).
*   Opcions del modal:
    *   Guardar durant 30 dies (Moure a la Paperera).
    *   Borrar definitivament.
    *   Arxivar.

### 1.3 Icona d'Ull (Veure Contrasenya) als Formularis
**Problema:** L'usuari no sap quina contrasenya ha escrit si només veu puntets.
**Solució:**
*   Al component `Input` de contrasenya, o directament en les vistes de Login/Registre, afegir una icona d'ull (`Eye` / `EyeOff` de Lucide) a la part dreta del `div`.
*   Aquest botó commutarà el tipus de l'input entre `password` i `text`.

### 1.4 Formulari de Registre Congelat
**Problema:** La pestanya de "Crear compte" es queda bloquejada; els inputs estan deshabilitats i el botó es queda carregant indefinidament (*spinner*).
**Solució:** Investigar la lògica d'estat al component d'autenticació i al context. Assegurar-se que els errors de connexió (com Supabase caigut) o els estats de càrrega previs es resetegen correctament i no bloquegen la UI de forma permanent.

### 1.5 Layout del Xat trencat (Workspace dins del Xat)
**Problema:** A la vista del Xat (`/xat`), apareix el `UniversalWorkspace` o un visor de documents sencer carregant "L'Ànima de la IAIA" a la columna dreta on no hauria d'estar.
**Solució:** Revisar l'encaminament o el component arrel del Xat. El Xat té el seu propi sistema de columnes o usa l'`AppGridShell`, però no ha d'incrustar el visor de documents al mig de la interfície. Cal llevar-ho perquè la vista de Xat només mostre les seues pròpies columnes.

---

## FASE 2: Validació de l'Autenticació i Perfil d'Usuari

*   L'usuari (Mestre) provarà d'iniciar sessió com a usuari registrat.
*   Cal verificar el funcionament del flux d'autenticació (Supabase Auth local).
*   Revisió visual de com ha quedat el Perfil d'Usuari (ja existent). Identificar què falta per fer.

---

## Verificacions de la Porta de Design-Guard (Pedra Seca)
Tots els canvis a realitzar hauran de respectar estrictament les regles de disseny (`modules.css`, `tokens.css`) i l'arquitectura de `UniversalEditorShell`.

## Contracte de Lliurament per a Claude Opus 5.5
En acabar l'execució, l'agent haurà de proporcionar:
1. Informe d'auditoria (Acta Marmota o Auditoria) amb el resum dels canvis.
2. Tots els tests de Vitest passant en verd.
3. El Lint sense errors.
