import { JurisdictionGraph, Jurisdiction } from '../src/'
import staticData from './staticGraphData.json'
import twinsData from './twinning-data.json'
import dipMissions from './missions.json'
import tradeAgreements from './canada-trade-agreements.json'

test('Build full graph withour errors',() => {
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
	graph.addTwins(twinsData)
	return graph.lookup('Q1037393').then( jur => {
		expect(jur instanceof Jurisdiction).toBe(true)
		expect(jur.twinsRecursive.length).toBe(27)
	} )
} )

test('Find capitals',() => {
	const graph = new JurisdictionGraph(staticData);
	return graph.lookup([2,9]).then( ([canada,ontario]) => {
		expect(canada.capital.name.en).toBe('Ottawa')
		expect(ontario.capital.name.en).toBe('Toronto')
	} )
} )

test('Count missions from/to Quebec',() => {
	const graph = new JurisdictionGraph(staticData);
	expect(graph.lookupNow(18).sendsMissions.length).toBe(0)
	graph.addDiplomaticMissions(dipMissions)
	return graph.lookup('18').then( quebec => {
		expect(quebec.hasDiplomacy).toBe(true)
		expect(quebec.sendsMissions.length).toBe(9)
		expect(quebec.receivesMissions.length).toBe(1)
	} )
} )

test('Count trade agreements with Hong Kong',() => {
	const graph = new JurisdictionGraph(staticData);
	graph.addTradeAgreements(tradeAgreements)
	return graph.lookup(30).then( HK => {
		expect(HK.tradeAgreements.length).toBe(2)
		expect(HK.directTradeAgreements.length).toBe(1)
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
