"use client";

import React, { useState } from "react";
import { TrendingUp, TrendingDown, Minus, Activity, Info } from "lucide-react";

interface AnalysisCardProps {
  symbol: string;
  displayName?: string;
  lastPrice: number;
  change?: number | null;
  changePercent?: number | null;
  currency?: string;
  indicators: {
    rsi: number | null;
    sma20: number | null;
    macd: number | null;
    stoch: { k: number; d: number; } | null;
    bb: { upper: number; middle: number; lower: number; } | null;
  };
  analysis: {
    opinion: string;
    score?: number;
    reasons: string[];
  };
  analyst?: {
    targetMeanPrice: number;
    targetHighPrice: number;
    targetLowPrice: number;
    recommendationKey: string;
    numberOfAnalystOpinions: number;
  } | null;
}

export default function AnalysisCard({ symbol, displayName, lastPrice, change, changePercent, currency, indicators, analysis, analyst }: AnalysisCardProps) {
  const [activeInfo, setActiveInfo] = useState<string | null>(null);

  // 한국 주식의 경우 소수점 생략
  const isDomestic = currency === "KRW" || symbol.endsWith(".KS") || symbol.endsWith(".KQ");
  const fractionDigits = isDomestic ? 0 : 2;

  const indicatorDescriptions: Record<string, string> = {
    RSI: "상대강도지수(RSI)는 일정 기간 주가의 상승폭과 하락폭을 종합해 '과매수/과매도' 상태를 판단하는 지표입니다. 보통 70 이상이면 단기 과열(매도 고려), 30 이하면 과매도(매수 고려) 구간으로 봅니다.",
    SMA: "단순이동평균(SMA)은 지난 20일간의 평균 주가를 선으로 이은 것입니다. 현재 주가가 20일 선보다 위에 위치하면 상승 추세, 아래에 있으면 하락 추세로 해석하며 지지선과 저항선 역할을 합니다.",
    MACD: "이동평균수렴확산(MACD)은 단기 흐름과 장기 흐름의 차이를 분석하는 추세 지표입니다. 주로 양수(+)일 때 상승세, 음수(-)일 때 하락세를 의미하며, 추세가 전환되는 변곡점을 포착할 때 활용합니다.",
    Stochastic: "스토캐스틱(Stochastic)은 최근 거래 기간 동안의 가격 범위 내에서 현재 변동성이 어디쯤인지 백분율(%)로 표기한 단기 퀀트 지표입니다. 보통 선행하는 파란색 선(%K)이 빨간 선(%D)을 침체 구간에서 상향 돌파하면 최강의 매수 시그널로 봅니다.",
    BollingerBands: "볼린저 밴드(Bollinger Bands)는 중심되는 이동평균선을 기준으로 주가의 변동성에 비례해 늘어나거나 줄어드는 상/하한선(밴드)을 그린 지표입니다. 주가가 밴드 하단을 강하게 이탈하면 투매(매수 적기), 상단을 돌파하면 단기 과열(매도 적기) 상태로 볼 수 있습니다."
  };

  const getPercentB = () => {
    if (!indicators.bb || !lastPrice) return null;
    return ((lastPrice - indicators.bb.lower) / (indicators.bb.upper - indicators.bb.lower)) * 100;
  };

  const toggleInfo = (key: string) => {
    setActiveInfo(activeInfo === key ? null : key);
  };

  const getOpinionColor = () => {
    switch (analysis.opinion) {
      case "STRONG BUY": return "#059669"; // Emerald 600 (Darker/stronger green)
      case "BUY": return "var(--success)";
      case "STRONG SELL": return "#e11d48"; // Rose 600 (Darker/stronger red)
      case "SELL": return "var(--danger)";
      default: return "var(--warning)";
    }
  };

  const getOpinionBg = () => {
    switch (analysis.opinion) {
      case "STRONG BUY": return "rgba(5, 150, 105, 0.2)";
      case "BUY": return "var(--success-bg)";
      case "STRONG SELL": return "rgba(225, 29, 72, 0.2)";
      case "SELL": return "var(--danger-bg)";
      default: return "var(--warning-bg)";
    }
  };

  const OpinionIcon = () => {
    switch (analysis.opinion) {
      case "STRONG BUY": return <TrendingUp size={38} color={getOpinionColor()} strokeWidth={3} />;
      case "BUY": return <TrendingUp size={32} color={getOpinionColor()} />;
      case "STRONG SELL": return <TrendingDown size={38} color={getOpinionColor()} strokeWidth={3} />;
      case "SELL": return <TrendingDown size={32} color={getOpinionColor()} />;
      default: return <Minus size={32} color={getOpinionColor()} />;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", gap: "1.5rem" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {displayName || symbol}
            {displayName && displayName !== symbol && (
              <span style={{ fontSize: "1rem", color: "var(--text-muted)", fontWeight: "normal", marginLeft: "0.5rem" }}>
                {symbol}
              </span>
            )}
          </h2>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "var(--primary)", display: "flex", alignItems: "baseline", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
            {lastPrice.toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}
            
            {currency && (
              <span style={{ fontSize: "1.1rem", color: "var(--text-muted)", marginLeft: "-0.25rem", marginRight: "0.5rem", fontWeight: "normal" }}>
                {currency}
              </span>
            )}
            
            {change != null && changePercent != null && (
              <span style={{ 
                fontSize: "1.25rem", 
                fontWeight: "600", 
                color: change > 0 ? "var(--success)" : change < 0 ? "var(--danger)" : "var(--text-muted)" 
              }}>
                {change > 0 ? "▲" : change < 0 ? "▼" : ""} {Math.abs(change).toLocaleString(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })} 
                ({change > 0 ? "+" : ""}{changePercent.toFixed(2)}%)
              </span>
            )}
          </div>
        </div>
        
        <div style={{ 
          background: getOpinionBg(), 
          border: `1px solid ${getOpinionColor()}`,
          borderRadius: "12px",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minWidth: "110px",
          flexShrink: 0,
          boxShadow: analysis.opinion.includes("STRONG") ? `0 0 15px ${getOpinionBg()}` : "none"
        }}>
          <OpinionIcon />
          <strong style={{ color: getOpinionColor(), fontSize: analysis.opinion.includes("STRONG") ? "1.1rem" : "1.25rem", marginTop: "0.5rem", textAlign: "center", lineHeight: "1.2", textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
            {analysis.opinion}
          </strong>
          {analysis.score !== undefined && (
            <div style={{ 
              marginTop: "0.5rem", 
              fontSize: "0.85rem", 
              color: getOpinionColor(), 
              fontWeight: "bold", 
              background: "rgba(0,0,0,0.3)", 
              padding: "4px 12px", 
              borderRadius: "12px",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.4)"
            }}>
              점수: {analysis.score}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "var(--text-light)" }}>
          <Activity size={18} /> Technical Indicators
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem" }}>
          {/* RSI */}
          <div 
            style={{ cursor: "pointer", transition: "all 0.2s", background: activeInfo === "RSI" ? "rgba(59, 130, 246, 0.15)" : "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "8px", textAlign: "center", border: activeInfo === "RSI" ? "1px solid var(--primary)" : "1px solid transparent" }}
            onClick={() => toggleInfo("RSI")}
            title="클릭하여 설명 보기"
          >
            <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "0.25rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.25rem" }}>
              RSI (14) <Info size={14} style={{ opacity: 0.5 }} />
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: indicators.rsi && indicators.rsi > 70 ? "var(--danger)" : indicators.rsi && indicators.rsi < 30 ? "var(--success)" : "inherit" }}>
              {indicators.rsi ? indicators.rsi.toFixed(2) : "N/A"}
            </div>
          </div>
          
          {/* SMA */}
          <div 
            style={{ cursor: "pointer", transition: "all 0.2s", background: activeInfo === "SMA" ? "rgba(59, 130, 246, 0.15)" : "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "8px", textAlign: "center", border: activeInfo === "SMA" ? "1px solid var(--primary)" : "1px solid transparent" }}
            onClick={() => toggleInfo("SMA")}
            title="클릭하여 설명 보기"
          >
            <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "0.25rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.25rem" }}>
              SMA (20) <Info size={14} style={{ opacity: 0.5 }} />
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
              {indicators.sma20 ? indicators.sma20.toFixed(2) : "N/A"}
            </div>
          </div>
          
          {/* MACD */}
          <div 
            style={{ cursor: "pointer", transition: "all 0.2s", background: activeInfo === "MACD" ? "rgba(59, 130, 246, 0.15)" : "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "8px", textAlign: "center", border: activeInfo === "MACD" ? "1px solid var(--primary)" : "1px solid transparent" }}
            onClick={() => toggleInfo("MACD")}
            title="클릭하여 설명 보기"
          >
            <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "0.25rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.25rem" }}>
              MACD <Info size={14} style={{ opacity: 0.5 }} />
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: indicators.macd && indicators.macd > 0 ? "var(--success)" : indicators.macd && indicators.macd < 0 ? "var(--danger)" : "inherit" }}>
              {indicators.macd ? indicators.macd.toFixed(2) : "N/A"}
            </div>
          </div>

          {/* Stochastic */}
          <div 
            style={{ cursor: "pointer", transition: "all 0.2s", background: activeInfo === "Stochastic" ? "rgba(59, 130, 246, 0.15)" : "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "8px", textAlign: "center", border: activeInfo === "Stochastic" ? "1px solid var(--primary)" : "1px solid transparent" }}
            onClick={() => toggleInfo("Stochastic")}
            title="클릭하여 설명 보기"
          >
            <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "0.25rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.25rem", whiteSpace: "nowrap" }}>
              Stochastic <Info size={14} style={{ opacity: 0.5 }} />
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: indicators.stoch && indicators.stoch.k < 20 ? "var(--success)" : indicators.stoch && indicators.stoch.k > 80 ? "var(--danger)" : "inherit" }}>
              {indicators.stoch ? `${indicators.stoch.k.toFixed(1)} / ${indicators.stoch.d.toFixed(1)}` : "N/A"}
            </div>
          </div>

          {/* Bollinger Bands (%B) */}
          <div 
            style={{ cursor: "pointer", transition: "all 0.2s", background: activeInfo === "BollingerBands" ? "rgba(59, 130, 246, 0.15)" : "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "8px", textAlign: "center", border: activeInfo === "BollingerBands" ? "1px solid var(--primary)" : "1px solid transparent" }}
            onClick={() => toggleInfo("BollingerBands")}
            title="클릭하여 설명 보기"
          >
            <div style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "0.25rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.25rem", whiteSpace: "nowrap" }}>
              Bollinger %B <Info size={14} style={{ opacity: 0.5 }} />
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: getPercentB() !== null && getPercentB()! <= 0 ? "var(--success)" : getPercentB() !== null && getPercentB()! >= 100 ? "var(--danger)" : "inherit" }}>
              {getPercentB() !== null ? `${getPercentB()!.toFixed(1)}%` : "N/A"}
            </div>
          </div>
        </div>

        {/* Selected Indicator Info Panel */}
        {activeInfo && (
          <div className="animate-fade-in" style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "rgba(59, 130, 246, 0.1)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            borderRadius: "8px",
            color: "var(--text-light)",
            fontSize: "0.95rem",
            lineHeight: "1.6",
            width: "100%",
            boxSizing: "border-box",
            wordBreak: "break-word",
            overflowWrap: "break-word"
          }}>
            <strong style={{ color: "var(--primary)", display: "block", marginBottom: "0.25rem", fontSize: "1.05rem" }}>{activeInfo} 란?</strong>
            {indicatorDescriptions[activeInfo]}
          </div>
        )}
      </div>

      <div>
        <h3 style={{ marginBottom: "0.75rem", color: "var(--text-light)" }}>AI Analysis</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {analysis.reasons.map((reason, idx) => (
            <li key={idx} style={{ 
              position: "relative",
              paddingLeft: "1.5rem",
              marginBottom: "0.5rem",
              color: "var(--text-light)"
            }}>
              <span style={{ 
                position: "absolute",
                left: 0,
                top: "8px",
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--primary)"
              }} />
              {reason}
            </li>
          ))}
        </ul>
      </div>

      {/* Analyst Consensus Summary */}
      {analyst && analyst.numberOfAnalystOpinions > 0 && (
        <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "var(--text-light)" }}>
            <TrendingUp size={18} /> WallStreet Consensus (목표가)
          </h3>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              {analyst.numberOfAnalystOpinions}개 기관 참여
            </span>
            {analyst.recommendationKey && (
              <span style={{ 
                background: "rgba(59, 130, 246, 0.15)", 
                color: "var(--primary)", 
                padding: "2px 8px", 
                borderRadius: "4px", 
                fontSize: "0.85rem",
                fontWeight: "bold",
                textTransform: "uppercase"
              }}>
                {analyst.recommendationKey.replace('_', ' ')}
              </span>
            )}
          </div>
          
          <div style={{ marginBottom: "0.5rem", position: "relative", paddingBottom: "2rem", paddingTop: "1rem" }}>
            {/* Background Track */}
            <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", position: "relative" }}>
              {/* Highlight range from Low to High */}
              <div style={{ 
                position: "absolute", 
                left: `${((analyst.targetLowPrice - Math.min(analyst.targetLowPrice, lastPrice)) / (Math.max(analyst.targetHighPrice, lastPrice) - Math.min(analyst.targetLowPrice, lastPrice) || 1)) * 100}%`, 
                width: `${((analyst.targetHighPrice - analyst.targetLowPrice) / (Math.max(analyst.targetHighPrice, lastPrice) - Math.min(analyst.targetLowPrice, lastPrice) || 1)) * 100}%`, 
                height: "100%", 
                background: "rgba(59, 130, 246, 0.2)",
                borderRadius: "4px"
              }} />

              {/* Mean Marker */}
               <div style={{
                position: "absolute",
                left: `${((analyst.targetMeanPrice - Math.min(analyst.targetLowPrice, lastPrice)) / (Math.max(analyst.targetHighPrice, lastPrice) - Math.min(analyst.targetLowPrice, lastPrice) || 1)) * 100}%`,
                top: "-4px",
                bottom: "-4px",
                width: "4px",
                background: "var(--primary)",
                borderRadius: "2px",
                transform: "translateX(-50%)"
              }}>
                <div style={{ position: "absolute", top: "-20px", left: "50%", transform: "translateX(-50%)", fontSize: "0.75rem", color: "var(--text-light)", whiteSpace: "nowrap" }}>
                  평균: {analyst.targetMeanPrice.toLocaleString(undefined, { maximumFractionDigits: fractionDigits })}
                </div>
              </div>

              {/* Current Price Marker */}
              <div style={{
                position: "absolute",
                left: `${((lastPrice - Math.min(analyst.targetLowPrice, lastPrice)) / (Math.max(analyst.targetHighPrice, lastPrice) - Math.min(analyst.targetLowPrice, lastPrice) || 1)) * 100}%`,
                top: "-6px",
                bottom: "-6px",
                width: "6px",
                background: "var(--warning)",
                borderRadius: "3px",
                transform: "translateX(-50%)",
                boxShadow: "0 0 5px rgba(251, 191, 36, 0.5)",
                zIndex: 2
              }}>
                <div style={{ position: "absolute", bottom: "-22px", left: "50%", transform: "translateX(-50%)", fontSize: "0.75rem", color: "var(--warning)", fontWeight: "bold", whiteSpace: "nowrap" }}>
                  현재가
                </div>
              </div>
            </div>
            {/* Low & High text at bottom corners approx */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "8px" }}>
              <span>최저: {analyst.targetLowPrice.toLocaleString(undefined, { maximumFractionDigits: fractionDigits })}</span>
              <span>최고: {analyst.targetHighPrice.toLocaleString(undefined, { maximumFractionDigits: fractionDigits })}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
