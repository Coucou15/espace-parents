import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegister } from "./components/ServiceWorkerRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Espace Parents — Les Racines du Future",
  description:
    "L'application officielle des parents d'élèves de l'école Les Racines du Future. Annonces, menu, emplois du temps, évaluations, rendez-vous avec les enseignants.",
  applicationName: "Espace Parents",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Espace Parents",
  },
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
  openGraph: {
    title: "Espace Parents — Les Racines du Future",
    description:
      "L'application officielle des parents d'élèves de l'école Les Racines du Future.",
    url: "/",
    siteName: "Espace Parents",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/logo.jpg",
        width: 1024,
        height: 1024,
        alt: "Logo Les Racines du Future",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Espace Parents — Les Racines du Future",
    description: "L'application des parents d'élèves de l'école Les Racines du Future.",
    images: ["/logo.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1b5e3f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
