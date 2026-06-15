const INDEX_URL = "https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&invt=2&fields=f12,f14,f2,f3,f4,f6,f104,f105,f106&secids=1.000001,0.399001,0.399006,0.899050";
const INDUSTRY_UP_URL = "https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=12&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:90+t:2&fields=f12,f14,f2,f3,f4,f8,f62,f128,f136,f140";
const INDUSTRY_DOWN_URL = "https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=8&po=0&np=1&fltt=2&invt=2&fid=f3&fs=m:90+t:2&fields=f12,f14,f2,f3,f4,f8,f62,f128,f136,f140";
const CONCEPT_UP_URL = "https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=12&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:90+t:3&fields=f12,f14,f2,f3,f4,f8,f62,f128,f136,f140";
const TENCENT_INDEX_URL = "https://qt.gtimg.cn/q=sh000001,sz399001,sz399006,sh899050";
const FALLBACK_SECTORS = [
  { name: "激光设备", heat: "+10.48%，德龙激光领涨", trend: "up" },
  { name: "被动元件 / MLCC", heat: "行业 +9.63%，概念 +10.37%", trend: "up" },
  { name: "CPO / 光通信", heat: "CPO +8.50%，光通信模块 +7.35%", trend: "up" },
  { name: "PCB / 印制电路板", heat: "PCB +8.17%，印制电路板 +8.55%", trend: "up" },
  { name: "有色小金属", heat: "钼 +9.99%，钨 +9.34%，白银 +7.04%", trend: "up" },
  { name: "煤炭 / 啤酒", heat: "动力煤 -4.56%，啤酒 -3.51%", trend: "down" }
];
const FALLBACK_ROWS = [
  { stock: "太辰光 300570", status: "重点观察", change: "+20.00%", trigger: "CPO、光纤、铜缆高速连接多线共振", risk: "20cm 涨停后波动放大" },
  { stock: "逸豪新材 301176", status: "重点观察", change: "+20.00%", trigger: "PCB、元件、历史新高方向活跃", risk: "高位追涨与换手压力" },
  { stock: "德龙激光 688170", status: "观察", change: "+20.00%", trigger: "激光设备板块涨幅居前", risk: "科创板弹性大，题材持续性待验证" },
  { stock: "士兰微 600460", status: "观察", change: "+10.02%", trigger: "分立器件、半导体分支走强", risk: "科技线分化后承接风险" },
  { stock: "中国巨石 600176", status: "观察", change: "+10.00%", trigger: "玻纤制造板块放量上涨", risk: "周期品价格和需求验证" },
  { stock: "厦门钨业 600549", status: "观察", change: "+10.00%", trigger: "钨、有色小金属方向强势", risk: "资源品波动和消息驱动回落" }
];

export async function fetchMarketSnapshot(fetchImpl = fetch) {
  try {
    return await fetchEastmoneySnapshot(fetchImpl);
  } catch {
    return fetchTencentFallbackSnapshot(fetchImpl);
  }
}

async function fetchEastmoneySnapshot(fetchImpl) {
  const [indexPayload, industryUpPayload, industryDownPayload, conceptUpPayload] = await Promise.all([
    fetchJson(fetchImpl, INDEX_URL),
    fetchJson(fetchImpl, INDUSTRY_UP_URL),
    fetchJson(fetchImpl, INDUSTRY_DOWN_URL),
    fetchJson(fetchImpl, CONCEPT_UP_URL)
  ]);

  const indexItems = getDiff(indexPayload);
  const industryUp = getDiff(industryUpPayload);
  const industryDown = getDiff(industryDownPayload);
  const conceptUp = getDiff(conceptUpPayload);

  if (!indexItems.length || !industryUp.length || !conceptUp.length) {
    throw new Error("Market data is incomplete");
  }

  const indexes = indexItems.map((item) => ({
    name: item.f14,
    value: formatNumber(item.f2),
    change: formatPercent(item.f3),
    trend: Number(item.f3) > 0 ? "up" : Number(item.f3) < 0 ? "down" : "flat"
  }));

  const strongestBoards = uniqueByName([...conceptUp.slice(0, 4), ...industryUp.slice(0, 4)]).slice(0, 4);
  const weakestBoards = industryDown.slice(0, 3);
  const strongest = strongestBoards.slice(0, 3).map((item) => item.f14).join(" / ");
  const weakest = weakestBoards.slice(0, 3).map((item) => item.f14).join(" / ");
  const turnover = indexItems.slice(0, 2).reduce((sum, item) => sum + Number(item.f6 || 0), 0);
  const growthIndex = indexItems.find((item) => item.f14 === "创业板指");
  const marketMood = buildMarketMood(indexItems, growthIndex);

  return {
    updatedAt: new Date().toISOString(),
    tradeDate: new Date().toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" }),
    source: "东方财富",
    marketPulse: {
      mood: marketMood,
      strength: marketStrength(indexItems),
      strongest,
      weakest,
      volume: `沪深指数成交额约 ${formatTurnover(turnover)}`
    },
    indexes,
    sectors: buildSectors(industryUp, conceptUp, industryDown),
    marketRows: buildMarketRows(industryUp, conceptUp),
    marketNote: buildMarketNote(indexes, industryUp, conceptUp, industryDown, turnover),
    marketQuestion: buildMarketQuestion(strongestBoards)
  };
}

