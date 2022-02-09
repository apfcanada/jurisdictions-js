import { geometry as geoAPI, topoGeometry } from './API'

export async function assignBoundaries(jurisdictions){
	// just the ones that havn't been fetched yet
	const toFetch = jurisdictions.filter( j => j.queryStatus.boundary == 0 )
	if( toFetch.length == 0 ){
		// necessary because some requests may still be in flight
		return Promise.all( jurisdictions.map(j=>j.withGeom('boundary')) )
	}
//	json(`${topoGeometry}?geo_ids=${toFetch.map(j=>j.geo_id).join(',')}&level=1`)
	const prom = fetch(`${geoAPI}?geo_ids=${toFetch.map(j=>j.geo_id).join(',')}`)
		.then( response => response.json() );
	toFetch.map( jur => {
		jur._boundaryPromise = prom.then( response => {
			const data = response.find( result => jur.geo_id == result.geo_id )
			data && jur.setGeometry(data.geometry)
			return jur
		})
		jur.queryStatus.boundary = 1 // in progress
	} )
	await prom
	return jurisdictions
}
