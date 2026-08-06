import { redirect } from 'next/navigation';

/** Giữ URL cấu hình cũ tương thích bằng cách đưa người dùng về workspace xét nghiệm. */
export default function Page() {
  redirect('/lab');
}
