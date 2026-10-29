/* ============================================================================
 * imagens.js — <img> com reserva em emoji
 * ----------------------------------------------------------------------------
 * As telas usam <img src="img/monstro.png" data-emoji="👻">.
 * Se o arquivo ainda não existir (ou falhar ao carregar), a <img> é trocada por
 * um <span> com o emoji, mantendo as mesmas classes e id. Assim o CSS e o JS
 * continuam funcionando igual, e você pode adicionar as imagens quando quiser.
 *
 * data-emoji="" (vazio) → a <img> é só removida (ex.: a jaula volta a ser CSS).
 * ========================================================================== */

function trocarPorEmoji(img) {
  const emoji = img.dataset.emoji;
  if (!emoji) { img.remove(); return; }

  const span = document.createElement('span');
  span.className = img.className;
  if (img.id) span.id = img.id;
  span.textContent = emoji;
  span.setAttribute('role', 'img');
  if (img.alt) span.setAttribute('aria-label', img.alt);
  img.replaceWith(span);
}

document.querySelectorAll('img[data-emoji]').forEach((img) => {
  // A imagem pode já ter falhado antes deste script rodar: checamos as duas situações.
  if (img.complete && img.naturalWidth === 0) trocarPorEmoji(img);
  else img.addEventListener('error', () => trocarPorEmoji(img), { once: true });
});
