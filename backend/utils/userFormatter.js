const formatUserOutput = (user) => {
  if (!user) {
    return null;
  }
  // Determina el nombre del rol de forma segura
  let roleName = 'Desconocido';
  if (user.userRole?.role_name) {
    // Si la relación userRole se incluyó y tiene nombre
    roleName = user.userRole.role_name;
  } else if (user.rol === 1) {
    roleName = 'Alumno';
  } else if (user.rol === 2) {
    roleName = 'Profesor';
  }

  // Devuelve el objeto limpio
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    surname: user.surname, // Mantenemos surname
    email: user.email,
    rol: user.rol,
    role_name: roleName, // Nombre del rol calculado
    active: user.active,
    profile_image: user.profile_image,
  };
};

module.exports = {
  formatUserOutput,
};
