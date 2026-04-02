import * as z from "zod/mini";

const apiBaseResult = z.url().safeParse(import.meta.env.VITE_API_BASE_URL);
if (!apiBaseResult.success) {
    throw new Error("VITE_API_BASE_URL is not defined");
}
export const apiBase = apiBaseResult.data;

export class APIError extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = "APIError";
        this.status = status;
    }
}
