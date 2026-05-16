import MainLayout from "@/components/main-layout";
import ArrivalsPage from "@/pages/arrivals/arrivals-page";
import HomePage from "@/pages/home/home-page";
import NotFoundPage from "@/pages/not-found/not-found-page";
import StopsPage from "@/pages/stops/stops-page";
import VehiclesPage from "@/pages/vehicles/vehicles-page";
import "@/style.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";

const root = document.getElementById("root");
if (!root) {
    throw new Error("Root element not found");
}

createRoot(root).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/stops" element={<StopsPage />} />
                    <Route path="/stops/:stopID/arrivals" element={<ArrivalsPage />} />
                    <Route path="/routes/:routeID/vehicles" element={<VehiclesPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    </StrictMode>,
);
