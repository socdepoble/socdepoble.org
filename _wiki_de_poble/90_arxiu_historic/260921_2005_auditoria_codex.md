---
type: informe
status: canonic
description: Informe d'auditoria local del cervell realitzat per Codex (ChatGPT).
tags:
  - auditoria
  - codex
  - brain
---

# Auditoria del cervell de Sóc de Poble (per Codex)

**El principal deute és humà: el sistema obliga Javi a recordar, interpretar i reconciliar instruccions que les IA haurien de trobar clares.** La Wiki conserva coneixement valuós, però encara no proporciona una autoritat coherent: conviuen normes incompatibles, arquitectura antiga i garanties que els mecanismes actuals no demostren.

La identitat rural, la història i les metàfores tenen valor. El problema apareix quan substituïxen una instrucció precisa, una evidència o una decisió.

**Contenció respectada:** només lectura local i comprovacions en memòria. Cap fitxer modificat, cap cerca web, cap neteja executada. L’informe queda ací perquè la prohibició explícita d’escriure entra en conflicte amb el lliurament a l’Escriptori.

**Abast:** les 17 skills, el catàleg, documentació de les carpetes operatives, les 19 actes, l’Escriptori i mecanismes de càrrega i validació. El recompte estructural cobreix **105 Markdown de Wiki i 18 de skills, inclòs l’índex**. Els 27 Markdown d’arxiu històric s’han inventariat, però **no certifique una revisió paràgraf per paràgraf d’eixe arxiu ni de les carpetes ocultes**.

## 1. Troballes prioritàries

### Alta — Hi ha diverses autoritats incompatibles

La Constitució situa l’autoritat executiva en les skills. La skill d’identitat es posa per damunt de la Constitució. La petorreta demana que el cervell siga la Wiki. Altres pàgines remeten a directoris de governança antics.

També es contradiuen els destins:

- Constitució: treball a l’Escriptori; prohibides noves generacions a la safata d’entrada.
- Identitat: els únics destins vàlids són precisament la safata i l’arxiu.
- Estudi de mercat: lliurament a Producció, reservada a ús humà.

**Proposta:** una sola jerarquia documentada, amb excepcions explícites per a lectura, treball autoritzat i operacions destructives. Cap skill ha de declarar-se superior a la persona que governa el projecte.

### Alta — L’acte reflex conté una via de retorn al passat

Documentació i reflex ordena consultar `protocolledge.json`, però immediatament imposa una plantilla dins d’un bootstrap amb UUID fix.

**La còpia encara existeix.** Això permet carregar una font de sessió en lloc de la plantilla vigent.

A més, he reproduït esta resolució:

| Petició | Protocols seleccionats |
|---|---|
| «auditoria local del cervell amb trellat» | `prompt.local`, `auditoria`, `skill` |
| «revisar un informe» | `auditoria`, `estudi_ia` |

El resolver selecciona per paraules clau; no utilitza les condicions `quan` del registre.

**Proposta:** seleccionar explícitament intenció i destinatari, carregar una plantilla principal i declarar les lectures complementàries. «Trellat» no ha d’activar per si mateix la creació d’una skill.

### Alta — El carregador barreja normes i antecedents

El compilador del context global incorpora Markdown de les carpetes seleccionades i elimina el frontmatter sense filtrar l’estat.

Això afecta documents com el registre d’automillora, marcat `arxivat`, i pàgines amb annexos històrics. Algunes advertències continuen al cos, però es perd la classificació estructurada.

**Proposta:** separar sempre:

- normes aprovades;
- coneixement consultiu;
- plantilles;
- esborranys;
- antecedents.

Una nota recuperada no es convertix en instrucció de sistema pel fet d’haver-la concatenada.

### Alta — Una ruta configurada bloqueja la validació documental

`DESTINS_CANONICS.json` declara `00_Bandeja_d_Entrada`; al disc existeix `00_bandeja_d_entrada`.

