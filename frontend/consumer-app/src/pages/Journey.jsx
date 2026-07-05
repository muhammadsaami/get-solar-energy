import React from 'react';
import JourneyTimeline from '../components/navigation/JourneyTimeline';

export default function Journey() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
          My Solar Journey
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0 }}>
          Trace your installation pipeline from the initial rooftop estimate to active grid monitoring.
        </p>
      </div>

      <JourneyTimeline />
    </div>
  );
}
