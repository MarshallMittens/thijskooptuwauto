import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thijs koopt uw auto | Eerlijk en persoonlijk je auto verkopen",
  description: "Verkoop je auto zonder gedoe. Start met je kenteken en ontvang een persoonlijk, vrijblijvend bod.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
