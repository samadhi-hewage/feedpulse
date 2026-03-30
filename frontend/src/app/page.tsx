'use client';
import { useState } from 'react';

const CATEGORIES = ['Bug', 'Feature Request', 'Improvement', 'Other'];

export default function SubmitPage() {
  const [form, setForm] = useState({
    title: '', description: '', category: 'Bug',
    submitterName: '', submitterEmail: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (form.description.length < 20) e.description = 'Description must be at least 20 characters';
    if (form.submitterEmail && !/^\S+@\S+\.\S+$/.test(form.submitterEmail))
      e.submitterEmail = 'Invalid email';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setErrors({});
    setStatus('loading');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Submission failed');
      setStatus('success');
      setForm({ title: '', description: '', category: 'Bug', submitterName: '', submitterEmail: '' });
    } catch {
      setStatus('error');
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Share Your Feedback</h1>
        <p className="text-gray-500 mb-6 text-sm">Help us build better products.</p>

       {status === 'success' && (
  <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex justify-between items-center">
    <span>✅ Feedback submitted! Thank you.</span>
    <button
      onClick={() => setStatus('idle')}
      className="text-green-700 font-bold px-2 py-0.5 hover:bg-green-100 rounded"
    >
      ✕
    </button>
  </div>
)}
{status === 'error' && (
  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex justify-between items-center">
    <span>❌ Something went wrong. Please try again.</span>
    <button
      onClick={() => setStatus('idle')}
      className="text-red-700 font-bold px-2 py-0.5 hover:bg-red-100 rounded"
    >
      ✕
    </button>
  </div>
)}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Brief summary of your feedback"
              maxLength={120}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *{' '}
              <span className="text-gray-400">({form.description.length} chars)</span>
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your feedback in detail (min 20 characters)"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name (optional)</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black"
                value={form.submitterName}
                onChange={e => setForm({ ...form, submitterName: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
              <input
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-black"
                value={form.submitterEmail}
                onChange={e => setForm({ ...form, submitterEmail: e.target.value })}
                placeholder="you@example.com"
              />
              {errors.submitterEmail && <p className="text-red-500 text-xs mt-1">{errors.submitterEmail}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {status === 'loading' ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </main>
  );
}