import { useEffect, useState } from "react";

export function useDelayedLoading(isLoading: boolean, delay = 250): boolean {
    const [showSkeleton, setShowSkeleton] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            return;
        }
        const timer = setTimeout(() => setShowSkeleton(true), delay);
        return () => {
            clearTimeout(timer);
            setShowSkeleton(false);
        };
    }, [isLoading, delay]);

    return showSkeleton;
}
