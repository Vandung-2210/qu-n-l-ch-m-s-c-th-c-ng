import { 
  INITIAL_PETS, 
  INITIAL_SCHEDULES, 
  INITIAL_EXPENSES, 
  INITIAL_DAILY_LOGS, 
  INITIAL_PRESCRIPTIONS,
  INITIAL_FAMILY_MEMBERS,
  INITIAL_DAILY_HABITS
} from '../constants/mockData';
import { generateAiCarePlan } from './aiService';

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

// ----------------- PETS -----------------
// ----------------- PETS -----------------
export const getPets = (userId = null) => {
  const data = getStored(STORAGE_KEYS.PETS, null);
  let allPets = data;
  if (!allPets || !Array.isArray(allPets) || allPets.length === 0) {
    allPets = INITIAL_PETS.map(p => ({ ...p, ownerId: 'user_tester_pro' }));
    setStored(STORAGE_KEYS.PETS, allPets);
    return allPets;
  }
  if (!userId) return allPets;
  const filtered = allPets.filter(p => {
    const owner = p.ownerId || 'user_tester_pro';
    return owner === userId || ((userId === 'user_tester_pro' || userId === 'user_demo_01') && (owner === 'user_demo_01' || owner === 'user_tester_pro'));
  });
  if (filtered.length === 0) {
    const userDefaultPets = INITIAL_PETS.map(p => ({ ...p, id: `${userId}-${p.id}`, ownerId: userId }));
    const merged = [...userDefaultPets, ...allPets];
    setStored(STORAGE_KEYS.PETS, merged);
    return userDefaultPets;
  }
  return filtered;
};

export const savePets = (pets) => {
  setStored(STORAGE_KEYS.PETS, pets);
  return pets;
};

export const addPet = (pet, autoGenerateSchedule = true, userId = null) => {
  const pets = getStored(STORAGE_KEYS.PETS, INITIAL_PETS);
  const newPet = {
    ...pet,
    id: pet.id || `pet-${Date.now()}`,
    ownerId: userId || pet.ownerId || 'user_demo_01',
    createdAt: new Date().toISOString(),
    weightHistory: pet.weightHistory || (pet.weight ? [{ date: new Date().toISOString().split('T')[0], weight: Number(pet.weight) }] : [])
  };
  const updated = [newPet, ...pets];
  savePets(updated);

  // Tự động sinh lịch trình trọn đời nếu được bật
  if (autoGenerateSchedule) {
    try {
      const generatedCarePlan = generateAiCarePlan(newPet);
      if (generatedCarePlan && generatedCarePlan.length > 0) {
        addBatchSchedules(generatedCarePlan.map(item => ({ ...item, petId: newPet.id })));
      }
    } catch (e) {
      console.warn('Auto schedule generation skipped:', e);
    }
  }

  return newPet;
};

export const updatePet = (updatedPet) => {
  const pets = getStored(STORAGE_KEYS.PETS, INITIAL_PETS);
  const index = pets.findIndex(p => p.id === updatedPet.id);
  if (index !== -1) {
    pets[index] = { ...pets[index], ...updatedPet };
    savePets(pets);
    return pets[index];
  }
  return null;
};

export const deletePet = (petId) => {
  const pets = getStored(STORAGE_KEYS.PETS, INITIAL_PETS).filter(p => p.id !== petId);
  savePets(pets);
  // Đồng thời xóa các dữ liệu liên quan
  const schedules = getSchedules().filter(s => s.petId !== petId);
  saveSchedules(schedules);
  const expenses = getExpenses().filter(e => e.petId !== petId);
  saveExpenses(expenses);
  const prescriptions = getPrescriptions().filter(p => p.petId !== petId);
  savePrescriptions(prescriptions);
  const habits = getDailyHabits().filter(h => h.petId !== petId);
  saveDailyHabits(habits);
  return pets;
};

