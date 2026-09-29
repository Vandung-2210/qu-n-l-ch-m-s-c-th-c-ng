import React from 'react';
import { ClinicOsView } from './ClinicOsView';

/**
 * ClinicWorkspaceView - Phân hệ chuyên biệt dành cho Bác sĩ thú y (Clinic OS / B2B)
 * Bao gồm:
 * - Bệnh án SOAP lâm sàng chuẩn quốc tế
 * - Hàng đợi điều phối khám thông minh
 * - AI Medical Scribe (ghi âm và tổng hợp triệu chứng)
 * - Quản lý kho dược theo nguyên tắc FEFO
 * - POS & Viện phí điều trị
 */
export const ClinicWorkspaceView = ({ 
  onBack, 
  onBackToOwnerPortal, 
  onLogout,
  onSwitchPortal,
  currentUser,
  ...props 
}) => {
  return (
    <ClinicOsView
      {...props}
      currentUser={currentUser}
      onLogout={onLogout}
      onSwitchPortal={onSwitchPortal}
      onBack={onBack || onBackToOwnerPortal}
      onBackToOwnerPortal={onBack || onBackToOwnerPortal}
    />
  );
};

export { ClinicOsView } from './ClinicOsView';
export default ClinicWorkspaceView;
