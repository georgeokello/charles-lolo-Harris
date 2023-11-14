import morgan from 'morgan';
import express from 'express';
import { config } from 'dotenv';
import passport from 'passport';
import flash from 'connect-flash';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import methodOverride from 'method-override';

import connectDB from './config/db.js';

import authRoutes from './routes/authRouter.js';
import adminRoutes from './routes/adminRoutes.js';
import indexRoutes from './routes/indexRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import { payments } from './controllers/paymentController.js';
import Stripe from 'stripe';

import passportConfig from './config/passport.js';
//import { json } from 'body-parser';

const app = express();
const stripe = new Stripe('sk_test_51IvOHNDtBEIIqonMjzO5wuBdhEtaXNYeis4sO8b5kXe2y5ghutKS5395FeGGDCx5VbnxRO3EpBNwPPYjt6qQEy9S00LoZXeZq3')
const MY_DOMAIN = 'http://127.0.0.1:3000'

/* Configs */
config();
connectDB();
passportConfig(passport);

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
  const items = req.body.items
  console.log(items)
  const priceID = req.body.totalPrice
  console.log(priceID)
  // map elements
  // const productNames = items.map(item =>{
  //   return item.product.name
  // })
  // price customer
  const product = await stripe.products.create({
    name: 'Gold Special',
  });
  console.log(product)

  // stripe price
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: priceID * 100,
    currency: 'usd',
  });
  console.log(price)
  
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {price: price.id, quantity: 1},
      ],
      success_url:`${MY_DOMAIN}/success`,
      cancel_url:`${MY_DOMAIN}/cancel`,
    })
    const url = session.url
    return res.redirect(url)
  }catch(err){
    console.log(err)
  }
});


const PORT = process.env.PORT || 8080;

app.listen(PORT, () =>
  console.log(`App is running in ${process.env.NODE_ENV} on port ${PORT}`)
);
