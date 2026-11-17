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
            // Clerk's card as one of the app's windows: ink border, solid ink shadow.
            elements: {
              cardBox: {
                border: "3px solid #3b2f3a",
                borderRadius: "20px",
                boxShadow: "0 6px 0 #3b2f3a",
              },
              headerTitle: { fontFamily: "var(--font-fredoka), system-ui, sans-serif", fontWeight: 600 },
              formButtonPrimary: {
                backgroundColor: "#f7cfc8",
                backgroundImage: "none",
                color: "#3b2f3a",
                border: "2px solid #3b2f3a",
                boxShadow: "0 3px 0 #3b2f3a",
                fontFamily: "var(--font-fredoka), system-ui, sans-serif",
                fontWeight: 600,
                "&:hover": { backgroundColor: "#f3bdb4" },
              },
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
