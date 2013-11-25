var express         = require('express'),
    app             = express(),
    twilio          = require('twilio'),
    Aviary          = require('aviary').Aviary,
    actionLists     = require('./actionlists.json'),
    aviaryClient    = new Aviary(process.env.AVIARY_API_KEY, process.env.AVIARY_API_SECRET);

var config = {
    authToken: process.env.TWILIO_AUTH_TOKEN,
    supportsMMS: false
};

app.use(express.bodyParser());

app.post('/incoming', function(req, res) {

    // Validate Twilio request
    if (twilio.validateExpressRequest(req, config.authToken)) {
        var resp = new twilio.TwimlResponse();
        var imageUrl;

        // Retrieve url from request 
        if (config.supportsMMS && req.body.NumMedia && req.body.NumMedia > 0) {
            imageUrl = req.body["MediaUrl" + 1];
        } else {
            var urls = /(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/.exec(req.body.Body);
            imageUrl = (urls && urls.length) ? urls[0] : null;
        }

        if (imageUrl) {
            var renderConfig = {
                url: imageUrl,
                actionList: JSON.stringify(actionLists.filters.avenue)
            };
            
            // Call the Aviary API to render the image with a filter
            aviaryClient.renderAndWait(renderConfig, function(err, renderedUrl) {
                
                // Generate the appropriate TwiML response
                if (config.supportsMMS) {
                    resp.message(function() {
                        this.body('Oooh pretty!');
                        this.media(renderedUrl);
                    });
                } else {
                    resp.message('Oooh pretty! ' + renderedUrl);
                }

                res.type('text/xml');                
                return res.send(resp.toString());
            });
        } else {
            resp.message('Oops! Try sending an image.');
            
            res.type('text/xml');
            return res.send(resp.toString());
        }
    } else {
        return res.send('Nice try imposter.');
    }
});

var server = app.listen(process.env.PORT);
console.log("Listening on port %d in %s mode", server.address().port, app.settings.env);