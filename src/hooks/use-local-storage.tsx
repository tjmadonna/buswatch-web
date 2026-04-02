import { useState } from "react";
import * as z from "zod/mini";

export function useLocalStorage<S extends z.ZodMiniType>(
    key: string,
    schema: S,
    initialValue: z.infer<S>,
): [z.infer<S>, (value: z.infer<S>) => void] {
    const [storedValue, setStoredValue] = useState<z.infer<S>>(() => {
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
    });

    function setValue(value: z.infer<S>) {
        try {
            setStoredValue(value);
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    }

    return [storedValue, setValue];
}
