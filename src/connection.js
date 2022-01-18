import { Jurisdiction } from './jurisdiction.js'

// this is a highly abstract class for undirected connections between two or 
// more jurisdictions
export class Connection {
	constructor(...jurs){
		// validate inputs
		if( jurs.length < 2 ){
			return console.warn('one jurisdiction does not a connection make')
		}else if( jurs.some( j => ! j instanceof Jurisdiction) ){
			return console.warn('connection must be between jurisdictions')
		}else if( jurs.length != (new Set(jurs)).size ){
			return console.warn('connections cannot be reflexive')
		}
		this._jurs = jurs
	}
	get id(){ // unique to this set of jurisdictions
		return this._jurs.map(j=>j.geo_id).sort((a,b)=>b-a).join('|')
	}
}

// for directed connections between two jurisdictions
export class DirectedConnection extends Connection{
	constructor(source,target){
		super(source,target)
		this._from = source
		this._to = target
	}
	get from(){
		return this._from
	}
	get to(){
		return this._to
	}
}
