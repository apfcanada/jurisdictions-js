import { Connection } from '../../src'

export class Twinning extends Connection {
	constructor(A,B){
		super(A,B)
	}
	get id(){
		return `${this.constructor.name}:${super.id}`
	}
	partnerOf(refJur){
		return this.jurisdictions.find( jur => jur != refJur )
	}
}
