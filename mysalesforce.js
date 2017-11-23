const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const USERNAME = process.env.USERNAME;
const PASSWORD = process.env.PASSWORD;
const CALLBACK_URL = process.env.CALLBACK_URL;

/**
 * Load nforce-related libraries and support functions
 */

var nforce = require('nforce');
var moment = require('moment');
var pluralize = require('pluralize');

var org = nforce.createConnection({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    redirectUri: CALLBACK_URL,
    mode: 'single'
});

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function simplifyDataStructure(result) {

    let a = [];
    result = result.records;
    for (let i = 0; i < result.length; i++) {
        a.push({
            productName: result[i].get('orderproduct__r').PricebookEntry.Product2.Name,
            qtyOrdered: result[i].get('orderproduct__r').Quantity,
            qtyShipped: result[i].get('quantity__c'),
            truckName: result[i].get('truck__r').Name,
            truckLat: result[i].get('truck__r').latitude__c,
            truckLng: result[i].get('truck__r').Longitude__c
        });
    }
    return a;
    
}

function getDailySummary(ddate){
    ddate = '2016-05-06';
    let pw = PASSWORD+'KtKPCXRDCaMZi9F1aQ808q661';
    console.log('CLIENT_SECRET:: '+CLIENT_SECRET);
    console.log('CLIENT_ID:: '+CLIENT_ID);
    console.log('USERNAME:: '+USERNAME);
    console.log('PASSWORD:: '+pw);
    console.log('DDate:: '+ddate);
    var query1 =''.concat(
        'select ',
        'service__r.service_type__c, ',
        'service__r.Id, ',
        'service__r.Name__c, ',
        'Service__r.Price__c, ',
        'Service__r.Commission__c ',
        'from Client_Service__c ',
        'where Date_Time__c=',
        ddate
    );
    console.log('QUERY:: '+query1);
    return new Promise(function(resolve, reject) {
        org.authenticate({ // authenticate the user

            username: USERNAME,
            password: pw

        }).then(function(){
             return org.query({
                query: query1
            })
        }).then(function(results){
            let a = [];
            let result = results.records;
            for (let i = 0; i < result.length; i++) {
                a.push({
                    sId: result[i].get('service__r').Id,
                    sType: result[i].get('service__r').service_type__c,
                    sName: result[i].get('service__r').Name__c,
                    price: result[i].get('service__r').Price__c,
                    commission: result[i].get('service__r').Commission__c
                });
            }
           let speechOutput ='';
            
            if (a.length==0){
                    speechOutput = 'No service today.';
            }else{
                let amount = 0;
                let b = [], c=[];
                speechOutput = `Welcome to Body Tech Lemery. Kumusta? There are ${result.length} ${pluralize("services",result.length)} so far. `;
                speechOutput+='The services are the following:';
                
                var group_to_values = a.reduce(function (obj, item) {
    obj[item.sId] = obj[item.group] || [];
    obj[item.sId].push(item.sName);
    return obj;
}, {});

var groups = Object.keys(group_to_values).map(function (key) {
    return {sId: key, sName: group_to_values[key]};
});
                console.log('groups:::'+groups);
                for (let i = 0; i < a.length; i++) {
                    let id = a[i].sId;
                    
                    speechOutput += `<p> ${a[i].sName} </p>`;
                   
                    if (i === result.length - 2) speechOutput += ' and ';
                    amount+= parseFloat(a[i].price);
                }
                speechOutput += '<break strength="x-strong"/>Total amount is ';
                speechOutput +=''+amount;
                
                let output = {
                say: speechOutput,
                card: {
                    type: "Simple",
                    title: "Body Tech",
                    content: speechOutput.replace(/<(?:.|\n)*?>/gm, '')
                }
                };
                console.log(output);
                resolve(output);
            }
            
        }).error(function(err) {
            
            console.log('ERROR!!!!!', err);
            reject(null);
        });
    });
    
}
/*
function getOrderStatus(orderId) {

    var query1 = ''.concat(

        'select ',
        'OrderProduct__r.id, ',
        'quantity__c, ',
        'OrderProduct__r.Quantity, ',
        'truck__r.name, ',
        'truck__r.latitude__c, ',
        'truck__r.longitude__c, ',
        'OrderProduct__r.PricebookEntry.Product2.Name ',

        'from TruckOrderProduct__c ',

        'where OrderProduct__r.Order.OrderNumber = \'' + pad(orderId, 8) + '\''
    );

    return new Promise(function(resolve, reject) {

        org.authenticate({ // authenticate the user

            username: USERNAME,
            password: PASSWORD

        }).then(function() { // run the soql query


            return org.query({
                query: query1
            })

        }).then(function(results) { // parse the results and generate a response

            let result = simplifyDataStructure(results);
            let speechOutput = '';

            if (result.length == 0) {
                speechOutput = 'Sorry, but order number ' + orderId + ' does not have items in transit.'
            } else {
                speechOutput = `Order number ${orderId} currently has ${result.length} ${pluralize("box",result.length)} in transit `;
                speechOutput += '<break strength="x-strong"/>These include '
                for (let i = 0; i < result.length; i++) {
                    speechOutput += `<p> ${result[i].qtyShipped} ${pluralize(result[i].productName,result[i].qtyShipped)} on ${result[i].truckName}. </p>`;
                    if (i === result.length - 2) speechOutput += ' and ';
                }
            }

            let output = {
                say: speechOutput,
                card: {
                    type: "Simple",
                    title: "Universal Containers",
                    content: speechOutput.replace(/<(?:.|\n)*?>/gm, '')
                }
            };
            console.log(output);
            resolve(output);

        }).error(function(err) {
            console.log('ERROR!!!!!', err);
            reject(null);
        });
    });
}
*/
//exports.getOrderStatus = getOrderStatus;
exports.getDailySummary = getDailySummary;
