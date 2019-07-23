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



const Page = require( './Page.js' ) ;

const termkit = require( 'terminal-kit' ) ;
const term = termkit.terminal ;
const Promise = require( 'seventh' ) ;



function EditPage( options ) {
	Page.call( this , options ) ;

	this.fields = options.fields ;

	// Actual document objects
	this.form = null ;
}

EditPage.prototype = Object.create( Page.prototype ) ;
EditPage.prototype.constructor = EditPage ;

module.exports = EditPage ;



EditPage.prototype.formOptions = {
} ;



EditPage.prototype.createDocument = function() {
	Page.prototype.createDocument.call( this ) ;

	this.form = new termkit.Form( Object.assign( {} , this.formOptions , {
		parent: this.document ,
		x: 0 ,
		y: 4 ,
		width: 120 ,
		inputs: this.fields ,
		buttons: [
			{
				content: '<Ok>' ,
				value: 'ok'
			} ,
			{
				content: '<Cancel>' ,
				value: 'cancel'
			}
		]
	} ) ) ;
} ;



EditPage.prototype.run = async function() {
	this.createDocument() ;

	this.document.giveFocusTo( this.form ) ;

	var submitted = await this.form.waitFor( 'submit' ) ;

	this.document.destroy() ;

	return submitted ;
} ;

