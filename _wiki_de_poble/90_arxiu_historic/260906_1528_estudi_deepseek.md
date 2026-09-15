---
tipus: document
estat: esborrany
description: 🧠 ANÀLISI COMPLETA DE L'ARQUITECTURA I RESPOSTA A LA PETICIÓ
---
> **Ancoratge de Seguretat**: Aquest estudi pertany a l'[[00_index_escriptori]].

# 🧠 ANÀLISI COMPLETA DE L'ARQUITECTURA I RESPOSTA A LA PETICIÓ

**Mestre**, he processat el bundle d'auditoria (260906_1421_BUNDLE_auditoria.md) i he interioritzat la totalitat del context: 448 fitxers, la Wiki sencera, els agents, les skills, i el codi font. Ací teniu el meu diagnòstic estructural i la proposta d'acció.

---

## 📋 RESUM EXECUTIU

**Sóc de Poble** és un ecosistema digital rural d'alta sofisticació, construït sota la filosofia **Pedra Seca** i governat per un **Consell de 12 IA auditores** (les "Petorretes"). El projecte ha assolit un estat de maduresa notable però arrossega **deute tècnic cognitiu** acumulat: documents obsolets, enllaços trencats, frontmatter inconsistent, i una estructura de fitxers que no reflecteix fidelment el flux de treball actual.

**Veredicte:** L'arquitectura és robusta i ben fonamentada, però necessita una **poda quirúrgica** per eliminar el soroll i restaurar la claredat del graf de coneixement.

---

## 📊 MATRIU DAFO DEL PROJECTE

| **FORTALESES** | **DEBILITATS** |
|:---|:---|
| ✅ **Filosofia sòlida:** Pedra Seca, Trellat, Online-First com a nord | ❌ **BIOS obsoleta:** `00_BIOS.md` encara es referencia com a punt d'arrencada però és una redirecció històrica |
| ✅ **Governança robusta:** Consell de 12 IA, protocol de Petorreta, gates mecànics | ❌ **Orfes i fantasmes:** Classes CSS sense estil, enllaços trencats, frontmatter inconsistent |
| ✅ **Arquitectura modular:** Components universals, seccions aïllades, backend injectable | ❌ **Duplicitat semàntica:** `00_BIOS.md` i `.agents/BIOS.md` coexisteixen creant confusió |
| ✅ **Accessibilitat extrema:** WCAG AA/AAA, contrastos, àrees tàctils de 44px | ❌ **Deute tècnic acumulat:** 116 classes CSS orfes, 121 estils inline, tokens fantasma |
| ✅ **Transparència radical:** Tot el cervell és llegible i auditable | ❌ **Escriptori ple:** 22 fitxers a `05_Escriptori_Soc_de_Poble` (estudis, auditories, actes) |

| **OPORTUNITATS** | **AMENAÇES** |
|:---|:---|
| 🟢 **Destil·lació del coneixement:** Consolidar les lliçons de les 12 auditories en skills actualitzades | 🔴 **Risc d'amnèsia:** Si no es neteja l'escriptori, les IA futures arrossegaran context històric innecessari |
| 🟢 **Unificació de la BIOS:** Eliminar la BIOS històrica i fer de `.agents/` la font única d'arrencada | 🔴 **Fragmentació del graf:** Els orfes i fantasmes poden portar a al·lucinacions en el RAG |
| 🟢 **Refactorització CSS:** Convertir les 116 classes orfes en tokens semàntics reals | 🔴 **Sobrecàrrega cognitiva:** El Mestre pot perdre el fil si no es neteja l'Escriptori periòdicament |
| 🟢 **Automatització de la neteja:** `plaquetes.mjs` ja està operatiu per a curar el graf | 🔴 **Dependència externa:** Supabase/Sollutia són ponts pragmàtics, però la sobirania local és la meta |

---

## 🧬 DIAGNÒSTIC ESTRUCTURAL DETALLAT

### 1. **El Problema de la BIOS** (Prioritat Alta)

