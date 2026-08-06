import { redirect } from 'next/navigation';

/** Giữ URL kết quả cũ tương thích bằng cách chuyển về workspace xét nghiệm hiện hành. */
export default function Page() {
  redirect('/lab');
}
