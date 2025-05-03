
class ShipmentAbstract {

    #name
    #address
    #phone
    #ref
    #observation

    constructor(
        name,
        address,
        phone,
        ref,
        observation
    ){
        this.#name        = name,
        this.#address     = address,
        this.#phone       = phone,
        this.#ref         = ref,
        this.#observation = observation
    }


    get shipment(){

        const shipment = {
            name        : this.#name,
            address     : this.#address,
            phone       : this.#phone,
            ref         : this.#ref,
            observation :this.#observation
        }

        return shipment
    }
}

module.exports = {
    ShipmentAbstract
}