import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import localFont from "next/font/local";

const geist = localFont({
  src: "../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2",
  variable: "--font-standup",
  display: "swap",
});

const preferenceScript = `
  const root = document.documentElement;
  try {
    const savedTheme = localStorage.getItem("standupflow_theme");
    const dark = savedTheme === "dark" || (savedTheme !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
    root.classList.toggle("dark", dark);
  } catch {
    root.classList.add("dark");
  }
  try {
    const introKey = "standupflow_intro_played";
    if (sessionStorage.getItem(introKey)) {
      root.dataset.pageIntro = "short";
    } else {
      root.dataset.pageIntro = "play";
      sessionStorage.setItem(introKey, "true");
    }
  } catch {
    root.dataset.pageIntro = "play";
  }
`;

export const metadata: Metadata = {
  title: "Standup Flow | Speak It Messy. Send It Sharp.",
  description:
    "Turn rough, rushed work notes into clear, senior-grade daily standup updates in Slack, formal email, and short formats in one click. Voice-first and dictation-friendly.",
  keywords: [
    "standup flow",
    "daily standup generator",
    "wispr flow",
    "developer standup",
    "slack update",
    "executive standup email",
  ],
  authors: [{ name: "StandupFlow Contributors" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} dark h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferenceScript }} />
      </head>
      <body className="min-h-full flex flex-col antialiased selection:bg-blue-600 selection:text-white bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
