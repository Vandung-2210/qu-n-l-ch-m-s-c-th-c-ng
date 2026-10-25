import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getCollectionData, saveCollectionData, saveMultipleCollections, simulateSaveFailure, clearSimulatedSaveFailures } from './dataHandler.js';
import { findUserById, getUsers } from './db.js';

import { JWT_SECRET } from './config.js';

const router = express.Router();

// Middleware mô phỏng lỗi ghi đĩa phục vụ kiểm thử hệ thống
router.use((req, res, next) => {
  if (req.headers['x-simulate-save-failure']) {
    simulateSaveFailure(req.headers['x-simulate-save-failure']);
    res.on('finish', () => {
      clearSimulatedSaveFailures();
    });
  }
  next();
});

router.post('/simulate/clear-failures', (req, res) => {
  clearSimulatedSaveFailures();
  return res.json({ success: true, message: 'Simulated failures cleared.' });
});

// Helper kiểm tra trạng thái đơn thuốc/bệnh án đã ký chốt và công bố chính thức
export function isRecordPublished(record) {
  if (!record || typeof record !== 'object') return false;
  return record.isFinal === true && record.status === 'published';
}

// Không tự ý công bố hoặc thay đổi trạng thái đơn thuốc cũ
export function migrateLegacyPrescriptions() {
  // Đã vô hiệu hóa: Không tự ý gán isFinal: true hoặc status: 'published' cho đơn thuốc thiếu trạng thái
  return;
}

// Helper chuẩn hóa ngày giờ sang YYYY-MM-DD theo múi giờ Việt Nam (+07:00 / Asia/Ho_Chi_Minh)
export function normalizeDateToYmd(dateInput) {
  if (!dateInput) return null;
  const str = String(dateInput).trim();
  // Format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  // Format DD/MM/YYYY
  const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(str);
  if (ddmmyyyy) {
    const day = ddmmyyyy[1].padStart(2, '0');
    const month = ddmmyyyy[2].padStart(2, '0');
    const year = ddmmyyyy[3];
    return `${year}-${month}-${day}`;
  }
  // Chuỗi ISO timestamp (chuyển đổi chuẩn xác theo Asia/Ho_Chi_Minh)
  if (str.includes('T')) {
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(d);
      }
    } catch {}
  }
  return str;
}

// Helper validation chuẩn xác: Ngày dương lịch có thật (không nhận not-a-date, 2026-02-29, 2026-04-31)
export function isValidCalendarDate(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const trimmed = dateStr.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const d = new Date(year, month - 1, day);
  return d.getFullYear() === year && (d.getMonth() + 1) === month && d.getDate() === day;
}

// Helper validation chuẩn xác: Giờ hợp lệ HH:MM trong khoảng 00:00 - 23:59 (không nhận 99:99, 25:00)
export function isValidTimeFormat(timeStr) {
  if (typeof timeStr !== 'string') return false;
  const trimmed = timeStr.trim();
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(trimmed);
  return Boolean(match);
}

// Helper validation chuẩn xác: Số hữu hạn lớn hơn 0 (không nhận số âm, 0, NaN, Infinity, chuỗi sai kiểu, boolean)
export function isValidPositiveNumber(val) {
  if (typeof val === 'boolean' || val === null || val === undefined) return false;
  const n = Number(val);
  return Number.isFinite(n) && !isNaN(n) && n > 0;
}

// Helper validation chuẩn xác: Số điện thoại Việt Nam (10 số di động bắt đầu bằng 0 hoặc +84)
export function validateVietnamesePhoneNumber(phone) {
  if (phone === undefined || phone === null || (typeof phone === 'string' && !phone.trim())) {
    return {
      isValid: false,
      error: 'Vui lòng nhập số điện thoại liên hệ xác nhận.',
      code: 'MISSING_PHONE_NUMBER'
    };
  }

  if (typeof phone !== 'string') {
    return {
      isValid: false,
      error: 'Số điện thoại phải là chuỗi ký tự hợp lệ.',
      code: 'INVALID_PHONE_TYPE'
    };
  }

  const trimmed = phone.trim();

  // Kiểm tra ký tự không hợp lệ: từ chối chữ cái và ký tự đặc biệt
  if (/[^0-9+\s.-]/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Số điện thoại không hợp lệ: không được chứa chữ cái hoặc ký tự đặc biệt.',
      code: 'INVALID_PHONE_CHARACTERS'
    };
  }

  // Dấu + chỉ được phép ở đầu chuỗi (+84)
  if (trimmed.includes('+') && !trimmed.startsWith('+')) {
    return {
      isValid: false,
      error: 'Ký tự "+" chỉ được phép ở đầu số điện thoại quốc tế (+84).',
      code: 'INVALID_PHONE_FORMAT'
    };
  }

  // Chuẩn hóa loại bỏ khoảng trắng, dấu chấm, dấu gạch nối
  const sanitized = trimmed.replace(/[\s.-]/g, '');

  if (!sanitized.startsWith('0') && !sanitized.startsWith('+84') && !sanitized.startsWith('84')) {
    return {
      isValid: false,
      error: 'Số điện thoại phải là số Việt Nam bắt đầu bằng 0 hoặc +84 (Ví dụ: 0912 345 678 hoặc +84 912 345 678).',
      code: 'INVALID_PHONE_PREFIX'
    };
  }

  let normalized = sanitized;
  if (normalized.startsWith('+84')) {
    normalized = '0' + normalized.slice(3);
  } else if (normalized.startsWith('84') && sanitized.length > 9) {
    normalized = '0' + normalized.slice(2);
  }

  if (!/^\d+$/.test(normalized)) {
    return {
      isValid: false,
      error: 'Số điện thoại chỉ được chứa các chữ số.',
      code: 'INVALID_PHONE_CHARACTERS'
    };
  }

  if (normalized.length < 10) {
    return {
      isValid: false,
      error: `Số điện thoại quá ngắn (${normalized.length}/10 số). Vui lòng nhập đủ 10 chữ số.`,
      code: 'PHONE_TOO_SHORT'
    };
  }

  if (normalized.length > 11) {
    return {
      isValid: false,
      error: `Số điện thoại quá dài (${normalized.length} số). Số điện thoại Việt Nam tiêu chuẩn gồm 10 chữ số.`,
      code: 'PHONE_TOO_LONG'
    };
  }

  const vnMobileRegex = /^(0)(3|5|7|8|9)[0-9]{8}$/;
  const vnLandlineRegex = /^(02)[0-9]{9}$/;

  if (!vnMobileRegex.test(normalized) && !vnLandlineRegex.test(normalized)) {
    if (normalized.length === 10 && !/^(0)(3|5|7|8|9)/.test(normalized)) {
      return {
        isValid: false,
        error: 'Đầu số không hợp lệ. Số di động Việt Nam bắt đầu bằng 03, 05, 07, 08, 09.',
        code: 'INVALID_PHONE_PREFIX'
      };
    }
    return {
      isValid: false,
      error: 'Số điện thoại không đúng định dạng mạng viễn thông Việt Nam (bắt đầu bằng 0 hoặc +84 kèm 9 chữ số).',
      code: 'INVALID_PHONE_FORMAT'
    };
  }

  return {
    isValid: true,
    sanitized: trimmed,
    normalized
  };
}

// Helper validation lịch sử cân nặng: ngày không được để trống, hợp lệ trên lịch, không thuộc tương lai (Asia/Ho_Chi_Minh)
export function validatePetWeightHistory(weightHistory, todayVn = getTodayVnDate()) {
  if (weightHistory === undefined || weightHistory === null) {
    return { valid: true, sanitized: undefined };
  }
  if (!Array.isArray(weightHistory)) {
    return {
      valid: false,
      error: 'Lịch sử cân nặng (weightHistory) phải là một danh sách mảng hợp lệ.',
      code: 'INVALID_WEIGHT_HISTORY'
    };
  }
  const sanitized = [];
  for (let i = 0; i < weightHistory.length; i++) {
    const entry = weightHistory[i];
    if (!entry || typeof entry !== 'object') {
      return {
        valid: false,
        error: `Bản ghi cân nặng thứ ${i + 1} trong lịch sử không đúng định dạng.`,
        code: 'INVALID_WEIGHT_ENTRY'
      };
    }
    const rawDate = entry.date;
    if (!rawDate || typeof rawDate !== 'string' || !rawDate.trim()) {
      return {
        valid: false,
        error: `Ngày ghi nhận cân nặng ở bản ghi thứ ${i + 1} không được để trống.`,
        code: 'MISSING_WEIGHT_DATE'
      };
    }
    const dateStr = entry.date.trim();
    if (!isValidCalendarDate(dateStr)) {
      return {
        valid: false,
        error: `Ngày ghi nhận cân nặng '${dateStr}' không hợp lệ hoặc không tồn tại trên lịch thực tế (định dạng YYYY-MM-DD).`,
        code: 'INVALID_WEIGHT_DATE'
      };
    }
    if (dateStr > todayVn) {
      return {
        valid: false,
        error: `Ngày ghi nhận cân nặng (${dateStr}) không được thuộc tương lai (vượt quá hôm nay ${todayVn} theo giờ Việt Nam).`,
        code: 'FUTURE_WEIGHT_DATE'
      };
    }
    if (!isValidPositiveNumber(entry.weight)) {
      return {
        valid: false,
        error: `Cân nặng trong bản ghi ngày ${dateStr} phải là một số dương lớn hơn 0 kg.`,
        code: 'INVALID_WEIGHT_VALUE'
      };
    }
    sanitized.push({
      ...entry,
      date: dateStr,
      weight: Number(entry.weight)
    });
  }

  // Sắp xếp tăng dần theo ngày ghi nhận thực tế
  sanitized.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  return { valid: true, sanitized };
}

// Re-export toàn bộ helper ngày giờ chuẩn hóa theo múi giờ Asia/Ho_Chi_Minh (MỤC 6)
export {
  VN_TIMEZONE,
  getTodayVnDate,
  getVnDateString,
  getLocalDateString,
  formatDateVi,
  formatDateKey,
  addDaysLocal,
  addMonthsClamped,
  addYearsClamped,
  getScheduleStatus,
  generateIcsCalendar
} from './dateUtils.js';

import {
  getTodayVnDate,
  getVnDateString,
  getLocalDateString,
  addDaysLocal,
  addMonthsClamped,
  addYearsClamped
} from './dateUtils.js';


// Middleware Authentication
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null || token === 'null' || token === 'undefined' || token.trim() === '') {
    return res.status(401).json({ 
      success: false, 
      error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 
      code: 'NO_TOKEN' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ 
        success: false, 
        error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 
        code: 'INVALID_TOKEN' 
      });
    }
    
    // Đảm bảo user thực sự còn tồn tại và không bị khóa
    const user = findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Tài khoản không tồn tại hoặc đã bị xóa.', 
        code: 'USER_NOT_FOUND' 
      });
    }

    if (user.isLocked) {
      return res.status(403).json({ 
        success: false, 
        error: 'Tài khoản đã bị khóa bởi Quản trị viên hệ thống.', 
        code: 'ACCOUNT_LOCKED' 
      });
    }

    // Thu hồi phiên làm việc cũ nếu mật khẩu đã bị thay đổi hoặc reset sau thời điểm token được cấp
    if (user.passwordChangedAt) {
      if (decoded.pwdChangedAt !== undefined) {
        if (decoded.pwdChangedAt !== user.passwordChangedAt) {
          return res.status(401).json({
            success: false,
            error: 'Phiên đăng nhập đã bị thu hồi do đổi mật khẩu hoặc đặt lại bảo mật. Vui lòng đăng nhập lại.',
            code: 'SESSION_REVOKED'
          });
        }
      } else if (decoded.iat) {
        const changedTime = new Date(user.passwordChangedAt).getTime();
        if (decoded.iat * 1000 <= changedTime) {
          return res.status(401).json({
            success: false,
            error: 'Phiên đăng nhập đã bị thu hồi do đổi mật khẩu hoặc đặt lại bảo mật. Vui lòng đăng nhập lại.',
            code: 'SESSION_REVOKED'
          });
        }
      }
    }

    // Chặn tài khoản chưa hoàn tất đổi mật khẩu lần đầu truy cập các API dữ liệu nghiệp vụ
    const cleanPath = (req.originalUrl || '').split('?')[0];
    const isFirstLoginEndpoint = cleanPath === '/api/auth/first-login-change-password';
    if (user.mustChangePassword && !isFirstLoginEndpoint) {
      return res.status(403).json({
        success: false,
        error: 'Tài khoản yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên trước khi truy cập dữ liệu.',
        code: 'MUST_CHANGE_PASSWORD'
      });
    }
    
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
  medical_records: 'array',
  health_data: 'object'
};

const getAllowedCollections = () => Object.keys(COLLECTION_TYPES);

// Helper kiểm tra bác sĩ có được phân công phụ trách thú cưng hay không (Unified Doctor Permission Policy)
export const isVetAssignedToPet = (vetId, petId, allPets = null, allAppointments = null) => {
  if (!vetId || !petId) return false;
  const pets = allPets || getCollectionData('pets', false);
  const appointments = allAppointments || getCollectionData('appointments', false) || [];
  const pet = pets.find(p => p.id === petId);
  if (!pet) return false;
  if (pet.assignedVetId === vetId) return true;
  if (Array.isArray(pet.sharedWithVetIds) && pet.sharedWithVetIds.includes(vetId)) return true;
  return appointments.some(a => a.petId === petId && (
    a.assignedVetId === vetId || 
    a.vetId === vetId || 
    !a.assignedVetId || 
    a.status === 'pending' || 
    a.assignedVet === 'Đang xếp lịch'
  ));
};

