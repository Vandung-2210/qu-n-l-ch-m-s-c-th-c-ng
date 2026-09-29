import React, { useState } from 'react';
import { 
  Building2, 
  PhoneCall, 
  MapPin, 
  Clock, 
  Star, 
  ShieldCheck, 
  Search,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { PET_SERVICES } from '../../constants/mockData';

export const PetServicesView = () => {
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = PET_SERVICES.filter(srv => {
    const matchType = filterType === 'all' || srv.type === filterType || (filterType === '247' && srv.is247);
    const matchSearch = srv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Mạng Lưới Thú Y & Cứu Hộ Khẩn Cấp
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Danh bạ các bệnh viện thú y cấp cứu 24/7, phòng khám đạt chuẩn và dịch vụ spa uy tín.
          </p>
        </div>

        {/* 24/7 Emergency Quick Hotline Button */}
        <a
          href="tel:19006868"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-rose-600/30 active:scale-95 transition-all self-start sm:self-auto animate-pulse"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Hotline Cấp Cứu 24/7 (1900 6868)</span>
        </a>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên bệnh viện, địa chỉ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'Tất cả cơ sở' },
            { id: '247', label: '🚨 Cấp cứu 24/7' },
            { id: 'hospital', label: 'Bệnh viện thú y' },
            { id: 'clinic', label: 'Phòng khám' },
            { id: 'spa', label: 'Spa & Grooming' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                filterType === tab.id
                  ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((srv) => (
          <div
            key={srv.id}
            className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  srv.is247 
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800' 
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                }`}>
                  {srv.is247 ? 'Cấp cứu 24/7' : srv.type.toUpperCase()}
                </span>

                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{srv.rating}</span>
                </div>
              </div>

              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                {srv.name}
              </h3>

              <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{srv.address}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{srv.is247 ? 'Mở cửa 24/24 cả ngày Lễ & Tết' : '8:00 - 20:30 hàng ngày'}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Dịch vụ chuyên môn:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {srv.services.map((item, idx) => (
                    <span key={idx} className="text-[10px] font-semibold bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Call action */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <a
                href={`tel:${srv.phone.replace(/\s+/g, '')}`}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Gọi ngay: {srv.phone}</span>
              </a>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
