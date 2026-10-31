/* Pla 261027_1154 (P1-61) · Les opcions d'urlSocialDe al client: l'origen
   públic (origenPublic) només si és https (el de dev, http://localhost, cau a
   socdepoble.org, ORIGEN_SOCIAL_PER_DEFECTE), la base del Supabase de la capa
   del paquet, per a les fotos del bucket públic, i cap origen de tercers
   permés.
   Ordre del Mestre (30-10-2026, prompt 2208; SEO-CRIT-02) · Viu ací, en
   config/, i no a TextSection.jsx: PluginPage, DesignSection i ConsolaSection
   passen la seua portada pel mateix selector i, important-la d'un component,
   /disseny arrossegava 15 chunks (~83 KB) que no pinta. Mòdul pur: només
   origenPublic i capaDelPaquet, cap React ni cap secció (ho vigila
   opcionsImatgeSocial.test.js). */
import { origenPublic } from './origenPublic.js';
import { capaDelPaquet } from './capaDelPaquet.js';

export function opcionsDeLaImatgeSocial() {
  const origen = origenPublic();
  return {
    ...(/^https:\/\//i.test(String(origen || '')) ? { origen } : null),
    supabaseUrl: capaDelPaquet().supabaseUrl,
    permesos: []
  };
}