// ----------------- SCHEDULES -----------------
export const getSchedules = (userId = null) => {
  const data = getStored(STORAGE_KEYS.SCHEDULES, null);
  let allSchedules = data;
  if (!allSchedules || !Array.isArray(allSchedules) || allSchedules.length === 0) {
    setStored(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
    allSchedules = INITIAL_SCHEDULES;
  }
  // Sửa triệt để các dữ liệu có năm 2099, 2098 hoặc năm viễn tưởng thành tháng 09/2026
  let hasCorrection = false;
  allSchedules = allSchedules.map((s, idx) => {
    if (!s || !s.date) return s;
    const dateStr = String(s.date).split('T')[0];
    const yr = new Date(dateStr).getFullYear();
    if (dateStr.includes('2099') || dateStr.includes('2098') || yr >= 2028 || yr < 2024) {
      hasCorrection = true;
      const day = 24 + (idx % 7);
      const dayFormatted = day < 10 ? `0${day}` : `${day}`;
      return {
        ...s,
        date: `2026-09-${dayFormatted}`
      };
    }
    return s;
  }).filter(Boolean);

  if (allSchedules.length === 0) {
    allSchedules = INITIAL_SCHEDULES;
    hasCorrection = true;
  }
  if (hasCorrection || !data) {
    setStored(STORAGE_KEYS.SCHEDULES, allSchedules);
  }

  if (!userId) return allSchedules;
  const userPetIds = new Set(getPets(userId).map(p => p.id));
  const filtered = allSchedules.filter(s => userPetIds.has(s.petId));
  if (filtered.length === 0 && (userId === 'user_tester_pro' || userId === 'user_demo_01')) {
    return allSchedules;
  }
  return filtered;
};

export const saveSchedules = (schedules) => {
  setStored(STORAGE_KEYS.SCHEDULES, schedules);
  return schedules;
};

export const addSchedule = (schedule) => {
  const schedules = getStored(STORAGE_KEYS.SCHEDULES, INITIAL_SCHEDULES);
  const newSchedule = {
    ...schedule,
    id: schedule.id || `sch-${Date.now()}`,
    completed: false,
    createdAt: new Date().toISOString()
  };
  const updated = [newSchedule, ...schedules];
  saveSchedules(updated);
  return newSchedule;
};

export const addBatchSchedules = (newSchedulesList) => {
  const schedules = getSchedules();
  const prepared = newSchedulesList.map((item, index) => ({
    ...item,
    id: item.id || `sch-${Date.now()}-${index}`,
    completed: false,
    createdAt: new Date().toISOString()
  }));
  const updated = [...prepared, ...schedules];
  saveSchedules(updated);
  return updated;
};

export const updateSchedule = (updatedSchedule) => {
  const schedules = getSchedules();
  const index = schedules.findIndex(s => s.id === updatedSchedule.id);
  if (index !== -1) {
    schedules[index] = { ...schedules[index], ...updatedSchedule };
    saveSchedules(schedules);
    return schedules[index];
  }
  return null;
};

export const toggleScheduleComplete = (scheduleId) => {
  const schedules = getSchedules();
  const index = schedules.findIndex(s => s.id === scheduleId);
  if (index !== -1) {
    const isNowCompleted = !schedules[index].completed;
    schedules[index] = {
      ...schedules[index],
      completed: isNowCompleted,
      completedAt: isNowCompleted ? new Date().toISOString() : null
    };

    if (isNowCompleted && schedules[index].repeat && schedules[index].repeat !== 'none') {
      const currentDate = new Date(schedules[index].date);
      const nextDate = new Date(currentDate);

      switch (schedules[index].repeat) {
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextDate.setMonth(nextDate.getMonth() + 3);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
        default:
          break;
      }

      const nextSchedule = {
        ...schedules[index],
        id: `sch-${Date.now()}-next`,
        date: nextDate.toISOString().split('T')[0],
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString()
      };
      schedules.unshift(nextSchedule);
    }

    saveSchedules(schedules);
    return schedules[index];
  }
  return null;
};

export const deleteSchedule = (scheduleId) => {
  const schedules = getSchedules().filter(s => s.id !== scheduleId);
  saveSchedules(schedules);
  return schedules;
};

// ----------------- EXPENSES -----------------
export const getExpenses = () => {
  const data = getStored(STORAGE_KEYS.EXPENSES, null);
  if (!data || !Array.isArray(data) || data.length === 0) {
    setStored(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    return INITIAL_EXPENSES;
  }
  // Đảm bảo mọi khoản chi đều có trường petName trực tiếp
  let hasUpdate = false;
  const enriched = data.map(exp => {
    if (!exp.petName) {
      hasUpdate = true;
      const mappedName = exp.petId === 'pet-1' ? 'Mochi' :
                         exp.petId === 'pet-2' ? 'Luna' :
                         exp.petId === 'pet-3' ? 'Bánh Bao' : 'Tất cả';
      return { ...exp, petName: mappedName };
    }
    return exp;
  });
  if (hasUpdate) {
    setStored(STORAGE_KEYS.EXPENSES, enriched);
  }
  return enriched;
};

export const saveExpenses = (expenses) => {
  setStored(STORAGE_KEYS.EXPENSES, expenses);
  return expenses;
};

export const addExpense = (expense) => {
  const expenses = getExpenses();
  const defaultPetName = expense.petName || (
    expense.petId === 'pet-1' ? 'Mochi' :
    expense.petId === 'pet-2' ? 'Luna' :
    expense.petId === 'pet-3' ? 'Bánh Bao' : 'Tất cả'
  );
  const newExp = {
    ...expense,
    id: expense.id || `exp-${Date.now()}`,
    petName: defaultPetName,
    amount: Number(expense.amount) || 0,
    createdAt: new Date().toISOString()
  };
  const updated = [newExp, ...expenses];
  saveExpenses(updated);
  return newExp;
};

export const deleteExpense = (id) => {
  const expenses = getExpenses().filter(e => e.id !== id);
  saveExpenses(expenses);
  return expenses;
};

// ----------------- DAILY LOGS -----------------
export const getDailyLogs = () => {
  const data = getStored(STORAGE_KEYS.DAILY_LOGS, null);
  if (!data || !Array.isArray(data)) {
    setStored(STORAGE_KEYS.DAILY_LOGS, INITIAL_DAILY_LOGS);
    return INITIAL_DAILY_LOGS;
  }
  return data;
};

export const saveDailyLogs = (logs) => {
  setStored(STORAGE_KEYS.DAILY_LOGS, logs);
  return logs;
};

export const addDailyLog = (log) => {
  const logs = getDailyLogs();
  const newLog = {
    ...log,
    id: log.id || `log-${Date.now()}`,
    date: log.date || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };
  const updated = [newLog, ...logs];
  saveDailyLogs(updated);
  return newLog;
};

// ----------------- PRESCRIPTIONS -----------------
export const getPrescriptions = () => {
  const data = getStored(STORAGE_KEYS.PRESCRIPTIONS, null);
  if (!data || !Array.isArray(data)) {
    setStored(STORAGE_KEYS.PRESCRIPTIONS, INITIAL_PRESCRIPTIONS);
    return INITIAL_PRESCRIPTIONS;
  }
  return data;
};

export const savePrescriptions = (prescriptions) => {
  setStored(STORAGE_KEYS.PRESCRIPTIONS, prescriptions);
  return prescriptions;
};

export const addPrescription = (pres) => {
  const list = getPrescriptions();
  const newPres = {
    ...pres,
    id: pres.id || `pres-${Date.now()}`,
    durationDays: Number(pres.durationDays) || 7,
    createdAt: new Date().toISOString()
  };
  const updated = [newPres, ...list];
  savePrescriptions(updated);
  return newPres;
};

export const deletePrescription = (id) => {
  const list = getPrescriptions().filter(p => p.id !== id);
  savePrescriptions(list);
  return list;
};

// ----------------- FAMILY MEMBERS (Co-Parenting) -----------------
export const getFamilyMembers = () => {
  const data = getStored(STORAGE_KEYS.FAMILY_MEMBERS, null);
  if (!data || !Array.isArray(data)) {
    setStored(STORAGE_KEYS.FAMILY_MEMBERS, INITIAL_FAMILY_MEMBERS);
    return INITIAL_FAMILY_MEMBERS;
  }
  return data;
};

export const saveFamilyMembers = (members) => {
  setStored(STORAGE_KEYS.FAMILY_MEMBERS, members);
  return members;
};

export const addFamilyMember = (member) => {
  const members = getFamilyMembers();
  const newMember = {
    ...member,
    id: member.id || `mem-${Date.now()}`,
    avatar: member.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'
  };
  const updated = [...members, newMember];
  saveFamilyMembers(updated);
  return newMember;
};

export const deleteFamilyMember = (id) => {
  const members = getFamilyMembers().filter(m => m.id !== id);
  saveFamilyMembers(members);
  return members;
};

// ----------------- DAILY HABITS & STREAK -----------------
export const getDailyHabits = () => {
  const data = getStored(STORAGE_KEYS.DAILY_HABITS, null);
  if (!data || !Array.isArray(data)) {
    setStored(STORAGE_KEYS.DAILY_HABITS, INITIAL_DAILY_HABITS);
    return INITIAL_DAILY_HABITS;
  }
  return data;
};

export const saveDailyHabits = (habits) => {
  setStored(STORAGE_KEYS.DAILY_HABITS, habits);
  return habits;
};

export const toggleHabit = (habitId, memberName = 'Bạn') => {
  const habits = getDailyHabits();
  const index = habits.findIndex(h => h.id === habitId);
  if (index !== -1) {
    const isNowCompleted = !habits[index].completed;
    const currentStreak = Number(habits[index].streak) || 10;
    
    habits[index] = {
      ...habits[index],
      completed: isNowCompleted,
      completedBy: isNowCompleted ? memberName : null,
      completedAt: isNowCompleted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
      streak: isNowCompleted ? currentStreak + 1 : Math.max(0, currentStreak - 1)
    };

    saveDailyHabits(habits);
    return habits[index];
  }
  return null;
};

export const addDailyHabit = (habit) => {
  const habits = getDailyHabits();
  const newHabit = {
    ...habit,
    id: habit.id || `habit-${Date.now()}`,
    completed: false,
    completedBy: null,
    completedAt: null,
    streak: 1
  };
  const updated = [newHabit, ...habits];
  saveDailyHabits(updated);
  return newHabit;
};

export const deleteDailyHabit = (id) => {
  const habits = getDailyHabits().filter(h => h.id !== id);
  saveDailyHabits(habits);
  return habits;
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
export const applyOcrAutoPipeline = (ocrData, petId) => {
  const results = { scheduleAdded: null, prescriptionAdded: null, expenseAdded: null };

  // 1. Tự động thêm Lịch tái khám
  if (ocrData.nextVisitDate && ocrData.vaccineName) {
    results.scheduleAdded = addSchedule({
      petId: petId,
      title: `Tiêm nhắc lại: ${ocrData.vaccineName}`,
      type: 'vaccine',
      date: ocrData.nextVisitDate,
      time: '09:00',
      location: ocrData.clinicName || 'Phòng khám thú y',
      notes: `Tự động trích xuất từ sổ tiêm/hóa đơn ngày ${ocrData.issueDate || 'gần nhất'}.`
    });
  }

  // 2. Tự động thêm Đơn thuốc vào Y Bạ
  if (ocrData.medicineName) {
    results.prescriptionAdded = addPrescription({
      petId: petId,
      medicineName: ocrData.medicineName,
      dosage: ocrData.dosage || 'Theo chỉ định bác sĩ',
      startDate: ocrData.issueDate || new Date().toISOString().split('T')[0],
      durationDays: Number(ocrData.durationDays) || 7,
      prescribedBy: ocrData.doctorName || ocrData.clinicName || 'Bác sĩ thú y',
      purpose: ocrData.diagnosis || 'Điều trị theo toa phòng khám',
      notes: 'Trích xuất tự động qua AI Vision OCR.'
    });
  }

  // 3. Tự động ghi nhận Chi tiêu
  if (ocrData.totalAmount && Number(ocrData.totalAmount) > 0) {
    results.expenseAdded = addExpense({
      petId: petId,
      category: ocrData.vaccineName ? 'vaccine' : 'medical',
      title: `Chi phí khám/thuốc: ${ocrData.vaccineName || ocrData.medicineName || 'Phòng khám thú y'}`,
      amount: Number(ocrData.totalAmount),
      date: ocrData.issueDate || new Date().toISOString().split('T')[0],
      notes: `Hóa đơn tại ${ocrData.clinicName || 'Cơ sở thú y'}`
    });
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
    geminiApiKey: '',
    selectedModel: 'gemini-1.5-flash',
    clinicPhone: '1900 6868',
    soundEnabled: true,
    omniChannel: {
      webPush: true,
      telegramBotToken: '',
      telegramChatId: '',
      zaloZnsPhone: ''
    }
  });

  // Đồng bộ hai chiều với localStorage['petcare_gemini_api_key'] & ['gemini_api_key']
  if (typeof window !== 'undefined') {
    const rawKey = localStorage.getItem('petcare_gemini_api_key') || localStorage.getItem('gemini_api_key') || localStorage.getItem('geminiApiKey') || '';
    if (rawKey && !settings.geminiApiKey) {
      settings.geminiApiKey = rawKey.trim();
    }
  }

  return settings;
};

export const saveSettings = (newSettings) => {
  const current = getSettings();
  const merged = { ...current, ...newSettings };
  if (merged.geminiApiKey !== undefined && typeof window !== 'undefined') {
    const cleanKey = (merged.geminiApiKey || '').trim();
    localStorage.setItem('petcare_gemini_api_key', cleanKey);
    localStorage.setItem('gemini_api_key', cleanKey);
  }
  setStored(STORAGE_KEYS.SETTINGS, merged);
  return merged;
};

export const exportAllData = () => {
  return JSON.stringify({
    version: '3.0-enterprise',
    exportDate: new Date().toISOString(),
    pets: getPets(),
    schedules: getSchedules(),
    expenses: getExpenses(),
    dailyLogs: getDailyLogs(),
    prescriptions: getPrescriptions(),
    familyMembers: getFamilyMembers(),
    dailyHabits: getDailyHabits(),
    lostModes: getLostModes(),
    settings: getSettings()
  }, null, 2);
};

export const importAllData = (jsonString) => {
  try {
    const data = JSON.parse(jsonString);
    if (data.pets && Array.isArray(data.pets)) savePets(data.pets);
    if (data.schedules && Array.isArray(data.schedules)) saveSchedules(data.schedules);
    if (data.expenses && Array.isArray(data.expenses)) saveExpenses(data.expenses);
    if (data.dailyLogs && Array.isArray(data.dailyLogs)) saveDailyLogs(data.dailyLogs);
    if (data.prescriptions && Array.isArray(data.prescriptions)) savePrescriptions(data.prescriptions);
    if (data.familyMembers && Array.isArray(data.familyMembers)) saveFamilyMembers(data.familyMembers);
    if (data.dailyHabits && Array.isArray(data.dailyHabits)) saveDailyHabits(data.dailyHabits);
    if (data.lostModes) setStored(STORAGE_KEYS.LOST_MODES, data.lostModes);
    if (data.settings) saveSettings(data.settings);
    return { success: true, message: 'Nhập toàn bộ dữ liệu thành công!' };
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, message: 'File dữ liệu không hợp lệ!' };
  }
};

export const resetToDefaultData = () => {
  localStorage.clear();
  savePets(INITIAL_PETS);
  saveSchedules(INITIAL_SCHEDULES);
  saveExpenses(INITIAL_EXPENSES);
  saveDailyLogs(INITIAL_DAILY_LOGS);
  savePrescriptions(INITIAL_PRESCRIPTIONS);
  saveFamilyMembers(INITIAL_FAMILY_MEMBERS);
  saveDailyHabits(INITIAL_DAILY_HABITS);
};

// ----------------- VET APPOINTMENTS (ĐẶT LỊCH KHÁM 2 CHIỀU) -----------------
const _getTodayIsoDate = () => new Date().toLocaleDateString('en-CA');
const _getTomorrowIsoDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('en-CA');
};

