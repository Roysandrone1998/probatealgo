
const mongoose = require("mongoose");



mongoose.connect("mongodb+srv://roysandrone:Coder1@cluster0.ybo821i.mongodb.net/ecomerce?retryWrites=true&w=majority&appName=Cluster0")
    .then(() => console.log("Conexion exitosa"))
    .catch(() => console.log("Error en la conexion"))

