# Como contribuir

Obrigado por querer melhorar o Mistério S.A.! 🐶🔍

## Antes de começar

1. Faça um **fork** do repositório e clone a sua cópia.
2. Siga o passo a passo de [Rodando no seu computador](README.md#rodando-no-seu-computador). Use o **seu próprio projeto Firebase** para desenvolver.
3. Rode `git update-index --skip-worktree firebase-config.js` para não enviar suas credenciais por engano.
4. Crie uma branch com um nome descritivo:

   ```bash
   git checkout -b feat/fase-de-seguranca
   ```

## Para testar sozinho

- Abra o `main.html` em uma janela e o `player.html` em outra (ou no modo responsivo do DevTools, `Ctrl+Shift+M`).
- Para simular vários jogadores, abra várias abas do `player.html`.
- Teste também no celular de verdade: o toque se comporta diferente do mouse, principalmente no *button mashing*.
- Se mudar a estrutura do banco, atualize o `database.rules.json` e confira se não aparece `PERMISSION_DENIED` no console.

## Princípios do projeto

- **Sem frameworks e sem etapa de build.** O jogo precisa rodar com um servidor estático qualquer. Bibliotecas pequenas são aceitáveis se carregadas por CDN e se realmente necessárias.
- **Textos no `config.js`.** Nada de texto de jogo fixo no JavaScript: quem apresenta deve conseguir trocar piadas sem mexer na lógica.
- **Toda analogia tem dois lados** (`{ desenho, real }`), para funcionar com o Óculos da Velma.
- **O telão é a fonte da verdade** para o estado do jogo. Os celulares enviam comandos; escritas concorrentes usam `runTransaction` ou `increment()`.
- **Mobile-first** no `player.html`: botões grandes e nada que dependa de *hover*.
- **Animações em CSS** sempre que possível; o JavaScript só alterna classes.

## Estilo de código

- JavaScript moderno (ES Modules, `const`/`let`, *arrow functions*), com indentação de 2 espaços — o `.editorconfig` cuida disso.
- Nomes de variáveis, comentários e textos em **português**.
- Comente o **porquê**, principalmente em lógica de sincronização com o Firebase.
- Sempre use `textContent` (nunca `innerHTML`) para mostrar texto vindo do banco ou do `config.js`.

## Adicionando uma nova fase

1. **`config.js`** — crie `fase4` com os textos (pares `{ desenho, real }`) e parâmetros.
2. **`main.js`** — inclua o estado inicial em `estadoInicial()`, adicione o listener `onValue(ref(db, 'phase4'), …)` e inclua `'4'` nas teclas de fase.
3. **`main.html`** — crie `<section id="fase4" class="fase">`.
4. **`player.html` / `player.js`** — crie `<section id="p-fase4" class="p-fase">` e os envios de comando.
5. **`styles.css`** — inclua os seletores `body[data-fase="4"] #fase4` e `body[data-fase="4"] #p-fase4`.
6. **`database.rules.json`** — adicione a validação de `phase4` e aumente o limite de `currentPhase`.
7. **`README.md`** — documente a fase na tabela e no modelo de dados.

## Imagens

- Use apenas imagens **próprias ou com licença livre** (informe a fonte no PR). Não envie personagens ou logos protegidos por direitos autorais.
- Prefira PNG ou WebP com fundo transparente, com até ~300 KB cada.
- Se a imagem for nova, adicione um `data-emoji` de reserva e liste o arquivo em `img/LEIA-ME.txt`.

## Abrindo o pull request

- [ ] Testei no telão e em pelo menos um celular.
- [ ] Testei com o Óculos da Velma ligado (tecla `V`).
- [ ] Não há credenciais reais no `firebase-config.js`.
- [ ] Atualizei README, `config.js` e `database.rules.json` se necessário.

Descreva **o que mudou e por quê**. Capturas de tela ou GIFs ajudam muito em mudanças visuais.

## Reportando problemas

Abra uma *issue* com: o que você esperava, o que aconteceu, o navegador/celular usado e as mensagens do console (F12), se houver.
