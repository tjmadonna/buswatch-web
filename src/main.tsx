/* eslint-disable react-refresh/only-export-components */
import MainLayout from "@/components/main-layout";
import ArrivalsPage from "@/pages/arrivals/arrivals-page";
import HomePage from "@/pages/home/home-page";
import NotFoundPage from "@/pages/not-found/not-found-page";
import "@/style.css";
import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";

const root = document.getElementById("root");
if (!root) {
    throw new Error("Root element not found");
}

const StopsPage = lazy(() => import("@/pages/stops/stops-page"));

createRoot(root).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route element={<MainLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route
                        path="/stops"
                        element={
                            <Suspense>
                                <StopsPage />
                            </Suspense>
                        }
                    />
                    <Route path="/stops/:stopID/arrivals" element={<ArrivalsPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    </StrictMode>,
);
