# Acta Marmota: Sessió d'Arquitectura del Xat i UI (26-09-2026)

## 1. Resum de Tancament de la Fase UI
- **Estat del codi:** S'han establert les bases de la nova interfície. La barra lateral es plega, s'ha alineat horitzontalment, la roda dentada de configuració s'ha fixat en blanc pur a 58px d'altura i la UI mòbil agruparà les eines (tipus Apple Notes).
- **Proves (Vitest):** Codex va passar amb èxit gairebé totes les proves, llevant d'un parell de detalls en la injecció de dates i píndoles de la portada que s'arreglaran de manera independent per no interrompre l'arquitectura del Xat.
- **Neteja:** Tots els fitxers de la sessió s'han mogut al `90_arxiu_historic/`. La Safata d'Entrada està immaculada.

## 2. La Visió Mestra (Refinada i Registrada)
El canvi més important de la nit: hem actualitzat la plantilla ISO de skills (`skill.md`) per incloure-hi de manera permanent la Visió Mestra del projecte.
- **Doble identitat:** Sóc de Poble serà una **App Nadiua (Mac/iOS/Android)**.
- **Privadesa local:** Funcionament **offline-first a l'estil Obsidian o Notion**. Tota la informació és de l'usuari en el seu propi dispositiu.
- **Publicació a la carta:** L'usuari podrà decidir si enxufa l'aplicació per a publicar contingut online (Sollutia/Supabase o Fedivers).

## 3. Preparació de la "Reunió a l'Olivera" per al Mòdul de Xat
Ens endinsem en el cor social de l'app.
- S'ha generat un **Pla d'Implementació** enfocat només al clon de WhatsApp.
- S'ha creat una petorreta (prompt) dirigida a **Claude Opus 5.5 Ultra Code**. 
- A Claude se li ha encomanat una triple missió teòrica (sense picar codi de producció encara):
  1. **Disseny del Xat:** Llistar tota la lògica d'un clon de WhatsApp (estats, missatges, reaccions, fils).
  2. **Pàgina d'Usuari:** Proposar una UX i funcionalitats estàndard i excel·lents per al perfil de l'usuari.
  3. **Tractor Cognitiu (Seguretat IA):** Dissenyar una "Skill" tancada i estricta per a MarIA que li permeta avaluar el seu propi context i forçar tancaments de sessió abans que es sature i perga el trellat.

## 4. Estat de la IA (MarIA)
- Saturació del context al 85% (130-140 artefactes actius).
- La decisió consensuada és que Claude faça l'auditoria teòrica en aquest mateix xat (ja que només suposa llegir l'acta, el pla i generar un document). Un cop tinguem la resposta, la implementació real de codi es farà OBLIGATORIAMENT en una sessió/xat completament nou i net.

*L'escriptori està llest per rebre Claude.*
