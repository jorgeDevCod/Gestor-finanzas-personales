import * as LucideIcons from 'lucide-react';

export const FeatureCard = ({ icon, title, description }) => {
  const Icon = LucideIcons[icon];

  return (
    <article className="feature-card">
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: 'rgba(122, 191, 142, 0.08)',
          border: '1px solid rgba(122, 191, 142, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-lime)',
          flexShrink: 0,
        }}
      >
        <Icon size={22} />
      </div>

      <div>
        <h3
          className="font-display font-semibold mb-2"
          style={{
            fontSize: 15,
            color: 'var(--color-text)',
            letterSpacing: '-0.01em',
            lineHeight: 1.35,
          }}
        >
          {title}
        </h3>
        <p
          className="font-body leading-relaxed"
          style={{ fontSize: 13.5, color: 'var(--color-text-sec)', lineHeight: 1.7 }}
        >
          {description}
        </p>
      </div>
    </article>
  );
};