// ----------------------------------------------------------------------------
// 1. MIGRATION ENDPOINT (Xác thực quyền, không cho nhập vào tài khoản khác)
// ----------------------------------------------------------------------------
router.post('/migrate', authenticateToken, (req, res) => {
  const user = req.user;
  const { pets, schedules, expenses, daily_logs, prescriptions, family_members, daily_habits, lost_modes, appointments, medical_records, health_data } = req.body;

  const allExistingPets = getCollectionData('pets', false);
  const myExistingPetIds = new Set(allExistingPets.filter(p => p.ownerId === user.id).map(p => p.id));
  const otherExistingPetIds = new Set(allExistingPets.filter(p => p.ownerId !== user.id).map(p => p.id));
  
  const validIncomingPets = [];
  const validIncomingPetIds = new Set();

  if (Array.isArray(pets)) {
    pets.forEach(p => {
      if (!p || !p.id) return;
      // Không cho phép client nhận vơ ID thú cưng đã thuộc người khác
      if (otherExistingPetIds.has(p.id)) return;
      if (myExistingPetIds.has(p.id)) return;

      if (user.role === 'pet_owner') {
        p.ownerId = user.id;
        delete p.assignedVetId;
        validIncomingPets.push(p);
        validIncomingPetIds.add(p.id);
      } else if (user.role === 'vet_doctor') {
        // Bác sĩ không được tự ý nhập thú cưng mang ownerId của người khác
        if (p.ownerId && p.ownerId !== user.id) return;
        p.ownerId = user.id;
        validIncomingPets.push(p);
        validIncomingPetIds.add(p.id);
      } else if (user.role === 'system_admin') {
        validIncomingPets.push(p);
        validIncomingPetIds.add(p.id);
      }
    });
  }

  const allowedPetIds = new Set([...myExistingPetIds, ...validIncomingPetIds]);

  const operations = [];

  const queueMergeArray = (collection, newData, requireValidPet = false) => {
    if (!newData || !Array.isArray(newData)) return;
    
    // Chủ nuôi không được phép đưa hồ sơ bệnh án hoặc đơn thuốc chuyên môn vào
    if (user.role === 'pet_owner' && (collection === 'medical_records' || collection === 'prescriptions')) {
      return;
    }

    const existing = getCollectionData(collection, false);
    const existingIds = new Set(existing.map(item => String(item.id)));
    const toAdd = newData.filter(item => {
      if (!item || !item.id || existingIds.has(String(item.id))) return false;

      if (user.role === 'pet_owner') {
        item.ownerId = user.id;
        delete item.isFinal;
        delete item.confirmedBy;
        delete item.assignedVetId;
        if (collection === 'appointments') {
          item.status = 'pending';
        }
        if (collection === 'expenses' && !isValidPositiveNumber(item.amount)) {
          return false;
        }
        if (requireValidPet && item.petId && !allowedPetIds.has(item.petId)) {
          return false;
        }
      } else if (user.role === 'vet_doctor') {
        if (requireValidPet && item.petId) {
          const isAssigned = isVetAssignedToPet(user.id, item.petId, allExistingPets);
          const isOwnPet = myExistingPetIds.has(item.petId);
          if (!isAssigned && !isOwnPet) return false;
        }
      }

      return true;
    });

    if (toAdd.length > 0) {
      operations.push({ collection, data: [...existing, ...toAdd], isObject: false });
    }
  };

  const queueMergeObject = (collection, newData) => {
    if (!newData || typeof newData !== 'object') return;
    const existing = getCollectionData(collection, true);
    let changed = false;
    for (const [k, v] of Object.entries(newData)) {
      if (user.role !== 'system_admin' && !allowedPetIds.has(k)) {
        continue;
      }
      if (!existing[k]) {
        existing[k] = v;
        changed = true;
      }
    }
    if (changed) {
      operations.push({ collection, data: existing, isObject: true });
    }
  };

  queueMergeArray('pets', validIncomingPets, false);
  queueMergeArray('schedules', schedules, true);
  queueMergeArray('expenses', expenses, true);
  queueMergeArray('daily_logs', daily_logs, true);
  queueMergeArray('prescriptions', prescriptions, true);
  queueMergeArray('family_members', family_members, false);
  queueMergeArray('daily_habits', daily_habits, true);
  queueMergeArray('appointments', appointments, true);
  queueMergeArray('medical_records', medical_records || req.body.medical_records, true);
  
  queueMergeObject('lost_modes', lost_modes);
  queueMergeObject('health_data', health_data);

  if (operations.length > 0) {
    try {
      const ok = saveMultipleCollections(operations);
      if (!ok) {
        return res.status(500).json({ success: false, error: 'Lỗi ghi dữ liệu vào hệ thống lưu trữ khi đồng bộ. Toàn bộ thay đổi đã được hoàn tác.', code: 'TRANSACTION_ROLLBACK' });
      }
    } catch (txErr) {
      if (txErr.code === 'ROLLBACK_FAILED') {
        return res.status(500).json({ success: false, error: txErr.message, code: 'ROLLBACK_FAILED' });
      }
      throw txErr;
    }
  }

  res.json({ success: true, message: 'Migration completed' });
});

// ----------------------------------------------------------------------------
// 2. AI CHATBOT OLLAMA (ĐẶT TRƯỚC /:collection ĐỂ TRÁNH BỊ BẮT VÀO WILDCARD)
// ----------------------------------------------------------------------------
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, petContext } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Tin nhắn không được để trống.' });
    }

    // Xác thực quyền truy cập đối với context thú cưng được gửi lên
    let contextStr = '';
    if (petContext && petContext.id) {
      const pets = getCollectionData('pets', false);
      const pet = pets.find(p => p.id === petContext.id);
      if (pet) {
        const isOwner = pet.ownerId === req.user.id;
        const isVet = req.user.role === 'vet_doctor' && isVetAssignedToPet(req.user.id, pet.id, pets);
        if (req.user.role === 'system_admin' || isOwner || isVet) {
           contextStr = `Thông tin thú cưng đang chọn:
- Tên: ${pet.name}
- Giống: ${pet.breed || 'Chưa ghi nhận'}
- Cân nặng: ${pet.weight ? pet.weight + ' kg' : 'Chưa ghi nhận'}
- Tuổi: ${pet.age ? pet.age + ' tuổi' : 'Chưa ghi nhận'}`;
        }
      }
    }

    // Đọc tài liệu từ thư mục kiến thức nội bộ
    const docsDir = path.join(process.cwd(), 'server', 'data', 'docs');
    let docContents = [];
    if (fs.existsSync(docsDir)) {
      const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.txt') || f.endsWith('.md'));
      for (const file of files) {
        if (file === 'README.md') continue;
        const content = fs.readFileSync(path.join(docsDir, file), 'utf8');
        docContents.push({ file, content });
      }
    }

    if (docContents.length === 0) {
      return res.json({ 
        success: true, 
        reply: 'Chưa có thông tin phù hợp trong tài liệu được cung cấp.', 
        source: null,
        data: {
          reply: 'Chưa có thông tin phù hợp trong tài liệu được cung cấp.',
          source: null
        }
      });
    }

    const VIETNAMESE_STOP_WORDS = new Set([
      'như', 'thế', 'nào', 'làm', 'sao', 'cho', 'của', 'các', 'những', 'được', 'trong',
      'với', 'khi', 'này', 'đó', 'vào', 'hay', 'hoặc', 'nếu', 'thì', 'cũng', 'đã', 'đang',
      'sẽ', 'bị', 'bởi', 'tại', 'từ', 'đến', 'ra', 'vào', 'lên', 'xuống', 'rất', 'quá',
      'lắm', 'nhiều', 'ít', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười',
      'gì', 'ai', 'đâu', 'ở', 'đây', 'thì', 'là', 'và', 'có', 'không'
    ]);

    const keywords = message.toLowerCase()
      .replace(/[.,?!;:()]/g, ' ')
      .split(/\s+/)
      .filter(k => k.length >= 2 && !VIETNAMESE_STOP_WORDS.has(k));

    let bestMatch = null;
    let maxScore = 0;

    for (const doc of docContents) {
      const paragraphs = doc.content.split(/\n\n+/);
      for (const para of paragraphs) {
        const paraLower = para.toLowerCase();
        let score = 0;
        for (const kw of keywords) {
          if (paraLower.includes(kw)) score++;
        }
        if (score > maxScore) {
          maxScore = score;
          bestMatch = { file: doc.file, text: para };
        }
      }
    }

    if (maxScore < 2 || !bestMatch) {
      return res.json({ 
        success: true, 
        reply: 'Chưa có thông tin phù hợp trong tài liệu được cung cấp.',
        source: null,
        data: {
          reply: 'Chưa có thông tin phù hợp trong tài liệu được cung cấp.',
          source: null
        }
      });
    }

    const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
    const ollamaModel = process.env.OLLAMA_MODEL || 'qwen3:1.7b';

    const systemPrompt = `Bạn là trợ lý ảo PetCare. Hãy trả lời câu hỏi của người dùng BẰNG TIẾNG VIỆT, thật NGẮN GỌN và TRỰC TIẾP dựa VÀO DUY NHẤT nội dung tài liệu được cung cấp dưới đây. 
Nếu câu hỏi không liên quan đến tài liệu, hãy trả lời 'Chưa có thông tin phù hợp trong tài liệu được cung cấp.' Không tự bịa thêm thông tin.
Không hiển thị phần suy nghĩ nội bộ (nếu có).
TÀI LIỆU TRÍCH XUẤT (từ ${bestMatch.file}):
${bestMatch.text}

${contextStr}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: message,
          system: systemPrompt,
          stream: false,
          options: {
            num_ctx: 1024
          }
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Ollama server returned error: ' + response.statusText);
      }

      const data = await response.json();
      let finalReply = data.response || '';
      finalReply = finalReply.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

      return res.json({
        success: true,
        reply: finalReply,
        source: bestMatch.file,
        data: {
          reply: finalReply,
          source: bestMatch.file
        }
      });
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Ollama Error:', err);
      // Không trả success=true cho lỗi kết nối rồi hiển thị như câu trả lời thành công
      if (err.name === 'AbortError') {
        return res.status(504).json({ success: false, error: 'Hết thời gian chờ phản hồi từ AI cục bộ Ollama.', code: 'AI_TIMEOUT' });
      }
      return res.status(503).json({ success: false, error: 'Không thể kết nối đến Ollama cục bộ. Vui lòng đảm bảo dịch vụ Ollama đang chạy.', code: 'AI_OFFLINE' });
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, error: 'Lỗi hệ thống máy chủ' });
  }
});

// ----------------------------------------------------------------------------
// 2.1. AI THỊ GIÁC CỤC BỘ (LOCAL AI VISION DIAGNOSTICS & VERIFICATION)
// Tuân thủ nghiêm ngặt: Chỉ dùng Ollama cục bộ, không gửi ảnh ra dịch vụ bên ngoài,
// không tạo kết quả giả mạo, không tự động lưu vào bệnh án/đơn thuốc/lịch trình.
// ----------------------------------------------------------------------------
router.get('/ai/vision-status', async (req, res) => {
  try {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
    const ollamaModel = process.env.OLLAMA_MODEL || 'qwen3:1.7b';

    const isLocal = ollamaUrl.includes('127.0.0.1') || ollamaUrl.includes('localhost');
    if (!isLocal) {
      return res.json({
        success: false,
        isRunning: false,
        supportsVision: false,
        configuredModel: ollamaModel,
        isLocal: false,
        error: 'Chỉ chấp nhận mô hình AI cục bộ (localhost). Không gửi dữ liệu sang dịch vụ bên ngoài.'
      });
    }

    const VISION_MODEL_KEYWORDS = ['llava', 'vision', 'vl', 'clip', 'moondream', 'bakllava', 'minicpm-v', 'mllama'];
    const supportsVision = VISION_MODEL_KEYWORDS.some(kw => ollamaModel.toLowerCase().includes(kw));

    let isRunning = false;
    let installedModels = [];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    try {
      const response = await fetch(`${ollamaUrl}/api/tags`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.ok) {
        isRunning = true;
        const data = await response.json();
        installedModels = (data.models || []).map(m => m.name);
      }
    } catch {
      clearTimeout(timeoutId);
      isRunning = false;
    }

    let statusMessage = '';
    if (!isRunning) {
      statusMessage = `Mô hình AI cục bộ (Ollama) hiện chưa chạy tại ${ollamaUrl}.`;
    } else if (!supportsVision) {
      statusMessage = `Mô hình AI cục bộ đang cấu hình ("${ollamaModel}") là mô hình xử lý văn bản, không hỗ trợ đọc ảnh (Vision).`;
    } else {
      statusMessage = `Mô hình AI thị giác cục bộ ("${ollamaModel}") đang sẵn sàng.`;
    }

    return res.json({
      success: true,
      isRunning,
      supportsVision,
      configuredModel: ollamaModel,
      isLocal: true,
      message: statusMessage,
      installedModels
    });
  } catch (error) {
    console.error('Vision status error:', error);
    return res.status(500).json({ success: false, error: 'Lỗi kiểm tra trạng thái AI cục bộ' });
  }
});

router.post('/ai/vision-analyze', authenticateToken, async (req, res) => {
  try {
    const { petId, imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'Vui lòng cung cấp hình ảnh vi tổn thương cần phân tích.' });
    }

    const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
    const ollamaModel = process.env.OLLAMA_MODEL || 'qwen3:1.7b';

    // 1. Kiểm tra an toàn: Tuyệt đối chỉ dùng URL cục bộ
    const isLocal = ollamaUrl.includes('127.0.0.1') || ollamaUrl.includes('localhost');
    if (!isLocal) {
      return res.status(403).json({
        success: false,
        error: 'Chính sách bảo mật: Hệ thống chỉ dùng mô hình AI cục bộ, không gửi ảnh ra dịch vụ bên ngoài.'
      });
    }

    // 2. Kiểm tra xem mô hình đang cấu hình có hỗ trợ ảnh (Vision) không
    const VISION_MODEL_KEYWORDS = ['llava', 'vision', 'vl', 'clip', 'moondream', 'bakllava', 'minicpm-v', 'mllama'];
    const supportsVision = VISION_MODEL_KEYWORDS.some(kw => ollamaModel.toLowerCase().includes(kw));

    // 3. Kiểm tra kết nối tới dịch vụ Ollama cục bộ
    let isRunning = false;
    const checkController = new AbortController();
    const checkTimeout = setTimeout(() => checkController.abort(), 2000);
    try {
      const ping = await fetch(`${ollamaUrl}/api/tags`, { signal: checkController.signal });
      clearTimeout(checkTimeout);
      isRunning = ping.ok;
    } catch {
      clearTimeout(checkTimeout);
      isRunning = false;
    }

    // Trường hợp 1: Mô hình chưa chạy
    if (!isRunning) {
      return res.status(503).json({
        success: false,
        code: 'AI_OFFLINE',
        error: `Mô hình AI cục bộ (Ollama) hiện chưa chạy tại ${ollamaUrl}. Vui lòng khởi động Ollama trên máy tính trước khi phân tích. Để đảm bảo an toàn y khoa tuyệt đối, hệ thống không tạo kết quả chẩn đoán giả lập hoặc dùng dữ liệu mẫu.`,
        configuredModel: ollamaModel,
        isRunning: false,
        supportsVision
      });
    }

    // Trường hợp 2: Mô hình đang chạy nhưng không hỗ trợ ảnh (ví dụ qwen3:1.7b là text-only)
    if (!supportsVision) {
      return res.status(422).json({
        success: false,
        code: 'MODEL_NOT_VISION_CAPABLE',
        error: `Mô hình AI cục bộ đang cấu hình ("${ollamaModel}") là mô hình ngôn ngữ văn bản, không hỗ trợ đọc hoặc phân tích hình ảnh (Vision). Để đảm bảo an toàn y khoa tuyệt đối cho thú cưng, hệ thống không tạo kết quả chẩn đoán giả lập hoặc dùng dữ liệu mẫu.`,
        configuredModel: ollamaModel,
        isRunning: true,
        supportsVision: false
      });
    }

    // Trường hợp 3: Có mô hình Vision thực sự chạy cục bộ (ví dụ llava)
    const runController = new AbortController();
    const runTimeout = setTimeout(() => runController.abort(), 30000);

    try {
      const response = await fetch(`${ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaModel,
          prompt: 'Bạn là trợ lý AI thú y cục bộ. Hãy quan sát kỹ vùng da/lông của thú cưng trong ảnh và mô tả khách quan dấu hiệu lâm sàng nhìn thấy được (màu sắc, vùng rụng lông, mẩn đỏ, mụn mủ hoặc tổn thương bề mặt). Đưa ra lời khuyên chăm sóc sơ bộ và khuyến nghị chủ nuôi đưa thú cưng đến phòng khám thú y. Trả lời bằng tiếng Việt ngắn gọn, chuyên nghiệp.',
          images: [imageBase64],
          stream: false
        }),
        signal: runController.signal
      });
      clearTimeout(runTimeout);

      if (!response.ok) {
        throw new Error('Ollama trả về mã lỗi: ' + response.statusText);
      }

      const data = await response.json();
      const analysisText = (data.response || '').trim();

      // TUYỆT ĐỐI KHÔNG TỰ ĐỘNG LƯU VÀO BỆNH ÁN, ĐƠN THUỐC HOẶC LỊCH CHĂM SÓC
      return res.json({
        success: true,
        analysis: analysisText,
        model: ollamaModel,
        isLocal: true,
        autoSaved: false
      });
    } catch (err) {
      clearTimeout(runTimeout);
      console.error('Ollama vision generate error:', err);
      if (err.name === 'AbortError') {
        return res.status(504).json({ success: false, code: 'AI_TIMEOUT', error: 'Hết thời gian chờ phản hồi từ mô hình AI thị giác cục bộ.' });
      }
      return res.status(500).json({ success: false, error: 'Lỗi khi gửi ảnh tới mô hình AI cục bộ: ' + err.message });
    }
  } catch (error) {
    console.error('Vision analysis error:', error);
    return res.status(500).json({ success: false, error: 'Lỗi xử lý yêu cầu phân tích hình ảnh' });
  }
});

