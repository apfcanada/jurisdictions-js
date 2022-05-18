import { assignBoundaries } from './fetchGeoms.js'
import { Node } from './node.js'

export class Jurisdiction {
	#ids = { relations: {} }
	#names = { } // keyed by language code, e.g. 'en','zh','zh_classical'
	#graph
	#parent
	#children = new Set();
	#administers
	#capital
	#connections = new Map();
	#borders = new Set();
	#population;
	#node;
	constructor({
		geo_id, wikidata, osm_id,
		parent_id, capital_id,
		names, type, x, y, graph
	}){
		// only two strictly required fields
		if( parseInt(geo_id) !== geo_id || ( ! /^Q\d+$/.test(wikidata) ) ){ 
			throw 'invalid geo_id or wikidata ID supplied' 
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
	get children(){ return [...this.#children] }
	get population(){ return this.#population } // may well be undefined
	get isCountry(){ return this === this.country }
	get canadian(){ return this.country.geo_id == 2 }
	get depth(){ return this.ancestors.length }
	get capital(){ return this.#capital }
	get administers(){ return this.#administers }
	
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
	findRelations(lookup){ // called once graph is ready
		if(this.#ids.relations?.parent){
			this.#parent = lookup(this.#ids.relations.parent)
			this.#parent.acceptChild(this)
		}
		if(this.#ids.relations?.capital){
			this.#capital = lookup(this.#ids.relations.capital)
			this.#capital.administer(this)
		}
	}
	connections(connectionClass,recurseOptions={}){
		const { ancestors, descendants } = recurseOptions
		if( connectionClass instanceof RegExp ){
			let conns = [...this.#connections.entries()]
				.filter( ([key,value]) => connectionClass.test(key) )
				.map( ([key,value]) => value )
			if(ancestors){ return [ ...conns,
				...this.ancestors.map(a=>a.connections(connectionClass)).flat()
			] }
			if(descendants){ return [ ...conns,
				...this.descendants.map(d=>d.connections(connectionClass)).flat()
			] }
			return conns
		}
		return [...this.#connections.values()]
	}
	
	hasConnections(connectionClass){
		if( connectionClass instanceof RegExp ){
			return [...this.#connections.keys()]
				.some( key => connectionClass.test(key) )
		}
		return false
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
		this.#administers = jur
	}
	borderWith(neighbor){
		if(!this.#borders.has(neighbor)){
			this.#borders.add(neighbor)
			neighbor.borderWith(this)
		}
	}
	borders(jur){
		if(!jur){
			return [...this.#borders]
		}else{
			return this.#borders.has(jur)
		}
	}
	setPopulation(population){
		this.#population = Number(population)
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
	inLineWith(jur){ // is ancestor / descendant of jurisdiction?
		return (
			this === jur
			|| this.ancestors.includes(jur)
			|| jur.ancestors.includes(this)
		)
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
	get node(){
		if(!this.#node){ this.#node = new Node(this) }
		return this.#node
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
			return assignBoundaries([this]).then( jurs => this )
		}
	}
}
