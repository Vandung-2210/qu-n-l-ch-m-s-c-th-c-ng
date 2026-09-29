import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { AuraBackground } from '../common/AuraBackground';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

/**
 * OwnerPortalLayout
 * Obsidian Spatial Canvas - Master Layout Container for Pet Care Owner Portal
 * Features:
 * - Cosmic Dark Background: bg-[#0B0C10]
 * - Locked Viewport Scroll: h-screen overflow-hidden
 * - Top Header Pill Bar (Obsidian Navigation)
 * - Curved Glow Sidebar (Floating Left Dock with Neon Violet accents)
 * - Spatial Canvas Workspace with zero browser window scrollbars
 */
export const OwnerPortalLayout = ({
  children,
  activeTab = 'dashboard',
  setActiveTab = () => {},
  pets = [],
  schedules = [],
  selectedPetId,
  onSelectPet = () => {},
  onOpenAddSchedule = () => {},
  onOpenVetBooking = () => {},
  onOpenGlobalSearch = () => {},
  isMobileMenuOpen = false,
  setIsMobileMenuOpen = () => {},
  theme = 'dark',
  onToggleTheme = () => {},
  onToggleComplete = () => {},
  currentUser = null,
  onOpenProfileModal = () => {},
  onLogout = () => {},
  currentPortal = 'OWNER',
  setCurrentPortal = () => {},
  onSwitchPortal = () => {},
  overdueCount = 0,
  todayCount = 0,
  pendingAppointmentsCount = 0
}) => {
  return (
    <AuraBackground className="select-none">
      <div className="h-screen w-full flex flex-col overflow-hidden antialiased bg-transparent text-slate-800 dark:text-slate-100">
        
        {/* 1. TOP HEADER PILL BAR */}
        <Navbar
          pets={pets}
          schedules={schedules}
          selectedPetId={selectedPetId}
          onSelectPet={onSelectPet}
          onOpenAddSchedule={onOpenAddSchedule}
          onOpenVetBooking={onOpenVetBooking}
          onOpenGlobalSearch={onOpenGlobalSearch}
          onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          theme={theme}
          onToggleTheme={onToggleTheme}
          onToggleComplete={onToggleComplete}
          currentUser={currentUser}
          onOpenProfileModal={onOpenProfileModal}
          onLogout={onLogout}
          currentPortal={currentPortal}
          setCurrentPortal={setCurrentPortal}
          onSwitchPortal={onSwitchPortal}
        />

        {/* 2. SPATIAL CANVAS WORKSPACE */}
        <div className="flex-1 flex w-full overflow-hidden relative">
          
          {/* CURVED GLOW SIDEBAR (LEFT FLOATING DOCK) */}
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isMobileOpen={isMobileMenuOpen}
            setIsMobileOpen={setIsMobileMenuOpen}
            overdueCount={overdueCount}
            todayCount={todayCount}
            pendingAppointmentsCount={pendingAppointmentsCount}
            currentUser={currentUser}
            onOpenProfileModal={onOpenProfileModal}
          />

          {/* MAIN CANVAS VIEWPORT */}
          <main className="flex-1 h-full min-w-0 md:pl-24 pr-2 sm:pr-4 py-1 sm:py-2 overflow-hidden flex flex-col">
            <div className="w-full h-full max-w-[1680px] mx-auto flex flex-col overflow-hidden">
              {children}
            </div>
          </main>
        </div>

      </div>
    </AuraBackground>
  );
};

export default OwnerPortalLayout;
