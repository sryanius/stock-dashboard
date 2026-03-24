import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import fs from "fs";
import path from "path";
import { RSI, MACD, SMA, EMA, BollingerBands, Stochastic } from "technicalindicators";

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const interval = searchParams.get("interval") || "1d"; // "1d", "15m", "1wk"

  if (!symbol) {
    return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
  }

  try {
    // Determine the period based on interval
    const now = new Date();
    const period1 = new Date();
    
    if (interval === "1mo") {
      period1.setFullYear(now.getFullYear() - 5); // 5년
    } else if (interval === "1wk") {
      period1.setFullYear(now.getFullYear() - 2); // 2년
    } else if (interval === "1d") {
      period1.setMonth(now.getMonth() - 6); // 6개월
    } else if (interval === "1m") {
      period1.setDate(now.getDate() - 3); // 1분봉은 최대 7일까지만 제공되므로 3일로 안정적 세팅
    } else {
      period1.setDate(now.getDate() - 5); // 5분봉 등은 5일
    }

    const dailyPeriod1 = new Date();
    dailyPeriod1.setMonth(now.getMonth() - 6); // 6개월

    const [chartResult, dailyChartResult, quoteResult, summaryResult] = await Promise.all([
      yahooFinance.chart(symbol, {
        period1,
        period2: now,
        interval: interval as any,
      }),
      interval === "1d" ? Promise.resolve(null) : yahooFinance.chart(symbol, {
        period1: dailyPeriod1,
        period2: now,
        interval: "1d",
      }).catch(() => null),
      yahooFinance.quote(symbol).catch(() => null),
      yahooFinance.quoteSummary(symbol, { modules: ['financialData'] }).catch(() => null)
    ]);
    
    const dailyChart = dailyChartResult || chartResult;

    const historical = chartResult.quotes
      .filter((q: any) => q.close !== null && q.open !== null)
      .map((q: any) => ({
        date: q.date,
        open: q.open,
        high: q.high,
        low: q.low,
        close: q.close,
        volume: q.volume,
      }));

    const dailyHistorical = dailyChart.quotes
      .filter((q: any) => q.close !== null && q.open !== null)
      .map((q: any) => ({
        date: q.date, open: q.open, high: q.high, low: q.low, close: q.close, volume: q.volume,
      }));

    if (!historical || historical.length === 0) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }

    const chartClosePrices = historical.map((d: any) => d.close);
    const dailyClosePrices = dailyHistorical.map((d: any) => d.close);
    const dailyHighPrices = dailyHistorical.map((d: any) => d.high);
    const dailyLowPrices = dailyHistorical.map((d: any) => d.low);

    // 차트 타임프레임 캔들의 종가 대신 quote 데이터의 실시간 가격 사용 (더 안정적)
    const lastPrice = (quoteResult && quoteResult.regularMarketPrice) || chartResult.meta.regularMarketPrice || chartClosePrices[chartClosePrices.length - 1];
    
    // 등락 포인트 및 등락률 계산 (quote 데이터의 실제 previousClose를 가장 우선 사용)
    const previousClose = (quoteResult && (quoteResult.regularMarketPreviousClose || quoteResult.previousClose)) || chartResult.meta.chartPreviousClose;
    let change = null;
    let changePercent = null;
    if (previousClose && lastPrice) {
      change = lastPrice - previousClose;
      changePercent = (change / previousClose) * 100;
    }

    // Helper for chart series padding
    const pad = (arr: any[], len: number) => {
      if (!arr || arr.length === 0) return Array(len).fill(null);
      const padding = Array(Math.max(0, len - arr.length)).fill(null);
      return [...padding, ...arr];
    };

    // 1. Chart Overlays (using requested generic interval)
    let bbSeriesData = Array(chartClosePrices.length).fill(null);
    let ema5SeriesData = Array(chartClosePrices.length).fill(null);
    let ema60SeriesData = Array(chartClosePrices.length).fill(null);

    if (chartClosePrices.length >= 5) {
      const ema5Series = EMA.calculate({ values: chartClosePrices, period: 5 });
      ema5SeriesData = pad(ema5Series, chartClosePrices.length);
    }
    if (chartClosePrices.length >= 60) {
      const ema60Series = EMA.calculate({ values: chartClosePrices, period: 60 });
      ema60SeriesData = pad(ema60Series, chartClosePrices.length);
    }
    if (chartClosePrices.length >= 20) {
      const bbSeries = BollingerBands.calculate({ values: chartClosePrices, period: 20, stdDev: 2 });
      bbSeriesData = pad(bbSeries, chartClosePrices.length);
    }

    // 2. AI Analysis Indicators (using DAILY data universally)
    let rsiValue = null; let sma20Value = null; let macdValue = null;
    let stochValue: any = null; let bbValue: any = null; let ema5Value = null; let ema60Value = null;

    if (dailyClosePrices.length >= 15) {
      const rsiSeries = RSI.calculate({ values: dailyClosePrices, period: 14 });
      if (rsiSeries.length > 0) rsiValue = rsiSeries[rsiSeries.length - 1];
    }
    if (dailyClosePrices.length >= 20) {
      const smaSeries = SMA.calculate({ values: dailyClosePrices, period: 20 });
      if (smaSeries.length > 0) sma20Value = smaSeries[smaSeries.length - 1];
    }
    if (dailyClosePrices.length >= 5) {
      const ema5Series = EMA.calculate({ values: dailyClosePrices, period: 5 });
      if (ema5Series.length > 0) ema5Value = ema5Series[ema5Series.length - 1];
    }
    if (dailyClosePrices.length >= 60) {
      const ema60Series = EMA.calculate({ values: dailyClosePrices, period: 60 });
      if (ema60Series.length > 0) ema60Value = ema60Series[ema60Series.length - 1];
    }
    if (dailyClosePrices.length >= 20) {
      const bbSeries = BollingerBands.calculate({ values: dailyClosePrices, period: 20, stdDev: 2 });
      if (bbSeries.length > 0) bbValue = bbSeries[bbSeries.length - 1];
    }
    if (dailyClosePrices.length >= 14) {
      const stochSeries = Stochastic.calculate({ high: dailyHighPrices, low: dailyLowPrices, close: dailyClosePrices, period: 14, signalPeriod: 3 });
      if (stochSeries.length > 0) stochValue = stochSeries[stochSeries.length - 1];
    }
    if (dailyClosePrices.length >= 26) {
      const macdSeries = MACD.calculate({
        values: dailyClosePrices, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9,
        SimpleMAOscillator: false, SimpleMASignal: false,
      });
      if (macdSeries.length > 0) macdValue = macdSeries[macdSeries.length - 1].MACD || null;
    }

    // AI/Algo Opinion Logic (0 ~ 100 Score)
    let opinion = "HOLD";
    let score = 50; // Base Neutral Score
    let reasons = [];

    const lastStr = Number(lastPrice).toLocaleString(undefined, { maximumFractionDigits: 2 });

    // 1. 볼린저 밴드 (Max ±20)
    if (bbValue !== null) {
      if (lastPrice <= bbValue.lower) {
        score += 20;
        reasons.push(`[볼린저 밴드] 🚀 주가가 하단(${bbValue.lower.toLocaleString(undefined, { maximumFractionDigits: 2 })})을 터치/이탈했습니다. (과매도, +20점)`);
      } else if (lastPrice >= bbValue.upper) {
        score -= 20;
        reasons.push(`[볼린저 밴드] ⚠️ 주가가 상단(${bbValue.upper.toLocaleString(undefined, { maximumFractionDigits: 2 })})을 돌파했습니다. (초과열, -20점)`);
      }
    }

    // 2. 스토캐스틱 (Max ±20)
    if (stochValue !== null) {
      const k = stochValue.k;
      const d = stochValue.d;
      if (k < 20 && d < 20 && k > d) {
        score += 20;
        reasons.push(`[스토캐스틱] ⚡ 침체 구간에서 확실한 골든크로스 발생. 최적의 단기 매수 타점입니다. (+20점)`);
      } else if (k > 80 && d > 80 && k < d) {
        score -= 20;
        reasons.push(`[스토캐스틱] 🌧 과열 구간에서 확연한 데드크로스 발생. 즉각적인 매수 자제 및 매도. (-20점)`);
      } else if (k < 20) {
        score += 10;
        reasons.push(`[스토캐스틱] 📊 현재 극심한 침체 구간(${k.toFixed(1)})에 머물러 반등 에너지를 응축 중입니다. (+10점)`);
      } else if (k > 80) {
        score -= 10;
        reasons.push(`[스토캐스틱] 📊 고위험 과열 구간(${k.toFixed(1)})에 진입해 고점 징후가 보입니다. (-10점)`);
      }
    }

    // 3. 지수 이동평균(EMA) 대세 거시 분석 (Max ±15)
    if (ema5Value !== null && ema60Value !== null) {
      if (ema5Value > ema60Value) {
        score += 15;
        reasons.push(`[대세 추세] 📈 단기 5일선이 장기 60일선 위에 있는 정배열(상승장)입니다. (+15점)`);
      } else {
        score -= 15;
        reasons.push(`[대세 추세] 📉 단기 5일선이 장기 60일선 아래에 있는 역배열(하락장)입니다. (-15점)`);
      }
    }

    // 4. RSI 상대강도지수 (Max ±15)
    if (rsiValue !== null) {
      const rsiStr = rsiValue.toFixed(2);
      if (rsiValue <= 30) {
        score += 15;
        reasons.push(`[RSI] 📊 RSI(${rsiStr})가 강력한 '과매도' 구간에 돌입. 반발 매수세 기대 (+15점)`);
      } else if (rsiValue >= 70) {
        score -= 15;
        reasons.push(`[RSI] 📊 RSI(${rsiStr})가 위험한 '과매수' 구간 돌입. 이익 실현 매물 출회 주의 (-15점)`);
      } else {
        reasons.push(`[RSI] 📊 RSI는 ${rsiStr}로 과열도 침체도 아닌 중립 상태입니다.`);
      }
    }
    
    // 5. SMA 20 분석 (추가 보조 컨텍스트만 제공, 점수에는 미포함)
    if (sma20Value !== null) {
      const smaStr = sma20Value.toLocaleString(undefined, { maximumFractionDigits: 2 });
      if (lastPrice > sma20Value) {
        reasons.push(`[SMA 보조] 현재 주가가 20일선(${smaStr}) 위로 올라타 단기 상승 탄력이 받쳐주고 있습니다.`);
      } else {
        reasons.push(`[SMA 보조] 현재 주가가 20일선(${smaStr})을 뚫지 못하고 아래에 머물러 저항을 받고 있습니다.`);
      }
    }

    // 6. MACD (Max ±10)
    if (macdValue !== null) {
      if (macdValue > 0) {
        score += 10;
        reasons.push(`[MACD] ⚡ 0선 위 양수(+${macdValue.toFixed(2)})로 상승 모멘텀 유지 (+10점)`);
      } else {
        score -= 10;
        reasons.push(`[MACD] ⚡ 0선 아래 음수(${macdValue.toFixed(2)})로 하락 모멘텀 강세 (-10점)`);
      }
    }

    // 점수 보정 (0 ~ 100 Scale)
    score = Math.max(0, Math.min(100, score));

    // 매매 등급 5단계 분할
    if (score >= 80) opinion = "STRONG BUY";
    else if (score >= 60) opinion = "BUY";
    else if (score <= 20) opinion = "STRONG SELL";
    else if (score <= 40) opinion = "SELL";
    else opinion = "HOLD";

    // Default fallback if no strong signals
    if (reasons.length === 0) {
      reasons.push("현재 시점에서는 뚜렷한 매수나 매도의 기술적 신호가 발견되지 않았습니다. 가격 변동성을 살피며 관망(HOLD)하는 것을 추천합니다.");
    }

    let COMMON_KOREAN_STOCKS_RECORD: Record<string, string> = {};
    try {
      const jsonPath = path.join(process.cwd(), "src", "lib", "korean-stocks.json");
      const fileData = fs.readFileSync(jsonPath, "utf-8");
      const stocksArr = JSON.parse(fileData);
      stocksArr.forEach((s: any) => {
        COMMON_KOREAN_STOCKS_RECORD[s.symbol] = s.shortname;
      });
    } catch (err) {
      console.error("Failed to load korean-stocks.json in analysis route", err);
      // Fallback
      COMMON_KOREAN_STOCKS_RECORD = {
        "005930.KS": "삼성전자", "035720.KS": "카카오"
      };
    }
    const displayName = COMMON_KOREAN_STOCKS_RECORD[symbol] || (quoteResult && (quoteResult.shortName || quoteResult.longName)) || symbol;
    const currency = (quoteResult && quoteResult.currency) || chartResult.meta.currency || "";

    const financialData = summaryResult?.financialData;
    let analyst = null;
    if (financialData && financialData.targetMeanPrice) {
      analyst = {
        targetMeanPrice: financialData.targetMeanPrice,
        targetHighPrice: financialData.targetHighPrice,
        targetLowPrice: financialData.targetLowPrice,
        recommendationKey: financialData.recommendationKey,
        numberOfAnalystOpinions: financialData.numberOfAnalystOpinions,
      };
    }

    return NextResponse.json({
      symbol,
      displayName,
      lastPrice,
      change,
      changePercent,
      currency,
      historical: historical.map((d: any, idx: number) => ({
        time: Math.floor(d.date.getTime() / 1000), // lightweight-charts uses Unix timestamp in seconds
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
        bbUpper: bbSeriesData[idx] ? bbSeriesData[idx].upper : null,
        bbMiddle: bbSeriesData[idx] ? bbSeriesData[idx].middle : null,
        bbLower: bbSeriesData[idx] ? bbSeriesData[idx].lower : null,
        ema5: ema5SeriesData[idx] !== null ? ema5SeriesData[idx] : null,
        ema60: ema60SeriesData[idx] !== null ? ema60SeriesData[idx] : null,
      })),
      indicators: {
        rsi: rsiValue,
        sma20: sma20Value,
        macd: macdValue,
        stoch: stochValue, // { k, d }
        bb: bbValue, // { upper, middle, lower }
      },
      analysis: {
        opinion,
        score,
        reasons,
      },
      analyst
    });

  } catch (error: any) {
    console.error("Analysis API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch data" }, { status: 500 });
  }
}
