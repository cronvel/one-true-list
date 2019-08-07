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



TimeMatcher.prototype.match = function( date ) {
	var lastFlag ,
		runtime = { lastFlag: null } ;

	if ( ! ( date instanceof luxon.DateTime ) ) { date = new luxon.DateTime( date ) ; }

	//*
	if ( ! this.matchArray_( this.year , date.year , null , runtime ) ) { return false ; }
	if ( ! this.matchArray_( this.month , date.month , 12 , runtime ) ) { return false ; }
	if ( ! this.matchArray_( this.day , date.day , date.daysInMonth , runtime ) ) { return false ; }
	if ( ! this.matchArray_( this.weekday , date.weekday , 7 , runtime ) ) { return false ; }
	if ( ! this.matchArray_( this.hour , date.hour , 23 , runtime ) ) { return false ; }
	if ( ! this.matchArray_( this.minute , date.minute , 59 , runtime ) ) { return false ; }
	//*/

	/*
	if ( this.year && ! this.year.some( expression => expression.match( date.year ) ) ) { return false ; }
	if ( this.month && ! this.month.some( expression => expression.match( date.month , 12 ) ) ) { return false ; }
	if ( this.day && ! this.day.some( expression => expression.match( date.day , date.daysInMonth ) ) ) { return false ; }
	if ( this.weekday && ! this.weekday.some( expression => expression.match( date.weekday , 7 ) ) ) { return false ; }
	if ( this.hour && ! this.hour.some( expression => expression.match( date.hour , 23 ) ) ) { return false ; }
	if ( this.minute && ! this.minute.some( expression => expression.match( date.minute , 59 ) ) ) { return false ; }
	//*/

	return true ;
} ;



TimeMatcher.prototype.matchArray_ = function( array , value , max , runtime ) {
	var i , iMax , expression , result ;

	if ( ! array || ! array.length ) { return true ; }

	for ( i = 0 , iMax = array.length ; i < iMax ; i ++ ) {
		expression = array[ i ] ;
		//console.log( 'expr' , expression ) ;
		result = expression.match( value , max , runtime.lastFlag ) ;

		if ( result ) {
			runtime.lastFlag = result ;
			return result ;
		}
	}

	return false ;
} ;



TimeMatcher.prototype.next = function( date ) {
	if ( ! ( date instanceof luxon.DateTime ) ) { date = new luxon.DateTime( date ) ; }

	var {
		year , month , day , weekday , hour , minute
	} = date ;

	var current = {
		changed: false ,
		year ,
		month ,
		day ,
		// weekday ,
		hour ,
		minute
	} ;

	if ( ! this._next( current ) ) { return null ; }

	//console.log( current ) ;

	// Luxon doesn't like unknown keys, and we should remove the weekday
	return luxon.DateTime.fromObject( Object.assign( {} , current , { weekday: undefined , changed: undefined } ) ) ;
} ;



//const SUBLEVEL_KEYS = [ 'year' , 'month' , 'day' ] ;
const SUBLEVEL_KEYS = [ 'year' , 'month' , 'day' , 'hour' , 'minute' ] ;
const SUBLEVEL_MIN = [ null , 1 , 1 , 0 , 0 ] ;
const SUBLEVEL_MAX = [ null , 12 , 'daysInMonth' , 23 , 59 ] ;

