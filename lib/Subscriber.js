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
const Subscription = require( './Subscription.js' ) ;
const Overview = require( './Overview.js' ) ;

const Logfella = require( 'logfella' ) ;
const log = Logfella.global.use( 'todo' ) ;



function Subscriber( data ) {
	SharedObject.call( this , data ) ;

	this.name = null ;
	this.subscriptions = [] ;
	this.overviews = [] ;

	if ( data ) { this.set( data ) ; }
}

Subscriber.prototype = Object.create( SharedObject.prototype ) ;
Subscriber.prototype.constructor = Subscriber ;

module.exports = Subscriber ;



Subscriber.prototype.export = function() {
	return {
		name: this.name ,
		subscriptions: this.subscriptions.map( subscription => ( { url: subscription.url } ) ) ,
		overviews: this.overviews.map( overview => ( { url: overview.url } ) )
	} ;
} ;



Subscriber.prototype.set = function( data ) {
	if ( data.name !== undefined ) { this.setName( data.name ) ; }
	if ( data.subscriptions !== undefined ) { this.setSubscriptions( data.subscriptions ) ; }
	if ( data.overviews !== undefined ) { this.setOverviews( data.overviews ) ; }
} ;



Subscriber.prototype.setName = function( name ) {
	if ( typeof name === 'string' ) { this.name = name ; }
} ;



Subscriber.prototype.setSubscriptions = function( subscriptions ) {
	if ( ! Array.isArray( subscriptions ) ) { return ; }

	this.subscriptions.length = 0 ;
	subscriptions.forEach( subscription => this.addSubscription( subscription ) ) ;
} ;



Subscriber.prototype.addSubscription = function( subscription ) {
	if ( ! subscription || typeof subscription !== 'object' ) { return ; }
	if ( ! ( subscription instanceof Subscription ) ) { subscription = new Subscription( subscription ) ; }
	this.subscriptions.push( subscription ) ;
	return subscription ;
} ;



Subscriber.prototype.removeSubscription = function( subscription ) {
	if ( ! subscription || typeof subscription !== 'object' ) { return ; }
	this.subscriptions = this.subscriptions.filter( subscription_ => subscription_ !== subscription ) ;
} ;



Subscriber.prototype.setOverviews = function( overviews ) {
	if ( ! Array.isArray( overviews ) ) { return ; }

	this.overviews.length = 0 ;
	overviews.forEach( overview => this.addOverview( overview ) ) ;
} ;



Subscriber.prototype.addOverview = function( overview ) {
	if ( ! overview || typeof overview !== 'object' ) { return ; }
	if ( ! ( overview instanceof Overview ) ) { overview = new Overview( overview ) ; }
	this.overviews.push( overview ) ;
	return overview ;
} ;



Subscriber.prototype.removeOverview = function( overview ) {
	if ( ! overview || typeof overview !== 'object' ) { return ; }
	this.overviews = this.overviews.filter( overview_ => overview_ !== overview ) ;
} ;

