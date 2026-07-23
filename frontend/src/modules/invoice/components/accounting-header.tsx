'use client';

import { AccountingScreenId } from '../types/invoice.types';

interface AccountingHeaderProps {
  activeScreen: AccountingScreenId;
  patientCount: number;
}

export function AccountingHeader({ activeScreen, patientCount }: AccountingHeaderProps) {
  const titles: Record<AccountingScreenId, { title: string; sub: string }> = {
    s1: {
      title: 'Bệnh Viện Da Liễu TP.HCM — Phân Hệ Thu Ngân & Kế Toán',
      sub: 'Ca làm việc: Ca Sáng (07:00 - 15:00) · 20/07/2026',
    },
    s2: {
      title: 'Lập Hóa Đơn & Chi Tiết BHYT Bệnh Nhân',
      sub: 'Xác nhận dịch vụ, áp dụng tỷ lệ BHYT và nghĩa vụ thanh toán',
    },
    s3: {
      title: 'Thanh Toán & Xuất Bảng Kê Chi Phí Mẫu 01/KBCB',
      sub: 'Thu tiền mặt / Ví MoMo QR và in Bảng kê A4 chính thức',
    },
    s4: {
      title: 'Quản Lý Tạm Ứng & Quyết Toán Hoàn Ứng Nội Trú',
      sub: 'Thu tiền tạm ứng và hoàn tiền thừa khi xuất viện',
    },
    s5: {
      title: 'Báo Cáo Tài Chính & Nhật Ký Giao Dịch Ca Trực',
      sub: 'Tổng hợp doanh thu tiền mặt, MoMo QR, chuyển khoản và tạm ứng',
    },
  };

  const current = titles[activeScreen];

  return (
    <header className="h-[58px] min-h-[58px] bg-white border-b border-[#bfc7d2] px-6 flex items-center justify-between z-10 select-none font-sans">
      <div className="flex flex-col justify-center min-w-0">
        <h1 className="text-[15px] font-bold text-[#171c1f] leading-tight truncate">
          {current.title}
        </h1>
        <p className="text-[11px] text-[#707882] font-normal truncate mt-0.5">{current.sub}</p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="inline-flex items-center gap-1.5 bg-[#cee5ff] text-[#006096] text-xs font-semibold rounded-full px-3 py-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          Bệnh viện Da Liễu TP.HCM
        </div>

        <div className="inline-flex items-center gap-1.5 bg-[#fff8e1] text-[#a05c00] text-xs font-semibold rounded-full px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-[#a05c00]" />
          Chờ xử lý: {patientCount}
        </div>
      </div>
    </header>
  );
}
