import jwt from "jsonwebtoken"

export function signToken(user:any) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  )
}

export function verifyToken(token:string) {
    try {
  return jwt.verify(token, process.env.JWT_SECRET!) as any
}catch(error){
    //return null if the the token is expired 
    return null;
}}
