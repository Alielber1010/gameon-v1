// app/page.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    // Redirect admins to admin dashboard, regular users to dashboard
    if (session.user?.role === 'admin') {
      redirect('/admin');
    } else {
      redirect('/dashboard');
    }
  } else {
    redirect('/login')
  }

}
