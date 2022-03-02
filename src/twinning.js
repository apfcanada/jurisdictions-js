import { Connection } from './connection.js'

export class Twinning extends Connection {
	constructor(A,B){
		super(A,B)
	}
	get id(){
		return `twinning:${super.id}`
	}
	partnerOf(refJur){
		this.jurisdictions.find( jur => jur != refJur )
	}
}
