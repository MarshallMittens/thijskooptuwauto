import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thijs koopt uw auto | Meld je auto aan",
  description: "Meld je auto zorgvuldig aan met voertuiggegevens en foto’s. Thijskooptuauto controleert de aanvraag en bespreekt mogelijke vervolgstappen.",
  icons: {
    icon: "/tkua-logo.png",
    shortcut: "/tkua-logo.png",
    apple: "/tkua-logo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
