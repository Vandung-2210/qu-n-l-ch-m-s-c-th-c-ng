# -*- coding: utf-8 -*-
"""
Script vẽ 5 biểu đồ kỹ thuật chuẩn học thuật cho đồ án PetCare PRO AI bằng Matplotlib
Xuất ra thư mục assets/diagrams/ với độ phân giải cao 300 DPI
"""

import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch

OUT_DIR = os.path.join(os.getcwd(), 'assets', 'diagrams')
os.makedirs(OUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# BIỂU ĐỒ 1: USE CASE DIAGRAM (Sơ đồ ca sử dụng tổng quan)
# -------------------------------------------------------------
def draw_use_case_diagram():
    fig, ax = plt.subplots(figsize=(15, 10), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Nền tổng thể
    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')

    # Tiêu đề biểu đồ
    ax.text(50, 96, "SƠ ĐỒ CA SỬ DỤNG TỔNG QUAN (USE CASE DIAGRAM) - PETCARE PRO AI", 
            fontsize=15, fontweight='bold', ha='center', color='#0F172A')
    ax.text(50, 93, "Phân quyền tương tác 4 tác nhân: Chủ nuôi, Thành viên gia đình, Bác sĩ thú y và Trợ lý AI", 
            fontsize=10.5, fontstyle='italic', ha='center', color='#475569')

    # System Boundary Box
    system_box = FancyBboxPatch((24, 6), 52, 83, boxstyle="round,pad=1,rounding_size=2", 
                                facecolor='#FFFFFF', edgecolor='#0D9488', linewidth=2.5, linestyle='--')
    ax.add_patch(system_box)
    ax.text(50, 86.5, "Ranh giới Hệ Thống Website PetCare PRO AI", 
            fontsize=12, fontweight='bold', ha='center', color='#0D9488')

    # Vẽ Actor Helper
    def draw_actor(x, y, name, color='#1E293B'):
        # Đầu
        circle = patches.Circle((x, y + 3.2), 1.8, facecolor='#E2E8F0', edgecolor=color, linewidth=2, zorder=4)
        ax.add_patch(circle)
        # Thân
        ax.plot([x, x], [y + 1.4, y - 2.5], color=color, linewidth=2.2, zorder=4)
        # Tay
        ax.plot([x - 2.8, x + 2.8], [y + 0.2, y + 0.2], color=color, linewidth=2.2, zorder=4)
        # Chân
        ax.plot([x, x - 2.2], [y - 2.5, y - 6], color=color, linewidth=2.2, zorder=4)
        ax.plot([x, x + 2.2], [y - 2.5, y - 6], color=color, linewidth=2.2, zorder=4)
        # Tên
        ax.text(x, y - 8.5, name, fontsize=10, fontweight='bold', ha='center', color=color, zorder=4)

    # 4 Actors
    draw_actor(11, 72, "Chủ Nuôi\n(Pet Owner)", '#047857')
    draw_actor(11, 28, "Thành Viên\n(Family Member)", '#0369A1')
    draw_actor(89, 72, "Bác Sĩ Thú Y\n(Vet Doctor)", '#7C3AED')
    draw_actor(89, 28, "Trợ Lý AI\n(AI Assistant)", '#C026D3')

    # Danh sách Use Cases
    use_cases = [
        (40, 80, "UC01: Xác thực & Tương tác\nLinh vật Toothless", '#E0F2FE', '#0284C7'),
        (60, 80, "UC02: Quản lý Hồ sơ Thú cưng\nĐa loài & Tăng trưởng", '#DCFCE7', '#16A34A'),
        (38, 67, "UC03: Lập Lịch Y tế &\nXuất iCalendar (.ics)", '#FEF3C7', '#D97706'),
        (62, 67, "UC04: Daily Checklist &\nHabit Tracker 21 ngày", '#E0E7FF', '#4F46E5'),
        (50, 54, "UC05: Đồng Chăm sóc Gia đình\n(Co-parenting) & Audit Log", '#FCE7F3', '#DB2777'),
        (38, 41, "UC06: Khám Bệnh Y Khoa AI\nDr. Paw Context-Aware", '#EDE9FE', '#7C3AED'),
        (62, 41, "UC07: Sàng lọc Da Liễu &\nNhận diện Vision AI", '#CCFBF1', '#0D9488'),
        (38, 28, "UC08: Tính Năng Lượng\nDinh Dưỡng RER / DER", '#FFEDD5', '#EA580C'),
        (62, 28, "UC09: Quản lý Chi tiêu &\nY Bạ Đơn Thuốc", '#FEE2E2', '#DC2626'),
        (38, 15, "UC10: Quét Hóa Đơn Sổ Khám\nPipeline OCR 3 trong 1", '#F3E8FF', '#9333EA'),
        (62, 15, "UC11: Kích hoạt Lost Mode &\nPoster QR Tìm Kiếm", '#FFE4E6', '#E11D48'),
    ]

    # Vẽ từng Use Case ellipse/box
    for (cx, cy, label, bg, border) in use_cases:
        box = FancyBboxPatch((cx - 8.5, cy - 3.8), 17, 7.6, boxstyle="round,pad=0.5,rounding_size=3.5",
                             facecolor=bg, edgecolor=border, linewidth=1.6, zorder=3)
        ax.add_patch(box)
        ax.text(cx, cy, label, fontsize=8.5, fontweight='bold', ha='center', va='center', color='#0F172A', zorder=4)

    # Đường nối Owner -> Use cases
    owner_targets = [(40, 80), (60, 80), (38, 67), (62, 67), (50, 54), (38, 41), (62, 41), (38, 28), (62, 28), (38, 15), (62, 15)]
    for tx, ty in owner_targets:
        ax.plot([14.5, tx - 8.5], [68, ty], color='#10B981', linewidth=1.0, alpha=0.7, linestyle='-')

    # Đường nối Member -> Use cases
    member_targets = [(40, 80), (62, 67), (50, 54), (38, 41), (62, 15)]
    for tx, ty in member_targets:
        ax.plot([14.5, tx - 8.5], [26, ty], color='#0284C7', linewidth=1.1, alpha=0.75, linestyle='--')

    # Đường nối Vet -> Use cases
    vet_targets = [(60, 80), (38, 67), (62, 28), (50, 54)]
    for tx, ty in vet_targets:
        ax.plot([85.5, tx + 8.5], [68, ty], color='#8B5CF6', linewidth=1.1, alpha=0.75, linestyle='-')

    # Đường nối AI -> Use cases
    ai_targets = [(38, 41), (62, 41), (38, 28), (38, 15), (38, 67)]
    for tx, ty in ai_targets:
        ax.plot([85.5, tx + 8.5], [26, ty], color='#D946EF', linewidth=1.2, alpha=0.8, linestyle=':')

    plt.tight_layout()
    p1 = os.path.join(OUT_DIR, 'diagram_1_use_case.png')
    plt.savefig(p1, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"> Đã vẽ xong: {p1}")

# -------------------------------------------------------------
# BIỂU ĐỒ 2: SEQUENCE DIAGRAM (Khám bệnh AI Dr. Paw)
# -------------------------------------------------------------
def draw_sequence_diagram():
    fig, ax = plt.subplots(figsize=(14, 9), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')

    ax.text(50, 96, "SƠ ĐỒ TUẦN TỰ (SEQUENCE DIAGRAM) - TƯ VẤN Y KHOA DR. PAW AI", 
            fontsize=14, fontweight='bold', ha='center', color='#0F172A')
    ax.text(50, 93, "Quy trình nạp ngữ cảnh bệnh án (RAG Context Injection) và phân tầng khẩn cấp", 
            fontsize=10, fontstyle='italic', ha='center', color='#475569')

    # Lifelines
    lifelines = [
        (12, "User\n(Chủ nuôi)", '#059669', '#D1FAE5'),
        (31, "UI: AiChatView\n(Giao diện Chat)", '#0284C7', '#E0F2FE'),
        (50, "StorageService\n(Data Engine)", '#D97706', '#FEF3C7'),
        (69, "AIService\n(Dr. Paw Engine)", '#7C3AED', '#EDE9FE'),
        (88, "Gemini Cloud API\n(Google AI / Fallback)", '#DB2777', '#FCE7F3'),
    ]

    for (x, name, border, bg) in lifelines:
        # Box header
        box = FancyBboxPatch((x - 8, 83), 16, 6, boxstyle="round,pad=0.3,rounding_size=1", 
                             facecolor=bg, edgecolor=border, linewidth=1.8, zorder=3)
        ax.add_patch(box)
        ax.text(x, 86, name, fontsize=9, fontweight='bold', ha='center', va='center', color='#0F172A', zorder=4)
        # Đường thẳng đứng Lifeline
        ax.plot([x, x], [83, 10], color='#94A3B8', linestyle='--', linewidth=1.3, zorder=1)

    # Các thông điệp tuần tự
    steps = [
        (1, 12, 31, 78, "1. Chọn thú cưng Mochi & gửi triệu chứng 'Nôn bọt trắng'", '#0F172A', False),
        (2, 31, 50, 72, "2. getPets(userId) truy vấn bệnh án", '#0369A1', False),
        (3, 50, 31, 66, "3. Trả về petContext (24.5kg, Golden, Dị ứng thịt bò)", '#B45309', True),
        (4, 31, 69, 60, "4. callGeminiApi(message, petContext)", '#4338CA', False),
        (5, 69, 69, 54, "5. Nạp RAG: VET_SYSTEM_PROMPT + Context + Triệu chứng", '#6D28D9', 'self'),
        (6, 69, 88, 48, "6. POST /generateContent (REST Payload)", '#BE185D', False),
        (7, 88, 69, 41, "7. Trả về kết quả: Chẩn đoán + Sơ cứu (Oresol/nhịn ăn)", '#BE185D', True),
        (8, 69, 69, 35, "8. Triaging: Phân tầng WARNING (Cảnh báo Tiêu hóa)", '#6D28D9', 'self'),
        (9, 69, 31, 29, "9. Trả về phản hồi y khoa cấu trúc chuẩn", '#4338CA', True),
        (10, 31, 31, 23, "10. Hiển thị thẻ Amber Warning + Phát Alert Sound", '#0284C7', 'self'),
        (11, 31, 12, 17, "11. Người nuôi nhận hướng dẫn xử trí an toàn tại nhà", '#047857', True),
    ]

    for (step_no, x_from, x_to, y, label, color, is_return) in steps:
        if is_return == 'self':
            # Tự gọi chính nó
            ax.plot([x_from, x_from + 4, x_from + 4, x_from], [y + 1.2, y + 1.2, y - 1.2, y - 1.2], 
                    color=color, linewidth=1.5)
            ax.annotate('', xy=(x_from, y - 1.2), xytext=(x_from + 1, y - 1.2),
                        arrowprops=dict(arrowstyle="->", color=color, lw=1.5))
            ax.text(x_from + 4.5, y, label, fontsize=8.2, fontweight='bold', color=color, va='center')
        elif is_return:
            # Thông điệp trả về (nét đứt)
            ax.plot([x_from, x_to], [y, y], color=color, linestyle='--', linewidth=1.4)
            ax.annotate('', xy=(x_to, y), xytext=(x_from, y),
                        arrowprops=dict(arrowstyle="->", color=color, lw=1.4, linestyle='--'))
            mid_x = (x_from + x_to) / 2
            ax.text(mid_x, y + 1.2, label, fontsize=8.2, fontstyle='italic', color=color, ha='center', va='bottom')
        else:
            # Thông điệp gọi tới (nét liền)
            ax.plot([x_from, x_to], [y, y], color=color, linestyle='-', linewidth=1.5)
            ax.annotate('', xy=(x_to, y), xytext=(x_from, y),
                        arrowprops=dict(arrowstyle="->", color=color, lw=1.5))
            mid_x = (x_from + x_to) / 2
            ax.text(mid_x, y + 1.2, label, fontsize=8.2, fontweight='bold', color=color, ha='center', va='bottom')

    plt.tight_layout()
    p2 = os.path.join(OUT_DIR, 'diagram_2_sequence.png')
    plt.savefig(p2, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"> Đã vẽ xong: {p2}")

# -------------------------------------------------------------
# BIỂU ĐỒ 3: ACTIVITY DIAGRAM (Quy trình Co-parenting)
# -------------------------------------------------------------
def draw_activity_diagram():
    fig, ax = plt.subplots(figsize=(13, 10), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')

    ax.text(50, 97, "SƠ ĐỒ HOẠT ĐỘNG (ACTIVITY DIAGRAM) - ĐỒNG CHĂM SÓC GIA ĐÌNH CO-PARENTING", 
            fontsize=13.5, fontweight='bold', ha='center', color='#0F172A')
    ax.text(50, 94, "Cơ chế kiểm soát Audit Log, ngăn chặn cho ăn trùng lặp và duy trì Streak 21 ngày", 
            fontsize=10, fontstyle='italic', ha='center', color='#475569')

    # Start Node
    start_circle = patches.Circle((50, 89), 1.5, facecolor='#0F172A', edgecolor='#0F172A', zorder=4)
    ax.add_patch(start_circle)
    ax.text(50, 91.5, "Bắt đầu", fontsize=8.5, fontweight='bold', ha='center', color='#0F172A')

    # Action 1: Mở Daily Checklist
    b1 = FancyBboxPatch((35, 80), 30, 5, boxstyle="round,pad=0.3,rounding_size=1.5", 
                        facecolor='#E0F2FE', edgecolor='#0284C7', linewidth=1.5)
    ax.add_patch(b1)
    ax.text(50, 82.5, "Thành viên gia đình mở Daily Checklist", fontsize=9, fontweight='bold', ha='center', va='center')
    ax.annotate('', xy=(50, 85), xytext=(50, 87.5), arrowprops=dict(arrowstyle="->", color='#0F172A', lw=1.5))

    # Action 2: Kiểm tra trạng thái
    b2 = FancyBboxPatch((32, 70), 36, 5, boxstyle="round,pad=0.3,rounding_size=1.5", 
                        facecolor='#FEF3C7', edgecolor='#D97706', linewidth=1.5)
    ax.add_patch(b2)
    ax.text(50, 72.5, "Hệ thống truy xuất trạng thái thói quen trong ngày", fontsize=9, fontweight='bold', ha='center', va='center')
    ax.annotate('', xy=(50, 75), xytext=(50, 80), arrowprops=dict(arrowstyle="->", color='#0F172A', lw=1.5))

    # Decision 1: Đã làm chưa?
    d1 = patches.Polygon([[50, 64], [62, 59], [50, 54], [38, 59]], closed=True, 
                         facecolor='#EDE9FE', edgecolor='#7C3AED', linewidth=1.8)
    ax.add_patch(d1)
    ax.text(50, 59, "Cữ ăn/thuốc đã có\nai làm trước chưa?", fontsize=8, fontweight='bold', ha='center', va='center', color='#4C1D95')
    ax.annotate('', xy=(50, 64), xytext=(50, 70), arrowprops=dict(arrowstyle="->", color='#0F172A', lw=1.5))

    # Nhánh [ĐÃ LÀM - YES] (Sang trái)
    ax.plot([38, 20, 20], [59, 59, 50], color='#DC2626', linewidth=1.5)
    ax.annotate('', xy=(20, 48), xytext=(20, 50), arrowprops=dict(arrowstyle="->", color='#DC2626', lw=1.5))
    ax.text(26, 60.5, "[Có - Đã hoàn thành]", fontsize=8, fontweight='bold', color='#DC2626', ha='center')

    b_stop = FancyBboxPatch((8, 41), 24, 7, boxstyle="round,pad=0.3,rounding_size=1.5", 
                            facecolor='#FEE2E2', edgecolor='#DC2626', linewidth=1.5)
    ax.add_patch(b_stop)
    ax.text(20, 44.5, "Hiển thị Audit: 'Hoàn thành bởi\n[Bố Hải lúc 07:15]'\nCẢNH BÁO: DỪNG CHO ĂN!", 
            fontsize=8, fontweight='bold', ha='center', va='center', color='#991B1B')

    # End Node nhánh Yes
    end_yes_out = patches.Circle((20, 31), 1.6, facecolor='none', edgecolor='#DC2626', linewidth=1.5)
    end_yes_in = patches.Circle((20, 31), 1.0, facecolor='#DC2626', edgecolor='#DC2626')
    ax.add_patch(end_yes_out)
    ax.add_patch(end_yes_in)
    ax.annotate('', xy=(20, 33), xytext=(20, 41), arrowprops=dict(arrowstyle="->", color='#DC2626', lw=1.5))
    ax.text(20, 27.5, "Kết thúc an toàn\n(Chống cho ăn trùng)", fontsize=7.5, fontstyle='italic', ha='center', color='#991B1B')

    # Nhánh [CHƯA LÀM - NO] (Đi xuống)
    ax.plot([50, 50], [54, 48], color='#059669', linewidth=1.5)
    ax.annotate('', xy=(50, 48), xytext=(50, 54), arrowprops=dict(arrowstyle="->", color='#059669', lw=1.5))
    ax.text(56, 51, "[Chưa làm]", fontsize=8, fontweight='bold', color='#059669', ha='left')

    b_act = FancyBboxPatch((35, 41), 30, 6.5, boxstyle="round,pad=0.3,rounding_size=1.5", 
                           facecolor='#DCFCE7', edgecolor='#16A34A', linewidth=1.5)
    ax.add_patch(b_act)
    ax.text(50, 44.2, "Thành viên cho ăn theo định lượng\nvà nhấn nút Checkbox xác nhận", 
            fontsize=8.5, fontweight='bold', ha='center', va='center', color='#065F46')

    # Action: Ghi nhận Audit Log & Tăng Streak
    b_audit = FancyBboxPatch((33, 29), 34, 6.5, boxstyle="round,pad=0.3,rounding_size=1.5", 
                             facecolor='#F3E8FF', edgecolor='#9333EA', linewidth=1.5)
    ax.add_patch(b_audit)
    ax.text(50, 32.2, "Gọi toggleDailyHabit(habitId, memberName)\nGhi: completedBy, time, Streak = Streak + 1", 
            fontsize=8.2, fontweight='bold', ha='center', va='center', color='#581C87')
    ax.annotate('', xy=(50, 35.5), xytext=(50, 41), arrowprops=dict(arrowstyle="->", color='#059669', lw=1.5))

    # Decision 2: Streak == 21?
    d2 = patches.Polygon([[50, 24], [60, 20], [50, 16], [40, 20]], closed=True, 
                         facecolor='#FEF9C3', edgecolor='#CA8A04', linewidth=1.5)
    ax.add_patch(d2)
    ax.text(50, 20, "Streak đạt\n21 ngày?", fontsize=7.5, fontweight='bold', ha='center', va='center', color='#713F12')
    ax.annotate('', xy=(50, 24), xytext=(50, 29), arrowprops=dict(arrowstyle="->", color='#0F172A', lw=1.5))

    # Nhánh Đạt 21 ngày (Sang phải)
    ax.plot([60, 78, 78], [20, 20, 14], color='#D97706', linewidth=1.5)
    ax.annotate('', xy=(78, 14), xytext=(78, 16), arrowprops=dict(arrowstyle="->", color='#D97706', lw=1.5))
    ax.text(68, 21.5, "[Đạt mốc vàng]", fontsize=7.5, fontweight='bold', color='#D97706', ha='center')

    b_confetti = FancyBboxPatch((67, 7), 22, 6, boxstyle="round,pad=0.3,rounding_size=1.5", 
                                facecolor='#FEF08A', edgecolor='#EAB308', linewidth=1.5)
    ax.add_patch(b_confetti)
    ax.text(78, 10, "Kích hoạt Confetti pháo hoa\nVinh danh Thói quen Kỷ luật!", 
            fontsize=7.8, fontweight='bold', ha='center', va='center', color='#854D0E')

    # Nối về End Node
    ax.plot([50, 50], [16, 10], color='#059669', linewidth=1.5)
    ax.annotate('', xy=(50, 10), xytext=(50, 12), arrowprops=dict(arrowstyle="->", color='#059669', lw=1.5))
    ax.text(53, 13.5, "[< 21 ngày]", fontsize=7.5, color='#475569')

    ax.plot([67, 53], [10, 10], color='#059669', linewidth=1.5)

    end_no_out = patches.Circle((50, 8), 1.8, facecolor='none', edgecolor='#059669', linewidth=1.6)
    end_no_in = patches.Circle((50, 8), 1.1, facecolor='#059669', edgecolor='#059669')
    ax.add_patch(end_no_out)
    ax.add_patch(end_no_in)
    ax.text(50, 4.5, "Hoàn thành & Đồng bộ Realtime", fontsize=8, fontweight='bold', ha='center', color='#065F46')

    plt.tight_layout()
    p3 = os.path.join(OUT_DIR, 'diagram_3_activity.png')
    plt.savefig(p3, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"> Đã vẽ xong: {p3}")

# -------------------------------------------------------------
# BIỂU ĐỒ 4: ENTITY RELATIONSHIP DIAGRAM (ERD)
# -------------------------------------------------------------
def draw_erd_diagram():
    fig, ax = plt.subplots(figsize=(15, 10), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')

    ax.text(50, 97, "SƠ ĐỒ THỰC THỂ LIÊN KẾT (ENTITY RELATIONSHIP DIAGRAM - ERD)", 
            fontsize=14.5, fontweight='bold', ha='center', color='#0F172A')
    ax.text(50, 94, "Mô hình quan hệ chuẩn hóa 8 bảng dữ liệu thực tế trong hệ thống PetCare PRO AI", 
            fontsize=10, fontstyle='italic', ha='center', color='#475569')

    # Helper vẽ Entity Card
    def draw_entity(x, y, w, h, title, fields, color='#0284C7'):
        # Header box
        header = FancyBboxPatch((x, y + h - 4.5), w, 4.5, boxstyle="round,pad=0.2,rounding_size=1", 
                                facecolor=color, edgecolor=color, linewidth=1.5, zorder=3)
        ax.add_patch(header)
        ax.text(x + w / 2, y + h - 2.25, title, fontsize=9.5, fontweight='bold', ha='center', va='center', color='#FFFFFF', zorder=4)

        # Body box
        body = FancyBboxPatch((x, y), w, h - 4.5, boxstyle="square,pad=0", 
                              facecolor='#FFFFFF', edgecolor=color, linewidth=1.5, zorder=2)
        ax.add_patch(body)

        # Fields
        cur_y = y + h - 6.5
        for field, f_type, key_tag in fields:
            # Key badge
            if key_tag == 'PK':
                ax.text(x + 1, cur_y, "PK", fontsize=7.5, fontweight='bold', color='#DC2626')
            elif key_tag == 'FK':
                ax.text(x + 1, cur_y, "FK", fontsize=7.5, fontweight='bold', color='#2563EB')
            else:
                ax.text(x + 1.2, cur_y, "•", fontsize=8, color='#94A3B8')

            ax.text(x + 4.5, cur_y, field, fontsize=8, fontweight='bold' if key_tag else 'normal', color='#1E293B')
            ax.text(x + w - 1, cur_y, f_type, fontsize=7.5, fontstyle='italic', color='#64748B', ha='right')
            cur_y -= 2.2

    # 1. USERS
    draw_entity(4, 66, 20, 24, "USERS", [
        ("id", "VARCHAR(36)", "PK"),
        ("name", "VARCHAR(100)", ""),
        ("email", "VARCHAR(100)", ""),
        ("password", "VARCHAR(255)", ""),
        ("phone", "VARCHAR(20)", ""),
        ("role", "VARCHAR(20)", ""),
        ("createdAt", "DATETIME", ""),
    ], '#059669')

    # 2. PETS (Trung tâm)
    draw_entity(38, 56, 24, 34, "PETS", [
        ("id", "VARCHAR(36)", "PK"),
        ("ownerId", "VARCHAR(36)", "FK"),
        ("name", "VARCHAR(50)", ""),
        ("species", "VARCHAR(20)", ""),
        ("breed", "VARCHAR(50)", ""),
        ("gender", "VARCHAR(10)", ""),
        ("birthDate", "DATE", ""),
        ("weight", "FLOAT", ""),
        ("microchip", "VARCHAR(30)", ""),
        ("isNeutered", "BOOLEAN", ""),
        ("notes", "TEXT", ""),
        ("weightHistory", "JSON", ""),
    ], '#0284C7')

    # 3. FAMILY_MEMBERS
    draw_entity(76, 68, 20, 22, "FAMILY_MEMBERS", [
        ("id", "VARCHAR(36)", "PK"),
        ("name", "VARCHAR(100)", ""),
        ("role", "VARCHAR(20)", ""),
        ("phone", "VARCHAR(20)", ""),
        ("assignedPetIds", "JSON/ARRAY", ""),
    ], '#7C3AED')

    # 4. SCHEDULES
    draw_entity(4, 32, 22, 26, "SCHEDULES", [
        ("id", "VARCHAR(36)", "PK"),
        ("petId", "VARCHAR(36)", "FK"),
        ("title", "VARCHAR(150)", ""),
        ("type", "VARCHAR(20)", ""),
        ("date", "DATE", ""),
        ("time", "TIME", ""),
        ("location", "VARCHAR(150)", ""),
        ("completed", "BOOLEAN", ""),
        ("repeat", "VARCHAR(20)", ""),
    ], '#D97706')

    # 5. DAILY_HABITS
    draw_entity(38, 20, 24, 25, "DAILY_HABITS", [
        ("id", "VARCHAR(36)", "PK"),
        ("petId", "VARCHAR(36)", "FK"),
        ("title", "VARCHAR(150)", ""),
        ("timeOfDay", "VARCHAR(20)", ""),
        ("completed", "BOOLEAN", ""),
        ("completedBy", "VARCHAR(100)", ""),
        ("completedAt", "TIME", ""),
        ("streak", "INT", ""),
    ], '#DB2777')

    # 6. DAILY_LOGS (Audit Log)
    draw_entity(76, 36, 20, 24, "DAILY_LOGS", [
        ("id", "VARCHAR(36)", "PK"),
        ("petId", "VARCHAR(36)", "FK"),
        ("date", "DATE", ""),
        ("poopStatus", "VARCHAR(20)", ""),
        ("peeStatus", "VARCHAR(20)", ""),
        ("walkMinutes", "INT", ""),
        ("mealStatus", "VARCHAR(20)", ""),
        ("mood", "VARCHAR(20)", ""),
    ], '#4F46E5')

    # 7. PRESCRIPTIONS
    draw_entity(4, 3, 22, 22, "PRESCRIPTIONS", [
        ("id", "VARCHAR(36)", "PK"),
        ("petId", "VARCHAR(36)", "FK"),
        ("medicineName", "VARCHAR(150)", ""),
        ("dosage", "VARCHAR(100)", ""),
        ("startDate", "DATE", ""),
        ("durationDays", "INT", ""),
        ("prescribedBy", "VARCHAR(100)", ""),
    ], '#DC2626')

    # 8. EXPENSES
    draw_entity(76, 5, 20, 23, "EXPENSES", [
        ("id", "VARCHAR(36)", "PK"),
        ("petId", "VARCHAR(36)", "FK"),
        ("category", "VARCHAR(30)", ""),
        ("title", "VARCHAR(150)", ""),
        ("amount", "DECIMAL(12,2)", ""),
        ("date", "DATE", ""),
        ("notes", "TEXT", ""),
    ], '#EA580C')

    # Vẽ đường nối quan hệ 1 - N
    def draw_relation(x1, y1, x2, y2, label="1 : N"):
        ax.plot([x1, x2], [y1, y2], color='#475569', linewidth=1.5, zorder=1)
        mid_x = (x1 + x2) / 2
        mid_y = (y1 + y2) / 2
        ax.text(mid_x, mid_y + 1.2, label, fontsize=8, fontweight='bold', 
                color='#0F172A', ha='center', bbox=dict(boxstyle="square,pad=0.2", facecolor='#F1F5F9', edgecolor='none'))

    # Users -> Pets
    draw_relation(24, 78, 38, 78, "1 : N")
    # Pets -> Schedules
    draw_relation(38, 65, 26, 45, "1 : N")
    # Pets -> Daily Habits
    draw_relation(50, 56, 50, 45, "1 : N")
    # Pets -> Daily Logs
    draw_relation(62, 65, 76, 48, "1 : N")
    # Pets -> Prescriptions
    draw_relation(38, 60, 26, 14, "1 : N")
    # Pets -> Expenses
    draw_relation(62, 60, 76, 16, "1 : N")
    # Family Members <-> Pets (N - N)
    draw_relation(62, 79, 76, 79, "N : N")

    plt.tight_layout()
    p4 = os.path.join(OUT_DIR, 'diagram_4_erd.png')
    plt.savefig(p4, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"> Đã vẽ xong: {p4}")

# -------------------------------------------------------------
# BIỂU ĐỒ 5: SYSTEM ARCHITECTURE DIAGRAM (Kiến trúc 3 tầng)
# -------------------------------------------------------------
def draw_architecture_diagram():
    fig, ax = plt.subplots(figsize=(15, 9.5), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')

    ax.text(50, 96.5, "SƠ ĐỒ KIẾN TRÚC PHẦN MỀM 3 TẦNG (SYSTEM ARCHITECTURE DIAGRAM)", 
            fontsize=14.5, fontweight='bold', ha='center', color='#0F172A')
    ax.text(50, 93.5, "Phân lớp trách nhiệm: Presentation Layer, Business Logic Layer và Database & AI Services", 
            fontsize=10, fontstyle='italic', ha='center', color='#475569')

    # TẦNG 1: PRESENTATION LAYER
    box_p = FancyBboxPatch((4, 64), 92, 26, boxstyle="round,pad=0.8,rounding_size=1.5", 
                           facecolor='#FFFFFF', edgecolor='#0284C7', linewidth=2)
    ax.add_patch(box_p)
    ax.text(6, 87.5, "TẦNG 1: PRESENTATION LAYER (Giao diện & Tương tác vi mô - React 19 + Vite 8)", 
            fontsize=10.5, fontweight='bold', color='#0284C7')

    comp_ui = [
        (14, 73, "Bento Grid Dashboard\nDark Emerald (#102B21)", '#E0F2FE', '#0284C7'),
        (38, 73, "Toothless SVG Mascot\nPaw Tracking & Peeking", '#DCFCE7', '#16A34A'),
        (62, 73, "CatDoorSignInButton\n4-Phase Animated Lock", '#FEF3C7', '#D97706'),
        (86, 73, "Canvas Confetti &\nSoundService Synth", '#FCE7F3', '#DB2777'),
    ]
    for (cx, cy, label, bg, border) in comp_ui:
        b = FancyBboxPatch((cx - 10, cy - 5), 20, 10, boxstyle="round,pad=0.3,rounding_size=1",
                           facecolor=bg, edgecolor=border, linewidth=1.4)
        ax.add_patch(b)
        ax.text(cx, cy, label, fontsize=8.2, fontweight='bold', ha='center', va='center', color='#0F172A')

    # Mũi tên kết nối 1 -> 2
    for x in [25, 50, 75]:
        ax.annotate('', xy=(x, 57), xytext=(x, 64), 
                    arrowprops=dict(arrowstyle="<->", color='#475569', lw=2))

    # TẦNG 2: BUSINESS LOGIC LAYER
    box_b = FancyBboxPatch((4, 33), 92, 24, boxstyle="round,pad=0.8,rounding_size=1.5", 
                           facecolor='#FFFFFF', edgecolor='#059669', linewidth=2)
    ax.add_patch(box_b)
    ax.text(6, 54.5, "TẦNG 2: BUSINESS LOGIC & SERVICE ABSTRACTION LAYER (Xử lý nghiệp vụ & AI Engine)", 
            fontsize=10.5, fontweight='bold', color='#059669')

    comp_logic = [
        (16, 42, "StorageService Engine\nCascade Delete & Schema v1", '#F0FDF4', '#16A34A'),
        (38, 42, "AuthService Engine\nRole Guard & Session Strip", '#ECFDF5', '#059669'),
        (60, 42, "AIService Controller\nRAG Injector & Simulated Rules", '#EFF6FF', '#2563EB'),
        (82, 42, "Algorithms & OCR\nRER/DER & 3-Way Pipeline", '#FAF5FF', '#9333EA'),
    ]
    for (cx, cy, label, bg, border) in comp_logic:
        b = FancyBboxPatch((cx - 9.5, cy - 5), 19, 10, boxstyle="round,pad=0.3,rounding_size=1",
                           facecolor=bg, edgecolor=border, linewidth=1.4)
        ax.add_patch(b)
        ax.text(cx, cy, label, fontsize=8.2, fontweight='bold', ha='center', va='center', color='#0F172A')

    # Mũi tên kết nối 2 -> 3
    for x in [25, 50, 75]:
        ax.annotate('', xy=(x, 26), xytext=(x, 33), 
                    arrowprops=dict(arrowstyle="<->", color='#475569', lw=2))

    # TẦNG 3: DATABASE & EXTERNAL SERVICES
    box_d = FancyBboxPatch((4, 2), 92, 24, boxstyle="round,pad=0.8,rounding_size=1.5", 
                           facecolor='#FFFFFF', edgecolor='#7C3AED', linewidth=2)
    ax.add_patch(box_d)
    ax.text(6, 23.5, "TẦNG 3: PERSISTENCE, BACKEND APIS & CLOUD AI SERVICES", 
            fontsize=10.5, fontweight='bold', color='#7C3AED')

    comp_db = [
        (16, 11, "Browser LocalStorage\nSchema Key-Value Versioning", '#FEF2F2', '#EF4444'),
        (38, 11, "iCalendar RFC 5545 &\nJSON Enterprise v3.0", '#FEF9C3', '#CA8A04'),
        (60, 11, "Google Gemini 1.5 Flash\nMultimodal RESTful API", '#FDF4FF', '#C026D3'),
        (82, 11, "Smart Simulated Rules\nOffline Fallback Engine", '#EDE9FE', '#7C3AED'),
    ]
    for (cx, cy, label, bg, border) in comp_db:
        b = FancyBboxPatch((cx - 9.5, cy - 5), 19, 10, boxstyle="round,pad=0.3,rounding_size=1",
                           facecolor=bg, edgecolor=border, linewidth=1.4)
        ax.add_patch(b)
        ax.text(cx, cy, label, fontsize=8.2, fontweight='bold', ha='center', va='center', color='#0F172A')

    plt.tight_layout()
    p5 = os.path.join(OUT_DIR, 'diagram_5_architecture.png')
    plt.savefig(p5, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"> Đã vẽ xong: {p5}")

if __name__ == '__main__':
    draw_use_case_diagram()
    draw_sequence_diagram()
    draw_activity_diagram()
    draw_erd_diagram()
    draw_architecture_diagram()
    print(">>> HOÀN TẤT VẼ 5 BIỂU ĐỒ KỸ THUẬT RÕ NÉT 300 DPI!")
