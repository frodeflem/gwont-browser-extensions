import { browser } from "@/adapters/browser-api";
import { withActiveTabDOM } from "@/adapters/document";
import { AdminApi } from "@/core/api";

console.log("GWONT: Extension loaded", chrome.runtime.getManifest().version, new Date().toLocaleString());

// async function triggerInTab(tabId: number, message: unknown) {
// 	try {
// 		return await browser.tabs.sendMessage(tabId, message);
// 	} catch (err) {
// 		await (browser as any).scripting.executeScript({
// 			target: { tabId },
// 			files: ["content/index.js"],
// 		});
// 		return await browser.tabs.sendMessage(tabId, message);
// 	}
// }

// async function triggerActiveTab(payload: any) {
// 	const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
// 	if (!tab?.id) return;
// 	const res = await triggerInTab(tab.id, { type: "DO_SOMETHING", payload });
// 	console.log("[bg] content replied:", res);
// }

async function getActiveTabUrl(): Promise<string | null> {
	const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
	return tab?.url ?? null;
}

async function parseActiveTab(tab: browser.Tabs.Tab) {
	if (!tab.id) return;

	const url = await getActiveTabUrl();
	if (!url) return;
	if (!/travian/.test(url)) return;

	console.log("GWONT: Parsing Travian page:", url);

	const { apiKey } = await browser.storage.local.get(["apiKey"]);
	if (!apiKey) return browser.runtime.openOptionsPage();

	await browser.action.setBadgeText({ text: "..." });
	const { avatarName, html } = await withActiveTabDOM(() => {
		const element = document.querySelector("#sidebarBoxActiveVillage .content .playerName");
		const avatarName = element?.textContent?.trim() ?? null;
		const html = document.documentElement.outerHTML;
		return { avatarName, html };
	});
	if (!avatarName) throw new Error("Avatar name not found.");
	await AdminApi.parsePage(url, avatarName, html);
	await browser.action.setBadgeText({ text: "✔️" });

	setTimeout(() => browser.action.setBadgeText({ text: "" }), 3000);
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
