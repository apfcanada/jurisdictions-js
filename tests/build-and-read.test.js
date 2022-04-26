import { JurisdictionGraph, Jurisdiction } from '../src/'
import staticData from './staticGraphData.json'
import { Twinning } from './connections/twinning.js'
import twinsData from './twinning-data.json'
function addTwins(graph){
	twinsData.map( pair => {
		let [A,B] = graph.lookupNow([pair.a,pair.b])
		new Twinning(A,B).notify()
	} )
}
import { Mission } from './connections/mission.js'
import dipMissions from './missions.json'
function addMissions(graph){
	dipMissions.map( missionData => {
		let operator = graph.lookupNow(missionData.operatorID)
		let destination = graph.lookupNow(missionData.destID)
		if(! operator || ! destination ){
			return console.warn( `Mission ${missionData.missionID} missing at least one of these jurisdictions`,
				missionData.operatorID, missionData.destID )
		}
		new Mission({operator,destination,missionData}).notify()
	} )
}
import { TradeAgreement } from './connections/trade-agreement.js'
import tradeAgreements from './canada-trade-agreements.json'
function addAgreements(graph){
	tradeAgreements.map( agreement => {
		let { signatories, ...data } = agreement 
		let jurs = signatories.split(',').map(graph.lookupNow).filter(j=>j)
		new TradeAgreement(data,...jurs).notify()
	} )
}

test('Build full graph without errors',() => {
	const graph = new JurisdictionGraph(staticData);
} )

test('Find Canada synchronously',() => {
	const graph = new JurisdictionGraph(staticData);
	const jur = graph.lookupNow(2)
	expect(jur instanceof Jurisdiction).toBe(true)
	expect(jur.name.en).toBe('Canada')
} )

test('Differentiate Canada from Asia',() => {
	const graph = new JurisdictionGraph(staticData);
	const Canada = graph.lookupNow(2)
	expect(Canada.canadian).toBe(true)
	const HK = graph.lookupNow(30)
	expect(HK.canadian).toBe(false)
} )

test('Find Toronto asynchronously',() => {
	const graph = new JurisdictionGraph(staticData);
	return graph.lookup(10).then( jur => {
		expect(jur instanceof Jurisdiction).toBe(true)
		expect(jur.name.en).toBe('Toronto')
	} )
} )

test('Find multiple jurisdictions',() => {
	const graph = new JurisdictionGraph(staticData);
	return graph.lookup([10,12,22,99999999]).then( jurs => {
		expect(jurs instanceof Array).toBe(true)
		expect(jurs[0].name.en).toBe('Toronto')
		expect(jurs[2].name.en).toBe('Alberta')
		expect(jurs[3]).toBeUndefined() // does not exist
	} )
} )

test('Count twins in Hokkaido',() => {
	const graph = new JurisdictionGraph(staticData);
	graph.addCallback('twins',addTwins)
	return graph.readyWith('twins').then( graph => {
		let hokkaido = graph.lookupNow('Q1037393')
		expect(hokkaido.connections(/Twinning/,{descendants:true}).length).toBe(27)
	} )
} )

test('Find capitals',() => {
	const graph = new JurisdictionGraph(staticData);
	return graph.lookup([2,9]).then( ([canada,ontario]) => {
		expect(canada.capital.name.en).toBe('Ottawa')
		expect(ontario.capital.name.en).toBe('Toronto')
	} )
} )

test('Can use wildcard callback',() => {
	const graph = new JurisdictionGraph(staticData);
	graph.addCallback('missions',addMissions)
	return graph.readyWith(/.*/).then( graph => {
		const quebec = graph.lookupNow('18')
		expect(quebec.hasConnections(/Mission/)).toBe(true)
	} )
} )

test('Count missions from/to Quebec',() => {
	const graph = new JurisdictionGraph(staticData);
	const quebec = graph.lookupNow(18)
	expect(quebec.connections(/Mission/).length).toBe(0)
	graph.addCallback('missions',addMissions)
	return graph.readyWith('missions').then( graph => {
		const quebec = graph.lookupNow('18')
		expect(quebec.hasConnections(/Mission/)).toBe(true)
		let missionsSent = quebec.connections(/Mission/)
			.filter( mission => mission.from == quebec )
		expect(missionsSent.length).toBe(9)
		let missionsHosted = quebec.connections(/Mission/,{descendants:true})
			.filter( mission => mission.to.canadian )
		expect(missionsHosted.length).toBe(1)
	} )
} )

test('Count trade agreements with Hong Kong',() => {
	const graph = new JurisdictionGraph(staticData);
	graph.addCallback('trade',addAgreements)
	return graph.readyWith('trade').then(graph => {
		let HK = graph.lookupNow(30)
		expect(HK.connections(/TradeAgreement/,{ancestors:true}).length).toBe(2)
		expect(HK.connections(/TradeAgreement/).length).toBe(1)
	} )
} )

test('Find all countries',()=>{
	const graph = new JurisdictionGraph(staticData);
	return graph.countries().then( countries => {
		expect(countries.length).toBe(27)
		const Canada = graph.lookupNow(2)
		const China = graph.lookupNow(3)
		const Toronto = graph.lookup(10)
		expect(countries).not.toContain(Toronto)
		expect(countries).toContain(China)
		expect(countries).toContain(Canada)
	} )
})

test('Find Asian countries',()=>{
	const graph = new JurisdictionGraph(staticData);
	return graph.asianCountries().then( countries => {
		expect(countries.length).toBe(26)
		const Canada = graph.lookupNow(2)
		const China = graph.lookupNow(3)
		expect(countries).toContain(China)
		expect(countries).not.toContain(Canada)
	} )
})

test('Find siblings',() => {
	const graph = new JurisdictionGraph(staticData);
	return graph.lookup([2,3,10,9]).then( ([canada,china,toronto,ontario]) => {
		expect(canada.siblings).toContain(china)
		expect(china.siblings).toContain(canada)
		expect(canada.siblings).not.toContain(canada)
		expect(toronto.siblings.length).toBe(ontario.children.length-1)
	} )
})

test('IDs are read-only',() => {
	const graph = new JurisdictionGraph(staticData);
	return graph.lookup(2).then( canada => {
		expect(()=>canada.geo_id+=1).toThrow(TypeError)
		expect(()=>canada.wikidata='Q1').toThrow(TypeError)
		expect(()=>canada.osm_id='r1').toThrow(TypeError)
	} )
})

test('Knows of jurisdiction Types',()=>{
	const graph = new JurisdictionGraph(staticData);
	expect(graph.jurisdictionTypes.length).toBe(41)
})
