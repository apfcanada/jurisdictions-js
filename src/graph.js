import { graph as API } from './API.js'
import { Mission } from './mission.js'
import { Jurisdiction } from './jurisdiction.js'
import { TradeAgreement } from './trade-agreement.js' 
import { Twinning } from './twinning.js'

export class JurisdictionGraph{
	#jurisdictionTypes
	constructor(data){
		this.lookup = this.lookup.bind(this)
		this.lookupNow = this.lookupNow.bind(this)
		this.phonebook = new Map();
		if(data){
			this.#jurisdictionTypes = data.types ?? []
			this.ready = Promise.resolve(buildHierarchy(data,this.phonebook,this) )
		}else{
			this.ready = fetch(API).then(r=>r.json()).then( data => {
				this.#jurisdictionTypes = data.types ?? []
				buildHierarchy(data,this.phonebook,this)
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
		if(input instanceof Array){
			return input.map( val => this.lookupNow(val) )
				.filter( val => val instanceof Jurisdiction)
		}
		if( input instanceof Jurisdiction ) return input;
		if( typeof input == 'number' && Number.isInteger(input) ){
			return this.phonebook.get(input)
		}else if( typeof input == 'string'){
			if(/^\d+$/.test(input) ) {  
				return this.phonebook.get(Number(input))
			}else if( /^Q\d+$/.test(input) ){
				return this.phonebook.get(input)
			}
		}else{
			throw new Error(`${input} (${typeof input}) is not an accepted jur ID`)
		}
	}
	know(jur){
		if(this.phonebook.has(jur.geo_id)) return; // already known; skip
		this.phonebook.set(jur.geo_id,jur)
		this.phonebook.set(jur.wikidata,jur)
	}
	get allJurisdictionsNow(){
		return [ ...new Set([...this.phonebook.values()]) ];
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
	addDiplomaticMissions(missionsData){
		this.ready.then( blah => {
			missionsData.map( missionData => {
				let operator = this.lookupNow(missionData.operatorID)
				let destination = this.lookupNow(missionData.destID)
				if(! operator || ! destination ){
					return console.warn( `Mission ${missionData.missionID} missing at least one of these jurisdictions`,
						missionData.operatorID, missionData.destID )
				}
				new Mission({operator,destination,missionData}).notify()
			} )
		} )
	}
	addTwins(twinsData){
		this.ready.then( blah => {
			twinsData.map( pair => {
				try{
					let [A,B] = this.lookupNow([pair.a,pair.b])
					new Twinning(A,B).notify()
				}catch(err){
					console.warn('failed to find one or more of these twins:',pair)
				}
			} )
		} )
	}
	addTradeAgreements(tradeAgreementData){
		this.ready.then( blah => {
			tradeAgreementData.map( agreement => {
				let { signatories, ...data } = agreement 
				let jurs = signatories.split(',').map(this.lookupNow).filter(j=>j)
				if(jurs.length < 2) return;
				new TradeAgreement(data,...jurs).notify()
			} )
		} )
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
