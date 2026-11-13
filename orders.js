(function () {
  var form = document.getElementById('orderForm');
  if (!form) return;
  var selY = document.getElementById('orderYear');
  var selM = document.getElementById('orderMonth');
  var selD = document.getElementById('orderDay');
  var dateErr = document.getElementById('orderDateErr');
  var phone = document.getElementById('orderPhone');
  var phoneErr = document.getElementById('orderPhoneErr');
  var result = document.getElementById('orderResult');
  var resultDesc = document.getElementById('orderResultDesc');
  var today = new Date();

  function opt(value, label) { var o = document.createElement('option'); o.value = value; o.textContent = label; return o; }
  function fill(sel, placeholder, from, to) {
    var keep = sel.value;
    sel.innerHTML = '';
    sel.appendChild(opt('', placeholder));
    for (var i = from; i <= to; i++) sel.appendChild(opt(String(i), String(i)));
    if (keep && Number(keep) >= from && Number(keep) <= to) sel.value = keep;
  }
  // 연도: 올해부터 2년 전까지. 일: 고른 연·월의 마지막 날까지
  fill(selY, '년', today.getFullYear() - 2, today.getFullYear());
  // 최신 연도가 먼저 보이도록 뒤집는다
  (function () { var first = selY.firstChild, rest = Array.prototype.slice.call(selY.children, 1).reverse(); rest.forEach(function (o) { selY.appendChild(o); }); selY.insertBefore(first, selY.firstChild); })();
  fill(selM, '월', 1, 12);
  fill(selD, '일', 1, 31);

  function daysIn(y, m) { return new Date(y, m, 0).getDate(); }
  function refreshDays() {
    var y = Number(selY.value), m = Number(selM.value);
    fill(selD, '일', 1, y && m ? daysIn(y, m) : 31);
  }
  selY.addEventListener('change', function () { refreshDays(); clearDate(); });
  selM.addEventListener('change', function () { refreshDays(); clearDate(); });
  selD.addEventListener('change', clearDate);

  // 휴대폰 번호는 입력하는 동안 010-0000-0000 형태로 맞춘다
  function formatPhone(v) {
    var d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length < 4) return d;
    if (d.length < 8) return d.slice(0, 3) + '-' + d.slice(3);
    return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
  }
  phone.addEventListener('input', function () { phone.value = formatPhone(phone.value); clear(phone, phoneErr); });

  function show(el, msg, inputs) { el.textContent = msg; el.hidden = false; inputs.forEach(function (i) { i.setAttribute('aria-invalid', 'true'); }); }
  function clear(input, el) { el.hidden = true; el.textContent = ''; input.removeAttribute('aria-invalid'); }
  function clearDate() { dateErr.hidden = true; dateErr.textContent = ''; [selY, selM, selD].forEach(function (s) { s.removeAttribute('aria-invalid'); }); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    result.hidden = true;
    clearDate(); clear(phone, phoneErr);
    var bad = null;
    var y = Number(selY.value), m = Number(selM.value), d = Number(selD.value);
    if (!y || !m || !d) {
      show(dateErr, '주문 날짜를 선택해 주세요.', [selY, selM, selD].filter(function (s) { return !s.value; }));
      bad = [selY, selM, selD].filter(function (s) { return !s.value; })[0];
    } else {
      var picked = new Date(y, m - 1, d);
      var startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (picked.getMonth() !== m - 1) { show(dateErr, '존재하지 않는 날짜입니다.', [selD]); bad = selD; }
      else if (picked > startOfToday) { show(dateErr, '오늘 이후의 날짜는 선택할 수 없습니다.', [selY, selM, selD]); bad = selY; }
    }
    var digits = phone.value.replace(/\D/g, '');
    if (!/^01\d{8,9}$/.test(digits)) { show(phoneErr, '휴대폰 번호를 정확히 입력해 주세요. (예: 010-1234-5678)', [phone]); bad = bad || phone; }
    if (bad) { bad.focus(); return; }
    // 주문 조회 서버가 아직 없다. 입력한 내용은 저장하거나 전송하지 않는다.
    resultDesc.textContent = y + '.' + pad(m) + '.' + pad(d) + ' 주문의 진행 상황은 카카오톡으로 문의해 주세요.';
    result.hidden = false;
    result.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
})();
