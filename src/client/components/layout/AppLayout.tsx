import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { CallOverlay } from '../calls/CallOverlay';
import { AppLockModal } from '../security/AppLockModal';

interface AppLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCreate: () => void;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreate,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
  children,
}) => {
  // In messages tab, the ChatWindow manages its own full-height layout.
  // Remove outer padding and hide BottomNav on mobile to avoid covering the composer.
  const isMessages = currentTab === 'messages';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#06080d] text-slate-100">
      {/* Desktop Collapsible Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        unreadMessagesCount={unreadMessagesCount}
        unreadNotificationsCount={unreadNotificationsCount}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Responsive Header */}
        <Header
          onSearch={(q) => console.log('Global query:', q)}
          onOpenCreate={onOpenCreate}
          onSelectTab={onSelectTab}
          unreadNotificationsCount={unreadNotificationsCount}
          unreadMessagesCount={unreadMessagesCount}
        />

        {/* Dynamic Page Content — no padding or scroll in messages mode (ChatWindow manages its own) */}
        <main
          key={currentTab}
          className={`flex-1 no-scrollbar animate-page-enter ${isMessages ? 'overflow-hidden' : 'overflow-y-auto p-3 sm:p-6'}`}
        >
          {children}
        </main>

        {/* Mobile Navigation Bar — hidden in messages tab to avoid covering the composer.
            ChatWindow has its own ← Back button to return to the chat list. */}
        {!isMessages && (
          <BottomNav
            currentTab={currentTab}
            onSelectTab={onSelectTab}
            onOpenCreate={onOpenCreate}
            unreadMessagesCount={unreadMessagesCount}
          />
        )}

      </div>

      {/* Real-time WebRTC Audio & Video Calling Overlay */}
      <CallOverlay />

      {/* Security App Lock PIN Screen */}
      <AppLockModal />
    </div>
  );
};

