"use client";

import React from "react";
import { TrendingUp, MessageSquare, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export interface AnalystCardProps {
  analyst: {
    targetMeanPrice: number;
    targetHighPrice: number;
    targetLowPrice: number;
    recommendationKey: string;
    numberOfAnalystOpinions: number;
    history: any[];
  } | null;
  lastPrice: number;
  currency?: string;
}

export default function AnalystCard({ analyst, lastPrice, currency }: AnalystCardProps) {
  if (!analyst || analyst.numberOfAnalystOpinions === 0) return null;

  const fractionDigits = currency === "KRW" ? 0 : 2;

  const minPrice = Math.min(analyst.targetLowPrice, lastPrice);
  const maxPrice = Math.max(analyst.targetHighPrice, lastPrice) || 1;
  const range = maxPrice - minPrice;

  const lowPerc = ((analyst.targetLowPrice - minPrice) / range) * 100;
  const highPerc = ((analyst.targetHighPrice - minPrice) / range) * 100;
  const meanPerc = ((analyst.targetMeanPrice - minPrice) / range) * 100;
  const currentPerc = ((lastPrice - minPrice) / range) * 100;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  const getActionIcon = (action: string, priceTargetAction: string) => {
    if (action === "up" || priceTargetAction === "Raises") return <ArrowUpRight size={16} color="var(--success)" />;
    if (action === "down" || priceTargetAction === "Lowers") return <ArrowDownRight size={16} color="var(--danger)" />;
    return <Minus size={16} color="var(--warning)" />;
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: "1.5rem" }}>
      <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", fontSize: "1.25rem", fontWeight: "bold" }}>
        <TrendingUp size={24} color="var(--primary)" /> WallStreet Consensus
      </h3>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <span style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>
          {analyst.numberOfAnalystOpinions}개 기관 목표가 집계
        </span>
        {analyst.recommendationKey && (
          <span style={{ 
            background: "rgba(59, 130, 246, 0.15)", 
            color: "var(--primary)", 
            padding: "4px 10px", 
            borderRadius: "6px", 
            fontSize: "0.9rem",
            fontWeight: "bold",
            textTransform: "uppercase",
            boxShadow: "0 0 10px rgba(59, 130, 246, 0.2)"
          }}>
            {analyst.recommendationKey.replace('_', ' ')}
          </span>
        )}
      </div>
      
      <div style={{ position: "relative", paddingBottom: "2.5rem", paddingTop: "1.5rem", marginBottom: "1rem", borderBottom: analyst.history?.length > 0 ? "1px solid rgba(255,255,255,0.1)" : "none" }}>
        {/* Background Track */}
        <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "4px", position: "relative" }}>
          {/* Highlight range from Low to High */}
          <div style={{ 
            position: "absolute", 
            left: `${lowPerc}%`, 
            width: `${highPerc - lowPerc}%`, 
            height: "100%", 
            background: "rgba(59, 130, 246, 0.2)",
            borderRadius: "4px"
          }} />

          {/* Mean Marker */}
          <div style={{
            position: "absolute",
            left: `${meanPerc}%`,
            top: "-4px",
            bottom: "-4px",
            width: "4px",
            background: "var(--primary)",
            borderRadius: "2px",
            transform: "translateX(-50%)"
          }}>
            <div style={{ position: "absolute", top: "-24px", left: "50%", transform: "translateX(-50%)", fontSize: "0.8rem", color: "var(--text-light)", whiteSpace: "nowrap", fontWeight: "bold" }}>
              평균: {analyst.targetMeanPrice.toLocaleString(undefined, { maximumFractionDigits: fractionDigits })}
            </div>
          </div>

          {/* Current Price Marker */}
          <div style={{
            position: "absolute",
            left: `${currentPerc}%`,
            top: "-6px",
            bottom: "-6px",
            width: "6px",
            background: "var(--warning)",
            borderRadius: "3px",
            transform: "translateX(-50%)",
            boxShadow: "0 0 8px rgba(251, 191, 36, 0.6)",
            zIndex: 2
          }}>
            <div style={{ position: "absolute", bottom: "-26px", left: "50%", transform: "translateX(-50%)", fontSize: "0.85rem", color: "var(--warning)", fontWeight: "bold", whiteSpace: "nowrap" }}>
              현재가
            </div>
          </div>
        </div>
        {/* Low & High text at bottom corners */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "12px" }}>
          <span>최저: {analyst.targetLowPrice.toLocaleString(undefined, { maximumFractionDigits: fractionDigits })}</span>
          <span>최고: {analyst.targetHighPrice.toLocaleString(undefined, { maximumFractionDigits: fractionDigits })}</span>
        </div>
      </div>

      {analyst.history && analyst.history.length > 0 && (
        <div>
          <h4 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "var(--text-light)", fontSize: "1rem" }}>
            <MessageSquare size={16} /> Latest Upgrades & Downgrades
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "300px", overflowY: "auto", paddingRight: "0.5rem" }} className="analysis-column">
            {analyst.history.map((h: any, i: number) => (
              <div key={i} style={{ 
                background: "rgba(0,0,0,0.2)", 
                borderRadius: "8px", 
                padding: "0.75rem 1rem",
                borderLeft: h.action === "up" || h.priceTargetAction === "Raises" ? "3px solid var(--success)" : h.action === "down" || h.priceTargetAction === "Lowers" ? "3px solid var(--danger)" : "3px solid var(--warning)",
                fontSize: "0.9rem"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <strong style={{ color: "var(--text-light)" }}>{h.firm}</strong>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{h.epochGradeDate ? formatDate(h.epochGradeDate) : ""}</span>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-light)" }}>
                  {getActionIcon(h.action, h.priceTargetAction)}
                  <span>
                    {h.fromGrade && h.fromGrade !== h.toGrade ? <span style={{ color: "var(--text-muted)", textDecoration: "line-through", marginRight: "0.25rem" }}>{h.fromGrade}</span> : ""}
                    <strong>{h.toGrade}</strong>
                  </span>
                </div>
                
                {(h.currentPriceTarget || h.priorPriceTarget) && (
                  <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Target: {h.priorPriceTarget ? `${h.priorPriceTarget} ➔ ` : ""}
                    <strong style={{ color: h.priceTargetAction === "Raises" ? "var(--success)" : h.priceTargetAction === "Lowers" ? "var(--danger)" : "inherit" }}>
                      {h.currentPriceTarget}
                    </strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
