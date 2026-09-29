import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, Sparkles } from 'lucide-react';

export class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('GlobalErrorBoundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetState = () => {
    try {
      localStorage.removeItem('petcare_theme');
      window.location.href = '/';
    } catch {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#0a0d14] text-white flex items-center justify-center p-6 relative overflow-hidden select-none font-sans">
          {/* Spatial Glows */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />

          {/* Frosted Spatial Recovery Card */}
          <div className="relative z-10 max-w-lg w-full bg-white/[0.06] backdrop-blur-3xl border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.7)] rounded-3xl p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-[0_0_25px_rgba(244,63,94,0.3)]">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>PetCare PRO • VisionOS Recovery</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Đã xảy ra sự cố hiển thị giao diện
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
                Hệ thống đã tự động ngăn chặn tình trạng màn hình trắng và kích hoạt chế độ tự phục hồi an toàn.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-left font-mono text-[11px] text-rose-300 max-h-32 overflow-y-auto">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tải lại trang ngay</span>
              </button>

              <button
                onClick={this.handleResetState}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Về trang chủ</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
