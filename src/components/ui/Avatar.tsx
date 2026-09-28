import React from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: AvatarStatus;
  className?: string;
}

const sizeClasses: Record<AvatarSize, { container: string; text: string; dot: string }> = {
  xs: { container: 'h-6 w-6', text: 'text-[10px]', dot: 'h-1.5 w-1.5 ring-1' },
  sm: { container: 'h-8 w-8', text: 'text-xs', dot: 'h-2 w-2 ring-1.5' },
  md: { container: 'h-10 w-10', text: 'text-sm font-semibold', dot: 'h-2.5 w-2.5 ring-2' },
  lg: { container: 'h-12 w-12', text: 'text-base font-bold', dot: 'h-3 w-3 ring-2' },
  xl: { container: 'h-16 w-16', text: 'text-lg font-bold', dot: 'h-4 w-4 ring-2' },
};

const statusClasses: Record<AvatarStatus, string> = {
  online: 'bg-emerald-400',
  offline: 'bg-neutral-500',
  busy: 'bg-rose-500',
  away: 'bg-amber-400',
};

const getInitials = (name?: string): string => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

const getAvatarBg = (name?: string): string => {
  if (!name) return 'bg-purple-900/80 text-purple-200 border-purple-700/50';
  const colors = [
    'bg-purple-900/80 text-purple-200 border-purple-700/50',
    'bg-indigo-900/80 text-indigo-200 border-indigo-700/50',
    'bg-amber-900/80 text-amber-200 border-amber-700/50',
    'bg-emerald-900/80 text-emerald-200 border-emerald-700/50',
    'bg-cyan-900/80 text-cyan-200 border-cyan-700/50',
    'bg-rose-900/80 text-rose-200 border-rose-700/50',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = 'md',
  status,
  className = '',
}) => {
  const [imageError, setImageError] = React.useState(false);
  const { container, text, dot } = sizeClasses[size];

  const showImage = src && !imageError;
  const initials = getInitials(name || alt);
  const colorBg = getAvatarBg(name || alt);

  return (
    <div className={`relative inline-block select-none shrink-0 ${className}`}>
      <div
        className={`${container} rounded-full overflow-hidden flex items-center justify-center border ${
          showImage ? 'border-neutral-700/80 bg-neutral-900' : colorBg
        }`}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className={`${text} tracking-wider font-bold`}>{initials}</span>
        )}
      </div>

      {status && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-gray-950 ${dot} ${statusClasses[status]}`}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
};

export interface AvatarGroupProps {
  avatars: Array<{ src?: string; name?: string; alt?: string }>;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 4,
  size = 'sm',
  className = '',
}) => {
  const visible = avatars.slice(0, max);
  const extraCount = avatars.length - max;
  const { container, text } = sizeClasses[size];

  return (
    <div className={`flex items-center -space-x-2 overflow-hidden ${className}`}>
      {visible.map((av, idx) => (
        <Avatar
          key={idx}
          src={av.src}
          name={av.name}
          alt={av.alt}
          size={size}
          className="ring-2 ring-gray-950"
        />
      ))}
      {extraCount > 0 && (
        <div
          className={`${container} rounded-full bg-neutral-800 border border-neutral-700 ring-2 ring-gray-950 flex items-center justify-center text-neutral-300 font-bold ${text}`}
        >
          +{extraCount}
        </div>
      )}
    </div>
  );
};
