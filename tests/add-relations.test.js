import { JurisdictionGraph, Jurisdiction } from '../src/'

const sampleData = {
	jurisdictions:[
		{g:1,q:1,o:'r1',n:{en:'A'},t:1},
		{g:2,q:2,o:'r2',n:{en:'B'},t:1,p:1},
		{g:3,q:3,o:'r3',n:{en:'C'},t:1,p:1},
		{g:4,q:4,o:'r4',n:{en:'D'},t:2,p:3},
	],
	types:[{uid:1,label:'utopia'},{uid:2,label:'distopia'}]
}

test('Synchronously build minimal JurisdictionGraph withour errors',() => {
	const graph = new JurisdictionGraph(sampleData);
} )

test('Create minimal Jurisdiction',() => {
	const jur = new Jurisdiction({geo_id:4,wikidata:'Q4',name:{en:'A'}})
	expect(jur).toBeInstanceOf(Jurisdiction)
})

test('Add child jurisdiction',() => {
	const graph = new JurisdictionGraph(sampleData);
	const newChild = new Jurisdiction({geo_id:4,wikidata:'Q4'})
	const parent = graph.lookupNow('Q4')
	expect(parent.children.length).toBe(0)
	parent.acceptChild(newChild)
	expect(parent.children.length).toBe(1)
	expect(newChild.parent).toBe(parent)
	expect(graph.lookupNow(newChild.geo_id)).toBeDefined()
} )

test('Build empty graph, find nothing in it',() => {
	const graph = new JurisdictionGraph({jurisdictions:[],types:[]});
	expect(graph.lookupNow(1)).toBeUndefined()
	expect(graph.lookupNow([1]).length).toBe(0)
} )
