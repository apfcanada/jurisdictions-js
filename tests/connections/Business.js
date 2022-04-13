import { DirectedConnection } from '../../src'

export class Business extends DirectedConnection{
	#data
	constructor(source,target,data){
		super(source,target)
		this.#data = data
	}
	get businessId(){
		return this.#data.uid
	}
	get id(){
		return `${this.constructor.name}:${this.businessId}`
	}
}