La comprovació retorna:

```text
Capitalització no canònica: _wiki_de_poble/04_escriptori/00_Bandeja_d_Entrada
```

El hook valida tots els destins abans de continuar amb una escriptura Markdown a la Wiki. Per tant, esta discrepància pot bloquejar també un lliurament correcte a l’Escriptori.

**Proposta:** rutes canòniques amb capitalització exacta i una prova que recórrega totes les configurades.

### Alta — «Dormir» no acredita haver consolidat coneixement

La skill de cicle de vida combina conservar documents útils amb retirar-los tots en tancar. També proposa esborrar actes antigues quan es considere absorbit el contingut.

El Somiador reconeix que la destil·lació no està implementada: confia que l’agent l’haja feta o la faça després. Mou fitxers sense comprovar que cada informe haja estat integrat. Si falla el reancoratge, imprimeix l’error i continua fins al missatge final de consolidació.

**Proposta:** retirar l’arxivament general del tancament ordinari. Cada moviment ha de tindre una justificació, destí, comprovació de col·lisions i referències actualitzades. Un informe pendent continua a la taula.

### Alta — El contracte documental varia segons qui el llija

El schema vigent només exigix `description`. La guia d’auditoria i la skill de frontmatter exigixen també `type` i `status`.

Altres divergències:

- descripció màxima de 140 caràcters al schema, 220 a la plantilla de skill;
- `eines_obligatories` definit com a text, però utilitzat com a llista;
- noms de fins a sis paraules en una skill, de huit a vint en la plantilla d’acta;
- documents que encara prescriuen `tipus` i `estat`.

Comprovació dels **123 Markdown** esmentats:

| Incidència | Documents |
|---|---:|
| Sense frontmatter | 7 |
| Amb etiquetes fora del vocabulari del schema | 29 |
| Descripció fora de 12–140 caràcters | 9 |
| Estat fora de l’enumeració | 3 |
| Text literal `\n#` | 24 |

Són comprovacions concretes, no una validació completa de totes les regles del schema. **El catàleg de skills, en canvi, coincidix amb el disc.**

### Alta — Pedra Seca dona ordres visuals contradictòries

UniversalPage prescriu radis literals i ombres decoratives. Pedra Seca restringix les ombres a usos funcionals i exigix tokens.

La plantilla de branding encara assigna el taronja a l’acció principal, mentre la skill actual assigna eixa funció al blau.

**Proposta:** un contracte visual amb tokens i variants identificades. Les excepcions de UniversalPage han d’estar aprovades i representades allí, sense dependre de quina pàgina es carregue primer.

## 2. Dictamen de les 17 skills

Les propostes següents corresponen al directori de skills. Retirar una skill significa retirar-la del conjunt operatiu després de conservar-ne el coneixement útil.

