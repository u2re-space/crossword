/*
 * Shared storage for the app
 * Backend based storage
 * Requires URL where to store data
 * Requires API key to access the storage
 * Requires API to store data
 * Requires API to retrieve data
 * Requires API to delete data
 * Requires API to update data
 * Requires API to list data
 * Requires API to search data
 */

//
const BASE_URL = process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:3000";

//
export class SharedStorage {
    private apiKey: string;
    private apiSecret: string;
    private apiUrl: string;

    constructor(apiKey: string, apiSecret: string) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.apiUrl = `${BASE_URL}/api/storage`;
    }

    doRequest(url: string, method: string, body?: any) {
        return fetch(url, { method, body: body ? JSON.stringify(body) : undefined, headers: { "Content-Type": "application/json", "Authorization": `Bearer ${this.apiKey}` } });
    }

    async get(key: string) {
        const response = await this.doRequest(`${this.apiUrl}/get/${key}`, "GET", undefined);
        return response.json();
    }
    async set(key: string, value: any) {
        const response = await this.doRequest(`${this.apiUrl}/set/${key}`, "POST", value);
        return response.json();
    }
    async delete(key: string) {
        const response = await this.doRequest(`${this.apiUrl}/delete/${key}`, "DELETE", undefined);
        return response.json();
    }
    async update(key: string, value: any) {
        const response = await this.doRequest(`${this.apiUrl}/update/${key}`, "PUT", value);
        return response.json();
    }
    async list() {
        const response = await this.doRequest(`${this.apiUrl}/list`, "GET", undefined);
        return response.json();
    }
    async search(query: string) {
        const response = await this.doRequest(`${this.apiUrl}/search/${query}`, "GET", undefined);
        return response.json();
    }
}
