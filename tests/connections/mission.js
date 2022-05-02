import { DirectedConnection } from '../../src'

export class Mission extends DirectedConnection {
	#type = 'Mission'
	#data
	constructor({missionData,operator,destination}){
		super(operator,destination)
		this.#data = missionData // direct from wikidata
	}
	get id(){
		return `${this.#type}:${super.id}/${this.#data.missionID}`
	}
	get type(){
		return this.#data.typeLabels
	}
}
