const fs = require('fs');

const fileStorage = 'src/services/storageService.js';
let code = fs.readFileSync(fileStorage, 'utf8');

// 1. Prepend imports
if (!code.includes('apiService.js')) {
  code = `import { apiCreate, apiUpdate, apiDelete, syncAllDataToCache } from './apiService.js';\n` + code;
}

// 2. Replace mutation methods
const replacements = [
  {
    regex: /export const addPet = \((.*?)\) => \{([\s\S]*?)return newPet;\n\};/,
    replacement: `export const addPet = async (pet, autoGenerateSchedule = false, userId = null) => {
  const newPet = { ...pet, name: pet.name.trim(), weight: Number(pet.weight) || null };
  const res = await apiCreate('pets', newPet);
  await syncAllDataToCache();
  return res;
};`
  },
  {
    regex: /export const updatePet = \((.*?)\) => \{([\s\S]*?)return pets\[index\];\n\};/,
    replacement: `export const updatePet = async (updatedPet, userId = null, userRole = null) => {
  const res = await apiUpdate('pets', updatedPet.id, updatedPet);
  await syncAllDataToCache();
  return res;
};`
  },
  {
    regex: /export const deletePet = \((.*?)\) => \{([\s\S]*?)return updatedPets;\n\};/,
    replacement: `export const deletePet = async (petId, userId = null, userRole = null) => {
  await apiDelete('pets', petId);
  await syncAllDataToCache();
  return getPets();
};`
  },
  {
    regex: /export const addSchedule = \((.*?)\) => \{([\s\S]*?)return newSchedule;\n\};/,
    replacement: `export const addSchedule = async (schedule, userId = null) => {
  const res = await apiCreate('schedules', schedule);
  await syncAllDataToCache();
  return res;
};`
  },
  {
    regex: /export const updateSchedule = \((.*?)\) => \{([\s\S]*?)return schedules\[index\];\n\};/,
    replacement: `export const updateSchedule = async (updatedSchedule, userId = null, userRole = null) => {
  const res = await apiUpdate('schedules', updatedSchedule.id, updatedSchedule);
  await syncAllDataToCache();
  return res;
};`
  },
  {
    regex: /export const deleteSchedule = \((.*?)\) => \{([\s\S]*?)return schedules;\n\};/,
    replacement: `export const deleteSchedule = async (scheduleId, userId = null, userRole = null) => {
  await apiDelete('schedules', scheduleId);
  await syncAllDataToCache();
  return getSchedules();
};`
  },
  {
    regex: /export const addExpense = \((.*?)\) => \{([\s\S]*?)return newExpense;\n\};/,
    replacement: `export const addExpense = async (expense, userId = null) => {
  const res = await apiCreate('expenses', expense);
  await syncAllDataToCache();
  return res;
};`
  },
  {
    regex: /export const deleteExpense = \((.*?)\) => \{([\s\S]*?)return updated;\n\};/,
    replacement: `export const deleteExpense = async (id, userId = null, userRole = null) => {
  await apiDelete('expenses', id);
  await syncAllDataToCache();
  return getExpenses();
};`
  },
  {
    regex: /export const addDailyLog = \((.*?)\) => \{([\s\S]*?)return newLog;\n\};/,
    replacement: `export const addDailyLog = async (log, userId = null) => {
  const res = await apiCreate('daily_logs', log);
  await syncAllDataToCache();
  return res;
};`
  },
  {
    regex: /export const addPrescription = \((.*?)\) => \{([\s\S]*?)return newPres;\n\};/,
    replacement: `export const addPrescription = async (pres, userId = null) => {
  const res = await apiCreate('prescriptions', pres);
  await syncAllDataToCache();
  return res;
};`
  },
  {
    regex: /export const deletePrescription = \((.*?)\) => \{([\s\S]*?)return updated;\n\};/,
    replacement: `export const deletePrescription = async (id, userId = null, userRole = null) => {
  await apiDelete('prescriptions', id);
  await syncAllDataToCache();
  return getPrescriptions();
};`
  },
  {
    regex: /export const addFamilyMember = \((.*?)\) => \{([\s\S]*?)return newMember;\n\};/,
    replacement: `export const addFamilyMember = async (member, userId = null) => {
  const res = await apiCreate('family_members', member);
  await syncAllDataToCache();
  return res;
};`
  },
  {
    regex: /export const deleteFamilyMember = \((.*?)\) => \{([\s\S]*?)return updated;\n\};/,
    replacement: `export const deleteFamilyMember = async (id, userId = null, userRole = null) => {
  await apiDelete('family_members', id);
  await syncAllDataToCache();
  return getFamilyMembers();
};`
  },
  {
    regex: /export const addDailyHabit = \((.*?)\) => \{([\s\S]*?)return newHabit;\n\};/,
    replacement: `export const addDailyHabit = async (habit, userId = null) => {
  const res = await apiCreate('daily_habits', habit);
  await syncAllDataToCache();
  return res;
};`
  },
  {
    regex: /export const deleteDailyHabit = \((.*?)\) => \{([\s\S]*?)return updated;\n\};/,
    replacement: `export const deleteDailyHabit = async (id, userId = null, userRole = null) => {
  await apiDelete('daily_habits', id);
  await syncAllDataToCache();
  return getDailyHabits();
};`
  },
  {
    regex: /export const updatePetLostMode = \((.*?)\) => \{([\s\S]*?)return lostModes;\n\};/,
    replacement: `export const updatePetLostMode = async (petId, lostData = {}) => {
  const res = await apiUpdate('lost_modes', petId, lostData);
  await syncAllDataToCache();
  return res;
};`
  },
  {
    regex: /export const addActiveAppointment = \((.*?)\) => \{([\s\S]*?)return newAppt;\n\};/,
    replacement: `export const addActiveAppointment = async (appointmentData, userId = null) => {
  const res = await apiCreate('appointments', appointmentData);
  await syncAllDataToCache();
  return res;
};`
  },
  {
    regex: /export const updateAppointment = \((.*?)\) => \{([\s\S]*?)return appointments\[index\];\n\};/,
    replacement: `export const updateAppointment = async (appointmentId, updates) => {
  const res = await apiUpdate('appointments', appointmentId, updates);
  await syncAllDataToCache();
  return res;
};`
  },
  {
    regex: /export const deleteAppointment = \((.*?)\) => \{([\s\S]*?)return updated;\n\};/,
    replacement: `export const deleteAppointment = async (appointmentId) => {
  await apiDelete('appointments', appointmentId);
  await syncAllDataToCache();
  return getAppointments();
};`
  },
  {
    regex: /export const updatePetWeight = \((.*?)\) => \{([\s\S]*?)return updatedHealth;\n\};/,
    replacement: `export const updatePetWeight = async (petId, newWeight, note = '') => {
  const currentHealth = getPetsHealthData();
  const k = normalizePetHealthKey(petId);
  const existing = currentHealth[k] || { petId: k, currentWeight: 0, weightHistory: [] };
  const val = Number(newWeight) || 0;
  if(val > 0) {
    existing.currentWeight = val;
    existing.weightHistory.unshift({ date: getLocalDateString(), weight: val, note });
  }
  const res = await apiUpdate('health_data', k, existing);
  await syncAllDataToCache();
  return res;
};`
  }
];

