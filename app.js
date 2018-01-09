/*
 * Module dependencies
 */
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

var IBMIoTF = require('ibmiotf');
var appClientConfig = {};
var appClient;
var selected_device ={
        d_type : '',
        d_id : '',
        d_info : '',
        d_metadata : '',
        d_status : '',
        d_extensions : '',
        d_location : ''
} 
var selected_org = {
		  org: '',
		  id: '',
		  auth_key: '',
		  auth_token: '',
		  device_types: [],
		  devices: [],
		  all_device_types : [],
		  selected_device_type: [],
		  selected_devices: []
}

app.get('/', function (req, res) {
		res.render('login', { title : 'Login'})
})

app.post('/logout-submit', function (req, res) {
		res.render('login', { title : 'Login'})
})
	
app.post('/login-submit', function(req1, res1) {
	
	if (req1.body.login_btn == 'demo') {
		appClientConfig = {
				  org: '3tud1d',
				  id: '4213',
				  "auth-key": 'a-3tud1d-twejcfwxox',
				  "auth-token": 'SM(?i)Pw+8XsfRALIi'
				};
	} else {
		appClientConfig = {
				  org: req1.body.input_org,
				  id: req1.body.input_id,
				  "auth-key": req1.body.input_key,
				  "auth-token": req1.body.input_token
				};
	}

	console.log('appClientConfig - ' + JSON.stringify(appClientConfig));	
	appClient = new IBMIoTF.IotfApplication(appClientConfig);	
	
	appClient.getOrganizationDetails().then (function onSuccess (response) {
        selected_org.org = appClientConfig.org;
        selected_org.id = appClientConfig.id;
        selected_org.auth_key = req1.body.input_key;
        selected_org.auth_token = req1.body.input_token;
        selected_org.all_device_types = [];
        appClient.getAllDeviceTypes().then (function onSuccess (response2) {
	            selected_org.device_types = response2.results;
            	selected_org.selected_devices = [];
            	var l = 0;
	         	for (var i = 0; i < selected_org.device_types.length; i++) {
	         	selected_org.all_device_types.push(selected_org.device_types[i].id);
              	appClient.listAllDevicesOfType(selected_org.device_types[i].id).then (function onSuccess (response3) {
		                    console.log("Success");
		                    selected_org.selected_devices.push.apply(selected_org.selected_devices, response3.results);
		                    l++;
		                    if(l==selected_org.device_types.length) {
			                    console.log(selected_org.selected_devices);
		        	         	res1.render('main', { title : 'Login', appConfig : appClientConfig, selected_org : selected_org});
		                    }
		            }, function onError (error) {
		
		                    console.log("Fail");
		                    console.log(error);
		            });
  	         	}
            	
		    }, function onError (error) {
		            console.log("Fail");
		            console.log(error);
		            res1.render('login', { title : 'Login', failed : 'true', error: 'Couldnt fetch device types. Please try again...'})
		    });
	}, function onError (error) {
        console.log("Fail");
        console.log(error);
        res1.render('login', { title : 'Login', failed : 'true', error: 'Invalid login. Please try again...'})
	});
})

app.post('/refresh-org', function(req1, res1) {
	appClient.getOrganizationDetails().then (function onSuccess (response) {
        selected_org.org = appClientConfig.org;
        selected_org.id = appClientConfig.id;
        selected_org.auth_key = req1.body.input_key;
        selected_org.auth_token = req1.body.input_token;
        selected_org.all_device_types = [];
        appClient.getAllDeviceTypes().then (function onSuccess (response2) {
	            selected_org.device_types = response2.results;
            	selected_org.selected_devices = [];
            	var l = 0;
	         	for (var i = 0; i < selected_org.device_types.length; i++) {
	         	selected_org.all_device_types.push(selected_org.device_types[i].id);
              	appClient.listAllDevicesOfType(selected_org.device_types[i].id).then (function onSuccess (response3) {
		                    console.log("Success");

		                    selected_org.selected_devices.push.apply(selected_org.selected_devices, response3.results);
		                    l++;
		                    if(l==selected_org.device_types.length) {
			                    console.log(selected_org.selected_devices);
		        	         	res1.render('main', { title : 'Login', appConfig : appClientConfig, selected_org : selected_org});
		                    }
		            }, function onError (error) {
		
		                    console.log("Fail");
		                    console.log(error);
		            });
  	         	}
            	
		    }, function onError (error) {
		            console.log("Fail");
		            console.log(error);
		            res1.render('login', { title : 'Login', failed : 'true', error: 'Couldnt fetch device types. Please try again...'})
		    });
	}, function onError (error) {
        console.log("Fail");
        console.log(error);
        res1.render('login', { title : 'Login', failed : 'true', error: 'Invalid login. Please try again...'})
	});
	
	
})

