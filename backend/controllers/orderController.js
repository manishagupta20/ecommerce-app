//import { currency } from "../../admin/src/App.jsx";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";
import Razorpay from "razorpay";

//global variables
const currency = 'inr'
const deliveryCharge = 10

//GATEWAY INITIALIZE
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

//placing order using cod method

const placeOrder = async (req, res) => {
    try {
        const {userId, items, amount, address} = req.body;

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod: 'COD',
            payment:false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        await userModel.findByIdAndUpdate(userId, {cartData:{}})

        res.json({
            success: true,
            message: "Order placed successfully"
        })
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        })
    }
}

//placing order using Stripe method
const placeOrderStripe = async (req, res) => {
    try {
        const {userId, items, amount, address} = req.body;
        const {origin} = req.headers;

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod: 'Stripe',
            payment:false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const line_items = items.map((item) =>({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.name,
                },
                unit_amount: item.price * 100
            },
            quantity: item.quantity
        }))
            line_items.push({
                price_data: {
                    currency: currency,
                    product_data: {
                        name: "Delivery Charges",
                    },
                    unit_amount: deliveryCharge * 100
                },
                quantity: 1
            })

            const session = await stripe.checkout.sessions.create({
                success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
                cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
                line_items,
                mode: 'payment'
            })

            res.json({
                success: true,
                session_url:session.url,
            })
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        })
    }
}

//verify stripe payment
const verifyStripe = async (req, res) => {
    const {orderId, success, userId} = req.body;

    try {
        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, {payment: true});
            await userModel.findByIdAndUpdate(userId, {cartData:{}})
            res.json({
                success: true,
                message: "Payment successful"
            })
        } else{
            await orderModel.findByIdAndDelete(orderId);
            res.json({
                success: false,
                message: "Payment failed"
            })
        }
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        })
    }
    }

//placing order using razorpay method
// const placeOrderRazorpay = async (req, res) => {
//     try {
//         const {userId, items, amount, address} = req.body;

//         const orderData = {
//             userId,
//             items,
//             address,
//             amount,
//             paymentMethod: 'Razorpay',
//             payment:false,
//             date: Date.now()
//         }

//         const newOrder = new orderModel(orderData)
//         await newOrder.save()

//         const options = {
//             amount: amount * 100,
//             currency: currency.toUpperCase(),
//             receipt : newOrder._id.toString(),
//         }

//         await razorpayInstance.orders.create(options, (error, order) => {
//             if (error) {
//                 console.log(error);
//                 res.json({
//                     success: false,
//                     message: error.message
//                 })
//             }
//             res.json({
//                 success: true,
//                 order
//             })

//         })

//     } catch (error) {
//         console.log(error);
//         res.json({
//             success: false,
//             message: error.message
//         })
//     }
// }

//placing order using razorpay method
const placeOrderRazorpay = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;

        // Prepare order data
        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod: 'Razorpay',
            payment: false,
            date: Date.now(),
        };

        // Create a new order in the database
        const newOrder = new orderModel(orderData);
        await newOrder.save();

        // Prepare Razorpay order creation options
        const options = {
            amount: amount * 100, // Razorpay expects amount in paise
            currency: currency.toUpperCase(),
            receipt: newOrder._id.toString(),
        };

        // Create Razorpay order using async/await
        const razorpayOrder = await razorpayInstance.orders.create(options);

        // Send success response with Razorpay order details
        res.json({
            success: true,
            order: razorpayOrder,
        });

    } catch (error) {
        console.log(error);
        // Send error response
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// all orders data for admin panel
const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({})
        res.json({
            success: true,
            orders
        })
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        })
    }
}

// user orders data for frontend
const userOrders = async (req, res) => {
    try {
        const {userId} = req.body;

        const orders = await orderModel.find({userId})
        res.json({
            success: true,
            orders
        })
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        })
    }
}

//update Order status from admin panel
const updateStatus = async (req, res) => {
    try {
        const {orderId, status} = req.body;

        await orderModel.findByIdAndUpdate(orderId, {status})
        res.json({
            success: true,
            message: "Order status updated successfully"
        })
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: error.message
        })
    }
}

export {
    placeOrder,
    placeOrderStripe,
    placeOrderRazorpay,
    allOrders,
    userOrders,
    updateStatus,
    verifyStripe
};