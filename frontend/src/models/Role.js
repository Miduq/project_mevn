// frontend/src/models/Role.js

class Role {
  constructor(data = {}) {
    this.id = data.id || null;
    this.role_name = data.role_name || "";
  }
}

export default Role;
