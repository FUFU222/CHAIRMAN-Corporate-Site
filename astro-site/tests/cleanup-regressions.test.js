import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const rootDir = process.cwd();
const distDir = path.join(rootDir, "dist");

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

function readBuiltCss() {
  const cssDir = path.join(distDir, "_astro");
  const cssFiles = fs
    .readdirSync(cssDir)
    .filter((file) => file.endsWith(".css"))
    .map((file) => path.join(cssDir, file));

  return cssFiles.map((file) => fs.readFileSync(file, "utf8")).join("\n");
}

test("legacy unused Astro-only files have been removed", () => {
  const removedPaths = [
    path.join(rootDir, "src", "components", "OfficerModal.astro"),
    path.join(rootDir, "src", "scripts", "officer-modal.js"),
    path.join(rootDir, "src", "assets", "images", "teamMemberImage8.jpg"),
    path.join(rootDir, "public", ".DS_Store")
  ];

  removedPaths.forEach((targetPath) => {
    assert.equal(fs.existsSync(targetPath), false, `${targetPath} should not remain in astro-site`);
  });
});

test("legacy unused fields have been removed from shared data contracts", () => {
  const siteSource = fs.readFileSync(path.join(rootDir, "src", "data", "site.ts"), "utf8");
  const teamSource = fs.readFileSync(path.join(rootDir, "src", "data", "team.ts"), "utf8");
  const typesSource = fs.readFileSync(path.join(rootDir, "src", "lib", "types.ts"), "utf8");

  assert.equal(siteSource.includes("shortName:"), false);
  assert.equal(teamSource.includes("summary:"), false);
  assert.equal(typesSource.includes("summary: string;"), false);
});

test("built CSS no longer ships legacy unused selector groups", () => {
  runBuild({
    CI: "",
    MICROCMS_SERVICE_DOMAIN: "",
    MICROCMS_API_KEY: "",
    MICROCMS_ENDPOINT: "blog"
  });

  const css = readBuiltCss();
  const deadSelectors = [
    ".officers__grid",
    ".officer-card",
    ".officer-dialog",
    ".profile-grid",
    ".profile-card",
    ".project-grid",
    ".project-card",
    ".split-section"
  ];

  deadSelectors.forEach((selector) => {
    assert.equal(css.includes(selector), false, `${selector} should not remain in built CSS`);
  });
});
