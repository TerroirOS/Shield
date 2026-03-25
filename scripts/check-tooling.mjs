import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();

const packageLocations = {
  typescript: [
    path.join(repoRoot, "node_modules", "typescript", "package.json")
  ],
  tsx: [
    path.join(repoRoot, "node_modules", "tsx", "package.json")
  ],
  next: [
    path.join(repoRoot, "node_modules", "next", "package.json"),
    path.join(repoRoot, "apps", "dashboard", "node_modules", "next", "package.json")
  ],
  react: [
    path.join(repoRoot, "node_modules", "react", "package.json"),
    path.join(repoRoot, "apps", "dashboard", "node_modules", "react", "package.json")
  ],
  "react-dom": [
    path.join(repoRoot, "node_modules", "react-dom", "package.json"),
    path.join(repoRoot, "apps", "dashboard", "node_modules", "react-dom", "package.json")
  ]
};

const missingPackages = Object.entries(packageLocations)
  .filter(([, candidates]) => candidates.every((candidatePath) => !fs.existsSync(candidatePath)))
  .map(([packageName]) => packageName);

if (missingPackages.length > 0) {
  console.error("Shield workspace tooling is incomplete.");
  console.error(`Missing cached packages: ${missingPackages.join(", ")}`);
  console.error("Run npm install in an environment with registry access or a warm local npm cache, then retry.");
  process.exit(1);
}

console.log("Shield workspace tooling check passed.");
