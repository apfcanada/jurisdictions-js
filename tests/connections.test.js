import { 
	JurisdictionGraph,
	DirectedConnection
} from '../src/'
import staticData from './staticGraphData.json'

test('Can make and validate connections',() => {
	const graph = new JurisdictionGraph(staticData);
	const [toronto,beijing] = graph.lookupNow([10,111])
	const [ottawa,shanghai] = graph.lookupNow([21,240])
	const connections = [
		new DirectedConnection(toronto,beijing),
		new DirectedConnection(ottawa,shanghai)
	]
	// these are invalid connections
	expect(()=>new DirectedConnection(toronto,toronto)).toThrow()
	expect(()=>new DirectedConnection(toronto,undefined)).toThrow()
} )
