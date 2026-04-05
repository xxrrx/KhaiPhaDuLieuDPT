import React from 'react';
import { Link } from 'react-router-dom';

export default function UserAvatar({ user, size = 'md', linkToProfile = true }) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
  };

  const initial = user?.username?.[0]?.toUpperCase() || '?';

  const avatar = (
    <div className={`${sizes[size]} rounded-full overflow-hidden flex-shrink-0 bg-rose-500 flex items-center justify-center font-bold text-white`}>
      {user?.avatar_url ? (
        <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );

  if (linkToProfile && user?.id) {
    return <Link to={`/social/users/${user.id}`}>{avatar}</Link>;
  }

  return avatar;
}