// Mutex tránh xung đột race condition khi toggle lịch chăm sóc cùng lúc
const toggleScheduleLocks = new Map();

async function acquireScheduleLock(scheduleId) {
  while (toggleScheduleLocks.has(scheduleId)) {
    await toggleScheduleLocks.get(scheduleId);
  }
  let resolver;
  const promise = new Promise(resolve => { resolver = resolve; });
  toggleScheduleLocks.set(scheduleId, promise);
  return () => {
    toggleScheduleLocks.delete(scheduleId);
    resolver();
  };
}

// ----------------------------------------------------------------------------
// 2.5. HOÀN THÀNH LỊCH CHĂM SÓC LẶP TRONG MỘT GIAO DỊCH DUY NHẤT (ATOMIC SCHEDULE TOGGLE)
// ----------------------------------------------------------------------------
router.post('/schedules/:id/toggle-complete', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const releaseLock = await acquireScheduleLock(id);

  try {
    const schedules = getCollectionData('schedules', false);
    const index = schedules.findIndex(s => s.id === id);
    if (index === -1) {
      return res.status(404).json({
        success: false,
        error: 'Lịch chăm sóc không tồn tại trong hệ thống.',
        code: 'SCHEDULE_NOT_FOUND'
      });
    }

    const currentSchedule = schedules[index];
    const allPets = getCollectionData('pets', false);

    // Kiểm tra phân quyền truy cập
    if (req.user.role !== 'system_admin') {
      if (req.user.role === 'pet_owner') {
        if (currentSchedule.ownerId && currentSchedule.ownerId !== req.user.id) {
          return res.status(403).json({
            success: false,
            error: 'Bạn không có quyền thay đổi trạng thái lịch chăm sóc của người khác.',
            code: 'FORBIDDEN'
          });
        }
      } else if (req.user.role === 'vet_doctor') {
        const isAssigned = isVetAssignedToPet(req.user.id, currentSchedule.petId, allPets);
        if (!isAssigned) {
          return res.status(403).json({
            success: false,
            error: 'Bác sĩ không được phân công chăm sóc thú cưng này.',
            code: 'FORBIDDEN'
          });
        }
      }
    }

    // Xác định trạng thái mong muốn: nếu gửi explicit completed thì dùng, ngược lại đảo ngược trạng thái hiện tại
    let isNowCompleted;
    if (req.body && typeof req.body.completed === 'boolean') {
      isNowCompleted = req.body.completed;
    } else {
      isNowCompleted = !currentSchedule.completed;
    }

    // Chống tạo trùng khi gửi lại request hoặc thử lại sau lỗi (Anti-replay / Idempotency)
    // Nếu request yêu cầu completed mà bản ghi ĐÃ completed rồi:
    if (isNowCompleted && currentSchedule.completed) {
      const existingNext = currentSchedule.nextRecurrenceId
        ? schedules.find(s => s.id === currentSchedule.nextRecurrenceId)
        : schedules.find(s => s.parentScheduleId === currentSchedule.id && !s.completed);
      return res.json({
        success: true,
        data: {
          updatedSchedule: currentSchedule,
          nextSchedule: existingNext || null
        }
      });
    }

    const updatedItem = {
      ...currentSchedule,
      completed: isNowCompleted,
      completedAt: isNowCompleted ? (currentSchedule.completedAt || new Date().toISOString()) : null
    };

    let nextSchedule = null;
    if (isNowCompleted && currentSchedule.repeat && currentSchedule.repeat !== 'none') {
      const existingNext = currentSchedule.nextRecurrenceId
        ? schedules.find(s => s.id === currentSchedule.nextRecurrenceId)
        : schedules.find(s => s.parentScheduleId === currentSchedule.id && !s.completed);

      if (existingNext) {
        nextSchedule = existingNext;
        updatedItem.nextRecurrenceId = existingNext.id;
      } else {
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

        // Kiểm tra xem đã có lịch chưa hoàn thành trùng petId, title và nextDateStr hay chưa
        const titleKey = currentSchedule.title || currentSchedule.task || currentSchedule.activity;
        const duplicatePending = schedules.find(s =>
          s.petId === currentSchedule.petId &&
          (s.title || s.task || s.activity) === titleKey &&
          s.date === nextDateStr &&
          !s.completed
        );

        if (duplicatePending) {
          nextSchedule = duplicatePending;
          updatedItem.nextRecurrenceId = duplicatePending.id;
        } else {
          const nextId = `sch-${Date.now()}-next`;
          updatedItem.nextRecurrenceId = nextId;
          nextSchedule = {
            ...currentSchedule,
            id: nextId,
            parentScheduleId: currentSchedule.id,
            nextRecurrenceId: null,
            date: nextDateStr,
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString()
          };
        }
      }
    }

    // Giao dịch nguyên tử (Atomic transaction): Cập nhật trạng thái và tạo lịch tiếp theo trong cùng 1 lần lưu
    const updatedSchedules = [...schedules];
    updatedSchedules[index] = updatedItem;
    if (nextSchedule && !schedules.some(s => s.id === nextSchedule.id)) {
      updatedSchedules.unshift(nextSchedule);
    }

    const ok = saveCollectionData('schedules', updatedSchedules);
    if (!ok) {
      return res.status(500).json({
        success: false,
        error: 'Lỗi ghi dữ liệu lịch chăm sóc vào hệ thống lưu trữ. Toàn bộ thao tác đã bị hủy bỏ và không làm thay đổi trạng thái.',
        code: 'STORAGE_WRITE_ERROR'
      });
    }

    return res.json({
      success: true,
      data: {
        updatedSchedule: updatedItem,
        nextSchedule
      }
    });
  } catch (err) {
    console.error('Error toggling schedule complete:', err);
    return res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ khi cập nhật lịch chăm sóc.',
      code: 'SERVER_ERROR'
    });
  } finally {
    releaseLock();
  }
});

// Mutex tránh xung đột race condition khi chốt bệnh án và hoàn thành lịch khám
const finalizeEhrLocks = new Map();

async function acquireFinalizeEhrLock(appointmentId) {
  while (finalizeEhrLocks.has(appointmentId)) {
    await finalizeEhrLocks.get(appointmentId);
  }
  let resolver;
  const promise = new Promise(resolve => { resolver = resolve; });
  finalizeEhrLocks.set(appointmentId, promise);
  return () => {
    finalizeEhrLocks.delete(appointmentId);
    resolver();
  };
}

