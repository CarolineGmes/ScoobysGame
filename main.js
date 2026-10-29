/* ============================================================================
 * main.js — TELA DO PROJETOR
 * ----------------------------------------------------------------------------
 * Responsabilidades:
 *  1. Conectar ao Firebase Realtime Database e ESCUTAR (onValue) cada fase.
 *  2. Transformar mudanças nos dados em animações na tela.
 *  3. Ler o teclado do apresentador e ESCREVER no banco (fase atual, reset...).
 *  4. Rodar a simulação de latência da Fase 3 (só o projetor faz isso, para
 *     existir uma única "fonte da verdade" sobre o tempo e a barra).
 *
 * Fluxo de dados:
 *   player.html ──(escreve)──▶ Firebase ──(onValue em tempo real)──▶ main.html
 *   main.html   ──(teclas 1/2/3/R/Espaço)──▶ Firebase ──▶ todos os player.html
 * ========================================================================== */

import { firebaseConfig, firebaseConfigurado, FIREBASE_SDK } from './firebase-config.js';
import { CONFIG } from './config.js';
import './imagens.js'; // troca <img> inexistentes por emojis (roda antes do Firebase)


/* ---------------------------------------------------------------------------
 * Helpers de DOM
 * ------------------------------------------------------------------------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

/** Lê um valor do CONFIG a partir de um caminho tipo "fase1.terreo". */
const lerConfig = (caminho) => caminho.split('.').reduce((obj, chave) => obj?.[chave], CONFIG);

/**
 * Monta a estrutura da analogia dentro de um elemento:
 *   <span class="analogia-container">
 *     <span class="tema-desenho">...</span>
 *     <span class="tema-real">...</span>
 *   </span>
 * Quem decide qual aparece é o CSS (classe .velma-vision no <body>).
 * Usamos textContent (e não innerHTML) para nunca interpretar HTML vindo de config.
 */
function renderAnalogia(el, par) {
  const box = document.createElement('span');
  box.className = 'analogia-container';

  const desenho = document.createElement('span');
  desenho.className = 'tema-desenho';
  desenho.textContent = par?.desenho ?? '';

  const real = document.createElement('span');
  real.className = 'tema-real';
  real.textContent = par?.real ?? '';

  box.append(desenho, real);
  el.replaceChildren(box);
}

/**
 * Truque clássico para reiniciar uma animação CSS:
 * remove a classe, força um "reflow" (lendo offsetWidth) e adiciona de novo.
 * Sem o reflow, o navegador "junta" as duas operações e a animação não repete.
 */
function reiniciarAnimacao(el, classe) {
  el.classList.remove(classe);
  void el.offsetWidth;
  el.classList.add(classe);
}

/** Cria um texto que sobe e some (ex.: "-20 🍪") e se remove no fim da animação. */
function flutuar(texto, container) {
  const span = document.createElement('span');
  span.className = 'flutuante';
  span.textContent = texto;
  span.style.left = `${30 + Math.random() * 40}%`;
  container.appendChild(span);
  span.addEventListener('animationend', () => span.remove());
}

// Preenche todos os elementos marcados com data-analogia="caminho.no.config"
$$('[data-analogia]').forEach((el) => renderAnalogia(el, lerConfig(el.dataset.analogia)));

// Mostra a URL que a plateia deve acessar
$('#player-url').textContent = CONFIG.playerUrl || new URL('player.html', location.href).href;

/* ---------------------------------------------------------------------------
 * Inicialização do Firebase
 * ------------------------------------------------------------------------- */
if (!firebaseConfigurado) {
  $('#aviso-config').hidden = false;
  throw new Error('Preencha o firebase-config.js antes de continuar.');
}

