import { Connection } from '../../src'

export class TradeAgreement extends Connection {
	#type = 'TradeAgreement'
	#data
	constructor(data,...signatories){
		super(...signatories)
		this.#data = data
	}
	get id(){
		return `${this.#type}:${super.id}`
	}
	get name(){
		return this.#data.agreementLabel
	}
	get signatories(){
		return this.jurisdictions
	}
	get startDate(){
		return this.#data?.year
	}
}
