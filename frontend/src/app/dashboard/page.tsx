'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const SENTIMENT_COLORS: Record<string, string> = {
  Positive: 'bg-green-100 text-green-700',
  Neutral: 'bg-yellow-100 text-yellow-700',
  Negative: 'bg-red-100 text-red-700',
};

export default function DashboardPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, open: 0, avgPriority: 0, topTag: '—' });
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchFeedback = useCallback(async () => {
    if (!token) return router.push('/login');
    setLoading(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedback`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) return router.push('/login');
    const data = await res.json();
    const all = data.data || [];
    setItems(all);

    // Compute stats
    const open = all.filter((i: any) => i.status !== 'Resolved').length;
    const withPriority = all.filter((i: any) => i.ai_priority);
    const avgPriority = withPriority.length
      ? Math.round(withPriority.reduce((acc: number, i: any) => acc + i.ai_priority, 0) / withPriority.length * 10) / 10
      : 0;
    const tagCount: Record<string, number> = {};
    all.forEach((i: any) => i.ai_tags?.forEach((t: string) => { tagCount[t] = (tagCount[t] || 0) + 1; }));
    const topTag = Object.entries(tagCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    setStats({ total: data.pagination?.total || all.length, open, avgPriority, topTag });
    setLoading(false);
  }, [token, router]);

  useEffect(() => { fetchFeedback(); }, [fetchFeedback]);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">FeedPulse Dashboard</h1>
          <button
            onClick={() => { localStorage.removeItem('token'); router.push('/login'); }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >Logout</button>
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

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Title', 'Category', 'Sentiment', 'Priority', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No feedback found</td></tr>
              ) : items.map(item => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">{item.title}</td>
                  <td className="px-4 py-3 text-gray-600">{item.category}</td>
                  <td className="px-4 py-3">
                    {item.ai_sentiment ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SENTIMENT_COLORS[item.ai_sentiment] || 'bg-gray-100'}`}>
                        {item.ai_sentiment}
                      </span>
                    ) : <span className="text-gray-300 text-xs">Pending</span>}
                  </td>
                  <td className="px-4 py-3">
                    {item.ai_priority ? (
                      <span className={`font-bold ${item.ai_priority >= 7 ? 'text-red-500' : item.ai_priority >= 4 ? 'text-yellow-500' : 'text-green-500'}`}>
                        {item.ai_priority}/10
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.status}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}