// ----------------------------------------------------------------------------
// 2.6. CHỐT BỆNH ÁN & HOÀN THÀNH LỊCH KHÁM TRONG MỘT GIAO DỊCH DUY NHẤT (ATOMIC EHR SIGN-OFF)
// ----------------------------------------------------------------------------
const handleFinalizeEhr = async (req, res) => {
  const appointmentId = req.params.id || req.body.appointmentId;
  const { petId, soap, notes, recordId } = req.body;

  if (!appointmentId || typeof appointmentId !== 'string' || !appointmentId.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Mã lịch khám (appointmentId) là bắt buộc.',
      code: 'MISSING_APPOINTMENT_ID'
    });
  }

  if (!petId || typeof petId !== 'string' || !petId.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Mã thú cưng (petId) là bắt buộc.',
      code: 'MISSING_PET_ID'
    });
  }

  // 1. Phân quyền: Chỉ Bác sĩ thú y hoặc Quản trị viên mới có quyền chốt bệnh án
  if (req.user.role !== 'vet_doctor' && req.user.role !== 'system_admin') {
    return res.status(403).json({
      success: false,
      error: 'Chỉ Bác sĩ thú y hoặc Quản trị viên mới có quyền chốt bệnh án và hoàn tất ca khám.',
      code: 'FORBIDDEN'
    });
  }

  const releaseLock = await acquireFinalizeEhrLock(appointmentId);
  try {
    const appointments = getCollectionData('appointments', false);
    const medicalRecords = getCollectionData('medical_records', false);
    const allPets = getCollectionData('pets', false);

    // 2. Kiểm tra sự tồn tại của lịch khám
    const appIndex = appointments.findIndex(a => a.id === appointmentId);
    if (appIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Lịch khám không tồn tại trong hệ thống.',
        code: 'APPOINTMENT_NOT_FOUND'
      });
    }
    const appointment = appointments[appIndex];

    // 3. Kiểm tra quan hệ appointmentId–petId
    if (appointment.petId !== petId) {
      return res.status(400).json({
        success: false,
        error: 'Thú cưng không khớp với thông tin đã đăng ký trong lịch khám (sai quan hệ appointmentId–petId).',
        code: 'PET_MISMATCH'
      });
    }

    const pet = allPets.find(p => p.id === petId);
    if (!pet) {
      return res.status(404).json({
        success: false,
        error: 'Thú cưng liên kết với lịch khám không tồn tại trong hệ thống.',
        code: 'PET_NOT_FOUND'
      });
    }

    // 4. Kiểm tra phân công bác sĩ phụ trách ca khám
    if (req.user.role === 'vet_doctor') {
      const apptVetId = appointment.assignedVetId || appointment.vetId;
      if (apptVetId && apptVetId !== req.user.id) {
        return res.status(403).json({
          success: false,
          error: 'Bạn không phải là bác sĩ được phân công phụ trách ca khám này. Chỉ bác sĩ phụ trách ca khám hoặc quản trị viên mới có quyền chốt ca.',
          code: 'FORBIDDEN_NOT_ASSIGNED_VET'
        });
      }
      const assigned = isVetAssignedToPet(req.user.id, pet.id, allPets, appointments);
      if (!assigned) {
        return res.status(403).json({
          success: false,
          error: 'Bác sĩ không được phân công phụ trách thú cưng này.',
          code: 'FORBIDDEN'
        });
      }
    }

    // 5. Kiểm tra trạng thái hiện tại & Chống chốt lặp / Xử lý trùng khi bấm nhiều lần (Anti-replay / Idempotency)
    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Lịch khám đã bị hủy, không thể chốt bệnh án hoặc hoàn thành.',
        code: 'INVALID_STATUS'
      });
    }

    // Kiểm tra tính toàn vẹn của recordId nếu client truyền lên
    const recordByApp = medicalRecords.find(r => r.appointmentId === appointmentId);
    let recordById = null;
    if (recordId && typeof recordId === 'string' && recordId.trim()) {
      recordById = medicalRecords.find(r => r.id === recordId.trim());
      if (recordById) {
        if (recordById.appointmentId && recordById.appointmentId !== appointmentId) {
          return res.status(400).json({
            success: false,
            error: 'Mã bệnh án (recordId) đã thuộc về một ca khám khác. Không được phép liên kết chéo.',
            code: 'RECORD_MISMATCH'
          });
        }
        if (recordById.petId && recordById.petId !== petId) {
          return res.status(400).json({
            success: false,
            error: 'Mã bệnh án (recordId) đã thuộc về một thú cưng khác. Không được phép liên kết chéo.',
            code: 'RECORD_MISMATCH'
          });
        }
      }
      if (recordByApp && recordById && recordByApp.id !== recordById.id) {
        return res.status(400).json({
          success: false,
          error: 'Xung đột mã bệnh án: Ca khám này đã liên kết với bệnh án khác trong hệ thống.',
          code: 'RECORD_MISMATCH'
        });
      }
    }

    const existingRecord = recordByApp || recordById;

    // Chống ghi đè bệnh án đã chốt và chống chốt lại khi ca khám đã hoàn thành
    if (existingRecord && existingRecord.isFinal) {
      const allPrescriptions = getCollectionData('prescriptions', false);
      const existingPrescription = allPrescriptions.find(p => 
        (p.medicalRecordId && p.medicalRecordId === existingRecord.id) ||
        (p.appointmentId && p.appointmentId === appointmentId)
      ) || null;

      // Bệnh án đã chốt trước đó: Tuyệt đối không ghi đè nội dung mới, trả về bản ghi hiện tại an toàn
      return res.json({
        success: true,
        message: 'Bệnh án đã được chốt và lịch khám đã hoàn thành trước đó.',
        data: {
          appointment: appointment.status === 'completed' ? appointment : { ...appointment, status: 'completed' },
          medicalRecord: existingRecord,
          prescription: existingPrescription
        }
      });
    }

    if (appointment.status === 'completed' && (!existingRecord || !existingRecord.isFinal)) {
      return res.status(400).json({
        success: false,
        error: 'Lịch khám đã ở trạng thái hoàn thành từ trước.',
        code: 'APPOINTMENT_ALREADY_COMPLETED'
      });
    }

    // 6. Chuẩn bị dữ liệu bệnh án chốt (isFinal = true, status = published) và lịch khám completed
    const recordIndex = existingRecord ? medicalRecords.findIndex(r => r.id === existingRecord.id) : -1;
    const nowIso = new Date().toISOString();
    const targetRecordId = (recordIndex !== -1) ? medicalRecords[recordIndex].id : (recordId || `med-${Date.now()}`);
    const existing = (recordIndex !== -1) ? medicalRecords[recordIndex] : null;

    const finalizedRecord = {
      ...(existing || {}),
      id: targetRecordId,
      appointmentId,
      petId,
      ownerId: pet.ownerId, // gắn đúng ownerId của chủ thú cưng để chủ xem được khi isFinal = true
      authorId: req.user.id,
      authorName: req.user.name,
      vetId: req.user.id,
      soap: soap || existing?.soap || {},
      assessment: soap?.assessment || req.body.assessment || existing?.assessment || '',
      plan: soap?.plan || req.body.plan || existing?.plan || '',
      notes: notes || soap?.notes || existing?.notes || '',
      isFinal: true,
      status: 'published',
      confirmedAt: existing?.confirmedAt || nowIso,
      confirmedBy: existing?.confirmedBy || req.user.name,
      updatedAt: nowIso,
      createdAt: existing?.createdAt || nowIso
    };

    const updatedAppointment = {
      ...appointment,
      status: 'completed',
      completedAt: appointment.completedAt || nowIso,
      updatedAt: nowIso
    };

    // 7. Xử lý đơn thuốc (Prescriptions) thống nhất với Bệnh án lâm sàng:
    const allPrescriptions = getCollectionData('prescriptions', false);
    const existingPresIndex = allPrescriptions.findIndex(p => 
      (p.medicalRecordId && p.medicalRecordId === targetRecordId) ||
      (p.appointmentId && p.appointmentId === appointmentId)
    );
    const existingPrescription = existingPresIndex !== -1 ? allPrescriptions[existingPresIndex] : null;

    // Trích xuất danh sách thuốc từ SOAP form
    const rawMeds = soap?.planMedications || soap?.prescriptions || req.body.medications || req.body.prescriptions || [];
    const validMeds = Array.isArray(rawMeds) ? rawMeds.filter(m => m && typeof m.name === 'string' && m.name.trim().length > 0) : [];

    let updatedPrescriptions = [...allPrescriptions];
    let finalizedPrescription = null;

    if (validMeds.length > 0) {
      // Chuẩn hóa danh sách thuốc chi tiết
      const normalizedMedications = validMeds.map(m => {
        const d = Number(m.days || m.durationDays) || 7;
        const doseStr = String(m.dose || m.dosage || '').trim();
        const routeStr = String(m.route || '').trim();
        const freqStr = String(m.freq || '').trim();
        const usageStr = String(m.instructions || m.instruction || m.usage || m.notes || '').trim();
        return {
          name: m.name.trim(),
          dose: doseStr,
          dosage: doseStr,
          route: routeStr,
          freq: freqStr,
          startDate: m.startDate ? getVnDateString(m.startDate) : getTodayVnDate(),
          days: d,
          durationDays: d,
          instructions: usageStr,
          usage: usageStr,
          quantity: m.quantity !== undefined ? m.quantity : ''
        };
      });

      const firstMed = normalizedMedications[0];
      const prescriptionId = existingPrescription?.id || `pres-${targetRecordId.replace(/^med-/, '')}`;

      finalizedPrescription = {
        ...(existingPrescription || {}),
        id: prescriptionId,
        medicalRecordId: targetRecordId,
        appointmentId,
        petId,
        ownerId: pet.ownerId, // Server enforce từ hồ sơ pet thực tế, tuyệt đối không tin client
        vetId: req.user.id,   // Server enforce từ session bác sĩ đang đăng nhập
        prescribedBy: req.user.name,
        vetName: req.user.name,
        diagnosis: finalizedRecord.assessment || 'Đơn thuốc điều trị theo bệnh án SOAP',
        title: `Đơn thuốc: ${finalizedRecord.assessment || firstMed.name}`,
        medications: normalizedMedications,
        // Các trường tương thích ngược cấp root cho PrescriptionsView & dữ liệu legacy:
        medicineName: normalizedMedications.map(m => m.name).join(', '),
        dosage: normalizedMedications.map(m => `${m.name}: ${m.dose || 'Theo chỉ định'}`).join('; '),
        startDate: firstMed.startDate,
        durationDays: Number(firstMed.days) || 7,
        purpose: finalizedRecord.assessment || 'Điều trị theo chỉ định bác sĩ',
        notes: finalizedRecord.plan || firstMed.instructions || '',
        isFinal: true,
        status: 'published',
        confirmedAt: existingPrescription?.confirmedAt || nowIso,
        createdAt: existingPrescription?.createdAt || nowIso,
        updatedAt: nowIso
      };

      if (existingPresIndex !== -1) {
        updatedPrescriptions[existingPresIndex] = finalizedPrescription;
      } else {
        updatedPrescriptions.unshift(finalizedPrescription);
      }
    } else {
      // Trường hợp không kê thuốc: Chốt được bình thường và KHÔNG tạo đơn rỗng giả!
      // Nếu trước đó có bản nháp chưa chốt cho ca khám này mà giờ xóa hết thuốc, dọn dẹp nháp
      if (existingPresIndex !== -1 && !existingPrescription?.isFinal) {
        updatedPrescriptions.splice(existingPresIndex, 1);
      }
    }

    // 8. Giao dịch nguyên tử đa tệp (Atomic Multi-Collection Transaction):
    // Cập nhật đồng thời medical_records, appointments và prescriptions (nếu có kê thuốc).
    // Nếu 1 bước thất bại -> Rollback toàn bộ!
    const updatedRecords = [...medicalRecords];
    if (recordIndex !== -1) {
      updatedRecords[recordIndex] = finalizedRecord;
    } else {
      updatedRecords.unshift(finalizedRecord);
    }

    const updatedAppointments = [...appointments];
    updatedAppointments[appIndex] = updatedAppointment;

    const operations = [
      { collection: 'medical_records', data: updatedRecords, isObject: false },
      { collection: 'appointments', data: updatedAppointments, isObject: false }
    ];

    if (validMeds.length > 0 || (existingPresIndex !== -1 && !existingPrescription?.isFinal)) {
      operations.push({ collection: 'prescriptions', data: updatedPrescriptions, isObject: false });
    }

    try {
      const ok = saveMultipleCollections(operations);
      if (!ok) {
        return res.status(500).json({
          success: false,
          error: 'Lỗi ghi dữ liệu hệ thống khi chốt bệnh án. Toàn bộ thay đổi đã được hoàn tác.',
          code: 'TRANSACTION_ROLLBACK'
        });
      }
    } catch (txErr) {
      if (txErr.code === 'ROLLBACK_FAILED') {
        return res.status(500).json({
          success: false,
          error: txErr.message,
          code: 'ROLLBACK_FAILED'
        });
      }
      throw txErr;
    }

    return res.json({
      success: true,
      message: 'Chốt bệnh án, hoàn thành lịch khám và ban hành đơn thuốc thành công.',
      data: {
        appointment: updatedAppointment,
        medicalRecord: finalizedRecord,
        prescription: finalizedPrescription
      }
    });
  } catch (err) {
    console.error('Error finalizing EHR and appointment:', err);
    return res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ khi chốt bệnh án và hoàn thành lịch khám.',
      code: 'SERVER_ERROR'
    });
  } finally {
    releaseLock();
  }
};

router.post('/medical-records/finalize-ehr', authenticateToken, handleFinalizeEhr);
router.post('/appointments/:id/finalize-ehr', authenticateToken, handleFinalizeEhr);

// ----------------------------------------------------------------------------
// 2.9. KIỂM TRA TRẠNG THÁI KHUNG GIỜ LỊCH HẸN (APPOINTMENT SLOT AVAILABILITY)
// ----------------------------------------------------------------------------
router.get('/appointments/slot-availability', authenticateToken, (req, res) => {
  try {
    const { date, petId, facility } = req.query;
    const targetDate = normalizeDateToYmd(date) || (date ? String(date).trim() : '');
    
    console.log(`[SLOT AVAILABILITY DEBUG] Tra cứu trạng thái khung giờ:`, {
      requestedDate: date,
      normalizedDate: targetDate,
      petId: petId || null,
      facility: facility || null,
      requestedBy: req.user?.id,
      userRole: req.user?.role
    });

    const standardSlots = ['08:30', '09:30', '14:00', '16:30', '19:00'];
    const allAppointments = getCollectionData('appointments', false) || [];

    // Lọc các lịch hẹn còn hiệu lực trong ngày targetDate
    const activeAppsForDate = allAppointments.filter(app => {
      if (app.status === 'cancelled') return false;
      const appDate = normalizeDateToYmd(app.date) || app.date;
      return appDate === targetDate;
    });

    const MAX_SLOT_CAPACITY_PER_FACILITY = 3;

    const slotsResult = standardSlots.map(slot => {
      // 1. Kiểm tra thú cưng này đã có lịch hẹn trong khung giờ chưa
      let isPetBooked = false;
      let petConflictAppointment = null;
      if (petId) {
        petConflictAppointment = activeAppsForDate.find(app => {
          const appTime = app.time || app.timeSlot;
          return appTime === slot && String(app.petId) === String(petId);
        });
        if (petConflictAppointment) {
          isPetBooked = true;
        }
      }

      // 2. Kiểm tra giới hạn số lượng cuộc hẹn tại cơ sở / phòng khám
      const sameSlotBookings = activeAppsForDate.filter(app => {
        const appTime = app.time || app.timeSlot;
        if (appTime !== slot) return false;
        if (facility) {
          const appFacility = app.facility || app.clinic_id;
          return appFacility === facility;
        }
        return true;
      });

      const bookedCount = sameSlotBookings.length;
      const isCapacityReached = bookedCount >= MAX_SLOT_CAPACITY_PER_FACILITY;

      let available = true;
      let reason = null;
      let reasonCode = null;

      if (isPetBooked) {
        available = false;
        reason = 'Trùng lịch bé';
        reasonCode = 'PET_CONFLICT';
      } else if (isCapacityReached) {
        available = false;
        reason = 'Đã kín lịch';
        reasonCode = 'CAPACITY_REACHED';
      }

      return {
        time: slot,
        available,
        disabled: !available,
        reason,
        reasonCode,
        bookedCount,
        maxCapacity: MAX_SLOT_CAPACITY_PER_FACILITY,
        isPetBooked
      };
    });

    return res.json({
      success: true,
      date: targetDate,
      petId: petId || null,
      facility: facility || null,
      slots: slotsResult
    });
  } catch (err) {
    console.error('Lỗi khi tra cứu slot availability:', err);
    return res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ khi tra cứu khung giờ khả dụng.',
      code: 'SERVER_ERROR'
    });
  }
});

