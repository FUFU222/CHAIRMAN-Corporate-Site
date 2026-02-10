#!/usr/bin/env node
/* eslint-disable no-console */
"use strict";

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const publicDir = path.join(projectRoot, "public_html");
const partialDir = path.join(projectRoot, "tools", "partials");

const HEADER_RE = /<header id="header">[\s\S]*?<\/header>/;
const FOOTER_RE = /<footer id="footer">[\s\S]*?<\/footer>/;

const variants = {
  home: {
    header: readPartial("header.home.html"),
    footer: readPartial("footer.home.html"),
  },
  inner: {
    header: readPartial("header.inner.html"),
    footer: readPartial("footer.inner.html"),
  },
  innerNews: {
    header: readPartial("header.inner.news.html"),
    footer: readPartial("footer.inner.html"),
  },
};

const targets = [
  { file: "index.html", variant: "home" },
  { file: "about-us.html", variant: "inner" },
  { file: "contact.html", variant: "inner" },
  { file: "news.html", variant: "innerNews" },
  { file: "news-detail.html", variant: "inner" },
  { file: "privacy.html", variant: "inner" },
  { file: "livapon.html", variant: "inner" },
];

const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const verbose = args.has("--verbose");

const updatedFiles = [];
const alreadySynced = [];

for (const target of targets) {
  const filePath = path.join(publicDir, target.file);
  const source = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  const partials = variants[target.variant];

  if (!partials) {
    throw new Error(`Unknown variant "${target.variant}" for ${target.file}`);
  }

  const withHeader = replaceSingleBlock(source, HEADER_RE, partials.header, target.file, "header");
  const withFooter = replaceSingleBlock(withHeader, FOOTER_RE, partials.footer, target.file, "footer");

  if (withFooter === source) {
    alreadySynced.push(target.file);
    continue;
  }

  updatedFiles.push(target.file);
  if (!checkOnly) {
    fs.writeFileSync(filePath, withFooter);
  }
}

if (checkOnly) {
  if (updatedFiles.length > 0) {
    console.error("Layout is not synchronized in:");
    for (const file of updatedFiles) {
      console.error(`- ${file}`);
    }
    process.exit(1);
  }
  console.log("All target files are synchronized.");
  process.exit(0);
}

if (updatedFiles.length === 0) {
  console.log("No changes. All target files are already synchronized.");
} else {
  console.log(`Synchronized ${updatedFiles.length} file(s):`);
  for (const file of updatedFiles) {
    console.log(`- ${file}`);
  }
}

if (verbose && alreadySynced.length > 0) {
  console.log("Already synchronized:");
  for (const file of alreadySynced) {
    console.log(`- ${file}`);
  }
}

function readPartial(fileName) {
  const filePath = path.join(partialDir, fileName);
  return fs.readFileSync(filePath, "utf8").trim().replace(/\r\n/g, "\n");
}

function replaceSingleBlock(content, pattern, replacement, fileName, label) {
  const matches = content.match(new RegExp(pattern.source, "g")) || [];
  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly 1 ${label} block in ${fileName}, but found ${matches.length}.`
    );
  }
  const block = matches[0];
  const indent = (block.match(/^([ \t]*)</) || ["", ""])[1];
  return content.replace(pattern, applyIndent(replacement, indent));
}

function applyIndent(block, indent) {
  return block
    .split("\n")
    .map((line) => (line ? `${indent}${line}` : line))
    .join("\n");
}
