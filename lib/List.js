
"use strict" ;



const SharedObject = require( './SharedObject.js' ) ;
const Item = require( './Item.js' ) ;

const Logfella = require( 'logfella' ) ;
const log = Logfella.global.use( 'todo' ) ;



function List( data ) {
	SharedObject.call( this , data ) ;

	this.title = '' ;
	this.description = '' ;
	this.tags = [] ;
	this.items = [] ;

	if ( data ) { this.set( data ) ; }
}

List.prototype = Object.create( SharedObject.prototype ) ;
List.prototype.constructor = List ;

module.exports = List ;



List.prototype.export = function() {
	return {
		title: this.title ,
		description: this.description ,
		tags: this.tags ,
		items: this.items.map( item => ( { url: item.url } ) )
	} ;
} ;



List.prototype.set = function( data ) {
	if ( data.title !== undefined ) { this.setTitle( data.title ) ; }
	if ( data.description !== undefined ) { this.setDescription( data.description ) ; }
	if ( data.tags !== undefined ) { this.setTags( data.tags ) ; }
	if ( data.items !== undefined ) { this.setItems( data.items ) ; }
} ;



List.prototype.setTitle = function( title ) {
	if ( typeof title === 'string' ) { this.title = title ; }
} ;



List.prototype.setDescription = function( description ) {
	if ( typeof description === 'string' ) { this.description = description ; }
} ;



List.prototype.setTags = function( tags ) {
	if ( typeof tags === 'string' ) { tags = tags ? tags.split( ',' ).map( tag => tag.trim() ) : [] ; }
	if ( ! Array.isArray( tags ) ) { return ; }

	this.tags.length = 0 ;
	tags.forEach( tag => this.addTag( tag ) ) ;
} ;



List.prototype.addTag = function( tag ) {
	if ( tag && typeof tag === 'string' && ! this.tags.includes( tag ) ) { this.tags.push( tag ) ; }
} ;



List.prototype.setItems = function( items ) {
	if ( ! Array.isArray( items ) ) { return ; }

	this.items.length = 0 ;
	items.forEach( item => this.addItem( item ) ) ;
} ;



List.prototype.addItem = function( item ) {
	if ( ! item || typeof item !== 'object' ) { return ; }
	if ( ! ( item instanceof Item ) ) { item = new Item( item ) ; }
	this.items.push( item ) ;
	return item ;
} ;



List.prototype.removeItem = function( item ) {
	if ( ! item || typeof item !== 'object' ) { return ; }
	this.items = this.items.filter( item_ => item_ !== item ) ;
} ;