// SDK do Firebase via CDN — carregado só aqui, depois que os textos já estão na tela.
const { initializeApp } = await import(`${FIREBASE_SDK}/firebase-app.js`);
const { getDatabase, ref, onValue, set, update, get } = await import(`${FIREBASE_SDK}/firebase-database.js`);

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/** Estado "zerado" de cada fase. Usado na criação inicial e no reset (tecla R). */
function estadoInicial(fase) {
  switch (fase) {
    case 1: return { biscoitos: CONFIG.fase1.biscoitosIniciais, unitarios: 0, e2e: 0 };
    case 2: return { step: 0, errors: 0 };
    case 3: return { shieldPower: 0, maskPulled: false, stage: 'waiting' };
    default: return null;
  }
}

/**
 * Na primeira execução o banco está vazio. Criamos a estrutura:
 * { gameState: {currentPhase}, phase1: {...}, phase2: {...}, phase3: {...} }
 * update() na raiz com várias chaves = escrita atômica de tudo de uma vez.
 */
async function garantirEstrutura() {
  const snap = await get(ref(db));
  const atual = snap.val() || {};
  const faltando = {};
  if (!atual.gameState) faltando.gameState = { currentPhase: 1 };
  for (const f of [1, 2, 3]) {
    if (!atual[`phase${f}`]) faltando[`phase${f}`] = estadoInicial(f);
  }
  if (Object.keys(faltando).length) await update(ref(db), faltando);
}
garantirEstrutura().catch((err) => console.error('Erro ao criar estrutura inicial:', err));

/* ---------------------------------------------------------------------------
 * Indicador de conexão
 * ".info/connected" é um caminho especial do Firebase: true quando o cliente
 * está conectado ao servidor. Ótimo para saber se o Wi-Fi do evento caiu.
 * ------------------------------------------------------------------------- */
onValue(ref(db, '.info/connected'), (snap) => {
  $('#conexao').classList.toggle('on', snap.val() === true);
});

/* ---------------------------------------------------------------------------
 * Fase atual (gameState/currentPhase)
 * O projetor também ESCUTA esse valor (em vez de só mudar localmente). Assim,
 * se você abrir duas abas do projetor, ambas ficam sincronizadas.
 * ------------------------------------------------------------------------- */
let faseAtual = 1;
onValue(ref(db, 'gameState/currentPhase'), (snap) => {
  faseAtual = Number(snap.val()) || 1;
  document.body.dataset.fase = String(faseAtual); // o CSS mostra a <section> certa
});

/* ===========================================================================
 * FASE 1 — Orçamento de Biscoitos
 * Os celulares fazem uma transação que subtrai biscoitos e soma contadores.
 * Aqui só reagimos: atualizamos números e soltamos o "-20 🍪" flutuante.
 * ========================================================================= */
const C1 = CONFIG.fase1;
const valorBiscoitos = $('#biscoitos-valor');
let ultimoP1 = null;

onValue(ref(db, 'phase1'), (snap) => {
  const d = snap.val() || {};
  const biscoitos = Math.max(0, d.biscoitos ?? 0);
  const unit = d.unitarios || 0;
  const e2e = d.e2e || 0;

  valorBiscoitos.textContent = biscoitos;
  $('#unit-count').textContent = unit;
  $('#e2e-count').textContent = e2e;

  // Animação só quando houve gasto (e não no primeiro carregamento)
  if (ultimoP1 && biscoitos < ultimoP1.biscoitos) {
    reiniciarAnimacao(valorBiscoitos, 'pulo');
    const box = $('#biscoitos-box');
    const novosE2E = e2e - ultimoP1.e2e;
    const novosUnit = unit - ultimoP1.unit;
    if (novosE2E > 0) flutuar(`-${novosE2E * C1.custoE2E} 🍪`, box);
    if (novosUnit > 0) flutuar(`-${novosUnit * C1.custoUnitario} 🍪`, box);
  }

  valorBiscoitos.classList.toggle('baixo', biscoitos < C1.custoE2E);
  $('#fome').hidden = biscoitos >= C1.custoUnitario;
  ultimoP1 = { biscoitos, unit, e2e };
});

