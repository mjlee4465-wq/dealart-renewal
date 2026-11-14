(function () {
  var $ = function (id) { return document.getElementById(id); };

  /* 사진 슬라이드 + 점 */
  var slides = $('bdSlides'), dots = $('bdDots').children;
  function paint() { var i = Math.round(slides.scrollLeft / (slides.clientWidth || 1)); Array.prototype.forEach.call(dots, function (d, j) { d.classList.toggle('on', j === i); }); }
  slides.addEventListener('scroll', function () { requestAnimationFrame(paint); }, { passive: true });

  /* 찜 (이 기기에만 저장) */
  var KEY = 'dealart.fav.suzuran', heart = $('bdHeart');
  function setHeart(on) { heart.setAttribute('aria-pressed', on ? 'true' : 'false'); heart.setAttribute('aria-label', on ? '찜 해제' : '찜하기'); }
  try { setHeart(localStorage.getItem(KEY) === '1'); } catch (e) {}
  heart.addEventListener('click', function () {
    var on = heart.getAttribute('aria-pressed') !== 'true'; setHeart(on);
    try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) {}
    toast(on ? '찜했어요' : '찜을 해제했어요');
  });

  /* 공유: 기기 공유창이 있으면 그것을, 없으면 링크 복사 */
  var tt;
  function toast(msg) { var t = $('bdToast'); t.textContent = msg; t.hidden = false; clearTimeout(tt); tt = setTimeout(function () { t.hidden = true; }, 1800); }
  $('bdShare').addEventListener('click', function () {
    var url = location.href.split('#')[0];
    if (navigator.share) { navigator.share({ title: '스즈란테이 | DEALART', url: url }).catch(function () {}); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { toast('링크를 복사했어요'); }, function () { toast('링크를 복사하지 못했어요'); });
    else toast('링크를 복사하지 못했어요');
  });

  /* 메뉴 탭: 누른 탭의 목록만 보여준다 */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('#bdTabs [role=tab]'));
  function select(i, focus) {
    tabs.forEach(function (b, k) {
      var on = k === i;
      b.classList.toggle('on', on); b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
      document.getElementById(b.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tabs[i].focus();
  }
  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { select(i); });
    b.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); select((i + d + tabs.length) % tabs.length, true); }
    });
  });
  select(0);
})();
