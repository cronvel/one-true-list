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



const crypto = require( 'crypto' ) ;

const SharedObject = require( './SharedObject.js' ) ;

const Logfella = require( 'logfella' ) ;
const log = Logfella.global.use( 'todo' ) ;



function Contributor( data ) {
	SharedObject.call( this , data ) ;

	this.id = '' ;				// The contributor ID used to log in
	this.passwordHash = '' ;	// Used for login
	this.name = '' ;			// The contributor display name

	if ( data ) { this.set( data ) ; }
}

Contributor.prototype = Object.create( SharedObject.prototype ) ;
Contributor.prototype.constructor = Contributor ;

module.exports = Contributor ;



Contributor.prototype.export = function() {
	return {
		id: this.id ,
		passwordHash: this.passwordHash ,
		name: this.name
	} ;
} ;



Contributor.prototype.set = function( data ) {
	if ( data.id !== undefined ) { this.setId( data.id ) ; }
	if ( data.passwordHash !== undefined ) { this.setPasswordHash( data.passwordHash ) ; }
	else if ( data.password !== undefined ) { this.setPassword( data.password ) ; }
	if ( data.name !== undefined ) { this.setName( data.name ) ; }
} ;



Contributor.prototype.setId = function( id ) {
	if ( typeof id === 'string' ) { this.id = id ; }
} ;



Contributor.prototype.setPassword = function( password ) {
	var hash ;

	if ( typeof password === 'string' ) {
		hash = crypto.createHash( 'sha512' ) ;
		hash.update( password ) ;
		this.passwordHash = hash.digest( 'base64' ) ;
	}
} ;



Contributor.prototype.setPasswordHash = function( passwordHash ) {
	if ( typeof passwordHash === 'string' ) { this.passwordHash = passwordHash ; }
} ;



Contributor.prototype.setName = function( name ) {
	if ( typeof name === 'string' ) { this.name = name ; }
} ;