// ----------------------------------------------------------------------------
// 3. GENERIC GET LIST (Phân quyền 3 vai trò, đồng bộ xem bệnh án)
// ----------------------------------------------------------------------------
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
    const allPets = getCollectionData('pets', false);
    const userPets = allPets.filter(p => p.ownerId === user.id);
    let allowedKeys = userPets.map(p => p.id);
    
    if (user.role === 'vet_doctor') {
      const appointments = getCollectionData('appointments', false) || [];
      const assignedPets = allPets.filter(p => isVetAssignedToPet(user.id, p.id, allPets, appointments));
      allowedKeys = [...new Set([...allowedKeys, ...assignedPets.map(p => p.id)])];
    }

    const result = {};
    for (const key of allowedKeys) {
      if (data[key]) result[key] = data[key];
    }
    return res.json(result);
  } else {
    let result = [];
    if (user.role === 'pet_owner') {
      // Người nuôi thấy các bản ghi thuộc quyền sở hữu của mình
      result = data.filter(item => String(item.ownerId).trim() === String(user.id).trim());
      // Bệnh án & Đơn thuốc: Người nuôi chỉ được đọc hồ sơ chuyên môn đã công bố / đã ký chốt (isRecordPublished: isFinal === true && status === 'published')
      if (collection === 'medical_records' || collection === 'prescriptions') {
        result = result.filter(item => isRecordPublished(item));
      }
    } else if (user.role === 'vet_doctor') {
      const allPets = getCollectionData('pets', false);
      const appointments = getCollectionData('appointments', false) || [];
      const assignedPetIds = new Set(
        allPets.filter(p => isVetAssignedToPet(user.id, p.id, allPets, appointments)).map(p => p.id)
      );
      
      if (collection === 'pets') {
        result = data.filter(item => assignedPetIds.has(item.id));
      } else if (collection === 'medical_records' || collection === 'prescriptions') {
        // Bác sĩ thấy các ca được phân công hoặc do chính mình tạo
        result = data.filter(item => assignedPetIds.has(item.petId) || item.authorId === user.id || item.vetId === user.id);
      } else if (collection === 'appointments') {
        // Bác sĩ thấy các ca được phân công cho mình VÀ các ca chờ tiếp nhận trong hàng đợi phòng khám
        result = data.filter(item => 
          !item.assignedVetId || 
          item.status === 'pending' || 
          item.assignedVet === 'Đang xếp lịch' || 
          item.assignedVetId === user.id || 
          item.vetId === user.id ||
          assignedPetIds.has(item.petId)
        );
      } else {
        result = data.filter(item => assignedPetIds.has(item.petId));
      }
    }
    return res.json(result);
  }
});

// ----------------------------------------------------------------------------
// 3.1. GENERIC GET BY ID (Kiểm tra quyền đọc theo ID, ẩn đơn nháp đối với chủ nuôi)
// ----------------------------------------------------------------------------
router.get('/:collection/:id', authenticateToken, (req, res) => {
  const { collection, id } = req.params;
  if (!getAllowedCollections().includes(collection)) {
    return res.status(404).json({ success: false, error: 'Collection not found' });
  }

  const isObject = COLLECTION_TYPES[collection] === 'object';
  const data = getCollectionData(collection, isObject);

  if (isObject) {
    const allPets = getCollectionData('pets', false);
    const pet = allPets.find(p => p.id === id);
    if (!pet && req.user.role !== 'system_admin') {
      return res.status(404).json({ success: false, error: 'Thú cưng không tồn tại.' });
    }
    if (req.user.role === 'pet_owner') {
      if (!pet || pet.ownerId !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền truy cập dữ liệu của thú cưng này.' });
      }
    } else if (req.user.role === 'vet_doctor') {
      const appointments = getCollectionData('appointments', false) || [];
      const isAssigned = isVetAssignedToPet(req.user.id, id, allPets, appointments);
      if (!isAssigned) {
        return res.status(403).json({ success: false, error: 'Bác sĩ không được phân công chăm sóc thú cưng này.' });
      }
    }
    return res.json({ success: true, data: data[id] || null });
  } else {
    const item = data.find(it => String(it.id) === String(id));
    if (!item) {
      return res.status(404).json({ success: false, error: 'Bản ghi không tồn tại.' });
    }

    if (req.user.role === 'pet_owner') {
      if (String(item.ownerId) !== String(req.user.id)) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền truy cập bản ghi này.' });
      }
      if (collection === 'medical_records' || collection === 'prescriptions') {
        if (!isRecordPublished(item)) {
          return res.status(404).json({ success: false, error: 'Bản ghi đang ở trạng thái bản nháp hoặc chưa công bố.' });
        }
      }
    } else if (req.user.role === 'vet_doctor') {
      const allPets = getCollectionData('pets', false);
      const appointments = getCollectionData('appointments', false) || [];
      const isAssigned = isVetAssignedToPet(req.user.id, item.petId || item.id, allPets, appointments);
      const isAuthor = item.authorId === req.user.id || item.vetId === req.user.id;
      if (!isAssigned && !isAuthor) {
        return res.status(403).json({ success: false, error: 'Bác sĩ không được phân công phụ trách bản ghi này.' });
      }
    }

    return res.json({ success: true, data: item });
  }
});

// ----------------------------------------------------------------------------
// 3.9. TẢI VÀ LƯU ẢNH ĐẠI DIỆN THÚ CƯNG (PET AVATAR UPLOAD)
// Kiểm tra quyền sửa thú cưng, kiểm tra loại tệp (JPG, JPEG, PNG, WebP), dung lượng tối đa 5 MB
// ----------------------------------------------------------------------------
router.post('/pets/upload-avatar', authenticateToken, async (req, res) => {
  try {
    const { fileData, petId } = req.body || {};

    if (!fileData || typeof fileData !== 'string' || !fileData.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu tệp ảnh không được để trống.',
        code: 'MISSING_FILE_DATA'
      });
    }

    // 1. Kiểm tra phân quyền sửa thú cưng nếu truyền petId
    if (petId) {
      const allPets = getCollectionData('pets', false) || [];
      const targetPet = allPets.find(p => p.id === String(petId).trim());
      if (targetPet) {
        if (req.user.role === 'pet_owner') {
          if (String(targetPet.ownerId).trim() !== String(req.user.id).trim()) {
            return res.status(403).json({
              success: false,
              error: 'Bạn không có quyền thay đổi ảnh đại diện của thú cưng này.',
              code: 'FORBIDDEN_NOT_PET_OWNER'
            });
          }
        } else if (req.user.role === 'vet_doctor') {
          const appointments = getCollectionData('appointments', false) || [];
          const isAssigned = isVetAssignedToPet(req.user.id, targetPet.id, allPets, appointments);
          if (!isAssigned) {
            return res.status(403).json({
              success: false,
              error: 'Bác sĩ không được phân công chăm sóc thú cưng này.',
              code: 'FORBIDDEN_NOT_ASSIGNED_VET'
            });
          }
        }
      }
    }

    // 2. Kiểm tra định dạng qua MIME header của Data URL
    // Chấp nhận JPG, JPEG, PNG, WebP
    const dataUrlMatch = /^data:(image\/(jpeg|jpg|png|webp));base64,(.+)$/i.exec(fileData.trim());
    if (!dataUrlMatch) {
      return res.status(400).json({
        success: false,
        error: 'Định dạng tệp không được hỗ trợ. Hệ thống chỉ chấp nhận ảnh JPG, JPEG, PNG hoặc WebP.',
        code: 'INVALID_FILE_TYPE'
      });
    }

    const mimeType = dataUrlMatch[1].toLowerCase();
    const base64Data = dataUrlMatch[3];
    const buffer = Buffer.from(base64Data, 'base64');

    // 3. Kiểm tra dung lượng tệp (Tối đa 5 MB = 5 * 1024 * 1024 bytes)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (buffer.length > MAX_SIZE_BYTES) {
      const sizeMb = (buffer.length / (1024 * 1024)).toFixed(2);
      return res.status(400).json({
        success: false,
        error: `Dung lượng tệp ảnh (${sizeMb} MB) vượt quá giới hạn tối đa cho phép là 5 MB.`,
        code: 'FILE_TOO_LARGE'
      });
    }

    if (buffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nội dung tệp ảnh rỗng.',
        code: 'EMPTY_FILE'
      });
    }

    // 4. Kiểm tra chữ ký Magic Bytes của ảnh thực tế
    let ext = '.jpg';
    if (mimeType.includes('png')) {
      // PNG magic bytes: 89 50 4E 47
      if (buffer.length < 8 || buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4E || buffer[3] !== 0x47) {
        return res.status(400).json({
          success: false,
          error: 'Tệp không phải là ảnh PNG hợp lệ.',
          code: 'INVALID_PNG_DATA'
        });
      }
      ext = '.png';
    } else if (mimeType.includes('webp')) {
      // WebP magic bytes: RIFF....WEBP
      if (buffer.length < 12 || buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
        return res.status(400).json({
          success: false,
          error: 'Tệp không phải là ảnh WebP hợp lệ.',
          code: 'INVALID_WEBP_DATA'
        });
      }
      ext = '.webp';
    } else {
      // JPEG magic bytes: FF D8 FF
      if (buffer.length < 3 || buffer[0] !== 0xFF || buffer[1] !== 0xD8 || buffer[2] !== 0xFF) {
        return res.status(400).json({
          success: false,
          error: 'Tệp không phải là ảnh JPG/JPEG hợp lệ.',
          code: 'INVALID_JPEG_DATA'
        });
      }
      ext = '.jpg';
    }

    // 5. Lưu tệp thật vào thư mục uploads/avatars trên backend
    const uploadsDir = path.join(process.cwd(), 'server', 'uploads', 'avatars');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const safePetPrefix = petId ? String(petId).replace(/[^a-zA-Z0-9_-]/g, '') : 'pet';
    const randomSuffix = crypto.randomBytes(6).toString('hex');
    const savedFileName = `${safePetPrefix}-${Date.now()}-${randomSuffix}${ext}`;
    const targetFilePath = path.join(uploadsDir, savedFileName);

    fs.writeFileSync(targetFilePath, buffer);

    const publicUrl = `/api/uploads/avatars/${savedFileName}`;

    return res.json({
      success: true,
      message: 'Tải ảnh đại diện thành công.',
      url: publicUrl,
      data: {
        url: publicUrl,
        fileName: savedFileName,
        size: buffer.length,
        mimeType
      }
    });
  } catch (err) {
    console.error('Lỗi khi tải ảnh đại diện thú cưng:', err);
    return res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ khi xử lý tệp ảnh.',
      code: 'SERVER_ERROR'
    });
  }
});

