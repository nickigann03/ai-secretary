"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://mock-convex-url.convex.cloud";

const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
    // If no URL is provided, we still render children but Convex hooks might fail if used.
    // This is just a placeholder to prevent crash if env var is missing during scaffolding.
    return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
