/*
 * Module dependencies
 */
var Cloudant = require('cloudant');
var express = require('express')
var app = express()
http = require('http')
https = require('https')
request = require('request')
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
			sim_status_id : "0",
			sim_status_desc : "To be started",
			job_id : "",
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

//Driver analysis credentials Start
//***********************************************

var driver_url = "https://automotive.internetofthings.ibmcloud.com";
var driver_path = "/driverinsights/jobcontrol/job?tenant_id=72beca9d-37a9-45c6-b792-dcdcfadcfd5d";
var driver_uid = "auE8ypsg";
var driver_pwd = "ujXyi!f6LsHeds";
var auth = 'Basic ' + new Buffer(driver_uid + ':' + driver_pwd).toString('base64');
//var auth = 'auE8ypsg:ujXyi!f6LsHeds';


//***********************************************
//Driver analysis credentials End

//IOTF credentials Start
//***********************************************

var carprobesamplejsonfilename = 'carprobesample.json';

var fs = require('fs');
var path = require('path');

var carprobesampledata = JSON.parse(fs.readFileSync(carprobesamplejsonfilename, 'utf8'));

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
var iotDataSent = false;
var processingStatus = "";

var deviceClient = new ibmiotfclient.IotfDevice(iotfdeviceconfig);

deviceClient.log.setLevel('trace');

function sendCarOnboardRawDataToIoT(assetid, drivedate, goodorbad) {
    
	if(iotDataSent)
		return;
	deviceClient.connect();
	deviceClient.on('connect', function () {
    iotDeviceConnectionStatus = true;
    console.log("Device is connected.");
    //sendCarOnboardRawDataToIoT('12345', '2017-02-01', 'good');
    
    const GOOD_DELAY = 3; // seconds
    const BAD_DELAY = 1;  // seconds
    
    var carprobesampledata = JSON.parse(fs.readFileSync(carprobesamplejsonfilename, 'utf8'));
    
    var delay = ('good' === goodorbad.toLowerCase()) ? GOOD_DELAY : BAD_DELAY;
    
    var totalcount = carprobesampledata.length / delay;

    var datatopublish = JSON.parse('{ "d": "" }');

     
    for(var i = 0; i < totalcount; i++) {
    	var driveTimestamp = new Date().toISOString();
    	processingStatus = "Capturing car data "+(i+1)+"/"+totalcount;
        console.log(processingStatus);
        datatopublish.d = carprobesampledata[i];

        // Add a timestamp taking drive date and current time of the server
        datatopublish.d.timestamp = drivedate + driveTimestamp.substr(10,driveTimestamp.length);
        datatopublish.d.trip_id = assetid+ '_' + drivedate;
        console.log(JSON.stringify(datatopublish));
        //publishing event using the default quality of service
        deviceClient.publish("status", "json", JSON.stringify(datatopublish));
        sleep(delay*1000);
        function sleep(milliseconds) {
      	  var start = new Date().getTime();
      	  for (var i = 0; i < 1e7; i++) {
      	    if ((new Date().getTime() - start) > milliseconds){
      	      break;
      	    }
      	  }
      	}
    }
    console.log("End of IOT data sending...");
    iotDataSent = true;
    deviceClient.disconnect();
	selectedVehicle.sim_status_id = "1";
    });
}

//***********************************************
//IOTF credentials End

app.post('/find-submit', function(req1, res1) {
	resetSelectedVehicle();
	var selected_vehicle = req1.body.veh_select;
	var selected_vin;
	
	// Don't do anything if "Select Vehicle" is selected from the dropdown
	if (selected_vehicle == '' || selected_vehicle == 'undefined' || selected_vehicle == null)
	{
		res1.render('index', { title : 'Home', selectedVehicle : selectedVehicle, moment: moment, vehicleList : db_vehicle_list})
		return;
	}
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

	resetSelectedVehicle();
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
	var new_event_date = moment(selectedVehicle.lastEventDate, 'DD-MMM-YYYY').add(1, 'days').format('YYYY-MM-DD');
	selectedVehicle.sim_status_desc = "Sending simulation data to IOT platform...";
    sendCarOnboardRawDataToIoT(selectedVehicle.assetID, new_event_date, req5.body.submit_sim);
    res5.render('index', { title : 'Home', moment: moment, selectedVehicle : selectedVehicle, vehicleList : db_vehicle_list, sim_triggered : 'true'});
});

