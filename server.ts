import { db } from "./db.ts";

const sessoes = new Map<string, number>();
const cookie = (token: string) => `sessao=${token}; HttpOnly; SameSite=Lax; Path=/`;
function usuarioId(req: Request) {
  const token = req.headers.get("cookie")?.split(";").map(x => x.trim()).find(x => x.startsWith("sessao="))?.slice(7);
  return token ? sessoes.get(token) : undefined;
}
function json(data: unknown, status = 200, headers: HeadersInit = {}) {
  return Response.json(data, { status, headers });
}

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    if (req.method === "GET" && path === "/") return new Response(Bun.file("index.html"));
    if (req.method === "GET" && path === "/style.css") return new Response(Bun.file("style.css"));
    if (req.method === "GET" && path === "/script.js") return new Response(Bun.file("script.js"));

    if (req.method === "POST" && (path === "/api/cadastro" || path === "/api/login")) {
      try {
        const body = await req.json() as { usuario?: string; senha?: string };
        const nome = body.usuario?.trim(); const senha = body.senha ?? "";
        if (!nome || nome.length < 3 || senha.length < 3) return json({ erro: "Usuário e senha devem ter pelo menos 3 caracteres." }, 400);
        let user = db.query("SELECT id, nome, senha_hash FROM usuarios WHERE nome = ?").get(nome) as any;
        if (path === "/api/cadastro") {
          if (user) return json({ erro: "Esse usuário já existe." }, 409);
          const hash = await Bun.password.hash(senha);
          const result = db.query("INSERT INTO usuarios (nome, senha_hash) VALUES (?, ?)").run(nome, hash);
          user = { id: Number(result.lastInsertRowid), nome };
          const exemplos = [
            ["Panqueca simples", "https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=700", "1 xícara de leite\n1 xícara de farinha de trigo\n1 ovo\n1 pitada de sal", "Misture os ingredientes. Coloque pequenas porções em uma frigideira untada e doure dos dois lados."],
            ["Bolo de chocolate", "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700", "2 xícaras de farinha\n1 xícara de açúcar\n1 xícara de chocolate em pó\n2 ovos\n1 xícara de leite", "Misture os ingredientes, coloque em uma forma untada e asse em forno preaquecido até ficar pronto."],
            ["Macarrão alho e óleo", "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=700", "250 g de macarrão\n3 dentes de alho\nAzeite\nSal a gosto", "Cozinhe o macarrão. Doure o alho no azeite, escorra a massa e misture tudo."]
          ];
          const add = db.query("INSERT INTO receitas (nome, imagem, ingredientes, preparo, autor_id) VALUES (?, ?, ?, ?, ?)");
          for (const item of exemplos) add.run(item[0], item[1], item[2], item[3], user.id);
        } else {
          if (!user || !(await Bun.password.verify(senha, user.senha_hash))) return json({ erro: "Usuário ou senha incorretos." }, 401);
        }
        const token = crypto.randomUUID(); sessoes.set(token, user.id);
        return json({ id: user.id, nome: user.nome }, 200, { "Set-Cookie": cookie(token) });
      } catch { return json({ erro: "Não foi possível processar os dados." }, 400); }
    }

    if (req.method === "POST" && path === "/api/logout") {
      const token = req.headers.get("cookie")?.split(";").map(x => x.trim()).find(x => x.startsWith("sessao="))?.slice(7);
      if (token) sessoes.delete(token);
      return json({ ok: true }, 200, { "Set-Cookie": "sessao=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0" });
    }
    const id = usuarioId(req);
    if (!id) return json({ erro: "Faça login para continuar." }, 401);

    if (req.method === "GET" && path === "/api/receitas") {
      const receitas = db.query(`SELECT r.id, r.nome, r.imagem, r.ingredientes, r.preparo, u.nome AS autor,
        EXISTS(SELECT 1 FROM favoritos f WHERE f.receita_id=r.id AND f.usuario_id=?) AS favorita,
        (SELECT COUNT(*) FROM favoritos f WHERE f.receita_id=r.id) AS total_favoritos
        FROM receitas r JOIN usuarios u ON u.id=r.autor_id ORDER BY r.id DESC`).all(id);
      return json(receitas);
    }
    if (req.method === "POST" && path === "/api/receitas") {
      const b = await req.json() as any;
      if (!b.nome?.trim() || !b.ingredientes?.trim() || !b.preparo?.trim()) return json({ erro: "Preencha nome, ingredientes e preparo." }, 400);
      const result = db.query("INSERT INTO receitas (nome, imagem, ingredientes, preparo, autor_id) VALUES (?, ?, ?, ?, ?)").run(b.nome.trim(), b.imagem || "", b.ingredientes.trim(), b.preparo.trim(), id);
      return json({ id: Number(result.lastInsertRowid) }, 201);
    }
    const fav = path.match(/^\/api\/favoritos\/(\d+)$/);
    if (fav && req.method === "POST") {
      db.query("INSERT OR IGNORE INTO favoritos (usuario_id, receita_id) VALUES (?, ?)").run(id, Number(fav[1])); return json({ ok: true });
    }
    if (fav && req.method === "DELETE") {
      db.query("DELETE FROM favoritos WHERE usuario_id=? AND receita_id=?").run(id, Number(fav[1])); return json({ ok: true });
    }
    if (req.method === "GET" && path === "/api/usuario") {
      return json(db.query("SELECT id, nome FROM usuarios WHERE id=?").get(id));
    }
    return json({ erro: "Rota não encontrada." }, 404);
  }
});
console.log(`Cozinha Fácil rodando em ${server.url}`);
