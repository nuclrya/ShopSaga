const Product = require('../models/product');
const User = require('../models/user');


exports.getProductPage = (req, res) => {
    
    var colleges=[];
    Product.find().distinct('college', function(error, col) {
        colleges = col
    });

    if(req.query.product) {
        const rgx = new RegExp(escapeRegex(req.query.product), 'gi');
        let category = new RegExp('[A-Za-z]*');
        let college = new RegExp('[A-Za-z]*');
        if(req.query.category) {
            category = req.query.category;
        }
        if(req.query.college) {
            college = req.query.college;
        }

        Product.find({
                $or: [
                    {name: rgx },
                    {description: rgx},
                    {category: rgx}
                ]
            , 'category': { $regex:  category } , 'college': { $regex:  college } }, function(err, allProducts){
            if(err || !allProducts.length)
                return err;     //flash
            res.render("home", {
                prods: allProducts.reverse(),
                pageHeader: 'Search result for: '+req.query.product,
                pageTitle: req.query.product,
                colleges: colleges,
                isLoggedIn: req.session.isLoggedIn
            });
        }).catch(err => {
            console.log(err);
        })
    }
    else if(req.query.category) {
        const category = req.query.category;
        Product.find({'category': category})
            .then(product => {
                res.render('home', {
                    prods: product.reverse(),
                    pageHeader: 'Category: '+category,
                    colleges: colleges,
                    pageTitle: category,
                    isLoggedIn: req.session.isLoggedIn
                });
            })
            .catch(err => console.log(err));
    }
    else if(req.query.college) {
        const college = req.query.college;
        
        Product.find({'college': college})
            .then(product => {
                res.render('home', {
                    prods: product.reverse(),
                    pageHeader: 'College: ' + college,
                    colleges: colleges,
                    pageTitle: college,
                    isLoggedIn: req.session.isLoggedIn
                });
            })
            .catch(err => console.log(err));
    }
    else{
        Product.find()
            .then(products => {
                res.render('home', {
                    prods: products.reverse(),
                    colleges: colleges,
                    pageHeader: 'Recently Uploaded',
                    pageTitle: 'ShopSaga',
                    isLoggedIn: req.session.isLoggedIn
                })
            })
            .catch(err => {
                console.log(err);
            });
    }
}

exports.getAddProduct = (req, res) => {
    res.render('add-product', {
        pageTitle:'Post Add',
        isLoggedIn: req.session.isLoggedIn
    });
}

exports.postAddProduct = (req, res) => {
    cloudinary.uploader.upload(req.file.path, function(result) {
        const name = req.body.name;
        const price = req.body.price;
        const description = req.body.description;
        const category = req.body.category;
        const condition = req.body.condition;
        const image_url = result.secure_url;
        const date_posted = new Date();
        const product = new Product({
            name: name,
            price: price,
            description: description,
            userId: req.user._id,
            college: req.user.college,
            condition: condition,
            category: category,
            image_url: image_url,
            date_posted: date_posted
        });     
        product.save()
            .then(result => {
                User.update({ _id: req.user._id},
                    { "$push": { "products": result._id }}
                ).exec(function(err, pro) {
                    if(err) throw err;
                }); 
                res.redirect('/');
            })
            .catch(err => {
                console.log(err);
            });
        });
}

exports.getProduct = (req, res) => {
    const prodID = req.params.productId;
    Product.findById(prodID)
        .populate('userId')
        .then(product => {
            res.render('product', {
                product: product,
                pageTitle: product.title,
                isLoggedIn: req.session.isLoggedIn
            });
        })
        .catch(err => console.log(err));
};

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};  
var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'nuclrya', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});