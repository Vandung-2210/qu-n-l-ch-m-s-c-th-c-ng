export const apiFetch = async (endpoint, method = 'GET', body = null) => {
  const token = localStorage.getItem('petcare_auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const res = await fetch(`/api/data${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  
  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new Error('Không thể kết nối đến máy chủ.');
  }

  if (!res.ok) {
    throw new Error(data.error || 'Đã có lỗi xảy ra.');
  }
  return method === 'GET' ? data : data.data;
};

// Generic CRUD
export const apiGetAll = async (collection) => apiFetch(`/${collection}`);
export const apiCreate = async (collection, data) => apiFetch(`/${collection}`, 'POST', data);
export const apiUpdate = async (collection, id, data) => apiFetch(`/${collection}/${id}`, 'PUT', data);
export const apiDelete = async (collection, id) => apiFetch(`/${collection}/${id}`, 'DELETE');

// Sync all data from API to cache
export const syncAllDataToCache = async () => {
  try {
    const [pets, schedules, expenses, dailyLogs, prescriptions, familyMembers, dailyHabits, appointments, lostModes, healthData] = await Promise.all([
      apiGetAll('pets'),
      apiGetAll('schedules'),
      apiGetAll('expenses'),
      apiGetAll('daily_logs'),
      apiGetAll('prescriptions'),
      apiGetAll('family_members'),
      apiGetAll('daily_habits'),
      apiGetAll('appointments'),
      apiGetAll('lost_modes'),
      apiGetAll('health_data')
    ]);

    localStorage.setItem('petcare_pets_v1', JSON.stringify(pets));
    localStorage.setItem('petcare_schedules_v1', JSON.stringify(schedules));
    localStorage.setItem('petcare_expenses_v1', JSON.stringify(expenses));
    localStorage.setItem('petcare_daily_logs_v1', JSON.stringify(dailyLogs));
    localStorage.setItem('petcare_prescriptions_v1', JSON.stringify(prescriptions));
    localStorage.setItem('petcare_family_members_v1', JSON.stringify(familyMembers));
    localStorage.setItem('petcare_daily_habits_v1', JSON.stringify(dailyHabits));
    localStorage.setItem('petcare_appointments_v1', JSON.stringify(appointments));
    localStorage.setItem('petcare_lost_modes_v1', JSON.stringify(lostModes));
    localStorage.setItem('petcare_pets_health_v1', JSON.stringify(healthData));
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('petcare_data_synced'));
    }
    return true;
  } catch (error) {
    console.error("Sync data failed:", error);
    return false;
  }
};

export const runMigrationIfNeeded = async () => {
  const migrated = localStorage.getItem('petcare_v2_migrated');
  if (migrated === 'true') return;

  const data = {
    pets: JSON.parse(localStorage.getItem('petcare_pets_v1') || '[]'),
    schedules: JSON.parse(localStorage.getItem('petcare_schedules_v1') || '[]'),
    expenses: JSON.parse(localStorage.getItem('petcare_expenses_v1') || '[]'),
    daily_logs: JSON.parse(localStorage.getItem('petcare_daily_logs_v1') || '[]'),
    prescriptions: JSON.parse(localStorage.getItem('petcare_prescriptions_v1') || '[]'),
    family_members: JSON.parse(localStorage.getItem('petcare_family_members_v1') || '[]'),
    daily_habits: JSON.parse(localStorage.getItem('petcare_daily_habits_v1') || '[]'),
    appointments: JSON.parse(localStorage.getItem('petcare_appointments_v1') || '[]'),
    lost_modes: JSON.parse(localStorage.getItem('petcare_lost_modes_v1') || '{}'),
    health_data: JSON.parse(localStorage.getItem('petcare_pets_health_v1') || '{}'),
  };

  try {
    await apiFetch('/migrate', 'POST', data);
    localStorage.setItem('petcare_v2_migrated', 'true');
  } catch (e) {
    console.error("Migration failed", e);
  }
};