app.post('/type-submit', function(req1, res1) {
	
	if (req1.body.type_select == 'select_delete')
	{
		console.log('redirect coming from  - ' + req1.body.type_select)
		res1.redirect(307,'type-delete');
	} else {
		console.log('req1.body.device_types - ' + req1.body.device_types);
		
		selected_org.selected_device_type = [];
		selected_org.selected_devices = [];
		if(req1.body.device_types == 'All' || req1.body.device_types == '' || typeof req1.body.device_types == 'undefined' || req1.body.device_types == 'null')
			selected_org.selected_device_type = selected_org.all_device_types;
		else
			selected_org.selected_device_type.push(req1.body.device_types);
		console.log(selected_org.selected_device_type);
		var l = 0;
	 	for (var i = 0; i < selected_org.selected_device_type.length; i++) {
	  	appClient.listAllDevicesOfType(selected_org.selected_device_type[i]).then (function onSuccess (response3) {
	                console.log("Success");
	                selected_org.selected_devices.push.apply(selected_org.selected_devices, response3.results);
	                l++;
	                if(l==selected_org.selected_device_type.length) {
	                    console.log(selected_org.selected_devices);
	    	         	res1.render('main', { title : 'Login', appConfig : appClientConfig, selected_org : selected_org});
	                }
	        }, function onError (error) {
	
	                console.log("Fail");
	                console.log(error);
	        });
	 	}
	}
})

app.post('/device-go', function (req6, res6) {
	
	console.log("Submit action - " + req6.body.device_go);
	console.log("Submit action - " + req6.body.device_radio);
	res6.render('device_add', { title : 'Add Device', appConfig : appClientConfig, selected_org : selected_org});
})

app.post('/device-add', function (req6, res6) {
	res6.render('device_add', { title : 'Add Device', appConfig : appClientConfig, selected_org : selected_org});
})

app.post('/type-add', function (req6, res6) {
	res6.render('type_add', { title : 'Add Device type', appConfig : appClientConfig, selected_org : selected_org});
})

app.post('/device-delete', function (req6, res6) {
	var arrayd = req6.body.device_radio.split(",");
	console.log("Selected type1 - " + arrayd[0]);
	console.log("Selected type2 - " + arrayd[1]);
	
	appClient.unregisterDevice(arrayd[0],arrayd[1]).then (function onSuccess (response) {
        console.log("Success");
        console.log(response);
        req6.body.device_types = 'All';
        req6.body.type_select == '';
        res6.redirect(307,'/type-submit');
	}, function onError (error) {
	
	        console.log("Fail");
	        console.log(error);
	});
})


app.post('/device-edit', function (req6, res6) {
	var arrayd = req6.body.device_radio.split(",");
	console.log("Selected type1 - " + arrayd[0]);
	console.log("Selected type2 - " + arrayd[1]);
	
	appClient.getDevice(arrayd[0], arrayd[1]).then (function onSuccess (response) {
        console.log("Success");
        console.log(response);
        selected_device.d_type = arrayd[0];
        selected_device.d_id = arrayd[1];
        selected_device.d_info = JSON.stringify(response.deviceInfo);
        selected_device.d_metadata = JSON.stringify(response.metadata);
        selected_device.d_status = JSON.stringify(response.status);
        selected_device.d_extensions = JSON.stringify(response.extensions);
        console.log(selected_device);
        res6.render('device_edit', { title : 'Edit Device', appConfig : appClientConfig, dev : selected_device});
	}, function onError (error) {
	        console.log("Fail");
	        console.log(error);
	});
})

