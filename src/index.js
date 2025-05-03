const express = require("express")
const { Enviroments } = require("./plugins/Enviroments")
const {json} = require("express")
const cors = require("cors")
const { MongoService } = require("./db/Mongo.service")
const { AppRouter } = require("./routes/app.routes")
const User = require('./models/User')
const mongoose = require('mongoose')

class Server {
    #server = express.application
    #port   = Enviroments.PORT

    constructor(
        server = express.application,
        port   = Enviroments.PORT
    ){
        this.#server = server
        this.#port   = port
    }


    async seedDatabase() {
        try {
            console.log('Verificando datos iniciales...');
            

            const countUsers = await User.countDocuments();
            
            if (countUsers === 0) {
                console.log('Inicializando base de datos con datos de prueba...');
                

                const testUser = new User({
                    name: 'Ezequiel Campos',
                    email: 'ezequielcampos@postmail.com',
                    credits: {
                        amount: 0,
                        shipments: 0,
                        cost: 0
                    }
                });
                
                await testUser.save();
                
                console.log('Base de datos inicializada exitosamente');
                console.log('ID del usuario de prueba:', testUser._id);
            } else {
                console.log('La base de datos ya contiene datos.');
            }
        } catch (error) {
            console.error('Error al inicializar la base de datos:', error);
            throw error;
        }
    }

    async initServer(){
        try {
            const mongodb = new MongoService(Enviroments.MONGO);
            await mongodb.initService();
            
            await this.seedDatabase();
            
            this.#server.use(json());
            this.#server.use(cors());
            
            this.#server.use("/api", AppRouter.initRoutes());
            

            this.#server.listen(this.#port, () => {
                console.log(`Servidor ejecutándose en http://localhost:${this.#port}`);
                console.log('Para probar la API, utilice los siguientes endpoints:');
                console.log('- GET /api/users/:userId/credits - Verificar créditos disponibles');
                console.log('- POST /api/users/:userId/credits - Comprar créditos');
                console.log('- POST /api/users/:userId/shipments - Crear un nuevo envío');
                console.log('- GET /api/users/:userId/shipments - Obtener envíos del usuario');
                console.log('- GET /api/shipments/:shipmentId - Obtener un envío específico');
                console.log('- DELETE /api/shipments/:shipmentId - Eliminar un envío');
                console.log('- POST /api/shipments/:shipmentId/products - Agregar producto a un envío');
                console.log('- GET /api/shipments/:shipmentId/products - Obtener productos de un envío');
                console.log('- PUT /api/products/:productId - Actualizar un producto');
                console.log('- DELETE /api/products/:productId - Eliminar un producto');
            });
            
        } catch (error) {
            console.error('Error al iniciar el servidor:', error);
            throw new Error(`${error}`);
        }
    }
}


const server = new Server(express(), Enviroments.PORT);
server.initServer();