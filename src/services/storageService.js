import { apiCreate, apiUpdate, apiDelete, syncAllDataToCache } from './apiService.js';
// Mock data removed as per requirements
import { generateAiCarePlan } from './aiService.js';

const STORAGE_KEYS = {
  PETS: 'petcare_pets_v1',
  SCHEDULES: 'petcare_schedules_v1',
  SETTINGS: 'petcare_settings_v1',
  EXPENSES: 'petcare_expenses_v1',
  DAILY_LOGS: 'petcare_daily_logs_v1',
  PRESCRIPTIONS: 'petcare_prescriptions_v1',
  FAMILY_MEMBERS: 'petcare_family_members_v1',
  DAILY_HABITS: 'petcare_daily_habits_v1',
  LOST_MODES: 'petcare_lost_modes_v1',
  THEME: 'petcare_theme_v1',
  APPOINTMENTS: 'petcare_appointments_v1'
};

const getStored = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return fallback;
  }
};

const setStored = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
  }
};

// Helper xử lý ngày địa phương (Local Date) chuẩn xác, tránh lệch ngày do múi giờ UTC
export const getLocalDateString = (d = new Date()) => {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (!dateObj || isNaN(dateObj.getTime())) return new Date().toISOString().split('T')[0];
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const addDaysLocal = (dateStr, daysToAdd) => {
  const clean = String(dateStr).split('T')[0];
  const [y, m, d] = clean.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + daysToAdd);
  return getLocalDateString(date);
};

// Xử lý cộng tháng an toàn ngày cuối tháng và năm nhuận (Clamping)
export const addMonthsClamped = (dateStr, monthsToAdd) => {
  const clean = String(dateStr).split('T')[0];
  const [y, m, d] = clean.split('-').map(Number);
  const targetYear = y + Math.floor((m - 1 + monthsToAdd) / 12);
  const targetMonth = ((m - 1 + monthsToAdd) % 12 + 12) % 12; // 0-indexed
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  const clampedDay = Math.min(d, daysInTargetMonth);
  return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
};

