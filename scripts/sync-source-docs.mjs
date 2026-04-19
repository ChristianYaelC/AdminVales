import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT = process.cwd();
const CONTEXT_FILE = path.join(ROOT, "PROJECT_CONTEXT.md");

const DOC_FILES = [
  "README.md",
  "GUIA_INSTALACION.md",
  "INICIO_RAPIDO.md",
  "docs/especificacion-proyecto.md",
  "docs/base-datos-supabase.md",
];

const BLOCK_START = "<!-- AUTO_SYNC_BLOCK:START -->";
const BLOCK_END = "<!-- AUTO_SYNC_BLOCK:END -->";
const SCHEMA_FILE = path.join(ROOT, "supabase/schema.sql");

function runNodeScript(scriptRelativePath) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptRelativePath], {
      cwd: ROOT,
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${scriptRelativePath} failed with code ${code}`));
      }
    });
  });
}

function extractSection(markdown, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`## ${escaped}\\r?\\n\\r?\\n([\\s\\S]*?)(?=\\r?\\n## |\\s*$)`);
  const match = markdown.match(regex);
  return match ? match[1].trim() : "- (section not found)";
}

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function writeIfChanged(filePath, content) {
  let current = "";
  if (await fileExists(filePath)) {
    current = await fs.readFile(filePath, "utf8");
  }

  if (current === content) {
    return false;
  }

  await fs.writeFile(filePath, content, "utf8");
  return true;
}

function buildManagedBlock(contextMarkdown) {
  const scripts = extractSection(contextMarkdown, "NPM Scripts");
  const importantFiles = extractSection(contextMarkdown, "Important Files Check");
  const fileTree = extractSection(contextMarkdown, "File Tree (depth <= 4)");
  const schemaSnapshot = extractSchemaSnapshot();

  return [
    BLOCK_START,
    "## Resumen Auto-Sync",
    "",
    "Este bloque se actualiza automaticamente desde PROJECT_CONTEXT.md.",
    "",
    "### NPM Scripts",
    "",
    scripts,
    "",
    "### Important Files Check",
    "",
    importantFiles,
    "",
    "### File Tree Snapshot",
    "",
    fileTree,
    "",
    "### SQL Snapshot (supabase/schema.sql)",
    "",
    schemaSnapshot,
    BLOCK_END,
  ].join("\n");
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function extractMatches(text, regex, groupIndex = 1) {
  const matches = [];
  for (const match of text.matchAll(regex)) {
    const value = match[groupIndex]?.trim();
    if (value) {
      matches.push(value);
    }
  }
  return uniqueSorted(matches);
}

function extractSchemaSnapshot() {
  try {
    const schema = fsSync.readFileSync(SCHEMA_FILE, "utf8");
    const tables = extractMatches(
      schema,
      /create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi
    );
    const types = extractMatches(
      schema,
      /create\s+type\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-zA-Z0-9_]+)/gi
    );
    const functions = extractMatches(
      schema,
      /create\s+or\s+replace\s+function\s+(?:public\.)?([a-zA-Z0-9_]+)/gi
    );

    return [
      "- Tables:",
      ...(tables.length ? tables.map((t) => `  - ${t}`) : ["  - (none detected)"]),
      "- Types:",
      ...(types.length ? types.map((t) => `  - ${t}`) : ["  - (none detected)"]),
      "- Functions:",
      ...(functions.length ? functions.map((f) => `  - ${f}`) : ["  - (none detected)"]),
    ].join("\n");
  } catch {
    return "- Schema file unavailable.";
  }
}

function applyManagedBlock(documentText, blockText) {
  const start = documentText.indexOf(BLOCK_START);
  const end = documentText.indexOf(BLOCK_END);

  if (start !== -1 && end !== -1 && end > start) {
    const before = documentText.slice(0, start).trimEnd();
    const after = documentText.slice(end + BLOCK_END.length).trimStart();
    return `${before}\n\n${blockText}\n\n${after}`.trimEnd() + "\n";
  }

  return `${documentText.trimEnd()}\n\n${blockText}\n`;
}

async function main() {
  await runNodeScript("scripts/update-project-context.mjs");

  const contextMarkdown = await fs.readFile(CONTEXT_FILE, "utf8");
  const managedBlock = buildManagedBlock(contextMarkdown);

  let updated = 0;

  for (const relativePath of DOC_FILES) {
    const absolutePath = path.join(ROOT, relativePath);
    if (!(await fileExists(absolutePath))) {
      continue;
    }

    const current = await fs.readFile(absolutePath, "utf8");
    const next = applyManagedBlock(current, managedBlock);
    const changed = await writeIfChanged(absolutePath, next);
    if (changed) {
      updated += 1;
      console.log(`Updated: ${relativePath}`);
    }
  }

  console.log(`Source docs sync complete. Files updated: ${updated}.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});