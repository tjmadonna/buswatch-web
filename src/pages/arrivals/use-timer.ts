import { createSignal, onCleanup } from "solid-js";

export function useTimer() {
    const [currentTime, setCurrentTime] = createSignal(new Date());

    const interval = setInterval(() => {
        setCurrentTime(new Date());
    }, 1000);

    onCleanup(() => clearInterval(interval));

    return { currentTime };
}
