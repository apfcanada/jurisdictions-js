import { Jurisdiction } from './jurisdiction' 

export class Node{
	// reserved:
	// .x, .y, .fx, .fy, .cx, .cy, ...etc
	constructor(data){
		if(data instanceof Jurisdiction){
			this.jur = data
		}else{
			console.warn( 'only jurisdictions can be nodes, passed:', data )
		}
	}
	get id(){
		return this.jur.geo_id
	}
	get title(){
		return this.jur.name.en;
	}
	get radius(){
		return this?._radius ?? 6
	}
	setRadius(val){
		this._radius = val
	}
	get size(){
		return this.jur.population
	}
	get focused(){
		return this._focused
	}
	focus(val){
		this._focused = Boolean(val)
	}
	get label(){
		return this.jur.name.en
	}
	get href(){
		return `/jurisdiction/${this.jur.geo_id}`
	}
	get classes(){
		const classNames = new Set(['jurisdiction']);
		if(this.focused) classNames.add('focused')
		classNames.add( this.jur.canadian ? 'canadian' : 'asian' )
		return [...classNames]
	}
}
