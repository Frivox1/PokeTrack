import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { SearchProvider } from "@/context/SearchContext";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pokédex - Toutes les générations",
  description: "Un Pokédex moderne affichant tous les Pokémon de toutes les générations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          <SearchProvider>
            <Navbar />
            {children}
          </SearchProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