app.get('/sim-submit', function(req7, res7) {
	
	var path_str = "";
	var driver_path_post = "";
	if (selectedVehicle.sim_status_id=="1")
	{
		if(!iotDataSent)
			return;
		else
			iotDataSent = false;
		console.log("Initiating job....");
		var new_event_date_from = moment(selectedVehicle.lastEventDate, 'DD-MMM-YYYY').add(1, 'days').format('YYYY-MM-DD');
		var new_event_date_to = moment(selectedVehicle.lastEventDate, 'DD-MMM-YYYY').add(2, 'days').format('YYYY-MM-DD');
		path_str = "&from=" + new_event_date_from + "&to=" + new_event_date_to;
		console.log(path_str);
		driver_path_post = driver_url + driver_path + path_str;
	    request(
	        {
	            url : driver_path_post,
	            method : 'POST',
	            headers : {
	                "Authorization" : auth,
	                "content-Type" : 'application/x-www-form-urlencoded'
	            }
	        },
	        function (error, response, body) {
	        	var jsonbody = JSON.parse(body);
	        	selectedVehicle.job_id = jsonbody.job_id;
	        	selectedVehicle.sim_status_id = "2";
	        	selectedVehicle.sim_status_desc = "Driver analysis in progress. This might take couple of minutes. Job id = " + jsonbody.job_id;
		        res7.render('index', { title : 'Home', moment: moment, selectedVehicle : selectedVehicle, vehicleList : db_vehicle_list, sim_triggered : 'true'});
		});
	
	} else if (selectedVehicle.sim_status_id=="2")
	{
		path_str = "&job_id=" + selectedVehicle.job_id;
		driver_path_post = driver_url + driver_path + path_str;
	    request(
	        {
	            url : driver_path_post,
	            method : 'GET',
	            headers : {
	                "Authorization" : auth,
	                "content-Type" : 'application/x-www-form-urlencoded'
	            }
	        },
	        function (error, response, body) {
	        	var jbody_1 = JSON.parse(body);
	        	console.log(jbody_1);
	        	var sim_stat = jbody_1["job_status"];
	        	console.log("job status - " + sim_stat);
	        	if(sim_stat=="SUCCEEDED")
	        	{
	            	selectedVehicle.sim_status_id = "3";
		        	selectedVehicle.sim_status_desc = "Driver analysis is complete.. Fetching results...";
	        	}	
	        		
		        res7.render('index', { title : 'Home', moment: moment, selectedVehicle : selectedVehicle, vehicleList : db_vehicle_list, sim_triggered : 'true'});
		});
	} else if (selectedVehicle.sim_status_id=="3")
	{
		path_str = "&job_id=" + selectedVehicle.job_id;
		driver_path_post = "https://automotive.internetofthings.ibmcloud.com/driverinsights/drbresult/tripSummaryList?tenant_id=72beca9d-37a9-45c6-b792-dcdcfadcfd5d";
	    request(
	        {
	            url : driver_path_post,
	            method : 'GET',
	            headers : {
	                "Authorization" : auth,
	                "content-Type" : 'application/x-www-form-urlencoded'
	            }
	        },
	        function (error, response, body) {
	        	console.log(JSON.stringify(error));
	        	console.log(JSON.stringify(response));
	        	var jbody_1 = JSON.parse(body);
	        	console.log(jbody_1);
	    		driver_path_post = "https://automotive.internetofthings.ibmcloud.com/driverinsights/drbresult/trip?tenant_id=72beca9d-37a9-45c6-b792-dcdcfadcfd5d&trip_uuid=d750fe6f-b28a-498a-a7b1-06c9b98b4014";
	    	    request(
	    	        {
	    	            url : driver_path_post,
	    	            method : 'GET',
	    	            headers : {
	    	                "Authorization" : auth,
	    	                "content-Type" : 'application/x-www-form-urlencoded'
	    	            }
	    	        },
	    	        function (error1, response1, body1) {
	    	        	console.log(JSON.stringify(error1));
	    	        	console.log(JSON.stringify(response1));
	    	        	var jbody_1 = JSON.parse(body1);
	    	        	console.log(jbody_1);
	    	        	selectedVehicle.sim_status_id = "4";
	    	        	selectedVehicle.sim_status_desc = "Received trip details...";
	    	        	res7.render('index', { title : 'Home', moment: moment, selectedVehicle : selectedVehicle, vehicleList : db_vehicle_list, sim_triggered : 'true'});
	    		});
		});
	} 
});

app.get('/history-submit', function (req, res) {
	
	// Prepare the rest body for readAsset
	if (selectedVehicle.assetID == '' || selectedVehicle.assetID == 'undefined' || selectedVehicle.assetID == null)
	{
	  res.render('history', {title : 'Home', vehicleHistory : ''});
	  return;
	}
	queryBody.method = 'query';
	queryBody.params.ctorMsg.function = 'readAssetHistory';
	queryBody.params.ctorMsg.args = [ "{\"assetID\":\""+selectedVehicle.assetID+"\"}"];
	
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
		    chunk = chunk.replace("[","");
		    chunk = chunk.replace("]","");		    
		    var json_str = JSON.parse('' + chunk + '');
		    var json_msg = JSON.parse('' + json_str.result.message + '');
		    console.log(JSON.stringify(json_msg,null,2));
	    
		    var totalcount = carprobesampledata.length;
		    
		    var markers = "";
		    for(var i = 0; i < totalcount; i++) {
		    	markers = markers + "&markers="+carprobesampledata[i].latitude+","+carprobesampledata[i].longitude;
		    }
		    console.log(markers);
			res.render('history', {title : 'Home', markers: markers, vehicleHistory : JSON.stringify(json_msg,null,2)});
		  });
		}).end(JSON.stringify(queryBody));
	})

app.get('/', function (req, res) {
		resetSelectedVehicle();
		res.render('index', { title : 'Home', selectedVehicle : selectedVehicle, moment: moment, vehicleList : db_vehicle_list})
	})

app.listen(8080);


