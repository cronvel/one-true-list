
"use strict" ;



const SharedObject = require( './SharedObject.js' ) ;
const Query = require( './Query.js' ) ;
const Item = require( './Item.js' ) ;
const misc = require( './misc.js' ) ;

const Logfella = require( 'logfella' ) ;
const log = Logfella.global.use( 'todo' ) ;



function Overview( data ) {
	SharedObject.call( this , data ) ;
	
	this.title = '' ;
	this.global = true ;
	this.query = new Query() ;
	
	if ( data ) { this.set( data ) ; }
}

Overview.prototype = Object.create( SharedObject.prototype ) ;
Overview.prototype.constructor = Overview ;

module.exports = Overview ;



Overview.prototype.export = function() {
	return {
		title: this.title ,
		"global": this.global ,
		query: this.query
	} ;
} ;



Overview.prototype.set = function( data ) {
	if ( data.title !== undefined ) { this.setTitle( data.title ) ; }
	if ( data.global !== undefined ) { this.setGlobal( data.global ) ; }
	if ( data.query !== undefined ) { this.setQuery( data.query ) ; }
} ;



Overview.prototype.setTitle = function( title ) {
	if ( typeof title === 'string' ) { this.title = title ; }
} ;



Overview.prototype.setGlobal = function( isGlobal ) {
	if ( typeof isGlobal === 'string' ) {
		switch ( isGlobal.toLowerCase() ) {
			case '1' :
			case 'yes' :
			case 'on' :
			case 'true' :
				this.global = true ;
				break ;
			case '0' :
			case 'no' :
			case 'off' :
			case 'false' :
				this.global = true ;
				break ;
			default:
				this.global = false ;
		}
	}
	else {
		this.global = !! isGlobal ;
	}
} ;



Overview.prototype.setQuery = function( query ) {
	if ( ! query || typeof query !== 'object' ) { return ; }
	this.query.set( query ) ;
} ;



Overview.prototype.getItems = async function( subscriber , metaMap = new Map() ) {
	var subscription , item ,
		items = [] ;
	
	for ( subscription of subscriber.subscriptions ) {
		// There is a bug ATM, from subscription it can't load items
		await subscription.load( 2 ) ;
		items.push( ... subscription.list.items ) ;

		subscription.list.items.forEach( item => {
			metaMap.set( item , {
				listTitle: subscription.list.title ,
				tags: item.tags.concat( subscription.tags , subscription.list.tags ) ,
				priority: item.priority + subscription.priorityShift ,
				effort: item.effort * subscription.effortRate ,
				value: item.value * subscription.valueRate
			} ) ;
		} ) ;
	}
	
	items = this.query.apply( items , metaMap ) ;
	
	return items ;
} ;

