"use client";

import React, { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries, LineSeries, ISeriesApi } from "lightweight-charts";

interface StockChartProps {
  data: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    bbUpper?: number | null;
    bbMiddle?: number | null;
    bbLower?: number | null;
    ema5?: number | null;
    ema60?: number | null;
  }[];
}

export default function StockChart({ data }: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [showEma, setShowEma] = useState(false);
  const [showBb, setShowBb] = useState(false);

  // Store series references for toggling visibility
  const ema5SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ema60SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbUpperSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbMiddleSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbLowerSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#cbd5e1",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.05)" },
        horzLines: { color: "rgba(255, 255, 255, 0.05)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
        timeVisible: true,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 400,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    const tzOffset = new Date().getTimezoneOffset() * 60;
    const adjustedData = data.map((d: any) => ({
      ...d,
      time: d.time - tzOffset,
    }));

    candlestickSeries.setData(adjustedData as any);

    // Overlays
    const ema5Data = adjustedData.filter(d => d.ema5 !== null).map(d => ({ time: d.time, value: d.ema5 }));
    const ema60Data = adjustedData.filter(d => d.ema60 !== null).map(d => ({ time: d.time, value: d.ema60 }));
    const bbUpperData = adjustedData.filter(d => d.bbUpper !== null).map(d => ({ time: d.time, value: d.bbUpper }));
    const bbMiddleData = adjustedData.filter(d => d.bbMiddle !== null).map(d => ({ time: d.time, value: d.bbMiddle }));
    const bbLowerData = adjustedData.filter(d => d.bbLower !== null).map(d => ({ time: d.time, value: d.bbLower }));

    if (ema5Data.length > 0) {
      const ema5Series = chart.addSeries(LineSeries, { color: 'rgba(234, 179, 8, 0.8)', lineWidth: 2, title: 'EMA5', visible: showEma });
      ema5Series.setData(ema5Data as any);
      ema5SeriesRef.current = ema5Series;
    }
    if (ema60Data.length > 0) {
      const ema60Series = chart.addSeries(LineSeries, { color: 'rgba(99, 102, 241, 0.8)', lineWidth: 2, title: 'EMA60', visible: showEma });
      ema60Series.setData(ema60Data as any);
      ema60SeriesRef.current = ema60Series;
    }
    if (bbUpperData.length > 0) {
      const bbUpperSeries = chart.addSeries(LineSeries, { color: 'rgba(148, 163, 184, 0.5)', lineWidth: 1, lineStyle: 2, visible: showBb });
      bbUpperSeries.setData(bbUpperData as any);
      bbUpperSeriesRef.current = bbUpperSeries;
    }
    if (bbLowerData.length > 0) {
      const bbLowerSeries = chart.addSeries(LineSeries, { color: 'rgba(148, 163, 184, 0.5)', lineWidth: 1, lineStyle: 2, visible: showBb });
      bbLowerSeries.setData(bbLowerData as any);
      bbLowerSeriesRef.current = bbLowerSeries;
    }
    if (bbMiddleData.length > 0) {
      const bbMiddleSeries = chart.addSeries(LineSeries, { color: 'rgba(148, 163, 184, 0.3)', lineWidth: 1, lineStyle: 3, visible: showBb });
      bbMiddleSeries.setData(bbMiddleData as any);
      bbMiddleSeriesRef.current = bbMiddleSeries;
    }

    // Add Volume
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#26a69a",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8, // highest point of the series will be at 80% of the chart height
        bottom: 0,
      },
    });

    const volumeData = adjustedData.map((d: any, index: number) => ({
      time: d.time,
      value: data[index].volume,
      color: data[index].close > data[index].open ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)",
    }));
    
    volumeSeries.setData(volumeData as any);

    // 스마트 줌(Smart Zoom) 로직
    const totalCandles = data.length;
    if (totalCandles > 0) {
      const firstTime = data[0].time as number; // 순수 UTC 시간 사용
      const lastTime = data[totalCandles - 1].time as number;
      const durationDays = (lastTime - firstTime) / 86400;

      if (durationDays <= 10) {
        // 단기 분봉(10일 치 미만 데이터)일 경우
        const lastDate = new Date(lastTime * 1000).getDate();
        let startIndex = 0;
        
        for (let i = totalCandles - 1; i >= 0; i--) {
          if (new Date((data[i].time as number) * 1000).getDate() !== lastDate) {
            startIndex = i + 1;
            break;
          }
        }
        
        // 장이 갓 열려 오늘의 캔들이 30개 미만으로 너무 적을 때는 너무 과하게 확대되지 않게 이전 80개 캔들도 같이 노출 (대략 1~2시간 분량 확보)
        if (totalCandles - startIndex < 30) {
          startIndex = Math.max(0, totalCandles - 80); 
        }

        chart.timeScale().setVisibleLogicalRange({
          from: startIndex,
          to: totalCandles - 1,
        });
      } else {
        // 장기 차트(일봉, 주봉, 월봉)는 언제나 전체 데이터 피팅(Fit)
        chart.timeScale().fitContent();
      }
    } else {
      chart.timeScale().fitContent();
    }

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight || 400,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (ema5SeriesRef.current) ema5SeriesRef.current.applyOptions({ visible: showEma });
    if (ema60SeriesRef.current) ema60SeriesRef.current.applyOptions({ visible: showEma });
  }, [showEma]);

  useEffect(() => {
    if (bbUpperSeriesRef.current) bbUpperSeriesRef.current.applyOptions({ visible: showBb });
    if (bbMiddleSeriesRef.current) bbMiddleSeriesRef.current.applyOptions({ visible: showBb });
    if (bbLowerSeriesRef.current) bbLowerSeriesRef.current.applyOptions({ visible: showBb });
  }, [showBb]);

  const btnStyle = (active: boolean) => ({
    background: active ? "rgba(59, 130, 246, 0.8)" : "rgba(30, 41, 59, 0.8)",
    color: active ? "#ffffff" : "var(--text-muted)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "4px",
    padding: "4px 8px",
    fontSize: "0.75rem",
    cursor: "pointer",
    backdropFilter: "blur(4px)",
    transition: "all 0.2s",
    zIndex: 10
  });

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div style={{ position: "absolute", top: "10px", left: "10px", display: "flex", gap: "0.5rem", zIndex: 10 }}>
        <button onClick={() => setShowEma(!showEma)} style={btnStyle(showEma)}>
          EMA 5/60 {showEma ? "ON" : "OFF"}
        </button>
        <button onClick={() => setShowBb(!showBb)} style={btnStyle(showBb)}>
          Bollinger {showBb ? "ON" : "OFF"}
        </button>
      </div>
      <div ref={chartContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
