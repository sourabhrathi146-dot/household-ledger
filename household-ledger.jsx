import React, { useState, useEffect, useMemo } from "react";
import {
  Zap, ShoppingCart, Droplet, Home, Wifi, Car, UtensilsCrossed,
  HeartPulse, Film, MoreHorizontal, Plus, Trash2, Pencil, ChevronLeft,
  ChevronRight, Wallet, X, Check, Receipt
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid
} from "recharts";

const CATEGORIES = [
  { id: "electricity", label: "Electricity", color: "#C9A227", Icon: Zap },
  { id: "grocery", label: "Grocery", color: "#4F9C87", Icon: ShoppingCart },
  { id: "water", label: "Water", color: "#4A85B0", Icon: Droplet },
  { id: "rent", label: "Rent", color: "#C0604E", Icon: Home },
  { id: "internet", label: "Internet", color: "#9B7FC7", Icon: Wifi },
  { id: "transport", label: "Transport", color: "#D98E4A", Icon: Car },
  { id: "dining", label: "Dining out", color: "#C97D60", Icon: UtensilsCrossed },
  { id: "medical", label: "Medical", color: "#6FB08A", Icon: HeartPulse },
  { id: "entertainment", label: "Entertainment", color: "#B0699C", Icon: Film },
  { id: "other", label: "Other", color: "#7C8A93", Icon: MoreHorizontal },
];

const PINNED_TAGS = ["Dairy", "Fruits & vegetables"];

