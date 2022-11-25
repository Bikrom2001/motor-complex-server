const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;



// middleware
app.use(cors());
app.use(express.json());







const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wwiopku.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })

}




async function run() {
    try {

        const categoryCollection = client.db('carsMotor').collection('category');
        const categoryAllCollection = client.db('carsMotor').collection('allCategory');
        const bookingCollection = client.db('carsMotor').collection('bookings');
        const usersCollection = client.db('carsMotor').collection('users');

        app.get('/category', async (req, res) => {
            const query = {};
            const cursor = categoryCollection.find(query);
            const category = await cursor.toArray();
            res.send(category);
        });

        app.get('/allcategory/:id', async (req, res) => {
            const id = req.params.id;
            const query = {category_id: id};
            const category = await categoryAllCollection.find(query).toArray();
            res.send(category);
        });

        app.get('/bookings', verifyJWT, async(req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            const query = {loginEmail: email};
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings);
        });


        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const query = {
                bookingName: booking.bookingName,
                price: booking.price,
            }
            const alreadyBooked = await bookingCollection.find(query).toArray();

            if(alreadyBooked.length){
                const message = `You already have a booking on ${booking.appointmentDate}`;
                return res.send({acknowledged: false, message});
            }
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        });


        app.get('/jwt', async(req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const user = await usersCollection.findOne(query);
            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '10d'});
                return res.send({accessToken: token});
            }
            res.status(403).send({accessToken: ''});
        });


        app.post('/users', async(req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })
        
        


    }
    finally {

    }
}

run().catch(error => console.log(error))


app.get('/', (req, res) => {
    res.send('Cars Services is Running')
});

app.listen(port, () => {
    console.log('Listing is port', port);
})