import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OIDC Client",
  description: "Frontend client for the monorepo identity server"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