app.post('/type-delete', function (req8, res8) {
	var typetodelete = req8.body.device_types;
	console.log("Selected type to delete - " + typetodelete);
	appClient.deleteDeviceType(typetodelete).then (function onSuccess (response9) {
        console.log("Success");
        res8.redirect(307,'/refresh-org');
	}, function onError (error) {
	    console.log("Fail");
        res8.redirect(307,'/refresh-org');
	});
})

app.post('/device-man', function (req6, res6) {
	var arrayd = req6.body.device_radio.split(",");
	console.log("Selected type1 - " + arrayd[0]);
	console.log("Selected type2 - " + arrayd[1]);
	
	appClient.getDevice(arrayd[0],arrayd[1]).then (function onSuccess (response) {
        console.log("Success");
        req6.body.device_types = 'All';
        var dev = JSON.stringify(response, null, 2);
        console.log(dev);
        res6.render('manage', { title : 'Manage Device', appConfig : appClientConfig, selected_dev : dev, dev_id : arrayd[1], dev_type : arrayd[0]});
	}, function onError (error) {
	
	        console.log("Fail");
	        console.log(error);
	});
})

app.post('/device-manage', function (req1, res1) {
	console.log('Selected device 1- '+ req1.body.device_radio);
	console.log('Action - ' + req1.body.dev_man);
	if (req1.body.dev_man == 'add_device')
		res1.redirect(307,'device-add');
	else if (req1.body.dev_man == 'add_device_type')
		res1.redirect(307,'type-add');
	else if (req1.body.dev_man == 'delete_device')
		res1.redirect(307,'device-delete');
	else if (req1.body.dev_man == 'manage_device')
		res1.redirect(307,'device-man');
	else if (req1.body.dev_man == 'edit_device')
		res1.redirect(307,'device-edit');
})

app.post('/fwDownload', function (req6, res6) {
	var id = req6.body.dev_id;
	var type = req6.body.dev_type;
	appClient.getDevice(type,id).then (function onSuccess (response) {
        console.log("Success");
        var dev = JSON.stringify(response, null, 2);
        console.log(dev);
        res6.render('fw_download', { title : 'Firmware Download', appConfig : appClientConfig, selected_dev : dev, dev_id : id, dev_type : type});
	}, function onError (error) {
	
	        console.log("Fail");
	        console.log(error);
	});
})

app.post('/fwdownload-go', function (req1, res1) {
	console.log('Action - ' + req1.body.dev_man1);
	var id = req1.body.dev_id;
	var type = req1.body.dev_type;
	console.log("Selected id - " + id);
	console.log("Selected type - " + type);
	var action = action = "firmware/download";
	var parameters = [{"name": "version","value": req1.body.fw_version},
	    				{"name": "name","value": req1.body.fw_name},
	    				{"name": "verifier","value": req1.body.fw_verifier},
	    				{"name": "uri","value": req1.body.fw_uri}];	
    var devices = [{ "typeId": type, "deviceId": id }];
   
    appClient.initiateDeviceManagementRequest(action, parameters, devices).then (function onSuccess (response) {
        console.log("Success");
        console.log(response);
	}, function onError (error) {
	
	        console.log("Fail");
	        console.log(error);
	});
})

app.post('/device-manage1', function (req1, res1) {
	console.log('Action - ' + req1.body.dev_man1);
	var id = req1.body.dev_id;
	var type = req1.body.dev_type;
	var dev_details = req1.body.selected_dev;
	console.log("Selected id - " + id);
	console.log("Selected type - " + type);
	var action = '';
	var parameters = [];	
    var devices = [{ "typeId": type, "deviceId": id }];
	if (req1.body.dev_man1 == 'reboot')
		action = "device/reboot";
	else if (req1.body.dev_man1 == 'fwDownload')
		res1.redirect(307,'/fwDownload');
	else if (req1.body.dev_man1 == 'fwUpgrade')
		action = "firmware/update";
	else if (req1.body.dev_man1 == 'facReset')
		action = "device/factoryReset";
    
	appClient.initiateDeviceManagementRequest(action, parameters, devices).then (function onSuccess (response) {
        console.log("Success");
        console.log(response);
        res1.render('manage_resp', { title : 'Manage Device', appConfig : appClientConfig, selected_dev : dev_details, dev_id : id, dev_type : type, req_id : response.reqId, resp_msg : response.message});
	}, function onError (error) {
	
	        console.log("Fail");
	        console.log(error);
	        res1.render('manage_resp', { title : 'Manage Device', appConfig : appClientConfig, selected_dev : dev_details, dev_id : id, dev_type : type, req_id : 'NA', resp_msg : error.data.message});
	});
})

