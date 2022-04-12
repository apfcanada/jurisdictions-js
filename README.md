# Overview
The `JurisdictionsGraph` class helps to define a data structure relating a set of `Jurisdiction`s in a variety of ways. The main relation is that of parent->child, where a top-level parent is typically a sovereign nation, its children are the first-level administrative divisions (provinces, states, etc), and so on down to cities or towns, as varies by region. Jurisdictions can have any number of children but in practice the number varies between 0 and ~50.

From this parent->child tree structure we get the concepts of `ancestors` and `descendants` belonging to a jurisdiction. As each full tree is separately sovereign, any connections between trees are "international", connections within a tree "domestic".

"Connections", specifically instances of the `Connection` class can be any of these, with more specific classes extending these to specifically Canada<->Asia connections, directed connections with a distinct 'from' and 'to', and so on. 

The connections between jurisdictions end up forming a big tangled graph and the `JurisdictionGraph` class then serves as a container for that mess and a way of accessing some of its basic properties like the list of all jurisdictions, or all countries, etc without having to do a lot of traversals from one jurisdiction to all the rest. Nevermind the strong  possibility of disconnected subgraphs. 

# Defining new connections

We provide several basic connection types between jurisdictions but leave it up to the implementation to extend and refine these. For instance, we've extended connections to define multilateral trade agreements, borders between jurisdictions, diplomatic missions, twinning relations, businesses, FDI...


