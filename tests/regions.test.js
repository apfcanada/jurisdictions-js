import { JurisdictionGraph, regionLabel } from '../src/'
import staticData from './staticGraphData.json'

test('Check region labels',() => {
	const graph = new JurisdictionGraph(staticData);
	expect(regionLabel([])).toBeUndefined()
	expect(regionLabel(graph.lookupNow([2,3,4]))).toMatch(/international/i)
	expect(regionLabel(graph.lookupNow([30,38]))).toMatch(/greater china/i)
	expect(regionLabel(graph.lookupNow([96]))).toMatch(/macau/i)
	expect(regionLabel(graph.lookupNow([2,10,9]))).toMatch(/canada/i)
	expect(regionLabel(graph.lookupNow([96,10]))).toMatch(/international/i)
} )

