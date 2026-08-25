import { lazy } from "react";

export const ArrivalsPage = lazy(() => import("@/pages/arrivals/arrivals-page"));
export const StopsPage = lazy(() => import("@/pages/stops/stops-page"));
export const VehiclesPage = lazy(() => import("@/pages/vehicles/vehicles-page"));
