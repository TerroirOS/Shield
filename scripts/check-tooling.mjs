import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

const requiredRootPackages = [
  "typescript",
  "tsx",
  "next",
  "react",
  "react-dom",
];

const missingPackages = requiredRootPackages.filter((packageName) => {
  return !fs.existsSync(path.join(repoRoot, "node_modules", packageName, "package.json"));
});

if (missingPackages.length > 0) {
  console.error("Shield workspace tooling is incomplete.");
  console.error(`Missing cached packages: ${missingPackages.join(", ")}`);
  console.error("Run npm install in an environment with registry access or a warm local npm cache, then retry.");
  process.exit(1);
}

console.log("Shield workspace tooling check passed.");