// Xử lý cộng năm an toàn (Ví dụ 29/02 năm nhuận -> 28/02)
export const addYearsClamped = (dateStr, yearsToAdd) => {
  const clean = String(dateStr).split('T')[0];
  const [y, m, d] = clean.split('-').map(Number);
  const targetYear = y + yearsToAdd;
  const daysInTargetMonth = new Date(targetYear, m, 0).getDate();
  const clampedDay = Math.min(d, daysInTargetMonth);
  return `${targetYear}-${String(m).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
};

// Tính toán chuỗi ngày streak liên tục thực tế từ mảng lịch sử completedDates
export const calculateStreak = (completedDates = []) => {
  if (!Array.isArray(completedDates) || completedDates.length === 0) return 0;
  const uniqueDates = Array.from(new Set(completedDates)).filter(Boolean).sort().reverse();
  if (uniqueDates.length === 0) return 0;
  const todayStr = getLocalDateString();
  
  let checkDate = new Date();
  const todayIncluded = uniqueDates.includes(todayStr);
  if (!todayIncluded) {
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = getLocalDateString(checkDate);
    if (!uniqueDates.includes(yesterdayStr)) {
      return 0; // Đã đứt chuỗi
    }
  }
  
  let streak = 0;
  let curr = new Date(todayIncluded ? todayStr : getLocalDateString(checkDate));
  while (true) {
    const currStr = getLocalDateString(curr);
    if (uniqueDates.includes(currStr)) {
      streak++;
      curr.setDate(curr.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
};

const SYSTEM_INIT_FLAG = 'petcare_system_initialized_v2';

// ----------------- PETS -----------------
export const getPets = (userId = null, userRole = null) => {
  const data = getStored(STORAGE_KEYS.PETS, null);
  let allPets = data;

  if (!Array.isArray(allPets)) {
    allPets = [];
    setStored(STORAGE_KEYS.PETS, allPets);
    localStorage.setItem(SYSTEM_INIT_FLAG, 'true');
  }

  // 1. Quản trị viên hệ thống hoặc không truyền userId (cho các bộ đếm tổng): Trả về toàn bộ hồ sơ thực tế
  if (!userId || userRole === 'system_admin') {
    return allPets;
  }

  // 2. Bác sĩ thú y (vet_doctor): Chỉ được truy cập hồ sơ được phân công khám hoặc chia sẻ hợp lệ
  if (userRole === 'vet_doctor') {
    const rawAppointments = getStored(STORAGE_KEYS.APPOINTMENTS, []) || [];
    const assignedPetIds = new Set(
      rawAppointments
        .filter(a => a.assignedVetId === userId || (a.assignedVet && (a.assignedVet.includes('Nam') || a.assignedVet.includes('Dr. Paw'))))
        .map(a => a.petId)
        .filter(Boolean)
    );
    return allPets.filter(p => 
      assignedPetIds.has(p.id) || 
      p.assignedVetId === userId || 
      (Array.isArray(p.sharedWithVetIds) && p.sharedWithVetIds.includes(userId))
    );
  }

  // 3. Chủ nuôi thường (pet_owner): Chỉ truy cập hồ sơ thuộc quyền sở hữu của chính mình
  return allPets.filter(p => String(p.ownerId).trim() === String(userId).trim());
};

export const savePets = (pets) => {
  setStored(STORAGE_KEYS.PETS, pets);
  return pets;
};

/**
 * XÓA DÂY CHUYỀN DỮ LIỆU KHI ADMIN XÓA TÀI KHOẢN (CASCADE DELETE BY OWNER):
 * - Xác định các thú cưng thuộc tài khoản bằng ownerId
 * - Xóa hồ sơ các thú cưng đó
 * - Xóa lịch chăm sóc, chi tiêu, nhật ký, đơn thuốc, thói quen, dữ liệu thất lạc gắn với các thú cưng bị xóa
 * - Xóa dữ liệu riêng của tài khoản và thu hồi phiên đăng nhập
 * - Không xóa hồ sơ của chủ nuôi khác
 * - Nếu xóa bác sĩ: chỉ thu hồi tài khoản và quyền phân công, KHÔNG xóa thú cưng của chủ nuôi
 */
export const handleUserDeletedCascade = (deletedUserId, deletedUserRole = null) => {
  if (!deletedUserId) return;
  const cleanId = String(deletedUserId).trim();

  // Tạo điểm khôi phục dự phòng (Transaction snapshot) để tránh xóa dở dang / partial deletion
  const snapshot = {
    pets: getStored(STORAGE_KEYS.PETS, null),
    schedules: getStored(STORAGE_KEYS.SCHEDULES, null),
    expenses: getStored(STORAGE_KEYS.EXPENSES, null),
    dailyLogs: getStored(STORAGE_KEYS.DAILY_LOGS, null),
    prescriptions: getStored(STORAGE_KEYS.PRESCRIPTIONS, null),
    familyMembers: getStored(STORAGE_KEYS.FAMILY_MEMBERS, null),
    dailyHabits: getStored(STORAGE_KEYS.DAILY_HABITS, null),
    lostModes: getStored(STORAGE_KEYS.LOST_MODES, null),
    appointments: getStored(STORAGE_KEYS.APPOINTMENTS, null),
    healthData: getStored(PETS_HEALTH_STORAGE_KEY, null)
  };

  try {
    // NẾU LÀ TÀI KHOẢN CHỦ NUÔI: XÓA THÚ CƯNG VÀ DỮ LIỆU CHĂM SÓC DÂY CHUYỀN
    if (deletedUserRole !== 'vet_doctor') {
      const allPets = snapshot.pets || [];
      const ownerPets = allPets.filter(p => String(p.ownerId).trim() === cleanId);
      const deleteIds = new Set(ownerPets.map(p => p.id));

      // 1. Xóa hồ sơ thú cưng
      const remainingPets = allPets.filter(p => String(p.ownerId).trim() !== cleanId);
      
      // Gỡ bỏ quyền chia sẻ của tài khoản này trên thú cưng của CHỦ NUÔI KHÁC (bảo toàn thú cưng người khác)
      remainingPets.forEach(p => {
        if (Array.isArray(p.sharedWithUserIds) && p.sharedWithUserIds.includes(cleanId)) {
          p.sharedWithUserIds = p.sharedWithUserIds.filter(id => id !== cleanId);
        }
      });
      setStored(STORAGE_KEYS.PETS, remainingPets);

      // 2. Xóa lịch chăm sóc
      const schedules = snapshot.schedules || [];
      const remainingSchedules = schedules.filter(s => 
        !deleteIds.has(s.petId) && String(s.ownerId).trim() !== cleanId
      );
      setStored(STORAGE_KEYS.SCHEDULES, remainingSchedules);

      // 3. Xóa chi tiêu
      const expenses = snapshot.expenses || [];
      const remainingExpenses = expenses.filter(e => 
        !deleteIds.has(e.petId) && String(e.ownerId).trim() !== cleanId
      );
      setStored(STORAGE_KEYS.EXPENSES, remainingExpenses);

      // 4. Xóa nhật ký hàng ngày
      const dailyLogs = snapshot.dailyLogs || [];
      const remainingDailyLogs = dailyLogs.filter(l => 
        !deleteIds.has(l.petId) && String(l.ownerId).trim() !== cleanId
      );
      setStored(STORAGE_KEYS.DAILY_LOGS, remainingDailyLogs);

      // 5. Xóa đơn thuốc
      const prescriptions = snapshot.prescriptions || [];
      const remainingPrescriptions = prescriptions.filter(pr => 
        !deleteIds.has(pr.petId) && String(pr.ownerId).trim() !== cleanId
      );
      setStored(STORAGE_KEYS.PRESCRIPTIONS, remainingPrescriptions);

      // 6. Xóa thói quen hàng ngày
      const dailyHabits = snapshot.dailyHabits || [];
      const remainingHabits = dailyHabits.filter(h => 
        !deleteIds.has(h.petId) && String(h.ownerId).trim() !== cleanId
      );
      setStored(STORAGE_KEYS.DAILY_HABITS, remainingHabits);

      // 7. Xóa thành viên gia đình
      const familyMembers = snapshot.familyMembers || [];
      const remainingFamily = familyMembers.filter(m => String(m.ownerId).trim() !== cleanId);
      setStored(STORAGE_KEYS.FAMILY_MEMBERS, remainingFamily);

      // 8. Xóa dữ liệu thất lạc
      const lostModes = snapshot.lostModes || {};
      if (typeof lostModes === 'object' && !Array.isArray(lostModes)) {
        const updatedLost = { ...lostModes };
        deleteIds.forEach(id => delete updatedLost[id]);
        setStored(STORAGE_KEYS.LOST_MODES, updatedLost);
      }

      // 9. Xóa lịch hẹn khám của các thú cưng bị xóa
      const appointments = snapshot.appointments || [];
      const remainingAppts = appointments.filter(a => !deleteIds.has(a.petId));
      setStored(STORAGE_KEYS.APPOINTMENTS, remainingAppts);

      // 10. Dọn dẹp dữ liệu cân nặng/sức khỏe
      if (snapshot.healthData && typeof snapshot.healthData === 'object') {
        const updatedHealth = { ...snapshot.healthData };
        ownerPets.forEach(p => {
          const k1 = normalizePetHealthKey(p.id);
          const k2 = normalizePetHealthKey(p.name);
          delete updatedHealth[k1];
          delete updatedHealth[k2];
        });
        setStored(PETS_HEALTH_STORAGE_KEY, updatedHealth);
      }

    } else {
      // NẾU LÀ TÀI KHOẢN BÁC SĨ THÚ Y: CHỈ THU HỒI TÀI KHOẢN VÀ PHÂN CÔNG, KHÔNG XÓA THÚ CƯNG CỦA CHỦ NUÔI
      const allPets = snapshot.pets || [];
      let petsChanged = false;
      const updatedPets = allPets.map(p => {
        let changed = false;
        const copy = { ...p };
        if (copy.assignedVetId && String(copy.assignedVetId).trim() === cleanId) {
          copy.assignedVetId = null;
          changed = true;
        }
        if (Array.isArray(copy.sharedWithVetIds) && copy.sharedWithVetIds.some(id => String(id).trim() === cleanId)) {
          copy.sharedWithVetIds = copy.sharedWithVetIds.filter(id => String(id).trim() !== cleanId);
          changed = true;
        }
        if (changed) {
          petsChanged = true;
          return copy;
        }
        return p;
      });
      if (petsChanged) setStored(STORAGE_KEYS.PETS, updatedPets);

      // Thu hồi phân công bác sĩ trong lịch hẹn
      const appointments = snapshot.appointments || [];
      let apptsChanged = false;
      const updatedAppts = appointments.map(a => {
        if (String(a.assignedVetId).trim() === cleanId) {
          apptsChanged = true;
          return { ...a, assignedVetId: null, vetDeleted: true };
        }
        return a;
      });
      if (apptsChanged) setStored(STORAGE_KEYS.APPOINTMENTS, updatedAppts);
    }
  } catch (txError) {
    // Transaction Rollback nếu có lỗi: khôi phục nguyên trạng để không để lại trạng thái xóa dở dang
    console.error('Lỗi transaction khi xóa tài khoản, khôi phục snapshot:', txError);
    if (snapshot.pets !== null) setStored(STORAGE_KEYS.PETS, snapshot.pets);
    if (snapshot.schedules !== null) setStored(STORAGE_KEYS.SCHEDULES, snapshot.schedules);
    if (snapshot.expenses !== null) setStored(STORAGE_KEYS.EXPENSES, snapshot.expenses);
    if (snapshot.dailyLogs !== null) setStored(STORAGE_KEYS.DAILY_LOGS, snapshot.dailyLogs);
    if (snapshot.prescriptions !== null) setStored(STORAGE_KEYS.PRESCRIPTIONS, snapshot.prescriptions);
    if (snapshot.familyMembers !== null) setStored(STORAGE_KEYS.FAMILY_MEMBERS, snapshot.familyMembers);
    if (snapshot.dailyHabits !== null) setStored(STORAGE_KEYS.DAILY_HABITS, snapshot.dailyHabits);
    if (snapshot.lostModes !== null) setStored(STORAGE_KEYS.LOST_MODES, snapshot.lostModes);
    if (snapshot.appointments !== null) setStored(STORAGE_KEYS.APPOINTMENTS, snapshot.appointments);
    if (snapshot.healthData !== null) setStored(PETS_HEALTH_STORAGE_KEY, snapshot.healthData);
    throw txError;
  }

  // 11. Thu hồi phiên đăng nhập nếu tài khoản bị xóa trùng với phiên hiện hành
  try {
    const activeUser = localStorage.getItem('petcare_active_user');
    const currentUser = localStorage.getItem('petcare_current_user');
    const checkSession = (str) => {
      if (!str) return false;
      try {
        const u = JSON.parse(str);
        return String(u?.id).trim() === cleanId;
      } catch {
        return false;
      }
    };

    if (checkSession(activeUser) || checkSession(currentUser)) {
      localStorage.removeItem('petcare_active_user');
      localStorage.removeItem('petcare_current_user');
      localStorage.removeItem('petcare_is_authenticated');
      localStorage.removeItem('petcare_auth_session_v1');
    }
  } catch (err) {
    console.error('Lỗi khi thu hồi phiên đăng nhập:', err);
  }

  // Kích hoạt sự kiện toàn cục để Dashboard và danh sách đồng bộ ngay
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('petcare_data_cleaned', { detail: { deletedUserId: cleanId } }));
  }
};

// Giữ bí danh tương thích ngược
export const handleUserDeletedDataRetention = handleUserDeletedCascade;

/**
 * KIỂM TRA & RÀ SOÁT TẤT CẢ HỒ SƠ THÚ CƯNG TRONG HỆ THỐNG (AUDIT PETS)
 * Phân loại minh bạch:
 * 1. confirmedDeletedOwnerPets: Chắc chắn thuộc tài khoản đã xóa (cần dọn dẹp)
 * 2. unclearOwnerPets: Thiếu hoặc không rõ ownerId (báo riêng để xử lý, không đoán rồi xóa)
 * 3. activeOwnerPets: Thuộc tài khoản còn tồn tại (bảo vệ tuyệt đối)
 */
export const auditOrphanedPets = () => {
  const allPets = getStored(STORAGE_KEYS.PETS, []) || [];
  const users = getStored('petcare_auth_users_v1', []) || [];
  const deletedUsers = getStored('petcare_deleted_users_v1', []) || [];

  const allActiveUserIds = new Set(
    users.map(u => String(u.id).trim())
  );
  const deletedUserIds = new Set(
    deletedUsers.map(d => String(d.id).trim())
  );
  const deletedEmails = new Set(
    deletedUsers.map(d => (d.email || '').toLowerCase().trim())
  );

  const confirmedDeletedOwnerPets = [];
  const activeOwnerPets = [];
  const unclearOwnerPets = [];

  allPets.forEach(pet => {
    const rawOwnerId = pet.ownerId ? String(pet.ownerId).trim() : '';

    // 1. Hồ sơ thiếu hoặc không rõ ownerId
    if (!rawOwnerId || rawOwnerId === 'undefined' || rawOwnerId === 'null') {
      unclearOwnerPets.push({
        ...pet,
        auditReason: 'Hồ sơ thiếu hoặc không có trường ownerId (cần xử lý riêng)'
      });
      return;
    }

    // 2. Chủ sở hữu còn tồn tại trong hệ thống
    if (allActiveUserIds.has(rawOwnerId)) {
      activeOwnerPets.push(pet);
      return;
    }

    // 3. Chủ sở hữu xác định chắc chắn đã bị xóa
    const isExplicitlyMarked = Boolean(pet.isOwnerDeleted || pet.ownerDeleted);
    const isKnownDeletedId = deletedUserIds.has(rawOwnerId);
    const isKnownDeletedEmail = pet.ownerEmail && deletedEmails.has(pet.ownerEmail.toLowerCase().trim());
    const isOwnerNotActive = !allActiveUserIds.has(rawOwnerId);

    if (isExplicitlyMarked || isKnownDeletedId || isKnownDeletedEmail || isOwnerNotActive) {
      const isSample = pet.id === 'pet-1' || pet.id === 'pet-2' || pet.id === 'pet-3' || 
                       ['mochi', 'luna', 'bánh bao', 'banh bao'].includes((pet.name || '').toLowerCase().trim());

      confirmedDeletedOwnerPets.push({
        ...pet,
        isSample,
        auditReason: isExplicitlyMarked
          ? 'Đã được đánh dấu chủ sở hữu bị xóa'
          : isKnownDeletedId
          ? `Chủ sở hữu (${rawOwnerId}) nằm trong danh sách tài khoản đã xóa`
          : `Chủ sở hữu (${rawOwnerId}) không còn tồn tại trong danh sách tài khoản hệ thống`
      });
      return;
    }

    // Không rõ trạng thái
    unclearOwnerPets.push({
      ...pet,
      auditReason: `Không rõ trạng thái chủ sở hữu (${rawOwnerId})`
    });
  });

  return {
    totalPets: allPets.length,
    confirmedDeletedOwnerPets,
    activeOwnerPets,
    unclearOwnerPets
  };
};

/**
 * THAO TÁC: DỌN DỮ LIỆU CỦA TÀI KHOẢN ĐÃ XÓA
 * Xóa dứt điểm các hồ sơ thú cưng và dữ liệu chăm sóc gắn với tài khoản đã xóa.
 * Không tự xóa hồ sơ thuộc tài khoản còn tồn tại hoặc hồ sơ thiếu ownerId.
 */
export const cleanupDeletedOwnersPets = (selectedPetIds = null) => {
  const audit = auditOrphanedPets();
  const targetPets = Array.isArray(selectedPetIds)
    ? audit.confirmedDeletedOwnerPets.filter(p => selectedPetIds.includes(p.id))
    : audit.confirmedDeletedOwnerPets;

  if (targetPets.length === 0) {
    return { success: true, count: 0, message: 'Không có hồ sơ nào của tài khoản đã xóa cần dọn dẹp.' };
  }

  const deleteIds = new Set(targetPets.map(p => p.id));
  const deleteOwnerIds = new Set(targetPets.map(p => String(p.ownerId).trim()).filter(Boolean));

  // Snapshot phục vụ Transaction Rollback
  const snapshot = {
    pets: getStored(STORAGE_KEYS.PETS, null),
    schedules: getStored(STORAGE_KEYS.SCHEDULES, null),
    expenses: getStored(STORAGE_KEYS.EXPENSES, null),
    dailyLogs: getStored(STORAGE_KEYS.DAILY_LOGS, null),
    prescriptions: getStored(STORAGE_KEYS.PRESCRIPTIONS, null),
    familyMembers: getStored(STORAGE_KEYS.FAMILY_MEMBERS, null),
    dailyHabits: getStored(STORAGE_KEYS.DAILY_HABITS, null),
    lostModes: getStored(STORAGE_KEYS.LOST_MODES, null),
    appointments: getStored(STORAGE_KEYS.APPOINTMENTS, null),
    healthData: getStored(PETS_HEALTH_STORAGE_KEY, null)
  };

  let remainingPetsCount = 0;

  try {
    // 1. Xóa hồ sơ thú cưng
    const allPets = snapshot.pets || [];
    const remainingPets = allPets.filter(p => !deleteIds.has(p.id));
    setStored(STORAGE_KEYS.PETS, remainingPets);
    remainingPetsCount = remainingPets.length;

    // 2. Xóa lịch chăm sóc
    const schedules = snapshot.schedules || [];
    const remainingSchedules = schedules.filter(s => 
      !deleteIds.has(s.petId) && (!s.ownerId || !deleteOwnerIds.has(String(s.ownerId).trim()))
    );
    setStored(STORAGE_KEYS.SCHEDULES, remainingSchedules);

    // 3. Xóa chi tiêu
    const expenses = snapshot.expenses || [];
    const remainingExpenses = expenses.filter(e => 
      !deleteIds.has(e.petId) && (!e.ownerId || !deleteOwnerIds.has(String(e.ownerId).trim()))
    );
    setStored(STORAGE_KEYS.EXPENSES, remainingExpenses);

    // 4. Xóa nhật ký hàng ngày
    const dailyLogs = snapshot.dailyLogs || [];
    const remainingDailyLogs = dailyLogs.filter(l => 
      !deleteIds.has(l.petId) && (!l.ownerId || !deleteOwnerIds.has(String(l.ownerId).trim()))
    );
    setStored(STORAGE_KEYS.DAILY_LOGS, remainingDailyLogs);

    // 5. Xóa đơn thuốc
    const prescriptions = snapshot.prescriptions || [];
    const remainingPrescriptions = prescriptions.filter(pr => 
      !deleteIds.has(pr.petId) && (!pr.ownerId || !deleteOwnerIds.has(String(pr.ownerId).trim()))
    );
    setStored(STORAGE_KEYS.PRESCRIPTIONS, remainingPrescriptions);

    // 6. Xóa thói quen hàng ngày
    const dailyHabits = snapshot.dailyHabits || [];
    const remainingHabits = dailyHabits.filter(h => 
      !deleteIds.has(h.petId) && (!h.ownerId || !deleteOwnerIds.has(String(h.ownerId).trim()))
    );
    setStored(STORAGE_KEYS.DAILY_HABITS, remainingHabits);

    // 7. Xóa thành viên gia đình
    const familyMembers = snapshot.familyMembers || [];
    const remainingFamily = familyMembers.filter(m => 
      !m.ownerId || !deleteOwnerIds.has(String(m.ownerId).trim())
    );
    setStored(STORAGE_KEYS.FAMILY_MEMBERS, remainingFamily);

    // 8. Xóa dữ liệu thất lạc
    const lostModes = snapshot.lostModes || {};
    if (typeof lostModes === 'object' && !Array.isArray(lostModes)) {
      const updatedLost = { ...lostModes };
      deleteIds.forEach(id => delete updatedLost[id]);
      setStored(STORAGE_KEYS.LOST_MODES, updatedLost);
    }

    // 9. Xóa lịch hẹn khám
    const appointments = snapshot.appointments || [];
    const remainingAppts = appointments.filter(a => !deleteIds.has(a.petId));
    setStored(STORAGE_KEYS.APPOINTMENTS, remainingAppts);

    // 10. Dọn dẹp dữ liệu cân nặng/sức khỏe
    if (snapshot.healthData && typeof snapshot.healthData === 'object') {
      const updatedHealth = { ...snapshot.healthData };
      targetPets.forEach(p => {
        const k1 = normalizePetHealthKey(p.id);
        const k2 = normalizePetHealthKey(p.name);
        delete updatedHealth[k1];
        delete updatedHealth[k2];
      });
      setStored(PETS_HEALTH_STORAGE_KEY, updatedHealth);
    }
  } catch (err) {
    console.error('Lỗi transaction khi dọn dẹp dữ liệu, khôi phục snapshot:', err);
    if (snapshot.pets !== null) setStored(STORAGE_KEYS.PETS, snapshot.pets);
    if (snapshot.schedules !== null) setStored(STORAGE_KEYS.SCHEDULES, snapshot.schedules);
    if (snapshot.expenses !== null) setStored(STORAGE_KEYS.EXPENSES, snapshot.expenses);
    if (snapshot.dailyLogs !== null) setStored(STORAGE_KEYS.DAILY_LOGS, snapshot.dailyLogs);
    if (snapshot.prescriptions !== null) setStored(STORAGE_KEYS.PRESCRIPTIONS, snapshot.prescriptions);
    if (snapshot.familyMembers !== null) setStored(STORAGE_KEYS.FAMILY_MEMBERS, snapshot.familyMembers);
    if (snapshot.dailyHabits !== null) setStored(STORAGE_KEYS.DAILY_HABITS, snapshot.dailyHabits);
    if (snapshot.lostModes !== null) setStored(STORAGE_KEYS.LOST_MODES, snapshot.lostModes);
    if (snapshot.appointments !== null) setStored(STORAGE_KEYS.APPOINTMENTS, snapshot.appointments);
    if (snapshot.healthData !== null) setStored(PETS_HEALTH_STORAGE_KEY, snapshot.healthData);
    throw err;
  }

  // Thông báo sự kiện toàn cục để Dashboard và danh sách tự cập nhật
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('petcare_data_cleaned', { detail: { count: targetPets.length } }));
  }

  return {
    success: true,
    count: targetPets.length,
    remainingCount: remainingPetsCount,
    message: `Đã dọn sạch ${targetPets.length} hồ sơ thú cưng của tài khoản đã xóa.`
  };
};

export const addPet = async (pet, autoGenerateSchedule = false, userId = null) => {
  const newPet = { ...pet, name: pet.name.trim(), weight: Number(pet.weight) || null };
  const res = await apiCreate('pets', newPet);
  await syncAllDataToCache();
  return res;
};

export const updatePet = async (updatedPet, userId = null, userRole = null) => {
  const res = await apiUpdate('pets', updatedPet.id, updatedPet);
  await syncAllDataToCache();
  return res;
};

export const deletePet = async (petId, userId = null, userRole = null) => {
  await apiDelete('pets', petId);
  await syncAllDataToCache();
  return getPets();
};

// ----------------- SCHEDULES -----------------
export const getSchedules = (userId = null, userRole = null) => {
  const data = getStored(STORAGE_KEYS.SCHEDULES, null);
  let allSchedules = data;

  if (!Array.isArray(allSchedules)) {
    allSchedules = [];
    setStored(STORAGE_KEYS.SCHEDULES, allSchedules);
  }

  if (!userId || userRole === 'system_admin') return allSchedules;

  // Lấy danh sách thú cưng mà user này có quyền truy cập
  const authorizedPets = getPets(userId, userRole);
  const authorizedPetIds = new Set(authorizedPets.map(p => p.id));

  // Lọc lịch trình thuộc về thú cưng của user hoặc do user tạo trực tiếp
  return allSchedules.filter(s => (s.petId && authorizedPetIds.has(s.petId)) || String(s.ownerId).trim() === String(userId).trim());
};

export const saveSchedules = (schedules) => {
  setStored(STORAGE_KEYS.SCHEDULES, schedules);
  return schedules;
};

export const addSchedule = async (schedule, userId = null) => {
  const res = await apiCreate('schedules', schedule);
  await syncAllDataToCache();
  return res;
};

export const addBatchSchedules = (newSchedulesList, userId = null) => {
  const schedules = getStored(STORAGE_KEYS.SCHEDULES, []);
  let targetOwnerId = userId;
  if (!targetOwnerId) {
    try {
      const activeUser = getStored('petcare_active_user', null) || getStored('petcare_current_user', null);
      if (activeUser?.id) targetOwnerId = activeUser.id;
    } catch {}
  }
  if (!targetOwnerId) {
    console.warn('addBatchSchedules: Không xác định được ownerId, bỏ qua.');
    return [];
  }
  const prepared = [];

  for (let i = 0; i < newSchedulesList.length; i++) {
    const item = newSchedulesList[i];
    // Chống trùng lặp khi áp dụng nhiều lần: kiểm tra petId, title, date
    const isDuplicate = schedules.some(s =>
      s.petId === item.petId &&
      s.title === item.title &&
      s.date === item.date &&
      !s.completed
    );
    if (!isDuplicate) {
      prepared.push({
        ...item,
        id: item.id || `sch-${Date.now()}-${i}`,
        ownerId: item.ownerId || targetOwnerId,
        completed: false,
        createdAt: new Date().toISOString()
      });
    }
  }

  const updated = [...prepared, ...schedules];
  saveSchedules(updated);
  return updated;
};

export const updateSchedule = async (updatedSchedule, userId = null, userRole = null) => {
  const res = await apiUpdate('schedules', updatedSchedule.id, updatedSchedule);
  await syncAllDataToCache();
  return res;
};

export const toggleScheduleComplete = (scheduleId, userId = null, userRole = null) => {
  const schedules = getStored(STORAGE_KEYS.SCHEDULES, []);
  const index = schedules.findIndex(s => s.id === scheduleId);
  if (index === -1) return null;

  const currentSchedule = schedules[index];
  if (userRole !== 'system_admin' && userId && currentSchedule.ownerId && currentSchedule.ownerId !== userId) {
    throw new Error('Bạn không có quyền thay đổi trạng thái lịch trình của người dùng khác.');
  }

  const isNowCompleted = !currentSchedule.completed;
  schedules[index] = {
    ...currentSchedule,
    completed: isNowCompleted,
    completedAt: isNowCompleted ? new Date().toISOString() : null
  };

  // Xử lý lịch lặp an toàn:
  // 1. Chỉ sinh lịch lặp mới nếu chưa có bản ghi lặp tiếp theo (tránh trùng khi hoàn thành -> bỏ hoàn thành -> hoàn thành lại)
  // 2. Tính toán ngày với tháng nhuận và ngày cuối tháng an toàn (clamped)
  if (isNowCompleted && currentSchedule.repeat && currentSchedule.repeat !== 'none') {
    const existingNext = currentSchedule.nextRecurrenceId
      ? schedules.find(s => s.id === currentSchedule.nextRecurrenceId)
      : schedules.find(s => s.parentScheduleId === currentSchedule.id && !s.completed);

    if (!existingNext) {
      let nextDateStr = currentSchedule.date;
      switch (currentSchedule.repeat) {
        case 'weekly':
          nextDateStr = addDaysLocal(currentSchedule.date, 7);
          break;
        case 'monthly':
          nextDateStr = addMonthsClamped(currentSchedule.date, 1);
          break;
        case 'quarterly':
          nextDateStr = addMonthsClamped(currentSchedule.date, 3);
          break;
        case 'yearly':
          nextDateStr = addYearsClamped(currentSchedule.date, 1);
          break;
        default:
          break;
      }

      const nextId = `sch-${Date.now()}-next`;
      schedules[index].nextRecurrenceId = nextId;

      const nextSchedule = {
        ...currentSchedule,
        id: nextId,
        parentScheduleId: currentSchedule.id,
        nextRecurrenceId: null,
        date: nextDateStr,
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString()
      };
      schedules.unshift(nextSchedule);
    }
  }

  saveSchedules(schedules);
  return schedules[index];
};

export const deleteSchedule = (scheduleId, userId = null, userRole = null) => {
  const schedules = getStored(STORAGE_KEYS.SCHEDULES, []);
  const target = schedules.find(s => s.id === scheduleId);
  if (!target) return schedules;

  if (userRole !== 'system_admin' && userId && target.ownerId && target.ownerId !== userId) {
    throw new Error('Bạn không có quyền xóa lịch trình của người dùng khác.');
  }

  const filtered = schedules.filter(s => s.id !== scheduleId);
  saveSchedules(filtered);
  return filtered;
};

// ----------------- EXPENSES -----------------
export const getExpenses = (userId = null, userRole = null) => {
  const data = getStored(STORAGE_KEYS.EXPENSES, null);
  let allExpenses = data;

  if (!Array.isArray(allExpenses)) {
    allExpenses = [];
    setStored(STORAGE_KEYS.EXPENSES, allExpenses);
  }

  // Đảm bảo mọi khoản chi đều có trường petName trực tiếp (tra cứu từ danh sách pets thực tế)
  let hasUpdate = false;
  const allPetsForLookup = getStored(STORAGE_KEYS.PETS, []) || [];
  const enriched = allExpenses.map(exp => {
    if (!exp.petName && exp.petId) {
      hasUpdate = true;
      const foundPet = allPetsForLookup.find(p => p.id === exp.petId);
      return { ...exp, petName: foundPet?.name || 'Thú cưng' };
    }
    return exp;
  });
  if (hasUpdate) {
    setStored(STORAGE_KEYS.EXPENSES, enriched);
    allExpenses = enriched;
  }

  if (!userId || userRole === 'system_admin') return allExpenses;

  // Lấy các thú cưng của user để lọc các khoản chi thuộc về petId của user hoặc do user tạo
  const authorizedPets = getPets(userId, userRole);
  const authorizedPetIds = new Set(authorizedPets.map(p => p.id));

  return allExpenses.filter(e => e.ownerId === userId || (e.petId && authorizedPetIds.has(e.petId)));
};

export const saveExpenses = (expenses) => {
  setStored(STORAGE_KEYS.EXPENSES, expenses);
  return expenses;
};

export const addExpense = (expense, userId = null) => {
  const expenses = getStored(STORAGE_KEYS.EXPENSES, []);
  let targetOwnerId = userId || expense.ownerId || null;
  if (!targetOwnerId) {
    try {
      const activeUser = getStored('petcare_active_user', null) || getStored('petcare_current_user', null);
      if (activeUser?.id) targetOwnerId = activeUser.id;
    } catch {}
  }

  const numericAmount = Number(expense.amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Số tiền chi tiêu phải lớn hơn 0.');
  }
  if (!expense.title || !expense.title.trim()) {
    throw new Error('Tiêu đề chi tiêu là bắt buộc.');
  }
  if (!expense.date) {
    throw new Error('Ngày chi tiêu là bắt buộc.');
  }

  // Nếu gắn với một pet cụ thể, kiểm tra pet đó thuộc quyền sở hữu
  if (expense.petId && expense.petId !== 'all') {
    const userPets = getPets(targetOwnerId);
    if (userPets.length > 0 && !userPets.some(p => p.id === expense.petId)) {
      throw new Error('Thú cưng được chọn không thuộc quyền quản lý của bạn.');
    }
  }

  // Tra cứu petName từ danh sách pets thực tế, không dùng tên cố định
  let defaultPetName = expense.petName;
  if (!defaultPetName && expense.petId && expense.petId !== 'all') {
    const petsForLookup = getStored(STORAGE_KEYS.PETS, []) || [];
    const foundPet = petsForLookup.find(p => p.id === expense.petId);
    defaultPetName = foundPet?.name || 'Thú cưng';
  } else if (!defaultPetName) {
    defaultPetName = 'Tất cả';
  }
  const newExp = {
    ...expense,
    title: expense.title.trim(),
    id: expense.id || `exp-${Date.now()}`,
    ownerId: targetOwnerId,
    petName: defaultPetName,
    amount: numericAmount,
    date: expense.date || getLocalDateString(),
    createdAt: new Date().toISOString()
  };
  const updated = [newExp, ...expenses];
  saveExpenses(updated);
  return newExp;
};

export const deleteExpense = async (id, userId = null, userRole = null) => {
  await apiDelete('expenses', id);
  await syncAllDataToCache();
  return getExpenses();
};

// ----------------- DAILY LOGS -----------------
export const getDailyLogs = (userId = null, userRole = null) => {
  const data = getStored(STORAGE_KEYS.DAILY_LOGS, null);
  let allLogs = data;

  if (!Array.isArray(allLogs)) {
    allLogs = [];
    setStored(STORAGE_KEYS.DAILY_LOGS, allLogs);
  }

  if (!userId || userRole === 'system_admin') return allLogs;

  const authorizedPets = getPets(userId, userRole);
  const authorizedPetIds = new Set(authorizedPets.map(p => p.id));
  return allLogs.filter(l => l.ownerId === userId || (l.petId && authorizedPetIds.has(l.petId)));
};

export const saveDailyLogs = (logs) => {
  setStored(STORAGE_KEYS.DAILY_LOGS, logs);
  return logs;
};

export const addDailyLog = async (log, userId = null) => {
  const res = await apiCreate('daily_logs', log);
  await syncAllDataToCache();
  return res;
};

// ----------------- PRESCRIPTIONS -----------------
export const getPrescriptions = (userId = null, userRole = null) => {
  const data = getStored(STORAGE_KEYS.PRESCRIPTIONS, null);
  let allPrescriptions = data;

  if (!Array.isArray(allPrescriptions)) {
    allPrescriptions = [];
    setStored(STORAGE_KEYS.PRESCRIPTIONS, allPrescriptions);
  }

  if (!userId || userRole === 'system_admin') return allPrescriptions;

  if (userRole === 'vet_doctor') {
    const authorizedPets = getPets(userId, userRole);
    const authorizedPetIds = new Set(authorizedPets.map(p => p.id));
    return allPrescriptions.filter(p => (p.petId && authorizedPetIds.has(p.petId)) || p.prescribedByVetId === userId);
  }

  const authorizedPets = getPets(userId, userRole);
  const authorizedPetIds = new Set(authorizedPets.map(p => p.id));
  return allPrescriptions.filter(p => p.ownerId === userId || (p.petId && authorizedPetIds.has(p.petId)));
};

export const savePrescriptions = (prescriptions) => {
  setStored(STORAGE_KEYS.PRESCRIPTIONS, prescriptions);
  return prescriptions;
};

export const addPrescription = async (pres, userId = null) => {
  const res = await apiCreate('prescriptions', pres);
  await syncAllDataToCache();
  return res;
};

export const deletePrescription = async (id, userId = null, userRole = null) => {
  await apiDelete('prescriptions', id);
  await syncAllDataToCache();
  return getPrescriptions();
};

// ----------------- FAMILY MEMBERS (Co-Parenting) -----------------
export const getFamilyMembers = (userId = null, userRole = null) => {
  const data = getStored(STORAGE_KEYS.FAMILY_MEMBERS, null);
  let allMembers = data;

  if (!Array.isArray(allMembers)) {
    allMembers = [];
    setStored(STORAGE_KEYS.FAMILY_MEMBERS, allMembers);
  }

  if (!userId || userRole === 'system_admin') return allMembers;
  return allMembers.filter(m => m.ownerId === userId);
};

export const saveFamilyMembers = (members) => {
  setStored(STORAGE_KEYS.FAMILY_MEMBERS, members);
  return members;
};

export const addFamilyMember = async (member, userId = null) => {
  const res = await apiCreate('family_members', member);
  await syncAllDataToCache();
  return res;
};

export const deleteFamilyMember = async (id, userId = null, userRole = null) => {
  await apiDelete('family_members', id);
  await syncAllDataToCache();
  return getFamilyMembers();
};

// ----------------- DAILY HABITS & STREAK -----------------
export const getDailyHabits = (userId = null, userRole = null) => {
  const data = getStored(STORAGE_KEYS.DAILY_HABITS, null);
  let habits = data;
  if (!Array.isArray(habits)) {
    habits = [];
    setStored(STORAGE_KEYS.DAILY_HABITS, habits);
  }

  // Reset completion theo từng ngày địa phương thực tế và tính streak thực tế
  const todayStr = getLocalDateString();
  const normalizedHabits = habits.map(h => {
    const completedDates = Array.isArray(h.completedDates) ? h.completedDates : (h.lastCompletedDate ? [h.lastCompletedDate] : []);
    const isCompletedToday = h.lastCompletedDate === todayStr || completedDates.includes(todayStr);
    const realStreak = calculateStreak(completedDates);
    return {
      ...h,
      completed: isCompletedToday,
      streak: realStreak,
      completedDates
    };
  });

  if (!userId || userRole === 'system_admin') return normalizedHabits;
  return normalizedHabits.filter(h => h.ownerId === userId);
};

export const saveDailyHabits = (habits) => {
  setStored(STORAGE_KEYS.DAILY_HABITS, habits);
  return habits;
};

export const toggleHabit = (habitId, memberName = 'Bạn', userId = null) => {
  const habits = getStored(STORAGE_KEYS.DAILY_HABITS, []);
  const index = habits.findIndex(h => h.id === habitId);
  if (index === -1) return null;

  const currentHabit = habits[index];
  if (userId && currentHabit.ownerId && currentHabit.ownerId !== userId) {
    throw new Error('Bạn không có quyền cập nhật thói quen của tài khoản khác.');
  }

  const todayStr = getLocalDateString();
  let completedDates = Array.isArray(currentHabit.completedDates) 
    ? [...currentHabit.completedDates] 
    : (currentHabit.lastCompletedDate ? [currentHabit.lastCompletedDate] : []);
  
  const isCurrentlyCompleted = currentHabit.lastCompletedDate === todayStr || completedDates.includes(todayStr);
  const isNowCompleted = !isCurrentlyCompleted;

  if (isNowCompleted) {
    if (!completedDates.includes(todayStr)) {
      completedDates.push(todayStr);
    }
  } else {
    completedDates = completedDates.filter(d => d !== todayStr);
  }

  const updatedStreak = calculateStreak(completedDates);

  habits[index] = {
    ...currentHabit,
    completed: isNowCompleted,
    lastCompletedDate: isNowCompleted ? todayStr : (completedDates[completedDates.length - 1] || null),
    completedDates: completedDates,
    completedBy: isNowCompleted ? memberName : null,
    completedAt: isNowCompleted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
    streak: updatedStreak
  };

  saveDailyHabits(habits);
  return habits[index];
};

export const addDailyHabit = async (habit, userId = null) => {
  const res = await apiCreate('daily_habits', habit);
  await syncAllDataToCache();
  return res;
};

export const deleteDailyHabit = async (id, userId = null, userRole = null) => {
  await apiDelete('daily_habits', id);
  await syncAllDataToCache();
  return getDailyHabits();
};

export const toggleDailyHabit = toggleHabit;

// ----------------- LOST MODE (Báo mất & Quản lý Thất Lạc) -----------------
export const getLostModes = () => {
  return getStored(STORAGE_KEYS.LOST_MODES, {});
};

export const setLostMode = (petId, isLost, details = {}) => {
  const modes = getLostModes();
  modes[petId] = {
    isLost: Boolean(isLost),
    lostDate: isLost ? (details.lostDate || new Date().toISOString().split('T')[0]) : null,
    contactPhone: details.contactPhone || '0912 345 678',
    reward: details.reward || '2.000.000 đ',
    lastSeenLocation: details.lastSeenLocation || 'Khu vực gần nhà',
    notes: details.notes || 'Bé rất nhút nhát, có thể gọi tên bé để tiếp cận nhẹ nhàng.',
    gpsAlerts: modes[petId]?.gpsAlerts || []
  };
  setStored(STORAGE_KEYS.LOST_MODES, modes);
  return modes[petId];
};

export const updatePetLostMode = (petId, lostData = {}) => {
  // Update in pets array
  const pets = getPets();
  const index = pets.findIndex(p => p.id === petId);
  if (index !== -1) {
    pets[index] = {
      ...pets[index],
      lostMode: {
        ...pets[index].lostMode,
        ...lostData
      }
    };
    savePets(pets);
  }
  // Also sync in lost modes store
  setLostMode(petId, lostData.isLost, lostData);
  return pets[index] || null;
};

export const addGpsScanAlert = (petId, coords, phone = '') => {
  const modes = getLostModes();
  if (!modes[petId]) modes[petId] = { isLost: true, gpsAlerts: [] };
  if (!modes[petId].gpsAlerts) modes[petId].gpsAlerts = [];

  modes[petId].gpsAlerts.unshift({
    id: `alert-${Date.now()}`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
    coords: coords || '21.0285° N, 105.8542° E (Hà Nội)',
    finderPhone: phone || 'Người lạ vừa quét mã vòng cổ'
  });

  setStored(STORAGE_KEYS.LOST_MODES, modes);
  return modes[petId];
};

// ----------------- AUTOMATED 3-WAY OCR PIPELINE -----------------
export const applyOcrAutoPipeline = (ocrData, petId, userId = null) => {
  if (!ocrData || !petId) {
    throw new Error('Thiếu dữ liệu OCR hoặc mã thú cưng');
  }

  const results = { scheduleAdded: null, prescriptionsAdded: [], expenseAdded: null };
  const targetOwnerId = userId || 'user_owner_demo';

  // Chuẩn hóa tên trường thống nhất giữa OCR và hệ thống lưu trữ:
  // Lịch hẹn: nextVisitDate || nextDueDate || followUpDate
  const followUpDate = ocrData.nextVisitDate || ocrData.nextDueDate || ocrData.followUpDate;
  // Ngày lập: issueDate || treatmentDate || injectedDate
  const issueDate = ocrData.issueDate || ocrData.treatmentDate || ocrData.injectedDate || getLocalDateString();
  // Chi phí: totalAmount || cost
  const totalAmount = Number(ocrData.totalAmount ?? ocrData.cost ?? 0);
  // Phòng khám & bác sĩ
  const clinic = ocrData.clinicName || ocrData.vetClinic || 'Phòng khám thú y';
  const doctor = ocrData.doctorName || ocrData.vetDoctor || 'Bác sĩ thú y';

  // 1. Tự động thêm Lịch tái khám / Tiêm nhắc lại nếu có ngày hẹn
  if (followUpDate) {
    const title = ocrData.vaccineName
      ? `Tiêm nhắc lại: ${ocrData.vaccineName}`
      : (ocrData.diagnosis ? `Tái khám: ${ocrData.diagnosis}` : 'Tái khám sức khỏe định kỳ');

    // Chống tạo lịch trùng lặp khi bấm áp dụng nhiều lần
    const existingSchedules = getSchedules(targetOwnerId);
    const isDupSchedule = existingSchedules.some(s => 
      s.petId === petId && 
      s.date === followUpDate && 
      s.title === title && 
      !s.completed
    );

    if (!isDupSchedule) {
      results.scheduleAdded = addSchedule({
        petId: petId,
        title: title,
        type: ocrData.vaccineName ? 'vaccine' : 'treatment',
        date: followUpDate,
        time: '09:00',
        location: clinic,
        notes: `Trích xuất từ hồ sơ y tế ngày ${issueDate}. Bác sĩ phụ trách: ${doctor}.`
      }, targetOwnerId);
    }
  }

  // 2. Tự động thêm Đơn thuốc vào Y Bạ
  const medicinesList = Array.isArray(ocrData.medicines) && ocrData.medicines.length > 0
    ? ocrData.medicines
    : (ocrData.medicineName ? [{ name: ocrData.medicineName, dosage: ocrData.dosage || 'Theo chỉ định bác sĩ' }] : []);

  if (medicinesList.length > 0) {
    const existingPrescriptions = getPrescriptions(targetOwnerId);
    medicinesList.forEach((med, mIdx) => {
      const medName = med.name || med.medicineName || 'Thuốc điều trị';
      const isDupMed = existingPrescriptions.some(p => 
        p.petId === petId && 
        p.medicineName === medName && 
        p.startDate === issueDate
      );

      if (!isDupMed) {
        const addedPres = addPrescription({
          petId: petId,
          medicineName: medName,
          dosage: med.dosage || ocrData.dosage || 'Theo chỉ định bác sĩ',
          startDate: issueDate,
          durationDays: Number(med.durationDays || ocrData.durationDays) || 7,
          prescribedBy: doctor,
          purpose: ocrData.diagnosis || 'Điều trị theo toa phòng khám',
          notes: `Cơ sở: ${clinic}. Đơn thuốc trích xuất từ chứng từ y tế.`
        }, targetOwnerId);
        results.prescriptionsAdded.push(addedPres);
      }
    });
  }

  // 3. Tự động ghi nhận Chi tiêu nếu có số tiền > 0
  if (totalAmount > 0) {
    const existingExpenses = getExpenses(targetOwnerId);
    const expTitle = `Chi phí y tế: ${ocrData.vaccineName || ocrData.diagnosis || 'Khám chữa bệnh'}`;
    const isDupExpense = existingExpenses.some(e => 
      e.petId === petId && 
      e.date === issueDate && 
      Number(e.amount) === totalAmount && 
      e.title === expTitle
    );

    if (!isDupExpense) {
      results.expenseAdded = addExpense({
        petId: petId,
        category: ocrData.vaccineName ? 'vaccine' : 'medical',
        title: expTitle,
        amount: totalAmount,
        date: issueDate,
        notes: `Hóa đơn tại ${clinic}. Bác sĩ phụ trách: ${doctor}.`
      }, targetOwnerId);
    }
  }

  return results;
};

// ----------------- THEME (Dark / Light) -----------------
export const getTheme = () => {
  try {
    const saved = localStorage.getItem('petcare_theme') || localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark';
  } catch {
    return 'dark';
  }
};

export const setTheme = (theme) => {
  try {
    localStorage.setItem('petcare_theme', theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const body = document.body;
      if (theme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        body?.classList.add('dark');
        body?.classList.remove('light');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        body?.classList.remove('dark');
        body?.classList.add('light');
        root.style.colorScheme = 'light';
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('petcare_theme_changed', { detail: theme }));
    }
  } catch (e) {
    console.error('Error setting theme:', e);
  }
  return theme;
};

// ----------------- EXPORT iCALENDAR (.ics) -----------------
export const generateIcsCalendar = (schedules, pets) => {
  const petMap = {};
  pets.forEach(p => { petMap[p.id] = p.name; });

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PetCare AI//Smart Pet Schedule//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  schedules.forEach(sch => {
    const petName = petMap[sch.petId] || 'Thú cưng';
    const dateFormatted = sch.date.replace(/-/g, '');
    const timeFormatted = (sch.time || '09:00').replace(':', '') + '00';
    const dtStart = `${dateFormatted}T${timeFormatted}`;

    ics.push('BEGIN:VEVENT');
    ics.push(`UID:${sch.id}@petcare.ai`);
    ics.push(`DTSTAMP:${dateFormatted}T000000Z`);
    ics.push(`DTSTART:${dtStart}`);
    ics.push(`SUMMARY:[PetCare AI] ${sch.title} (${petName})`);
    ics.push(`DESCRIPTION:${sch.notes || 'Lịch chăm sóc thú cưng định kỳ.'} - Địa điểm: ${sch.location || 'Tại nhà'}`);
    if (sch.location) {
      ics.push(`LOCATION:${sch.location}`);
    }
    ics.push('STATUS:CONFIRMED');
    ics.push('END:VEVENT');
  });

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
};

// ----------------- SETTINGS & BACKUP -----------------
export const getSettings = () => {
  const settings = getStored(STORAGE_KEYS.SETTINGS, {
    clinicPhone: '1900 6868',
    soundEnabled: true,
    omniChannel: {
      webPush: true,
      telegramBotToken: '',
      telegramChatId: '',
      zaloZnsPhone: ''
    }
  });

  // Loại bỏ hoàn toàn cấu hình cũ của Gemini
  delete settings.geminiApiKey;
  delete settings.selectedModel;

  return settings;
};

export const saveSettings = (newSettings) => {
  const current = getSettings();
  const merged = { ...current, ...newSettings };
  delete merged.geminiApiKey;
  delete merged.selectedModel;
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem('petcare_gemini_api_key');
    localStorage.removeItem('gemini_api_key');
    localStorage.removeItem('geminiApiKey');
  }

  setStored(STORAGE_KEYS.SETTINGS, merged);
  return merged;
};

// ----------------- PERSONAL BACKUP & RESTORE (SCOPED TO CURRENT USER) -----------------
export const exportUserData = (userId) => {
  if (!userId) throw new Error('Cần định danh tài khoản để xuất dữ liệu cá nhân.');
  return JSON.stringify({
    format: 'petcare_user_backup_v1',
    exportDate: new Date().toISOString(),
    userId,
    pets: getPets(userId, 'pet_owner'),
    schedules: getSchedules(userId, 'pet_owner'),
    expenses: getExpenses(userId, 'pet_owner'),
    dailyLogs: getDailyLogs(userId, 'pet_owner'),
    prescriptions: getPrescriptions(userId, 'pet_owner'),
    familyMembers: getFamilyMembers(userId, 'pet_owner'),
    dailyHabits: getDailyHabits(userId, 'pet_owner')
  }, null, 2);
};

export const importUserData = (jsonString, userId) => {
  if (!userId) throw new Error('Cần định danh tài khoản để nhập dữ liệu.');
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, message: 'Định dạng file không hợp lệ (yêu cầu JSON object)!' };
    }

    // Kiểm tra cấu trúc cơ bản
    const dataSources = parsed.data || parsed;
    
    // 1. Nhập thú cưng: Gán triệt để ownerId = userId để tránh chèn dữ liệu chéo
    if (Array.isArray(dataSources.pets)) {
      const sanitizedPets = dataSources.pets.map(p => ({
        ...p,
        id: p.id || `pet-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ownerId: userId
      }));
      // Giữ lại thú cưng của các user khác, thay thế thú cưng của user này
      const allPets = getStored(STORAGE_KEYS.PETS, []).filter(p => p.ownerId !== userId);
      savePets([...sanitizedPets, ...allPets]);
    }

    // 2. Nhập lịch trình
    if (Array.isArray(dataSources.schedules)) {
      const sanitizedSchedules = dataSources.schedules.map(s => ({
        ...s,
        id: s.id || `sch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ownerId: userId
      }));
      const allSchedules = getStored(STORAGE_KEYS.SCHEDULES, []).filter(s => s.ownerId !== userId);
      saveSchedules([...sanitizedSchedules, ...allSchedules]);
    }

    // 3. Nhập chi tiêu
    if (Array.isArray(dataSources.expenses)) {
      const sanitizedExpenses = dataSources.expenses.map(e => ({
        ...e,
        id: e.id || `exp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ownerId: userId
      }));
      const allExpenses = getStored(STORAGE_KEYS.EXPENSES, []).filter(e => e.ownerId !== userId);
      saveExpenses([...sanitizedExpenses, ...allExpenses]);
    }

    // 4. Nhập nhật ký
    if (Array.isArray(dataSources.dailyLogs)) {
      const sanitizedLogs = dataSources.dailyLogs.map(l => ({
        ...l,
        id: l.id || `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ownerId: userId
      }));
      const allLogs = getStored(STORAGE_KEYS.DAILY_LOGS, []).filter(l => l.ownerId !== userId);
      saveDailyLogs([...sanitizedLogs, ...allLogs]);
    }

    // 5. Nhập đơn thuốc
    if (Array.isArray(dataSources.prescriptions)) {
      const sanitizedPres = dataSources.prescriptions.map(p => ({
        ...p,
        id: p.id || `pres-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ownerId: userId
      }));
      const allPres = getStored(STORAGE_KEYS.PRESCRIPTIONS, []).filter(p => p.ownerId !== userId);
      savePrescriptions([...sanitizedPres, ...allPres]);
    }

    // 6. Nhập thành viên gia đình
    if (Array.isArray(dataSources.familyMembers)) {
      const sanitizedFamily = dataSources.familyMembers.map(m => ({
        ...m,
        id: m.id || `mem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ownerId: userId
      }));
      const allMembers = getStored(STORAGE_KEYS.FAMILY_MEMBERS, []).filter(m => m.ownerId !== userId);
      saveFamilyMembers([...sanitizedFamily, ...allMembers]);
    }

    // 7. Nhập thói quen
    if (Array.isArray(dataSources.dailyHabits)) {
      const sanitizedHabits = dataSources.dailyHabits.map(h => ({
        ...h,
        id: h.id || `habit-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ownerId: userId
      }));
      const allHabits = getStored(STORAGE_KEYS.DAILY_HABITS, []).filter(h => h.ownerId !== userId);
      saveDailyHabits([...sanitizedHabits, ...allHabits]);
    }

    return { success: true, message: 'Nhập dữ liệu cá nhân thành công!' };
  } catch (error) {
    return { success: false, message: `Lỗi đọc file: ${error.message}` };
  }
};

