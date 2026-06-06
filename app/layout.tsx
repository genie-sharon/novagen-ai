import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "NovaGen — AI Assistant",
  description:
    "NovaGen is an AI-powered chat and document question-answering assistant.",
  icons: {
    icon: {
      url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23EC4899"/></svg>',
      type: "image/svg+xml",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${dmSans.variable} antialiased`}>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              borderRadius: "14px",
              background: "var(--bg-surface)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-body)",
              border: "1px solid var(--pink-300)",
              borderLeft: "3px solid var(--pink-500)",
              fontSize: "14px",
            },
            error: {
              iconTheme: {
                primary: "var(--pink-500)",
                secondary: "var(--bg-surface)",
              },
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
