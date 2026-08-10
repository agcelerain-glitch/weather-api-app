'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// OpenWeather アイコンコード（先頭2文字）→ Font Awesome マッピング
const WEATHER_STYLE = {
  '01': { icon: 'fa-sun',                color: '#fbbf24' },
  '02': { icon: 'fa-cloud-sun',          color: '#94a3b8' },
  '03': { icon: 'fa-cloud',              color: '#94a3b8' },
  '04': { icon: 'fa-cloud',             color: '#64748b' },
  '09': { icon: 'fa-cloud-showers-heavy', color: '#60a5fa' },
  '10': { icon: 'fa-cloud-rain',         color: '#60a5fa' },
  '11': { icon: 'fa-cloud-bolt',         color: '#a78bfa' },
  '13': { icon: 'fa-snowflake',          color: '#bae6fd' },
  '50': { icon: 'fa-smog',              color: '#cbd5e1' },
};

function getStyle(iconCode) {
  return WEATHER_STYLE[iconCode?.slice(0, 2)] ?? { icon: 'fa-cloud', color: '#94a3b8' };
}

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

function parseDate(unixTs) {
  const d = new Date(unixTs * 1000);
  return {
    shortDay: DAY_NAMES[d.getDay()],
    shortDate: `${d.getMonth() + 1}/${d.getDate()}`,
    fullDate: d.toLocaleDateString('ja-JP', {
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    }),
  };
}

