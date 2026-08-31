"use client";

import { ReactNode, useEffect } from "react";

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  position?: "right" | "left" | "bottom";
  width?: "sm" | "md" | "lg";
}

const positionClasses = {
  right: "right-0 top-0 bottom-0 h-full border-l",
  left: "left-0 top-0 bottom-0 h-full border-r",
  bottom: "bottom-0 left-0 right-0 max-h-[85vh] border-t rounded-t-[16px]",
};

const widthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-xl",
};

export const Drawer = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  position = "right",
  width = "md",
}: DrawerProps) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Drawer Panel */}
      <div
        className={[
          "fixed bg-white p-6 shadow-2xl border-slate-200 z-10 flex flex-col justify-between overflow-y-auto w-full",
          positionClasses[position],
          position !== "bottom" ? widthClasses[width] : "",
        ].join(" ")}
      >
        <div>
          <div className="flex items-start justify-between border-b border-slate-100 pb-4 mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">{title}</h3>
              {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded hover:bg-slate-100 text-sm"
            >
              ✕
            </button>
          </div>
          <div className="text-xs text-slate-700">{children}</div>
        </div>

        {footer && <div className="border-t border-slate-100 pt-4 mt-6">{footer}</div>}
      </div>
    </div>
  );
};
