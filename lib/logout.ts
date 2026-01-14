import { signOut } from "next-auth/react";

const handleLogout = async () => {
  try {
    // Clear all client-side storage first
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    
    // Sign out - this clears the NextAuth session token and cookies
    // NextAuth's signOut automatically broadcasts logout to all tabs via storage events
    // Use redirect: false so we can manually handle the redirect
    await signOut({ 
      redirect: false,
      callbackUrl: '/login'
    });
    
    // Wait to ensure signOut completes and broadcasts to all tabs
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Clear NextAuth cookies explicitly to ensure they're gone
    if (typeof window !== 'undefined') {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        // Clear any NextAuth related cookies with all possible paths/domains
        if (name.includes('next-auth') || name.includes('session') || name.includes('csrf')) {
          // Clear with different path and domain combinations
          const paths = ['/', '/dashboard', '/admin'];
          const domains = [
            window.location.hostname,
            `.${window.location.hostname}`,
            window.location.host
          ];
          
          paths.forEach(path => {
            domains.forEach(domain => {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${domain}`;
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
            });
          });
        }
      }
      
      // Trigger a storage event to notify all tabs (NextAuth should do this, but ensure it)
      if (typeof Storage !== 'undefined') {
        window.localStorage.setItem('nextauth.signout', Date.now().toString());
        window.localStorage.removeItem('nextauth.signout');
      }
      
      // Force a hard redirect using replace to ensure token is disposed
      // replace() prevents back button from going back to authenticated page
      window.location.replace('/login');
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Force redirect and clear everything even if signOut fails
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.includes('next-auth') || name.includes('session') || name.includes('csrf')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        }
      }
      
      // Trigger storage event
      if (typeof Storage !== 'undefined') {
        window.localStorage.setItem('nextauth.signout', Date.now().toString());
        window.localStorage.removeItem('nextauth.signout');
      }
      
      // Force hard redirect
      window.location.replace('/login');
    }
  }
};

export default handleLogout;

// <button onClick={() => handleLogout()}>Logout</button>
// <button onClick={() => handleLogout("/custom-path")}>Logout</button>
