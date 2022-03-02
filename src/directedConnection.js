import { Connection } from './connection.js'

// for directed connections between two jurisdictions
export class DirectedConnection extends Connection{
	#to
	#from
	constructor(source,target){
		super(source,target)
		this.#from = source
		this.#to = target
	}
	get from(){
		return this.#from
	}
	get to(){
		return this.#to
	}
}
