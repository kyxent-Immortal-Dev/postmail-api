const { ShipmentAbstract } = require("../class/ShipmentAbstract");
const Shipment = require("../models/Shipment");
const User = require("../models/User");
const Product = require("../models/Product");
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

class ShipmentController extends ShipmentAbstract {
    #userId;
    
    constructor(name, address, phone, ref, observation, userId) {
        super(name, address, phone, ref, observation);
        this.#userId = userId;
    }

    static async checkCredit(req, res) {
        try {
            const { userId } = req.params;
            
            if (!ObjectId.isValid(userId)) {
                return res.status(400).json({
                    message: "ID de usuario inválido"
                });
            }
            
            const user = await User.findById(userId);
            
            if (!user) {
                return res.status(404).json({
                    message: "Usuario no encontrado"
                });
            }
            
            return res.status(200).json({
                message: "Información de crédito",
                data: {
                    credits: user.credits.amount,
                    shipments: user.credits.shipments,
                    cost: user.credits.cost
                }
            });
        } catch (error) {
            console.error("Error al verificar crédito:", error);
            return res.status(500).json({
                message: "Error al verificar el crédito",
                error: error.message
            });
        }
    }

    static async createShipment(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            const { userId } = req.params;
            const { name, address, phone, ref, observation } = req.body;
            
            if (!ObjectId.isValid(userId)) {
                return res.status(400).json({
                    message: "ID de usuario inválido"
                });
            }
            
            if (!name || !address || !phone || !ref) {
                return res.status(400).json({
                    message: "Faltan datos requeridos para el envío"
                });
            }
            
            const user = await User.findById(userId).session(session);
            
            if (!user) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({
                    message: "Usuario no encontrado"
                });
            }
            
            if (user.credits.shipments <= 0) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    message: "No tiene créditos disponibles para envíos"
                });
            }
            

            if (user.credits.amount < user.credits.cost) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({
                    message: "No tiene suficientes créditos monetarios para este envío",
                    required: user.credits.cost,
                    available: user.credits.amount
                });
            }
            
            const shipmentController = new ShipmentController(
                name, 
                address, 
                phone, 
                ref, 
                observation, 
                userId
            );
            
            const shipment = new Shipment({
                userId,
                ...shipmentController.shipment,
                cost: user.credits.cost 
            });
            
            await shipment.save({ session });
            
            user.credits.shipments -= 1;
            
            user.credits.amount -= user.credits.cost;
            
            await user.save({ session });
            
            await session.commitTransaction();
            session.endSession();
            
            return res.status(201).json({
                message: "Envío creado exitosamente",
                data: {
                    shipment,
                    remainingCredits: user.credits.amount,
                    remainingShipments: user.credits.shipments
                }
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error("Error al crear envío:", error);
            return res.status(500).json({
                message: "Error al crear el envío",
                error: error.message
            });
        }
    }
    
    static async getUserShipments(req, res) {
        try {
            const { userId } = req.params;
            
            if (!ObjectId.isValid(userId)) {
                return res.status(400).json({
                    message: "ID de usuario inválido"
                });
            }
            
            const shipments = await Shipment.find({ userId });
            
            return res.status(200).json({
                message: "Envíos del usuario",
                data: shipments
            });
        } catch (error) {
            console.error("Error al obtener envíos:", error);
            return res.status(500).json({
                message: "Error al obtener los envíos",
                error: error.message
            });
        }
    }
    
    static async getShipment(req, res) {
        try {
            const { shipmentId } = req.params;
            
            if (!ObjectId.isValid(shipmentId)) {
                return res.status(400).json({
                    message: "ID de envío inválido"
                });
            }
            
            const shipment = await Shipment.findById(shipmentId);
            
            if (!shipment) {
                return res.status(404).json({
                    message: "Envío no encontrado"
                });
            }
            
            const products = await Product.find({ shipmentId });
            
            return res.status(200).json({
                message: "Detalles del envío",
                data: {
                    shipment,
                    products
                }
            });
        } catch (error) {
            console.error("Error al obtener envío:", error);
            return res.status(500).json({
                message: "Error al obtener el envío",
                error: error.message
            });
        }
    }

    static async deleteShipment(req, res) {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
            const { shipmentId } = req.params;
            
            if (!ObjectId.isValid(shipmentId)) {
                return res.status(400).json({
                    message: "ID de envío inválido"
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
            
            const user = await User.findById(shipment.userId).session(session);
            
            if (!user) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({
                    message: "Usuario no encontrado"
                });
            }
            
            const shipmentCost = shipment.cost;
            
            user.credits.shipments += 1;
            
            if (shipmentCost > 0) {
                user.credits.amount += shipmentCost;
            }
            
            await user.save({ session });
            
            await Product.deleteMany({ shipmentId }).session(session);
            
            await Shipment.findByIdAndDelete(shipmentId).session(session);
            
            await session.commitTransaction();
            session.endSession();
            
            return res.status(200).json({
                message: "Envío eliminado y créditos devueltos exitosamente",
                data: {
                    shipmentCost: shipmentCost,
                    devueltoCreditos: shipmentCost,
                    creditosDisponibles: user.credits.amount,
                    enviosDisponibles: user.credits.shipments
                }
            });
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            console.error("Error al eliminar envío:", error);
            return res.status(500).json({
                message: "Error al eliminar el envío",
                error: error.message
            });
        }
    }
    
    static async buyCredits(req, res) {
        try {
            const { userId } = req.params;
            const { plan } = req.body;
            
            if (!ObjectId.isValid(userId)) {
                return res.status(400).json({
                    message: "ID de usuario inválido"
                });
            }
            
            const user = await User.findById(userId);
            
            if (!user) {
                return res.status(404).json({
                    message: "Usuario no encontrado"
                });
            }
            
            let amount, shipments, cost;
            
            switch (plan) {
                case 1:
                    amount = 135;
                    shipments = 30;
                    cost = amount / shipments;
                    break;
                case 2:
                    amount = 160;
                    shipments = 40;
                    cost = amount / shipments;
                    break;
                case 3:
                    amount = 180;
                    shipments = 60;
                    cost = amount / shipments;
                    break;
                default:
                    return res.status(400).json({
                        message: "Plan no válido. Elija entre 1, 2 o 3."
                    });
            }
            
            user.credits = {
                amount,
                shipments,
                cost
            };
            
            await user.save();
            
            return res.status(200).json({
                message: "Créditos comprados exitosamente",
                data: {
                    credits: user.credits
                }
            });
        } catch (error) {
            console.error("Error al comprar créditos:", error);
            return res.status(500).json({
                message: "Error al comprar créditos",
                error: error.message
            });
        }
    }

    
}

module.exports = {
    ShipmentController
};