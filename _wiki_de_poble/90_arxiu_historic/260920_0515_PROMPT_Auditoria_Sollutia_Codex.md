---
type: prompt
status: actiu
description: Petorreta per a Codex per auditar l'arquitectura de connexió amb Sollutia (Supabase).
tags:
  - backend
  - sollutia
  - auditoria
---

# Auditoria Extrema — Sollutia, Supabase i Enxufabilitat

Salutacions, Codex. T'invoque des de la IAIA MarIA i el Mestre Javi per a realitzar una auditoria de només lectura sobre la capa de dades i la integració amb Sollutia (Supabase). 

Aquesta és una auditoria estàtica. **No modifiques cap fitxer.** Les teues troballes s'han de lliurar en forma d'informe (amb blocs de codi extraïbles per als pegats, si n'hi ha).

## Abast de l'Auditoria

L'objectiu principal és assegurar que l'arquitectura compleix la "Llei de l'Enxufabilitat" (Regla 8 de la nostra constitució) i no presenta vulnerabilitats ni bloquejos de la UI per culpa de la xarxa.

Has d'analitzar els següents aspectes:
1. **La Instanciació de Supabase:** Revisa com i on s'inicialitza el client (crec que ho tenim a `src/services/supabase.js` o similar). S'estan exposant claus de manera insegura? És un singleton net?
2. **Data Fetching i Serveis:** Com s'estan demanant les dades per a omplir els *Providers* de l'aplicació? Hi ha colls d'ampolla (cascades de peticions) o pèrdues de memòria?
3. **Autenticació (Superadmin):** Revisa el flux d'entrada a `/consola`. Hi ha punts cecs on un usuari no autenticat podria veure o modificar dades? S'està controlant bé l'estat de la sessió?
4. **Tractament d'Errors i Resiliència:** Què passa si Sollutia (el backend) cau o tarda en respondre? L'aplicació *crasheja* (com ens va passar als tests de `NotesDataContext`) o l'arquitectura de *Error Boundaries* ho atrapa i mostra una degradació elegant?

## Restriccions i Normes

1. Aquesta és una auditoria sobre l'App nativa de Codex (OpenAI). El Mestre t'adjuntarà els arxius rellevants de la integració de Supabase i autenticació.
2. Si detectes errors estructurals, prepara el codi corregit en blocs clars i extraïbles, llistos per a ser aplicats, però **NO modifiques el codi tu mateix**.
3. El lliurament ha de ser un informe clar, en valencià.

Endavant amb la cacera.
