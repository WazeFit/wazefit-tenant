// Wrapper para garantir que node está no PATH do Turbopack
import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const nextBin = join(__dirname, "node_modules/.bin/next");

execSync(`${nextBin} dev`, {
  stdio: "inherit",
  cwd: __dirname,
  env: {
    ...process.env,
    PATH: `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH}`,
  },
});
