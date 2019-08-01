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
const TimeMatcher = require( './TimeMatcher.js' ) ;
const Query = require( './Query.js' ) ;
const Item = require( './Item.js' ) ;
const misc = require( './misc.js' ) ;

const Logfella = require( 'logfella' ) ;
const log = Logfella.global.use( 'todo' ) ;



function Overview( data ) {
	SharedObject.call( this , data ) ;

	this.title = '' ;
	this.global = true ;		// if set, global overview from multiple list, else local overview in listView
	this.dashboard = false ;	// if set, this overview can be used as the dashboard overview
	this.priority = 0 ;			// priority over other overviews (e.g. for dashboard)
	this.timeMatcher = new TimeMatcher() ;
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
		dashboard: this.dashboard ,
		priority: this.priority ,
		timeMatcher: this.timeMatcher ,
		query: this.query
	} ;
} ;



Overview.prototype.set = function( data ) {
	if ( data.title !== undefined ) { this.setTitle( data.title ) ; }
	if ( data.global !== undefined ) { this.setGlobal( data.global ) ; }
	if ( data.dashboard !== undefined ) { this.setDashboard( data.dashboard ) ; }
	if ( data.priority !== undefined ) { this.setPriority( data.priority ) ; }
	if ( data.timeMatcher !== undefined ) { this.setTimeMatcher( data.timeMatcher ) ; }
	if ( data.query !== undefined ) { this.setQuery( data.query ) ; }
} ;



Overview.prototype.setTitle = function( title ) {
	if ( typeof title === 'string' ) { this.title = title ; }
} ;



Overview.prototype.setGlobal = function( isGlobal ) {
	this.global = misc.toBoolean( isGlobal ) ;
} ;



Overview.prototype.setDashboard = function( isDashboard ) {
	this.dashboard = misc.toBoolean( isDashboard ) ;
} ;



Overview.prototype.setPriority = function( priority ) {
	if ( priority && typeof priority === 'string' ) { priority = + priority ; }
	if ( typeof priority !== 'number' || Number.isNaN( priority ) ) { return ; }
	this.priority = priority ;
} ;



Overview.prototype.setTimeMatcher = function( timeMatcher ) {
	if ( ! timeMatcher || typeof timeMatcher !== 'object' ) { return ; }
	this.timeMatcher.set( timeMatcher ) ;
} ;



Overview.prototype.setQuery = function( query ) {
	if ( ! query || typeof query !== 'object' ) { return ; }
	this.query.set( query ) ;
} ;



Overview.prototype.matchTime = function( date ) {
	return this.timeMatcher.match( date ) ;
} ;



Overview.prototype.getItems = async function( subscriber , metaMap = new Map() , limit = Infinity ) {
	var subscription , items = [] ;

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

	if ( items.length > limit ) { items.length = limit ; }

	return items ;
} ;