// ----------------------------------------------------------------------------
// 4. GENERIC POST CREATE (Chặn trường đặc quyền, liên kết đúng chủ thú cưng)
// ----------------------------------------------------------------------------
router.post('/:collection', authenticateToken, (req, res) => {
  const { collection } = req.params;
  if (!getAllowedCollections().includes(collection)) {
    return res.status(404).json({ success: false, error: 'Collection not found' });
  }

  const isObject = COLLECTION_TYPES[collection] === 'object';
  if (isObject) {
    return res.status(400).json({ success: false, error: 'Use PUT for object collections' });
  }

  // Chặn người nuôi tự tạo bệnh án hoặc đơn thuốc bác sĩ
  if (req.user.role === 'pet_owner' && (collection === 'medical_records' || collection === 'prescriptions')) {
    return res.status(403).json({
      success: false,
      error: 'Chỉ Bác sĩ thú y hoặc Quản trị viên mới có quyền tạo bệnh án hoặc đơn thuốc.'
    });
  }

  const data = getCollectionData(collection, false);

  // Chặn ID trùng (409 Conflict)
  if (req.body.id) {
    const existingIds = new Set(data.map(item => String(item.id)));
    if (existingIds.has(String(req.body.id))) {
      return res.status(409).json({
        success: false,
        error: `Bản ghi với ID '${req.body.id}' đã tồn tại trong hệ thống.`,
        code: 'DUPLICATE_ID'
      });
    }
  }

  // 1. Validation Schema theo từng collection khi tạo mới (POST)
  if (collection === 'expenses') {
    if (!isValidPositiveNumber(req.body.amount)) {
      return res.status(400).json({
        success: false,
        error: 'Số tiền chi tiêu phải là một số hữu hạn dương lớn hơn 0 (không nhận số âm, NaN hoặc sai kiểu).',
        code: 'INVALID_AMOUNT'
      });
    }
    if (!isValidCalendarDate(req.body.date)) {
      return res.status(400).json({
        success: false,
        error: 'Ngày chi tiêu không hợp lệ hoặc không tồn tại trên lịch thực tế (định dạng YYYY-MM-DD).',
        code: 'INVALID_DATE'
      });
    }
  }

  if (collection === 'schedules') {
    if (!req.body.petId || typeof req.body.petId !== 'string' || !req.body.petId.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Lịch chăm sóc phải liên kết với một thú cưng (petId bắt buộc).',
        code: 'MISSING_PET_ID'
      });
    }
    const title = req.body.title || req.body.task || req.body.activity;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Tiêu đề hoặc hoạt động chăm sóc không được để trống.',
        code: 'MISSING_TITLE'
      });
    }
    if (!isValidCalendarDate(req.body.date)) {
      return res.status(400).json({
        success: false,
        error: 'Ngày thực hiện lịch chăm sóc không hợp lệ hoặc không tồn tại trên lịch thực tế (định dạng YYYY-MM-DD).',
        code: 'INVALID_DATE'
      });
    }
  }

  // Chặn người nuôi tự gửi các trường đặc quyền
  if (req.user.role === 'pet_owner') {
    delete req.body.isFinal;
    delete req.body.confirmedBy;
    delete req.body.assignedVetId;
    if (collection === 'appointments') {
      req.body.status = 'pending'; // Người nuôi tạo lịch luôn ở pending
    }
  }

  if (collection === 'appointments') {
    if (!req.body.petId || typeof req.body.petId !== 'string' || !req.body.petId.trim()) {
      return res.status(400).json({ success: false, error: 'Lịch hẹn phải chỉ định thú cưng (petId bắt buộc).' });
    }
    if (req.body.phone && String(req.body.phone).trim()) {
      const phoneCheck = validateVietnamesePhoneNumber(req.body.phone);
      if (!phoneCheck.isValid) {
        return res.status(400).json({
          success: false,
          error: phoneCheck.error,
          code: phoneCheck.code
        });
      }
      req.body.phone = req.body.phone.trim();
    } else {
      req.body.phone = req.user.phone || '0901000888';
    }
    if (req.body.date) {
      req.body.date = normalizeDateToYmd(req.body.date) || req.body.date;
    }
    if (!isValidCalendarDate(req.body.date)) {
      return res.status(400).json({ success: false, error: 'Ngày hẹn không hợp lệ hoặc không tồn tại trên lịch thực tế (định dạng YYYY-MM-DD).' });
    }
    const appTime = req.body.time || req.body.timeSlot;
    if (!isValidTimeFormat(appTime)) {
      return res.status(400).json({ success: false, error: 'Giờ hẹn không đúng định dạng HH:MM hoặc vượt quá phạm vi giờ hợp lệ (00:00 - 23:59).' });
    }
    // Kiểm tra tính hợp lệ của bác sĩ được phân công
    if (req.body.assignedVetId) {
      const allUsers = getUsers();
      const vet = allUsers.find(u => u.id === req.body.assignedVetId);
      if (!vet || vet.role !== 'vet_doctor' || vet.isLocked) {
        return res.status(400).json({
          success: false,
          error: 'Bác sĩ được phân công không tồn tại, đã bị khóa hoặc không đúng vai trò Bác sĩ thú y.',
          code: 'INVALID_ASSIGNED_VET'
        });
      }
    }
  }

  if (collection === 'pets') {
    const todayVn = getTodayVnDate();
    if (req.body.birthDate && typeof req.body.birthDate === 'string' && req.body.birthDate.trim()) {
      const bDate = req.body.birthDate.trim();
      if (isValidCalendarDate(bDate) && bDate > todayVn) {
        return res.status(400).json({
          success: false,
          error: `Ngày sinh của thú cưng (${bDate}) không được vượt quá ngày hiện tại (${todayVn}) theo giờ Việt Nam.`,
          code: 'FUTURE_BIRTH_DATE'
        });
      }
    }

    if (req.body.weightHistory !== undefined && req.body.weightHistory !== null) {
      const vResult = validatePetWeightHistory(req.body.weightHistory, todayVn);
      if (!vResult.valid) {
        return res.status(400).json({
          success: false,
          error: vResult.error,
          code: vResult.code
        });
      }
      req.body.weightHistory = vResult.sanitized;
      // Cân nặng hiện tại phải lấy từ bản ghi hợp lệ mới nhất theo ngày ghi nhận
      if (vResult.sanitized.length > 0) {
        req.body.weight = vResult.sanitized[vResult.sanitized.length - 1].weight;
      }
    }

    if (req.body.weight !== undefined && req.body.weight !== null && req.body.weight !== '') {
      if (!isValidPositiveNumber(req.body.weight)) {
        return res.status(400).json({
          success: false,
          error: 'Cân nặng thú cưng phải là một số hữu hạn dương lớn hơn 0 (không nhận số âm, NaN hoặc sai kiểu).',
          code: 'INVALID_WEIGHT'
        });
      }
    }
  }

  const allPets = getCollectionData('pets', false);

  const newItem = {
    ...req.body,
    id: req.body.id || `${collection.slice(0,3)}-${Date.now()}`,
    ownerId: req.user.role === 'system_admin' ? (req.body.ownerId || req.user.id) : req.user.id,
    createdAt: new Date().toISOString()
  };

  // Nếu là bệnh án hoặc đơn thuốc do bác sĩ tạo: gán đúng ownerId của chủ thú cưng để chủ xem được
  if (collection === 'medical_records' || collection === 'prescriptions') {
    const pet = allPets.find(p => p.id === newItem.petId);
    if (pet) {
      newItem.ownerId = pet.ownerId; // Gán đúng chủ sở hữu thú cưng
      newItem.authorId = req.user.id;
      newItem.authorName = req.user.name;
    }
    // Không cho tạo đơn mới thiếu cờ để vượt bộ lọc đơn nháp; Generic POST cho prescriptions luôn ở trạng thái nháp (chỉ endpoint finalize mới ký chốt)
    if (collection === 'prescriptions') {
      if (req.user.role !== 'system_admin') {
        newItem.isFinal = false;
        newItem.status = 'draft';
      }
    } else if (collection === 'medical_records') {
      if (req.body.isFinal === true && (req.user.role === 'vet_doctor' || req.user.role === 'system_admin')) {
        newItem.isFinal = true;
        newItem.status = 'published';
      } else {
        newItem.isFinal = false;
        newItem.status = 'draft';
      }
    }
    // Kiểm tra phân công ca khám: Nếu ca đã giao bác sĩ A, bác sĩ B không được tạo bệnh án/đơn thuốc cho ca này
    const apptId = newItem.appointmentId || req.body.appointmentId;
    if (apptId && req.user.role === 'vet_doctor') {
      const allAppts = getCollectionData('appointments', false) || [];
      const targetAppt = allAppts.find(a => a.id === apptId);
      if (targetAppt) {
        const apptVetId = targetAppt.assignedVetId || targetAppt.vetId;
        if (apptVetId && apptVetId !== req.user.id) {
          return res.status(403).json({
            success: false,
            error: 'Bạn không phải là bác sĩ được phân công cho ca khám này. Không thể tạo bệnh án nháp hoặc kê đơn cho ca khám của bác sĩ khác.',
            code: 'FORBIDDEN_NOT_APPOINTMENT_VET'
          });
        }
      }
    }
  }

  // Kiểm tra quyền đối với petId cho non-admin
  if (req.user.role !== 'system_admin' && newItem.petId) {
    const pet = allPets.find(p => p.id === newItem.petId);
    if (!pet) return res.status(400).json({ success: false, error: 'Thú cưng không tồn tại trong hệ thống.' });
    
    if (req.user.role === 'pet_owner' && pet.ownerId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Bạn không có quyền thao tác trên thú cưng của người khác.' });
    }
    
    if (req.user.role === 'vet_doctor' && collection !== 'appointments') {
      const isAssigned = isVetAssignedToPet(req.user.id, pet.id, allPets);
      if (!isAssigned) {
        return res.status(403).json({ success: false, error: 'Thú cưng chưa được phân công cho bác sĩ phụ trách.' });
      }
    }
  }

  // Tự động gán bác sĩ phụ trách nếu bác sĩ là người tạo lịch khám
  if (collection === 'appointments' && req.user.role === 'vet_doctor') {
    if (!newItem.assignedVetId) newItem.assignedVetId = req.user.id;
    if (!newItem.vetId) newItem.vetId = req.user.id;
    if (!newItem.assignedVet || newItem.assignedVet === 'Đang xếp lịch') {
      newItem.assignedVet = req.user.name || 'BS. Hoàng Hải Nam';
    }
  }

  // Chống trùng lịch (Collision check) ở backend cho appointments
  if (collection === 'appointments') {
    const existingAppointments = getCollectionData('appointments', false) || [];
    const targetDate = normalizeDateToYmd(newItem.date) || newItem.date;
    const targetTime = newItem.time || newItem.timeSlot;
    const targetFacility = newItem.facility || newItem.clinic_id;
    const targetPetId = newItem.petId;

    console.log(`[BOOKING DEBUG] Nhận yêu cầu tạo lịch hẹn (POST):`, {
      petId: targetPetId,
      petName: newItem.petName,
      date: targetDate,
      time: targetTime,
      facility: targetFacility,
      ownerId: newItem.ownerId,
      userId: req.user.id,
      userRole: req.user.role
    });

    if (targetDate && targetTime) {
      // 1. Kiểm tra trùng lịch của chính thú cưng
      const petCollision = existingAppointments.find(app => {
        if (app.status === 'cancelled') return false;
        const appDate = normalizeDateToYmd(app.date) || app.date;
        const appTime = app.time || app.timeSlot;
        return appDate === targetDate && appTime === targetTime && String(app.petId) === String(targetPetId);
      });

      if (petCollision) {
        console.warn(`[BOOKING COLLISION DETECTED] Trùng lịch thú cưng:`, {
          requestedPetId: targetPetId,
          requestedDate: targetDate,
          requestedTime: targetTime,
          conflictingAppointmentId: petCollision.id,
          conflictingStatus: petCollision.status,
          conflictingFacility: petCollision.facility
        });
        return res.status(409).json({
          success: false,
          error: 'Khung giờ này đã có lịch hẹn khác cho thú cưng hoặc bác sĩ. Vui lòng chọn khung giờ khác.',
          code: 'APPOINTMENT_COLLISION',
          details: {
            reason: 'PET_SLOT_COLLISION',
            conflictingId: petCollision.id,
            time: targetTime,
            date: targetDate
          }
        });
      }

      // 2. Kiểm tra bác sĩ được chỉ định (nếu có)
      if (newItem.assignedVetId) {
        const vetCollision = existingAppointments.find(app => {
          if (app.status === 'cancelled') return false;
          const appDate = normalizeDateToYmd(app.date) || app.date;
          const appTime = app.time || app.timeSlot;
          return appDate === targetDate && appTime === targetTime && app.assignedVetId === newItem.assignedVetId;
        });

        if (vetCollision) {
          console.warn(`[BOOKING COLLISION DETECTED] Trùng lịch bác sĩ:`, {
            vetId: newItem.assignedVetId,
            conflictingAppointmentId: vetCollision.id
          });
          return res.status(409).json({
            success: false,
            error: 'Bác sĩ đã có lịch khám khác trong khung giờ này. Vui lòng chọn khung giờ hoặc bác sĩ khác.',
            code: 'VET_COLLISION'
          });
        }
      }

      // 3. Kiểm tra giới hạn số lượng cuộc hẹn tại cơ sở (clinic capacity)
      if (targetFacility) {
        const sameSlotFacilityCount = existingAppointments.filter(app => {
          if (app.status === 'cancelled') return false;
          const appDate = normalizeDateToYmd(app.date) || app.date;
          const appTime = app.time || app.timeSlot;
          const appFacility = app.facility || app.clinic_id;
          return appDate === targetDate && appTime === targetTime && appFacility === targetFacility;
        }).length;

        const MAX_FACILITY_CAPACITY = 3;
        if (sameSlotFacilityCount >= MAX_FACILITY_CAPACITY) {
          console.warn(`[BOOKING COLLISION DETECTED] Quá tải khung giờ tại cơ sở:`, {
            facility: targetFacility,
            date: targetDate,
            time: targetTime,
            currentCount: sameSlotFacilityCount,
            maxAllowed: MAX_FACILITY_CAPACITY
          });
          return res.status(409).json({
            success: false,
            error: `Khung giờ ${targetTime} ngày ${targetDate} tại cơ sở đã đạt số lượng lịch hẹn tối đa (${sameSlotFacilityCount}/${MAX_FACILITY_CAPACITY}). Vui lòng chọn khung giờ khác.`,
            code: 'CLINIC_CAPACITY_REACHED'
          });
        }
      }
    }
  }

  // Cân nặng thú cưng
  if (collection === 'pets') {
    if (newItem.weight !== undefined && newItem.weight !== null && newItem.weight !== '') {
      newItem.weight = Number(newItem.weight);
    } else {
      newItem.weight = null;
    }
  }

  const updatedData = [newItem, ...data];
  const ok = saveCollectionData(collection, updatedData);
  if (!ok) {
    return res.status(500).json({
      success: false,
      error: 'Lỗi ghi dữ liệu vào hệ thống lưu trữ.',
      code: 'STORAGE_WRITE_ERROR'
    });
  }
  res.json({ success: true, data: newItem });
});

