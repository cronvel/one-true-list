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



const Page = require( './Page.js' ) ;

const string = require( 'string-kit' ) ;
const Promise = require( 'seventh' ) ;
const termkit = require( 'terminal-kit' ) ;
const term = termkit.terminal ;



function InfoPage( options ) {
	Page.call( this , options ) ;

	this.line1 = options.line1 ;
	this.line2 = options.line2 ;
	this.listMenuMultiLine = !! options.listMenuMultiLine ;
	this.listMenuItems = options.listMenu ;
	this.altTitle = options.altTitle ;
	this.altTitleDetail = options.altTitleDetail ;
	this.altListMenuMultiLine = !! options.altListMenuMultiLine ;
	this.altListMenuItems = options.altListMenu ;
	this.description = options.description ;
	this.tags = options.tags ;

	// Options
	this.focusOn = options.focusOn ;
	this.listMenuOddEvenColors = options.listMenuOddEvenColors ;
	this.altListMenuOddEvenColors = options.altListMenuOddEvenColors ;

	// Actual document objects
	this.line1Widget = null ;
	this.line2Widget = null ;
	this.listMenu = null ;
	this.altTitleText = null ;
	this.altTitleDetailText = null ;
	this.altListMenu = null ;
	this.descriptionTextBox = null ;
	this.tagsText = null ;
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

InfoPage.prototype.altTitleOptions = {
	attr: { bgColor: 'brightCyan' , color: 'black' }
} ;

InfoPage.prototype.altTitleDetailOptions = {
	attr: { bgColor: 'magenta' , color: 'brightWhite' }
} ;

InfoPage.prototype.altListMenuOptions = {
	leftPadding: ' ' ,
	rightPadding: ' '
} ;



InfoPage.prototype.descriptionOptions = {} ;
InfoPage.prototype.tagsOptions = {} ;



InfoPage.prototype.createDocument = function() {
	var activeFilters , activeFiltersText , nextX , nextY = 4 ;

	Page.prototype.createDocument.call( this ) ;

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

	if ( this.tags ) {
		this.tagsText = new termkit.TextBox( Object.assign( {} , this.tagsOptions , {
			parent: this.document ,
			x: 0 ,
			y: nextY ,
			attr: { bgColor: 'black' , color: 'white' } ,
			width: term.width ,
			content: '^+^_Tags:^: ' + ( this.tags.length ? '^B^+' + this.tags.join( '^:, ^B^+' ) : '^/^-none' ) ,
			contentHasMarkup: true
		} ) ) ;

		nextY += 2 ;
	}

	if ( this.listMenuItems && this.listMenuItems.length ) {
		this.listMenu = new termkit.ColumnMenu( Object.assign( {} , this.listMenuOptions , {
			parent: this.document ,
			x: 0 ,
			y: nextY ,
			buttonBlurAttr: { bgColor: '@darkest-gray' , color: '@cyan~++' } ,
			buttonEvenBlurAttr: this.listMenuOddEvenColors ? { bgColor: '@darker-gray' , color: '@cyan~++' } : null ,
			pageMaxHeight: ( this.altListMenuItems && this.altListMenuItems.length ? Math.round( term.height * 0.6 ) : term.height - 8 ) - nextY ,
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

	if ( this.description ) {
		let height = this.altListMenuItems && this.altListMenuItems.length ? 4 : 8 ;
		let newLines = string.occurrenceCount( this.description , '\n' ) ;

		this.descriptionTextBox = new termkit.TextBox( Object.assign( {} , this.descriptionOptions , {
			parent: this.document ,
			x: 0 ,
			y: nextY ,
			attr: { bgColor: 'black' , color: 'white' } ,
			width: term.width - 1 ,
			height ,
			scrollable: true ,
			wordWrap: true ,
			vScrollBar: height >= 5 && newLines + 1 > height ,	// Imperfect since it doesn't count future word-wrap feature
			content: this.description ,
			contentHasMarkup: true
		} ) ) ;

		nextY += this.descriptionTextBox.outputHeight + 2 ;
	}

	if ( this.altListMenuItems && this.altListMenuItems.length ) {
		if ( nextY < term.height / 2 ) {
			nextY = Math.ceil( term.height / 2 ) ;
		}

		this.altTitleText = new termkit.Text( Object.assign( {} , this.altTitleOptions , {
			parent: this.document ,
			x: 0 ,
			y: nextY ,
			content: ' ' + this.altTitle + ' '
		} ) ) ;

		if ( this.altTitleDetail ) {
			this.altTitleDetailText = new termkit.Text( Object.assign( {} , this.altTitleDetailOptions , {
				parent: this.document ,
				x: this.altTitleText.outputX + this.altTitleText.outputWidth ,
				y: this.altTitleText.outputY ,
				content: ' ' + this.altTitleDetail + ' ' ,
				contentHasMarkup: true
			} ) ) ;
		}

		nextY += 2 ;

		this.altListMenu = new termkit.ColumnMenu( Object.assign( {} , this.altListMenuOptions , {
			multiLineItems: this.altListMenuMultiLine ,
			parent: this.document ,
			x: 0 ,
			y: nextY ,
			buttonBlurAttr: { bgColor: '@darkest-gray' , color: '@cyan~++' } ,
			buttonEvenBlurAttr: this.altListMenuOddEvenColors ? { bgColor: '@darker-gray' , color: '@cyan~++' } : null ,
			pageMaxHeight: term.height - nextY - 1 ,
			buttonKeyBindings: Object.assign( {} , termkit.ColumnMenu.prototype.buttonKeyBindings , {
				CTRL_UP: 'submit' ,
				CTRL_DOWN: 'submit'
			} ) ,
			buttonActionKeyBindings: {
				CTRL_UP: 'rankUp' ,
				CTRL_DOWN: 'rankDown'
			} ,
			items: this.altListMenuItems.map( item => ( {
				content: item.label , markup: true , value: item , disabled: !! item.error
			} ) )
		} ) ) ;

		nextY += this.altListMenu.outputHeight + 2 ;
	}
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

	if ( this.altListMenu ) {
		waitForSubmit.push(
			this.altListMenu.waitForAll( 'submit' ).then( ( [ value , action ] ) => {
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

