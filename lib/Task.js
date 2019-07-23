
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

