export type AdminIconName =
  | 'alert'
  | 'bed'
  | 'check'
  | 'close'
  | 'edit'
  | 'home'
  | 'lock'
  | 'logOut'
  | 'package'
  | 'plus'
  | 'receipt'
  | 'search'
  | 'shield'
  | 'trash'
  | 'unlock'
  | 'users';

type AdminIconProps = {
  className?: string;
  name: AdminIconName;
};

/**
 * Bộ icon SVG vẽ tay dùng chung cho module Admin, đồng bộ phong cách nét mảnh với các module khác
 * (Director, IT) thay vì phụ thuộc thư viện icon ngoài.
 * @param name - Tên icon cần render.
 * @param className - Class Tailwind cho kích thước/màu, mặc định kế thừa currentColor.
 */
export function AdminIcon({ className = 'h-5 w-5', name }: AdminIconProps) {
  const commonProps = {
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
  };

  if (name === 'alert') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.3 4.5 2.7 18a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 4.5a2 2 0 0 0-3.4 0Z" />
      </svg>
    );
  }

  if (name === 'bed') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M4 11V5" />
        <path d="M4 16v3" />
        <path d="M20 16v3" />
        <path d="M4 11h7a3 3 0 0 1 3 3v2" />
        <path d="M4 16h16v-3a2 2 0 0 0-2-2h-4" />
        <path d="M8 8h3" />
      </svg>
    );
  }

  if (name === 'check') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="m5 13 4 4L19 7" />
      </svg>
    );
  }

  if (name === 'close') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
      </svg>
    );
  }

  if (name === 'edit') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
    );
  }

  if (name === 'home') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="m4 11 8-7 8 7" />
        <path d="M6 10v10h12V10" />
        <path d="M10 20v-5h4v5" />
      </svg>
    );
  }

  if (name === 'lock') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <rect height="10" rx="1.5" width="14" x="5" y="11" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
    );
  }

  if (name === 'logOut') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
        <path d="M14 8l4 4-4 4" />
        <path d="M18 12H9" />
      </svg>
    );
  }

  if (name === 'package') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
        <path d="m20.7 7-8.7 5-8.7-5 8.7-5 8.7 5Z" />
      </svg>
    );
  }

  if (name === 'plus') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </svg>
    );
  }

  if (name === 'receipt') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M6 3h12v18l-2-1-2 1-2-1-2 1-2-1-2 1Z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </svg>
    );
  }

  if (name === 'search') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.2-3.2" />
      </svg>
    );
  }

  if (name === 'shield') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M12 3 5 6v6c0 4 2.8 7.4 7 9 4.2-1.6 7-5 7-9V6Z" />
        <path d="m9 12 2 2 4-5" />
      </svg>
    );
  }

  if (name === 'trash') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M4 7h16" />
        <path d="M6 7l1 13h10l1-13" />
        <path d="M9 7V4h6v3" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </svg>
    );
  }

  if (name === 'unlock') {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <rect height="10" rx="1.5" width="14" x="5" y="11" />
        <path d="M8 11V7a4 4 0 0 1 7.5-1.9" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" {...commonProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
      <path d="M16 3.1a4 4 0 0 1 0 7.8" />
    </svg>
  );
}