| Skill | Dictamen |
|---|---|
| `core-identitat` | **Conservar i reduir.** Missió, llengua i conducta. Traure quotes, cens duplicat, destins contradictoris i notes subjectives de context. |
| `core-consell-i-colmena` | **Conservar i reescriure.** Separar cens, coordinació i capacitats observades. Traure percentatges de quota i terminis relatius del text permanent. |
| `core-context-panic` | **Conservar i corregir.** Aturar l’acció que falla; conservar evidència i preparar relleu. Dos errors no demostren necessàriament degradació del context ni obliguen sempre a canviar de xat. |
| `core-memoria-historica` | **Separar procediment i coneixement.** Les lliçons visuals pertanyen al seu contracte. Retirar l’obligació d’escriure automàticament una regla després de qualsevol correcció. |
| `core-restauracio-segellada` | **Conservar separada.** Té una funció concreta i proteccions útils. Cal contrastar les garanties de restauració amb proves dels executors. |
| `sdp-workflow` | **Conservar com a coordinadora.** Corregir l’autoreferència com a manual de disseny i les rutes antigues. La investigació externa ha de respectar el mode local. |
| `wiki-cicle-de-vida` | **Fusionar el workflow duplicat amb `sdp-workflow`.** Extraure un procediment curt de tancament i arxiu sense purgues generals. |
| `wiki-documentacio-i-reflex` | **Conservar com a procediment documental.** Eliminar UUIDs fixos, resoldre plantilles i formalitzar el relleu entre IA. |
| `wiki-guardia-frontmatter` | **Fusionar amb el procediment documental.** La comprovació l’ha de fer un validador; una declaració de supremacia no substituïx el codi. |
| `wiki-propagar-veritat` | **Retirar la versió actual i substituir-la.** El reemplaçament global pot alterar història i exemples; l’exemple inclòs substituïx una expressió per ella mateixa. Cal una migració amb abast i revisió semàntica. |
| `sdp-pedra-seca` | **Conservar.** Convertir-la en entrada al contracte visual i les comprovacions, amb excepcions explícites. |
| `sdp-universal-page` | **Conservar com a referència especialitzada.** Resoldre contradiccions visuals i compartir la regla de composició amb la graella. |
| `sdp-app-grid-shell` | **Conservar especialitzada.** Evitar repetir la jerarquia de UniversalPage. Concretar comportament mòbil, focus i proves de replegament. |
| `sdp-casos-us-essencials` | **Traslladar a coneixement de producte.** Menjar, cures i agricultura són requisits valuosos, però no constituïxen un procediment executable. |
| `sdp-calendari-agricola` | **Traslladar a especificació de producte.** Conservar el mock de SMS i els límits de dades; afegir territori, fonts agràries, consentiment i criteris d’acceptació. |
| `sdp-estudi-mercat` | **Conservar sota demanda.** Distingir observació d’inferència sobre competidors i corregir el lliurament a Producció. |
| `wiki-busca-skills` | **Conservar sota demanda.** Una referència externa es proposa i s’avalua abans d’entrar al cervell. No activar-la per a qualsevol problema complex. |

**Evitaria una fusió gegant:** carregaria encara més context irrellevant. La separació útil és entre procediments, especificacions de producte i referències tècniques.

## 3. Poda de la Wiki amb trellat

### Retirar del context operatiu
- **Annexos antics de l’estàndard UI universal.** Contenen ordres incompatibles amb la introducció vigent. Conservar-los com a antecedents separats.
- **Forja de la PWA, afirmacions de Dexie i `vite-plugin-pwa`.** El manifest actual no declara estes dependències. El text no pot continuar presentant-les com a pila vigent.
- **Registre d’automillora arxivat.** Ha de quedar fora de la càrrega normativa, amb les lliçons aprovades referenciades individualment.
- **Catàleg copiat de plugins d’Obsidian.** És material de consulta. No acredita quins plugins estan instal·lats ni per què.
- **Quotes i disponibilitat de models.** Són observacions temporals, no doctrina permanent.
- **Garanties de “100%”, estalvis de tokens sense mesura i puntuacions subjectives.** Substituir-les per resultats amb abast, data i evidència.

### Reescriure amb prioritat
| Document o conjunt | Canvi proposat |
|---|---|
| Identitat, visió, projecte i ànima | Conservar la història; establir una pàgina principal i evitar repetir regles tècniques. |
| Antigravity | Descriure’l com un entorn d’execució substituïble. La identitat del projecte no pot dependre d’un proveïdor. |
| Perfil psiquiàtric | Conservar preferències de comunicació i senyals operatius. Retirar diagnòstics simulats, “memòria infinita” i percentatges sense proves. |
| Anatomia cognitiva | Mantindre-la com a explicació opcional; cada metàfora ha d’enllaçar al mecanisme real. |
| Governança i protocols tècnics | Actualitzar rutes, ordres disponibles i jerarquia. Hi ha diverses taxonomies antigues coexistint. |
| Integració React/Sollutia | Resoldre la discrepància entre backend injectat i l’ADR del Model B, que el restringix. |
| Logos oficials | Substituir placeholders per recursos verificats i eliminar blocs de logos duplicats a les plantilles. |
| Taula Mestra | Canviar les consultes `estat`/`tipus` als camps vigents i oferir un índex llegible sense Dataview. |
| Plantilla d’acta | Registrar fets, decisions, evidències i següent pas. L’estat humà només si la persona el manifesta; eliminar elogis i estalvis imaginaris. |
| Plans legal i econòmic | Separar propostes, acords acreditats i dades pendents de verificar. Els terminis antics no poden aparéixer com a finestres obertes. |
| Protocols de recuperació | Conservar les parts concretes sobre còpies, comprovació, reversió i errors explícits. |

