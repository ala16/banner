import "./globals.css";
import { montserrat } from "./fonts";

export const metadata = {
  title: "Gerador de Banners",
  description: "Gerador de banners de cursos do Sindicato Rural",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={montserrat.className}>{children}</body>
    </html>
  );
}
