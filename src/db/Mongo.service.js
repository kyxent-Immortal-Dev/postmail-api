const { Enviroments } = require("../plugins/Enviroments");
const {connect} = require("mongoose")


class MongoService {

    #url = Enviroments.MONGO

    constructor(
        url = Enviroments.MONGO

    ){
        this.url = url
    }

    async initService(){
        try {
            
            await connect(this.#url)
            console.log("connect to mongo successfully");
            

        } catch (error) {
            throw new Error(`${error}`)
        }
    }
}


module.exports = {
    MongoService
}