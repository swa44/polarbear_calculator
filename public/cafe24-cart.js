/**
 * 폴라베어 자동계산기 → 카페24 자사몰 장바구니 담기
 *
 * 카페24 앱 스크립트(ScriptTag)로 자사몰 페이지에 삽입된다.
 * 계산기가 보낸 주소: https://polarbearmarket.com/order/basket.html#pbcart=<base64url JSON>
 *   JSON = [[상품번호, 옵션코드, 수량], ...]
 * #pbcart 가 있을 때만 동작하고, 주소에서 즉시 지워 새로고침해도 두 번 담기지 않는다.
 */
(function () {
  var CLIENT_ID = "sOg4Bz7LLBwgiHMvvsHAvC";
  var BATCH = 10; // CAFE24API.addCart 한 번에 최대 10개

  var m = location.hash.match(/pbcart=([A-Za-z0-9_-]+)/);
  if (!m) return;
  history.replaceState(null, "", location.pathname + location.search);

  var items;
  try {
    var b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    items = JSON.parse(atob(b64));
    if (!Array.isArray(items) || !items.length) throw new Error("empty");
  } catch {
    alert("장바구니 정보를 읽지 못했습니다. 계산기에서 다시 시도해주세요.");
    return;
  }

  // ---- 진행 화면
  var overlay = document.createElement("div");
  overlay.setAttribute(
    "style",
    "position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;" +
      "background:rgba(17,24,39,.55);font-family:Pretendard,-apple-system,'Apple SD Gothic Neo',sans-serif",
  );
  overlay.innerHTML =
    '<div style="background:#fff;border-radius:16px;padding:28px 32px;text-align:center;min-width:260px;box-shadow:0 10px 40px rgba(0,0,0,.2)">' +
    '<div style="font-size:17px;font-weight:800;color:#111">장바구니에 담는 중…</div>' +
    '<div data-msg style="margin-top:8px;font-size:14px;color:#6b7280">폴라베어 자동계산기에서 선택한 품목</div></div>';
  function show() {
    if (document.body) document.body.appendChild(overlay);
    else document.addEventListener("DOMContentLoaded", show);
  }
  show();
  function msg(t) {
    var el = overlay.querySelector("[data-msg]");
    if (el) el.textContent = t;
  }
  function fail(text) {
    overlay.remove();
    alert(text);
    location.replace("/order/basket.html");
  }

  // ---- 카페24 SDK 준비 대기 (최대 10초)
  var waited = 0;
  (function ready() {
    if (window.CAFE24API && window.CAPP_ASYNC_METHODS && window.CAPP_ASYNC_METHODS.AppCommon) return start();
    if ((waited += 200) > 10000) return fail("자사몰 장바구니 기능을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    setTimeout(ready, 200);
  })();

  function start() {
    var api = window.CAFE24API.init({ client_id: CLIENT_ID });
    var list = items.map(function (it) {
      return { product_no: Number(it[0]), variants_code: String(it[1]), quantity: Number(it[2]) };
    });
    var batches = [];
    for (var i = 0; i < list.length; i += BATCH) batches.push(list.slice(i, i + BATCH));
    var done = 0;

    (function next(n) {
      if (n >= batches.length) {
        msg("완료! 장바구니로 이동합니다.");
        location.replace("/order/basket.html");
        return;
      }
      msg(done + " / " + list.length + "개 담는 중");
      api.addCart("A0000", "P", batches[n], function (err, res) {
        if (err) {
          var e = (res && res.error) || {};
          var why = e.code === 403 ? "장바구니 담기 권한이 없습니다. (앱 권한 확인 필요)" : e.message || "알 수 없는 오류";
          return fail("일부 품목을 장바구니에 담지 못했습니다.\n" + why);
        }
        done += batches[n].length;
        next(n + 1);
      });
    })(0);
  }
})();
