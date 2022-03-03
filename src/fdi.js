import { DirectedConnection } from './directedConnection.js'

export class FDI extends DirectedConnection{
	constructor(source,target){
		super(source,target)
	}
	get id(){
		return `FDI:${super.id}`
	}
}
