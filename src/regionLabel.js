// note that geo_id's are hardcoded

export function regionLabel(jurs){
	let countries = new Set(jurs.map(j=>j.country))
	if( countries.size == 1 ){
		let country = [...countries][0]
		if( country.geo_id == 3 ){ // PRC
			if( jurs.every( jur => isOrIn(jur,96) ) ){
				return 'Macau'
			}
			if( jurs.every( jur => isOrIn(jur,30) ) ){
				return 'Hong Kong'
			}
			return jurs.some( jur => isOrIn(jur,30) || isOrIn(jur,96) ) ? 
				'Greater China' : 'Mainland China';
		}else{ // one country, not PRC
			return country.name.en
		}
	}else{ // more than one country
		if(countries.size==2){
			let geo_ids = [...countries].map(c=>c.geo_id)
			if( geo_ids.includes(3) && geo_ids.includes(38) ){
				return 'Greater China'
			}
		}
		return 'International'
	}
}

// jur is or is descended from a geo_id
function isOrIn(jur,geo_id){
	return [jur.geo_id,...jur.ancestors.map(a=>a.geo_id)].includes(geo_id)
}
