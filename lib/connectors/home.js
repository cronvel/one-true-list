
"use strict" ;


const path = require( 'path' ) ;
const os = require( 'os' ) ;
const fs = require( 'fs' ) ;
const fsKit = require( 'fs-kit' ) ;
const hash = require( 'hash-kit' ) ;
const ErrorStatus = require( 'error-status' ) ;

const Logfella = require( 'logfella' ) ;
const log = Logfella.global.use( 'todo:home' ) ;

const packageJson = require( '../../package.json' ) ;
const homeDir = exports.homeDir = path.join( os.homedir() , '.local' , 'share' , packageJson.name , 'home' ) ;



exports.get = async function( parsedUrl ) {
	var data ,
		filePath = path.join( homeDir , parsedUrl.path ) + '.json' ;
	
	try {
		data = JSON.parse( await fs.readFileAsync( filePath , 'utf8' ) ) ;
	}
	catch ( error ) {
		if ( error.code === 'ENOENT' ) {
			throw ErrorStatus.notFound( "File " + filePath + " not found" ) ;
		}
		
		throw error ;
	}
	
	return data ;
} ;



exports.put = async function( parsedUrl , data ) {
	var filePath = path.join( homeDir , parsedUrl.path ) + '.json' ,
		fileDir = path.dirname( filePath ) ;
	
	await fsKit.ensurePathAsync( fileDir ) ;
	await fs.writeFileAsync( filePath , JSON.stringify( data , null , '\t' ) ) ;
} ;



exports.post = async function( parsedUrl , data ) {
	var fileDir = path.join( homeDir , parsedUrl.path ) ,
		id = hash.uniqueId() ,
		filePath = path.join( fileDir , id ) + '.json' ;
	
	await fsKit.ensurePathAsync( fileDir ) ;
	await fs.writeFileAsync( filePath , JSON.stringify( data , null , '\t' ) ) ;
	
	return id ;
} ;



exports.delete = async function( parsedUrl , data ) {
	var filePath = path.join( homeDir , parsedUrl.path ) + '.json' ,
		fileDir = path.join( homeDir , parsedUrl.path ) ;
	
	await fs.unlinkAsync( filePath ) ;
	await fsKit.deltreeAsync( fileDir ) ;
} ;

