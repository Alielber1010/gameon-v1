import { signOut } from "next-auth/react";

/**
 * Reusable logout function that can be used anywhere in the app
 * @param callbackUrl - Optional URL to redirect to after logout (defaults to "/login")
 */
export const handleLogout = (callbackUrl: string = "/login") => {
  signOut({ callbackUrl });
};

// Example usage:
// <button onClick={() => handleLogout()}>Logout</button>
// <button onClick={() => handleLogout("/custom-path")}>Logout</button>
