// frontend/src/models/User.js

class User {
  constructor(data = {}) {
    this.id = data.id || null;
    this.username = data.username || "";
    this.name = data.name || "";
    this.surname = data.surname || "";
    this.email = data.email || "";
    this.rol = data.rol || null; // El ID del rol
    this.role_name = data.role_name || ""; // El nombre del rol
    this.active = data.active === true || data.active === 1; // Aseguramos que sea booleano
    this.profile_image = data.profile_image || null;
  }

  get fullName() {
    return `${this.name} ${this.surname}`.trim();
  }

  isTeacher() {
    return this.rol === 2 || this.role_name === "teacher";
  }

  isStudent() {
    return this.rol === 1 || this.role_name === "student";
  }
}

export default User;
