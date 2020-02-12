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

const Logfella = require( 'logfella' ) ;
const log = Logfella.global.use( 'todo' ) ;



function Auth( data ) {
	SharedObject.call( this , data ) ;

	this.id = '' ;			// The contributor ID
	this.password = '' ;

	if ( data ) { this.set( data ) ; }
}

Auth.prototype = Object.create( SharedObject.prototype ) ;
Auth.prototype.constructor = Auth ;

module.exports = Auth ;



Auth.prototype.export = function() {
	return {
		id: this.id ,
		password: this.password
	} ;
} ;



Auth.prototype.set = function( data ) {
	if ( data.id !== undefined ) { this.setid( data.id ) ; }
	if ( data.password !== undefined ) { this.setPassword( data.password ) ; }
} ;



Auth.prototype.setId = function( id ) {
	if ( typeof id === 'string' ) { this.id = id ; }
} ;



Auth.prototype.setPassword = function( password ) {
	if ( typeof password === 'string' ) { this.password = password ; }
} ;