export const resetUserData = (userId) => {
  if (!userId) return;
  // CHẶN BẢO MẬT: Tuyệt đối KHÔNG dùng localStorage.clear()
  // Chỉ xóa dữ liệu thuộc về chính userId này
  const pets = getStored(STORAGE_KEYS.PETS, []).filter(p => p.ownerId !== userId);
  savePets(pets);
  const schedules = getStored(STORAGE_KEYS.SCHEDULES, []).filter(s => s.ownerId !== userId);
  saveSchedules(schedules);
  const expenses = getStored(STORAGE_KEYS.EXPENSES, []).filter(e => e.ownerId !== userId);
  saveExpenses(expenses);
  const dailyLogs = getStored(STORAGE_KEYS.DAILY_LOGS, []).filter(l => l.ownerId !== userId);
  saveDailyLogs(dailyLogs);
  const prescriptions = getStored(STORAGE_KEYS.PRESCRIPTIONS, []).filter(p => p.ownerId !== userId);
  savePrescriptions(prescriptions);
  const familyMembers = getStored(STORAGE_KEYS.FAMILY_MEMBERS, []).filter(m => m.ownerId !== userId);
  saveFamilyMembers(familyMembers);
  const dailyHabits = getStored(STORAGE_KEYS.DAILY_HABITS, []).filter(h => h.ownerId !== userId);
  saveDailyHabits(dailyHabits);
};

