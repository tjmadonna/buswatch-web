import { useLocalStorage } from "@/hooks/use-local-storage";
import { Star } from "lucide-react";
import * as z from "zod/mini";

interface FavoriteToggleProps {
    stopID: string;
}

export function FavoriteToggle({ stopID }: FavoriteToggleProps) {
    const [favoriteStops, setFavoriteStops] = useLocalStorage("favoriteStops", z.array(z.string()), []);
    const isFavorite = favoriteStops.includes(stopID);

    function toggle() {
        if (isFavorite) {
            setFavoriteStops(favoriteStops.filter((id) => id !== stopID));
        } else {
            setFavoriteStops([...favoriteStops, stopID]);
        }
    }

    return (
        <button
            type="button"
            onClick={toggle}
            className="border-border bg-card text-foreground hover:bg-secondary flex h-9 w-9 items-center justify-center rounded-md border transition-colors"
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}>
            {isFavorite ? <Star className="h-4 w-4" fill="currentColor" /> : <Star className="h-4 w-4" />}
        </button>
    );
}
