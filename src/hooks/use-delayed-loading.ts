import { type Accessor, createEffect, createSignal, onCleanup } from "solid-js";

export function useDelayedLoading(isLoading: Accessor<boolean>, delay = 250): Accessor<boolean> {
    const [showSkeleton, setShowSkeleton] = createSignal(false);

    createEffect(() => {
        if (!isLoading()) {
            setShowSkeleton(false);
            return;
        }

        const timer = setTimeout(() => setShowSkeleton(true), delay);
        onCleanup(() => clearTimeout(timer));
    });

    return showSkeleton;
}
