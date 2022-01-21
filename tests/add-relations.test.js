import { JurisdictionGraph, Jurisdiction } from '../src/'

const sampleData = {
	jurisdictions:[
		{g:1,q:1,o:'r1',n:'A',t:1},
		{g:2,q:2,o:'r2',n:'B',t:1,p:1},
		{g:3,q:3,o:'r3',n:'C',t:1,p:1},
		{g:4,q:4,o:'r4',n:'C',t:2,p:3},
	],
	types:[{uid:1,label:'utopia'},{uid:1,label:'distopia'}]
}

test('Build minimal graph withour errors',() => {
	const graph = new JurisdictionGraph(sampleData);
} )
