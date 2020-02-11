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



const luxon = require( 'luxon' ) ;
const DateTime = luxon.DateTime ;
const TimeMatcher = require( '../lib/TimeMatcher.js' ) ;



describe( "TimeMatcher#match()" , () => {
	
	function computeMatch( pattern , isoDate ) {
		return new TimeMatcher( pattern ).match( DateTime.fromISO( isoDate ) ) ;
	}
	
	it( "exact match" , () => {
		expect( computeMatch( { month: '8' } , '2019-08-02' ) ).to.be( true ) ;
		expect( computeMatch( { month: '8' } , '2001-08-02' ) ).to.be( true ) ;
		expect( computeMatch( { month: '8' } , '2019-09-02' ) ).to.be( false ) ;
		expect( computeMatch( { month: '8' , day: '1' } , '2019-08-01' ) ).to.be( true ) ;
	} ) ;
	
	it( "range" , () => {
		expect( computeMatch( { day: '2-5' } , '2019-08-01' ) ).to.be( false ) ;
		expect( computeMatch( { day: '2-5' } , '2019-08-02' ) ).to.be( true ) ;
		expect( computeMatch( { day: '2-5' } , '2019-08-03' ) ).to.be( true ) ;
		expect( computeMatch( { day: '2-5' } , '2019-08-04' ) ).to.be( true ) ;
		expect( computeMatch( { day: '2-5' } , '2019-08-05' ) ).to.be( true ) ;
		expect( computeMatch( { day: '2-5' } , '2019-08-06' ) ).to.be( false ) ;
	} ) ;

	it( "range last" , () => {
		expect( computeMatch( { day: '5L-2L' } , '2019-08-01' ) ).to.be( false ) ;
		expect( computeMatch( { day: '5L-2L' } , '2019-08-03' ) ).to.be( false ) ;
		expect( computeMatch( { day: '5L-2L' } , '2019-08-26' ) ).to.be( false ) ;
		expect( computeMatch( { day: '5L-2L' } , '2019-08-27' ) ).to.be( true ) ;
		expect( computeMatch( { day: '5L-2L' } , '2019-08-28' ) ).to.be( true ) ;
		expect( computeMatch( { day: '5L-2L' } , '2019-08-30' ) ).to.be( true ) ;
		expect( computeMatch( { day: '5L-2L' } , '2019-08-31' ) ).to.be( false ) ;
	} ) ;

	it( "every" , () => {
		expect( computeMatch( { month: '/3' } , '2019-08-01' ) ).to.be( false ) ;
		expect( computeMatch( { month: '/3' } , '2019-09-01' ) ).to.be( true ) ;
		expect( computeMatch( { month: '/3' } , '2019-10-01' ) ).to.be( false ) ;

		expect( computeMatch( { month: '/3+1' } , '2019-08-01' ) ).to.be( false ) ;
		expect( computeMatch( { month: '/3+1' } , '2019-09-01' ) ).to.be( false ) ;
		expect( computeMatch( { month: '/3+1' } , '2019-10-01' ) ).to.be( true ) ;
		expect( computeMatch( { month: '/3+1' } , '2019-11-01' ) ).to.be( false ) ;
	} ) ;

	it( "weekday" , () => {
		expect( computeMatch( { weekday: '5' } , '2019-08-01' ) ).to.be( false ) ;
		expect( computeMatch( { weekday: '5' } , '2019-08-02' ) ).to.be( true ) ;
		expect( computeMatch( { weekday: '4' } , '2019-08-02' ) ).to.be( false ) ;
	} ) ;

	it( "flag S pattern should activate only if at the start of a parent range" , () => {
		expect( computeMatch( { weekday: '5-7' , hour: '[S]19-23,[E]*' } , '2019-08-02T18:00' ) ).to.be( false ) ;
		expect( computeMatch( { weekday: '5-7' , hour: '[S]19-23,[UME]*' } , '2019-08-02T19:00' ) ).to.be( true ) ;
		expect( computeMatch( { weekday: '5-7' , hour: '[S]19-23,[UME]*' } , '2019-08-03T18:00' ) ).to.be( true ) ;
	} ) ;
	
	it( "flag E pattern should activate only if at the end of a parent range" ) ;
	it( "flag M pattern should activate only if in the middle of a parent range (not the start and not the end)" ) ;
	it( "flag U (unique) pattern should activate only if the parent is not a range" ) ;
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
		expect( computeNext( { weekday: '1' , day: '1-7' } , '2018-12-10' ) ).to.be.partially.like( { year: 2019 , month: 1 , day: 7 } ) ;
		expect( computeNext( { weekday: '1' , day: '1-7' } , '2019-05-10' ) ).to.be.partially.like( { year: 2019 , month: 6 , day: 3 } ) ;
		expect( computeNext( { weekday: '1' , day: '1-7' } , '2019-06-10' ) ).to.be.partially.like( { year: 2019 , month: 7 , day: 1 } ) ;
		expect( computeNext( { weekday: '1' , day: '1-7' } , '2019-07-30' ) ).to.be.partially.like( { year: 2019 , month: 8 , day: 5 } ) ;
		expect( computeNext( { weekday: '1' , day: '1-7' } , '2019-07-31' ) ).to.be.partially.like( { year: 2019 , month: 8 , day: 5 } ) ;
		expect( computeNext( { weekday: '1' , day: '1-7' } , '2019-08-01' ) ).to.be.partially.like( { year: 2019 , month: 9 , day: 2 } ) ;

		expect( computeNext( { weekday: '7' , day: '7L-1L' } , '2019-08-01' ) ).to.be.partially.like( { year: 2019 , month: 8 , day: 25 } ) ;
		expect( computeNext( { weekday: '7' , day: '7L-1L' } , '2019-08-15' ) ).to.be.partially.like( { year: 2019 , month: 8 , day: 25 } ) ;
		expect( computeNext( { weekday: '7' , day: '7L-1L' } , '2019-09-10' ) ).to.be.partially.like( { year: 2019 , month: 9 , day: 29 } ) ;
		expect( computeNext( { weekday: '7' , day: '7L-1L' } , '2019-06-10' ) ).to.be.partially.like( { year: 2019 , month: 6 , day: 30 } ) ;
	} ) ;

	it( "hour and minute" , () => {
		expect( computeNext( { hour: '15-16' } , '2018-12-10T11:00' ) ).to.be.partially.like( { year: 2018 , month: 12 , day: 10 , hour: 15 } ) ;
		expect( computeNext( { minute: '15-16' } , '2018-12-10T11:00' ) ).to.be.partially.like( { year: 2018 , month: 12 , day: 10 , hour: 11 , minute: 15 } ) ;
	} ) ;
	
	it( ".next() + flags" ) ;
} ) ;

