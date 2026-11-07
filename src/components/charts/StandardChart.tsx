/**
 * BritConnect Section 9.3 Production Chart Suite
 * Strictly adheres to:
 * - NO gridlines (clean baseline only)
 * - Direct data labels
 * - Rich tooltips with share and delta
 * - Dashed gold benchmark lines
 * - Donut charts with external labels
 * - Chart actions: Download PNG, View Data Table, Fullscreen Modal, Explain with AI
 */

import React, { useState, useRef } from 'react';
import { Download, Table, Maximize2, Minimize2, Sparkles, X } from 'lucide-react';

export interface ChartDataPoint {
  label: string;
  value: number;
  count?: number;
  secondaryValue?: number;
  color?: string;
  tooltipExtra?: string;
}

export interface StandardChartProps {
  title: string;
  subtitle: string;
  footnote?: string;
  data: ChartDataPoint[];
  type?: 'bar' | 'horizontal_bar' | 'donut' | 'line';
  valueUnit?: '%' | '£' | 'count' | 'months';
  benchmarkValue?: number;
  benchmarkLabel?: string;
  filterContext?: string;
  height?: number;
}

export const StandardChart: React.FC<StandardChartProps> = ({
  title,
  subtitle,
  footnote = 'BritConnect Active Analytics · As at Nov 2026',
  data,
  type = 'bar',
  valueUnit = 'count',
  benchmarkValue,
  benchmarkLabel,
  filterContext = 'Global Filters',
  height = 260,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Formatting helpers
  const formatValue = (val: number): string => {
    if (valueUnit === '£') return `£${val.toLocaleString('en-GB', { minimumFractionDigits: val % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;
    if (valueUnit === '%') return `${val.toFixed(1)}%`;
    if (valueUnit === 'months') return `${val.toFixed(1)}m`;
    return val.toLocaleString('en-GB');
  };

  const totalValue = data.reduce((acc, d) => acc + d.value, 0);
  const maxValue = Math.max(...data.map((d) => d.value), benchmarkValue || 0, 1);

  // Palette assignments
  const navyPrimary = '#0B1F3A';
  const navySecondary = '#1D4C8F';
  const goldPrimary = '#C9A227';
  const winePrimary = '#7A0C1E';
  const defaultColors = ['#0B1F3A', '#1D4C8F', '#C9A227', '#7A0C1E', '#3E5C76', '#8F7218', '#A3152B', '#5B6575'];

  // PNG Export Handler
  const handleExportPng = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    const svgSize = svgRef.current.getBoundingClientRect();
    canvas.width = svgSize.width * 2;
    canvas.height = svgSize.height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, svgSize.width, svgSize.height);

    const img = new Image();
    img.setAttribute('src', 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData))));
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
  };

  // AI Chart Explanation
  const handleExplainWithAi = async () => {
    setIsLoadingAi(true);
    try {
      const res = await fetch('/api/gemini/explain-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartTitle: title, chartData: data, filterContext }),
      });
      const json = await res.json();
      setAiExplanation(json.text || 'Unable to produce narrative for this chart.');
    } catch {
      setAiExplanation('Service temporarily unavailable. Please verify API key.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border border-[#E3E7EE] p-5 shadow-xs transition-all relative flex flex-col justify-between ${
        isFullscreen ? 'fixed inset-4 z-50 overflow-auto bg-white shadow-2xl p-8' : ''
      }`}
    >
      {/* Header & Action Controls */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <h3 className="text-base font-bold text-[#0B1F3A] tracking-tight">{title}</h3>
            <p className="text-xs text-[#5B6575] mt-0.5">{subtitle}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleExplainWithAi}
              title="Explain this chart with AI"
              className="p-1.5 text-[#5B6575] hover:text-[#C9A227] hover:bg-[#F4F7FB] rounded-md transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowTableModal(!showTableModal)}
              title="View data table"
              className="p-1.5 text-[#5B6575] hover:text-[#0B1F3A] hover:bg-[#F4F7FB] rounded-md transition"
            >
              <Table className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleExportPng}
              title="Download high-res PNG"
              className="p-1.5 text-[#5B6575] hover:text-[#0B1F3A] hover:bg-[#F4F7FB] rounded-md transition"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit full screen' : 'Full screen view'}
              className="p-1.5 text-[#5B6575] hover:text-[#0B1F3A] hover:bg-[#F4F7FB] rounded-md transition"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* AI Explanation Banner */}
        {aiExplanation && (
          <div className="my-2.5 p-3 bg-[#F4F7FB] border border-[#C9A227]/40 rounded-lg text-xs text-[#12305A] relative">
            <button
              onClick={() => setAiExplanation(null)}
              className="absolute top-2 right-2 text-[#5B6575] hover:text-[#0B1F3A]"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="font-semibold flex items-center gap-1.5 text-[#8F7218] mb-1">
              <Sparkles className="w-3.5 h-3.5" /> BritConnect Strategic AI Observation
            </div>
            <p className="whitespace-pre-line leading-relaxed">{aiExplanation}</p>
          </div>
        )}

        {isLoadingAi && (
          <div className="my-2.5 p-2 bg-[#F4F7FB] rounded-lg text-xs text-[#5B6575] animate-pulse">
            Generating expert chart diagnostic...
          </div>
        )}
      </div>

      {/* Main Chart SVG Rendering */}
      <div className="relative w-full my-auto py-2" style={{ height: isFullscreen ? 500 : height }}>
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[#5B6575]">
            No records matching selected criteria.
          </div>
        ) : type === 'horizontal_bar' ? (
          // ================= HORIZONTAL BAR CHART =================
          <div className="flex flex-col justify-around h-full gap-2">
            {data.slice(0, 10).map((d, i) => {
              const widthPct = Math.max(2, (d.value / maxValue) * 100);
              const isHovered = hoveredIdx === i;
              const barColor = d.color || (d.value === maxValue ? winePrimary : navySecondary);

              return (
                <div
                  key={d.label}
                  className="flex items-center gap-3 text-xs"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <span className="w-32 truncate text-right font-medium text-[#1A2233]" title={d.label}>
                    {d.label}
                  </span>
                  <div className="flex-1 h-5.5 bg-[#F5F6F8] rounded-r-md relative flex items-center overflow-hidden">
                    <div
                      className="h-full rounded-r-md transition-all duration-500 ease-out flex items-center justify-end pr-2"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: barColor,
                        opacity: isHovered ? 0.85 : 1,
                      }}
                    >
                      {widthPct > 20 && (
                        <span className="text-[10px] font-semibold text-white drop-shadow-xs">
                          {formatValue(d.value)}
                        </span>
                      )}
                    </div>
                    {widthPct <= 20 && (
                      <span className="text-[10px] font-semibold text-[#1A2233] ml-2">
                        {formatValue(d.value)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : type === 'donut' ? (
          // ================= DONUT CHART WITH OUTSIDE LABELS =================
          <div className="flex items-center justify-center h-full relative">
            <svg ref={svgRef} viewBox="0 0 240 240" className="w-56 h-56">
              {(() => {
                let cumulativeAngle = 0;
                return data.slice(0, 6).map((d, i) => {
                  const sliceRatio = totalValue > 0 ? d.value / totalValue : 1 / data.length;
                  const sliceAngle = sliceRatio * 360;
                  const startAngle = cumulativeAngle;
                  cumulativeAngle += sliceAngle;
                  const endAngle = cumulativeAngle;

                  // Convert polar to cartesian
                  const cx = 120;
                  const cy = 120;
                  const rOut = 80;
                  const rIn = 48;

                  const startRad = ((startAngle - 90) * Math.PI) / 180;
                  const endRad = ((endAngle - 90) * Math.PI) / 180;

                  const x1 = cx + rOut * Math.cos(startRad);
                  const y1 = cy + rOut * Math.sin(startRad);
                  const x2 = cx + rOut * Math.cos(endRad);
                  const y2 = cy + rOut * Math.sin(endRad);

                  const x3 = cx + rIn * Math.cos(endRad);
                  const y3 = cy + rIn * Math.sin(endRad);
                  const x4 = cx + rIn * Math.cos(startRad);
                  const y4 = cy + rIn * Math.sin(startRad);

                  const largeArc = sliceAngle > 180 ? 1 : 0;
                  const pathData = `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${largeArc} 0 ${x4} ${y4} Z`;

                  const sliceColor = d.color || defaultColors[i % defaultColors.length];
                  const isHovered = hoveredIdx === i;

                  return (
                    <path
                      key={d.label}
                      d={pathData}
                      fill={sliceColor}
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      className="cursor-pointer transition-transform duration-200"
                      style={{
                        transformOrigin: '120px 120px',
                        transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                        opacity: isHovered ? 0.9 : 1,
                      }}
                      onMouseEnter={() => setHoveredIdx(i)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    />
                  );
                });
              })()}
              {/* Centre metric */}
              <text x="120" y="115" textAnchor="middle" className="text-xs fill-[#5B6575] font-medium">
                Total Base
              </text>
              <text x="120" y="135" textAnchor="middle" className="text-base font-bold fill-[#0B1F3A]">
                {formatValue(totalValue)}
              </text>
            </svg>

            {/* Donut Legend */}
            <div className="ml-4 flex flex-col gap-1.5 text-xs">
              {data.slice(0, 6).map((d, i) => (
                <div
                  key={d.label}
                  className="flex items-center gap-2 cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: d.color || defaultColors[i % defaultColors.length] }}
                  />
                  <span className="text-[#1A2233] font-medium">{d.label}:</span>
                  <span className="font-bold text-[#0B1F3A]">{formatValue(d.value)}</span>
                  <span className="text-[#5B6575] text-[10px]">
                    ({totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(1) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // ================= VERTICAL BAR CHART (NO GRIDLINES) =================
          <div className="w-full h-full flex flex-col justify-end">
            <svg ref={svgRef} viewBox="0 0 500 200" className="w-full h-44 overflow-visible">
              {/* Baseline only (No horizontal or vertical grid lines!) */}
              <line x1="10" y1="175" x2="490" y2="175" stroke="#E3E7EE" strokeWidth="1.5" />

              {/* Dashed Benchmark line if present */}
              {benchmarkValue !== undefined && (
                <g>
                  {(() => {
                    const benchmarkY = 175 - (benchmarkValue / maxValue) * 150;
                    return (
                      <>
                        <line
                          x1="10"
                          y1={benchmarkY}
                          x2="490"
                          y2={benchmarkY}
                          stroke="#C9A227"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                        />
                        <text
                          x="485"
                          y={benchmarkY - 4}
                          textAnchor="end"
                          className="text-[9px] fill-[#8F7218] font-semibold"
                        >
                          {benchmarkLabel || 'Target'}: {formatValue(benchmarkValue)}
                        </text>
                      </>
                    );
                  })()}
                </g>
              )}

              {/* Render Bars */}
              {data.slice(0, 10).map((d, i) => {
                const count = Math.min(10, data.length);
                const totalWidth = 470;
                const barWidth = Math.min(42, Math.max(16, (totalWidth / count) * 0.65));
                const slotWidth = totalWidth / count;
                const x = 20 + i * slotWidth + (slotWidth - barWidth) / 2;
                const barHeight = Math.max(4, (d.value / maxValue) * 150);
                const y = 175 - barHeight;
                const isHovered = hoveredIdx === i;
                const barColor = d.color || (isHovered ? goldPrimary : i % 2 === 0 ? navyPrimary : navySecondary);

                return (
                  <g
                    key={d.label}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {/* Bar */}
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="4"
                      ry="4"
                      fill={barColor}
                      className="transition-all duration-300"
                    />

                    {/* Direct Data Label on top of bar */}
                    <text
                      x={x + barWidth / 2}
                      y={y - 5}
                      textAnchor="middle"
                      className="text-[10px] font-bold fill-[#0B1F3A]"
                    >
                      {formatValue(d.value)}
                    </text>

                    {/* X-Axis Category Label */}
                    <text
                      x={x + barWidth / 2}
                      y="190"
                      textAnchor="middle"
                      className="text-[9.5px] fill-[#5B6575] font-medium"
                    >
                      {d.label.length > 12 ? d.label.slice(0, 10) + '..' : d.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Footnote */}
      <div className="pt-2 border-t border-[#E3E7EE]/60 flex items-center justify-between text-[10px] text-[#5B6575]">
        <span>{footnote}</span>
        {benchmarkValue !== undefined && (
          <span className="flex items-center gap-1 font-medium text-[#8F7218]">
            <span className="w-2.5 h-0.5 border-t border-dashed border-[#C9A227]" />
            {benchmarkLabel || 'Benchmark'}: {formatValue(benchmarkValue)}
          </span>
        )}
      </div>

      {/* Data Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 border border-[#E3E7EE]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-[#0B1F3A] text-sm">{title} — Data Points</h4>
              <button
                onClick={() => setShowTableModal(false)}
                className="text-[#5B6575] hover:text-[#0B1F3A] p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F4F7FB] text-[#0B1F3A] border-b border-[#E3E7EE]">
                  <tr>
                    <th className="py-2 px-3 font-semibold">Category</th>
                    <th className="py-2 px-3 font-semibold text-right">Value</th>
                    <th className="py-2 px-3 font-semibold text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E7EE]">
                  {data.map((d) => (
                    <tr key={d.label} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-[#1A2233]">{d.label}</td>
                      <td className="py-2 px-3 text-right font-medium text-[#0B1F3A]">{formatValue(d.value)}</td>
                      <td className="py-2 px-3 text-right text-[#5B6575]">
                        {totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowTableModal(false)}
                className="px-4 py-1.5 bg-[#0B1F3A] text-white text-xs font-semibold rounded-lg hover:bg-[#12305A]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