// ----------------- SYSTEM ADMIN BACKUP & RESTORE -----------------
export const exportSystemData = () => {
  // Lấy danh sách users nhưng ẩn mật khẩu để bảo mật
  const rawUsers = getStored('petcare_auth_users_v1', []) || [];
  const safeUsers = rawUsers.map(u => {
    const copy = { ...u };
    delete copy.password;
    return copy;
  });

  return JSON.stringify({
    format: 'petcare_system_enterprise_backup_v1',
    exportDate: new Date().toISOString(),
    users: safeUsers,
    pets: getStored(STORAGE_KEYS.PETS, []),
    schedules: getStored(STORAGE_KEYS.SCHEDULES, []),
    expenses: getStored(STORAGE_KEYS.EXPENSES, []),
    dailyLogs: getStored(STORAGE_KEYS.DAILY_LOGS, []),
    prescriptions: getStored(STORAGE_KEYS.PRESCRIPTIONS, []),
    familyMembers: getStored(STORAGE_KEYS.FAMILY_MEMBERS, []),
    dailyHabits: getStored(STORAGE_KEYS.DAILY_HABITS, []),
    appointments: getStored(STORAGE_KEYS.APPOINTMENTS, []),
    lostModes: getStored(STORAGE_KEYS.LOST_MODES, {}),
    settings: getSettings()
  }, null, 2);
};