export const INITIAL_APPOINTMENTS = [
  {
    id: 'BK-1727250003',
    petId: 'pet-3',
    petName: 'Bánh Bao',
    petType: 'Thỏ Kiểng Minilop',
    ownerName: 'Trần Minh Đức',
    phone: '0933888999',
    service: 'Cấp cứu tiêu hóa / Ngộ độc cấp (Sốc, nôn dịch vàng)',
    facility: 'Chi nhánh Cầu Giấy (Phòng khám 02)',
    date: _getTodayIsoDate(),
    time: '16:30',
    note: 'Bé sốc nôn dịch vàng, bỏ ăn cỏ Timothy 8 tiếng, chướng bụng cấp',
    status: 'pending',
    assignedVet: 'BS. Nguyễn Văn A',
    adminNote: 'Ca cấp cứu GI Stasis - Cần xử lý chống sốc và truyền dịch ngay',
    isEmergency: true,
    triage: 'emergency',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: 'BK-1727250001',
    petId: 'pet-1',
    petName: 'Mochi',
    petType: 'Chó Golden Retriever',
    ownerName: 'Đinh Xuân Mạnh',
    phone: '0987654321',
    service: 'Da liễu & Vết nấm/ve rận',
    facility: 'Chi nhánh Cầu Giấy (Phòng khám 02)',
    date: _getTodayIsoDate(),
    time: '14:00',
    note: 'Có vết rụng lông hình tròn ở cổ (từ kết quả AI Thị Giác)',
    status: 'pending',
    assignedVet: 'Đang xếp lịch',
    adminNote: '',
    isEmergency: false,
    triage: 'routine',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'BK-1727250002',
    petId: 'pet-2',
    petName: 'Luna',
    petType: 'Mèo Anh Lông Ngắn BSH',
    ownerName: 'Nguyễn Thảo Ly',
    phone: '0912345678',
    service: 'Khám tổng quát định kỳ',
    facility: 'Chi nhánh Cầu Giấy (Phòng khám 02)',
    date: _getTomorrowIsoDate(),
    time: '09:30',
    note: 'Kiểm tra răng miệng và siêu âm tim định kỳ 6 tháng',
    status: 'in_progress',
    assignedVet: 'BS. Dr. Paw (AI)',
    adminNote: 'Đang trong phòng khám số 2',
    isEmergency: false,
    triage: 'routine',
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 'BK-1727249999',
    petId: 'pet-1',
    petName: 'Mochi',
    petType: 'Chó Golden Retriever',
    ownerName: 'Đinh Xuân Mạnh',
    phone: '0987654321',
    service: 'Tiêm vắc-xin & Tẩy giun',
    facility: 'Chi nhánh Cầu Giấy (Phòng khám 02)',
    date: '2026-09-20',
    time: '10:00',
    note: 'Mũi vắc-xin 7 bệnh nhắc lại hàng năm',
    status: 'completed',
    assignedVet: 'BS. Trần Thị B',
    adminNote: 'Đã hoàn tất tiêm vắc-xin Vanguard Plus 5/L, theo dõi 30p tại viện ổn định',
    isEmergency: false,
    triage: 'routine',
    createdAt: new Date(Date.now() - 3600000 * 96).toISOString()
  }
];

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

  if (!appointments || !Array.isArray(appointments) || appointments.length === 0) {
    appointments = INITIAL_APPOINTMENTS;
    saveActiveAppointments(appointments);
  } else {
    // 1. TỰ ĐỘNG LỌC DEDUP VÀ LÀM SẠCH BẢN GHI TRÙNG LẶP TEST CỦA ADMIN:
    // Xóa các bản ghi trùng lặp nội dung "Cấp cứu & Xử lý sốc / Dị ứng cấp" của Mochi vào rạng sáng 27/09
    let hasNormalization = false;
    const seenIds = new Set();
    const seenSignatures = new Set();
    let hasMochiEmergency = false;
    const cleanList = [];

    for (const a of appointments) {
      if (!a) continue;
      const pName = String(a.petName || '').toLowerCase().trim();
      const srv = String(a.service || '').toLowerCase().trim();
      const d = String(a.date || '').split('T')[0];
      const t = String(a.time || '').trim();

      // Kiểm tra bản ghi trùng lặp test "Cấp cứu & Xử lý sốc / Dị ứng cấp" của Mochi rạng sáng 27/09
      const isMochiEmergencyTest = pName.includes('mochi') && 
        (srv.includes('cấp cứu') || srv.includes('dị ứng') || srv.includes('sốc')) && 
        (d === '2026-09-27' || d.includes('27/09'));

      if (isMochiEmergencyTest) {
        if (hasMochiEmergency) {
          hasNormalization = true;
          continue; // Bỏ qua / xóa bản ghi trùng lặp thứ 2 trở đi
        }
        hasMochiEmergency = true;
      }

      const idKey = a.id ? String(a.id) : null;
      const sigKey = `${pName}__${d}__${t}__${srv}`;

      if ((idKey && seenIds.has(idKey)) || seenSignatures.has(sigKey)) {
        hasNormalization = true;
        continue; // Bỏ qua bản ghi trùng lặp
      }

      if (idKey) seenIds.add(idKey);
      seenSignatures.add(sigKey);
      cleanList.push(a);
    }

    // 2. Tự động chuẩn hóa trạng thái và đồng bộ tên cơ sở: "Chi nhánh Cầu Giấy (Phòng khám 02)"
    appointments = cleanList.map(a => {
      let updatedItem = { ...a };
      const s = String(a.status || '').toLowerCase();
      if (s === 'chờ tiếp nhận' || s === 'chờ duyệt' || !a.status) {
        hasNormalization = true;
        updatedItem.status = 'pending';
      } else if (s === 'đang khám' || s === 'đã duyệt') {
        hasNormalization = true;
        updatedItem.status = 'in_progress';
      } else if (s === 'hoàn thành' || s === 'đã khám') {
        hasNormalization = true;
        updatedItem.status = 'completed';
      }

      // Chuẩn hóa tên cơ sở khớp 100% Header phòng khám
      const f = String(a.facility || '');
      if (!f || f.includes('PetHealth') || f.includes('Sammi') || f.includes('2Vet') || f.includes('PetCare Central')) {
        if (a.facility !== 'Chi nhánh Cầu Giấy (Phòng khám 02)') {
          hasNormalization = true;
          updatedItem.facility = 'Chi nhánh Cầu Giấy (Phòng khám 02)';
        }
      }

      // Đảm bảo các ca mẫu khớp bộ lọc ngày Hôm nay / Ngày mai cho demo
      if (a.id === 'BK-1727250003' && (!a.date || a.date.startsWith('2026-09-22'))) {
        hasNormalization = true;
        updatedItem.date = _getTodayIsoDate();
        updatedItem.isEmergency = true;
        updatedItem.status = 'pending';
      }
      if (a.id === 'BK-1727250001' && (!a.date || a.date.startsWith('2026-09-25'))) {
        hasNormalization = true;
        updatedItem.date = _getTodayIsoDate();
      }
      if (a.id === 'BK-1727250002' && (!a.date || a.date.startsWith('2026-09-24'))) {
        hasNormalization = true;
        updatedItem.date = _getTomorrowIsoDate();
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

export const getAppointments = getActiveAppointments;
export const saveAppointments = saveActiveAppointments;

export const addActiveAppointment = (appointmentData) => {
  const current = getActiveAppointments();
  const newAppointment = {
    id: appointmentData.id || `BK-${Date.now()}`,
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

export const deleteAppointment = (appointmentId) => {
  const current = getAppointments();
  const updated = current.filter(item => item.id !== appointmentId);
  saveAppointments(updated);
  return updated;
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
  const defaultAlert = {
    disease: 'Parvovirus',
    area: 'Quận Cầu Giấy',
    risk: 'high',
    title: 'CẢNH BÁO DỊCH TỄ KHU VỰC',
    message: 'Đang có ổ dịch Parvovirus tại Cầu Giấy. Bé Mochi chưa tiêm mũi nhắc lại năm 2026!',
    active: true,
    updatedAt: new Date().toISOString()
  };
  saveActiveEpidemicAlert(defaultAlert);
  return defaultAlert;
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

