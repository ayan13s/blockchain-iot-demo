/*
 * Module dependencies
 */
var Cloudant = require('cloudant');
var express = require('express')
var app = express()
http = require('http')
https = require('https')
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.use(express.logger('dev'))
app.use(express.bodyParser());
app.use(express.static(__dirname + '/public'))
var moment = require('moment');
var v_createdt = moment().format('DD-MMM-YYYY');
var selectedVehicle;
resetSelectedVehicle();

function resetSelectedVehicle() {
	selectedVehicle = { 
			assetID : "",
			createDate : "",
			ownerName : "",
			numberPlate : "",
			lastEventDate : "",
			lastEvent : "",
			headers : {'Content-Type':'application/json'},
		};
}	
// Blockchain credentials Start
// ***********************************************
var blk_chaincode = "52566393afc3306d542f3d817238869c40e65881819b36d18cbcf5b3f51caed388dc2410293ec1d34657fbf0feab2de10a3d2723121fbb4d802f329281560d42";

var config = {
		host: "948a26d0bd9c4d02b1e7faaf03f03efa-vp0.us.blockchain.ibm.com", 
		port: "5003", 
		secure_context: "user_type1_2", 
		enroll_secret: "1b6247a511",
		protocol: "https",
		debug_mode: true,
		chaincodeURL: "https://948a26d0bd9c4d02b1e7faaf03f03efa-vp0.us.blockchain.ibm.com:5003/chaincode",
		name: blk_chaincode,
		path: blk_chaincode,
		messageId: "",
		contract_version: "1.0",
		timeout: 3000,
		template: {
						"jsonrpc": "2.0",
						"method": "{{method}}",
						"params": {
							"type": 1,
							"chaincodeID":{
								"name":"mycc",
							},
							"ctorMsg": {
								"function":"{{function}}",
								"args":[],
							},
							"secureContext": "user_type1_2",
						},
						"id": 0
					},
	};

var options = { 
		url : config.chaincodeURL,
		host: config.host,
		port: config.port,
		path: '/chaincode',
		method: 'POST',
		headers : {'Content-Type':'application/json'},
	};

var queryBody = config.template;
var createBody = config.template;
if (config.debug_mode) {
	queryBody.params.chaincodeID.name = blk_chaincode;
	createBody.params.chaincodeID.name = blk_chaincode;
} else {
	queryBody.params.chaincodeID.path = blk_chaincode;
	createBody.params.chaincodeID.path = blk_chaincode;
}

// ***********************************************
// Blockchain credentials End

// Cloudant credentials Start
// ***********************************************

var cloudant = Cloudant("https://ca9e09df-6fea-486b-9ad7-eabbb48230f0-bluemix:645c9ae8b00eee5d4ad7b65dd8552eb315ecc677f87fe990a9a01fadca1ab9a7@ca9e09df-6fea-486b-9ad7-eabbb48230f0-bluemix.cloudant.com");
var db = cloudant.db.use('blockchain_db');
var db_vehicle_list;

db.list({include_docs:true}, function (err, data) {
	  db_vehicle_list = data;
	});

// ***********************************************
// Cloudant credentials End

//IOTF credentials Start
//***********************************************
/*
var carprobesamplejsonfilename = 'carprobesample.json';

var fs = require('fs');
var path = require('path');
//var sleep = require('sleep');
var ibmiotfclient = require('ibmiotf');

var iotfdeviceconfig = {
	    "org" : "vyd5eg",
	    "id" : "vehicle-sample",
	    "domain": "internetofthings.ibmcloud.com",
	    "type" : "Vehicle",
	    "auth-method" : "token",
	    "auth-token" : "bv1FoLMsyXU3hiYdW_"
	};

var iotDeviceConnectionStatus = false;
var processingStatus = "";

var deviceClient = new ibmiotfclient.IotfDevice(iotfdeviceconfig);

deviceClient.log.setLevel('trace');

deviceClient.on('connect', function () {
        iotDeviceConnectionStatus = true;
        console.log("Device is connected.");
        sendCarOnboardRawDataToIoT('12345', '2017-02-01', 'good');
    });

deviceClient.connect();

function sendCarOnboardRawDataToIoT(assetid, drivedate, goodorbad) {
    
    if(! iotDeviceConnectionStatus) {
        console.log("Device is not connected.");
        return;
    }
    
    const GOOD_DELAY = 3; // seconds
    const BAD_DELAY = 1;  // seconds
    
    var carprobesampledata = JSON.parse(fs.readFileSync(carprobesamplejsonfilename, 'utf8'));
    
    var delay = ('good' === goodorbad.toLowerCase()) ? GOOD_DELAY : BAD_DELAY;
    
    var totalcount = carprobesampledata.length / delay;

    var datatopublish = JSON.parse('{ "d": "" }');
    
    for(var i = 0; i < totalcount; i++) {
        processingStatus = "Capturing car data "+(i+1)+"/"+totalcount;
        console.log(processingStatus);
        datatopublish.d = carprobesampledata[i];
        var driveTimestamp = new Date().toISOString();
        // Concoct a timestamp taking drive date and current time of the server
        datatopublish.d.timestamp = drivedate + 'T' + driveTimestamp.substr(10,driveTimestamp.length);
        datatopublish.d.trip_id = drivedate;
        console.log(JSON.stringify(datatopublish));
        //publishing event using the default quality of service
        deviceClient.publish("status", "json", JSON.stringify(datatopublish));
        sleep.sleep(delay);
    }
    return;
}
*/
//***********************************************
//IOTF credentials End