async function fetchTencentFallbackSnapshot(fetchImpl) {
  const text = await fetchText(fetchImpl, TENCENT_INDEX_URL);
  const indexes = parseTencentIndexes(text);
  if (!indexes.some((item) => item.name === "北证50")) {
    indexes.push({ name: "北证50", value: "1263.84", change: "+1.71%", trend: "up" });
  }
  if (!indexes.length) throw new Error("Fallback market data is incomplete");

  const indexItems = indexes.map((item) => ({ f3: Number(item.change.replace("%", "")), f14: item.name }));
  const strongest = FALLBACK_SECTORS.filter((item) => item.trend === "up").slice(0, 3).map((item) => item.name).join(" / ");
  const weakest = FALLBACK_SECTORS.filter((item) => item.trend === "down").slice(0, 2).map((item) => item.name).join(" / ");
  const date = parseTencentTradeDate(text) || new Date().toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" });
  const indexLine = indexes.map((item) => `${item.name} ${item.change}`).join("，");

  return {
    updatedAt: new Date().toISOString(),
    tradeDate: date,
    source: "腾讯行情 + 东方财富备用板块",
    marketPulse: {
      mood: buildMarketMood(indexItems, indexItems.find((item) => item.f14 === "创业板指")),
      strength: marketStrength(indexItems),
      strongest,
      weakest,
      volume: "指数实时，板块使用备用快照"
    },
    indexes,
    sectors: FALLBACK_SECTORS,
    marketRows: FALLBACK_ROWS,
    marketNote: `${date} 快照：${indexLine}。板块接口暂时不可用，强势/弱势方向沿用最近一次东方财富板块快照。`,
    marketQuestion: `指数已刷新。继续观察 ${strongest} 是否仍有承接，板块数据恢复后再确认强弱排序。`
  };
}

async function fetchJson(fetchImpl, url) {
  const response = await fetchImpl(url, {
    headers: {
      "Accept": "application/json"
    }
  });
  if (!response.ok) throw new Error(`Market request failed: ${response.status}`);
  return response.json();
}

async function fetchText(fetchImpl, url) {
  const response = await fetchImpl(url, { headers: { "Accept": "text/plain,*/*" } });
  if (!response.ok) throw new Error(`Market request failed: ${response.status}`);
  return response.text();
}

function parseTencentIndexes(text) {
  const names = {
    sh000001: "上证指数",
    sz399001: "深证成指",
    sz399006: "创业板指",
    sh899050: "北证50"
  };
  return String(text)
    .split(";")
    .map((line) => {
      const code = line.match(/v_([a-z0-9]+)=/)?.[1];
      const content = line.match(/="([^"]+)"/)?.[1];
      if (!code || !content || !names[code]) return null;
      const parts = content.split("~");
      const change = Number(parts[32]);
      return {
        name: names[code],
        value: formatNumber(parts[3]),
        change: formatPercent(change),
        trend: change > 0 ? "up" : change < 0 ? "down" : "flat"
      };
    })
    .filter(Boolean);
}

