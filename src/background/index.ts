import { browser } from "@/adapters/browser-api";
import { withActiveTabDOM } from "@/adapters/document";
import { AdminApi } from "@/core/api";

const browserAction = (browser as any).action ?? (browser as any).browserAction;

if (!browserAction) {
	console.error("No browser action API available");
}

console.log("GWONT: Extension loaded", browser.runtime.getManifest().version, new Date().toLocaleString());

async function getActiveTabUrl(): Promise<string | null> {
	const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
	return tab?.url ?? null;
}

async function showErrorNotification(message: string) {
	const id = `gwont-error-${Date.now()}`;

	await browser.notifications.create(id, {
		type: "basic",
		iconUrl: "icons/48.png", // already in your manifest
		title: "GWONT – Error",
		message,
	});
}

async function parseActiveTab(tab: browser.Tabs.Tab) {
	if (!tab.id) return;

	const url = await getActiveTabUrl();
	if (!url) return;
	if (!/travian/.test(url)) return;

	console.log("GWONT: Parsing Travian page:", url);

	const { apiKey } = await browser.storage.local.get(["apiKey"]);
	if (!apiKey) return browser.runtime.openOptionsPage();

	try {
		await browserAction.setBadgeText({ text: "..." });

		const { avatarName, html } = await withActiveTabDOM(() => {
			const element = document.querySelector("#sidebarBoxActiveVillage .content .playerName");
			const avatarName = element?.textContent?.trim() ?? null;
			const html = document.documentElement.outerHTML;
			return { avatarName, html };
		});
		if (!avatarName) throw new Error("Avatar name not found on page.");

		await AdminApi.parsePage(url, avatarName, html);
		await browserAction.setBadgeText({ text: "✔️" });
	} catch (error) {
		console.error("GWONT: Failed to parse page", error);

		const e = error as Error & { status?: number };
		let message = "Failed to parse the page.";

		if (e.status === 400) {
			// backend rejected the page / validation failure
			message = e.message || "Server rejected this page (400).";
		} else if (e.message) {
			message = e.message;
		}

		await browserAction.setBadgeText({ text: "!" });
		await showErrorNotification(message);
	}

	setTimeout(() => browserAction.setBadgeText({ text: "" }), 3000);
}

browser.commands.onCommand.addListener(async (command) => {
	if (command === "reload_extension") {
		console.log("GWONT: Reloading extension");
		browser.runtime.reload();
	} else if (command === "parse_page") {
		const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
		if (!tab?.id) return;
		await parseActiveTab(tab);
	}
});

browserAction.onClicked.addListener(async () => {
	const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
	if (!tab?.id) return;
	await parseActiveTab(tab);
});
