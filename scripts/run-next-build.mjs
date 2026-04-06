import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const nextBin = new URL("../apps/dashboard/node_modules/next/dist/bin/next", import.meta.url);

const child = spawn(process.execPath, [fileURLToPath(nextBin), "build"], {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_IGNORE_INCORRECT_LOCKFILE: "1"
  }
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
