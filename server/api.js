import express from 'express';
import jwt from 'jsonwebtoken';
import { getCollectionData, saveCollectionData } from './dataHandler.js';
import { findUserById, getUsers } from './db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-dev';

// Middleware Authentication
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, error: 'Forbidden: Invalid token' });
    
    // Đảm bảo user thực sự còn tồn tại và không bị khóa
    const user = findUserById(decoded.id);
    if (!user) return res.status(401).json({ success: false, error: 'User not found or deleted' });
    if (user.isLocked) return res.status(403).json({ success: false, error: 'Account is locked' });
    
    req.user = user;
    next();
  });
};

// Map collections to object or array type
const COLLECTION_TYPES = {
  pets: 'array',
  schedules: 'array',
  expenses: 'array',
  daily_logs: 'array',
  prescriptions: 'array',
  family_members: 'array',
  daily_habits: 'array',
  lost_modes: 'object',
  appointments: 'array',
  health_data: 'object'
};

const getAllowedCollections = () => Object.keys(COLLECTION_TYPES);

// Migration endpoint to push local data
router.post('/migrate', authenticateToken, (req, res) => {
  const user = req.user;
  const { pets, schedules, expenses, daily_logs, prescriptions, family_members, daily_habits, lost_modes, appointments, health_data } = req.body;

  const mergeArray = (collection, newData) => {
    if (!newData || !Array.isArray(newData)) return;
    const existing = getCollectionData(collection, false);
    // Find missing by ID
    const existingIds = new Set(existing.map(item => String(item.id)));
    const toAdd = newData.filter(item => item && item.id && !existingIds.has(String(item.id)));
    if (toAdd.length > 0) {
      // make sure ownership is correct
      toAdd.forEach(item => { if (!item.ownerId) item.ownerId = user.id; });
      saveCollectionData(collection, [...existing, ...toAdd]);
    }
  };

  const mergeObject = (collection, newData) => {
    if (!newData || typeof newData !== 'object') return;
    const existing = getCollectionData(collection, true);
    let changed = false;
    for (const [k, v] of Object.entries(newData)) {
      if (!existing[k]) {
        existing[k] = v;
        changed = true;
      }
    }
    if (changed) saveCollectionData(collection, existing);
  };

  mergeArray('pets', pets);
  mergeArray('schedules', schedules);
  mergeArray('expenses', expenses);
  mergeArray('daily_logs', daily_logs);
  mergeArray('prescriptions', prescriptions);
  mergeArray('family_members', family_members);
  mergeArray('daily_habits', daily_habits);
  mergeArray('appointments', appointments);
  
  mergeObject('lost_modes', lost_modes);
  mergeObject('health_data', health_data);

  res.json({ success: true, message: 'Migration completed' });
});

// Generic GET list
router.get('/:collection', authenticateToken, (req, res) => {
  const { collection } = req.params;
  if (!getAllowedCollections().includes(collection)) {
    return res.status(404).json({ success: false, error: 'Collection not found' });
  }

  const isObject = COLLECTION_TYPES[collection] === 'object';
  const data = getCollectionData(collection, isObject);

  const user = req.user;
  if (user.role === 'system_admin') {
    return res.json(data); // Admin thấy tất cả
  }

  if (isObject) {
    // Với object như lost_modes (key là petId)
    // Cần biết pet nào thuộc về user.
    const allPets = getCollectionData('pets', false);
    const userPets = allPets.filter(p => p.ownerId === user.id);
    
    let allowedKeys = userPets.map(p => p.id);
    
    if (user.role === 'vet_doctor') {
      const appointments = getCollectionData('appointments', false) || [];
      const assignedPetIds = appointments
        .filter(a => a.assignedVetId === user.id)
        .map(a => a.petId);
      
      const assignedPets = allPets.filter(p => 
        assignedPetIds.includes(p.id) || 
        p.assignedVetId === user.id || 
        (Array.isArray(p.sharedWithVetIds) && p.sharedWithVetIds.includes(user.id))
      );
      allowedKeys = [...new Set([...allowedKeys, ...assignedPets.map(p => p.id)])];
    }

    const result = {};
    for (const key of allowedKeys) {
      if (data[key]) result[key] = data[key];
    }
    return res.json(result);
  } else {
    // Với array
    let result = [];
    if (user.role === 'pet_owner') {
      result = data.filter(item => String(item.ownerId).trim() === String(user.id).trim());
    } else if (user.role === 'vet_doctor') {
      const allPets = getCollectionData('pets', false);
      const appointments = getCollectionData('appointments', false) || [];
      const assignedPetIds = new Set(
        appointments
          .filter(a => a.assignedVetId === user.id || (a.assignedVet && (a.assignedVet.includes('Nam') || a.assignedVet.includes('Dr. Paw'))))
          .map(a => a.petId)
          .filter(Boolean)
      );
      const vetPetIds = new Set(allPets.filter(p => 
        assignedPetIds.has(p.id) || 
        p.assignedVetId === user.id || 
        (Array.isArray(p.sharedWithVetIds) && p.sharedWithVetIds.includes(user.id))
      ).map(p => p.id));
      
      if (collection === 'pets') {
        result = data.filter(item => vetPetIds.has(item.id));
      } else {
        result = data.filter(item => vetPetIds.has(item.petId));
      }
    }
    return res.json(result);
  }
});

