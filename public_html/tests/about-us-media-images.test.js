const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const aboutUsHtml = fs.readFileSync(
  path.join(__dirname, "..", "about-us.html"),
  "utf8",
);

test("About us media section uses media_Image1.jpg for 旅んちゅLife", () => {
  assert.match(
    aboutUsHtml,
    /<img src="\.\/images\/media_Image1\.jpg" alt="旅んちゅLife"/,
  );
  assert.doesNotMatch(
    aboutUsHtml,
    /<img src="\.\/images\/teamMemberImage1\.jpg" alt="旅んちゅLife"/,
  );
});

test("About us media section uses media_Image2.webp for Mr.Tokyo", () => {
  assert.match(
    aboutUsHtml,
    /<img src="\.\/images\/media_Image2\.webp" alt="Mr\.Tokyo"/,
  );
  assert.doesNotMatch(
    aboutUsHtml,
    /<img src="\.\/images\/mr_tokyo_image\.webp" alt="Mr\.Tokyo"/,
  );
});
