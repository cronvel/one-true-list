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



const Logfella = require( 'logfella' ) ;
const log = Logfella.global.use( 'todo' ) ;



function Query( data ) {
	// Filters
	this.minPriority = null ;
	this.maxPriority = null ;
	this.minValue = null ;
	this.maxValue = null ;
	this.minEffort = null ;
	this.maxEffort = null ;
	this.tags = null ;
	this.notTags = null ;
	this.statuses = null ;
	this.notStatuses = null ;

	// Scoring
	this.rankWeight = -0.01 ;
	this.priorityWeight = -2 ;	// Lower is better
	this.valueWeight = 1 ;
	this.effortWeight = -1 ;
	this.tagsWeight = 1 ;
	this.statusWeight = 1 ;

	this.tagsScore = null ;	// if set and an object, it's the score multiplier for each matching tag
	this.statusesScore = null ;	// same for status

	if ( data ) { this.set( data ) ; }
}

module.exports = Query ;



Query.prototype.reset = function() {
	// Filters
	this.minPriority = null ;
	this.maxPriority = null ;
	this.minValue = null ;
	this.maxValue = null ;
	this.minEffort = null ;
	this.maxEffort = null ;
	this.tags = null ;
	this.notTags = null ;
	this.statuses = null ;
	this.notStatuses = null ;

	// Scoring
	this.rankWeight = -0.01 ;
	this.priorityWeight = -2 ;
	this.valueWeight = 1 ;
	this.effortWeight = -1 ;
	this.tagsWeight = 1 ;
	this.statusWeight = 1 ;

	this.tagsScore = null ;
	this.statusesScore = null ;
} ;



Query.prototype.set = function( data , reset ) {
	var key , value , found ;

	if ( reset ) { this.reset() ; }

	for ( key in data ) {
		value = data[ key ] ;
		if ( value === undefined ) { continue ; }

		switch ( key ) {
			case 'minPriority' :
			case 'maxPriority' :
			case 'minValue' :
			case 'maxValue' :
			case 'minEffort' :
			case 'maxEffort' :
				if ( value && typeof value === 'string' ) { value = + value ; }

				if ( typeof value === 'number' && value >= 0 ) {
					this[ key ] = value ;
				}
				else {
					this[ key ] = null ;
				}

				break ;

			case 'tags' :
			case 'notTags' :
			case 'statuses' :
			case 'notStatuses' :
				if ( value && typeof value === 'string' ) {
					this[ key ] = value.split( ',' ).map( v => v.trim() ) ;
				}
				else if ( Array.isArray( value ) ) {
					value = value.filter( v => v && typeof v === 'string' ) ;
					this[ key ] = value ;
				}
				else if ( value && typeof value === 'object' ) {
					// Use keys of truthy properties
					value = Object.keys( value ).filter( k => value[ k ] ) ;
					this[ key ] = value ;
				}
				else {
					this[ key ] = null ;
				}

				break ;

			case 'tagsScore' :
			case 'statusesScore' :
				if ( value && typeof value === 'string' ) {
					// Object.fromEntries() is not supported in Node v10, should wait for v12
					//this[ key ] = Object.fromEntries( value.split( ',' ).map( v => v.split( ':' ).map( v_ => v_.trim() ) ) ) ;
					this[ key ] = {} ;
					found = false ;

					value.split( ',' ).map( v => v.split( ':' ).map( v_ => v_.trim() ) )
						.forEach( ( [ k , v ] ) => {
							if ( v && typeof v === 'string' ) { v = parseFloat( v ) ; }
							if ( typeof v === 'number' && ! Number.isNaN( v ) ) {
								found = true ;
								this[ key ][ k ] = v ;
							}
						} ) ;

					if ( ! found ) { this[ key ] = null ; }
				}
				else if ( value && typeof value === 'object' && ! Array.isArray( value ) ) {
					for ( let k in value ) {
						if ( typeof value[ k ] === 'string' ) { value[ k ] = parseFloat( value[ k ] ) ; }
						if ( typeof value[ k ] !== 'number' || Number.isNaN( value[ k ] ) ) { delete value[ k ] ; }
					}

					this[ key ] = value ;
				}
				else {
					this[ key ] = null ;
				}

				break ;

			case 'rankWeight' :
			case 'priorityWeight' :
			case 'valueWeight' :
			case 'effortWeight' :
			case 'tagsWeight' :
			case 'statusWeight' :
				if ( value && typeof value === 'string' ) { value = + value ; }

				if ( typeof value === 'number' && ! Number.isNaN( value ) ) {
					this[ key ] = value ;
				}
				else {
					this[ key ] = null ;
				}

				break ;
		}
	}
} ;



