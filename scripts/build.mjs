import { mkdir, readFile, writeFile, cp } from "fs/promises";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const targets = ["chromium", "firefox", "safari"];

function deepMerge(a, b) {
	if (Array.isArray(a) && Array.isArray(b)) return Array.from(new Set([...a, ...b]));
	if (a && typeof a === "object" && b && typeof b === "object") {
		const out = { ...a };
		for (const k of Object.keys(b)) out[k] = k in out ? deepMerge(out[k], b[k]) : b[k];
		return out;
	}
	return b ?? a;
}

async function buildTarget(target) {
	const distCommon = resolve(root, "dist/common");
	const distTarget = resolve(root, `dist/${target}`);
	await mkdir(distTarget, { recursive: true });

	// copy compiled assets
	await cp(distCommon, distTarget, { recursive: true });

	// copy icons (if you put them under public/)
	const iconsSrc = resolve(root, "public/icons");
	try { await cp(iconsSrc, resolve(distTarget, "icons"), { recursive: true }); } catch {}

	// merge manifests
	const base = JSON.parse(await readFile(resolve(root, "src/manifest/base.json"), "utf8"));
	const patchPath = resolve(root, `src/manifest/${target}.json`);
	const patch = JSON.parse(await readFile(patchPath, "utf8").catch(() => "{}"));
	const manifest = deepMerge(base, patch);
	await writeFile(resolve(distTarget, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
	console.log(`✓ Emitted dist/${target}`);
}

for (const t of targets) await buildTarget(t);