// ----------------------------------------------------------------------------
// 5. GENERIC PUT UPDATE (Kiểm tra dữ liệu sau khi ghép, không đổi ID, chặn quyền trái phép)
// ----------------------------------------------------------------------------
router.put('/:collection/:id', authenticateToken, (req, res) => {
  const { collection, id } = req.params;
  if (!getAllowedCollections().includes(collection)) {
    return res.status(404).json({ success: false, error: 'Collection not found' });
  }

  // Chặn tuyệt đối việc đổi ID bản ghi qua body (Immutable ID), kể cả chuỗi rỗng, null hay ID khác
  if ('id' in req.body) {
    const reqId = req.body.id;
    if (reqId === null || reqId === undefined || String(reqId).trim() === '' || String(reqId).trim() !== String(id).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Không được phép thay đổi, làm rỗng hoặc xóa ID của bản ghi.',
        code: 'IMMUTABLE_ID'
      });
    }
  }

  const isObject = COLLECTION_TYPES[collection] === 'object';
  let data = getCollectionData(collection, isObject);

  if (isObject) {
    // Với object collection, id chính là petId
    const allPets = getCollectionData('pets', false);
    const pet = allPets.find(p => p.id === id);
    if (!pet && req.user.role !== 'system_admin') {
      return res.status(404).json({ success: false, error: 'Thú cưng không tồn tại.' });
    }
    
    if (req.user.role === 'pet_owner') {
      if (!pet || pet.ownerId !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền chỉnh sửa thú cưng này.' });
      }
    }

    if (req.user.role === 'vet_doctor') {
      if (collection === 'lost_modes') {
        return res.status(403).json({ success: false, error: 'Bác sĩ không có quyền chỉnh sửa chế độ thất lạc của thú cưng.' });
      }
      const isAssigned = isVetAssignedToPet(req.user.id, id, allPets);
      if (!isAssigned) {
        return res.status(403).json({ success: false, error: 'Bác sĩ không được phân công chăm sóc thú cưng này.' });
      }
    }

    // Kiểm tra cân nặng nếu có gửi trong health_data
    if (collection === 'health_data') {
      const todayVn = getTodayVnDate();
      if (req.body.weightHistory !== undefined && req.body.weightHistory !== null) {
        const vResult = validatePetWeightHistory(req.body.weightHistory, todayVn);
        if (!vResult.valid) {
          return res.status(400).json({
            success: false,
            error: vResult.error,
            code: vResult.code
          });
        }
        req.body.weightHistory = vResult.sanitized;
        if (vResult.sanitized.length > 0) {
          req.body.weight = vResult.sanitized[vResult.sanitized.length - 1].weight;
        }
      }

      if (req.body.weight !== undefined && req.body.weight !== null && req.body.weight !== '') {
        if (!isValidPositiveNumber(req.body.weight)) {
          return res.status(400).json({
            success: false,
            error: 'Cân nặng trong hồ sơ sức khỏe phải là một số hữu hạn dương lớn hơn 0.',
            code: 'INVALID_WEIGHT'
          });
        }
      }
    }

    const updatedObject = { ...data, [id]: { ...(data[id] || {}), ...req.body } };

    // Đồng bộ cân nặng sang danh sách thú cưng nếu cập nhật health_data có trường weight
    if (collection === 'health_data' && req.body.weight !== undefined && req.body.weight !== null && req.body.weight !== '') {
      const petsList = getCollectionData('pets', false);
      const petIndex = petsList.findIndex(p => p.id === id);
      if (petIndex !== -1) {
        const updatedPets = petsList.map((p, idx) => idx === petIndex ? { ...p, weight: Number(req.body.weight) } : p);
        try {
          const ok = saveMultipleCollections([
            { collection: 'health_data', data: updatedObject, isObject: true },
            { collection: 'pets', data: updatedPets, isObject: false }
          ]);
          if (!ok) {
            return res.status(500).json({
              success: false,
              error: 'Lỗi ghi dữ liệu sức khỏe và đồng bộ thú cưng. Toàn bộ thay đổi đã được hoàn tác.',
              code: 'STORAGE_WRITE_ERROR'
            });
          }
        } catch (txErr) {
          if (txErr.code === 'ROLLBACK_FAILED') {
            return res.status(500).json({
              success: false,
              error: txErr.message,
              code: 'ROLLBACK_FAILED'
            });
          }
          throw txErr;
        }
        return res.json({ success: true, data: updatedObject[id] });
      }
    }

    const ok = saveCollectionData(collection, updatedObject);
    if (!ok) {
      return res.status(500).json({
        success: false,
        error: 'Lỗi ghi dữ liệu vào hệ thống lưu trữ.',
        code: 'STORAGE_WRITE_ERROR'
      });
    }

    return res.json({ success: true, data: updatedObject[id] });
  } else {
    const index = data.findIndex(item => item.id === id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Bản ghi không tồn tại.' });

    const currentItem = data[index];

    // Chặn chủ nuôi sửa hồ sơ bệnh án hoặc đơn thuốc chuyên môn của bác sĩ
    if (req.user.role === 'pet_owner' && (collection === 'medical_records' || collection === 'prescriptions')) {
      return res.status(403).json({
        success: false,
        error: 'Chủ nuôi không có quyền chỉnh sửa bệnh án hoặc đơn thuốc chuyên môn của bác sĩ.'
      });
    }

    // Kiểm tra phân công ca khám: Nếu ca đã giao bác sĩ A, bác sĩ B không được sửa bệnh án/đơn thuốc của ca này
    if (collection === 'medical_records' || collection === 'prescriptions') {
      const apptId = currentItem.appointmentId || req.body.appointmentId;
      if (apptId && req.user.role === 'vet_doctor') {
        const allAppts = getCollectionData('appointments', false) || [];
        const targetAppt = allAppts.find(a => a.id === apptId);
        if (targetAppt) {
          const apptVetId = targetAppt.assignedVetId || targetAppt.vetId;
          if (apptVetId && apptVetId !== req.user.id) {
            return res.status(403).json({
              success: false,
              error: 'Bạn không phải là bác sĩ được phân công cho ca khám này. Không thể chỉnh sửa bệnh án hoặc đơn thuốc của ca khám khác.',
              code: 'FORBIDDEN_NOT_APPOINTMENT_VET'
            });
          }
        }
      }
    }

    // Chặn người nuôi tự gửi các trường đặc quyền
    if (req.user.role === 'pet_owner') {
      delete req.body.isFinal;
      delete req.body.confirmedBy;
      delete req.body.assignedVetId;
    }

    // Ghép bản ghi hiện tại với dữ liệu cập nhật trước khi validation toàn diện
    const merged = {
      ...currentItem,
      ...req.body,
      id: currentItem.id, // ID là bất biến
      ownerId: currentItem.ownerId // ownerId là bất biến
    };

    // 1. Validation Schema sau khi ghép (POST-MERGE VALIDATION)
    if (collection === 'pets') {
      const todayVn = getTodayVnDate();
      if (merged.birthDate && typeof merged.birthDate === 'string' && merged.birthDate.trim()) {
        const bDate = merged.birthDate.trim();
        if (isValidCalendarDate(bDate) && bDate > todayVn) {
          return res.status(400).json({
            success: false,
            error: `Ngày sinh của thú cưng (${bDate}) không được vượt quá ngày hiện tại (${todayVn}) theo giờ Việt Nam.`,
            code: 'FUTURE_BIRTH_DATE'
          });
        }
      }

      if (merged.weightHistory !== undefined && merged.weightHistory !== null) {
        const vResult = validatePetWeightHistory(merged.weightHistory, todayVn);
        if (!vResult.valid) {
          return res.status(400).json({
            success: false,
            error: vResult.error,
            code: vResult.code
          });
        }
        merged.weightHistory = vResult.sanitized;
      }

      if (Array.isArray(merged.weightHistory) && merged.weightHistory.length > 0) {
        // Luôn bảo đảm lịch sử sắp xếp tăng dần theo ngày ghi nhận thực tế YYYY-MM-DD
        const sortedHistory = [...merged.weightHistory]
          .filter(h => h && h.weight != null && !isNaN(h.weight) && Number(h.weight) > 0)
          .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        merged.weightHistory = sortedHistory;
        // Cân nặng hiện tại lấy từ bản ghi có ngày ghi nhận mới nhất
        merged.weight = sortedHistory.length > 0 ? Number(sortedHistory[sortedHistory.length - 1].weight) : null;
      } else if (merged.weight !== undefined && merged.weight !== null && merged.weight !== '') {
        if (!isValidPositiveNumber(merged.weight)) {
          return res.status(400).json({
            success: false,
            error: 'Cân nặng thú cưng phải là một số hữu hạn dương lớn hơn 0 (không nhận số âm, NaN hoặc sai kiểu).',
            code: 'INVALID_WEIGHT'
          });
        }
        merged.weight = Number(merged.weight);
      } else {
        merged.weight = null;
      }
    }

    if (collection === 'expenses') {
      if (!isValidPositiveNumber(merged.amount)) {
        return res.status(400).json({
          success: false,
          error: 'Số tiền chi tiêu phải là một số hữu hạn dương lớn hơn 0 (không nhận số âm, NaN hoặc sai kiểu).',
          code: 'INVALID_AMOUNT'
        });
      }
      merged.amount = Number(merged.amount);
      if (!isValidCalendarDate(merged.date)) {
        return res.status(400).json({
          success: false,
          error: 'Ngày chi tiêu không hợp lệ hoặc không tồn tại trên lịch thực tế (định dạng YYYY-MM-DD).',
          code: 'INVALID_DATE'
        });
      }
    }

    if (collection === 'schedules') {
      if (!merged.petId || typeof merged.petId !== 'string' || !merged.petId.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Lịch chăm sóc phải luôn giữ thú cưng hợp lệ (petId bắt buộc không được xóa trắng).',
          code: 'MISSING_PET_ID'
        });
      }
      const title = merged.title || merged.task || merged.activity;
      if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Tiêu đề lịch chăm sóc không được để trống hoặc xóa trắng.',
          code: 'MISSING_TITLE'
        });
      }
      if (!isValidCalendarDate(merged.date)) {
        return res.status(400).json({
          success: false,
          error: 'Ngày thực hiện lịch chăm sóc không hợp lệ hoặc không tồn tại trên lịch thực tế (định dạng YYYY-MM-DD).',
          code: 'INVALID_DATE'
        });
      }
    }

    // Xử lý riêng nghiệp vụ appointments
    if (collection === 'appointments') {
      if (!merged.petId || typeof merged.petId !== 'string' || !merged.petId.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Lịch khám phải liên kết với một thú cưng (petId bắt buộc không được xóa trắng).',
          code: 'MISSING_PET_ID'
        });
      }
      if (req.body.phone !== undefined || merged.phone !== undefined) {
        const phoneCheck = validateVietnamesePhoneNumber(merged.phone);
        if (!phoneCheck.isValid) {
          return res.status(400).json({
            success: false,
            error: phoneCheck.error,
            code: phoneCheck.code
          });
        }
        merged.phone = merged.phone.trim();
      }
      if (!isValidCalendarDate(merged.date)) {
        return res.status(400).json({
          success: false,
          error: 'Ngày hẹn không hợp lệ hoặc không tồn tại trên lịch thực tế (định dạng YYYY-MM-DD).',
          code: 'INVALID_DATE'
        });
      }
      const appTime = merged.time || merged.timeSlot;
      if (!isValidTimeFormat(appTime)) {
        return res.status(400).json({
          success: false,
          error: 'Giờ hẹn không đúng định dạng HH:MM hoặc vượt quá phạm vi giờ hợp lệ (00:00 - 23:59).',
          code: 'INVALID_TIME'
        });
      }

      // 1. Kiểm tra chuyển đổi trạng thái hợp lệ
      if (currentItem.status === 'cancelled') {
        if (req.body.status && (req.body.status === 'completed' || req.body.status === 'in_progress')) {
          return res.status(400).json({
            success: false,
            error: 'Lịch hẹn đã bị hủy không thể chuyển trực tiếp sang trạng thái đang khám hoặc hoàn thành.',
            code: 'INVALID_STATUS_TRANSITION'
          });
        }
      }

      if (currentItem.status === 'completed') {
        if (req.body.status && req.body.status !== 'completed') {
          return res.status(400).json({
            success: false,
            error: 'Lịch hẹn đã hoàn thành không thể thay đổi trạng thái.',
            code: 'INVALID_STATUS_TRANSITION'
          });
        }
      }

      // 2. Kiểm tra tính hợp lệ của bác sĩ nếu có phân công
      if (req.body.assignedVetId) {
        const allUsers = getUsers();
        const vet = allUsers.find(u => u.id === req.body.assignedVetId);
        if (!vet || vet.role !== 'vet_doctor' || vet.isLocked) {
          return res.status(400).json({
            success: false,
            error: 'Bác sĩ được phân công không tồn tại, đã bị khóa hoặc không đúng vai trò Bác sĩ thú y.',
            code: 'INVALID_ASSIGNED_VET'
          });
        }
      }

      if (req.user.role === 'pet_owner') {
        // Chặn hủy hoặc sửa nếu ca khám đã hoàn thành hoặc đang diễn ra
        if (currentItem.status === 'completed' || currentItem.status === 'in_progress') {
          return res.status(400).json({
            success: false,
            error: 'Không thể thay đổi hoặc hủy lịch khám đã hoàn thành hoặc đang diễn ra.'
          });
        }
        // Chủ nuôi chỉ được phép hủy (status: 'cancelled'), không được tự ý đổi sang status khác
        if (req.body.status && req.body.status !== 'cancelled') {
          return res.status(400).json({
            success: false,
            error: 'Chủ nuôi chỉ được phép hủy lịch hẹn (chuyển sang trạng thái đã hủy).'
          });
        }
      }

      // Kiểm tra trùng lịch khi dời ngày/giờ hoặc phân công bác sĩ (nếu không phải thao tác hủy)
      if ((req.body.date || req.body.time || req.body.timeSlot || req.body.assignedVetId) && req.body.status !== 'cancelled') {
        const targetDate = normalizeDateToYmd(merged.date) || merged.date;
        const targetTime = merged.time || merged.timeSlot;
        const targetPetId = merged.petId;
        const targetVetId = merged.assignedVetId;
        const targetFacility = merged.facility || merged.clinic_id;

        console.log(`[BOOKING DEBUG] Kiểm tra trùng lịch khi cập nhật (PUT):`, {
          appointmentId: id,
          targetPetId,
          targetDate,
          targetTime,
          targetFacility
        });

        const existingAppointments = getCollectionData('appointments', false) || [];
        const collision = existingAppointments.find(app => {
          if (app.id === id || app.status === 'cancelled') return false;
          const appDate = normalizeDateToYmd(app.date) || app.date;
          const appTime = app.time || app.timeSlot;
          const sameTime = appDate === targetDate && appTime === targetTime;
          if (!sameTime) return false;
          if (String(app.petId) === String(targetPetId)) return true;
          if (targetVetId && app.assignedVetId === targetVetId) return true;
          return false;
        });

        if (collision) {
          console.warn(`[BOOKING COLLISION DETECTED] Cập nhật bị từ chối do trùng lịch:`, {
            appointmentId: id,
            conflictingAppointmentId: collision.id,
            targetDate,
            targetTime
          });
          return res.status(409).json({
            success: false,
            error: 'Khung giờ này đã có lịch hẹn khác cho thú cưng hoặc bác sĩ. Vui lòng chọn khung giờ khác.',
            code: 'APPOINTMENT_COLLISION'
          });
        }
      }
    }

    // 2. Kiểm tra quyền đối với petId và các quan hệ sau khi ghép
    const allPets = getCollectionData('pets', false);
    if (merged.petId) {
      const targetPet = allPets.find(p => p.id === merged.petId);
      if (!targetPet) {
        return res.status(400).json({
          success: false,
          error: 'Thú cưng liên kết không tồn tại trong hệ thống.',
          code: 'INVALID_PET_ID'
        });
      }

      if (req.user.role === 'pet_owner') {
        if (targetPet.ownerId !== req.user.id) {
          return res.status(403).json({
            success: false,
            error: 'Không thể chuyển hoặc liên kết bản ghi sang thú cưng của người khác.'
          });
        }
      } else if (req.user.role === 'vet_doctor') {
        const isAssigned = isVetAssignedToPet(req.user.id, targetPet.id, allPets);
        if (!isAssigned) {
          return res.status(403).json({
            success: false,
            error: 'Bác sĩ không được phân công chăm sóc thú cưng này.'
          });
        }
      }
    }

    // Kiểm tra quyền tác vụ đối với bản ghi đang cập nhật
    if (req.user.role !== 'system_admin') {
      if (req.user.role === 'pet_owner' && currentItem.ownerId !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền sửa bản ghi này.' });
      }
      
      if (req.user.role === 'vet_doctor') {
        const isAssigned = isVetAssignedToPet(req.user.id, currentItem.petId || id, allPets);
        const isAuthor = currentItem.authorId === req.user.id || currentItem.vetId === req.user.id;
        const isAssignedToAppt = collection === 'appointments' && (
          currentItem.assignedVetId === req.user.id || 
          currentItem.vetId === req.user.id ||
          !currentItem.assignedVetId ||
          currentItem.status === 'pending' ||
          currentItem.assignedVet === 'Đang xếp lịch'
        );
        if (!isAssigned && !isAuthor && !isAssignedToAppt) {
          return res.status(403).json({ success: false, error: 'Bác sĩ không được phân công phụ trách thú cưng này.' });
        }
      }
    }

    // Bảo vệ bệnh án & đơn thuốc đã chốt/công bố (SOAP & Prescription finalized lock)
    if ((collection === 'medical_records' || collection === 'prescriptions') && (currentItem.isFinal || isRecordPublished(currentItem))) {
      if (collection === 'prescriptions') {
        return res.status(403).json({
          success: false,
          error: 'Đơn thuốc đã ký chốt / đã công bố không thể sửa trực tiếp.'
        });
      }
      const rawHistoryEntry = Array.isArray(req.body.history) && req.body.history.length > 0 ? req.body.history[req.body.history.length - 1] : null;
      const reason = req.body.amendmentReason || rawHistoryEntry?.reason;
      const addendumNote = req.body.addendumNote || rawHistoryEntry?.note || '';
      if (!reason && !addendumNote) {
        return res.status(403).json({
          success: false,
          error: 'Bệnh án đã ký chốt không thể sửa trực tiếp. Để bổ sung thông tin lâm sàng, vui lòng cung cấp lý do bổ sung (amendmentReason) và nội dung ghi chú (addendumNote).'
        });
      }

      const existingHistory = Array.isArray(currentItem.history) ? currentItem.history : [];
      const historyEntry = {
        version: existingHistory.length + 1,
        amendedAt: new Date().toISOString(),
        amendedBy: req.user.id,
        amendedByName: req.user.name,
        reason: reason || 'Bổ sung ghi chú lâm sàng',
        addendumNote: addendumNote,
        previousState: {
          assessment: currentItem.assessment,
          plan: currentItem.plan,
          notes: currentItem.notes
        }
      };

      const updatedRecord = {
        ...currentItem,
        history: [...existingHistory, historyEntry],
        lastAmendedAt: historyEntry.amendedAt,
        notes: req.body.notes !== undefined ? req.body.notes : currentItem.notes,
        ownerId: currentItem.ownerId
      };

      const updatedData = [...data];
      updatedData[index] = updatedRecord;
      const ok = saveCollectionData(collection, updatedData);
      if (!ok) {
        return res.status(500).json({
          success: false,
          error: 'Lỗi ghi dữ liệu bệnh án vào hệ thống lưu trữ.',
          code: 'STORAGE_WRITE_ERROR'
        });
      }
      return res.json({ success: true, data: updatedRecord });
    }

    if (collection === 'appointments' && req.user.role === 'vet_doctor') {
      if (!merged.assignedVetId || merged.assignedVetId === 'unassigned' || merged.assignedVet === 'Đang xếp lịch') {
        merged.assignedVetId = req.user.id;
        merged.vetId = req.user.id;
        merged.assignedVet = req.user.name || 'BS. Hoàng Hải Nam';
      }
    }

    const updatedData = [...data];
    updatedData[index] = merged;
    const ok = saveCollectionData(collection, updatedData);
    if (!ok) {
      return res.status(500).json({
        success: false,
        error: 'Lỗi ghi dữ liệu vào hệ thống lưu trữ.',
        code: 'STORAGE_WRITE_ERROR'
      });
    }
    return res.json({ success: true, data: merged });
  }
});

