import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lions' AI Secretary",
  description: "Automated Meeting Minutes for Lions Club",
  icons: {
    icon: "/lions-icon.png",
  },
};

/**
 * Top-level application layout that sets the HTML structure, applies the Outfit font and theme classes, and provides the Convex client context to descendants.
 *
 * @param children - React nodes to render inside the application layout
 * @returns The root HTML element tree for the application
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} antialiased bg-slate-50 text-slate-900`}>
        <ConvexClientProvider>
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  );
}