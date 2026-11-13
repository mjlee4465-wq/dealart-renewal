(function () {
  var track = document.getElementById('heroTrack');
  var dots = Array.prototype.slice.call(document.querySelectorAll('.dot'));
  var hero = track.parentElement;
  var n = dots.length, i = 0, timer, startX = null, dx = 0;

  function go(k) {
    i = (k + n) % n;
    track.style.transform = 'translateX(' + (-i * 100) + '%)';
    dots.forEach(function (d, j) { d.classList.toggle('on', j === i); });
  }
  function play() { stop(); timer = setInterval(function () { go(i + 1); }, 5000); }
  function stop() { clearInterval(timer); }

  dots.forEach(function (d, j) { d.addEventListener('click', function () { go(j); play(); }); });

  hero.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; dx = 0; stop(); }, { passive: true });
  hero.addEventListener('touchmove', function (e) { if (startX !== null) dx = e.touches[0].clientX - startX; }, { passive: true });
  hero.addEventListener('touchend', function () {
    if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
    startX = null; play();
  });

  go(0); play();
})();

/* 방송·매체 소개: 한 번에 한 장, 가운데 정렬, 자동으로 한 장씩 넘김 */
(function () {
  var list = document.querySelector('.media-list');
  if (!list) return;
  var n = list.children.length;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var holder = document.createElement('div');
  holder.className = 'media-dots';
  holder.setAttribute('role', 'tablist');
  holder.setAttribute('aria-label', '방송·매체 소개 선택');
  var dots = [];
  for (var k = 0; k < n; k++) {
    (function (j) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'media-dot'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', (j + 1) + '번째 소개 보기');
      b.addEventListener('click', function () { goTo(j); restart(); });
      holder.appendChild(b); dots.push(b);
    })(k);
  }
  list.parentNode.insertBefore(holder, list.nextSibling);

  function width() { return list.clientWidth || 1; }
  function current() { return Math.max(0, Math.min(n - 1, Math.round(list.scrollLeft / width()))); }
  function paint(to) { var c = typeof to === 'number' ? to : current(); dots.forEach(function (d, j) { d.classList.toggle('on', j === c); d.setAttribute('aria-selected', j === c ? 'true' : 'false'); }); }
  // 바로 옆 카드는 부드럽게, 멀리 떨어진 카드(점 클릭, 마지막→처음)는 즉시 이동. scroll-snap-stop이 중간 카드에서 멈추게 하는 것을 피한다.
  function goTo(j) { var smooth = !reduce && Math.abs(j - current()) <= 1; list.scrollTo({ left: j * width(), behavior: smooth ? 'smooth' : 'auto' }); if (!smooth) paint(j); }

  var raf = 0;
  list.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; paint(); }); }, { passive: true });

  var timer = null, resumeAt = null;
  function tick() { goTo((current() + 1) % n); }
  function start() { if (reduce || timer) return; timer = setInterval(tick, 4500); }
  function stop() { clearInterval(timer); timer = null; clearTimeout(resumeAt); }
  function restart() { stop(); resumeAt = setTimeout(start, 6000); }
  ['touchstart', 'pointerdown', 'wheel', 'focusin'].forEach(function (ev) { list.addEventListener(ev, stop, { passive: true }); });
  ['touchend', 'touchcancel', 'pointerup'].forEach(function (ev) { list.addEventListener(ev, restart, { passive: true }); });
  window.addEventListener('resize', function () { list.scrollLeft = current() * width(); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });

  paint(); start();
})();
