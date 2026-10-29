/* ============================================================================
 * config.js — TEXTOS E AJUSTES DO JOGO
 * ----------------------------------------------------------------------------
 * Edite à vontade: nenhum arquivo de lógica precisa ser alterado.
 *
 * Todo par { desenho, real } vira automaticamente uma "analogia":
 *   - desenho → o que aparece normalmente (tema Scooby-Doo)
 *   - real    → o que aparece com o "Óculos da Velma" ligado (tecla V)
 * ========================================================================== */

export const CONFIG = {
  // URL que aparece no telão para a plateia entrar.
  // Deixe vazio ('') para usar automaticamente o endereço atual + /player.html
  // Ex.: 'https://meu-jogo.web.app/player.html' ou 'http://192.168.0.10:5500/player.html'
  playerUrl: '',

  titulo: { desenho: 'Mistério S.A.', real: 'DevSecOps Inc.' },

  /* ---------------------------------------------------------------------- */
  /* FASE 1 — Orçamento de Biscoitos (Pirâmide de Testes)                    */
  /* ---------------------------------------------------------------------- */
  fase1: {
    biscoitosIniciais: 100,
    custoUnitario: 1,
    custoE2E: 20,

    titulo:    { desenho: 'Orçamento de Biscoitos', real: 'Pirâmide de Testes' },
    biscoitos: { desenho: 'Biscoitos Scooby',       real: 'Orçamento de CI (minutos de pipeline)' },
    terreo:    { desenho: 'Testar no Térreo (Unitário)', real: 'Teste Unitário → Shift Left ✔' },
    telhado:   { desenho: 'Testar no Telhado (E2E)',     real: 'Só E2E → Anti-pattern (cone de sorvete) ✘' },
    fome:      { desenho: 'Ruh-roh! O Scooby ficou sem biscoitos!',
                 real: 'Orçamento esgotado: E2E demais = pipeline lento e caro' },
    instrucao: 'Cada teste custa biscoitos. Gastem com sabedoria!',
  },

  /* ---------------------------------------------------------------------- */
  /* FASE 2 — A Armadilha do Fred (TDD e DoD)                                */
  /* ---------------------------------------------------------------------- */
  fase2: {
    titulo:    { desenho: 'A Armadilha do Fred', real: 'TDD + Definition of Done' },
    red:       { desenho: 'Montar a isca',        real: 'RED: escreva o teste que falha' },
    green:     { desenho: 'Fantasma na armadilha', real: 'GREEN: código mínimo para passar' },
    refactor:  { desenho: 'Jaula de aço',          real: 'REFACTOR: limpe sem quebrar' },
    monstro:   { desenho: 'O Fantasma do Bug',     real: 'Bug em Produção' },
    capturado: { desenho: 'Pegamos o fantasma! 🎉', real: 'DoD cumprido: testado, verde e refatorado ✔' },
    erro:      { desenho: 'Não pule etapas!',       real: 'TDD é Red → Green → Refactor. Sem atalhos!' },
    instrucao: 'Montem a armadilha na ordem certa!',
  },

  /* ---------------------------------------------------------------------- */
  /* FASE 3 — Segura o Servidor & Puxa a Máscara                             */
  /* ---------------------------------------------------------------------- */
  fase3: {
    // --- Balanceamento (ajuste conforme o tamanho da plateia) -------------
    // A latência vai de 0 a 100 (%). Se chegar a 100, o servidor cai.
    duracaoSegundos: 10,     // quanto tempo a plateia precisa sobreviver
    latenciaInicial: 15,     // % inicial da barra
    subidaPorSegundo: 9,     // quanto a barra sobe por segundo (no início)
    aceleracao: 1.5,         // no fim, a subida é (1 + aceleracao)x mais rápida
    reducaoPorClique: 0.1,   // quanto CADA clique da plateia abaixa a barra
    //   Regra de bolso: são necessários ~ 75 / reducaoPorClique cliques no total.
    //   0.1 → ~750 cliques em 10s (≈ 15 pessoas clicando rápido).
    //   Plateia pequena? Aumente para 0.3. Plateia enorme? Diminua para 0.04.
    latenciaMaximaMs: 3000,  // valor em ms exibido quando a barra está em 100%

    titulo:   { desenho: 'Segura o Servidor!',      real: 'Teste de Performance + Aceitação' },
    horda:    { desenho: '10.000 zumbis chegando!', real: 'Teste de carga: 10.000 usuários simultâneos' },
    latencia: { desenho: 'Nível de pânico do Salsicha', real: 'Latência p99' },
    escudo:   { desenho: 'Escudo Lighthouse',       real: 'Otimização: cache, lazy-load, CDN' },
    mascara:  { desenho: 'Puxar a Máscara!',        real: 'Teste de Aceitação (UAT)' },
    monstro:  { desenho: 'Fantasma Misterioso',     real: 'Código Espaguete' },

    // Mensagens por estágio da fase 3
    mensagens: {
      waiting:  { desenho: 'Preparem-se... os zumbis estão vindo!',
                  real: 'Aguardando início do teste de carga (ESPAÇO)' },
      running:  { desenho: 'Cliquem no Escudo! Segurem o servidor!',
                  real: 'Mantenham o p99 abaixo do SLO!' },
      mask:     { desenho: 'Pegamos o monstro! Agora... puxem a máscara!',
                  real: 'Performance aprovada. Hora do teste de aceitação!' },
      unmasked: { desenho: 'Era o Código Espaguete o tempo todo! 🍝',
                  real: 'Causa raiz: débito técnico (alto acoplamento, zero testes)' },
      failed:   { desenho: 'Zoinks! O servidor caiu!',
                  real: 'SLO violado: o p99 estourou. Bora otimizar! (R = tentar de novo)' },
    },
  },
};
