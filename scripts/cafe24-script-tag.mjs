/**
 * 자사몰에 장바구니 스크립트(public/cafe24-cart.js)를 카페24 앱 스크립트로 등록한다.
 *
 * 준비: .env.local 에 CAFE24_CLIENT_SECRET (카페24 개발자센터 앱 정보) 입력
 * 1) 아래 주소를 열어 쇼핑몰 운영자로 동의 → polarbearmarket.com/?code=XXXX 로 돌아옴
 *    https://polarbearshop.cafe24api.com/api/v2/oauth/authorize?response_type=code&client_id=<CLIENT_ID>&state=calc&redirect_uri=https%3A%2F%2Fpolarbearmarket.com&scope=mall.read_application,mall.write_application,mall.read_product,mall.read_personal,mall.write_personal
 * 2) 1분 안에 실행 (code 는 1분간만 유효):
 *    node --env-file=.env.local scripts/cafe24-script-tag.mjs <code>
 *
 * 이미 같은 주소가 등록돼 있으면 새로 만들지 않는다.
 */

const SCRIPT_SRC =
  process.env.CAFE24_CART_SCRIPT_URL ||
  "https://wetigiwdevokobwrcwsv.supabase.co/storage/v1/object/public/calculator-public/cafe24-cart.js";
const REDIRECT_URI = "https://polarbearmarket.com";
const API_VERSION = "2025-12-01";

const MALL_ID = process.env.CAFE24_MALL_ID;
const CLIENT_ID = process.env.NEXT_PUBLIC_CAFE24_CLIENT_ID;
const CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET;
const code = process.argv[2];

if (!MALL_ID || !CLIENT_ID || !CLIENT_SECRET) {
  console.error(".env.local 에 CAFE24_MALL_ID, NEXT_PUBLIC_CAFE24_CLIENT_ID, CAFE24_CLIENT_SECRET 가 필요합니다.");
  process.exit(1);
}
if (!code) {
  console.error("사용법: node --env-file=.env.local scripts/cafe24-script-tag.mjs <code>");
  process.exit(1);
}

const base = `https://${MALL_ID}.cafe24api.com/api/v2`;

// 1) code → access token
const tokenRes = await fetch(`${base}/oauth/token`, {
  method: "POST",
  headers: {
    Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: REDIRECT_URI }),
});
const token = await tokenRes.json();
if (!tokenRes.ok) {
  console.error("토큰 발급 실패:", JSON.stringify(token));
  console.error("code 는 1분만 유효합니다. 동의 주소를 다시 열어 새 code 로 실행해주세요.");
  process.exit(1);
}
console.log(`토큰 발급 완료 (권한: ${token.scopes?.join(", ")})`);

const admin = (path, init = {}) =>
  fetch(`${base}/admin${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "X-Cafe24-Api-Version": API_VERSION,
      "Content-Type": "application/json",
      ...init.headers,
    },
  }).then(async (r) => ({ ok: r.ok, status: r.status, body: await r.json().catch(() => ({})) }));

// 2) 이미 등록돼 있는지 확인
const list = await admin("/scripttags?shop_no=1");
if (!list.ok) {
  console.error("앱 스크립트 목록 조회 실패:", list.status, JSON.stringify(list.body));
  process.exit(1);
}
const existing = (list.body.scripttags || []).find((s) => s.src === SCRIPT_SRC);
if (existing) {
  console.log(`이미 등록돼 있습니다 (script_no ${existing.script_no}). 위치: ${existing.display_location?.join(", ")}`);
  process.exit(0);
}

// 3) 등록 (모든 화면에 삽입, #pbcart 가 있을 때만 동작)
const created = await admin("/scripttags", {
  method: "POST",
  body: JSON.stringify({ shop_no: 1, request: { src: SCRIPT_SRC, display_location: ["all"] } }),
});
if (!created.ok) {
  console.error("앱 스크립트 등록 실패:", created.status, JSON.stringify(created.body));
  process.exit(1);
}
console.log("앱 스크립트 등록 완료:", JSON.stringify(created.body.scripttag ?? created.body));
