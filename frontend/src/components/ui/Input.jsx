import React from 'react';

export default function Input({
  label,
  error,
  className = '',
  id,
  type = 'text',
  ...props
}) {
  const inputId = id || label;
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`
          w-full px-3 py-2 rounded-lg bg-zinc-800 border text-zinc-100
          placeholder-zinc-500 text-sm transition-colors
          focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent
          ${error ? 'border-red-500' : 'border-zinc-700 hover:border-zinc-600'}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