/* ===========================================================================
 * FASE 2 — Armadilha do Fred (TDD)
 * Quem valida a ordem é a TRANSAÇÃO feita no celular (ver player.js):
 *   - clique certo  → step avança (0→1→2→3)
 *   - clique pulando etapa → errors++
 *   - clique repetido (ex.: RED de novo) → ignorado
 * Aqui comparamos o valor novo com o anterior para disparar as animações.
 * ========================================================================= */
const C2 = CONFIG.fase2;
const flash = $('#flash');
const palco = $('#palco');
const toast = $('#toast');
let ultimoP2 = null;

function piscar(cor) {
  // Remove qualquer cor anterior, força reflow e aplica a nova (reinicia a animação)
  flash.className = '';
  void flash.offsetWidth;
  flash.className = cor;
}

function mostrarToast(par) {
  renderAnalogia(toast, par);
  reiniciarAnimacao(toast, 'visivel');
}

onValue(ref(db, 'phase2'), (snap) => {
  const d = snap.val() || {};
  const step = d.step || 0;
  const errors = d.errors || 0;

  // Acende as etapas concluídas na trilha
  $$('.etapa').forEach((el) => el.classList.toggle('feita', Number(el.dataset.step) <= step));

  if (ultimoP2) {
    if (step > ultimoP2.step) {
      if (step === 1) piscar('vermelho');
      if (step === 2) piscar('verde');
      if (step === 3) piscar('aco');
    }
    if (errors > ultimoP2.errors) {
      reiniciarAnimacao(palco, 'tremer');
      mostrarToast(C2.erro);
    }
  }

  // A jaula "cai" via transição CSS quando a classe .fechada é adicionada
  $('#jaula').classList.toggle('fechada', step >= 3);
  $('#capturado').hidden = step < 3;
  ultimoP2 = { step, errors };
});

/* ===========================================================================
 * FASE 3 — Segura o Servidor & Puxa a Máscara
 *
 * Estágios (phase3/stage), controlados SÓ pelo projetor:
 *   waiting  → aguardando o apresentador apertar ESPAÇO
 *   running  → simulação rodando: barra sobe sozinha, cliques fazem descer
 *   mask     → sobreviveram! celulares mostram o botão "Puxar a Máscara!"
 *   unmasked → alguém puxou: revela o Código Espaguete
 *   failed   → a barra chegou a 100%: servidor caiu (R para tentar de novo)
 *
 * Os celulares só incrementam phase3/shieldPower (contador de cliques).
 * O projetor calcula a DIFERENÇA desde a última leitura e abaixa a barra.
 * ========================================================================= */
const C3 = CONFIG.fase3;
const secao3 = $('#fase3');
const barra = $('#barra');
// (o escudo é buscado na hora: a <img> pode ter sido trocada por emoji)

const p3 = {
  stage: null,
  latencia: 0,      // 0..100 (%)
  decorrido: 0,     // segundos sobrevividos
  rodando: false,
  ultimoEscudo: 0,  // último valor de shieldPower lido (para calcular o delta)
  ultimoT: 0,       // timestamp do último frame
};

function desenharMedidor() {
  barra.style.width = `${p3.latencia}%`;
  barra.classList.toggle('alerta', p3.latencia >= 50 && p3.latencia < 80);
  barra.classList.toggle('critica', p3.latencia >= 80);
  const ms = Math.round((p3.latencia / 100) * C3.latenciaMaximaMs);
  $('#latencia-ms').textContent = `${ms} ms`;
  $('#cronometro').textContent = `⏱️ ${Math.max(0, C3.duracaoSegundos - p3.decorrido).toFixed(1)}s`;
}

/**
 * Loop de animação (requestAnimationFrame ≈ 60x por segundo).
 * dt = tempo desde o último frame, então a velocidade não depende do FPS.
 * A pressão aumenta com o tempo: "mais zumbis chegando".
 */
