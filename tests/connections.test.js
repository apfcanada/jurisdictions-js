import { JurisdictionGraph, Connection, DirectedConnection } from '../src/'
import { Business } from './connections/Business'
import staticData from './staticGraphData.json'

test('Can create and validate general connections',() => {
	const graph = new JurisdictionGraph(staticData);
	const [toronto,beijing,ottawa,shanghai] = graph.lookupNow([10,111,21,240])
	// valid
	expect(()=>new Connection(toronto,beijing,ottawa,shanghai)).not.toThrow()
	// invalid
	expect(()=>new Connection(toronto,toronto,shanghai)).toThrow()
	expect(()=>new Connection(beijing)).toThrow()
} )

test('Can create and validate directed connections',() => {
	const graph = new JurisdictionGraph(staticData);
	const [toronto,beijing,ottawa,shanghai] = graph.lookupNow([10,111,21,240])
	// valid
	expect(()=>new DirectedConnection(toronto,beijing)).not.toThrow()
	expect(()=>new DirectedConnection(ottawa,shanghai)).not.toThrow()
	// invalid
	expect(()=>new DirectedConnection(toronto,toronto)).toThrow()
	expect(()=>new DirectedConnection(toronto,undefined)).toThrow()
	expect(()=>new DirectedConnection(toronto)).toThrow()
} )

test('Creates and reads Business connections',() => {
	const graph = new JurisdictionGraph(staticData);
	const [toronto,beijing,ottawa] = graph.lookupNow([10,111,21])
	let biz = new Business(toronto,beijing,{uid:1}).notify()
	expect(toronto.hasConnections(/Business/)).toBe(true)
	expect(ottawa.hasConnections(/Business/)).toBe(false)
	expect(toronto.connections(/Business/).length).toBe(1)
	expect(beijing.connections(/Business/).length).toBe(1)
	expect(ottawa.connections(/Business/).length).toBe(0)
} )
