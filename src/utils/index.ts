export function cls(...classes: (string | boolean | undefined | null)[]) {
    return classes.filter(Boolean).join(" ");
}

export function isAbortError(err: unknown): boolean {
    return err instanceof DOMException && err.name === "AbortError";
}
