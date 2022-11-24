const express = require('express');
require('dotenv').config();
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000 ;



// middleware
app.use(cors());
app.use(express.json());




// function verifyJWT(req, res, next){
//     const authHeader = req.headers.authorization;
//     if(!authHeader){
//         return res.status(401).send({message: 'unauthorized access'});

//     }
//     const token = authHeader.split(' ')[1];
//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
//         if(err){
//             return res.status(401).send({message: 'unauthorized access'});
//         }
//         req.decoded = decoded;
//         next();
//     })
// }



async function run(){
    try{

        const serviceCollection = client.db('dentist').collection('services');
        const reviewCollection = client.db('dentist').collection('reviews');


    }
    finally{

    }
}

run().catch(error => console.log(error))


app.get('/', (req, res) => {
    res.send('Cars Services is Running')
});

app.listen(port, () => {
    console.log('Listing is port', port);
})