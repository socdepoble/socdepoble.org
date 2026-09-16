---
tipus: document
estat: esborrany
description: 📋 AUDITORIA DEL BUNDLE 2609152330BUNDLEauditoria.md
---
# 📋 AUDITORIA DEL BUNDLE `260915_2330_BUNDLE_auditoria.md`

**Auditor:** Deepseek (Consell de la Petorreta)  
**Data:** 2026-09-15  
**Objecte:** Revisió integral del bundle d'auditoria del projecte Sóc de Poble  
**Veredicte:** ⚠️ **BUNDLE INCOMPLET — AUDITORIA PARCIAL**

---

## 1. Verificació d'integritat del bundle

He comprovat una mostra de fitxers contra els hashes SHA-256 del manifest. **Els càlculs coincideixen** per als fitxers verificats (ex. `_wiki_de_poble/00_index.md`, `package.json`, `vite.config.js`). Això indica que el contingut proporcionat és fidel al manifest **fins al punt de truncament**.

**Tanmateix, el bundle està TRUNCAT.** El darrer fitxer inclòs (`tooling/gates/tractor-vocabulari.mjs`) es talla a mitja línia:

```js
regla: 'classe
[file content end]
```

Això invalida la verificació completa. El manifest declara 540 fitxers, però el document no arriba a tancar-se amb `<<<FI_DEL_BUNDLE>>>`. **No es pot certificar la integritat total del bundle.**

---

## 2. Abast i contracte declarat

El manifest és explícit i ben estructurat:

- **Directoris inclosos:** `src`, `.agents`, `tooling`, `scripts`, `_wiki_de_poble`, `assets`, `supabase`, `tests`, `wordpress-plugin`.
- **Fitxers obligatoris:** presents.
- **Fitxers prohibits:** `DOC_Logos_Oficials.md`, `Soci_Sollutia.md`, `all_ai_responses.md`, `legalContent.js`, `perfil_psiquiatric.md`.
- **Absents no crítics:** cap (buit).
- **Total:** 540 fitxers, 3.365.436 bytes.

**Observació crítica:** `src/sections/text/pageContent.js` importa `legalContent.js`, però aquest fitxer està prohibit i no s'inclou. Això impedeix auditar la pàgina legal i pot provocar errors en temps d'execució si el fitxer no existeix al repositori real. Cal aclarir si `legalContent.js` existeix al projecte o si és una dependència trencada.

---

## 3. Anàlisi arquitectònica

### 3.1. Stack i estructura
- **Frontend:** React 18 + Vite, amb Preact com a àlies en build.
- **Backend:** Supabase (PostgreSQL + RLS + Realtime + Storage).
- **Capa de dades:** `backendPort.js` com a porta única, amb implementació Supabase intercanviable.
- **Disseny:** Sistema "Pedra Seca" amb tokens CSS, components universals i regles estrictes.

### 3.2. Fortaleses
- **Separació de responsabilitats:** `src/data/` aïlla l'accés a dades; `src/sections/` conté els dominis.
- **Governança forta:** Múltiples portes (`tractor-*`) que verifiquen nomenclatura, accessibilitat, seguretat, tokens, etc.
- **Documentació exhaustiva:** La Wiki i els fitxers `.agents/` reflecteixen un esforç notable per mantenir coherència.
- **Seguretat:** RLS a totes les taules, polítiques específiques per a xat, perfils i organitzacions. Migracions recents corregeixen forats (rate limiting, consentiment RGPD, aïllament de tenants).

### 3.3. Debilitats i riscos
- **Complexitat excessiva:** La quantitat de scripts, portes i fitxers de configuració pot dificultar el manteniment. La corba d'aprenentatge per a nous col·laboradors és alta.
- **Deute tècnic en CSS:** `legacy-components.css` conté 126 regles buides (stubs) que enganyen les portes. El propi bundle ho reconeix.
- **Truncament del bundle:** Impedeix avaluar fitxers crítics com `tractor-vocabulari.mjs` (incomplet) i no es pot verificar el tancament.
- **Dependència de `legalContent.js`:** Si el fitxer no existeix, la pàgina legal fallarà. Cal confirmar-ne l'existència i, si és necessari, incloure'l a l'auditoria.

---

## 4. Anàlisi de seguretat

### 4.1. Punts forts
- **RLS activat** a `profiles`, `organizations`, `notes`, `xat_*`, `section_submissions`, etc.
- **Funcions `SECURITY DEFINER`** amb `search_path = ''` i permisos revocats acuradament.
- **Rate limiting** al xat (trigger `trg_rate_limit_xat`).
- **Consentiment RGPD** registrat a `consentiments` i filtrat a `membres_del_poble`.
- **Bucket `mitjans`** amb polítiques d'accés per carpeta d'usuari.

### 4.2. Riscos detectats
- **Política de `profiles`:** A `260915_0100_coalesce_superadmin.sql` s'amplia la lectura de perfils a membres del mateix poble. Això és una decisió de governança; cal assegurar que el text legal ho reflecteix.
- **Sessió a `sessionStorage`:** Més segur que `localStorage`, però vulnerable a XSS. Cal mantenir una CSP estricta.
- **Migracions solapades:** Diverses migracions modifiquen `handle_new_user` i `membres_del_poble`. Cal verificar que l'ordre d'execució siga l'correcte i que no queden versions antigues actives.
- **`legalContent.js` prohibit:** Si conté dades sensibles, la seua exclusió és correcta, però llavors la pàgina legal no es pot auditar.

---

## 5. Qualitat del codi i compliment de normes

- **Nomenclatura:** El bundle inclou fitxers amb noms termodinàmics (`260915_2330_BUNDLE_auditoria.md`) i compleix les regles d'`AGENTS.md`.
- **Frontmatter:** Els fitxers Markdown inclouen frontmatter v2 (`tipus`, `estat`, `description`).
- **Accessibilitat:** S'apliquen tokens de contrast, mides mínimes de 44px, etc.
- **Portes:** La majoria de scripts `tractor-*` estan presents i semblen funcionals, però **no es pot verificar `tractor-vocabulari.mjs` per truncament**.

---

## 6. Recomanacions

1. **Regenerar el bundle** sense truncament, assegurant que acaba amb `<<<FI_DEL_BUNDLE>>>` i que tots els fitxers del manifest estan sencers.
2. **Aclarir l'estat de `legalContent.js`:** Si existeix al repositori, incloure'l a l'auditoria (potser com a fitxer opcional); si no existeix, corregir `pageContent.js` per evitar errors.
3. **Completar la migració de `legacy-components.css`:** Eliminar les regles buides i actualitzar les portes perquè no admeten stubs.
4. **Revisar la política de privacitat** per reflectir la lectura de perfils entre membres del mateix poble.
5. **Documentar l'ordre correcte de les migracions** i verificar que totes s'apliquen en entornsnous.
6. **Considerar una simplificació** de l'ecosistema de portes: massa scripts poden tornar-se contraproduents si no es mantenen.

---

## 7. Conclusió

El bundle és **parcialment auditable**. La informació proporcionada és rica i mostra un projecte sòlid, amb una governança madura i un esforç notable per la seguretat i la coherència. No obstant això, **el truncament del document i l'absència de `legalContent.js`** impedeixen emetre un veredicte complet.

**Veredicte:** ⚠️ **APROVAT AMB RESERVES — CAL REGENERAR EL BUNDLE I ACLARIR LES ABSÈNCIES**

*Deepseek, Consell de la Petorreta*  
*15 de setembre de 2026*