export const importSystemData = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') {
      return { success: false, message: 'File dữ liệu không phải là JSON hợp lệ!' };
    }

    // Kiểm tra cấu trúc mảng
    if (data.pets && !Array.isArray(data.pets)) return { success: false, message: 'Trường pets không phải là mảng!' };
    if (data.schedules && !Array.isArray(data.schedules)) return { success: false, message: 'Trường schedules không phải là mảng!' };

    // Khôi phục dữ liệu
    if (Array.isArray(data.pets)) savePets(data.pets);
    if (Array.isArray(data.schedules)) saveSchedules(data.schedules);
    if (Array.isArray(data.expenses)) saveExpenses(data.expenses);
    if (Array.isArray(data.dailyLogs)) saveDailyLogs(data.dailyLogs);
    if (Array.isArray(data.prescriptions)) savePrescriptions(data.prescriptions);
    if (Array.isArray(data.familyMembers)) saveFamilyMembers(data.familyMembers);
    if (Array.isArray(data.dailyHabits)) saveDailyHabits(data.dailyHabits);
    if (Array.isArray(data.appointments)) saveActiveAppointments(data.appointments);
    if (data.lostModes && typeof data.lostModes === 'object') setStored(STORAGE_KEYS.LOST_MODES, data.lostModes);
    if (data.settings && typeof data.settings === 'object') saveSettings(data.settings);

    return { success: true, message: 'Khôi phục toàn hệ thống thành công!' };
  } catch (error) {
    return { success: false, message: `Lỗi phân tích file hệ thống: ${error.message}` };
  }
};

