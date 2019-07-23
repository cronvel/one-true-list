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

const Logfella = require( 'logfella' ) ;
const log = Logfella.global.use( 'todo' ) ;



function Task( data ) {
	SharedObject.call( this , data ) ;
	
	this.title = '' ;
	this.description = '' ;
	this.status = 'todo' ;

	if ( data ) { this.set( data ) ; }
}

Task.prototype = Object.create( SharedObject.prototype ) ;
Task.prototype.constructor = Task ;

module.exports = Task ;



Task.prototype.export = function() {
	return {
		title: this.title ,
		description: this.description ,
		status: this.status
	} ;
} ;



Task.STATUSES = new Set( [ 'todo' , 'in-progress' , 'done' ] ) ;



Task.prototype.set = function( data ) {
	if ( data.title !== undefined ) { this.setTitle( data.title ) ; }
	if ( data.description !== undefined ) { this.setDescription( data.description ) ; }
	if ( data.status !== undefined ) { this.setStatus( data.status ) ; }
} ;



Task.prototype.setStatus = function( status ) {
	if ( Task.STATUSES.has( status ) ) { this.status = status ; }
} ;



Task.prototype.setTitle = function( title ) {
	if ( typeof title === 'string' ) { this.title = title ; }
} ;



Task.prototype.setDescription = function( description ) {
	if ( typeof description === 'string' ) { this.description = description ; }
} ;

