/**
 * 카페24 상품 옵션 → Supabase 동기화
 *   - calculator_cafe24_variants: 계산기 품목(sku) × 색온도 → 카페24 상품번호/옵션 코드/판매가
 *   - calculator_products.price: 카페24 판매가로 덮어씀 (계산기 금액 = 장바구니 금액)
 *
 * 실행: node --env-file=.env.local scripts/sync-cafe24.mjs          (반영)
 *       node --env-file=.env.local scripts/sync-cafe24.mjs --dry    (확인만)
 *
 * 자사몰에서 가격·옵션을 바꾸면 다시 실행한다. 사이트 반영은 최대 1시간(캐시) 뒤.
 */

const DRY = process.argv.includes("--dry");
const MALL_ID = process.env.CAFE24_MALL_ID;
const CLIENT_ID = process.env.NEXT_PUBLIC_CAFE24_CLIENT_ID;
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SECRET_KEY;
if (!MALL_ID || !CLIENT_ID || !SB_URL || !SB_KEY) {
  console.error("환경변수 필요: CAFE24_MALL_ID, NEXT_PUBLIC_CAFE24_CLIENT_ID, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function cafe24(path) {
  for (let i = 0; i < 6; i++) {
    const res = await fetch(`https://${MALL_ID}.cafe24api.com/api/v2${path}`, {
      headers: { "X-Cafe24-Client-Id": CLIENT_ID, "X-Cafe24-Api-Version": "2025-12-01" },
    });
    if (res.status === 429) {
      await sleep(1500);
      continue;
    }
    if (!res.ok) throw new Error(`카페24 ${path}: ${res.status} ${await res.text()}`);
    await sleep(400); // 요청 한도 여유
    return res.json();
  }
  throw new Error(`카페24 ${path}: 요청 한도 초과`);
}

async function supabase(path, init = {}) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) throw new Error(`Supabase ${path}: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/** 옵션명에서 색온도 추출 ("전주백색"을 "주백색"보다 먼저 확인) */
function colorOf(label) {
  for (const c of ["전주백색", "전구색", "주백색", "주광색"]) if (label.includes(c)) return c;
  return "";
}

// 계산기 sku → 카페24 상품번호 + 옵션명 조건
const PRODUCTS = { namyoungT5: 259, namyoungT5Acc: 291, nubimT5: 251, nubimT5Acc: 293, t3: 254, t3Acc: 295, bar12: 116, acc12: 184, smps12: 118, bar24: 167, acc24: 117, smps24: 185, mline: 120, mlineAcc: 121 };
const ACC = {
  "clip-screw": (s) => s.includes("고정클립(피스형)"),
  "clip-tape": (s) => s.includes("고정클립(양면테이프형)"),
  "powerline-2m": (s) => s.includes("전원커넥터(필수) 2M"),
  "cover-1m": (s) => s.includes("아크릴커버 1M"),
  "corner-1200": (s) => s.endsWith("코너 각대"),
  "corner-clip": (s) => s.includes("각대 고정클립"),
};
function rule(sku) {
  let m;
  // 양방향 연결잭 (구매 확인창 추가 품목)
  const JACK = { 30: "30cm", 60: "60cm", 120: "1.2M" };
  const ACC_PRODUCT = { "t5-namyoung": PRODUCTS.namyoungT5Acc, "t5-nubim": PRODUCTS.nubimT5Acc, t3: PRODUCTS.t3Acc };
  if ((m = sku.match(/^(t5-namyoung|t5-nubim|t3)-jack-(\d+)$/))) return [ACC_PRODUCT[m[1]], (s) => s === `양방향연결잭 ${JACK[m[2]]}`];
  // 센서·스위치
  if (sku === "t3-sensor-mw") return [PRODUCTS.t3Acc, (s) => s === "누빔T3 호환 마이크로파센서"];
  if (sku === "t5-nubim-switch") return [PRODUCTS.nubimT5Acc, (s) => s === "누빔T5 호환 전원스위치"];
  if (sku === "t5-nubim-sensor") return [PRODUCTS.nubimT5Acc, (s) => s === "누빔T5 호환 동작감지센서"];
  // 전원코드 (누빔 T5·T3만, 남영 디밍은 없음)
  if ((m = sku.match(/^(t5-nubim|t3)-cord-(150|300)(-sw)?$/))) {
    const label = `전원코드 ${m[2] === "150" ? "1.5M" : "3M"}${m[3] ? "(중간스위치)" : ""}`;
    return [ACC_PRODUCT[m[1]], (s) => s === label];
  }
  if ((m = sku.match(/^t5-namyoung-(\d+)$/))) return [PRODUCTS.namyoungT5, (s) => s.startsWith(`${m[1]}mm `)];
  if ((m = sku.match(/^t5-nubim-(\d+)$/))) return [PRODUCTS.nubimT5, (s) => s.startsWith(`${m[1]}mm `)];
  if ((m = sku.match(/^t3-(\d+)$/))) return [PRODUCTS.t3, (s) => s.startsWith(`${m[1]}mm `)];
  for (const [pre, bar, acc, smps] of [["bb12", PRODUCTS.bar12, PRODUCTS.acc12, PRODUCTS.smps12], ["bb24", PRODUCTS.bar24, PRODUCTS.acc24, PRODUCTS.smps24]]) {
    if (sku === `${pre}-mid-1000`) return [bar, (s) => s.startsWith("1000mm 중간케이블형")];
    if ((m = sku.match(new RegExp(`^${pre}-(\\d+)$`)))) return [bar, (s) => s.startsWith(`${m[1]}mm /`)];
    for (const [k, pred] of Object.entries(ACC)) if (sku === `${pre}-${k}`) return [acc, pred];
    if ((m = sku.match(new RegExp(`^smps${pre.slice(2)}-(\\d+)$`)))) return [smps, (s) => s.endsWith(` ${m[1]}W`)];
  }
  if ((m = sku.match(/^mline-(40|60)-line-(\d+)$/))) return [PRODUCTS.mline, (s) => s.startsWith(`${m[1]} ${m[2]}mm `)];
  if ((m = sku.match(/^mline-(40|60)-corner$/))) return [PRODUCTS.mline, (s) => s.startsWith(`${m[1]} 기역자형`)];
  if ((m = sku.match(/^mline-(40|60)-corner-cover$/))) return [PRODUCTS.mlineAcc, (s) => s.includes(`라인${m[1]}커버 기역자형`)];
  if ((m = sku.match(/^mline-(40|60)-cover-(\d+)m$/))) {
    const [, spec, size] = m;
    return [PRODUCTS.mlineAcc, (s) => s.includes(`라인${spec}커버`) && (size === "20" ? s.includes("롤") : new RegExp(`커버 ${size}(미터|m)\\(재단\\)`).test(s))];
  }
  if ((m = sku.match(/^mline-(40|60)-sidecap$/))) return [PRODUCTS.mlineAcc, (s) => s.includes(`라인${m[1]}사이드캡`)];
  if (sku === "mline-bracket") return [PRODUCTS.mlineAcc, (s) => s.includes("고정브라켓")];
  if (sku === "mline-wire-1") return [PRODUCTS.mlineAcc, (s) => s.includes("1구 2m")];
  if (sku === "mline-wire-10") return [PRODUCTS.mlineAcc, (s) => s.includes("10구")];
  if ((m = sku.match(/^mline-smps-(\d+)$/))) return [PRODUCTS.mlineAcc, (s) => s.endsWith(`24V ${m[1]}W`)];
  return null;
}

// 1) 카페24 옵션 읽기
const options = {};
for (const no of Object.values(PRODUCTS)) {
  const { product } = await cafe24(`/products/${no}?fields=product_no,product_name,price`);
  const { variants } = await cafe24(`/products/${no}/variants`);
  options[no] = variants.map((v) => {
    const vals = (v.options || []).map((o) => o.value);
    return {
      code: v.variant_code,
      label: vals.join(" / "),
      price: Math.round(Number(product.price) + Number(v.additional_amount)),
      selling: v.selling === "T",
    };
  });
  console.log(`카페24 ${no} ${product.product_name}: 옵션 ${variants.length}개`);
}

// 2) 계산기 품목과 연결
const skus = await supabase("calculator_products?select=sku,name,price&order=calculator,sort_order");
const rows = [];
const priceUpdates = [];
const problems = [];
for (const p of skus) {
  const r = rule(p.sku);
  if (!r) {
    problems.push(`${p.sku}: 연결 규칙 없음`);
    continue;
  }
  const [no, pred] = r;
  const found = options[no].filter((o) => pred(o.label));
  if (!found.length) {
    problems.push(`${p.sku}: 카페24 ${no}에서 옵션을 못 찾음`);
    continue;
  }
  for (const o of found) {
    rows.push({ sku: p.sku, color: colorOf(o.label), product_no: no, variant_code: o.code, option_label: o.label, price: o.price, selling: o.selling, updated_at: new Date().toISOString() });
  }
  const prices = [...new Set(found.filter((o) => o.selling).map((o) => o.price))];
  if (prices.length > 1) problems.push(`${p.sku}: 색온도별 가격이 다름 (${prices.join(", ")}) → 가장 낮은 값 사용`);
  const price = Math.min(...(prices.length ? prices : found.map((o) => o.price)));
  if (price <= 0) {
    problems.push(`${p.sku}: 카페24 판매가가 ${price.toLocaleString()}원 → 단가 반영 안 함 (카페24 옵션 가격 확인 필요)`);
    continue;
  }
  if (price !== p.price) priceUpdates.push({ sku: p.sku, name: p.name, from: p.price, to: price });
}

console.log(`\n연결: 품목 ${skus.length}개 → 카페24 옵션 ${rows.length}개`);
console.log(`단가 변경 ${priceUpdates.length}개`);
for (const u of priceUpdates) console.log(`  ${u.name}: ${u.from.toLocaleString()} → ${u.to.toLocaleString()}`);
if (problems.length) {
  console.log(`\n확인 필요 ${problems.length}개`);
  for (const p of problems) console.log(`  ${p}`);
}
if (DRY) {
  console.log("\n--dry: 반영하지 않음");
  process.exit(0);
}

// 3) 반영
await supabase("calculator_cafe24_variants", {
  method: "POST",
  headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
  body: JSON.stringify(rows),
});
// 이번에 없어진 옵션 정리
const keep = new Set(rows.map((r) => `${r.sku}|${r.color}`));
const existing = await supabase("calculator_cafe24_variants?select=sku,color");
for (const e of existing) {
  if (!keep.has(`${e.sku}|${e.color}`)) {
    await supabase(`calculator_cafe24_variants?sku=eq.${encodeURIComponent(e.sku)}&color=eq.${encodeURIComponent(e.color)}`, { method: "DELETE" });
  }
}
for (const u of priceUpdates) {
  await supabase(`calculator_products?sku=eq.${encodeURIComponent(u.sku)}`, { method: "PATCH", body: JSON.stringify({ price: u.to }) });
}
console.log("\n반영 완료");
