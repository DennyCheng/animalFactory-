var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');

var pg = require('pg');
var connectionString = 'postgres://localhost:5432/omicron';


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// Serve back static files
app.use(express.static(path.join(__dirname, './public')));




app.get('/favorites', function(req, res) {
    pg.connect(connectionString, function(err, client, done) {
        if (err) {
            res.sendStatus(500);
        }

        client.query('SELECT * FROM petData', function(err, result) {
            done(); // closes connection, I only have 10!

            if (err) {
                res.sendStatus(500);
            }

            res.send(result.rows);
        });
    });
});

app.post('/favorites', function(req, res) {
    var pet = req.body;
    console.log(req.body);

    pg.connect(connectionString, function(err, client, done) {
        if (err) {
          console.log("ITS HERE");
            res.sendStatus(500);
        }

        client.query('INSERT INTO petData (pet_name, pet_age, pet_description, pet_type, pet_id, pet_img, pet_animal) ' +
            'VALUES ($1, $2, $3, $4, $5, $6, $7)', [pet.pet_name, pet.pet_age, pet.pet_description, pet.pet_type, pet.pet_id, pet.pet_img, pet.pet_animal],
            function(err, result) {
                done();

                if (err) {
                  console.log("error", err);
                  console.log("ITS HERE!@#!@#");
                    res.sendStatus(500);
                } else {
                    res.sendStatus(201);
                }
            });
    });
});



// Handle index file separately
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, './public/views/index.html'));
});

app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), function() {
    console.log('Listening on port: ', app.get('port'));
});
