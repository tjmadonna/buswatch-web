import { type Accessor, createSignal } from "solid-js";
import * as z from "zod/mini";

type Entry<T> = [Accessor<T>, (value: T) => void];

const cache = new Map<string, Entry<unknown>>();

export function useLocalStorage<S extends z.ZodMiniType>(
    key: string,
    schema: S,
    initialValue: z.infer<S>,
): Entry<z.infer<S>> {
    const cached = cache.get(key);
    if (cached) {
        return cached as Entry<z.infer<S>>;
    }

    function readValue(): z.infer<S> {
        try {
            const item = window.localStorage.getItem(key);
            if (!item) {
                return initialValue;
            }
            const parsed = schema.safeParse(JSON.parse(item));
            return parsed.success ? parsed.data : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    }

    const [storedValue, setStoredValue] = createSignal<z.infer<S>>(readValue());

    function setValue(value: z.infer<S>) {
        try {
            setStoredValue(() => value);
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }

    const entry: Entry<z.infer<S>> = [storedValue, setValue];
    cache.set(key, entry as Entry<unknown>);
    return entry;
}
