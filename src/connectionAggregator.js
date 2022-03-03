import { Connection } from './connection.js'
import { Jurisdiction } from './jurisdiction.js'

export class ConnectionAggregator{
	#connections
	#focused = new Map();
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
		throwifNotJur(jur)
		// only two jurisdictions can be focused: one in canada, one in asia
		this.#focused.set(jur.canadian?'canada':'asia',jur)
	}
	unfocus(jur){
		throwIfNotJur(jur)
		this.#focused.delete(jur.canadian?'canada':'asia')
	}
	get connections(){
		const canadianFocus = this.#focused.has('canada') ?
			this.#focused.get('canada') : this.leaves.find(j=>j.canadian).country
		const connections = new Map();
		this.#connections.map( conn => {
			conn.jurisdictions.filter(j=>canadianFocus.contains(j)).map( canJur => {
				// TODO
			} )
		return [...connections.values()]
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

function throwIfNotJur(jur){
	if(!(jur instanceof Jurisdiction)){
		throw 'Can only focus on a jurisdiction'
	}
}
