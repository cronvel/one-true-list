
"use strict" ;

const ErrorStatus = require( 'error-status' ) ;

exports.get = function() {
	throw ErrorStatus.notFound( "Dummy connector: always respond not found for GET" ) ;
} ;

exports.put = async function() {
	throw ErrorStatus.forbidden( "Dummy connector: always respond forbidden for PUT" ) ;
} ;

exports.post = async function() {
	throw ErrorStatus.forbidden( "Dummy connector: always respond forbidden for POST" ) ;
} ;

exports.delete = async function() {
	throw ErrorStatus.forbidden( "Dummy connector: always respond forbidden for DELETE" ) ;
} ;

