import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");
const sourceFixturePath = path.join(rootDir, "tests", "fixtures", "microcms-knowhow.json");

function runBuild(extraEnv = {}) {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

  return execFileSync(npmCommand, ["run", "build"], {
    cwd: rootDir,
    env: {
      ...process.env,
      ...extraEnv
    },
    stdio: "pipe",
    encoding: "utf8"
  });
}

test("build normalizes CMS inline figures so article images use rich text figure styling hooks", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "chairman-article-enhancements-"));
  const fixturePath = path.join(tempDir, "microcms-knowhow.json");
  const fixture = JSON.parse(fs.readFileSync(sourceFixturePath, "utf8"));

  fixture.contents[0].content =
    '<p>導入です。</p><h2>改善の見方</h2><figure><img src="https://images.example.com/article-inline.png" alt="" width="1600" height="900"></figure><p>本文です。</p>';

  fs.writeFileSync(fixturePath, JSON.stringify(fixture));

  runBuild({
    CI: "",
    MICROCMS_SERVICE_DOMAIN: "",
    MICROCMS_API_KEY: "",
    MICROCMS_ENDPOINT: "blog",
    MICROCMS_FIXTURE_PATH: fixturePath
  });

  const html = fs.readFileSync(
    path.join(distDir, "sns-marketing", "sns-short-video-playbook", "index.html"),
    "utf8"
  );

  assert.match(
    html,
    /<figure class="rich-text__figure"><img src="https:\/\/images\.example\.com\/article-inline\.png" alt="" width="1600" height="900"><\/figure>/
  );
});