TimeMatcher.prototype._next = function( current , level = 0 ) {
	var isMatching , values , index , found , oldValue , currentDateTime ,
		key = SUBLEVEL_KEYS[ level ] ,
		max = SUBLEVEL_MAX[ level ] ;

	// It's a loop
	if ( current[ key ] === null || current[ key ] === undefined ) {
		current[ key ] = SUBLEVEL_MIN[ level ] ;
		if ( this[ key ] ) { current.changed = true ; }
	}

	// /!\ Is only sparsely used, maybe move that inside a condition to avoid using too much CPU
	currentDateTime = luxon.DateTime.fromObject( Object.assign( {} , current , { weekday: undefined , changed: undefined } ) ) ;

	// Fix 'max' to the dynamic value if needed
	if ( typeof max === 'string' ) { max = currentDateTime[ max ] ; }

	if ( key === 'day' ) { current.weekday = currentDateTime.weekday ; }

	isMatching = ! this[ key ] || this[ key ].some( expression => expression.match( current[ key ] , max ) ) ;

	if ( isMatching && key === 'day' && this.weekday ) {
		if ( current.changed && this.day ) {
			// THAT NASTY CASE
			// We should match those overlapping properties: day and weekday
			// We have to interate until it passes
			while (
				current.day <= max
				&& ! (
					isMatching =
						this.day.some( expression => expression.match( current.day , max ) )
						&& this.weekday.some( expression => expression.match( current.weekday , 7 ) )
				)
			) {
				//console.log( 'ism:w+d before:' , current ) ;
				current.day ++ ;
				current.weekday ++ ;
				if ( current.weekday === 8 ) { current.weekday = 1 ; }
				//console.log( 'ism:w+d after:' , current ) ;
			}

			if ( ! isMatching ) { return false ; }
		}
		else {
			isMatching = this.weekday.some( expression => expression.match( current.weekday , 7 ) ) ;
		}
	}

	// First try to change sub-levels if this one is ok
	if ( isMatching ) {
		if ( level + 1 < SUBLEVEL_KEYS.length ) {
			found = this._next( current , level + 1 ) ;
			if ( found && current.changed ) { return true ; }
		}
		else if ( current.changed ) {
			return true ;
		}
	}


	if ( ! this[ key ] ) {
		if ( key === 'day' && this.weekday ) {
			//console.log( 'weekday w/o day' , current ) ;

			values = this.weekday
				.map( expression => expression.next( current.weekday , 7 ) )
				.filter( v => v !== null ) ;

			if ( ! values.length ) {
				// We don't return to the 'month' level, we have to start over the next week

				current.day += 8 - current.weekday ;
				current.weekday = 1 ;
				current.changed = true ;

				// If we are at the end of the month already...
				if ( current.day > max ) { return false ; }

				// First, see if it match for the first day, if not, find the next matching day
				if ( ! this.weekday.some( expression => expression.match( current.weekday , 7 ) ) ) {
					values = this.weekday
						.map( expression => expression.next( current.weekday , 7 ) )
						.filter( v => v !== null ) ;

					// There is no reason it wouldn't match, but in case some future rules make it possible...
					if ( ! values.length ) { return false ; }

					//console.log( "before" , current ) ;
					oldValue = current.weekday ;
					current.weekday = Math.min( ... values ) ;
					current.day += current.weekday - oldValue ;

					// If we are at the end of the month already...
					if ( current.day > max ) { return false ; }

					//console.log( "after" , current , oldValue , current.weekday , current.weekday - oldValue  ) ;
				}
			}
			else {

				//console.log( "before" , current ) ;
				oldValue = current.weekday ;
				current.weekday = Math.min( ... values ) ;
				current.day += current.weekday - oldValue ;
				current.changed = true ;	// MUST BE BEFORE the day > max check

				// If we are at the end of the month already...
				if ( current.day > max ) { return false ; }

				//console.log( "after" , current , oldValue , current.weekday , current.weekday - oldValue  ) ;
			}
		}
		else {
			if ( max !== null && current[ key ] + 1 > max ) { return false ; }
			current[ key ] ++ ;
			// That does not count as a change, it's the same period
			//current.changed = true ;
		}
	}
	else {
		//console.log( 'd before:' , current ) ;
		values = this[ key ]
			.map( expression => expression.next( current[ key ] , max ) )
			.filter( v => v !== null ) ;

		//console.log( 'd v:' , values ) ;
		if ( ! values.length ) { return false ; }

		oldValue = current[ key ] ;	// Save that for day/weekday stuffs
		current[ key ] = Math.min( ... values ) ;
		current.changed = true ;
		//console.log( 'd after:' , current ) ;

		if ( key === 'day' && this.weekday ) {
			// Hard case, so from now on, we will just increment days until it match both

			current.weekday = ( current.weekday + current.day - oldValue ) % 7 ;
			if ( ! current.weekday ) { current.weekday = 7 ; }

			while (
				current.day <= max
				&& ! (
					isMatching =
						this.day.some( expression => expression.match( current.day , max ) )
						&& this.weekday.some( expression => expression.match( current.weekday , 7 ) )
				)
			) {
				//console.log( 'w+d before:' , current ) ;
				current.day ++ ;
				current.weekday = ( current.weekday + 1 ) % 7 ;
				if ( current.weekday === 0 ) { current.weekday = 7 ; }
				//console.log( 'w+d after:' , current ) ;
			}

			if ( ! isMatching ) { return false ; }
		}
	}

	// Remove sub-levels
	for ( index = level + 1 ; index < SUBLEVEL_KEYS.length ; index ++ ) {
		delete current[ SUBLEVEL_KEYS[ index ] ] ;
	}

	// Found!
	if ( level + 1 >= SUBLEVEL_KEYS.length ) { return true ; }

	return this._next( current , level + 1 ) ;
} ;



TimeMatcher.prototype.toExpressions = function( data ) {
	if ( Array.isArray( data ) ) {
		return data.map( expression => expression instanceof Expression ? expression : Expression.from( expression ) ) ;
	}

	if ( typeof data !== 'string' ) { return null ; }
	if ( ! data ) { return null ; }
	return data.split( ',' ).map( part => Expression.parse( part ) ) ;
} ;



// Expression class

function Expression( data ) {
	Object.assign( this , data ) ;
}

TimeMatcher.Expression = Expression ;



Expression.from = function( data ) {
	if ( data && typeof data === 'object' ) { return new Expression( data ) ; }
	if ( typeof data === 'string' ) { return Expression.parse( data ) ; }
	return null ;
} ;



/*
	Flags TODO:
	* when matching, rather than returning true/false, we should return false/S/M/E/U (no match or match + related flag)
	* .next() should be refactored to be able to outpout that flag
*/



