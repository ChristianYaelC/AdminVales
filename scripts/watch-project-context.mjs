import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const IGNORE_DIRS = [".git", "node_modules", "dist"];
const DEBOUNCE_MS = 800;

let timer = null;
let running = false;
let rerunRequested = false;

function shouldIgnore(targetPath) {
  const normalized = targetPath.split(path.sep);
  return IGNORE_DIRS.some((segment) => normalized.includes(segment));
}

function runUpdate() {
  if (running) {
    rerunRequested = true;
    return;
  }

  running = true;
  const child = spawn(process.execPath, ["scripts/sync-source-docs.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });

  child.on("exit", () => {
    running = false;
    if (rerunRequested) {
      rerunRequested = false;
      runUpdate();
    }
  });
}

function scheduleUpdate(reason) {
  if (timer) {
    clearTimeout(timer);
  }

  timer = setTimeout(() => {
    console.log(`Detected changes (${reason}). Regenerating PROJECT_CONTEXT.md...`);
    runUpdate();
  }, DEBOUNCE_MS);
}

function watchDirectory(dirPath) {
  if (shouldIgnore(dirPath)) {
    return;
  }

  fs.watch(dirPath, { recursive: false }, (eventType, filename) => {
    if (!filename) {
      scheduleUpdate("unknown file");
      return;
    }

    const fullPath = path.join(dirPath, filename.toString());
    if (shouldIgnore(fullPath)) {
      return;
    }

    scheduleUpdate(`${eventType}: ${fullPath}`);
  });

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      watchDirectory(path.join(dirPath, entry.name));
    }
  }
}

console.log("Starting context watcher...");
runUpdate();
watchDirectory(ROOT);
console.log("Watching for file changes. Press Ctrl+C to stop.");