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



const luxon = require( 'luxon' ) ;
const Logfella = require( 'logfella' ) ;
const log = Logfella.global.use( 'todo' ) ;



/*
	Similar to CRON tab.

	Difference between '*' here and in CRON:
		- '*' match anything but create virtually one full range.
			So if 'minute=*' it will match any minutes but will create only one event.
		- In CRON '*' match anything but create virtually one range per value.
			So if 'minute=*' in crontab, it will match any minutes and will create create as many events as there are minutes.
			To reproduce this in TimeMatcher, you need to set 'minute=/1'
*/

function TimeMatcher( data ) {
	this.year = null ;
	this.month = null ;
	this.day = null ;	// of month
	this.weekday = null ;
	this.hour = null ;
	this.minute = null ;

	if ( data ) { this.set( data ) ; }
}

module.exports = TimeMatcher ;



TimeMatcher.prototype.match = function( date ) {
	if ( ! ( date instanceof luxon.DateTime ) ) { date = new luxon.DateTime( date ) ; }

	if ( this.year && ! this.year.some( expression => expression.match( date.year ) ) ) { return false ; }
	if ( this.month && ! this.month.some( expression => expression.match( date.month , 12 ) ) ) { return false ; }
	if ( this.day && ! this.day.some( expression => expression.match( date.day , date.daysInMonth ) ) ) { return false ; }
	if ( this.weekday && ! this.weekday.some( expression => expression.match( date.weekday , 7 ) ) ) { return false ; }
	if ( this.hour && ! this.hour.some( expression => expression.match( date.hour , 23 ) ) ) { return false ; }
	if ( this.minute && ! this.minute.some( expression => expression.match( date.minute , 59 ) ) ) { return false ; }

	return true ;
} ;



TimeMatcher.prototype.set = function( data ) {
	var key ;

	for ( key in data ) {
		switch ( key ) {
			case 'year' :
			case 'month' :
			case 'day' :
			case 'weekday' :
			case 'hour' :
			case 'minute' :
				this[ key ] = this.toExpressions( data[ key ] ) ;
				break ;
		}
	}
} ;



TimeMatcher.prototype.toExpressions = function( data ) {
	if ( Array.isArray( data ) ) {
		return data.map( expression => expression instanceof Expression ? expression : Expression.from( expression ) ) ;
	}

	if ( typeof data !== 'string' ) { return null ; }
	if ( ! data || data === '*' ) { return null ; }
	return data.split( ',' ).map( part => Expression.parse( part ) ) ;
} ;



Expression.from = function( data ) {
	if ( data && typeof data === 'object' ) { return new Expression( data ) ; }
	if ( typeof data === 'string' ) { return Expression.parse( data ) ; }
	return null ;
} ;



Expression.parse = function( str ) {
	var match ;

	if ( str.match( /^[0-9]+$/ ) ) {
		// Exact value
		return new Expression( { type: 'exact' , value: + str } ) ;
	}

	if ( ( match = str.match( /^([0-9]+)L$/ ) ) ) {
		// Exact value last value
		return new Expression( { type: 'exactLast' , value: + match[ 1 ] } ) ;
	}

	if ( ( match = str.match( /^([0-9]+)-([0-9]+)$/ ) ) ) {
		// Range
		return new Expression( { type: 'range' , start: + match[ 1 ] , end: + match[ 2 ] } ) ;
	}

	if ( ( match = str.match( /^([0-9]+)L-([0-9]+)L$/ ) ) ) {
		// Range last
		return new Expression( { type: 'rangeLast' , start: + match[ 1 ] , end: + match[ 2 ] } ) ;
	}

	if ( ( match = str.match( /^\/([0-9]+)([+-][0-9]+)?$/ ) ) ) {
		// Every
		return new Expression( { type: 'every' , period: + match[ 1 ] , phase: + match[ 2 ] || 0 } ) ;
	}

	throw new SyntaxError( 'Bad TimeMatcher expression: ' + str ) ;
} ;



function Expression( data ) {
	Object.assign( this , data ) ;
}

TimeMatcher.Expression = Expression ;



Expression.prototype.toString = function() {
	switch ( this.type ) {
		case 'exact' :
			return '' + this.value ;
		case 'exactLast' :
			return '' + this.value + 'L' ;
		case 'range' :
			return '' + this.start + '-' + this.end ;
		case 'rangeLast' :
			return '' + this.start + 'L-' + this.end + 'L' ;
		case 'every' :
			if ( this.phase > 0 ) {
				return '/' + this.period + '+' + this.phase ;
			}
			if ( this.phase < 0 ) {
				return '/' + this.period + '-' + this.phase ;
			}
			return '/' + this.period ;
	}

	return '' ;
} ;



Expression.prototype.match = function( value , max = null ) {
	switch ( this.type ) {
		case 'exact' :
			return value === this.value ;
		case 'exactLast' :
			if ( max === null ) { return false ; }
			return value === max + 1 - this.value ;
		case 'range' :
			return value >= this.start && value <= this.end ;
		case 'rangeLast' :
			if ( max === null ) { return false ; }
			return value >= max + 1 - this.start && value <= max + 1 - this.end ;
		case 'every' :
			return ( value - this.phase ) % this.period === 0 ;
	}
} ;

