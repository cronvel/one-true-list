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

	if ( this.year && ! this.year.some( pattern => this.patternMatch( pattern , date.year ) ) ) { return false ; }
	if ( this.month && ! this.month.some( pattern => this.patternMatch( pattern , date.month , 12 ) ) ) { return false ; }
	if ( this.day && ! this.day.some( pattern => this.patternMatch( pattern , date.day , date.daysInMonth ) ) ) { return false ; }
	if ( this.weekday && ! this.weekday.some( pattern => this.patternMatch( pattern , date.weekday , 7 ) ) ) { return false ; }
	if ( this.hour && ! this.hour.some( pattern => this.patternMatch( pattern , date.hour , 23 ) ) ) { return false ; }
	if ( this.minute && ! this.minute.some( pattern => this.patternMatch( pattern , date.minute , 59 ) ) ) { return false ; }

	return true ;
} ;



TimeMatcher.prototype.patternMatch = function( pattern , value , max = null ) {
	switch ( pattern.type ) {
		case 'exact' :
			return value === pattern.value ;
		case 'exactLast' :
			if ( max === null ) { return false ; }
			return value === max + 1 - pattern.value ;
		case 'range' :
			return value >= pattern.start && value <= pattern.end ;
		case 'rangeLast' :
			if ( max === null ) { return false ; }
			return value >= max + 1 - pattern.start && value <= max + 1 - pattern.end ;
		case 'every' :
			return ( value - pattern.phase ) % pattern.period === 0 ;
	}
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
				this[ key ] = this.parseField( data[ key ] ) ;
				break ;
		}
	}
} ;



TimeMatcher.prototype.parseField = function( str ) {
	if ( typeof str !== 'string' ) { return str ; }
	if ( ! str || str === '*' ) { return null ; }
	return str.split( ',' ).map( part => this.parseExpression( part ) ) ;
} ;



TimeMatcher.prototype.parseExpression = function( str ) {
	var match ;

	if ( str.match( /^[0-9]+$/ ) ) {
		// Exact value
		return { type: 'exact' , value: + str } ;
	}

	if ( ( match = str.match( /^([0-9]+)L$/ ) ) ) {
		// Exact value last value
		return { type: 'exactLast' , value: + match[ 1 ] } ;
	}

	if ( ( match = str.match( /^([0-9]+)-([0-9]+)$/ ) ) ) {
		// Range
		return { type: 'range' , start: + match[ 1 ] , end: + match[ 2 ] } ;
	}

	if ( ( match = str.match( /^([0-9]+)L-([0-9]+)L$/ ) ) ) {
		// Range last
		return { type: 'rangeLast' , start: + match[ 1 ] , end: + match[ 2 ] } ;
	}

	if ( ( match = str.match( /^\/([0-9]+)([+-][0-9]+)?$/ ) ) ) {
		// Every
		return { type: 'every' , period: + match[ 1 ] , phase: + match[ 2 ] || 0 } ;
	}

	throw new SyntaxError( 'Bad TimeMatcher expression: ' + str ) ;
} ;

