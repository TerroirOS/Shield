import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const workspacePolicy = [
  {
    dir: "apps/api",
    name: "@terroiros/shield-api",
    allowedWorkspaceDeps: ["@terroiros/connectors", "@terroiros/domain"]
  },
  {
    dir: "apps/worker",
    name: "@terroiros/shield-worker",
    allowedWorkspaceDeps: []
  },
  {
    dir: "apps/dashboard",
    name: "@terroiros/shield-dashboard",
    allowedWorkspaceDeps: ["@terroiros/ui"]
  },
  {
    dir: "packages/domain",
    name: "@terroiros/domain",
    allowedWorkspaceDeps: []
  },
  {
    dir: "packages/connectors",
    name: "@terroiros/connectors",
    allowedWorkspaceDeps: ["@terroiros/domain"]
  },
  {
    dir: "packages/ui",
    name: "@terroiros/ui",
    allowedWorkspaceDeps: []
  }
];

const workspaceByName = new Map(workspacePolicy.map((workspace) => [workspace.name, workspace]));
const allowedExtensions = new Set([".ts", ".tsx", ".mts", ".cts"]);

async function collectFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === "dist" || entry.name === "node_modules" || entry.name === ".next") {
      continue;
    }

    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(entryPath)));
      continue;
    }

    if (allowedExtensions.has(path.extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
}

function collectImports(source) {
  const imports = [];
  const importPattern =
    /\bfrom\s+["']([^"']+)["']|\bimport\s*\(\s*["']([^"']+)["']\s*\)|\brequire\s*\(\s*["']([^"']+)["']\s*\)/g;

  let match;
  while ((match = importPattern.exec(source)) !== null) {
    const specifier = match[1] ?? match[2] ?? match[3];
    if (specifier) {
      imports.push(specifier);
    }
  }

  return imports;
}

function normalizeRelativeTarget(filePath, specifier) {
  const resolvedPath = path.resolve(path.dirname(filePath), specifier);
  return resolvedPath;
}

function declaredWorkspaceDeps(packageJson) {
  return new Set(
    Object.keys({
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.peerDependencies ?? {})
    }).filter((dependencyName) => workspaceByName.has(dependencyName))
  );
}

function formatWorkspaceDeps(workspaceDeps) {
  return workspaceDeps.length === 0 ? "(none)" : workspaceDeps.join(", ");
}

async function main() {
  const errors = [];
  const lines = ["Shield workspace boundary audit", ""];

  for (const workspace of workspacePolicy) {
    const workspaceRoot = path.join(repoRoot, workspace.dir);
    const packageJsonPath = path.join(workspaceRoot, "package.json");
    const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
    const declaredDeps = declaredWorkspaceDeps(packageJson);
    const expectedDeps = new Set(workspace.allowedWorkspaceDeps);

    for (const dep of expectedDeps) {
      if (!declaredDeps.has(dep)) {
        errors.push(`${workspace.name}: missing workspace dependency declaration for ${dep}`);
      }
    }

    for (const dep of declaredDeps) {
      if (!expectedDeps.has(dep)) {
        errors.push(`${workspace.name}: package.json declares disallowed workspace dependency ${dep}`);
      }
    }

    const files = await collectFiles(workspaceRoot);
    const importedWorkspaceDeps = new Set();

    for (const filePath of files) {
      const source = await readFile(filePath, "utf8");
      const imports = collectImports(source);

      for (const specifier of imports) {
        if (specifier.startsWith(".")) {
          const target = normalizeRelativeTarget(filePath, specifier);
          const relativeTarget = path.relative(workspaceRoot, target);
          if (relativeTarget.startsWith("..") || path.isAbsolute(relativeTarget)) {
            errors.push(
              `${path.relative(repoRoot, filePath)}: relative import escapes workspace boundary (${specifier})`
            );
          }
          continue;
        }

        if (!specifier.startsWith("@terroiros/")) {
          continue;
        }

        const [workspaceDepName] = specifier.split("/", 2);
        const normalizedName =
          specifier.split("/").length >= 2 ? `${specifier.split("/")[0]}/${specifier.split("/")[1]}` : specifier;

        if (!workspaceByName.has(normalizedName)) {
          errors.push(`${path.relative(repoRoot, filePath)}: imports unknown workspace package ${specifier}`);
          continue;
        }

        if (specifier !== normalizedName) {
          errors.push(
            `${path.relative(repoRoot, filePath)}: imports workspace subpath ${specifier}; use package root exports instead`
          );
          continue;
        }

        if (normalizedName === workspace.name) {
          continue;
        }

        importedWorkspaceDeps.add(normalizedName);
        if (!expectedDeps.has(normalizedName)) {
          errors.push(`${path.relative(repoRoot, filePath)}: imports disallowed workspace dependency ${normalizedName}`);
        }
      }
    }

    for (const dep of importedWorkspaceDeps) {
      if (!declaredDeps.has(dep)) {
        errors.push(`${workspace.name}: source imports ${dep} but package.json does not declare it`);
      }
    }

    lines.push(`${workspace.name}`);
    lines.push(`  workspace: ${workspace.dir}`);
    lines.push(`  allowed deps: ${formatWorkspaceDeps([...expectedDeps])}`);
    lines.push(`  declared deps: ${formatWorkspaceDeps([...declaredDeps])}`);
    lines.push(`  imported deps: ${formatWorkspaceDeps([...importedWorkspaceDeps].sort())}`);
    lines.push("");
  }

  if (errors.length > 0) {
    console.error(lines.join("\n"));
    console.error("Boundary audit failed:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(lines.join("\n"));
  console.log("Boundary audit passed.");
}

await main();
