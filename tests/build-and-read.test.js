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

test('Find Toronto asynchronously',() => {
	const graph = new JurisdictionGraph(staticData);
	return graph.lookup(10).then( jur => {
		expect(jur instanceof Jurisdiction).toBe(true)
		expect(jur.name.en).toBe('Toronto')
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

test('Count missions from Quebec',() => {
	const graph = new JurisdictionGraph(staticData);
	expect(graph.lookupNow(18).sendsMissions.length).toBe(0)
	graph.addDiplomaticMissions(dipMissions)
	return graph.lookup('18').then( jur => {
		expect(jur instanceof Jurisdiction).toBe(true)
		expect(jur.hasDiplomacy).toBe(true)
		expect(jur.sendsMissions.length).toBe(9)
	} )
} )

test('Count trade agreements with Hong Kong',() => {
	const graph = new JurisdictionGraph(staticData);
	graph.addTradeAgreements(tradeAgreements)
	let HK = graph.lookupNow(30)
	expect(HK.tradeAgreements.length).toBe(2)
	expect(HK.directTradeAgreements.length).toBe(1)
} )
