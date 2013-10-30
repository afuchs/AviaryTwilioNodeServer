var express         = require('express'),
    app             = express(),
    actionLists     = require('./actionLists.json'),
    Aviary          = require('aviary').Aviary;
    aviaryClient    = new Aviary(process.env.AVIARY_API_KEY, process.env.AVIARY_API_SECRET);

app.use(express.bodyParser());

app.post('/incoming', function(req, res) {
    var urlPattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
    var urls = urlPattern.exec(req.body.Body);

    if (urls && urls.length > 0) {
        aviaryClient.renderAndWait({
            url: urls[0],
            actionList: JSON.stringify(actionLists.filters.avenue)
        }, function(err, renderedUrl) {            
            res.writeHead(200, {'Content-Type': 'text/xml'});            
            if (err) {
                return res.end(generateTwiml('Oops! Something went wrong.'));
            }             
            return res.end(generateTwiml('Oooh pretty! ' + renderedUrl));
        });
    } else {
        res.writeHead(200, {'Content-Type': 'text/xml'});
        return res.end(generateTwiml('Oops! Try sending an image url.'));
    }
});

	function generateTwiml(message) {
	    return ['<?xml version="1.0" encoding="UTF-8"?>',
	        '<Response>',
	            '<Message>',
	                message,
	            '</Message>',
	        '</Response>'
	        ].join('');
}

var server = app.listen(process.env.PORT);
console.log("Listening on port %d in %s mode", server.address().port, app.settings.env);