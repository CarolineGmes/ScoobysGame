/* ============================================================================
 * player.js — TELA DO CELULAR
 * ----------------------------------------------------------------------------
 * O celular é "burro" de propósito: ele só
 *   1. ESCUTA gameState/currentPhase para saber qual tela mostrar;
 *   2. ESCREVE comandos no Firebase quando o jogador toca nos botões.
 *
 * Por que transações (runTransaction)?
 *   Com dezenas de pessoas clicando ao mesmo tempo, um "ler valor → subtrair →
 *   gravar" comum perderia cliques (dois celulares leem 100 e ambos gravam 99).
 *   A transação garante que o servidor aplique cada operação sobre o valor
 *   MAIS RECENTE, refazendo a função automaticamente se houver conflito.
 *
 * Por que increment()?
 *   Para contadores simples (cliques do escudo), increment(n) é atômico e mais
 *   leve que uma transação: o servidor soma direto, sem ida-e-volta.
 * ========================================================================== */

import { firebaseConfig, firebaseConfigurado, FIREBASE_SDK } from './firebase-config.js';
import { CONFIG } from './config.js';
import './imagens.js'; // troca <img> inexistentes por emojis (roda antes do Firebase)


/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const lerConfig = (caminho) => caminho.split('.').reduce((obj, chave) => obj?.[chave], CONFIG);

// Preenche textos vindos do config.js (data-texto="fase1.terreo.desenho")
$$('[data-texto]').forEach((el) => { el.textContent = String(lerConfig(el.dataset.texto) ?? ''); });

/** Vibração (Android). No iPhone simplesmente não faz nada. */
const vibrar = (padrao) => navigator.vibrate?.(padrao);

function reiniciarAnimacao(el, classe) {
  el.classList.remove(classe);
  void el.offsetWidth;
  el.classList.add(classe);
}

const feedbackEl = $('#p-feedback');
function feedback(texto, tipo = 'ok') {
  feedbackEl.textContent = texto;
  feedbackEl.dataset.tipo = tipo;
  reiniciarAnimacao(feedbackEl, 'mostrar');
}

/* ---------------------------------------------------------------------------
 * Firebase
 * ------------------------------------------------------------------------- */
if (!firebaseConfigurado) {
  $('#aviso-config').hidden = false;
  throw new Error('Firebase não configurado.');
}

// SDK do Firebase via CDN — carregado só aqui, depois que os textos já estão na tela.
const { initializeApp } = await import(`${FIREBASE_SDK}/firebase-app.js`);
const { getDatabase, ref, onValue, set, runTransaction, increment } =
  await import(`${FIREBASE_SDK}/firebase-database.js`);

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

onValue(ref(db, '.info/connected'), (snap) => {
  $('#conexao').classList.toggle('on', snap.val() === true);
});

// A tela muda sozinha quando o apresentador aperta 1, 2 ou 3 no projetor
onValue(ref(db, 'gameState/currentPhase'), (snap) => {
  document.body.dataset.fase = String(Number(snap.val()) || 0);
  window.scrollTo(0, 0);
});

/* ===========================================================================
 * FASE 1 — Orçamento de Biscoitos
 * ========================================================================= */
const C1 = CONFIG.fase1;
const btnUnit = $('#btn-unit');
const btnE2E = $('#btn-e2e');

// Escutar a fase 1 também mantém o cache local atualizado, o que faz as
// transações abaixo acertarem de primeira na maioria das vezes.
onValue(ref(db, 'phase1'), (snap) => {
  const biscoitos = Math.max(0, snap.val()?.biscoitos ?? 0);
  $('#p-biscoitos').textContent = biscoitos;
  btnUnit.disabled = biscoitos < C1.custoUnitario;
  btnE2E.disabled = biscoitos < C1.custoE2E;
});

