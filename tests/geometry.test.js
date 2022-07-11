import { JurisdictionGraph } from '../src/'
import staticData from './staticGraphData.json'

test('Comes ready with valid GeoJSON point geom',() => {
	const graph = new JurisdictionGraph(staticData);
	const toronto = graph.lookupNow(10)
	expect(toronto.geom.point).toBeDefined()
	expect(toronto.geom.point.type).toBe('Point')
	expect(toronto.geom.point.coordinates.length).toBe(2)
	expect(toronto.latlon).toBe(toronto.geom.point.coordinates)
	// boundary falls back to point
	expect(toronto.boundary).toBe(toronto.geom.point)
} )

test('Does not come with boundary ready, defaults to Point',() => {
	const graph = new JurisdictionGraph(staticData);
	const toronto = graph.lookupNow(10)
	expect(toronto.geom.point).toBeDefined()
} )
