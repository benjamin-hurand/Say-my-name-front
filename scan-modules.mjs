// scan-modules.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const root = process.cwd();
const nmDir = path.join(root, "node_modules");

// heuristiques de classification
function classify(pkgJson, pkgPath) {
  const main = pkgJson.main || "";
  const moduleField = pkgJson.module || "";
  const type = pkgJson.type || ""; // "module" => ESM par défaut
  const exportsField = pkgJson.exports;

  const hasESMHints =
    type === "module" ||
    moduleField ||
    (typeof exportsField === "string" && exportsField.endsWith(".mjs")) ||
    (exportsField && typeof exportsField === "object" && (
      "import" in exportsField ||
      // conditions modernes (exports: { ".": { "import": "...", "require": "..." } })
      Object.values(exportsField).some(v => v && typeof v === "object" && ("import" in v))
    ));

  const hasCJSHints =
    type !== "module" && (
      (main && (main.endsWith(".cjs") || main.endsWith(".js"))) ||
      (exportsField && typeof exportsField === "object" && (
        "require" in exportsField ||
        Object.values(exportsField).some(v => v && typeof v === "object" && ("require" in v))
      )) ||
      (!exportsField && !moduleField) // vieux schéma CJS avec "main" uniquement
    );

  if (hasESMHints && hasCJSHints) return "DUAL";
  if (hasESMHints) return "ESM";
  if (hasCJSHints) return "CJS";
  return "UNKNOWN";
}

function readJSON(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function* walkNodeModules(dir, depth = 0, maxDepth = 4) {
  // on évite de descendre trop profond pour garder ça rapide
  if (depth > maxDepth) return;
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    if (e.name === ".bin") continue;

    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name.startsWith("@")) {
        // scope: @types, @mui, @tsparticles, etc.
        yield* walkNodeModules(full, depth + 1, maxDepth);
      } else {
        const pkgJsonPath = path.join(full, "package.json");
        if (fs.existsSync(pkgJsonPath)) {
          yield full;
        }
        // descendre dans ses node_modules internes si présents
        const nested = path.join(full, "node_modules");
        if (fs.existsSync(nested)) {
          yield* walkNodeModules(nested, depth + 1, maxDepth);
        }
      }
    }
  }
}

function uniqBy(arr, keyFn) {
  const seen = new Set();
  const out = [];
  for (const x of arr) {
    const k = keyFn(x);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(x);
    }
  }
  return out;
}

function run() {
  if (!fs.existsSync(nmDir)) {
    console.error("node_modules introuvable. Lance d’abord: npm install");
    process.exit(1);
  }

  const rows = [];
  for (const pkgPath of walkNodeModules(nmDir)) {
    const pkgJson = readJSON(path.join(pkgPath, "package.json"));
    if (!pkgJson || !pkgJson.name || !pkgJson.version) continue;

    const kind = classify(pkgJson, pkgPath);

    rows.push({
      name: pkgJson.name,
      version: pkgJson.version,
      kind,
      main: pkgJson.main || "",
      module: pkgJson.module || "",
      type: pkgJson.type || "",
      hasExports: !!pkgJson.exports,
      path: pkgPath
    });
  }

  const unique = uniqBy(rows, r => `${r.name}@${r.version}`);

  // tri: CJS puis DUAL puis UNKNOWN puis ESM (pour voir les coupables en haut)
  unique.sort((a, b) => {
    const rank = v => ({ CJS: 0, DUAL: 1, UNKNOWN: 2, ESM: 3 }[v.kind] ?? 9);
    const ra = rank(a), rb = rank(b);
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name);
  });

  // sortie CSV simple
  const header = "name,version,kind,type,main,module,hasExports,path";
  const lines = unique.map(r =>
    [
      r.name,
      r.version,
      r.kind,
      r.type,
      r.main.replaceAll(",", " "),
      r.module.replaceAll(",", " "),
      r.hasExports,
      r.path.replaceAll(",", " ")
    ].join(",")
  );
  const csv = [header, ...lines].join("\n");
  const outPath = path.join(root, "cjs-esm-inventory.csv");
  fs.writeFileSync(outPath, csv, "utf8");
  console.log(`✅ Inventaire créé: ${outPath}`);
  console.log(`\nTop 20 CJS:\n`);
  unique.filter(r => r.kind === "CJS").slice(0, 20).forEach(r => {
    console.log(`- ${r.name}@${r.version}  (main: ${r.main || "—"})`);
  });
}

run();
