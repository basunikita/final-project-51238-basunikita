import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: "600",
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

export const metadata: Metadata = {
  title: "Stationery Inventory",
  description:
    "For stationery lovers who keep buying notebooks they already own: see everything you have, where it lives, and what's still waiting to be used.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable} antialiased`}>
      <body className="min-h-screen">
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/inventory"
          signUpFallbackRedirectUrl="/inventory"
          afterSignOutUrl="/"
          appearance={{
            variables: {
              colorPrimary: "#3b2f3a",
              colorBackground: "#fffdf8",
              colorForeground: "#3b2f3a",
              colorMutedForeground: "#6f5f6a",
              colorInput: "#fffdf8",
              colorInputForeground: "#3b2f3a",
              fontFamily: "var(--font-nunito), system-ui, sans-serif",
              borderRadius: "14px",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
