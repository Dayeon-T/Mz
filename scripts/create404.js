import { copyFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";

async function ensureSpaFallback() {
  const distDir = resolve("dist");
  const indexFile = resolve(distDir, "index.html");
  const fallbackFile = resolve(distDir, "404.html");

  try {
    await access(indexFile, constants.F_OK | constants.R_OK);
  } catch (error) {
    console.error(
      "[create404] dist/index.html을 읽을 수 없습니다. 먼저 `npm run build`를 실행하세요."
    );
    process.exitCode = 1;
    return;
  }

  try {
    await copyFile(indexFile, fallbackFile);
    console.info(
      "[create404] dist/404.html을 생성했습니다. SPA 라우팅 404 문제를 방지합니다."
    );
  } catch (error) {
    console.error("[create404] 404.html 생성에 실패했습니다:", error);
    process.exitCode = 1;
  }
}

ensureSpaFallback();
