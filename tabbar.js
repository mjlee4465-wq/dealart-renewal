(function () {
  var bar = document.querySelector('.tabbar');
  if (!bar) return;
  var fab = document.querySelector('.kakao-fab');

  /* 1) 스크롤을 내리면 숨기고, 올리면 다시 보여준다 */
  var lastY = window.pageYOffset, ticking = false, THRESHOLD = 8, MIN_Y = 80;
  function setHidden(hidden) {
    bar.classList.toggle('is-hidden', hidden);
    if (fab) fab.classList.toggle('is-low', hidden);
  }
  function onScroll() {
    var y = window.pageYOffset;
    var nearBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 4;
    if (y < MIN_Y || nearBottom) setHidden(false);
    else if (y - lastY > THRESHOLD) setHidden(true);
    else if (lastY - y > THRESHOLD) setHidden(false);
    lastY = y; ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  // 키보드로 탭에 포커스가 가면 항상 보여준다
  bar.addEventListener('focusin', function () { setHidden(false); });

  /* 2) 주문조회 배지: 처리 중인 주문 수. 0이면 숨김 */
  var orderTab = bar.querySelector('[data-order-tab]');
  var badge = bar.querySelector('.tab-badge');
  function setOrderBadge(n) {
    n = Math.max(0, parseInt(n, 10) || 0);
    if (!badge || !orderTab) return;
    badge.hidden = n === 0;
    badge.textContent = n > 9 ? '9+' : String(n);
    orderTab.setAttribute('aria-label', n ? '주문조회, 처리 중인 주문 ' + n + '건' : '주문조회');
  }
  var initial = orderTab ? orderTab.getAttribute('data-count') : 0;
  try { var saved = localStorage.getItem('dealart.orderCount'); if (saved !== null) initial = saved; } catch (e) {}
  setOrderBadge(initial);
  window.DealartTabbar = { setOrderBadge: setOrderBadge };
})();
