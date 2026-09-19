/* eslint-disable no-restricted-imports */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Falten variables d'entorn VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY a .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Aquest script transforma les URLs absolutes de Supabase fossilitzades a la BD a referències opaques.
// Només afecta a les taules on escrivim (notes i app_content). 
// Ho movem a 'sdp-media://mitjans/...' ja que actualment tot resideix al bucket 'mitjans'.
async function migrar() {
  console.log("Iniciant migració d'URLs absolutes a referències opaques...");
  const searchPattern = `${supabaseUrl}/storage/v1/object/public/`;
  
  // 1. Migrar Notes
  let { data: notes, error: errNotes } = await supabase.from('notes').select('id, hero_image, content');
  if (errNotes) {
    console.error("Error obtenint notes:", errNotes);
    return;
  }
  
  let notesUpdated = 0;
  for (const note of notes) {
    let changed = false;
    let newHero = note.hero_image;
    let newContent = note.content;

    if (newHero && typeof newHero === 'string' && newHero.includes(searchPattern)) {
      newHero = newHero.replace(searchPattern, 'sdp-media://');
      changed = true;
    }

    if (newContent && typeof newContent === 'string' && newContent.includes(searchPattern)) {
      newContent = newContent.split(searchPattern).join('sdp-media://');
      changed = true;
    }

    if (changed) {
      const { error: updErr } = await supabase.from('notes').update({ hero_image: newHero, content: newContent }).eq('id', note.id);
      if (updErr) {
        console.error(`Error actualitzant nota ${note.id}:`, updErr);
      } else {
        notesUpdated++;
      }
    }
  }
  console.log(`Notes actualitzades: ${notesUpdated}`);

  // 2. Migrar app_content (mur)
  let { data: appContents, error: errApp } = await supabase.from('app_content').select('id, payload');
  if (errApp) {
    console.error("Error obtenint app_content:", errApp);
    return;
  }

  let appContentUpdated = 0;
  for (const item of appContents) {
    let payloadStr = JSON.stringify(item.payload);
    if (payloadStr.includes(searchPattern)) {
      payloadStr = payloadStr.split(searchPattern).join('sdp-media://');
      const newPayload = JSON.parse(payloadStr);
      const { error: updErr } = await supabase.from('app_content').update({ payload: newPayload }).eq('id', item.id);
      if (updErr) {
        console.error(`Error actualitzant app_content ${item.id}:`, updErr);
      } else {
        appContentUpdated++;
      }
    }
  }
  console.log(`App content actualitzat: ${appContentUpdated}`);
  console.log("Migració completada!");
}

migrar();
