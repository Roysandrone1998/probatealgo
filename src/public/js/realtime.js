const socket = io();
const role = document.getElementById("role").textContent;
const email = document.getElementById("email").textContent;

// Escuchar eventos de productos desde el servidor
socket.on("products", (data) => {
    renderProductos(data);
});

// Función para renderizar productos en el DOM
const renderProductos = (productos) => {
    const contenedorProductos = document.getElementById("contenedorProductos");
    contenedorProductos.innerHTML = "";

    productos.forEach(item => {
        const card = document.createElement("div");
        card.classList.add("card");

        card.innerHTML =  
            `<p>${item.title}</p>
            <p>${item.price}</p>
            <button>Eliminar</button>`;

        contenedorProductos.appendChild(card);
        card.querySelector("button").addEventListener("click", () => {
            if (role === "premium" && item.owner === email) {
                eliminarProducto(item._id);
            } else if (role === "admin") {
                eliminarProducto(item._id);
            } else {
                Swal.fire({
                    title: "Acceso denegado",
                    text: "No puedes eliminar un producto que no sea tuyo.",
                });
            }
        });
    });
}

// Función para eliminar un producto
const eliminarProducto = (id) => {
    socket.emit("deleteProduct", { id, role });
}

// Manejar el evento de envío para agregar un producto
document.getElementById("btnEnviar").addEventListener("click", () => {
    agregarProducto();
});

// Función para agregar un producto
const agregarProducto = () => {
    const owner = role === "premium" ? email : "admin";

    const producto = {
        title: document.getElementById("title").value,
        description: document.getElementById("description").value,
        price: document.getElementById("price").value,
        img: document.getElementById("img").value,
        code: document.getElementById("code").value,
        stock: document.getElementById("stock").value,
        category: document.getElementById("category").value,
        status: document.getElementById("status").value === "true",
        owner
    };

    socket.emit("createProduct", producto);
}