replacements.forEach(r => {
  code = code.replace(r.regex, r.replacement);
});

fs.writeFileSync(fileStorage, code);

// 3. Update App.jsx handlers
const fileApp = 'src/App.jsx';
let appCode = fs.readFileSync(fileApp, 'utf8');

appCode = appCode.replace(/const handleAddPet = \((.*?)\) => \{/g, 'const handleAddPet = async ($1) => {');
appCode = appCode.replace(/addPet\(/g, 'await addPet(');
appCode = appCode.replace(/updatePet\(/g, 'await updatePet(');
appCode = appCode.replace(/deletePet\(/g, 'await deletePet(');

appCode = appCode.replace(/const handleAddSchedule = \((.*?)\) => \{/g, 'const handleAddSchedule = async ($1) => {');
appCode = appCode.replace(/addSchedule\(/g, 'await addSchedule(');
appCode = appCode.replace(/updateSchedule\(/g, 'await updateSchedule(');
appCode = appCode.replace(/deleteSchedule\(/g, 'await deleteSchedule(');
appCode = appCode.replace(/toggleScheduleComplete\(/g, 'await toggleScheduleComplete('); // wait toggle is not replaced yet

appCode = appCode.replace(/const handleAddExpense = \((.*?)\) => \{/g, 'const handleAddExpense = async ($1) => {');
appCode = appCode.replace(/addExpense\(/g, 'await addExpense(');
appCode = appCode.replace(/deleteExpense\(/g, 'await deleteExpense(');

appCode = appCode.replace(/const handleAddDailyLog = \((.*?)\) => \{/g, 'const handleAddDailyLog = async ($1) => {');
appCode = appCode.replace(/addDailyLog\(/g, 'await addDailyLog(');

appCode = appCode.replace(/const handleAddPrescription = \((.*?)\) => \{/g, 'const handleAddPrescription = async ($1) => {');
appCode = appCode.replace(/addPrescription\(/g, 'await addPrescription(');
appCode = appCode.replace(/deletePrescription\(/g, 'await deletePrescription(');

appCode = appCode.replace(/const handleAddFamilyMember = \((.*?)\) => \{/g, 'const handleAddFamilyMember = async ($1) => {');
appCode = appCode.replace(/addFamilyMember\(/g, 'await addFamilyMember(');
appCode = appCode.replace(/deleteFamilyMember\(/g, 'await deleteFamilyMember(');

appCode = appCode.replace(/const handleToggleLostMode = \((.*?)\) => \{/g, 'const handleToggleLostMode = async ($1) => {');
appCode = appCode.replace(/updatePetLostMode\(/g, 'await updatePetLostMode(');

fs.writeFileSync(fileApp, appCode);

console.log("Refactoring complete");
