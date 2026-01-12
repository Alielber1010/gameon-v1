import { signOut } from "next-auth/react";



const handleLogout = () => {
signOut({ callbackUrl: "/login" });
};


export default handleLogout;

// <button onClick={() => handleLogout()}>Logout</button>
// <button onClick={() => handleLogout("/custom-path")}>Logout</button>
