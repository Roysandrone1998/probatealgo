const UserModel = require("../models/user.model.js");
const CartModel = require("../models/cart.model.js");
const jwt = require("jsonwebtoken");
const { createHash, isValidPassword } = require("../utils/hashbcryp.js");
const UserDTO = require("../dto/user.dto.js");
const { generateResetToken } = require("../utils/tokenreset.js");
const MailingRepository = require("../repositories/mail.repository.js");

const UserRepository = require("../repositories/user.repository.js");
const userRepository = new UserRepository();
const mailingRepository = new MailingRepository();

const EmailManager = require("../services/email.js");
const emailManager = new EmailManager();

class UserController {
    async register(req, res) {
        const { first_name, last_name, email, password, age } = req.body;
        try {
            const existeUsuario = await userRepository.findByEmail(email);
            if (existeUsuario) {
                return res.status(400).send("El usuario ya existe");
            }

            const nuevoCarrito = new CartModel();
            await nuevoCarrito.save();

            const nuevoUsuario = new UserModel({
                first_name,
                last_name,
                email,
                cart: nuevoCarrito._id,
                password: createHash(password),
                age
            });

            await userRepository.create(nuevoUsuario);

            const token = jwt.sign({ user: nuevoUsuario }, "coderhouse", {
                expiresIn: "1h"
            });

            res.cookie("coderCookieToken", token, {
                maxAge: 3600000,
                httpOnly: true
            });

            res.redirect("/api/users/profile");
        } catch (error) {
            console.error(error);
            res.status(500).send("Error interno del servidor");
        }
    }

    async login(req, res) {
        const { email, password } = req.body;
        try {
            const usuarioEncontrado = await userRepository.findByEmail(email);

            if (!usuarioEncontrado) {
                return res.status(401).send("Usuario no válido");
            }

            const esValido = isValidPassword(password, usuarioEncontrado);
            if (!esValido) {
                return res.status(401).send("Contraseña incorrecta");
            }

            const token = jwt.sign({ user: usuarioEncontrado }, "coderhouse", {
                expiresIn: "1h"
            });
            usuarioEncontrado.last_connection = new Date();
            await usuarioEncontrado.save();

            res.cookie("coderCookieToken", token, {
                maxAge: 3600000,
                httpOnly: true
            });

            res.redirect("/api/users/profile");
        } catch (error) {
            console.error(error);
            res.status(500).send("Error interno del servidor");
        }
    }

    async profile(req, res) {
        try {
            const isPremium = req.user.role === 'premium';
            const userDto = new UserDTO(req.user.first_name, req.user.last_name, req.user.role);
            const isAdmin = req.user.role === 'admin';

            res.render("profile", { user: userDto, isPremium, isAdmin });
        } catch (error) {
            res.status(500).send('Error interno del servidor');
        }
    }

    async logout(req, res) {
        if (req.user) {
            try {
                req.user.last_connection = new Date();
                await req.user.save();
            } catch (error) {
                console.error(error);
                res.status(500).send("Error interno del servidor");
                return;
            }
        }

        res.clearCookie("coderCookieToken");
        res.redirect("/login");
    }

    async admin(req, res) {
        if (req.user.user.role !== "admin") {
            return res.status(403).send("Acceso denegado");
        }
        res.render("admin");
    }

    async requestPasswordReset(req, res) {
        const { email } = req.body;

        try {

            const user = await userRepository.findByEmail(email);
            if (!user) {
                return res.status(404).send("Usuario no encontrado");
            }

            const token = generateResetToken();

            user.resetToken = {
                token: token,
                expiresAt: new Date(Date.now() + 3600000) 
            };
            await userRepository.save(user);

            await emailManager.enviarCorreoRestablecimiento(email, user.first_name, token);

            res.redirect("/confirmacion-envio");
        } catch (error) {
            console.error(error);
            res.status(500).send("Error interno del servidor");
        }
    }

    async resetPassword(req, res) {
        const { email, password, token } = req.body;

        try {

            const user = await userRepository.findByEmail(email);
            if (!user) {
                return res.render("passwordcambio", { error: "Usuario no encontrado" });
            }

            const resetToken = user.resetToken;
            if (!resetToken || resetToken.token !== token) {
                return res.render("passwordreset", { error: "El token de restablecimiento de contraseña es inválido" });
            }

            const now = new Date();
            if (now > resetToken.expiresAt) {

                return res.redirect("/passwordcambio");
            }

            if (isValidPassword(password, user)) {
                return res.render("passwordcambio", { error: "La nueva contraseña no puede ser igual a la anterior" });
            }
            user.password = createHash(password);
            user.resetToken = undefined; 
            await userRepository.save(user);


            return res.redirect("/login");
        } catch (error) {
            console.error(error);
            return res.status(500).render("passwordreset", { error: "Error interno del servidor" });
        }
    }

    async cambiarRolPremium(req, res) {
        const { uid } = req.params;
        try {
            const user = await userRepository.findById(uid);

            if (!user) {
                return res.status(404).send("Usuario no encontrado");
            }

            const documentacionRequerida = ["Identificacion", "Comprobante de domicilio", "Comprobante de estado de cuenta"];

            const userDocuments = user.documents.map(doc => doc.name);

            const tieneDocumentacion = documentacionRequerida.every(doc => userDocuments.includes(doc));

            if (!tieneDocumentacion) {
                return res.status(400).send("El usuario tiene que completar toda la documentacion requerida o nunca sera premium");
            }

            const nuevoRol = user.role === "usuario" ? "premium" : "usuario";

            res.send(nuevoRol); 

        } catch (error) {
            res.status(500).send("Error del servidor, premium no funca");
        }
    }

        async getUsuarios(req, res) {
            const usuarios = await UserModel.find({ role: "usuario" });
            try {
            if (!usuarios) {
                console.log("no se pudo obtener usuarios");
            }
            console.log(usuarios);

            const userss = usuarios.map((usuarios) => ({
                first_name: usuarios.first_name,
                last_name: usuarios.last_name,
                email: usuarios.email,
                role: usuarios.role,
            }));
        
            res.render("users", { users: userss });
            } catch (err) {
            console.log(err);
            res.status(500).send("hubo un error en traer usuarios");
            }
        }
        async deleteUserinactividad(req, res) {
            try {
            const fecha = new Date();
            console.log(fecha);
        
            const fechaRest = fecha.setMinutes(fecha.getMinutes() - 30);
            console.log(fechaRest);
        
            const fechaDos = new Date(fechaRest);
            console.log(fechaDos);
        
            const fechaSeteada = await UserModel.find({
                last_connection: { $lt: fechaDos },
            });
            if (fechaSeteada.length === 0) {
                console.log("no hay usuarios para borrar, esto viene de console.log");
                return res.status(500).send("No hay usaurios para borrar");
            }
        
            const cleaner = await UserModel.deleteMany({
                last_connection: { $lt: fechaDos },
            });
            console.log(
                "aqui empieza el cleaner",
                cleaner,
                "aqui termina el cleaner"
            );
            res.status(200).json(fechaSeteada);
            } catch (error) {
            console.log(error);
            res.status(500).send("hubo unn error al eliminar");
            }
        }
        
}

module.exports = UserController;