// Generic POST create
router.post('/:collection', authenticateToken, (req, res) => {
  const { collection } = req.params;
  if (!getAllowedCollections().includes(collection)) {
    return res.status(404).json({ success: false, error: 'Collection not found' });
  }

  const isObject = COLLECTION_TYPES[collection] === 'object';
  if (isObject) {
    return res.status(400).json({ success: false, error: 'Use PUT for object collections' });
  }

  const data = getCollectionData(collection, false);
  const newItem = {
    ...req.body,
    id: req.body.id || `${collection.slice(0,3)}-${Date.now()}`,
    ownerId: req.user.role === 'system_admin' ? (req.body.ownerId || req.user.id) : req.user.id,
    createdAt: new Date().toISOString()
  };

  // Validate ownerId/petId constraints for non-admins
  if (req.user.role !== 'system_admin') {
    if (newItem.petId) {
      const allPets = getCollectionData('pets', false);
      const pet = allPets.find(p => p.id === newItem.petId);
      if (!pet) return res.status(400).json({ success: false, error: 'Pet not found' });
      
      if (req.user.role === 'pet_owner' && pet.ownerId !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not your pet' });
      }
      
      // Vet can add records to assigned pets (like daily logs, prescriptions)
      if (req.user.role === 'vet_doctor') {
        const appointments = getCollectionData('appointments', false) || [];
        const isAssigned = appointments.some(a => a.petId === pet.id && a.assignedVetId === req.user.id) || 
                           pet.assignedVetId === req.user.id || 
                           (Array.isArray(pet.sharedWithVetIds) && pet.sharedWithVetIds.includes(req.user.id));
        if (!isAssigned) return res.status(403).json({ success: false, error: 'Pet not assigned to you' });
      }
    }
  }

  // Prevent placeholder missing data as per requirement
  if (collection === 'pets' && (!newItem.weight || newItem.weight <= 0)) {
     newItem.weight = null; // Do not default to a value. 
  }

  data.unshift(newItem);
  saveCollectionData(collection, data);
  res.json({ success: true, data: newItem });
});

