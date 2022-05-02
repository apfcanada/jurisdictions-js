import { Connection } from '../../src'

export class Twinning extends Connection {
	#type = 'Twinning'
	constructor(A,B){
		super(A,B)
	}
	get id(){
		return `${this.#type}:${super.id}`
	}
	partnerOf(refJur){
		return this.jurisdictions.find( jur => jur != refJur )
	}
}
