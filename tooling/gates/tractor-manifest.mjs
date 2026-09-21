import { catalegCLI } from '../brain/cataleg_skills.mjs';
if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = catalegCLI();
}
