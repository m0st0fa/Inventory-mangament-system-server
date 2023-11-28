const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5001;

// middleware
app.use(cors())
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.27lli9e.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const shopCollection = client.db("Shop_management").collection("Shop")
        const userCollection = client.db("Shop_management").collection("user")
        const productCollection = client.db("Shop_management").collection('Product');

        app.post('/addProduct', async (req, res) => {
            const newProduct = req.body
            const result = await productCollection.insertOne(newProduct)
            res.send(result)
        });
        app.get('/addProduct', async (req, res) => {
            const result = await productCollection.find().toArray()
            res.send(result)
        })
        app.get('/addProduct/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await productCollection.findOne(query)
            res.send(result)
        })
        app.delete('/addProduct/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await productCollection.deleteOne(query)
            res.send(result)
        })
        app.patch('/addProduct/:id', async (req, res) => {
            const item = req.body
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    name: item.name,
                    quantity: item.quantity,
                    category: item.category,
                    location: item.location,
                    cost: item.cost,
                    margin: item.margin,
                    discount: item.discount,
                    description: item.description,
                    image: item.image
                }
            }
            const result = await productCollection.updateOne(filter, updateDoc)
            res.send(result)
        })
        // user related api 
        app.post('/users', async (req, res) => {
            const user = req.body
            const query = { email: user.email }
            const existingUser = await userCollection.findOne(query)
            if (existingUser) {
                return res.send({ message: 'user already have in the database', insertedId: null })
            } else {
                const result = await userCollection.insertOne(user)
                res.send(result)
            }
        })
        // create shop related api
        app.post('/createShop', async (req, res) => {
            const newProduct = req.body;
            const result = await shopCollection.insertOne(newProduct);
            res.send(result);
        });

        app.get('/createShop', async (req, res) => {
            const result = await shopCollection.find().toArray()
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Inventory management system is Running')
})

app.listen(port, () => {
    console.log(`Inventory system is running port${port}`)
})