// Generic PUT update
router.put('/:collection/:id', authenticateToken, (req, res) => {
  const { collection, id } = req.params;
  if (!getAllowedCollections().includes(collection)) {
    return res.status(404).json({ success: false, error: 'Collection not found' });
  }

  const isObject = COLLECTION_TYPES[collection] === 'object';
  let data = getCollectionData(collection, isObject);

  if (isObject) {
    // For object collections, id is typically the petId
    const allPets = getCollectionData('pets', false);
    const pet = allPets.find(p => p.id === id);
    if (!pet && req.user.role !== 'system_admin') return res.status(404).json({ success: false, error: 'Pet not found' });
    
    if (req.user.role === 'pet_owner' && pet && pet.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not your pet' });
    }

    data[id] = { ...data[id], ...req.body };
    saveCollectionData(collection, data);
    return res.json({ success: true, data: data[id] });
  } else {
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Not found' });

    const currentItem = data[index];

    // Auth check
    if (req.user.role !== 'system_admin') {
      if (req.user.role === 'pet_owner' && currentItem.ownerId !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not your record' });
      }
      
      if (req.user.role === 'vet_doctor') {
        if (collection === 'pets') {
           const appointments = getCollectionData('appointments', false) || [];
           const isAssigned = appointments.some(a => a.petId === id && a.assignedVetId === req.user.id) || 
                              currentItem.assignedVetId === req.user.id || 
                              (Array.isArray(currentItem.sharedWithVetIds) && currentItem.sharedWithVetIds.includes(req.user.id));
           if (!isAssigned) return res.status(403).json({ success: false, error: 'Pet not assigned to you' });
           
           // Bác sĩ chỉ sửa phần chuyên môn được phép (yêu cầu: chỉ sửa phần chuyên môn được phép)
           const allowedDoctorFields = ['weight', 'weightHistory', 'notes', 'medicalHistory', 'vaccineDatabase'];
           const sanitizedUpdates = {};
           allowedDoctorFields.forEach(field => {
             if (req.body[field] !== undefined) sanitizedUpdates[field] = req.body[field];
           });
           data[index] = { ...currentItem, ...sanitizedUpdates };
           saveCollectionData(collection, data);
           return res.json({ success: true, data: data[index] });
        } else {
           // Maybe allow vet to edit prescriptions they created, but simplify by checking petId assign
           const allPets = getCollectionData('pets', false);
           const pet = allPets.find(p => p.id === currentItem.petId);
           const isAssigned = pet && (pet.assignedVetId === req.user.id || (Array.isArray(pet.sharedWithVetIds) && pet.sharedWithVetIds.includes(req.user.id)));
           if (!isAssigned) return res.status(403).json({ success: false, error: 'Not assigned to you' });
        }
      }
    }

    data[index] = { ...currentItem, ...req.body, ownerId: currentItem.ownerId }; // Prevent changing ownerId
    saveCollectionData(collection, data);
    return res.json({ success: true, data: data[index] });
  }
});

// Generic DELETE
router.delete('/:collection/:id', authenticateToken, (req, res) => {
  const { collection, id } = req.params;
  if (!getAllowedCollections().includes(collection)) {
    return res.status(404).json({ success: false, error: 'Collection not found' });
  }

  const isObject = COLLECTION_TYPES[collection] === 'object';
  let data = getCollectionData(collection, isObject);

  if (isObject) {
    const allPets = getCollectionData('pets', false);
    const pet = allPets.find(p => p.id === id);
    if (req.user.role === 'pet_owner' && pet && pet.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not your pet' });
    }
    delete data[id];
    saveCollectionData(collection, data);
    return res.json({ success: true });
  } else {
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Not found' });

    const currentItem = data[index];
    if (req.user.role !== 'system_admin') {
      if (req.user.role === 'pet_owner' && currentItem.ownerId !== req.user.id) {
         return res.status(403).json({ success: false, error: 'Not your record' });
      }
      if (req.user.role === 'vet_doctor') {
         return res.status(403).json({ success: false, error: 'Vet cannot delete this record' });
      }
    }

    data.splice(index, 1);
    saveCollectionData(collection, data);
    
    // Yêu cầu 8: Kiểm tra xóa tài khoản/thú cưng theo quy tắc dữ liệu hiện có (xóa dây chuyền)
    if (collection === 'pets') {
      const arrayCollections = ['schedules', 'expenses', 'daily_logs', 'prescriptions', 'daily_habits', 'appointments'];
      arrayCollections.forEach(col => {
         let subData = getCollectionData(col, false);
         const initialLen = subData.length;
         subData = subData.filter(item => item.petId !== id);
         if (subData.length !== initialLen) {
           saveCollectionData(col, subData);
         }
      });
      let lostModes = getCollectionData('lost_modes', true);
      if (lostModes[id]) {
        delete lostModes[id];
        saveCollectionData('lost_modes', lostModes);
      }
      let healthData = getCollectionData('health_data', true);
      const k1 = `health_${id}`;
      if (healthData[k1]) {
        delete healthData[k1];
        saveCollectionData('health_data', healthData);
      }
    }

    return res.json({ success: true });
  }
});

export default router;