async function testar(campo, custo) {
  vibrar(30);
  try {
    const resultado = await runTransaction(ref(db, 'phase1'), (atual) => {
      // null = cache local ainda vazio. Devolvemos null e o Firebase refaz
      // a função com o valor real do servidor.
      if (atual === null) return atual;
      if ((atual.biscoitos ?? 0) < custo) return; // undefined = ABORTA (sem saldo)
      atual.biscoitos -= custo;
      atual[campo] = (atual[campo] || 0) + 1;
      return atual;
    });
    if (resultado.committed) feedback(`-${custo} 🍪`);
    else feedback('Sem biscoitos! 😱', 'erro');
  } catch (err) {
    console.error(err);
    feedback('Falha na conexão', 'erro');
  }
}

btnUnit.addEventListener('click', () => testar('unitarios', C1.custoUnitario));
btnE2E.addEventListener('click', () => testar('e2e', C1.custoE2E));

/* ===========================================================================
 * FASE 2 — Armadilha do Fred (TDD)
 * A validação da ordem acontece DENTRO da transação, então é à prova de
 * concorrência: se 30 pessoas clicarem RED juntas, só o primeiro avança o
 * step; os outros caem no caso "repetido" e são ignorados sem gerar erro.
 * ========================================================================= */
onValue(ref(db, 'phase2'), (snap) => {
  const step = snap.val()?.step || 0;
  $$('[data-acao]').forEach((btn) => btn.classList.toggle('feito', Number(btn.dataset.acao) <= step));
});

async function etapa(acao) {
  vibrar(40);
  let resultado = 'ignorado';
  try {
    await runTransaction(ref(db, 'phase2'), (atual) => {
      if (atual === null) return atual;
      const step = atual.step || 0;
      if (acao === step + 1) {            // ordem certa → avança
        resultado = 'ok';
        atual.step = acao;
        return atual;
      }
      if (acao > step + 1) {              // pulou etapa → registra erro
        resultado = 'erro';
        atual.errors = (atual.errors || 0) + 1;
        return atual;
      }
      resultado = 'ignorado';             // etapa já feita → não grava nada
      return;
    });
  } catch (err) {
    console.error(err);
    return feedback('Falha na conexão', 'erro');
  }

  if (resultado === 'ok') feedback('Boa! ✔');
  else if (resultado === 'erro') { feedback('Não pule etapas! 🚫', 'erro'); vibrar([80, 40, 80]); }
  else feedback('Essa etapa já foi 😉');
}

$$('[data-acao]').forEach((btn) => {
  btn.addEventListener('click', () => etapa(Number(btn.dataset.acao)));
});

/* ===========================================================================
 * FASE 3 — Segura o Servidor & Puxa a Máscara
 * Button mashing gera MUITOS cliques. Em vez de 1 escrita por toque, juntamos
 * os toques em lotes a cada 250ms e enviamos increment(n). Menos tráfego,
 * mesma contagem final.
 * ========================================================================= */
const C3 = CONFIG.fase3;
const secao3 = $('#p-fase3');
const btnEscudo = $('#btn-escudo');
let stage3 = 'waiting';
let pendentes = 0;
let meusCliques = 0;

onValue(ref(db, 'phase3'), (snap) => {
  const stage = snap.val()?.stage || 'waiting';
  if (stage === 'waiting' && stage3 !== 'waiting') {
    meusCliques = 0;
    $('#p-cliques').textContent = '0';
  }
  stage3 = stage;
  secao3.dataset.stage = stage; // o CSS decide qual botão aparece
  $('#p-msg3').textContent = C3.mensagens[stage]?.desenho ?? '';
  btnEscudo.disabled = stage !== 'running';
});

// pointerdown responde no instante do toque (click espera o dedo levantar)
btnEscudo.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (stage3 !== 'running') return;
  pendentes++;
  meusCliques++;
  $('#p-cliques').textContent = meusCliques;
  vibrar(10);
  reiniciarAnimacao(btnEscudo, 'apertado');
});

setInterval(() => {
  if (pendentes === 0) return;
  const lote = pendentes;
  pendentes = 0;
  set(ref(db, 'phase3/shieldPower'), increment(lote));
}, 250);

$('#btn-mascara').addEventListener('click', () => {
  vibrar([60, 30, 120]);
  set(ref(db, 'phase3/maskPulled'), true);
  feedback('Puxaaaa! 🎭');
});
