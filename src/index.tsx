/* @refresh reload */
import "@/style.css";

import { Route, Router } from "@solidjs/router";
import { lazy } from "solid-js";
import { render } from "solid-js/web";

import MainLayout from "@/components/main-layout";

const ArrivalsPage = lazy(() => import("@/pages/arrivals/arrivals-page"));
const HomePage = lazy(() => import("@/pages/home/home-page"));
const NotFoundPage = lazy(() => import("@/pages/not-found/not-found-page"));
const StopsPage = lazy(() => import("@/pages/stops/stops-page"));
const VehiclesPage = lazy(() => import("@/pages/vehicles/vehicles-page"));

const root = document.getElementById("root");
if (!root) {
    throw new Error("Root element not found");
}

render(
    () => (
        <Router root={MainLayout}>
            <Route path="/" component={HomePage} />
            <Route path="/stops" component={StopsPage} />
            <Route path="/stops/:stopID/arrivals" component={ArrivalsPage} />
            <Route path="/routes/:routeID/vehicles" component={VehiclesPage} />
            <Route path="*404" component={NotFoundPage} />
        </Router>
    ),
    root,
);
