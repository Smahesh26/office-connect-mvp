export function StatusStamp({ status }) {
  return <span className={`stamp-${status}`}>{status}</span>;
}

export function Card({ title, action, children, className = '' }) {
  return (
    <div className={`card p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="font-display text-lg text-ink-950">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && <Icon className="w-10 h-10 text-ink-600/40 mb-3" strokeWidth={1.5} />}
      <p className="font-display text-lg text-ink-900">{title}</p>
      {description && <p className="text-sm text-ink-700/70 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/40 backdrop-blur-sm p-4 sm:p-8">
      <div className={`card w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} my-4 animate-[fadeIn_0.15s_ease-out]`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-line-light">
          <h3 className="font-display text-lg">{title}</h3>
          <button onClick={onClose} className="text-ink-600 hover:text-ink-950 text-xl leading-none">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Th({ children, align = 'left' }) {
  return <th className={`text-xs font-semibold uppercase tracking-wide text-ink-700 px-4 py-3 text-${align}`}>{children}</th>;
}
export function Td({ children, align = 'left', className = '' }) {
  return <td className={`px-4 py-3 text-sm text-ink-950 text-${align} ${className}`}>{children}</td>;
}
