import { useEffect } from "react";

const SITE_NAME = "Pittsburgh Bus Watch";
const SITE_URL = "https://app.pghbuswatch.com";
const DEFAULT_DESCRIPTION =
    "Track Pittsburgh bus stops, live arrival times, routes, and nearby vehicles with Pittsburgh Bus Watch.";

interface SEOProps {
    description?: string;
    noIndex?: boolean;
    title?: string;
}

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
    let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
    if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.appendChild(element);
    }
    element.content = content;
}

export default function SEO({ description = DEFAULT_DESCRIPTION, noIndex = false, title }: SEOProps) {
    useEffect(() => {
        const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
        const canonicalURL = new URL(window.location.pathname, SITE_URL).toString();

        document.title = pageTitle;
        upsertMeta("name", "description", description);
        upsertMeta("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");
        upsertMeta("property", "og:title", pageTitle);
        upsertMeta("property", "og:description", description);
        upsertMeta("property", "og:url", canonicalURL);
        upsertMeta("name", "twitter:title", pageTitle);
        upsertMeta("name", "twitter:description", description);

        let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement("link");
            canonical.rel = "canonical";
            document.head.appendChild(canonical);
        }
        canonical.href = canonicalURL;
    }, [description, noIndex, title]);

    return null;
}
