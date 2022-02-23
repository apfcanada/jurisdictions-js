import { topoGeometry } from './API'
import { feature as features } from 'topojson-client'


export async function assignBoundaries(jurisdictions){
	// just the ones that havn't been fetched yet
	const toFetch = jurisdictions.filter( j => j.queryStatus.boundary == 0 )
	if( toFetch.length == 0 ){
		// necessary because some requests may still be in flight
		return Promise.all( jurisdictions.map(j=>j.withGeom('boundary')) )
	}
	const idStr = toFetch.map(j=>j.geo_id).join(',')
	// least simplified only, for now
	const prom = fetch(`${topoGeometry}?geo_ids=${idStr}&level=3`)
		.then( response => response.json() )
		.then( topojson => features(topojson,'jurs') );
	// each jur waits for the collective geom call to resolve, then handles it
	toFetch.map( jur => handleResponse(jur,prom) )
	await prom
	return jurisdictions
}

function handleResponse(jur,promise){
	jur._boundaryPromise = promise.then( response => {
		const data = response.find( result => jur.geo_id == result.properties.geo_id )
		data && jur.setGeometry(data.geometry)
		return jur
	})
	jur.queryStatus.boundary = 1 // in progress
}
