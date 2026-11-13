/* 주문조회 연결 설정
 * ready: false  → 실제 조회를 하지 않고 "준비 중" 안내만 보여준다. (주문 데이터가 연결되기 전의 안전한 기본값)
 * ready: true   → 아래 orders 와 비교해서 "조회된 주문" / "조회된 주문 없음" 화면을 보여준다.
 *
 * orders 항목 형식 (주문 날짜 + 휴대폰 번호가 같으면 같은 주문으로 본다)
 *   { date: '2026-12-20',        // 주문 날짜 (YYYY-MM-DD)
 *     phone: '01012345678',      // 주문자 휴대폰 번호 (숫자만)
 *     number: 'DA-0000',         // 주문번호 (없으면 생략)
 *     status: 0,                 // 0 예약 접수 · 1 상품 준비 · 2 배송 중 · 3 배송 완료
 *     deliveryDate: '2026-12-25',// 배송 예정일
 *     method: '지정일 배송',      // 배송 방법
 *     items: [ { brand: '브랜드명', name: '상품명', qty: 1 } ] }
 *
 * 화면 미리보기(예시 데이터, 실제 주문 아님):  orders.html?preview=found  /  orders.html?preview=empty
 */
/* testCases: ready 와 상관없이 아래 입력값일 때만 결과 화면을 열어 보는 테스트용 항목 (실제 주문이 아니다)
 *   2026-01-01 + 010-1111-1111 → '조회된 주문' 화면
 *   2026-01-01 + 010-0000-0000 → '조회된 주문이 없습니다' 화면
 * 테스트가 끝나면 이 항목을 지우면 된다. */
window.DEALART_ORDERS = {
  ready: false,
  orders: [],
  testCases: [
    { date: '2026-01-01', phone: '01011111111', result: 'found',
      order: { date: '2026-01-01', number: 'DA-TEST-0001', status: 1, deliveryDate: '2026-01-05', method: '지정일 배송',
               items: [{ brand: '스즈란테이', name: '일식 도시락 (테스트 상품)', qty: 2 }, { brand: '프룻대디', name: '제철 과일 선물세트 (테스트 상품)', qty: 1 }] } },
    { date: '2026-01-01', phone: '01000000000', result: 'empty' }
  ]
};
