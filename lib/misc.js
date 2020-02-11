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



exports.fibonacciValue = v => {
	if ( v <= 0 ) { return 0 ; }
	if ( v <= 1 ) { return 1 ; }
	if ( v <= 2 ) { return 2 ; }
	if ( v <= 3 ) { return 3 ; }
	if ( v <= 5 ) { return 5 ; }
	if ( v <= 8 ) { return 8 ; }
	if ( v <= 13 ) { return 13 ; }
	if ( v <= 21 ) { return 21 ; }
	if ( v <= 34 ) { return 34 ; }
	if ( v <= 55 ) { return 55 ; }
	return 100 ;
} ;



exports.toBoolean = v => {
	if ( typeof v === 'string' ) {
		switch ( v.toLowerCase() ) {
			case '1' :
			case 'yes' :
			case 'on' :
			case 'true' :
				return true ;
			case '0' :
			case 'no' :
			case 'off' :
			case 'false' :
				return false ;
			default :
				return false ;
		}
	}
	else {
		return !! v ;
	}
} ;

