import "./globals.css";
import { montserrat } from "./fonts";

export const metadata = {
  title: "SENAR Banners",
  description: "Gerador de banners de cursos do Sindicato Rural",
};

export const viewport = { themeColor: "#0b4d33" };

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={montserrat.className}>{children}</body>
    </html>
  );
}
