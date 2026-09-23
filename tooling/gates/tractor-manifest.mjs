import { pathToFileURL } from 'node:url';
import { catalegCLI } from '../brain/cataleg_skills.mjs';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = catalegCLI();
}