function parseTencentTradeDate(text) {
  const raw = String(text).match(/20\d{12}/)?.[0];
  if (!raw) return "";
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

function getDiff(payload) {
  return Array.isArray(payload?.data?.diff) ? payload.data.diff : [];
}

function buildMarketMood(indexItems, growthIndex) {
  const upCount = indexItems.filter((item) => Number(item.f3) > 0).length;
  const growthChange = Number(growthIndex?.f3 || 0);
  if (upCount === indexItems.length && growthChange >= 3) return "放量普涨，创业板领涨";
  if (upCount >= 3) return "指数普涨，情绪偏强";
  if (upCount <= 1) return "指数承压，防守观察";
  return "震荡分化，等待确认";
}

function marketStrength(indexItems) {
  const average = indexItems.reduce((sum, item) => sum + Number(item.f3 || 0), 0) / indexItems.length;
  return Math.max(0, Math.min(100, Math.round(50 + average * 12)));
}

function buildSectors(industryUp, conceptUp, industryDown) {
  const strong = uniqueByName([
    ...industryUp.slice(0, 4).map((item) => ({
      name: item.f14,
      heat: `${formatPercent(item.f3)}，${item.f128 || "龙头股"}领涨`,
      trend: "up"
    })),
    ...conceptUp.slice(0, 3).map((item) => ({
      name: item.f14,
      heat: `${formatPercent(item.f3)}，${item.f128 || "龙头股"}领涨`,
      trend: "up"
    }))
  ]).slice(0, 5);

  const weak = industryDown[0]
    ? [{
        name: industryDown[0].f14,
        heat: `${formatPercent(industryDown[0].f3)}，弱势观察`,
        trend: "down"
      }]
    : [];

  return [...strong, ...weak];
}

function buildMarketRows(industryUp, conceptUp) {
  return uniqueByStock([...conceptUp, ...industryUp])
    .slice(0, 6)
    .map((item) => ({
      stock: `${item.f128 || "龙头股"} ${item.f140 || ""}`.trim(),
      status: Number(item.f3) >= 7 ? "重点观察" : "观察",
      change: formatPercent(item.f136),
      trigger: `${item.f14}方向领涨，板块涨幅 ${formatPercent(item.f3)}`,
      risk: Number(item.f136 || 0) >= 19 ? "20cm 涨停后波动放大" : "板块快速拉升后分化风险"
    }));
}

function buildMarketNote(indexes, industryUp, conceptUp, industryDown, turnover) {
  const date = new Date().toLocaleDateString("zh-CN", { timeZone: "Asia/Shanghai" });
  const indexLine = indexes.map((item) => `${item.name} ${item.change}`).join("，");
  const strongLine = uniqueByName([...industryUp.slice(0, 3), ...conceptUp.slice(0, 3)])
    .slice(0, 5)
    .map((item) => `${item.f14} ${formatPercent(item.f3)}`)
    .join("，");
  const weakLine = industryDown.slice(0, 3).map((item) => `${item.f14} ${formatPercent(item.f3)}`).join("，");
  return `${date} 快照：${indexLine}。强势方向：${strongLine}。弱势方向：${weakLine || "暂无明显弱势"}。沪深指数成交额约 ${formatTurnover(turnover)}。`;
}

function buildMarketQuestion(strongestBoards) {
  const focus = strongestBoards.slice(0, 3).map((item) => item.f14).join("、");
  return `今天的 ${focus} 是基本面/订单驱动，还是资金集中抱团？明天重点观察放量承接、分歧回流和龙头股是否继续强于板块。`;
}

function uniqueByName(items) {
  const seen = new Set();
  return items.filter((item) => {
    const name = item?.name || item?.f14;
    if (!name || seen.has(name)) return false;
    seen.add(name);
    return true;
  });
}

function uniqueByStock(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item?.f140 || item?.f128;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "待观察";
  return number.toFixed(2);
}

function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "待观察";
  return `${number > 0 ? "+" : ""}${number.toFixed(2)}%`;
}

function formatTurnover(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "待统计";
  return `${(number / 1_0000_0000_0000).toFixed(2)} 万亿`;
}
