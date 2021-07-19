const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ = require("lodash");

const app = express();

// mongoDB via mongoose ODM
mongoose.connect("mongodb+srv://admin-ali:test123@cluster0.jwren.mongodb.net/todolistDB?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true });

// declare schema
const itemsSchema = mongoose.Schema({
    name: String
});

// declare model Class and model collection
const Item = mongoose.model("item", itemsSchema);

//custom list schema
const listSchema = mongoose.Schema({
    name: String,
    items: [itemsSchema]
});

// custom list model class in mongoDB
const List = mongoose.model("list", listSchema);

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// create document
const pray = new Item({
    name: "Welcome to your todolist!"
});

const reflect = new Item({
    name: "Hit the + to add a new item."
});

const code = new Item({
    name: "<- Check this box to delete an item."
});

const defaultItems = [pray, reflect, code];


app.get("/", function(req, res) {

    // find all items in collection
    Item.find({}, function(err, doc){
        if(doc.length === 0) {
            // insert docs into mondoDB collection
            Item.insertMany(defaultItems, function(err) {
                if (err) {
                console.log(err);
                }
                else {
                console.log("Default list saved to DB.");
                }
            });
        res.redirect("/");
        } else {
            res.render("list", {listTitle: "Today", newListItems: doc});
        }
    });

    // const day = date.getDate(); // exported from date.js
});

// dynamic route using express.js route parameters
app.get("/:customListName", function(req, res) {
    const customList = _.capitalize(req.params.customListName);
    

    List.findOne({name: customList}, function(err, results) {
        if(!err) {
            if(!results) {
                // create new list
                const list = new List({
                    name: customList,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customList);
            
            } else {
                res.render("list", {listTitle: results.name, newListItems: results.items});
            }
        }
    });
});


app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function(err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }
});

app.post("/delete", function(req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today") {
        Item.findByIdAndRemove(checkedItemId, function(err) {
            if(err) {
                console.log(err);
            }
            else {
                console.log("Successfully deleted checked item");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
            if(!err){
                res.redirect("/" + listName);
            }
        });
    }
});

// app.get("/work", function(req, res) {
//     res.render("list", {listTitle: "Work List", newListItems: workItems});
// })

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
    console.log("server has started successfully!");
});
