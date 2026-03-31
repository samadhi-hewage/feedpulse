'use client';
import { useState } from 'react';
import './submitpage.css';

const CATEGORIES = ['Bug', 'Feature Request', 'Improvement', 'Other'];

export default function SubmitPage() {
  const [form, setForm] = useState({
    title: '', description: '', category: 'Bug',
    submitterName: '', submitterEmail: '',
  });
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [status, setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  function validate() {
    const e: Record<string, string> = {};
    if (!form.title.trim())
      e.title = 'Title is required';
    if (form.description.length < 20)
      e.description = 'Description must be at least 20 characters';
    if (form.submitterEmail && !/^\S+@\S+\.\S+$/.test(form.submitterEmail))
      e.submitterEmail = 'Invalid email address';
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
    <main className="sp-root">
      <div className="sp-grid" aria-hidden="true" />

      <div className="sp-card">
        {/* Brand */}
        <div className="sp-wordmark">Feed<span>Pulse</span></div>

        {/* Heading */}
        <h1 className="sp-heading">Share Your Feedback</h1>
        <p className="sp-sub">Help us build better products.</p>

        {/* Banners */}
        {status === 'success' && (
          <div className="sp-banner success" role="status">
            <span>✓ Feedback submitted — thank you!</span>
            <button className="sp-banner-close" onClick={() => setStatus('idle')} aria-label="Dismiss">✕</button>
          </div>
        )}
        {status === 'error' && (
          <div className="sp-banner error" role="alert">
            <span>Something went wrong. Please try again.</span>
            <button className="sp-banner-close" onClick={() => setStatus('idle')} aria-label="Dismiss">✕</button>
          </div>
        )}

        <form className="sp-form" onSubmit={handleSubmit} noValidate>

          {/* Title */}
          <div className="sp-field">
            <label className="sp-label" htmlFor="title">Title <span style={{ color: '#818cf8' }}>*</span></label>
            <input
              id="title"
              className="sp-input"
              placeholder="Brief summary of your feedback"
              maxLength={120}
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
            {errors.title && <span className="sp-field-error">{errors.title}</span>}
          </div>

          {/* Description */}
          <div className="sp-field">
            <label className="sp-label" htmlFor="description">
              Description <span style={{ color: '#818cf8' }}>*</span>
              <span className="sp-char-count">({form.description.length} chars)</span>
            </label>
            <textarea
              id="description"
              className="sp-textarea"
              rows={4}
              placeholder="Describe your feedback in detail (min 20 characters)"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
            {errors.description && <span className="sp-field-error">{errors.description}</span>}
          </div>

          {/* Category */}
          <div className="sp-field">
            <label className="sp-label" htmlFor="category">Category <span style={{ color: '#818cf8' }}>*</span></label>
            <select
              id="category"
              className="sp-select"
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Name + Email */}
          <div className="sp-grid-2">
            <div className="sp-field">
              <label className="sp-label" htmlFor="name">Name <span style={{ color: 'rgba(255,255,255,0.2)', textTransform: 'none', letterSpacing: 0, fontSize: '11px' }}>(optional)</span></label>
              <input
                id="name"
                className="sp-input"
                placeholder="Your name"
                value={form.submitterName}
                onChange={e => setForm({ ...form, submitterName: e.target.value })}
              />
            </div>
            <div className="sp-field">
              <label className="sp-label" htmlFor="email">Email <span style={{ color: 'rgba(255,255,255,0.2)', textTransform: 'none', letterSpacing: 0, fontSize: '11px' }}>(optional)</span></label>
              <input
                id="email"
                className="sp-input"
                type="email"
                placeholder="you@example.com"
                value={form.submitterEmail}
                onChange={e => setForm({ ...form, submitterEmail: e.target.value })}
              />
              {errors.submitterEmail && <span className="sp-field-error">{errors.submitterEmail}</span>}
            </div>
          </div>

          {/* Submit */}
          <button type="submit" className="sp-btn" disabled={status === 'loading'}>
            {status === 'loading' && <span className="sp-spinner" aria-hidden="true" />}
            {status === 'loading' ? 'Submitting…' : 'Submit Feedback'}
          </button>
        </form>

        <p className="sp-footer">FeedPulse · Powered by AI</p>
      </div>
    </main>
  );
}