
import asyncHandler from 'express-async-handler';
import Stripe from 'stripe';


// export const paymentsPage = asyncHandler(async (req, res) => {
//     stripe.CustomersResource.create({
//         email: req.user.email,
//         source: req.body.stripeToken,
//         name: req.body.name,
//         address:{
//             line1:req.body.additional,
//             postal_code: req.body.zipcode,
//             city:req.body.city,
//             state:req.body.street,
//             country:req.body.state,
//         }
//     })
//     .then((customer) =>{
//         return stripe.charges.create({
//             amount: req.body.totalPrice,
//             description: req.body.additional,
//             currency: 'USD',
//             customer: customer.id
//         })
//     })
//     .then((charges) =>{
//         console.log(charges)
//         res.send("Success")
//     })
//     .catch((err)=>{
//         res.send(err)
//     })
    
// });


export const payments = asyncHandler(async(req, res) => {
    const session = await Stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
          price: '7000',
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/success.html`,
      cancel_url: `${YOUR_DOMAIN}/cancel.html`,
    });
  
    res.redirect(303, session.url);
  });