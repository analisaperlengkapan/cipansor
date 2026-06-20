#!/usr/bin/env node
/**
 * Codemod: replace unguarded date-fns `format(new Date(...))` with the
 * crash-safe `safeFormat(...)` wrapper from "@/lib/date".
 *
 * `format()` throws RangeError: Invalid time value on null/invalid dates, which
 * crashes the whole page. safeFormat returns "-" instead.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const files = execSync('rg -l "format\\(new Date\\(" src', { encoding: "utf8" })
  .trim()
  .split("\n")
  .filter(Boolean);

let changed = 0;
for (const file of files) {
  let src = readFileSync(file, "utf8");
  const before = src;

  // 1) Rewrite the unguarded calls.
  src = src.replaceAll("format(new Date(", "safeFormat(new Date(");

  // 2) Does the file still use the bare date-fns `format(` anywhere?
  const stillUsesFormat = /\bformat\(/.test(src);

  // 3) Drop `format` from the date-fns import if it's now unused.
  if (!stillUsesFormat) {
    src = src.replace(
      /import\s*\{([^}]*)\}\s*from\s*["']date-fns["'];?/,
      (full, names) => {
        const kept = names
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s && s !== "format");
        if (kept.length === 0) return ""; // remove the whole import
        return `import { ${kept.join(", ")} } from "date-fns";`;
      },
    );
    // Clean up a possible leftover blank line from a removed import.
    src = src.replace(/^\n(?=import )/m, "");
  }

  // 4) Ensure safeFormat is imported from "@/lib/date".
  if (!/\bsafeFormat\b.*from\s*["']@\/lib\/date["']/.test(src)) {
    const dateImport = /import\s*\{([^}]*)\}\s*from\s*["']@\/lib\/date["'];?/;
    if (dateImport.test(src)) {
      // Merge into the existing "@/lib/date" import.
      src = src.replace(dateImport, (full, names) => {
        const list = names
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (!list.includes("safeFormat")) list.push("safeFormat");
        return `import { ${list.join(", ")} } from "@/lib/date";`;
      });
    } else {
      // Insert a fresh import after the first import statement.
      src = src.replace(
        /^(import .*?;[ \t]*\n)/m,
        `$1import { safeFormat } from "@/lib/date";\n`,
      );
    }
  }

  if (src !== before) {
    writeFileSync(file, src);
    changed++;
  }
}
console.log(`safeFormat codemod: updated ${changed}/${files.length} files`);