### Enllaços i etiquetes
- Rutes explícites quan el nom no siga únic.
- Índexs per navegar; enllaços temàtics per explicar relacions.
- Reparar el destí; no eliminar una frase sencera perquè conté un enllaç trencat.
- **Taxonomia proposada:** `type`, `status`, Carpeta, `tags`, `aliases`.

## 4. Tractors cognitius i independència entre IA

1. **Entrada comuna:** objectiu, intenció, destinatari, mode de lectura o escriptura i resultat esperat.
2. **Resolució determinista:** plantilla principal, procediments aplicables i fonts necessàries.
3. **Manifest:** rutes, versions, hashes, vigència i motiu de selecció.
4. **Validació prèvia:** cap font obligatòria absent, plantilla arxivada ni conflicte conegut sense resoldre.
5. **Operació acotada:** autorització vinculada als efectes reals, independent de la personalitat de la IA.
6. **Validació del resultat:** schema, contingut requerit, enllaços i criteris d’acceptació.
7. **Rebut honest:** què s’ha comprovat, què ha fallat i què queda pendent.

| Prova necessària | Resultat esperat |
|---|---|
| Plantilla absent o arxivada | Error explícit; sense recuperar una còpia antiga |
| Tasca d’auditoria amb la paraula «trellat» | No activar creació de skills |
| Font modificada després de preparar context | Invalidar el rebut afectat |
| Auditoria en mode lectura | Cap escriptura, inclosos tancament i registre |
| Eina o adaptador desconegut | No atribuir-li garanties inexistents |
| Document amb esquema antic | Rebuig explicat o migració explícita |
| Informe pendent durant el tancament | Conservar-lo accessible |
| Mateixa tasca en tres entorns | Mateixes fonts i criteris; diferències declarades |

Per al **cervell compartit**, recomane que la Wiki continga els originals aprovats dels procediments i que les skills siguen projeccions generades. Això requerix una migració de governança.

## 5. Reunió davall l’Olivera i R+D

He contrastat els informes presents a l’Escriptori. **No hi he trobat un pla actual de MarIA per a esta nova auditoria del cervell.** No atribuïsc a Claude els informes que no n’identifiquen l’autoria.

Del dictamen de fortificació conservaria la distinció entre avisos, infraccions i comprovacions incompletes. Discrepe del criteri que tracta qualsevol warning com a fals verd.

### Handoff inter-IA
Cada relleu ha de contindre: objectiu, estat, decisions, troballes, comprovacions, següent pas, desacords.

### «Cuestióname»
Les dues decisions principals pendents són:
1. **Wiki com a original dels procediments o skills originals indexades per la Wiki?**
2. **Qualsevol IA autoritzada pot executar, o es manté MarIA com a executora exclusiva?**

### Ordre de treball proposat
1. Resoldre autoritat, destins i contracte documental.
2. Corregir el resolver i retirar la ruta temporal fixa.
3. Separar context normatiu, consultiu i històric.
4. Reescriure tancament i consolidació amb conservació dels pendents.
5. Aplicar les fusions de skills i la poda documental.
6. Verificar el mateix cas de relleu en cada entorn.
