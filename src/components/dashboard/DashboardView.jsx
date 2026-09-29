import React from 'react';
import { OwnerDashboardView } from './OwnerDashboardView';

/**
 * DashboardView
 * Re-exports and wraps OwnerDashboardView for Obsidian Spatial Canvas
 */
export const DashboardView = (props) => {
  return <OwnerDashboardView {...props} />;
};

export default DashboardView;
