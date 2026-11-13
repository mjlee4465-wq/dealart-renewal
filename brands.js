(function () {
  var cards = Array.prototype.slice.call(document.querySelectorAll('#brandGrid .card'));
  var input = document.getElementById('brandSearch');
  var form = document.getElementById('brandSearchForm');
  var statusBtns = document.querySelectorAll('#statusChips .chip-btn');
  var groupBtns = document.querySelectorAll('#groupChips .chip-btn');
  var count = document.getElementById('brandCount');
  var empty = document.getElementById('brandEmpty');
  var state = { status: 'all', group: null, q: '' };

  function matchStatus(c) {
    if (state.status === 'all') return true;
    if (state.status === 'media') return c.getAttribute('data-media') === '1';
    return c.getAttribute('data-status') === state.status;
  }
  function apply() {
    var q = state.q.trim().toLowerCase(), shown = 0;
    cards.forEach(function (c) {
      var ok = matchStatus(c)
        && (!state.group || c.getAttribute('data-group') === state.group)
        && (!q || c.getAttribute('data-name').toLowerCase().indexOf(q) !== -1);
      c.hidden = !ok;
      if (ok) shown++;
    });
    var filtered = state.status !== 'all' || state.group || q;
    count.textContent = (filtered ? '검색 결과 ' : '전체 ') + shown + '곳';
    empty.hidden = shown !== 0;
  }
  statusBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      state.status = b.getAttribute('data-status');
      statusBtns.forEach(function (x) { x.classList.toggle('on', x === b); });
      apply();
    });
  });
  groupBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var g = b.getAttribute('data-group');
      state.group = state.group === g ? null : g; // 한 번 더 누르면 해제
      groupBtns.forEach(function (x) { x.classList.toggle('on', x.getAttribute('data-group') === state.group); });
      apply();
    });
  });
  input.addEventListener('input', function () { state.q = input.value; apply(); });
  form.addEventListener('submit', function (e) { e.preventDefault(); input.blur(); });
  apply();
})();
