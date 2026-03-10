import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MARKDOWN_FILES = [];
const SKIP_DIRS = new Set([".git", "node_modules"]);

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith(".md")) MARKDOWN_FILES.push(full);
  }
}

function stripAnchor(link) {
  return link.split("#")[0].split("?")[0];
}

function existsWithIndex(p) {
  if (fs.existsSync(p)) return true;
  const indexPath = path.join(p, "index.md");
  return fs.existsSync(indexPath);
}

walk(ROOT);

const markdownLinkRegex = /\[[^\]]*\]\(([^)]+)\)/g;
const failures = [];

for (const file of MARKDOWN_FILES) {
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(markdownLinkRegex)) {
    const raw = (match[1] || "").trim();
    if (!raw || raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("mailto:") || raw.startsWith("#")) {
      continue;
    }

    const target = stripAnchor(raw);
    if (!target) continue;

    const resolved = path.resolve(path.dirname(file), target);
    if (!existsWithIndex(resolved)) {
      failures.push(`${path.relative(ROOT, file)} -> ${raw}`);
    }
  }
}

if (failures.length > 0) {
  console.error("Broken local markdown links found:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Local markdown link check passed (${MARKDOWN_FILES.length} files).`);
