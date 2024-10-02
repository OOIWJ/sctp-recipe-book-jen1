// 1. SETUP EXPRESS
const express = require('express');
const cors = require("cors");
require('dotenv').config()
const MongoClient = require("mongodb").MongoClient;

const mongoUri = process.env.MONGO_URI;
const dbname = "sctp-recipe-jen"; // CHANGE THIS TO YOUR ACTUAL DATABASE NAME

// 1a. create the app
const app = express();

// !! Enable processing JSON data
app.use(express.json());

// !! Enable CORS
app.use(cors());

async function connect(uri, dbname) {
    let client = await MongoClient.connect(uri, {
        useUnifiedTopology: true
    })
    let db = client.db(dbname);
    return db;
}



// 2. CREATE ROUTES

// SETUP END
async function main() {

    app.get('/', function (req, res) {
        res.json({
            "message": "Hello recipe!"
        });
    });

    // connect to the mongo database
    const db = await connect(mongoUri, dbname);

    // Routes
    app.get("/recipe", async (req, res) => {
        try {
            const recipe = await db.collection("recipe").find().project({
                name: 1,
                cuisine: 1,
                tags: 1,
                prepTime: 1,
            }).toArray();

            res.json({ recipe });
        } catch (error) {
            console.error("Error fetching recipe:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // Step 10| Get details of a recipe (_id)
    const { ObjectId } = require('mongodb');

    app.get("/recipe/:id", async (req, res) => {
        try {
            const id = req.params.id;

            // First, fetch the recipe
            const recipe = await db.collection("recipe").findOne(
                { _id: new ObjectId(id) },
                { projection: { _id: 0 } }
            );

            if (!recipe) {
                return res.status(404).json({ error: "Recipe not found" });
            }




            res.json(recipe);
        } catch (error) {
            console.error("Error fetching recipe:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    });

    // Step 11| Create a search engine
    app.get('/recipe_Step11', async (req, res) => {
        try {
            const { tags, cuisine, ingredients, name } = req.query;
            let query = {};

            if (tags) {
                query['tags.name'] = { $in: tags.split(',') };
            }

            if (cuisine) {
                query['cuisine.name'] = { $regex: cuisine, $options: 'i' };
            }

            if (ingredients) {
                query['ingredients.name'] = { $all: ingredients.split(',').map(i => new RegExp(i, 'i')) };
            }

            if (name) {
                query.name = { $regex: name, $options: 'i' };
            }

            const recipe = await db.collection('recipe').find(query).project({
                name: 1,
                'cuisine.name': 1,
                'tags.name': 1,
                _id: 0
            }).toArray();

            res.json({ recipe });
        } catch (error) {
            console.error('Error searching recipes:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    //Step 2| Add a POST /recipes route
    app.post('/recipe_L4S2', async (req, res) => {
        try {
            const { name, cuisine, prepTime, cookTime, servings, ingredients, instructions, tags } = req.body;

            // Basic validation
            if (!name || !cuisine || !ingredients || !instructions || !tags) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Fetch the cuisine document
            const cuisineDoc = await db.collection('cuisines').findOne({ name: cuisine });
            if (!cuisineDoc) {
                return res.status(400).json({ error: 'Invalid cuisine' });
            }

            // Fetch the tag documents
            const tagDocs = await db.collection('tags').find({ name: { $in: tags } }).toArray();
            if (tagDocs.length !== tags.length) {
                return res.status(400).json({ error: 'One or more invalid tags' });
            }

            // Create the new recipe object
            const newRecipe = {
                name,
                cuisine: {
                    _id: cuisineDoc._id,
                    name: cuisineDoc.name
                },
                prepTime,
                cookTime,
                servings,
                ingredients,
                instructions,
                tags: tagDocs.map(tag => ({
                    _id: tag._id,
                    name: tag.name
                }))
            };

            // Insert the new recipe into the database
            const result = await db.collection('recipe').insertOne(newRecipe);

            // Send back the created recipe
            res.status(201).json({
                message: 'Recipe created successfully',
                recipeId: result.insertedId
            });
        } catch (error) {
            console.error('Error creating recipe:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    //Lab 5| Adding a Update Route
    //Step 1| Add a PUT route for recipes
    app.put('/recipe/:id', async (req, res) => {
        try {
            const recipeId = req.params.id;
            const { name, cuisine, prepTime, cookTime, servings, ingredients, instructions, tags } = req.body;
    
            // Basic validation
            if (!name || !cuisine || !ingredients || !instructions || !tags) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
    
            // Fetch the cuisine document
            const cuisineDoc = await db.collection('cuisines').findOne({ name: cuisine });
            if (!cuisineDoc) {
                return res.status(400).json({ error: 'Invalid cuisine' });
            }
    
            // Fetch the tag documents
            const tagDocs = await db.collection('tags').find({ name: { $in: tags } }).toArray();
            if (tagDocs.length !== tags.length) {
                return res.status(400).json({ error: 'One or more invalid tags' });
            }
    
            // Create the updated recipe object
            const updatedRecipe = {
                name,
                cuisine: {
                    _id: cuisineDoc._id,
                    name: cuisineDoc.name
                },
                prepTime,
                cookTime,
                servings,
                ingredients,
                instructions,
                tags: tagDocs.map(tag => ({
                    _id: tag._id,
                    name: tag.name
                }))
            };
    
            // Update the recipe in the database
            const result = await db.collection('recipe').updateOne(
                { _id: new ObjectId(recipeId) },
                { $set: updatedRecipe }
            );
    
            if (result.matchedCount === 0) {
                return res.status(404).json({ error: 'Recipe not found' });
            }
    
            // Send back the success response
            res.json({
                message: 'Recipe updated successfully'
            });
        } catch (error) {
            console.error('Error updating recipe:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    //Lab 6| Adding a Delete Route
    //Step 1| Add a route to delete recipe
    app.delete('/recipe/:id', async (req, res) => {
        try {
            const recipeId = req.params.id;
    
            // Attempt to delete the recipe
            const result = await db.collection('recipe').deleteOne({ _id: new ObjectId(recipeId) });
    
            if (result.deletedCount === 0) {
                return res.status(404).json({ error: 'Recipe not found' });
            }
    
            res.json({ message: 'Recipe deleted successfully' });
        } catch (error) {
            console.error('Error deleting recipe:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

}

main();

// 3. START SERVER (Don't put any routes after this line)
app.listen(5000, function () {
    console.log("Server has started");
})