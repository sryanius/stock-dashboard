import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import fs from "fs";
import path from "path";

const yahooFinance = new YahooFinance();

let COMMON_KOREAN_STOCKS: any[] = [];
try {
  const jsonPath = path.join(process.cwd(), "src", "lib", "korean-stocks.json");
  const fileData = fs.readFileSync(jsonPath, "utf-8");
  COMMON_KOREAN_STOCKS = JSON.parse(fileData);
} catch (err) {
  console.error("Failed to load korean-stocks.json", err);
  COMMON_KOREAN_STOCKS = [
    { symbol: "005930.KS", shortname: "삼성전자", exchange: "KSC", typeDisp: "Equity" },
    { symbol: "035720.KS", shortname: "카카오", exchange: "KSC", typeDisp: "Equity" }
  ];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  try {
    const quotes: any[] = [];
    
    // 1. 한국어/공통 매핑 결과 먼저 추가
    const localMatches = COMMON_KOREAN_STOCKS.filter(s => 
      s.shortname.includes(q) || s.symbol.includes(q) || q.includes(s.shortname)
    ).slice(0, 20); // 한글 검색 시 너무 많은 결과 방지
    quotes.push(...localMatches);

    // 2. Yahoo Finance 검색 시도 (한국어 등 지원하지 않는 쿼리일 경우 BadRequest 발생 가능)
    try {
      const results: any = await yahooFinance.search(q, {
        newsCount: 0,
        quotesCount: 10,
      });

      const yahooQuotes = results.quotes.filter((qData: any) => qData.isYahooFinance).map((qData: any) => ({
        symbol: qData.symbol,
        shortname: qData.shortname || qData.longname || qData.symbol,
        exchange: qData.exchange,
        typeDisp: qData.typeDisp,
      }));

      // 중복 제거 후 통합
      for (const yq of yahooQuotes) {
        if (!quotes.some(mq => mq.symbol === yq.symbol)) {
          quotes.push(yq);
        }
      }
    } catch (yahooErr: any) {
      if (yahooErr.name !== "BadRequestError") {
        console.error("Yahoo Search non-BadRequest Error:", yahooErr);
      }
    }

    return NextResponse.json({ quotes });
  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to search" }, { status: 500 });
  }
}
