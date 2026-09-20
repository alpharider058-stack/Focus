import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const spawnOptions = { stdio: "inherit", shell: process.platform === "win32" };
const server = spawn(npmCommand, ["run", "server"], spawnOptions);
const expoArgs = process.argv.slice(2);
const expo = spawn(npmCommand, ["run", "start", "--", ...expoArgs], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

function stop() {
  server.kill();
  expo.kill();
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
expo.on("exit", (code) => {
  stop();
  process.exit(code ?? 0);
});
