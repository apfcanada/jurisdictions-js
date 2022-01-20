import { json } from 'd3-fetch'
import { geometry as geoAPI } from './API.js'
import { Node } from './node.js'
import { Mission } from './mission.js'
import { phonebook } from './graph.js'

export class Jurisdiction {
	constructor({
		geo_id,wikidata,osm_id,
		parent,name,type,capital,x,y,
		bizCount,investments
	}){
		this.geo_id = geo_id
		this.wikidata = wikidata
		this.osm_id = osm_id
		phonebook.set(this.geo_id,this) 
		phonebook.set(this.wikidata,this)
		this.name = name
		this.type = { label: { en: type } }
		this._parent_geo_id = parent 
		this._capitalQid = capital
		this._phonebook = phonebook
		this.geom = {}
		if( x && y ) this.geom.point = { type: 'POINT', coordinates: [x,y] }
		this._twins = new Set()
		this._children = new Set()
		this.investments = investments ?? [] // unsets once phonebook is ready
		this._investsIn = new Set();
		this._hasInvestmentFrom = new Set();
		this._borders = new Set()
		this._directTradeAgreements = new Set()
		this._sendsMissions = new Set()
		this._receivesMissions = new Set()
		this._directBusinessCount = bizCount ?? 0
		// record query status to prevent retries 0: none, 1: in progress, 2: done 
		this.queryStatus = { neighbors: 0, population: 0, boundary: 0 }
	}
	// id can/should be either a wikidataID or a geo_id, either number or string
	lookup(id){
		if( id instanceof Jurisdiction ) return id;
		let fellowJur
		if( typeof id == 'number' && Number.isInteger(id) ){
			fellowJur = this._phonebook.get(id)
		}else if( typeof id == 'string' && /^\d+$/.test(id) ) {  
			fellowJur = this._phonebook.get(Number(id))
		}else if( typeof id == 'string' && /^Q\d+$/.test(id) ){
			fellowJur = this._phonebook.get(id)
		}else{
			throw new Error(`${id} (${typeof id}) is not an accepted jur ID`)
		}
		return fellowJur
	}
	get siblings(){
		let family = new Set(
			// child of earth (Q2) if no parent
			this.parent ? this.parent.children : this.lookup('Q2').children
		)
		family.delete(this)
		return [...family]
	}
	findRelations(){ // called once phonebook is ready
		if(this._parent_geo_id){
			this.parent = this.lookup(this._parent_geo_id)
			delete this._parent_geo_id
			this.parent.acceptChild(this)
		}
		if(this._capitalQid){
			this.capital = this.lookup(this._capitalQid)
			delete this._capitalQid
			this.capital.administer(this)
		}
		this.investments.map( dst_geo_id => {
			this.investIn( this.lookup(dst_geo_id) )
		} )
		delete this.investments
	}
	signTradeAgreement(agreement){
		this._directTradeAgreements.add(agreement)
	}
	get directTradeAgreements(){
		return [...this._directTradeAgreements]
	}
	get tradeAgreements(){
		return [
			...this._directTradeAgreements,
			...this.ancestors.map(a=>[...a._directTradeAgreements]).flat()
		]
	}
	sendMission(mission){
		if(mission instanceof Mission) this._sendsMissions.add(mission)
	}
	receiveMission(mission){
		if(mission instanceof Mission) this._receivesMissions.add(mission)
	}
	get sendsMissions(){
		return [...this._sendsMissions]
			.sort((a,b)=>a.to.country.geo_id-b.to.country.geo_id)
	}
	get receivesMissions(){
		return [
			...this._receivesMissions,
			...this.children.map(c=>c.receivesMissions).flat()
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
	acceptChild(child){
		this._children.add(child)
	}
	administer(jur){
		this.administers = jur
	}
	twinWith(twin){
		if( ! (twin instanceof Jurisdiction) ){
			throw "can't twin with something that's not a jurisdiction"
		}
		if(!this._twins.has(twin)){
			this._twins.add(twin)
			twin.twinWith(this)
		}
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
		return [...this._twins]
	}
	get twinsRecursive(){
		return [
			...this.twins, 
			...this.children.map(c=>c.twinsRecursive).flat() 
		]
	}
	get twinPairsRecursive(){
		return [
			...this.twins.map(t=>[this,t]), 
			...this.children.map(c=>c.twinPairsRecursive).flat() 
		]
	}
	get hasTwins(){
		return this._twins.size > 0
	}
	get businessCount(){
		return [this,...this.descendants]
			.reduce( (sum,j) => sum + j._directBusinessCount, 0 )
	}
	get boundary(){
		return this.geom?.polygon ?? this.geom?.point
	}
	get latlon(){
		return this?.geom?.point?.coordinates
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
		return [...this._children]
	}
	get node(){
		if(!this._node){ this._node = new Node(this) }
		return this._node
	}
	get depth(){
		return this.ancestors.length
	}
	// returns a promise resolving to this jurisdiction with  geometry available
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
			this._boundaryPromise = json(`${geoAPI}?geo_id=${this.geo_id}`)
				.then( data => {
					this.setGeometry(data)
					return this
				} )
			this.queryStatus.boundary = 1 // sent but not received
			return this._boundaryPromise
		}
	}
}
