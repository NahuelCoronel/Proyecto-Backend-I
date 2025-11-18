console.log("✅ products.js cargado correctamente");

// 1. Conexión al Socket
const socket = io();

socket.on('connect', () => {
    console.log("✅ Conectado al servidor de WebSockets con ID:", socket.id);
});

// Referencias al DOM
const form = document.getElementById('form-agregar-producto');
const listaEmpanadas = document.getElementById('lista-empanadas');

// Configuración de Toast (SweetAlert2)
const Toast = Swal.mixin({
    toast: true,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
});

// Lógica de Notificaciones tras recarga
document.addEventListener('DOMContentLoaded', () => {
    const pendingIcon = localStorage.getItem('toast_icon');
    const pendingMessage = localStorage.getItem('toast_message');

    if (pendingIcon && pendingMessage) {
        Toast.fire({ icon: pendingIcon, title: pendingMessage });
        localStorage.removeItem('toast_icon');
        localStorage.removeItem('toast_message');
    }
});

function recargarConNotificacion(icon, message) {
    console.log(`🔄 Recibida orden de recarga: ${message}`);
    localStorage.setItem('toast_icon', icon);
    localStorage.setItem('toast_message', message);
    window.location.reload();
}

// ------------------------------------------------------
// 1. EVENTO FORMULARIO (POST)
// ------------------------------------------------------
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log("📤 Enviando formulario...");

        const formData = new FormData(form);
        const productData = {};
        formData.forEach((value, key) => productData[key] = value);

        try {
            const response = await fetch('/api/productos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
            
            console.log("📥 Respuesta del servidor (POST):", response.status);
            
            if(response.ok) {
                form.reset();
                console.log("✅ Formulario enviado OK. Esperando evento de socket...");
            } else {
                console.error("❌ Error al crear producto en API");
            }

        } catch (error) {
            console.error('Error fetch:', error);
        }
    });
} else {
    console.error("❌ No se encontró el formulario #form-agregar-producto");
}

// ------------------------------------------------------
// 2. EVENTO ELIMINAR (DELETE)
// ------------------------------------------------------
if (listaEmpanadas) {
    listaEmpanadas.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-eliminar')) {
            const id = e.target.dataset.id;
            console.log(`🗑️ Solicitando eliminar ID: ${id}`);
            await fetch(`/api/productos/${id}`, { method: 'DELETE' });
        }
    });
}

// ------------------------------------------------------
// 3. ESCUCHA DE EVENTOS SOCKET
// ------------------------------------------------------

socket.on('productoAgregado', (data) => {
    console.log("🔥 SOCKET RECIBIDO: productoAgregado", data);
    recargarConNotificacion('success', '¡Producto agregado!');
});

socket.on('productoEliminado', (data) => {
    console.log("🔥 SOCKET RECIBIDO: productoEliminado", data);
    recargarConNotificacion('error', 'Producto eliminado');
});

socket.on('productoActualizado', (data) => {
    console.log("🔥 SOCKET RECIBIDO: productoActualizado", data);
    recargarConNotificacion('info', 'Producto actualizado');
});