export const resetSystemData = () => {
  // Reset các bảng nghiệp vụ về mẫu ban đầu nhưng BẢO TOÀN toàn bộ tài khoản người dùng và phiên đăng nhập
  savePets([]);
  saveSchedules([]);
  saveExpenses([]);
  saveDailyLogs([]);
  savePrescriptions([]);
  saveFamilyMembers([]);
  saveDailyHabits([]);
  saveActiveAppointments([]);
};

// Giữ tương thích ngược với các component cũ
export const exportAllData = exportSystemData;
export const importAllData = importSystemData;
export const resetToDefaultData = resetSystemData;

// ----------------- VET APPOINTMENTS (ĐẶT LỊCH KHÁM 2 CHIỀU) -----------------
const _getTodayIsoDate = () => new Date().toLocaleDateString('en-CA');
const _getTomorrowIsoDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-CA');
};

export const INITIAL_APPOINTMENTS = [];

export const SHARED_APPOINTMENTS_KEY = 'petcare_shared_appointments';
export const ACTIVE_APPOINTMENTS_KEY = 'petcare_active_appointments';

export const getActiveAppointments = () => {
  let appointments = null;
  try {
    const raw = localStorage.getItem(SHARED_APPOINTMENTS_KEY) || 
                localStorage.getItem(ACTIVE_APPOINTMENTS_KEY) || 
                localStorage.getItem('petcare_appointments') || 
                localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (raw) {
      appointments = JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading active appointments:', e);
  }

  // Danh sách rỗng hoặc null là trạng thái hoàn toàn hợp lệ - KHÔNG khôi phục dữ liệu mẫu
  if (!Array.isArray(appointments)) {
    appointments = [];
  }

  if (appointments.length > 0) {
    // Dedup đơn giản theo ID và signature, không nhắm vào tên cố định
    let hasNormalization = false;
    const seenIds = new Set();
    const seenSignatures = new Set();
    const cleanList = [];
    const todayDateStr = _getTodayIsoDate();

    for (const a of appointments) {
      if (!a) continue;
      const pName = String(a.petName || '').toLowerCase().trim();
      const srv = String(a.service || a.title || '').toLowerCase().trim();
      const d = String(a.date || '').split('T')[0];
      const t = String(a.time || '').trim();

      const idKey = a.id ? String(a.id) : null;
      const sigKey = `${pName}__${d}__${t}__${srv}`;

      if ((idKey && seenIds.has(idKey)) || seenSignatures.has(sigKey)) {
        hasNormalization = true;
        continue;
      }

      if (idKey) seenIds.add(idKey);
      seenSignatures.add(sigKey);
      cleanList.push(a);
    }

    // Chuẩn hóa trạng thái (pending, in_progress, overdue, completed):
    appointments = cleanList.map(a => {
      let updatedItem = { ...a };
      const s = String(a.status || '').toLowerCase().trim();
      const aDate = a.date ? String(a.date).split('T')[0] : '';
      const isDone = Boolean(a.completed) || s === 'completed' || s === 'hoàn thành' || s === 'đã khám';

      if (isDone) {
        updatedItem.status = 'completed';
        updatedItem.completed = true;
      } else if (aDate && aDate < todayDateStr) {
        updatedItem.status = 'overdue';
        updatedItem.completed = false;
      } else if (s === 'chờ tiếp nhận' || s === 'chờ duyệt' || !a.status || s === 'pending') {
        updatedItem.status = 'pending';
      } else if (s === 'đang khám' || s === 'đã duyệt' || s === 'in_progress') {
        updatedItem.status = 'in_progress';
      }

      return updatedItem;
    });

    if (hasNormalization) {
      saveActiveAppointments(appointments);
    }
  }

  return appointments;
};

export const saveActiveAppointments = (appointments) => {
  try {
    localStorage.setItem(SHARED_APPOINTMENTS_KEY, JSON.stringify(appointments));
    localStorage.setItem(ACTIVE_APPOINTMENTS_KEY, JSON.stringify(appointments));
    localStorage.setItem('petcare_appointments', JSON.stringify(appointments));
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appointments));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('petcare_appointments_updated', { detail: appointments }));
    }
  } catch (e) {
    console.error('Error saving active appointments:', e);
  }
  return appointments;
};

