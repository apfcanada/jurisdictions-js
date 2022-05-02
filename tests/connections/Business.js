import { DirectedConnection } from '../../src'

export class Business extends DirectedConnection{
	#type = 'Business'
	#data
	constructor(source,target,data){
		super(source,target)
		this.#data = data
	}
	get businessId(){
		return this.#data.uid
	}
	get id(){
		return `${this.#type}:${this.businessId}`
	}
}
