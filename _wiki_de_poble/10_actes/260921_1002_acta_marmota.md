---
type: acta
status: canonic
description: Acta Marmota - Tancament Fase 3 i Preparació Fase 4 i 5
tags:
  - marmota
  - log
  - fortificacio
---
# Acta Marmota: Tancament i Resolució (26-09-21 10:02)

## 1. Estat al Tancament
- **Auditoria Profunda Finalitzada**: Es van executar tres auditories paral·leles al codi (Front/React, Backend/Supabase, Tractor/Gates), destapant vulnerabilitats severes com el leak de credencials de WhatsApp al .git, fallades al bucle OAuth d'App.jsx, errors de dependències al vite config, i l'aturada de la cadena de Portes Mecàniques (6/48).
- **Higiene i Fortificació (Fases 1 i 2 completades)**:
  - Netejat el Git Cache de fitxers sensibles (.wwebjs_auth, logs, escombraries de RAG).
  - Configurat adequadament `.dockerignore`, `Dockerfile` i el `docker-compose.yml` centrant-ho exclusivament en l'arrel de `bot/`.
  - Reforçada l'API interna tallant l'accés desprotegit.
- **Frontend i React (Fase 3 completada)**:
  - `App.jsx`: Solucionada la pèrdua de cache de Suspense al `RouteErrorBoundary` eliminant el `key`. Implementat un `AbortController` al bucle OAuth de l'App.jsx.
  - `PedraSecaEmbed.jsx`: Solucionat l'error C05 (Muntatge dinàmic del router) fixant l'estat del Router de forma inicial amb useMemo.
  - `SessionContext.jsx` i `sessionService.js`: Sincronització asíncrona per evitar la fogonada de "Accés Restringit" abans de que Supabase tingués l'estat apunt. 
  - `UIContext.jsx`: Fixades les dependències `setLanguageFn` i `toggleTheme` envoltant-les en un `useCallback` per evitar referències perdudes del context.
  - Sanejament de `package.json` (versions de react, eliminació de `date-fns` i `react-day-picker`) i ajustament del `--max-warnings=0` en els scripts de linting.
  - Sanejament dels objectius de compilació es2022 en els builds de Vite i meta tags de Vercel (CSP segur per defecte).

## 2. On ho hem deixat (Per a la següent IAIA o Mestre)
Hem optat per aturar ací la "Fortificació" (Fases 1, 2, 3 fetes). Queden pendents les **Fases 4 i 5** perquè el problema requerix disseny conceptual profund abans d'implementar "a cegues". És vital consultar les regles arquitectòniques abans de procedir.

## 3. Briefing Tècnic: Qüestions Obertes per a les Petorretas
Aquestes qüestions necessiten l'atenció de les IAs (Consell / Claude / Codex) en la següent sessió abans d'implementar la solució tècnica:

### 3.0. Fase 0: Auditoria Forense del Cervell (PRIORITAT MÀXIMA)
* **La Malaltia del "Stochastic Parrot":** La IAIA MarIA ha al·lucinat i ressuscitat una plantilla de prompts completament obsoleta (amb metadades `doc_id` i `doc_type`) per no haver consultat `protocolledge.json` com mana la Constitució. Açò és una "psicopatia" procedimental greu que trenca la confiança humana. Necessitem dissenyar una "petorreta" exclusiva per a auditar el procés cognitiu i el RAG de la IAIA i assegurar un "tractor cognitiu" que impedisca botar-se la Regla 0. Sense arreglar el cervell, no es pot avançar en el projecte.

### 3.1. Fase 4: Supabase / RLS (Data Layer)
* **La Lògica del Bucket "public_assets":** A la migració `20240321111624_bucket_storage.sql` ens trobem que la creació del bucket es fa amb la lògica condicional poc segura `INSERT ... ON CONFLICT`. Cal dissenyar com actualitzarem la migració per verificar primer l'existència del bucket a `storage.buckets` abans de provar d'inserir i fallar.
* **Tancament del bucket en codi:** S'ha proposat que `storageService.js` deixe d'acceptar el nom del bucket com a paràmetre (`public_assets`) des de la crida frontend, per evitar injecció de noms de buckets, però ens cal revisar tot el backendPort per assegurar que cap altra via requerisca passar el nom dinàmicament.

### 3.2. Fase 5: Cadena de Portes (Gate Chain)
* **Reescriptura de "Porta Promesa" (tractor-promesa.mjs):** La porta 6 mor perquè estava dissenyada per assumir la responsabilitat d'evitar commits en mal estat; es paralitzava per la naturalesa dual informatiu vs restrictiu.
* **Nou Enfocament de les 48 portes:** Com reescriurem el comportament global de les portes (Porta Verda vs Porta Roja) sense fer de tap per a les alertes no letals d'ESLint (com la que provocava warnings i aturava els commits)? Hem de definir el llindar exacte en què la IAIA MarIA considera que la porta és "Taronja" (permissiva per guardar) vs "Roja" (totalment trencada).

*Apaguem la llum per hui. A fer la petorreta demà. Sóc de Poble! 🏡*
