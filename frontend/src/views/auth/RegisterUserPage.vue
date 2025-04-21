<template>
    <div class="form-container">
        <h2>Registro de usuarios</h2>
        <b-form @submit="onSubmit" @reset="onReset" v-if="show">
            <b-form-group id="input-group-1" label="Tu nombre:" label-for="input-1">
                <b-form-input id="input-1" v-model="form.nombre" placeholder="Introduce tu nombre"
                    required></b-form-input>
            </b-form-group>

            <b-form-group id="input-group-2" label="Tus apellidos:" label-for="input-2">
                <b-form-input id="input-2" v-model="form.apellidos" placeholder="Introduce tus apellidos"
                    required></b-form-input>
            </b-form-group>

            <b-form-group id="input-group-2" label="Nombre de usuario:" label-for="input-3">
                <b-form-input id="input-3" v-model="form.username" placeholder="Introduce un nombre de usuario"
                    required></b-form-input>
            </b-form-group>

            <b-form-group id="input-group-4" label="Correo electrónico:" label-for="input-4"
                description="No compartiremos esta información con nadie más.">
                <b-form-input id="input-4" v-model="form.email" type="email" :state="emailState"
                    placeholder="Introduce tu email" required></b-form-input>
                <b-form-invalid-feedback>
                    Por favor, introduce un correo electrónico válido.
                </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group id="input-group-5" label="Contraseña:" label-for="input-5">
                <b-form-input id="input-5" v-model="form.password" type="password" :state="passwordState"
                    placeholder="Introduce tu contraseña" required></b-form-input>
            </b-form-group>

            <b-form-group id="input-group-6" label="Repetir Contraseña:" label-for="input-6"
                description="Las contraseñas deben coincidir.">
                <b-form-input id="input-6" v-model="form.retype_password" type="password" :state="passwordState"
                    placeholder="Vuelve a introducir tu contraseña" required></b-form-input>
                <b-form-invalid-feedback>
                    Las contraseñas no coinciden.
                </b-form-invalid-feedback>
            </b-form-group>

            <b-form-group id="input-group-7" label="Rol:" label-for="input-7">
                <b-form-select id="input-7" v-model="form.rol" :options="rol" required></b-form-select>
            </b-form-group>

            <b-form-group id="input-group-8" label="Token de validación:" label-for="input-8"
                v-if="form.rol === 'Profesor'">
                <b-form-input id="input-8" v-model="form.token" type="text"
                    placeholder="Introduce el token de validación" required></b-form-input>
                <b-form-invalid-feedback v-if="tokenError">El token introducido no es válido.</b-form-invalid-feedback>
            </b-form-group>

            <div class="d-flex justify-content-between">
                <b-button type="submit" variant="primary">Enviar</b-button>
                <b-button type="reset" variant="danger">Vaciar</b-button>
            </div>
        </b-form>
    </div>
</template>


<script>
export default {
    name: "RegisterUserPage",
    data() {
        return {
            form: {
                nombre: '',
                apellidos: '',
                username: '',
                email: '',
                password: '',
                retype_password: '',
                rol: null,
                token: ''
            },
            rol: [{ text: '¿Qué eres?', value: null }, 'Profesor', 'Alumno'],
            tokenError: false,
            show: true,
        };
    },
    computed: {
        emailState() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Expresión regular para validar email
            if (this.form.email === '') {
                return null;
            }
            return emailRegex.test(this.form.email);
        },
        // Devuelve el estado del campo: true (válido), false (inválido), null (sin validar)
        passwordState() {
            if (this.form.password === "" || this.form.retype_password === "") {
                return null; // No se ha introducido ninguna contraseña
            }
            return this.form.password === this.form.retype_password; // true si coinciden, false si no
        },
    },
    methods: {
        async onSubmit() {
            if (!this.emailState) {
                alert('El correo electrónico no es válido.');
                return;
            }
            // Valida antes de enviar
            if (this.passwordState === false) {
                alert("Las contraseñas no coinciden. Corrige los errores antes de continuar.");
                return;
            }
            if (this.form.rol === 'Profesor' && this.form.token !== '3rhb23uydb238ry6g2429hrh') {
                this.tokenError = true; //Muestra mensaje de error sino es correcto el token
                return;
            }
            this.tokenError = false;

            //Enviamos datos al backend
            try {
                const response = await fetch('http://localhost:3000/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.form),
                });
                const data = await response.json();

                if (data.success) {
                    alert('Registro completado con éxito.');
                    this.$router.push({ name: 'Inicio' });
                } else {
                    alert('Error en el registro, porfavor revise los datos.');
                }
            } catch (error) {
                console.error('Error en la comunicación del servidor:', error);
                alert('Error al enviar los datos.');
            }
        },
        onReset(event) {
            event.preventDefault()
            // Reset our form values
            this.form.nombre = ''
            this.form.apellidos = ''
            this.form.username = ''
            this.form.email = ''
            this.form.password = ''
            this.form.retype_password = ''
            this.form.rol = null
            // Trick to reset/clear native browser form validation state
            this.show = false
            this.$nextTick(() => {
                this.show = true
            })
        }
    }
}
</script>

<style scoped>
/* Contenedor del formulario */
.form-container {
    max-width: 500px;
    /* Ancho máximo del formulario */
    margin: 20px auto;
    /* Centrado vertical y horizontal */
    background-color: #ffffff;
    /* Fondo blanco */
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    /* Sombra ligera */
    padding: 30px;
    /* Espaciado interno */
}

/* Inputs y Select */
.b-form-input,
.b-form-select {
    width: 100%;
    /* Ajusta el ancho al contenedor */
    box-sizing: border-box;
    /* Incluye padding en el ancho total */
}

/* Espaciado */
.b-form-group {
    margin-bottom: 20px;
    /* Espaciado más uniforme */
}

/* Botones */
.b-button {
    font-size: 1rem;
    padding: 0.6rem 1.2rem;
    border-radius: 5px;
    transition: background-color 0.3s ease, border-color 0.3s ease;
    width: 48%;
    /* Ajusta el ancho para que queden uno al lado del otro */
}
</style>
