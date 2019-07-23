/*
	One True List

	Copyright (c) 2019 Cédric Ronvel

	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

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

