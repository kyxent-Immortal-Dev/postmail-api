// src/routes/app.routes.js
const { Router } = require("express");
const { ShipmentController } = require("../controllers/ShipmentController");
const { ProductController } = require("../controllers/ProductController");

class AppRouter {
    static initRoutes() {
        try {
            const router = Router();
            
            // Rutas para usuarios y créditos
            router.get("/users/:userId/credits", ShipmentController.checkCredit);
            router.post("/users/:userId/credits", ShipmentController.buyCredits);
            
            // Rutas para envíos
            router.post("/users/:userId/shipments", ShipmentController.createShipment);
            router.get("/users/:userId/shipments", ShipmentController.getUserShipments);
            router.get("/shipments/:shipmentId", ShipmentController.getShipment);
            router.delete("/shipments/:shipmentId", ShipmentController.deleteShipment);
            
            // Rutas para productos
            router.post("/shipments/:shipmentId/products", ProductController.addProduct);
            router.get("/shipments/:shipmentId/products", ProductController.getShipmentProducts);
            router.put("/products/:productId", ProductController.updateProduct);
            router.delete("/products/:productId", ProductController.deleteProduct);
            
            return router;
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
        }
    }
}

module.exports = {
    AppRouter
};