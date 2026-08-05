import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { NextResponse } from 'next/server';

/**
 * @route   GET /api/doctor/medical-record-template
 * @desc    Cung cấp mẫu bệnh án chuẩn để màn hình bác sĩ bind dữ liệu trước khi in.
 * @access  doctor
 */
export async function GET() {
  const templatePaths = [
    path.resolve(process.cwd(), '..', 'doc', 'mẫu', 'benhan.html'),
    path.resolve(process.cwd(), 'doc', 'mẫu', 'benhan.html'),
  ];

  for (const templatePath of templatePaths) {
    try {
      const template = await readFile(templatePath, 'utf8');

      return new NextResponse(template, {
        headers: {
          'Cache-Control': 'no-store',
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    } catch {
      // Thử đường dẫn dự phòng khi Next.js được khởi chạy từ thư mục gốc repo.
    }
  }

  return new NextResponse('Không tìm thấy mẫu bệnh án.', { status: 500 });
}
