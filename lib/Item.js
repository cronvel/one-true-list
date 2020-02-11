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
const Task = require( './Task.js' ) ;
const Comment = require( './Comment.js' ) ;
const misc = require( './misc.js' ) ;

const Logfella = require( 'logfella' ) ;
const log = Logfella.global.use( 'todo' ) ;



function Item( data ) {
	SharedObject.call( this , data ) ;

	this.title = '' ;
	this.description = '' ;
	this.tags = [] ;
	this.status = 'proposal' ;
	this.priority = 3 ;	// Not exactly specified
	this.effort = 1 ;	// How big/long/hard this item is
	this.value = 1 ;	// How much added value
	this.tasks = [] ;
	this.comments = [] ;

	if ( data ) { this.set( data ) ; }
}

Item.prototype = Object.create( SharedObject.prototype ) ;
Item.prototype.constructor = Item ;

module.exports = Item ;



Item.prototype.export = function() {
	return {
		title: this.title ,
		description: this.description ,
		tags: this.tags ,
		status: this.status ,
		priority: this.priority ,
		effort: this.effort ,
		value: this.value ,
		tasks: this.tasks.map( task => task.export() ) ,
		comments: this.comments
	} ;
} ;



/*
	Statuses:
		proposal: a proposition of something nice to have, but it is not specified yet
		specified: the proposal is fully specified
		todo: this must to be done, it is not started
		in-progress: work on this item has started and is currently progressing
		done: work on this item is done, waiting review and acceptance
		accepted: work on this item is done and accepted, there is nothing to do for this item anymore
		incomplete: some works have been done on the item, it has either not been accepted or it was stopped before completion, or stalled
		rejected: the item is not relevant anymore and should not be included, this can happen at any stage
*/
Item.STATUSES = new Set( [ 'proposal' , 'specified' , 'todo' , 'in-progress' , 'done' , 'accepted' , 'incomplete' , 'rejected' ] ) ;



Item.prototype.set = function( data ) {
	if ( data.title !== undefined ) { this.setTitle( data.title ) ; }
	if ( data.description !== undefined ) { this.setDescription( data.description ) ; }
	if ( data.tags !== undefined ) { this.setTags( data.tags ) ; }
	if ( data.status !== undefined ) { this.setStatus( data.status ) ; }
	if ( data.priority !== undefined ) { this.setPriority( data.priority ) ; }
	if ( data.effort !== undefined ) { this.setEffort( data.effort ) ; }
	if ( data.value !== undefined ) { this.setValue( data.value ) ; }
	if ( data.tasks !== undefined ) { this.setTasks( data.tasks ) ; }
	if ( data.comments !== undefined ) { this.setComments( data.comments ) ; }
} ;



Item.prototype.setStatus = function( status ) {
	if ( Item.STATUSES.has( status ) ) { this.status = status ; }
} ;



Item.prototype.setTitle = function( title ) {
	if ( typeof title === 'string' ) { this.title = title ; }
} ;



Item.prototype.setDescription = function( description ) {
	if ( typeof description === 'string' ) { this.description = description ; }
} ;



Item.prototype.setTags = function( tags ) {
	if ( typeof tags === 'string' ) { tags = tags ? tags.split( ',' ).map( tag => tag.trim() ) : [] ; }
	if ( ! Array.isArray( tags ) ) { return ; }

	this.tags.length = 0 ;
	tags.forEach( tag => this.addTag( tag ) ) ;
} ;



Item.prototype.addTag = function( tag ) {
	if ( tag && typeof tag === 'string' && ! this.tags.includes( tag ) ) { this.tags.push( tag ) ; }
} ;



Item.prototype.setPriority = function( priority ) {
	if ( priority && typeof priority === 'string' ) { priority = + priority ; }
	if ( typeof priority !== 'number' || Number.isNaN( priority ) ) { return ; }
	this.priority = priority ;
} ;



Item.prototype.setEffort = function( effort ) {
	if ( effort && typeof effort === 'string' ) { effort = + effort ; }
	if ( typeof effort !== 'number' || Number.isNaN( effort ) ) { return ; }
	this.effort = misc.fibonacciValue( effort ) ;
} ;



Item.prototype.setValue = function( value ) {
	if ( value && typeof value === 'string' ) { value = + value ; }
	if ( typeof value !== 'number' || Number.isNaN( value ) ) { return ; }
	this.value = misc.fibonacciValue( value ) ;
} ;



Item.prototype.setTasks = function( tasks ) {
	if ( ! Array.isArray( tasks ) ) { return ; }

	this.tasks.length = 0 ;
	tasks.forEach( task => this.addTask( task ) ) ;
} ;



Item.prototype.addTask = function( task ) {
	if ( ! task || typeof task !== 'object' ) { return ; }
	if ( ! ( task instanceof Task ) ) { task = new Task( task ) ; }
	this.tasks.push( task ) ;
	return task ;
} ;



Item.prototype.setComments = function( comments ) {
	if ( ! Array.isArray( comments ) ) { return ; }

	this.comments.length = 0 ;
	comments.forEach( comment => this.addComment( comment ) ) ;
} ;



Item.prototype.addComment = function( comment ) {
	if ( ! comment || typeof comment !== 'object' ) { return ; }
	if ( ! ( comment instanceof Comment ) ) { comment = new Comment( comment ) ; }
	this.comments.push( comment ) ;
	return comment ;
} ;

