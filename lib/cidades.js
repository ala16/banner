// Cidades com gerador pronto. Usado no início e no histórico para separar os banners.
export const CIDADES = [
  { id: "atibaia", nome: "Atibaia", sindicato: "Sindicato Rural de Atibaia" },
  { id: "braganca", nome: "Bragança Paulista", sindicato: "Sindicato Rural de Bragança Paulista" },
];

export const cidadeValida = (id) => CIDADES.some((c) => c.id === id);

// sessionStorage usado pelos botões "Editar" e "Duplicar" do histórico.
export const CHAVE_REUTILIZAR = "banner:reutilizar";
