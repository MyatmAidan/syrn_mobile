import React from 'react';

interface Sparkle {
  id: number;
  type: 'dot' | 'star' | 'heart';
  left: string;
  top: string;
  dur: string;
  delay: string;
}

const SPARKLES: Sparkle[] = [
  { id: 1, type: 'heart', left: '12%', top: '18%', dur: '4.5s', delay: '0s' },
  { id: 2, type: 'dot', left: '78%', top: '12%', dur: '5.2s', delay: '0.8s' },
  { id: 3, type: 'star', left: '88%', top: '42%', dur: '4s', delay: '1.2s' },
  { id: 4, type: 'dot', left: '6%', top: '55%', dur: '5.8s', delay: '0.4s' },
  { id: 5, type: 'heart', left: '65%', top: '72%', dur: '4.2s', delay: '1.6s' },
  { id: 6, type: 'star', left: '28%', top: '82%', dur: '5s', delay: '2s' },
  { id: 7, type: 'dot', left: '45%', top: '8%', dur: '4.8s', delay: '0.6s' },
  { id: 8, type: 'heart', left: '92%', top: '78%', dur: '5.5s', delay: '1s' },
  { id: 9, type: 'star', left: '18%', top: '38%', dur: '4.6s', delay: '1.8s' },
  { id: 10, type: 'dot', left: '55%', top: '62%', dur: '5.3s', delay: '2.4s' },
];

const SoftSparkles: React.FC<{ count?: number }> = ({ count = 10 }) => (
  <div className="syrn-sparkles" aria-hidden="true">
    {SPARKLES.slice(0, count).map((s) => (
      <span
        key={s.id}
        className={`syrn-sparkle syrn-sparkle--${s.type}`}
        style={{
          left: s.left,
          top: s.top,
          ['--dur' as string]: s.dur,
          ['--delay' as string]: s.delay,
        }}
      />
    ))}
  </div>
);

export default SoftSparkles;
