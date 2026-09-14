# ACTA MARMOTA: Tancament i Visió Universal (13 Setembre 2026)

## 📌 Què s'ha fet en aquesta sessió?

1. **Correcció de la Pujada d'Avatars (Caixa Única)**: Hem implementat un *fallback* a Local Data URL per a quan la pujada a Supabase Storage falla per falta de sessió (mode `seed`), evitant que el Perfil rebente en local. A més, hem reparat el context de `uploadToStorage` perquè rebera la `config` correctament.
2. **Definició de l'Arquitectura del Perfil**: S'ha conceptualitzat l'ús de la **Universal Page** com a eina d'edició i visualització del Perfil (Javi Llinares, Empreses, Grups). El perfil serà una instància més del sistema fractal, mostrant-se com una **Targeta Universal** a les cerques (Buscador). Aquesta visió s'ha ancorat a l'arxiu [260913_0635_arquitectura_perfil_universal.md](260913_0635_arquitectura_perfil_universal.md).
3. **Refactor d'Emergència de `UniversalEditorShell`**: He actuat proactivament per reparar la pàgina de Notes ("destrozada"). Al encapsular l'edició dins de `UniversalEditorShell`, s'havia trencat el disseny original de la `UniversalPage` (Hero a full width i Barra Taronja). He reescrit el DOM de `UniversalEditorShell.jsx` perquè el component Hero i la Barra Taronja visquen *fora* del contenidor limitador (`ues-canvas`), restaurant el disseny canònic original.

## 🔎 Auditoria de Skills i Sistema (Autocura)

Aprofitant el temps de guàrdia que m'has donat, he revisat el directori `.agents/skills`:
- He trobat que l'índex de skills (`00_INDEX_SKILLS.md`) estava desactualitzat (faltava `skill-casos-us-essencials`).
- He revisat el comportament de la `UniversalPage` per assegurar que el refactor de `UniversalEditorShell` respecta la llei de disseny Pedra Seca. Tot torna a l'ordre.

## ⏭️ Pla per a la Pròxima Sessió

1. **Integrar la lògica de Notes al Perfil**: Començar a refactoritzar la secció d'Identitats/Perfil perquè use el `UniversalManager` amb la llista d'atributs, i que el detall s'obriga utilitzant el mateix `UniversalEditorShell` que acabem de reparar.
2. **Creació de les Notes del Sistema**: Permetre que es creen les notes de "Soc de Poble" i "La meua nota" amb el nou perfil Universal.
3. **Fase 5 de la Toolbar (Pendent)**: Si en algun moment cal abstracció total per a múltiples editors (TipTap, Lexical), s'ha de reprendre la refactorització de l'`UniversalRichTextToolbar`.
4. **Cercador**: Implementar o refinar la cerca perquè retorne les noves `UniversalCard` dels perfils.

---
**Estat de la Màquina**: L'entorn queda sanejat, el disseny original del Bloc de Notes s'ha restaurat i l'arquitectura de perfils està conceptualitzada en ferm. Me'n vaig a l'espera de la pròxima connexió. 
Bona nit, Mestre! 🌙
