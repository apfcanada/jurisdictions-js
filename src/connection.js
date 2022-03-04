// this is a highly abstract class for undirected connections between two or 
// more jurisdictions
export class Connection {
	#jurs // array
	constructor(...jurs){
		// validate inputs
		if( jurs.length < 2 ){
			throw 'It takes two to tango'
		}else if( jurs.some( j => !( j?.geo_id && j?.wikidata ) ) ){ // duck typing
			throw 'Connection must be between jurisdictions'
		}else if( jurs.length != (new Set(jurs)).size ){
			throw 'Connections cannot be reflexive'
		}
		this.#jurs = jurs
	}
	get id(){ // unique to this set of jurisdictions
		return this.#jurs.map(j=>j.geo_id).sort((a,b)=>b-a).join('|')
	}
	notify(){
		this.#jurs.forEach( jur => jur.notifyOfConnection(this) )
	}
	get jurisdictions(){
		return this.#jurs
	}
}
