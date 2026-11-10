COZINHA FÁCIL — COMO EXECUTAR

Requisitos:
- Bun instalado (https://bun.sh)

Passos:
1. Extraia o ZIP em uma pasta.
2. Abra o terminal nessa pasta.
3. Execute: bun run server.ts
4. Abra no navegador: http://localhost:3000

O banco SQLite "cozinha-facil.sqlite" é criado automaticamente na primeira execução.

O que está incluído:
- Cadastro e login com senha armazenada em hash.
- Cadastro de receitas com imagem opcional, ingredientes e modo de preparo.
- Pesquisa de receitas.
- Favoritos por usuário.
- Lista de receitas criadas pelo usuário.

Observações:
- Os dados ficam no arquivo SQLite da pasta do projeto.
- Para acessar o mesmo banco de outro computador, o servidor precisa estar hospedado e acessível pela rede/internet.
- As sessões deste exemplo ficam na memória do servidor e terminam quando ele é reiniciado.
