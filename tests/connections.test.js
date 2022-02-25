import { 
	JurisdictionGraph,
	Connection,
	DirectedConnection,
	ConnectionAggregator
} from '../src/'
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

test('Can create a connection aggregator',() => {
	const graph = new JurisdictionGraph(staticData);
	const [toronto,beijing,ottawa,shanghai] = graph.lookupNow([10,111,21,240])
	const [canada,china] = graph.lookupNow([2,3])
	const conns = [
		new Connection(toronto,beijing),
		new DirectedConnection(toronto,shanghai),
		new Connection(ottawa,beijing),
		new DirectedConnection(ottawa,shanghai),
	]
	expect(()=>new ConnectionAggregator(conns)).not.toThrow()
	expect(()=>new ConnectionAggregator([...conns,/regex!/])).toThrow()
} )

test('Can aggregate to countries',() => {
	const graph = new JurisdictionGraph(staticData);
	const [toronto,beijing,ottawa,shanghai] = graph.lookupNow([10,111,21,240])
	const [canada,china] = graph.lookupNow([2,3])
	const conns = [
		new Connection(toronto,beijing),
		new DirectedConnection(toronto,shanghai),
		new Connection(ottawa,beijing),
		new DirectedConnection(ottawa,shanghai),
	]
	const aggregator = new ConnectionAggregator(conns)
	expect(aggregator.top.length).toBe(2)	
	expect(aggregator.top).toContain(china)
	expect(aggregator.top).toContain(canada)
} )

test('Can aggregate with focus',() => {
	const graph = new JurisdictionGraph(staticData);
	const [toronto,beijing,ottawa,shanghai] = graph.lookupNow([10,111,21,240])
	const [canada,china] = graph.lookupNow([2,3])
	const conns = [
		new Connection(toronto,beijing),
		new DirectedConnection(toronto,shanghai),
		new Connection(ottawa,beijing),
		new DirectedConnection(ottawa,shanghai),
	]
	const aggregator = new ConnectionAggregator(conns)
	aggregator.focus(toronto)
	expect(aggregator.top.length).toBe(2)	
	expect(aggregator.top).toContain(china)
	// TODO why is this timing out instead of failing?
	// expect(aggregator.top).toContain(toronto)
} )
