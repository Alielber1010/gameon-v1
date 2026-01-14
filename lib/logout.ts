import { signOut } from "next-auth/react";

const handleLogout = async () => {
  try {
    // Clear session and redirect to login
    await signOut({ 
      callbackUrl: "/login",
      redirect: true 
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Force redirect even if signOut fails
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
};

export default handleLogout;

// <button onClick={() => handleLogout()}>Logout</button>
// <button onClick={() => handleLogout("/custom-path")}>Logout</button>