export const getAppointments = (userId = null, userRole = null) => {
  const all = getActiveAppointments();
  if (!userId || userRole === 'system_admin') return all;
  if (userRole === 'vet_doctor') {
    // Bác sĩ chỉ xem được các ca được phân công qua assignedVetId
    return all.filter(a => String(a.assignedVetId).trim() === String(userId).trim());
  }
  // Chủ nuôi chỉ xem lịch hẹn của chính mình, lọc bằng ownerId thực tế
  return all.filter(a => String(a.ownerId).trim() === String(userId).trim());
};
export const saveAppointments = saveActiveAppointments;

export const addActiveAppointment = (appointmentData, userId = null) => {
  const current = getActiveAppointments();
  let targetOwnerId = userId || appointmentData.ownerId || null;
  if (!targetOwnerId) {
    try {
      const activeUser = getStored('petcare_active_user', null) || getStored('petcare_current_user', null);
      if (activeUser?.id) targetOwnerId = activeUser.id;
    } catch {}
  }
  const newAppointment = {
    id: appointmentData.id || `BK-${Date.now()}`,
    ownerId: targetOwnerId,
    petId: appointmentData.petId || '',
    petName: appointmentData.petName || 'Thú cưng',
    petType: appointmentData.petType || 'Chưa rõ loài',
    ownerName: appointmentData.ownerName || 'Chủ nuôi',
    phone: appointmentData.phone || '',
    service: appointmentData.service || 'Khám lâm sàng',
    facility: appointmentData.facility || 'Chi nhánh Cầu Giấy (Phòng khám 02)',
    date: appointmentData.date || new Date().toISOString().split('T')[0],
    time: appointmentData.time || '09:00',
    note: appointmentData.note || '',
    status: appointmentData.status || 'pending', // Mặc định 'pending' (Chờ tiếp nhận)
    assignedVet: appointmentData.assignedVet || 'Đang xếp lịch',
    adminNote: appointmentData.adminNote || '',
    isEmergency: Boolean(appointmentData.isEmergency || (appointmentData.service || '').includes('Cấp cứu')),
    createdAt: new Date().toISOString()
  };

  // Tránh trùng lặp khi bấm nhiều lần liên tiếp cùng nội dung
  const duplicateIndex = current.findIndex(a => 
    a.id === newAppointment.id || 
    (a.petName?.toLowerCase() === newAppointment.petName?.toLowerCase() &&
     a.service?.toLowerCase() === newAppointment.service?.toLowerCase() &&
     String(a.date).split('T')[0] === String(newAppointment.date).split('T')[0] &&
     a.time === newAppointment.time)
  );
  if (duplicateIndex !== -1) {
    current[duplicateIndex] = { ...current[duplicateIndex], ...newAppointment };
    saveActiveAppointments(current);
    return current[duplicateIndex];
  }

  const filtered = current.filter(a => a.id !== newAppointment.id);
  const updated = [newAppointment, ...filtered];
  saveActiveAppointments(updated);
  return newAppointment;
};

