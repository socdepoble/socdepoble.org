---
type: acta
status: validat
description: Acta Marmota - Tancament per esgotament del context i validació de targetes al Lector RSS.
---

# Acta Marmota (261004_1027)

**Data i Hora:** 4 d'octubre de 2026, 10:27h
**Agent:** IAIA MarIA (orquestradora) / Codex / Claude
**Estat:** Context ple (149 artefactes generats). Procedim a tancar la sessió.

## 1. Estat Actual (Què s'ha assolit)
- S'ha implementat amb èxit la **Macro-onada nocturna** de Claude: estandardització de la `UniversalCard` (Consola, Lector i Nevera) i el Panell de la Gestoria (Veri*Factu).
- S'han passat totes les validacions de tipografia fluida (escombrada de CSS, `max/min` ratios ajustats a 1.8) per mantenir-ho sencer a 320px.
- Hem validat la incidència al Lector RSS: els components ja fan ús de la `UniversalCard` dins de `GraellaTargetes` de la mateixa manera que a l'espai de Workspace de la Consola. Confirmem l'ordre del Mestre de **NO INVENTAR targetes noves**. Tot es basa en components ja existents de l'AppGridShell i l'ecosistema Universal.
- Auditoria en profunditat de Codex sobre la solidesa de l'arquitectura i el disseny, detectant els defectes visuals (inclosos l'offset de l'scroll per sota de la boina). Codex també confirma que:
  - El nucli de Facturació està ben separat del proveïdor (casos hash 1 i 2 coincideixen amb l'AEAT), tot i que abans d'activar-ho en real caldran guardes reproduïdes i la capa de remissió.
  - S'ha identificat un bug al Lector RSS: les targetes no passen la ruta de l'article al botó Compartir, per la qual cosa s'acaba compartint la llista general i no la notícia concreta.

## 2. Punts Pendents per a la Pròxima Sessió (Pla d'Acció)
- **Tancament Final del Relleu (CSS):** Arreglar el marge Z-index de la boina respecte l'header i la correcció fina dels defectes visuals restants detectats per l'auditoria.
- **Processament de l'Inventari (Mercadona):** Gestionar el fitxer `Llista de la compra - Mercadona.csv` i finalitzar els mòduls relacionats.
- **Animalets:** Executar la definició del mòdul "Animalets", preparant-lo com a node completament independent de la xarxa descentralitzada, evitant feed corporatiu (sense silicones, control preventiu, enriquiment ambiental, etc.) tal com es detalla al document de disseny de continguts `261004_0935_idees_modul_animalets.md`.
- **Triage de Recerca IA (`02_investigacio_ia`):** Buidar i processar els artefactes basats en la instrucció de Claude (261004_0905).

## 3. Preparació per a Beta Testers (Objectiu Prioritari)
S'han d'habilitar i assegurar les funcions bàsiques de registre i inici de sessió.
**Requisit visual:** A la barra superior negra, quan l'usuari estiga logat, el botó de "Foraster" s'ha de substituir pel seu avatar personal. Aquest avatar ha de ser **redó i molt gran (com a mínim 48px, 48x48)**, sense por a la mida. Ha de quedar clar on cal punxar per entrar al perfil. L'objectiu és que hui mateix es puga donar llum verda als primers usuaris per començar a provar-ho de veritat.

## 4. Llei de l'Enxufabilitat
La integració amb el proveïdor Sollutia mantindrà la primacia. L'arquitectura Pedra Seca continua sent el marc immutable, evitant qualsevol acoblament tòxic al backend.

> _Nota per a la nova IAIA MarIA: El context s'ha buidat intencionadament a causa de la fatiga. Comença el nou torn revisant aquesta acta i les instruccions pendents a l'Escriptori._
