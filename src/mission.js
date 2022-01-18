import { DirectedConnection } from './connection.js'

export class Mission extends DirectedConnection {
	constructor({missionData,operator,destination}){
		super(operator,destination)
		this._data = missionData // direct from wikidata
	}
	get id(){
		return this._data.missionID
	}
	get type(){
		return this._data.typeLabels
	}
}