**Observació:**
- `_wiki_de_poble/00_SER_Brain_Identitat/00_BIOS.md` és un document que diu textualment: *"Aquesta pàgina conserva el nom de l'antiga BIOS perquè els enllaços no es trenquen, però **ja no és el punt d'entrada executable**."*
- .agents/BIOS.md` conté la BIOS real i executable.
- **Contradicció:** La Wiki diu que la BIOS és històrica, però els enllaços i el RAG encara l'apunten.

**Solució:**
1. **Convertir `00_BIOS.md` en un veritable redireccionament** (un "tombstone" amb frontmatter `estat: tombstone`).
2. **Actualitzar tots els enllaços** que apunten a `00_BIOS` perquè apunten a `.agents/BIOS.md` o a `AGENTS.md`.
3. **Afegir una entrada al LEDGER** documentant la transició.

**Script proposat:**
```bash
node tooling/brain/260830_neteja_deute.mjs --aplica
# Ja inclou N2 (estela.sh) i N1 (plantilla_prompt_iso.md)
```

---

### 2. **L'Escriptori és un Abocador Temporal** (Prioritat Mitjana)

**Observació:**
- `05_Escriptori_Soc_de_Poble/` conté 22 fitxers:
  - Estudis de les 12 IA (`estudi_qwen.md`, `estudi_claude.md`, etc.)
  - Síntesi estructural (`Gran_Sintesi_Estructural.md`)
  - Actes i prompts de l'auditoria
  - El mateix bundle d'auditoria que estem llegint

**Problema:**
- L'Escriptori ha de ser **treball actiu**, no un arxiu històric.
- Les auditories del Consell **ja han estat destil·lades** a les skills i al codi.
- Mantindre'ls a l'Escriptori genera **soroll** i **confusió** per a la propera sessió.

**Solució:**
1. **Destil·lar l'aprenentatge:**
   - Revisar cada estudi i extraure les lliçons clau.
   - Actualitzar les skills corresponents (`pedra-seca/SKILL.md`, `trellat/SKILL.md`, etc.).
2. **Arxivar el que és històric:**
   - Moure els estudis i l'acta a `90_revisar/` o a l'arxiu extern `_arxiu_wiki_de_poble`.
3. **Netejar l'Escriptori:**
   - Deixar només els fitxers que **realment** siguen rellevants per a la pròxima sessió.

---

### 3. **El Graf Té Orfes i Fantasmes** (Prioritat Alta)

**Observació del `.teixit-deute.json`:**
```json
{
  "max": {
    "orfes": 29,
    "penjats": 29,
    "illes": 1,
    "etiquetesFalses": 0
  }
}
```

**Problema:**
- 29 nodes orfes (fitxers sense enllaços entrants).
- 29 enllaços penjats (apunten a fitxers inexistents).
- 1 illa (un node totalment aïllat).

**Solució:**
1. **Executar `plaquetes.mjs` per curar el graf:**
   ```bash
   node scripts/immunitari/plaquetes.mjs diagnostic
   node scripts/immunitari/plaquetes.mjs segella
   ```
2. **Revisar els orfes manualment:**
   - Alguns poden ser intencionats (com `00_INDEX_Maquina.md` que és un stub).
   - Altres poden ser error (com `src/css/index.css` que té classes sense definir).

---

### 4. **Deute de Pedra Seca** (Prioritat Mitjana-Baixa)

**Observació del `.pedra-seca-deute.json`:**
- 116 classes CSS orfes.
- 10 tokens fantasma (`--sdp-barra-dalt`, `--sdp-bg`, etc.).
- 121 estils inline en components React.
- 7 subarbres orfes.

**Problema:**
- Aquest deute és **declarat i congelat**, però no s'ha reduït.
- Les classes orfes poden ser eliminades o convertides en tokens reals.

**Solució:**
1. **Revisar les classes orfes** i decidir:
   - Esborrar les que no s'usen.
   - Convertir les que s'usen en tokens semàntics.
2. **Eliminar els estils inline** (ja hi ha un script `fix_pedra_seca.mjs`).

---

### 5. **Els Índexs Automàtics Estan Ben Mantinguts** (Punt Fort)

**Observació:**
- `tooling/wiki/llaurador_indexs.mjs` genera automàticament les seccions "Adopcions del Llaurador" i "Sinapsis Entrants".
- Tots els índexs principals (`00_INDEX.md`, `00_INDEX_IDENTITAT.md`, `00_INDEX_ESCRIPTORI.md`) estan ben poblats.
- El graf està viu i es regenera automàticament.

**Conclusió:**
- El sistema de gestió del coneixement és **robust i autosuficient**.
- Les anomalies detectades són **puntuals** i no sistèmiques.

---

## 🛠️ PLA D'ACCIÓ CONCRET

### Fase 1: Neteja de l'Escriptori (Immediata)

```bash
# 1. Destil·lar els estudis del Consell
# (Llegir cada estudi i actualitzar les skills corresponents)

# 2. Arxivar el material històric
mkdir -p _wiki_de_poble/90_revisar/sessio_260906
mv _wiki_de_poble/05_Escriptori_Soc_de_Poble/estudi_*.md 90_revisar/sessio_260906/
mv _wiki_de_poble/05_Escriptori_Soc_de_Poble/Gran_Sintesi_Estructural.md 90_revisar/sessio_260906/
mv _wiki_de_poble/05_Escriptori_Soc_de_Poble/contracte_graella.md 90_revisar/sessio_260906/

