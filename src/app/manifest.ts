import type { MetadataRoute } from "next";

/** Lets Ledger be added to a phone's home screen and open full-screen like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ledger",
    short_name: "Ledger",
    description: "Personal budget: accounts, spending plan and goals.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#EDF1EE",
    theme_color: "#1F5A41",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
