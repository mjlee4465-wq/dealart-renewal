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
