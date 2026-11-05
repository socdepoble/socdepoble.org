---
type: document
status: actiu
description: "Dades públiques de prova del Node 0: vectors Ed25519 de l'RFC 9421, document públic de l'actor i receptor TLS efímer en loopback; cap credencial ni clau privada."
---
# Dades públiques de prova de l'RFC 9421

Aquest directori conté dades públiques de prova. El vector i la clau Ed25519
de l'RFC9421 B.1.4/B.2.6 són públics i només s'utilitzen en proves; no són
credencials d'accés ni la clau privada del Node 0. Vegeu LICENSE_RFC_CODE_COMPONENTS.txt.

node0-actor-public.json és el document públic retornat per
GET https://socdepoble.cat/ap/actors/socdepoble el 2026-11-04T17:40:00.939Z.
El cos HTTP original tenia 779 bytes i SHA256
4f2e59a5263e7b460ee7a31ce9a4ad4448a24401da25aff553653029a3b5375e.
La còpia JSON amb format preserva els mateixos valors. Només conté material
públic; la seua empremta Ed25519 DER és
f6f561a5180e9f3da8c1c6ee8064b5475232e0ce06ba645d02566903ac5e1e11.

wire-tls.fixture.mjs executa un receptor independent exclusivament a
127.0.0.1 en un port efímer, amb certificat TLS efímer i socket injectat.
No connecta ni publica a Mastodon. Retorna captures amb metadades per al TAP;
no escriu evidències en l'arbre de fonts. El transport HTTPS canònic es llig,
no es modifica.

## Vincles

- [[00_index]]