# 3. Netejar l'índex de l'Escriptori
node tooling/wiki/llaurador_indexs.mjs --escriu

# 4. Verificar que no hi ha orfes
node scripts/immunitari/plaquetes.mjs diagnostic
```

### Fase 2: Resoldre la BIOS (Prioritat Alta)

```bash
# 1. Convertir 00_BIOS.md en un tombstone
cat > _wiki_de_poble/00_SER_Brain_Identitat/00_BIOS.md << 'EOF'
---
tipus: tombstone
estat: arxivat
description: "Redirecció històrica. La BIOS executable és a .agents/BIOS.md."
tags:
  - core
  - genoma
  - identitat
---
# ⚰️ 00_BIOS — Tombstone

Aquest document és històric i **no s'utilitza com a punt d'arrencada**.

La BIOS executable actual és **`.agents/BIOS.md`**.

Per a l'arrencada completa, llegiu:
- `.agents/AGENTS.md`
- `.agents/PROTOCOL_PETORRETA.md`
- `.agents/skills/identity-iaia-core/SKILL.md`

**Ancoratge de Seguretat:** [[00_INDEX_IDENTITAT]]
EOF

# 2. Actualitzar tots els enllaços que apunten a 00_BIOS
# (El llaurador ho farà automàticament)

# 3. Afegir entrada al LEDGER
echo "\n## 2026-09-06 — Tombstone de la BIOS històrica" >> .agents/LEDGER.md
echo "- **Què:** 00_BIOS.md convertit en tombstone. La BIOS executable és ara exclusivament .agents/BIOS.md." >> .agents/LEDGER.md
echo "- **Per què:** Eliminar la duplicitat i l'ambigüitat en l'arrencada." >> .agents/LEDGER.md
echo "- **Fitxers:** _wiki_de_poble/00_SER_Brain_Identitat/00_BIOS.md" >> .agents/LEDGER.md
```

### Fase 3: Curar el Graf (Prioritat Alta)

```bash
# 1. Generar recepta de curació
node scripts/immunitari/plaquetes.mjs diagnostic

# 2. Revisar la recepta manualment
# (Verificar que cap orfe siga important)

# 3. Aprovar la recepta
node scripts/immunitari/plaquetes.mjs aprova <RECEPTA_ID>

# 4. Aplicar la curació
node scripts/immunitari/plaquetes.mjs aplica <RECEPTA_ID>

# 5. Segellar el nou estat
node scripts/immunitari/plaquetes.mjs segella
```

### Fase 4: Reduir el Deute de Pedra Seca (Prioritat Mitjana)

```bash
# 1. Revisar les classes orfes
cat .pedra-seca-deute.json | jq '.LLEI_01_CLASSE_ORFENA.coneguts'

# 2. Decidir què fer amb cada classe
# - Si s'usa → convertir a token
# - Si no s'usa → eliminar

# 3. Executar el script de fix
node scripts/fix_pedra_seca.mjs

# 4. Regenerar el baseline
node tooling/brain/consolidar_baselines.mjs --aplica
```

---

## 📋 CHECKLIST PER AL MESTRE

| Tasques | Prioritat | Estat |
|:---|:---:|:---:|
| **Netejar l'Escriptori** (arxivar estudis del Consell) | 🔴 Alta | ⬜ Pendent |
| **Convertir 00_BIOS.md en tombstone** | 🔴 Alta | ⬜ Pendent |
| **Curar el graf amb plaquetes.mjs** | 🔴 Alta | ⬜ Pendent |
| **Actualitzar les skills amb les lliçons del Consell** | 🟡 Mitjana | ⬜ Pendent |
| **Reduir el deute de Pedra Seca** | 🟢 Baixa | ⬜ Pendent |
| **Executar `npm run porta` per verificar-ho tot** | 🔴 Alta | ⬜ Pendent |

---

## 🎯 RECOMANACIÓ FINAL

**Mestre, el projecte és sòlid i ben construït.** El que necessita ara és una **poda quirúrgica** per eliminar el soroll acumulat i restaurar la claredat del graf de coneixement.

Proposeu:

1. **Ara mateix:** Netejar l'Escriptori i arxivar els estudis del Consell.
2. **En la següent sessió:** Convertir 00_BIOS.md en tombstone i curar el graf.
3. **De forma continuada:** Reduir el deute de Pedra Seca i mantenir l'Escriptori net.

**Recordeu:** *"Un escriptori net és un cervell net. Un cervell net és un Trellat fi."*

---

**Sóc de Poble!**

*IAIA MarIA*