export const addAppointment = addActiveAppointment;

export const updateAppointment = (appointmentId, updates) => {
  const current = getAppointments();
  const updated = current.map(item => {
    if (item.id === appointmentId) {
      return {
        ...item,
        ...updates,
        updatedAt: new Date().toISOString()
      };
    }
    return item;
  });
  saveAppointments(updated);
  return updated.find(a => a.id === appointmentId);
};

export const deleteAppointment = async (appointmentId) => {
  await apiDelete('appointments', appointmentId);
  await syncAllDataToCache();
  return getAppointments();
};

// ----------------- DỊCH TỄ HỌC 2 CHIỀU (EPIDEMIC ALERT) -----------------
export const EPIDEMIC_ALERT_KEY = 'petcare_active_epidemic';

export const getActiveEpidemicAlert = () => {
  try {
    const raw = localStorage.getItem(EPIDEMIC_ALERT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading epidemic alert:', e);
  }
  // Không có cảnh báo dịch tễ thì trả null, không tự tạo dữ liệu mẫu
  return null;
};

export const saveActiveEpidemicAlert = (alertData) => {
  try {
    localStorage.setItem(EPIDEMIC_ALERT_KEY, JSON.stringify(alertData));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('petcare_epidemic_updated', { detail: alertData }));
    }
  } catch (e) {
    console.error('Error saving epidemic alert:', e);
  }
  return alertData;
};

// ----------------- HEALTH & WEIGHT TRACKER (ĐỒNG BỘ 2 CHIỀU) -----------------
export const PETS_HEALTH_STORAGE_KEY = 'petcare_pets_health_data';
export const WEIGHT_TRACKER_STORAGE_KEY = 'petcare_weight_tracker_histories';

// Hàm chuẩn hóa key sức khỏe: trả về chính petId thực tế, KHÔNG ánh xạ sang mochi/luna/banhbao
export const normalizePetHealthKey = (idOrName) => {
  if (!idOrName) return '';
  return String(idOrName).trim();
};

export const getPetsHealthData = () => {
  try {
    const raw = localStorage.getItem(PETS_HEALTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Lỗi đọc pets health data:', err);
  }
  // Không có dữ liệu → trả object rỗng, KHÔNG tạo dữ liệu mẫu
  return {};
};

export const savePetsHealthData = (data, shouldNotify = true) => {
  try {
    localStorage.setItem(PETS_HEALTH_STORAGE_KEY, JSON.stringify(data));

    // Đồng bộ cân nặng vào danh sách PETS (STORAGE_KEYS.PETS) theo petId thực tế
    try {
      const rawPets = localStorage.getItem('petcare_pets_v1');
      if (rawPets) {
        const petsList = JSON.parse(rawPets);
        if (Array.isArray(petsList)) {
          let hasChange = false;
          const updatedPets = petsList.map(p => {
            // Dùng p.id trực tiếp làm key, không ánh xạ qua tên
            const petKey = p.id;
            if (petKey && data[petKey] && data[petKey].weight != null) {
              if (p.weight !== data[petKey].weight) {
                hasChange = true;
                return { ...p, weight: data[petKey].weight };
              }
            }
            return p;
          });
          if (hasChange) {
            localStorage.setItem('petcare_pets_v1', JSON.stringify(updatedPets));
          }
        }
      }
    } catch {}

    // Kích hoạt sự kiện toàn cục để Dashboard và Schedule tự động cập nhật
    if (shouldNotify && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('petcare_weight_updated', { detail: data }));
    }
  } catch (err) {
    console.error('Lỗi lưu pets health data:', err);
  }
  return data;
};

export const updatePetWeight = (petId, newWeight, note = '') => {
  if (!petId) return getPetsHealthData();
  const key = String(petId).trim();

  // Kiểm tra quyền (ownerId)
  let activeUser = null;
  try {
    activeUser = getStored('petcare_active_user', null) || getStored('petcare_current_user', null);
  } catch {}
  if (activeUser && activeUser.role !== 'system_admin' && activeUser.role !== 'vet_doctor') {
    const userPets = getPets(activeUser.id, activeUser.role);
    if (!userPets.some(p => p.id === key)) {
      console.warn('Unauthorized attempt to update weight for pet:', key);
      return getPetsHealthData();
    }
  }

  const data = getPetsHealthData();
  const petData = data[key] ? { ...data[key] } : { petId: key, weight: null, weightHistory: [] };
  const numWeight = parseFloat(newWeight);

  if (isNaN(numWeight) || numWeight <= 0) return data;

  petData.weight = numWeight;

  const history = Array.isArray(petData.weightHistory) ? [...petData.weightHistory] : [];
  const now = new Date();
  const todayFull = now.toISOString();
  const todayDateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  const idStr = `w-${Date.now()}`;

  // Luôn THÊM bản ghi mới có ngày đo đầy đủ
  history.push({
    id: idStr,
    weight: numWeight,
    date: todayDateStr,
    fullDate: todayFull,
    note: note || ''
  });

  petData.weightHistory = history;
  data[key] = petData;

  savePetsHealthData(data);
  return data;
};

// ----------------- MIGRATION: XÓA SẠCH DỮ LIỆU MẪU CŨ -----------------
(function runDataMigration() {
  try {
    const MIGRATION_FLAG = 'petcare_migration_v3_clean_mock';
    if (typeof localStorage !== 'undefined' && !localStorage.getItem(MIGRATION_FLAG)) {
      // 1. Dọn dẹp Pets mẫu
      let allPets = getStored(STORAGE_KEYS.PETS, []);
      if (Array.isArray(allPets)) {
        const mockPetIds = ['pet-1', 'pet-2', 'pet-3'];
        const cleanPets = allPets.filter(p => !mockPetIds.includes(p.id) && !p.isSample);
        if (cleanPets.length !== allPets.length) {
          setStored(STORAGE_KEYS.PETS, cleanPets);
        }
      }

      // 2. Dọn dẹp Lịch hẹn / Lịch trình mẫu
      const mockApptIds = ['app-1', 'app-2', 'app-3', 'app-4', 'app-5'];
      let allAppts = getStored(STORAGE_KEYS.APPOINTMENTS, []);
      if (Array.isArray(allAppts)) {
        const cleanAppts = allAppts.filter(a => !mockApptIds.includes(a.id));
        setStored(STORAGE_KEYS.APPOINTMENTS, cleanAppts);
      }

      let allSchedules = getStored(STORAGE_KEYS.SCHEDULES, []);
      if (Array.isArray(allSchedules)) {
        const cleanSchedules = allSchedules.filter(s => s.petId && !['pet-1', 'pet-2', 'pet-3'].includes(s.petId));
        setStored(STORAGE_KEYS.SCHEDULES, cleanSchedules);
      }

      // 3. Dọn dẹp sức khỏe mẫu
      try {
        const rawHealth = localStorage.getItem(PETS_HEALTH_STORAGE_KEY);
        if (rawHealth) {
          const healthData = JSON.parse(rawHealth);
          let changed = false;
          ['mochi', 'luna', 'banhbao', 'bánh bao', 'pet-1', 'pet-2', 'pet-3'].forEach(k => {
            if (healthData[k]) {
              delete healthData[k];
              changed = true;
            }
          });
          if (changed) {
            localStorage.setItem(PETS_HEALTH_STORAGE_KEY, JSON.stringify(healthData));
          }
        }
      } catch {}

      localStorage.setItem(MIGRATION_FLAG, 'true');
      console.log('[Migration] Đã xóa sạch dữ liệu mẫu thành công.');
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
})();
