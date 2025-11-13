import { browser } from "./browser-api";

// A function that runs in the page context.
// It can return anything JSON-serializable (or void).
export type PageFn<Args extends unknown[], R> = (...args: Args) => R;

/**
 * Runs `fn` inside the active tab's page context and returns its result.
 * - `fn` must be self-contained (no closures, no imports).
 * - `args` must be JSON-serializable.
 */
export async function withActiveTabDOM<Args extends unknown[], R = unknown>(fn: PageFn<Args, R>, ...args: Args): Promise<R> {
	const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

	if (!tab?.id) {
		throw new Error("No active tab found");
	}

	// Manifest V3 style (scripting API)
	const scripting = (browser as any).scripting as typeof browser.scripting | undefined;

	if (scripting && scripting.executeScript) {
		const injectionResults = await scripting.executeScript({
			target: { tabId: tab.id },
			func: fn as (...a: unknown[]) => R,
			args,
		});

		// scripting.executeScript returns an array of results, one per frame.
		// We take the first one (top frame).
		const [first] = injectionResults;
		return (first?.result ?? null) as R;
	}

	// Manifest V2 style (tabs.executeScript)
	const fnSource = `(${fn}).apply(null, ${JSON.stringify(args)})`;

	const results = (await browser.tabs.executeScript(tab.id, {
		code: fnSource,
	})) as R[];

	// tabs.executeScript also returns an array per frame.
	return (results?.[0] ?? null) as R;
}
