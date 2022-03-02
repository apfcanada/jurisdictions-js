import { Connection } from './connection.js'
import { Jurisdiction } from './jurisdiction.js'

export class ConnectionAggregator{
	#connections
	#focused = new Map();
	#expanded = new Set();
	constructor(connections){
		if( connections.some( conn => ! ( conn instanceof Connection ) ) ){
			throw 'this is not a connection'
		}else if(connections.length==0){
			throw 'no connections supplied'
		}
		this.#connections = connections
	}
	// focusing on a jurisdiction prevents aggregation to any higher level
	// connections above the focus will be ignored
	focus(jur){
		if(!isJur(jur)) throw 'Can only focus on a jurisdiction';
		this.#focused.set(jur.country,jur)
	}
	unfocus(jur){
		if(!isJur(jur)) throw 'Can only focus on a jurisdiction';
		this.#focused.delete(jur.country)
	}
	get top(){
		return [...new Set(this.leaves.map(jur=>jur.country))].map( country => {
			return this.#focused.has(country) ? this.#focused.get(country) : country
		} )
	}
	get leaves(){
		return [ ...new Set( this.#connections.map(conn=>conn.jurisdictions).flat() ) ]
	}
}


class AggregateConnection{
	#connections
	constructor(connections){
		this.#connections = connections
	}
	get count(){
		return this.#connections.length
	}
	totalValue(valueFunction){
		return this.#connections
			.reduce( (cumsum,connection) => cumsum + valueFunction(connection), 0 )
	}
}

function isJur(jur){
	return jur instanceof Jurisdiction
}
