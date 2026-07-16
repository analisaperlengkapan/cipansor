#!/usr/bin/env node
/**
 * Dependency vulnerability audit against npm's bulk advisory endpoint.
 *
 * `pnpm audit` (all versions up to 11.x) still calls the retired
 * `/-/npm/v1/security/audits` endpoint, which npm now answers with 410.
 * This script does what the npm CLI itself does: read the lockfile, POST
 * {name: [versions]} to `/-/npm/v1/security/advisories/bulk`, and match
 * the installed versions against each advisory's vulnerable range.
 *
 * Exit code 1 when any advisory at or above the threshold severity
 * (default: high) matches an installed version — same contract the old
 * `pnpm audit --prod --audit-level high` CI step had.
 *
 * Usage: node scripts/audit-deps.mjs [--audit-level low|moderate|high|critical]
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import semver from "semver";

const REGISTRY = process.env.NPM_REGISTRY_URL || "https://registry.npmjs.org";
const SEVERITY_RANK = { low: 0, moderate: 1, high: 2, critical: 3 };

const levelArgIdx = process.argv.indexOf("--audit-level");
const threshold =
  levelArgIdx !== -1 ? process.argv[levelArgIdx + 1] : "high";
if (!(threshold in SEVERITY_RANK)) {
  console.error(`Unknown --audit-level "${threshold}"`);
  process.exit(2);
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lockfile = parse(readFileSync(resolve(repoRoot, "pnpm-lock.yaml"), "utf8"));

// pnpm-lock v9: `packages:` keys look like "qs@6.14.1" or
// "@scope/name@1.2.3(peer@x)(...)" — strip the peer suffix, split on the
// last "@" to separate name from version.
const installed = new Map(); // name -> Set<version>
for (const key of Object.keys(lockfile.packages ?? {})) {
  const bare = key.replace(/\(.*$/, "");
  const at = bare.lastIndexOf("@");
  if (at <= 0) continue; // malformed or "@scope" with no version
  const name = bare.slice(0, at);
  const version = bare.slice(at + 1);
  if (!semver.valid(version)) continue;
  if (!installed.has(name)) installed.set(name, new Set());
  installed.get(name).add(version);
}

if (installed.size === 0) {
  console.error("No packages parsed from pnpm-lock.yaml — lockfile format change?");
  process.exit(2);
}

// The bulk endpoint accepts {name: [versions]}; chunk to keep requests sane.
const entries = [...installed.entries()].map(([n, v]) => [n, [...v]]);
const CHUNK = 400;
const findings = [];

for (let i = 0; i < entries.length; i += CHUNK) {
  const body = Object.fromEntries(entries.slice(i, i + CHUNK));
  const res = await fetch(`${REGISTRY}/-/npm/v1/security/advisories/bulk`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error(`Bulk advisory endpoint returned ${res.status}`);
    process.exit(2);
  }
  const advisories = await res.json();
  for (const [name, advs] of Object.entries(advisories)) {
    for (const adv of advs) {
      const range = adv.vulnerable_versions ?? "*";
      const hit = [...(installed.get(name) ?? [])].filter((v) =>
        semver.satisfies(v, range, { includePrerelease: true }),
      );
      if (hit.length > 0) {
        findings.push({
          name,
          versions: hit,
          severity: adv.severity ?? "unknown",
          title: adv.title,
          url: adv.url,
          range,
        });
      }
    }
  }
}

findings.sort(
  (a, b) => (SEVERITY_RANK[b.severity] ?? -1) - (SEVERITY_RANK[a.severity] ?? -1),
);

const failing = findings.filter(
  (f) => (SEVERITY_RANK[f.severity] ?? -1) >= SEVERITY_RANK[threshold],
);

console.log(
  `Audited ${installed.size} packages — ${findings.length} advisories matched installed versions.`,
);
for (const f of findings) {
  const marker =
    (SEVERITY_RANK[f.severity] ?? -1) >= SEVERITY_RANK[threshold] ? "✖" : "•";
  console.log(
    `${marker} [${f.severity}] ${f.name}@${f.versions.join(",")} (vulnerable: ${f.range})\n   ${f.title}\n   ${f.url}`,
  );
}

if (failing.length > 0) {
  console.error(
    `\n${failing.length} advisories at or above "${threshold}" — failing.`,
  );
  process.exit(1);
}
console.log(`\nNo advisories at or above "${threshold}".`);
