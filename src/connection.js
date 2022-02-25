import { Jurisdiction } from './jurisdiction.js'

// this is a highly abstract class for undirected connections between two or 
// more jurisdictions
export class Connection {
	#jurs // array
	constructor(...jurs){
		// validate inputs
		if( jurs.length < 2 ){
			throw 'one jurisdiction does not a connection make'
		}else if( jurs.some( j => ! ( j instanceof Jurisdiction ) ) ){
			throw 'connection must be between jurisdictions'
		}else if( jurs.length != (new Set(jurs)).size ){
			throw 'connections cannot be reflexive'
		}
		this.#jurs = jurs
	}
	get id(){ // unique to this set of jurisdictions
		return this.#jurs.map(j=>j.geo_id).sort((a,b)=>b-a).join('|')
	}
	get allJurs(){
		return this.#jurs
	}
}

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

export class ConnectionAggregator{
	#connections
	#focused = new Set();
	constructor(connections){
		if( connections.some( conn => ! ( conn instanceof Connection ) ) ){
			throw 'this is not a connection'
		}
		this.#connections = connections
	}
	// focusing on a jurisdiction prevents aggregation to any higher level
	// connections above the focus will be ignored
	focus(jur){
		if(!(jur instanceof Jurisdiction)){
			throw 'Can only focus on a jurisdiction';
		}
		this.#focused.add(jur)
	}
	unfocus(jur){ 
		this.#focused.delete(jur)
	}
	get top(){
		const allConnected = [...new Set(
			this.#connections.map(conn=>conn.allJurs).flat()
		)]
		return [...new Set(allConnected.map(jur=>jur.country))]
	}
}
