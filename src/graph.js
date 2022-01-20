import { graph as API } from './API.js'
import twinsData from './twinning-data.json'
import tradeAgreements from './canada-trade-agreements.json'
import dipMissions from './missions.json'
import { Mission } from './mission.js'
import { Jurisdiction } from './jurisdiction.js'
import { TradeAgreement } from './trade-agreement.js' 

export class JurisdictionGraph{
	constructor(data){
		this.lookup = this.lookup.bind(this)
		this.lookupNow = this.lookupNow.bind(this)
		this.phonebook = new Map();
		if(data){
			this.ready = new Promise( buildHierarchy(data,this.phonebook,this) )
		}else{
			this.ready = fetch(API).then(r=>r.json()).then( data => {
				buildHierarchy(data,this.phonebook,this)
			} )
		}
	}
	// id can/should be either a wikidataID (string) or a geo_id (number)
	async lookup(id){
		await this.ready;
		return this.lookupNow(id);
	}
	lookupNow(id){
		if( id instanceof Jurisdiction ) return id;
		let fellowJur
		if( typeof id == 'number' && Number.isInteger(id) ){
			fellowJur = this.phonebook.get(id)
		}else if( typeof id == 'string' && /^\d+$/.test(id) ) {  
			fellowJur = this.phonebook.get(Number(id))
		}else if( typeof id == 'string' && /^Q\d+$/.test(id) ){
			fellowJur = this.phonebook.get(id)
		}else{
			throw new Error(`${id} (${typeof id}) is not an accepted jur ID`)
		}
		return fellowJur	
	}
	async selves(ids){
		await this.ready;
		return [...new Set(ids.map( id => this.lookupNow(id)))]
			.filter( jur => jur instanceof Jurisdiction )
	}
	async countries(){
		await this.ready;
		return earth.children
	}
	async terra(){
		await this.ready;
		return earth
	}
	async canada(){
		await this.ready;
		return this.lookupNow(2)
	}
	
}


// create false "jurisdiction"s for the earth and the asia pacific
export const asia = new Jurisdiction({
	geo_id: -1,
	wikidata: 'Q1070940',
	name: {en:'Asia Pacific'},
	type: {label:{en:'region'}}
})
export const earth = new Jurisdiction({
	geo_id: 0,
	name: { en: 'Earth' },
	wikidata:'Q2',
	type:'Planet'
})

function buildHierarchy(data,phonebook,graph){
	data.jurisdictions.map( jurdata => {
		let Jur = new Jurisdiction({
			geo_id: jurdata.g, 
			wikidata: `Q${jurdata.q}`,
			osm_id: jurdata.o,
			parent: jurdata?.p,
			name: { en: jurdata.n },
			type: data.types.find(type=>jurdata.t==type.uid).label,
			capital: jurdata?.c,
			bizCount: jurdata?.bc,
			investments: jurdata?.i,
			x: jurdata?.x,
			y: jurdata?.y
		})
		phonebook.set(Jur.geo_id,Jur) 
		phonebook.set(Jur.wikidata,Jur)
		return Jur
	} ).map( Jur => {
		Jur.findRelations(graph.lookupNow)
		if(!Jur.parent){ 
			earth.acceptChild(Jur) 
			if(!Jur.canadian) asia.acceptChild(Jur)
		}
	} )
	twinsData.map( pair => {
		try{
			let A = graph.lookupNow(pair.a)
			let B = graph.lookupNow(pair.b)
			A.twinWith(B)
		}catch(err){
			console.warn('failed to find one or more of these twins:',pair)
		}
	} )
	let canada = graph.lookupNow(2)
	tradeAgreements.map( agreement => {
		let { signatories, ...data } = agreement 
		let jurs = signatories.split(',').map(qid=>graph.lookupNow(qid)).filter(j=>j)
		if(jurs.length < 2) return;
		let theAgreement = new TradeAgreement(data,...jurs)
		jurs.map( jur => jur.signTradeAgreement(theAgreement) )
	} )
	dipMissions.map( missionData => {
		let operator = graph.lookupNow(missionData.operatorID)
		let destination = graph.lookupNow(missionData.destID)
		if(! operator || ! destination ){
			return console.warn( `Mission ${missionData.missionID} missing at least one of these jurisdictions`,
				missionData.operatorID, missionData.destID )
		}
		let mission = new Mission({operator,destination,missionData})
		operator.sendMission(mission)
		destination.receiveMission(mission)
	} )
	return phonebook
}
