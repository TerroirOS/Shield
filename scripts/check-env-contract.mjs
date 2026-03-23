import fs from "node:fs";
import path from "node:path";

import { parseEnvFile, requiredKeys, validateEntries } from "./env-contract.mjs";

const repoRoot = process.cwd();
const envExamplePath = path.join(repoRoot, ".env.example");
const envPath = path.join(repoRoot, ".env");

if (!fs.existsSync(envExamplePath)) {
  console.error(".env.example is missing. Cannot validate Shield environment contract.");
  process.exit(1);
}

const exampleEntries = parseEnvFile(envExamplePath, fs);
const exampleResult = validateEntries(exampleEntries, ".env.example");

if (!exampleResult.ok) {
  console.error("Shield environment contract failed for .env.example.");
  for (const problem of exampleResult.problems) {
    console.error(`- ${problem}`);
  }
  process.exit(1);
}

const missingFromExample = requiredKeys().filter((key) => !(key in exampleEntries));
if (missingFromExample.length > 0) {
  console.error(".env.example does not include the full Shield environment contract.");
  for (const key of missingFromExample) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

if (fs.existsSync(envPath)) {
  const envEntries = parseEnvFile(envPath, fs);
  const envResult = validateEntries(envEntries, ".env");

  if (!envResult.ok) {
    console.error("Shield environment contract failed for .env.");
    for (const problem of envResult.problems) {
      console.error(`- ${problem}`);
    }
    process.exit(1);
  }
}

console.log("Shield environment contract verified.");
console.log(`- Required keys: ${requiredKeys().length}`);
console.log(`- .env.example: valid`);
console.log(`- .env: ${fs.existsSync(envPath) ? "valid" : "not present (skipped)"}`);
