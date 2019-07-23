
"use strict" ;



const Subscriber = require( './Subscriber.js' ) ;
const TerminalApp = require( './clients/terminal/App.js' ) ;
const homeConnector = require( './connectors/home.js' ) ;

const defaultConfig = require( './defaultConfig.js' ) ;

const path = require( 'path' ) ;
const os = require( 'os' ) ;
const fs = require( 'fs' ) ;
const fsKit = require( 'fs-kit' ) ;
const term = require( 'terminal-kit' ).terminal ;

require( './patches.js' ) ;

const cliManager = require( 'utterminal' ).cli ;

const Logfella = require( 'logfella' ) ;
const log = Logfella.global.use( 'todo' ) ;

const packageJson = require( '../package.json' ) ;
const appHomeDir = exports.homeDir = path.join( os.homedir() , '.local' , 'share' , packageJson.name ) ;



async function cli() {
	cliManager.package( packageJson )
		.helpOption
		.logOptions ;
	
	var args = cliManager.run() ;
	
	var config ,
		configPath = path.join( appHomeDir , 'config.json' ) ;

	await fsKit.ensurePathAsync( appHomeDir ) ;

	try {
		config = Object.assign( {} , defaultConfig , require( configPath ) ) ;
	}
	catch ( error ) {
		config = Object.assign( {} , defaultConfig ) ;
	}
	
	await cli.saveConfig( config , configPath ) ;
	
	config = cliManager.mergeConfig( args , config ) ;
	
	config.appHomeDir = appHomeDir ;

	var subscriber = new Subscriber( { url: config.subscriberUrl } ) ;
	
	try {
		await subscriber.load() ;
	}
	catch ( error ) {
		// Tmp?
		log.debug( "Create a default subscriber" ) ;
		await subscriber.save() ;
	}

	var ui = new TerminalApp( subscriber , config ) ;
	ui.start() ;
}

module.exports = cli ;



cli.saveConfig = function( config , configPath ) {
	return fs.writeFileAsync( configPath , JSON.stringify( config , null , '\t' ) ) ;
} ;

