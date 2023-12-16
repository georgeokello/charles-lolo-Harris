import morgan from 'morgan';
import express from 'express';
import { config } from 'dotenv';
import passport from 'passport';
import flash from 'connect-flash';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import methodOverride from 'method-override';

import Product from './models/productModel.js';
import Cart from './models/cartModel.js';

import connectDB from './config/db.js';

import authRoutes from './routes/authRouter.js';
import adminRoutes from './routes/adminRoutes.js';
import indexRoutes from './routes/indexRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import { payments } from './controllers/paymentController.js';
import Stripe from 'stripe';

import { check, validationResult }  from 'express-validator';

import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import fs from 'fs';
import credentials from './credentials.json' assert { type: 'json' };
import readline from 'readline'

import passportConfig from './config/passport.js';
//import { json } from 'body-parser';


const app = express();
const MY_DOMAIN = 'https://charlesharrisboxing.com'


/* Configs */
config();
connectDB();
passportConfig(passport);

/* stripe api key */
const sk = process.env.SECRET_KEY
const stripe = new Stripe(sk)

/* View Engine */
app.set('view engine', 'ejs');

/* Middleware */
app.use(flash());
app.use(morgan('dev'));

/* Bodyparser */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* Static Routes */
app.use(express.static('public'));

/* Method Override */
app.use(methodOverride('_method'));

/* Express Session */
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl:
        process.env.NODE_ENV === 'production'
          ? process.env.MONGO_URI_PRODUCTION
          : process.env.MONGO_URI_DEVELOPMENT,
    }),
  })
);
app.use(passport.authenticate('session'));

/* Routes */
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/products', productRoutes);
app.use('/cart', cartRoutes);
app.use('/orders', orderRoutes);
//app.use('/payments', payments)



app.post('/payments', async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id })
  const items = cart.products

  const q = []
  const p =[]

  // Iterate through each order and access the product name
 for (const order of items) {
    p.push(await Product.findById(order.product))
    q.push(order.quantity)
  }

 // Use map to add quantity to each product
 const productsWithQuantity = p.map((product, index) => ({
  ...product,
  quantity: q[index]
 }))

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: productsWithQuantity.map(item => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item._doc.name,
          },
          unit_amount:  item._doc.price.toFixed(2) * 100,
        },
        quantity: item.quantity
      })),
      success_url:`${MY_DOMAIN}/success`,
      cancel_url:`${MY_DOMAIN}/cancel`,

     })
    console.log(session)

    // Add the Stripe header to the request
    const headers = {
      'x-stripe-routing-context-priority-tier': 'livemode-critical',
    };

    const url = session.url
    console.log(url)
    /* return res.redirect(url) */
    // Redirect with the Stripe header in the request
    return res.redirect({
      url,
      headers,
    });
  }catch(err){
    console.log(err)
  }
});



app.post('/sendEmail', 
	[
		check('name').notEmpty().withMessage('Name is required'),
		check('email').isEmail().withMessage('Invalid Email Address'),
		check('subject').notEmpty().withMessage('Subject is required'),
		check('message').notEmpty().withMessage('Message is required')
	], (request, response) => {

		const errors = validationResult(request);

		if(!errors.isEmpty())
		{
			response.render('contact', { errors : errors.mapped() });
		}
		else
		{

			const mail_option = {
				from : request.body.email,
				to : 'georgeokello335@gmail.com',
				subject : request.body.subject,
				text : request.body.message
			};

			transporter.sendMail(mail_option, (error, info) => {
				if(error)
				{
					console.log(error);
				}
				else
				{
					response.redirect('/successEmail');
				}
			});
		}
});

app.get('/successEmail', (request, response) => {

	response.send('<h1>Your Message was Successfully Send!</h1>');

});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`App is running in ${process.env.NODE_ENV} on port ${PORT}`)
);
