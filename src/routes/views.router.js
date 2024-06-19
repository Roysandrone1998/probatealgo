const express = require("express");
const router = express.Router();
const ViewsController = require("../controller/view.controller.js");
const viewsController = new ViewsController();
const checkUserRole = require("../middleware/checkroles.js");
const passport = require("passport");

router.get("/products", checkUserRole(['usuario','premium']),passport.authenticate('jwt', { session: false }), viewsController.renderProducts);

router.get("/carts/:cid", viewsController.renderCart);
router.get("/login", viewsController.renderLogin);
router.get("/register", viewsController.renderRegister);
router.get("/realtimeproducts", checkUserRole(['admin', 'premium']), viewsController.renderRealTimeProducts);
router.get("/chat", checkUserRole(['usuario','premium']) ,viewsController.renderChat);
router.get("/", viewsController.renderHome);


router.get("/reset-password", viewsController.renderResetPassword);
router.get("/password", viewsController.renderCambioPassword);
router.get("/confirmacion-envio", viewsController.renderConfirmacion);

module.exports = router;