// Check if two array shares some elements
// Should probably be shipped into the array-kit lib, once it gets a better name
function arrayShare( a1 , a2 ) {
	var i , iMax ;

	for ( i = 0 , iMax = a1.length ; i < iMax ; i ++ ) {
		if ( a2.includes( a1[ i ] ) ) { return true ; }
	}

	return false ;
}



// Apply the query
Query.prototype.apply = function( items , metaMap = new Map() ) {
	items.forEach( ( item , index ) => {
		var meta = metaMap.get( item ) ;

		if ( ! meta ) {
			meta = {} ;
			metaMap.set( item , meta ) ;
		}

		meta.rank = index ;

		if ( meta.priority === undefined ) { meta.priority = item.priority ; }
		if ( meta.effort === undefined ) { meta.effort = item.effort ; }
		if ( meta.value === undefined ) { meta.value = item.value ; }
		if ( meta.tags === undefined ) { meta.tags = item.tags ; }

		meta.tagScore = 1 ;

		if ( meta.tags && meta.tags.length && this.tagsScore ) {
			meta.tags.forEach( tag => {
				if ( tag in this.tagsScore ) { meta.tagScore *= this.tagsScore[ tag ] || 0.001 ; }
			} ) ;
		}

		meta.statusScore = 1 ;

		if ( this.statusesScore && ( item.status in this.statusesScore ) ) {
			meta.statusScore = this.statusesScore[ item.status ] || 0.001 ;
		}

		meta.score =
			//index * this.rankWeight
			+ 1000
			* ( ( meta.priority || 0.2 ) ** this.priorityWeight )
			* ( ( meta.value || 0.2 ) ** this.valueWeight )
			* ( ( meta.effort || 0.2 ) ** this.effortWeight )
			* ( meta.tagScore ** this.tagsWeight )
			* ( meta.statusScore ** this.statusWeight ) ;
	} ) ;

	// Filter part
	items = items.filter( item => {
		var meta = metaMap.get( item ) ;

		if ( this.minPriority !== null && meta.priority < this.minPriority ) { return false ; }
		if ( this.maxPriority !== null && meta.priority > this.maxPriority ) { return false ; }

		if ( this.minValue !== null && meta.value < this.minValue ) { return false ; }
		if ( this.maxValue !== null && meta.value > this.maxValue ) { return false ; }

		if ( this.minEffort !== null && meta.effort < this.minEffort ) { return false ; }
		if ( this.maxEffort !== null && meta.effort > this.maxEffort ) { return false ; }

		if ( this.tags !== null && ! arrayShare( this.tags , meta.tags ) ) { return false ; }
		if ( this.notTags !== null && arrayShare( this.notTags , meta.tags ) ) { return false ; }

		if ( this.statuses !== null && ! this.statuses.includes( item.status ) ) { return false ; }
		if ( this.notStatuses !== null && this.statuses.includes( item.status ) ) { return false ; }

		return true ;
	} ) ;


	// Sort part
	items.sort( ( a , b ) => {
		return metaMap.get( b ).score - metaMap.get( a ).score ;
	} ) ;

	return items ;
} ;

