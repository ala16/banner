import { Montserrat, Tinos } from "next/font/google";

export const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
});

// Serifada dos telefones do template de Bragança.
export const tinos = Tinos({
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});
