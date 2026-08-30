import type { Accessor } from "solid-js";
import { createMemo } from "solid-js";
import * as z from "zod/mini";

import { useLocalStorage } from "@/hooks/use-local-storage";

const hiddenRoutesSchema = z.array(z.string());

export function useHiddenRoutes(stopID: Accessor<string | undefined>) {
    const entry = createMemo(() => useLocalStorage(`hiddenRoutes:${stopID()}`, hiddenRoutesSchema, []));
    return {
        hiddenRoutes: () => entry()[0](),
        setHiddenRoutes: (routes: string[]) => entry()[1](routes),
    };
}