// ─────────────────────────────────────────────
// メインページ
// ─────────────────────────────────────────────
export default function Home() {
  const [query, setQuery]               = useState('');
  const [suggestions, setSuggestions]   = useState([]);
  const [showSugg, setShowSugg]         = useState(false);
  const [city, setCity]                 = useState(null);
  const [weather, setWeather]           = useState(null);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [activeWeek, setActiveWeek]     = useState(0); // 0=今週, 1=来週
  const [selectedDay, setSelectedDay]   = useState(0);
  const debounceRef = useRef(null);
  const wrapperRef  = useRef(null);

  // サジェスト外クリックで閉じる
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSugg(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback(async (q) => {
    if (!q.trim() || q.length < 2) { setSuggestions([]); return; }
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    setShowSugg(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 400);
  };

  const selectCity = async (selected) => {
    setCity(selected);
    setQuery(selected.displayName);
    setSuggestions([]);
    setShowSugg(false);
    setLoading(true);
    setError(null);
    setWeather(null);
    setActiveWeek(0);
    setSelectedDay(0);

    try {
      const res = await fetch(`/api/weather?lat=${selected.lat}&lon=${selected.lon}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setWeather(data);
    } catch (e) {
      setError(e.message || '天気データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const weekDays      = weather ? weather.slice(activeWeek * 7, activeWeek * 7 + 7) : [];
  const detailDay     = weather ? weather[activeWeek * 7 + selectedDay] : null;
  const todayData     = weather?.[0];

  return (
    <main className="min-h-screen text-white px-4 pt-12 pb-10 max-w-sm mx-auto">

      {/* ── 検索バー ── */}
      <div ref={wrapperRef} className="relative mb-10 z-20">
        <div className="glass flex items-center rounded-2xl px-4 py-3.5 gap-3">
          <i className="fa-solid fa-magnifying-glass text-slate-600 text-sm" />
          <input
            type="text"
            value={query}
            onChange={handleInput}
            onFocus={() => suggestions.length > 0 && setShowSugg(true)}
            placeholder="都市名を入力..."
            className="flex-1 bg-transparent outline-none text-white placeholder-slate-600 text-sm tracking-wide"
          />
          {loading && <i className="fa-solid fa-spinner fa-spin text-sky-400 text-sm" />}
        </div>

        {/* サジェストドロップダウン */}
        {showSugg && suggestions.length > 0 && (
          <div className="glass absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden shadow-2xl">
            {suggestions.map((c, i) => (
              <button
                key={i}
                onClick={() => selectCity(c)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/[0.05] last:border-0"
              >
                <i className="fa-solid fa-location-dot text-sky-400 text-xs w-3 shrink-0" />
                <div>
                  <div className="text-sm font-medium">{c.displayName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {[c.state, c.country].filter(Boolean).join(', ')}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── エラー ── */}
      {error && (
        <div className="glass rounded-2xl px-4 py-3 mb-6 border !border-red-500/20">
          <p className="text-red-400 text-sm text-center">
            <i className="fa-solid fa-circle-exclamation mr-2" />
            {error}
          </p>
        </div>
      )}

      {/* ── 空状態 ── */}
      {!weather && !loading && !error && (
        <div className="flex flex-col items-center mt-20 gap-3">
          <i className="fa-solid fa-cloud-sun text-6xl text-slate-800" />
          <p className="text-slate-600 text-sm">都市名を入力して天気を確認</p>
        </div>
      )}

      {/* ── 天気コンテンツ ── */}
      {weather && !loading && todayData && (
        <>
          {/* ヒーロー：今日の天気 */}
          <section className="text-center mb-10">
            <p className="text-slate-500 text-xs tracking-[0.2em] uppercase mb-5">
              {city?.displayName}
            </p>
            <div className="flex items-center justify-center gap-5 mb-3">
              <i
                className={`fa-solid ${getStyle(todayData.icon).icon} text-6xl`}
                style={{ color: getStyle(todayData.icon).color }}
              />
              <div className="text-left">
                <div className="text-7xl font-extralight leading-none tabular-nums">
                  {Math.round(todayData.temp.max)}°
                </div>
                <div className="text-slate-600 text-xs mt-1 tabular-nums">
                  {Math.round(todayData.temp.min)}° / {Math.round(todayData.temp.max)}°
                </div>
              </div>
            </div>
            <p className="text-slate-400 text-sm capitalize">{todayData.description}</p>
            <div className="flex items-center justify-center gap-6 mt-3">
              <span className="text-xs text-slate-600">
                <i className="fa-solid fa-droplet mr-1.5" style={{ color: '#60a5fa' }} />
                {todayData.humidity}%
              </span>
              <span className="text-xs text-slate-600">
                <i className="fa-solid fa-umbrella mr-1.5" style={{ color: '#818cf8' }} />
                {Math.round(todayData.pop * 100)}%
              </span>
            </div>
          </section>

          {/* 週切り替えタブ */}
          <div className="flex gap-2 mb-3">
            {['今週', '来週'].map((label, i) => (
              <button
                key={i}
                onClick={() => { setActiveWeek(i); setSelectedDay(0); }}
                className={`flex-1 py-2 rounded-xl text-xs font-medium tracking-wider transition-all duration-200 ${
                  activeWeek === i
                    ? 'bg-sky-500/10 text-sky-300 border border-sky-500/25'
                    : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 週間ストリップ */}
          <div className="glass rounded-2xl p-3 mb-3">
            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day, i) => {
                const { shortDay } = parseDate(day.dt);
                const ws          = getStyle(day.icon);
                const isSelected  = selectedDay === i;
                const isToday     = activeWeek === 0 && i === 0;

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(i)}
                    className={`flex flex-col items-center gap-1.5 py-2.5 px-0.5 rounded-xl transition-all duration-150 ${
                      isSelected
                        ? 'bg-sky-500/12 border border-sky-500/20'
                        : 'hover:bg-white/5 active:bg-white/10'
                    }`}
                  >
                    <span className={`text-[10px] font-medium ${
                      isSelected ? 'text-sky-300' : isToday ? 'text-sky-500' : 'text-slate-500'
                    }`}>
                      {isToday ? '今日' : shortDay}
                    </span>
                    <i
                      className={`fa-solid ${ws.icon} text-xs`}
                      style={{ color: ws.color }}
                    />
                    <span className={`text-xs font-medium tabular-nums ${
                      isSelected ? 'text-white' : 'text-slate-300'
                    }`}>
                      {Math.round(day.temp.max)}°
                    </span>
                    <span className="text-[10px] text-slate-600 tabular-nums">
                      {Math.round(day.temp.min)}°
                    </span>
                    {day.pop > 0.1 && (
                      <span className="text-[9px] tabular-nums" style={{ color: '#818cf8' }}>
                        {Math.round(day.pop * 100)}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 日別詳細パネル */}
          {detailDay && (
            <div className="glass rounded-2xl p-5">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-slate-500 text-xs">
                    {activeWeek === 0 && selectedDay === 0
                      ? '今日'
                      : parseDate(detailDay.dt).fullDate}
                  </p>
                  <p className="text-white text-base font-light mt-1 capitalize">
                    {detailDay.description}
                  </p>
                </div>
                <i
                  className={`fa-solid ${getStyle(detailDay.icon).icon} text-3xl`}
                  style={{ color: getStyle(detailDay.icon).color }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <StatCard
                  icon="fa-temperature-high"
                  label="最高気温"
                  value={`${Math.round(detailDay.temp.max)}°C`}
                  color="#fb923c"
                />
                <StatCard
                  icon="fa-temperature-low"
                  label="最低気温"
                  value={`${Math.round(detailDay.temp.min)}°C`}
                  color="#38bdf8"
                />
                <StatCard
                  icon="fa-droplet"
                  label="湿度"
                  value={`${detailDay.humidity}%`}
                  color="#60a5fa"
                />
                <StatCard
                  icon="fa-umbrella"
                  label="降水確率"
                  value={`${Math.round(detailDay.pop * 100)}%`}
                  color="#a78bfa"
                />
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}

// ─────────────────────────────────────────────
// 統計カードコンポーネント
// ─────────────────────────────────────────────
function StatCard({ icon, label, value, color }) {
  return (
    <div className="glass-sm rounded-xl p-3.5">
      <div className="flex items-center gap-1.5 mb-2">
        <i className={`fa-solid ${icon} text-xs`} style={{ color }} />
        <span className="text-[11px] text-slate-500">{label}</span>
      </div>
      <div className="text-xl font-light tabular-nums" style={{ color }}>
        {value}
      </div>
    </div>
  );
}
