import { redirect } from 'next/navigation';

/** Giữ URL lịch sử cũ tương thích; workspace xét nghiệm quyết định màn hình và quyền truy cập. */
export default function Page() {
  redirect('/lab');
}
