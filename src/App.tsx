import React, { useState, useEffect } from 'react';
import { useAuth } from './client/contexts/AuthContext';
import { AppLayout } from './client/components/layout/AppLayout';
import { LandingPage } from './client/pages/LandingPage';
import { LoginPage } from './client/pages/LoginPage';
import { RegisterPage } from './client/pages/RegisterPage';
import { HomePage } from './client/pages/HomePage';
import { ExplorePage } from './client/pages/ExplorePage';
import { ReelsPage } from './client/pages/ReelsPage';
import { MessagesPage } from './client/pages/MessagesPage';
import { CallsPage } from './client/pages/CallsPage';
import { MeetingsPage } from './client/pages/MeetingsPage';
import { CommunitiesPage } from './client/pages/CommunitiesPage';
import { ChannelsPage } from './client/pages/ChannelsPage';
import { NotificationsPage } from './client/pages/NotificationsPage';
import { SavedPage } from './client/pages/SavedPage';
import { ProfilePage } from './client/pages/ProfilePage';
import { SettingsPage } from './client/pages/SettingsPage';
import { MembershipPage } from './client/pages/MembershipPage';
import { AdminDashboardPage } from './client/pages/AdminDashboardPage';
import { TVModePage } from './client/pages/TVModePage';
import { HelpCenterPage } from './client/pages/HelpCenterPage';
import { PrivacyPolicyPage } from './client/pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './client/pages/TermsOfServicePage';
import { DarkFalconAIChat } from './client/components/ai/DarkFalconAIChat';
import { CreatePostModal } from './client/components/feed/CreatePostModal';
import { Post, User } from './shared/types';
import { RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const { user, isLoading, login } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register' | 'tv' | 'help' | 'privacy' | 'terms'>('landing');
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [profileViewUsername, setProfileViewUsername] = useState<string | undefined>(undefined);

  // Deep-link / Hash Listener (#tv, #help, #privacy, #terms)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase();
      if (hash === 'tv') {
        if (user) setCurrentTab('tv');
        else setAuthView('tv');
      } else if (hash === 'help') {
        if (user) setCurrentTab('help');
        else setAuthView('help');
      } else if (hash === 'privacy' || hash === 'privacy-policy') {
        if (user) setCurrentTab('privacy-policy');
        else setAuthView('privacy');
      } else if (hash === 'terms') {
        if (user) setCurrentTab('terms');
        else setAuthView('terms');
      } else if (hash === 'membership') {
        if (user) setCurrentTab('membership');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [user]);

  // Register PWA Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('PWA Service Worker registration warning:', err);
      });
    }
  }, []);

  const handleDemoLogin = async () => {
    try {
      await login('cyber_falcon', import.meta.env.VITE_DEMO_PASSWORD || '');
      setCurrentTab('home');
    } catch (e: any) {
      alert('Demo launch error: ' + e.message);
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setCurrentTab('home');
  };

  const handleOpenDirectChat = (targetUser: User) => {
    setCurrentTab('messages');
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#06080d] text-white select-none">
        <img
          src="/assets/brand/dark-falcon-logo.png"
          alt="Dark Falcon Loading"
          className="w-24 h-24 object-contain animate-pulse mb-4"
        />
        <div className="flex items-center gap-2 text-xs font-semibold text-falcon-blue tracking-wider">
          <RefreshCw className="w-4 h-4 animate-spin" />
          INITIALIZING DARK FALCON CORE
        </div>
      </div>
    );
  }

  // Unauthenticated user views
  if (!user) {
    if (authView === 'login') {
      return (
        <LoginPage
          onGoToRegister={() => setAuthView('register')}
          onGoToLanding={() => setAuthView('landing')}
          onDemoLogin={handleDemoLogin}
        />
      );
    }
    if (authView === 'register') {
      return (
        <RegisterPage
          onGoToLogin={() => setAuthView('login')}
          onGoToLanding={() => setAuthView('landing')}
        />
      );
    }
    if (authView === 'tv') {
      return <TVModePage onExitTV={() => setAuthView('landing')} />;
    }
    if (authView === 'help') {
      return (
        <div className="min-h-screen bg-[#06080d] p-4 sm:p-8">
          <HelpCenterPage onBack={() => setAuthView('landing')} />
        </div>
      );
    }
    if (authView === 'privacy') {
      return (
        <div className="min-h-screen bg-[#06080d] p-4 sm:p-8">
          <PrivacyPolicyPage onBack={() => setAuthView('landing')} />
        </div>
      );
    }
    if (authView === 'terms') {
      return (
        <div className="min-h-screen bg-[#06080d] p-4 sm:p-8">
          <TermsOfServicePage onBack={() => setAuthView('landing')} />
        </div>
      );
    }
    return (
      <LandingPage
        onLogin={() => setAuthView('login')}
        onRegister={() => setAuthView('register')}
        onDemo={handleDemoLogin}
        onTV={() => setAuthView('tv')}
        onHelp={() => setAuthView('help')}
        onPrivacy={() => setAuthView('privacy')}
        onTerms={() => setAuthView('terms')}
      />
    );
  }

  // Standalone Fullscreen TV Experience (10-Foot Remote UI)
  if (currentTab === 'tv') {
    return <TVModePage onExitTV={() => setCurrentTab('home')} />;
  }

  // Authenticated application views within Responsive AppLayout
  return (
    <AppLayout
      currentTab={currentTab}
      onSelectTab={(tab) => {
        setProfileViewUsername(undefined);
        setCurrentTab(tab);
      }}
      onOpenCreate={() => setIsCreatePostOpen(true)}
      unreadMessagesCount={1}
      unreadNotificationsCount={1}
    >
      {currentTab === 'home' && (
        <HomePage
          onOpenCreatePost={() => setIsCreatePostOpen(true)}
          onNavigateTab={(t) => setCurrentTab(t)}
        />
      )}

      {currentTab === 'explore' && <ExplorePage />}
      {currentTab === 'reels' && <ReelsPage />}
      {currentTab === 'messages' && <MessagesPage />}
      {currentTab === 'calls' && <CallsPage />}
      {currentTab === 'meetings' && <MeetingsPage />}
      {currentTab === 'communities' && <CommunitiesPage />}
      {currentTab === 'channels' && <ChannelsPage />}
      {currentTab === 'notifications' && <NotificationsPage />}
      {currentTab === 'saved' && <SavedPage />}
      {currentTab === 'ai' && <DarkFalconAIChat />}
      {currentTab === 'profile' && (
        <ProfilePage
          username={profileViewUsername}
          onOpenDirectChat={handleOpenDirectChat}
        />
      )}
      {currentTab === 'settings' && <SettingsPage />}
      {currentTab === 'membership' && <MembershipPage />}
      {currentTab === 'admin' && <AdminDashboardPage />}
      {currentTab === 'help' && <HelpCenterPage onBack={() => setCurrentTab('settings')} />}
      {currentTab === 'privacy-policy' && <PrivacyPolicyPage onBack={() => setCurrentTab('settings')} />}
      {currentTab === 'terms' && <TermsOfServicePage onBack={() => setCurrentTab('settings')} />}

      {/* Global Post Creation Modal */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </AppLayout>
  );
};

