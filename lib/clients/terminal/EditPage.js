
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
	
	var submitted = await this.form.waitFor( 'submit' )
	
	this.document.destroy() ;
	
	return submitted ;
} ;

