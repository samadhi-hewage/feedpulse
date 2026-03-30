'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const SENTIMENT_COLORS: Record<string, string> = {
  Positive: 'bg-green-100 text-green-700',
  Neutral: 'bg-yellow-100 text-yellow-700',
  Negative: 'bg-red-100 text-red-700',
};

const STATUS_OPTIONS = ['New', 'In Review', 'Resolved'];
const CATEGORY_OPTIONS = ['', 'Bug', 'Feature Request', 'Improvement', 'Other'];

export default function DashboardPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [filters, setFilters] = useState({ category: '', status: '', sort: 'date', search: '' });
  const [stats, setStats] = useState({ total: 0, open: 0, avgPriority: 0, topTag: '' });
  const [loading, setLoading] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchFeedback = useCallback(async (page = 1) => {
    if (!token) return router.push('/login');
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: '10',
      ...(filters.category && { category: filters.category }),
      ...(filters.status && { status: filters.status }),
      ...(filters.sort && { sort: filters.sort }),
      ...(filters.search && { search: filters.search }),
    });
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/feedback?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.status === 401) return router.push('/login');
    const data = await res.json();
    setItems(data.data || []);
    setPagination(data.pagination || { total: 0, page: 1, pages: 1 });

    // Compute stats
    const all = data.data || [];
    const open = all.filter((i: any) => i.status !== 'Resolved').length;
    const avgPriority = all.filter((i: any) => i.ai_priority)
      .reduce((acc: number, i: any) => acc + i.ai_priority, 0) / (all.filter((i: any) => i.ai_priority).length || 1);
    const tagCount: Record<string, number> = {};
    all.forEach((i: any) => i.ai_tags?.forEach((t: string) => { tagCount[t] = (tagCount[t] || 0) + 1; }));
    const topTag = Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    setStats({ total: data.pagination?.total || 0, open, avgPriority: Math.round(avgPriority * 10) / 10, topTag });
    setLoading(false);
  }, [token, filters, router]);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

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
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">FeedPulse Dashboard</h1>
          <button
            onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Logout
          </button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Feedback', value: stats.total },
            { label: 'Open Items', value: stats.open },
            { label: 'Avg Priority', value: stats.avgPriority },
            { label: 'Top Tag', value: stats.topTag },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl shadow-sm p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3 text-black ">
          <input
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
            placeholder="Search by keyword..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
          />
          <select className="border rounded-lg px-3 py-2 text-sm"
            value={filters.category}
            onChange={e => setFilters({ ...filters, category: e.target.value })}>
            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c || 'All Categories'}</option>)}
          </select>
          <select className="border rounded-lg px-3 py-2 text-sm"
            value={filters.status}
            onChange={e => setFilters({ ...filters, status: e.target.value })}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="border rounded-lg px-3 py-2 text-sm"
            value={filters.sort}
            onChange={e => setFilters({ ...filters, sort: e.target.value })}>
            <option value="date">Sort: Date</option>
            <option value="priority">Sort: Priority</option>
            <option value="sentiment">Sort: Sentiment</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Title', 'Category', 'Sentiment', 'Priority', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-600">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-600">No feedback found</td></tr>
              ) : items.map(item => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{item.title}</td>
                  <td className="px-4 py-3 text-gray-600">{item.category}</td>
                  <td className="px-4 py-3">
                    {item.ai_sentiment ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SENTIMENT_COLORS[item.ai_sentiment] || 'bg-gray-100'}`}>
                        {item.ai_sentiment}
                      </span>
                    ) : <span className="text-gray-600 text-xs">Pending</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {item.ai_priority ? (
                      <span className={`font-bold  ${item.ai_priority >= 7 ? 'text-red-500' : item.ai_priority >= 4 ? 'text-yellow-500' : 'text-green-500'}`}>
                        {item.ai_priority}/10
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <select
                      className="border rounded px-2 py-1 text-xs"
                      value={item.status}
                      onChange={e => updateStatus(item._id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteFeedback(item._id)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center gap-2 p-4">
              {Array.from({ length: pagination.pages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => fetchFeedback(i + 1)}
                  className={`w-8 h-8 rounded text-sm ${pagination.page === i + 1 ? 'bg-blue-600 text-white' : 'border text-gray-600'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
