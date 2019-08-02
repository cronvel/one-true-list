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
const DateTime = luxon.DateTime ;
const TimeMatcher = require( '../lib/TimeMatcher.js' ) ;



describe( "TimeMatcher#match()" , () => {
	
	it( "exact match" , () => {
		expect( new TimeMatcher( { month: '8' } ).match( DateTime.fromISO( '2019-08-02' ) ) ).to.be( true ) ;
		expect( new TimeMatcher( { month: '8' } ).match( DateTime.fromISO( '2001-08-02' ) ) ).to.be( true ) ;
		expect( new TimeMatcher( { month: '8' } ).match( DateTime.fromISO( '2019-09-02' ) ) ).to.be( false ) ;
		expect( new TimeMatcher( { month: '8' , day: '1' } ).match( DateTime.fromISO( '2019-08-01' ) ) ).to.be( true ) ;
	} ) ;
	
	it( "weekday" , () => {
		expect( new TimeMatcher( { weekday: '5' } ).match( DateTime.fromISO( '2019-08-01' ) ) ).to.be( false ) ;
		expect( new TimeMatcher( { weekday: '5' } ).match( DateTime.fromISO( '2019-08-02' ) ) ).to.be( true ) ;
		expect( new TimeMatcher( { weekday: '4' } ).match( DateTime.fromISO( '2019-08-02' ) ) ).to.be( false ) ;
	} ) ;
	
	it( "range" , () => {
		// Range
		expect( new TimeMatcher( { day: '2-5' } ).match( DateTime.fromISO( '2019-08-01' ) ) ).to.be( false ) ;
		expect( new TimeMatcher( { day: '2-5' } ).match( DateTime.fromISO( '2019-08-02' ) ) ).to.be( true ) ;
		expect( new TimeMatcher( { day: '2-5' } ).match( DateTime.fromISO( '2019-08-03' ) ) ).to.be( true ) ;
		expect( new TimeMatcher( { day: '2-5' } ).match( DateTime.fromISO( '2019-08-04' ) ) ).to.be( true ) ;
		expect( new TimeMatcher( { day: '2-5' } ).match( DateTime.fromISO( '2019-08-05' ) ) ).to.be( true ) ;
		expect( new TimeMatcher( { day: '2-5' } ).match( DateTime.fromISO( '2019-08-06' ) ) ).to.be( false ) ;
	} ) ;
} ) ;



describe( "TimeMatcher#next()" , () => {

	function computeNext( pattern , isoDate ) {
		var result = new TimeMatcher( pattern ).next( DateTime.fromISO( isoDate ) ) ;
		if ( ! result ) { return null ; }
		return {
			year: result.year ,
			month: result.month ,
			day: result.day ,
			weekday: result.weekday ,
			hour: result.hour ,
			minute: result.minute ,
		} ;
	}

	it( "exact" , () => {
		expect( computeNext( { month: '8' , day: '1' } , '2019-08-01' ) ).to.be.partially.like( { year: 2020 , month: 8 , day: 1 } ) ;
		expect( computeNext( { month: '8' , day: '1' } , '2019-08-01' ) ).to.be.partially.like( { year: 2020 , month: 8 , day: 1 } ) ;
		expect( computeNext( { month: '9' , day: '1' } , '2019-08-01' ) ).to.be.partially.like( { year: 2019 , month: 9 , day: 1 } ) ;
	} ) ;

	it( "range" , () => {
		expect( computeNext( { month: '3-5,8-10' } , '2019-02-01' ) ).to.be.partially.like( { year: 2019 , month: 3 , day: 1 } ) ;
		expect( computeNext( { month: '3-5,8-10' } , '2019-03-01' ) ).to.be.partially.like( { year: 2019 , month: 8 , day: 1 } ) ;
		expect( computeNext( { month: '3-5,8-10' } , '2019-05-01' ) ).to.be.partially.like( { year: 2019 , month: 8 , day: 1 } ) ;
		expect( computeNext( { month: '3-5,8-10' } , '2019-06-01' ) ).to.be.partially.like( { year: 2019 , month: 8 , day: 1 } ) ;
		expect( computeNext( { month: '3-5,8-10' } , '2019-08-01' ) ).to.be.partially.like( { year: 2020 , month: 3 , day: 1 } ) ;

		expect( computeNext( { day: '1-7' } , '2019-07-30' ) ).to.be.partially.like( { year: 2019 , month: 8 , day: 1 } ) ;
	} ) ;

	it( "weekday" , () => {
		expect( computeNext( { weekday: '6' } , '2019-08-01' ) ).to.be.partially.like( { year: 2019 , month: 8 , day: 3 } ) ;
		expect( computeNext( { weekday: '7' } , '2019-08-01' ) ).to.be.partially.like( { year: 2019 , month: 8 , day: 4 } ) ;
		expect( computeNext( { weekday: '1' } , '2019-08-01' ) ).to.be.partially.like( { year: 2019 , month: 8 , day: 5 } ) ;
		expect( computeNext( { weekday: '2' } , '2019-08-01' ) ).to.be.partially.like( { year: 2019 , month: 8 , day: 6 } ) ;

		// Check month end
		expect( computeNext( { weekday: '3' } , '2019-07-30' ) ).to.be.partially.like( { year: 2019 , month: 7 , day: 31 } ) ;
		expect( computeNext( { weekday: '4' } , '2019-07-30' ) ).to.be.partially.like( { year: 2019 , month: 8 , day: 1 } ) ;
		expect( computeNext( { weekday: '5' } , '2019-07-30' ) ).to.be.partially.like( { year: 2019 , month: 8 , day: 2 } ) ;
		expect( computeNext( { weekday: '6' } , '2019-07-30' ) ).to.be.partially.like( { year: 2019 , month: 8 , day: 3 } ) ;
		expect( computeNext( { weekday: '7' } , '2019-07-30' ) ).to.be.partially.like( { year: 2019 , month: 8 , day: 4 } ) ;
		expect( computeNext( { weekday: '1' } , '2019-07-30' ) ).to.be.partially.like( { year: 2019 , month: 8 , day: 5 } ) ;
		expect( computeNext( { weekday: '2' } , '2019-07-30' ) ).to.be.partially.like( { year: 2019 , month: 8 , day: 6 } ) ;
		expect( computeNext( { weekday: '4' } , '2019-07-31' ) ).to.be.partially.like( { year: 2019 , month: 8 , day: 1 } ) ;
	} ) ;

	it( "weekday + day range" , () => {
		expect( computeNext( { weekday: '1' , day: '1-7' } , '2019-07-30' ) ).to.be.partially.like( { year: 2019 , month: 8 , day: 5 } ) ;
	} ) ;
} ) ;

