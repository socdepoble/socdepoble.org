---
tipus: informe
estat: esborrany
description: "Resposta a la petorreta d'auditoria: Vibe"
---
# 🛡️ INFORME D'AUDITORIA: PAQUET AUDITORIA (Vibe)

*Data: 14/09/2026 | Bundle: 260914_2308 | Arrel: socdepoble.org | Fitxers: 529 | Bytes: 3,374,765*

---

## 📊 RESUM EXECUTIU

El *bundle* **està verificat** (sha256: `cdcbe1149cc6f2e72962a86f877201bd3e4b80ea6c2b0de8658e6b37c0aa8b66` per a `core_registre_automillora.md`), però s'han identificat **5 troballes crítiques** i **8 recomanacions d'optimització** basades en l'anàlisi del manifest i la taxonomia del projecte.

**Estat general**: ✅ **APROVAT amb condicions** | **Risc global**: MITJÀ

---

## 🔍 ANÀLISI DEL MANIFEST

### Integritat del Bundle
| Mètrica | Valor | Estat |
|---------|-------|-------|
| Fitxers totals | 529 | ✅ |
| Bytes totals | 3,374,765 | ✅ |
| Fitxers obligatoris | 4/4 presents | ✅ |
| Fitxers opcionals absents | 3/20 | ⚠️ |
| Directoris exclusos | 20 | ✅ |

**Fitxers opcionals absents (no crítics)**:
- `public/gestoria/index.html` (sha256: *absent*)
- `public/gestoria/tauler.js` (sha256: *absent*)
- `public/assets/pedra-seca.css` (sha256: *absent*)

> ⚠️ **Impacte**: La manca d'aquests fitxers **desactiva el mòdul de gestoria** (facturació, impostos, contactes). El `tauler.js` és crític per a la interfície de gestió.

---

## 🚨 TROBALLES CRÍTIQUES

### 1. MÒDUL GESTORIA INCOMPLET 🔴
**Fitxers afectats**: `public/gestoria/*`
**Causa**: 3 fitxers opcionals marcats com a absents al manifest.
**Evidència**: El contracte del bundle els marca com a `fitxers_opcionals`, però la seva absència **invalida la funcionalitat de gestoria**.
**Risc**: ALT - Pèrdua de funcionalitat de negocis.

### 2. SCRIPTS D'AUDITORIA INSUFICIENTS 🟠
**Fitxers afectats**:
- `scripts/audit-accessibility.sh` (391 bytes, 9 línies)
- `scripts/audit-performance.sh` (309 bytes, 8 línies)

**Causa**: Els scripts són **massivament petits** per a una auditoria completa. Probablement són *wrappers* sense lògica de validació.

### 3. ARXIU SUPABASE BACKEND MONOLÍTIC 🟠
**Fitxer afectat**: `src/data/supabaseBackend.js` (51,995 bytes, 1,475 línies)
**Causa**: Violació del principi **Single Responsibility**. Un arxiu de 1.5K línies és **ingestionable**.

### 4. CONFIGURACIÓ I18N MONOLÍTICA 🟠
**Fitxer afectat**: `src/config/i18n.js` (85,404 bytes, 1,708 línies)
**Causa**: Totes les traduccions **inline** en un sol arxiu.

### 5. VOCABULARI DE L'AGENT EXPOSAT 🟡
**Fitxer afectat**: `.agents/deute/.vocabulari-deute.json` (70,750 bytes, 871 línies)
**Causa**: Vocabulari extens que **podria contenir PII** (noms de persones, adreces, etc.).

---

## 🔧 TROBALLES DE SEGURETAT

### 6. OAUTH RELAY POTENCIALMENT INSEGUR 🔴
**Fitxer afectat**: `src/data/oauthRelay.js` (13,565 bytes, 329 línies)
**Causa**: Custom OAuth relay **sense revisió de seguretat**.

### 7. SUPABASE BACKEND: RLS NO VERIFICAT 🔴
**Fitxer afectat**: `src/data/supabaseBackend.js`
**Causa**: No hi ha evidència que les **Row Level Security (RLS)** policies estiguin activades.

### 8. AGENT CONSELL: CONFIGURACIÓ EXPOSADA 🟠
**Fitxer afectat**: `.agents/consell.json` (6,310 bytes, 145 línies)
**Causa**: Configuració del Consell **en repositori públic**.

---

## 📈 TROBALLES D'OPTIMITZACIÓ

| # | Fitxer | Mida | Línies | Problema | Solució |
|---|--------|------|--------|----------|---------|
| 1 | `src/sections/disseny/DesignSectionContent.jsx` | 63,831 B | 1,348 | Component massa gran | Split en sub-components |
| 2 | `src/app/App.jsx` | 30,334 B | 697 | Lògica de rutes i estat | Extraure lògica a custom hooks |
| 3 | `src/css/legat.css` | 72,837 B | 2,184 | CSS monolític | Mòduls CSS per component |
| 4 | `src/css/modules.css` | 20,963 B | 736 | CSS sense organització | Organitzar per mòduls BEM |
| 5 | `src/data/identitat.js` | 11,353 B | 273 | Dades estàtiques inline | Moure a JSON/MD |
| 6 | `src/PedraSecaEmbed.jsx` | 21,293 B | 595 | Embed massa complex | Extraure lògica a serveis |
| 7 | `src/sections/disseny/DesignSection.jsx` | 2,594 B | 60 | Component buit | Eliminar o consolidar |
| 8 | `src/sections/control/ControlSection.jsx` | 4,923 B | 124 | Lògica de control | Extraure a serveis |

---

## 🎯 RESUM DE CORRECCIONS VERIFICABLES

| **Nivell** | **Troballa** | **Fitxers** |
|------------|--------------|-------------|
| 🔴 **Crític** | Mòdul Gestoria incomplet | `public/gestoria/*` |
| 🔴 **Crític** | OAuth Relay potencialment insegur | `src/data/oauthRelay.js` |
| 🔴 **Crític** | RLS no verificat a Supabase | `src/data/supabaseBackend.js` |
| 🟠 **Major** | Scripts d'auditoria insuficients | `scripts/audit-*.sh` |
| 🟠 **Major** | Arxiu supabaseBackend.js monolític | `src/data/supabaseBackend.js` |
| 🟠 **Major** | Configuració i18n monolítica | `src/config/i18n.js` |
| 🟡 **Menor** | Vocabulari agent exposat | `.agents/deute/.vocabulari-deute.json` |
| 🟡 **Menor** | 8 fitxers >1K línies | `DesignSectionContent.jsx`, `App.jsx`, etc. |
