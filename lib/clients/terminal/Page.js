
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
	
	var submitted = await this.topMenu.waitFor( 'submit' ) ;
	
	this.document.destroy() ;
	
	return submitted ;
} ;




Page.prototype.createWidget = function( item , overide ) {
	var widget , params , match ;
	
	params = Object.assign( {} , item , overide , {
		parent: this.document ,
		value: item
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
					value: Object.assign( {} , subItem , { action: item.action } )
				} ;
				if ( subItem.value === item.actual ) { match = subParam.value ; }
				return subParam ;
			} ) ;
			params.value = match ;
			widget = new termkit.SelectList( params ) ;
			break ;
		default :
			return null ;
	}
	
	return widget ;
} ;

