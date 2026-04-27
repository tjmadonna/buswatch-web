import { useState } from "react";

interface UserLocation {
    latitude: number;
    longitude: number;
}

export function useUserLocation() {
    const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    function locateUser() {
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser");
            return;
        }
        setIsLocating(true);
        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setUserLocation({ latitude, longitude });
                setIsLocating(false);
            },
            (err) => {
                setIsLocating(false);
                if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
                    setLocationError("Location access denied");
                } else {
                    setLocationError("Unable to get your location");
                }
                setTimeout(() => setLocationError(null), 4000);
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    }

    return { userLocation, isLocating, locationError, locateUser };
}
