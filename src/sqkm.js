import { geoArea } from 'd3-geo'

const earthRadius = 6371 // km

// area of geoJSON geom in square kilometers
export function sqkm(geometry){
	if( /Polygon/.test(geometry.type) ){
		return (Math.sqrt(geoArea(geometry))*earthRadius)**2
	}
	return 0 
}
