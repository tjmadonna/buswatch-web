import { SearchX } from "lucide-solid";

import NotFound from "@/components/error";

export default function NotFoundPage() {
    return (
        <NotFound
            title="Page not found"
            description={
                "The page you're looking for doesn't exist or may have been moved. Check the URL and try again."
            }
            code={404}
            icon={SearchX}
        />
    );
}