const catById = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
const inr = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function HouseholdLedger() {
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [cursor, setCursor] = useState(() => monthKey(new Date()));

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [date, setDate] = useState(todayISO());
  const [categoryId, setCategoryId] = useState("grocery");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [tag, setTag] = useState("");

  const [budgetDraft, setBudgetDraft] = useState("");
  const [editingBudget, setEditingBudget] = useState(false);

  const [listFilterTag, setListFilterTag] = useState(null);
  const [trendTag, setTrendTag] = useState("all");
  const [trendRange, setTrendRange] = useState(6);

  useEffect(() => {
    (async () => {
      try {
        const e = await window.storage.get("expenses");
        if (e) setExpenses(JSON.parse(e.value));
      } catch (err) {}
      try {
        const b = await window.storage.get("monthly-budget");
        if (b) setBudget(JSON.parse(b.value));
      } catch (err) {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.storage.set("expenses", JSON.stringify(expenses)).catch(() => {});
  }, [expenses, loaded]);

  useEffect(() => {
    if (!loaded) return;
    window.storage.set("monthly-budget", JSON.stringify(budget)).catch(() => {});
  }, [budget, loaded]);

  const monthExpenses = useMemo(
    () => expenses.filter((e) => monthKey(new Date(e.date)) === cursor).sort((a, b) => b.date.localeCompare(a.date)),
    [expenses, cursor]
  );

  const total = useMemo(() => monthExpenses.reduce((s, e) => s + Number(e.amount), 0), [monthExpenses]);

  const byCategory = useMemo(() => {
    const map = {};
    monthExpenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + Number(e.amount); });
    return CATEGORIES.map((c) => ({ ...c, total: map[c.id] || 0 }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [monthExpenses]);

  const topCategory = byCategory[0];

  const allTags = useMemo(() => {
    const used = new Set(expenses.map((e) => e.tag).filter(Boolean));
    PINNED_TAGS.forEach((t) => used.add(t));
    return [...used].sort((a, b) => {
      const ap = PINNED_TAGS.includes(a), bp = PINNED_TAGS.includes(b);
      if (ap !== bp) return ap ? -1 : 1;
      return a.localeCompare(b);
    });
  }, [expenses]);

  const tagTotalsThisMonth = useMemo(() => {
    const map = {};
    monthExpenses.forEach((e) => { if (e.tag) map[e.tag] = (map[e.tag] || 0) + Number(e.amount); });
    return map;
  }, [monthExpenses]);

  const listExpenses = useMemo(
    () => listFilterTag ? monthExpenses.filter((e) => e.tag === listFilterTag) : monthExpenses,
    [monthExpenses, listFilterTag]
  );

  const daysElapsed = useMemo(() => {
    const [y, m] = cursor.split("-").map(Number);
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === y && now.getMonth() + 1 === m;
    return isCurrentMonth ? now.getDate() : new Date(y, m, 0).getDate();
  }, [cursor]);
  const dailyAvg = total / Math.max(daysElapsed, 1);

  const earliestMonth = useMemo(() => {
    if (expenses.length === 0) return null;
    return expenses.reduce((min, e) => (e.date < min ? e.date : min), expenses[0].date).slice(0, 7);
  }, [expenses]);

  const trendSelection = useMemo(() => {
    if (trendTag === "all") return { type: "all", value: null, label: "All spending", color: "#C9A227" };
    if (trendTag.startsWith("cat:")) {
      const c = catById(trendTag.slice(4));
      return { type: "category", value: c.id, label: c.label, color: c.color };
    }
    if (trendTag.startsWith("tag:")) {
      const t = trendTag.slice(4);
      return { type: "tag", value: t, label: t, color: "#9B7FC7" };
    }
    return { type: "all", value: null, label: "All spending", color: "#C9A227" };
  }, [trendTag]);

  const trend = useMemo(() => {
    const [y, m] = cursor.split("-").map(Number);
    let span = trendRange;
    if (span === "all") {
      if (earliestMonth) {
        const [ey, em] = earliestMonth.split("-").map(Number);
        span = (y - ey) * 12 + (m - em) + 1;
      } else {
        span = 6;
      }
    }
    const out = [];
    for (let i = span - 1; i >= 0; i--) {
      const d = new Date(y, m - 1 - i, 1);
      const key = monthKey(d);
      const inMonth = expenses.filter((e) => {
        if (monthKey(new Date(e.date)) !== key) return false;
        if (trendSelection.type === "all") return true;
        if (trendSelection.type === "category") return e.category === trendSelection.value;
        return e.tag === trendSelection.value;
      });
      const sum = inMonth.reduce((s, e) => s + Number(e.amount), 0);
      out.push({ key, label: d.toLocaleDateString("en-IN", { month: "short", year: span > 12 ? "2-digit" : undefined }), total: sum });
    }
    return out;
  }, [expenses, cursor, trendSelection, trendRange, earliestMonth]);

  const grouped = useMemo(() => {
    const map = {};
    listExpenses.forEach((e) => { (map[e.date] = map[e.date] || []).push(e); });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [listExpenses]);

  function resetForm() {
    setEditingId(null);
    setDate(todayISO());
    setCategoryId("grocery");
    setAmount("");
    setNote("");
    setTag("");
    setFormOpen(false);
  }

  function submitForm(e) {
    e.preventDefault();
    if (amount.trim() === "" || isNaN(Number(amount))) return;
    const amt = Number(amount);
    const cleanTag = tag.trim();
    if (editingId) {
      setExpenses((prev) => prev.map((x) => x.id === editingId ? { ...x, date, category: categoryId, amount: amt, note: note.trim(), tag: cleanTag } : x));
    } else {
      setExpenses((prev) => [...prev, { id: crypto.randomUUID(), date, category: categoryId, amount: amt, note: note.trim(), tag: cleanTag }]);
    }
    resetForm();
  }

  function startEdit(exp) {
    setEditingId(exp.id);
    setDate(exp.date);
    setCategoryId(exp.category);
    setAmount(String(exp.amount));
    setNote(exp.note || "");
    setTag(exp.tag || "");
    setFormOpen(true);
  }

  function deleteExpense(id) {
    setExpenses((prev) => prev.filter((x) => x.id !== id));
    if (editingId === id) resetForm();
  }

  function shiftMonth(delta) {
    const [y, m] = cursor.split("-").map(Number);
    setCursor(monthKey(new Date(y, m - 1 + delta, 1)));
    setListFilterTag(null);
  }

  function saveBudget() {
    const v = Number(budgetDraft);
    setBudget(v > 0 ? v : null);
    setEditingBudget(false);
  }

  const remaining = budget != null ? budget - total : null;
  const pctUsed = budget ? Math.min((total / budget) * 100, 999) : 0;

  return (
    <div style={{
      minHeight: "100vh", background: "#12181B", color: "#EDE6D6",
      fontFamily: "'Inter', sans-serif", padding: "2.5rem 1.5rem 4rem",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .mono { font-family: 'IBM Plex Mono', monospace; }
        .display { font-family: 'Fraunces', serif; }
        .hl-input, .hl-select {
          background: #1B2226; border: 1px solid #333F44; color: #EDE6D6;
          border-radius: 6px; padding: 9px 11px; font-family: 'Inter', sans-serif;
          font-size: 14px; outline: none; width: 100%;
        }
        .hl-input:focus, .hl-select:focus { border-color: #C9A227; }
        .hl-btn {
          background: #C9A227; color: #12181B; border: none; border-radius: 6px;
          padding: 9px 16px; font-weight: 600; font-size: 14px; cursor: pointer;
          display: inline-flex; align-items: center; gap: 6px; font-family: 'Inter', sans-serif;
        }
        .hl-btn:hover { background: #DBB53A; }
        .hl-btn-ghost {
          background: transparent; color: #93998F; border: 1px solid #333F44; border-radius: 6px;
          padding: 9px 16px; font-size: 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
          font-family: 'Inter', sans-serif;
        }
        .hl-btn-ghost:hover { border-color: #93998F; color: #EDE6D6; }
        .icon-btn { background: transparent; border: none; color: #6B716C; cursor: pointer; padding: 4px; border-radius: 4px; display: flex; }
        .icon-btn:hover { color: #EDE6D6; background: #232C31; }
        .stub {
          background: #1B2226; border: 1px dashed #37423F; border-radius: 4px;
          padding: 14px 16px; position: relative;
        }
        .stub::before {
          content: ""; position: absolute; top: -6px; left: 16px; right: 16px; height: 1px;
          background: repeating-linear-gradient(90deg, #46524D 0 6px, transparent 6px 12px);
        }
      `}</style>

      <div style={{ maxWidth: 960, margin: "0 auto" }}>

        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#C9A227", marginBottom: 4 }}>
              <Receipt size={20} />
              <span style={{ fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8E9490" }}>Household ledger</span>
            </div>
            <h1 className="display" style={{ fontSize: 32, fontWeight: 500, margin: 0 }}>Where the money went</h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#1B2226", border: "1px solid #2A3236", borderRadius: 8, padding: "6px 6px" }}>
            <button className="icon-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
            <span className="mono" style={{ fontSize: 14, minWidth: 150, textAlign: "center" }}>{monthLabel(cursor)}</span>
            <button className="icon-btn" onClick={() => shiftMonth(1)} aria-label="Next month"><ChevronRight size={18} /></button>
          </div>
        </header>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 28 }}>
          <div className="stub">
            <div style={{ fontSize: 12, color: "#8E9490", marginBottom: 6 }}>Total spent</div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 500 }}>{inr(total)}</div>
          </div>

          <div className="stub">
            <div style={{ fontSize: 12, color: "#8E9490", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
              <span>Monthly budget</span>
              {budget != null && !editingBudget && (
                <button className="icon-btn" style={{ padding: 0 }} onClick={() => { setBudgetDraft(String(budget)); setEditingBudget(true); }} aria-label="Edit budget">
                  <Pencil size={12} />
                </button>
              )}
            </div>
            {editingBudget ? (
              <div style={{ display: "flex", gap: 6 }}>
                <input className="hl-input mono" style={{ padding: "6px 8px" }} type="number" autoFocus value={budgetDraft}
                  onChange={(e) => setBudgetDraft(e.target.value)} placeholder="e.g. 40000" />
                <button className="icon-btn" onClick={saveBudget} aria-label="Save budget"><Check size={16} /></button>
                <button className="icon-btn" onClick={() => setEditingBudget(false)} aria-label="Cancel"><X size={16} /></button>
              </div>
            ) : budget == null ? (
              <button className="hl-btn-ghost" style={{ padding: "6px 10px", fontSize: 13 }} onClick={() => { setBudgetDraft(""); setEditingBudget(true); }}>
                <Wallet size={14} /> Set a budget
              </button>
            ) : (
              <>
                <div className="mono" style={{ fontSize: 22, fontWeight: 500, color: remaining < 0 ? "#D9776A" : "#EDE6D6" }}>
                  {inr(Math.abs(remaining))}
                </div>
                <div style={{ fontSize: 12, color: remaining < 0 ? "#D9776A" : "#6FB08A", marginTop: 2 }}>
                  {remaining < 0 ? "over budget" : "remaining"}
                </div>
                <div style={{ height: 4, background: "#2A3236", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(pctUsed, 100)}%`, background: pctUsed > 100 ? "#D9776A" : "#C9A227" }} />
                </div>
              </>
            )}
          </div>

          <div className="stub">
            <div style={{ fontSize: 12, color: "#8E9490", marginBottom: 6 }}>Daily average</div>
            <div className="mono" style={{ fontSize: 22, fontWeight: 500 }}>{inr(dailyAvg)}</div>
          </div>

          <div className="stub">
            <div style={{ fontSize: 12, color: "#8E9490", marginBottom: 6 }}>Top category</div>
            {topCategory ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <topCategory.Icon size={16} color={topCategory.color} />
                <span style={{ fontSize: 15 }}>{topCategory.label}</span>
              </div>
            ) : <div style={{ fontSize: 14, color: "#6B716C" }}>No entries yet</div>}
          </div>
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16, marginBottom: 28 }}>
          <div className="stub">
            <div style={{ fontSize: 13, color: "#8E9490", marginBottom: 12 }}>Spend by category</div>
            {byCategory.length === 0 ? (
              <div style={{ fontSize: 13, color: "#6B716C", padding: "20px 0" }}>Add an entry to see the breakdown.</div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(byCategory.length * 34, 60)}>
                <BarChart data={byCategory} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="label" width={100} tick={{ fill: "#93998F", fontSize: 12, fontFamily: "Inter" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(v) => inr(v)}
                    contentStyle={{ background: "#1B2226", border: "1px solid #333F44", borderRadius: 6, fontSize: 12 }}
                    labelStyle={{ color: "#EDE6D6" }}
                    cursor={{ fill: "#232C31" }}
                  />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={16}>
                    {byCategory.map((c) => <Cell key={c.id} fill={c.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="stub">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: trendSelection.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: "#8E9490" }}>Spend over time &middot; <span style={{ color: "#EDE6D6" }}>{trendSelection.label}</span></span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <select className="hl-select" style={{ width: "auto", padding: "5px 8px", fontSize: 12 }} value={trendRange} onChange={(e) => setTrendRange(e.target.value === "all" ? "all" : Number(e.target.value))}>
                  <option value={3}>3 months</option>
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                  <option value={24}>24 months</option>
                  <option value="all">All time</option>
                </select>
                <select className="hl-select" style={{ width: "auto", padding: "5px 8px", fontSize: 12, maxWidth: 160 }} value={trendTag} onChange={(e) => setTrendTag(e.target.value)}>
                  <option value="all">All spending</option>
                  <optgroup label="By category">
                    {CATEGORIES.map((c) => <option key={c.id} value={`cat:${c.id}`}>{c.label}</option>)}
                  </optgroup>
                  {allTags.length > 0 && (
                    <optgroup label="By tag">
                      {allTags.map((t) => <option key={t} value={`tag:${t}`}>{t}</option>)}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trend} margin={{ top: 6, right: 6, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3236" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#93998F", fontSize: 11, fontFamily: "Inter" }} axisLine={false} tickLine={false}
                  interval={trend.length > 12 ? Math.ceil(trend.length / 12) - 1 : 0} />
                <YAxis tick={{ fill: "#93998F", fontSize: 10, fontFamily: "Inter" }} axisLine={false} tickLine={false} width={50}
                  tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} />
                <Tooltip formatter={(v) => inr(v)} contentStyle={{ background: "#1B2226", border: "1px solid #333F44", borderRadius: 6, fontSize: 12 }} labelStyle={{ color: "#EDE6D6" }} />
                <Line type="monotone" dataKey="total" stroke={trendSelection.color} strokeWidth={2} dot={{ r: 3, fill: trendSelection.color }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section style={{ marginBottom: 20 }}>
          {!formOpen ? (
            <button className="hl-btn" onClick={() => setFormOpen(true)}>
              <Plus size={16} /> Add expense
            </button>
          ) : (
            <form onSubmit={submitForm} className="stub" style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#8E9490", display: "block", marginBottom: 4 }}>Date</label>
                  <input className="hl-input" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#8E9490", display: "block", marginBottom: 4 }}>Category</label>
                  <select className="hl-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#8E9490", display: "block", marginBottom: 4 }}>Amount (₹)</label>
                  <input className="hl-input mono" type="number" step="0.01" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                  <div style={{ fontSize: 10.5, color: "#6B716C", marginTop: 3 }}>Use a negative amount for refunds or credits</div>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#8E9490", display: "block", marginBottom: 4 }}>Tag (optional)</label>
                  <input className="hl-input" type="text" list="tag-suggestions" placeholder="e.g. Dairy" value={tag} onChange={(e) => setTag(e.target.value)} />
                  <datalist id="tag-suggestions">
                    {allTags.map((t) => <option key={t} value={t} />)}
                  </datalist>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: 11, color: "#8E9490", display: "block", marginBottom: 4 }}>Note (optional)</label>
                  <input className="hl-input" type="text" placeholder="e.g. BESCOM bill, June" value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" className="hl-btn">{editingId ? "Save changes" : "Add entry"}</button>
                <button type="button" className="hl-btn-ghost" onClick={resetForm}>Cancel</button>
              </div>
            </form>
          )}
        </section>

        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 13, color: "#8E9490" }}>Entries this month</div>
            {allTags.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {allTags.map((t) => {
                  const active = listFilterTag === t;
                  const count = tagTotalsThisMonth[t];
                  return (
                    <button
                      key={t}
                      onClick={() => setListFilterTag(active ? null : t)}
                      style={{
                        fontSize: 12, padding: "4px 10px", borderRadius: 999, cursor: "pointer",
                        border: active ? "1px solid #C9A227" : "1px solid #333F44",
                        background: active ? "rgba(201,162,39,0.15)" : "transparent",
                        color: active ? "#C9A227" : "#93998F",
                      }}
                    >
                      {t}{count ? <span className="mono" style={{ marginLeft: 6, opacity: 0.8 }}>{inr(count)}</span> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {grouped.length === 0 ? (
            <div className="stub" style={{ textAlign: "center", padding: "36px 16px", color: "#6B716C" }}>
              {listFilterTag ? `No "${listFilterTag}" entries for ${monthLabel(cursor)}.` : `Nothing logged for ${monthLabel(cursor)} yet. Add your first entry above.`}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {grouped.map(([d, items]) => (
                <div key={d}>
                  <div className="mono" style={{ fontSize: 12, color: "#6B716C", marginBottom: 6 }}>
                    {new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                  </div>
                  <div style={{ border: "1px solid #2A3236", borderRadius: 6, overflow: "hidden" }}>
                    {items.map((e, i) => {
                      const cat = catById(e.category);
                      return (
                        <div key={e.id} style={{
                          display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                          borderTop: i === 0 ? "none" : "1px solid #2A3236", background: "#161C1F",
                        }}>
                          <cat.Icon size={16} color={cat.color} style={{ flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
                              {cat.label}
                              {e.tag && (
                                <span style={{ fontSize: 10.5, padding: "1px 8px", borderRadius: 999, border: "1px solid #333F44", color: "#93998F" }}>
                                  {e.tag}
                                </span>
                              )}
                            </div>
                            {e.note && <div style={{ fontSize: 12, color: "#6B716C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.note}</div>}
                          </div>
                          <div className="mono" style={{ fontSize: 14, fontWeight: 500 }}>{inr(e.amount)}</div>
                          <button className="icon-btn" onClick={() => startEdit(e)} aria-label="Edit entry"><Pencil size={14} /></button>
                          <button className="icon-btn" onClick={() => deleteExpense(e.id)} aria-label="Delete entry"><Trash2 size={14} /></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
