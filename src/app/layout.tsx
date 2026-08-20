import React from 'react';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {children}
    </div>
  );
}
