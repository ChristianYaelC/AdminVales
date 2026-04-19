import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT_FILE = path.join(ROOT, "PROJECT_CONTEXT.md");
const TREE_MAX_DEPTH = 4;

const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  ".vscode",
]);

const IMPORTANT_PATHS = [
  "README.md",
  "GUIA_INSTALACION.md",
  "INICIO_RAPIDO.md",
  "docs/especificacion-proyecto.md",
  "docs/base-datos-supabase.md",
  "supabase/schema.sql",
  "src/main.jsx",
  "src/App.jsx",
  "src/pages/ValesPage.jsx",
  "src/pages/BancoPage.jsx",
  "src/pages/ConfiguracionPage.jsx",
  "src/context/ClientsContext.jsx",
  "src/domain/personal/paymentDates.js",
  "package.json",
  "vite.config.js",
  "tailwind.config.js",
];

const MANUAL_START = "<!-- MANUAL_NOTES_START -->";
const MANUAL_END = "<!-- MANUAL_NOTES_END -->";

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  try {
    const text = await fs.readFile(filePath, "utf8");
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function formatList(items) {
  if (!items || items.length === 0) {
    return "- (none)";
  }
  return items.map((item) => `- ${item}`).join("\n");
}

async function readDirectoryTree(dirPath, depth = 0) {
  if (depth > TREE_MAX_DEPTH) {
    return [];
  }

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const filtered = entries
    .filter((entry) => !IGNORE_DIRS.has(entry.name))
    .sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

  const lines = [];

  for (const entry of filtered) {
    const prefix = "  ".repeat(depth);
    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      lines.push(`${prefix}- ${entry.name}/`);
      if (depth < TREE_MAX_DEPTH) {
        const childLines = await readDirectoryTree(entryPath, depth + 1);
        lines.push(...childLines);
      }
    } else {
      lines.push(`${prefix}- ${entry.name}`);
    }
  }

  return lines;
}

async function collectImportantFileStatus() {
  const lines = [];

  for (const relativePath of IMPORTANT_PATHS) {
    const absolutePath = path.join(ROOT, relativePath);
    const exists = await pathExists(absolutePath);
    lines.push(`- ${relativePath}: ${exists ? "present" : "missing"}`);
  }

  return lines.join("\n");
}

function extractManualNotes(existingContent) {
  if (!existingContent) {
    return "- Add project-specific notes here.\n- This section is preserved across regenerations.";
  }

  const start = existingContent.indexOf(MANUAL_START);
  const end = existingContent.indexOf(MANUAL_END);

  if (start === -1 || end === -1 || end <= start) {
    return "- Add project-specific notes here.\n- This section is preserved across regenerations.";
  }

  const raw = existingContent.slice(start + MANUAL_START.length, end).trim();
  return raw || "- Add project-specific notes here.";
}

function renderMarkdown({ pkg, treeLines, importantFileStatus, manualNotes }) {
  const dependencies = Object.keys(pkg?.dependencies || {}).sort();
  const devDependencies = Object.keys(pkg?.devDependencies || {}).sort();
  const scripts = Object.entries(pkg?.scripts || {}).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  const scriptsMd =
    scripts.length > 0
      ? scripts.map(([name, command]) => `- ${name}: \`${command}\``).join("\n")
      : "- (none)";

  return `# PROJECT_CONTEXT\n\nThis file is generated automatically to provide a compact, AI-friendly snapshot of the project.\n\n## Metadata\n\n- Generated at: ${new Date().toISOString()}\n- Project name: ${pkg?.name || "unknown"}\n- Version: ${pkg?.version || "unknown"}\n- Private: ${String(pkg?.private ?? "unknown")}\n- Package manager: npm\n\n## Tech Stack\n\n- Runtime: Node.js\n- Frontend: React + Vite\n- Styling: Tailwind CSS\n- Testing: Vitest\n- Backend (optional): Supabase\n\n## NPM Scripts\n\n${scriptsMd}\n\n## Dependencies\n\n${formatList(dependencies)}\n\n## Dev Dependencies\n\n${formatList(devDependencies)}\n\n## File Tree (depth <= ${TREE_MAX_DEPTH})\n\n${treeLines.length > 0 ? treeLines.join("\n") : "- (empty)"}\n\n## Important Files Check\n\n${importantFileStatus}\n\n## Quick Analysis Notes\n\n- This project currently has documentation in README and docs/ for setup and architecture details.\n- Supabase schema lives in supabase/schema.sql.\n- Domain utilities for personal payment date logic are in src/domain/personal/.\n\n## Manual Notes (preserved)\n\n${MANUAL_START}\n${manualNotes}\n${MANUAL_END}\n\n## Update Workflow\n\n- Manual refresh: \`npm run context:update\`\n- Continuous refresh while coding: \`npm run context:watch\`\n- Recommended for commits: run \`npm run context:update\` before commit, so this file always reflects latest state.\n`;
}

async function main() {
  const packageJsonPath = path.join(ROOT, "package.json");
  const pkg = await readJson(packageJsonPath);

  if (!pkg) {
    throw new Error("Could not read package.json. Run this script from project root.");
  }

  let existing = "";
  if (await pathExists(OUTPUT_FILE)) {
    existing = await fs.readFile(OUTPUT_FILE, "utf8");
  }

  const manualNotes = extractManualNotes(existing);
  const treeLines = await readDirectoryTree(ROOT, 0);
  const importantFileStatus = await collectImportantFileStatus();
  const markdown = renderMarkdown({
    pkg,
    treeLines,
    importantFileStatus,
    manualNotes,
  });

  await fs.writeFile(OUTPUT_FILE, markdown, "utf8");
  console.log("PROJECT_CONTEXT.md updated.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});