import { graph as API } from './API.js'
import { Mission } from './mission.js'
import { Jurisdiction } from './jurisdiction.js'
import { TradeAgreement } from './trade-agreement.js' 

export class JurisdictionGraph{
	constructor(data){
		this.lookup = this.lookup.bind(this)
		this.lookupNow = this.lookupNow.bind(this)
		this.phonebook = new Map();
		if(data){
			this.ready = Promise.resolve(buildHierarchy(data,this.phonebook,this) )
		}else{
			this.ready = fetch(API).then(r=>r.json()).then( data => {
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
	addDiplomaticMissions(missionsData){
		this.ready.then( blah => {
			missionsData.map( missionData => {
				let operator = this.lookupNow(missionData.operatorID)
				let destination = this.lookupNow(missionData.destID)
				if(! operator || ! destination ){
					return console.warn( `Mission ${missionData.missionID} missing at least one of these jurisdictions`,
						missionData.operatorID, missionData.destID )
				}
				let mission = new Mission({operator,destination,missionData})
				operator.sendMission(mission)
				destination.receiveMission(mission)
			} )
		} )
	}
	addTwins(twinsData){
		this.ready.then( blah => {
			twinsData.map( pair => {
				try{
					let A = this.lookupNow(pair.a)
					let B = this.lookupNow(pair.b)
					A.twinWith(B)
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
				let jurs = signatories.split(',').map(qid=>this.lookupNow(qid)).filter(j=>j)
				if(jurs.length < 2) return;
				let theAgreement = new TradeAgreement(data,...jurs)
				jurs.map( jur => jur.signTradeAgreement(theAgreement) )
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
			parent_geo_id: jurdata?.p,
			name: { en: jurdata.n },
			type: data.types.find(type=>jurdata.t==type.uid).label,
			capital: jurdata?.c,
			bizCount: jurdata?.bc,
			investments: jurdata?.i,
			x: jurdata?.x,
			y: jurdata?.y
		})
	} ).map( jur => jur.findRelations(graph.lookupNow) )
	return phonebook
}
