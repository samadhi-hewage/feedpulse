'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import './dashboard.css';

const SENTIMENT_CONFIG: Record<string, { dot: string; bg: string; text: string }> = {
  Positive: { dot: '#22c55e', bg: 'rgba(34,197,94,0.12)',  text: '#4ade80' },
  Neutral:  { dot: '#f59e0b', bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' },
  Negative: { dot: '#ef4444', bg: 'rgba(239,68,68,0.12)',  text: '#f87171' },
};

const STATUS_OPTIONS   = ['New', 'In Review', 'Resolved'];
const CATEGORY_OPTIONS = ['', 'Bug', 'Feature Request', 'Improvement', 'Other'];

const STAT_CARDS = [
  { key: 'total',       label: 'Total Feedback', icon: '◈', accent: '#6366f1' },
  { key: 'open',        label: 'Open Items',     icon: '◉', accent: '#f59e0b' },
  { key: 'avgPriority', label: 'Avg Priority',   icon: '▲', accent: '#ef4444' },
  { key: 'topTag',      label: 'Top Tag',         icon: '◆', accent: '#22d3ee' },
] as const;

function PriorityBar({ value }: { value: number }) {
  const color = value >= 7 ? '#f87171' : value >= 4 ? '#fbbf24' : '#34d399';
  return (
    <div className="dp-priority-wrap">
      <div className="dp-priority-track">
        <div className="dp-priority-fill" style={{ width: `${(value / 10) * 100}%`, background: color }} />
      </div>
      <span className="dp-priority-label" style={{ color }}>{value}/10</span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [items, setItems]           = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [filters, setFilters]       = useState({ category: '', status: '', sort: 'date', search: '' });
  const [stats, setStats]           = useState<Record<string, any>>({ total: 0, open: 0, avgPriority: 0, topTag: '—' });
  const [loading, setLoading]       = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchFeedback = useCallback(async (page = 1) => {
    if (!token) return router.push('/login');
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page), limit: '10',
      ...(filters.category && { category: filters.category }),
      ...(filters.status   && { status:   filters.status   }),
      ...(filters.sort     && { sort:     filters.sort     }),
      ...(filters.search   && { search:   filters.search   }),
    });
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/feedback?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.status === 401) return router.push('/login');
    const data = await res.json();
    setItems(data.data || []);
    setPagination(data.pagination || { total: 0, page: 1, pages: 1 });

    const all    = data.data || [];
    const open   = all.filter((i: any) => i.status !== 'Resolved').length;
    const pItems = all.filter((i: any) => i.ai_priority);
    const avgPriority = pItems.reduce((a: number, i: any) => a + i.ai_priority, 0) / (pItems.length || 1);
    const tagCount: Record<string, number> = {};
    all.forEach((i: any) => i.ai_tags?.forEach((t: string) => { tagCount[t] = (tagCount[t] || 0) + 1; }));
    const topTag = Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    setStats({ total: data.pagination?.total || 0, open, avgPriority: Math.round(avgPriority * 10) / 10, topTag });
    setLoading(false);
  }, [token, filters, router]);

  useEffect(() => {
    fetchFeedback();
    const interval = setInterval(() => fetchFeedback(), 10000);
    return () => clearInterval(interval);
  }, [fetchFeedback]);

  async function updateStatus(id: string, status: string) {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedback/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    fetchFeedback();
  }

  async function deleteFeedback(id: string) {
    if (!confirm('Delete this feedback?')) return;
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedback/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchFeedback();
  }

  return (
    <div className="dp-root">
      {/* Header */}
      <header className="dp-header">
        <div className="dp-wordmark">Feed<span>Pulse</span></div>
        <button className="dp-logout"
          onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}>
          Sign out
        </button>
      </header>

      <div className="dp-body">
        {/* Stats */}
        <p className="dp-section-label">Overview</p>
        <div className="dp-stats">
          {STAT_CARDS.map(s => (
            <div key={s.key} className="dp-stat-card" style={{ '--accent': s.accent } as React.CSSProperties}>
              <span className="dp-stat-icon">{s.icon}</span>
              <div className="dp-stat-value">{stats[s.key]}</div>
              <div className="dp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <p className="dp-section-label">Feedback</p>
        <div className="dp-filters">
          <div className="dp-search-wrap">
            <span className="dp-search-icon">⌕</span>
            <input className="dp-input" placeholder="Search feedback..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })} />
          </div>
          <div className="dp-filter-divider" />
          <select className="dp-select" value={filters.category}
            onChange={e => setFilters({ ...filters, category: e.target.value })}>
            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
          </select>
          <select className="dp-select" value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <div className="dp-filter-divider" />
          <select className="dp-select" value={filters.sort}
            onChange={e => setFilters({ ...filters, sort: e.target.value })}>
            <option value="date">Date</option>
            <option value="priority">Priority</option>
            <option value="sentiment">Sentiment</option>
          </select>
        </div>

        {/* Table */}
        <div className="dp-table-wrap">
          <table className="dp-table">
            <thead>
              <tr>
                {['Title', 'Category', 'Sentiment', 'Priority', 'Status', 'Date', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {[200, 90, 80, 110, 90, 70, 55].map((w, j) => (
                      <td key={j} style={{ padding: '15px 20px' }}>
                        <div className="dp-skeleton" style={{ width: `${w}px` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="dp-empty">
                    <div className="dp-empty-icon">◈</div>
                    No feedback found
                  </div>
                </td></tr>
              ) : items.map(item => {
                const sent = item.ai_sentiment ? SENTIMENT_CONFIG[item.ai_sentiment] : null;
                return (
                  <tr key={item._id}>
                    <td><div className="dp-title">{item.title}</div></td>
                    <td><span className="dp-category">{item.category}</span></td>
                    <td>
                      {sent ? (
                        <span className="dp-sentiment"
                          style={{ '--sbg': sent.bg, '--sdot': sent.dot, '--stxt': sent.text } as React.CSSProperties}>
                          {item.ai_sentiment}
                        </span>
                      ) : <span className="dp-pending">Pending</span>}
                    </td>
                    <td>
                      {item.ai_priority
                        ? <PriorityBar value={item.ai_priority} />
                        : <span className="dp-pending">—</span>}
                    </td>
                    <td>
                      <select className="dp-status-select" value={item.status}
                        onChange={e => updateStatus(item._id, e.target.value)}>
                        {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <span className="dp-date">
                        {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </span>
                    </td>
                    <td>
                      <button className="dp-delete" onClick={() => deleteFeedback(item._id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {pagination.pages > 1 && (
            <div className="dp-pagination">
              {Array.from({ length: pagination.pages }, (_, i) => (
                <button key={i}
                  className={`dp-page-btn ${pagination.page === i + 1 ? 'active' : 'inactive'}`}
                  onClick={() => fetchFeedback(i + 1)}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}