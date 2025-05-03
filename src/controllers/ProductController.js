const { ProductAbstract } = require("../class/ProductAbstract");
const Product = require("../models/Product");
const Shipment = require("../models/Shipment");
const User = require("../models/User");
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

class ProductController extends ProductAbstract {
    #shipmentId;
    
    constructor(description, weight, packages, delivery_date, shipmentId) {
        super(description, weight, packages, delivery_date);
        this.#shipmentId = shipmentId;
    }
    

    calculateCost(baseCost) {
        let costMultiplier = 1;
        const weight = parseFloat(this.weight);
        
        if (weight > 6) {
            costMultiplier = 3;
        } else if (weight > 3) {
            costMultiplier = 2;
        }
        
        return baseCost * costMultiplier;
    }
    
    static async addProduct(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            const { shipmentId } = req.params;
            const { description, weight, packages, delivery_date } = req.body;
            
            if (!ObjectId.isValid(shipmentId)) {
                return res.status(400).json({
                    message: "ID de envío inválido"
                });
            }
            
            if (!description || !weight || !packages || !delivery_date) {
                return res.status(400).json({
                    message: "Faltan datos requeridos para el producto"
                });
            }
            
            const shipment = await Shipment.findById(shipmentId).session(session);
            
            if (!shipment) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({
                    message: "Envío no encontrado"
                });
            }
            
            const productController = new ProductController(
                description, 
                weight, 
                packages, 
                delivery_date, 
                shipmentId
            );
            
            const user = await User.findById(shipment.userId).session(session);
            
            if (!user) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({
                    message: "Usuario no encontrado"
                });
            }
            
            const product = new Product({
                shipmentId,
                ...productController.product
            });
            
            await product.save({ session });
            
            shipment.cost = productController.calculateCost(user.credits.cost);
            await shipment.save({ session });
            
            await session.commitTransaction();
            session.endSession();
            
            return res.status(201).json({
                message: "Producto agregado exitosamente",
                data: {
                    product,
                    shipmentCost: shipment.cost
                }
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error("Error al agregar producto:", error);
            return res.status(500).json({
                message: "Error al agregar el producto",
                error: error.message
            });
        }
    }
    
    static async getShipmentProducts(req, res) {
        try {
            const { shipmentId } = req.params;
            
            if (!ObjectId.isValid(shipmentId)) {
                return res.status(400).json({
                    message: "ID de envío inválido"
                });
            }
            
            const products = await Product.find({ shipmentId });
            
            return res.status(200).json({
                message: "Productos del envío",
                data: products
            });
        } catch (error) {
            console.error("Error al obtener productos:", error);
            return res.status(500).json({
                message: "Error al obtener los productos",
                error: error.message
            });
        }
    }
    
    static async updateProduct(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            const { productId } = req.params;
            const { description, weight, packages, delivery_date } = req.body;
            
            if (!ObjectId.isValid(productId)) {
                return res.status(400).json({
                    message: "ID de producto inválido"
                });
            }
            
            const product = await Product.findById(productId).session(session);
            
            if (!product) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({
                    message: "Producto no encontrado"
                });
            }
            
            if (description) product.description = description;
            if (weight) product.weight = weight;
            if (packages) product.packages = packages;
            if (delivery_date) product.delivery_date = new Date(delivery_date);
            
            await product.save({ session });
            
            if (weight) {
                const shipment = await Shipment.findById(product.shipmentId).session(session);
                const user = await User.findById(shipment.userId).session(session);
                
                const productController = new ProductController(
                    product.description, 
                    product.weight, 
                    product.packages, 
                    product.delivery_date, 
                    product.shipmentId
                );
                
                shipment.cost = productController.calculateCost(user.credits.cost);
                await shipment.save({ session });
            }
            
            await session.commitTransaction();
            session.endSession();
            
            return res.status(200).json({
                message: "Producto actualizado exitosamente",
                data: product
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error("Error al actualizar producto:", error);
            return res.status(500).json({
                message: "Error al actualizar el producto",
                error: error.message
            });
        }
    }
    
    static async deleteProduct(req, res) {
        try {
            const { productId } = req.params;
            
            if (!ObjectId.isValid(productId)) {
                return res.status(400).json({
                    message: "ID de producto inválido"
                });
            }
            
            const product = await Product.findByIdAndDelete(productId);
            
            if (!product) {
                return res.status(404).json({
                    message: "Producto no encontrado"
                });
            }
            
            return res.status(200).json({
                message: "Producto eliminado exitosamente"
            });
        } catch (error) {
            console.error("Error al eliminar producto:", error);
            return res.status(500).json({
                message: "Error al eliminar el producto",
                error: error.message
            });
        }
    }
}

module.exports = {
    ProductController
};