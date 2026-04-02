/* eslint-disable react-refresh/only-export-components */
import MainLayout from "@/components/main-layout";
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
                    <Route
                        path="/stops"
                        element={
                            <Suspense>
                                <StopsPage />
                            </Suspense>
                        }
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    </StrictMode>,
);
