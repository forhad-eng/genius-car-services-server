const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded
        next()
    })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.elrc8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 })

async function run() {
    try {
        await client.connect()
        const servicesCollection = client.db('geniusCar').collection('service')
        const orderCollection = client.db('geniusCar').collection('order')

        //AUTH API
        app.post('/login', (req, res) => {
            const user = req.body
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
            res.send(accessToken)
        })

        //Services API

        app.get('/services', async (req, res) => {
            const query = {}
            const cursor = await servicesCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/service/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const service = await servicesCollection.findOne(query)
            res.send(service)
        })

        app.post('/addservice', async (req, res) => {
            const service = req.body
            const result = await servicesCollection.insertOne(service)
            res.send(result)
        })

        app.delete('/manage/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await servicesCollection.deleteOne(query)
            res.send(result)
        })

        app.put('/update/:id', async (req, res) => {
            const id = req.params.id
            const updatedService = req.body
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = { $set: updatedService }
            const result = await servicesCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })

        //order collection api
        app.get('/order', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email
            const email = req.query.email
            if (email === decodedEmail) {
                const cursor = orderCollection.find({ email })
                const result = await cursor.toArray()
                res.send(result)
            } else {
                res.status(403).send({ message: 'Forbidden access' })
            }
        })

        app.post('/order', async (req, res) => {
            const order = req.body
            const result = await orderCollection.insertOne(order)
            res.send(result)
        })
    } finally {
    }
}

run().catch(console.dir)

app.listen(port, () => {
    console.log('listening to port', port)
})
