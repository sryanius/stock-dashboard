"use client";

import React, { useState, useEffect } from "react";
import { Search, Clock } from "lucide-react";

interface SearchResult {
  symbol: string;
  shortname: string;
  exchange: string;
  typeDisp: string;
}

interface SearchBoxProps {
  onSelect: (symbol: string) => void;
}

interface RecentSearch {
  symbol: string;
  name: string;
}

export default function SearchBox({ onSelect }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("recent_stocks");
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {}
  }, []);

  const addRecentSearch = (symbol: string, name: string) => {
    setRecentSearches(prev => {
      const newRecent = [{ symbol, name }, ...prev.filter(r => r.symbol !== symbol)].slice(0, 5);
      try {
        localStorage.setItem("recent_stocks", JSON.stringify(newRecent));
      } catch {}
      return newRecent;
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setShowDropdown(true);

    try {
      const res = await fetch(`/api/stock/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.quotes || []);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", maxWidth: "600px", margin: "0 auto", width: "100%" }}>
      <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <div style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
            <Search size={20} />
          </div>
          <input
            type="text"
            className="input-base"
            style={{ paddingLeft: "3rem" }}
            placeholder="Search stock code or name (e.g. 삼성전자, AAPL)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {showDropdown && (
        <div
          className="glass-panel"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "0.5rem",
            maxHeight: "300px",
            overflowY: "auto",
            zIndex: 50,
            padding: "0.5rem",
          }}
        >
          {loading ? (
            <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)" }}>Loading results...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)" }}>No results found.</div>
          ) : (
            results.map((r, i) => (
              <div
                key={i}
                onClick={() => {
                  setQuery(r.symbol);
                  setShowDropdown(false);
                  addRecentSearch(r.symbol, r.shortname || r.symbol);
                  onSelect(r.symbol);
                }}
                style={{
                  padding: "0.75rem 1rem",
                  cursor: "pointer",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  transition: "background 0.2s"
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div>
                  <strong style={{ color: "var(--foreground)" }}>{r.symbol}</strong>
                  <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{r.shortname}</div>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
                  {r.exchange}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {recentSearches.length > 0 && !showDropdown && (
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap", justifyContent: "center", alignItems: "center" }} className="animate-fade-in">
          <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem", color: "var(--text-muted)", marginRight: "0.25rem" }}>
            <Clock size={14} /> 최근:
          </span>
          {recentSearches.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setQuery(r.symbol);
                addRecentSearch(r.symbol, r.name);
                onSelect(r.symbol);
              }}
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "16px",
                padding: "4px 12px",
                fontSize: "0.8rem",
                color: "var(--foreground)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                transition: "all 0.2s"
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)"; e.currentTarget.style.borderColor = "var(--primary)"; }}
              onMouseOut={(e) => { e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)"; e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)"; }}
            >
              <strong style={{ color: "var(--primary)", fontWeight: 700 }}>{r.symbol}</strong>
              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{r.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
