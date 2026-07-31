import React from 'react'

export default function TrainingHero({ kpis, continueLearning }) {
  const streak = kpis?.currentStreak || 0
  const completion = kpis?.overallProgress || 0
  const nextTarget = 'Solar PV Installation Professional'

  return (
    <section className="hero-card" style={{ marginBottom: 20 }}>
      <div className="hero-bg-overlay" />
      <div className="hero-left">
        <div className="hero-meta-badges">
          <div className="hero-meta-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            <span>{streak}-day learning streak</span>
          </div>
          <div className="hero-meta-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            <span>{completion}% overall progress</span>
          </div>
          <div className="hero-meta-badge" style={{ borderColor: 'rgba(23, 168, 229, 0.25)', color: 'var(--accent-blue)' }}>
            <span className="grid-status-dot" style={{ background: 'var(--accent-blue)' }} />
            <span>Next: {nextTarget}</span>
          </div>
        </div>

        <h2 className="hero-title">Welcome to Training Academy</h2>
        <p className="hero-desc">
          Build your expertise with structured courses, earn certifications, and climb the leaderboard.
        </p>

        <div className="hero-actions">
          <button className="hero-btn-primary">
            <span>Continue Learning</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="5 12 19 12" /><polyline points="12 5 19 12 12 19" /></svg>
          </button>
          <button className="hero-btn-secondary">
            <span>Browse Courses</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
          </button>
        </div>
      </div>

      <div className="hero-right">
        <div className="live-summary-panel" style={{ maxWidth: 300 }}>
          <div className="summary-header">
            <span className="summary-title">Learning Overview</span>
            <span className="summary-badge" style={{ animation: 'none' }}>{kpis?.coursesEnrolled || 0} enrolled</span>
          </div>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Streak</span>
              <span className="summary-value" style={{ color: 'var(--accent-orange)' }}>{streak} days</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Progress</span>
              <span className="summary-value" style={{ color: 'var(--accent-green)' }}>{completion}%</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Hours Logged</span>
              <span className="summary-value">{kpis?.learningHours || 0}h</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Completed</span>
              <span className="summary-value" style={{ color: 'var(--accent-green)' }}>{kpis?.coursesCompleted || 0} courses</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
