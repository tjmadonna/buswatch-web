import "@/style.css";

import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";

import MainLayout from "@/components/main-layout";
import HomePage from "@/pages/home/home-page";
import NotFoundPage from "@/pages/not-found/not-found-page";
import { ArrivalsPage, StopsPage, VehiclesPage } from "@/routes";

const root = document.getElementById("root");
if (!root) {
    throw new Error("Root element not found");
}

createRoot(root).render(
    <StrictMode>
        <BrowserRouter>
            <Suspense fallback={null}>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/stops" element={<StopsPage />} />
                        <Route path="/stops/:stopID/arrivals" element={<ArrivalsPage />} />
                        <Route path="/routes/:routeID/vehicles" element={<VehiclesPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Route>
                </Routes>
            </Suspense>
        </BrowserRouter>
    </StrictMode>,
);