function loop(t) {
  if (!p3.rodando) return;
  const dt = Math.min(0.1, (t - p3.ultimoT) / 1000); // limita saltos se a aba travar
  p3.ultimoT = t;
  p3.decorrido += dt;

  const pressao = 1 + (p3.decorrido / C3.duracaoSegundos) * C3.aceleracao;
  p3.latencia = Math.min(100, p3.latencia + C3.subidaPorSegundo * pressao * dt);
  desenharMedidor();

  if (p3.latencia >= 100) {
    p3.rodando = false;
    update(ref(db, 'phase3'), { stage: 'failed' });
    return;
  }
  if (p3.decorrido >= C3.duracaoSegundos) {
    p3.rodando = false;
    update(ref(db, 'phase3'), { stage: 'mask' });
    return;
  }
  requestAnimationFrame(loop);
}

function entrarEstagio(stage) {
  secao3.dataset.stage = stage; // o CSS mostra/esconde blocos por estágio
  renderAnalogia($('#mensagem3'), C3.mensagens[stage]);

  if (stage === 'running' && !p3.rodando) {
    p3.latencia = C3.latenciaInicial;
    p3.decorrido = 0;
    p3.rodando = true;
    p3.ultimoT = performance.now();
    requestAnimationFrame(loop);
  }
  if (stage !== 'running') p3.rodando = false;
  if (stage === 'waiting') { p3.latencia = 0; p3.decorrido = 0; }
  if (stage === 'failed') reiniciarAnimacao(palco, 'tremer');
  if (stage === 'unmasked') piscar('aco');
  desenharMedidor();
}

onValue(ref(db, 'phase3'), (snap) => {
  const d = snap.val() || {};

  // Delta de cliques desde a última atualização → abaixa a latência
  const escudoTotal = d.shieldPower || 0;
  const delta = escudoTotal - p3.ultimoEscudo;
  p3.ultimoEscudo = escudoTotal;
  if (p3.rodando && delta > 0) {
    p3.latencia = Math.max(0, p3.latencia - delta * C3.reducaoPorClique);
    reiniciarAnimacao($('#escudo'), 'pulsar');
    desenharMedidor();
  }

  const stage = d.stage || 'waiting';
  if (stage !== p3.stage) {
    p3.stage = stage;
    entrarEstagio(stage);
  }

  // A plateia puxou a máscara → o projetor oficializa a revelação
  if (stage === 'mask' && d.maskPulled) update(ref(db, 'phase3'), { stage: 'unmasked' });
});

function soltarZumbis() {
  if (faseAtual !== 3) return;
  if (p3.stage === 'waiting' || p3.stage === 'failed') {
    update(ref(db, 'phase3'), { stage: 'running', maskPulled: false });
  }
}

/* ===========================================================================
 * Controles do apresentador (teclado)
 * ========================================================================= */
function alternarVelma() {
  // Toda a mágica está no CSS: .velma-vision troca .tema-desenho por .tema-real
  document.body.classList.toggle('velma-vision');
}

function resetarFase(fase) {
  // set() substitui o nó inteiro da fase pelo estado inicial.
  // Os listeners acima recebem o novo valor e a tela se "desmonta" sozinha.
  set(ref(db, `phase${fase}`), estadoInicial(fase));
}

function alternarTelaCheia() {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.();
}

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
  const tecla = e.key.toLowerCase();

  if (['1', '2', '3'].includes(tecla)) {
    // Escreve no banco → todos os celulares trocam de tela automaticamente
    set(ref(db, 'gameState/currentPhase'), Number(tecla));
  } else if (tecla === 'v') {
    alternarVelma();
  } else if (tecla === 'r') {
    resetarFase(faseAtual);
  } else if (e.code === 'Space') {
    e.preventDefault();
    soltarZumbis();
  } else if (tecla === 'f') {
    alternarTelaCheia();
  }
});
