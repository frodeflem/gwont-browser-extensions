import { API_HOST, EXPORT_ENDPOINT, LOGIN_API_KEY_ENDPOINT, LOGIN_ENDPOINT, REFRESH_TOKEN_ENDPOINT } from "./config";
import { BaseToken, AccessToken, RefreshToken, UserAccessToken } from "./dtos";
import { browser } from "@/adapters/browser-api";

function isTokenValid(token: BaseToken | null): boolean {
	return !!(token && token.exp && token.exp * 1000 > Date.now());
}
function decodeToken(tokenString: string | null) {
	if (!tokenString) return null;
	return JSON.parse(atob(tokenString.split(".")[1]));
}

let accessTokenString: string | null = null;
export let accessToken: AccessToken | null = decodeToken(accessTokenString);
export async function setAccessToken(tokenString: string) {
	accessTokenString = tokenString;
	accessToken = decodeToken(tokenString);
	await browser.storage.local.set({ accessToken: tokenString });
}

let refreshTokenString: string | null = null;
export let refreshToken: RefreshToken | null = decodeToken(refreshTokenString);
export async function setRefreshToken(tokenString: string) {
	refreshTokenString = tokenString;
	refreshToken = decodeToken(tokenString);
	await browser.storage.local.set({ refreshToken: tokenString });
}

let userTokenString: string | null = null;
export let userToken: UserAccessToken | null = decodeToken(userTokenString);
export async function setUserToken(tokenString: string) {
	userTokenString = tokenString;
	userToken = decodeToken(tokenString);
	await browser.storage.local.set({ userToken: tokenString });
}

export class PublicApi {
	static async fetch(path: string, options: RequestInit) {
		const response = await fetch(`${API_HOST}${path}`, { ...options, headers: { ...options.headers } });
		if (!response.ok) console.error(response);
		return response;
	}
	static GET(path: string) {
		return this.fetch(path, { method: "GET", headers: { "Content-Type": "application/json" } });
	}
	static POST(path: string, body?: any) {
		return this.fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
	}
	static PUT(path: string, body?: any) {
		return this.fetch(path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
	}
	static DELETE(path: string, body?: any) {
		return this.fetch(path, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
	}

	static async login(username: string, password: string) {
		const data = await (await this.POST(LOGIN_ENDPOINT, { username, password })).json();
		await setAccessToken(data.access_token);
		await setRefreshToken(data.refresh_token);
	}
	static async loginWithApiKey(apiKey: string) {
		const data = await (await this.POST(LOGIN_API_KEY_ENDPOINT, { api_key: apiKey })).json();
		await setAccessToken(data.access_token);
		await setRefreshToken(data.refresh_token);
	}
	static async refreshAccessToken() {
		const data = await (await this.POST(REFRESH_TOKEN_ENDPOINT, { refresh_token: refreshTokenString })).json();
		await setAccessToken(data.access_token);
	}
}

export class AdminApi {
	static async fetch(path: string, options: RequestInit) {
		const response = await fetch(`${API_HOST}${path}`, {
			...options,
			headers: { ...options.headers, Authorization: `Bearer ${await this.accessTokenString()}` },
		});
		if (!response.ok) console.error(response);
		return response;
	}
	static GET(path: string) {
		return this.fetch(path, { method: "GET", headers: { "Content-Type": "application/json" } });
	}
	static POST(path: string, b?: any) {
		return this.fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
	}
	static PUT(path: string, b?: any) {
		return this.fetch(path, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
	}
	static DELETE(path: string, b?: any) {
		return this.fetch(path, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });
	}

	static async accessTokenString() {
		if (isTokenValid(accessToken)) return accessTokenString;

		if (isTokenValid(refreshToken)) {
			await PublicApi.refreshAccessToken();
			if (isTokenValid(accessToken)) return accessTokenString;
			throw new Error("Failed to refresh access token");
		}

		const { apiKey } = await browser.storage.local.get(["apiKey"]);
		if (apiKey) {
			await PublicApi.loginWithApiKey(apiKey as string);
			if (isTokenValid(accessToken)) return accessTokenString;
			throw new Error("Failed to login with API key");
		}
		return null;
	}

	static async parsePage(url: string, avatarName: string, body: string) {
		const safeAvatar = encodeURIComponent(avatarName);
		const safeUrl = encodeURIComponent(url);
		return this.fetch(`${EXPORT_ENDPOINT}?avatar_name=${safeAvatar}&url=${safeUrl}`, { method: "POST", body });
	}
}

// Initialize tokens from storage at startup
(async () => {
	const { accessToken: a, refreshToken: r } = await browser.storage.local.get(["accessToken", "refreshToken"]);
	if (a) await setAccessToken(a as string);
	if (r) await setRefreshToken(r as string);
})();
