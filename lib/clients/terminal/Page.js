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



const termkit = require( 'terminal-kit' ) ;
const term = termkit.terminal ;
const Promise = require( 'seventh' ) ;



function Page( options ) {
	this.title = options.title ;
	this.titleDetail = options.titleDetail ;
	this.breadCrumb = options.breadCrumb ;
	this.topMenuItems = options.topMenu || [] ;

	// Actual document objects
	this.document = null ;
	this.titleText = null ;
	this.titleDetailText = null ;
	this.breadCrumbText = null ;
	this.topMenu = null ;
}

module.exports = Page ;



Page.prototype.titleOptions = {
	attr: { bgColor: 'brightCyan' , color: 'black' }
} ;

Page.prototype.titleDetailOptions = {
	attr: { bgColor: 'magenta' , color: 'brightWhite' }
} ;

Page.prototype.topMenuOptions = {
	buttonSeparator: '|' ,
	buttonSeparatorAttr: { color: 'black' }
} ;



Page.prototype.createDocument = function() {
	term.clear() ;

	this.document = term.createDocument() ;

	this.titleText = new termkit.Text( Object.assign( {} , this.titleOptions , {
		parent: this.document ,
		x: 0 ,
		y: 2 ,
		content: ' ' + this.title + ' '
	} ) ) ;

	if ( this.titleDetail ) {
		this.titleDetailText = new termkit.Text( Object.assign( {} , this.titleDetailOptions , {
			parent: this.document ,
			x: this.titleText.outputX + this.titleText.outputWidth ,
			y: this.titleText.outputY ,
			content: ' ' + this.titleDetail + ' '
		} ) ) ;
	}

	this.topMenu = new termkit.DropDownMenu( Object.assign( {} , this.topMenuOptions , {
		parent: this.document ,
		x: 0 ,
		y: 0 ,
		z: 10 ,	// Always on top
		items: this.topMenuItems.map( item => ( {
			content: item.label ,
			value: item ,
			items: item.subMenu ? item.subMenu.map( subItem => ( { content: subItem.label , value: subItem } ) ) : null  ,
			topSubmit: ! item.subMenu ,
			shortcuts: item.shortcuts
		} ) )
	} ) ) ;
} ;



Page.prototype.run = async function() {
	this.createDocument() ;

	submitted = await this.topMenu.waitFor( 'submit' ) ;

	this.document.destroy() ;

	return submitted ;
} ;




Page.prototype.createWidget = function( item , overide ) {
	var widget , params , match ;

	params = Object.assign( {} , item , overide , {
		parent: this.document ,
		meta: item
	} ) ;

	switch ( item.type ) {
		case 'button' :
			params.content = '<' + params.label + '>' ;
			widget = new termkit.Button( params ) ;
			break ;
		case 'select' :
			params.items = item.items.map( subItem => {
				var subParam = {
					content: subItem.label ,
					contentHasMarkup: true ,
					value: subItem.value
				} ;
				if ( subItem.value === item.actual ) { match = subParam.value ; }
				return subParam ;
			} ) ;
			params.value = item.actual ;
			widget = new termkit.SelectList( params ) ;
			break ;
		case 'selectMulti' :
			params.items = item.items.map( subItem => {
				var subParam = {
					content: subItem.label ,
					contentHasMarkup: true ,
					value: subItem.value
				} ;
				if ( subItem.value === item.actual ) { match = subParam.value ; }
				return subParam ;
			} ) ;
			params.value = item.actual ;
			widget = new termkit.SelectListMulti( params ) ;
			break ;
		default :
			return null ;
	}

	return widget ;
} ;

