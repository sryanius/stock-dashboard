"use client";

import React, { useState, useEffect } from "react";
import SearchBox from "@/components/SearchBox";
import StockChart from "@/components/StockChart";
import AnalysisCard from "@/components/AnalysisCard";
import AnalystCard from "@/components/AnalystCard";
import { Activity } from "lucide-react";

export default function Home() {
  const [symbol, setSymbol] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>("1d");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const fetchStockData = async (selectedSymbol: string, tf: string = timeframe) => {
    if (symbol !== selectedSymbol) {
      setData(null);
    }
    setSymbol(selectedSymbol);
    setTimeframe(tf);
    setLoading(true);
    setError(null);

    // Update URL dynamically without reloading the page
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("symbol", selectedSymbol);
      url.searchParams.set("timeframe", tf);
      window.history.pushState({}, "", url.pathname + url.search);
    }

    try {
      // Fetch selected interval
      const res = await fetch(`/api/stock/analysis?symbol=${encodeURIComponent(selectedSymbol)}&interval=${tf}`);
      if (!res.ok) {
        throw new Error("Failed to fetch stock data");
      }
      const jsonData = await res.json();
      if (jsonData.error) {
        throw new Error(jsonData.error);
      }
      setData(jsonData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const s = params.get("symbol");
      const tf = params.get("timeframe");
      if (s) {
        fetchStockData(s, tf || "1d");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ 
          fontSize: "3rem", 
          fontWeight: "800", 
          marginBottom: "1rem", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          gap: "1rem",
          background: "linear-gradient(to right, #60a5fa, #3b82f6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent"
        }}>
          <Activity size={40} color="#3b82f6" /> AI Quant Dashboard
        </h1>
        <p style={{ color: "var(--text-light)", fontSize: "1.125rem", maxWidth: "600px", margin: "0 auto" }}>
          Advanced stock visualization and algorithmic buy/sell signals powered by technical indicators.
        </p>
      </div>
      
      <div style={{ marginBottom: "2rem" }}>
        <SearchBox onSelect={(s) => fetchStockData(s, timeframe)} />
      </div>

      {loading && !data && (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem 0" }}>
          <div className="animate-pulse" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "4px solid var(--primary)", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
            <span style={{ color: "var(--text-muted)" }}>Analyzing market data for {symbol}...</span>
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}} />
        </div>
      )}

      {error && (
        <div className="glass-panel" style={{ padding: "1.5rem", color: "var(--danger)", background: "var(--danger-bg)", borderColor: "var(--danger)", textAlign: "center" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {data && (
        <div className="animate-fade-in dashboard-layout" style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.2s" }}>
          
          <div className="chart-section">
            <div style={{ 
              display: "flex", 
              gap: "0.5rem", 
              justifyContent: "center", 
              flexWrap: "wrap",
              padding: "1rem",
              background: "var(--panel-bg)",
              borderRadius: "12px",
              border: "1px solid var(--panel-border)"
            }}>
              {/* 일 단위 탭 */}
              <div style={{ display: "flex", gap: "0.5rem", borderRight: "1px solid rgba(255,255,255,0.1)", paddingRight: "1rem", marginRight: "0.5rem" }}>
                {[
                  { id: "1d", label: "일봉" },
                  { id: "1wk", label: "주봉" },
                  { id: "1mo", label: "월봉" },
                ].map(tf => (
                  <button 
                    key={tf.id}
                    className={timeframe === tf.id ? "btn btn-primary" : "btn"}
                    style={{ background: timeframe !== tf.id ? "rgba(255,255,255,0.1)" : undefined }}
                    onClick={() => fetchStockData(symbol!, tf.id)}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              {/* 분 단위 탭 */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {[
                  { id: "1m", label: "1분봉" },
                  { id: "5m", label: "5분봉" },
                  { id: "15m", label: "15분봉" },
                  { id: "30m", label: "30분봉" },
                ].map(tf => (
                  <button 
                    key={tf.id}
                    className={timeframe === tf.id ? "btn btn-primary" : "btn"}
                    style={{ background: timeframe !== tf.id ? "rgba(255,255,255,0.1)" : undefined }}
                    onClick={() => fetchStockData(symbol!, tf.id)}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="glass-panel" style={{ padding: "1.5rem", position: "relative", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexShrink: 0 }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: 0 }}>Price & Volume History</h3>
              </div>
              <div style={{ position: "relative", minHeight: "600px" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
                  <StockChart data={data.historical} />
                </div>
              </div>
            </div>
          </div>

          <div className="cards-section" style={{ alignSelf: "start" }}>
            <AnalysisCard 
              symbol={data.symbol}
              displayName={data.displayName}
              lastPrice={data.lastPrice}
              change={data.change}
              changePercent={data.changePercent}
              currency={data.currency}
              indicators={data.indicators}
              analysis={data.analysis}
            />
            {data.analyst && data.analyst.numberOfAnalystOpinions > 0 && (
              <AnalystCard 
                analyst={data.analyst} 
                lastPrice={data.lastPrice} 
                currency={data.currency} 
              />
            )}
          </div>

        </div>
      )}
      
      {!data && !loading && !error && (
        <div className="glass-panel" style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--text-muted)" }}>
          <Search size={48} style={{ opacity: 0.2, margin: "0 auto 1rem" }} />
          <p>Search for a stock symbol to view its technical analysis</p>
        </div>
      )}
    </div>
  );
}

// Ensure the Search icon is available if used at the bottom
import { Search } from "lucide-react";
