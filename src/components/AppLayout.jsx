import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import ChatWidget from './ChatWidget';

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col pb-10">
      <AppHeader />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
      <AppFooter />
      <ChatWidget />
    </div>
  );
}
