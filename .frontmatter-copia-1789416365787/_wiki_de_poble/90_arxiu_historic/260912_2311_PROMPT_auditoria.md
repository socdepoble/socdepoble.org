---
tipus: petorreta
estat: canonica
description: "Auditoria Final d'Estabilitat Lògica, Seguretat i Enchufabilidad a Sollutia"
---
# 🛡️ LA GRAN PETORRETA FINAL: SEGURETAT I LÒGICA

## Objectiu Principal
Volem que tot el Consell (especialment Claude aprofitant els seus tokens restants, i qualsevol altre membre que s'unisca a la crida) faça una **Auditoria Forense Massiva de Seguretat i Lògica**.
Ara que l'arquitectura visual (Pedra Seca) està consolidada i Tailwind està erradicat de les vistes principals, hem de garantir que estem llestos per a endollar-nos al backend de Sollutia demà mateix.

## El Context Clau
1. Sóc de Poble és 100% online en esta fase, buscant **Enchufabilidad total** i zero fricció amb la base de dades i autenticació externa (Supabase de Sollutia).
2. L'accessibilitat visual (WCAG AA), contrastos i grandària de les àrees tàctils ja estan garantides i verificades. El focus ara és el Javascript, el React i el DOM.

## MISSIONS PER AL CONSELL:
Analitzeu el Bundle adjunt (`260912_2311_BUNDLE_auditoria.md`) per a detectar:

1. **🔥 Bugs Lògics Crítics i Orfes de JS:** El Mestre d'Obres (Antigravity) acaba de trobar un error en compilar el codi on `src/sections/gestoria/hooks/useGestoriaData.js` intenta importar `../lib/db` (Dexie) que NO existeix al sistema. Trobeu si hi ha més "minuts d'escombraries" com este derivats de sessions anteriors. Com podem blindar Gestoria si l'objectiu és Sollutia (API) i no Dexie?
2. **🔒 Seguretat i Autenticació:** El sistema `AuthProvider` i la barrera d'entrada a rutes protegides. És segur contra manipulacions locals? Està preparat per a rebre tokens JWT des del backend de Sollutia?
3. **🔌 Enchufabilidad i Agnosticism:** Els components reben les dades de manera neta (per props o hooks) sense estar massa acoblats a un backend concret? Les crides estan centralitzades per a quan Sollutia ens done l'API final?
4. **🐞 Residus en DesignSection:** S'han netejat classes fantasma. Comproveu si l'estructura del DOM encara amaga residus o falles potencials que no haja detectat l'escàner.

## Format d'Entrega
* Sigues directe. Si trobes un forat de seguretat o un error d'importació (tipus Gestoria), assenyala'l al vol i escriu la correcció (amb codi) que permeta un arranjament in-situ.
* Valora l'estat actual d'Enchufabilidad del 1 al 10.
