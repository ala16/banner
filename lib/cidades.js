// Cidades com gerador pronto. Usado no histórico para separar os banners.
export const CIDADES = [{ id: "atibaia", nome: "Atibaia" }];

export const cidadeValida = (id) => CIDADES.some((c) => c.id === id);

// sessionStorage usado pelo botão "Reutilizar dados" do histórico.
export const CHAVE_REUTILIZAR = "banner:reutilizar";
