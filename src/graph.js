import { graph as API } from './API.js'
import { Jurisdiction } from './jurisdiction.js'

export class JurisdictionGraph{
	#jurisdictionTypes
	#phonebook = new Map()
	constructor(data){
		this.lookup = this.lookup.bind(this)
		this.lookupNow = this.lookupNow.bind(this)
		if(data){
			this.#jurisdictionTypes = data.types ?? []
			this.ready = Promise.resolve(buildHierarchy(data,this.#phonebook,this) )
		}else{
			this.ready = fetch(API).then(r=>r.json()).then( data => {
				this.#jurisdictionTypes = data.types ?? []
				buildHierarchy(data,this.#phonebook,this)
			} )
		}
		return this
	}
	// id can/should be either a wikidataID (string) or a geo_id (number)
	// or an array of such
	async lookup(input){
		await this.ready;
		return this.lookupNow(input);
	}
	lookupNow(input){
		if(input instanceof Array){ return input.map( this.lookupNow ) }
		if( input instanceof Jurisdiction ) return input;
		if( typeof input == 'number' && Number.isInteger(input) ){
			return this.#phonebook.get(input)
		}else if( typeof input == 'string'){
			if(/^\d+$/.test(input) ) {  
				return this.#phonebook.get(Number(input))
			}else if( /^Q\d+$/.test(input) ){
				return this.#phonebook.get(input)
			}
		}else{
			throw new Error(`${input} (${typeof input}) is not an accepted jur ID`)
		}
	}
	know(jur){
		if(this.#phonebook.has(jur.geo_id)) return; // already known; skip
		this.#phonebook.set(jur.geo_id,jur)
		this.#phonebook.set(jur.wikidata,jur)
	}
	get allJurisdictionsNow(){
		return [ ...new Set([...this.#phonebook.values()]) ];
	}
	async allJurisdictions(){
		await this.ready;
		return this.allJurisdictionsNow
	}
	get countriesNow(){
		return this.allJurisdictionsNow.filter(j=>!j.parent)
	}
	async countries(){ // all parentless jurisdictions
		await this.ready;
		return this.countriesNow
	}
	async asianCountries(){
		return this.countries().then(countries=>countries.filter(j=>j.geo_id!=2))
	}
	async canada(){
		await this.ready;
		return this.lookupNow(2)
	}
	get jurisdictionTypes(){
		return this.#jurisdictionTypes
	}
}

function buildHierarchy(data,phonebook,graph){
	data.jurisdictions.map( jurdata => {
		return new Jurisdiction({
			graph,
			geo_id: jurdata.g, 
			wikidata: `Q${jurdata.q}`,
			osm_id: jurdata.o,
			parent_id: jurdata?.p,
			capital_id: jurdata?.c,
			names: { en: jurdata.n },
			type: data.types.find(type=>jurdata.t==type.uid).label,
			x: jurdata?.x,
			y: jurdata?.y
		})
	} ).map( jur => jur.findRelations(graph.lookupNow) )
	return phonebook
}
