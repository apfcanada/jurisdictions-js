import { Connection } from './connection.js'

export class TradeAgreement extends Connection {
	#data
	constructor(data,...signatories){
		super(...signatories)
		this.#data = data
	}
	get id(){
		return `tradeAgreement:${super.id}`
	}
	get name(){
		return this.#data.agreementLabel
	}
	get signatories(){
		return this.jurs
	}
	get startDate(){
		return this.#data?.year
	}
}