// Unique, Start, Middle, End
const FLAGS = new Set( [ 'U' , 'S' , 'M' , 'E' ] ) ;

Expression.parse = function( str ) {
	var match , flags ;

	if ( ( match = str.match( /^\[([USME]+)]/ ) ) ) {
		// There are flags

		flags = {} ;

		[ ... match[ 1 ] ].forEach( letter => {
			if ( FLAGS.has( letter ) ) { flags[ letter ] = true ; }
		} ) ;

		str = str.slice( match[ 0 ].length ) ;
	}

	/*
		Flags imply a '*' expression to match everything, as one single range
	*/

	if ( str === '*' ) {
		// Any
		return new Expression( { type: 'any' , flags } ) ;
	}

	if ( str.match( /^[0-9]+$/ ) ) {
		// Exact value
		return new Expression( { type: 'exact' , value: + str , flags } ) ;
	}

	if ( ( match = str.match( /^([0-9]+)L$/ ) ) ) {
		// Exact value last value
		return new Expression( { type: 'exactLast' , value: + match[ 1 ] , flags } ) ;
	}

	if ( ( match = str.match( /^([0-9]+)-([0-9]+)$/ ) ) ) {
		// Range
		return new Expression( {
			type: 'range' , start: + match[ 1 ] , end: + match[ 2 ] , flags
		} ) ;
	}

	if ( ( match = str.match( /^([0-9]+)L-([0-9]+)L$/ ) ) ) {
		// Range last
		return new Expression( {
			type: 'rangeLast' , start: + match[ 1 ] , end: + match[ 2 ] , flags
		} ) ;
	}

	if ( ( match = str.match( /^\/([0-9]+)([+-][0-9]+)?$/ ) ) ) {
		// Every
		return new Expression( {
			type: 'every' , period: + match[ 1 ] , phase: + match[ 2 ] || 0 , flags
		} ) ;
	}

	throw new SyntaxError( 'Bad TimeMatcher expression: ' + str ) ;
} ;



Expression.prototype.toString = function() {
	var flags = '' ;

	if ( this.flags ) {
		Object.keys( this.flags ).forEach( key => {
			if ( this.flags[ key ] && FLAGS.has( key ) ) { flags += key ; }
		} ) ;

		if ( flags ) { flags = '[' + flags + ']' ; }
	}

	switch ( this.type ) {
		case 'any' :
			return flags + '*' ;
		case 'exact' :
			return flags + '' + this.value ;
		case 'exactLast' :
			return flags + '' + this.value + 'L' ;
		case 'range' :
			return flags + '' + this.start + '-' + this.end ;
		case 'rangeLast' :
			return flags + '' + this.start + 'L-' + this.end + 'L' ;
		case 'every' :
			if ( this.phase > 0 ) {
				return flags + '/' + this.period + '+' + this.phase ;
			}
			if ( this.phase < 0 ) {
				return flags + '/' + this.period + '-' + this.phase ;
			}
			return flags + '/' + this.period ;
	}

	return '' ;
} ;



Expression.prototype.match = function( value , max = null , flag ) {
	if ( max !== null && value > max ) { return null ; }

	//console.log( flag , this.flags ) ;
	if ( flag && this.flags && ! this.flags[ flag ] ) { return false ; }

	switch ( this.type ) {
		case 'any' :
			return 'U' ;
		case 'exact' :
			if ( value === this.value ) { return 'U' ; }
			return false ;
		case 'exactLast' :
			if ( max === null ) { return false ; }
			if ( value === max + 1 - this.value ) { return 'U' ; }
			return false ;
		case 'range' :
			if ( value < this.start || value > this.end ) { return false ; }
			if ( value === this.start ) { return 'S' ; }
			if ( value === this.end ) { return 'E' ; }
			return 'M' ;
		case 'rangeLast' :
			if ( max === null ) { return false ; }
			if ( value < max + 1 - this.start || value > max + 1 - this.end ) { return false ; }
			if ( value === max + 1 - this.start ) { return 'S' ; }
			if ( value === max + 1 - this.end ) { return 'E' ; }
			return 'M' ;
		case 'every' :
			if ( ( value - this.phase ) % this.period === 0 ) { return 'U' ; }
			return false ;
	}
} ;



Expression.prototype.next = function( value , max = null ) {
	var next ;

	if ( max !== null && value > max ) { return null ; }

	switch ( this.type ) {
		case 'exact' :
			next = this.value ;
			break ;
		case 'exactLast' :
			if ( max === null ) { return false ; }
			next = max + 1 - this.value ;
			break ;
		case 'range' :
			next = this.start ;
			break ;
		case 'rangeLast' :
			if ( max === null ) { return false ; }
			next = max + 1 - this.start ;
			break ;
		case 'every' :
			next = value + this.period - ( value - this.phase ) % this.period ;
			break ;
	}

	if ( max !== null && next > max ) { return null ; }
	if ( value < next ) { return next ; }
	return null ;
} ;

