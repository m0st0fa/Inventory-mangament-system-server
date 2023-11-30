const express = require('express');
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const app = express()
const port = process.env.PORT || 5001;

// // middleware
// app.use(cors())
// app.use(express.json());
// middleware
app.use(cors({
    origin: 'https://final-assigment-c6eeb.web.app',
}));
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


        const shopCollection = client.db("Shop_management").collection("Shop")
        const userCollection = client.db("Shop_management").collection("user")
        const productCollection = client.db("Shop_management").collection('Product');
        const cardCollection = client.db("OrderProduct").collection("card")
        const menuCollection = client.db("Shop_management").collection("Menu_collection")
        const paymentCollection = client.db("payment_cart").collection("cart")




        // Jwt Api
        app.post('/jwt', async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '4h' })
            res.send({ token })
        })
        // MiddleWare 
        const VerifyToken = (req, res, next) => {

            if (!req.headers.authorization) {
                return res.status(401).send({ message: "unauthorized access" })
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'forbidden access' })
                }
                req.decoded = decoded
                next();
            })
        }

        //  use verify admin after verify token 
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            next();
        }

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
        app.get('/users', VerifyToken, verifyAdmin, async (req, res) => {
            const result = await userCollection.find().toArray()
            res.send(result)
        })
        app.get('/users/admin/:email', VerifyToken, async (req, res) => {
            const email = req.params.email;

            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }

            const query = { email: email };
            const user = await userCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin';
            }
            res.send({ admin });
        })

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
        // make admin 
        app.patch('/users/admin/:id', VerifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc)
            res.send(result)
        })
        app.delete('/users/:id', VerifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await userCollection.deleteOne(query)
            res.send(result)
        })

        // Product Related Api is Here 
        app.get('/menu', async (req, res) => {
            const result = await menuCollection.find().toArray();
            res.send(result)
        })
        app.post('/menu', async (req, res) => {
            const item = req.body
            const result = await menuCollection.insertOne(item)
            res.send(result)
        })
        app.delete('/menu/:id', VerifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            // console.log('Deleting menu item with ID:', id);
            const query = { _id: new ObjectId(id) };
            const result = await menuCollection.deleteOne(query);
            // console.log('Delete result:', result);
            res.send(result);
        });
        app.get('/menu/:_id', async (req, res) => {
            const _id = req.params._id
            const query = { id: new ObjectId(_id) }
            const result = await menuCollection.findOne(query)
            res.send(result)
        })
        // -----------------------------------------------------------


        // carts collections 
        app.get('/carts', async (req, res) => {
            const result = await cardCollection.find().toArray()
            res.send(result)
        })
        app.post('/carts', async (req, res) => {
            const cartItem = req.body
            const result = await cardCollection.insertOne(cartItem)
            res.send(result)
        })
        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) };
            const result = await cardCollection.deleteOne(query)
            res.send(result)
        })
        // ----------payment----------------
        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body
            const amount = parseInt(price * 100);
            // console.log('amount inside the intend ', amount)
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ["card"],
            });
            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })
        app.get('/payments', VerifyToken, async (req, res) => {
            const query = { email: req.params.email }
            if (req.params.email == !req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const result = await paymentCollection.find(query).toArray()
            res.send(result)
        })
        app.post('/payments', async (req, res) => {
            const payment = req.body
            const paymentResult = await paymentCollection.insertOne(payment)
            // console.log('payment info', payment)

            // Delete Each Item from the cart 
            const query = {
                _id: {
                    $in: payment.cartIds.map(id => new ObjectId(id))
                }
            }
            const deleteResult = await cardCollection.deleteMany(query)
            res.send({ paymentResult, deleteResult })
        })






        // create shop related api is here 
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
    } catch (err) {
        console.log(err)
    }
    finally {

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('inventory management system is Running')
})

app.listen(port, () => {
    console.log(`inventory system is running port${port}`)
})