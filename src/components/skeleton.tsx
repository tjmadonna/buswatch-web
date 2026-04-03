import { cls } from "@/utils";

export default function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cls("bg-muted animate-pulse rounded-md", className)} {...props} />;
}
