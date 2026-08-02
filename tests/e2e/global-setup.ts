import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { join } from "node:path";

import next from "next";

function buildApplication() {
  const nextCli = join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const build = spawn(process.execPath, [nextCli, "build"], { stdio: "inherit" });

  return new Promise<void>((resolve, reject) => {
    build.once("error", reject);
    build.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Next.js build exited with code ${code} and signal ${signal}.`));
    });
  });
}

export default async function globalSetup() {
  await buildApplication();

  const app = next({ dev: false, hostname: "127.0.0.1", port: 3000 });
  const handle = app.getRequestHandler();

  await app.prepare();

  const server = createServer((request, response) => {
    void handle(request, response);
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(3000, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });

  return async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await app.close();
  };
}
