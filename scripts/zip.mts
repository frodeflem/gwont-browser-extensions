import * as fs from "fs";
import * as path from "path";
import archiver from "archiver";

async function zipDir(srcDir: string, zipPath: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const output = fs.createWriteStream(zipPath);
		const archive = archiver("zip", { zlib: { level: 9 } });

		output.on("close", resolve);
		archive.on("error", reject);

		archive.pipe(output);
		archive.directory(srcDir, false);
		archive.finalize();
	});
}

const targets = ["chromium", "firefox", "safari"];

for (const t of targets) {
	const srcDir = path.join("dist", t);
	const zipPath = path.join("dist", `${t}.zip`);

	await zipDir(srcDir, zipPath);
	console.log(`✓ dist/${t}.zip`);
}