app.post('/device-add-go', function (req6, res6) {
	var type = req6.body.type_select;
	console.log("Type - " + type);
	var deviceId = req6.body.device_id;
	console.log("Device Id - " + deviceId);	
	var authToken = req6.body.auth_token;
	console.log("Auth Token - " + authToken);		
	var metadata = {"customField1": req6.body.custom_field1, "customField2": req6.body.custom_field2};
	console.log("Metadata - " + metadata);
	var deviceInfo = {"serialNumber": req6.body.serial_number, "manufacturer": req6.body.manufacturer, "model": req6.body.model, "deviceClass": req6.body.device_class, "descriptiveLocation" : req6.body.descriptive_location, "fwVersion" : req6.body.firmware_version, "hwVersion" : req6.body.hardware_version};
	console.log("Device Info - " + deviceInfo);
	var location = {"longitude" : req6.body.longitude, "latitude" : req6.body.latitude, "elevation" : req6.body.elevation, "accuracy" : req6.body.accuracy, "measuredDateTime" : req6.body.measured_datetime};
	console.log("Location - " + location);
    appClient.registerDevice(type, deviceId, authToken, deviceInfo, location, metadata).then (function onSuccess (response) {
            console.log("Success");
            console.log(response);
            res6.redirect(307,'/type-submit');
    }, function onError (error) {
            console.log("Fail");
            console.log(error);
            res6.render('device_add', { title : 'Add Device', appConfig : appClientConfig, selected_org : selected_org, failed : 'true', error: error});
    });
})

app.post('/device-edit-go', function (req6, res6) {
	var type = req6.body.sdev_type;
	console.log("Type - " + type);
	var deviceId = req6.body.sdev_id;
	console.log("Device Id - " + deviceId);	
	var metadata = req6.body.sdev_metadata;
	console.log("Metadata - " + metadata);
	var deviceInfo = req6.body.sdev_deviceInfo;
	console.log("Device Info - " + deviceInfo);
	var status = req6.body.sdev_status;
	console.log("Status - " + status);
    var extensions = '';
	appClient.getDevice(type, deviceId).then (function onSuccess (response) {
        appClient.updateDevice(type, deviceId, response.deviceInfo, '', response.metadata, extensions).then (function onSuccess (response1) {
	            console.log("Success");
	            console.log(response1);
	            res6.redirect(307,'/type-submit');
		    }, function onError (error1) {
		            console.log("Fail");
		            console.log(error1);
		            res6.render('device_edit', { title : 'Edit Device', appConfig : appClientConfig, dev : selected_device, failed : 'true', error: error1});
		    });
      	}, function onError (error) {
	        console.log("Fail");
	        console.log(error);
	});
})

app.post('/type-add-go', function (req6, res6) {
	
    var type = req6.body.type_name;
    var desc = req6.body.type_desc;
    var metadata = {"customField1": req6.body.custom_field1, "customField2": req6.body.custom_field2, "customField3": req6.body.custom_field3, "customField4": req6.body.custom_field4};
    var deviceInfo = {};

    appClient.
    registerDeviceType(type,desc,deviceInfo,metadata).then (function onSuccess (argument) {
            console.log("Success");
            res6.redirect(307,'/refresh-org');
    }, function onError (argument) {

            console.log("Fail");
            console.log(argument);
    });
	
})


app.get('/type-search', function (req3, res3) {
		console("device type selected");
})

app.listen(8080);


