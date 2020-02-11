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



function Comment( data ) {
	SharedObject.call( this , data ) ;

	this.by = '' ;		// The user, for instance it's a string, it would be a User instance one day...
	this.content = '' ;	// The actual content of the comment

	if ( data ) { this.set( data ) ; }
}

Comment.prototype = Object.create( SharedObject.prototype ) ;
Comment.prototype.constructor = Comment ;

module.exports = Comment ;



Comment.prototype.export = function() {
	return {
		by: this.by ,
		content: this.content
	} ;
} ;



Comment.prototype.set = function( data ) {
	if ( data.by !== undefined ) { this.setBy( data.by ) ; }
	if ( data.content !== undefined ) { this.setContent( data.content ) ; }
} ;



Comment.prototype.setBy = function( by ) {
	if ( typeof by === 'string' ) { this.by = by ; }
} ;



Comment.prototype.setContent = function( content ) {
	if ( typeof content === 'string' ) { this.content = content ; }
} ;

