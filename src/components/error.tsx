import { type LucideIcon } from "lucide-react";

interface ErrorProps {
    code: number;
    description: string;
    icon: LucideIcon;
    title: string;
}

export default function Error({ code, description, icon: Icon, title }: ErrorProps) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center px-4">
            <div className="flex flex-col items-center text-center">
                <div className="bg-primary mb-8 flex h-20 w-20 items-center justify-center rounded-2xl">
                    <Icon className="text-primary-foreground h-10 w-10" />
                </div>

                <p className="text-primary mb-2 font-mono text-7xl font-bold tracking-tighter">{code}</p>
                <h1 className="text-foreground mb-3 text-2xl font-bold text-balance">{title}</h1>
                <p className="text-muted-foreground mb-10 max-w-sm text-pretty">{description}</p>
            </div>
        </main>
    );
}