// ----------------------------------------------------------------------------
// 6. GENERIC DELETE (Xóa dây chuyền toàn vẹn: dọn cả medical_records, lost_modes, health_data)
// ----------------------------------------------------------------------------
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
    if (!pet && req.user.role !== 'system_admin') {
      return res.status(404).json({ success: false, error: 'Thú cưng không tồn tại.' });
    }

    if (req.user.role === 'pet_owner') {
      if (!pet || String(pet.ownerId || '').trim() !== String(req.user.id || '').trim()) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền xóa dữ liệu của thú cưng này.', code: 'FORBIDDEN_NOT_OWNER' });
      }
    } else if (req.user.role === 'vet_doctor') {
      if (collection === 'lost_modes') {
        return res.status(403).json({ success: false, error: 'Bác sĩ không có quyền xóa chế độ thất lạc của thú cưng.', code: 'FORBIDDEN_PERMISSION_DENIED' });
      }
      const isAssigned = isVetAssignedToPet(req.user.id, id, allPets);
      if (!isAssigned) {
        return res.status(403).json({ success: false, error: 'Bác sĩ không được phân công chăm sóc thú cưng này.', code: 'FORBIDDEN_NOT_ASSIGNED' });
      }
    }

    const updatedData = { ...data };
    delete updatedData[id];
    const ok = saveCollectionData(collection, updatedData);
    if (!ok) {
      return res.status(500).json({
        success: false,
        error: 'Lỗi ghi dữ liệu vào hệ thống lưu trữ.',
        code: 'STORAGE_WRITE_ERROR'
      });
    }
    return res.json({ success: true });
  } else {
    const index = data.findIndex(item => item.id === id || String(item.id).trim() === String(id).trim());
    if (index === -1) return res.status(404).json({ success: false, error: 'Bản ghi không tồn tại.' });

    const currentItem = data[index];
    if (req.user.role !== 'system_admin') {
      if (req.user.role === 'pet_owner') {
        if (collection === 'medical_records' || collection === 'prescriptions') {
          return res.status(403).json({ success: false, error: 'Chủ nuôi không có quyền xóa bệnh án hoặc đơn thuốc chuyên môn.', code: 'FORBIDDEN_PERMISSION_DENIED' });
        }
        if (String(currentItem.ownerId || '').trim() !== String(req.user.id || '').trim()) {
          return res.status(403).json({ success: false, error: 'Bạn không có quyền xóa bản ghi này.', code: 'FORBIDDEN_NOT_OWNER' });
        }
      }
      if (req.user.role === 'vet_doctor') {
        return res.status(403).json({ success: false, error: 'Bác sĩ không có quyền xóa bản ghi này.', code: 'FORBIDDEN_DOCTOR_CANNOT_DELETE' });
      }
    }

    // Bệnh án & Đơn thuốc đã ký chốt / đã công bố không thể bị xóa bởi bất kỳ ai
    if ((collection === 'medical_records' || collection === 'prescriptions') && (currentItem.isFinal || isRecordPublished(currentItem))) {
      return res.status(403).json({ 
        success: false, 
        error: collection === 'prescriptions' ? 'Đơn thuốc đã ký chốt / đã công bố không thể bị xóa.' : 'Bệnh án đã ký chốt không thể bị xóa.' 
      });
    }

    // Xóa dây chuyền khi xóa thú cưng (Pets Cascade Delete với Atomic Rollback)
    if (collection === 'pets') {
      const operations = [];
      const updatedPets = data.filter(item => item.id !== id);
      operations.push({ collection: 'pets', data: updatedPets, isObject: false });

      const arrayCollections = ['schedules', 'expenses', 'daily_logs', 'prescriptions', 'daily_habits', 'appointments', 'medical_records'];
      arrayCollections.forEach(col => {
         let subData = getCollectionData(col, false);
         const initialLen = subData.length;
         const filtered = subData.filter(item => item.petId !== id);
         if (filtered.length !== initialLen) {
           operations.push({ collection: col, data: filtered, isObject: false });
         }
      });
      let lostModes = getCollectionData('lost_modes', true);
      if (lostModes[id]) {
        delete lostModes[id];
        operations.push({ collection: 'lost_modes', data: lostModes, isObject: true });
      }
      let healthData = getCollectionData('health_data', true);
      let healthModified = false;
      if (healthData[id]) {
        delete healthData[id];
        healthModified = true;
      }
      const k1 = `health_${id}`;
      if (healthData[k1]) {
        delete healthData[k1];
        healthModified = true;
      }
      if (healthModified) {
        operations.push({ collection: 'health_data', data: healthData, isObject: true });
      }

      try {
        const ok = saveMultipleCollections(operations);
        if (!ok) {
          return res.status(500).json({
            success: false,
            error: 'Lỗi ghi dữ liệu dây chuyền khi xóa thú cưng. Toàn bộ thay đổi đã được hoàn tác.',
            code: 'STORAGE_WRITE_ERROR'
          });
        }
      } catch (txErr) {
        if (txErr.code === 'ROLLBACK_FAILED') {
          return res.status(500).json({
            success: false,
            error: txErr.message,
            code: 'ROLLBACK_FAILED'
          });
        }
        throw txErr;
      }
      return res.json({ success: true });
    }

    const updatedData = data.filter(item => item.id !== id);
    const ok = saveCollectionData(collection, updatedData);
    if (!ok) {
      return res.status(500).json({
        success: false,
        error: 'Lỗi ghi dữ liệu vào hệ thống lưu trữ.',
        code: 'STORAGE_WRITE_ERROR'
      });
    }
    return res.json({ success: true });
  }
});

export default router;
