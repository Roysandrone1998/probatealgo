const FundaModel = require("../models/funda.model.js");

class ProductoRepository {
    async traerTodo() {
        try {
            const productos = await FundaModel.find();
            return productos;
        } catch (error) {
            throw new Error("Error al obtener las fundas");
        }
    }

    async crear(fundaData) {
        try {
            return await FundaModel.create(fundaData)
        } catch (error) {
            throw new Error("Error al crear una funda");
        }
    }
}

module.exports = FundaRepository;