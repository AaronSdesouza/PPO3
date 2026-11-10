const $ = (id) => document.getElementById(id);
let usuarioAtual = null;
let receitas = [];
let telaAnterior = "inicio";

async function api(url, options = {}) {
  const resposta = await fetch(url, { credentials: "same-origin", ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const dados = await resposta.json();
  if (!resposta.ok) throw new Error(dados.erro || "Ocorreu um erro.");
  return dados;
}
function mensagem(texto) { $("mensagem").textContent = texto; }
function mostrarTela(id) {
  document.querySelectorAll(".tela").forEach(t => t.classList.remove("ativa"));
  $(id).classList.add("ativa");
  if (id === "inicio") renderizar("listaReceitas", receitas);""
  if (id === "favoritos") renderizar("listaFavoritos", receitas.filter(r => r.favorita));
  if (id === "minhas") renderizar("listaMinhas", receitas.filter(r => r.autor === usuarioAtual.nome));
}
function entrar() {
  $("login").hidden = true; $("app").hidden = false; $("menu").hidden = false; mostrarTela("inicio");
}
function renderizar(area, lista) {
  $(area).innerHTML = lista.length ? lista.map(r => `<article class="card"><img src="${escapar(r.imagem || "https://placehold.co/600x400?text=Receita")}" alt="${escapar(r.nome)}" onerror="this.src='https://placehold.co/600x400?text=Receita'"><div class="card-conteudo"><h3>${escapar(r.nome)}</h3><p>Por: ${escapar(r.autor)}</p><div class="card-acoes"><button data-detalhe="${r.id}">Ver receita</button><button class="favoritar" data-favorito="${r.id}">${r.favorita ? "❤️" : "♡"} ${r.total_favoritos}</button></div></div></article>`).join("") : '<p class="vazio">Nenhuma receita encontrada.</p>';
}
function escapar(v) {
  return String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
async function carregarReceitas() {
  receitas = await api("/api/receitas");
  mostrarTela(document.querySelector(".tela.ativa")?.id || "inicio");
}
$("formLogin").addEventListener("submit", async e => {
  e.preventDefault(); try {
    usuarioAtual = await api("/api/login", {
      method: "POST",
      body: JSON.stringify({ usuario: $("usuario").value.trim(), senha: $("senha").value })
    });
    mensagem(""); await carregarReceitas(); entrar();
  } catch (err) {
    mensagem(err.message);

  }
});
$("cadastrar").addEventListener("click", async () => {
  try {
    usuarioAtual = await api("/api/cadastro", {
      method: "POST", body: JSON.stringify({
        usuario: $("usuario").value.trim(), senha: $("senha").value
      })
    });
    mensagem(""); await carregarReceitas(); entrar();
  } catch (err) { mensagem(err.message); }
});
$("sair").addEventListener("click", async () => {
  await api("/api/logout",
    { method: "POST" }); usuarioAtual = null; $("app").hidden = true; $("menu").hidden = true; $("login").hidden = false; $("formLogin").reset();
});
document.querySelectorAll("nav [data-tela]").forEach(b => b.addEventListener("click", () => mostrarTela(b.dataset.tela)));
$("pesquisa").addEventListener("input", () => { const termo = $("pesquisa").value.toLowerCase(); renderizar("listaReceitas", receitas.filter(r => r.nome.toLowerCase().includes(termo))); });
document.body.addEventListener("click", async e => {
  const favorito = e.target.closest("[data-favorito]");
  const detalhe = e.target.closest("[data-detalhe]");
  if (favorito) { const r = receitas.find(x => x.id === Number(favorito.dataset.favorito)); await api(`/api/favoritos/${r.id}`, { method: r.favorita ? "DELETE" : "POST" }); await carregarReceitas(); }
  if (detalhe) { const r = receitas.find(x => x.id === Number(detalhe.dataset.detalhe)); telaAnterior = document.querySelector(".tela.ativa").id; $("conteudoDetalhes").innerHTML = `<article class="detalhe-receita"><h2>${escapar(r.nome)}</h2><p>Por: ${escapar(r.autor)}</p><img src="${escapar(r.imagem || "https://placehold.co/600x400?text=Receita")}" alt="${escapar(r.nome)}"><h3>Ingredientes</h3><p>${escapar(r.ingredientes)}</p><h3>Modo de preparo</h3><p>${escapar(r.preparo)}</p><p><strong>Favoritos:</strong> ${r.total_favoritos}</p></article>`; mostrarTela("detalhes"); }
});
$("voltar").addEventListener("click", () => mostrarTela(telaAnterior));
$("formReceita").addEventListener("submit", async e => { e.preventDefault(); try { await api("/api/receitas", { method: "POST", body: JSON.stringify({ nome: $("nome").value, imagem: $("imagem").value, ingredientes: $("ingredientes").value, preparo: $("preparo").value }) }); e.target.reset(); await carregarReceitas(); mostrarTela("minhas"); } catch (err) { alert(err.message); } });
