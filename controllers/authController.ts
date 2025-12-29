export class AuthController {
  static login(email: string, password: string): boolean {
    // Simulate login validation
    if (email && password) {
      localStorage.setItem("userAuth", "true")
      return true
    }
    return false
  }

  static signup(userData: {
    name: string
    email: string
    birthDate: string
    gender: string
    password: string
  }): boolean {
    // Simulate signup
    if (userData.name && userData.email && userData.password) {
      localStorage.setItem(
        "user",
        JSON.stringify({
          name: userData.name,
          email: userData.email,
          birthDate: userData.birthDate,
          gender: userData.gender,
        }),
      )
      localStorage.setItem("userAuth", "true")
      return true
    }
    return false
  }

  static logout(): void {
    localStorage.removeItem("userAuth")
    localStorage.removeItem("user")
  }

  static isAuthenticated(): boolean {
    return localStorage.getItem("userAuth") === "true"
  }
}
