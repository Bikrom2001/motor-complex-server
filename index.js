const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;

const stripe = require("stripe")('sk_test_51M6zH6EeZP6xvSFYBgDwKGwd8hRiaumMFzjLYCV2ytPPt3zkGqxYx9rJnlvVjRFNS1uE9CsXqJW5ck7frjiqQNSJ00j5WTguRt');



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
        const productsCollection = client.db('carsMotor').collection('products');
        const advertisedCollection = client.db('carsMotor').collection('advertised');
        const paymentsCollection = client.db('carsMotor').collection('payments');

        app.get('/category', async (req, res) => {
            const query = {};
            const cursor = categoryCollection.find(query);
            const category = await cursor.toArray();
            res.send(category);
        });

        app.get('/allcategory/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: id };
            const category = await categoryAllCollection.find(query).toArray();
            res.send(category);
        });

        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            const query = { loginEmail: email };
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings);
        });


        app.get('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const booking = await bookingCollection.findOne(query);
            res.send(booking);
        })


        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const query = {
                bookingName: booking.bookingName,
                price: booking.price,
            }
            const alreadyBooked = await bookingCollection.find(query).toArray();

            if (alreadyBooked.length) {
                const message = `You already have a booking on ${booking.appointmentDate}`;
                return res.send({ acknowledged: false, message });
            }
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        });


        app.post('/create-payment-intent', async(req, res) => {
            const booking = req.body;
            const price = booking.price;
           if(price){
            const amount = price * 100;

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
           }
        })


        app.post('/payments', async(req, res) => {
            const payment = req.body;
            const result = await paymentsCollection.insertOne(payment);
            const id = payment.bookingId;
            const filter = {_id: ObjectId(id)};
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }

            const updateResult = await bookingCollection.updateOne(filter, updatedDoc);
            
            res.send(result);
        })







        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '10d' });
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' });
        });


        app.get('/users', async (req, res) => {
            const query = {};
            const users = await usersCollection.find(query).toArray();
            res.send(users);
        });

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' });
        });


        app.put('/users/admin/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })


        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        app.delete('/users/admin/:id',  async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(query)
            res.send(result);
        });

        app.post('/product', verifyJWT, async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            res.send(result);

        })

        app.post('/advertised', verifyJWT, async (req, res) => {
            const advertised = req.body;
            const result = await advertisedCollection.insertOne(advertised);
            res.send(result)

        });

        app.get('/advertised', verifyJWT, async (req, res) => {
            const query = {};
            const result = await advertisedCollection.find(query).toArray();
            res.send(result);
        });


        // app.get('/product', verifyJWT, async(req, res) => {
        //     const query = {};
        //     const product = await productsCollection.find(query).toArray();
        //     res.send(product);
        // })

        app.get('/product', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            const query = { email: email };
            const product = await productsCollection.find(query).toArray();
            res.send(product);
        });

        app.delete('/product/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(filter);
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