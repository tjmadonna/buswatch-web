import type { JSX } from "solid-js";

import { cls } from "@/utils";

export default function Skeleton(props: JSX.HTMLAttributes<HTMLDivElement>) {
    return <div {...props} class={cls("bg-muted animate-pulse rounded-md", props.class)} />;
}
