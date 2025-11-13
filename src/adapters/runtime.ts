// import { browser } from "./browser-api";

// /** Promise-based onMessage */
// export function onMessage<TReq = any, TRes = any>(
// 	handler: (msg: TReq, sender: browser.Runtime.MessageSender) => Promise<TRes> | TRes
// ) {
// 	browser.runtime.onMessage.addListener((msg: any, sender: any) => Promise.resolve(handler(msg, sender)));
// }

// export function sendMessage<TReq, TRes = unknown>(msg: TReq) {
// 	return browser.runtime.sendMessage(msg) as Promise<TRes>;
// }

// /** executeScript that works on Chromium & Firefox */
// export async function executeScript<T>(
// 	tabId: number,
// 	func: () => T | Promise<T>
// ): Promise<T> {
// 	const anyBrowser = browser as any;
// 	if (anyBrowser.scripting?.executeScript) {
// 		const [{ result }] = await anyBrowser.scripting.executeScript({ target: { tabId }, func });
// 		return result as T;
// 	} else if (anyBrowser.tabs?.executeScript) {
// 		// Old-style fallback (returns array of results)
// 		const [result] = await anyBrowser.tabs.executeScript(tabId, { code: `(${func})();` });
// 		return result as T;
// 	}
// 	throw new Error("No executeScript API available");
// }
