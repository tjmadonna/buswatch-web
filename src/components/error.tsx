import { type LucideIcon } from "lucide-solid";

interface ErrorProps {
    code: number;
    description: string;
    icon: LucideIcon;
    title: string;
}

export default function Error(props: ErrorProps) {
    return (
        <main class="flex min-h-screen flex-col items-center justify-center px-4">
            <div class="flex flex-col items-center text-center">
                <div class="bg-primary mb-8 flex h-20 w-20 items-center justify-center rounded-2xl">
                    <props.icon class="text-primary-foreground h-10 w-10" />
                </div>

                <p class="text-primary mb-2 font-mono text-5xl font-bold tracking-tighter sm:text-7xl">{props.code}</p>
                <h1 class="text-foreground mb-3 text-2xl font-bold text-balance">{props.title}</h1>
                <p class="text-muted-foreground mb-10 max-w-sm text-pretty">{props.description}</p>
            </div>
        </main>
    );
}
