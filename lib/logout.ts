import { signOut } from "next-auth/react";



const handleLogout = () => {
signOut({ callbackUrl: "/login" });
};


//  <button
//   onClick={handleLogout}
//   className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
// >
//   Logout
// </button>
           

export default { handleLogout };
