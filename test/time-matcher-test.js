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
const TimeMatcher = require( '../lib/TimeMatcher.js' ) ;



describe( "TimeMatcher" , () => {
	
	it( "TimeMatcher#next()" , () => {
		expect( new TimeMatcher( { month: '8' , day: '1' } ).next( new Date( '2019-08-01' ) ) ).to.be.partially.like( { year: 2020 , month: 8 , day: 1 } ) ;
		expect( new TimeMatcher( { month: '9' , day: '1' } ).next( new Date( '2019-08-01' ) ) ).to.be.partially.like( { year: 2019 , month: 9 , day: 1 } ) ;
	} ) ;
} ) ;

