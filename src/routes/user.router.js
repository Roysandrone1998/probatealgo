const express = require("express");
const router = express.Router();
const passport = require("passport");
const UserController = require("../controller/user.controller.js");

const userController = new UserController();
const checkUserRole = require("../middleware/checkroles.js");


router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/profile", passport.authenticate("jwt", { session: false }), userController.profile);
router.post("/logout", userController.logout.bind(userController));
router.get("/admin", passport.authenticate("jwt", { session: false }), userController.admin);
router.post("/requestPasswordReset", userController.requestPasswordReset); 
router.post('/reset-password', userController.resetPassword);
router.get("/", userController.getUsuarios);
router.delete("/delete", userController.deleteUserinactividad);

router.put("/premium/:uid", userController.cambiarRolPremium);
router.get('/admin/users', passport.authenticate('jwt', { session: false }), checkUserRole(['admin']), async (req, res) => {
    try {
        const users = await userRepository.findManyUsers({});
        res.render('admin-users', { users });
    } catch (error) {
        res.status(500).json({ error });
    }
});
const UserRepository = require("../repositories/user.repository.js");
const userRepository = new UserRepository();

const upload = require("../middleware/multer.js");

router.post("/:uid/documents", upload.fields([{ name: "document" }, { name: "products" }, { name: "profile" }]), async (req, res) => {
    const { uid } = req.params;
    const uploadedDocuments = req.files;

    try {
        const user = await userRepository.findById(uid);

        if (!user) {
            return res.status(404).send("Usuario no encontrado");
        }



        if (uploadedDocuments) {
            if (uploadedDocuments.document) {
                user.documents = user.documents.concat(uploadedDocuments.document.map(doc => ({
                    name: doc.originalname,
                    reference: doc.path
                })))
            }

            if (uploadedDocuments.products) {
                user.documents = user.documents.concat(uploadedDocuments.products.map(doc => ({
                    name: doc.originalname,
                    reference: doc.path
                })))
            }

            if (uploadedDocuments.profile) {
                user.documents = user.documents.concat(uploadedDocuments.profile.map(doc => ({
                    name: doc.originalname,
                    reference: doc.path
                })))
            }
        }


        await user.save();

        res.status(200).send("Documentos cargados exitosamente");
    } catch (error) {
        console.log(error);
        res.status(500).send("Error interno del servidor");
    }
})



module.exports = router;