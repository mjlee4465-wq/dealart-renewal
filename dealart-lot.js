/* 장바구니 단계에서 미리 보여 주는 주문번호 (DA-날짜-번호). 이 기기에서 순서대로 발급한다. */
(function () {
  'use strict';
  var SEQ = 'dealart.seq', ORD = 'dealart.orders';
  function pad(n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; }
  function ymd(d) { d = d || new Date(); return d.getFullYear() + pad(d.getMonth() + 1, 2) + pad(d.getDate(), 2); }
  function read(k, def) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? def : v; } catch (e) { return def; } }
  function nextNo() {
    var d = ymd(), s = read(SEQ, {}), n = s.d === d ? (s.n || 0) : 0, orders = read(ORD, []);
    if (!Array.isArray(orders)) orders = [];
    orders.forEach(function (o) { var m = /^DA-(\d{8})-(\d+)$/.exec(o.number || ''); if (m && m[1] === d) n = Math.max(n, +m[2]); });
    n++;
    try { localStorage.setItem(SEQ, JSON.stringify({ d: d, n: n })); } catch (e) {}
    return 'DA-' + d + '-' + pad(n, 4);
  }
  // 번호가 없는 묶음(브랜드+lot)에 번호를 붙인다. 바뀌면 true
  function ensure(cart) {
    var by = {}, changed = false, key = function (it) { return (it.brand || '스즈란테이') + '|' + (it.lot || ''); };
    cart.forEach(function (it) { if (it.no) by[key(it)] = it.no; });
    cart.forEach(function (it) { if (it.no) return; var k = key(it); if (!by[k]) by[k] = nextNo(); it.no = by[k]; changed = true; });
    return changed;
  }
  window.DealartLot = { nextNo: nextNo, ensure: ensure };
})();
