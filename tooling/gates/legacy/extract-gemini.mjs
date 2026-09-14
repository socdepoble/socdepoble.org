import fs from 'fs';
import path from 'path';

const logPath = '/Users/javillinares/.gemini/antigravity-ide/brain/78dee114-d365-41ad-90a6-f255ba4f3cdf/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');

let lastUserMessage = '';
for (let i = lines.length - 1; i >= 0; i--) {
  try {
    const entry = JSON.parse(lines[i]);
    if (entry.type === 'USER_INPUT') {
      lastUserMessage = entry.content;
      break;
    }
  } catch (e) {
    // ignorar error silenciósament
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const blocks = [...lastUserMessage.matchAll(/### \d+\. `([^`]+)`[\s\S]*?```jsx\n([\s\S]*?)\n```/g)];

  console.log(`Trobats ${blocks.length} blocs de codi de Gemini`);

  for (const match of blocks) {
    const filePath = match[1];
    const code = match[2];
    const fullPath = path.resolve(process.cwd(), filePath);
    fs.writeFileSync(fullPath, code, 'utf8');
    console.log(`✓ Guardat: ${filePath}`);
  }
}
