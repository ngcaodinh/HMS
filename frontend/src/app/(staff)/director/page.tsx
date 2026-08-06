import { redirect } from 'next/navigation';

/** Route trung gian của khu giám đốc, chuyển về dashboard mặc định của workflow. */
export default function DirectorRoute() {
  redirect('/director/dashboard');
}
