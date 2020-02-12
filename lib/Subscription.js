/*
	One True List

	Copyright (c) 2019 - 2020 Cédric Ronvel

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
const Auth = require( './Auth.js' ) ;
const List = require( './List.js' ) ;
const misc = require( './misc.js' ) ;

const Logfella = require( 'logfella' ) ;
const log = Logfella.global.use( 'todo' ) ;



function Subscription( data ) {
	SharedObject.call( this , data ) ;

	this.auth = null ;
	this.list = null ;
	this.tags = [] ;

	// Those are used to scale different source of relative values across multiple lists:
	this.priorityShift = 0 ;	// Each item of this subscription add this number to its priority
	this.effortRate = 1 ;		// Each item of this subscription multiply its effort by this number
	this.valueRate = 1 ;		// Each item of this subscription multiply its value by this number

	if ( data ) { this.set( data ) ; }
}

Subscription.prototype = Object.create( SharedObject.prototype ) ;
Subscription.prototype.constructor = Subscription ;

module.exports = Subscription ;



Subscription.prototype.export = function() {
	return {
		auth: this.auth ,
		list: { url: this.list.url } ,
		tags: this.tags ,
		priorityShift: this.priorityShift ,
		effortRate: this.effortRate ,
		valueRate: this.valueRate
	} ;
} ;



Subscription.prototype.set = function( data ) {
	if ( data.auth !== undefined ) { this.setAuth( data.auth ) ; }
	if ( data.list !== undefined ) { this.setList( data.list ) ; }
	if ( data.tags !== undefined ) { this.setTags( data.tags ) ; }
	if ( data.priorityShift !== undefined ) { this.setPriorityShift( data.priorityShift ) ; }
	if ( data.effortRate !== undefined ) { this.setEffortRate( data.effortRate ) ; }
	if ( data.valueRate !== undefined ) { this.setValueRate( data.valueRate ) ; }
} ;



Subscription.prototype.setAuth = function( auth ) {
	if ( ! auth || typeof auth !== 'object' ) { return ; }
	if ( ! ( auth instanceof Auth ) ) { auth = new Auth( auth ) ; }
	this.auth = auth ;
} ;



Subscription.prototype.setList = function( list ) {
	if ( ! list || typeof list !== 'object' ) { return ; }
	if ( ! ( list instanceof List ) ) { list = new List( list ) ; }
	this.list = list ;
} ;



Subscription.prototype.setTags = function( tags ) {
	if ( typeof tags === 'string' ) { tags = tags ? tags.split( ',' ).map( tag => tag.trim() ) : [] ; }
	if ( ! Array.isArray( tags ) ) { return ; }

	this.tags.length = 0 ;
	tags.forEach( tag => this.addTag( tag ) ) ;
} ;



Subscription.prototype.setPriorityShift = function( priorityShift ) {
	if ( priorityShift && typeof priorityShift === 'string' ) { priorityShift = + priorityShift ; }
	if ( typeof priorityShift !== 'number' || Number.isNaN( priorityShift ) ) { return ; }
	this.priorityShift = priorityShift ;
} ;



Subscription.prototype.setEffortRate = function( effortRate ) {
	if ( effortRate && typeof effortRate === 'string' ) { effortRate = + effortRate ; }
	if ( typeof effortRate !== 'number' || Number.isNaN( effortRate ) ) { return ; }
	this.effortRate = misc.fibonacciValue( effortRate ) ;
} ;



Subscription.prototype.setValueRate = function( valueRate ) {
	if ( valueRate && typeof valueRate === 'string' ) { valueRate = + valueRate ; }
	if ( typeof valueRate !== 'number' || Number.isNaN( valueRate ) ) { return ; }
	this.valueRate = misc.fibonacciValue( valueRate ) ;
} ;

