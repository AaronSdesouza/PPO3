import { Database } from "bun:sqlite";

export const db = new Database("cozinha-facil.sqlite", { create: true });
db.run("PRAGMA foreign_keys = ON");
db.run(`CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL
)`);
db.run(`CREATE TABLE IF NOT EXISTS receitas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  imagem TEXT,
  ingredientes TEXT NOT NULL,
  preparo TEXT NOT NULL,
  autor_id INTEGER NOT NULL REFERENCES usuarios(id)
)`);
db.run(`CREATE TABLE IF NOT EXISTS favoritos (
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  receita_id INTEGER NOT NULL REFERENCES receitas(id) ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, receita_id)
)`);

const total = db.query("SELECT COUNT(*) AS total FROM receitas").get() as { total: number };
if (total.total === 0) {
  const inserir = db.query("INSERT INTO receitas (nome, imagem, ingredientes, preparo, autor_id) VALUES (?, ?, ?, ?, ?)");
  
}
