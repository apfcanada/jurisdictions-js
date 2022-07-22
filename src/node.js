export class Node{
	// reserved for simulation
	// .x, .y, .fx, .fy, .vx, .vy
	#jur
	#radius = 6
	#focused = false
	constructor(jurisdiction){
		this.#jur = jurisdiction
	}
	get jur(){ return this.#jur }
	get id(){ return this.#jur.geo_id }
	get title(){ return this.#jur.name.en; }
	get radius(){ return this.#radius }
	get size(){ return this.#jur.population }
	get focused(){ return this.#focused }
	get label(){ return this.#jur.name.en }
	setRadius(val){
		this.#radius = Number(val)
	}	
	focus(val){
		this.#focused = Boolean(val)
	}
	get classes(){
		const classNames = new Set(['jurisdiction']);
		if(this.focused) classNames.add('focused')
		classNames.add( this.#jur.canadian ? 'canadian' : 'asian' )
		return [...classNames]
	}
}
