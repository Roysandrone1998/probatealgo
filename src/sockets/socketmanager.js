const socket = require("socket.io");
const ProductRepository = require("../repositories/product.repository.js");
const productRepository = new ProductRepository();
const MessageModel = require("../models/message.model.js");
const EmailManager = require("../services/email.js");
const emailManager = new EmailManager();

class SocketManager {
    constructor(httpServer) {
        this.io = socket(httpServer);
        this.initSocketEvents();
    }

    async initSocketEvents() {
        this.io.on("connection", async (socket) => {
            console.log("Usuario conectado.");

            // Emitir productos al cliente conectado
            const productos = await productRepository.obtenerProductos();
            socket.emit("products", productos.docs);

            // Manejar la eliminación de productos
            socket.on("deleteProduct", async ({ id, role }) => {
                try {
                    const product = await productRepository.obtenerProductoPorId(id);
                    if (!product) {
                        socket.emit("deleteProductError", { error: "Producto no encontrado" });
                        return;
                    }
                    await productRepository.eliminarProducto(id);

                    if (role === "admin" && product.owner !== "admin") {
                        await emailManager.productDeleted(product.owner, product.title);
                    }

                    this.emitUpdatedProducts(socket);
                } catch (error) {
                    console.error(`Error al eliminar producto: ${error.message}`);
                    socket.emit("deleteProductError", { error: "Error al eliminar producto" });
                }
            });

            // Manejar la creación de productos
            socket.on("createProduct", async (producto) => {
                await productRepository.agregarProducto(producto);
                this.emitUpdatedProducts(socket);
            });

            // Manejar los mensajes
            socket.on("message", async (data) => {
                await MessageModel.create(data);
                const messages = await MessageModel.find();
                socket.emit("message", messages);
            });
        });
    }

    async emitUpdatedProducts(socket) {
        const productos = await productRepository.obtenerProductos();
        socket.emit("products", productos.docs);
    }
}

module.exports = SocketManager;