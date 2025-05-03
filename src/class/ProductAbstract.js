
class ProductAbstract {
    #description
    #weight
    #packages
    #delivery_date

    constructor(
        description,
        weight,
        packages,
        delivery_date
    ){
        this.#description = description,
        this.#weight = weight,
        this.#packages = packages,
        this.#delivery_date = delivery_date
    }

    get product(){
        const product = {
            description: this.#description,
            weight: this.#weight,
            packages: this.#packages,
            delivery_date: this.#delivery_date
        }

        return product
    }
    
    get weight() {
        return this.#weight;
    }
}

module.exports = {
    ProductAbstract
}