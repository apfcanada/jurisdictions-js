import { Connection } from './connection.js'

export class TradeAgreement extends Connection {
	constructor(data,...signatories){
		super(...signatories)
		this._data = data
	}
	get name(){
		return this._data.agreementLabel
	}
	get signatories(){
		return this._jurs
	}
	get startDate(){
		return this._data?.year
	}
}