app.post('/find-submit', function(req1, res1) {
	var selected_vehicle = req1.body.veh_select;
	var selected_vin;
	
	// Don't do anything if "Select Vehicle" is selected from the dropdown
	if (selected_vehicle == '' || selected_vehicle == 'undefined' || selected_vehicle == null)
		res1.render('index', { title : 'Home', moment: moment, vehicleList : db_vehicle_list});
	
	// Fetch the vin from cloudant document for selected vehicle
	for (i = 0; db_vehicle_list.rows.length > i; i ++) {
	    if (db_vehicle_list.rows[i].id == selected_vehicle)
	    	selected_vin = db_vehicle_list.rows[i].doc.vin;
	}

	// Prepare the rest body for readAsset
	queryBody.method = 'query';
	queryBody.params.ctorMsg.function = 'readAsset';
	queryBody.params.ctorMsg.args = [ "{\"assetID\":\""+selected_vin+"\"}"];
	
	console.log('Options - ' + JSON.stringify(options));
	console.log('queryBody - ' + JSON.stringify(queryBody));
	
	var raw_str;
	
	// Call blockchain readAsset function using rest api
	https.request(options, function(res2) {
		  console.log('STATUS: ' + res2.statusCode);
		  console.log('HEADERS: ' + JSON.stringify(res2.headers));
		  res2.setEncoding('utf8');
		  res2.on('data', function (chunk) {
		    console.log('BODY: ' + chunk);
		    raw_str+=chunk;
		    var json_str = eval('(' + chunk + ')');
		    var json_msg = eval('(' + json_str.result.message + ')');
		    console.log(json_msg);
		    selectedVehicle.assetID = json_msg.assetID;
		    selectedVehicle.createDate = json_msg.createDate;
		    selectedVehicle.ownerName = json_msg.ownerName;
		    selectedVehicle.numberPlate = json_msg.numberPlate;
		    selectedVehicle.lastEventDate = moment(new Date(json_msg.txntimestamp)).format('DD-MMM-YYYY');
		    res1.render('index', { title : 'Home', moment: moment, selectedVehicle : selectedVehicle, vehicleList : db_vehicle_list });
		    		
		  });
		}).end(JSON.stringify(queryBody));
	
});

app.post('/reg-submit', function(req3, res3) {

	var input_ownerName = req3.body.input_ownerName;
	var input_vin = req3.body.input_vin;
	var input_numberPlate = req3.body.input_numberPlate;
	console.log('Selected vehicle : input_ownerName - ' + input_ownerName + ', input_vin - ' + input_vin + ', input_numberPlate - ' + input_numberPlate + ', create date - ' + v_createdt);
	
	// Prepare the rest body for createAsset
	createBody.method = 'invoke';
	createBody.params.ctorMsg.function = 'createAsset';
	createBody.params.ctorMsg.args = ["{\"assetID\":\""+ input_vin +"\",\"ownerName\":\""+ input_ownerName +"\",\"createDate\":\""+ v_createdt +"\",\"numberPlate\":\""+ input_numberPlate +"\"}"];
	
	console.log(queryBody.params.ctorMsg.args);
	
	// Call blockchain createAsset function using rest api
	https.request(options, function(res4) {
		  console.log('Create Asset STATUS: ' + res4.statusCode);
		  console.log('HEADERS: ' + JSON.stringify(res4.headers));
		  res4.setEncoding('utf8');
		  res4.on('data', function (chunk) {
		    console.log('BODY: ' + chunk);
		  });
	
	// Prepare the vehicle JSON structure for inserting into cloudant
	var vehicle = {
			vin: input_vin,
			owner: input_ownerName,
			number: input_numberPlate,
			status: 'active',
			createDate: v_createdt
		};
	var v_id = input_vin + ' - ' + input_numberPlate;
	
	// Insert the vehicle into Cloudant
	db.insert(vehicle, v_id, function(err, body, header) {
	    if (err) {
	      return console.log(v_id + ' -- [insert] ', err.message);
	    }
	    console.log('You have inserted - ' + v_id);
	    console.log(body);
	    // Update the vehicle list for dropdown
	    db.list({include_docs:true}, function (err, data1) {
	  	  db_vehicle_list = data1;
		  selectedVehicle.assetID = input_vin;
		  selectedVehicle.createDate = v_createdt;
		  selectedVehicle.ownerName = input_ownerName;
		  selectedVehicle.numberPlate = input_numberPlate;
		  selectedVehicle.lastEventDate = v_createdt;
	  	  res3.render('index', { title : 'Home', moment: moment, selectedVehicle : selectedVehicle, vehicleList : db_vehicle_list});
	  	});
	  });

	}).end(JSON.stringify(createBody));	
	
});

app.post('/sim-submit', function(req5, res5) {
	console.log("simulation trigger -" + req5.body.submit_sim);
	res5.render('index', { title : 'Home', moment: moment, selectedVehicle : selectedVehicle, vehicleList : db_vehicle_list, sim_triggered : 'true'});
});

app.get('/history-submit', function (req, res) {
	  res.render('history');
	})

app.get('/', function (req, res) {
	  res.render('index', { title : 'Home', selectedVehicle : selectedVehicle, moment: moment, vehicleList : db_vehicle_list})
	})

app.listen(8080);


