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

const string = require( 'string-kit' ) ;
const Promise = require( 'seventh' ) ;
const termkit = require( 'terminal-kit' ) ;
const term = termkit.terminal ;



function InfoPage( options ) {
	Page.call( this , options ) ;

	this.line1 = options.line1 ;
	this.line2 = options.line2 ;
	this.listMenuItems = options.listMenu ;
	this.description = options.description ;
	this.query = options.query ;

	// Options
	this.focusOn = options.focusOn ;
	this.listMenuOddEvenColors = options.listMenuOddEvenColors ;

	// Actual document objects
	this.line1Widget = null ;
	this.line2Widget = null ;
	this.listMenu = null ;
	this.descriptionTextBox = null ;
	this.queryText = null ;
}

InfoPage.prototype = Object.create( Page.prototype ) ;
InfoPage.prototype.constructor = InfoPage ;

module.exports = InfoPage ;



InfoPage.prototype.filterOptions = {
	attr: { color: 'gray' }
} ;



InfoPage.prototype.listMenuOptions = {
	leftPadding: ' ' ,
	rightPadding: ' '
} ;



InfoPage.prototype.createDocument = function() {
	var activeFilters , activeFiltersText , nextX , nextY = 4 ;

	Page.prototype.createDocument.call( this ) ;

	/*
	if ( this.query ) {
		activeFilters = Object.entries( this.query ).filter( e => e[ 1 ] !== undefined && e[ 1 ] !== null ) ;

		if ( activeFilters.length ) {
			activeFiltersText = 'Filters --' ;
			activeFilters.forEach( ( [ key , value ] ) => {
				activeFiltersText += ' ' + string.camelCaseToSeparated( key ) + ': ' + value + ' ' ;
			} ) ;

			this.queryText = new termkit.Text( Object.assign( {} , this.filterOptions , {
				parent: this.document ,
				x: 0 ,
				//y: nextY ,
				y: term.height - 2 ,
				content: activeFiltersText
			} ) ) ;

			//nextY += 2 ;
		}
	}
	*/

	if ( this.line1 ) {
		nextX = 0 ;

		this.line1Widgets = this.line1.map( item => {
			var widget = this.createWidget( item , {
				x: nextX ,
				y: nextY
			} ) ;

			nextX += widget.outputWidth + 2 ;
			return widget ;
		} ) ;

		nextY += 2 ;
	}

	if ( this.line2 ) {
		nextX = 0 ;

		this.line2Widgets = this.line2.map( item => {
			var widget = this.createWidget( item , {
				x: nextX ,
				y: nextY
			} ) ;
			nextX += widget.outputWidth + 2 ;
			return widget ;
		} ) ;

		nextY += 2 ;
	}

	if ( this.listMenuItems && this.listMenuItems.length ) {
		this.listMenu = new termkit.ColumnMenu( Object.assign( {} , this.listMenuOptions , {
			parent: this.document ,
			x: 0 ,
			y: nextY ,
			buttonBlurAttr: { bgColor: '@darkestGray' , color: '@lightBlueGray' } ,
			buttonEvenBlurAttr: this.listMenuOddEvenColors ? { bgColor: '@darkerGray' , color: '@lightBlueGray' } : null ,
			pageMaxHeight: term.height - nextY - 1 ,
			buttonKeyBindings: Object.assign( {} , termkit.ColumnMenu.prototype.buttonKeyBindings , {
				CTRL_UP: 'submit' ,
				CTRL_DOWN: 'submit'
			} ) ,
			buttonActionKeyBindings: {
				CTRL_UP: 'rankUp' ,
				CTRL_DOWN: 'rankDown'
			} ,
			items: this.listMenuItems.map( item => ( {
				content: item.label , markup: true , value: item , disabled: !! item.error
			} ) )
		} ) ) ;

		if ( this.focusOn ) {
			let itemValue = this.listMenuItems.find( it => it.target === this.focusOn ) ;
			if ( itemValue ) { this.listMenu.focusValue( itemValue ) ; }
		}

		nextY += this.listMenu.outputHeight + 2 ;
	}

	this.descriptionTextBox = new termkit.TextBox( Object.assign( {} , this.descriptionOptions , {
		parent: this.document ,
		x: 0 ,
		y: nextY ,
		attr: { bgColor: 'black' , color: 'white' } ,
		width: term.width ,
		height: 10 ,
		content: this.description
	} ) ) ;
} ;



InfoPage.prototype.run = async function() {
	this.createDocument() ;

	var waitForSubmit = [ this.topMenu.waitFor( 'submit' ) ] ;

	if ( this.listMenu ) {
		this.document.giveFocusTo( this.listMenu ) ;
		waitForSubmit.push(
			this.listMenu.waitForAll( 'submit' ).then( ( [ value , action ] ) => {
				if ( ! action ) { return value ; }
				return Object.assign( {} , value , { action } ) ;
			} )
		) ;
	}

	if ( this.line1Widgets ) {
		this.line1Widgets.forEach( widget => waitForSubmit.push(
			widget.waitFor( 'submit' ).then( value => ( {
				action: widget.meta.action ,
				target: widget.meta.target ,
				value: value
			} ) )
		) ) ;
	}

	if ( this.line2Widgets ) {
		this.line2Widgets.forEach( widget => waitForSubmit.push(
			widget.waitFor( 'submit' ).then( value => ( {
				action: widget.meta.action ,
				target: widget.meta.target ,
				value: value
			} ) )
		) ) ;
	}

	var submitted = await Promise.any( waitForSubmit ) ;

	this.document.destroy() ;

	return submitted ;
} ;

