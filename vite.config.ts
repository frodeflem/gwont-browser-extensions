import { defineConfig } from "vite";
import { resolve } from "path";
import fsp from "fs/promises";
import { exec } from "child_process";

export default defineConfig(({ mode }) => {
	// const isDev = mode === "chromium" || mode.startsWith("dev");
	const isDev = true;
	const root = resolve(__dirname, "src");

	return {
		root, // <-- make src the root
		resolve: {
			alias: { "@": root }, // "@/..." -> "src/..."
		},
		build: {
			outDir: resolve(__dirname, "dist/common"),
			emptyOutDir: !isDev,
			target: "es2022",
			sourcemap: isDev, // ✅ helpful during dev
			minify: isDev ? false : "esbuild", // ✅ no minify in dev
			rollupOptions: {
				input: {
					// HTML entries (paths are now relative to `root`)
					popup: resolve(root, "ui/popup/index.html"),
					options: resolve(root, "ui/options/index.html"),

					// Script entries
					background: resolve(root, "background/index.ts"),
					content: resolve(root, "content/main.ts"),
				},
				output: {
					entryFileNames: (chunk) =>
						chunk.name === "background"
							? "background/index.js"
							: chunk.name === "content"
							? "content/index.js"
							: chunk.name === "offscreenScript"
							? "offscreen/index.js"
							: "assets/[name].js",
					assetFileNames: (asset) => {
						// keep CSS next to its importer folder if desired
						if (asset.name?.endsWith(".css")) return "[name][extname]";
						return "assets/[name][extname]";
					},
					chunkFileNames: "assets/[name].js",
				},
			},
		},
		define: {
			__TARGET__: JSON.stringify(mode || "chromium"),
		},
		publicDir: resolve(__dirname, "public"), // keep using /public for icons etc.

		// ✨ watch build done to auto-copy into dist/chromium
		plugins: [
			{
				name: "copy-to-chromium",
				async writeBundle() {
					if (isDev) {
						const src = resolve(__dirname, "dist/common");
						const dest = resolve(__dirname, "dist/chromium");
						await fsp.cp(src, dest, { recursive: true });
						exec("node scripts/build.mjs chromium", () => {
							console.log("🔁 Built manifest for Chromium");
						});
					}
				},
			},
		],
	};
});
