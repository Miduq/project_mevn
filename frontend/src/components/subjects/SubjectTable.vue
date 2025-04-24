<!-- frontend/src/components/subjects/SubjectTable.vue -->

<template>
  <table class="table table-striped table-hover">
    <thead>
      <tr>
        <th>ID</th>
        <th>Nombre Asignatura</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody>
      <tr v-if="!subjects || subjects.length === 0">
        <td colspan="3" class="text-center fst-italic">
          {{ emptyMessage }}
        </td>
      </tr>
      <tr v-for="subject in subjects" :key="subject.id">
        <td>{{ subject.id }}</td>
        <td>{{ subject.subject }}</td>
        <td>
          <button
            class="btn btn-sm btn-warning me-2"
            @click="
              () => {
                console.log('Intentando emitir edit:', subject);
                $emit('edit', subject);
              }
            "
            :disabled="actionsDisabled"
          >
            <i class="bi bi-pencil"></i> Editar
          </button>
          <button
            class="btn btn-sm btn-danger"
            @click="$emit('delete', subject.id)"
            :disabled="actionsDisabled"
          >
            <i class="bi bi-trash"></i> Eliminar
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script>
export default {
  name: "SubjectTable",
  props: {
    // Prop para recibir el array de asignaturas desde el padre
    subjects: {
      type: Array,
      required: true,
      default: () => [], // Buena práctica tener un default
    },
    // Prop para saber si los botones deben deshabilitarse (ej: mientras se añade/edita)
    actionsDisabled: {
      type: Boolean,
      default: false,
    },
    // Prop para personalizar el mensaje cuando la tabla está vacía
    emptyMessage: {
      type: String,
      default: "No hay asignaturas para mostrar.",
    },
  },
  // Declara los eventos que este componente puede emitir hacia el padre
  emits: ["edit", "delete"],
};
</script>

<style scoped>
/* Puedes mover los estilos específicos de la tabla aquí si quieres */
.table {
  margin-top: 1.5rem;
  vertical-align: middle;
}
th,
td {
  padding: 12px 15px;
  text-align: left;
  vertical-align: middle;
}
td:last-child {
  text-align: center;
  width: 180px;
} /* Ajusta ancho acciones */
th:last-child {
  text-align: center;
  width: 180px;
}
th:first-child,
td:first-child {
  width: 80px;
} /* Ajusta ancho ID */

.fst-italic {
  font-style: italic;
}
.me-2 {
  margin-right: 0.5rem !important;
}
</style>
