const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;



// middleware
app.use(cors());
app.use(express.json());







const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wwiopku.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {

        const categoryCollection = client.db('carsMotor').collection('category');
        const categoryAllCollection = client.db('carsMotor').collection('allCategory');
        const bookingCollection = client.db('carsMotor').collection('bookings');

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

        app.get('/bookings', async(req, res) => {
            const email = req.query.email;
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