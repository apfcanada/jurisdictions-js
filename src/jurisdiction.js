import { geometry as geoAPI } from './API.js'
import { Node } from './node.js'
import { Mission } from './mission.js'

export class Jurisdiction {
	#ids = { relations: {} }
	#names = { } // keyed by language code, e.g. 'en','zh','zh_classical'
	#graph
	#parent
	#children = new Set();
	#connections = new Map();
	constructor({
		geo_id,wikidata,osm_id,parent_id,capital_id,
		names,type,x,y,
		bizCount,investments,graph
	}){
		// only two strictly required fields
		if( parseInt(geo_id) !== geo_id || ( ! /^Q\d+$/.test(wikidata) ) ){ 
			throw 'error in one of the required inputs' 
		}
		// set IDs
		this.#ids.geo_id = geo_id
		this.#ids.wikidata = wikidata
		this.#ids.osm = osm_id
		if(parent_id) this.#ids.relations.parent = parent_id; 
		if(capital_id) this.#ids.relations.capital = capital_id;
		
		Object.entries( names ?? {} ).map( ( [ key, name ] ) => {
			if( /^[a-z]{2}$/.test(key) && typeof name == 'string' ){
				this.#names[key] = name
			}
		} )

		this.type = { label: { en: type } }

		this.geom = {}
		if( x && y ) this.geom.point = { type: 'POINT', coordinates: [x,y] }
		this.investments = investments ?? [] // unsets once phonebook is ready
		this._investsIn = new Set();
		this._hasInvestmentFrom = new Set();
		this._borders = new Set()
		this._directBusinessCount = bizCount ?? 0
		// record query status to prevent retries 0: none, 1: in progress, 2: done 
		this.queryStatus = { neighbors: 0, population: 0, boundary: 0 }
		if(graph){ 
			this.#graph = graph
			graph.know(this)
		}
	}
	// read-only properties
	get geo_id(){ return this.#ids.geo_id }
	get wikidata(){ return this.#ids.wikidata }
	get osm_id(){ return this.#ids.osm }
	get parent(){ return this.#parent }
	get name(){ return this.#names }
	
	notifyOfConnection(connection){
		// will just overwrite if given the same connection.id again
		this.#connections.set(connection.id,connection)
	}
	useGraph(graph){
		if( this.#graph == graph ) return;
		this.#graph = graph;
		graph.know(this);
	}
	get siblings(){
		let family = new Set(
			// if no parent, siblings are other parentless jurs
			this.parent ? this.parent.children : this.#graph.countriesNow
		)
		family.delete(this)
		return [...family]
	}
	findRelations(lookup){ // called once graph phonebook is ready
		if(this.#ids.relations?.parent){
			this.#parent = lookup(this.#ids.relations.parent)
			this.#parent.acceptChild(this)
		}
		if(this.#ids.relations?.capital){
			this.capital = lookup(this.#ids.relations.capital)
			this.capital.administer(this)
		}
		this.investments.map( dst_geo_id => {
			this.investIn( lookup(dst_geo_id) )
		} )
		delete this.investments
	}
	get directTradeAgreements(){
		return [...this.#connections.values()]
			.filter( conn => conn.constructor.name == 'TradeAgreement' )
	}
	get tradeAgreements(){
		return [
			...this.directTradeAgreements,
			...this.ancestors.map(a=>a.directTradeAgreements).flat()
		]
	}
	get sendsMissions(){
		return [...this.#connections.values()]
			.filter( conn => conn.constructor.name == 'Mission' )
			.filter( mission => mission.from == this )
			.sort((a,b)=>a.to.country.geo_id-b.to.country.geo_id)
	}
	get receivesMissions(){
		let direct = [...this.#connections.values()]
			.filter( conn => conn.constructor.name == 'Mission' )
			.filter( mission => mission.to == this )
		return [
			...direct,
			...this.children.map(j=>j.receivesMissions).flat()
		].sort((a,b)=>a.from.country.geo_id-b.from.country.geo_id)
	}
	get hasDiplomacy(){
		return this.sendsMissions.length + this.receivesMissions.length > 0
	}
	get connectionPoints(){ // TODO think through these arbitrary weights
		return ( 
			this.twinsRecursive.length * 0.2
			+ this.directTradeAgreements.length * 0.5
			+ this.receivesMissions.length * 0.3
			+ this.sendsMissions.length * 0.3 
			+ this.businessCount * 0.025
			+ this.investmentPartners.size * 0.05
		)
	}
	shareNetworks(jur){
		if(this.#graph) jur.useGraph(this.#graph)
	}
	acceptChild(child){
		this.#children.add(child)
		child.setParent(this)
		this.shareNetworks(child)
	}
	setParent(parent){
		if(!this.#parent) this.#parent = parent
		this.shareNetworks(parent)
	}
	administer(jur){
		this.administers = jur
	}
	borderWith(neighbor){
		if(!this._borders.has(neighbor)){
			this._borders.add(neighbor)
			neighbor.borderWith(this)
		}
	}
	borders(jur){
		if(!jur){
			return [...this._borders]
		}else{
			return this._borders.has(jur)
		}
	}
	investIn(partner){
		this._investsIn.add(partner)
		partner.acceptInvestmentFrom(this)
	}
	acceptInvestmentFrom(partner){
		this._hasInvestmentFrom.add(partner)
	}
	get hasInvestment(){ // recursively check for investment among children
		return (
			this._investsIn.size > 0 || 
			this._hasInvestmentFrom.size > 0 ||
			this.children.some(j=>j.hasInvestment)
		)
	}
	get investmentPartners(){ // direct only
		return new Set([
			...this._investsIn,
			...this._hasInvestmentFrom
		])
	}
	setPopulation(population){
		this._population = Number(population)
	}
	get population(){
		return this._population // may well be undefined
	}
	get country(){
		let jur = this
		while(jur?.parent){
			jur = jur.parent
		}
		return jur
	}
	get ancestors(){
		let them = []
		let jur = this
		while(jur?.parent){
			them.push(jur.parent)
			jur = jur.parent
		}
		return them
	}
	get descendants(){
		return this.children.map(child=>[child,...child.descendants]).flat()
	}
	get isCountry(){
		return this === this.country
	}
	get canadian(){
		return this.country.geo_id == 2
	}
	get twins(){
		return [...this.#connections.values()]
			.filter( conn => conn.constructor.name == 'Twinning' )
			.map( twinning => twinning.partnerOf(this) )
	}
	get twinsRecursive(){
		return [
			...this.twins,
			...this.children.map(c=>c.twinsRecursive).flat() 
		]
	}
	get twinPairsRecursive(){
		return [
			...this.twins.map(twin=>[this,twin]),
			...this.children.map(child=>child.twinPairsRecursive).flat() 
		]
	}
	get hasTwins(){
		return this.twins.length > 0
	}
	get businessCount(){
		return [this,...this.descendants]
			.reduce( (sum,j) => sum + j._directBusinessCount, 0 )
	}
	get boundary(){
		return this.geom?.polygon ?? this.geom?.point
	}
	get latlon(){
		return this?.geom?.point?.coordinates ?? [undefined,undefined]
	}
	setGeometry(geometry){
		if(geometry?.type == 'Point'){
			this.geom.point = geometry
		}else if(['Polygon','MultiPolygon'].includes(geometry?.type)){
			this.geom.polygon = geometry
		}else{
			console.warn(`null/invalid geometry returned for jur ${this.geo_id}`)
		}
		this.queryStatus.boundary = 2
		delete this._boundaryPromise
	}
	get children(){
		return [...this.#children]
	}
	get node(){
		if(!this._node){ this._node = new Node(this) }
		return this._node
	}
	get depth(){
		return this.ancestors.length
	}
	// returns a promise resolving to this jurisdiction with geometry available
	withGeom(type){
		if(!['point','boundary'].includes(type)){
			console.warn('invalid geometry type requested')
			return Promise.resolve(this)
		}else if( type == 'point' && this.geom?.point ){
			return Promise.resolve(this)
		}else if( type = 'boundary' ){
			// if request is already complete
			if(this.queryStatus.boundary == 2) return Promise.resolve(this);
			// request is in progress
			if(this.queryStatus.boundary == 1) return this._boundaryPromise;
			// request hasn't been made yet; queryStatus.boundary == 0
			this._boundaryPromise = fetch(`${geoAPI}?geo_id=${this.geo_id}`)
				.then(response => response.json())
				.then( data => {
					this.setGeometry(data)
					return this
				} )
			this.queryStatus.boundary = 1 // sent but not received
			return this._boundaryPromise
		}
	}
	contains(jur){
		return jur == this || jur.ancestors.includes(this)
	}
}
