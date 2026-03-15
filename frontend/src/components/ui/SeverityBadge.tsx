'use client';

interface SeverityBadgeProps {
  severity: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  DEBUG: 'bg-purple-100 text-purple-800',
  INFO: 'bg-green-100 text-green-800',
  WARNING: 'bg-yellow-100 text-yellow-800',
  ERROR: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  const colorClasses = SEVERITY_COLORS[severity.toUpperCase()] ?? '';

  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}
    >
      {severity}
    </span>
  );
}
