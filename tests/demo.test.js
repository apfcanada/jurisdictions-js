import { JurisdictionGraph, Jurisdiction } from '../src/'
import data from './graphData.json'


test('Build full graph withour errors',() => {
	const graph = new JurisdictionGraph(data);
} )

test('Find Canada synchronously',() => {
	const graph = new JurisdictionGraph(data);
	const jur = graph.lookupNow(2)
	expect(jur instanceof Jurisdiction).toBe(true)
	expect(jur.name.en).toBe('Canada')
} )

test('Find Toronto asynchronously',() => {
	const graph = new JurisdictionGraph(data);
	return graph.lookup(10).then( jur => {
		expect(jur instanceof Jurisdiction).toBe(true)
		expect(jur.name.en).toBe('Toronto')
	} )
} )

test('Count twins in Hokkaido',() => {
	const graph = new JurisdictionGraph(data);
	return graph.lookup('Q1037393').then( jur => {
		expect(jur instanceof Jurisdiction).toBe(true)
		expect(jur.twinsRecursive.length).toBe(27)
	} )
} )
