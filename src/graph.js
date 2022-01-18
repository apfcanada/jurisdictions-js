import { graph as graphAPI, investment as investmentAPI } from './API.js'
import { json } from 'd3-fetch'
import twinsData from './twinning-data.json'
import tradeAgreements from './canada-trade-agreements.json'
import dipMissions from './missions.json'
import { Mission } from './mission.js'
import { Jurisdiction } from './jurisdiction.js'
import { TradeAgreement } from './trade-agreement.js' 

const phonebook = new Map(); // for lookups by geo_id / wikidata ID

// create false "jurisdiction"s for the earth and the asia pacific
const earth = new Jurisdiction({
	geo_id: 0,
	name: { en: 'Earth' },
	wikidata:'Q2',
	type:'Planet',
	phonebook
})
phonebook.set('Q2',earth)
export const asia = new Jurisdiction({
	geo_id: 0,
	wikidata: 'Q1070940',
	name: {en:'Asia Pacific'},
	type: {label:{en:'region'}},
	phonebook
})

const jurtree = json(graphAPI).then(buildHierarchy)

function buildHierarchy(data){
	data.jurisdictions.map( jurdata => {
		let Jur = new Jurisdiction({
			geo_id: jurdata.g, 
			wikidata: `Q${jurdata.q}`,
			parent: jurdata?.p,
			name: { en: jurdata.n },
			type: data.types.find(type=>jurdata.t==type.uid).label,
			capital: jurdata?.c,
			bizCount: jurdata?.bc,
			investments: jurdata?.i,
			x: jurdata?.x,
			y: jurdata?.y,
			phonebook
		})
		// create a dict for quick lookups by geo_id and wikidata
		phonebook.set(Jur.geo_id,Jur) 
		phonebook.set(Jur.wikidata,Jur)
		return Jur
	} ).map( Jur => {
		Jur.findRelations()
		if(!Jur.parent){ 
			earth.acceptChild(Jur) 
			if(!Jur.canadian) asia.acceptChild(Jur)
		}
	} )
	twinsData.map( pair => {
		try{
			let A = earth.lookup(pair.a)
			let B = earth.lookup(pair.b)
			A.twinWith(B)
		}catch(err){
			console.warn('failed to find one or more of these twins:',pair)
		}
	} )
	let canada = earth.lookup(2)
	tradeAgreements.map( agreement => {
		let { signatories, ...data } = agreement 
		let jurs = signatories.split(',').map(qid=>earth.lookup(qid)).filter(j=>j)
		if(jurs.length < 2) return;
		let theAgreement = new TradeAgreement(data,...jurs)
		jurs.map( jur => jur.signTradeAgreement(theAgreement) )
	} )
	dipMissions.map( missionData => {
		let operator = earth.lookup(missionData.operatorID)
		let destination = earth.lookup(missionData.destID)
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

export async function self(id){
	return jurtree.then( phonebook => earth.lookup(id) )
}

export async function selves(ids){
	return jurtree.then( phonebook => {
		return [...new Set(ids.map( id => earth.lookup(id)))].filter(j=>j)
	} )
}

export async function context(id){
	// if no parent then Earth is the parent
	return self(id)
		.then( jur => jur?.parent ? jur.parent.children : earth.children )
}

export async function countries(){
	return jurtree.then( phonebook => earth.children )
}

export async function terra(){
	return jurtree.then( phonebook => earth )
}

export async function canada(){
	return self(2)
}
