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
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    avgPriority: 0,
    topTag: '—',
  });

  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const [filters, setFilters] = useState({
    category: '',
    status: '',
    sort: 'date',
    search: '',
  });

  const fetchFeedback = useCallback(async () => {
    if (!token) return router.push('/login');

    setLoading(true);

    const params = new URLSearchParams({
      ...(filters.category && { category: filters.category }),
      ...(filters.status && { status: filters.status }),
      ...(filters.sort && { sort: filters.sort }),
      ...(filters.search && { search: filters.search }),
    });

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/feedback?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 401) return router.push('/login');

      const data = await res.json();

      setItems(data.data || []);

      // simple stats calculation
      const total = data.data?.length || 0;
      const open = data.data?.filter((i: any) => i.status === 'New').length || 0;
      const avgPriority =
        total > 0
          ? Math.round(
              data.data.reduce((sum: number, i: any) => sum + (i.ai_priority || 0), 0) /
                total
            )
          : 0;

      const tagCount: Record<string, number> = {};
      data.data?.forEach((i: any) => {
        if (i.category) {
          tagCount[i.category] = (tagCount[i.category] || 0) + 1;
        }
      });

      const topTag =
        Object.keys(tagCount).length > 0
          ? Object.keys(tagCount).reduce((a, b) =>
              tagCount[a] > tagCount[b] ? a : b
            )
          : '—';

      setStats({ total, open, avgPriority, topTag });
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  }, [token, router, filters]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            FeedPulse Dashboard
          </h1>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              router.push('/login');
            }}
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
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl shadow-sm p-4 text-center"
            >
              <p className="text-2xl font-bold text-blue-600">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-3">
          <input
            className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
            placeholder="Search by keyword..."
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value })
            }
          />

          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
          >
            <option value="">All Categories</option>
            {['Bug', 'Feature Request', 'Improvement', 'Other'].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={filters.status}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value })
            }
          >
            <option value="">All Statuses</option>
            {['New', 'In Review', 'Resolved'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <select
            className="border rounded-lg px-3 py-2 text-sm"
            value={filters.sort}
            onChange={(e) =>
              setFilters({ ...filters, sort: e.target.value })
            }
          >
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
                {[
                  'Title',
                  'Category',
                  'Sentiment',
                  'Priority',
                  'Status',
                  'Date',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">
                    No feedback found
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px] truncate">
                      {item.title}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.category}
                    </td>

                    <td className="px-4 py-3">
                      {item.ai_sentiment ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            SENTIMENT_COLORS[item.ai_sentiment] ||
                            'bg-gray-100'
                          }`}
                        >
                          {item.ai_sentiment}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {item.ai_priority ? (
                        <span
                          className={`font-bold ${
                            item.ai_priority >= 7
                              ? 'text-red-500'
                              : item.ai_priority >= 4
                              ? 'text-yellow-500'
                              : 'text-green-500'
                          }`}
                        >
                          {item.ai_priority}/10
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {item.status}
                    </td>

                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
}