// options.ts
const $ = (id: string): HTMLElement | null => document.getElementById(id);

// Load current prefs when the page opens
(async () => {
	const { username = "", password = "" } = await chrome.storage.local.get(["username", "password"]);
	const usernameInput = $("username") as HTMLInputElement;
	const passwordInput = $("password") as HTMLInputElement;

	if (usernameInput) {
		usernameInput.value = username;
	}

	if (passwordInput) {
		passwordInput.value = password;
	}
})();

// Save button handler
const saveButton = $("save") as HTMLButtonElement;
if (saveButton) {
	saveButton.addEventListener("click", async () => {
		const usernameInput = $("username") as HTMLInputElement;
		const passwordInput = $("password") as HTMLInputElement;
		const statusElement = $("status") as HTMLElement;

		if (usernameInput && passwordInput) {
			await chrome.storage.local.set({
				username: usernameInput.value.trim(),
				password: passwordInput.value.trim(),
			});
		}

		if (statusElement) {
			statusElement.textContent = "Saved ✓";
			setTimeout(() => (statusElement.textContent = ""), 1600);
		}
	});
}
